// MCU: a tiny Arduino-style program runner on top of the breadboard circuit simulator.
// Program = list of blocks. Pure logic (no DOM) so it can be tested in Node and re-checked on a server.
var MCU=(function(){
"use strict";
var C=(typeof Circuit!=="undefined")?Circuit:require("./circuit.js");
var DPINS=[2,3,4,5,6,7,8,9,10,11,12,13],PWMP=[3,5,6,9,10,11],TICK=20;
function pinOf(p){return "D"+p;}
// ---- blocks ----
// {t:"w",p,v}  {t:"d",ms}  {t:"pwm",p,v:0..255|"A0".."A5"}  {t:"sv",p,a}
// {t:"if",c:{k:"dig",p,is}|{k:"ana",a,op,n}|{k:"dist",tp,ep,op,n},th:act|null,el:act|null} act = {t:"w"|"pwm"|"sv",...}
function Run(){return {t:0,pc:0,wait:0,out:{},pwm:{},servo:{},sim:null,log:[]};}
function levels(run){var o={};Object.keys(run.out).forEach(function(p){o["D"+p]=run.out[p]?5:0;});Object.keys(run.pwm).forEach(function(p){o["D"+p]=run.pwm[p]>0?5:0;});return o;}
function simAt(comps,over,outs){var o=Object.assign({},over||{});o.mcu={out:outs};return C.simulate(comps,o);}
function powered(sim,c){return sim.volt(c.holes[0])-sim.volt(c.holes[c.holes.length-1])>=4.5&&sim.same(c.holes[c.holes.length-1],"U:GND")&&true;}
function distance(sim,comps,tp,ep){var best=999;comps.forEach(function(c){if(c.type!=="hcsr04")return;if(!powered(sim,c))return;if(sim.same(c.holes[1],"U:"+pinOf(tp))&&sim.same(c.holes[2],"U:"+pinOf(ep)))best=c.dist;});return best;}
function readDig(run,sim,p){if(run.out[p]!==undefined)return run.out[p]?1:0;return sim.volt("U:"+pinOf(p))>2.5?1:0;}
function readAna(sim,a){var v=sim.volt("U:A"+a);return Math.max(0,Math.min(1023,Math.round(v/5*1023)));}
function cmp(op,x,n){return op==="<"?x<n:x>n;}
function doAct(run,sim,a){if(!a)return;
 if(a.t==="w"){run.out[a.p]=a.v?1:0;delete run.pwm[a.p];}
 else if(a.t==="pwm"){var v=typeof a.v==="string"?Math.round(readAna(sim,+a.v.slice(1))/4):a.v;run.pwm[a.p]=Math.max(0,Math.min(255,v));delete run.out[a.p];}
 else if(a.t==="sv"){run.servo[a.p]=a.a;}}
function exec(run,prog,sim,comps){var guard=0,startPc=run.pc;
 while(guard++<60){
  if(run.pc>=prog.length){run.pc=0;if(startPc===0&&guard>1&&!prog.some(function(b){return b.t==="d";}))break;if(guard>prog.length+1)break;continue;}
  var b=prog[run.pc++];
  if(b.t==="d"){run.wait=b.ms;return;}
  if(b.t==="w"||b.t==="pwm"||b.t==="sv")doAct(run,sim,b);
  else if(b.t==="if"){var c=b.c,ok=false;
   if(c.k==="dig")ok=readDig(run,sim,c.p)===(c.is?1:0);
   else if(c.k==="ana")ok=cmp(c.op,readAna(sim,c.a),c.n);
   else if(c.k==="dist")ok=cmp(c.op,distance(sim,comps,c.tp,c.ep),c.n);
   doAct(run,sim,ok?b.th:b.el);}
 }}
// Advance one tick (20 ms). Returns the final simulation with display extras.
function tick(run,comps,prog,over){
 var sim=simAt(comps,over,levels(run));
 if(run.wait>0){run.wait-=TICK;}else exec(run,prog,sim,comps);
 run.t+=TICK;
 return finish(run,comps,over);}
function finish(run,comps,over){
 var lv=levels(run),sim=simAt(comps,over,lv),pw=Object.keys(run.pwm).filter(function(p){return run.pwm[p]>0&&run.pwm[p]<255;});
 comps.forEach(function(c){var o=sim.comp[c.id];if(!o)return;
  if(c.type==="led"&&pw.length){var base=o.lit,lo=Object.assign({},lv);pw.forEach(function(p){lo["D"+p]=0;});var off=simAt(comps,over,lo).comp[c.id].lit,tot=off;
   pw.forEach(function(p){var one=Object.assign({},lo);one["D"+p]=5;var l1=simAt(comps,over,one).comp[c.id].lit;tot+=(l1-off)*(run.pwm[p]/255);});o.lit=Math.max(0,Math.min(1,tot));}
  if(c.type==="hcsr04"){o.on=powered(sim,c);o.dist=c.dist;}
  if(c.type==="servo"){var gnd=c.holes[0],vcc=c.holes[1],sig=c.holes[2],pw2=sim.volt(vcc)-sim.volt(gnd)>=4&&sim.same(gnd,"U:GND");o.on=pw2;
   var ang=null;Object.keys(run.servo).forEach(function(p){if(sim.same(sig,"U:"+pinOf(p)))ang=run.servo[p];});o.angle=pw2&&ang!==null?ang:null;o.target=ang;}
 });
 run.sim=sim;return sim;}
// Run a scenario for ms milliseconds; `overFn(t)` returns per-component overrides ({id:{light,..}}).
function simulateRun(comps,prog,ms,overFn,hook){var cs=C.clean(comps),run=Run(),sim=null;
 for(var t=0;t<ms;t+=TICK){sim=tick(run,cs,prog,overFn?overFn(t):{});if(hook)hook(sim,run,cs,t);}
 return {sim:sim,run:run,comps:cs};}
function setProps(comps,props){return comps.map(function(c){var d=JSON.parse(JSON.stringify(c));if(props&&props[c.type]!==undefined)Object.assign(d,props[c.type]);return d;});}
// ---- code generation ----
function actCode(a,ind){if(!a)return "";
 if(a.t==="w")return ind+"digitalWrite("+a.p+", "+(a.v?"HIGH":"LOW")+");\n";
 if(a.t==="pwm")return ind+"analogWrite("+a.p+", "+(typeof a.v==="string"?"analogRead("+a.v+") / 4":a.v)+");\n";
 if(a.t==="sv")return ind+"servo"+a.p+".write("+a.a+");\n";return "";}
function condCode(c){
 if(c.k==="dig")return "digitalRead("+c.p+") == "+(c.is?"HIGH":"LOW");
 if(c.k==="ana")return "analogRead(A"+c.a+") "+c.op+" "+c.n;
 return "distanceCm("+c.tp+", "+c.ep+") "+c.op+" "+c.n;}
function toCpp(prog){
 var outs={},ins={},sv={},us=false,lines="";
 function scan(a){if(!a)return;if(a.t==="w"||a.t==="pwm")outs[a.p]=1;if(a.t==="sv")sv[a.p]=1;}
 prog.forEach(function(b){scan(b);if(b.t==="if"){scan(b.th);scan(b.el);var c=b.c;if(c.k==="dig")ins[c.p]=1;if(c.k==="dist"){us=true;outs[c.tp]=1;ins[c.ep]=1;}}});
 var s="";if(Object.keys(sv).length)s+="#include <Servo.h>\n";Object.keys(sv).forEach(function(p){s+="Servo servo"+p+";\n";});
 if(us)s+="\nlong distanceCm(int trig, int echo) {\n  digitalWrite(trig, LOW);  delayMicroseconds(2);\n  digitalWrite(trig, HIGH); delayMicroseconds(10);\n  digitalWrite(trig, LOW);\n  long us = pulseIn(echo, HIGH, 30000);\n  return us == 0 ? 999 : us / 58;\n}\n";
 s+="\nvoid setup() {\n";Object.keys(outs).forEach(function(p){s+="  pinMode("+p+", OUTPUT);\n";});Object.keys(ins).forEach(function(p){s+="  pinMode("+p+", INPUT);\n";});Object.keys(sv).forEach(function(p){s+="  servo"+p+".attach("+p+");\n";});s+="}\n\nvoid loop() {\n";
 prog.forEach(function(b){
  if(b.t==="d")s+="  delay("+b.ms+");\n";
  else if(b.t==="if"){s+="  if ("+condCode(b.c)+") {\n"+(b.th?actCode(b.th,"    "):"")+"  }"+(b.el?" else {\n"+actCode(b.el,"    ")+"  }":"")+"\n";}
  else s+=actCode(b,"  ");});
 return s+"}\n";}
// ---- challenges ----
function find(comps,t){return comps.filter(function(c){return c.type===t;});}
function leds(comps){return find(comps,"led");}
function hasIf(prog,k){return prog.some(function(b){return b.t==="if"&&b.c.k===k;});}
function maxLit(sim,comps){var m=0;leds(comps).forEach(function(l){m=Math.max(m,sim.comp[l.id].lit);});return m;}
function burnt(comps){return comps.some(function(c){return c.burned;});}
function pre(comps,prog,need){if(!find(comps,"uno").length)return "Turn on Arduino mode first.";if(!prog.length)return "Your program is empty. Add some blocks.";
 for(var i=0;i<need.length;i++){if(!find(comps,need[i]).length)return "Add a "+({led:"LED",resistor:"resistor",switch:"push switch",ldr:"light sensor (LDR)",pot:"potentiometer",hcsr04:"HC-SR04 distance sensor",servo:"servo"}[need[i]])+".";}return null;}
function burnMsg(comps){return "💥 A part burnt out. LEDs need a resistor in series (try 220 Ω).";}
var CHALLENGES=[
 {id:"mcu_blink",name:"1 Blink",tier:"Beginner",par:3,goal:"Make an <b>LED blink</b> on Arduino pin 13: on for a moment, then off. Wire: pin 13 → resistor → LED → GND.",hint:"Wire D13 to a resistor, the resistor to the LED's long leg, the LED's short leg to GND. Blocks: set pin 13 HIGH, wait, set pin 13 LOW, wait.",
  check:function(comps,prog){var e=pre(comps,prog,["led","resistor"]);if(e)return e;var lo=1,hi=0;var r=simulateRun(comps,prog,4000,null,function(sim,run,cs){var m=maxLit(sim,cs);lo=Math.min(lo,m);hi=Math.max(hi,m);});
   if(burnt(r.comps))return burnMsg();if(hi<0.4)return "The LED never lights. Check the wire from pin 13 and that the LED's long leg faces the resistor.";if(lo>0.1)return "The LED stays on. Add a block to turn pin 13 LOW, and a wait between.";return true;}},
 {id:"mcu_button",name:"2 Button light",tier:"Beginner",par:2,goal:"Light the LED <b>only while the button is pressed</b>. Use a push switch from 5V to pin 2 with a 10 kΩ resistor from pin 2 to GND (a pull-down), and an LED on pin 8.",hint:"The pull-down keeps pin 2 LOW until the switch connects it to 5V. Block: if pin 2 is HIGH then set pin 8 HIGH, else set pin 8 LOW.",
  check:function(comps,prog){var e=pre(comps,prog,["led","resistor","switch"]);if(e)return e;if(!hasIf(prog,"dig"))return "Use an IF block that reads a digital pin.";
   var a=simulateRun(setProps(comps,{"switch":{closed:false}}),prog,600),b=simulateRun(setProps(comps,{"switch":{closed:true}}),prog,600);
   if(burnt(a.comps)||burnt(b.comps))return burnMsg();if(maxLit(b.sim,b.comps)<0.4)return "Pressed, but the LED stays dark. Check the switch wiring and the LED pin.";if(maxLit(a.sim,a.comps)>0.1)return "The LED is on without pressing. Check the pull-down resistor to GND and your ELSE action.";return true;}},
 {id:"mcu_night",name:"3 Night light",tier:"Intermediate",par:2,goal:"Build an <b>automatic night light</b>. A light sensor (LDR) and a 10 kΩ resistor form a divider into pin A0. When it is dark, switch the LED on pin 9 on; in bright light, off.",hint:"LDR from 5V to A0, 10 kΩ from A0 to GND. Dark means a high LDR resistance, so A0 reads low. Block: if analog A0 < 300 then set pin 9 HIGH else LOW.",
  check:function(comps,prog){var e=pre(comps,prog,["led","resistor","ldr"]);if(e)return e;if(!hasIf(prog,"ana"))return "Use an IF block that reads an analog pin.";
   var d=simulateRun(setProps(comps,{ldr:{light:0.03}}),prog,600),l=simulateRun(setProps(comps,{ldr:{light:0.95}}),prog,600);
   if(burnt(d.comps)||burnt(l.comps))return burnMsg();if(maxLit(d.sim,d.comps)<0.4)return "In the dark the LED is off. Check which way your A0 test goes (< or >) and the divider wiring.";if(maxLit(l.sim,l.comps)>0.1)return "In bright light the LED is still on. Move the threshold or check the divider.";return true;}},
 {id:"mcu_dimmer",name:"4 Dimmer",tier:"Intermediate",par:1,goal:"Use a <b>potentiometer</b> as a dimmer: the knob sets the LED brightness through a PWM pin (3, 5, 6, 9, 10 or 11). Wire the pot's ends to 5V and GND and its middle pin to A0.",hint:"analogRead gives 0–1023 but analogWrite takes 0–255, so divide by 4. Block: PWM write pin 9 = A0 ÷ 4. Keep a 220 Ω resistor with the LED.",
  check:function(comps,prog){var e=pre(comps,prog,["led","resistor","pot"]);if(e)return e;if(!prog.some(function(b){return b.t==="pwm"&&typeof b.v==="string";}))return "Use a PWM block set to read from an analog pin (A0 ÷ 4).";
   var lo=simulateRun(setProps(comps,{pot:{pos:0.12}}),prog,600),hi=simulateRun(setProps(comps,{pot:{pos:0.9}}),prog,600);
   if(burnt(lo.comps)||burnt(hi.comps))return burnMsg();var a=maxLit(lo.sim,lo.comps),b=maxLit(hi.sim,hi.comps);if(Math.abs(b-a)<0.35)return "Turning the knob barely changes the brightness ("+Math.round(a*100)+"% to "+Math.round(b*100)+"%). Check the pot wiring and the PWM pin.";return true;}},
 {id:"mcu_parking",name:"5 Parking sensor",tier:"Advanced",par:1,goal:"Build a <b>parking sensor</b>: an HC-SR04 measures distance. When something is <b>closer than 20 cm</b>, light the LED on pin 8. Wire VCC → 5V, GND → GND, TRIG → pin 9, ECHO → pin 10.",hint:"Block: if distance (trig 9, echo 10) < 20 then set pin 8 HIGH else LOW. The sensor needs power, or it cannot answer.",
  check:function(comps,prog){var e=pre(comps,prog,["led","resistor","hcsr04"]);if(e)return e;if(!hasIf(prog,"dist"))return "Use an IF block that reads the distance sensor.";
   var near=simulateRun(setProps(comps,{hcsr04:{dist:10}}),prog,600),far=simulateRun(setProps(comps,{hcsr04:{dist:100}}),prog,600);
   if(burnt(near.comps)||burnt(far.comps))return burnMsg();if(maxLit(near.sim,near.comps)<0.4)return "At 10 cm the LED stays off. Check the sensor power, TRIG and ECHO pins match your block.";if(maxLit(far.sim,far.comps)>0.1)return "At 100 cm the LED is still on. Check your threshold.";return true;}},
 {id:"mcu_gate",name:"6 Servo gate",tier:"Advanced",par:1,goal:"Make an <b>automatic gate</b>: when something is closer than 15 cm, the servo on pin 6 swings to 90° (open); otherwise it returns to 0° (closed). Servo: brown → GND, red → 5V, orange → pin 6.",hint:"Wire the HC-SR04 as before. Block: if distance (9, 10) < 15 then servo pin 6 = 90 else servo pin 6 = 0.",
  check:function(comps,prog){var e=pre(comps,prog,["hcsr04","servo"]);if(e)return e;if(!hasIf(prog,"dist"))return "Use an IF block that reads the distance sensor.";
   function ang(d){var r=simulateRun(setProps(comps,{hcsr04:{dist:d}}),prog,600),a=null;find(r.comps,"servo").forEach(function(s){var o=r.sim.comp[s.id];if(o.angle!==null&&o.angle!==undefined)a=o.angle;});return a;}
   var o=ang(8),c=ang(100);if(o===null)return "The servo gets no signal or no power. Check its three wires.";if(o<80)return "When something is close the servo should reach 90°.";if(c===null||c>10)return "When nothing is near, the servo should go back to 0°.";return true;}}
];
function progSize(prog){var n=0;prog.forEach(function(b){n++;if(b.t==="if"){if(b.th)n++;if(b.el)n++;}});return n;}
return {Run:Run,tick:tick,finish:finish,simulateRun:simulateRun,toCpp:toCpp,CHALLENGES:CHALLENGES,DPINS:DPINS,PWMP:PWMP,TICK:TICK,progSize:progSize,setProps:setProps};
})();
if(typeof module!=="undefined")module.exports=MCU;
