// MCU: a tiny Arduino-style program runner on top of the breadboard circuit simulator.
// Program = list of blocks. Pure logic (no DOM) so it can be tested in Node and re-checked on a server.
var MCU=(function(){
"use strict";
var C=(typeof Circuit!=="undefined")?Circuit:require("./circuit.js");
var DPINS=[2,3,4,5,6,7,8,9,10,11,12,13],PWMP=[3,5,6,9,10,11],TICK=20;
var BOARDS={uno:{name:"Arduino Uno",out:DPINS,inp:DPINS,pwm:PWMP,adc:[0,1,2,3,4,5],vh:5,thr:2.5,adcMax:1023,div:4,pre:"D",apre:"A"},
 esp32:{name:"ESP32",out:[2,4,5,12,13,14,15,16,17,18,19,21,22,23,25,26,27,32,33],inp:[2,4,5,12,13,14,15,16,17,18,19,21,22,23,25,26,27,32,33,34,35,36,39],pwm:[2,4,5,12,13,14,15,16,17,18,19,21,22,23,25,26,27,32,33],adc:[32,33,34,35,36,39],vh:3.3,thr:1.65,adcMax:4095,div:16,pre:"G",apre:"G"}};
function boardOf(comps){var u=comps.filter(function(c){return c.type==="uno";})[0];return u&&u.board==="esp32"?"esp32":"uno";}
function pinN(b,p){return BOARDS[b].pre+p;}
// ---- blocks ----
// {t:"w",p,v}  {t:"d",ms}  {t:"pwm",p,v:0..255|"A0".."A5"}  {t:"sv",p,a}
// {t:"if",c:{k:"dig",p,is}|{k:"ana",a,op,n}|{k:"dist",tp,ep,op,n},th:act|null,el:act|null} act = {t:"w"|"pwm"|"sv",...}
function Run(){return {t:0,pc:0,wait:0,out:{},pwm:{},servo:{},sim:null,notes:{}};}
function levels(run,b){var o={},v=BOARDS[b].vh;Object.keys(run.out).forEach(function(p){o[pinN(b,p)]=run.out[p]?v:0;});Object.keys(run.pwm).forEach(function(p){o[pinN(b,p)]=run.pwm[p]>0?v:0;});return o;}
function simAt(comps,over,outs){var o=Object.assign({},over||{});o.mcu={out:outs};return C.simulate(comps,o);}
function powered(sim,c){return sim.volt(c.holes[0])-sim.volt(c.holes[c.holes.length-1])>=4.5&&sim.same(c.holes[c.holes.length-1],"U:GND")&&true;}
// The HC-SR04 raises ECHO to 5 V: test what actually reaches the microcontroller pin (a divider may sit between).
function distance(run,sim,comps,over,b,tp,ep){var best=999;comps.forEach(function(c){if(c.type!=="hcsr04")return;if(!powered(sim,c))return;if(!sim.same(c.holes[1],"U:"+pinN(b,tp)))return;
  var o2=Object.assign({},over||{});o2.mcu={out:levels(run,b)};o2.src=[{hole:c.holes[2],v:5,r:100}];var s2=C.simulate(comps,o2),vp=s2.volt("U:"+pinN(b,ep));
  if(vp>BOARDS[b].vh+0.4&&!run.notes["echo"+ep]){run.notes["echo"+ep]="HC-SR04 ECHO sends 5 V into pin "+ep+" but this board tolerates only "+BOARDS[b].vh+" V. Put a voltage divider between ECHO and the pin.";}
  if(vp>=BOARDS[b].thr+0.3)best=c.dist;});return best;}
function readDig(run,sim,b,p){if(run.out[p]!==undefined)return run.out[p]?1:0;return sim.volt("U:"+pinN(b,p))>BOARDS[b].thr?1:0;}
function readAna(sim,b,a){var v=sim.volt("U:"+BOARDS[b].apre+a);return Math.max(0,Math.min(BOARDS[b].adcMax,Math.round(v/BOARDS[b].vh*BOARDS[b].adcMax)));}
function cmp(op,x,n){return op==="<"?x<n:x>n;}
function doAct(run,sim,a,b){if(!a)return;
 if(a.t==="w"){run.out[a.p]=a.v?1:0;delete run.pwm[a.p];}
 else if(a.t==="pwm"){var v=typeof a.v==="string"?Math.round(readAna(sim,b,+a.v.slice(1))/BOARDS[b].div):a.v;run.pwm[a.p]=Math.max(0,Math.min(255,v));delete run.out[a.p];}
 else if(a.t==="sv"){run.servo[a.p]=a.a;}}
function exec(run,prog,sim,comps,over,bd){var guard=0,startPc=run.pc;
 while(guard++<60){
  if(run.pc>=prog.length){run.pc=0;if(startPc===0&&guard>1&&!prog.some(function(b){return b.t==="d";}))break;if(guard>prog.length+1)break;continue;}
  var b=prog[run.pc++];
  if(b.t==="d"){run.wait=b.ms;return;}
  if(b.t==="w"||b.t==="pwm"||b.t==="sv")doAct(run,sim,b,bd);
  else if(b.t==="if"){var c=b.c,ok=false;
   if(c.k==="dig")ok=readDig(run,sim,bd,c.p)===(c.is?1:0);
   else if(c.k==="ana")ok=cmp(c.op,readAna(sim,bd,c.a),c.n);
   else if(c.k==="dist")ok=cmp(c.op,distance(run,sim,comps,over,bd,c.tp,c.ep),c.n);
   doAct(run,sim,ok?b.th:b.el,bd);}
 }}
// Advance one tick (20 ms). Returns the final simulation with display extras.
function tick(run,comps,prog,over){var bd=boardOf(comps);
 var sim=simAt(comps,over,levels(run,bd));
 if(run.wait>0){run.wait-=TICK;}else exec(run,prog,sim,comps,over,bd);
 run.t+=TICK;
 return finish(run,comps,over);}
function finish(run,comps,over){var bd=boardOf(comps);
 var lv=levels(run,bd),sim=simAt(comps,over,lv),pw=Object.keys(run.pwm).filter(function(p){return run.pwm[p]>0&&run.pwm[p]<255;});
 comps.forEach(function(c){var o=sim.comp[c.id];if(!o)return;
  if(c.type==="led"&&pw.length){var base=o.lit,lo=Object.assign({},lv);pw.forEach(function(p){lo[pinN(bd,p)]=0;});var off=simAt(comps,over,lo).comp[c.id].lit,tot=off;
   pw.forEach(function(p){var one=Object.assign({},lo);one[pinN(bd,p)]=BOARDS[bd].vh;var l1=simAt(comps,over,one).comp[c.id].lit;tot+=(l1-off)*(run.pwm[p]/255);});o.lit=Math.max(0,Math.min(1,tot));}
  if(c.type==="hcsr04"){o.on=powered(sim,c);o.dist=c.dist;}
  if(c.type==="servo"){var gnd=c.holes[0],vcc=c.holes[1],sig=c.holes[2],pw2=sim.volt(vcc)-sim.volt(gnd)>=4&&sim.same(gnd,"U:GND");o.on=pw2;
   var ang=null;Object.keys(run.servo).forEach(function(p){if(sim.same(sig,"U:"+pinN(bd,p)))ang=run.servo[p];});o.angle=pw2&&ang!==null?ang:null;o.target=ang;}
 });
 Object.keys(run.notes).forEach(function(k){if(sim.notes.indexOf(run.notes[k])<0)sim.notes.push(run.notes[k]);});
 run.sim=sim;return sim;}
// Run a scenario for ms milliseconds; `overFn(t)` returns per-component overrides ({id:{light,..}}).
function simulateRun(comps,prog,ms,overFn,hook){var cs=C.clean(comps),run=Run(),sim=null;
 for(var t=0;t<ms;t+=TICK){sim=tick(run,cs,prog,overFn?overFn(t):{});if(hook)hook(sim,run,cs,t);}
 return {sim:sim,run:run,comps:cs};}
function setProps(comps,props){return comps.map(function(c){var d=JSON.parse(JSON.stringify(c));if(props&&props[c.type]!==undefined)Object.assign(d,props[c.type]);return d;});}
// ---- code generation ----
function anaName(bd,x){return bd==="esp32"?String(x):"A"+x;}
function actCode(a,ind,bd){if(!a)return "";
 if(a.t==="w")return ind+"digitalWrite("+a.p+", "+(a.v?"HIGH":"LOW")+");\n";
 if(a.t==="pwm")return ind+"analogWrite("+a.p+", "+(typeof a.v==="string"?"analogRead("+(bd==="esp32"?a.v.slice(1):a.v)+") / "+BOARDS[bd].div:a.v)+");\n";
 if(a.t==="sv")return ind+"servo"+a.p+".write("+a.a+");\n";return "";}
function condCode(c,bd){
 if(c.k==="dig")return "digitalRead("+c.p+") == "+(c.is?"HIGH":"LOW");
 if(c.k==="ana")return "analogRead("+anaName(bd,c.a)+") "+c.op+" "+c.n;
 return "distanceCm("+c.tp+", "+c.ep+") "+c.op+" "+c.n;}
function toCpp(prog,bd){bd=bd||"uno";
 var outs={},ins={},sv={},us=false;
 function scan(a){if(!a)return;if(a.t==="w"||a.t==="pwm")outs[a.p]=1;if(a.t==="sv")sv[a.p]=1;}
 prog.forEach(function(b){scan(b);if(b.t==="if"){scan(b.th);scan(b.el);var c=b.c;if(c.k==="dig")ins[c.p]=1;if(c.k==="dist"){us=true;outs[c.tp]=1;ins[c.ep]=1;}}});
 var s=bd==="esp32"?"// ESP32 (Arduino core). Pin numbers are GPIO numbers. Analog inputs are 12-bit (0-4095), 3.3 V.\n":"";
 if(Object.keys(sv).length)s+=(bd==="esp32"?"#include <ESP32Servo.h>\n":"#include <Servo.h>\n");Object.keys(sv).forEach(function(p){s+="Servo servo"+p+";\n";});
 if(us)s+="\nlong distanceCm(int trig, int echo) {\n  digitalWrite(trig, LOW);  delayMicroseconds(2);\n  digitalWrite(trig, HIGH); delayMicroseconds(10);\n  digitalWrite(trig, LOW);\n  long us = pulseIn(echo, HIGH, 30000);\n  return us == 0 ? 999 : us / 58;\n}\n";
 s+="\nvoid setup() {\n";Object.keys(outs).forEach(function(p){s+="  pinMode("+p+", OUTPUT);\n";});Object.keys(ins).forEach(function(p){s+="  pinMode("+p+", INPUT);\n";});Object.keys(sv).forEach(function(p){s+="  servo"+p+".attach("+p+");\n";});s+="}\n\nvoid loop() {\n";
 prog.forEach(function(b){
  if(b.t==="d")s+="  delay("+b.ms+");\n";
  else if(b.t==="if"){s+="  if ("+condCode(b.c,bd)+") {\n"+(b.th?actCode(b.th,"    ",bd):"")+"  }"+(b.el?" else {\n"+actCode(b.el,"    ",bd)+"  }":"")+"\n";}
  else s+=actCode(b,"  ",bd);});
 return s+"}\n";}
// ---- challenges ----
function find(comps,t){return comps.filter(function(c){return c.type===t;});}
function leds(comps){return find(comps,"led");}
function hasIf(prog,k){return prog.some(function(b){return b.t==="if"&&b.c.k===k;});}
function maxLit(sim,comps){var m=0;leds(comps).forEach(function(l){m=Math.max(m,sim.comp[l.id].lit);});return m;}
function burnt(comps){return comps.some(function(c){return c.burned;});}
function pre(comps,prog,need,board){if(!find(comps,"uno").length)return "Turn on Arduino or ESP32 mode first.";if(boardOf(comps)!==(board||"uno"))return "This challenge needs the "+BOARDS[board||"uno"].name+".";if(!prog.length)return "Your program is empty. Add some blocks.";
 for(var i=0;i<need.length;i++){if(!find(comps,need[i]).length)return "Add a "+({led:"LED",resistor:"resistor",switch:"push switch",ldr:"light sensor (LDR)",pot:"potentiometer",hcsr04:"HC-SR04 distance sensor",servo:"servo"}[need[i]])+".";}return null;}
function burnMsg(comps){return "💥 A part burnt out. LEDs need a resistor in series (try 220 Ω).";}
var CHALLENGES=[
 {id:"mcu_blink",name:"1 Blink",tier:"Beginner",par:4,goal:"Make an <b>LED blink</b> on Arduino pin 13: on for a moment, then off. Wire: pin 13 → resistor → LED → GND.",hint:"Wire D13 to a resistor, the resistor to the LED's long leg, the LED's short leg to GND. Blocks: set pin 13 HIGH, wait, set pin 13 LOW, wait.",
  check:function(comps,prog){var e=pre(comps,prog,["led","resistor"]);if(e)return e;var lo=1,hi=0;var r=simulateRun(comps,prog,4000,null,function(sim,run,cs){var m=maxLit(sim,cs);lo=Math.min(lo,m);hi=Math.max(hi,m);});
   if(burnt(r.comps))return burnMsg();if(hi<0.2)return "The LED never lights. Check the wire from pin 13 and that the LED's long leg faces the resistor.";if(lo>0.1)return "The LED stays on. Add a block to turn pin 13 LOW, and a wait between.";return true;}},
 {id:"mcu_button",name:"2 Button light",tier:"Beginner",par:3,goal:"Light the LED <b>only while the button is pressed</b>. Use a push switch from 5V to pin 2 with a 10 kΩ resistor from pin 2 to GND (a pull-down), and an LED on pin 8.",hint:"The pull-down keeps pin 2 LOW until the switch connects it to 5V. Block: if pin 2 is HIGH then set pin 8 HIGH, else set pin 8 LOW.",
  check:function(comps,prog){var e=pre(comps,prog,["led","resistor","switch"]);if(e)return e;if(!hasIf(prog,"dig"))return "Use an IF block that reads a digital pin.";
   var a=simulateRun(setProps(comps,{"switch":{closed:false}}),prog,600),b=simulateRun(setProps(comps,{"switch":{closed:true}}),prog,600);
   if(burnt(a.comps)||burnt(b.comps))return burnMsg();if(maxLit(b.sim,b.comps)<0.2)return "Pressed, but the LED stays dark. Check the switch wiring and the LED pin.";if(maxLit(a.sim,a.comps)>0.1)return "The LED is on without pressing. Check the pull-down resistor to GND and your ELSE action.";return true;}},
 {id:"mcu_night",name:"3 Night light",tier:"Intermediate",par:3,goal:"Build an <b>automatic night light</b>. A light sensor (LDR) and a 10 kΩ resistor form a divider into pin A0. When it is dark, switch the LED on pin 9 on; in bright light, off.",hint:"LDR from 5V to A0, 10 kΩ from A0 to GND. Dark means a high LDR resistance, so A0 reads low. Block: if analog A0 < 300 then set pin 9 HIGH else LOW.",
  check:function(comps,prog){var e=pre(comps,prog,["led","resistor","ldr"]);if(e)return e;if(!hasIf(prog,"ana"))return "Use an IF block that reads an analog pin.";
   var d=simulateRun(setProps(comps,{ldr:{light:0.03}}),prog,600),l=simulateRun(setProps(comps,{ldr:{light:0.95}}),prog,600);
   if(burnt(d.comps)||burnt(l.comps))return burnMsg();if(maxLit(d.sim,d.comps)<0.2)return "In the dark the LED is off. Check which way your A0 test goes (< or >) and the divider wiring.";if(maxLit(l.sim,l.comps)>0.1)return "In bright light the LED is still on. Move the threshold or check the divider.";return true;}},
 {id:"mcu_dimmer",name:"4 Dimmer",tier:"Intermediate",par:1,goal:"Use a <b>potentiometer</b> as a dimmer: the knob sets the LED brightness through a PWM pin (3, 5, 6, 9, 10 or 11). Wire the pot's ends to 5V and GND and its middle pin to A0.",hint:"analogRead gives 0–1023 but analogWrite takes 0–255, so divide by 4. Block: PWM write pin 9 = A0 ÷ 4. Keep a 220 Ω resistor with the LED.",
  check:function(comps,prog){var e=pre(comps,prog,["led","resistor","pot"]);if(e)return e;if(!prog.some(function(b){return b.t==="pwm"&&typeof b.v==="string";}))return "Use a PWM block set to read from an analog pin (A0 ÷ 4).";
   var lo=simulateRun(setProps(comps,{pot:{pos:0.12}}),prog,600),hi=simulateRun(setProps(comps,{pot:{pos:0.9}}),prog,600);
   if(burnt(lo.comps)||burnt(hi.comps))return burnMsg();var a=maxLit(lo.sim,lo.comps),b=maxLit(hi.sim,hi.comps);if(Math.abs(b-a)<0.35)return "Turning the knob barely changes the brightness ("+Math.round(a*100)+"% to "+Math.round(b*100)+"%). Check the pot wiring and the PWM pin.";return true;}},
 {id:"mcu_parking",name:"5 Parking sensor",tier:"Advanced",par:3,goal:"Build a <b>parking sensor</b>: an HC-SR04 measures distance. When something is <b>closer than 20 cm</b>, light the LED on pin 8. Wire VCC → 5V, GND → GND, TRIG → pin 9, ECHO → pin 10.",hint:"Block: if distance (trig 9, echo 10) < 20 then set pin 8 HIGH else LOW. The sensor needs power, or it cannot answer.",
  check:function(comps,prog){var e=pre(comps,prog,["led","resistor","hcsr04"]);if(e)return e;if(!hasIf(prog,"dist"))return "Use an IF block that reads the distance sensor.";
   var near=simulateRun(setProps(comps,{hcsr04:{dist:10}}),prog,600),far=simulateRun(setProps(comps,{hcsr04:{dist:100}}),prog,600);
   if(burnt(near.comps)||burnt(far.comps))return burnMsg();if(maxLit(near.sim,near.comps)<0.2)return "At 10 cm the LED stays off. Check the sensor power, TRIG and ECHO pins match your block.";if(maxLit(far.sim,far.comps)>0.1)return "At 100 cm the LED is still on. Check your threshold.";return true;}},
 {id:"mcu_gate",name:"6 Servo gate",tier:"Advanced",par:3,goal:"Make an <b>automatic gate</b>: when something is closer than 15 cm, the servo on pin 6 swings to 90° (open); otherwise it returns to 0° (closed). Servo: brown → GND, red → 5V, orange → pin 6.",hint:"Wire the HC-SR04 as before. Block: if distance (9, 10) < 15 then servo pin 6 = 90 else servo pin 6 = 0.",
  check:function(comps,prog){var e=pre(comps,prog,["hcsr04","servo"]);if(e)return e;if(!hasIf(prog,"dist"))return "Use an IF block that reads the distance sensor.";
   function ang(d){var r=simulateRun(setProps(comps,{hcsr04:{dist:d}}),prog,600),a=null;find(r.comps,"servo").forEach(function(s){var o=r.sim.comp[s.id];if(o.angle!==null&&o.angle!==undefined)a=o.angle;});return a;}
   var o=ang(8),c=ang(100);if(o===null)return "The servo gets no signal or no power. Check its three wires.";if(o<80)return "When something is close the servo should reach 90°.";if(c===null||c>10)return "When nothing is near, the servo should go back to 0°.";return true;}}
];
CHALLENGES.forEach(function(c){c.board="uno";});
function scene(comps,prog,props,ms){return simulateRun(setProps(comps,props),prog,ms||600);}
function allNotes(r){return r.sim.notes||[];}
CHALLENGES.push(
 {id:"mcu_esp_blink",board:"esp32",name:"E1 ESP32 blink",tier:"Beginner",par:4,goal:"Blink an LED on <b>GPIO 4</b> of the ESP32. Its pins give <b>3.3 V</b>, not 5 V, so the LED is a little dimmer. Wire: GPIO 4 → resistor → LED → GND.",hint:"Same idea as the Uno: GPIO4 → 220 Ω → LED long leg, short leg → GND. Blocks: set pin 4 HIGH, wait, set pin 4 LOW, wait.",
  check:function(comps,prog){var e=pre(comps,prog,["led","resistor"],"esp32");if(e)return e;var lo=1,hi=0;var r=simulateRun(comps,prog,4000,null,function(sim,run,cs){var m=maxLit(sim,cs);lo=Math.min(lo,m);hi=Math.max(hi,m);});
   if(burnt(r.comps))return burnMsg();if(hi<0.15)return "The LED never lights. At 3.3 V a smaller resistor (100 Ω) helps. Check the wire from GPIO 4.";if(lo>0.1)return "The LED stays on. Add a LOW block and a wait.";return true;}},
 {id:"mcu_esp_button",board:"esp32",name:"E2 ESP32 button",tier:"Intermediate",par:3,goal:"Light an LED on <b>GPIO 18</b> only while a button is pressed. Switch from <b>3V3</b> to GPIO 5, with a 10 kΩ pull-down from GPIO 5 to GND.",hint:"Note the ESP32 logic level is 3.3 V: feed the switch from the 3V3 pin. Block: if pin 5 is HIGH then set pin 18 HIGH else LOW.",
  check:function(comps,prog){var e=pre(comps,prog,["led","resistor","switch"],"esp32");if(e)return e;if(!hasIf(prog,"dig"))return "Use an IF block that reads a digital pin.";
   var a=scene(comps,prog,{"switch":{closed:false}}),b=scene(comps,prog,{"switch":{closed:true}});if(burnt(a.comps)||burnt(b.comps))return burnMsg();if(maxLit(b.sim,b.comps)<0.15)return "Pressed, but the LED stays dark. Check the 3V3 wire, the switch and GPIO numbers.";if(maxLit(a.sim,a.comps)>0.1)return "The LED is on without pressing. Check the pull-down resistor.";return true;}},
 {id:"mcu_esp_light",board:"esp32",name:"E3 ESP32 light sensor",tier:"Intermediate",par:3,goal:"Automatic light: an LDR from <b>3V3</b> to <b>GPIO 34</b> with a 10 kΩ from GPIO 34 to GND. In the dark, switch the LED on <b>GPIO 18</b> on. The ESP32 reads <b>0–4095</b> (12 bits), not 0–1023.",hint:"Dark means a low reading. Block: if analog GPIO34 < 1500 then set pin 18 HIGH else LOW.",
  check:function(comps,prog){var e=pre(comps,prog,["led","resistor","ldr"],"esp32");if(e)return e;if(!hasIf(prog,"ana"))return "Use an IF block that reads an analog pin.";
   var d=scene(comps,prog,{ldr:{light:0.03}}),l=scene(comps,prog,{ldr:{light:0.95}});if(burnt(d.comps)||burnt(l.comps))return burnMsg();if(maxLit(d.sim,d.comps)<0.15)return "In the dark the LED is off. Check the test (< or >), the number (the scale is 0–4095) and the divider.";if(maxLit(l.sim,l.comps)>0.1)return "In bright light the LED is still on. Adjust the number.";return true;}},
 {id:"mcu_esp_echo",board:"esp32",name:"E4 Safe HC-SR04",tier:"Advanced",par:3,goal:"Connect the HC-SR04 to the ESP32 <b>safely</b>. The sensor needs <b>5 V</b> (VIN pin) and its ECHO sends <b>5 V</b>, but ESP32 pins tolerate only <b>3.3 V</b>. Use a <b>voltage divider</b> (e.g. 1 kΩ and 2.2 kΩ) on ECHO → GPIO 19. TRIG → GPIO 18. Light the LED on GPIO 21 when closer than 20 cm.",hint:"ECHO → 1 kΩ → GPIO 19 → 2.2 kΩ → GND gives about 3.3 V. Blocks: if distance (trig 18, echo 19) < 20 then set pin 21 HIGH else LOW.",
  check:function(comps,prog){var e=pre(comps,prog,["led","resistor","hcsr04"],"esp32");if(e)return e;if(!hasIf(prog,"dist"))return "Use an IF block that reads the distance sensor.";
   var n=scene(comps,prog,{hcsr04:{dist:10}}),f=scene(comps,prog,{hcsr04:{dist:100}});if(burnt(n.comps)||burnt(f.comps))return burnMsg();
   var nn=allNotes(n).filter(function(x){return /ECHO/.test(x);});if(nn.length)return "⚡ "+nn[0];
   if(maxLit(n.sim,n.comps)<0.15)return "At 10 cm the LED stays off. Check the sensor power (5 V), the TRIG pin, and that the divider gives the ECHO pin more than 2 V.";if(maxLit(f.sim,f.comps)>0.1)return "At 100 cm the LED is still on. Check your threshold.";return true;}}
);
// ---- server-safe evaluation ----
var LEN={resistor:2,led:2,"switch":2,pot:3,wire:2,ldr:2,ntc:2,npn:3,hcsr04:4,servo:3,uno:0};
function num(x,lo,hi,d){x=+x;return isFinite(x)?Math.max(lo,Math.min(hi,x)):d;}
function sanitize(d){if(!d||!Array.isArray(d.comps)||!Array.isArray(d.prog)||d.comps.length>80||d.prog.length>30)return null;
 var comps=[],seen={},unos=0;
 for(var i=0;i<d.comps.length;i++){var c=d.comps[i];if(!c||LEN[c.type]===undefined)return null;var id=Math.round(num(c.id,0,100000,-1));if(id<0||seen[id])return null;seen[id]=1;
  if(!Array.isArray(c.holes)||c.holes.length!==LEN[c.type])return null;for(var h=0;h<c.holes.length;h++)if(typeof c.holes[h]!=="string"||!C.validHole(c.holes[h]))return null;
  var o={id:id,type:c.type,holes:c.holes.slice()};
  if(c.type==="resistor"){o.value=C.RES.indexOf(+c.value)>=0?+c.value:220;}
  if(c.type==="led"){o.color=C.LEDS[c.color]?c.color:"red";}
  if(c.type==="switch")o.closed=!!c.closed;if(c.type==="pot")o.pos=num(c.pos,0,1,.5);if(c.type==="ldr")o.light=num(c.light,0,1,.6);if(c.type==="ntc")o.temp=num(c.temp,0,100,25);
  if(c.type==="hcsr04")o.dist=Math.round(num(c.dist,2,200,50));
  if(c.type==="uno"){unos++;o.board=c.board==="esp32"?"esp32":"uno";}
  comps.push(o);}
 if(unos!==1)return null;
 var bd=boardOf(comps),B=BOARDS[bd],prog=[];
 function act(a){if(a===null||a===undefined)return null;if(!a||typeof a!=="object")return false;
  if(a.t==="w"){var p=+a.p;return B.out.indexOf(p)>=0?{t:"w",p:p,v:a.v?1:0}:false;}
  if(a.t==="pwm"){var p2=+a.p;if(B.pwm.indexOf(p2)<0)return false;var v=a.v;if(typeof v==="string"){if(!/^[AG]\d{1,2}$/.test(v))return false;return {t:"pwm",p:p2,v:v};}return {t:"pwm",p:p2,v:Math.round(num(v,0,255,0))};}
  if(a.t==="sv"){var p3=+a.p;return B.out.indexOf(p3)>=0?{t:"sv",p:p3,a:Math.round(num(a.a,0,180,0))}:false;}return false;}
 for(var j=0;j<d.prog.length;j++){var b=d.prog[j];if(!b||typeof b!=="object")return null;
  if(b.t==="d")prog.push({t:"d",ms:Math.round(num(b.ms,20,10000,500))});
  else if(b.t==="w"||b.t==="pwm"||b.t==="sv"){var q=act(b);if(!q)return null;prog.push(q);}
  else if(b.t==="if"){var c2=b.c||{},cc;if(c2.k==="dig"){if(B.inp.indexOf(+c2.p)<0)return null;cc={k:"dig",p:+c2.p,is:c2.is?1:0};}
   else if(c2.k==="ana"){if(B.adc.indexOf(+c2.a)<0||(c2.op!=="<"&&c2.op!==">"))return null;cc={k:"ana",a:+c2.a,op:c2.op,n:Math.round(num(c2.n,0,B.adcMax,0))};}
   else if(c2.k==="dist"){if(B.out.indexOf(+c2.tp)<0||B.inp.indexOf(+c2.ep)<0||(c2.op!=="<"&&c2.op!==">"))return null;cc={k:"dist",tp:+c2.tp,ep:+c2.ep,op:c2.op,n:Math.round(num(c2.n,1,400,20))};}else return null;
   var th=act(b.th),el=act(b.el);if(th===false||el===false)return null;prog.push({t:"if",c:cc,th:th,el:el});}
  else return null;}
 return {comps:comps,prog:prog};}
function progSize(prog){var n=0;prog.forEach(function(b){n++;if(b.t==="if"){if(b.th)n++;if(b.el)n++;}});return n;}
function evaluate(d){var ch=CHALLENGES.filter(function(c){return c.id===(d&&d.ch);})[0];if(!ch)return {ok:false,t:"Unknown challenge."};var sd=sanitize(d);if(!sd)return {ok:false,t:"Invalid design."};
 var r=ch.check(sd.comps,sd.prog);if(r!==true)return {ok:false,t:String(r)};
 var run=simulateRun(sd.comps,sd.prog,600),notes=(run.sim&&run.sim.notes)||[],stars=1+(notes.length?0:1)+(progSize(sd.prog)<=ch.par?1:0);
 return {ok:true,stars:stars,tier:ch.tier,name:"Arduino: "+ch.name.replace(/^[A-Z]?\d+\s*/,""),t:"★".repeat(stars)+" Your circuit and program work! "+(stars<3?"(3 stars: a safe circuit and at most "+ch.par+" block"+(ch.par>1?"s":"")+")":"")};}
return {Run:Run,tick:tick,finish:finish,simulateRun:simulateRun,toCpp:toCpp,CHALLENGES:CHALLENGES,DPINS:DPINS,PWMP:PWMP,BOARDS:BOARDS,TICK:TICK,progSize:progSize,setProps:setProps,evaluate:evaluate,sanitize:sanitize,boardOf:boardOf};
})();
if(typeof module!=="undefined")module.exports=MCU;
