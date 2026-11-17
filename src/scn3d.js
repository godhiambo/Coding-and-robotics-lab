// SCN3D: 3D scenery + animation for the scenario missions (see scn.js). Needs THREE and app helpers.
var SCN3D=(function(){
"use strict";
var E=null,cur=null,phone=null;
function init(env){E=env;}
function T(){return E.THREE;}
function lab(text,w,h,bg,fg,fs){var c=document.createElement("canvas");c.width=256;c.height=Math.round(256*h/w);var g=c.getContext("2d");if(bg){g.fillStyle=bg;g.fillRect(0,0,c.width,c.height);g.strokeStyle="rgba(255,255,255,.85)";g.lineWidth=6;g.strokeRect(5,5,c.width-10,c.height-10);}g.shadowColor="rgba(0,0,0,.6)";g.shadowBlur=bg?0:6;g.fillStyle=fg||"#fff";g.font="bold "+(fs||Math.round(c.height*0.5))+"px sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText(text,c.width/2,c.height/2+2);
 var t=new (T().CanvasTexture)(c);t.anisotropy=4;var m=new (T().Mesh)(new (T().PlaneGeometry)(w,h),new (T().MeshBasicMaterial)({map:t,transparent:!bg}));return m;}
function MM(c,r,m){return E.M(c,r,m);}
function cyl(g,r,h,mat,x,y,z,rx,rz,seg){var o=new (T().Mesh)(new (T().CylinderGeometry)(r,r,h,seg||16),mat);o.position.set(x,y,z);if(rx)o.rotation.x=rx;if(rz)o.rotation.z=rz;o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
function sph(g,r,mat,x,y,z,sx,sy,sz){var o=new (T().Mesh)(new (T().SphereGeometry)(r,14,10),mat);o.position.set(x,y,z);o.scale.set(sx||1,sy||1,sz||1);o.castShadow=true;g.add(o);return o;}
function box(g,w,h,d,mat,x,y,z){return E.B(w,h,d,mat,x,y,z,g);}
function tr(o,x,y,z){o.position.set(x,y,z);return o;}

// ---------------- items ----------------
function itemMesh(kind){var t=T(),g=new t.Group(),s=1;
 function C(col,r,m){return MM(col,r===undefined?0.6:r,m);}
 var tm=function(col,op){return new t.MeshStandardMaterial({color:col,roughness:0.2,transparent:true,opacity:op||0.55});};
 switch(kind){
  case "banana peel":{var b=new t.Mesh(new t.TorusGeometry(3.2,1.1,8,14,Math.PI*1.2),C(0xe9c53a,0.8));b.rotation.x=Math.PI/2;b.position.y=1.2;g.add(b);sph(g,0.9,C(0x4a3520),3.2,1.2,0);break;}
  case "orange peel":{sph(g,3.4,C(0xf08a24,0.9),0,2,0,1,0.55,1);sph(g,2,C(0xffb347,0.9),0.5,2.8,0.4);break;}
  case "leftover ugali":{sph(g,3.6,C(0xf4efe0,0.95),0,2,0,1,0.7,1);sph(g,2.2,C(0xfaf6e9,0.95),0.4,3.2,0.2);break;}
  case "mango seed":{sph(g,3,C(0xd9b66a,0.9),0,2,0,1.4,0.8,0.9);break;}
  case "paper":{sph(g,3.2,C(0xf7f7f2,0.95),0,3,0,1,1,1);sph(g,2.4,C(0xe8e8e0,0.95),1.4,3.5,.8);break;}
  case "newspaper":{box(g,8,0.8,6,C(0xe6e3d6,0.95),0,0.5,0);box(g,6,0.3,0.4,C(0x555555),0,1,-1);box(g,6,0.3,0.4,C(0x555555),0,1,0.8);break;}
  case "cardboard box":{box(g,7,5,6,C(0xb98a4e,0.9),0,2.6,0);box(g,7.1,0.4,1.2,C(0xd9b074,0.9),0,5.2,0);break;}
  case "plastic bottle":{cyl(g,1.6,8,tm(0x6fc3ff,0.6),0,4,0,0,0.0);g.children[0].rotation.z=Math.PI/2;g.children[0].position.y=1.7;cyl(g,0.9,1.2,C(0x1565c0),4.3,1.7,0,0,Math.PI/2);cyl(g,1.65,2,C(0x2e7d32),0,1.7,0,0,Math.PI/2);break;}
  case "plastic bag":{sph(g,3.4,tm(0xffffff,0.75),0,2.4,0,1,0.8,1);sph(g,2,tm(0xe8e8ff,0.8),1.5,3.4,0.6);break;}
  case "tin can":case "soda can":{var cc=kind==="soda can"?0xd32f2f:0xb0b7bf;cyl(g,2.1,5.2,C(cc,0.3,0.7),0,2.7,0);cyl(g,1.7,0.3,C(0xdde3e8,0.3,0.8),0,5.4,0);break;}
  case "old sandal":{box(g,3,0.8,8,C(0x5d4037,0.9),0,0.6,0);box(g,3.4,0.5,1.2,C(0x8d6e63),0,1.1,-1.6);box(g,0.6,0.6,4,C(0x111),-1.3,1.4,0.5);break;}
  case "tyre":{var ty=new t.Mesh(new t.TorusGeometry(3.6,1.6,10,18),C(0x1a1a1a,0.95));ty.rotation.x=Math.PI/2;ty.position.y=1.7;g.add(ty);break;}
  default:sph(g,3,C(0xaaaaaa),0,2,0);
 }
 g.traverse(function(o){if(o.isMesh){o.castShadow=true;}});return g;}

function bin(G,r,label,col,topY){var t=T(),g=new t.Group(),w=r[2],d=r[3],hgt=12,th=1.4,m=MM(col,0.55),inner=MM(0x20262c,0.9);
 box(g,w,0.8,d,inner,r[0]+w/2,0.4,r[1]+d/2);
 box(g,w,hgt,th,m,r[0]+w/2,hgt/2,r[1]+th/2);box(g,w,hgt,th,m,r[0]+w/2,hgt/2,r[1]+d-th/2);box(g,th,hgt,d,m,r[0]+th/2,hgt/2,r[1]+d/2);box(g,th,hgt,d,m,r[0]+w-th/2,hgt/2,r[1]+d/2);
 var s=lab(label,Math.min(w-6,40),9,"#"+("000000"+col.toString(16)).slice(-6),"#fff");s.position.set(r[0]+w/2,hgt-4,r[1]+d+0.2);g.add(s);
 var f=lab(label,Math.min(w-8,38),Math.min(d-8,14),null,"#ffffff",30);f.rotation.x=-Math.PI/2;f.position.set(r[0]+w/2,0.9,r[1]+d/2);g.add(f);
 g.position.y=topY||0;G.add(g);return g;}

function waterTex(){var c=document.createElement("canvas");c.width=c.height=256;var g=c.getContext("2d");var gr=g.createLinearGradient(0,0,256,256);gr.addColorStop(0,"#2d7fb5");gr.addColorStop(1,"#1e6b9c");g.fillStyle=gr;g.fillRect(0,0,256,256);
 g.strokeStyle="rgba(255,255,255,.22)";g.lineWidth=2;for(var i=0;i<40;i++){var x=Math.random()*256,y=Math.random()*256;g.beginPath();g.arc(x,y,6+Math.random()*10,Math.PI*1.1,Math.PI*1.9);g.stroke();}
 var t=new (T().CanvasTexture)(c);t.wrapS=t.wrapT=T().RepeatWrapping;return t;}

// =============================== builders ===============================
var B={};
function waste(G,l,S){
 var items=[];S.bins.forEach(function(b){var col={wet:0x2e9e4f,dry:0x1e63d6,plastic:0xf2b01e,paper:0x2f7fd6,metal:0x78909c,organic:0x6a8f3a}[b.id]||0x888888;bin(G,b.r,b.label,col);});
 S.items.forEach(function(it){var m=itemMesh(it.kind);m.scale.setScalar(1.25);G.add(m);items.push(m);});
 return function(t,st){S.items.forEach(function(it,i){var m=items[i];if(it.held){m.position.set(it.x,6,it.y);m.rotation.y=-st.robot.a*Math.PI/180;}else if(it.bin){m.position.set(it.x,1.2+(i%3)*0.7,it.y);m.rotation.y=it.rot;}else{m.position.set(it.x,0.2,it.y);m.rotation.y=it.rot;}});st.gripClosed=!!S.held;};}
B.wetdry=waste;B.wastetype=waste;

function lake(G,l,S){var t=T(),items=[],wt=waterTex();wt.repeat.set(5,3.4);
 var sea=new t.Mesh(new t.PlaneGeometry(272,200),new t.MeshStandardMaterial({map:wt,transparent:true,opacity:0.5,roughness:0.15,metalness:0.1,depthWrite:false}));sea.rotation.x=-Math.PI/2;sea.position.set(136,0.35,100);G.add(sea);
 var qm=MM(0x9e9a8f,0.95);for(var i=0;i<12;i++)box(G,2,1,8+Math.random()*4,MM(0x8d8a80,1),270.5,6.5,4+i*16.5);
 S.bins.forEach(function(b){var col={plastic:0xf2b01e,metal:0x78909c,other:0x8d5a33}[b.id];bin(G,b.r,b.label,col,6);});
 box(G,2,22,2,MM(0x888,0.5,0.5),262,11,5);box(G,2,22,2,MM(0x888,0.5,0.5),262,11,195);
 for(var k=0;k<5;k++){var rx=-14+k*3;}
 S.items.forEach(function(it){var m=itemMesh(it.kind);m.scale.setScalar(1.4);G.add(m);items.push(m);});
 var reeds=new t.Group();for(var r=0;r<26;r++){var x=Math.random()*270,y=Math.random()<.5?Math.random()*10:190+Math.random()*10;if(x>250)continue;var rd=cyl(reeds,0.4,14,MM(0x4e8f3a),x,7,y);rd.rotation.z=(Math.random()-.5)*0.3;}G.add(reeds);
 return function(tm,st){wt.offset.x=tm*0.004;wt.offset.y=tm*0.0027;
  S.items.forEach(function(it,i){var m=items[i];if(it.bin){m.position.set(it.x,7.6+(i%3)*0.6,it.y);m.rotation.y=it.rot;}
   else if(it.hold){var j=S.hold.indexOf(it);var a=st.robot.a*Math.PI/180,bx=st.robot.x-Math.cos(a)*(2+j*4),bz=st.robot.y-Math.sin(a)*(2+j*4);m.position.set(bx,7+j*0.3,bz);m.rotation.y=-a;}
   else{m.position.set(it.x,0.6+Math.sin(tm*1.6+i*1.7)*0.5,it.y);m.rotation.y=it.rot+Math.sin(tm+i)*0.3;m.rotation.z=Math.sin(tm*1.3+i)*0.12;}});};}
B.lake=lake;

function irrigate(G,l,S){var t=T(),W=E.World,handles=[],jet;
 S.plants.forEach(function(p,i){var r={x:p.x-15,y:p.y-15,w:30,h:30};handles.push(W.buildPlot(G,r,i,p.dry));});
 // depot
 var dx=268,dy=100,tank=cyl(G,13,24,MM(0x1e88e5,0.4,0.3),dx,14,dy);cyl(G,13.2,2,MM(0x0d47a1),dx,28,dy);cyl(G,2,26,MM(0x666,0.5,0.5),dx-10,13,dy+14);cyl(G,2,26,MM(0x666,0.5,0.5),dx+10,13,dy+14);cyl(G,2,26,MM(0x666,0.5,0.5),dx,13,dy-16);
 var s=lab("WATER DEPOT",46,9,"#0d47a1","#fff");s.position.set(dx,31,dy+14);G.add(s);
 var pad=new t.Mesh(new t.PlaneGeometry(54,44),new t.MeshStandardMaterial({color:0xf2c200,roughness:0.9}));pad.rotation.x=-Math.PI/2;pad.position.set(272,0.3,100);G.add(pad);for(var k=0;k<6;k++){var st2=new t.Mesh(new t.PlaneGeometry(4,26),new t.MeshBasicMaterial({color:0x222222}));st2.rotation.x=-Math.PI/2;st2.rotation.z=0.6;st2.position.set(250+k*9,0.35,100);G.add(st2);}
 jet=new t.Mesh(new t.CylinderGeometry(0.9,0.5,1,10,1,true),new t.MeshBasicMaterial({color:0x66bbff,transparent:true,opacity:0.6}));jet.visible=false;G.add(jet);
 var bf=null;
 return function(tm,st){
  S.plants.forEach(function(p,i){var wet=!(p.dry&&!p.watered);if(handles[i]&&handles[i]._wet!==wet){handles[i]._wet=wet;W.setPlotState(handles[i],!wet);}});
  if(S.pump>0&&S.pp!==undefined){var tx=S.pp?S.pp.x:st.robot.x,ty=S.pp?S.pp.y:(S.pside==="left"?st.robot.y-30:st.robot.y+30),sx=st.robot.x,sy=st.robot.y,dx2=tx-sx,dy2=ty-sy,len=Math.hypot(dx2,dy2);jet.visible=true;jet.scale.set(1,len,1);jet.position.set((sx+tx)/2,8,(sy+ty)/2);jet.rotation.set(0,0,0);jet.rotation.x=Math.PI/2;jet.rotation.z=0;jet.rotation.y=0;jet.lookAt(tx,2,ty);jet.rotateX(Math.PI/2);}else jet.visible=false;
  st.pump=S.pump>0;};}
B.irrigate=irrigate;

function cloth(G,l,S){var t=T(),clothes=[],rain,pos=[];
 var wall=MM(0xe8d9b5,0.9),roofm=MM(0x7a2e22,0.8);
 box(G,80,56,70,wall,70,28,100);box(G,12,10,20,MM(0x5a3b22,0.8),110.2,16,100);box(G,0.6,16,12,MM(0x7fb5d8,0.2),110.3,32,76);box(G,0.6,16,12,MM(0x7fb5d8,0.2),110.3,32,124);
 var roof=box(G,110,2.2,88,roofm,95,58,100);roof.rotation.z=-0.1;roof.position.y=57;
 var aw=box(G,64,1.6,52,roofm,142,44,100);aw.rotation.z=0.0;
 [[112,60],[112,140],[172,60],[172,140]].forEach(function(p){cyl(G,1.4,44,MM(0x8a6a44,0.9),p[0],22,p[1]);});
 // rain sensor plate + sunlight sensor on awning
 var rp=box(G,9,0.6,6,MM(0x263238,0.4,0.4),130,45.2,70);rp.rotation.z=0.25;box(G,3,2,3,MM(0xef6c00),150,45.4,70);
 var lb=lab("RAIN SENSOR",26,6,"#37474f","#fff");lb.position.set(130,40,69.5);G.add(lb);
 // winch box and pole
 box(G,10,10,10,MM(0x00695c,0.5),112,5,100);var ws=lab("WINCH",14,5,"#004d40","#fff");ws.position.set(112,11,105.3);G.add(ws);
 cyl(G,1.6,60,MM(0x8a8a8a,0.5,0.6),262,30,100);box(G,8,1.4,1.4,MM(0x777),262,58,100);
 var rope=new t.Mesh(new t.CylinderGeometry(0.35,0.35,150,6),MM(0xdddddd,0.7));rope.rotation.z=Math.PI/2;rope.position.set(187,40,100);G.add(rope);
 var cols=[0xe53935,0x1e88e5,0xfdd835,0x43a047,0xffffff,0xab47bc,0xff7043];
 for(var i=0;i<7;i++){var g=new t.Group(),col=cols[i%cols.length],body=new t.Mesh(new t.PlaneGeometry(12,15),new t.MeshStandardMaterial({color:col,roughness:0.9,side:t.DoubleSide}));body.position.set(0,-8,0);body.castShadow=true;g.add(body);
  var sl=new t.Mesh(new t.PlaneGeometry(5,9),new t.MeshStandardMaterial({color:col,roughness:0.9,side:t.DoubleSide}));sl.position.set(-8,-6,0);sl.rotation.z=0.4;g.add(sl);var sr=sl.clone();sr.position.x=8;sr.rotation.z=-0.4;g.add(sr);G.add(g);clothes.push({g:g,mats:[body.material,sl.material,sr.material],col:new t.Color(col)});}
 var n=420,geo=new t.BufferGeometry(),arr=new Float32Array(n*6),seed=[];for(var d=0;d<n;d++){seed.push([Math.random()*300,Math.random()*200,Math.random()*110]);}
 geo.setAttribute("position",new t.BufferAttribute(arr,3));rain=new t.LineSegments(geo,new t.LineBasicMaterial({color:0x9ec8ee,transparent:true,opacity:0.7}));rain.frustumCulled=false;G.add(rain);
 var sun=new t.Mesh(new t.SphereGeometry(10,16,12),new t.MeshBasicMaterial({color:0xffe066}));sun.position.set(240,150,-40);G.add(sun);
 return function(tm,st){var x0=118+0,k=S.pos;
  clothes.forEach(function(c,i){var xe=170+i*13,xf=126+i*4.2,x=xf+(xe-xf)*k,sx=0.45+0.55*k;c.g.position.set(x,40,100);c.g.scale.set(sx,1,1);var wet=S.damp/100,f=1-0.55*wet;c.mats.forEach(function(m){m.color.copy(c.col).multiplyScalar(f);});c.g.rotation.z=Math.sin(tm*2+i)*0.03*(1-wet*0.7);});
  var a=rain.geometry.attributes.position,on=S.rain>1;rain.visible=on;if(on){var sp=(60+S.rain)*0.02;for(var d=0;d<n;d++){var s=seed[d];s[2]-=(2+S.rain*0.09);if(s[2]<0)s[2]+=110;var x=s[0],z=s[2],y=s[1];a.setXYZ(d*2,x,z,y);a.setXYZ(d*2+1,x-0.4,z+3+S.rain*0.04,y);}a.needsUpdate=true;}
  sun.visible=S.sun;E.scene.background&&0;};}
B.cloth=cloth;

function tomato(G,l,S){var t=T(),fm=[],tm=null;
 var leaf=MM(0x2f7a2c,0.85),stem=MM(0x6b4a2b,0.9);
 S.plants.forEach(function(p){cyl(G,0.8,130,MM(0x8a6a44,0.9),p.x,65,p.y);for(var k=0;k<34;k++){var lf=sph(G,3+Math.random()*2.2,leaf,p.x+(Math.random()-.5)*15,18+k*3.3,p.y+(Math.random()-.5)*13,1.2,0.5,1);lf.rotation.y=Math.random()*3;lf.rotation.z=(Math.random()-.5)*0.8;}});
 for(var r=0;r<2;r++){var y=r?140:60;var bed=new t.Mesh(new t.PlaneGeometry(170,26),new t.MeshStandardMaterial({color:0x3a281a,roughness:1}));bed.rotation.x=-Math.PI/2;bed.position.set(155,0.35,y);G.add(bed);}
 S.fruit.forEach(function(f){var m=new t.Group();var s=sph(m,4.2,new t.MeshStandardMaterial({color:f.ripe?0xe53935:0x5aa83a,roughness:0.35}),0,0,0);var cap=sph(m,2.2,MM(0x2e7d32),0,3.8,0,1,0.35,1);G.add(m);fm.push(m);});
 var bk=S.basketPos||[30,110];var basket=cyl(G,13,12,MM(0xc89b5a,0.95),bk[0],6,bk[1],0,0,20);cyl(G,12,0.6,MM(0x6b4a2b),bk[0],1,bk[1]);var bl=lab("BASKET",22,6,"#6b4a2b","#fff");bl.position.set(bk[0],16,bk[1]+13.5);G.add(bl);
 var bk2=[];S.fruit.forEach(function(){bk2.push(0);});
 return function(tmv,st){S.fruit.forEach(function(f,i){var m=fm[i];if(f.inBasket){m.visible=true;var j=i%6;m.position.set(bk[0]+(j%3-1)*5,8+(j>2?3:0),bk[1]+(j>2?3:-3)+(j%2)*2);}else if(f.gone){m.visible=false;}else if(f.hold){m.visible=true;var k=S.tray.indexOf(f);m.position.set(st.robot.x+(k-1)*4,st.drone.z-8,st.robot.y);}else{m.visible=true;m.position.set(f.x,f.z,f.y);}});};}
B.tomato=tomato;

function cropmon(G,l,S,st){var t=T(),W=E.World,hs=[],spots=[],poles=[];
 S.plots.forEach(function(p,i){var r={x:p.x,y:p.y,w:p.w,h:p.h2};var dry=p.m<30;hs.push(W.buildPlot(G,r,i,dry));
  cyl(G,0.9,30,MM(0x607d8b,0.5,0.5),p.x+p.w/2,15,p.y-6);var s=lab("PLOT "+(i+1),20,7,"#37474f","#fff");s.position.set(p.x+p.w/2,31,p.y-5);G.add(s);
  if(p.leaf!=="healthy"){for(var k=0;k<16;k++){var d=new t.Mesh(new t.CircleGeometry(1.5+Math.random()*1.4,8),new t.MeshBasicMaterial({color:p.leaf==="blight"?0x4e342e:0xd2691e,side:t.DoubleSide}));d.rotation.x=-Math.PI/2;d.position.set(p.x+6+Math.random()*(p.w-12),5.2+Math.random()*3,p.y+6+Math.random()*(p.h2-12));G.add(d);}}
  if(p.t>34){var h=new t.Mesh(new t.CylinderGeometry(p.w/2,p.w/2,26,18,1,true),new t.MeshBasicMaterial({color:0xff7043,transparent:true,opacity:0.12,side:t.DoubleSide,depthWrite:false}));h.position.set(p.x+p.w/2,13,p.y+p.h2/2);G.add(h);poles.push(h);}
  if(p.h>80){var m=new t.Mesh(new t.CylinderGeometry(p.w/2,p.w/2,18,18,1,true),new t.MeshBasicMaterial({color:0xb0d4ff,transparent:true,opacity:0.14,side:t.DoubleSide,depthWrite:false}));m.position.set(p.x+p.w/2,9,p.y+p.h2/2);G.add(m);}});
 // gateway antenna tower
 cyl(G,1.2,60,MM(0x777,0.5,0.5),288,30,100);sph(G,3,MM(0xff3b3b),288,62,100);
 return function(tm,st){S.plots.forEach(function(p,i){var wet=!(p.m<30);if(hs[i]&&hs[i]._wet!==wet){hs[i]._wet=wet;W.setPlotState(hs[i],!wet);}});poles.forEach(function(h,i){h.material.opacity=0.1+0.05*Math.sin(tm*3+i);});};}
B.cropmon=cropmon;

function pothole(G,l,S){var t=T(),cones=[];
 // fences and verge
 for(var i=0;i<14;i++)box(G,1.2,7,1.2,MM(0xeeeeee,0.7),10+i*21,3.5,52.5),box(G,1.2,7,1.2,MM(0xeeeeee,0.7),10+i*21,3.5,147.5);
 var sg=lab("THIKA ROAD",30,8,"#0b6b3a","#fff");sg.position.set(60,20,48);G.add(sg);cyl(G,0.8,18,MM(0x777,0.5,0.5),60,9,48);
 S.holes.forEach(function(h){var m=new t.Mesh(new t.CylinderGeometry(h.r,h.r*0.8,3,18),new t.MeshStandardMaterial({color:0x14110f,roughness:1}));m.position.set(h.x,-0.8,h.y);m.scale.z=0.8;G.add(m);
  var rim=new t.Mesh(new t.TorusGeometry(h.r*0.95,1.4,6,18),new t.MeshStandardMaterial({color:0x2b2926,roughness:1}));rim.rotation.x=Math.PI/2;rim.scale.y=0.8;rim.position.set(h.x,0.2,h.y);G.add(rim);
  var cone=new t.Group();cyl(cone,0.1,0.1,MM(0xff6d00),0,0,0);var c1=new t.Mesh(new t.ConeGeometry(2.8,8,12),MM(0xff6d00,0.6));c1.position.y=4;cone.add(c1);var c2=new t.Mesh(new t.CylinderGeometry(1.5,1.9,1.3,12),MM(0xffffff,0.6));c2.position.y=3.5;cone.add(c2);var bs=box(cone,8,0.6,8,MM(0x222,0.9),0,0.3,0);cone.position.set(h.x-h.r-5,0,h.y+h.r+3);cone.visible=false;G.add(cone);
  var sgn=lab("ROAD DAMAGE",22,7,"#f9a825","#222",36);sgn.position.set(h.x-h.r-5,14,h.y+h.r+4);sgn.visible=false;G.add(sgn);cones.push({c:cone,s:sgn,h:h});
  var ring=new t.Mesh(new t.RingGeometry(h.r+3,h.r+4.5,28),new t.MeshBasicMaterial({color:0x00e5ff,transparent:true,opacity:0.0,side:t.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.set(h.x,0.5,h.y);G.add(ring);cones[cones.length-1].ring=ring;});
 var pad=S.padPos||[30,100];
 return function(tm,st){cones.forEach(function(o){o.c.visible=o.s.visible=!!o.h.map;o.ring.material.opacity=o.h.sms?0.6+0.3*Math.sin(tm*4):0;});};}
B.pothole=pothole;

function fire(G,l,S){var t=T(),flames=[],puffs=[],AR=E.AR;
 // room dressing
 var wall=MM(0xcfd8dc,0.9);box(G,300,50,4,wall,150,25,-2);box(G,4,50,200,wall,-2,25,100);box(G,4,50,200,wall,302,25,100);
 var sg=lab("FIRE LAB",34,8,"#b71c1c","#fff");sg.position.set(150,42,0.5);G.add(sg);
 var fx=function(a){return [AR.x+92*Math.cos(a*Math.PI/180),AR.y-92*Math.sin(a*Math.PI/180)];};
 var pile=new t.Group();for(var i=0;i<5;i++){cyl(pile,2.4,26,MM(0x5d4037,0.95),(i-2)*4.6,4,0,0,Math.PI/2);}pile.position.y=2;G.add(pile);
 for(var f=0;f<7;f++){var fm=new t.Mesh(new t.ConeGeometry(4+Math.random()*3,14+Math.random()*10,10),new t.MeshBasicMaterial({color:f%3===0?0xffd54f:f%3===1?0xff8f00:0xe65100,transparent:true,opacity:0.85,depthWrite:false}));G.add(fm);flames.push({m:fm,ph:Math.random()*6,ox:(Math.random()-.5)*14,oz:(Math.random()-.5)*8});}
 for(var p=0;p<8;p++){var sm=new t.Mesh(new t.SphereGeometry(4,10,8),new t.MeshBasicMaterial({color:0x4b4b4b,transparent:true,opacity:0.0,depthWrite:false}));G.add(sm);puffs.push({m:sm,ph:p/8});}
 var beacon=new t.PointLight(0xff0000,0,160,1.5);beacon.position.set(150,44,20);G.add(beacon);
 var bc=new t.Mesh(new t.SphereGeometry(4,12,10),new t.MeshStandardMaterial({color:0x550000,emissive:0xff0000,emissiveIntensity:0}));bc.position.set(150,46,20);G.add(bc);box(G,8,4,8,MM(0x333),150,41,20);
 var al=lab("ALARM",16,5,"#b71c1c","#fff");al.position.set(150,36,24.2);G.add(al);
 var glow=new t.PointLight(0xff8a30,0,140,1.4);G.add(glow);
 var jet=new t.Mesh(new t.CylinderGeometry(1.1,0.6,1,10,1,true),new t.MeshBasicMaterial({color:0xaad8ff,transparent:true,opacity:0.7}));jet.visible=false;G.add(jet);
 var spots=[];for(var q=0;q<5;q++){var dp=new t.Mesh(new t.SphereGeometry(0.9,6,5),new t.MeshBasicMaterial({color:0xcfe8ff,transparent:true,opacity:0.8}));dp.visible=false;G.add(dp);spots.push(dp);}
 var lastBeep=0;
 return function(tm,st){var P=fx(S.ang),k=S.fire/100;pile.position.set(P[0],2,P[1]);pile.rotation.y=-S.ang*Math.PI/180;
  flames.forEach(function(o,i){var vis=k>0.02;o.m.visible=vis;if(!vis)return;var h=(0.55+0.45*Math.sin(tm*9+o.ph))*k;o.m.scale.set(0.6+0.5*k,0.3+h*1.3,0.6+0.5*k);o.m.position.set(P[0]+o.ox*k,6+h*8,P[1]+o.oz*k);});
  glow.position.set(P[0],14,P[1]);glow.intensity=k*1.4*(0.8+0.2*Math.sin(tm*14));
  puffs.forEach(function(o){var ph=(tm*0.35+o.ph)%1,sm=S.smoke/100;o.m.position.set(P[0]+Math.sin(ph*5+o.ph*9)*5,10+ph*38,P[1]+(ph*8));o.m.scale.setScalar(0.6+ph*1.8);o.m.material.opacity=sm*0.4*(1-ph);o.m.visible=sm>0.03;});
  var on=S.alarm;beacon.intensity=on?(Math.sin(tm*10)>0?2.2:0.2):0;bc.material.emissiveIntensity=on?(Math.sin(tm*10)>0?2.5:0.3):0;
  if(on&&tm-lastBeep>0.7){lastBeep=tm;st.beeps++;}
  var tip=C0().armTip();if(S.spray&&S.tank>0){var dx=P[0]-tip.x,dy=P[1]-tip.y,len=Math.hypot(dx,dy,tip.z-4);jet.visible=true;jet.position.set((tip.x+P[0])/2,(tip.z+4)/2,(tip.y+P[1])/2);jet.scale.set(1,len,1);jet.lookAt(P[0],4,P[1]);jet.rotateX(Math.PI/2);}else jet.visible=false;};}
B.fire=fire;
function C0(){return E.C;}

function handwash(G0,l,S){var t=T(),W=null,G=new t.Group();G.scale.setScalar(1.7);G.position.set(150-150*1.7,0,100-52*1.7);G0.add(G);
 var wall=MM(0xcfd8dc,0.9),tile=MM(0xffffff,0.35);
 box(G,200,90,5,MM(0xb0bec5,0.85),150,45,28);for(var i=0;i<10;i++)for(var j=0;j<4;j++)if((i+j)%2===0)box(G,19.5,19.5,0.4,MM(0xe3f2fd,0.3),60+i*20,12+j*20,25.3);
 box(G,110,6,52,MM(0xd7ccc8,0.7),150,40,52);box(G,110,34,50,MM(0x8d6e63,0.9),150,20,52);
 var basin=cyl(G,24,5,MM(0xffffff,0.2,0.1),150,43.5,52,0,0,28);cyl(G,19,1,MM(0xdfe7ea,0.4),150,41.2,52,0,0,24);
 cyl(G,3,3,MM(0x444),150,41,52);
 var tap=new t.Group();cyl(tap,1.6,22,MM(0xcfd8dc,0.15,0.9),0,11,0);var arm=cyl(tap,1.5,24,MM(0xcfd8dc,0.15,0.9),0,22,12,Math.PI/2);var nz=cyl(tap,2,4,MM(0xcfd8dc,0.15,0.9),0,22,24);tap.position.set(150,43,36);G.add(tap);
 var ir=box(G,8,5,3,MM(0x222,0.4),150,58,63);var irl=new t.Mesh(new t.SphereGeometry(1.4,10,8),new t.MeshStandardMaterial({color:0x330000,emissive:0xff0000,emissiveIntensity:0.2}));irl.position.set(150,58,64.8);G.add(irl);var irsl=lab("IR SENSOR",14,4,"#222","#fff");irsl.position.set(150,64,64.6);G.add(irsl);
 var sbot=cyl(G,5,16,MM(0x81c784,0.4),188,52,48);cyl(G,1.3,6,MM(0xcfd8dc,0.3,0.7),188,63,48);var sp=box(G,2,1.2,8,MM(0xcfd8dc,0.3,0.7),188,65,52);var sl=lab("SOAP",9,4,"#2e7d32","#fff");sl.position.set(188,52,53.2);G.add(sl);
 box(G,34,22,6,MM(0x263238,0.6),150,72,26);var lcd=lab("WASH HANDS",30,12,"#0d2b2b","#37d6c6",34);lcd.position.set(150,72,23.1);G.add(lcd);
 var stream=new t.Mesh(new t.CylinderGeometry(0.8,0.6,1,10,1,true),new t.MeshBasicMaterial({color:0x8fd0ff,transparent:true,opacity:0.65}));stream.visible=false;G.add(stream);
 var foam=sph(G,3.2,MM(0xffffff,0.95),150,48,56,1,0.6,1);foam.visible=false;
 var hands=new t.Group(),skin=[0xf1c27d,0x8d5524,0xc68642,0xe0ac69];for(var h=0;h<2;h++){var hm=new t.Group();box(hm,6,2.4,10,MM(0xf1c27d,0.7),0,0,0);box(hm,5,2,14,MM(0xf1c27d,0.7),0,0,-11);hm.position.set(h?5:-5,0,0);hands.add(hm);}hands.position.set(150,52,56);hands.visible=false;G.add(hands);
 var ppl=[0x1e88e5,0xe53935,0x43a047],people=[];ppl.forEach(function(c,i){var p=new t.Group();cyl(p,7,30,MM(c,0.8),0,15+40,0);sph(p,6,MM(skin[i%4],0.7),0,62,0);p.position.set(150,0,90);p.visible=false;G.add(p);people.push(p);});
 return function(tm,st){var v=S.here,vi=v?S.visits.indexOf(v):-1;people.forEach(function(p,i){p.visible=i===vi;});hands.visible=!!v;if(v){hands.children.forEach(function(h,i){h.position.y=Math.sin(tm*8+i*2)*0.8*(S.water?1:0.1);h.rotation.y=Math.sin(tm*8+i)*0.15*(S.water?1:0);h.children[0].material.color.setHex(skin[vi%4]);});}
  irl.material.emissiveIntensity=v?2.5:0.15;irl.material.color.setHex(v?0xff3030:0x330000);
  stream.visible=S.water;if(S.water){stream.scale.set(1,18,1);stream.position.set(150,52,50+ (Math.sin(tm*30)*0.2));stream.position.y=44+9;}
  foam.visible=!!v&&v.soap>0&&(S.water||tm%2>0);foam.position.y=48+Math.sin(tm*6)*0.6;};}
B.handwash=handwash;

function dam(G,l,S){var t=T(),conc=MM(0xb7b2a8,0.9),wt=waterTex();wt.repeat.set(4,3);
 var valley=new t.Mesh(new t.PlaneGeometry(300,200),new t.MeshStandardMaterial({color:0x4c6a30,roughness:1}));valley.rotation.x=-Math.PI/2;valley.position.set(150,0.1,100);G.add(valley);
 var res=new t.Mesh(new t.BoxGeometry(128,1,150),new t.MeshStandardMaterial({map:wt,color:0x7fb8e0,transparent:true,opacity:0.85,roughness:0.15}));res.position.set(84,10,100);G.add(res);
 var riv=new t.Mesh(new t.PlaneGeometry(150,36),new t.MeshStandardMaterial({map:wt,roughness:0.2,transparent:true,opacity:0.9}));riv.rotation.x=-Math.PI/2;riv.position.set(225,1,100);G.add(riv);
 // banks of reservoir
 box(G,130,22,6,MM(0x6b5b45,1),84,11,22);box(G,130,14,6,MM(0x6b5b45,1),84,7,178);box(G,6,22,160,MM(0x6b5b45,1),18,11,100);
 // dam wall with gate slot
 box(G,10,64,60,conc,150,32,43);box(G,10,64,60,conc,150,32,157);box(G,10,26,40,conc,150,51,100);box(G,12,2,160,MM(0x9e9a8f,0.9),150,65,100);
 for(var i=0;i<9;i++)box(G,1,5,1,MM(0x666),145,68,26+i*18);
 var gate=box(G,2.6,36,38,MM(0xe65100,0.5,0.4),146,20,100);var gl=lab("GATE",12,5,"#bf360c","#fff");gl.rotation.y=-Math.PI/2;gl.position.set(144.6,20,100);G.add(gl);
 var servoBox=box(G,12,9,14,MM(0x00695c,0.5),150,72,100);var sl=lab("SERVO",10,4,"#004d40","#fff");sl.position.set(150,72,107.3);G.add(sl);
 var jet=new t.Mesh(new t.BoxGeometry(60,1,36),new t.MeshBasicMaterial({color:0xcfe9ff,transparent:true,opacity:0.7}));jet.position.set(184,4,100);G.add(jet);
 // level staff
 var staff=box(G,3,60,3,MM(0xffffff,0.6),138,30,40);var band=box(G,3.2,30,3.2,MM(0x43a047,0.5),138,10+30*0.35+15,40);
 var bl=lab("SAFE 35-85%",20,5,"#2e7d32","#fff");bl.rotation.y=-Math.PI/2;bl.position.set(139.8,70,40);G.add(bl);
 var cur=box(G,6,1.2,6,MM(0xd32f2f,0.4),138,10,40);
 // siren tower
 cyl(G,1.6,50,MM(0x777,0.5,0.5),230,25,52);var sirenL=new t.PointLight(0xff3300,0,150,1.5);sirenL.position.set(230,56,52);G.add(sirenL);var sir=new t.Mesh(new t.CylinderGeometry(3.4,3.4,6,12),new t.MeshStandardMaterial({color:0x550000,emissive:0xff2200,emissiveIntensity:0}));sir.position.set(230,53,52);G.add(sir);var tl=lab("SIREN",14,5,"#b71c1c","#fff");tl.position.set(230,44,55);G.add(tl);
 var cow=new t.Group();box(cow,10,6,5,MM(0xf5f5f5,0.9),0,5,0);box(cow,3,5,3,MM(0x222),6,7,0);cow.position.set(230,0,112);G.add(cow);
 // rain
 var n=300,geo=new t.BufferGeometry(),arr=new Float32Array(n*6),seed=[];for(var d=0;d<n;d++)seed.push([Math.random()*160,Math.random()*200,Math.random()*100]);geo.setAttribute("position",new t.BufferAttribute(arr,3));var rain=new t.LineSegments(geo,new t.LineBasicMaterial({color:0x9ec8ee,transparent:true,opacity:0.7}));rain.frustumCulled=false;G.add(rain);
 var lastBeep=0;
 return function(tm,st){wt.offset.x=tm*0.01;var lv=S.level;res.scale.y=1;res.position.y=4+lv*0.5;res.scale.set(1,Math.max(1,lv*0.5+8),1);res.position.y=(lv*0.5+8)/2;
  gate.position.y=20+S.gate/100*30;jet.visible=S.gate>2;jet.scale.set(1,1,0.3+S.gate/100*0.9);jet.position.y=2+S.gate/100*5;
  cur.position.y=10+lv*0.5;
  var on=tm-S.siren<5;sirenL.intensity=on?(Math.sin(tm*12)>0?2.4:0.2):0;sir.material.emissiveIntensity=on?(Math.sin(tm*12)>0?2.5:0.2):0;if(on&&tm-lastBeep>0.6){lastBeep=tm;st.beeps++;}
  var rr=S.in>2.2?Math.min(100,(S.in-1.6)*18):0;rain.visible=rr>2;if(rr>2){var a=rain.geometry.attributes.position;for(var d=0;d<n;d++){var s=seed[d];s[2]-=3;if(s[2]<0)s[2]+=100;a.setXYZ(d*2,s[0],s[2],s[1]);a.setXYZ(d*2+1,s[0]-0.5,s[2]+4,s[1]);}a.needsUpdate=true;}};}
B.dam=dam;

// =============================== phone app overlay ===============================
function phoneShow(on,html){if(!phone){var host=document.getElementById("stage")||document.getElementById("view3d")||E.box;phone=document.createElement("div");phone.style.cssText="position:absolute;right:8px;top:58px;width:150px;max-height:86%;overflow:auto;background:#0f172a;color:#e5e7eb;border:3px solid #334155;border-radius:16px;padding:7px 8px;font:11px/1.35 system-ui,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.45);z-index:6;pointer-events:none";(E.box).appendChild(phone);}
 phone.style.display=on?"block":"none";if(on&&html!==undefined&&phone._h!==html){phone._h=html;phone.innerHTML=html;}}
function phoneHtml(l,S){
 if(l.id==="cropmon"){var h='<div style="font-weight:700;margin-bottom:3px">📱 Farmer app</div>';
  for(var i=0;i<4;i++){var d=S.data[i];h+='<div style="background:#1e293b;border-radius:6px;padding:3px 5px;margin:2px 0"><b>Plot '+(i+1)+'</b> '+(d?'💧'+d.m+'% 🌡'+d.t+'° 💨'+d.h+'%':'<span style="opacity:.5">no data yet</span>')+'</div>';}
  S.msgs.filter(function(m){return m.alert||m.bad;}).slice(-4).forEach(function(m){h+='<div style="background:'+(m.bad?'#78350f':'#7f1d1d')+';border-radius:6px;padding:3px 5px;margin:2px 0">'+m.txt+'</div>';});return h;}
 if(l.id==="pothole"){var h2='<div style="font-weight:700;margin-bottom:3px">📱 Roads app</div><div style="background:#1e293b;border-radius:6px;height:62px;position:relative;margin-bottom:3px;overflow:hidden"><div style="position:absolute;left:0;right:0;top:22px;height:18px;background:#475569"></div><div style="position:absolute;left:0;right:0;top:30px;border-top:2px dashed #e2e8f0"></div>';
  S.warn.forEach(function(w){h2+='<div style="position:absolute;left:'+Math.round(w.x/300*140)+'px;top:'+(Math.round((w.y-60)/80*18)+18)+'px;font-size:14px">⚠️</div>';});h2+='</div>';
  S.msgs.slice(-3).forEach(function(m){h2+='<div style="background:#1e3a8a;border-radius:6px;padding:3px 5px;margin:2px 0;white-space:pre-wrap">'+m.txt+'</div>';});
  h2+='<div style="opacity:.7;margin-top:2px">Warnings on map: '+S.warn.length+'</div>';return h2;}
 return "";}

// =============================== public ===============================
function build(G,l,S){cur=null;if(phone)phone.style.display="none";if(!l.scn||!S||!B[l.id])return;
 var upd=B[l.id](G,l,S,E.C.st);var showPhone=l.id==="cropmon"||l.id==="pothole";
 cur={upd:upd,l:l,S:S,phone:showPhone};}
function update(tm){if(!cur)return;var st=E.C.st;try{cur.upd(tm,st);}catch(e){}
 if(cur.phone)phoneShow(true,phoneHtml(cur.l,cur.S));}
function boat(bot,wheels,wheels2,on){
 if(!bot._boat){var t=T(),g=new t.Group(),m=MM(0xeceff1,0.4),dk=MM(0x37474f,0.5);[-5.6,5.6].forEach(function(z){var h=new t.Mesh(new t.CylinderGeometry(2.4,2.4,17,14),m);h.rotation.z=Math.PI/2;h.position.set(0,1.6,z);g.add(h);sph(g,2.4,m,8.5,1.6,z);sph(g,2.4,m,-8.5,1.6,z);cyl(g,0.5,6,dk,-10.5,2,z,0,0);var pr=new t.Mesh(new t.BoxGeometry(0.4,5,1.2),dk);pr.position.set(-11.5,2,z);pr.name="prop";g.add(pr);});
  var net=new t.Group();var fr=new t.Mesh(new t.TorusGeometry(5.2,0.4,6,14,Math.PI),MM(0xef6c00,0.5));fr.rotation.set(Math.PI/2,0,Math.PI/2);net.add(fr);var mesh=new t.Mesh(new t.SphereGeometry(5,10,8,0,Math.PI*2,Math.PI/2,Math.PI/2),new t.MeshBasicMaterial({color:0xffb74d,wireframe:true}));mesh.rotation.x=0;net.add(mesh);net.position.set(11,4,0);net.name="net";g.add(net);
  g.visible=false;bot.add(g);bot._boat=g;}
 bot._boat.visible=on;wheels.forEach(function(w){if(w.g)w.g.visible=!on;});wheels2.forEach(function(w){w.visible=!on&&w.visible;});
 if(on){var S=E.C.st.S,net=bot._boat.getObjectByName("net");if(net&&S)net.rotation.z=S.scoop?-0.1:0.9;bot._boat.children.forEach(function(c){if(c.name==="prop")c.rotation.x+=0.4;});}}
return {init:init,build:build,update:update,boat:boat,phoneShow:phoneShow};
})();
