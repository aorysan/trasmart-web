#include <HTTPClient.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ESP32Servo.h>
#include <LiquidCrystal_I2C.h>

// --- KONFIGURASI WIFI & MQTT ---
const char* ssid = "JTI-POLINEMA";
const char* password = "jtifast!";
const char* mqtt_server = "broker.hivemq.com";

// GANTI "ID_PROYEK_KAMU" dengan ID asli dari dashboard Supabase kelompokmu
const char* supabase_url = "https://zvutdbjkfqstmlpxvqzh.supabase.co";
const char* supabase_key = "sb_publishable_kDHEK_JKfp2kg52VSJ4YBQ_iDaOXiow";

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

// Fungsi Kirim ke Supabase (Sekarang menerima 2 parameter: Jenis dan Poin)

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
}

void loop() {
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
    while (millis() - startTime < 20000) { 
      int sisaWaktu = 20 - ((millis() - startTime) / 1000);
      
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

// --- TARUH DI PALING BAWAH KODE ---
void kirimKeSupabase(String jenis, int poin) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin("https://zvutdbjkfqstmlpxvqzh.supabase.co/rest/v1/transactions");
    
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", supabase_key);
    http.addHeader("Authorization", "Bearer " + String(supabase_key));

    // AMBIL UUID DARI DASHBOARD SUPABASE KAMU
    String category_id = (jenis == "LOGAM") ? "PASTE_UUID_KATEGORI_LOGAM" : "PASTE_UUID_KATEGORI_PLASTIK";
    String machine_id = "PASTE_UUID_MESIN_KAMU"; 

    // Payload ini yang akan dibaca oleh Database Trigger untuk menambah poin user
    String jsonPayload = "{"
      "\"machine_id\":\"" + machine_id + "\","
      "\"category_id\":\"" + category_id + "\","
      "\"points_earned\":" + String(poin) + ","
      "\"status\":\"completed\""
    "}";
    
    int httpResponseCode = http.POST(jsonPayload);
    
    // Debugging di Serial Monitor
    if (httpResponseCode > 0) {
      Serial.printf("Supabase OK: %d\n", httpResponseCode);
    } else {
      Serial.printf("Supabase ERROR: %s\n", http.errorToString(httpResponseCode).c_str());
    }
    http.end();
  }
}