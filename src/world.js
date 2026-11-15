// World: realistic procedural plants, soil, grass, trees and sky for the 3D lab.
var World=(function(){
"use strict";
var T=(typeof THREE!=="undefined")?THREE:null,scene=null,dome=null,detail=1,plants=[],sunDir=null,skyU=null;
var cache={};
function rng(s){return function(){s|=0;s=s+0x6D2B79F5|0;var t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function cv(w,h){var c=document.createElement("canvas");c.width=w;c.height=h;return c;}
function ctex(c,rep){var t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.anisotropy=4;if(rep)t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
function lerp(a,b,t){return a+(b-a)*t;}

// ---------- geometry builder ----------
function Bld(){this.p=[];this.u=[];this.c=[];this.i=[];}
Bld.prototype.v=function(x,y,z,u,v,col){this.p.push(x,y,z);this.u.push(u,v);this.c.push(Math.pow(col[0],2.2),Math.pow(col[1],2.2),Math.pow(col[2],2.2));return this.p.length/3-1;};
Bld.prototype.geo=function(){var g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(this.p,3));g.setAttribute("uv",new T.Float32BufferAttribute(this.u,2));g.setAttribute("color",new T.Float32BufferAttribute(this.c,3));g.setIndex(this.i);g.computeVertexNormals();return g;};
// tube along points with radii
Bld.prototype.tube=function(pts,rad,sides,c0,c1){
 var n=pts.length,self=this,base=this.p.length/3;
 for(var k=0;k<n;k++){
  var a=pts[Math.max(0,k-1)],b=pts[Math.min(n-1,k+1)],tx=b[0]-a[0],ty=b[1]-a[1],tz=b[2]-a[2],tl=Math.hypot(tx,ty,tz)||1;tx/=tl;ty/=tl;tz/=tl;
  var ux=0,uy=0,uz=1;if(Math.abs(tz)>0.9){ux=1;uz=0;}
  var sx=ty*uz-tz*uy,sy=tz*ux-tx*uz,sz=tx*uy-ty*ux,sl=Math.hypot(sx,sy,sz)||1;sx/=sl;sy/=sl;sz/=sl;
  var qx=ty*sz-tz*sy,qy=tz*sx-tx*sz,qz=tx*sy-ty*sx,f=k/(n-1),col=[lerp(c0[0],c1[0],f),lerp(c0[1],c1[1],f),lerp(c0[2],c1[2],f)];
  for(var s=0;s<=sides;s++){var an=s/sides*Math.PI*2,cs=Math.cos(an)*rad[k],sn=Math.sin(an)*rad[k];self.v(pts[k][0]+sx*cs+qx*sn,pts[k][1]+sy*cs+qy*sn,pts[k][2]+sz*cs+qz*sn,s/sides,f,col);}
 }
 for(var k2=0;k2<n-1;k2++)for(var s2=0;s2<sides;s2++){var a0=base+k2*(sides+1)+s2,b0=a0+1,a1=a0+sides+1,b1=a1+1;this.i.push(a0,a1,b0,b0,a1,b1);}
};
// arched ribbon leaf
Bld.prototype.leaf=function(o){
 var segs=o.segs,base=this.p.length/3,ca=Math.cos(o.az),sa=Math.sin(o.az),px=-sa,pz=ca,r=o.r||Math.random;
 for(var k=0;k<=segs;k++){
  var t=k/segs,d=o.len*t*Math.cos(o.rise*(1-0.5*t)),h=o.len*(Math.sin(o.rise)*t-o.droop*t*t);
  var w=o.width*o.prof(t),fold=w*o.fold,wob=o.wave*w*Math.sin(t*o.freq+o.ph);
  var cx=o.x+ca*d,cy=o.y+h,cz=o.z+sa*d;
  var cl=[lerp(o.c0[0],o.c1[0],t),lerp(o.c0[1],o.c1[1],t),lerp(o.c0[2],o.c1[2],t)],cm=[cl[0]*1.18,cl[1]*1.18,cl[2]*1.12];
  this.v(cx-px*w+0,cy+fold+wob,cz-pz*w,0,t,cl);
  this.v(cx,cy,cz,0.5,t,cm);
  this.v(cx+px*w,cy+fold-wob,cz+pz*w,1,t,cl);
 }
 for(var k2=0;k2<segs;k2++){var a=base+k2*3,b=a+3;this.i.push(a,b,a+1,a+1,b,b+1,a+1,b+1,a+2,a+2,b+1,b+2);}
};

// ---------- textures ----------
function soilCanvas(w,h,x0,y0,pw,ph,mode,seed,ctx){
 var r=rng(seed),g=ctx,dry=mode==="dry",wet=mode==="wet";
 var base=dry?[176,140,98]:wet?[78,54,36]:[124,92,60];
 g.fillStyle="rgb("+base+")";g.fillRect(x0,y0,pw,ph);
 g.save();g.beginPath();g.rect(x0,y0,pw,ph);g.clip();
 var area=pw*ph/(256*256),nb=Math.round(70*area+6);
 for(var i=0;i<nb;i++){var cx=x0+r()*pw,cy=y0+r()*ph,rr=(18+r()*70)*Math.sqrt(Math.max(.4,area));var gr=g.createRadialGradient(cx,cy,0,cx,cy,rr),lt=r()<.5;
  gr.addColorStop(0,lt?"rgba(255,235,200,.13)":"rgba(20,10,0,.16)");gr.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=gr;g.fillRect(cx-rr,cy-rr,rr*2,rr*2);}
 var pal=dry?["#a98258","#c0996b","#9a7550","#b88f60"]:wet?["#4a321f","#5a3e29","#3d2818","#684a33"]:["#6d4f32","#8a6845","#74553a","#5f432b"];
 var ns=Math.round(9000*area);for(var j=0;j<ns;j++){g.fillStyle=pal[j%4];var s=0.6+r()*2.6;g.fillRect(x0+r()*pw,y0+r()*ph,s,s*(0.6+r()*0.8));}
 var np=Math.round(55*area);for(var k=0;k<np;k++){var px=x0+r()*pw,py=y0+r()*ph,sz=1.2+r()*3.6;g.fillStyle="rgba(0,0,0,.22)";g.beginPath();g.ellipse(px+.8,py+.9,sz,sz*.7,0,0,7);g.fill();g.fillStyle=dry?"#c2a67c":wet?"#6a5644":"#8a7660";g.beginPath();g.ellipse(px,py,sz,sz*.72,r()*3,0,7);g.fill();}
 if(dry){g.strokeStyle="rgba(60,38,20,.6)";g.lineWidth=1.6;for(var c=0;c<Math.round(26*area);c++){var qx=x0+r()*pw,qy=y0+r()*ph;g.beginPath();g.moveTo(qx,qy);for(var m=0;m<5;m++){qx+=(r()-.5)*46;qy+=(r()-.5)*46;g.lineTo(qx,qy);}g.stroke();}}
 g.restore();
}
function soilTile(mode,seed){var k="soil"+mode;if(cache[k])return cache[k];var c=cv(256,256);soilCanvas(256,256,0,0,256,256,mode,seed,c.getContext("2d"));var t=ctex(c,true);cache[k]=t;return t;}
function leafTex(kind){var k="leaf"+kind;if(cache[k])return cache[k];var c=cv(64,128),g=c.getContext("2d"),r=rng(kind==="maize"?3:9);
 g.fillStyle="#fff";g.fillRect(0,0,64,128);
 if(kind==="maize"){g.strokeStyle="rgba(40,70,20,.28)";g.lineWidth=1;for(var i=2;i<64;i+=4){g.beginPath();g.moveTo(i,0);g.lineTo(i+(i<32?1:-1)*3,128);g.stroke();}
  g.strokeStyle="rgba(255,255,255,.7)";g.lineWidth=3;g.beginPath();g.moveTo(32,0);g.lineTo(32,128);g.stroke();}
 else{g.strokeStyle="rgba(255,255,255,.75)";g.lineWidth=3;g.beginPath();g.moveTo(32,0);g.lineTo(32,128);g.stroke();g.lineWidth=1.5;g.strokeStyle="rgba(240,255,230,.55)";
  for(var j=6;j<128;j+=9){g.beginPath();g.moveTo(32,j);g.lineTo(2,j+16);g.moveTo(32,j);g.lineTo(62,j+16);g.stroke();}}
 for(var n=0;n<500;n++){g.fillStyle="rgba(0,0,0,"+(r()*.06)+")";g.fillRect(r()*64,r()*128,2,2);}
 var t=ctex(c,false);cache[k]=t;return t;}
function grassTex(){if(cache.grass)return cache.grass;var c=cv(512,512),g=c.getContext("2d"),r=rng(21);
 g.fillStyle="#6a8f3c";g.fillRect(0,0,512,512);
 for(var i=0;i<60;i++){var cx=r()*512,cy=r()*512,rr=30+r()*90,gr=g.createRadialGradient(cx,cy,0,cx,cy,rr),pk=r();
  gr.addColorStop(0,pk<.3?"rgba(160,150,70,.28)":pk<.6?"rgba(40,90,30,.25)":"rgba(120,170,70,.2)");gr.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=gr;g.fillRect(cx-rr,cy-rr,rr*2,rr*2);}
 var cols=["#5a7f2f","#7aa545","#8db84f","#4d7029","#98b556","#6f9b3b"];
 for(var j=0;j<9000;j++){var x=r()*512,y=r()*512,l=3+r()*7,a=-Math.PI/2+(r()-.5)*1.2;g.strokeStyle=cols[j%6];g.lineWidth=.8+r()*.8;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke();}
 var t=ctex(c,true);t.repeat.set(26,26);cache.grass=t;return t;}
function leafyTex(){if(cache.leafy)return cache.leafy;var c=cv(256,256),g=c.getContext("2d"),r=rng(5);g.fillStyle="#5d8a30";g.fillRect(0,0,256,256);
 var cols=["#4a7a28","#6b9a3a","#3f6c22","#7aa545","#557f2d"];for(var i=0;i<2600;i++){g.fillStyle=cols[i%5];g.beginPath();g.ellipse(r()*256,r()*256,2+r()*3,1+r()*1.5,r()*3,0,7);g.fill();}
 var t=ctex(c,true);cache.leafy=t;return t;}
function tuftTex(){if(cache.tuft)return cache.tuft;var c=cv(64,64),g=c.getContext("2d"),a=cv(64,64),ga=a.getContext("2d"),r=rng(8);
 var gr=g.createLinearGradient(0,64,0,0);gr.addColorStop(0,"#5d8d34");gr.addColorStop(1,"#b2d466");g.fillStyle=gr;g.fillRect(0,0,64,64);
 for(var n=0;n<120;n++){g.fillStyle="rgba("+(r()<.5?"255,255,200":"20,50,10")+",.12)";g.fillRect(r()*64,r()*64,2,6);}
 ga.fillStyle="#000";ga.fillRect(0,0,64,64);ga.fillStyle="#fff";
 for(var i=0;i<16;i++){var x=8+r()*48,h=24+r()*36,lean=(r()-.5)*22;ga.beginPath();ga.moveTo(x-2.2,64);ga.quadraticCurveTo(x+lean*.2,64-h*.55,x+lean,64-h);ga.quadraticCurveTo(x+lean*.2+1,64-h*.5,x+2.2,64);ga.fill();}
 var t=ctex(c,false),ta=new T.CanvasTexture(a);cache.tuft=t;cache.tuftA=ta;return t;}
// ---------- plants ----------
var GREEN={stem:[.45,.62,.25],lb:[.16,.34,.09],lt:[.40,.60,.20]},WILT={lb:[.45,.38,.14],lt:[.66,.55,.26]};
function mixc(a,b,t){return[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];}
function maizeGeo(seed,wilt){
 var r=rng(seed),b=new Bld(),segs=detail?7:3,H=(15+r()*3)*(1-0.34*wilt),lean=wilt*(.6+r()*.5),az0=r()*6.28;
 var pts=[],rad=[],N=detail?6:3;for(var k=0;k<=N;k++){var f=k/N;pts.push([Math.sin(f*lean)*H*.3*f,H*f,Math.cos(az0)*f*f*lean*2]);rad.push(lerp(.62,.28,f));}
 b.tube(pts,rad,detail?7:4,mixc(GREEN.stem,[.6,.5,.25],wilt*.7),mixc([.55,.72,.32],[.7,.6,.3],wilt*.7));
 var nl=detail?10:6;
 for(var i=0;i<nl;i++){
  var f=i/(nl-1),y=H*(.1+.78*f),pi=Math.min(N,Math.floor(f*N*.9)),lx=pts[pi][0],lz=pts[pi][2];
  var len=(7.5+Math.sin(f*Math.PI)*5+r()*1.5)*(1-.25*wilt),az=az0+i*Math.PI+(r()-.5)*.7;
  b.leaf({x:lx,y:y,z:lz,az:az,len:len,width:1.35+r()*.3,rise:lerp(1.05,.55,f)-wilt*.35,droop:.9+wilt*1.5+f*.2,segs:segs,fold:.28-wilt*.12,wave:.12+wilt*.1,freq:15,ph:r()*6,
   prof:function(t){return Math.pow(Math.sin(Math.PI*Math.min(1,.1+t*.9)),.55)*(1-.15*t);},
   c0:mixc(GREEN.lb,WILT.lb,wilt),c1:mixc(GREEN.lt,WILT.lt,wilt),r:r});
 }
 var ca=r()*6.28,cy=H*.55,cc=[Math.cos(ca),Math.sin(ca)],cp=pts[Math.floor(N*.55)];
 b.tube([[cp[0],cy,cp[2]],[cp[0]+cc[0]*1.5,cy+1.1,cp[2]+cc[1]*1.5],[cp[0]+cc[0]*2.1,cy+3.4,cp[2]+cc[1]*2.1],[cp[0]+cc[0]*2.1,cy+5,cp[2]+cc[1]*2.1]],[.85,1.1,.9,.25],detail?7:4,mixc([.5,.7,.3],[.7,.62,.34],wilt),mixc([.62,.78,.36],[.75,.68,.4],wilt));
 if(detail){b.tube([[cp[0]+cc[0]*2.1,cy+4.8,cp[2]+cc[1]*2.1],[cp[0]+cc[0]*2.3,cy+6.2,cp[2]+cc[1]*2.3]],[.2,.08],3,[.8,.65,.4],[.7,.45,.25]);}
 var tp=pts[N];for(var s=0;s<(detail?7:3);s++){var an=s/7*6.28+r();b.tube([[tp[0],H*.98,tp[2]],[tp[0]+Math.cos(an)*1.4,H+1.5,tp[2]+Math.sin(an)*1.4],[tp[0]+Math.cos(an)*3,H+1.5-wilt*1.5,tp[2]+Math.sin(an)*3]],[.16,.12,.05],3,[.85,.8,.45],[.9,.85,.55]);}
 return b.geo();
}
function kaleGeo(seed,wilt){
 var r=rng(seed),b=new Bld(),segs=detail?6:3,H=3.6*(1-.2*wilt);
 b.tube([[0,0,0],[0,H*.5,0],[0,H,0]],[.9,.8,.7],detail?7:4,[.4,.55,.3],[.45,.6,.32]);
 var nl=detail?14:8;
 for(var i=0;i<nl;i++){var f=i/(nl-1),az=i*2.399+r()*.3,len=(5.2+r()*1.4)*(1.1-.35*f)*(1-.2*wilt);
  b.leaf({x:0,y:H*(.4+.6*f),z:0,az:az,len:len,width:2.3+r()*.5,rise:lerp(.5,1.35,f)-wilt*.6,droop:.55+wilt*1.3-f*.2,segs:segs,fold:.6-wilt*.25,wave:.22+wilt*.1,freq:22,ph:r()*6,
   prof:function(t){return t<.12?.12+t*.5:Math.pow(Math.sin(Math.PI*(.12+(t-.12)/.88*.88)),.7);},
   c0:mixc([.12,.28,.18],WILT.lb,wilt),c1:mixc([.22,.45,.26],WILT.lt,wilt),r:r});}
 return b.geo();
}
function plantGeos(kind){var k="pg"+kind+detail;if(cache[k])return cache[k];var a={ok:[],wilt:[]};for(var i=0;i<4;i++){var f=kind==="kale"?kaleGeo:maizeGeo;a.ok.push(f(100+i*13,0));a.wilt.push(f(100+i*13,1));}cache[k]=a;return a;}
function plantMat(kind){var m=new T.MeshStandardMaterial({map:leafTex(kind==="kale"?"kale":"maize"),vertexColors:true,side:T.DoubleSide,roughness:.72,metalness:0});return m;}

function buildPlot(parent,p,idx,dryNow){
 var kind=idx%2===1?"kale":"maize",geos=plantGeos(kind),mat=plantMat(kind),arr=[];
 var rows=4,step=kind==="kale"?9.5:8.3,cols=Math.max(2,Math.floor(p.w/step));
 var ridgeMat=new T.MeshStandardMaterial({map:soilTile("field",7),roughness:1,color:0xffffff});
 for(var r=0;r<rows;r++){
  var pz=p.y+9+r*(p.h-18)/3,len=p.w-4;
  var rg=ridge(len,idx*10+r);rg.position.set(p.x+p.w/2,0.04,pz);rg.receiveShadow=true;rg.castShadow=false;rg.material=ridgeMat;parent.add(rg);
  for(var k=0;k<cols;k++){
   var px=p.x+7+k*step+(Math.random()-.5)*1.2,g=new T.Group();g.position.set(px,1.7,pz+(Math.random()-.5)*1.2);g.rotation.y=Math.random()*6.28;parent.add(g);
   var vi=(r*cols+k)%4,m=new T.Mesh(geos.ok[vi],mat);m.castShadow=true;m.receiveShadow=true;g.add(m);
   var o={g:g,m:m,vi:vi,ph:Math.random()*6.28,amp:.012+Math.random()*.01};arr.push(o);plants.push(o);
  }
 }
 arr.geos=geos;arr.mat=mat;arr.ridgeMat=ridgeMat;
 setPlotState(arr,dryNow);return arr;
}
function ridge(len,seed){
 var geo=new T.PlaneGeometry(len,9,Math.max(8,Math.round(len/2.4)),8);geo.rotateX(-Math.PI/2);var ps=geo.attributes.position,uv=geo.attributes.uv,r=rng(seed+1);
 for(var i=0;i<ps.count;i++){var x=ps.getX(i),z=ps.getZ(i),a=z/4.5,pr=Math.max(0,1-a*a);ps.setY(i,2.1*Math.pow(pr,.85)+(Math.sin(x*.7+seed)*.18+Math.sin(x*1.9+z)*.1)*pr+(r()-.5)*.08*pr);uv.setXY(i,x/22,z/22);}
 geo.computeVertexNormals();return new T.Mesh(geo,new T.MeshBasicMaterial());
}
function setPlotState(arr,dryNow){
 if(!arr)return;var mat=arr.mat,geos=arr.geos;
 mat.color.setHex(dryNow?0xffffff:0xffffff);
 arr.ridgeMat.color.setHex(dryNow?0xe6c79a:0x9a7a5e);
 arr.ridgeMat.roughness=dryNow?1:.82;
 arr.forEach(function(o){o.m.geometry=dryNow?geos.wilt[o.vi]:geos.ok[o.vi];o.m.scale.y=1;o.wilt=dryNow;});
}

// ---------- ground helpers used by floor texture ----------
function paintSoil(g,x,y,w,h,mode,seed){soilCanvas(0,0,x,y,w,h,mode,seed||1,g);}

// ---------- trees ----------
function blob(rx,ry,rz,seed,det){var geo=new T.IcosahedronGeometry(1,det),ps=geo.attributes.position,r=rng(seed);var cache2={};
 for(var i=0;i<ps.count;i++){var x=ps.getX(i),y=ps.getY(i),z=ps.getZ(i),key=x.toFixed(3)+y.toFixed(3)+z.toFixed(3);if(!(key in cache2))cache2[key]=.82+r()*.34;var f=cache2[key];ps.setXYZ(i,x*rx*f,y*ry*f,z*rz*f);}
 geo.computeVertexNormals();return geo;}
function tree(parent,x,z,s,variant){
 var g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(s);g.rotation.y=Math.random()*6.28;parent.add(g);
 var b=new Bld(),bark=[.28,.2,.13],bark2=[.36,.27,.18],r=rng(Math.floor(x*7+z*3)+1);
 var leafy=new T.MeshStandardMaterial({map:leafyTex(),roughness:.9,color:0xffffff});leafy.map.repeat.set(2,2);
 if(variant%2===0){ // acacia umbrella
  var lean=(r()-.5)*5;b.tube([[0,0,0],[lean*.4,12,0],[lean,24,1]],[3,2.3,1.9],8,bark,bark2);
  for(var k=0;k<3;k++){var an=k*2.1+r(),sx=lean,sy=22;b.tube([[sx,sy,1],[sx+Math.cos(an)*9,sy+7,Math.sin(an)*9],[sx+Math.cos(an)*19,sy+11,Math.sin(an)*19]],[1.5,1,.6],6,bark2,bark2);}
  var tm=new T.Mesh(b.geo(),new T.MeshStandardMaterial({vertexColors:true,roughness:1}));tm.castShadow=true;g.add(tm);
  var cx=[[lean,38,0,28,6.5,26],[lean+16,36,14,20,5,18],[lean-14,35,-12,22,5,18],[lean+4,36,-18,17,4.5,15],[lean-10,34,16,18,4.5,15]];
  cx.forEach(function(c,i){var m=new T.Mesh(blob(c[3],c[4],c[5],i+Math.floor(x),detail?2:1),leafy);m.position.set(c[0],c[1],c[2]);m.castShadow=true;m.receiveShadow=true;g.add(m);});
 }else{ // round shade tree
  b.tube([[0,0,0],[1,10,0],[0,20,1]],[3.4,2.6,2.2],8,bark,bark2);
  for(var q=0;q<3;q++){var a2=q*2.1+r();b.tube([[0,17,0],[Math.cos(a2)*7,25,Math.sin(a2)*7],[Math.cos(a2)*12,31,Math.sin(a2)*12]],[1.4,1,.7],6,bark2,bark2);}
  var tm2=new T.Mesh(b.geo(),new T.MeshStandardMaterial({vertexColors:true,roughness:1}));tm2.castShadow=true;g.add(tm2);
  [[0,36,0,17,14,17],[11,33,8,12,10,12],[-11,32,-7,13,10,13],[3,30,-13,11,9,11],[-6,31,12,12,9,12]].forEach(function(c,i){var m=new T.Mesh(blob(c[3],c[4],c[5],i+5+Math.floor(z),detail?2:1),leafy);m.position.set(c[0],c[1],c[2]);m.castShadow=true;m.receiveShadow=true;g.add(m);});
 }
 return g;
}

// ---------- grass tufts ----------
function tufts(parent,W,H,count){
 if(!detail)return null;
 var pl=new T.PlaneGeometry(7,6);pl.translate(0,3,0);var p2=pl.clone();p2.rotateY(Math.PI/2);
 var g=new T.BufferGeometry(),pa=pl.attributes.position,pb=p2.attributes.position,pos=[],uv=[],idx=[];
 [pl,p2].forEach(function(q,qi){var o=pos.length/3,a=q.attributes;for(var i=0;i<a.position.count;i++){pos.push(a.position.getX(i),a.position.getY(i),a.position.getZ(i));uv.push(a.uv.getX(i),a.uv.getY(i));}for(var j=0;j<q.index.count;j++)idx.push(q.index.getX(j)+o);});
 g.setAttribute("position",new T.Float32BufferAttribute(pos,3));g.setAttribute("uv",new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();var nn=g.attributes.normal;for(var q2=0;q2<nn.count;q2++)nn.setXYZ(q2,0,1,0);
 var m=new T.MeshStandardMaterial({map:tuftTex(),alphaMap:cache.tuftA,alphaTest:.45,side:T.DoubleSide,roughness:1}),im=new T.InstancedMesh(g,m,count),d=new T.Object3D(),col=new T.Color(),r=rng(77),n=0;
 while(n<count){var x=-170+r()*(W+340),z=-150+r()*(H+300);if(x>-14&&x<W+14&&z>-14&&z<H+14)continue;var s=.7+r()*1.1;d.position.set(x,0,z);d.rotation.set(0,r()*6.28,0);d.scale.set(s,s*(.8+r()*.8),s);d.updateMatrix();im.setMatrixAt(n,d.matrix);col.setHSL(.22+r()*.08,.25+r()*.3,.62+r()*.3);im.setColorAt(n,col);n++;}
 im.receiveShadow=false;im.castShadow=false;parent.add(im);return im;
}

// ---------- sky ----------
var SKYV="varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}";
var SKYF="varying vec3 vD;uniform vec3 sunDir;uniform float t;uniform float cl;uniform vec3 hor;"+
"float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}"+
"float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}"+
"float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*n(p);p*=2.02;a*=.5;}return s;}"+
"void main(){vec3 d=normalize(vD);float y=max(d.y,0.);vec3 zen=vec3(.2,.44,.8);vec3 col=mix(hor,zen,pow(y,.5));"+
"float s=max(dot(d,normalize(sunDir)),0.);col+=vec3(1.,.82,.55)*(pow(s,700.)*2.2+pow(s,10.)*.16);"+
"if(cl>.5){vec2 uv=d.xz/(d.y+.14)*1.1+vec2(t*.004,0.);float c=smoothstep(.46,.78,fbm(uv*1.4));c*=smoothstep(0.,.16,d.y);"+
"vec3 cc=mix(vec3(1.),vec3(.66,.72,.82),smoothstep(.45,.95,fbm(uv*2.8+4.)));col=mix(col,cc,c*.88);}"+
"if(d.y<0.)col=hor;gl_FragColor=vec4(col,1.);}";
function initSky(){
 skyU={sunDir:{value:sunDir.clone()},t:{value:0},cl:{value:detail?1:0},hor:{value:new T.Color(0xcfe3ee)}};
 dome=new T.Mesh(new T.SphereGeometry(1400,24,16),new T.ShaderMaterial({uniforms:skyU,vertexShader:SKYV,fragmentShader:SKYF,side:T.BackSide,depthWrite:false,fog:false}));
 dome.renderOrder=-10;dome.frustumCulled=false;scene.add(dome);
}

// ---------- public API ----------
function init(three,sc,sun,target){
 T=three;scene=sc;sunDir=new T.Vector3(.38,.6,-.5).normalize();
 sun.position.copy(target).addScaledVector(sunDir,320);initSky();
}
function setDetail(q){var d=q==="high"?1:0;if(d!==detail){detail=d;Object.keys(cache).forEach(function(k){if(k.indexOf("pg")===0)delete cache[k];});plants.length=0;}if(skyU)skyU.cl.value=detail;}
function setNight(on,fogHex){if(dome)dome.visible=!on;if(skyU&&fogHex!==undefined)skyU.hor.value.setHex(fogHex);}
function update(camera,t){
 if(dome){dome.position.copy(camera.position);skyU.t.value=t/1000;}
 if(!detail)return;var s=t/1000;
 for(var i=0;i<plants.length;i++){var o=plants[i];if(!o.g.parent){continue;}var w=Math.sin(s*1.3+o.ph)*o.amp+Math.sin(s*.45+o.g.position.x*.05)*.008;o.m.rotation.z=o.wilt?w*.4:w;o.m.rotation.x=o.wilt?0:w*.6;}
}
function resetPlants(){plants.length=0;}
return {init:init,setDetail:setDetail,setNight:setNight,update:update,buildPlot:buildPlot,setPlotState:setPlotState,tree:tree,tufts:tufts,grassTex:grassTex,paintSoil:paintSoil,resetPlants:resetPlants,soilTile:soilTile};
})();
