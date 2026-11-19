// Milestone Minds Connected Robotics: phone joystick/tilt -> virtual robot and/or physical ESP32 over Bluetooth LE.
// Shared command format: M,<left>,<right> (-100..100) and S. Physical robot answers D,<cm>.
var MMCR=(function(){
var $=function(i){return document.getElementById(i);};
var SVC="6e400001-b5a0-f393-e0a9-e50e24dcca9e",RXU="6e400002-b5a0-f393-e0a9-e50e24dcca9e",TXU="6e400003-b5a0-f393-e0a9-e50e24dcca9e";
var mode="virtual",jx=0,jy=0,thr=0.7,tilt=false,estop=false,dev=null,rxc=null,ble=false,pdist=null,lastEvt=0,evt="",sent="",lastSend=0,enc=new TextEncoder(),dec=new TextDecoder(),dragging=false;
var remote={m:[0,0],at:0,on:false},pc=null,dc=null,role="",pcode="",R={x:160,y:260,a:-90,l:0,r:0,trail:[],hit:0,dist:999};
var WALLS=[[0,0,320,6],[0,314,320,6],[0,0,6,320],[314,0,6,320],[90,120,110,10],[200,190,10,80],[40,200,70,10]];
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function mix(){if(estop)return [0,0];var y=jy,x=jx;return [Math.round(clamp(y+x,-1,1)*thr*100),Math.round(clamp(y-x,-1,1)*thr*100)];}
function rayDist(){var a=R.a*Math.PI/180,dx=Math.cos(a),dy=Math.sin(a),best=200;WALLS.forEach(function(w){for(var d=0;d<best;d+=2){var px=R.x+dx*d,py=R.y+dy*d;if(px>=w[0]&&px<=w[0]+w[2]&&py>=w[1]&&py<=w[1]+w[3]){best=d;break;}}});return best;}
function hits(x,y){return WALLS.some(function(w){return x+7>w[0]&&x-7<w[0]+w[2]&&y+7>w[1]&&y-7<w[1]+w[3];});}
function step(dt){if(mode==="physical")return;var l=R.l/100*90,r=R.r/100*90,v=(l+r)/2,om=(r-l)/16;
 var na=R.a+om*dt*180/Math.PI,ar=na*Math.PI/180,nx=R.x+Math.cos(ar)*v*dt,ny=R.y+Math.sin(ar)*v*dt;R.a=na;
 if(hits(nx,ny)){R.hit=0.4;}else{R.x=nx;R.y=ny;}if(R.hit>0)R.hit-=dt;
 if(Math.hypot(R.x-(R.trail.length?R.trail[R.trail.length-1][0]:0),R.y-(R.trail.length?R.trail[R.trail.length-1][1]:0))>4){R.trail.push([R.x,R.y]);if(R.trail.length>120)R.trail.shift();}
 R.dist=rayDist();}
function draw(){var c=$("mmcrCv");if(!c)return;var g=c.getContext("2d");g.clearRect(0,0,320,320);g.fillStyle="#0b1322";g.fillRect(0,0,320,320);
 g.fillStyle="#334155";WALLS.forEach(function(w){g.fillRect(w[0],w[1],w[2],w[3]);});
 g.strokeStyle="#1d4ed8";g.lineWidth=2;g.beginPath();R.trail.forEach(function(p,i){i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]);});g.stroke();
 var a=R.a*Math.PI/180;g.strokeStyle="rgba(250,204,21,.5)";g.lineWidth=1;g.beginPath();g.moveTo(R.x,R.y);g.lineTo(R.x+Math.cos(a)*R.dist,R.y+Math.sin(a)*R.dist);g.stroke();
 g.save();g.translate(R.x,R.y);g.rotate(a);g.fillStyle=R.hit>0?"#ef4444":"#22c55e";g.fillRect(-9,-7,18,14);g.fillStyle="#fff";g.fillRect(4,-4,5,8);g.restore();
 if(Date.now()-lastEvt<1500){g.fillStyle="#f59e0b";g.font="bold 14px sans-serif";g.fillText("⚠ "+evt,10,24);}}
function send(s){if(!rxc)return;try{rxc.writeValueWithoutResponse(enc.encode(s+"\n")).catch(function(){});}catch(e){}}
function cmd(){if(remote.on){if(performance.now()-remote.at>500)return [0,0];return estop?[0,0]:remote.m;}return mix();}
function out(){var m=cmd(),s=(m[0]===0&&m[1]===0)?"S":"M,"+m[0]+","+m[1],now=performance.now();
 if(mode!=="physical"){R.l=m[0];R.r=m[1];}
 if((mode==="physical"||mode==="hybrid")&&(s!==sent||now-lastSend>150)){send(s);sent=s;lastSend=now;}
 if(role==="phone"&&dc&&dc.readyState==="open"&&(s!==sentP||now-lastP>150)){dc.send(s);sentP=s;lastP=now;}
 var st=$("mmcrStat");if(st)st.textContent="L "+m[0]+"  R "+m[1]+(estop?"  ⛔ STOPPED":"");}
function onTel(t){t.split("\n").forEach(function(l){if(l.indexOf("D,")===0){pdist=+l.slice(2);var pd=$("mmcrPd");if(pd)pd.textContent=pdist>=999?"clear":pdist+" cm";
 if(pdist<20&&Date.now()-lastEvt>1500){lastEvt=Date.now();evt="Physical robot: obstacle "+pdist+" cm";if(mode==="hybrid"){R.hit=0.4;}}}});}
function setConn(t,ok){var e=$("mmcrConn");if(e){e.textContent=t;e.className=ok?"ok":"";}}
function connect(){if(!navigator.bluetooth){setConn("This browser has no Web Bluetooth. Use Chrome on Android or a computer.",false);return;}
 navigator.bluetooth.requestDevice({filters:[{services:[SVC]}],optionalServices:[SVC]}).then(function(d){dev=d;d.addEventListener("gattserverdisconnected",function(){ble=false;rxc=null;setConn("Disconnected. Robot stops by itself.",false);});setConn("Connecting…",false);return d.gatt.connect();})
 .then(function(s){return s.getPrimaryService(SVC);}).then(function(svc){return Promise.all([svc.getCharacteristic(RXU),svc.getCharacteristic(TXU)]);})
 .then(function(c){rxc=c[0];return c[1].startNotifications().then(function(){c[1].addEventListener("characteristicvaluechanged",function(e){onTel(dec.decode(e.target.value));});ble=true;setConn("Connected to "+(dev.name||"robot"),true);});})
 .catch(function(e){setConn("Could not connect: "+(e&&e.message||e),false);});}
function disconnect(){send("S");try{if(dev&&dev.gatt.connected)dev.gatt.disconnect();}catch(e){}}
function setMode(m){mode=m;[].forEach.call(document.querySelectorAll("#mmcrMode button"),function(b){b.className=b.dataset.m===m?"on":"";});
 var need=m!=="virtual";$("mmcrBle").style.display=need?"block":"none";if(m==="physical"){R.l=R.r=0;}}
function pad(){var p=$("mmcrPad"),k=$("mmcrKnob");if(!p)return;
 function set(e){var r=p.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*2-1,y=(e.clientY-r.top)/r.height*2-1,m=Math.hypot(x,y);if(m>1){x/=m;y/=m;}jx=x;jy=-y;k.style.left=(50+x*38)+"%";k.style.top=(50+y*38)+"%";}
 function end(){dragging=false;jx=jy=0;k.style.left="50%";k.style.top="50%";}
 p.addEventListener("pointerdown",function(e){if(tilt)return;dragging=true;p.setPointerCapture(e.pointerId);set(e);e.preventDefault();});
 p.addEventListener("pointermove",function(e){if(dragging)set(e);});p.addEventListener("pointerup",end);p.addEventListener("pointercancel",end);}
function onTilt(e){if(!tilt||e.beta===null)return;var y=clamp(-(e.beta-40)/30,-1,1),x=clamp(e.gamma/30,-1,1);if(Math.abs(y)<0.12)y=0;if(Math.abs(x)<0.12)x=0;jx=x;jy=y;var k=$("mmcrKnob");k.style.left=(50+x*38)+"%";k.style.top=(50-y*38)+"%";}
function toggleTilt(){if(tilt){tilt=false;jx=jy=0;$("mmcrTilt").textContent="📱 Tilt control: off";return;}
 var go=function(){tilt=true;$("mmcrTilt").textContent="📱 Tilt control: ON (hold phone flat, tilt to drive)";window.addEventListener("deviceorientation",onTilt);};
 if(window.DeviceOrientationEvent&&DeviceOrientationEvent.requestPermission)DeviceOrientationEvent.requestPermission().then(function(r){if(r==="granted")go();});else go();}
function stop(on){estop=on===undefined?!estop:on;jx=jy=0;send("S");if(role==="phone"&&dc&&dc.readyState==="open")dc.send(estop?"X":"S");var b=$("mmcrStop");b.className=estop?"on":"";b.textContent=estop?"▶ Release emergency stop":"⛔ EMERGENCY STOP";}
var sentP="",lastP=0;
function onMsg(t){if(t==="S"){remote.m=[0,0];remote.at=performance.now();}else if(t.indexOf("M,")===0){var p=t.split(",");remote.m=[clamp(+p[1]||0,-100,100),clamp(+p[2]||0,-100,100)];remote.at=performance.now();}else if(t==="X"){stop(true);}}
function pst(t,ok){var e=$("mmcrPair");if(e){e.textContent=t;e.className=ok?"ok":"";}}
function api(p,b){return fetch("/api/"+p,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(b)}).then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error(j.error||"Server error");return j;});});}
function gathered(p){return new Promise(function(res){if(p.iceGatheringState==="complete")return res();var t=setTimeout(res,3500);p.addEventListener("icegatheringstatechange",function(){if(p.iceGatheringState==="complete"){clearTimeout(t);res();}});});}
function mkPc(){var p=new RTCPeerConnection({iceServers:[{urls:"stun:stun.l.google.com:19302"}]});p.onconnectionstatechange=function(){var s=p.connectionState;if(s==="connected")pst(role==="phone"?"✅ Phone is the controller":"✅ Phone connected: it now drives the robot",true);if(s==="failed"||s==="disconnected"||s==="closed"){pst("Phone link lost. Robot stopped.",false);remote.on=false;remote.m=[0,0];}};return p;}
function wire(ch){dc=ch;ch.onopen=function(){if(role==="laptop"){remote.on=true;remote.at=0;}pst("✅ Connected",true);};ch.onmessage=function(e){if(role==="laptop")onMsg(String(e.data));};ch.onclose=function(){remote.on=false;remote.m=[0,0];pst("Phone link closed.",false);};}
function hostPair(){if(!window.RTCPeerConnection){pst("This browser cannot pair.",false);return;}role="laptop";pc=mkPc();wire(pc.createDataChannel("mmcr",{ordered:false,maxRetransmits:0}));pcode=String(Math.floor(100000+Math.random()*900000));pst("Preparing…",false);
 pc.createOffer().then(function(o){return pc.setLocalDescription(o);}).then(function(){return gathered(pc);}).then(function(){return api("pair/offer",{code:pcode,sdp:JSON.stringify(pc.localDescription)});})
 .then(function(){pst("On your phone open this site, tap Link → “Use this phone as controller”, and enter code  "+pcode,false);var n=0,iv=setInterval(function(){if(!pc||pc.connectionState==="connected"||++n>200){clearInterval(iv);return;}api("pair/poll",{code:pcode}).then(function(j){if(j.sdp){clearInterval(iv);pc.setRemoteDescription(JSON.parse(j.sdp));}}).catch(function(){});},1500);})
 .catch(function(e){pst("Pairing failed: "+e.message,false);});}
function phonePair(){if(!window.RTCPeerConnection){pst("This browser cannot pair.",false);return;}var code=($("mmcrCode").value||"").replace(/\D/g,"");role="phone";pc=mkPc();pc.ondatachannel=function(e){wire(e.channel);};pst("Connecting…",false);
 api("pair/join",{code:code}).then(function(j){return pc.setRemoteDescription(JSON.parse(j.sdp));}).then(function(){return pc.createAnswer();}).then(function(a){return pc.setLocalDescription(a);}).then(function(){return gathered(pc);}).then(function(){return api("pair/answer",{code:code,sdp:JSON.stringify(pc.localDescription)});})
 .catch(function(e){pst("Pairing failed: "+e.message,false);});}
var last=0;function loop(ts){requestAnimationFrame(loop);var v=$("mmcr");if(!v||!v.classList.contains("on")){last=ts;return;}var dt=Math.min(.05,(ts-last)/1000||.016);last=ts;out();step(dt);draw();}
function sketch(f){fetch("esp32/"+(typeof f==="string"?f:"mmcr_robot.ino")).then(function(r){return r.text();}).then(function(t){var a=document.createElement("a");a.href=URL.createObjectURL(new Blob([t],{type:"text/plain"}));a.download=(typeof f==="string"?f:"mmcr_robot.ino");a.click();});}
function init(){if(!$("mmcrPad"))return;pad();
 [].forEach.call(document.querySelectorAll("#mmcrMode button"),function(b){b.onclick=function(){setMode(b.dataset.m);};});
 $("mmcrConnect").onclick=connect;$("mmcrDisc").onclick=disconnect;$("mmcrTilt").onclick=toggleTilt;$("mmcrStop").onclick=function(){stop();};$("mmcrSketch").onclick=function(){sketch();};$("mmcrWifi").onclick=function(){sketch("mmcr_wifi.ino");};
 $("mmcrThr").oninput=function(){thr=this.value/100;$("mmcrThrV").textContent=this.value+"%";};
 $("mmcrHost").onclick=hostPair;$("mmcrJoin").onclick=phonePair;$("mmcrReset").onclick=function(){R.x=160;R.y=260;R.a=-90;R.trail=[];};
 document.addEventListener("keydown",function(e){if(!$("mmcr").classList.contains("on"))return;var k=e.key;if(k==="ArrowUp"||k==="w")jy=1;if(k==="ArrowDown"||k==="s")jy=-1;if(k==="ArrowLeft"||k==="a")jx=-1;if(k==="ArrowRight"||k==="d")jx=1;if(k===" "){stop();e.preventDefault();}});
 document.addEventListener("keyup",function(e){var k=e.key;if(/Arrow|^[wasd]$/.test(k)){jx=jy=0;}});
 setMode("virtual");requestAnimationFrame(loop);}
window.addEventListener("load",init);
return {mix:mix,setMode:setMode,state:function(){return {R:R,mode:mode,ble:ble};},setJoy:function(x,y){jx=x;jy=y;},stop:stop,tel:onTel,msg:onMsg,cmd:cmd};
})();
