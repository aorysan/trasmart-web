#include <HTTPClient.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ESP32Servo.h>
#include <LiquidCrystal_I2C.h>
#include "secrets.h"

// MQTT Broker (bukan secret)
const char* mqtt_server = "broker.hivemq.com";

// --- DEFINISI PIN ---
#define PIN_TRIG 5
#define PIN_ECHO 18
#define PIN_PROX 19
#define PIN_SERVO 13

// --- INISIALISASI OBJEK ---
Servo myServo;
LiquidCrystal_I2C lcd(0x27, 16, 2);
WiFiClient espClient;
PubSubClient client(espClient);

// --- VARIABEL ---
long duration;
int distance;
bool sessionValidated = false;
String currentSessionId = "";
String currentSessionCode = "";

// Fungsi Supabase dan session code
String getCurrentSessionCode();
bool waitForSessionCodeInputAndPoll(const String& expectedCode, String sessionId);
void refreshSessionExpiry();
void kirimKeSupabase(String jenis, int poin);
bool checkSessionPaired(String sessionId);

void setup_wifi() {
  delay(10);
  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  lcd.clear();
  lcd.print("WiFi Connected!");
}

void reconnect() {
  while (!client.connected()) {
    if (client.connect("ESP32_Vending_Trash")) {
      client.publish("vending/status", "Online");
    } else {
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_PROX, INPUT_PULLUP);

  myServo.attach(PIN_SERVO);
  myServo.write(90); 
  
  lcd.init();
  lcd.backlight();
  setup_wifi();
  client.setServer(mqtt_server, 1883);

  // Validasi session code sebelum masuk ke standby
  while (!sessionValidated) {
    currentSessionCode = getCurrentSessionCode();
    
    if (currentSessionCode.length() == 0) {
      lcd.clear();
      lcd.print("Fetch Code...");
      lcd.setCursor(0, 1);
      lcd.print("Retry in 5s");
      delay(5000);
      continue;
    }

    // Poll untuk user input & status changes (dengan display kode terus-menerus)
    sessionValidated = waitForSessionCodeInputAndPoll(currentSessionCode, currentSessionId);
    
    if (!sessionValidated) {
      lcd.clear();
      lcd.print("Kode salah!");
      delay(2000);
    }
  }

  lcd.clear();
  lcd.print("Paired!");
  delay(1000);
}

void loop() {
  if (!sessionValidated) {
    // Menunggu validasi sesi agar tidak mendeteksi sampah sebelum kode benar
    delay(500);
    return;
  }

  if (!client.connected()) reconnect();
  client.loop();

  // 1. Baca Jarak (Sensor Ultrasonik)
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  duration = pulseIn(PIN_ECHO, HIGH);
  distance = duration * 0.034 / 2;

  lcd.setCursor(0, 0);
  lcd.print("Standby...      ");

  // 2. Jika ada sampah terdeteksi masuk
  if (distance > 0 && distance < 10) {
    lcd.clear();
    lcd.print("Benda Masuk!");
    
    unsigned long startTime = millis();
    bool logamDitemukan = false;

    // 3. Menunggu deteksi logam selama 20 detik
    while (millis() - startTime < 10000) { 
      int sisaWaktu = 10 - ((millis() - startTime) / 1000);
      
      lcd.setCursor(0, 1);
      lcd.print("Cek Logam: ");
      lcd.print(sisaWaktu);
      lcd.print("s ");

      if (digitalRead(PIN_PROX) == LOW) {
        logamDitemukan = true;
        break; // Keluar loop jika logam terdeteksi sebelum 20 detik
      }
      delay(100);
    }

    lcd.clear();
    if (logamDitemukan) {
      // --- KONDISI LOGAM ---
      lcd.print("LOGAM +15 Poin");
      
      // MQTT tetap jalan untuk monitor real-time
      client.publish("vending/data", "Logam Terdeteksi");
      
      // Kirim data ke tabel transactions di Supabase
      // Fungsi ini akan mengirim payload dengan UUID Kategori Logam
      kirimKeSupabase("LOGAM", 15);
      
      myServo.write(180); // Miring ke wadah Logam
    } 
    else {
      // --- KONDISI PLASTIK (Jika 20 detik habis tanpa logam) ---
      lcd.print("PLASTIK +10 Poin");
      
      client.publish("vending/data", "Plastik Terdeteksi");
      
      // Kirim data ke tabel transactions di Supabase
      // Fungsi ini akan mengirim payload dengan UUID Kategori Plastik
      kirimKeSupabase("PLASTIK", 10);
      
      myServo.write(0);  // Miring ke wadah Plastik
    }

    // 4. Proses pembuangan selesai
    delay(3000); 
    myServo.write(90); // Kembali ke posisi datar
    lcd.clear();
    lcd.print("Selesai!");
    delay(1000);
  }

  delay(200);
}

// --- FUNGSI KIRIM TRANSAKSI KE SUPABASE ---
void kirimKeSupabase(String jenis, int poin) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi tidak terhubung!");
    return;
  }

  HTTPClient http;

  // ========================================
  // STEP 1: Ambil current_user_id dari mesin
  // ========================================
  String getUrl = String(supabase_url)
    + "/rest/v1/machines?id=eq." + String(MACHINE_ID)
    + "&select=current_user_id";

  http.begin(getUrl);
  http.addHeader("apikey", supabase_key);
  http.addHeader("Authorization", "Bearer " + String(supabase_key));

  int getCode = http.GET();
  String userId = "";

  if (getCode == 200) {
    String resp = http.getString();
    Serial.println("GET machines response: " + resp);

    // Parse JSON
    int start = resp.indexOf("\"current_user_id\":\"") + 19;
    int end = resp.indexOf("\"", start);
    if (start > 19 && end > start) {
      userId = resp.substring(start, end);
    }
  } else {
    Serial.printf("GET machines ERROR: %d\n", getCode);
  }
  http.end();

  // Cek apakah ada user yang terpair
  if (userId == "" || userId == "null") {
    Serial.println("ERROR: Tidak ada user yang terpair dengan mesin ini!");
    lcd.clear();
    lcd.print("Error: No User");
    lcd.setCursor(0, 1);
    lcd.print("Pair dulu!");
    delay(3000);
    return;
  }

  Serial.println("User ID ditemukan: " + userId);

  // ========================================
  // STEP 2: Kirim transaksi dengan user_id
  // ========================================
  String category_id = (jenis == "LOGAM") 
    ? String(CATEGORY_LOGAM) 
    : String(CATEGORY_PLASTIK);

  http.begin(String(supabase_url) + "/rest/v1/transactions");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabase_key);
  http.addHeader("Authorization", "Bearer " + String(supabase_key));
  http.addHeader("Prefer", "return=minimal");

  String jsonPayload = "{"
    "\"user_id\":\"" + userId + "\","
    "\"machine_id\":\"" + String(MACHINE_ID) + "\","
    "\"category_id\":\"" + category_id + "\","
    "\"poin\":" + String(poin) + ","
    "\"status\":\"completed\""
  "}";

  Serial.println("Payload: " + jsonPayload);

  int postCode = http.POST(jsonPayload);

  if (postCode == 201) {
    Serial.println("✅ Transaksi berhasil dikirim!");
    refreshSessionExpiry();
  } else {
    Serial.printf("❌ POST Error: %d\n", postCode);
    Serial.println(http.getString());
  }
  http.end();
}

String getCurrentSessionCode() {
  if (WiFi.status() != WL_CONNECTED) return "";

  HTTPClient http;
  String url = String(supabase_url)
    + "/rest/v1/machine_sessions?machine_id=eq." + String(MACHINE_ID)
    + "&status=eq.pending&select=id,session_code&order=created_at.desc&limit=1";

  http.begin(url);
  http.addHeader("apikey", supabase_key);
  http.addHeader("Authorization", "Bearer " + String(supabase_key));

  int code = http.GET();
  String sessionCode = "";
  
  if (code == 200) {
    String resp = http.getString();
    Serial.println("GET sessions response: " + resp);

    // Parse JSON array - ambil element pertama
    int arrayStart = resp.indexOf("[");
    int arrayEnd = resp.indexOf("]");
    
    if (arrayStart != -1 && arrayEnd != -1) {
      String jsonObj = resp.substring(arrayStart + 1, arrayEnd);
      
      // Parse session_code
      int codeStart = jsonObj.indexOf("\"session_code\":\"") + 16;
      int codeEnd = jsonObj.indexOf("\"", codeStart);
      if (codeStart > 15 && codeEnd > codeStart) {
        sessionCode = jsonObj.substring(codeStart, codeEnd);
      }
      
      // Parse id untuk menyimpan session ID
      int idStart = jsonObj.indexOf("\"id\":\"") + 6;
      int idEnd = jsonObj.indexOf("\"", idStart);
      if (idStart > 5 && idEnd > idStart) {
        currentSessionId = jsonObj.substring(idStart, idEnd);
      }
    }
  } else {
    Serial.printf("GET sessions ERROR: %d\n", code);
  }
  http.end();
  return sessionCode;
}

bool checkSessionPaired(String sessionId) {
  if (WiFi.status() != WL_CONNECTED) return false;
  
  HTTPClient http;
  String url = String(supabase_url)
    + "/rest/v1/machine_sessions?id=eq." + sessionId
    + "&select=status,user_id";

  http.begin(url);
  http.addHeader("apikey", supabase_key);
  http.addHeader("Authorization", "Bearer " + String(supabase_key));

  int code = http.GET();
  bool isPaired = false;
  
  if (code == 200) {
    String resp = http.getString();
    Serial.println("GET session status: " + resp);

    // Check if status is 'paired'
    if (resp.indexOf("\"status\":\"paired\"") != -1) {
      isPaired = true;
      // Extract user_id for future use
      int userStart = resp.indexOf("\"user_id\":\"") + 11;
      int userEnd = resp.indexOf("\"", userStart);
      if (userStart > 10 && userEnd > userStart) {
        String userId = resp.substring(userStart, userEnd);
        Serial.println("User ID dari session: " + userId);
      }
    }
  } else {
    Serial.printf("GET session status ERROR: %d\n", code);
  }
  http.end();
  return isPaired;
}

bool waitForSessionCodeInputAndPoll(const String& expectedCode, String sessionId) {
  unsigned long start = millis();
  String input = "";
  unsigned long pollInterval = 3000; // Poll setiap 3 detik
  unsigned long lastPoll = 0;
  unsigned long lastDisplayUpdate = 0;

  // Display kode sekali di awal
  lcd.clear();
  lcd.print("Kode Sesi:");
  lcd.setCursor(0, 1);
  lcd.print(expectedCode);

  while (millis() - start < 30000) { // Timeout 30 detik
    // Update display hanya untuk menampilkan kode (stabil)
    if (millis() - lastDisplayUpdate > 2000) {
      lcd.setCursor(0, 1);
      lcd.print(expectedCode);  // Refresh kode (prevent LCD flicker)
      lastDisplayUpdate = millis();
    }

    // Poll session status setiap 3 detik
    if (millis() - lastPoll > pollInterval) {
      if (checkSessionPaired(sessionId)) {
        Serial.println("✅ Session paired dari web!");
        lcd.clear();
        lcd.print("Session OK!");
        lcd.setCursor(0, 1);
        lcd.print("From Web");
        delay(1500);
        return true;
      }
      lastPoll = millis();
    }

    // Check serial input
    while (Serial.available()) {
      char c = Serial.read();
      if (c == '\r' || c == '\n') {
        if (input.length() > 0) {
          Serial.println();
          Serial.println("Kode dimasukkan: " + input);
          
          if (input.equals(expectedCode)) {
            Serial.println("✅ Kode benar!");
            return true;
          } else {
            Serial.println("❌ Kode salah!");
            input = "";
            return false;
          }
        }
      } else {
        input += c;
        Serial.print(c);
      }
    }
    delay(50);
  }
  
  Serial.println("⏱️ Timeout waiting for session code");
  return false;
}

void refreshSessionExpiry() {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  String url = String(supabase_url) + "/rest/v1/rpc/refresh_session_expiry";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabase_key);
  http.addHeader("Authorization", "Bearer " + String(supabase_key));
  String payload = "{\"p_machine_id\":\"" + String(MACHINE_ID) + "\"}";
  int code = http.POST(payload);
  if (code == 200) {
    Serial.println("✅ Session timer refreshed!");
  } else {
    Serial.printf("⚠️ Failed to refresh session: %d\n", code);
  }
  http.end();
}