(function(){
"use strict";
var C=Core,W=C.W,H=C.H,st=C.st,LEVELS=C.LEVELS,PARTS=C.PARTS;
var box=document.getElementById("cv"),renderer=null,lastW=0,view="angle",theta=Math.PI/2,radius=300,tab="Controllers";
var $=function(id){return document.getElementById(id);};
// ---------- textures ----------
function tex(w,h,fn,rep){var c=document.createElement("canvas");c.width=w;c.height=h;fn(c.getContext("2d"),w,h);var t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping;}return t;}
function speckle(g,w,h,n,cols,sz){for(var i=0;i<n;i++){g.fillStyle=cols[i%cols.length];g.fillRect(Math.random()*w,Math.random()*h,sz*(0.5+Math.random()),sz*(0.5+Math.random()));}}
var brick=tex(256,128,function(g,w,h){g.fillStyle="#a8553a";g.fillRect(0,0,w,h);speckle(g,w,h,900,["#8f4630","#b8664a","#9c4d35"],5);g.strokeStyle="#d8c9b8";g.lineWidth=3;for(var r=0;r<4;r++){var y=r*32;g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();for(var x=(r%2)*32;x<w;x+=64){g.beginPath();g.moveTo(x,y);g.lineTo(x,y+32);g.stroke();}}},true);
var grass=World.grassTex();
var concrete=tex(256,256,function(g,w,h){g.fillStyle="#8d96a0";g.fillRect(0,0,w,h);speckle(g,w,h,2500,["#838c96","#98a1ab","#7b848e"],3);},true);concrete.repeat.set(12,12);
var skyTex=tex(8,256,function(g,w,h){var gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,"#5aa0e0");gr.addColorStop(0.6,"#a9d2f0");gr.addColorStop(1,"#e6f1f7");g.fillStyle=gr;g.fillRect(0,0,w,h);});
var TILECOL={red:"#d32f2f",green:"#2e9e4f",blue:"#1e63d6"};
function paintLake(g,w,h,S){var gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,"#1f6c9c");gr.addColorStop(0.75,"#2f8fc0");gr.addColorStop(1,"#4aa8d0");g.fillStyle=gr;g.fillRect(0,0,w,h);
 g.strokeStyle="rgba(255,255,255,.18)";g.lineWidth=2;for(var i=0;i<160;i++){var x=Math.random()*w*0.9,y=Math.random()*h,r=(5+Math.random()*12)*S/2;g.beginPath();g.arc(x,y,r,Math.PI*1.1,Math.PI*1.9);g.stroke();}
 var sg=g.createLinearGradient(w*0.86,0,w*0.91,0);sg.addColorStop(0,"rgba(214,190,140,0)");sg.addColorStop(1,"rgba(214,190,140,1)");g.fillStyle=sg;g.fillRect(w*0.86,0,w*0.14,h);}
function paintRoad(g,w,h,S){g.fillStyle="#6f8a49";g.fillRect(0,0,w,h);speckle(g,w,h,3000,["#5f7a3d","#7e9856","#6a8444"],4);g.fillStyle="#a07850";g.fillRect(0,48*S,w,10*S);g.fillRect(0,142*S,w,10*S);
 g.fillStyle="#3b3f45";g.fillRect(0,56*S,w,88*S);speckle(g,w,56*S+88*S,9000,["#33373c","#454a50","#3f4349"],2);
 g.fillStyle="#f2f2f2";g.fillRect(0,60*S,w,1.6*S);g.fillRect(0,138.4*S,w,1.6*S);
 g.fillStyle="#f6c700";for(var x=0;x<w;x+=26*S){g.fillRect(x,99*S,14*S,2*S);}}
function floorTex(i){
 var l=LEVELS[i],S=4;
 return tex(W*S,H*S,function(g,w,h){
  var tape=l.floor==="tape",farm=l.floor==="farm";
  if(l.floor==="lake"){paintLake(g,w,h,S);}else if(l.floor==="road"){paintRoad(g,w,h,S);}
  else if(farm){World.paintSoil(g,0,0,w,h,"field",3);}
  else{World.paintFloor(g,w,h,tape);
   g.strokeStyle=tape?"rgba(160,170,180,.35)":"rgba(120,130,140,.4)";g.lineWidth=2;for(var x=0;x<=w;x+=25*S){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke();}for(var y=0;y<=h;y+=25*S){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();}}
  st.plots.forEach(function(p){
   var x=p.x*S,y=p.y*S,pw=p.w*S,ph=p.h*S;World.paintSoil(g,x,y,pw,ph,p.dry?"dry":"wet",11+Math.round(p.x));
   g.strokeStyle="rgba(60,40,22,.55)";g.lineWidth=5;g.strokeRect(x,y,pw,ph);});
  (l.tiles||[]).forEach(function(t){g.fillStyle=TILECOL[t[4]]||"#888";g.fillRect(t[0]*S,t[1]*S,t[2]*S,t[3]*S);g.strokeStyle="rgba(255,255,255,.6)";g.lineWidth=4;g.strokeRect(t[0]*S,t[1]*S,t[2]*S,t[3]*S);});
  (l.shade||[]).forEach(function(t){g.fillStyle="rgba(10,15,30,.42)";g.fillRect(t[0]*S,t[1]*S,t[2]*S,t[3]*S);g.fillStyle="rgba(255,255,255,.7)";g.font="bold 34px sans-serif";g.fillText("SHADE",t[0]*S+20,t[1]*S+50);});
  (l.hot||[]).forEach(function(t){var gr=g.createLinearGradient(t[0]*S,0,(t[0]+t[2])*S,0);gr.addColorStop(0,"rgba(255,120,30,.55)");gr.addColorStop(1,"rgba(255,60,20,.55)");g.fillStyle=gr;g.fillRect(t[0]*S,t[1]*S,t[2]*S,t[3]*S);g.fillStyle="#fff";g.font="bold 34px sans-serif";g.fillText("HOT ZONE",t[0]*S+14,t[1]*S+50);});
  (l.zonesDef||[]).forEach(function(z,k){g.fillStyle="rgba(120,190,120,.28)";g.fillRect(z[0]*S,z[1]*S,z[2]*S,z[3]*S);g.strokeStyle="#2e7d32";g.lineWidth=5;g.setLineDash([18,10]);g.strokeRect(z[0]*S,z[1]*S,z[2]*S,z[3]*S);g.setLineDash([]);g.fillStyle="#1b5e20";g.font="bold 36px sans-serif";g.fillText("BAY "+(k+1),z[0]*S+16,z[1]*S+46);});
  if(l.track){g.strokeStyle="#15171a";g.lineWidth=3*S;g.lineJoin="round";g.lineCap="round";g.beginPath();l.track.forEach(function(p,k){if(k)g.lineTo(p[0]*S,p[1]*S);else g.moveTo(p[0]*S,p[1]*S);});g.stroke();}
  if(l.goal){var q=l.goal;g.fillStyle="rgba(34,197,94,.55)";g.fillRect(q[0]*S,q[1]*S,q[2]*S,q[3]*S);g.save();g.beginPath();g.rect(q[0]*S,q[1]*S,q[2]*S,q[3]*S);g.clip();g.strokeStyle="rgba(255,255,255,.55)";g.lineWidth=8;for(var d=-q[3]*S;d<q[2]*S+q[3]*S;d+=28){g.beginPath();g.moveTo(q[0]*S+d,q[1]*S);g.lineTo(q[0]*S+d+q[3]*S,q[1]*S+q[3]*S);g.stroke();}g.restore();g.strokeStyle="#15803d";g.lineWidth=6;g.strokeRect(q[0]*S,q[1]*S,q[2]*S,q[3]*S);}
  var s=l.start;if(!l.drone&&!l.arm&&!l.station){g.fillStyle="rgba(37,99,235,.35)";g.beginPath();g.arc(s.x*S,s.y*S,10*S,0,7);g.fill();}
 });
}
// ---------- scene ----------
var scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(48,1.5,1,2000);
try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});}catch(e){box.textContent="3D graphics are not supported on this device.";}
if(renderer){renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;box.appendChild(renderer.domElement);}
scene.background=skyTex;scene.fog=new THREE.Fog(0xcfe3ee,420,1100);
var hemi=new THREE.HemisphereLight(0xdcecff,0x6b6a58,0.65);scene.add(hemi);
var sun=new THREE.DirectionalLight(0xfff1d6,0.95);sun.position.set(40,260,-60);sun.target.position.set(150,0,100);scene.add(sun,sun.target);
World.init(THREE,scene,sun,sun.target.position);var fill=new THREE.DirectionalLight(0xbcd4ff,0.4);fill.position.set(-120,140,160);fill.target.position.set(150,0,100);scene.add(fill,fill.target);sun.shadow.mapSize.set(1536,1536);var shc=sun.shadow.camera;shc.left=-230;shc.right=230;shc.top=170;shc.bottom=-170;shc.near=10;shc.far=700;sun.shadow.bias=-0.0006;
var ground=new THREE.Mesh(new THREE.PlaneGeometry(2400,2400),new THREE.MeshStandardMaterial({map:grass,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.set(150,-0.3,100);ground.receiveShadow=true;scene.add(ground);
var floor=new THREE.Mesh(new THREE.PlaneGeometry(W,H),new THREE.MeshStandardMaterial({roughness:0.85}));floor.rotation.x=-Math.PI/2;floor.position.set(W/2,0,H/2);floor.receiveShadow=true;scene.add(floor);
var levelGroup=new THREE.Group();scene.add(levelGroup);
function M(c,r,m){return new THREE.MeshStandardMaterial({color:c,roughness:r===undefined?0.6:r,metalness:m||0});}
function EM(c,i){return new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:i||1.2});}
function mk(g,m,x,y,z,parent,cast){var o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=cast!==false;o.receiveShadow=true;(parent||scene).add(o);return o;}
function B(w,h,d,m,x,y,z,p,c){return mk(new THREE.BoxGeometry(w,h,d),m,x,y,z,p,c);}
function Cy(r,h,m,x,y,z,p,rx,rz){var o=mk(new THREE.CylinderGeometry(r,r,h,18),m,x,y,z,p);if(rx)o.rotation.x=rx;if(rz)o.rotation.z=rz;return o;}
// ---------- robot base ----------
var bot=new THREE.Group(),wheels=[],wheels2=[],spray,partsGroup=new THREE.Group(),fx={},curInst=null;
(function(){
 HD.robot(bot,wheels,wheels2);
 var wm=new THREE.MeshBasicMaterial({color:0x4aa8ff,transparent:true,opacity:0.45,depthWrite:false});
 spray=new THREE.Mesh(new THREE.CylinderGeometry(5,1.2,13,14,1,true),wm);spray.position.set(7,9,0);spray.visible=false;bot.add(spray);
 bot.add(partsGroup);
})();
scene.add(bot);
var rayLines={},hitDots={};
["front","left","right"].forEach(function(k){var l=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),new THREE.LineBasicMaterial({color:0xff3b3b,transparent:true,opacity:0.85}));l.frustumCulled=false;l.visible=false;scene.add(l);rayLines[k]=l;
 var d=new THREE.Mesh(new THREE.SphereGeometry(1.2,8,8),new THREE.MeshBasicMaterial({color:0xff3b3b}));d.visible=false;scene.add(d);hitDots[k]=d;});
var cubeMesh=B(8,8,8,M(0xc08a4b,0.8),0,4,0,scene);cubeMesh.visible=false;

// ---------- robot arm (3D) ----------
var beltTex=null,AR=C.ARM,armG=new THREE.Group(),aT=new THREE.Group(),aS=new THREE.Group(),aE=new THREE.Group(),aFing=[],gripGap=20,cubeMeshes=[];
(function(){
 armG.position.set(AR.x,0,AR.y);scene.add(armG);armG.add(aT);HD.arm(armG,aT,aS,aE,aFing,AR);
 armG.visible=false;
})();
function buildArmLevel(l){
 var CC={red:0xd32f2f,blue:0x1e63d6,orange:0xf08a24},BC={red:0xb71c1c,blue:0x0d47a1,any:0x6b7280};
 cubeMeshes=[];
 (l.bins||[]).forEach(function(r){var col=BC[r[4]]||BC.any,m=M(col,0.7),x=r[0]+r[2]/2,z=r[1]+r[3]/2,t=2;
  B(r[2],1.5,r[3],M(0x1f2937,0.9),x,0.8,z,levelGroup);B(r[2],10,t,m,x,5,r[1],levelGroup);B(r[2],10,t,m,x,5,r[1]+r[3],levelGroup);B(t,10,r[3],m,r[0],5,z,levelGroup);B(t,10,r[3],m,r[0]+r[2],5,z,levelGroup);});
 beltTex=null;
 if(l.belt){var bt=l.belt,cx=bt.x+bt.w/2,cz=bt.y+bt.h/2;
  beltTex=tex(256,64,function(g,w,h){g.fillStyle="#2b2f36";g.fillRect(0,0,w,h);g.strokeStyle="#4b525d";g.lineWidth=7;for(var i=-1;i<5;i++){g.beginPath();g.moveTo(i*64+10,h);g.lineTo(i*64+40,h/2);g.lineTo(i*64+10,0);g.stroke();}g.fillStyle="#1d2025";g.fillRect(0,0,w,5);g.fillRect(0,h-5,w,5);},true);
  beltTex.repeat.set(bt.w/24,1);
  var bm=new THREE.Mesh(new THREE.PlaneGeometry(bt.w,bt.h),new THREE.MeshStandardMaterial({map:beltTex,roughness:0.85}));bm.rotation.x=-Math.PI/2;bm.position.set(cx,0.5,cz);bm.receiveShadow=true;levelGroup.add(bm);
  var steel=M(0x9aa4b2,0.35,0.7),dark=M(0x3b4250,0.6,0.3);
  B(bt.w+8,3.2,2.4,steel,cx,1.6,bt.y-1.2,levelGroup);B(bt.w+8,3.2,2.4,steel,cx,1.6,bt.y+bt.h+1.2,levelGroup);
  [bt.x-2,bt.x+bt.w+2].forEach(function(rx){Cy(2.6,bt.h+2,dark,rx,2.2,cz,levelGroup,Math.PI/2);});
  B(14,14,bt.h+10,M(0xf59e0b,0.6),bt.x-12,7,cz,levelGroup);
  var ring=new THREE.Mesh(new THREE.RingGeometry(9,11,40),new THREE.MeshBasicMaterial({color:0xfacc15,side:THREE.DoubleSide,transparent:true,opacity:0.95}));ring.rotation.x=-Math.PI/2;ring.position.set(bt.spot,0.9,cz);levelGroup.add(ring);
  var bar=new THREE.Mesh(new THREE.PlaneGeometry(2,bt.h+4),new THREE.MeshBasicMaterial({color:0xfacc15,transparent:true,opacity:0.8}));bar.rotation.x=-Math.PI/2;bar.position.set(bt.spot-8,0.9,cz);levelGroup.add(bar);
 }else (l.cubes||[]).forEach(function(q){B(17,0.4,17,M(0xaab4c0,0.9),q[0],0.2,q[1],levelGroup);});
 st.cubes.forEach(function(q){var m=B(12,12,12,M(CC[q.c]||0xf08a24,0.55),q.x,q.z,q.y,levelGroup);cubeMeshes.push(m);});
}
function drawArm(){
 var ar=st.arm;aT.rotation.y=ar.b*Math.PI/180;aS.rotation.z=ar.s*Math.PI/180;aE.rotation.z=-ar.e*Math.PI/180;
 var tg=ar.held?12.4:ar.g?5:20;gripGap+=(tg-gripGap)*0.25;aFing.forEach(function(f){var z=f.userData.sd*(gripGap/2+0.8);f.position.z=z;f.userData.tip.position.z=z;});
 st.cubes.forEach(function(q,i){var m=cubeMeshes[i];if(m)m.position.set(q.x,q.z,q.y);});
 if(beltTex&&st.belt&&st.belt.on)beltTex.offset.x+=L_BELT()*0.016/24;
}
function L_BELT(){return (LEVELS[st.lvl].belt||{speed:0}).speed;}

// ---------- drone (3D) ----------
var droneG=new THREE.Group(),props=[],droneShadow,droneLeds=[];
(function(){
 var inner=new THREE.Group();droneG.add(inner);droneG.userData.inner=inner;HD.drone(inner,props,droneLeds);
 var dsc=document.createElement("canvas");dsc.width=dsc.height=128;var dsg=dsc.getContext("2d"),dgr=dsg.createRadialGradient(64,64,4,64,64,62);dgr.addColorStop(0,"rgba(0,0,0,.6)");dgr.addColorStop(.6,"rgba(0,0,0,.25)");dgr.addColorStop(1,"rgba(0,0,0,0)");dsg.fillStyle=dgr;dsg.fillRect(0,0,128,128);var dst=new THREE.Texture(dsc);dst.needsUpdate=true;droneShadow=new THREE.Mesh(new THREE.PlaneGeometry(30,30),new THREE.MeshBasicMaterial({map:dst,transparent:true,depthWrite:false}));droneShadow.rotation.x=-Math.PI/2;droneShadow.position.y=0.15;scene.add(droneShadow);
 droneG.visible=false;droneShadow.visible=false;scene.add(droneG);
})();
function padTex(){var cv=document.createElement("canvas");cv.width=cv.height=256;var g=cv.getContext("2d");g.fillStyle="#d9480f";g.beginPath();g.arc(128,128,124,0,7);g.fill();g.fillStyle="#fff7ed";g.beginPath();g.arc(128,128,108,0,7);g.fill();g.fillStyle="#d9480f";g.font="bold 150px sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText("H",128,142);return new THREE.CanvasTexture(cv);}
var nightLamps=[];
function setNight(on){hemi.intensity=on?0.22:0.65;fill.intensity=on?0.05:0.4;sun.intensity=on?0.18:0.95;sun.color.set(on?0x8fa8ff:0xfff1d6);hemi.color.set(on?0x5a6a9a:0xdcecff);
 scene.background=on?nightTex:skyTex;World.setNight(on);if(on)scene.fog.color.set(0x0b1224);scene.fog.near=on?200:420;scene.fog.far=on?650:1100;}
var nightTex=tex(8,256,function(g,w,h){var gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,"#050914");gr.addColorStop(0.6,"#122046");gr.addColorStop(1,"#26335f");g.fillStyle=gr;g.fillRect(0,0,w,h);for(var i=0;i<14;i++){g.fillStyle="rgba(255,255,255,"+(0.4+Math.random()*0.5)+")";g.fillRect(Math.random()*w,Math.random()*h*0.55,1,1);}});
function buildDroneLevel(l){
 nightLamps=[];setNight(!!l.night);
 if(l.pads){l.pads.forEach(function(p,i){var m=new THREE.Mesh(new THREE.CircleGeometry(p[2],40),new THREE.MeshStandardMaterial({map:padTex(),roughness:0.7,emissive:0x000000}));m.rotation.x=-Math.PI/2;m.position.set(p[0],0.25,p[1]);levelGroup.add(m);
  B(2,34,2,M(0x4b5563,0.5,0.4),p[0]+p[2]+6,17,p[1],levelGroup);
  var bulb=new THREE.Mesh(new THREE.SphereGeometry(4,16,12),new THREE.MeshBasicMaterial({color:0x2a2f3a}));bulb.position.set(p[0]+p[2]+6,37,p[1]);levelGroup.add(bulb);
  var pl=new THREE.PointLight(0xffe2a0,0,170,1.6);pl.position.set(p[0]+p[2]+2,40,p[1]);levelGroup.add(pl);
  nightLamps.push({m:m,bulb:bulb,pl:pl});});}

 if(l.pad){var p=l.pad,m=new THREE.Mesh(new THREE.CircleGeometry(p[2],40),new THREE.MeshStandardMaterial({map:padTex(),roughness:0.7}));m.rotation.x=-Math.PI/2;m.position.set(p[0],0.25,p[1]);m.receiveShadow=true;levelGroup.add(m);}
 if(l.gate){var g=l.gate,gx=g[0],gy=g[1],gw=g[2],z0=g[3],z1=g[4],mat=M(0xf97316,0.45,0.1),t=4;
  B(t,z1+6,t,mat,gx,(z1+6)/2,gy-gw/2-t/2,levelGroup);B(t,z1+6,t,mat,gx,(z1+6)/2,gy+gw/2+t/2,levelGroup);
  B(t,t,gw+2*t,mat,gx,z1+3,gy,levelGroup);B(t,z0,gw+2*t,M(0xea580c,0.5),gx,z0/2,gy,levelGroup);
  for(var k=0;k<6;k++)B(t+0.2,3,3,M(k%2?0xffffff:0xf97316,0.5),gx,z1+3,gy-gw/2+gw*(k/5),levelGroup);}
}
function drawDrone(){
 var d=st.drone;nightLamps.forEach(function(n,i){var on=i===d.lit;n.bulb.material.color.set(on?0xfff2b0:0x2a2f3a);n.pl.intensity=on?1.6:0;n.m.material.emissive.set(on?0x5a4a20:0x000000);});
 var r=st.robot,t=performance.now()/1000,bob=d.flying?Math.sin(t*3)*0.8:0;
 droneG.position.set(r.x,d.z+bob,r.y);droneG.rotation.y=-r.a*Math.PI/180;
 var tilt=d.flying?0.04*Math.sin(t*2):0;droneG.userData.inner.rotation.z=tilt;
 droneShadow.position.set(r.x,0.15,r.y);var k=1+d.z/160;droneShadow.scale.setScalar(k);droneShadow.material.opacity=Math.max(0.08,0.32-d.z/450);
 props.forEach(function(p){p.rotation.y+=d.flying?0.9*p.userData.dir:0;p.userData.disc.material.opacity=d.flying?0.22:0;});
 droneLeds.forEach(function(l,i){var on=d.flying?(Math.sin(t*10+i)>-0.3):true;l.visible=on;});
}
// ---------- robot parts (3D) ----------
var DECK=[[-6,-3.4],[-6,3.4],[-3,-4],[-3,4],[0,-4.2],[0,4.2],[3.5,-4.2],[3.5,4.2],[-6,0],[6,-3.8],[6,3.8],[-1,0]];
function buildRobotParts(){
 while(partsGroup.children.length)partsGroup.remove(partsGroup.children[0]);fx={fingers:[],leds:[]};
 var g=partsGroup,silver=M(0xc7ccd1,0.25,0.9),black=M(0x0b0f14,0.5),deckUsed=0;
 function pcb(w,h,d,col,x,y,z,p,pid){if(pid&&typeof PIC!=="undefined"&&PIC.has(pid)){var sd=M(col,0.5,0.1),tp=new THREE.MeshStandardMaterial({map:PIC.texture(pid,THREE),roughness:0.55,metalness:0.05});return mk(new THREE.BoxGeometry(w,h,d),[sd,sd,tp,sd,sd,sd],x,y,z,p||g);}return B(w,h,d,M(col,0.45,0.1),x,y,z,p||g);}
 function slotPos(){var n=parseInt(String(curInst&&curInst.mount||"").replace("deck",""))||1;return DECK[(Math.max(1,n)-1)%DECK.length];}
 var hasDeck=st.parts.some(function(i){return PARTS[i.pid].ctl&&i.mount;});
 if(hasDeck){for(var px=-6;px<=6;px+=12)for(var pz=-4;pz<=4;pz+=8)Cy(0.4,3.4,silver,px,5.6,pz,g);B(15,0.5,10.5,M(0x263238,0.5,0.2),0,7.4,0,g);}
 var prevMark=null;function tagPrev(){if(!prevMark)return;for(var k=prevMark.n;k<g.children.length;k++)g.children[k].traverse(function(o){o.userData.mount=prevMark.m;});prevMark=null;}
 st.parts.forEach(function(i){
  tagPrev();if(!i.mount)return;curInst=i;prevMark={m:i.mount,n:g.children.length};
  var p=PARTS[i.pid],id=i.pid,col=p.col,s;
  if(p.ctl){
   var dims={uno:[6.8,1,5.3],nano:[4.3,0.8,1.8],esp32:[5,0.8,2.8],pi4:[8.4,1.5,5.6],pico:[4.4,0.6,2],microbit:[4.2,0.8,3.5]}[id];
   var b=pcb(dims[0],dims[1],dims[2],col,0,8.1+dims[1]/2,0,g,id);
   if(id==="microbit"){var gl=EM(0xff3030,1.1);for(var r=0;r<3;r++)for(var c=0;c<3;c++)mk(new THREE.BoxGeometry(0.4,0.2,0.4),gl,-0.8+c*0.8,9.0,-0.8+r*0.8,g,false);}
   return;
  }
  if(p.single==="power"){var bm=B(5.5,2.8,4.3,M(col,0.5),-4.5,5.4,0,g);B(5.6,0.5,4.4,black,-4.5,5.4,0,g);return;}
  if(p.single==="driver"){pcb(3.6,0.8,3.6,col,1.2,4.5,0,g);B(1.4,1.4,2,M(0x111,0.5),1.2,5.4,0,g);return;}
  if(p.single==="motors"){[-1,1].forEach(function(sd){B(5,2.2,2.2,M(0xffc107,0.5),-1.5,3.5,sd*4.6,g);});return;}
  if(p.slotType==="dist"){
   var grp=new THREE.Group();g.add(grp);var pos={front:[7.6,0],left:[0,-5.6],right:[0,5.6]}[i.slot];grp.position.set(pos[0],6.0,pos[1]);grp.rotation.y={front:0,left:Math.PI/2,right:-Math.PI/2}[i.slot];
   if(id==="us"){B(1.2,3.8,8.2,M(col,0.5),0,0,0,grp);[-2.3,2.3].forEach(function(z){Cy(1.6,1.6,silver,0.9,0.2,z,grp,0,Math.PI/2);Cy(1.1,0.4,M(0x0a0a0a,0.7),1.7,0.2,z,grp,0,Math.PI/2);});}
   else if(id==="sharp"){B(1.6,2.4,4.2,M(0x2b2b2b,0.5),0,0,0,grp);B(0.5,1.4,1.2,M(0xf57c00,0.5),0.9,0,-1,grp);B(0.5,1.4,1.2,black,0.9,0,1,grp);}
   else{B(1,2.2,3.6,M(0x6d4c41,0.5),0,0,0,grp);mk(new THREE.SphereGeometry(0.6,8,8),EM(0xff2020,1.2),0.7,0.2,-1,grp,false);mk(new THREE.SphereGeometry(0.6,8,8),M(0xe0f7fa,0.2),0.7,0.2,1,grp,false);}
   return;
  }
  if(id==="line"){var z=i.slot==="left"?-4:4;B(1.6,0.9,1.6,black,7.6,2.3,z,g);mk(new THREE.BoxGeometry(0.4,0.3,0.5),EM(0xff2020,1.5),8.5,2.2,z,g,false);return;}
  if(id==="color"){B(2,0.8,3,M(col,0.5),8,2.2,0,g);[-1,1].forEach(function(a){[-0.4,0.4].forEach(function(b){mk(new THREE.SphereGeometry(0.28,6,6),EM(0xffffff,2),8.6+b*0.0,2.0,a*0.9+b,g,false);});});return;}
  if(id==="soil"){[-0.8,0.8].forEach(function(z){B(0.5,6,0.3,M(0xd4b34a,0.5),9.4,3,z,g);});B(1.4,1.2,2.6,M(0x1b5e20,0.5),9.4,6.3,0,g);return;}
  if(id==="encoder"){[-1,1].forEach(function(sd){Cy(2.4,0.4,black,-1.5,3.5,sd*5.4,g,Math.PI/2);});return;}
  if(id==="bumper"){B(0.9,1.4,9.5,M(0xb71c1c,0.5),9.6,3.2,0,g);[-3.5,3.5].forEach(function(z){B(2.4,0.5,0.5,M(0x888,0.5),8.4,3.2,z,g);});return;}
  if(id==="camera"){B(2,2.2,3.4,M(0x263238,0.4),6.8,9.3,0,g);Cy(0.9,1,M(0x10243a,0.2),8,9.3,0,g,0,Math.PI/2);return;}
  if(id==="servo"){B(2.6,2.4,3,M(col,0.5),8.2,4.3,0,g);[-1,1].forEach(function(sd){var f=B(5.4,0.9,0.6,M(0xeeeeee,0.5),11.2,4.3,sd*3,g);f.userData.sd=sd;fx.fingers.push(f);});return;}
  if(id==="led"){var pp=slotPos();var m=mk(new THREE.SphereGeometry(0.95,10,8),EM(0x333333,0.1),pp[0],8.5,pp[1],g,false);fx.led=m;return;}
  if(id==="fan"){var pf=slotPos(),fg=new THREE.Group();fg.position.set(pf[0],9.2,pf[1]);g.add(fg);Cy(2.6,0.3,M(0x37474f,0.5),0,-0.2,0,fg);for(var k=0;k<4;k++){var bl=B(2.4,0.15,0.9,M(0xe0e0e0,0.4),0,0,0,fg);bl.rotation.y=k*Math.PI/2;bl.position.set(Math.cos(k*Math.PI/2)*1.2,0,Math.sin(k*Math.PI/2)*1.2);bl.rotation.y=-k*Math.PI/2;}fx.fan=fg;return;}
  if(id==="lcd"){var pl=slotPos();pcb(4.6,0.3,2,0x1b5e20,pl[0],8.4,pl[1],g,"lcd");fx.lcd=B(3.6,0.2,1.2,M(0x0d2b2b,0.2),pl[0],8.65,pl[1],g,false);return;}
  if(id==="buzzer"){var pb=slotPos();Cy(1.2,1.2,black,pb[0],8.7,pb[1],g);return;}
  if(id==="pump"){var pq=slotPos();B(2.4,1.8,2.4,M(col,0.5),pq[0],8.7,pq[1],g);var tank=Cy(1.8,3,new THREE.MeshStandardMaterial({color:0x4aa8ff,transparent:true,opacity:0.55,roughness:0.2}),pq[0],10.6,pq[1],g);return;}
  if(id==="dht"){var pd=slotPos();B(2,2.4,1.4,M(0x1e88e5,0.5),pd[0],9.2,pd[1],g);B(1.4,0.3,0.2,black,pd[0],9.4,pd[1]+0.75,g,false);return;}
  if(id==="dht2")return;
  if(id==="ldr"||id==="imu"||id==="compass"||id==="relay"||id==="shifter"||id==="adc"||id==="buck"){var po=slotPos();var sz=id==="relay"?[2.8,1.6,2]:id==="buck"?[2.4,1.2,1.6]:id==="adc"?[2.8,0.6,1.6]:[1.8,0.5,1.8];
   var o=pcb(Math.max(sz[0],2.6),sz[1],Math.max(sz[2],2),col,po[0],8.4+sz[1]/2,po[1],g,id);return;}
  if(typeof PIC!=="undefined"&&PIC.has(id)&&id!=="armkit"&&id!=="dronekit"&&!p.single){var pf2=slotPos(),zz=PIC.SZ[id]||[60,40],ww=Math.min(5,Math.max(2.2,zz[0]*0.034)),dd=Math.min(4,Math.max(1.6,zz[1]*0.034));pcb(ww,0.5,dd,col,pf2[0],8.5,pf2[1],g,id);}
 });
 tagPrev();
}
// ---------- level ----------
var plantMeshes=[],lastWet=[],lastWetBuilt=0;
function tree(x,z,s,v){World.tree(levelGroup,x,z,s,v===undefined?Math.round(x/10)+Math.round(z/10):v);}
SCN3D.init({THREE:THREE,M:M,B:B,Cy:Cy,World:World,scene:scene,C:C,AR:AR,box:box});
function buildLevel(){
 var l=LEVELS[st.lvl];
 while(levelGroup.children.length)levelGroup.remove(levelGroup.children[0]);plantMeshes=[];World.resetPlants();
 if(floor.material.map)floor.material.map.dispose();
 floor.material.map=floorTex(st.lvl);floor.material.needsUpdate=true;
 ground.material.map=(l.floor==="farm"||l.floor==="lake"||l.floor==="road")?grass:World.murramTex();ground.material.needsUpdate=true;
 scene.fog.color.set(0xcfe3ee);setNight(!!l.night);
 var bm=function(w,h){if(l.id==="escarp")return World.rockMat(w,h);var t=brick.clone();t.needsUpdate=true;t.repeat.set(Math.max(1,w/22),Math.max(1,h/22));return new THREE.MeshStandardMaterial({map:t,roughness:0.9});};
 var wH=l.wallH||16;l.walls.forEach(function(r){var w=r[2],d=r[3];B(w,wH,d,bm(Math.max(w,d),wH),r[0]+w/2,wH/2,r[1]+d/2,levelGroup);B(w+0.6,1,d+0.6,M(0x8a8f96,0.8),r[0]+w/2,wH+0.4,r[1]+d/2,levelGroup);});
 var bw=l.floor==="farm"?M(0x8b6a43,0.9):M(0x7b838c,0.8),th=3;
 B(W+2*th,6,th,bw,W/2,3,-th/2,levelGroup);B(W+2*th,6,th,bw,W/2,3,H+th/2,levelGroup);B(th,6,H,bw,-th/2,3,H/2,levelGroup);B(th,6,H,bw,W+th/2,3,H/2,levelGroup);
 if(l.goal){var g=l.goal;var ed=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(g[2],12,g[3])),new THREE.LineBasicMaterial({color:0x16a34a}));ed.position.set(g[0]+g[2]/2,6,g[1]+g[3]/2);levelGroup.add(ed);
  B(0.5,16,0.5,M(0xe5e7eb,0.4,0.5),g[0]+g[2]-2,8,g[1]+2,levelGroup);B(7,4,0.3,M(0x16a34a,0.6),g[0]+g[2]-5.5,14,g[1]+2,levelGroup);}
 st.plots.forEach(function(p,i){
  plantMeshes[i]=World.buildPlot(levelGroup,p,i,p.dry&&!p.watered);
  lastWetBuilt=1;
 });
 (l.zonesDef||[]).forEach(function(z){if(l.id==="solar")World.solarRow(levelGroup,z);else World.greenhouse(levelGroup,z);});
 if(l.floor==="farm"){tree(-30,40,1,0);tree(-50,170,1.1,1);tree(330,30,1.2,0);tree(350,150,1,1);tree(120,-60,1.2,0);tree(240,-80,1,1);tree(60,270,1.1,1);tree(250,270,1,0);tree(-110,100,1.25,0);tree(430,90,1.15,1);World.tufts(levelGroup,W,H,qHigh()?900:0);}
 else{World.shed(levelGroup,W/2-70,-46,76,30,17,1,"176,84,52");World.shed(levelGroup,W/2+62,-50,50,26,14,2,"58,108,148");tree(-60,60,1.1,0);tree(W+70,40,1.2,1);tree(W+60,175,1,0);tree(150,-110,1.25,0);tree(-75,175,1,1);World.tufts(levelGroup,W,H,qHigh()?600:0);}
 lastWet=st.plots.map(function(p){return p.watered;});
 if(l.arm)buildArmLevel(l);
 if(l.drone)buildDroneLevel(l);
 try{SCN3D.build(levelGroup,l,st.S);}catch(e){try{console.error(e);}catch(_){}}
}
function refreshPlot(i){var p=st.plots[i];if(!p)return;World.setPlotState(plantMeshes[i],p.dry&&!p.watered);}
function qHigh(){var q=document.getElementById("quality");return !q||q.value==="high";}
// ---------- camera ----------
function placeCamera(){
 var a=st.robot.a*Math.PI/180,x=st.robot.x,y=st.robot.y;
 if(view==="top"){camera.position.set(W/2,250,H/2+0.1);camera.lookAt(W/2,0,H/2);}
 else if(LEVELS[st.lvl].drone&&view==="chase"){var dz=st.drone.z;camera.position.set(x-Math.cos(a)*48,dz+26,y-Math.sin(a)*48);camera.lookAt(x+Math.cos(a)*40,dz+4,y+Math.sin(a)*40);}
 else if(LEVELS[st.lvl].drone){var ph3=0.5,r3=radius*1.2;camera.position.set(150+r3*Math.cos(ph3)*Math.cos(theta),r3*Math.sin(ph3)+20,100+r3*Math.cos(ph3)*Math.sin(theta));camera.lookAt(150,28,100);}
 else if(LEVELS[st.lvl].arm&&view==="chase"){camera.position.set(AR.x,78,AR.y+62);camera.lookAt(AR.x,16,AR.y-55);}
 else if(LEVELS[st.lvl].arm){var ph2=LEVELS[st.lvl].belt?0.62:0.5,r2=radius*(LEVELS[st.lvl].belt?0.86:0.62);camera.position.set(150+r2*Math.cos(ph2)*Math.cos(theta),r2*Math.sin(ph2),125+r2*Math.cos(ph2)*Math.sin(theta));camera.lookAt(150,22,125);}
 else if(view==="close"){var rc=Math.max(40,Math.min(90,radius*0.2)),phc=0.42;camera.position.set(x+rc*Math.cos(phc)*Math.cos(theta),rc*Math.sin(phc)+4,y+rc*Math.cos(phc)*Math.sin(theta));camera.lookAt(x,5,y);}
 else if(view==="chase"){camera.position.set(x-Math.cos(a)*34,22,y-Math.sin(a)*34);camera.lookAt(x+Math.cos(a)*34,5,y+Math.sin(a)*34);}
 else{var cx=W/2,cz=H/2-5,ph=0.62;camera.position.set(cx+radius*Math.cos(ph)*Math.cos(theta),radius*Math.sin(ph),cz+radius*Math.cos(ph)*Math.sin(theta));camera.lookAt(cx,0,cz);}
}
var down=null;
box.addEventListener("pointerdown",function(e){down=e.clientX;});
window.addEventListener("pointerup",function(){down=null;});
window.addEventListener("pointermove",function(e){if(down!==null&&view==="angle"){theta-=(e.clientX-down)*0.008;down=e.clientX;}});
box.addEventListener("wheel",function(e){if(view==="angle"){radius=Math.max(120,Math.min(520,radius+e.deltaY*0.3));e.preventDefault();}},{passive:false});
function setView(v){view=v;[].forEach.call($("views").children,function(b){b.className=b.dataset.v===v?"on":"";});}
function setQuality(q){if(!renderer)return;World.setDetail(q==="hd"?"high":q);var hi=q==="high"||q==="hd",hd=q==="hd";renderer.shadowMap.enabled=hi;renderer.shadowMap.type=THREE.PCFSoftShadowMap;sun.castShadow=hi;
 var ms=hd?2048:1536;if(sun.shadow.mapSize.x!==ms){sun.shadow.mapSize.set(ms,ms);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}}
 renderer.setPixelRatio(hi?Math.min(window.devicePixelRatio||1,hd?3:2):1);scene.fog.near=hi?420:2000;
 hemi.intensity=0.65;
 lastW=0;scene.traverse(function(o){if(o.material)o.material.needsUpdate=true;});}
// ---------- audio ----------
var actx=null,lastBeeps=0;
function ensureAudio(){try{if(!actx){var A=window.AudioContext||window.webkitAudioContext;if(A)actx=new A();}if(actx&&actx.state==="suspended")actx.resume();}catch(e){}}
function beep(){try{if(!actx)return;var o=actx.createOscillator(),g=actx.createGain();o.frequency.value=880;g.gain.value=0.08;o.connect(g);g.connect(actx.destination);o.start();o.stop(actx.currentTime+0.25);}catch(e){}}
// ---------- draw ----------
var clock=0,grip=0,frameN=0,LEDCOL={red:0xff2222,green:0x22dd44,blue:0x2266ff,yellow:0xffdd22,white:0xffffff,off:0x222222};
function draw(){
 var a=st.robot.a*Math.PI/180,x=st.robot.x,y=st.robot.y,AM=!!LEVELS[st.lvl].arm,DM=!!LEVELS[st.lvl].drone;bot.visible=!AM&&!DM&&!LEVELS[st.lvl].station;armG.visible=AM;droneG.visible=DM;droneShadow.visible=DM&&!!renderer&&!renderer.shadowMap.enabled;if(AM)drawArm();if(DM)drawDrone();
 var chs=C.CHASSIS[st.chassis]||C.CHASSIS.standard;bot.position.set(x,0,y);bot.rotation.y=-a;bot.scale.setScalar(chs.R/7);
 SCN3D.boat(bot,wheels,wheels2,chs.id==="boat");wheels[0].g.rotation.z=-st.wl;wheels[1].g.rotation.z=-st.wr;wheels2[0].visible=wheels2[1].visible=chs.wheels===4;wheels2[0].rotation.z=-st.wl;wheels2[1].rotation.z=-st.wr;
 ["front","left","right"].forEach(function(k){
  var d=C.distSafe(k),off={front:0,left:-90,right:90}[k],aa=(st.robot.a+off)*Math.PI/180,L=rayLines[k],D=hitDots[k];
  if(d===null||LEVELS[st.lvl].station){L.visible=false;D.visible=false;return;}
  var ex=x+Math.cos(aa)*d,ez=y+Math.sin(aa)*d,p=L.geometry.attributes.position;
  p.setXYZ(0,x+Math.cos(aa)*8,6,y+Math.sin(aa)*8);p.setXYZ(1,ex,6,ez);p.needsUpdate=true;L.visible=true;D.position.set(ex,6,ez);D.visible=d<149;});
 spray.visible=st.pump;if(st.pump){clock+=0.4;spray.scale.set(1+0.2*Math.sin(clock),1,1+0.2*Math.sin(clock));}
 if(fx.led){var lc=LEDCOL[st.led]||0x222222;fx.led.material.color.set(lc);fx.led.material.emissive.set(lc);fx.led.material.emissiveIntensity=st.led==="off"?0.05:1.6;}
 if(fx.fan&&st.relay)fx.fan.rotation.y+=0.5;
 if(fx.lcd){var on=!!st.lcd;fx.lcd.material.color.set(on?0x37d6c6:0x0d2b2b);fx.lcd.material.emissive.set(on?0x1aa89a:0x000000);}
 grip+=((st.gripClosed?1:0)-grip)*0.2;if(fx.fingers)fx.fingers.forEach(function(f){f.position.z=f.userData.sd*(3.2-grip*1.0);});
 if(st.cube){cubeMesh.visible=true;cubeMesh.position.set(st.cube.x,st.cube.held?5:4,st.cube.y);cubeMesh.rotation.y=st.cube.held?-a:0.3;}else cubeMesh.visible=false;
 for(var i=0;i<st.plots.length;i++)if(lastWet[i]!==st.plots[i].watered){lastWet[i]=st.plots[i].watered;refreshPlot(i);if(st.plots[i].watered){var q=st.plots[i],m=new THREE.Mesh(new THREE.PlaneGeometry(q.w,q.h),new THREE.MeshBasicMaterial({color:0x1a0f08,transparent:true,opacity:0.3,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(q.x+q.w/2,0.6,q.y+q.h/2);levelGroup.add(m);}}
 SCN3D.update(performance.now()/1000);
 if(st.beeps!==lastBeeps){if(st.beeps>lastBeeps)beep();lastBeeps=st.beeps;}
 if(renderer){var w=box.clientWidth,fsOn=document.body.classList.contains("fs"),h=fsOn?box.clientHeight:Math.round(w/1.5);if(w&&h&&(w!==lastW||h!==lastH)){lastW=w;lastH=h;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}placeCamera();renderer.render(scene,camera);}
 if(frameN%8===0)renderHud();
}
var lastH=0;
function setFS(on){document.body.classList.toggle("fs",on);$("fsBtn").textContent=on?"✕":"⛶";lastW=0;
 try{if(on&&document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(function(){});if(!on&&document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(function(){});}catch(e){}
 setTimeout(function(){window.dispatchEvent(new Event("resize"));},50);}
$("fsBtn").onclick=function(e){e.stopPropagation();setFS(!document.body.classList.contains("fs"));};
$("fsRun").onclick=function(e){e.stopPropagation();$("run").click();};
$("fsReset").onclick=function(e){e.stopPropagation();$("reset").click();};
$("fsView").onclick=function(e){e.stopPropagation();var bs=[].slice.call(document.querySelectorAll("#views button")),i=bs.findIndex(function(b){return b.classList.contains("on");});bs[(i+1)%bs.length].click();};
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&document.body.classList.contains("fs"))setFS(false);});
document.addEventListener("fullscreenchange",function(){if(!document.fullscreenElement&&document.body.classList.contains("fs"))setFS(false);});
function renderHud(){var fm=$("fsmsg");if(fm&&document.body.classList.contains("fs")){var mm=$("msg");fm.textContent=(mm&&mm.textContent)||(C.readouts().map(function(r){return r[0]+": "+r[1];}).join("  ·  "));}if(LEVELS[st.lvl].arm)syncPendant();$("sense").innerHTML=C.readouts().map(function(r){return "<span>"+r[0]+": <b>"+r[1]+"</b></span>";}).join("");}
var last=0;
function frame(t){
 var el=Math.min(0.05,(t-last)/1000||0.016);last=t;frameN++;
 var sp=+$("spd").value;
 if(st.status==="run"){C.tick(el*sp);if(st.status!=="run")announce();}
 C.armIdle(el);draw();World.update(camera,t);benchRender(t);requestAnimationFrame(frame);
}
function announce(){try{if(window.MM_onEnd&&!st.man&&(st.status==="win"||st.status==="lose"))window.MM_onEnd(st);}catch(e){}if(st.status==="win"&&!st.man){ranOk=true;markWon(st.lvl);try{if(window.MM_onWin)window.MM_onWin(st.lvl,prog,st.simt);}catch(e){}}msg(st.msg,st.status==="win"?"ok":"bad");renderBench();$("run").textContent="▶ Run";$("run").className="p";var nb=$("nextM");if(nb){var more=st.status==="win"&&LEVELS[st.lvl+1]&&LEVELS[st.lvl+1].id!=="sandbox";nb.style.display=more?"":"none";}}
function msg(t,c){$("msg").textContent=t;$("msg").className=c||"";}
// ================= PROGRAM EDITOR =================
var prog=[],selected=null;
var LABEL={fwd:"Forward",back:"Back",left:"Turn left",right:"Turn right",wait:"Wait",repeat:"Repeat",forever:"Forever",if:"If",stop:"Stop",water:"Water plant",fanon:"Fan on",fanoff:"Fan off",gripc:"Grip close",gripo:"Grip open",led:"LED",beep:"Beep",print:"Show on LCD",armb:"Arm: base to",beltgo:"Belt: run until box",beltoff:"Belt: stop",arms:"Arm: shoulder to",arme:"Arm: elbow to",takeoff:"Take off",land:"Land",up:"Fly up",down:"Fly down"};
var CLS={fwd:"k-motion",back:"k-motion",left:"k-motion",right:"k-motion",wait:"k-control",repeat:"k-control",forever:"k-control",if:"k-control",stop:"k-stop",water:"k-act",fanon:"k-act",fanoff:"k-act",gripc:"k-act",gripo:"k-act",led:"k-looks",beep:"k-sound",print:"k-looks",armb:"k-arm",beltgo:"k-arm",beltoff:"k-arm",arms:"k-arm",arme:"k-arm",takeoff:"k-drone",land:"k-drone",up:"k-drone",down:"k-drone"};
var ICON={fwd:"⬆️",back:"⬇️",left:"↪️",right:"↩️",wait:"⏱️",repeat:"🔁",forever:"♾️",if:"🤔",stop:"🛑",water:"💧",fanon:"🌀",fanoff:"🌀",gripc:"✊",gripo:"🖐️",led:"💡",beep:"🔊",print:"🖥️",armb:"🦾",beltgo:"⚙️",beltoff:"⚙️",arms:"🦾",arme:"🦾",takeoff:"🛫",land:"🛬",up:"⏫",down:"⏬","do":"⭐"};
var CATNAME={Move:"k-motion",Fly:"k-drone",Control:"k-control",Actions:"k-act",Arm:"k-arm",Conveyor:"k-arm",Mission:"k-act"};
LABEL["do"]="Action";CLS["do"]="k-act";
var DEF={up:50,down:50,armb:90,arms:90,arme:0,fwd:30,back:30,left:90,right:90,repeat:3,wait:1};
var UNIT={up:"cm",down:"cm",armb:"°",arms:"°",arme:"°",fwd:"cm",back:"cm",left:"°",right:"°",repeat:"×",wait:"s"};
var NEEDPART={water:"pump",fanon:"fan",fanoff:"fan",gripc:"servo",gripo:"servo",led:"led",beep:"buzzer",print:"lcd",armb:"armkit",beltgo:"armkit",beltoff:"armkit",arms:"armkit",arme:"armkit",takeoff:"dronekit",land:"dronekit",up:"dronekit",down:"dronekit"};
var COLORS=["red","green","blue","yellow","white","off"];
var CONDS=[["front","Front distance <","cm"],["left","Left distance <","cm"],["right","Right distance <","cm"],["lineL","Line under LEFT sensor",""],["lineR","Line under RIGHT sensor",""],["soil","Soil moisture <","%"],["color","Floor colour is","c"],["light","Light level <","%"],["temp","Temperature >","°C"],["humid","Humidity <","%"],["heading","Heading <","°"],["odo","Distance travelled >","cm"],["bump","Bumper pressed",""],["cam","Camera sees object",""],["cubecol","Cube under gripper is","c"],["boxspot","Box at pick spot",""],["alt","Altitude <","cm"],["dfront","Wall ahead closer than","cm"],["bat","Battery <","%"],["dlight","Light under drone >","%"]];
function smeta(){var l=LEVELS[st.lvl];return l.scn&&typeof SCN!=="undefined"?SCN.def[l.scn]:null;}
function condsList(){var m=smeta();var base=m&&m.station?[]:CONDS;return base.concat(m?m.sensors.map(function(s){return ["sig:"+s.id,s.label,s.type==="bool"?"":s.type==="enum"?"e":(s.unit||"#")];}):[]);}
function sigSensor(k){var m=smeta();return m&&String(k).indexOf("sig:")===0?m.sensors.filter(function(s){return "sig:"+s.id===k;})[0]:null;}
function actDef(q){var m=smeta();return m?m.actions.filter(function(a){return a.id===q;})[0]:null;}
function anyHas(n){if(!n)return true;var a=Array.isArray(n)?n:[n];return a.some(function(x){return C.has(x);});}
function needName(n){return (Array.isArray(n)?n:[n]).map(function(x){return PARTS[x]?PARTS[x].name:x;}).join(" or ");}
function distOk(s){return !!(C.find("us",s)||C.find("sharp",s)||C.find("irobs",s));}
function needPart(t){if(LEVELS[st.lvl].arm&&(t==="gripc"||t==="gripo"))return "armkit";return NEEDPART[t];}
function condOk(k){var sg=sigSensor(k);if(sg)return anyHas(sg.need);switch(k){case "front":case "left":case "right":return distOk(k);case "lineL":return !!C.find("line","left");case "lineR":return !!C.find("line","right");case "soil":return C.has("soil");case "color":return C.has("color");case "light":return C.has("ldr");case "temp":case "humid":return C.has("dht");case "heading":return C.has("imu")||C.has("compass");case "odo":return C.has("encoder");case "bump":return C.has("bumper");case "cam":return C.has("camera");case "cubecol":case "boxspot":return C.has("armkit");case "alt":case "dfront":case "bat":case "dlight":return C.has("dronekit");}return true;}
function add(t,q){var b={t:t};if(t==="do"){b.q=q;var ad=actDef(q);if(ad&&ad.p)b.v=ad.p.def;}if(DEF[t]!==undefined)b.v=DEF[t];if(t==="repeat"||t==="forever"||t==="if")b.c=[];if(t==="if"){b.e=[];b.k="front";b.v=20;var cl=condsList();if(cl.length&&cl[0][0].indexOf("sig:")===0&&(smeta().station||true)&&smeta().station){b.k=cl[0][0];}var sg0=sigSensor(b.k);if(sg0){b.v=sg0.type==="num"?30:0;if(sg0.type==="enum")b.q=sg0.opts[0];b.op=sg0.gt?">":"<";}}if(t==="led")b.q="red";if(t==="print")b.q="Hello";(selected||prog).push(b);renderProg();}
function exists(list,target){if(list===target)return true;for(var i=0;i<list.length;i++){var b=list[i];if(b.c&&exists(b.c,target))return true;if(b.e&&exists(b.e,target))return true;}return false;}
function removeFrom(list,b){var i=list.indexOf(b);if(i>=0)list.splice(i,1);}
function slot(list,label){var d=document.createElement("div");d.className="slot"+(selected===list?" sel":"")+(list.length?"":" empty");var l=document.createElement("div");l.className="lab sr";l.textContent=label;d.appendChild(l);
 d.onclick=function(e){e.stopPropagation();selected=list;renderProg();};list.forEach(function(b){d.appendChild(block(b,list));});return d;}
function numInput(b,key,d){var i=document.createElement("input");i.type="number";i.inputMode="decimal";i.value=b[key];i.onclick=function(e){e.stopPropagation();};i.oninput=function(){b[key]=+i.value||0;updateCode();};d.appendChild(i);}
function block(b,parent){
 var isC=!!b.c,cap=(b.t==="forever"||b.t==="stop");var w=document.createElement("div");w.className="wrap "+CLS[b.t]+(isC?" cwrap":"")+(cap?" cap":"");var d=document.createElement("div");d.className="blk "+CLS[b.t];
 var ic=document.createElement("span");ic.className="ic";ic.setAttribute("aria-hidden","true");ic.textContent=ICON[b.t]||"•";d.appendChild(ic);
 var s=document.createElement("span");s.className="bl";var adx=b.t==="do"?actDef(b.q):null;s.textContent=adx?adx.label:LABEL[b.t];d.appendChild(s);
 if(b.t==="do"){var ad0=actDef(b.q);if(ad0&&!anyHas(ad0.need)){var wn0=document.createElement("span");wn0.className="warn";wn0.textContent="⚠ add "+needName(ad0.need);d.appendChild(wn0);}else if(ad0&&ad0.needAlso&&!anyHas(ad0.needAlso)){var wn1=document.createElement("span");wn1.className="warn";wn1.textContent="⚠ add "+needName(ad0.needAlso);d.appendChild(wn1);}}
 if(b.t!=="do"&&needPart(b.t)&&!C.has(needPart(b.t))){var wn=document.createElement("span");wn.className="warn";wn.textContent="⚠ add "+PARTS[needPart(b.t)].name;d.appendChild(wn);}
 if(b.t==="if"){
  var sel=document.createElement("select");sel.className="cond";condsList().forEach(function(c){var o=document.createElement("option");o.value=c[0];o.textContent=c[1]+(condOk(c[0])?"":" ⚠");if(c[0]===b.k)o.selected=true;sel.appendChild(o);});
  sel.onclick=function(e){e.stopPropagation();};sel.onchange=function(){b.k=sel.value;var sg1=sigSensor(b.k);if(sg1){b.op=sg1.gt?">":"<";if(sg1.type==="enum")b.q=sg1.opts[0];else if(sg1.type==="num"&&(b.v==null||b.v===0))b.v=30;}renderProg();};d.appendChild(sel);
  var cd=condsList().filter(function(c){return c[0]===b.k;})[0]||CONDS[0];
  var sgm=sigSensor(b.k);
  if(sgm&&sgm.type==="num"){var os=document.createElement("select");[["<","less than"],[">","more than"]].forEach(function(p){var o=document.createElement("option");o.value=p[0];o.textContent=p[0];if(p[0]===(b.op||(sgm.gt?">":"<")))o.selected=true;os.appendChild(o);});os.onclick=function(e){e.stopPropagation();};os.onchange=function(){b.op=os.value;updateCode();};d.appendChild(os);}
  if(sgm&&sgm.type==="enum"){var es=document.createElement("select");sgm.opts.forEach(function(c){var o=document.createElement("option");o.value=c;o.textContent=c;if(c===(b.q||sgm.opts[0]))o.selected=true;es.appendChild(o);});es.onclick=function(e){e.stopPropagation();};es.onchange=function(){b.q=es.value;updateCode();};d.appendChild(es);}else 
  if(cd[2]==="c"){var cs=document.createElement("select");["red","green","blue","black","white","grey","brown"].forEach(function(c){var o=document.createElement("option");o.value=c;o.textContent=c;if(c===(b.q||"red"))o.selected=true;cs.appendChild(o);});cs.onclick=function(e){e.stopPropagation();};cs.onchange=function(){b.q=cs.value;updateCode();};if(!b.q)b.q="red";d.appendChild(cs);}
  else if(cd[2]){numInput(b,"v",d);var u=document.createElement("span");u.textContent=cd[2]==="#"?"":cd[2];d.appendChild(u);}
  if(!condOk(b.k)){var w2=document.createElement("span");w2.className="warn";w2.textContent="⚠ sensor not installed";d.appendChild(w2);}
 }else if(b.t==="led"){var ls=document.createElement("select");COLORS.forEach(function(c){var o=document.createElement("option");o.value=c;o.textContent=c;if(c===b.q)o.selected=true;ls.appendChild(o);});ls.onclick=function(e){e.stopPropagation();};ls.onchange=function(){b.q=ls.value;updateCode();};d.appendChild(ls);}
 else if(b.t==="print"){var ti=document.createElement("input");ti.type="text";ti.maxLength=16;ti.value=b.q;ti.style.width="110px";ti.onclick=function(e){e.stopPropagation();};ti.oninput=function(){b.q=ti.value;updateCode();};d.appendChild(ti);}
 else if(b.v!==undefined){numInput(b,"v",d);var u2=document.createElement("span");u2.textContent=b.t==="do"?(((actDef(b.q)||{}).p||{}).unit||""):UNIT[b.t];d.appendChild(u2);}
 var x=document.createElement("button");x.className="x";x.textContent="✕";x.onclick=function(e){e.stopPropagation();removeFrom(parent,b);if(selected&&selected!==prog&&!exists(prog,selected))selected=null;renderProg();};d.appendChild(x);
 w.appendChild(d);
 if(b.t==="if"){w.appendChild(slot(b.c,"then"));var ea=document.createElement("div");ea.className="carm";ea.textContent="else";w.appendChild(ea);w.appendChild(slot(b.e,"else"));}else if(b.c)w.appendChild(slot(b.c,"do"));
 return w;
}
function renderProg(){
 if(selected&&selected!==prog&&!exists(prog,selected))selected=null;
 var p=$("prog");p.innerHTML="";p.className=selected===null?"sel":"";var hat=document.createElement("div");hat.className="hat";hat.innerHTML="<span class='ic' aria-hidden='true'>🚩</span><span>when <b>▶ Run</b> is pressed</span>";p.appendChild(hat);prog.forEach(function(b){p.appendChild(block(b,prog));});
 if(!prog.length){var e=document.createElement("div");e.className="note";e.textContent="Your program is empty. Tap a block above to start, for example “+ Forward”.";p.appendChild(e);}
 updateCode();
}
$("prog").onclick=function(){selected=null;renderProg();};
function armGroups(){var g=[["Arm",["armb","arms","arme","gripc","gripo","wait"]]];if(LEVELS[st.lvl].belt)g.push(["Conveyor",["beltgo","beltoff"]]);g.push(["Control",["repeat","forever","if","stop"]]);return g;}
function paletteGroups(){
 var l=LEVELS[st.lvl],m=smeta(),ctl=["Control",["repeat","forever","if","stop"]],g;
 if(l.drone)g=[["Fly",["takeoff","land","up","down","fwd","back","left","right","wait"]],ctl];
 else if(l.arm)g=armGroups();
 else if(l.station)g=[["Control",["repeat","forever","if","wait","stop"]]];
 else g=[["Move",["fwd","back","left","right","wait"]],ctl,["Actions",["water","fanon","fanoff","gripc","gripo","led","beep","print"]]];
 if(m){
  var mis=["Mission",m.actions.map(function(x){return "do:"+x.id;})];
  if(l.station)g.unshift(mis);else{var ix=0;g.forEach(function(q,n){if(q[0]==="Control")ix=n;});g.splice(ix,0,mis);}
  if(l.scn){g=g.map(function(q){return q[0]==="Actions"&&l.id!=="irrigate"&&l.id!=="cropmon"?[q[0],q[1].filter(function(t){return t!=="water"&&t!=="gripc"&&t!=="gripo"&&t!=="fanon"&&t!=="fanoff";})]:q;});}
 }
 return g;
}
function renderPalette(){
 var pal=$("pal");pal.innerHTML="";
 paletteGroups().forEach(function(grp){
  if(!grp[1].length)return;
  var gc=CATNAME[grp[0]]||"k-control";var lab=document.createElement("div");lab.className="pg "+gc;lab.innerHTML="<i></i>"+grp[0];pal.appendChild(lab);
  grp[1].forEach(function(t){var isDo=t.indexOf("do:")===0,q=isDo?t.slice(3):null,ad=isDo?actDef(q):null;if(isDo&&!ad)return;
   var nd=isDo?ad.need:needPart(t),lock=isDo?!anyHas(nd):(needPart(t)&&!C.has(needPart(t))),nm=isDo?ad.label:LABEL[t];
   var b=document.createElement("button");var kc=isDo?"k-act":(CLS[t]||gc);b.className="pb "+kc+(t==="forever"||t==="stop"?" cap":"");b.innerHTML="<span class='ic' aria-hidden='true'>"+(lock?"🔒":(isDo?"⭐":(ICON[t]||"+")))+"</span>";b.appendChild(document.createTextNode(nm));if(isDo&&ad.tip)b.title=ad.tip;if(lock){b.className+=" dim";b.title="Needs: "+needName(nd);}
   b.onclick=function(){add(isDo?"do":t,q);if(lock)msg("🔒 “"+nm+"” needs a "+needName(nd)+". Add it in the Build tab, then it will work.","bad");};pal.appendChild(b);});
 });
}
// ================= PARTS LAB =================
function icon(p){if(typeof PIC!=="undefined"&&PIC.has(p.id))return PIC.thumb(p.id);return "<span class='dot' style='background:#"+("000000"+p.col.toString(16)).slice(-6)+"'></span>";}
function renderTabs(){
 var t=$("ptabs");t.innerHTML="";
 C.CATS.forEach(function(c){var b=document.createElement("button");b.textContent=c;b.className=c===tab?"on":"";b.onclick=function(){tab=c;renderTabs();renderCatalog();};t.appendChild(b);});
}
function renderCatalog(){
 var el=$("catalog");el.innerHTML="";
 C.byCat(tab).forEach(function(p){
  var d=document.createElement("div");d.className="tile";d.draggable=true;
  d.innerHTML=icon(p)+"<div class='tn'><b>"+p.name+"</b><small>"+p.spec+"</small></div><button class='add'>+</button>";
  d.ondragstart=function(e){try{e.dataTransfer.setData("text/plain","part:"+p.id);e.dataTransfer.effectAllowed="copy";}catch(x){}};
  d.querySelector(".add").onclick=function(e){e.stopPropagation();installPart(p.id);};
  d.onclick=function(){installPart(p.id);};
  el.appendChild(d);
 });
}
function installPart(pid){C.addPart(pid);partsChanged();}
var selInst=null,ranOk=false;
function partsChanged(){renderInstalled();renderValidation();renderWiring();renderBench();buildRobotParts();renderPalette();renderProg();renderHud();}
function renderInstalled(){
 var el=$("installed");el.innerHTML="";
 if(!st.parts.length){el.innerHTML="<div class='note'>Nothing installed. Tap or drag parts here.</div>";return;}
 st.parts.forEach(function(i){
  var p=PARTS[i.pid],d=document.createElement("div");d.className="inst";
  d.innerHTML=icon(p)+"<span class='nm'>"+p.name+"</span>";
  if(!st.hands&&(p.slotType||C.mtype(p)==="colour")){
   var s2=document.createElement("select");C.mountsFor(i.pid).forEach(function(m){var o=C.instAt(m);if(o&&o!==i)return;var op=document.createElement("option");op.value=m;op.textContent=C.mountLabel(m);if(m===i.mount)op.selected=true;s2.appendChild(op);});
   s2.onchange=function(){C.unmountPart(i.uid);C.mountPart(i.uid,s2.value);partsChanged();};d.appendChild(s2);
  }else{var sp=document.createElement("small");sp.className=i.mount?"mnt":"mnt bad";sp.textContent=i.mount?C.mountLabel(i.mount):"⚠ not mounted";d.appendChild(sp);}
  var x=document.createElement("button");x.className="x";x.textContent="✕";x.onclick=function(){if(selInst===i.uid)selInst=null;C.removePart(i.uid);partsChanged();};d.appendChild(x);
  el.appendChild(d);
 });
}
var dz=$("installed");
dz.addEventListener("dragover",function(e){e.preventDefault();dz.classList.add("over");});
dz.addEventListener("dragleave",function(){dz.classList.remove("over");});
dz.addEventListener("drop",function(e){e.preventDefault();dz.classList.remove("over");var id="";try{id=e.dataTransfer.getData("text/plain");}catch(x){}id=id.replace(/^part:/,"");if(PARTS[id])installPart(id);});
function renderValidation(){
 var v=C.validate(),el=$("valid"),h="";
 if(v.ok)h+="<div class='vok'>✓ Robot ready to run</div>";
 v.errors.forEach(function(e){h+="<div class='verr'>✖ "+e+"</div>";});
 v.warnings.forEach(function(e){h+="<div class='vwarn'>⚠ "+e+"</div>";});
 var pct=v.capMA?Math.min(100,Math.round(v.mA/v.capMA*100)):0;
 h+="<div class='pbar'><div style='width:"+pct+"%;background:"+(pct>100||pct>=100?"#ef4444":pct>75?"#f59e0b":"#22c55e")+"'></div></div><div class='note'>Power: "+v.mA+" mA used of "+v.capMA+" mA safe limit</div>";
 el.innerHTML=h;
}
function renderWiring(){
 var v=C.validate(),ci=C.ctlInst(),rows=v.wiring,hgt=Math.max(80,rows.length*40+20);
 if(ci&&typeof PIC!=="undefined"&&PIC.has(ci.pid)){try{var pw=st.parts.filter(function(i){return PARTS[i.pid].single==="power";})[0],hasM=st.parts.some(function(i){return i.pid==="gear";});$("wiring").innerHTML=PIC.diagram(v,ci.pid,PARTS[ci.pid].name,{power:pw?pw.pid:null,motors:hasM})+"<div class='note'>Wires: <b style='color:#e53935'>red</b> = power, <b>black</b> = ground, coloured = signals. Pins are assigned automatically in the order you install parts.</div>";return;}catch(e){try{console.error(e);}catch(_){}}}
 var s="<svg viewBox='0 0 340 "+hgt+"' width='100%' xmlns='http://www.w3.org/2000/svg' font-family='sans-serif'>";
 s+="<rect x='6' y='6' width='96' height='"+(hgt-12)+"' rx='8' fill='#14532d' stroke='#4ade80'/><text x='54' y='"+(hgt/2)+"' fill='#fff' font-size='11' text-anchor='middle' font-weight='bold'>"+(ci?PARTS[ci.pid].name.replace(" "," "):"No controller")+"</text>";
 rows.forEach(function(r,k){var y=14+k*40,p=PARTS[r.pid];
  s+="<rect x='230' y='"+y+"' width='104' height='30' rx='6' fill='#0f172a' stroke='#"+("000000"+p.col.toString(16)).slice(-6)+"'/><text x='282' y='"+(y+18)+"' fill='#e2e8f0' font-size='9.5' text-anchor='middle'>"+r.name.replace(/&/g,"&amp;")+"</text>";
  var pins=r.pins.map(function(q){return q.pin.replace("GPIO","G");}).join(" ");
  s+="<line x1='102' y1='"+(y+15)+"' x2='230' y2='"+(y+15)+"' stroke='#38bdf8' stroke-width='1.5'/><text x='166' y='"+(y+11)+"' fill='#7dd3fc' font-size='8.5' text-anchor='middle'>"+(pins.length>34?pins.slice(0,32)+"…":pins)+"</text>";});
 s+="</svg>";
 $("wiring").innerHTML=rows.length?s+"<div class='note'>Pins are assigned automatically in the order you install parts.</div>":"<div class='note'>Install sensors and drivers to see the wiring.</div>";
}
function updateCode(){
 var ci=C.ctlInst(),ln=ci?PARTS[ci.pid].lang:"python";
 $("codelang").textContent=ln==="arduino"?"Arduino C++":ln==="python"?"Python (Raspberry Pi)":"MicroPython";
 $("code").textContent=C.codeFor(prog);
}
$("copycode").onclick=function(){var b=this;try{navigator.clipboard.writeText($("code").textContent).then(function(){b.textContent="Copied ✓";setTimeout(function(){b.textContent="Copy code";},1200);},function(){});}catch(e){}};
$("kit").onclick=function(){C.applyKit(LEVELS[st.lvl].kit);selInst=null;partsChanged();};
$("clearparts").onclick=function(){C.clearAll();selInst=null;partsChanged();};

// ================= ASSEMBLY BENCH =================
var MB={ctl:[186,108,100,48],batt:[50,112,60,40],drv:[118,112,60,40],axle:[50,170,60,26],axleEnc:[118,170,60,26],floorL:[216,76,70,26],floorC:[118,76,90,26],floorR:[216,170,70,26],front:[306,118,52,26],bumper:[306,86,52,26],probe:[306,150,52,26],tool:[306,182,52,26],sideL:[110,34,64,22],camTop:[180,34,64,22],sideR:[110,228,64,18]};
var UNDER={floorL:1,floorC:1,floorR:1};
function mbox(m){if(MB[m])return MB[m];var n=parseInt(m.replace("deck",""))||1;return [24+(n-1)*34,258,31,24];}
function allMounts(){var r=Object.keys(MB);var n=(C.CHASSIS[st.chassis]||C.CHASSIS.standard).pads;for(var i=1;i<=n;i++)r.push("deck"+i);return r;}
function short(n){return n.replace("Ultrasonic HC-SR04","Ultrasonic").replace("Arduino ","").replace("Raspberry Pi ","Pi ").replace(" motor driver","").replace(/\(.*\)/,"").slice(0,11);}
function hex(c){return "#"+("000000"+c.toString(16)).slice(-6);}
function setBenchMsg(t,c){var m=$("benchmsg");m.textContent=t;m.className=c||"";}
function renderBench(){
 $("bench").style.display=st.hands?"block":"none";
 $("handsBtn").textContent="🛠 Hands-on build: "+(st.hands?"ON":"OFF");$("handsBtn").className=st.hands?"p":"";
 $("chassis").value=st.chassis;
 var chs=C.CHASSIS[st.chassis];$("chdesc").textContent=chs.desc;
 if(!st.hands)return;
 var sel=selInst?st.parts.filter(function(i){return i.uid===selInst&&!i.mount;})[0]:null;if(!sel)selInst=null;
 var ok=sel?C.mountsFor(sel.pid):[];
 var svg="<svg viewBox='0 0 370 290' width='100%' xmlns='http://www.w3.org/2000/svg' font-family='sans-serif' style='touch-action:manipulation'>";
 svg+="<rect x='40' y='64' width='260' height='160' rx='14' fill='#1f2937' stroke='#475569' stroke-width='2'/><rect x='300' y='80' width='14' height='120' fill='#334155'/>";
 svg+="<rect x='60' y='52' width='54' height='10' rx='3' fill='#111'/><rect x='60' y='226' width='54' height='10' rx='3' fill='#111'/><text x='8' y='14' font-size='10' fill='#94a3b8'>TOP VIEW · robot faces right →</text>";
 svg+="<text x='46' y='246' font-size='9' fill='#94a3b8'>Top deck pads</text>";
 allMounts().forEach(function(m){
  var b=mbox(m),o=C.instAt(m),can=sel&&ok.indexOf(m)>=0&&!o,under=UNDER[m];
  var fill=o?hex(PARTS[o.pid].col):(can?"#14532d":"#0f172a"),stroke=can?"#4ade80":(sel?"#334155":"#64748b");
  svg+="<g data-m='"+m+"' style='cursor:pointer'><rect x='"+b[0]+"' y='"+b[1]+"' width='"+b[2]+"' height='"+b[3]+"' rx='5' fill='"+fill+"' stroke='"+stroke+"' stroke-width='"+(can?2.5:1.2)+"' "+((under&&!o)?"stroke-dasharray='4 3'":"")+"/>";
  var txt=o?short(PARTS[o.pid].name):(m.indexOf("deck")===0?m.replace("deck",""):(under?"↓ ":"")+MLABELS[m]);
  svg+="<text x='"+(b[0]+b[2]/2)+"' y='"+(b[1]+b[3]/2+3)+"' font-size='"+(o?8.5:7.5)+"' fill='"+(o?"#fff":"#94a3b8")+"' text-anchor='middle' pointer-events='none'>"+txt+"</text></g>";
 });
 svg+="</svg>";
 $("blueprint").innerHTML=svg;
 rebuildMarks(sel,ok);
 var tr=$("tray");tr.innerHTML="";
 var loose=st.parts.filter(function(i){return !i.mount;});
 if(!loose.length)tr.innerHTML="<div class='note'>No loose parts. Add parts from the catalog, then mount them on the chassis above.</div>";
 loose.forEach(function(i){var p=PARTS[i.pid],c=document.createElement("div");c.className="chip"+(selInst===i.uid?" on":"");c.draggable=true;c.innerHTML=icon(p)+"<span>"+p.name+"</span>";
  c.ondragstart=function(e){try{e.dataTransfer.setData("text/plain","inst:"+i.uid);}catch(x){}};
  c.onclick=function(){selInst=selInst===i.uid?null:i.uid;setBenchMsg(selInst?"Now tap a green mount point for the "+p.name+".":"");renderBench();};tr.appendChild(c);});
 // checklist
 var v=C.validate(),raw=function(id){return st.parts.some(function(i){return i.pid===id;});},ctl=st.parts.some(function(i){return PARTS[i.pid].ctl;}),pwr=st.parts.some(function(i){return PARTS[i.pid].single==="power";}),drv=st.parts.some(function(i){return PARTS[i.pid].single==="driver";});
 var unm=st.parts.some(function(i){return !i.mount;}),wireErr=v.errors.some(function(e){return /pin|wired|ADC|analog|voltage/i.test(e);});
 var steps=[["Choose a chassis",true],["Add controller, power, motor driver and motors",ctl&&pwr&&drv&&raw("gear")],["Mount every part on the chassis",st.parts.length>0&&!unm],["Wire every pin",st.parts.length>0&&!unm&&!wireErr&&v.wiring.length>0],["Pass the build check",v.ok],["Complete a mission with your robot",ranOk]];
 $("checklist").innerHTML=steps.map(function(s,k){return "<div class='"+(s[1]?"cd":"")+"'>"+(s[1]?"✓":"○")+" "+(k+1)+". "+s[0]+"</div>";}).join("");
 // wiring panel
 var wp=$("wirepanel");wp.innerHTML="";
 if(!v.wiring.length)wp.innerHTML="<div class='note'>Parts with signal pins appear here once installed.</div>";
 v.wiring.forEach(function(r){
  var d=document.createElement("div");d.className="wrow";var t=document.createElement("div");t.className="wn";t.textContent=r.name;d.appendChild(t);
  r.pins.forEach(function(q){
   if(q.kind==="i"){var n=document.createElement("small");n.textContent="SDA/SCL on the shared I²C bus (automatic)";d.appendChild(n);return;}
   var l=document.createElement("label");l.textContent=q.fn+" → ";var sl=document.createElement("select");sl.className="sm";
   var o0=document.createElement("option");o0.value="";o0.textContent="— choose pin —";sl.appendChild(o0);
   C.pinOptions(r.uid,q.idx).forEach(function(n){var o=document.createElement("option");o.value=n;o.textContent=n;if(n===q.pin)o.selected=true;sl.appendChild(o);});
   sl.onchange=function(){C.setPin(r.uid,q.idx,sl.value);partsChanged();};l.appendChild(sl);d.appendChild(l);});
  wp.appendChild(d);});
}
var MLABELS={ctl:"Controller deck",batt:"Battery bay",drv:"Driver bay",axle:"Axle: motors",axleEnc:"Axle: encoder",floorL:"Under left",floorC:"Under centre",floorR:"Under right",front:"Front bar",bumper:"Bumper",probe:"Soil arm",tool:"Gripper arm",sideL:"Left side",camTop:"Camera mast",sideR:"Right side"};
function mountOn(uid,m){
 var r=C.mountPart(uid,m);
 if(r.ok){selInst=null;setBenchMsg("✓ Mounted on the "+C.mountLabel(m)+".","ok");}else setBenchMsg("✖ "+r.why,"bad");
 partsChanged();
}
$("blueprint").addEventListener("click",function(e){
 var g=e.target.closest?e.target.closest("[data-m]"):null;if(!g)return;var m=g.getAttribute("data-m"),o=C.instAt(m);
 if(selInst){mountOn(selInst,m);}
 else if(o){C.unmountPart(o.uid);selInst=o.uid;setBenchMsg("Part unmounted. Tap another mount point to move it.");partsChanged();}
});
$("blueprint").addEventListener("dragover",function(e){e.preventDefault();});
$("blueprint").addEventListener("drop",function(e){
 e.preventDefault();var g=e.target.closest?e.target.closest("[data-m]"):null;if(!g)return;var m=g.getAttribute("data-m"),d="";
 try{d=e.dataTransfer.getData("text/plain");}catch(x){}
 if(d.indexOf("inst:")===0)mountOn(+d.slice(5),m);
 else if(d.indexOf("part:")===0){var inst=C.addPart(d.slice(5));mountOn(inst.uid,m);}
});
// ================= 3D ASSEMBLY BENCH =================
var bRen=null,bCam=new THREE.PerspectiveCamera(42,1.5,0.5,800),bBox=$("bench3d"),bOrb={t:0.9,p:1.0,d:46},marks=new THREE.Group(),bW=0,benchMode="3d";
bot.add(marks);marks.visible=false;
var MP3={ctl:[[0,9.9,0]],batt:[[-4.5,7.2,0]],drv:[[1.2,6.4,0]],axle:[[-1.5,3.8,4.8],[-1.5,3.8,-4.8]],axleEnc:[[-1.5,5,5.8],[-1.5,5,-5.8]],floorL:[[7.6,2.6,-4]],floorR:[[7.6,2.6,4]],floorC:[[8,2.5,0]],front:[[7.6,6.8,0]],sideL:[[0,6.8,-5.8]],sideR:[[0,6.8,5.8]],bumper:[[9.8,3.8,0]],probe:[[9.8,1.6,2.6]],tool:[[8.2,5,0]],camTop:[[6.8,10.4,0]]};
function labelSprite(txt){var cv=document.createElement("canvas");cv.width=256;cv.height=64;var g=cv.getContext("2d");g.fillStyle="rgba(8,20,12,.85)";g.fillRect(0,0,256,64);g.strokeStyle="#22c55e";g.lineWidth=4;g.strokeRect(2,2,252,60);g.fillStyle="#bbf7d0";g.font="bold 30px sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText(txt,128,34);
 var s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),transparent:true,depthTest:false}));s.scale.set(8,2,1);s.renderOrder=12;return s;}
function mountPoints(m){if(MP3[m])return MP3[m];var n=parseInt(String(m).replace("deck",""))||1,d=DECK[(n-1)%DECK.length];return [[d[0],9.6,d[1]]];}
function rebuildMarks(sel,ok){
 while(marks.children.length){var c=marks.children[0];marks.remove(c);if(c.material){if(c.material.map)c.material.map.dispose();c.material.dispose();}if(c.geometry)c.geometry.dispose();}
 if(!st.hands)return;
 allMounts().forEach(function(m){
  if(C.instAt(m))return;
  var can=sel&&ok.indexOf(m)>=0;
  mountPoints(m).forEach(function(p,k){
   var col=can?0x22c55e:sel?0x64748b:0x38bdf8,op=can?0.95:sel?0.3:0.5,rad=can?1.1:0.7;
   var s=new THREE.Mesh(new THREE.SphereGeometry(rad,14,10),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:op,depthTest:false}));
   s.position.set(p[0],p[1],p[2]);s.renderOrder=11;s.userData.mark=m;s.userData.pulse=can;marks.add(s);
   var hit=new THREE.Mesh(new THREE.SphereGeometry(1.9,8,6),new THREE.MeshBasicMaterial({visible:false}));hit.position.copy(s.position);hit.userData.mark=m;marks.add(hit);
   if(can&&k===0){var lb=labelSprite((MLABELS[m]||m.replace("deck","Pad ")).slice(0,16));lb.position.set(p[0],p[1]+2.6,p[2]);marks.add(lb);}
  });
 });
}
function benchSize(){if(!bRen)return;var w=bBox.clientWidth;if(w&&Math.abs(w-bW)>1){bW=w;var h=Math.round(w/1.4);bRen.setSize(w,h);bCam.aspect=w/h;bCam.updateProjectionMatrix();}}
function benchRender(t){
 if(!bRen||!st.hands||benchMode!=="3d"||bBox.offsetParent===null)return;
 benchSize();var chs=C.CHASSIS[st.chassis]||C.CHASSIS.standard,sc=chs.R/7,sp=Math.sin(bOrb.p),tx=bot.position.x,tz=bot.position.z;
 bCam.position.set(tx+bOrb.d*sc*sp*Math.sin(bOrb.t),5*sc+bOrb.d*sc*Math.cos(bOrb.p),tz+bOrb.d*sc*sp*Math.cos(bOrb.t));bCam.lookAt(tx,4.5*sc,tz);
 marks.visible=true;marks.children.forEach(function(o){if(o.userData.pulse)o.scale.setScalar(1+0.22*Math.sin(t/180));});
 bRen.render(scene,bCam);marks.visible=false;
}
(function(){
 if(!renderer)return;
 try{bRen=new THREE.WebGLRenderer({antialias:true});}catch(e){bRen=null;return;}
 bRen.setPixelRatio(Math.min(window.devicePixelRatio||1,2));bRen.shadowMap.enabled=false;
 bRen.toneMapping=renderer.toneMapping;bRen.toneMappingExposure=renderer.toneMappingExposure;bRen.outputEncoding=renderer.outputEncoding;
 bBox.appendChild(bRen.domElement);bRen.domElement.style.cssText="width:100%;display:block;touch-action:none;border-radius:12px;background:#9db9cf";
 var el=bRen.domElement,ptr={},moved=0,t0=0,p0=0,d0=0,ray=new THREE.Raycaster(),nd=new THREE.Vector2();
 function pick(e,list){var r=el.getBoundingClientRect();nd.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);bCam.updateMatrixWorld(true);scene.updateMatrixWorld(true);ray.setFromCamera(nd,bCam);return ray.intersectObjects(list,true);}
 function tap(e){
  marks.visible=true;var mh=pick(e,marks.children).filter(function(h){return h.object.userData.mark;});marks.visible=false;
  if(mh.length){var m=mh[0].object.userData.mark;if(selInst)mountOn(selInst,m);else setBenchMsg("Pick a loose part from the tray first, then tap a green point.");return;}
  var ph=pick(e,partsGroup.children).filter(function(h){return h.object.userData.mount;});
  if(ph.length){var m2=ph[0].object.userData.mount,o=C.instAt(m2);
   if(selInst)mountOn(selInst,m2);else if(o){C.unmountPart(o.uid);selInst=o.uid;setBenchMsg("Part taken off. Tap a green point to mount it somewhere else.");partsChanged();}
   return;}
  if(selInst)setBenchMsg("Tap one of the glowing green points on the robot.","bad");
 }
 el.addEventListener("pointerdown",function(e){try{el.setPointerCapture(e.pointerId);}catch(_e){}ptr[e.pointerId]={x:e.clientX,y:e.clientY};moved=0;t0=Date.now();var ks=Object.keys(ptr);if(ks.length===2){var a1=ptr[ks[0]],b1=ptr[ks[1]];p0=Math.hypot(a1.x-b1.x,a1.y-b1.y);d0=bOrb.d;}});
 el.addEventListener("pointermove",function(e){var p=ptr[e.pointerId];if(!p)return;var dx=e.clientX-p.x,dy=e.clientY-p.y,ks=Object.keys(ptr);
  if(ks.length===2){p.x=e.clientX;p.y=e.clientY;var a2=ptr[ks[0]],b2=ptr[ks[1]],dd=Math.hypot(a2.x-b2.x,a2.y-b2.y);if(p0>0)bOrb.d=Math.max(14,Math.min(90,d0*p0/dd));moved=99;return;}
  moved+=Math.abs(dx)+Math.abs(dy);p.x=e.clientX;p.y=e.clientY;if(moved<7)return;bOrb.t-=dx*0.009;bOrb.p=Math.max(0.15,Math.min(1.5,bOrb.p-dy*0.006));});
 el.addEventListener("pointerup",function(e){var p=ptr[e.pointerId];if(p&&Object.keys(ptr).length===1&&moved<7&&Date.now()-t0<600)tap(e);delete ptr[e.pointerId];});
 el.addEventListener("pointercancel",function(e){delete ptr[e.pointerId];});
 el.addEventListener("wheel",function(e){bOrb.d=Math.max(14,Math.min(90,bOrb.d+e.deltaY*0.05));e.preventDefault();},{passive:false});
 el.addEventListener("dragover",function(e){e.preventDefault();});
 el.addEventListener("drop",function(e){e.preventDefault();var d="";try{d=e.dataTransfer.getData("text/plain");}catch(x){}
  marks.visible=true;var mh=pick(e,marks.children).filter(function(h){return h.object.userData.mark;});marks.visible=false;if(!mh.length){setBenchMsg("Drop the part on a glowing mount point.","bad");return;}
  var m=mh[0].object.userData.mark;if(d.indexOf("inst:")===0)mountOn(+d.slice(5),m);else if(d.indexOf("part:")===0){var inst=C.addPart(d.slice(5));mountOn(inst.uid,m);}});
 // view toggle
 [].forEach.call($("benchViews").children,function(b){b.onclick=function(){benchMode=b.dataset.m;[].forEach.call($("benchViews").children,function(x){x.className=x.dataset.m===benchMode?"on":"";});$("bench3d").style.display=benchMode==="3d"?"block":"none";$("blueprint").style.display=benchMode==="3d"?"none":"block";};});
 $("blueprint").style.display="none";
})();
window.MM_bench={screenOf:function(m){if(!bRen)return null;var p=mountPoints(m)[0],v=new THREE.Vector3(p[0],p[1],p[2]);marks.visible=true;bot.updateMatrixWorld(true);bot.localToWorld(v);marks.visible=false;benchRender(0);v.project(bCam);var r=bRen.domElement.getBoundingClientRect();return {x:r.left+(v.x+1)/2*r.width,y:r.top+(1-v.y)/2*r.height};},canvas:function(){return bRen&&bRen.domElement;}};
if(!bRen){$("benchViews").style.display="none";$("bench3d").style.display="none";}

$("handsBtn").onclick=function(){C.setHands(!st.hands);selInst=null;setBenchMsg("");partsChanged();};
(function(){var s=$("chassis");Object.keys(C.CHASSIS).forEach(function(k){var o=document.createElement("option");o.value=k;o.textContent=C.CHASSIS[k].name;s.appendChild(o);});s.onchange=function(){C.setChassis(s.value);partsChanged();};})();
$("autowire").onclick=function(){C.autoWire();partsChanged();};
// ---- saving prototypes ----
var LSK="mm_robot_designs";
function loadDesigns(){try{return JSON.parse(localStorage.getItem(LSK)||"{}")||{};}catch(e){return {};}}
function saveDesigns(o){try{localStorage.setItem(LSK,JSON.stringify(o));return true;}catch(e){return false;}}
var mem={};
function renderSaved(){
 var d=loadDesigns();for(var k in mem)d[k]=mem[k];var el=$("saved");el.innerHTML="";var names=Object.keys(d);
 if(!names.length){el.innerHTML="<div class='note'>No saved prototypes yet.</div>";return;}
 names.forEach(function(n){var r=document.createElement("div");r.className="inst";r.innerHTML="<span class='nm'>🤖 "+n.replace(/[<>&]/g,"")+"</span>";
  var l=document.createElement("button");l.textContent="Load";l.onclick=function(){loadDesign(d[n]);};var x=document.createElement("button");x.className="x";x.textContent="✕";x.onclick=function(){var dd=loadDesigns();delete dd[n];delete mem[n];saveDesigns(dd);renderSaved();};r.appendChild(l);r.appendChild(x);el.appendChild(r);});
}
function loadDesign(o){if(C.importDesign(o)){selInst=null;setBenchMsg("Prototype loaded.","ok");partsChanged();}else setBenchMsg("That design code is not valid.","bad");}
$("savebtn").onclick=function(){var n=($("pname").value||"My robot").trim().slice(0,30)||"My robot",d=C.exportDesign();var all=loadDesigns();all[n]=d;if(!saveDesigns(all))mem[n]=d;renderSaved();setBenchMsg("Saved “"+n.replace(/[<>&]/g,"")+"”.","ok");};
$("exportbtn").onclick=function(){$("dcode").value=JSON.stringify(C.exportDesign());};
$("importbtn").onclick=function(){var o=null;try{o=JSON.parse($("dcode").value);}catch(e){}loadDesign(o);};
// ================= CONTROLS =================
$("run").onclick=function(){
 ensureAudio();
 if(st.status==="run"){C.stop();msg("");this.textContent="▶ Run";this.className="p";buildLevel();return;}
 if(!prog.length){msg("Add at least one block first.","bad");return;}
 var v=C.validate();if(!v.ok){msg("Robot not ready: "+v.errors[0]+(v.errors.length>1?" (+"+(v.errors.length-1)+" more in the Parts Lab)":""),"bad");showTab("build");return;}
 C.reset();buildLevel();C.start(prog);msg("");this.textContent="■ Stop";this.className="s";
};
$("nextM").onclick=function(){this.style.display="none";setLevel(st.lvl+1);msg("");};
$("reset").onclick=function(){$("nextM").style.display="none";C.reset();syncPendant();msg("");$("run").textContent="▶ Run";$("run").className="p";buildLevel();};
$("quality").onchange=function(){setQuality(this.value);try{buildLevel();}catch(e){}};

window.addEventListener("mm-unlock",function(){partsChanged();msg("🔓 New sensor unlocked for the robot! Try mission 11.","ok");});
// ---- Mila mentor ----
var hintN={},mfeed=$("milaOut");
function milaSay(mood,say,notes,pre){var h="<div class='bub "+mood+"'><b>"+say.replace(/</g,"&lt;")+"</b>";if(notes&&notes.length)h+="<ul>"+notes.map(function(n){return "<li>"+String(n).replace(/</g,"&lt;")+"</li>";}).join("")+"</ul>";if(pre)h+="<pre>"+pre.replace(/</g,"&lt;")+"</pre>";mfeed.innerHTML=h+"</div>";}
$("mCheck").onclick=function(){var r=Mila.check(prog,C);if(r.mood==="win"){var q=Mila.quiz(C);r.notes=r.notes.concat(["🧠 Quick question: "+q[0]+" (Think first. Answer: "+q[1]+")"]);}milaSay(r.mood,r.say,r.notes);};
$("mHint").onclick=function(){var k=st.lvl,n=hintN[k]||0,r=Mila.hint(prog,C,n);hintN[k]=n+1;milaSay("tip",r.say+" (hint "+Math.min(n+1,3)+" of 3)",r.notes);};
$("mExplain").onclick=function(){if(!prog.length){milaSay("tip","Your program is empty.",["Tap a block above to add your first step."]);return;}milaSay("ok","Here's what your robot will do, step by step:",null,Mila.explain(prog).join("\n"));};
var WONK="mm_won",won={};try{won=JSON.parse(localStorage.getItem(WONK)||"{}");}catch(e){}
function markWon(i){var id=LEVELS[i].id;if(id==="sandbox"||won[id])return;won[id]=true;try{localStorage.setItem(WONK,JSON.stringify(won));}catch(e){}paintLevels();}
function paintLevels(){var n=0,tot=LEVELS.filter(function(l){return l.id!=="sandbox";}).length;
 [].forEach.call($("levels").children,function(c,k){var id=LEVELS[k].id,w=!!won[id];if(w)n++;c.className=(k===st.lvl?"on":"")+(w?" won":"");c.textContent=(w?"✓ ":"")+LEVELS[k].name;if(k===st.lvl&&c.scrollIntoView)try{$("picker").scrollTo({left:Math.max(0,c.offsetLeft-60),behavior:"smooth"});}catch(e){}});
 $("progtxt").textContent=n+" / "+tot;$("progbar").style.width=Math.round(100*n/tot)+"%";
 var l=LEVELS[st.lvl];$("mnum").textContent=l.id==="sandbox"?"Free lab":"Mission "+(st.lvl+1)+" of "+tot;}
function showTab(name){[].forEach.call(document.querySelectorAll(".view"),function(v){v.className="view"+(v.id===name?" on":"");});[].forEach.call($("tabs").children,function(b){b.className=b.dataset.tab===name?"on":"";});window.scrollTo(0,0);}
[].forEach.call($("tabs").children,function(b){b.onclick=function(){showTab(b.dataset.tab);};});

// ---- Teach pendant ----
var JK=[["jb","b"],["js","s"],["je","e"]];
function syncPendant(){var ar=st.arm,AMl=!!LEVELS[st.lvl].arm;$("pendant").style.display=AMl?"block":"none";if(!AMl)return;
 JK.forEach(function(j){$(j[0]).value=Math.round(ar[j[1]]);$(j[0]+"v").textContent=Math.round(ar[j[1]])+"°";});
 var t=C.armTip();$("tipinfo").textContent="Gripper tip: "+Math.round(t.r)+" cm out, "+Math.round(t.z)+" cm high"+(t.z<3?" (touching the table!)":"");
 $("pgrip").textContent=ar.held?"✋ Gripper: holding cube":ar.g?"✊ Gripper: closed":"✋ Gripper: open";}
JK.forEach(function(j){$(j[0]).oninput=function(){if(st.status==="run"){syncPendant();return;}var o={};C.armSet(j[1]==="b"?+this.value:undefined,j[1]==="s"?+this.value:undefined,j[1]==="e"?+this.value:undefined);syncPendant();};});
$("pgrip").onclick=function(){if(st.status==="run")return;C.armGrip(!st.arm.g);syncPendant();};
$("padd").onclick=function(){var ar=st.arm;[["armb",ar.b],["arms",ar.s],["arme",ar.e]].forEach(function(p){var b={t:p[0],v:Math.round(p[1])};(selected||prog).push(b);});renderProg();};

// ---- Joystick / keyboard / gamepad control of the arm (with Record) ----
(function(){
 var SPD={b:70,s:55,e:75},axL=[0,0],axR=[0,0],keys={},rec=false,lastRec=null,idle=0,moved=false,gpBtn=false,tPrev=0;
 function stick(el,out){var knob=el.firstElementChild,R=34,pid=null;
  function set(e){var r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,d=Math.hypot(dx,dy);if(d>R){dx*=R/d;dy*=R/d;}knob.style.transform="translate("+dx+"px,"+dy+"px)";out[0]=dx/R;out[1]=dy/R;}
  el.addEventListener("pointerdown",function(e){pid=e.pointerId;try{el.setPointerCapture(pid);}catch(_){}set(e);e.preventDefault();});
  el.addEventListener("pointermove",function(e){if(pid===e.pointerId)set(e);});
  function up(e){if(pid!==e.pointerId)return;pid=null;knob.style.transform="";out[0]=out[1]=0;}
  el.addEventListener("pointerup",up);el.addEventListener("pointercancel",up);}
 stick($("stickL"),axL);stick($("stickR"),axR);
 function typing(){var a=document.activeElement;return a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&a.type!=="range"&&a.type!=="button";}
 window.addEventListener("keydown",function(e){if(!LEVELS[st.lvl].arm||typing())return;var k=e.key.toLowerCase();if("arrowleft arrowright arrowup arrowdown w s a d".indexOf(k)>=0&&k.length>0){keys[k]=1;e.preventDefault();}if(k===" "||k==="g"){e.preventDefault();toggleGrip();}});
 window.addEventListener("keyup",function(e){delete keys[e.key.toLowerCase()];});
 function toggleGrip(){if(st.status==="run")return;C.armGrip(!st.arm.g);syncPendant();if(rec){(selected||prog).push({t:st.arm.g?"gripc":"gripo",v:0});renderProg();}}
 $("jgrip").onclick=toggleGrip;
 $("jrec").onclick=function(){rec=!rec;this.classList.toggle("on",rec);this.textContent=rec?"⏹ Stop":"⏺ Record";lastRec={b:Math.round(st.arm.b),s:Math.round(st.arm.s),e:Math.round(st.arm.e)};$("jhint").textContent=rec?"Recording: each time you stop moving, the pose is added to your program.":"Use the sticks, arrow keys / WASD, or a gamepad.";};
 $("jclr").onclick=function(){if(st.status==="run")return;prog.length=0;selected=null;renderProg();};
 function pushPose(){var cur={b:Math.round(st.arm.b),s:Math.round(st.arm.s),e:Math.round(st.arm.e)},any=false;[["armb","b"],["arms","s"],["arme","e"]].forEach(function(p){if(!lastRec||Math.abs(cur[p[1]]-lastRec[p[1]])>=2){(selected||prog).push({t:p[0],v:cur[p[1]]});any=true;}});lastRec=cur;if(any)renderProg();}
 function loop(ts){requestAnimationFrame(loop);var dt=Math.min(0.05,(ts-tPrev)/1000||0.016);tPrev=ts;
  if(!LEVELS[st.lvl].arm||$("pendant").style.display==="none")return;
  var x=axL[0],y=axL[1],ey=axR[1];
  if(keys.arrowleft||keys.a)x-=1;if(keys.arrowright||keys.d)x+=1;if(keys.arrowup)y-=1;if(keys.arrowdown)y+=1;if(keys.w)ey-=1;if(keys.s)ey+=1;
  var gp=null;try{var gps=navigator.getGamepads?navigator.getGamepads():[];for(var i=0;i<gps.length;i++)if(gps[i]){gp=gps[i];break;}}catch(_){}
  if(gp){var dz=function(v){return Math.abs(v)<0.15?0:v;};x+=dz(gp.axes[0]||0);y+=dz(gp.axes[1]||0);ey+=dz(gp.axes[3]||0);var pr=gp.buttons[0]&&gp.buttons[0].pressed;if(pr&&!gpBtn)toggleGrip();gpBtn=!!pr;}
  x=Math.max(-1,Math.min(1,x));y=Math.max(-1,Math.min(1,y));ey=Math.max(-1,Math.min(1,ey));
  if(st.status==="run"){return;}
  if(x||y||ey){C.armSet(st.arm.b-x*SPD.b*dt,st.arm.s-y*SPD.s*dt,st.arm.e+ey*SPD.e*dt);syncPendant();moved=true;idle=0;}
  else if(moved){idle+=dt;if(idle>0.35){moved=false;if(rec)pushPose();}}
 }
 requestAnimationFrame(loop);
})();
function setLevel(i){try{$("nextM").style.display="none";}catch(e){}
 C.setLevel(i);theta=LEVELS[i].drone?2.75:Math.PI/2;paintLevels();
 syncPendant();mfeed.innerHTML="";$("mission").innerHTML=LEVELS[i].mission;$("hint").innerHTML=LEVELS[i].hint;
 prog=[];selected=null;msg("");$("run").textContent="▶ Run";$("run").className="p";buildLevel();partsChanged();
}
LEVELS.forEach(function(l,i){var b=document.createElement("button");b.textContent=l.name;b.onclick=function(){setLevel(i);};$("levels").appendChild(b);});
[].forEach.call($("views").children,function(b){b.onclick=function(){setView(b.dataset.v);};});
paintLevels();
var cn=navigator.connection||{};var lowEnd=((navigator.hardwareConcurrency||4)<=4&&/Android/i.test(navigator.userAgent))||(navigator.deviceMemory&&navigator.deviceMemory<=2)||cn.saveData===true||/^(slow-2g|2g)$/.test(cn.effectiveType||"");
if(lowEnd)$("quality").value="light";else if((navigator.deviceMemory||4)>=6||(!/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)&&(navigator.hardwareConcurrency||4)>=8))$("quality").value="hd";
setQuality($("quality").value);
renderTabs();renderCatalog();renderSaved();
setLevel(0);
window.MM={startManual:function(){ensureAudio();if(st.status==="run"){C.stop();}C.reset();buildLevel();var ok=C.startManual();var b=$("run");if(ok){msg("");b.textContent="■ Stop";b.className="s";}else{msg(st.msg||"Cannot start.","bad");}return ok;},announce:function(){if(st.status!=="run")announce();},startLive:function(){ensureAudio();if(st.status==="run"){C.stop();}C.reset();buildLevel();var ok=C.startLive();var b=$("run");if(ok){msg("");b.textContent="■ Stop";b.className="s";}else{msg(st.msg||"Robot not ready.","bad");showTab("build");}return ok;},prog:function(){return prog;},setProg:function(p){prog=p;selected=null;renderProg();},setLevel:setLevel,showTab:showTab,partsChanged:partsChanged};
try{var hp={};location.hash.replace("#","").split("&").forEach(function(p){var q=p.split("=");hp[q[0]]=q[1];});if(hp.lv){setLevel(+hp.lv);if(hp.fly){var ff=hp.fly.split(",").map(Number);C.drone().flying=true;C.drone().z=ff[0];st.robot.x=ff[1];}if(hp.pose){var pp=hp.pose.split(",").map(Number);C.armSet(pp[0],pp[1],pp[2]);if(pp[3])C.armGrip(true);syncPendant();}}var hh=hp.tab||Object.keys(hp)[0];if(["play","build","circuits","codetab","club"].indexOf(hh)>=0)showTab(hh);}catch(e){}
requestAnimationFrame(frame);
})();
