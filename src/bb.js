(function(){
"use strict";
var X=Circuit,$=function(id){return document.getElementById(id);};
var PITCH=17.5,X0=44,RAILY={tp:34,tn:48,bp:304,bn:318},ROWY={a:86,b:103.5,c:121,d:138.5,e:156,f:196,g:213.5,h:231,i:248.5,j:266};
var comps=[],nid=1,pending=null,selected=null,meter=null,mreading="",chIdx=0,done={},sim=null;
var mode="basic",store={basic:[],mcu:null,esp:null},progs={mcu:[],esp:[]},prog=[],run=null,timer=null,lastT=0,OFFY=0,UNO={x:8,y:6,s:1.55},UPS={},CH=X.CHALLENGES;
function PRE(){return curBoard()==="esp32"?"GPIO":"D";}
function isM(){return mode!=="basic";}
function curBoard(){return mode==="esp"?"esp32":"uno";}
function unoPins(){var bd=curBoard();if(UPS[bd])return UPS[bd];var u=UPS[bd]={},d=PIC.part(bd==="esp32"?"esp32":"uno",false),re=bd==="esp32"?/^(GPIO\d+|5V|3V3|GND)$/:/^(D\d+|A\d|5V|3V3|GND)$/;Object.keys(d.pins).forEach(function(n){if(!re.test(n))return;var nm=n.replace(/^GPIO/,"G");u[nm]=d.pins[n].map(function(q){return [UNO.x+q[0]*UNO.s,UNO.y+q[1]*UNO.s];});});return u;}
var WIRECOL=["#e53935","#fb8c00","#43a047","#1e88e5","#8e24aa","#00acc1","#6d4c41","#546e7a"];
function pos(h){
 if(/^U:/.test(h)){var a=unoPins()[h.slice(2)];return a?a[0]:[0,0];}
 var m=/^(tp|tn|bp|bn)(\d+)$/.exec(h);if(m)return [X0+(+m[2]-1)*PITCH,RAILY[m[1]]+OFFY];
 m=/^([a-j])(\d+)$/.exec(h);return [X0+(+m[2]-1)*PITCH,ROWY[m[1]]+OFFY];
}
function occ(){var o={};comps.forEach(function(c){if(c.type==="uno")return;c.holes.forEach(function(h){if(!/^U:/.test(h))o[h]=c.id;});});return o;}
function cname(c){
 switch(c.type){case "battery":return X.BATT[c.value].name;case "resistor":return "Resistor "+X.fmtR(c.value);case "led":return c.color+" LED";case "switch":return "Push switch ("+(c.closed?"closed":"open")+")";case "pot":return "Potentiometer 10kΩ";case "wire":return "Jumper wire";case "ldr":return "Light sensor (LDR) · light "+Math.round(c.light*100)+"%";case "ntc":return "Thermistor 10kΩ NTC · "+Math.round(c.temp)+"°C";case "npn":return "NPN transistor (C, B, E)";case "hcsr04":return "HC-SR04 distance sensor · object at "+c.dist+" cm";case "servo":return "Servo motor";case "uno":return "Arduino Uno";}return c.type;
}
var LABELS={battery:["+ lead (red)","− lead (black)"],resistor:["leg 1","leg 2"],led:["anode + (long leg)","cathode − (short leg)"],switch:["terminal 1","terminal 2"],pot:["end A","wiper (middle pin)","end B"],wire:["end 1","end 2"],ldr:["leg 1","leg 2"],ntc:["leg 1","leg 2"],npn:["collector (C)","base (B)","emitter (E)"],hcsr04:["VCC","TRIG","ECHO","GND"],servo:["GND (brown)","VCC (red)","signal (orange)"]};
function recompute(){if(run&&isM())sim=MCU.finish(run,comps,{});else sim=X.simulate(comps);}
// ---------- drawing ----------
function legLine(a,b,col){return "<line x1='"+a[0]+"' y1='"+(a[1]+1.4)+"' x2='"+b[0]+"' y2='"+(b[1]+1.4)+"' stroke='rgba(0,0,0,.28)' stroke-width='2.6' stroke-linecap='round'/><line x1='"+a[0]+"' y1='"+a[1]+"' x2='"+b[0]+"' y2='"+b[1]+"' stroke='"+(col||"url(#mmMetal)")+"' stroke-width='2.1' stroke-linecap='round'/><circle cx='"+a[0]+"' cy='"+a[1]+"' r='2.6' fill='#9ca3af'/>";}
var DEFS="<defs><linearGradient id='mmBoard' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#f6f3ea'/><stop offset='1' stop-color='#d9d4c0'/></linearGradient><linearGradient id='mmMetal' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#f1f5f9'/><stop offset='.5' stop-color='#9aa3ad'/><stop offset='1' stop-color='#d8dee4'/></linearGradient><linearGradient id='mmRes' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#f3e6bd'/><stop offset='.45' stop-color='#dcc58b'/><stop offset='1' stop-color='#a98d52'/></linearGradient><linearGradient id='mmBlk' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#4b5563'/><stop offset='1' stop-color='#111827'/></linearGradient><linearGradient id='mmBlue' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#60a5fa'/><stop offset='1' stop-color='#1e3a8a'/></linearGradient><radialGradient id='mmKnob' cx='.35' cy='.3' r='.8'><stop offset='0' stop-color='#fff'/><stop offset='1' stop-color='#9ca3af'/></radialGradient><radialGradient id='mmHole' cx='.5' cy='.45' r='.6'><stop offset='0' stop-color='#111'/><stop offset='1' stop-color='#4a4a44'/></radialGradient><filter id='mmSh' x='-20%' y='-20%' width='140%' height='150%'><feDropShadow dx='0' dy='2' stdDeviation='2' flood-opacity='.35'/></filter><filter id='mmBlur'><feGaussianBlur stdDeviation='5'/></filter></defs>";
function drawComp(c){
 if(c.type==="uno")return "";
 var P=c.holes.map(pos),o=sim&&sim.comp[c.id]||{i:0,lit:0,burned:false},s="",sel=selected===c.id;
 var mx=(P[0][0]+P[P.length-1][0])/2,my=(P[0][1]+P[P.length-1][1])/2,hx=mx,hy=my;
 if(c.type==="wire"){
  var dx=P[1][0]-P[0][0],dy=P[1][1]-P[0][1],len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len,bow=Math.min(30,len*0.25+8),cx=mx+nx*bow*-1,cy=my+ny*bow*-1;if(cy>my&&P[0][1]>150)cy=my+bow;
  var wd="M"+P[0][0]+" "+P[0][1]+" Q"+cx+" "+cy+" "+P[1][0]+" "+P[1][1];
  s+="<path d='"+wd+"' transform='translate(0 2)' stroke='rgba(0,0,0,.25)' stroke-width='5' fill='none' stroke-linecap='round'/><path d='"+wd+"' stroke='"+WIRECOL[c.id%WIRECOL.length]+"' stroke-width='4' fill='none' stroke-linecap='round'/><path d='"+wd+"' stroke='rgba(255,255,255,.45)' stroke-width='1' fill='none' stroke-linecap='round' transform='translate(0 -1)'/><rect x='"+(P[0][0]-2.5)+"' y='"+(P[0][1]-2.5)+"' width='5' height='5' rx='1' fill='#cbd5e1'/><rect x='"+(P[1][0]-2.5)+"' y='"+(P[1][1]-2.5)+"' width='5' height='5' rx='1' fill='#cbd5e1'/>";
  hx=(P[0][0]+2*cx+P[1][0])/4;hy=(P[0][1]+2*cy+P[1][1])/4;
 }else if(c.type==="battery"){
  var top=Math.min(P[0][1],P[1][1]),by=top<100?top-24:top-22;if(by<2)by=2;var bx=mx;
  s+="<line x1='"+P[0][0]+"' y1='"+P[0][1]+"' x2='"+(bx-14)+"' y2='"+(by+18)+"' stroke='#e53935' stroke-width='2.6'/><line x1='"+P[1][0]+"' y1='"+P[1][1]+"' x2='"+(bx+14)+"' y2='"+(by+18)+"' stroke='#222' stroke-width='2.6'/>";
  s+="<g filter='url(#mmSh)'><rect x='"+(bx-30)+"' y='"+by+"' width='60' height='20' rx='4' fill='url(#mmBlk)' stroke='#f59e0b' stroke-width='1.5'/><rect x='"+(bx-30)+"' y='"+by+"' width='60' height='6' rx='3' fill='rgba(255,255,255,.18)'/><circle cx='"+(bx-14)+"' cy='"+(by+18)+"' r='2.4' fill='#e53935'/><circle cx='"+(bx+14)+"' cy='"+(by+18)+"' r='2.4' fill='#9ca3af'/></g><text x='"+bx+"' y='"+(by+14)+"' font-size='10' fill='#fde68a' text-anchor='middle' font-weight='bold'>+ "+c.value+"V −</text>";
  hx=bx;hy=by+10;
 }else{
  var dx2=P[P.length-1][0]-P[0][0],dy2=P[P.length-1][1]-P[0][1],len2=Math.hypot(dx2,dy2),ang=Math.atan2(dy2,dx2)*180/Math.PI;
  if(c.type==="resistor"){
   var sc=Math.min(1,len2/40),b3=X.bands(c.value);
   s+=P.map(function(p,k){return legLine(p,[mx,my]);}).join("");
   s+="<g transform='translate("+mx+" "+my+") rotate("+ang+") scale("+sc+")' filter='url(#mmSh)'><path d='M-17 -5 Q-17 -8.5 -13 -8.5 L-11 -8.5 Q-9 -4.6 -4 -4.6 L4 -4.6 Q9 -4.6 11 -8.5 L13 -8.5 Q17 -8.5 17 -5 L17 5 Q17 8.5 13 8.5 L11 8.5 Q9 4.6 4 4.6 L-4 4.6 Q-9 4.6 -11 8.5 L-13 8.5 Q-17 8.5 -17 5 Z' fill='url(#mmRes)' stroke='#8a7a52' stroke-width='.8'/><rect x='-9' y='-4.6' width='3.4' height='9.2' fill='"+b3[0]+"'/><rect x='-3.5' y='-4.6' width='3.4' height='9.2' fill='"+b3[1]+"'/><rect x='2' y='-4.6' width='3.4' height='9.2' fill='"+b3[2]+"'/><rect x='8.5' y='-4.6' width='2.8' height='9.2' fill='#d4af37'/><rect x='-8' y='-4' width='16' height='1.8' rx='1.1' fill='rgba(255,255,255,.5)'/></g>";
   if(o.burned)s+="<text x='"+mx+"' y='"+(my-10)+"' font-size='14' text-anchor='middle'>💥</text>";
  }else if(c.type==="led"){
   var col=X.LEDS[c.color].col,lit=o.lit||0;
   s+=legLine(P[0],[mx,my])+legLine(P[1],[mx,my]);
   if(lit>0)s+="<circle cx='"+mx+"' cy='"+(my-4)+"' r='"+(14+lit*20)+"' fill='"+col+"' opacity='"+(0.2+lit*0.5)+"' filter='url(#mmBlur)'/>";
   var bc=o.burned?"#222":col,fo=o.burned?1:0.5+lit*0.5,lx=Math.min(P[0][0],P[1][0]),rx2=Math.max(P[0][0],P[1][0]),ml=P[0][0]<=P[1][0];
   s+="<g filter='url(#mmSh)'><path d='M"+(mx-9)+" "+(my+7)+" L"+(mx-9)+" "+(my-12)+" A9 11 0 0 1 "+(mx+9)+" "+(my-12)+" L"+(mx+9)+" "+(my+7)+" Z' fill='"+bc+"' fill-opacity='"+fo+"' stroke='"+col+"' stroke-opacity='.8' stroke-width='1'/><rect x='"+(mx-11)+"' y='"+(my+6)+"' width='22' height='4.4' rx='1' fill='#fff' fill-opacity='.55' stroke='"+col+"' stroke-width='.8'/></g><path d='M"+(mx-4.5)+" "+(my+6)+" L"+(mx-4.5)+" "+(my-3)+" L"+(mx-7)+" "+(my-8)+" M"+(mx+4.5)+" "+(my+6)+" L"+(mx+4.5)+" "+(my-6)+"' stroke='rgba(70,70,70,.55)' fill='none' stroke-width='1.8' stroke-linejoin='round'/><path d='M"+(mx-6.5)+" "+(my-9)+" Q"+(mx-6.5)+" "+(my-14)+" "+(mx-2)+" "+(my-15)+"' stroke='rgba(255,255,255,.85)' fill='none' stroke-width='1.6' stroke-linecap='round'/><text x='"+(mx-5.5)+"' y='"+(my+9.4)+"' font-size='4.5' fill='#555' text-anchor='middle'>"+(ml?"+":"−")+"</text><text x='"+(mx+5.5)+"' y='"+(my+9.4)+"' font-size='4.5' fill='#555' text-anchor='middle'>"+(ml?"−":"+")+"</text>";
   s+="<text x='"+(P[0][0]+(P[0][0]<=P[1][0]?-7:7))+"' y='"+(P[0][1]-6)+"' font-size='10' fill='#b91c1c' font-weight='bold' text-anchor='middle'>+</text>";
   if(o.burned)s+="<text x='"+mx+"' y='"+(my+4)+"' font-size='12' fill='#fff' text-anchor='middle'>×</text>";
  }else if(c.type==="ldr"){
   s+=legLine(P[0],[mx,my])+legLine(P[1],[mx,my]);
   s+="<g filter='url(#mmSh)'><circle cx='"+mx+"' cy='"+my+"' r='10' fill='#d99a1c' stroke='#7a4f00' stroke-width='1.3'/><circle cx='"+mx+"' cy='"+my+"' r='7.6' fill='#e8b04a'/></g><path d='M"+(mx-6)+" "+(my-4)+" h12 M"+(mx-6)+" "+(my-4)+" v3 h12 v3 h-12 v3 h12' stroke='#5b3a00' fill='none' stroke-width='1.3'/><text x='"+(mx+1)+"' y='"+(my-14)+"' font-size='11' text-anchor='middle' opacity='"+(0.3+0.7*c.light)+"'>☀</text>";
  }else if(c.type==="ntc"){
   s+=legLine(P[0],[mx,my])+legLine(P[1],[mx,my]);
   s+="<g filter='url(#mmSh)'><path d='M"+(mx-6)+" "+(my+5)+" Q"+(mx-8)+" "+(my-9)+" "+mx+" "+(my-9)+" Q"+(mx+8)+" "+(my-9)+" "+(mx+6)+" "+(my+5)+" Z' fill='#1f2937' stroke='#0b1220'/></g><ellipse cx='"+(mx-2.5)+"' cy='"+(my-4)+"' rx='1.8' ry='3' fill='rgba(255,255,255,.45)'/><text x='"+mx+"' y='"+(my+3)+"' font-size='7' fill='#d1d5db' text-anchor='middle'>t°</text>";
  }else if(c.type==="npn"){
   var qx=(P[0][0]+P[1][0]+P[2][0])/3,qy=(P[0][1]+P[1][1]+P[2][1])/3;
   s+=P.map(function(p){return legLine(p,[qx,qy]);}).join("");
   var st2=o&&o.state;
   s+="<g filter='url(#mmSh)'><path d='M"+(qx-11)+" "+(qy+9)+" L"+(qx-11)+" "+(qy-3)+" A11 11 0 0 1 "+(qx+11)+" "+(qy-3)+" L"+(qx+11)+" "+(qy+9)+" Z' fill='url(#mmBlk)' stroke='"+(st2&&st2!=="off"?"#4ade80":"#6b7280")+"' stroke-width='1.4'/></g><path d='M"+(qx-8)+" "+(qy-4)+" A8 8 0 0 1 "+qx+" "+(qy-10)+"' stroke='rgba(255,255,255,.35)' fill='none' stroke-width='1.6'/><text x='"+qx+"' y='"+(qy+5)+"' font-size='6.5' fill='#d1d5db' text-anchor='middle'>2N2222</text>";
   hx=qx;hy=qy;
  }else if(c.type==="switch"){
   s+=legLine(P[0],[mx,my])+legLine(P[1],[mx,my]);
   s+="<g filter='url(#mmSh)'><rect x='"+(mx-10)+"' y='"+(my-10)+"' width='20' height='20' rx='3' fill='url(#mmBlk)' stroke='"+(c.closed?"#4ade80":"#9ca3af")+"' stroke-width='1.6'/></g><circle cx='"+mx+"' cy='"+(my+(c.closed?1.5:0))+"' r='6.4' fill='"+(c.closed?"#16a34a":"#d1d5db")+"' stroke='#374151'/><circle cx='"+(mx-2)+"' cy='"+(my-2+(c.closed?1.5:0))+"' r='2' fill='rgba(255,255,255,.7)'/>";
  }else if(c.type==="pot"){
   var ex=(P[0][0]+P[2][0])/2,ey=(P[0][1]+P[2][1])/2;
   s+=P.map(function(p){return legLine(p,[ex,ey]);}).join("");
   var kang=-135+270*c.pos;
   s+="<g filter='url(#mmSh)'><circle cx='"+ex+"' cy='"+ey+"' r='15' fill='#374151' stroke='#9ca3af' stroke-width='1.5'/><circle cx='"+ex+"' cy='"+ey+"' r='12' fill='url(#mmKnob)'/></g><g transform='translate("+ex+" "+ey+") rotate("+kang+")'><rect x='-9' y='-2.2' width='18' height='4.4' rx='1.5' fill='#111827'/><rect x='-2.2' y='-9' width='4.4' height='18' rx='1.5' fill='#111827'/></g>";
   hx=ex;hy=ey;
  }
  if(c.type==="hcsr04"){
   var topy=Math.min.apply(null,P.map(function(p){return p[1];})),us=PIC.part("us",false),ox=mx-45,oy=topy-56,pw=!sim||!sim.comp[c.id]||sim.comp[c.id].on;
   s+=P.map(function(p,k){return legLine(p,[ox+(36+k*8+4)*0.87,oy+56*0.87]);}).join("")+"<g transform='translate("+ox+" "+oy+") scale(.87)' filter='url(#mmSh)'>"+us.svg+"</g>"+(pw?"":"<text x='"+mx+"' y='"+(oy+52)+"' font-size='9' fill='#fca5a5' text-anchor='middle' font-weight='bold'>NO POWER</text>")+"<text x='"+mx+"' y='"+(oy-3)+"' font-size='9' fill='#cbd5e1' text-anchor='middle'>"+c.dist+" cm</text>";
   hx=mx;hy=oy+25;
  }else if(c.type==="servo"){
   var ty=Math.min.apply(null,P.map(function(p){return p[1];})),oo=sim&&sim.comp[c.id]||{},ang=oo.angle,by=ty-44,sx=mx-8;
   s+=P.map(function(p,k){return legLine(p,[mx-8+k*8,by+34],["#7a4a1c","#d32f2f","#f4a000"][k]);}).join("")+"<g filter='url(#mmSh)'><rect x='"+(mx-27)+"' y='"+by+"' width='54' height='30' rx='3' fill='url(#mmBlue)' stroke='#0f3a80'/><rect x='"+(mx-31)+"' y='"+(by+6)+"' width='6' height='18' rx='1' fill='#1f63c8'/><rect x='"+(mx+25)+"' y='"+(by+6)+"' width='6' height='18' rx='1' fill='#1f63c8'/></g><circle cx='"+(mx-10)+"' cy='"+(by+15)+"' r='7' fill='url(#mmKnob)' stroke='#6b7280'/><g transform='translate("+(mx-10)+" "+(by+15)+") rotate("+(ang===null||ang===undefined?0:ang-90)+")'><rect x='-3' y='-24' width='6' height='26' rx='3' fill='#f4f4f4' stroke='#9ca3af'/><circle cx='0' cy='-20' r='1.2' fill='#9ca3af'/></g><text x='"+(mx+12)+"' y='"+(by+19)+"' font-size='9' fill='#e8f1ff' font-weight='bold' text-anchor='middle'>"+(ang===null||ang===undefined?(oo.on===false?"no power":"–"):ang+"°")+"</text>";
   hx=mx;hy=by+15;
  }
  if(c.type!=="pot"&&c.type!=="npn"&&c.type!=="hcsr04"&&c.type!=="servo"){hx=mx;hy=my;}
 }
 s+="<circle cx='"+hx+"' cy='"+hy+"' r='"+(c.type==="wire"?5:9)+"' fill='rgba(255,255,255,.02)' stroke='"+(sel?"#fbbf24":"transparent")+"' stroke-width='2.5' stroke-dasharray='3 2' data-c='"+c.id+"' style='cursor:pointer'/>";
 return s;
}
function renderBoard(){
 var oc=occ(),s="<svg viewBox='0 0 600 "+(345+OFFY)+"' width='100%' style='min-width:640px;touch-action:manipulation' data-x='1' xmlns='http://www.w3.org/2000/svg' font-family='sans-serif'>"+DEFS+"<g transform='translate(0 "+OFFY+")'>";
 s+="<rect x='8' y='14' width='584' height='322' rx='10' fill='url(#mmBoard)' stroke='#b9b39e' filter='url(#mmSh)'/><rect x='12' y='18' width='576' height='8' rx='4' fill='rgba(255,255,255,.55)'/>";
 s+="<rect x='36' y='172' width='528' height='10' fill='#cfc9b4'/><text x='300' y='181' font-size='7.5' fill='#8a846e' text-anchor='middle'>CENTRE GAP</text>";
 // rail stripes
 [["tp","#e53935",34],["tn","#1e63d6",48],["bp","#e53935",304],["bn","#1e63d6",318]].forEach(function(r){s+="<line x1='36' y1='"+(r[2]-9)+"' x2='564' y2='"+(r[2]-9)+"' stroke='"+r[1]+"' stroke-width='1.2' opacity='.7'/><text x='20' y='"+(r[2]+3)+"' font-size='11' fill='"+r[1]+"' font-weight='bold' text-anchor='middle'>"+(r[0].charAt(1)==="p"?"+":"−")+"</text>";});
 for(var c=1;c<=30;c++){var x=X0+(c-1)*PITCH;if(c===1||c%5===0)s+="<text x='"+x+"' y='76' font-size='8' fill='#8a846e' text-anchor='middle'>"+c+"</text>";}
 "abcdefghij".split("").forEach(function(l){s+="<text x='28' y='"+(ROWY[l]+3)+"' font-size='8.5' fill='#8a846e' text-anchor='middle'>"+l+"</text>";});
 s+="</g>";
 if(isM()){var cs=run?1:0;s+="<g transform='translate("+UNO.x+" "+UNO.y+") scale("+UNO.s+")'>"+PIC.part(curBoard()==="esp32"?"esp32":"uno",false).svg+"</g>";var up=unoPins(),usedU={};comps.forEach(function(cp){cp.holes.forEach(function(h){if(/^U:/.test(h))usedU[h.slice(2)]=1;});});
  Object.keys(up).forEach(function(n){up[n].forEach(function(p){var u=usedU[n],pend=pending&&pending.holes.indexOf("U:"+n)>=0,mt=meter&&meter.holes.indexOf("U:"+n)>=0;if(u||pend||mt)s+="<circle cx='"+p[0]+"' cy='"+p[1]+"' r='4.2' fill='none' stroke='"+(mt?"#7c3aed":pend?"#fbbf24":"#34d399")+"' stroke-width='2'/>";s+="<circle cx='"+p[0]+"' cy='"+p[1]+"' r='6.2' fill='transparent' data-h='U:"+n+"' style='cursor:crosshair'/>";});});
  if(run&&sim){var lv=[];Object.keys(run.out).forEach(function(p){lv.push(PRE()+p+(run.out[p]?"=HIGH":"=LOW"));});Object.keys(run.pwm).forEach(function(p){lv.push(PRE()+p+"~"+run.pwm[p]);});s+="<text x='"+(UNO.x+4)+"' y='"+(OFFY-14)+"' font-size='9' fill='#86efac'>▶ running · "+(lv.join("  ")||"no outputs yet")+"</text>";}}
 // holes
 function hole(h,p){var used=oc[h]!==undefined,pend=pending&&pending.holes.indexOf(h)>=0,mt=meter&&meter.holes.indexOf(h)>=0;
  return "<rect x='"+(p[0]-3.6)+"' y='"+(p[1]-3.6)+"' width='7.2' height='7.2' rx='1.6' fill='"+(mt?"#7c3aed":pend?"#fbbf24":used?"#555":"url(#mmHole)")+"' stroke='rgba(0,0,0,.25)' stroke-width='.6'/><circle cx='"+p[0]+"' cy='"+p[1]+"' r='8.2' fill='transparent' data-h='"+h+"' style='cursor:crosshair'/>";}
 ["tp","tn","bp","bn"].forEach(function(r){for(var c=1;c<=30;c++){if(c%6===0)continue;var h=r+c;s+=hole(h,pos(h));}});
 "abcdefghij".split("").forEach(function(l){for(var c=1;c<=30;c++){var h=l+c;s+=hole(h,pos(h));}});
 comps.forEach(function(cp){s+=drawComp(cp);});
 s+="</svg>";
 $("bbBoard").innerHTML=s;
 if(hook)hook.refresh();
}
function render(){renderBoard();renderRead();renderSel();}
function renderRead(){
 var el=$("bbRead"),h="";
 if(!sim||!comps.filter(function(c){return c.type!=="uno";}).length){el.innerHTML="<div class='note'>"+(isM()?"Plug parts into the breadboard, then use jumper wires to reach the Arduino pins (tap a pin on the board, then a breadboard hole).":"Add a battery and a few parts. The circuit is simulated live.")+"</div>";return;}
 if(sim.noBattery)h+="<div class='vwarn'>⚠ No battery yet: nothing can flow.</div>";
 if(sim.notes&&sim.notes.length)h+="<div class='vwarn'>⚠ "+sim.notes.filter(function(x,i,a){return a.indexOf(x)===i;}).join("; ")+"</div>";
 if(sim.short)h+="<div class='verr'>✖ SHORT CIRCUIT: the battery is delivering far too much current and would overheat. Check for a wire joining + to − with nothing in between.</div>";
 comps.forEach(function(c){var o=sim.comp[c.id];if(!o)return;var t="";
  if(c.type==="led")t=o.burned?"<span class='verr'>💥 BURNT OUT (too much current)</span>":(o.i>0.0002?(o.i*1000).toFixed(1)+" mA · "+(o.lit>0.95?"bright":o.lit>0.4?"glowing":"dim")+(o.i>0.022?" <span class='vwarn'>⚠ above 22 mA</span>":""):"dark (0 mA)");
  else if(c.type==="resistor")t=o.burned?"<span class='verr'>💥 overheated</span>":Math.abs(o.v).toFixed(2)+" V across · "+(Math.abs(o.i)*1000).toFixed(1)+" mA · "+(o.p*1000).toFixed(0)+" mW";
  else if(c.type==="ldr")t="resistance "+X.fmtR(Math.round(X.ldrR(c.light)))+" · "+(Math.abs(o.i)*1000).toFixed(2)+" mA";
  else if(c.type==="ntc")t="resistance "+X.fmtR(Math.round(X.ntcR(c.temp)))+" · "+(Math.abs(o.i)*1000).toFixed(2)+" mA";
  else if(c.type==="npn")t=o.state+" · base "+(o.ib*1000).toFixed(2)+" mA → collector "+(o.i*1000).toFixed(1)+" mA";
  else if(c.type==="battery")t=(o.i*1000).toFixed(1)+" mA supplied · terminals "+o.v.toFixed(2)+" V";
  else if(c.type==="pot")t=Math.abs(o.i*1000).toFixed(1)+" mA through top part · knob "+Math.round(c.pos*100)+"%";
  else if(c.type==="switch")t=c.closed?"closed: current can pass":"open: gap in the circuit";
  else if(c.type==="hcsr04")t=(o.on===false?"<span class='vwarn'>no power: connect VCC to 5V and GND to GND</span>":"powered")+" · object at "+c.dist+" cm";
  else if(c.type==="servo")t=o.on===false?"<span class='vwarn'>no power: brown → GND, red → 5V</span>":(o.angle===null||o.angle===undefined?"powered, waiting for a signal":"angle "+o.angle+"°");
  if(t)h+="<div class='rl'><b>"+cname(c)+"</b> — "+t+"</div>";});
 if(mreading)h+="<div class='rl mm'>🔎 "+mreading+"</div>";
 el.innerHTML=h||"<div class='note'>Add parts.</div>";
}
function renderSel(){
 var el=$("bbSel");el.innerHTML="";var c=comps.filter(function(x){return x.id===selected;})[0];if(!c){el.style.display="none";return;}el.style.display="block";
 var t=document.createElement("div");t.innerHTML="<b>Selected:</b> "+cname(c);el.appendChild(t);
 var row=document.createElement("div");row.className="row";row.style.marginTop="6px";
 function btn(txt,fn,cls){var b=document.createElement("button");b.textContent=txt;if(cls)b.className=cls;b.onclick=fn;row.appendChild(b);}
 function sel(opts,cur,fn){var s=document.createElement("select");s.className="sm";opts.forEach(function(o){var op=document.createElement("option");op.value=o[0];op.textContent=o[1];if(String(o[0])===String(cur))op.selected=true;s.appendChild(op);});s.onchange=function(){fn(s.value);};row.appendChild(s);}
 if(c.type==="switch")btn(c.closed?"Release (open)":"Press (close)",function(){c.closed=!c.closed;update();},"p");
 if(c.type==="pot"){var r=document.createElement("input");r.type="range";r.min=0;r.max=100;r.value=Math.round(c.pos*100);r.oninput=function(){c.pos=+r.value/100;recompute();renderBoard();renderRead();};row.appendChild(r);}
 function slider(min,max,val,fn){var r=document.createElement("input");r.type="range";r.min=min;r.max=max;r.value=val;r.oninput=function(){fn(+r.value);recompute();renderBoard();renderRead();};row.appendChild(r);}
 if(c.type==="ldr"){var lb=document.createElement("small");lb.textContent="dark ◂ light ▸ bright";row.appendChild(lb);slider(0,100,Math.round(c.light*100),function(v){c.light=v/100;});}
 if(c.type==="ntc"){var tb=document.createElement("small");tb.textContent="0°C ◂ temp ▸ 100°C";row.appendChild(tb);slider(0,100,Math.round(c.temp),function(v){c.temp=v;});}
 if(c.type==="hcsr04"){var db=document.createElement("small");db.textContent="object distance 2 cm ◂ ▸ 200 cm";row.appendChild(db);slider(2,200,c.dist,function(v){c.dist=v;});}
 if(c.type==="resistor")sel(X.RES.map(function(v){return [v,X.fmtR(v)];}),c.value,function(v){c.value=+v;c.burned=false;update();});
 if(c.type==="led")sel(Object.keys(X.LEDS).map(function(k){return [k,k];}),c.color,function(v){c.color=v;c.burned=false;update();});
 if(c.type==="battery")sel([[3,"3V"],[5,"5V"],[9,"9V"]],c.value,function(v){c.value=+v;update();});
 if(c.type!=="uno")btn("Remove",function(){comps=comps.filter(function(x){return x.id!==c.id;});selected=null;update();},"s");
 el.appendChild(row);
}
function update(){recompute();render();}
window.MM_bb={setLight:function(v){var n=0;comps.forEach(function(c){if(c.type==="ldr"){c.light=Math.max(0,Math.min(1,v));n++;}});if(n){recompute();renderBoard();renderRead();}return n;}};
// ---------- interaction ----------
function setPrompt(t){$("bbPrompt").textContent=t||"";$("bbCancel").style.display=(pending||meter)?"inline-block":"none";}
function startPlace(type,opts){
 meter=null;mreading="";selected=null;pending={type:type,opts:opts||{},holes:[]};
 setPrompt("Tap a hole for: "+LABELS[type][0]);render();
}
function finishPlace(){
 var p=pending,c={id:nid++,type:p.type,holes:p.holes.slice()};
 for(var k in p.opts)c[k]=p.opts[k];
 if(c.type==="switch")c.closed=false;if(c.type==="pot")c.pos=0.5;if(c.type==="ldr")c.light=0.6;if(c.type==="ntc")c.temp=25;if(c.type==="hcsr04")c.dist=50;
 comps.push(c);pending=null;selected=c.id;setPrompt("");update();
}
function tapHole(he){
 if(meter){meter.holes.push(he);if(meter.holes.length===2){var a=meter.holes[0],b=meter.holes[1],v=sim?sim.volt(a)-sim.volt(b):0;mreading="Voltage from "+a+" to "+b+": <b>"+v.toFixed(2)+" V</b>";meter.holes=[];setPrompt("Voltmeter: tap two holes to measure the voltage between them.");}else setPrompt("Voltmeter: tap one more hole.");render();return;}
 if(pending){
  var isU=/^U:/.test(he);if(isU&&pending.type!=="wire"){setPrompt("Plug parts into the breadboard. Use a jumper wire to reach the Arduino pins.");return;}
  var o=occ();if(!isU&&(o[he]!==undefined||pending.holes.indexOf(he)>=0)||(isU&&pending.holes.indexOf(he)>=0)){setPrompt("That hole already has a lead. Choose another hole.");return;}
  pending.holes.push(he);var n=LABELS[pending.type].length;
  if(pending.holes.length>=n)finishPlace();else{setPrompt("Tap a hole for: "+LABELS[pending.type][pending.holes.length]);render();}
  return;
 }
 setPrompt("Choose a part first, then tap holes to place it.");
}
function tapComp(id){if(pending||meter)return;selected=selected===id?null:id;render();}
$("bbBoard").addEventListener("click",function(e){
 var t=e.target,ce=t.getAttribute&&t.getAttribute("data-c"),he=t.getAttribute&&t.getAttribute("data-h");
 if(he)return tapHole(he);
 if(ce)tapComp(+ce);
});
var hook=null;
window.BBAPI={comps:function(){return comps;},sim:function(){return sim;},sel:function(){return selected;},pending:function(){return pending;},meter:function(){return meter;},hole:tapHole,comp:tapComp,pos:pos,occ:occ,attach:function(h){hook=h;if(hook)hook.refresh();}};
$("bbCancel").onclick=function(){pending=null;meter=null;setPrompt("");render();};
// tray
function mkBtn(label,fn){var b=document.createElement("button");b.textContent=label;b.onclick=fn;return b;}
function trayRow(title,ctrl,btn){var d=document.createElement("div");d.className="trow";var s=document.createElement("span");s.textContent=title;d.appendChild(s);if(ctrl)d.appendChild(ctrl);d.appendChild(btn);$("bbTray").appendChild(d);return d;}
function selectEl(opts){var s=document.createElement("select");s.className="sm";opts.forEach(function(o){var op=document.createElement("option");op.value=o[0];op.textContent=o[1];s.appendChild(op);});return s;}
(function(){
 var bs=selectEl([[5,"5V USB"],[3,"3V (2×AA)"],[9,"9V block"]]);trayRow("🔋 Battery",bs,mkBtn("+ Add",function(){startPlace("battery",{value:+bs.value});})).dataset.mode="basic";
 var rs=selectEl(X.RES.map(function(v){return [v,X.fmtR(v)];}));rs.value=220;trayRow("▭ Resistor",rs,mkBtn("+ Add",function(){startPlace("resistor",{value:+rs.value});}));
 var ls=selectEl(Object.keys(X.LEDS).map(function(k){return [k,k+" LED"];}));trayRow("💡 LED",ls,mkBtn("+ Add",function(){startPlace("led",{color:ls.value});}));
 trayRow("⏺ Push switch",null,mkBtn("+ Add",function(){startPlace("switch");}));
 trayRow("☀ Light sensor (LDR)",null,mkBtn("+ Add",function(){startPlace("ldr");}));
 trayRow("🌡 Thermistor (NTC)",null,mkBtn("+ Add",function(){startPlace("ntc");}));
 trayRow("🔺 NPN transistor",null,mkBtn("+ Add",function(){startPlace("npn");}));
 trayRow("📏 HC-SR04 distance sensor",null,mkBtn("+ Add",function(){startPlace("hcsr04");})).dataset.mode="mcu";
 trayRow("🦾 Servo motor",null,mkBtn("+ Add",function(){startPlace("servo");})).dataset.mode="mcu";
 trayRow("🎛 Potentiometer 10kΩ",null,mkBtn("+ Add",function(){startPlace("pot");}));
 trayRow("➰ Jumper wire",null,mkBtn("+ Add",function(){startPlace("wire");}));
 trayRow("🔎 Voltmeter",null,mkBtn("Use",function(){pending=null;selected=null;meter={holes:[]};setPrompt("Voltmeter: tap two holes to measure the voltage between them.");render();}));
})();

try{if(/demo=night/.test(location.hash)){var _i=1,_m=function(t,h,o){return Object.assign({id:_i++,type:t,holes:h},o||{});};
 comps=[_m("battery",["tp1","tn1"],{value:5}),_m("wire",["tp2","a5"]),_m("wire",["tn2","e20"]),_m("resistor",["b5","b9"],{value:10000}),_m("ldr",["c9","c12"],{light:0.05}),_m("wire",["d12","d20"]),_m("npn",["a14","a15","a16"]),_m("wire",["b15","b9"]),_m("wire",["c16","c20"]),_m("resistor",["e5","e25"],{value:330}),_m("led",["d25","d14"],{color:"red"}),_m("switch",["f5","f8"]),_m("pot",["g12","g13","g14"]),_m("ntc",["h20","h21"],{temp:25})];nid=_i;selected=4;recompute();}}catch(e){}
// challenges
function renderCh(){
 var el=$("bbChal");el.innerHTML="";
 CH.forEach(function(c,i){var b=document.createElement("button");b.textContent=(done[c.id]?"✓ ":"")+c.name;b.className=i===chIdx?"on":"";b.onclick=function(){chIdx=i;$("bbMsg").textContent="";renderCh();};el.appendChild(b);});
 $("bbGoal").innerHTML=CH[chIdx].goal;$("bbHint").textContent="Hint: "+CH[chIdx].hint.replace(/^Hint: /,"");
 $("bbHint").style.display="none";$("bbHintBtn").textContent="Show hint";
}
$("bbHintBtn").onclick=function(){var h=$("bbHint");var on=h.style.display==="none";h.style.display=on?"block":"none";this.textContent=on?"Hide hint":"Show hint";};
var LSU="mm_unlocked",LSC="mm_ldr_circuit";
function saveSensor(cs){try{var cl=JSON.parse(JSON.stringify(cs));Core.setSensor(X.sensorFrom(cl));try{localStorage.setItem(LSC,JSON.stringify(cl));}catch(e){}}catch(e){}}
try{var sc=JSON.parse(localStorage.getItem(LSC)||"null");if(sc)Core.setSensor(X.sensorFrom(sc));}catch(e){}
function unlock(id){try{Core.st.unlocked[id]=true;try{localStorage.setItem(LSU,JSON.stringify(Core.st.unlocked));}catch(e){}window.dispatchEvent(new Event("mm-unlock"));}catch(e){}}
try{var su=JSON.parse(localStorage.getItem(LSU)||"{}");Object.keys(su).forEach(function(k){Core.st.unlocked[k]=true;done[k]=true;});}catch(e){}
var milaN={};
$("bbMilaBtn").onclick=function(){if(isM()){var c0=CH[chIdx],el0=$("bbMila");el0.style.display="block";el0.style.cssText+=";background:#0f172a;border-left:3px solid #38bdf8;border-radius:8px;padding:8px;margin-top:6px;font-size:13px";el0.innerHTML="<b>Mila</b>: "+c0.hint;return;}var c=CH[chIdx],n=milaN[c.id]||0,m=$("bbMsg").className==="bad"?$("bbMsg").textContent:"",out=Mila.circuitHelp(c,m,n);milaN[c.id]=n+1;var el=$("bbMila");el.style.display="block";el.style.cssText+=";background:#0f172a;border-left:3px solid #38bdf8;border-radius:8px;padding:8px;margin-top:6px;font-size:13px";el.innerHTML="<b>Mila</b> (hint "+Math.min(n+1,3)+" of 3)<br>"+out.map(function(x){return String(x).replace(/</g,"&lt;");}).join("<br>");};
function saveMcu(c,stars){try{var all=JSON.parse(localStorage.getItem("mm_lab")||"{}"),id=c.id,p=all[id];if(!p||stars>p.stars){all[id]={name:"Arduino: "+c.name.replace(/^\d+\s*/,""),tier:c.tier,stars:stars,at:Date.now()};localStorage.setItem("mm_lab",JSON.stringify(all));}}catch(e){}}
$("bbCheck").onclick=function(){
 var m=$("bbMsg");
 if(isM()){var c=CH[chIdx],e=MCU.evaluate(window.LabMcu.getDesign());if(e.ok){done[c.id]=true;saveMcu(c,e.stars);m.textContent=e.t+" Saved to your Passport.";m.className="ok";renderCh();}else{m.textContent=e.t;m.className="bad";}return;}
 var r=CH[chIdx].check(comps);
 if(r===true){done[CH[chIdx].id]=true;unlock(CH[chIdx].id);if(CH[chIdx].id==="ldr")saveSensor(comps);m.textContent="★ Challenge complete! "+(chIdx<CH.length-1?"Try the next one.":"You finished all circuit challenges.");m.className="ok";renderCh();}
 else{m.textContent=r;m.className="bad";}
};
$("bbClear").onclick=function(){comps=isM()?[mode==="esp"?ESPC:UNOC]:[];selected=null;pending=null;meter=null;mreading="";setPrompt("");update();$("bbMsg").textContent="";};
$("bbRevive").onclick=function(){comps.forEach(function(c){c.burned=false;});update();};
// Ohm's law helper
function calc(){
 var V=+$("calcV").value,led=$("calcL").value,mA=+$("calcI").value||15,vf=X.LEDS[led].vf;
 if(V<=vf){$("calcOut").textContent="The battery ("+V+"V) cannot light a "+led+" LED ("+vf+"V). Use a bigger battery.";return;}
 var R=(V-vf)/(mA/1000),std=X.RES.filter(function(r){return r>=R;})[0]||X.RES[X.RES.length-1],i=(V-vf)/(std+X.RD)*1000;
 $("calcOut").innerHTML="R = ("+V+" − "+vf+") ÷ "+(mA/1000)+" A = <b>"+Math.round(R)+" Ω</b>. Nearest standard value up: <b>"+X.fmtR(std)+"</b> → about "+i.toFixed(1)+" mA.";
}
["calcV","calcL","calcI"].forEach(function(id){$(id).oninput=calc;$(id).onchange=calc;});
// ---------- Arduino mode ----------
var UNOC={id:9999,type:"uno",holes:[],board:"uno"},ESPC={id:9999,type:"uno",holes:[],board:"esp32"};
function stopRun(){if(timer){clearInterval(timer);timer=null;}run=null;$("mcuRun").className="p";recompute();render();}
function startRun(){if(timer)clearInterval(timer);run=MCU.Run();lastT=performance.now();$("mcuRun").className="";timer=setInterval(function(){if(!run)return;var now=performance.now(),n=Math.min(8,Math.floor((now-lastT)/MCU.TICK));if(n<1)return;lastT+=n*MCU.TICK;for(var i=0;i<n;i++)sim=MCU.tick(run,comps,prog,{});renderBoard();renderRead();},40);}
var DEFP={uno:{out:13,out2:8,pwm:9,sv:6,din:2,ana:0,anaN:300,tp:9,ep:10,d:20},esp32:{out:4,out2:18,pwm:18,sv:13,din:5,ana:34,anaN:1500,tp:18,ep:19,d:20}};
var PINS=[],PINI=[],PWM=[],AN=[],ANN=[],PWMV=[];
function setBoardLists(){var bd=curBoard(),B=MCU.BOARDS[bd],pf=bd==="esp32"?"GPIO":"D";PINS=B.out.map(function(p){return [p,pf+p];});PINI=B.inp.map(function(p){return [p,pf+p];});PWM=B.pwm.map(function(p){return [p,pf+p+"~"];});
 AN=B.adc.map(function(a){return [a,(bd==="esp32"?"GPIO":"A")+a];});ANN=bd==="esp32"?[300,600,1000,1500,2000,2500,3000]:[50,100,200,300,400,500,600,800];
 PWMV=[[0,"0"],[64,"64"],[128,"128"],[192,"192"],[255,"255"]].concat(B.adc.map(function(a){return [(bd==="esp32"?"G":"A")+a,(bd==="esp32"?"GPIO":"A")+a+" ÷ "+B.div];}));}
function setMode(m,force){if(m===mode&&!force)return;stopRun();if(isM())progs[mode]=prog;store[mode]=comps;if(m==="mcu"&&!store.mcu)store.mcu=[UNOC];if(m==="esp"&&!store.esp)store.esp=[ESPC];mode=m;comps=store[m];selected=null;pending=null;meter=null;mreading="";setPrompt("");
 prog=isM()?progs[m]:[];setBoardLists();
 OFFY=m==="mcu"?232:m==="esp"?150:0;CH=isM()?MCU.CHALLENGES.filter(function(c){return c.board===curBoard();}):X.CHALLENGES;chIdx=0;$("bbMsg").textContent="";$("bbMila").style.display="none";
 [].forEach.call(document.querySelectorAll("#mcuMode button"),function(x){x.className=x.dataset.mode===m?"on":"";});
 $("mcuPanel").style.display=isM()?"block":"none";$("bbViews").style.display=isM()?"none":"";
 [].forEach.call($("bbTray").children,function(d){d.style.display=(d.dataset.mode&&(d.dataset.mode==="basic"?isM():!isM()))?"none":"";});
 if(isM()){var pv=document.querySelector("#bbViews [data-m=flat]");if(pv)pv.click();$("bbBoard").style.display="block";$("bb3d").style.display="none";}else{$("bbBoard").style.display="none";$("bb3d").style.display="block";var pl=document.querySelector("#bbViews [data-m=place]");if(pl)pl.click();}
 renderCh();renderProg();update();}
[].forEach.call(document.querySelectorAll("#mcuMode button"),function(x){x.onclick=function(){setMode(x.dataset.mode);};});
$("mcuRun").onclick=function(){if(!prog.length){$("bbMsg").textContent="Add some blocks to your program first.";$("bbMsg").className="bad";return;}startRun();};
$("mcuStop").onclick=stopRun;
function osel(opts,val,fn){var s=document.createElement("select");s.className="sm";opts.forEach(function(o){var a=Array.isArray(o)?o:[o,o],op=document.createElement("option");op.value=a[0];op.textContent=a[1];if(String(a[0])===String(val))op.selected=true;s.appendChild(op);});s.onchange=function(){fn(s.value);};return s;}
function span(t){var e=document.createElement("span");e.textContent=t;e.style.margin="0 4px";return e;}
function actUI(a,set,wrap){var w=document.createElement("span"),kind=a?a.t:"none";
 w.appendChild(osel([["none","do nothing"],["w","set pin"],["pwm","PWM pin"],["sv","servo pin"]],kind,function(v){var D=DEFP[curBoard()];set(v==="none"?null:v==="w"?{t:"w",p:D.out,v:1}:v==="pwm"?{t:"pwm",p:D.pwm,v:128}:{t:"sv",p:D.sv,a:90});wrap();}));
 if(a&&a.t==="w"){w.appendChild(osel(PINS,a.p,function(v){a.p=+v;wrap(1);}));w.appendChild(span("="));w.appendChild(osel([[1,"HIGH"],[0,"LOW"]],a.v,function(v){a.v=+v;wrap(1);}));}
 if(a&&a.t==="pwm"){w.appendChild(osel(PWM,a.p,function(v){a.p=+v;wrap(1);}));w.appendChild(span("="));w.appendChild(osel(PWMV,a.v,function(v){a.v=/^[AG]/.test(v)?v:+v;wrap(1);}));}
 if(a&&a.t==="sv"){w.appendChild(osel(PINS,a.p,function(v){a.p=+v;wrap(1);}));w.appendChild(span("angle"));w.appendChild(osel([0,45,90,135,180],a.a,function(v){a.a=+v;wrap(1);}));}
 return w;}
function changed(){if(run){run.pc=0;run.wait=0;}$("mcuCode").textContent=MCU.toCpp(prog,curBoard());}
function renderProg(){var host=$("mcuProg");host.innerHTML="";
 if(!prog.length){host.innerHTML="<div class='note'>Empty. Add blocks below: the program repeats forever, like <code>loop()</code> in Arduino.</div>";}
 prog.forEach(function(bk,i){var row=document.createElement("div");row.className="mb";var head=document.createElement("div");
  function rer(keep){if(keep){changed();return;}renderProg();changed();}
  if(bk.t==="w"){head.appendChild(span("Set pin"));head.appendChild(osel(PINS,bk.p,function(v){bk.p=+v;changed();}));head.appendChild(span("="));head.appendChild(osel([[1,"HIGH"],[0,"LOW"]],bk.v,function(v){bk.v=+v;changed();}));}
  else if(bk.t==="d"){head.appendChild(span("Wait"));head.appendChild(osel([100,200,250,500,1000,2000,3000],bk.ms,function(v){bk.ms=+v;changed();}));head.appendChild(span("ms"));}
  else if(bk.t==="pwm"||bk.t==="sv"){head.appendChild(actUI(bk,function(){},function(){changed();}));}
  else if(bk.t==="if"){var c=bk.c;head.appendChild(span("If"));
   head.appendChild(osel([["dig","digital pin"],["ana","analog pin"],["dist","distance sensor"]],c.k,function(v){var D=DEFP[curBoard()];bk.c=v==="dig"?{k:"dig",p:D.din,is:1}:v==="ana"?{k:"ana",a:D.ana,op:"<",n:D.anaN}:{k:"dist",tp:D.tp,ep:D.ep,op:"<",n:20};rer();}));
   if(c.k==="dig"){head.appendChild(osel(PINI,c.p,function(v){c.p=+v;changed();}));head.appendChild(span("is"));head.appendChild(osel([[1,"HIGH"],[0,"LOW"]],c.is,function(v){c.is=+v;changed();}));}
   if(c.k==="ana"){head.appendChild(osel(AN,c.a,function(v){c.a=+v;changed();}));head.appendChild(osel(["<",">"],c.op,function(v){c.op=v;changed();}));head.appendChild(osel(ANN,c.n,function(v){c.n=+v;changed();}));}
   if(c.k==="dist"){head.appendChild(span("trig"));head.appendChild(osel(PINS,c.tp,function(v){c.tp=+v;changed();}));head.appendChild(span("echo"));head.appendChild(osel(PINI,c.ep,function(v){c.ep=+v;changed();}));head.appendChild(osel(["<",">"],c.op,function(v){c.op=v;changed();}));head.appendChild(osel([5,10,15,20,30,50,100],c.n,function(v){c.n=+v;changed();}));head.appendChild(span("cm"));}
  }
  row.appendChild(head);
  if(bk.t==="if"){var t1=document.createElement("div");t1.className="mbi";t1.appendChild(span("then"));t1.appendChild(actUI(bk.th,function(a){bk.th=a;},function(k){rer(k);}));row.appendChild(t1);var t2=document.createElement("div");t2.className="mbi";t2.appendChild(span("else"));t2.appendChild(actUI(bk.el,function(a){bk.el=a;},function(k){rer(k);}));row.appendChild(t2);}
  var ctl=document.createElement("div");ctl.className="mbc";[["↑",function(){if(i>0){var t=prog[i-1];prog[i-1]=prog[i];prog[i]=t;rer();}}],["↓",function(){if(i<prog.length-1){var t=prog[i+1];prog[i+1]=prog[i];prog[i]=t;rer();}}],["✕",function(){prog.splice(i,1);rer();}]].forEach(function(q){var bt=document.createElement("button");bt.textContent=q[0];bt.onclick=q[1];ctl.appendChild(bt);});row.appendChild(ctl);host.appendChild(row);});
 $("mcuCode").textContent=MCU.toCpp(prog,curBoard());}
var ADD=[["w","Set pin HIGH/LOW"],["d","Wait"],["pwm","PWM write"],["sv","Servo angle"],["ifd","If digital pin"],["ifa","If analog pin"],["ifx","If distance sensor"]];
$("mcuAdd").innerHTML=ADD.map(function(a){return "<option value='"+a[0]+"'>"+a[1]+"</option>";}).join("");
$("mcuAddBtn").onclick=function(){var D=DEFP[curBoard()],k=$("mcuAdd").value,th={t:"w",p:D.out2,v:1},el={t:"w",p:D.out2,v:0},bk=k==="w"?{t:"w",p:D.out,v:1}:k==="d"?{t:"d",ms:500}:k==="pwm"?{t:"pwm",p:D.pwm,v:128}:k==="sv"?{t:"sv",p:D.sv,a:90}:k==="ifd"?{t:"if",c:{k:"dig",p:D.din,is:1},th:th,el:el}:k==="ifa"?{t:"if",c:{k:"ana",a:D.ana,op:"<",n:D.anaN},th:th,el:el}:{t:"if",c:{k:"dist",tp:D.tp,ep:D.ep,op:"<",n:20},th:th,el:el};prog.push(bk);renderProg();changed();};
$("mcuClearProg").onclick=function(){prog.length=0;renderProg();changed();};
window.LabMcu={setChallenge:function(id,lock){var c=MCU.CHALLENGES.filter(function(x){return x.id===id;})[0];if(!c)return;setMode(c.board==="esp32"?"esp":"mcu",true);for(var i=0;i<CH.length;i++)if(CH[i].id===id)chIdx=i;renderCh();$("bblab").querySelector("details")&&0;if(lock)document.body.classList.add("lockmcu");},
 getDesign:function(){var c=CH[chIdx];return {ch:c.id,board:curBoard(),comps:comps.map(function(q){var o={id:q.id,type:q.type,holes:q.holes.slice()};["value","color","closed","pos","light","temp","dist","board"].forEach(function(k){if(q[k]!==undefined)o[k]=q[k];});return o;}),prog:JSON.parse(JSON.stringify(prog))};}};
window.MM_mcu={setMode:setMode,prog:function(){return prog;},setProg:function(p){prog=p;progs[mode]=p;renderProg();changed();},comps:function(){return comps;},setComps:function(c){comps=c;update();},run:function(){return startRun();},stop:stopRun};
renderCh();calc();update();
})();
