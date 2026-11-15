var Circuit=(function(){
"use strict";
var LEDS={red:{vf:2.0,col:"#ff3b30"},green:{vf:2.1,col:"#34d058"},yellow:{vf:2.1,col:"#ffd60a"},blue:{vf:3.0,col:"#3b82f6"}};
var RES=[100,220,330,470,1000,2200,4700,10000];
var BATT={3:{r:1.0,name:"2×AA 3V"},5:{r:0.3,name:"USB 5V"},9:{r:2.0,name:"9V block"}};
var BETA=100,RDQ=10,RD=8,ILED_MAX=0.030,RATED_W=0.5,IBAT_SHORT=1.0,POT_TOTAL=10000;
var ROWS="abcdefghij";
function holeNode(h){
 var m=/^(tp|tn|bp|bn)(\d+)$/.exec(h);if(m)return m[1];
 m=/^([a-j])(\d+)$/.exec(h);if(!m)return null;
 return (ROWS.indexOf(m[1])<5?"T":"B")+m[2];
}
function validHole(h){var m=/^(tp|tn|bp|bn)(\d+)$/.exec(h)||/^([a-j])(\d+)$/.exec(h);return !!m&&+m[2]>=1&&+m[2]<=30;}
function clamp01(x){return Math.min(1,Math.max(0,x));}
function ldrR(l){return 200+100000*Math.pow(1-clamp01(l),2);}
function ntcR(t){var T=t+273.15;return 10000*Math.exp(3950*(1/T-1/298.15));}
function fmtR(r){return r>=1000?(r/1000)+"kΩ":r+"Ω";}
var BANDCOL=["#000","#8b4513","#e53935","#fb8c00","#fdd835","#43a047","#1e88e5","#8e24aa","#757575","#fff"];
function bands(r){var e=0,v=r;while(v>=100){v/=10;e++;}var d1=Math.floor(v/10),d2=Math.round(v%10);return [BANDCOL[d1],BANDCOL[d2],BANDCOL[e]];}
// --- linear solve ---
function solve(A,b){
 var n=b.length,i,j,k;
 for(i=0;i<n;i++){
  var p=i;for(j=i+1;j<n;j++)if(Math.abs(A[j][i])>Math.abs(A[p][i]))p=j;
  var t=A[i];A[i]=A[p];A[p]=t;var tb=b[i];b[i]=b[p];b[p]=tb;
  var d=A[i][i];if(Math.abs(d)<1e-18)d=1e-18;
  for(j=i+1;j<n;j++){var f=A[j][i]/d;if(f===0)continue;for(k=i;k<n;k++)A[j][k]-=f*A[i][k];b[j]-=f*b[i];}
 }
 var x=new Array(n);
 for(i=n-1;i>=0;i--){var s=b[i];for(j=i+1;j<n;j++)s-=A[i][j]*x[j];var dd=A[i][i];if(Math.abs(dd)<1e-18)dd=1e-18;x[i]=s/dd;}
 return x;
}
// comps: [{id,type,holes,value,color,closed,pos,burned}]
function simulate(comps,over){
 over=over||{};
 var par={};function find(a){if(par[a]===undefined)par[a]=a;while(par[a]!==a){par[a]=par[par[a]];a=par[a];}return a;}
 function uni(a,b){a=find(a);b=find(b);if(a!==b)par[a]=b;}
 comps.forEach(function(c){
  c.holes.forEach(function(h){var n=holeNode(h);if(n)find(n);});
  if(c.type==="wire")uni(holeNode(c.holes[0]),holeNode(c.holes[1]));
  if(c.type==="switch"){var cl=over[c.id]!==undefined&&over[c.id].closed!==undefined?over[c.id].closed:c.closed;if(cl)uni(holeNode(c.holes[0]),holeNode(c.holes[1]));}
 });
 var bats=comps.filter(function(c){return c.type==="battery";});
 var res={ok:true,nodeV:{},comp:{},short:false,noBattery:!bats.length,notes:[],burned:[]};
 function nodeOf(h){return find(holeNode(h));}
 var gnd=bats.length?nodeOf(bats[0].holes[1]):null;
 var names=[],idx={};
 Object.keys(par).forEach(function(k){var r=find(k);if(r!==gnd&&idx[r]===undefined){idx[r]=names.length;names.push(r);}});
 var N=names.length;
 var elems=[];
 comps.forEach(function(c){
  var a=c.holes[0],ov=over[c.id]||{};
  if(c.type==="resistor"){elems.push({k:"R",c:c,a:nodeOf(c.holes[0]),b:nodeOf(c.holes[1]),r:c.value});}
  else if(c.type==="pot"){var pos=ov.pos!==undefined?ov.pos:c.pos;pos=Math.min(1,Math.max(0.001,pos));
   elems.push({k:"R",c:c,sub:"aw",a:nodeOf(c.holes[0]),b:nodeOf(c.holes[1]),r:POT_TOTAL*pos});
   elems.push({k:"R",c:c,sub:"wb",a:nodeOf(c.holes[1]),b:nodeOf(c.holes[2]),r:POT_TOTAL*(1-pos)+0.5});}
  else if(c.type==="ldr"){var lt=ov.light!==undefined?ov.light:c.light;elems.push({k:"R",c:c,a:nodeOf(c.holes[0]),b:nodeOf(c.holes[1]),r:ldrR(lt)});}
  else if(c.type==="ntc"){var tc=ov.temp!==undefined?ov.temp:c.temp;elems.push({k:"R",c:c,a:nodeOf(c.holes[0]),b:nodeOf(c.holes[1]),r:ntcR(tc)});}
  else if(c.type==="npn"){elems.push({k:"Q",c:c,cn:nodeOf(c.holes[0]),bn:nodeOf(c.holes[1]),en:nodeOf(c.holes[2]),beOn:false,sat:false});}
  else if(c.type==="led"){elems.push({k:"D",c:c,a:nodeOf(c.holes[0]),b:nodeOf(c.holes[1]),vf:LEDS[c.color].vf,on:false,dead:!!c.burned});}
  else if(c.type==="battery"){elems.push({k:"B",c:c,a:nodeOf(c.holes[0]),b:nodeOf(c.holes[1]),v:c.value,r:BATT[c.value].r});}
 });
 function idxOf(n){return n===gnd?-1:idx[n];}
 var diodes=elems.filter(function(e){return e.k==="D";}),trans=elems.filter(function(e){return e.k==="Q";});
 var V;
 function build(){
  var i,j;A=[];b=[];for(i=0;i<N;i++){A.push(new Array(N).fill(0));b.push(0);A[i][i]+=1e-9;}
  function stampG(na,nb,g){var x=idxOf(na),y=idxOf(nb);if(x>=0)A[x][x]+=g;if(y>=0)A[y][y]+=g;if(x>=0&&y>=0){A[x][y]-=g;A[y][x]-=g;}}
  function inj(n,cur){var x=idxOf(n);if(x>=0)b[x]+=cur;}
  function addA(n1,n2,v){var x=idxOf(n1),y=idxOf(n2);if(x>=0&&y>=0)A[x][y]+=v;}
  elems.forEach(function(e){
   if(e.k==="Q"){
    if(e.beOn){var g=1/RDQ,gm=BETA*g;stampG(e.bn,e.en,g);inj(e.bn,g*0.7);inj(e.en,-g*0.7);
     if(e.sat){stampG(e.cn,e.en,1);inj(e.cn,0.2);inj(e.en,-0.2);}
     else{addA(e.cn,e.bn,gm);addA(e.cn,e.en,-gm);inj(e.cn,gm*0.7);addA(e.en,e.bn,-gm);addA(e.en,e.en,gm);inj(e.en,-gm*0.7);}}
    else{stampG(e.bn,e.en,1e-9);stampG(e.cn,e.en,1e-9);}
    return;}
   if(e.a===e.b)return;
   if(e.k==="R")stampG(e.a,e.b,1/Math.max(e.r,0.01));
   else if(e.k==="B"){stampG(e.a,e.b,1/e.r);inj(e.a,e.v/e.r);inj(e.b,-e.v/e.r);}
   else if(e.k==="D"){if(e.on&&!e.dead){var g=1/RD;stampG(e.a,e.b,g);inj(e.a,g*e.vf);inj(e.b,-g*e.vf);}else stampG(e.a,e.b,1e-9);}
  });
  return [A,b];
 }
 var A,b;
 function volt(n){return n===gnd?0:V[idx[n]];}
 var burnLoop,it;
 for(burnLoop=0;burnLoop<6;burnLoop++){
  for(it=0;it<30;it++){
   var ab=build();V=N?solve(ab[0],ab[1]):[];
   var changed=false;
   diodes.forEach(function(d){
    var vak=volt(d.a)-volt(d.b);
    if(!d.on&&!d.dead&&vak>d.vf+1e-6){d.on=true;changed=true;}
    else if(d.on){var cur=(vak-d.vf)/RD;if(cur<0){d.on=false;changed=true;}}
   });
   trans.forEach(function(q){var vb=volt(q.bn),ve=volt(q.en),vc=volt(q.cn),vbe=vb-ve;
    if(!q.beOn&&vbe>0.7+1e-6){q.beOn=true;changed=true;}
    else if(q.beOn){var ib=(vbe-0.7)/RDQ;if(ib<0){q.beOn=false;q.sat=false;changed=true;}
     else{var vce=vc-ve;if(!q.sat&&vce<0.2-1e-6){q.sat=true;changed=true;}else if(q.sat){var ic=vce-0.2;if(ic>BETA*ib+1e-9){q.sat=false;changed=true;}}}}
   });
   if(!changed)break;
  }
  var again=false;
  diodes.forEach(function(d){
   if(d.on&&!d.dead){var cur=(volt(d.a)-volt(d.b)-d.vf)/RD;if(cur>ILED_MAX){d.dead=true;d.on=false;d.c.burned=true;again=true;}}
  });
  elems.forEach(function(e){if(e.k==="R"&&!e.c.burned){var vv=volt(e.a)-volt(e.b);if(vv*vv/Math.max(e.r,0.01)>RATED_W*2){e.c.burned=true;e.dead=true;again=true;}}});
  if(!again)break;
  // burnt resistor => open circuit
  elems.forEach(function(e){if(e.k==="R"&&e.c.burned&&e.c.type==="resistor"){e.r=1e12;}});
 }
 names.forEach(function(n){res.nodeV[n]=volt(n);});
 res.nodeV[gnd]=0;
 elems.forEach(function(e){
  var c=e.c,o=res.comp[c.id]||(res.comp[c.id]={i:0,v:0,p:0,lit:0,burned:!!c.burned});
  var va=e.k==="Q"?0:volt(e.a),vb=e.k==="Q"?0:volt(e.b);
  if(e.k==="R"){var cur=(va-vb)/Math.max(e.r,0.01);if(c.type==="pot"&&e.sub==="wb"){o.i2=cur;o.v2=va-vb;}else{o.i=cur;o.v=va-vb;o.p=cur*cur*e.r;}}
  else if(e.k==="D"){o.v=va-vb;o.i=e.on&&!e.dead?(va-vb-e.vf)/RD:0;o.lit=Math.min(1,Math.max(0,o.i/0.02));o.burned=!!c.burned;}
  else if(e.k==="Q"){var vbe2=volt(e.bn)-volt(e.en),ib2=e.beOn?Math.max(0,(vbe2-0.7)/RDQ):0,vce2=volt(e.cn)-volt(e.en);o.ib=ib2;o.i=e.beOn?(e.sat?Math.max(0,vce2-0.2):BETA*ib2):0;o.v=vce2;o.state=!e.beOn?"off":(e.sat?"saturated (fully on)":"amplifying");}
  else if(e.k==="B"){o.v=va-vb;o.i=(e.v-(va-vb))/e.r;if(o.i>IBAT_SHORT){res.short=true;}}
 });
 comps.forEach(function(c){if(!res.comp[c.id])res.comp[c.id]={i:0,v:0,p:0,lit:0,burned:!!c.burned};if(c.burned)res.burned.push(c.id);});
 res.volt=function(h){var n=nodeOf(h);return n===gnd?0:(res.nodeV[n]!==undefined?res.nodeV[n]:0);};
 return res;
}
function pristine(comps){return comps.map(function(c){return JSON.parse(JSON.stringify(c));});}
function clean(comps){var cc=pristine(comps);cc.forEach(function(c){c.burned=false;});return cc;}
// ---- challenges ----
function leds(comps){return comps.filter(function(c){return c.type==="led";});}
function count(comps,t){return comps.filter(function(c){return c.type===t;}).length;}
var CHALLENGES=[
 {id:"safe",name:"1 Light an LED",goal:"Light a <b>red LED</b> from the battery so it glows <b>safely</b> (8–22 mA). An LED has almost no resistance of its own, so what must go in series with it?",hint:"Resistor needed: R = (battery volts − LED volts) ÷ current. For 5V, a red LED (2V) and 15 mA: (5 − 2) ÷ 0.015 = 200 Ω. Pick the next standard value up: 220 Ω.",
  check:function(comps){var s=simulate(clean(comps));var L=leds(comps);
   if(!count(comps,"battery"))return "Add a battery first.";if(!L.length)return "Add an LED.";
   if(s.short)return "Short circuit! Current is far too high. Check your wires.";
   var l=L[0],o=s.comp[l.id];if(o.burned)return "💥 The LED burnt out! It drew too much current. Add (or increase) a resistor in series.";
   if(o.i<0.008)return o.i<0.0002?"The LED is dark. Check that the circuit is a complete loop and the LED is the right way round (long leg = anode +).":"The LED is very dim ("+(o.i*1000).toFixed(1)+" mA). Try a smaller resistor.";
   if(o.i>0.022)return "It lights, but "+(o.i*1000).toFixed(1)+" mA is more than the safe 22 mA. Use a bigger resistor.";
   if(!count(comps,"resistor"))return "It lights but without a resistor it is unsafe. Add one.";
   return true;}},
 {id:"switch",name:"2 Add a switch",goal:"Make the LED light <b>only while the switch is closed</b> (pressed).",hint:"A switch is a gap you can close. Put it in series, in the same loop as the LED and resistor.",
  check:function(comps){if(!count(comps,"switch"))return "Add a switch to your circuit.";
   var sw=comps.filter(function(c){return c.type==="switch";})[0];var L=leds(comps);if(!L.length)return "Add an LED.";
   var a=simulate(clean(comps),(function(){var o={};o[sw.id]={closed:true};return o;})()),b=simulate(clean(comps),(function(){var o={};o[sw.id]={closed:false};return o;})());
   var l=L[0];if(a.comp[l.id].burned)return "💥 The LED burnt out with the switch closed. Add a series resistor.";
   if(a.comp[l.id].i<0.005)return "With the switch closed the LED is dark. Is it in the same loop as the battery?";
   if(b.comp[l.id].i>0.0005)return "The LED still lights when the switch is open. The switch must be in series with the LED.";
   return true;}},
 {id:"two",name:"3 Two LEDs, one resistor",goal:"Use a <b>9V battery</b> to light <b>two LEDs</b> (each 8–22 mA) with just <b>one resistor</b>.",hint:"Two LEDs in series add their voltages: 2V + 2V = 4V. The resistor drops the rest: (9 − 4) ÷ 0.015 ≈ 330 Ω.",
  check:function(comps){var bt=comps.filter(function(c){return c.type==="battery";})[0];if(!bt||bt.value!==9)return "Use the 9V battery.";
   var L=leds(comps);if(L.length<2)return "Add two LEDs.";if(count(comps,"resistor")!==1)return "Use exactly one resistor.";
   var s=simulate(clean(comps));if(s.short)return "Short circuit! Check your wires.";
   for(var i=0;i<2;i++){var o=s.comp[L[i].id];if(o.burned)return "💥 An LED burnt out. Increase the resistor value.";if(o.i<0.008)return "LED "+(i+1)+" is too dim or dark ("+(o.i*1000).toFixed(1)+" mA). Put the LEDs in series, one after the other.";if(o.i>0.022)return "LED "+(i+1)+" gets "+(o.i*1000).toFixed(1)+" mA: too much. Use a bigger resistor.";}
   return true;}},
 {id:"dimmer",name:"4 LED dimmer",goal:"Build a <b>dimmer</b>: a potentiometer (variable resistor) that changes the LED brightness. It must never burn the LED at any knob position.",hint:"Use the pot's outer pin and wiper as a variable resistor in series with the LED. Keep a fixed resistor too, so the LED is safe when the pot is at 0 Ω.",
  check:function(comps){var p=comps.filter(function(c){return c.type==="pot";})[0];if(!p)return "Add a potentiometer.";var L=leds(comps);if(!L.length)return "Add an LED.";
   var cur=[];for(var k=0;k<=4;k++){var o={};o[p.id]={pos:k/4};var s=simulate(clean(comps),o);var lo=s.comp[L[0].id];if(lo.burned)return "💥 The LED burns when the knob is at "+(k*25)+"%. Add a fixed series resistor.";cur.push(lo.i);}
   var mx=Math.max.apply(null,cur),mn=Math.min.apply(null,cur);if(mx<0.004)return "The LED never lights. Check the loop.";if(mx-mn<0.003)return "Turning the knob barely changes the brightness. Wire the pot in series with the LED.";
   return true;}},
 {id:"divider",name:"5 Voltage divider",goal:"With a <b>5V battery</b> and <b>two resistors</b>, make a point in the circuit that sits at <b>2.5 V</b>. Prove it with the voltmeter.",hint:"Two equal resistors in series split the voltage evenly: V_out = 5 × R2 ÷ (R1 + R2). Measure between the middle point and the battery −.",
  check:function(comps){var bt=comps.filter(function(c){return c.type==="battery";})[0];if(!bt||bt.value!==5)return "Use the 5V battery.";if(count(comps,"resistor")<2)return "Add two resistors.";
   var s=simulate(clean(comps));if(s.short)return "Short circuit!";
   var found=false;Object.keys(s.nodeV).forEach(function(n){if(Math.abs(s.nodeV[n]-2.5)<0.15)found=true;});
   return found?true:"No point sits at 2.5 V. Use two equal resistors in series and measure the middle.";}},
 {id:"ldr",name:"6 Light sensor",goal:"Build a <b>light sensor</b>: a circuit whose output voltage changes by <b>at least 1 V</b> between bright light and darkness. Use the LDR (light-dependent resistor) and a 5V battery. Change the light with the LDR's slider. <b>Finishing this unlocks mission 11 for the robot.</b>",hint:"An LDR's resistance falls in bright light. Put it in series with a fixed resistor (a voltage divider) and measure the voltage at the middle point.",
  check:function(comps){var bt=comps.filter(function(c){return c.type==="battery";})[0];if(!bt||bt.value!==5)return "Use the 5V battery.";var ls=comps.filter(function(c){return c.type==="ldr";});if(!ls.length)return "Add an LDR.";if(count(comps,"resistor")<1)return "Add a fixed resistor to form a voltage divider.";
   var o1={},o0={};ls.forEach(function(l){o1[l.id]={light:1};o0[l.id]={light:0};});
   var br=simulate(clean(comps),o1),dk=simulate(clean(comps),o0),best=0;
   Object.keys(br.nodeV).forEach(function(n){if(dk.nodeV[n]!==undefined)best=Math.max(best,Math.abs(br.nodeV[n]-dk.nodeV[n]));});
   return best>=1?true:"The output only changes by "+best.toFixed(2)+" V between bright and dark. Make the LDR and the fixed resistor form a divider, with the output between them.";}},
 {id:"ntc",name:"7 Thermometer",goal:"Build a <b>temperature sensor</b> with the thermistor: a circuit whose output voltage changes by <b>at least 0.8 V</b> between 10°C and 60°C. Use the thermistor's slider to change the temperature.",hint:"A thermistor's resistance falls as it heats. Pair it with a fixed resistor of about 10 kΩ as a voltage divider and measure the middle point.",
  check:function(comps){var bt=comps.filter(function(c){return c.type==="battery";})[0];if(!bt||bt.value!==5)return "Use the 5V battery.";var ts=comps.filter(function(c){return c.type==="ntc";});if(!ts.length)return "Add a thermistor.";if(count(comps,"resistor")<1)return "Add a fixed resistor to form a voltage divider.";
   var oc={},oh={};ts.forEach(function(t){oc[t.id]={temp:10};oh[t.id]={temp:60};});
   var c=simulate(clean(comps),oc),h=simulate(clean(comps),oh),best=0;
   Object.keys(c.nodeV).forEach(function(n){if(h.nodeV[n]!==undefined)best=Math.max(best,Math.abs(c.nodeV[n]-h.nodeV[n]));});
   return best>=0.8?true:"The output only changes by "+best.toFixed(2)+" V between 10°C and 60°C. Build a divider with a fixed resistor near 10 kΩ.";}},
 {id:"night",name:"8 Night light",goal:"Build an <b>automatic night light</b>: the LED must be <b>off in bright light</b> and <b>on (6–22 mA) in the dark</b>. Use the LDR, an NPN transistor as a switch, a resistor and an LED on 5V.",hint:"A transistor lets a tiny base current switch a bigger LED current. In the dark the LDR resistance is high, so put it from base to ground and a fixed resistor from + to base: dark → base rises → LED on. Do not forget a resistor in series with the LED.",
  check:function(comps){var bt=comps.filter(function(c){return c.type==="battery";})[0];if(!bt||bt.value!==5)return "Use the 5V battery.";
   var ls=comps.filter(function(c){return c.type==="ldr";}),L=leds(comps);if(!ls.length)return "Add an LDR.";if(!count(comps,"npn"))return "Add an NPN transistor.";if(!L.length)return "Add an LED.";
   var o1={},o0={};ls.forEach(function(l){o1[l.id]={light:1};o0[l.id]={light:0};});
   var br=simulate(clean(comps),o1),dk=simulate(clean(comps),o0),lb=br.comp[L[0].id],ld=dk.comp[L[0].id];
   if(ld.burned)return "💥 The LED burns in the dark. Put a resistor in series with the LED.";
   if(ld.i<0.006)return "In the dark the LED is too dim or off ("+(ld.i*1000).toFixed(1)+" mA). Check that the dark LDR pushes the base above 0.7 V.";
   if(ld.i>0.022)return "In the dark the LED gets "+(ld.i*1000).toFixed(1)+" mA: add or increase its series resistor.";
   if(lb.i>0.001)return "The LED still glows in bright light ("+(lb.i*1000).toFixed(1)+" mA). The LDR should pull the base to ground when it is bright.";
   return true;}}
];
function sensorFrom(comps){var ls=comps.filter(function(c){return c.type==="ldr";});if(!ls.length)return null;
 function ov(l){var o={};ls.forEach(function(c){o[c.id]={light:l};});return o;}
 var best=null,bs=0;ls.forEach(function(c){c.holes.forEach(function(h){try{var a=simulate(comps,ov(0.9)).volt(h),b=simulate(comps,ov(0.08)).volt(h),sw=Math.abs(a-b);if(sw>bs){bs=sw;best=h;}}catch(e){}});});
 if(!best)return null;var H=best;return function(light){return simulate(comps,ov(light)).volt(H);};}
return {sensorFrom:sensorFrom,ldrR:ldrR,ntcR:ntcR,LEDS:LEDS,RES:RES,BATT:BATT,CHALLENGES:CHALLENGES,holeNode:holeNode,validHole:validHole,simulate:simulate,clean:clean,fmtR:fmtR,bands:bands,POT_TOTAL:POT_TOTAL,RD:RD};
})();
if(typeof module!=="undefined")module.exports=Circuit;
