// Milestone Minds Connected Robotics: phone joystick/tilt -> virtual robot and/or physical ESP32 over Bluetooth LE.
// Shared command format: M,<left>,<right> (-100..100) and S. Physical robot answers D,<cm>.
var MMCR=(function(){
var $=function(i){return document.getElementById(i);};
var SVC="6e400001-b5a0-f393-e0a9-e50e24dcca9e",RXU="6e400002-b5a0-f393-e0a9-e50e24dcca9e",TXU="6e400003-b5a0-f393-e0a9-e50e24dcca9e";
var mode="virtual",jx=0,jy=0,thr=0.7,tilt=false,estop=false,dev=null,rxc=null,ble=false,pdist=null,lastEvt=0,evt="",sent="",lastSend=0,enc=new TextEncoder(),dec=new TextDecoder(),dragging=false;
var rtype="esp",LSVC="00001623-1212-efde-1623-785feabcd123",LCH="00001624-1212-efde-1623-785feabcd123",lastL=[null,null],veh="robot",sx=0,sy=0,D={x:160,y:260,z:0,vx:0,vy:0,vz:0,yaw:-90,armed:false,bat:100,msg:"",fs:false,crash:0},rf=[0,0,0,0],remote={m:[0,0],at:0,on:false},pc=null,dc=null,role="",pcode="",R={x:160,y:260,a:-90,l:0,r:0,trail:[],hit:0,dist:999};
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
function arm(){if(D.armed){D.armed=false;D.msg="Disarmed";return;}
 if(estop){D.msg="Release the emergency stop first";return;}if(D.z>1){return;}if(D.bat<20){D.msg="Battery too low to arm";return;}
 var t=dthr();if(Math.abs(t)>0.1){D.msg="Centre the throttle stick before arming";return;}D.armed=true;D.fs=false;D.msg="Armed";}
function dthr(){return remote.on&&performance.now()-remote.at<=500&&remote.f?remote.f[2]/100:sy;}
function dstep(dt){var roll,pitch,thr,yw;
 if(remote.on&&remote.f){if(performance.now()-remote.at>500){roll=pitch=thr=yw=0;if(D.armed&&!D.fs){D.fs=true;D.msg="Link lost: landing";}}else{roll=remote.f[0]/100;pitch=remote.f[1]/100;thr=remote.f[2]/100;yw=remote.f[3]/100;}}else{roll=jx;pitch=jy;thr=sy;yw=sx;}
 if(estop&&D.armed){D.armed=false;D.msg="Emergency stop: motors cut";}
 if(D.armed&&D.z>1)D.bat=Math.max(0,D.bat-dt*(0.35+0.3*Math.hypot(pitch,roll)));
 if(D.armed&&D.bat<15&&!D.fs){D.fs=true;D.msg="Low battery: landing";}
 var vzT;if(!D.armed){vzT=D.z>0?-220:0;}else if(D.fs){vzT=D.z>0?-30:0;roll=pitch=yw=0;}else{vzT=thr*60;}
 D.vz+=(vzT-D.vz)*Math.min(1,dt*(D.armed?6:2.5));var nz=D.z+D.vz*dt;
 if(nz>=120){nz=120;if(D.vz>0)D.vz=0;D.msg="Ceiling limit";}
 if(nz<=0){if(D.z>0&&D.vz<-90){D.crash=1.5;D.msg="💥 Hard landing";}nz=0;if(D.vz<0)D.vz=0;if(D.fs&&D.armed){D.armed=false;D.msg="Landed. Disarmed.";}}
 D.z=nz;if(!D.armed&&D.z===0){D.vx=D.vy=0;}
 if(D.armed&&D.z>0){D.yaw+=yw*120*dt;var a=D.yaw*Math.PI/180,fx=Math.cos(a),fy=Math.sin(a),tx=(fx*pitch-fy*roll)*80,ty=(fy*pitch+fx*roll)*80;D.vx+=(tx-D.vx)*Math.min(1,dt*3);D.vy+=(ty-D.vy)*Math.min(1,dt*3);}
 else if(D.z>0){D.vx*=1-Math.min(1,dt);D.vy*=1-Math.min(1,dt);}
 var nx=D.x+D.vx*dt,ny=D.y+D.vy*dt,fence=false;if(nx<14||nx>306){nx=clamp(nx,14,306);D.vx=0;fence=true;}if(ny<14||ny>306){ny=clamp(ny,14,306);D.vy=0;fence=true;}if(fence&&D.armed)D.msg="Flight boundary";
 D.x=nx;D.y=ny;if(D.crash>0)D.crash-=dt;
 var h=$("mmcrHud");if(h)h.textContent="Alt "+Math.round(D.z)+" cm · Battery "+Math.round(D.bat)+"% · "+(D.armed?"ARMED":"disarmed")+(D.msg?" · "+D.msg:"");}
function ddraw(g){var sc=1-D.z/260;g.fillStyle="rgba(0,0,0,.35)";g.beginPath();g.ellipse(D.x+D.z*.15,D.y+D.z*.15,14*sc,14*sc,0,0,7);g.fill();
 g.strokeStyle="#475569";g.setLineDash([6,6]);g.strokeRect(14,14,292,292);g.setLineDash([]);
 g.save();g.translate(D.x,D.y);g.rotate(D.yaw*Math.PI/180);var s=1+D.z/150;g.scale(s,s);g.strokeStyle=D.crash>0?"#ef4444":"#94a3b8";g.lineWidth=3;g.beginPath();g.moveTo(-9,-9);g.lineTo(9,9);g.moveTo(-9,9);g.lineTo(9,-9);g.stroke();
 g.fillStyle=D.armed?"#22c55e":"#64748b";[[-9,-9],[9,-9],[-9,9],[9,9]].forEach(function(p){g.beginPath();g.arc(p[0],p[1],4,0,7);g.fill();});g.fillStyle="#f59e0b";g.fillRect(6,-2,6,4);g.restore();
 g.fillStyle="#1e293b";g.fillRect(300,200,12,100);g.fillStyle="#3b82f6";g.fillRect(300,300-D.z/120*100,12,D.z/120*100);}
function draw(){var c=$("mmcrCv");if(!c)return;var g=c.getContext("2d");g.clearRect(0,0,320,320);g.fillStyle="#0b1322";g.fillRect(0,0,320,320);
 if(veh==="drone"){g.fillStyle="#334155";WALLS.forEach(function(w){if(w[2]<20||w[3]<20)return;g.globalAlpha=.25;g.fillRect(w[0],w[1],w[2],w[3]);g.globalAlpha=1;});ddraw(g);return;}
 g.fillStyle="#334155";WALLS.forEach(function(w){g.fillRect(w[0],w[1],w[2],w[3]);});
 g.strokeStyle="#1d4ed8";g.lineWidth=2;g.beginPath();R.trail.forEach(function(p,i){i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]);});g.stroke();
 var a=R.a*Math.PI/180;g.strokeStyle="rgba(250,204,21,.5)";g.lineWidth=1;g.beginPath();g.moveTo(R.x,R.y);g.lineTo(R.x+Math.cos(a)*R.dist,R.y+Math.sin(a)*R.dist);g.stroke();
 g.save();g.translate(R.x,R.y);g.rotate(a);g.fillStyle=R.hit>0?"#ef4444":"#22c55e";g.fillRect(-9,-7,18,14);g.fillStyle="#fff";g.fillRect(4,-4,5,8);g.restore();
 if(Date.now()-lastEvt<1500){g.fillStyle="#f59e0b";g.font="bold 14px sans-serif";g.fillText("⚠ "+evt,10,24);}}
function lego(port,p){p=Math.round(clamp(p,-100,100));var ch=port===0?0:1;if(lastL[ch]===p&&!lego.f)return;lastL[ch]=p;var v=new Uint8Array([8,0,0x81,port,0x11,0x51,0,p&255]);try{rxc.writeValueWithoutResponse(v).catch(function(){});}catch(e){}}
function send(s){if(!rxc)return;if(rtype==="lego"){var l=0,r=0;if(s.indexOf("M,")===0){var q=s.split(",");l=+q[1]||0;r=+q[2]||0;}if($("mmcrRev")&&$("mmcrRev").checked)r=-r;lego.f=s==="S";lego(0,l);lego(1,r);lego.f=false;return;}try{rxc.writeValueWithoutResponse(enc.encode(s+"\n")).catch(function(){});}catch(e){}}
function cmd(){if(remote.on){if(performance.now()-remote.at>500)return [0,0];return estop?[0,0]:remote.m;}return mix();}
function out(){if(veh==="drone"){var f=[Math.round(jx*100),Math.round(jy*100),Math.round(sy*100),Math.round(sx*100)],s2="F,"+f.join(","),nw=performance.now();if(role==="phone"&&dc&&dc.readyState==="open"&&(s2!==sentP||nw-lastP>100)){dc.send(estop?"F,0,0,0,0":s2);sentP=s2;lastP=nw;}var st0=$("mmcrStat");if(st0)st0.textContent="roll "+f[0]+" pitch "+f[1]+" thr "+f[2]+" yaw "+f[3];return;}var m=cmd(),s=(m[0]===0&&m[1]===0)?"S":"M,"+m[0]+","+m[1],now=performance.now();
 if(mode!=="physical"){R.l=m[0];R.r=m[1];}
 if((mode==="physical"||mode==="hybrid")&&(s!==sent||now-lastSend>150)){send(s);sent=s;lastSend=now;}
 if(role==="phone"&&dc&&dc.readyState==="open"&&(s!==sentP||now-lastP>150)){dc.send(s);sentP=s;lastP=now;}
 var st=$("mmcrStat");if(st)st.textContent="L "+m[0]+"  R "+m[1]+(estop?"  ⛔ STOPPED":"");}
function onTel(t){t.split("\n").forEach(function(l){if(l.indexOf("D,")===0){pdist=+l.slice(2);var pd=$("mmcrPd");if(pd)pd.textContent=pdist>=999?"clear":pdist+" cm";
 if(pdist<20&&Date.now()-lastEvt>1500){lastEvt=Date.now();evt="Physical robot: obstacle "+pdist+" cm";if(mode==="hybrid"){R.hit=0.4;}}}});}
function setConn(t,ok){var e=$("mmcrConn");if(e){e.textContent=t;e.className=ok?"ok":"";}}
function connect(){if(!navigator.bluetooth){setConn("This browser has no Web Bluetooth. Use Chrome on Android or a computer.",false);return;}
 navigator.bluetooth.requestDevice(rtype==="lego"?{filters:[{services:[LSVC]}],optionalServices:[LSVC]}:{filters:[{services:[SVC]}],optionalServices:[SVC]}).then(function(d){dev=d;d.addEventListener("gattserverdisconnected",function(){ble=false;rxc=null;setConn("Disconnected. Robot stops by itself.",false);});setConn("Connecting…",false);return d.gatt.connect();})
 .then(function(s){return s.getPrimaryService(rtype==="lego"?LSVC:SVC);}).then(function(svc){return rtype==="lego"?svc.getCharacteristic(LCH).then(function(c){return [c,c];}):Promise.all([svc.getCharacteristic(RXU),svc.getCharacteristic(TXU)]);})
 .then(function(c){rxc=c[0];return (rtype==="lego"?Promise.resolve():c[1].startNotifications().then(function(){c[1].addEventListener("characteristicvaluechanged",function(e){onTel(dec.decode(e.target.value));});})).then(function(){ble=true;setConn("Connected to "+(dev.name||"robot"),true);});})
 .catch(function(e){setConn("Could not connect: "+(e&&e.message||e),false);});}
function disconnect(){send("S");try{if(dev&&dev.gatt.connected)dev.gatt.disconnect();}catch(e){}}
function setMode(m){mode=m;[].forEach.call(document.querySelectorAll("#mmcrMode button"),function(b){b.className=b.dataset.m===m?"on":"";});
 var need=m!=="virtual";$("mmcrBle").style.display=need?"block":"none";if(m==="physical"){R.l=R.r=0;}}
function pad2(){var p=$("mmcrPad2"),k=$("mmcrKnob2");if(!p)return;var d2=false;function set(e){var r=p.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*2-1,y=(e.clientY-r.top)/r.height*2-1,m=Math.hypot(x,y);if(m>1){x/=m;y/=m;}sx=x;sy=-y;k.style.left=(50+x*38)+"%";k.style.top=(50+y*38)+"%";}
 function end(){d2=false;sx=sy=0;k.style.left="50%";k.style.top="50%";}p.addEventListener("pointerdown",function(e){d2=true;p.setPointerCapture(e.pointerId);set(e);e.preventDefault();});p.addEventListener("pointermove",function(e){if(d2)set(e);});p.addEventListener("pointerup",end);p.addEventListener("pointercancel",end);}
function setVeh(v){veh=v;[].forEach.call(document.querySelectorAll("#mmcrVeh button"),function(b){b.className=b.dataset.v===v?"on":"";});$("mmcrDrone").style.display=v==="drone"?"block":"none";$("mmcrRobotUi").style.display=v==="drone"?"none":"block";jx=jy=sx=sy=0;if(v==="drone"){D.msg="";}}
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
function onMsg(t){if(t==="S"){remote.m=[0,0];remote.at=performance.now();}else if(t.indexOf("M,")===0){var p=t.split(",");remote.m=[clamp(+p[1]||0,-100,100),clamp(+p[2]||0,-100,100)];remote.at=performance.now();}else if(t==="X"){stop(true);}else if(t.indexOf("F,")===0){var q=t.split(",");remote.f=[clamp(+q[1]||0,-100,100),clamp(+q[2]||0,-100,100),clamp(+q[3]||0,-100,100),clamp(+q[4]||0,-100,100)];remote.at=performance.now();if(veh==="drone")remote.m=[0,0];}else if(t==="ARM"){arm();}}
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
var last=0;function loop(ts){requestAnimationFrame(loop);var v=$("mmcr");if(!v||!v.classList.contains("on")){last=ts;return;}var dt=Math.min(.05,(ts-last)/1000||.016);last=ts;out();if(veh==="drone")dstep(dt);else step(dt);draw();}
function sketch(f){fetch("esp32/"+(typeof f==="string"?f:"mmcr_robot.ino")).then(function(r){return r.text();}).then(function(t){var a=document.createElement("a");a.href=URL.createObjectURL(new Blob([t],{type:"text/plain"}));a.download=(typeof f==="string"?f:"mmcr_robot.ino");a.click();});}
function init(){if(!$("mmcrPad"))return;pad();pad2();[].forEach.call(document.querySelectorAll("#mmcrVeh button"),function(b){b.onclick=function(){setVeh(b.dataset.v);};});$("mmcrArm").onclick=function(){if(role==="phone"&&dc&&dc.readyState==="open")dc.send("ARM");else arm();};
 [].forEach.call(document.querySelectorAll("#mmcrMode button"),function(b){b.onclick=function(){setMode(b.dataset.m);};});
 $("mmcrConnect").onclick=connect;$("mmcrDisc").onclick=disconnect;$("mmcrTilt").onclick=toggleTilt;$("mmcrStop").onclick=function(){stop();};$("mmcrSketch").onclick=function(){sketch();};$("mmcrWifi").onclick=function(){sketch("mmcr_wifi.ino");};
 $("mmcrThr").oninput=function(){thr=this.value/100;$("mmcrThrV").textContent=this.value+"%";};
 $("mmcrHost").onclick=hostPair;$("mmcrJoin").onclick=phonePair;$("mmcrReset").onclick=function(){R.x=160;R.y=260;R.a=-90;R.trail=[];};
 document.addEventListener("keydown",function(e){if(!$("mmcr").classList.contains("on"))return;var k=e.key;if(k==="ArrowUp"||k==="w")jy=1;if(k==="ArrowDown"||k==="s")jy=-1;if(k==="ArrowLeft"||k==="a")jx=-1;if(k==="ArrowRight"||k==="d")jx=1;if(k===" "){stop();e.preventDefault();}});
 document.addEventListener("keyup",function(e){var k=e.key;if(/Arrow|^[wasd]$/.test(k)){jx=jy=0;}});
 document.addEventListener("visibilitychange",function(){if(document.hidden){jx=jy=sx=sy=0;send("S");}});
 [].forEach.call(document.querySelectorAll("#mmcrType button"),function(b){b.onclick=function(){if(ble)disconnect();rtype=b.dataset.t;[].forEach.call(document.querySelectorAll("#mmcrType button"),function(x){x.className=x.dataset.t===rtype?"on":"";});$("mmcrLegoNote").style.display=rtype==="lego"?"block":"none";$("mmcrSketch").style.display=$("mmcrWifi").style.display=rtype==="lego"?"none":"";};});
 setMode("virtual");requestAnimationFrame(loop);}
window.addEventListener("load",init);
return {setRx:function(o){rxc=o;},setType:function(t){rtype=t;},lego:lego,remote:remote,drone:function(){return D;},setSticks:function(a,b,c,d){jx=a;jy=b;sx=d;sy=c;},arm:arm,setVeh:setVeh,mix:mix,setMode:setMode,state:function(){return {R:R,mode:mode,ble:ble};},setJoy:function(x,y){jx=x;jy=y;},stop:stop,tel:onTel,msg:onMsg,cmd:cmd};
})();
