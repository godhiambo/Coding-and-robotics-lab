// Gear Lab: a two-stage gear train driven by a real DC motor (linear torque-speed curve).
// Output speed comes from where the motor torque equals the load torque reflected through the gears.
(function(root){
"use strict";
var G=9.81,ETA=0.95; // efficiency of one gear mesh
var CH=[
 {id:"lift",name:"Crane: lift 5 kg",tier:"Intermediate",mot:{T0:0.15,rpm0:300},load:{kind:"lift",m:5,r:0.02},minV:0.015,txt:"Lift a 5 kg load with a 2 cm winch drum at least 1.5 cm/s. The motor must not run above 60% of its stall torque."},
 {id:"fan",name:"Fan: overdrive",tier:"Advanced",mot:{T0:0.5,rpm0:60},load:{kind:"torque",T:0.02},minRpm:150,txt:"A slow 60 rpm motor must spin a fan at 150 rpm or more. You need a speed-UP gear train (ratio below 1)."},
 {id:"hill",name:"Robot: climb a slope",tier:"Expert",mot:{T0:0.2,rpm0:400},load:{kind:"slope",m:2,r:0.03,deg:10,crr:0.02},minV:0.25,txt:"A 2 kg robot with 3 cm wheels must climb a 10° slope at 25 cm/s or faster. Too much gearing is slow, too little overheats the motor."}];
var TEETH=[8,10,12,16,20,24,30,36,40,48,60];
function loadTorque(c){var l=c.load;if(l.kind==="lift")return l.m*G*l.r;if(l.kind==="torque")return l.T;return (l.m*G*(Math.sin(l.deg*Math.PI/180)+l.crr*Math.cos(l.deg*Math.PI/180)))*l.r;}
function analyse(c,t){ // t=[a,b,c,d] teeth
 var R=(t[1]/t[0])*(t[3]/t[2]),eta=ETA*ETA,TL=loadTorque(c),T0=c.mot.T0,w0=c.mot.rpm0,Tm=TL/(R*eta),frac=Tm/T0;
 if(frac>=1)return {R:R,eta:eta,TL:TL,Tm:Tm,frac:frac,stall:true,wm:0,out:0,v:0};
 var wm=w0*(1-frac),out=wm/R,l=c.load,v=(l.r?out*2*Math.PI/60*l.r:null);
 return {R:R,eta:eta,TL:TL,Tm:Tm,frac:frac,stall:false,wm:wm,out:out,v:v};}
function judge(c,r){
 if(r.stall)return {ok:false,t:"✗ The motor stalls. The load torque is too big for this gearing. Use a bigger ratio (small driver, big driven gears)."};
 if(c.minRpm!==undefined){if(r.out<c.minRpm)return {ok:false,t:"Too slow: "+r.out.toFixed(0)+" rpm, need "+c.minRpm+"."};
  var s=1+(r.out>=c.minRpm*1.15?1:0)+(r.frac<=0.4?1:0);return {ok:true,stars:s,t:"★".repeat(s)+" Fan spins at "+r.out.toFixed(0)+" rpm."};}
 if(r.frac>0.6)return {ok:false,t:"Motor overheats: it works at "+(r.frac*100).toFixed(0)+"% of stall torque (max 60%). Add more gear reduction."};
 if(r.v<c.minV)return {ok:false,t:"Too slow: "+(r.v*100).toFixed(1)+" cm/s, need "+(c.minV*100).toFixed(1)+". Too much reduction slows the output."};
 var s=1+(r.v>=c.minV*1.3?1:0)+(r.frac<=0.45&&r.v>=c.minV*1.2?1:0);return {ok:true,stars:s,t:"★".repeat(s)+" Works! "+(r.v*100).toFixed(1)+" cm/s with the motor at "+(r.frac*100).toFixed(0)+"% of stall."};}
var api={analyse:analyse,judge:judge,CH:CH,TEETH:TEETH};
if(typeof module!=="undefined"&&module.exports){module.exports=api;return;}
root.GearLab=api;
var $=function(i){return document.getElementById(i);};
function saveLab(id,name,tier,stars){try{var all=JSON.parse(localStorage.getItem("mm_lab")||"{}"),p=all[id];if(!p||stars>p.stars){all[id]={name:name,tier:tier,stars:stars,at:Date.now()};localStorage.setItem("mm_lab",JSON.stringify(all));return true;}}catch(e){}return false;}
var st={ch:0,t:[12,48,12,48],ang:0,raf:0};
function gearPath(g,x,y,rad,n,rot,col,alpha){g.save();g.translate(x,y);g.rotate(rot);g.globalAlpha=alpha||1;g.fillStyle=col;g.beginPath();var tip=rad+4,root=rad-3;for(var i=0;i<n;i++){var a0=i*2*Math.PI/n,w=Math.PI/n*0.5;
  g.lineTo(root*Math.cos(a0-w),root*Math.sin(a0-w));g.lineTo(tip*Math.cos(a0-w*0.55),tip*Math.sin(a0-w*0.55));g.lineTo(tip*Math.cos(a0+w*0.55),tip*Math.sin(a0+w*0.55));g.lineTo(root*Math.cos(a0+w),root*Math.sin(a0+w));}
 g.closePath();g.fill();g.fillStyle="#0b1220";g.beginPath();g.arc(0,0,rad*0.22,0,7);g.fill();g.restore();g.globalAlpha=1;}
function draw(){var cv=$("grCv");if(!cv)return;var g=cv.getContext("2d"),t=st.t,c=CH[st.ch],r=analyse(c,t),sc=0.9;g.fillStyle="#0b1220";g.fillRect(0,0,cv.width,cv.height);
 var ra=t[0]*sc,rb=t[1]*sc,rc=t[2]*sc,rd=t[3]*sc,y=110,xa=20+ra,xb=xa+ra+rb,xd=xb+rc+rd;
 var th=st.ang;// motor shaft angle (rad)
 var ta=th,tb=-ta*t[0]/t[1],tc=tb,td=-tc*t[2]/t[3];
 gearPath(g,xd,y,rd,t[3],Math.PI+Math.PI/t[3]+td,"#a78bfa");
 gearPath(g,xb,y,rb,t[1],Math.PI+Math.PI/t[1]+tb,"#38bdf8");
 gearPath(g,xb,y,rc,t[2],tc,"#fbbf24",0.95);
 gearPath(g,xa,y,ra,t[0],ta,"#34d399");
 g.fillStyle="#e2e8f0";g.font="10px sans-serif";g.textAlign="center";[[xa,ra,t[0],"driver"],[xb,rb,t[1],"driven 1"],[xd,rd,t[3],"driven 2"]].forEach(function(q){g.fillText(q[2]+"T",q[0],y+3);});g.fillText(t[2]+"T (same shaft)",xb,y+rb+16);
 g.fillStyle="#94a3b8";g.textAlign="left";g.fillText("Motor",6,12);g.fillText("Output →",cv.width-60,12);}
function refresh(){var c=CH[st.ch],r=analyse(c,st.t),j=judge(c,r);
 $("grInfo").innerHTML="<b>Ratio</b> "+r.R.toFixed(2)+":1 &nbsp; <b>Efficiency</b> "+(r.eta*100).toFixed(0)+"%<br><b>Load torque</b> "+r.TL.toFixed(3)+" N·m &nbsp; <b>Motor torque</b> "+r.Tm.toFixed(3)+" N·m ("+(Math.min(r.frac,9.99)*100).toFixed(0)+"% of stall)<br><b>Motor</b> "+r.wm.toFixed(0)+" rpm → <b>Output</b> "+r.out.toFixed(0)+" rpm"+(r.v?" · "+(r.v*100).toFixed(1)+" cm/s":"");
 var m=$("grMsg"),nw=j.ok?saveLab("gear_"+c.id,"Gears: "+c.name.split(":")[0],c.tier,j.stars):false;m.textContent=j.t+(j.ok?" Saved to your Passport.":"");m.style.color=j.ok?"#86efac":"#fca5a5";$("grTxt").textContent=c.txt;draw();}
function loop(){var c=CH[st.ch],r=analyse(c,st.t);st.ang+=Math.min(6,(r.wm/60*2*Math.PI)/60)*0.35;draw();st.raf=requestAnimationFrame(loop);}
function mount(){var host=document.getElementById("circuits");if(!host||$("gearLab"))return;var d=document.createElement("div");d.className="card";d.id="gearLab";
 var sel=function(i){return "<select class='grT' data-i='"+i+"'>"+TEETH.map(function(n){return "<option value='"+n+"'"+(n===st.t[i]?" selected":"")+">"+n+" teeth</option>";}).join("")+"</select>";};
 d.innerHTML="<details><summary><h2 style='display:inline'>⚙️ Gear Lab</h2></summary><p class='sub'>Gears trade speed for torque. Ratio = (driven ÷ driver) for each pair. The motor slows down as the load grows, and every gear mesh wastes 5% of the power.</p><select id='grCh'>"+CH.map(function(c,i){return "<option value='"+i+"'>"+c.name+"</option>";}).join("")+"</select><p class='sub' id='grTxt'></p>"+
 "<div class='row'><label>Gear 1 (driver)"+sel(0)+"</label><label>Gear 2 (driven)"+sel(1)+"</label></div><div class='row'><label>Gear 3 (on gear 2's shaft)"+sel(2)+"</label><label>Gear 4 (output)"+sel(3)+"</label></div>"+
 "<canvas id='grCv' width='370' height='190' style='width:100%;border-radius:8px'></canvas><div id='grInfo' class='sub'></div><div id='grMsg' class='sub'></div></details>";
 var br=$("bridgeLab");if(br&&br.nextSibling)host.insertBefore(d,br.nextSibling);else host.insertBefore(d,host.firstChild);
 d.querySelectorAll(".grT").forEach(function(s){s.onchange=function(){st.t[+this.dataset.i]=+this.value;refresh();};});$("grCh").onchange=function(){st.ch=+this.value;refresh();};
 refresh();loop();}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})(typeof window!=="undefined"?window:this);
