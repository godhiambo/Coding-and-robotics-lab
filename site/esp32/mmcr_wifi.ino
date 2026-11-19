// Milestone Minds Connected Robotics (MMCR) - ESP32 Wi-Fi robot, no internet needed.
// The robot creates its own Wi-Fi network. Phone: join "MMCR-Robot" (password mmcr1234), open http://192.168.4.1
// and drive with the joystick page the robot serves itself. Same wiring and safety rules as mmcr_robot.ino:
// L298N motor driver, HC-SR04 (ECHO through a 1k + 2.2k divider), stop after 500 ms without commands,
// no forward motion closer than 15 cm. Board: ESP32, Arduino core 3.0 or newer.
#include <WiFi.h>
#include <WebServer.h>

const char *SSID = "MMCR-Robot", *PASS = "mmcr1234";   // change the password for your class
const int ENA = 25, IN1 = 26, IN2 = 27, ENB = 33, IN3 = 14, IN4 = 12, TRIG = 18, ECHO = 19;

WebServer server(80);
int left = 0, right = 0;
unsigned long lastCmd = 0, lastPing = 0;
long dist = 999;

const char PAGE[] PROGMEM = R"HTML(<!doctype html><html><head><meta name=viewport content="width=device-width,initial-scale=1,user-scalable=no">
<title>MMCR Robot</title><style>body{margin:0;background:#0b1322;color:#fff;font-family:sans-serif;text-align:center;touch-action:none}
#pad{position:relative;width:240px;height:240px;margin:20px auto;border-radius:50%;background:#1e293b;border:2px solid #334155}
#k{position:absolute;left:50%;top:50%;width:84px;height:84px;margin:-42px 0 0 -42px;border-radius:50%;background:#3b82f6;pointer-events:none}
button{font-size:20px;padding:14px 20px;border-radius:12px;border:0;background:#b91c1c;color:#fff;width:90%}</style></head><body>
<h2>MMCR Robot</h2><div>Distance: <b id=d>-</b></div><div id=pad><div id=k></div></div>
<div>Speed <input id=t type=range min=20 max=100 value=70> <b id=tv>70%</b></div><p><button id=s>STOP</button></p>
<script>
var jx=0,jy=0,thr=.7,stopped=false,p=document.getElementById('pad'),k=document.getElementById('k'),dr=false;
function set(e){var r=p.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*2-1,y=(e.clientY-r.top)/r.height*2-1,m=Math.hypot(x,y);if(m>1){x/=m;y/=m}jx=x;jy=-y;k.style.left=50+x*35+'%';k.style.top=50+y*35+'%'}
function end(){dr=false;jx=jy=0;k.style.left='50%';k.style.top='50%'}
p.onpointerdown=function(e){dr=true;p.setPointerCapture(e.pointerId);set(e)};p.onpointermove=function(e){if(dr)set(e)};p.onpointerup=end;p.onpointercancel=end;
document.getElementById('t').oninput=function(){thr=this.value/100;document.getElementById('tv').textContent=this.value+'%'};
document.getElementById('s').onclick=function(){stopped=!stopped;this.textContent=stopped?'RELEASE STOP':'STOP'};
function c(v){return Math.max(-1,Math.min(1,v))}
setInterval(function(){var l=Math.round(c(jy+jx)*thr*100),r=Math.round(c(jy-jx)*thr*100);if(stopped)l=r=0;
fetch('/m?l='+l+'&r='+r).then(function(x){return x.json()}).then(function(j){document.getElementById('d').textContent=j.d>=999?'clear':j.d+' cm'}).catch(function(){document.getElementById('d').textContent='no link'})},100);
</script></body></html>)HTML";

void motor(int en, int a, int b, int v) {
  v = constrain(v, -100, 100);
  digitalWrite(a, v > 0); digitalWrite(b, v < 0);
  ledcWrite(en, map(abs(v), 0, 100, 0, 255));
}
long readCm() {
  digitalWrite(TRIG, LOW); delayMicroseconds(2);
  digitalWrite(TRIG, HIGH); delayMicroseconds(10); digitalWrite(TRIG, LOW);
  long us = pulseIn(ECHO, HIGH, 25000);
  return us == 0 ? 999 : us / 58;
}

void setup() {
  int pins[] = {IN1, IN2, IN3, IN4, TRIG};
  for (int p : pins) pinMode(p, OUTPUT);
  pinMode(ECHO, INPUT);
  ledcAttach(ENA, 1000, 8); ledcAttach(ENB, 1000, 8);
  WiFi.softAP(SSID, PASS);
  server.on("/", []() { server.send_P(200, "text/html", PAGE); });
  server.on("/m", []() {
    left = server.arg("l").toInt(); right = server.arg("r").toInt(); lastCmd = millis();
    server.send(200, "application/json", "{\"d\":" + String(dist) + "}");
  });
  server.begin();
}

void loop() {
  server.handleClient();
  unsigned long now = millis();
  if (now - lastPing > 200) { lastPing = now; dist = readCm(); }
  int l = left, r = right;
  if (now - lastCmd > 500) l = r = 0;
  if (dist < 15 && (l + r) > 0) { l = min(l, 0); r = min(r, 0); }
  motor(ENA, IN1, IN2, l); motor(ENB, IN3, IN4, r);
}
