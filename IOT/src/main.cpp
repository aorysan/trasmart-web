#include <HTTPClient.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ESP32Servo.h>
#include <LiquidCrystal_I2C.h>
#include "secrets.h"

const char* mqtt_server = "broker.hivemq.com";

#define PIN_TRIG 5
#define PIN_ECHO 18
#define PIN_PROX 19
#define PIN_SERVO 13

Servo myServo;
LiquidCrystal_I2C lcd(0x27, 16, 2);
WiFiClient espClient;
PubSubClient client(espClient);

long duration;
int distance;

String currentSessionCode = "";
bool isPaired = false;
unsigned long lastPairCheck = 0;
unsigned long lastSessionRefresh = 0;
const unsigned long PAIR_CHECK_INTERVAL = 5000;
const unsigned long SESSION_REFRESH_INTERVAL = 30000;

void getSessionCode();
void checkPairingStatus();
void kirimKeSupabase(String jenis, int poin);
void refreshSessionExpiry();

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

  getSessionCode();

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Kode: ");
  lcd.print(currentSessionCode);
  lcd.setCursor(0, 1);
  lcd.print("Scan di web   ");
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();

  unsigned long now = millis();
  if (now - lastPairCheck > PAIR_CHECK_INTERVAL) {
    lastPairCheck = now;
    bool wasPaired = isPaired;
    checkPairingStatus();
    if (wasPaired && !isPaired) {
      getSessionCode();
    }
  }

  if (!isPaired) {
    if (now - lastSessionRefresh > SESSION_REFRESH_INTERVAL) {
      lastSessionRefresh = now;
      getSessionCode();
    }
    lcd.setCursor(0, 0);
    lcd.print("Kode: ");
    lcd.print(currentSessionCode);
    lcd.print(" ");
    lcd.setCursor(0, 1);
    lcd.print("Scan di web   ");
    delay(200);
    return;
  }

  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  duration = pulseIn(PIN_ECHO, HIGH);
  distance = duration * 0.034 / 2;

  lcd.setCursor(0, 0);
  lcd.print("Standby...      ");

  if (distance > 0 && distance < 10) {
    lcd.clear();
    lcd.print("Benda Masuk!");
    
    unsigned long startTime = millis();
    bool logamDitemukan = false;

    while (millis() - startTime < 20000) { 
      int sisaWaktu = 20 - ((millis() - startTime) / 1000);
      
      lcd.setCursor(0, 1);
      lcd.print("Cek Logam: ");
      lcd.print(sisaWaktu);
      lcd.print("s ");

      if (digitalRead(PIN_PROX) == LOW) {
        logamDitemukan = true;
        break;
      }
      delay(100);
    }

    lcd.clear();
    if (logamDitemukan) {
      lcd.print("LOGAM +15 Poin");
      client.publish("vending/data", "Logam Terdeteksi");
      kirimKeSupabase("LOGAM", 15);
      myServo.write(180);
    } else {
      lcd.print("PLASTIK +10 Poin");
      client.publish("vending/data", "Plastik Terdeteksi");
      kirimKeSupabase("PLASTIK", 10);
      myServo.write(0);
    }

    delay(3000);
    myServo.write(90);
    lcd.clear();
    lcd.print("Selesai!");
    delay(1000);
  }

  delay(200);
}

void getSessionCode() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(supabase_url) + "/rest/v1/rpc/generate_machine_session";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabase_key);

  String payload = "{\"p_machine_id\":\"" + String(MACHINE_ID) + "\"}";
  int code = http.POST(payload);

  if (code == 200) {
    String resp = http.getString();
    resp.trim();
    if (resp.length() >= 2 && resp.charAt(0) == '"' && resp.charAt(resp.length() - 1) == '"') {
      currentSessionCode = resp.substring(1, resp.length() - 1);
    } else {
      currentSessionCode = resp;
    }
    Serial.print("Session code: ");
    Serial.println(currentSessionCode);
    isPaired = false;
  } else {
    Serial.print("Session error: ");
    Serial.println(code);
    currentSessionCode = "ERROR";
  }
  http.end();
}

void checkPairingStatus() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(supabase_url)
    + "/rest/v1/machines?id=eq." + String(MACHINE_ID)
    + "&select=current_user_id";
  http.begin(url);
  http.addHeader("apikey", supabase_key);

  int code = http.GET();
  if (code == 200) {
    String resp = http.getString();
    if (resp.indexOf("\"current_user_id\":null") != -1) {
      isPaired = false;
    } else if (resp.indexOf("\"current_user_id\":\"") != -1) {
      isPaired = true;
      Serial.println("User paired!");
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Selamat Datang!");
      lcd.setCursor(0, 1);
      lcd.print("Buang sampah!");
      delay(2000);
    }
  }
  http.end();
}

void kirimKeSupabase(String jenis, int poin) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi tidak terhubung!");
    return;
  }

  HTTPClient http;

  String getUrl = String(supabase_url)
    + "/rest/v1/machines?id=eq." + String(MACHINE_ID)
    + "&select=current_user_id";
  http.begin(getUrl);
  http.addHeader("apikey", supabase_key);

  int getCode = http.GET();
  String userId = "";

  if (getCode == 200) {
    String resp = http.getString();
    int start = resp.indexOf("\"current_user_id\":\"") + 19;
    int end = resp.indexOf("\"", start);
    if (start > 19 && end > start) {
      userId = resp.substring(start, end);
    }
  }
  http.end();

  if (userId == "" || userId == "null") {
    Serial.println("ERROR: Tidak ada user yang terpair!");
    return;
  }

  String category_id = (jenis == "LOGAM") 
    ? String(CATEGORY_LOGAM) 
    : String(CATEGORY_PLASTIK);

  http.begin(String(supabase_url) + "/rest/v1/transactions");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabase_key);
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
    Serial.println("Transaksi berhasil!");
    refreshSessionExpiry();
  } else {
    Serial.printf("POST Error: %d\n", postCode);
    Serial.println(http.getString());
  }
  http.end();
}

void refreshSessionExpiry() {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  String url = String(supabase_url) + "/rest/v1/rpc/refresh_session_expiry";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabase_key);
  String payload = "{\"p_machine_id\":\"" + String(MACHINE_ID) + "\"}";
  int code = http.POST(payload);
  if (code == 200) {
    Serial.println("Session timer refreshed!");
  } else {
    Serial.printf("Refresh session error: %d\n", code);
  }
  http.end();
}
