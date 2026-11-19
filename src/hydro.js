// Hydraulics Lab: Pascal's law with seal friction, a burst-pressure limit and the stroke count (volume conservation).
(function(root){
"use strict";
var G=9.81,ETA=0.9,STROKE=0.03;
var CH=[
 {id:"jack",name:"Car jack: lift 1200 kg",tier:"Intermediate",m:1200,h:0.2,Fh:400,pmax:4e6,maxStrokes:60,txt:"Lift a 1200 kg car by 20 cm. Your hand pushes with 400 N on a lever. The hose bursts above 4 MPa and you can pump at most 60 times."},
 {id:"tipper",name:"Tipper: lift 4 tonnes",tier:"Advanced",m:4000,h:0.3,Fh:500,pmax:10e6,maxStrokes:120,txt:"A pump driven by a 500 N hand force must raise a 4 t tipper body by 30 cm. Burst pressure is 10 MPa, at most 120 pumps."},
 {id:"press",name:"Fruit press: 15 kN",tier:"Beginner",m:1530,h:0.05,Fh:200,pmax:3e6,maxStrokes:40,txt:"Squeeze juice with a press that must push with at least 15 kN over 5 cm. Hand force 200 N, burst 3 MPa, at most 40 pumps."}];
var DS=[10,12,16,20,25,30,36,40],DL=[50,60,70,80,100,120,150,200],LV=[2,3,4,5,6,8,10];
function analyse(c,d1,d2,lev){var A1=Math.PI*Math.pow(d1/2000,2),A2=Math.PI*Math.pow(d2/2000,2),F1=c.Fh*lev,p=F1/A1,F2=p*A2*ETA,W=c.m*G,strokes=c.h*A2/(A1*STROKE);
 return {A1:A1,A2:A2,F1:F1,p:p,F2:F2,W:W,strokes:strokes,ratio:A2/A1};}
function judge(c,r){
 if(r.p>c.pmax)return {ok:false,t:"✗ The hose bursts! Pressure "+(r.p/1e6).toFixed(1)+" MPa is above "+(c.pmax/1e6)+" MPa. Use a bigger small piston or a shorter lever."};
 if(r.F2<r.W)return {ok:false,t:"The load doesn't move: the big piston pushes "+(r.F2/1000).toFixed(1)+" kN but needs "+(r.W/1000).toFixed(1)+" kN."};
 if(r.strokes>c.maxStrokes)return {ok:false,t:"Too many pumps: "+Math.ceil(r.strokes)+" (max "+c.maxStrokes+"). A smaller area ratio lifts faster."};
 var s=1+(r.F2>=r.W*1.15?1:0)+(r.p<=c.pmax*0.7&&r.strokes<=c.maxStrokes*0.8?1:0);
 return {ok:true,stars:s,t:"★".repeat(s)+" Lifts it! "+Math.ceil(r.strokes)+" pumps at "+(r.p/1e6).toFixed(1)+" MPa, force "+(r.F2/1000).toFixed(1)+" kN."};}
function evaluate(d){d=d||{};var c=CH.filter(function(x){return x.id===d.ch;})[0];if(!c||DS.indexOf(d.d1)<0||DL.indexOf(d.d2)<0||LV.indexOf(d.lev)<0)return {ok:false,t:"Invalid design."};var j=judge(c,analyse(c,d.d1,d.d2,d.lev));j.tier=c.tier;j.name=c.name;return j;}
var api={analyse:analyse,judge:judge,evaluate:evaluate,CH:CH};
if(typeof module!=="undefined"&&module.exports){module.exports=api;return;}
root.HydroLab=api;
var $=function(i){return document.getElementById(i);};
function saveLab(id,name,tier,stars){try{var all=JSON.parse(localStorage.getItem("mm_lab")||"{}"),p=all[id];if(!p||stars>p.stars){all[id]={name:name,tier:tier,stars:stars,at:Date.now()};localStorage.setItem("mm_lab",JSON.stringify(all));return true;}}catch(e){}return false;}
var st={ch:0,d1:25,d2:100,lev:6,ph:0,touched:false};
function draw(){var cv=$("hyCv");if(!cv)return;var g=cv.getContext("2d"),c=CH[st.ch],r=analyse(c,st.d1,st.d2,st.lev);g.fillStyle="#0b1220";g.fillRect(0,0,cv.width,cv.height);
 var w1=st.d1*1.1,w2=st.d2*0.9+10,cx1=70,cx2=270,base=160,pump=(Math.sin(st.ph)+1)/2;
 g.fillStyle="#1d4ed8";g.fillRect(cx1-w1/2,base-60,w1,60);g.fillRect(cx2-w2/2,base-60,w2,60);g.fillRect(cx1-w1/2,base-8,cx2-cx1+w2/2,8); // fluid
 g.strokeStyle="#64748b";g.lineWidth=3;g.strokeRect(cx1-w1/2,base-90,w1,90);g.strokeRect(cx2-w2/2,base-90,w2,90);
 var p1=base-60-pump*18,p2=base-60-(1-0)*0-((st.ph/6.283)%1)*14;
 g.fillStyle="#cbd5e1";g.fillRect(cx1-w1/2+2,p1-8,w1-4,8);g.fillRect(cx1-3,p1-40,6,32);
 g.fillRect(cx2-w2/2+2,p2-8,w2-4,8);g.fillRect(cx2-3,p2-34,6,26);
 g.fillStyle="#f59e0b";g.fillRect(cx2-w2/2,p2-52,w2,18);g.fillStyle="#0b1220";g.font="10px sans-serif";g.textAlign="center";g.fillText(c.m+" kg",cx2,p2-39);
 g.fillStyle="#e2e8f0";g.fillText("small "+st.d1+" mm",cx1,base+14);g.fillText("large "+st.d2+" mm",cx2,base+14);g.fillText("hand "+c.Fh+" N × "+st.lev,cx1,p1-46);}
function refresh(){var c=CH[st.ch],r=analyse(c,st.d1,st.d2,st.lev),j=judge(c,r);
 $("hyInfo").innerHTML="<b>Area ratio</b> "+r.ratio.toFixed(1)+":1 &nbsp; <b>Pressure</b> "+(r.p/1e6).toFixed(2)+" MPa (burst "+(c.pmax/1e6)+")<br><b>Push</b> "+(r.F2/1000).toFixed(1)+" kN (need "+(r.W/1000).toFixed(1)+") &nbsp; <b>Pumps</b> "+Math.ceil(r.strokes)+" (max "+c.maxStrokes+")";
 if(j.ok&&st.touched)saveLab("hydro_"+c.id,"Hydraulics: "+c.name.split(":")[0],c.tier,j.stars);var m=$("hyMsg");m.textContent=j.t+(j.ok&&st.touched?" Saved to your Passport.":"");m.style.color=j.ok?"#86efac":"#fca5a5";$("hyTxt").textContent=c.txt;draw();}
function loop(){st.ph+=0.06;draw();requestAnimationFrame(loop);}
function mount(){var host=document.getElementById("circuits");if(!host||$("hydroLab"))return;var d=document.createElement("div");d.className="card";d.id="hydroLab";
 var sel=function(k,arr,u,lab){return "<label>"+lab+"<select class='hyS' data-k='"+k+"'>"+arr.map(function(n){return "<option value='"+n+"'"+(n===st[k]?" selected":"")+">"+n+u+"</option>";}).join("")+"</select></label>";};
 d.innerHTML="<details><summary><h2 style='display:inline'>💧 Hydraulics Lab</h2></summary><p class='sub'>Pascal's law: pressure is the same everywhere in the liquid, so a small piston pushing hard makes a big piston push with a big force. The trade-off: the big piston moves less, so you must pump many times. Seals waste 10%.</p><select id='hyCh'>"+CH.map(function(c,i){return "<option value='"+i+"'>"+c.name+"</option>";}).join("")+"</select><p class='sub' id='hyTxt'></p>"+
 "<div class='row'>"+sel("d1",DS," mm","Small piston")+sel("d2",DL," mm","Large piston")+sel("lev",LV,"×","Lever")+"</div><canvas id='hyCv' width='370' height='190' style='width:100%;border-radius:8px'></canvas><div id='hyInfo' class='sub'></div><div id='hyMsg' class='sub'></div></details>";
 var gl=$("gearLab"),br=$("bridgeLab"),a=gl||br;if(a&&a.nextSibling)host.insertBefore(d,a.nextSibling);else host.insertBefore(d,host.firstChild);
 d.querySelectorAll(".hyS").forEach(function(s){s.onchange=function(){st.touched=true;st[this.dataset.k]=+this.value;refresh();};});$("hyCh").onchange=function(){st.ch=+this.value;st.touched=false;refresh();};refresh();loop();}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})(typeof window!=="undefined"?window:this);
