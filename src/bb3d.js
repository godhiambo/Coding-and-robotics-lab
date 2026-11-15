(function(){
"use strict";
var API=window.BBAPI,X=Circuit,$=function(id){return document.getElementById(id);};
var box=$("bb3d");
if(!API||!box||typeof THREE==="undefined")return;
var S=0.1,WIRECOL=[0xe53935,0xfb8c00,0x43a047,0x1e88e5,0x8e24aa,0x00acc1,0x6d4c41,0x546e7a];
function Wx(x){return (x-300)*S;}function Wz(y){return (y-172)*S;}
function V(h){var p=API.pos(h);return new THREE.Vector3(Wx(p[0]),0,Wz(p[1]));}
var renderer,scene,camera,dirty=true,lowBox=false,mode="place";
try{renderer=new THREE.WebGLRenderer({antialias:true});}catch(e){box.innerHTML="<div class='empty'>3D is not supported on this device. Use the flat diagram.</div>";return;}
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputEncoding=THREE.sRGBEncoding;
box.appendChild(renderer.domElement);renderer.domElement.style.cssText="width:100%;display:block;touch-action:none;border-radius:12px";
scene=new THREE.Scene();scene.background=new THREE.Color(0x121a27);
camera=new THREE.PerspectiveCamera(40,1.55,0.5,400);
scene.add(new THREE.HemisphereLight(0xffffff,0x44505e,0.75));
var sun=new THREE.DirectionalLight(0xffffff,0.85);sun.position.set(-8,55,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
var sc=sun.shadow.camera;sc.left=-45;sc.right=45;sc.top=40;sc.bottom=-40;sc.near=5;sc.far=120;sun.shadow.bias=-0.0006;sun.shadow.radius=3;scene.add(sun);
// desk
var desk=new THREE.Mesh(new THREE.PlaneGeometry(300,300),new THREE.MeshStandardMaterial({color:0x172030,roughness:0.95}));desk.rotation.x=-Math.PI/2;desk.position.y=-0.85;desk.receiveShadow=true;scene.add(desk);
function M(c,r,m){return new THREE.MeshStandardMaterial({color:c,roughness:r===undefined?0.6:r,metalness:m||0});}
// ---------- board ----------
var BW=584*S,BD=322*S,TOP=0;
var board=new THREE.Mesh(new THREE.BoxGeometry(BW,0.8,BD),M(0xe9e5d7,0.55));board.position.set(Wx(300),-0.4,Wz(175));board.receiveShadow=true;board.castShadow=true;scene.add(board);
(function(){
 var cv=document.createElement("canvas"),k=4;cv.width=584*k;cv.height=322*k;var g=cv.getContext("2d");
 g.fillStyle="#ebe7d9";g.fillRect(0,0,cv.width,cv.height);
 function X0(x){return (x-8)*k;}function Y0(y){return (y-14)*k;}
 // centre gap groove
 g.fillStyle="#cdc7b1";g.fillRect(X0(36),Y0(172),528*k,10*k);g.fillStyle="rgba(0,0,0,.18)";g.fillRect(X0(36),Y0(172),528*k,1.5*k);
 g.fillStyle="#8a846e";g.font=(7*k)+"px sans-serif";g.textAlign="center";g.fillText("CENTRE GAP",X0(300),Y0(180));
 [["tp","#e53935",34],["tn","#1e63d6",48],["bp","#e53935",304],["bn","#1e63d6",318]].forEach(function(r){
  g.strokeStyle=r[1];g.globalAlpha=0.75;g.lineWidth=1.4*k;g.beginPath();g.moveTo(X0(36),Y0(r[2]-9));g.lineTo(X0(564),Y0(r[2]-9));g.stroke();g.globalAlpha=1;
  g.fillStyle=r[1];g.font="bold "+(11*k)+"px sans-serif";g.fillText(r[0][1]==="p"?"+":"−",X0(20),Y0(r[2]+4));});
 g.fillStyle="#8a846e";g.font=(8*k)+"px sans-serif";
 for(var c=1;c<=30;c++){if(c===1||c%5===0)g.fillText(String(c),X0(44+(c-1)*17.5),Y0(76));}
 var rows={a:86,b:103.5,c:121,d:138.5,e:156,f:196,g:213.5,h:231,i:248.5,j:266};
 Object.keys(rows).forEach(function(l){g.fillText(l,X0(28),Y0(rows[l]+3));});
 // hole sockets
 function sock(x,y){g.fillStyle="#c9c3ac";g.fillRect(X0(x-4.6),Y0(y-4.6),9.2*k,9.2*k);g.fillStyle="#9a9480";g.fillRect(X0(x-3.7),Y0(y-3.7),7.4*k,7.4*k);}
 var hs=[];["tp","tn","bp","bn"].forEach(function(r){for(var c=1;c<=30;c++){if(c%6===0)continue;hs.push(r+c);}});
 Object.keys(rows).forEach(function(l){for(var c=1;c<=30;c++)hs.push(l+c);});
 hs.forEach(function(h){var p=API.pos(h);sock(p[0],p[1]);});
 var tex=new THREE.CanvasTexture(cv);tex.encoding=THREE.sRGBEncoding;tex.anisotropy=8;
 var top=new THREE.Mesh(new THREE.PlaneGeometry(BW,BD),new THREE.MeshStandardMaterial({map:tex,roughness:0.6}));
 top.rotation.x=-Math.PI/2;top.position.set(Wx(300),0.005,Wz(175));top.receiveShadow=true;scene.add(top);
 // holes as instances
 var geo=new THREE.BoxGeometry(0.34,0.1,0.34),im=new THREE.InstancedMesh(geo,new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.9}),hs.length),m4=new THREE.Matrix4(),col=new THREE.Color();
 hs.forEach(function(h,i){var p=API.pos(h);m4.makeTranslation(Wx(p[0]),0.01,Wz(p[1]));im.setMatrixAt(i,m4);im.setColorAt(i,col.set(0x2a2a27));});
 scene.add(im);board.userData.holes=hs;board.userData.im=im;
})();
var holeIM=board.userData.im,holeNames=board.userData.holes;
function paintHoles(){
 var oc=API.occ(),pd=API.pending(),mt=API.meter(),c=new THREE.Color();
 holeNames.forEach(function(h,i){var col=0x2a2a27;
  if(mt&&mt.holes.indexOf(h)>=0)col=0x7c3aed;else if(pd&&pd.holes.indexOf(h)>=0)col=0xfbbf24;else if(oc[h]!==undefined)col=0x777777;
  holeIM.setColorAt(i,c.set(col));});
 holeIM.instanceColor.needsUpdate=true;
}
// ---------- parts ----------
var parts=new THREE.Group();scene.add(parts);
var metal=M(0xcfd3d8,0.25,0.9);
function seg(a,b,r,mat,grp){var d=new THREE.Vector3().subVectors(b,a),len=d.length();if(len<1e-4)return;var m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,8),mat);m.position.copy(a).addScaledVector(d,0.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());m.castShadow=true;grp.add(m);return m;}
function leg(pts,grp,r){for(var i=0;i<pts.length-1;i++)seg(pts[i],pts[i+1],r||0.11,metal,grp);}
function cyl(r,h,mat,grp,x,y,z){var m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,16),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;grp.add(m);return m;}
function boxm(w,h,d,mat,grp,x,y,z){var m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;grp.add(m);return m;}
function sprite(txt,size,col){var cv=document.createElement("canvas");cv.width=cv.height=128;var g=cv.getContext("2d");
 if(txt){g.font="90px sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText(txt,64,70);}
 else{var gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,col);gr.addColorStop(0.35,col.replace(")",",0.45)").replace("rgb","rgba"));gr.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=gr;g.fillRect(0,0,128,128);}
 var s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),transparent:true,depthWrite:false,blending:txt?THREE.NormalBlending:THREE.AdditiveBlending}));s.scale.set(size,size,1);return s;}
function toRGB(hex){var c=new THREE.Color(hex);return "rgb("+Math.round(c.r*255)+","+Math.round(c.g*255)+","+Math.round(c.b*255)+")";}
function tag(g,id){g.userData.cid=id;g.traverse(function(o){o.userData.cid=id;});}
var batTexCache={};
function batteryTex(v){if(batTexCache[v])return batTexCache[v];var cv=document.createElement("canvas");cv.width=256;cv.height=96;var g=cv.getContext("2d");
 g.fillStyle="#1f2937";g.fillRect(0,0,256,96);g.strokeStyle="#f59e0b";g.lineWidth=5;g.strokeRect(4,4,248,88);
 g.fillStyle="#fde68a";g.font="bold 46px sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText("+ "+v+"V −",128,50);
 var t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;return batTexCache[v]=t;}
function build(c,sim,sel){
 var g=new THREE.Group(),P=c.holes.map(V),o=(sim&&sim.comp[c.id])||{i:0,lit:0,burned:false},m=new THREE.Vector3(),ctr;
 P.forEach(function(p){m.add(p);});m.multiplyScalar(1/P.length);ctr=m.clone();
 var dir=P.length>1?new THREE.Vector3().subVectors(P[P.length-1],P[0]).setY(0):new THREE.Vector3(1,0,0);var dist=dir.length();if(dist<1e-4)dir.set(1,0,0);else dir.normalize();
 var up=new THREE.Vector3(0,1,0),H=1.15;
 if(c.type==="wire"){
  var lift=Math.min(4.2,dist*0.28+1.4),mid=ctr.clone();mid.y=lift*2;
  var cur=new THREE.QuadraticBezierCurve3(P[0].clone().setY(0.5),mid,P[1].clone().setY(0.5));
  var tube=new THREE.Mesh(new THREE.TubeGeometry(cur,28,0.2,8),M(WIRECOL[c.id%WIRECOL.length],0.5));tube.castShadow=true;g.add(tube);
  P.forEach(function(p){cyl(0.27,0.7,M(WIRECOL[c.id%WIRECOL.length],0.5),g,p.x,0.4,p.z);cyl(0.08,0.5,metal,g,p.x,0.1,p.z);});
 }else if(c.type==="battery"){
  var back=ctr.z>0?1:-1,bz=ctr.z+back*(Math.abs(ctr.z)<8?-1:1)*0; var boxZ=back>0?BD/2+Wz(175)+3.6:Wz(175)-BD/2-3.6;
  var bx=ctr.x,bp=new THREE.Vector3(bx,1.0,boxZ);
  var bm=new THREE.Mesh(new THREE.BoxGeometry(6.4,2.0,3.0),[M(0x1f2937),M(0x1f2937),M(0x1f2937),M(0x1f2937),new THREE.MeshStandardMaterial({map:batteryTex(c.value),roughness:0.5}),M(0x1f2937)]);
  bm.rotation.x=0;bm.position.copy(bp);bm.castShadow=true;g.add(bm);
  var tp=new THREE.Mesh(new THREE.PlaneGeometry(6.2,2.8),new THREE.MeshStandardMaterial({map:batteryTex(c.value),roughness:0.5}));tp.rotation.x=-Math.PI/2;tp.position.set(bx,2.02,boxZ);g.add(tp);
  cyl(0.35,0.5,M(0xcfd3d8,0.3,0.8),g,bx-1.8,2.2,boxZ);cyl(0.35,0.5,M(0xcfd3d8,0.3,0.8),g,bx+1.8,2.2,boxZ);
  [[P[0],-1.8,0xe53935],[P[1],1.8,0x222222]].forEach(function(q){
   var a=new THREE.Vector3(bx+q[1],2.2,boxZ),b=q[0].clone().setY(0.5),mid2=a.clone().lerp(b,0.5);mid2.y=5.5;
   var cur2=new THREE.QuadraticBezierCurve3(a,mid2,b);var t2=new THREE.Mesh(new THREE.TubeGeometry(cur2,28,0.2,8),M(q[2],0.5));t2.castShadow=true;g.add(t2);
   cyl(0.27,0.7,M(q[2],0.5),g,b.x,0.4,b.z);cyl(0.08,0.5,metal,g,b.x,0.1,b.z);});
  ctr.set(bx,1,boxZ);
 }else if(c.type==="resistor"){
  var sc2=Math.min(1,dist/4),Lb=Math.max(1.5,3.6*sc2),r0=0.52,hh=H*0.9,b3=X.bands(c.value);
  var bodyCol=o.burned?0x1a1a1a:0xd9c79c,bm2=M(bodyCol,0.7);
  var pA=P[0].clone().addScaledVector(dir,0),e0=ctr.clone().addScaledVector(dir,-Lb/2).setY(hh),e1=ctr.clone().addScaledVector(dir,Lb/2).setY(hh);
  leg([P[0].clone(),P[0].clone().setY(hh),e0],g);leg([P[1].clone(),P[1].clone().setY(hh),e1],g);
  var body=cyl(r0,Lb,bm2,g,ctr.x,hh,ctr.z);body.quaternion.setFromUnitVectors(up,dir);
  [[-1,0.5],[1,0.5]].forEach(function(s){var e=new THREE.Mesh(new THREE.SphereGeometry(r0*1.18,14,10),bm2);e.position.copy(ctr).addScaledVector(dir,s[0]*Lb/2).setY(hh);e.scale.set(1,1,1);e.castShadow=true;g.add(e);});
  if(!o.burned){var cols=[b3[0],b3[1],b3[2],"#c9a227"],offs=[-0.34,-0.18,-0.02,0.3];
   cols.forEach(function(cc,i){var bd=cyl(r0*1.04,Lb*0.075,M(new THREE.Color(cc),0.6),g,0,0,0);bd.position.copy(ctr).addScaledVector(dir,offs[i]*Lb).setY(hh);bd.quaternion.copy(body.quaternion);});}
  ctr.y=hh;
 }else if(c.type==="led"){
  var col=new THREE.Color(X.LEDS[c.color].col),lit=o.lit||0,burned=o.burned;
  var bx2=ctr.clone(),hb=1.1;
  var a0=bx2.clone().addScaledVector(dir,-0.38).setY(hb),a1=bx2.clone().addScaledVector(dir,0.38).setY(hb);
  leg([P[0].clone(),P[0].clone().setY(0.55),a0],g);leg([P[1].clone(),P[1].clone().setY(0.55),a1],g);
  var mat=new THREE.MeshStandardMaterial({color:burned?0x222222:col,roughness:0.15,transparent:true,opacity:burned?1:0.55+0.2*lit,emissive:burned?0x000000:col,emissiveIntensity:burned?0:lit*1.6});
  var cy2=new THREE.Mesh(new THREE.CylinderGeometry(0.85,0.85,1.3,20),mat);cy2.position.set(bx2.x,hb+0.65,bx2.z);cy2.castShadow=true;g.add(cy2);
  var dome=new THREE.Mesh(new THREE.SphereGeometry(0.85,20,12,0,Math.PI*2,0,Math.PI/2),mat);dome.position.set(bx2.x,hb+1.3,bx2.z);g.add(dome);
  var rim=new THREE.Mesh(new THREE.CylinderGeometry(1.0,1.0,0.18,20),mat);rim.position.set(bx2.x,hb+0.1,bx2.z);g.add(rim);
  if(lit>0&&!burned){var gl=sprite(null,3+lit*5,toRGB(col));gl.position.set(bx2.x,hb+1.1,bx2.z);gl.material.opacity=Math.min(1,0.25+lit*0.75);g.add(gl);}
  if(burned){var sm=sprite("💥",2.6);sm.position.set(bx2.x,hb+3.4,bx2.z);g.add(sm);}
  ctr.y=hb+0.6;
 }else if(c.type==="switch"){
  var hb2=0.85,a=ctr.clone().addScaledVector(dir,-1.0).setY(hb2),b=ctr.clone().addScaledVector(dir,1.0).setY(hb2);
  leg([P[0].clone(),P[0].clone().setY(hb2),a],g);leg([P[1].clone(),P[1].clone().setY(hb2),b],g);
  boxm(2.2,1.0,2.2,M(0x2b2b2b,0.6),g,ctr.x,hb2+0.2,ctr.z);
  cyl(0.7,c.closed?0.45:0.8,M(c.closed?0x34d399:0xd1d5db,0.4),g,ctr.x,hb2+0.7+(c.closed?0:0.1),ctr.z);
  ctr.y=1.2;
 }else if(c.type==="pot"){
  var e0p=P[0],e2p=P[2],cc=e0p.clone().add(e2p).multiplyScalar(0.5);
  P.forEach(function(p){leg([p.clone(),p.clone().setY(0.8)],g);});
  boxm(3.6,1.6,3.0,M(0x1d4ed8,0.5),g,cc.x,1.6,cc.z+0.0);
  var kb=cyl(0.95,0.9,M(0xe5e7eb,0.3,0.6),g,cc.x,2.8,cc.z);var an=(-135+270*c.pos)*Math.PI/180;
  var nt=boxm(0.18,0.2,0.9,M(0x111111),g,cc.x+Math.sin(an)*0.45,3.3,cc.z-Math.cos(an)*0.45);nt.rotation.y=-an;
  ctr.set(cc.x,2,cc.z);
 }else if(c.type==="ldr"){
  var hb3=1.15;leg([P[0].clone(),P[0].clone().setY(hb3),ctr.clone().addScaledVector(dir,-0.55).setY(hb3+0.2)],g);leg([P[1].clone(),P[1].clone().setY(hb3),ctr.clone().addScaledVector(dir,0.55).setY(hb3+0.2)],g);
  var d1=cyl(1.05,0.3,M(0xb8790a,0.45),g,ctr.x,hb3+0.35,ctr.z);
  var cv=document.createElement("canvas");cv.width=cv.height=128;var gx=cv.getContext("2d");gx.fillStyle="#caa24a";gx.fillRect(0,0,128,128);gx.strokeStyle="#5b3a00";gx.lineWidth=6;gx.beginPath();for(var yy=20;yy<=110;yy+=18){gx.moveTo(18,yy);gx.lineTo(110,yy);gx.lineTo(110,yy+9);gx.lineTo(18,yy+9);}gx.stroke();
  var face=new THREE.Mesh(new THREE.CircleGeometry(0.95,24),new THREE.MeshStandardMaterial({map:new THREE.CanvasTexture(cv),roughness:0.4}));face.rotation.x=-Math.PI/2;face.position.set(ctr.x,hb3+0.51,ctr.z);g.add(face);
  ctr.y=hb3+0.4;
 }else if(c.type==="ntc"){
  var hb4=1.2;leg([P[0].clone(),P[0].clone().setY(hb4),ctr.clone().addScaledVector(dir,-0.25).setY(hb4+0.5)],g);leg([P[1].clone(),P[1].clone().setY(hb4),ctr.clone().addScaledVector(dir,0.25).setY(hb4+0.5)],g);
  var bead=new THREE.Mesh(new THREE.SphereGeometry(0.65,16,12),M(0x1b3a6b,0.3));bead.position.set(ctr.x,hb4+0.95,ctr.z);bead.scale.y=1.15;bead.castShadow=true;g.add(bead);
  ctr.y=hb4+0.8;
 }else if(c.type==="npn"){
  var q=ctr.clone(),hb5=1.05;
  P.forEach(function(p,i){leg([p.clone(),p.clone().setY(0.6),new THREE.Vector3(q.x+(i-1)*0.5,hb5,q.z)],g);});
  var th=new THREE.Mesh(new THREE.CylinderGeometry(0.85,0.85,1.9,20,1,false,Math.PI*0.5,Math.PI),M(o.state&&o.state!=="off"?0x16301f:0x151515,0.45));
  th.position.set(q.x,hb5+0.95,q.z);th.castShadow=true;g.add(th);
  var fl=boxm(1.7,1.9,0.04,M(0x0f0f0f,0.45),g,q.x,hb5+0.95,q.z);
  var cvq=document.createElement("canvas");cvq.width=128;cvq.height=64;var gq=cvq.getContext("2d");gq.fillStyle="#ddd";gq.font="bold 26px sans-serif";gq.textAlign="center";gq.fillText("2N3904",64,40);
  var lb=new THREE.Mesh(new THREE.PlaneGeometry(1.5,0.75),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(cvq),transparent:true}));lb.position.set(q.x,hb5+1.0,q.z+0.03);g.add(lb);
  ctr.y=hb5+1;
 }
 if(sel){var ring=new THREE.Mesh(new THREE.TorusGeometry(c.type==="battery"?4.2:1.9,0.1,8,36),new THREE.MeshBasicMaterial({color:0xfbbf24}));ring.rotation.x=Math.PI/2;ring.position.set(ctr.x,0.25,ctr.z);g.add(ring);}
 tag(g,c.id);return g;
}
function refresh(){
 while(parts.children.length){var ch=parts.children[0];parts.remove(ch);ch.traverse(function(o){if(o.geometry)o.geometry.dispose();});}
 var sim=API.sim(),sel=API.sel();
 API.comps().forEach(function(c){try{parts.add(build(c,sim,sel===c.id));}catch(e){}});
 paintHoles();dirty=true;
}
// ---------- camera ----------
var cam={theta:0,phi:0.02,d:62,tx:Wx(300),tz:Wz(175)};
var PRESET={place:{theta:0,phi:0.02,d:66,tz:-3},look:{theta:0.3,phi:0.9,d:68,tz:-2}};
function place(){var sp=Math.sin(cam.phi);camera.position.set(cam.tx+cam.d*sp*Math.sin(cam.theta),cam.d*Math.cos(cam.phi),cam.tz+cam.d*sp*Math.cos(cam.theta));camera.lookAt(cam.tx,0,cam.tz);}
function setMode(m){mode=m;var p=PRESET[m];cam.theta=p.theta;cam.phi=p.phi;cam.d=p.d;cam.tx=Wx(300);cam.tz=Wz(175)+(p.tz||0);[].forEach.call($("bbViews").children,function(b){b.className=b.dataset.m===m?"on":"";});
 var flat=m==="flat";$("bb3d").style.display=flat?"none":"block";$("bbBoard").style.display=flat?"block":"none";dirty=true;}
function size(){var w=box.clientWidth;if(w&&Math.abs(w-lowBox)>1){lowBox=w;var h=Math.round(w/1.45);renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();dirty=true;}}
// ---------- picking ----------
var ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
function toNDC(e){place();camera.updateMatrixWorld(true);scene.updateMatrixWorld(true);var r=renderer.domElement.getBoundingClientRect();ndc.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(ndc,camera);}
var holeList=holeNames.map(function(h){var p=API.pos(h);return {h:h,x:Wx(p[0]),z:Wz(p[1])};});
function nearestHole(){var pt=new THREE.Vector3();if(!ray.ray.intersectPlane(plane,pt))return null;var best=null,bd=1e9;holeList.forEach(function(q){var d=Math.hypot(q.x-pt.x,q.z-pt.z);if(d<bd){bd=d;best=q;}});return bd<0.95?best.h:null;}
function tap(e){
 toNDC(e);var placing=API.pending()||API.meter();
 if(!placing){var hits=ray.intersectObjects(parts.children,true);for(var i=0;i<hits.length;i++){if(hits[i].object.userData.cid!==undefined){API.comp(hits[i].object.userData.cid);return;}}}
 var h=nearestHole();
 if(h)API.hole(h);else if(!placing&&API.sel()!==null)API.comp(API.sel());
}
// ---------- gestures ----------
var el=renderer.domElement,ptrs={},moved=0,t0=0,pinch0=0,d0=0;
el.addEventListener("pointerdown",function(e){try{el.setPointerCapture(e.pointerId);}catch(_e){}ptrs[e.pointerId]={x:e.clientX,y:e.clientY};moved=0;t0=Date.now();var ks=Object.keys(ptrs);if(ks.length===2){var a=ptrs[ks[0]],b=ptrs[ks[1]];pinch0=Math.hypot(a.x-b.x,a.y-b.y);d0=cam.d;}});
el.addEventListener("pointermove",function(e){var p=ptrs[e.pointerId];if(!p)return;var dx=e.clientX-p.x,dy=e.clientY-p.y,ks=Object.keys(ptrs);
 if(ks.length===2){p.x=e.clientX;p.y=e.clientY;var a=ptrs[ks[0]],b=ptrs[ks[1]],dd=Math.hypot(a.x-b.x,a.y-b.y);if(pinch0>0){cam.d=Math.max(16,Math.min(100,d0*pinch0/dd));dirty=true;}moved=99;return;}
 moved+=Math.abs(dx)+Math.abs(dy);p.x=e.clientX;p.y=e.clientY;
 if(moved<7)return;
 var wpp=2*cam.d*Math.tan(20*Math.PI/180)/el.clientHeight;
 if(mode==="place"){cam.tx-=dx*wpp;cam.tz-=dy*wpp;cam.tx=Math.max(-40,Math.min(40,cam.tx));cam.tz=Math.max(-30,Math.min(30,cam.tz));}
 else{cam.theta-=dx*0.008;cam.phi=Math.max(0.12,Math.min(1.4,cam.phi-dy*0.006));}
 dirty=true;});
function up(e){var p=ptrs[e.pointerId];if(p&&Object.keys(ptrs).length===1&&moved<7&&Date.now()-t0<600)tap(e);delete ptrs[e.pointerId];}
el.addEventListener("pointerup",up);el.addEventListener("pointercancel",function(e){delete ptrs[e.pointerId];});
el.addEventListener("wheel",function(e){cam.d=Math.max(16,Math.min(100,cam.d+e.deltaY*0.05));dirty=true;e.preventDefault();},{passive:false});
// ---------- loop ----------
function loop(){
 if(box.offsetParent!==null&&box.style.display!=="none"){size();if(dirty){place();renderer.render(scene,camera);dirty=false;}}
 requestAnimationFrame(loop);
}
[].forEach.call($("bbViews").children,function(b){b.onclick=function(){setMode(b.dataset.m);};});
API.attach({refresh:refresh});
var hm=(location.hash.match(/bm=(\w+)/)||[])[1];setMode(hm||"place");loop();
window.BB3={hits:function(x,y){toNDC({clientX:x,clientY:y});return ray.intersectObjects(parts.children,true).map(function(h){return h.object.userData.cid+":"+h.object.geometry.type;});},screenOf:function(h){place();camera.updateMatrixWorld();var q=V(h).project(camera),r=el.getBoundingClientRect();return {x:r.left+(q.x+1)/2*r.width,y:r.top+(1-q.y)/2*r.height};},refresh:refresh,setMode:setMode,cam:cam,dirty:function(){dirty=true;}};
})();
