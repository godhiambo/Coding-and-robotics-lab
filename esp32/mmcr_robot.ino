// Milestone Minds Connected Robotics (MMCR) - ESP32 robot
// Board: ESP32 (Arduino core 3.0 or newer). Driver: L298N. Sensor: HC-SR04.
// Phone/lab sends text lines over Bluetooth LE (Nordic UART):
//   M,<left>,<right>   motor speeds -100..100      S   stop now
// Robot sends back:  D,<cm>   (distance, about 5 times a second)
// Safety: stops if no command for 500 ms, and will not drive forward closer than 15 cm.
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#define SVC "6E400001-B5A0-F393-E0A9-E50E24DCCA9E"
#define RXC "6E400002-B5A0-F393-E0A9-E50E24DCCA9E"
#define TXC "6E400003-B5A0-F393-E0A9-E50E24DCCA9E"

// L298N wiring (ENA/ENB take PWM)
const int ENA = 25, IN1 = 26, IN2 = 27;   // left motor
const int ENB = 33, IN3 = 14, IN4 = 12;   // right motor
// HC-SR04: ECHO MUST go through a voltage divider (1k + 2.2k) to GPIO 19
const int TRIG = 18, ECHO = 19;

BLECharacteristic *tx;
bool connected = false;
int left = 0, right = 0;
unsigned long lastCmd = 0, lastPing = 0;
long dist = 999;
String buf;

void motor(int en, int a, int b, int v) {
  v = constrain(v, -100, 100);
  digitalWrite(a, v > 0); digitalWrite(b, v < 0);
  ledcWrite(en, map(abs(v), 0, 100, 0, 255));
}
void drive(int l, int r) { motor(ENA, IN1, IN2, l); motor(ENB, IN3, IN4, r); }

long readCm() {
  digitalWrite(TRIG, LOW); delayMicroseconds(2);
  digitalWrite(TRIG, HIGH); delayMicroseconds(10); digitalWrite(TRIG, LOW);
  long us = pulseIn(ECHO, HIGH, 25000);
  return us == 0 ? 999 : us / 58;
}

void handle(String s) {
  s.trim();
  if (s == "S") { left = right = 0; lastCmd = millis(); }
  else if (s.startsWith("M,")) {
    int c = s.indexOf(',', 2);
    if (c > 0) { left = s.substring(2, c).toInt(); right = s.substring(c + 1).toInt(); lastCmd = millis(); }
  }
}

class RxCb : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *c) override {
    String v = c->getValue();
    for (size_t i = 0; i < v.length(); i++) {
      if (v[i] == '\n') { handle(buf); buf = ""; } else if (buf.length() < 40) buf += v[i];
    }
  }
};
class SrvCb : public BLEServerCallbacks {
  void onConnect(BLEServer *s) override { connected = true; }
  void onDisconnect(BLEServer *s) override { connected = false; left = right = 0; BLEDevice::startAdvertising(); }
};

void setup() {
  int pins[] = {IN1, IN2, IN3, IN4, TRIG};
  for (int p : pins) pinMode(p, OUTPUT);
  pinMode(ECHO, INPUT);
  ledcAttach(ENA, 1000, 8); ledcAttach(ENB, 1000, 8);
  BLEDevice::init("MMCR-Robot");
  BLEServer *srv = BLEDevice::createServer(); srv->setCallbacks(new SrvCb());
  BLEService *svc = srv->createService(SVC);
  tx = svc->createCharacteristic(TXC, BLECharacteristic::PROPERTY_NOTIFY); tx->addDescriptor(new BLE2902());
  BLECharacteristic *rx = svc->createCharacteristic(RXC, BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR);
  rx->setCallbacks(new RxCb());
  svc->start();
  BLEDevice::getAdvertising()->addServiceUUID(SVC);
  BLEDevice::startAdvertising();
}

void loop() {
  unsigned long now = millis();
  if (now - lastPing > 200) {
    lastPing = now; dist = readCm();
    if (connected) { String m = "D," + String(dist) + "\n"; tx->setValue(m.c_str()); tx->notify(); }
  }
  int l = left, r = right;
  if (now - lastCmd > 500) l = r = 0;                 // failsafe: lost connection / no commands
  if (dist < 15 && (l + r) > 0) { l = min(l, 0); r = min(r, 0); }  // obstacle: no forward motion
  drive(l, r);
}
