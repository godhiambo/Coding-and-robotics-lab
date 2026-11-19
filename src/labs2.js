// Labs 2: Robot Arm (statics + servo torque), Sumo (traction-limited pushing), AI Sorting (k-nearest-neighbour classifier).
// Every lab has a pure evaluate() so the competition server can re-check a submitted design.
(function(root){
"use strict";
var G=9.81;
// ================= ARM LAB =================
var SERVO={sg90:{name:"SG90 micro",tq:1.8,m:9,cost:400},mg90s:{name:"MG90S metal",tq:2.2,m:13,cost:600},mg996:{name:"MG996R heavy",tq:11,m:55,cost:1100},ds3218:{name:"DS3218 pro",tq:25,m:60,cost:1400}};
var LINK={plastic:{name:"Plastic",rho:1.5,cost:0},alu:{name:"Aluminium",rho:4,cost:300}};
var LENS=[15,20,25,30,40,50];
var ARM_CH=[{id:"pick",name:"Pick a 150 g cup",tier:"Intermediate",pay:150,tx:30,ty:10,budget:2000,txt:"Reach a point 30 cm out and 10 cm up carrying a 150 g load."},
 {id:"lift",name:"Lift a 300 g bottle",tier:"Advanced",pay:300,tx:40,ty:20,budget:2900,txt:"Reach 40 cm out and 20 cm up with 300 g. The servos must be strong enough."},
 {id:"far",name:"Far reach, 200 g",tier:"Expert",pay:200,tx:48,ty:5,budget:3300,txt:"Reach 48 cm out with 200 g. Long arms need big torque, and heavy links make it worse."}];
function armEval(d){d=d||{};var c=ARM_CH.filter(function(x){return x.id===d.ch;})[0];
 if(!c||LENS.indexOf(d.l1)<0||LENS.indexOf(d.l2)<0||!SERVO[d.s1]||!SERVO[d.s2]||!LINK[d.mat])return {ok:false,t:"Invalid design."};
 var L1=d.l1,L2=d.l2,x=c.tx,y=c.ty,dd=Math.hypot(x,y),lk=LINK[d.mat];
 if(dd>L1+L2)return {ok:false,t:"Out of reach: the target is "+dd.toFixed(0)+" cm away but the arm reaches only "+(L1+L2)+" cm."};
 if(dd<Math.abs(L1-L2))return {ok:false,t:"The arm cannot fold that short. Use more similar link lengths."};
 var c2=(dd*dd-L1*L1-L2*L2)/(2*L1*L2),s2=Math.sqrt(Math.max(0,1-c2*c2)),best=null;
 [1,-1].forEach(function(sg){var t1=Math.atan2(y,x)-Math.atan2(L2*sg*s2,L1+L2*c2),ex=L1*Math.cos(t1),ey=L1*Math.sin(t1);if(!best||ey>best.ey)best={t1:t1,ex:ex,ey:ey};});
 var ex=best.ex/100,wx=x/100,m1=lk.rho*L1/1000,m2=lk.rho*L2/1000,mp=c.pay/1000,se=SERVO[d.s2].m/1000,
  te=Math.abs(mp*G*(wx-ex)+m2*G*((ex+wx)/2-ex)),ts=Math.abs(mp*G*wx+m2*G*((ex+wx)/2)+se*G*ex+m1*G*(ex/2));
 var cs=0.8*SERVO[d.s1].tq*0.0981,ce=0.8*SERVO[d.s2].tq*0.0981,sf=Math.min(cs/Math.max(ts,1e-9),ce/Math.max(te,1e-9));
 var cost=SERVO[d.s1].cost+SERVO[d.s2].cost+2*lk.cost;
 var base={ts:ts,te:te,cs:cs,ce:ce,sf:sf,cost:cost,geom:{t1:best.t1,ex:best.ex,ey:best.ey,L1:L1,L2:L2,tx:x,ty:y}};
 if(sf<1)return Object.assign(base,{ok:false,t:"✗ A servo is too weak: the "+(cs/ts<ce/te?"shoulder":"elbow")+" needs "+((cs/ts<ce/te?ts:te)).toFixed(2)+" N·m but can safely give "+((cs/ts<ce/te?cs:ce)).toFixed(2)+"."});
 if(sf<1.2)return Object.assign(base,{ok:false,t:"It would hold, but with no safety margin (factor "+sf.toFixed(2)+", need 1.2)."});
 var stars=1+(sf>=1.5?1:0)+(sf>=1.5&&cost<=c.budget?1:0);
 return Object.assign(base,{ok:true,stars:stars,tier:c.tier,name:c.name,t:"★".repeat(stars)+" The arm holds the load! Safety factor "+sf.toFixed(2)+", cost "+cost+" KES (budget "+c.budget+")."});}
// ================= SUMO LAB =================
var MOT={n20:{name:"N20 micro gearmotor",T:0.04,m:12},tt:{name:"TT yellow motor",T:0.08,m:45},big:{name:"12 V gearmotor",T:0.18,m:120}};
var TYRE={plastic:{name:"Hard plastic",mu:0.5},silicone:{name:"Silicone",mu:0.8},rubber:{name:"Soft rubber",mu:1.1}};
var BALL=[100,200,300,400,500,600],WEDGE=[10,20,30,45];
var BOTS=[{id:"rookie",name:"Rookie Bot",tier:"Beginner",m:0.5,mu:0.6,T:0.06,w:30},{id:"club",name:"Club Champion",tier:"Advanced",m:0.75,mu:0.85,T:0.11,w:20},{id:"master",name:"Sumo Master",tier:"Expert",m:0.9,mu:1.0,T:0.15,w:10}];
var WR=0.02,MAXM=1.0;
function drive(m,mu,T,lift){var N=m*G*(1-lift);return Math.min(mu*N,2*T/WR);}
function sumoEval(d){d=d||{};var c=BOTS.filter(function(x){return x.id===d.ch;})[0];
 if(!c||BALL.indexOf(d.ballast)<0||!MOT[d.motor]||!TYRE[d.tyre]||WEDGE.indexOf(d.wedge)<0)return {ok:false,t:"Invalid design."};
 var mass=(150+d.ballast+2*MOT[d.motor].m)/1000;
 if(mass>MAXM)return {ok:false,mass:mass,t:"Over the weight limit: "+(mass*1000).toFixed(0)+" g (max "+MAXM*1000+" g)."};
 var liftMe=0.35*(1-d.wedge/60),liftOp=0.35*(1-c.w/60);
 var Fme=drive(mass,TYRE[d.tyre].mu,MOT[d.motor].T,liftOp),Fop=drive(c.m,c.mu,c.T,liftMe),margin=(Fme-Fop)/Math.max(Fop,1e-9);
 var base={mass:mass,Fme:Fme,Fop:Fop,margin:margin,tr:Math.min(TYRE[d.tyre].mu*mass*G,2*MOT[d.motor].T/WR)===2*MOT[d.motor].T/WR?"motor":"grip",bot:c};
 if(Fme<=Fop)return Object.assign(base,{ok:false,t:"✗ You get pushed out! You push with "+Fme.toFixed(2)+" N, "+c.name+" pushes with "+Fop.toFixed(2)+" N."+(base.tr==="motor"?" Your motor is the limit: use a stronger one.":" Your grip is the limit: add weight or softer tyres.")});
 var stars=1+(margin>=0.15?1:0)+(margin>=0.15&&mass<=0.85?1:0);
 return Object.assign(base,{ok:true,stars:stars,tier:c.tier,name:"Sumo: "+c.name,t:"★".repeat(stars)+" You push "+c.name+" out! "+Fme.toFixed(2)+" N vs "+Fop.toFixed(2)+" N."});}
// ================= AI LAB (k-NN) =================
var AI_CH=[{id:"two",name:"Plastic or metal?",tier:"Beginner",cls:["plastic","metal"],cen:[[3,7],[7,3]],sd:1.2,seed:11,txt:"Teach the computer to tell plastic from metal using size (across) and shininess (up). Add up to 10 labelled examples, then test."},
 {id:"three",name:"Plastic, metal or paper?",tier:"Intermediate",cls:["plastic","metal","paper"],cen:[[3,7],[7,3],[2,2]],sd:1.1,seed:23,txt:"Three kinds of waste. Add up to 14 labelled examples. Choose them well: examples near the borders matter most."},
 {id:"four",name:"Four tricky classes",tier:"Advanced",cls:["plastic","metal","paper","glass"],cen:[[3,7],[7,3],[2,2],[7.5,8]],sd:1.3,seed:37,txt:"Four classes that overlap. Add up to 18 examples and pick k. Balance your examples across all classes."}];
function rng(s){return function(){s=(Math.imul(s,1103515245)+12345)&0x7fffffff;return s/2147483648;};}
function gauss(r){return (r()+r()+r()+r()-2)*1.7;}
function testSet(c){var r=rng(c.seed),out=[];for(var i=0;i<40;i++){var k=i%c.cls.length;out.push({x:Math.max(0,Math.min(10,c.cen[k][0]+gauss(r)*c.sd)),y:Math.max(0,Math.min(10,c.cen[k][1]+gauss(r)*c.sd)),c:c.cls[k]});}return out;}
function knn(tr,k,x,y,cls){var d=tr.map(function(p){return {d:(p.x-x)*(p.x-x)+(p.y-y)*(p.y-y),c:p.c};}).sort(function(a,b){return a.d-b.d;}).slice(0,k),v={};d.forEach(function(q){v[q.c]=(v[q.c]||0)+1;});var best=cls[0],bc=-1;cls.forEach(function(n){if((v[n]||0)>bc){bc=v[n]||0;best=n;}});return best;}
function aiEval(d){d=d||{};var c=AI_CH.filter(function(x){return x.id===d.ch;})[0],max=c?[10,14,18][AI_CH.indexOf(c)]:0;
 if(!c||[1,3,5].indexOf(d.k)<0||!Array.isArray(d.tr)||d.tr.length>max)return {ok:false,t:"Invalid design."};
 var tr=[];for(var i=0;i<d.tr.length;i++){var p=d.tr[i];if(!p||c.cls.indexOf(p.c)<0||!(p.x>=0&&p.x<=10&&p.y>=0&&p.y<=10))return {ok:false,t:"Invalid design."};tr.push({x:+p.x,y:+p.y,c:p.c});}
 if(tr.length<c.cls.length*2)return {ok:false,n:0,t:"Add at least "+c.cls.length*2+" examples (two per class)."};
 var ts=testSet(c),right=0;ts.forEach(function(p){if(knn(tr,Math.min(d.k,tr.length),p.x,p.y,c.cls)===p.c)right++;});var acc=right/ts.length;
 var base={acc:acc,n:tr.length};
 if(acc<0.8)return Object.assign(base,{ok:false,t:"Accuracy "+(acc*100).toFixed(0)+"%. Need 80%. Add examples where the classes meet."});
 var stars=1+(acc>=0.88?1:0)+(acc>=0.94?1:0);return Object.assign(base,{ok:true,stars:stars,tier:c.tier,name:"AI: "+c.name,t:"★".repeat(stars)+" Your classifier is "+(acc*100).toFixed(0)+"% accurate on 40 unseen items."});}
var api={Arm:{evaluate:armEval,CH:ARM_CH},Sumo:{evaluate:sumoEval,CH:BOTS},AI:{evaluate:aiEval,CH:AI_CH,testSet:testSet,knn:knn}};
if(typeof module!=="undefined"&&module.exports){module.exports=api;return;}
root.Labs2=api;
// ---------------- UI ----------------
var $=function(i){return document.getElementById(i);};
function saveLab(id,name,tier,stars){try{var all=JSON.parse(localStorage.getItem("mm_lab")||"{}"),p=all[id];if(!p||stars>p.stars){all[id]={name:name,tier:tier,stars:stars,at:Date.now()};localStorage.setItem("mm_lab",JSON.stringify(all));return true;}}catch(e){}return false;}
function opt(arr,val,f){return arr.map(function(a){var v=Array.isArray(a)?a[0]:a,l=Array.isArray(a)?a[1]:(f?f(a):a);return "<option value='"+v+"'"+(String(v)===String(val)?" selected":"")+">"+l+"</option>";}).join("");}
function card(id,icon,title,intro,chs,body){var host=document.getElementById("circuits");if(!host||$(id))return null;var d=document.createElement("div");d.className="card";d.id=id;
 d.innerHTML="<details><summary><h2 style='display:inline'>"+icon+" "+title+"</h2></summary><p class='sub'>"+intro+"</p><select class='l2ch'>"+chs.map(function(c,i){return "<option value='"+i+"'>"+c.name+"</option>";}).join("")+"</select><p class='sub l2txt'></p>"+body+"<div class='sub l2info'></div><div class='sub l2msg'></div></details>";
 var prev=$("hydroLab")||$("gearLab")||$("bridgeLab");var anchor=document.getElementById("arm2Lab")||document.getElementById("sumoLab")||prev;if(anchor&&anchor.nextSibling)host.insertBefore(d,anchor.nextSibling);else host.insertBefore(d,host.firstChild);return d;}
function say(d,v,ok,st,id,nm,tier){var m=d.querySelector(".l2msg");m.textContent=v.t+(v.ok&&st.touched?" Saved to your Passport.":(v.ok?" Change the design to make it your own.":""));m.style.color=v.ok?"#86efac":"#fca5a5";if(v.ok&&st.touched)saveLab(id,nm,tier,v.stars);}
function hookCh(d,st,list,mod,refresh){var sel=d.querySelector(".l2ch");sel.onchange=function(){st.ch=+this.value;st.touched=false;if(st.reset)st.reset();refresh();};
 root[mod].getDesign=function(){return st.design();};root[mod].setChallenge=function(id,lock){for(var i=0;i<list.length;i++)if(list[i].id===id){st.ch=i;sel.value=i;}sel.disabled=!!lock;st.touched=false;if(st.reset)st.reset();d.querySelector("details").open=true;refresh();};}
// ---- Arm UI
function mountArm(){var st={ch:0,l1:30,l2:30,s1:"mg996",s2:"sg90",mat:"plastic",touched:false};
 var d=card("arm2Lab","🦾","Robot Arm Lab","A real arm must hold its load. Each servo has a torque limit (kg·cm). Torque = weight × horizontal distance. Long, heavy arms need strong servos, but strong servos are heavy and cost more.",ARM_CH,"<div class='row'><label>Link 1<select data-k='l1'>"+opt(LENS,30,function(a){return a+" cm";})+"</select></label><label>Link 2<select data-k='l2'>"+opt(LENS,30,function(a){return a+" cm";})+"</select></label></div><div class='row'><label>Shoulder servo<select data-k='s1'>"+opt(Object.keys(SERVO).map(function(k){return [k,SERVO[k].name+" ("+SERVO[k].tq+" kg·cm)"];}),"mg996")+"</select></label><label>Elbow servo<select data-k='s2'>"+opt(Object.keys(SERVO).map(function(k){return [k,SERVO[k].name+" ("+SERVO[k].tq+" kg·cm)"];}),"sg90")+"</select></label><label>Link material<select data-k='mat'>"+opt(Object.keys(LINK).map(function(k){return [k,LINK[k].name];}),"plastic")+"</select></label></div><canvas width='370' height='200' style='width:100%;border-radius:8px'></canvas>");
 if(!d)return;var cv=d.querySelector("canvas");st.design=function(){return {ch:ARM_CH[st.ch].id,l1:st.l1,l2:st.l2,s1:st.s1,s2:st.s2,mat:st.mat};};
 function refresh(){var c=ARM_CH[st.ch],v=armEval(st.design());d.querySelector(".l2txt").textContent=c.txt+" Budget "+c.budget+" KES.";
  d.querySelector(".l2info").innerHTML=v.ts!==undefined?"<b>Shoulder</b> "+v.ts.toFixed(2)+" / "+v.cs.toFixed(2)+" N·m &nbsp; <b>Elbow</b> "+v.te.toFixed(2)+" / "+v.ce.toFixed(2)+" N·m &nbsp; <b>Cost</b> "+v.cost+" KES":"";
  say(d,v,v.ok,st,"arm_"+c.id,"Arm: "+c.name,c.tier);var g=cv.getContext("2d");g.fillStyle="#0b1220";g.fillRect(0,0,370,200);var S=3.2,ox=40,oy=170;g.strokeStyle="#334155";g.beginPath();g.moveTo(0,oy);g.lineTo(370,oy);g.stroke();
  g.fillStyle="#f59e0b";g.beginPath();g.arc(ox+c.tx*S,oy-c.ty*S,6,0,7);g.fill();g.fillStyle="#94a3b8";g.font="10px sans-serif";g.fillText("target",ox+c.tx*S-12,oy-c.ty*S-10);
  if(v.geom){var q=v.geom,ex=ox+q.ex*S,ey=oy-q.ey*S;g.lineWidth=7;g.lineCap="round";g.strokeStyle=v.ok?"#34d399":"#f87171";g.beginPath();g.moveTo(ox,oy);g.lineTo(ex,ey);g.stroke();g.strokeStyle="#60a5fa";g.beginPath();g.moveTo(ex,ey);g.lineTo(ox+q.tx*S,oy-q.ty*S);g.stroke();g.fillStyle="#e2e8f0";g.beginPath();g.arc(ox,oy,7,0,7);g.arc(ex,ey,6,0,7);g.fill();}}
 d.querySelectorAll("select[data-k]").forEach(function(s){s.onchange=function(){st.touched=true;var k=this.dataset.k;st[k]=(k==="l1"||k==="l2")?+this.value:this.value;refresh();};});hookCh(d,st,ARM_CH,"Labs2Arm",refresh);refresh();}
// ---- Sumo UI
function mountSumo(){var st={ch:0,ballast:300,motor:"tt",tyre:"silicone",wedge:20,touched:false,ph:0};
 var d=card("sumoLab","🤼","Sumo Lab","Traction decides sumo. Your push force is the smaller of what your tyres can grip (friction × weight) and what your motors can deliver. A low wedge slides under the opponent and lightens them. Keep the robot under 1 kg.",BOTS,"<div class='row'><label>Ballast<select data-k='ballast'>"+opt(BALL,300,function(a){return a+" g";})+"</select></label><label>Motors<select data-k='motor'>"+opt(Object.keys(MOT).map(function(k){return [k,MOT[k].name+" ("+MOT[k].T+" N·m)"];}),"tt")+"</select></label></div><div class='row'><label>Tyres<select data-k='tyre'>"+opt(Object.keys(TYRE).map(function(k){return [k,TYRE[k].name+" (μ "+TYRE[k].mu+")"];}),"silicone")+"</select></label><label>Wedge angle<select data-k='wedge'>"+opt(WEDGE,20,function(a){return a+"°";})+"</select></label></div><canvas width='370' height='150' style='width:100%;border-radius:8px'></canvas>");
 if(!d)return;var cv=d.querySelector("canvas");st.design=function(){return {ch:BOTS[st.ch].id,ballast:st.ballast,motor:st.motor,tyre:st.tyre,wedge:st.wedge};};var last=null;
 function refresh(){var c=BOTS[st.ch],v=sumoEval(st.design());last=v;d.querySelector(".l2txt").textContent="Beat "+c.name+": "+(c.m*1000)+" g, grip μ "+c.mu+", motor "+c.T+" N·m, wedge "+c.w+"°.";
  d.querySelector(".l2info").innerHTML=v.mass?"<b>Your mass</b> "+(v.mass*1000).toFixed(0)+" g &nbsp; "+(v.Fme!==undefined?"<b>Your push</b> "+v.Fme.toFixed(2)+" N &nbsp; <b>Opponent</b> "+v.Fop.toFixed(2)+" N":""):"";say(d,v,v.ok,st,"sumo_"+c.id,v.name||("Sumo: "+c.name),c.tier);}
 function draw(){if(!d.querySelector("details").open&&false)return;var g=cv.getContext("2d");g.fillStyle="#0b1220";g.fillRect(0,0,370,150);g.fillStyle="#1f2937";g.beginPath();g.ellipse(185,95,170,40,0,0,7);g.fill();g.strokeStyle="#e5e7eb";g.lineWidth=3;g.stroke();
  var sh=last&&last.Fme!==undefined?Math.max(-1,Math.min(1,(last.Fme-last.Fop)/Math.max(last.Fme,last.Fop))):0,t=(Math.sin(st.ph)+1)/2,off=sh*70*t;g.fillStyle="#34d399";g.fillRect(105+off,70,46,34);g.fillStyle="#f87171";g.fillRect(205+off,70,46,34);g.fillStyle="#0b1220";g.font="10px sans-serif";g.fillText("YOU",116+off,90);g.fillText("BOT",218+off,90);st.ph+=0.03;requestAnimationFrame(draw);}
 d.querySelectorAll("select[data-k]").forEach(function(s){s.onchange=function(){st.touched=true;var k=this.dataset.k;st[k]=(k==="ballast"||k==="wedge")?+this.value:this.value;refresh();};});hookCh(d,st,BOTS,"Labs2Sumo",refresh);refresh();draw();}
// ---- AI UI
function mountAI(){var st={ch:0,k:3,tr:[],cur:0,touched:false};
 var d=card("aiLab","🧠","AI Sorting Lab","Machine learning from examples. Tap the grid to add a labelled example (x = size, y = shininess). The computer colours the map with what it would guess (k-nearest-neighbour), then tests itself on 40 items it has never seen.",AI_CH,"<div class='row l2cls'></div><div class='row'><label>k (neighbours)<select data-k='k'>"+opt([1,3,5],3)+"</select></label><button class='l2undo'>Undo</button><button class='l2clr'>Clear</button></div><canvas width='340' height='300' style='width:100%;border-radius:8px;touch-action:manipulation'></canvas>");
 if(!d)return;var cv=d.querySelector("canvas"),COL=["#34d399","#60a5fa","#fbbf24","#f472b6"];st.design=function(){return {ch:AI_CH[st.ch].id,k:st.k,tr:st.tr.slice()};};st.reset=function(){st.tr=[];st.cur=0;};
 function maxN(){return [10,14,18][st.ch];}
 function refresh(){var c=AI_CH[st.ch],v=aiEval(st.design());d.querySelector(".l2txt").textContent=c.txt;d.querySelector(".l2cls").innerHTML=c.cls.map(function(n,i){return "<button data-c='"+i+"' style='"+(i===st.cur?"outline:2px solid "+COL[i]:"")+"'>● "+n+"</button>";}).join("");
  d.querySelectorAll(".l2cls button").forEach(function(b){b.onclick=function(){st.cur=+b.dataset.c;refresh();};});
  d.querySelector(".l2info").innerHTML="<b>Examples</b> "+st.tr.length+" / "+maxN()+(v.acc!==undefined?" &nbsp; <b>Test accuracy</b> "+(v.acc*100).toFixed(0)+"%":"");say(d,v,v.ok,st,"ai_"+c.id,v.name||("AI: "+c.name),c.tier);
  var g=cv.getContext("2d"),S=30;g.fillStyle="#0b1220";g.fillRect(0,0,340,300);if(st.tr.length>=1){for(var gx=0;gx<34;gx++)for(var gy=0;gy<30;gy++){var cl=knn(st.tr,Math.min(st.k,st.tr.length),gx/3.4+0.15,10-(gy/3)-0.15,c.cls);g.globalAlpha=0.28;g.fillStyle=COL[c.cls.indexOf(cl)];g.fillRect(gx*10,gy*10,10,10);}g.globalAlpha=1;}
  testSet(c).forEach(function(p){g.fillStyle="#475569";g.fillRect(p.x*S+10-1,300-(p.y*S+0)-1-0,2,2);});
  st.tr.forEach(function(p){g.fillStyle=COL[c.cls.indexOf(p.c)];g.beginPath();g.arc(p.x*S+0,300-p.y*S,6,0,7);g.fill();g.strokeStyle="#fff";g.lineWidth=1.5;g.stroke();});g.fillStyle="#94a3b8";g.font="10px sans-serif";g.fillText("size →",290,294);g.fillText("shiny ↑",4,12);}
 cv.addEventListener("click",function(e){var rc=cv.getBoundingClientRect(),sx=340/rc.width,x=(e.clientX-rc.left)*sx/30,y=(300-(e.clientY-rc.top)*sx)/30;if(x<0||x>10||y<0||y>10)return;if(st.tr.length>=maxN()){d.querySelector(".l2msg").textContent="You have used all "+maxN()+" examples. Undo one first.";return;}st.touched=true;st.tr.push({x:Math.round(x*10)/10,y:Math.round(y*10)/10,c:AI_CH[st.ch].cls[st.cur]});refresh();});
 d.querySelector(".l2undo").onclick=function(){st.tr.pop();st.touched=true;refresh();};d.querySelector(".l2clr").onclick=function(){st.tr=[];st.touched=true;refresh();};
 d.querySelector("select[data-k]").onchange=function(){st.touched=true;st.k=+this.value;refresh();};hookCh(d,st,AI_CH,"Labs2AI",refresh);refresh();}
root.Labs2Arm={};root.Labs2Sumo={};root.Labs2AI={};
function mount(){mountArm();mountSumo();mountAI();}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})(typeof window!=="undefined"?window:this);
