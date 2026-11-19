(function(){
"use strict";
var X=Circuit,$=function(id){return document.getElementById(id);};
var PITCH=17.5,X0=44,RAILY={tp:34,tn:48,bp:304,bn:318},ROWY={a:86,b:103.5,c:121,d:138.5,e:156,f:196,g:213.5,h:231,i:248.5,j:266};
var comps=[],nid=1,pending=null,selected=null,meter=null,mreading="",chIdx=0,done={},sim=null;
var WIRECOL=["#e53935","#fb8c00","#43a047","#1e88e5","#8e24aa","#00acc1","#6d4c41","#546e7a"];
function pos(h){
 var m=/^(tp|tn|bp|bn)(\d+)$/.exec(h);if(m)return [X0+(+m[2]-1)*PITCH,RAILY[m[1]]];
 m=/^([a-j])(\d+)$/.exec(h);return [X0+(+m[2]-1)*PITCH,ROWY[m[1]]];
}
function occ(){var o={};comps.forEach(function(c){c.holes.forEach(function(h){o[h]=c.id;});});return o;}
function cname(c){
 switch(c.type){case "battery":return X.BATT[c.value].name;case "resistor":return "Resistor "+X.fmtR(c.value);case "led":return c.color+" LED";case "switch":return "Push switch ("+(c.closed?"closed":"open")+")";case "pot":return "Potentiometer 10kΩ";case "wire":return "Jumper wire";case "ldr":return "Light sensor (LDR) · light "+Math.round(c.light*100)+"%";case "ntc":return "Thermistor 10kΩ NTC · "+Math.round(c.temp)+"°C";case "npn":return "NPN transistor (C, B, E)";}return c.type;
}
var LABELS={battery:["+ lead (red)","− lead (black)"],resistor:["leg 1","leg 2"],led:["anode + (long leg)","cathode − (short leg)"],switch:["terminal 1","terminal 2"],pot:["end A","wiper (middle pin)","end B"],wire:["end 1","end 2"],ldr:["leg 1","leg 2"],ntc:["leg 1","leg 2"],npn:["collector (C)","base (B)","emitter (E)"]};
function recompute(){sim=X.simulate(comps);}
// ---------- drawing ----------
function legLine(a,b,col){return "<line x1='"+a[0]+"' y1='"+(a[1]+1.4)+"' x2='"+b[0]+"' y2='"+(b[1]+1.4)+"' stroke='rgba(0,0,0,.28)' stroke-width='2.6' stroke-linecap='round'/><line x1='"+a[0]+"' y1='"+a[1]+"' x2='"+b[0]+"' y2='"+b[1]+"' stroke='"+(col||"url(#mmMetal)")+"' stroke-width='2.1' stroke-linecap='round'/><circle cx='"+a[0]+"' cy='"+a[1]+"' r='2.6' fill='#9ca3af'/>";}
var DEFS="<defs><linearGradient id='mmBoard' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#f6f3ea'/><stop offset='1' stop-color='#d9d4c0'/></linearGradient><linearGradient id='mmMetal' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#f1f5f9'/><stop offset='.5' stop-color='#9aa3ad'/><stop offset='1' stop-color='#d8dee4'/></linearGradient><linearGradient id='mmRes' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#f3e6bd'/><stop offset='.45' stop-color='#dcc58b'/><stop offset='1' stop-color='#a98d52'/></linearGradient><linearGradient id='mmBlk' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#4b5563'/><stop offset='1' stop-color='#111827'/></linearGradient><linearGradient id='mmBlue' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#60a5fa'/><stop offset='1' stop-color='#1e3a8a'/></linearGradient><radialGradient id='mmKnob' cx='.35' cy='.3' r='.8'><stop offset='0' stop-color='#fff'/><stop offset='1' stop-color='#9ca3af'/></radialGradient><radialGradient id='mmHole' cx='.5' cy='.45' r='.6'><stop offset='0' stop-color='#111'/><stop offset='1' stop-color='#4a4a44'/></radialGradient><filter id='mmSh' x='-20%' y='-20%' width='140%' height='150%'><feDropShadow dx='0' dy='2' stdDeviation='2' flood-opacity='.35'/></filter><filter id='mmBlur'><feGaussianBlur stdDeviation='5'/></filter></defs>";
function drawComp(c){
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
   s+="<g transform='translate("+mx+" "+my+") rotate("+ang+") scale("+sc+")' filter='url(#mmSh)'><path d='M-17 -3.5 Q-17 -7 -13 -7 L13 -7 Q17 -7 17 -3.5 L17 3.5 Q17 7 13 7 L-13 7 Q-17 7 -17 3.5 Z' fill='url(#mmRes)' stroke='#8a7a52' stroke-width='.8'/><rect x='-10' y='-7' width='3.4' height='14' fill='"+b3[0]+"'/><rect x='-4' y='-7' width='3.4' height='14' fill='"+b3[1]+"'/><rect x='2' y='-7' width='3.4' height='14' fill='"+b3[2]+"'/><rect x='10' y='-7' width='3' height='14' fill='#d4af37'/><rect x='-15' y='-5.5' width='30' height='2.2' rx='1.1' fill='rgba(255,255,255,.5)'/></g>";
   if(o.burned)s+="<text x='"+mx+"' y='"+(my-10)+"' font-size='14' text-anchor='middle'>💥</text>";
  }else if(c.type==="led"){
   var col=X.LEDS[c.color].col,lit=o.lit||0;
   s+=legLine(P[0],[mx,my])+legLine(P[1],[mx,my]);
   if(lit>0)s+="<circle cx='"+mx+"' cy='"+(my-4)+"' r='"+(14+lit*20)+"' fill='"+col+"' opacity='"+(0.2+lit*0.5)+"' filter='url(#mmBlur)'/>";
   s+="<g filter='url(#mmSh)'><path d='M"+(mx-9)+" "+(my+6)+" L"+(mx-9)+" "+(my-6)+" A9 10 0 0 1 "+(mx+9)+" "+(my-6)+" L"+(mx+9)+" "+(my+6)+" Z' fill='"+(o.burned?"#222":col)+"' fill-opacity='"+(o.burned?1:0.42+lit*0.58)+"' stroke='"+col+"' stroke-width='1.2'/><rect x='"+(mx-11)+"' y='"+(my+5)+"' width='22' height='3.2' rx='1' fill='"+(o.burned?"#222":col)+"' fill-opacity='.8'/></g><path d='M"+(mx-3)+" "+(my+4)+" L"+(mx-3)+" "+(my-2)+" L"+(mx-5)+" "+(my-5)+" M"+(mx+3)+" "+(my+4)+" L"+(mx+3)+" "+(my-1)+" L"+(mx+5)+" "+(my-5)+"' stroke='rgba(255,255,255,.55)' fill='none' stroke-width='1.2'/><ellipse cx='"+(mx-4)+"' cy='"+(my-8)+"' rx='2.2' ry='3.2' fill='rgba(255,255,255,"+(0.5+lit*0.3)+")'/>";
   s+="<text x='"+(P[0][0]+(P[0][0]<=P[1][0]?-7:7))+"' y='"+(P[0][1]-6)+"' font-size='10' fill='#b91c1c' font-weight='bold' text-anchor='middle'>+</text>";
   if(o.burned)s+="<text x='"+mx+"' y='"+(my+4)+"' font-size='12' fill='#fff' text-anchor='middle'>×</text>";
  }else if(c.type==="ldr"){
   s+=legLine(P[0],[mx,my])+legLine(P[1],[mx,my]);
   s+="<g filter='url(#mmSh)'><circle cx='"+mx+"' cy='"+my+"' r='10' fill='#d99a1c' stroke='#7a4f00' stroke-width='1.3'/><circle cx='"+mx+"' cy='"+my+"' r='7.6' fill='#e8b04a'/></g><path d='M"+(mx-6)+" "+(my-4)+" h12 M"+(mx-6)+" "+(my-4)+" v3 h12 v3 h-12 v3 h12' stroke='#5b3a00' fill='none' stroke-width='1.3'/><text x='"+(mx+1)+"' y='"+(my-14)+"' font-size='11' text-anchor='middle' opacity='"+(0.3+0.7*c.light)+"'>☀</text>";
  }else if(c.type==="ntc"){
   s+=legLine(P[0],[mx,my])+legLine(P[1],[mx,my]);
   s+="<g filter='url(#mmSh)'><path d='M"+(mx-6)+" "+(my+5)+" Q"+(mx-8)+" "+(my-9)+" "+mx+" "+(my-9)+" Q"+(mx+8)+" "+(my-9)+" "+(mx+6)+" "+(my+5)+" Z' fill='#c2410c' stroke='#7c2d12'/></g><ellipse cx='"+(mx-2.5)+"' cy='"+(my-4)+"' rx='1.8' ry='3' fill='rgba(255,255,255,.45)'/><text x='"+mx+"' y='"+(my+3)+"' font-size='7' fill='#fff7ed' text-anchor='middle'>t°</text>";
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
   s+="<g filter='url(#mmSh)'><rect x='"+(ex-17)+"' y='"+(ey-13)+"' width='34' height='26' rx='5' fill='url(#mmBlue)' stroke='#93c5fd'/></g><g transform='translate("+ex+" "+ey+") rotate("+kang+")'><circle r='9' fill='url(#mmKnob)' stroke='#6b7280'/><line x1='0' y1='0' x2='0' y2='-8' stroke='#111' stroke-width='2.2' stroke-linecap='round'/></g>";
   hx=ex;hy=ey;
  }
  if(c.type!=="pot"&&c.type!=="npn"){hx=mx;hy=my;}
 }
 s+="<circle cx='"+hx+"' cy='"+hy+"' r='"+(c.type==="wire"?5:9)+"' fill='rgba(255,255,255,.02)' stroke='"+(sel?"#fbbf24":"transparent")+"' stroke-width='2.5' stroke-dasharray='3 2' data-c='"+c.id+"' style='cursor:pointer'/>";
 return s;
}
function renderBoard(){
 var oc=occ(),s="<svg viewBox='0 0 600 345' width='100%' style='min-width:640px;touch-action:manipulation' data-x='1' xmlns='http://www.w3.org/2000/svg' font-family='sans-serif'>";
 s+=DEFS+"<rect x='8' y='14' width='584' height='322' rx='10' fill='url(#mmBoard)' stroke='#b9b39e' filter='url(#mmSh)'/><rect x='12' y='18' width='576' height='8' rx='4' fill='rgba(255,255,255,.55)'/>";
 s+="<rect x='36' y='172' width='528' height='10' fill='#cfc9b4'/><text x='300' y='181' font-size='7.5' fill='#8a846e' text-anchor='middle'>CENTRE GAP</text>";
 // rail stripes
 [["tp","#e53935",34],["tn","#1e63d6",48],["bp","#e53935",304],["bn","#1e63d6",318]].forEach(function(r){s+="<line x1='36' y1='"+(r[2]-9)+"' x2='564' y2='"+(r[2]-9)+"' stroke='"+r[1]+"' stroke-width='1.2' opacity='.7'/><text x='20' y='"+(r[2]+3)+"' font-size='11' fill='"+r[1]+"' font-weight='bold' text-anchor='middle'>"+(r[0].charAt(1)==="p"?"+":"−")+"</text>";});
 for(var c=1;c<=30;c++){var x=X0+(c-1)*PITCH;if(c===1||c%5===0)s+="<text x='"+x+"' y='76' font-size='8' fill='#8a846e' text-anchor='middle'>"+c+"</text>";}
 "abcdefghij".split("").forEach(function(l){s+="<text x='28' y='"+(ROWY[l]+3)+"' font-size='8.5' fill='#8a846e' text-anchor='middle'>"+l+"</text>";});
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
 if(!sim||!comps.length){el.innerHTML="<div class='note'>Add a battery and a few parts. The circuit is simulated live.</div>";return;}
 if(sim.noBattery)h+="<div class='vwarn'>⚠ No battery yet: nothing can flow.</div>";
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
 if(c.type==="resistor")sel(X.RES.map(function(v){return [v,X.fmtR(v)];}),c.value,function(v){c.value=+v;c.burned=false;update();});
 if(c.type==="led")sel(Object.keys(X.LEDS).map(function(k){return [k,k];}),c.color,function(v){c.color=v;c.burned=false;update();});
 if(c.type==="battery")sel([[3,"3V"],[5,"5V"],[9,"9V"]],c.value,function(v){c.value=+v;update();});
 btn("Remove",function(){comps=comps.filter(function(x){return x.id!==c.id;});selected=null;update();},"s");
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
 if(c.type==="switch")c.closed=false;if(c.type==="pot")c.pos=0.5;if(c.type==="ldr")c.light=0.6;if(c.type==="ntc")c.temp=25;
 comps.push(c);pending=null;selected=c.id;setPrompt("");update();
}
function tapHole(he){
 if(meter){meter.holes.push(he);if(meter.holes.length===2){var a=meter.holes[0],b=meter.holes[1],v=sim?sim.volt(a)-sim.volt(b):0;mreading="Voltage from "+a+" to "+b+": <b>"+v.toFixed(2)+" V</b>";meter.holes=[];setPrompt("Voltmeter: tap two holes to measure the voltage between them.");}else setPrompt("Voltmeter: tap one more hole.");render();return;}
 if(pending){
  var o=occ();if(o[he]!==undefined||pending.holes.indexOf(he)>=0){setPrompt("That hole already has a lead. Choose another hole.");return;}
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
function trayRow(title,ctrl,btn){var d=document.createElement("div");d.className="trow";var s=document.createElement("span");s.textContent=title;d.appendChild(s);if(ctrl)d.appendChild(ctrl);d.appendChild(btn);$("bbTray").appendChild(d);}
function selectEl(opts){var s=document.createElement("select");s.className="sm";opts.forEach(function(o){var op=document.createElement("option");op.value=o[0];op.textContent=o[1];s.appendChild(op);});return s;}
(function(){
 var bs=selectEl([[5,"5V USB"],[3,"3V (2×AA)"],[9,"9V block"]]);trayRow("🔋 Battery",bs,mkBtn("+ Add",function(){startPlace("battery",{value:+bs.value});}));
 var rs=selectEl(X.RES.map(function(v){return [v,X.fmtR(v)];}));rs.value=220;trayRow("▭ Resistor",rs,mkBtn("+ Add",function(){startPlace("resistor",{value:+rs.value});}));
 var ls=selectEl(Object.keys(X.LEDS).map(function(k){return [k,k+" LED"];}));trayRow("💡 LED",ls,mkBtn("+ Add",function(){startPlace("led",{color:ls.value});}));
 trayRow("⏺ Push switch",null,mkBtn("+ Add",function(){startPlace("switch");}));
 trayRow("☀ Light sensor (LDR)",null,mkBtn("+ Add",function(){startPlace("ldr");}));
 trayRow("🌡 Thermistor (NTC)",null,mkBtn("+ Add",function(){startPlace("ntc");}));
 trayRow("🔺 NPN transistor",null,mkBtn("+ Add",function(){startPlace("npn");}));
 trayRow("🎛 Potentiometer 10kΩ",null,mkBtn("+ Add",function(){startPlace("pot");}));
 trayRow("➰ Jumper wire",null,mkBtn("+ Add",function(){startPlace("wire");}));
 trayRow("🔎 Voltmeter",null,mkBtn("Use",function(){pending=null;selected=null;meter={holes:[]};setPrompt("Voltmeter: tap two holes to measure the voltage between them.");render();}));
})();

try{if(/demo=night/.test(location.hash)){var _i=1,_m=function(t,h,o){return Object.assign({id:_i++,type:t,holes:h},o||{});};
 comps=[_m("battery",["tp1","tn1"],{value:5}),_m("wire",["tp2","a5"]),_m("wire",["tn2","e20"]),_m("resistor",["b5","b9"],{value:10000}),_m("ldr",["c9","c12"],{light:0.05}),_m("wire",["d12","d20"]),_m("npn",["a14","a15","a16"]),_m("wire",["b15","b9"]),_m("wire",["c16","c20"]),_m("resistor",["e5","e25"],{value:330}),_m("led",["d25","d14"],{color:"red"}),_m("switch",["f5","f8"]),_m("pot",["g12","g13","g14"]),_m("ntc",["h20","h21"],{temp:25})];nid=_i;selected=4;recompute();}}catch(e){}
// challenges
var CH=X.CHALLENGES;
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
$("bbMilaBtn").onclick=function(){var c=CH[chIdx],n=milaN[c.id]||0,m=$("bbMsg").className==="bad"?$("bbMsg").textContent:"",out=Mila.circuitHelp(c,m,n);milaN[c.id]=n+1;var el=$("bbMila");el.style.display="block";el.style.cssText+=";background:#0f172a;border-left:3px solid #38bdf8;border-radius:8px;padding:8px;margin-top:6px;font-size:13px";el.innerHTML="<b>Mila</b> (hint "+Math.min(n+1,3)+" of 3)<br>"+out.map(function(x){return String(x).replace(/</g,"&lt;");}).join("<br>");};
$("bbCheck").onclick=function(){
 var r=CH[chIdx].check(comps),m=$("bbMsg");
 if(r===true){done[CH[chIdx].id]=true;unlock(CH[chIdx].id);if(CH[chIdx].id==="ldr")saveSensor(comps);m.textContent="★ Challenge complete! "+(chIdx<CH.length-1?"Try the next one.":"You finished all circuit challenges.");m.className="ok";renderCh();}
 else{m.textContent=r;m.className="bad";}
};
$("bbClear").onclick=function(){comps=[];selected=null;pending=null;meter=null;mreading="";setPrompt("");update();$("bbMsg").textContent="";};
$("bbRevive").onclick=function(){comps.forEach(function(c){c.burned=false;});update();};
// Ohm's law helper
function calc(){
 var V=+$("calcV").value,led=$("calcL").value,mA=+$("calcI").value||15,vf=X.LEDS[led].vf;
 if(V<=vf){$("calcOut").textContent="The battery ("+V+"V) cannot light a "+led+" LED ("+vf+"V). Use a bigger battery.";return;}
 var R=(V-vf)/(mA/1000),std=X.RES.filter(function(r){return r>=R;})[0]||X.RES[X.RES.length-1],i=(V-vf)/(std+X.RD)*1000;
 $("calcOut").innerHTML="R = ("+V+" − "+vf+") ÷ "+(mA/1000)+" A = <b>"+Math.round(R)+" Ω</b>. Nearest standard value up: <b>"+X.fmtR(std)+"</b> → about "+i.toFixed(1)+" mA.";
}
["calcV","calcL","calcI"].forEach(function(id){$(id).oninput=calc;$(id).onchange=calc;});
renderCh();calc();update();
})();
