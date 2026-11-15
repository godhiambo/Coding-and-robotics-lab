// HD: detailed PBR models for the robot, arm and drone (rounded edges, screws, treads, carbon fibre).
var HD=(function(){
"use strict";
var T=THREE,cache={};
function cv(w,h){var c=document.createElement("canvas");c.width=w;c.height=h;return c;}
function ctex(c,rx,ry,srgb){var t=new T.CanvasTexture(c);if(srgb)t.encoding=T.sRGBEncoding;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(rx||1,ry||1);t.anisotropy=8;return t;}
function rng(s){return function(){s|=0;s=s+0x6D2B79F5|0;var t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
// ---- geometry helpers
function rrect(w,h,r){var s=new T.Shape(),x=-w/2,y=-h/2;r=Math.max(.01,Math.min(r,w/2-.001,h/2-.001));
 s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
function rbox(w,h,d,r,seg){var b=Math.min(r||.4,w/4,h/4,d/3);var g=new T.ExtrudeGeometry(rrect(w-2*b,h-2*b,Math.max(.01,(r||.4)-b)),{depth:Math.max(.01,d-2*b),bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:seg||2,curveSegments:5});g.translate(0,0,-(d-2*b)/2);return g;}
function flat(w,d,h,r){var g=rbox(w,d,h,r);g.rotateX(-Math.PI/2);return g;} // plate lying in xz, thickness h in y
function cyl(r,h,seg,rx,rz){var g=new T.CylinderGeometry(r,r,h,seg||24);if(rx)g.rotateX(rx);if(rz)g.rotateZ(rz);return g;}
function M(g,m,x,y,z,p,cast){var o=new T.Mesh(g,m);o.position.set(x||0,y||0,z||0);o.castShadow=cast!==false;o.receiveShadow=true;if(p)p.add(o);return o;}
// ---- materials
function pbr(c,r,m,o){var x=new T.MeshStandardMaterial({color:c,roughness:r,metalness:Math.min(m||0,.5)});if(o)for(var k in o)x[k]=o[k];return x;}
function paint(c,r){return new T.MeshPhysicalMaterial({color:c,roughness:r||.34,metalness:.04,clearcoat:.75,clearcoatRoughness:.22});}
function carbonTex(){if(cache.carbon)return cache.carbon;var c=cv(64,64),g=c.getContext("2d");g.fillStyle="#14171c";g.fillRect(0,0,64,64);
 for(var i=0;i<8;i++)for(var j=0;j<8;j++){var x=i*8,y=j*8,vert=(i+j)%2;var gr=vert?g.createLinearGradient(x,y,x+8,y):g.createLinearGradient(x,y,x,y+8);gr.addColorStop(0,"rgba(255,255,255,.02)");gr.addColorStop(.5,"rgba(255,255,255,.2)");gr.addColorStop(1,"rgba(255,255,255,.02)");g.fillStyle=gr;g.fillRect(x,y,8,8);g.strokeStyle="rgba(0,0,0,.45)";g.lineWidth=1;g.strokeRect(x+.5,y+.5,7,7);}
 return cache.carbon=ctex(c,2,2,true);}
function brushTex(){if(cache.brush)return cache.brush;var c=cv(256,256),g=c.getContext("2d"),r=rng(3);g.fillStyle="#808080";g.fillRect(0,0,256,256);
 for(var i=0;i<1800;i++){var l=20+r()*120,x=r()*256,y=r()*256,v=100+r()*100;g.fillStyle="rgba("+v+","+v+","+v+",.18)";g.fillRect(x,y,l,1);}
 return cache.brush=ctex(c,2,2,false);}
function treadTex(){if(cache.tread)return cache.tread;var c=cv(128,64),g=c.getContext("2d");g.fillStyle="#303030";g.fillRect(0,0,128,64);g.fillStyle="#d8d8d8";
 for(var k=0;k<2;k++){g.beginPath();g.moveTo(0,k*32+4);g.lineTo(64,k*32+16);g.lineTo(64,k*32+28);g.lineTo(0,k*32+16);g.fill();g.beginPath();g.moveTo(64,k*32+16);g.lineTo(128,k*32+4);g.lineTo(128,k*32+16);g.lineTo(64,k*32+28);g.fill();}
 return cache.tread=ctex(c,1,1,false);}
function holeTex(){if(cache.holes)return cache.holes;var c=cv(128,128),g=c.getContext("2d"),r=rng(9);g.fillStyle="#262e3a";g.fillRect(0,0,128,128);
 for(var i=0;i<600;i++){g.fillStyle="rgba(255,255,255,"+(r()*.05)+")";g.fillRect(r()*128,r()*128,30+r()*50,1);}
 for(var a=0;a<2;a++)for(var b=0;b<2;b++){var x=32+a*64,y=32+b*64;g.fillStyle="#05080c";g.beginPath();g.arc(x,y,11,0,7);g.fill();g.strokeStyle="rgba(160,175,195,.55)";g.lineWidth=2;g.beginPath();g.arc(x,y,12.5,0,7);g.stroke();}
 return cache.holes=ctex(c,.5,.5,true);}
function labelTex(txt,bg,fg){var k="lab"+txt+bg;if(cache[k])return cache[k];var c=cv(128,48),g=c.getContext("2d");g.fillStyle=bg;g.fillRect(0,0,128,48);g.fillStyle=fg;g.font="bold 26px sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText(txt,64,26);g.strokeStyle=fg;g.lineWidth=2;g.strokeRect(3,3,122,42);var t=ctex(c,1,1,true);t.wrapS=t.wrapT=T.ClampToEdgeWrapping;return cache[k]=t;}
function screws(p,pts,r,mat,axis){pts.forEach(function(q){var s=M(cyl(r,.35,10),mat,q[0],q[1],q[2],p,false);if(axis==="z")s.rotation.x=Math.PI/2;if(axis==="x")s.rotation.z=Math.PI/2;});}
function ring(p,x,y,z,rad,n,r,mat,axis){for(var i=0;i<n;i++){var a=i/n*Math.PI*2,px=x,py=y,pz=z,u=Math.cos(a)*rad,v=Math.sin(a)*rad;if(axis==="z"){px+=u;py+=v;}else if(axis==="x"){py+=u;pz+=v;}else{px+=u;pz+=v;}
 var s=M(cyl(r,.4,8),mat,px,py,pz,p,false);if(axis==="z")s.rotation.x=Math.PI/2;if(axis==="x")s.rotation.z=Math.PI/2;}}

// ---------- wheeled robot ----------
function wheel(g,s,rubber,steel,accent){
 var tp=[[2.0,-1.15],[3.1,-1.15],[3.38,-.95],[3.5,-.55],[3.5,.55],[3.38,.95],[3.1,1.15],[2.0,1.15]].map(function(p){return new T.Vector2(p[0],p[1]);});
 var tg=new T.LatheGeometry(tp,64);tg.rotateX(Math.PI/2);var tm=M(tg,rubber,0,0,0,g);
 var rg=M(cyl(2.1,2.0,40,Math.PI/2),pbr(0x2b3340,.45,.7),0,0,0,g,false);
 var face=new T.LatheGeometry([[0,.2],[.9,.3],[1.6,.1],[2.05,.45],[2.1,0]].map(function(p){return new T.Vector2(p[0],p[1]);}),40);face.rotateX(Math.PI/2);
 M(face,steel,0,0,s*1.0,g,false);
 for(var i=0;i<5;i++){var sp=M(rbox(.6,1.55,.34,.15),i===0?accent:pbr(0xf3f4f6,.4,.1),0,0,s*1.25,g,false);sp.rotation.z=i/5*Math.PI*2;sp.position.set(-Math.sin(i/5*Math.PI*2)*1.2,Math.cos(i/5*Math.PI*2)*1.2,s*1.25);}
 M(cyl(.8,.6,24,Math.PI/2),steel,0,0,s*1.3,g,false);var scr=M(cyl(.32,.5,6,Math.PI/2),pbr(0x0b0f14,.6,.3),0,0,s*1.62,g,false);
 return tm;}
function robot(bot,wheels,wheels2){
 var steel=pbr(0xc3c9d0,.28,.9,{bumpMap:brushTex(),bumpScale:.4}),dark=pbr(0x0f1318,.55,.2),rubber=pbr(0x15181c,.92,0,{bumpMap:treadTex(),bumpScale:.9}),yellow=paint(0xfacc15,.4),accent=pbr(0xef4444,.4,.1);
 rubber.bumpMap.repeat.set(26,1);
 var plateMat=pbr(0xffffff,.42,.55,{map:holeTex(),bumpMap:brushTex(),bumpScale:.25});
 M(flat(15,11,1.2,1.1),plateMat,0,3.4,0,bot);
 screws(bot,[[-6.4,4.05,-4.6],[-6.4,4.05,4.6],[6.4,4.05,-4.6],[6.4,4.05,4.6],[0,4.05,-4.8],[0,4.05,4.8]],.36,steel);
 // front bumper + caster
 M(rbox(1.2,2.2,9.2,.55),pbr(0x1a1f26,.7,.1),7.9,3.1,0,bot);
 M(cyl(1.15,.9,24),steel,6,2.45,0,bot,false);M(new T.SphereGeometry(1.25,24,16),steel,6,1.3,0,bot);
 // gear motors (TT style) and axle under the plate
 [-1,1].forEach(function(sd){
  M(rbox(6.8,2.1,2.3,.5),yellow,-1.5,2.0,sd*3.6,bot);M(rbox(2.6,2.3,2.4,.5),pbr(0x2a2f36,.5,.4),1.0,2.0,sd*3.6,bot);
  M(cyl(.32,5.2,12,Math.PI/2),steel,-1.5,3.5,sd*5.6,bot,false);
  M(rbox(3.2,1.2,.5,.2),steel,-1.5,2.9,sd*5.1,bot,false);
 });
 wheels.length=0;wheels2.length=0;
 [-1,1].forEach(function(s){
  var g=new T.Group();g.position.set(-1.5,3.5,s*6.9);bot.add(g);wheel(g,s,rubber,steel,accent);wheels.push({g:g,s:s});
  var g2=new T.Group();g2.position.set(4.2,3.5,s*6.9);g2.visible=false;bot.add(g2);wheel(g2,s,rubber,steel,accent);wheels2.push(g2);
 });
 // soft contact shadow
 var sc=cv(128,128),sg=sc.getContext("2d"),gr=sg.createRadialGradient(64,64,6,64,64,62);gr.addColorStop(0,"rgba(0,0,0,.55)");gr.addColorStop(.6,"rgba(0,0,0,.22)");gr.addColorStop(1,"rgba(0,0,0,0)");sg.fillStyle=gr;sg.fillRect(0,0,128,128);
 var st=new T.Texture(sc);st.needsUpdate=true;var blob=new T.Mesh(new T.PlaneGeometry(26,22),new T.MeshBasicMaterial({map:st,transparent:true,depthWrite:false}));blob.rotation.x=-Math.PI/2;blob.position.set(0,.06,0);blob.renderOrder=1;bot.add(blob);
}

// ---------- robot arm ----------
function arm(armG,aT,aS,aE,aFing,AR){
 var orange=paint(0xea580c,.32),dark=pbr(0x242a32,.5,.35,{bumpMap:brushTex(),bumpScale:.3}),steel=pbr(0xc3c9d0,.26,.92,{bumpMap:brushTex(),bumpScale:.4}),blk=pbr(0x0e1115,.7,.1),rub=pbr(0x15181c,.95),brass=pbr(0xb08d57,.35,.9);
 // base
 M(flat(40,40,3,2.2),dark,0,1.5,0,armG);
 var tt=new T.LatheGeometry([[0,0],[15.2,0],[15.2,2.2],[14,3]].map(function(p){return new T.Vector2(p[0],p[1]);}),48);M(tt,steel,0,3,0,armG);
 ring(armG,0,6.1,0,12.5,10,.7,blk,"y");
 [[-17,-17],[17,-17],[-17,17],[17,17]].forEach(function(p){M(cyl(2.2,3.4,20),rub,p[0],1.7,p[1],armG,false);M(cyl(.9,.4,8),steel,p[0],3.5,p[1],armG,false);});
 M(rbox(7,3.6,5,.9),dark,-16,3.4,-8,armG);
 var cab=new T.CatmullRomCurve3([new T.Vector3(-16,3.4,-9),new T.Vector3(-22,1.2,-14),new T.Vector3(-30,.7,-17),new T.Vector3(-46,.6,-14)]);
 M(new T.TubeGeometry(cab,24,.55,8),blk,0,0,0,armG,false);
 // turntable
 aT.position.y=6;
 M(rbox(18,8,16,2),orange,0,4,0,aT);
 M(rbox(14,8,20,1.1),dark,0,11,0,aT);
 var lab=M(new T.PlaneGeometry(5,1.8),new T.MeshBasicMaterial({map:labelTex("MM-ARM","#111827","#38bdf8")}),0,11.2,10.1,aT,false);
 screws(aT,[[-6,11,10.15],[6,11,10.15],[-6,11,-10.15],[6,11,-10.15]],.55,steel,"z");
 M(cyl(5.5,22,32,Math.PI/2),steel,0,AR.H0-6,0,aT);
 [-1,1].forEach(function(s){ring(aT,0,AR.H0-6,s*11.1,4.2,6,.5,blk,"z");});
 // shoulder + link 1
 aT.add(aS);aS.position.y=AR.H0-6;
 M(rbox(AR.L1,7,9,1.9),orange,AR.L1/2,0,0,aS);M(rbox(AR.L1-14,2,11,.7),dark,AR.L1/2,0,0,aS);
 [-1,1].forEach(function(s){M(rbox(AR.L1*.45,2.2,.5,1),blk,AR.L1/2,0,s*4.55,aS,false);M(cyl(5.6,.8,32,Math.PI/2),steel,0,0,s*5.5,aS,false);});
 M(cyl(5.5,13,32,Math.PI/2),steel,0,0,0,aS);
 // elbow + forearm
 aS.add(aE);aE.position.x=AR.L1;
 M(cyl(5,13,32,Math.PI/2),steel,0,0,0,aE);M(cyl(2.2,15,16,Math.PI/2),dark,0,0,0,aE);
 [-1,1].forEach(function(s){ring(aE,0,0,s*7,3.6,6,.45,blk,"z");});
 var fl=AR.L2-11;
 M(rbox(fl,5.5,8,1.5),orange,fl/2,0,0,aE);M(rbox(fl-10,2,9.5,.6),dark,fl/2,0,0,aE);
 M(rbox(5,9,13,1),dark,fl+2,0,0,aE);M(cyl(3.2,6,24,Math.PI/2),steel,fl-2,0,0,aE);
 // wrist colour sensor + cable loop
 M(rbox(3,1.6,5,.4),pbr(0x0b3b2e,.5,.2),fl+2.5,5.4,0,aE,false);
 [0xff3030,0x30ff60,0x3070ff].forEach(function(c,i){M(new T.SphereGeometry(.45,10,8),new T.MeshBasicMaterial({color:c}),fl+2.5,6.3,(i-1)*1.5,aE,false);});
 var wc=new T.CatmullRomCurve3([new T.Vector3(fl-9,3,3.6),new T.Vector3(fl-5,6,3),new T.Vector3(fl-1,5.2,1.5),new T.Vector3(fl+1.5,4.8,.8)]);M(new T.TubeGeometry(wc,16,.35,6),blk,0,0,0,aE,false);
 // gripper fingers (animated in z by the app)
 aFing.length=0;
 [-1,1].forEach(function(sd){var f=M(rbox(8,2.2,1.6,.5),steel,fl+8,0,sd*10,aE);var tp=M(rbox(2,3,1.9,.45),rub,fl+11.5,0,sd*10,aE);f.userData.tip=tp;f.userData.sd=sd;aFing.push(f);});
}

// ---------- drone ----------
function drone(inner,props,leds,Mbasic){
 var carbon=pbr(0xffffff,.45,.3,{map:carbonTex()}),shell=paint(0x06b6d4,.28),white=paint(0xf1f5f9,.3),blk=pbr(0x0b0f14,.55,.2),alu=pbr(0xc3c9d0,.28,.92,{bumpMap:brushTex(),bumpScale:.35}),brass=pbr(0xb08d57,.35,.9),lipo=paint(0x1d4ed8,.4),glass=new T.MeshPhysicalMaterial({color:0x0a1530,roughness:.05,metalness:.2,clearcoat:1,clearcoatRoughness:.02});
 M(flat(11,11,.7,1.4),carbon,0,2.3,0,inner);M(flat(10,10,.7,1.4),carbon,0,5.0,0,inner);
 [[-4.2,-4.2],[4.2,-4.2],[-4.2,4.2],[4.2,4.2]].forEach(function(p){M(cyl(.45,2.4,10),brass,p[0],3.65,p[1],inner,false);});
 M(rbox(8,1.7,3.6,.5),lipo,-.4,3.6,0,inner);M(new T.PlaneGeometry(4,1.2),new T.MeshBasicMaterial({map:labelTex("LiPo 3S","#facc15","#1f2937")}),-.4,3.6,1.85,inner,false);
 // top canopy and sensors
 var can=new T.SphereGeometry(4.6,28,14,0,Math.PI*2,0,Math.PI/2);can.scale(1,.42,1);M(can,shell,-.6,5.35,0,inner);
 M(rbox(4.6,.5,3,.25),pbr(0x0f5132,.5,.2),-.6,6.55,0,inner,false);
 [-1,1].forEach(function(s){M(cyl(.9,1.2,16,0,Math.PI/2),alu,4.6,5.5,s*1.9,inner,false);M(cyl(.65,.3,16,0,Math.PI/2),pbr(0x050505,.9),5.3,5.5,s*1.9,inner,false);});
 M(cyl(.12,3,6),blk,-4.4,7,0,inner,false);M(new T.SphereGeometry(.35,10,8),new T.MeshBasicMaterial({color:0xef4444}),-4.4,8.6,0,inner,false);
 // gimbal camera
 M(rbox(1.2,2.6,3.6,.4),blk,5.2,3.3,0,inner,false);
 var cam=M(new T.SphereGeometry(1.7,24,16),blk,6.2,2.6,0,inner);
 var lens=M(new T.SphereGeometry(.95,20,14,0,Math.PI*2,0,Math.PI/2),glass,7.15,2.6,0,inner,false);lens.rotation.z=-Math.PI/2;
 var lr=M(new T.TorusGeometry(1.0,.18,8,24),alu,7.2,2.6,0,inner,false);lr.rotation.y=Math.PI/2;
 // landing legs
 [[-5,-5],[5,-5],[-5,5],[5,5]].forEach(function(p){var l=M(cyl(.38,3.4,8),carbon,p[0]*1.12,1.5,p[1]*1.12,inner,false);l.rotation.z=-p[0]*.045;l.rotation.x=p[1]*.045;M(new T.SphereGeometry(.7,10,8),pbr(0x15181c,.9),p[0]*1.25,.7,p[1]*1.25,inner,false);});
 // arms, motors, guards, props
 [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(function(s,i){
  var ax=s[0]*11,az=s[1]*11,len=Math.hypot(ax,az);
  var armT=M(cyl(.62,len,12,0,Math.PI/2),carbon,ax/2,3.5,az/2,inner);armT.rotation.y=-Math.atan2(az,ax);
  M(cyl(1.9,1.2,28),pbr(0x1f2937,.5,.5),ax,3.9,az,inner);
  M(cyl(1.55,1.5,28),alu,ax,5.0,az,inner);ring(inner,ax,5.0,az,1.2,6,.2,blk,"y");M(cyl(.5,.5,10),blk,ax,5.9,az,inner,false);
  M(rbox(2.6,.9,1.6,.3),pbr(0x14532d,.5,.3),ax*.55,2.9,az*.55+(s[1]>0?1.2:-1.2),inner,false);
  var pg=M(new T.TorusGeometry(7.5,.32,8,40),pbr(0xe5e7eb,.35,.2),ax,3.6,az,inner);pg.rotation.x=Math.PI/2;
  var ph=new T.Group();ph.position.set(ax,6.0,az);inner.add(ph);
  M(cyl(.75,.7,20),alu,0,0,0,ph,false);var cone=M(new T.ConeGeometry(.7,.9,20),alu,0,.7,0,ph,false);
  var bm=pbr(0x111827,.4,.1);
  [0,Math.PI].forEach(function(rot){var pivot=new T.Group();pivot.rotation.y=rot;ph.add(pivot);var b=M(rbox(6.6,.16,1.5,.07),bm,3.9,0,0,pivot);b.rotation.x=.3;});
  var disc=new T.Mesh(new T.CircleGeometry(7,28),new T.MeshBasicMaterial({color:0x94a3b8,transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide}));disc.rotation.x=-Math.PI/2;disc.position.y=.1;ph.add(disc);
  ph.userData.disc=disc;ph.userData.dir=(i%2?1:-1);props.push(ph);
  var led=new T.Mesh(new T.SphereGeometry(.7,10,8),new T.MeshBasicMaterial({color:s[0]>0?0xff2a2a:0x22ff66}));led.position.set(ax,2.5,az);inner.add(led);leds.push(led);
 });
}
return {robot:robot,arm:arm,drone:drone,rbox:rbox,flat:flat,pbr:pbr,paint:paint,carbonTex:carbonTex,brushTex:brushTex,M:M,cyl:cyl,screws:screws,ring:ring,labelTex:labelTex};
})();
