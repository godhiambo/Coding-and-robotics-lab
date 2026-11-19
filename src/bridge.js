// Bridge Lab: a real 2-D pin-jointed truss solver (direct stiffness / finite-element method).
// Units: metres and kilonewtons. Members carry axial force only, so forces come from equilibrium and elasticity,
// not from a game rule. Compression members can buckle (Euler), tension members can yield.
(function(root){
"use strict";
var G=9.81;
var MAT={wood:{name:"Pine wood 40×40 mm",E:10e6,sy:40e3,rho:600,A:1.6e-3,I:0.04*0.04*0.04*0.04/12,col:"#c28a4a"},
 steel:{name:"Steel tube 40 mm",E:200e6,sy:250e3,rho:7850,A:4.44e-4,I:(Math.pow(0.04,4)-Math.pow(0.034,4))/12,col:"#9fb3c8"}};
// E in kPa (kN/m2), sy in kPa, so E*A is in kN.
function capacity(m,L){var M=MAT[m],t=M.sy*M.A,eul=Math.PI*Math.PI*M.E*M.I/(L*L);return {t:t,c:Math.min(t,eul),buck:eul<t};}
function solve(nodes,mem,sup,loads,opt){
 // nodes:[{x,y}], mem:[{a,b,m}], sup:{pin:i,roller:j}, loads:{i:kN downward}
 var use={};mem.forEach(function(e){use[e.a]=1;use[e.b]=1;});
 var ids=Object.keys(use).map(Number).sort(function(a,b){return a-b;}),ix={};ids.forEach(function(n,k){ix[n]=k;});
 var n=ids.length,N=2*n;if(!n)return {err:"Add some members first."};
 if(!use[sup.pin]||!use[sup.roller])return {err:"Both supports must be connected to the bridge."};
 var K=[],F=[],i,j;for(i=0;i<N;i++){K.push(new Array(N).fill(0));F.push(0);}
 var info=mem.map(function(e){var A=nodes[e.a],B=nodes[e.b],dx=B.x-A.x,dy=B.y-A.y,L=Math.sqrt(dx*dx+dy*dy),M=MAT[e.m],c=dx/L,s=dy/L,k=M.E*M.A/L;
  var d=[2*ix[e.a],2*ix[e.a]+1,2*ix[e.b],2*ix[e.b]+1],v=[-c,-s,c,s];
  for(i=0;i<4;i++)for(j=0;j<4;j++)K[d[i]][d[j]]+=k*v[i]*v[j];
  var w=M.rho*M.A*L*G/1000;F[2*ix[e.a]+1]-=w/2;F[2*ix[e.b]+1]-=w/2; // self-weight, kN
  return {e:e,L:L,c:c,s:s,k:k,d:d,w:w,cap:capacity(e.m,L),mass:M.rho*M.A*L};});
 Object.keys(loads||{}).forEach(function(k){if(ix[k]!==undefined)F[2*ix[k]+1]-=loads[k];});
 var fixed={};fixed[2*ix[sup.pin]]=1;fixed[2*ix[sup.pin]+1]=1;fixed[2*ix[sup.roller]+1]=1;
 var free=[];for(i=0;i<N;i++)if(!fixed[i])free.push(i);
 var m=free.length,A=[],b=[],mx=0;for(i=0;i<N;i++)mx=Math.max(mx,K[i][i]);
 for(i=0;i<m;i++){A.push(free.map(function(q){return K[free[i]][q];}));b.push(F[free[i]]);}
 // Gaussian elimination with partial pivoting
 for(var c=0;c<m;c++){var p=c;for(i=c+1;i<m;i++)if(Math.abs(A[i][c])>Math.abs(A[p][c]))p=i;
  if(Math.abs(A[p][c])<1e-9*mx)return {err:"The bridge is unstable: it would fold like a mechanism. Add triangles so every joint is locked."};
  var t=A[c];A[c]=A[p];A[p]=t;t=b[c];b[c]=b[p];b[p]=t;
  for(i=c+1;i<m;i++){var f=A[i][c]/A[c][c];if(f){for(j=c;j<m;j++)A[i][j]-=f*A[c][j];b[i]-=f*b[c];}}}
 var x=new Array(m).fill(0);for(i=m-1;i>=0;i--){var s2=b[i];for(j=i+1;j<m;j++)s2-=A[i][j]*x[j];x[i]=s2/A[i][i];}
 var u=new Array(N).fill(0);free.forEach(function(q,k){u[q]=x[k];});
 var react=0;for(i=0;i<N;i++)if(fixed[i]&&i%2===1){var r=-F[i];for(j=0;j<N;j++)r+=K[i][j]*u[j];react+=r;}
 var sf=Infinity,crit=-1,tot=0,mass=0;
 var res=info.map(function(q,idx){var d=q.d,ext=(u[d[2]]-u[d[0]])*q.c+(u[d[3]]-u[d[1]])*q.s,force=q.k*ext;mass+=q.mass;
  var capv=force>=0?q.cap.t:q.cap.c,ratio=Math.abs(force)/capv;if(Math.abs(force)>1e-9&&capv/Math.abs(force)<sf){sf=capv/Math.abs(force);crit=idx;}
  return {a:q.e.a,b:q.e.b,m:q.e.m,L:q.L,force:force,cap:capv,util:ratio,mode:force<0?(q.cap.buck?"buckles":"crushes"):"snaps"};});
 var disp={};ids.forEach(function(nd){disp[nd]=[u[2*ix[nd]],u[2*ix[nd]+1]];});
 return {members:res,sf:sf,crit:crit,mass:mass,disp:disp,react:react,total:-F.reduce(function(a,b2,k){return k%2===1?a+b2:a;},0)};
}
var api={solve:solve,MAT:MAT,capacity:capacity};
if(typeof module!=="undefined"&&module.exports){module.exports=api;return;}
root.BridgeLab=api;

// ---------------- UI ----------------
var $=function(i){return document.getElementById(i);};
var CH=[{id:"a",name:"Footbridge: 12 kN, max 20 kg",P:12,budget:20,tier:"Intermediate"},{id:"b",name:"Village bridge: 30 kN, max 60 kg",P:30,budget:60,tier:"Advanced"},{id:"c",name:"Truck bridge: 60 kN, max 120 kg",P:60,budget:120,tier:"Expert"}];
var NX=7,NY=4,S=50,OX=30,OY=170,nodes=[];for(var yy=0;yy<NY;yy++)for(var xx=0;xx<NX;xx++)nodes.push({x:xx,y:yy});
var st={mem:[],sel:-1,mat:"wood",ch:0,res:null,anim:-1,msg:""};
function saveLab(id,name,tier,stars){try{var all=JSON.parse(localStorage.getItem("mm_lab")||"{}"),p=all[id];if(!p||stars>p.stars){all[id]={name:name,tier:tier,stars:stars,at:Date.now()};localStorage.setItem("mm_lab",JSON.stringify(all));return true;}}catch(e){}return false;}
function key(a,b){return a<b?a+"-"+b:b+"-"+a;}
function pinN(){return 0;}function rolN(){return NX-1;}
function loadsFor(P){var l={};for(var k=1;k<NX-1;k++)l[k]=P/(NX-2);return l;}
function deckOk(){for(var k=0;k<NX-1;k++)if(!st.mem.some(function(e){return key(e.a,e.b)===key(k,k+1);}))return false;return true;}
function analyse(){var c=CH[st.ch];st.res=solve(nodes,st.mem,{pin:pinN(),roller:rolN()},loadsFor(c.P));return st.res;}
function verdict(){var r=st.res,c=CH[st.ch];if(!r)return {ok:false,t:"Tap two dots to place a beam between them."};if(r.err)return {ok:false,t:"⚠ "+r.err};
 if(!deckOk())return {ok:false,t:"Add a beam along the whole deck (the bottom row) so vehicles can cross."};
 var defl=0;Object.keys(r.disp).forEach(function(k){defl=Math.max(defl,-r.disp[k][1]*1000);});
 if(r.mass>c.budget)return {ok:false,t:"Too heavy: "+r.mass.toFixed(1)+" kg (limit "+c.budget+" kg)."};
 if(r.sf<1){var m=r.members[r.crit];return {ok:false,t:"✗ It collapses! Beam "+(r.crit+1)+" "+m.mode+" at "+(r.sf*100).toFixed(0)+"% of the load."};}
 if(r.sf<1.5)return {ok:false,t:"It stands but is too risky: safety factor "+r.sf.toFixed(2)+" (need 1.5)."};
 if(defl>25)return {ok:false,t:"Too bendy: it sags "+defl.toFixed(0)+" mm (max 25 mm)."};
 var stars=1+(r.sf>=2?1:0)+(r.sf>=2&&r.mass<=0.7*c.budget?1:0);var nw=saveLab("bridge_"+c.id,"Bridge: "+c.name.split(":")[0],c.tier,stars);return {ok:true,saved:nw,t:"★".repeat(stars)+" Safe bridge! Safety factor "+r.sf.toFixed(2)+", sag "+defl.toFixed(0)+" mm, mass "+r.mass.toFixed(1)+" kg."};}
function px(n){return OX+nodes[n].x*S;}function py(n){return OY-nodes[n].y*S;}
function col(u){var h=120-Math.min(1,u)*120;return "hsl("+h+",85%,50%)";}
function draw(){var cv=$("brCv");if(!cv)return;var g=cv.getContext("2d");g.clearRect(0,0,cv.width,cv.height);g.fillStyle="#0b1220";g.fillRect(0,0,cv.width,cv.height);
 g.fillStyle="#1e293b";g.fillRect(0,OY+8,cv.width,30);g.fillStyle="#3b82f6";g.globalAlpha=.25;g.fillRect(OX+S*0.0,OY+8,S*(NX-1)+1,30);g.globalAlpha=1;g.fillStyle="#94a3b8";g.font="10px sans-serif";g.fillText("river",8,OY+28);
 for(var i=0;i<nodes.length;i++){g.fillStyle=i===st.sel?"#fbbf24":"#475569";g.beginPath();g.arc(px(i),py(i),i===st.sel?5:3,0,7);g.fill();}
 var r=st.res&&!st.res.err?st.res:null,f=st.anim>=0?st.anim:1,sc=60,fail=r&&r.sf<1&&f>=r.sf;
 st.mem.forEach(function(e,idx){var ma=r&&r.members[idx],a=e.a,b=e.b,ax=px(a),ay=py(a),bx=px(b),by=py(b);
  if(r&&!fail){ax+=r.disp[a][0]*S*sc*f;ay-=r.disp[a][1]*S*sc*f;bx+=r.disp[b][0]*S*sc*f;by-=r.disp[b][1]*S*sc*f;}
  var u=ma?ma.util:0,isCrit=r&&idx===r.crit&&fail;g.strokeStyle=isCrit?"#ff2030":(r?col(u/Math.max(0.0001,1)):MAT[e.m].col);g.lineWidth=e.m==="steel"?3:5;g.setLineDash(ma&&ma.force<0?[]:[]);g.beginPath();
  if(isCrit){g.moveTo(ax,ay);g.lineTo((ax+bx)/2-4,(ay+by)/2-4);g.moveTo((ax+bx)/2+4,(ay+by)/2+4);g.lineTo(bx,by);}else{g.moveTo(ax,ay);g.lineTo(bx,by);}g.stroke();
  if(ma){g.fillStyle="#e2e8f0";g.font="9px sans-serif";g.fillText((ma.force>=0?"T ":"C ")+Math.abs(ma.force).toFixed(1),(ax+bx)/2-8,(ay+by)/2-4);}});
 // supports
 g.fillStyle="#22c55e";[pinN(),rolN()].forEach(function(n,k){var x=px(n),y=py(n);g.beginPath();g.moveTo(x,y+2);g.lineTo(x-9,y+16);g.lineTo(x+9,y+16);g.closePath();g.fill();if(k)g.fillRect(x-9,y+17,18,3);});
 // truck
 if(r&&deckOk()){var tx=OX+(NX-1)*S*(0.5+0.4*Math.sin(Math.min(1,f)*3.14159*0.0));g.fillStyle="#f59e0b";g.fillRect(tx-14,py(0)-13+(r?-r.disp[3][1]*S*sc*f*0:0),28,9);g.fillStyle="#111";g.beginPath();g.arc(tx-8,py(0)-3,3,0,7);g.arc(tx+8,py(0)-3,3,0,7);g.fill();}
 g.fillStyle="#94a3b8";g.font="10px sans-serif";g.fillText("Grid: 1 m. Tap two dots to place or remove a beam.",8,12);
}
function refresh(){analyse();var v=verdict();var el=$("brMsg");if(el){el.textContent=v.t+(v.ok?" Saved to your Passport.":"");el.style.color=v.ok?"#86efac":"#fca5a5";}var r=st.res&&!st.res.err?st.res:null;
 var inf=$("brInfo");if(inf)inf.innerHTML=r?"<b>Mass</b> "+r.mass.toFixed(1)+" / "+CH[st.ch].budget+" kg &nbsp; <b>Safety factor</b> "+(isFinite(r.sf)?r.sf.toFixed(2):"–")+" &nbsp; <b>Beams</b> "+st.mem.length:"";
 draw();}
function tap(e){var cv=$("brCv"),rc=cv.getBoundingClientRect(),sx=cv.width/rc.width,x=(e.clientX-rc.left)*sx,y=(e.clientY-rc.top)*sx,best=-1,bd=1e9;
 nodes.forEach(function(n,i){var d=Math.pow(px(i)-x,2)+Math.pow(py(i)-y,2);if(d<bd){bd=d;best=i;}});
 if(best<0||bd>22*22)return;
 if(st.sel<0){st.sel=best;refresh();return;}
 if(st.sel===best){st.sel=-1;refresh();return;}
 var a=st.sel,b=best,L=Math.hypot(nodes[a].x-nodes[b].x,nodes[a].y-nodes[b].y);st.sel=-1;
 var k=key(a,b),ix=-1;st.mem.forEach(function(m,i){if(key(m.a,m.b)===k)ix=i;});
 if(ix>=0){st.mem.splice(ix,1);}
 else if(L>3.01){refresh();$("brMsg").textContent="That beam is too long (max 3 m). Use shorter beams.";$("brMsg").style.color="#fca5a5";return;}
 else{st.mem.push({a:Math.min(a,b),b:Math.max(a,b),m:st.mat});}
 refresh();}
var EX=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[7,8],[8,9],[9,10],[10,11],[11,12],[0,7],[7,1],[1,8],[8,2],[2,9],[9,3],[3,10],[10,4],[4,11],[11,5],[5,12],[12,6]];
function mount(){var host=document.getElementById("circuits");if(!host||$("bridgeLab"))return;var d=document.createElement("div");d.className="card";d.id="bridgeLab";
 d.innerHTML="<details><summary><h2 style='display:inline'>🌉 Bridge Lab</h2></summary><p class='sub'>Real engineering physics: your beams carry only pull (T) or push (C). The computer solves the forces in every beam. Long, thin beams <b>buckle</b> when pushed, so use triangles and short beams. Place the beams to carry the truck across the river.</p>"+
 "<div class='row'><select id='brCh'>"+CH.map(function(c,i){return "<option value='"+i+"'>"+c.name+"</option>";}).join("")+"</select><select id='brMat'><option value='wood'>Pine wood (light, weak)</option><option value='steel'>Steel tube (strong, heavy)</option></select></div>"+
 "<canvas id='brCv' width='370' height='215' style='width:100%;border-radius:8px;touch-action:manipulation'></canvas><div id='brInfo' class='sub'></div><div id='brMsg' class='sub'></div>"+
 "<div class='row'><button id='brTest' class='p'>▶ Load test</button><button id='brClr'>Clear</button><button id='brEx'>Show example</button></div></details>";
 host.insertBefore(d,host.firstChild);
 $("brCv").addEventListener("click",tap);$("brCh").onchange=function(){st.ch=+this.value;refresh();};$("brMat").onchange=function(){st.mat=this.value;};
 $("brClr").onclick=function(){st.mem=[];st.sel=-1;refresh();};
 $("brEx").onclick=function(){st.mem=EX.map(function(p){return {a:p[0],b:p[1],m:st.mat};});st.sel=-1;refresh();};
 $("brTest").onclick=function(){analyse();var t0=performance.now();(function f(){var t=(performance.now()-t0)/1400;st.anim=Math.min(1,t);draw();if(t<1)requestAnimationFrame(f);else{st.anim=-1;refresh();}})();};
 refresh();}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})(typeof window!=="undefined"?window:this);
