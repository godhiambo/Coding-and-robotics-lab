// MMR: XP levels, Robotics Passport, certificates (canvas drawing, QR verification, ZIP download).
(function(){
"use strict";
var C=window.Core;
function jget(k,d){try{var v=JSON.parse(localStorage.getItem(k)||"null");return v===null?d:v;}catch(e){return d;}}
function jset(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c];});}

// ---------------- XP and levels ----------------
var TIERPTS={Beginner:100,Intermediate:300,Advanced:600,Expert:1000,Open:0};
var STARF={1:0.6,2:0.8,3:1};
var LEVELS=[[0,"Robotics Explorer"],[500,"Junior Coder"],[1500,"Robot Builder"],[3000,"Robotics Engineer"],[5000,"Automation Specialist"],[8000,"AI Robotics Innovator"],[12000,"Robotics Master"]];
var CERTXP={gold:300,silver:200,bronze:150,participation:60,fastest:100,precision:100,innovation:100};
function certs(){return jget("mmr_certs",[]);}
function missionData(){
 var scores=jget("mm_scores",{}),won=jget("mm_won",{}),out=[];
 if(!C)return out;
 C.LEVELS.forEach(function(l){if(l.id==="sandbox")return;if(won[l.id]||scores[l.id]){var st=(scores[l.id]&&scores[l.id].stars)||1;out.push({id:l.id,name:l.name,tier:l.tier||"Open",stars:st,pts:Math.round((TIERPTS[l.tier]||100)*(STARF[st]||0.6)),kind:l.kind||l.id,drone:!!l.drone,arm:!!l.arm,station:!!l.station});}});
 var lab=jget("mm_lab",{});Object.keys(lab).forEach(function(k){var x=lab[k];out.push({id:k,name:x.name,tier:x.tier,stars:x.stars,pts:Math.round((TIERPTS[x.tier]||100)*(STARF[x.stars]||0.6)),kind:k,lab:true});});
 return out;}
function state(){
 var m=missionData(),cs=certs(),xp=0;m.forEach(function(x){xp+=x.pts;});cs.forEach(function(c){xp+=CERTXP[c.kind]||0;});
 var lv=0;for(var i=0;i<LEVELS.length;i++)if(xp>=LEVELS[i][0])lv=i;
 var next=LEVELS[lv+1]||null;
 return {xp:xp,level:lv+1,title:LEVELS[lv][1],next:next?next[0]:null,nextTitle:next?next[1]:null,base:LEVELS[lv][0],missions:m,certs:cs};}
// ---------------- passport achievements ----------------
function has(m,f){return m.some(f);}
var ACH=[
 ["First mission completed","Complete any mission",function(s){return s.missions.length>0;}],
 ["First maze escaped","Complete the Maze mission",function(s){return has(s.missions,function(x){return x.kind==="maze";});}],
 ["Programmed sensors","Complete a mission that uses sensors",function(s){return has(s.missions,function(x){return ["sensor","line","stopnear","avoider","sharpline","schoolrun","boda"].indexOf(x.id)>=0;});}],
 ["Robotic arm challenge","Complete any robotic-arm mission",function(s){return has(s.missions,function(x){return x.arm;});}],
 ["Took flight","Complete any drone mission",function(s){return has(s.missions,function(x){return x.drone;});}],
 ["Built a circuit system","Complete Electronic Traffic Light or Automatic Door",function(s){return has(s.missions,function(x){return x.id==="trafficled"||x.id==="autodoor";});}],
 ["Smart farmer","Complete a farm or greenhouse mission",function(s){return has(s.missions,function(x){return ["farm","irrigate","greenhouse","solar"].indexOf(x.id)>=0;});}],
 ["Structural engineer","Pass any Bridge Lab challenge",function(s){return has(s.missions,function(x){return /^bridge_/.test(x.id);});}],
 ["Gear master","Pass any Gear Lab challenge",function(s){return has(s.missions,function(x){return /^gear_/.test(x.id);});}],
 ["Hydraulics engineer","Pass any Hydraulics Lab challenge",function(s){return has(s.missions,function(x){return /^hydro_/.test(x.id);});}],
 ["Arm designer","Pass any Robot Arm Lab challenge",function(s){return has(s.missions,function(x){return /^arm_/.test(x.id);});}],
 ["Sumo champion","Win any Sumo Lab challenge",function(s){return has(s.missions,function(x){return /^sumo_/.test(x.id);});}],
 ["Microcontroller maker","Pass any Arduino Lab challenge",function(s){return has(s.missions,function(x){return /^mcu_/.test(x.id);});}],
 ["AI trainer","Pass any AI Lab challenge",function(s){return has(s.missions,function(x){return /^ai_/.test(x.id);});}],
 ["Master Programmer","Earn 3 stars on 5 missions",function(s){return s.missions.filter(function(x){return x.stars===3;}).length>=5;}],
 ["Robotics Engineer","Complete 10 missions",function(s){return s.missions.length>=10;}],
 ["Mission Veteran","Complete 25 missions",function(s){return s.missions.length>=25;}],
 ["Beginner graduate","Complete every Beginner mission",function(s){var t=C.LEVELS.filter(function(l){return l.tier==="Beginner";});return t.length>0&&t.every(function(l){return s.missions.some(function(x){return x.id===l.id;});});}],
 ["Participated in a competition","Take part in a class competition",function(s){return s.certs.length>0;}],
 ["Won a robotics medal","Finish in the top 3 of a competition",function(s){return s.certs.some(function(c){return c.kind==="gold"||c.kind==="silver"||c.kind==="bronze";});}],
 ["Precision Expert","Win the Precision Expert award",function(s){return s.certs.some(function(c){return c.kind==="precision";});}],
 ["Innovation Star","Receive an Innovation Award",function(s){return s.certs.some(function(c){return c.kind==="innovation";});}]
];
var KIND={gold:["🥇","Gold · 1st Position"],silver:["🥈","Silver · 2nd Position"],bronze:["🥉","Bronze · 3rd Position"],participation:["🎖","Participation"],fastest:["⚡","Fastest Engineer"],precision:["🎯","Precision Expert"],innovation:["💡","Innovation Award"]};
function passportHTML(){
 var s=state(),pct=s.next?Math.max(0,Math.min(100,Math.round((s.xp-s.base)/(s.next-s.base)*100))):100,done=0,h="";
 var rows=ACH.map(function(a){var ok=false;try{ok=!!a[2](s);}catch(e){}if(ok)done++;return "<div class='ach "+(ok?"on":"")+"'><span>"+(ok?"✓":"○")+"</span><div><b>"+esc(a[0])+"</b><small>"+esc(a[1])+"</small></div></div>";}).join("");
 h+="<div class='pp'><div class='pplv'><div class='ppn'>Level "+s.level+"</div><div class='ppt'>"+esc(s.title)+"</div></div><div class='ppx'><div class='ppbar'><i style='width:"+pct+"%'></i></div><small>"+s.xp+" XP"+(s.next?" · "+(s.next-s.xp)+" XP to "+esc(s.nextTitle):" · top level")+"</small></div></div>";
 h+="<div class='sub'>"+s.missions.length+" mission"+(s.missions.length===1?"":"s")+" completed · "+done+" / "+ACH.length+" passport stamps</div><div class='achs'>"+rows+"</div>";
 if(s.certs.length){h+="<h4 class='ph'>My certificates</h4>"+s.certs.map(function(c){var k=KIND[c.kind]||KIND.participation;return "<div class='lrow'><span>"+k[0]+" <b>"+esc(c.title)+"</b><br><small>"+esc(k[1])+" · "+new Date(c.issued).toLocaleDateString()+"</small></span><span><button data-act='viewCert' data-id='"+esc(c.id)+"'>View</button></span></div>";}).join("");}
 return h;}

// ---------------- QR (lazy) ----------------
var qrP=null;
function loadQR(){if(window.QRCode)return Promise.resolve();if(qrP)return qrP;qrP=new Promise(function(res,rej){var s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";s.onload=res;s.onerror=function(){qrP=null;rej(new Error("qr"));};document.head.appendChild(s);});return qrP;}
function qrCanvas(text,size){return loadQR().then(function(){var d=document.createElement("div");d.style.cssText="position:fixed;left:-9999px;top:0";document.body.appendChild(d);new window.QRCode(d,{text:text,width:size,height:size,correctLevel:window.QRCode.CorrectLevel.M});var c=d.querySelector("canvas");var out=null;if(c){out=document.createElement("canvas");out.width=out.height=size;out.getContext("2d").drawImage(c,0,0,size,size);}d.remove();return out;}).catch(function(){return null;});}
function verifyUrl(id){return location.origin+"/?verify="+encodeURIComponent(id);}

// ---------------- certificate drawing ----------------
var PUR="#4c1d95",PUR2="#6d28d9",GOLD="#c99a1d",GOLD2="#f2d27a";
var THEME={gold:{head:"CERTIFICATE OF EXCELLENCE",line:"First Position",badge:"Gold distinction  ·  1st Position",medal:"1",m1:"#b8860b",m2:"#f5d76e"},
 silver:{head:"CERTIFICATE OF ACHIEVEMENT",line:"Second Position",badge:"Silver distinction  ·  2nd Position",medal:"2",m1:"#7d8793",m2:"#e3e7eb"},
 bronze:{head:"CERTIFICATE OF ACHIEVEMENT",line:"Third Position",badge:"Bronze distinction  ·  3rd Position",medal:"3",m1:"#a0612a",m2:"#e0a878"},
 participation:{head:"CERTIFICATE OF PARTICIPATION",line:"Participant",badge:"Robotics Competition Participant",medal:"★",m1:GOLD,m2:GOLD2},
 fastest:{head:"AWARD OF DISTINCTION",line:"Fastest Engineer",badge:"Fastest successful completion",medal:"⚡",m1:GOLD,m2:GOLD2},
 precision:{head:"AWARD OF DISTINCTION",line:"Precision Expert",badge:"Fewest collisions and cleanest solution",medal:"◎",m1:GOLD,m2:GOLD2},
 innovation:{head:"INNOVATION AWARD",line:"Innovative Solution",badge:"Best solution under engineering criteria",medal:"✦",m1:GOLD,m2:GOLD2}};
function fit(g,text,maxW,size,weight,family,min){var s=size;while(s>(min||24)){g.font=weight+" "+s+"px "+family;if(g.measureText(text).width<=maxW)break;s-=2;}return s;}
function gear(g,x,y,r,col,hole){g.save();g.translate(x,y);g.fillStyle=col;for(var i=0;i<10;i++){g.rotate(Math.PI/5);g.fillRect(-r*0.13,-r*1.22,r*0.26,r*0.42);}g.beginPath();g.arc(0,0,r,0,7);g.fill();g.fillStyle=hole||"#fff";g.beginPath();g.arc(0,0,r*0.45,0,7);g.fill();g.restore();}
var sigCache={};
function loadSig(id){if(!id)return Promise.resolve(null);if(sigCache[id])return sigCache[id];return sigCache[id]=fetch("/api/sig/get",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({id:id})}).then(function(r){return r.json();}).then(function(j){return new Promise(function(res){if(!j.data)return res(null);var im=new Image();im.onload=function(){res(im);};im.onerror=function(){res(null);};im.src=j.data;});}).catch(function(){delete sigCache[id];return null;});}
function sigBlock(g,x,img,name,title,SAN,SER){
 g.textAlign="center";
 if(img){var mw=330,mh=110,r=Math.min(mw/img.width,mh/img.height);g.save();g.globalCompositeOperation="multiply";g.drawImage(img,x-img.width*r/2,1052-img.height*r,img.width*r,img.height*r);g.restore();}
 g.strokeStyle="#555";g.lineWidth=2;g.beginPath();g.moveTo(x-190,1058);g.lineTo(x+190,1058);g.stroke();
 g.fillStyle="#1a1a1a";var s1=fit(g,name,370,30,"700",SER,20);g.font="700 "+s1+"px "+SER;g.fillText(name,x,1092);
 g.fillStyle="#555";var s2=fit(g,title,370,22,"",SAN,15);g.font=s2+"px "+SAN;g.fillText(title,x,1120);}
function drawCert(cv,c,qr,imgs){
 var W=1754,H=1240,g;cv.width=W;cv.height=H;g=cv.getContext("2d");var T=THEME[c.kind]||THEME.participation,SER="Georgia,'Times New Roman',serif",SAN="'Segoe UI',Arial,sans-serif";imgs=imgs||{};
 g.fillStyle="#fff";g.fillRect(0,0,W,H);
 // purple + gold borders
 g.strokeStyle=PUR;g.lineWidth=26;g.strokeRect(36,36,W-72,H-72);
 g.strokeStyle=GOLD;g.lineWidth=6;g.strokeRect(66,66,W-132,H-132);g.lineWidth=2;g.strokeRect(80,80,W-160,H-160);
 [[80,80],[W-80,80],[80,H-80],[W-80,H-80]].forEach(function(p){g.fillStyle=GOLD;g.beginPath();g.arc(p[0],p[1],18,0,7);g.fill();g.fillStyle=PUR;g.beginPath();g.arc(p[0],p[1],8,0,7);g.fill();});
 g.globalAlpha=.05;gear(g,W/2,H/2+40,340,PUR,"#fff");g.globalAlpha=1;
 // logo
 g.fillStyle=PUR;g.beginPath();g.arc(W/2,150,54,0,7);g.fill();g.strokeStyle=GOLD;g.lineWidth=5;g.beginPath();g.arc(W/2,150,54,0,7);g.stroke();gear(g,W/2,150,28,GOLD2,PUR);
 g.textAlign="center";g.fillStyle=PUR;g.font="700 34px "+SAN;g.fillText("MILESTONE MINDS",W/2,246);g.fillStyle=GOLD;g.font="600 22px "+SAN;g.fillText("ROBOTICS LAB",W/2,274);
 g.fillStyle=PUR;var hs=fit(g,T.head,W-360,66,"700",SER,36);g.font="700 "+hs+"px "+SER;g.fillText(T.head,W/2,366);
 g.strokeStyle=GOLD;g.lineWidth=3;g.beginPath();g.moveTo(W/2-240,390);g.lineTo(W/2+240,390);g.stroke();
 g.fillStyle="#444";g.font="italic 30px "+SER;g.fillText("This certificate is proudly presented to",W/2,444);
 var ns=fit(g,c.name||"",W-400,100,"italic 700",SER,40);g.fillStyle="#1a1a1a";g.font="italic 700 "+ns+"px "+SER;g.fillText(c.name||"",W/2,552);
 g.strokeStyle=GOLD;g.lineWidth=2;g.beginPath();g.moveTo(W/2-430,576);g.lineTo(W/2+430,576);g.stroke();
 g.fillStyle="#444";g.font="28px "+SER;g.fillText("In recognition of outstanding performance in robotics, programming,",W/2,630);g.fillText("computational thinking and problem-solving.",W/2,668);
 // details
 var d=new Date(c.issued||Date.now()),ds=d.toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});
 var rows=[["Competition",String(c.title||"")],["Award",T.line],["School",c.school||"—"],["Date",ds],["Score",(c.score||c.score===0)&&c.kind!=="innovation"?String(c.score):"—"]];
 var y=730;rows.forEach(function(r){g.textAlign="right";g.fillStyle=GOLD;g.font="700 24px "+SAN;g.fillText(r[0].toUpperCase(),W/2-30,y);g.textAlign="left";g.fillStyle="#222";var sz=fit(g,r[1],640,28,"600",SAN,16);g.font="600 "+sz+"px "+SAN;g.fillText(r[1],W/2+10,y);y+=42;});
 // medal
 g.textAlign="center";g.fillStyle=T.m1;g.beginPath();g.arc(W/2,980,38,0,7);g.fill();g.fillStyle=T.m2;g.beginPath();g.arc(W/2,980,29,0,7);g.fill();g.fillStyle=PUR;g.font="700 32px "+SAN;g.fillText(T.medal,W/2,992);
 // signatures: founder (always), teacher (only when verified + authorised + signature on file)
 var hasT=!!(c.t&&c.t.name&&imgs.t);
 sigBlock(g,hasT?400:520,imgs.f,(c.f&&c.f.name)||"Godfrey Odhiambo",(c.f&&c.f.title)||"Founder, Milestone Minds",SAN,SER);
 if(hasT)sigBlock(g,W-400,imgs.t,c.t.name,(c.t.title||"Teacher")+(c.t.school?", "+c.t.school:""),SAN,SER);
 // QR + id
 var qx=hasT?W/2:W-330;
 if(qr){g.drawImage(qr,qx-70,1010,140,140);g.textAlign="center";g.fillStyle="#555";g.font="16px "+SAN;g.fillText("Scan to verify",qx,1166);}
 else{g.textAlign="center";g.fillStyle="#555";g.font="16px "+SAN;g.fillText(location.host+"/?verify="+c.id,qx,1100);}
 g.textAlign="center";g.fillStyle=PUR;g.font="700 22px "+SAN;g.fillText("Certificate ID: "+c.id+(c.ver>1?"  (v"+c.ver+")":""),W/2,H-104);
 return cv;}
function renderCert(c){var cv=document.createElement("canvas");return Promise.all([qrCanvas(verifyUrl(c.id),160),loadSig(c.f&&c.f.sig),loadSig(c.t&&c.t.sig)]).then(function(a){return drawCert(cv,c,a[0],{f:a[1],t:a[2]});});}
function toBlob(cv){return new Promise(function(res){cv.toBlob(res,"image/png");});}
function saveBlob(blob,name){var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},1500);}
function fname(c){return (String(c.name||"learner").replace(/[^A-Za-z0-9]+/g,"_")+"_"+c.kind+"_"+c.id).slice(0,90)+".png";}
function showCert(c,canDl){
 var o=document.getElementById("certModal");if(o)o.remove();o=document.createElement("div");o.id="certModal";
 o.innerHTML="<div class='cmBox'><div class='cmTop'><b>Certificate</b><span><button id='cmDl' class='p'"+(canDl===false?" disabled":"")+">⬇ Download</button> <button id='cmX'>Close</button></span></div><div class='cmCv'><div class='sub'>Preparing…</div></div><div class='sub'>Verify: "+esc(verifyUrl(c.id))+"</div></div>";
 document.body.appendChild(o);var cvBox=o.querySelector(".cmCv"),cvv=null;
 o.querySelector("#cmX").onclick=function(){o.remove();};
 renderCert(c).then(function(cv){cvv=cv;cvBox.innerHTML="";cv.style.cssText="width:100%;height:auto;border-radius:6px";cvBox.appendChild(cv);});
 o.querySelector("#cmDl").onclick=function(){if(!cvv)return;toBlob(cvv).then(function(b){saveBlob(b,fname(c));});};}
// ---------------- ZIP (store only) ----------------
var CRC=null;function crc32(u8){if(!CRC){CRC=new Uint32Array(256);for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;CRC[n]=c>>>0;}}var x=0xFFFFFFFF;for(var i=0;i<u8.length;i++)x=CRC[(x^u8[i])&255]^(x>>>8);return (x^0xFFFFFFFF)>>>0;}
function zip(files){var parts=[],cen=[],off=0,enc=new TextEncoder();
 files.forEach(function(f){var nm=enc.encode(f.name),crc=crc32(f.data),sz=f.data.length;var lh=new DataView(new ArrayBuffer(30));lh.setUint32(0,0x04034b50,true);lh.setUint16(4,20,true);lh.setUint16(6,0x0800,true);lh.setUint16(8,0,true);lh.setUint16(10,0,true);lh.setUint16(12,0x21,true);lh.setUint32(14,crc,true);lh.setUint32(18,sz,true);lh.setUint32(22,sz,true);lh.setUint16(26,nm.length,true);lh.setUint16(28,0,true);
  parts.push(new Uint8Array(lh.buffer),nm,f.data);
  var ch=new DataView(new ArrayBuffer(46));ch.setUint32(0,0x02014b50,true);ch.setUint16(4,20,true);ch.setUint16(6,20,true);ch.setUint16(8,0x0800,true);ch.setUint16(10,0,true);ch.setUint16(12,0,true);ch.setUint16(14,0x21,true);ch.setUint32(16,crc,true);ch.setUint32(20,sz,true);ch.setUint32(24,sz,true);ch.setUint16(28,nm.length,true);ch.setUint32(42,off,true);cen.push(new Uint8Array(ch.buffer),nm);
  off+=30+nm.length+sz;});
 var cs=0;cen.forEach(function(a){cs+=a.length;});var end=new DataView(new ArrayBuffer(22));end.setUint32(0,0x06054b50,true);end.setUint16(8,files.length,true);end.setUint16(10,files.length,true);end.setUint32(12,cs,true);end.setUint32(16,off,true);
 return new Blob(parts.concat(cen,[new Uint8Array(end.buffer)]),{type:"application/zip"});}
function zipCerts(list,zname,progress){var files=[],i=0;
 function next(){if(i>=list.length)return Promise.resolve(zip(files));var c=list[i++];if(progress)progress(i,list.length);return renderCert(c).then(toBlob).then(function(b){return b.arrayBuffer();}).then(function(ab){files.push({name:fname(c),data:new Uint8Array(ab)});return next();});}
 return next().then(function(b){saveBlob(b,zname);});}
// ---------------- public verification page (?verify=ID) ----------------
function verifyPage(id){
 var o=document.createElement("div");o.id="verifyModal";o.innerHTML="<div class='cmBox'><div class='cmTop'><b>Certificate verification</b><button id='vX'>Close</button></div><div id='vBody' class='sub'>Checking…</div></div>";document.body.appendChild(o);o.querySelector("#vX").onclick=function(){o.remove();try{history.replaceState(null,"",location.pathname);}catch(e){}};
 fetch("/api/cert/verify",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({id:id})}).then(function(r){return r.json();}).then(function(j){var b=o.querySelector("#vBody");
  if(j&&j.found){var c=j.cert,k=KIND[c.kind]||KIND.participation,st=j.status,cls=st==="Valid"?"vok":"vbad";
   b.innerHTML="<div class='"+cls+"'>"+(st==="Valid"?"✓ Valid certificate":st==="Superseded"?"⚠ Superseded by a corrected certificate"+(j.replacedBy?" ("+esc(j.replacedBy)+")":""):"✗ This certificate has been revoked")+"</div><table class='ct'><tr><td>Certificate ID</td><td>"+esc(c.id)+(c.ver>1?" (v"+c.ver+")":"")+"</td></tr><tr><td>Awarded to</td><td><b>"+esc(c.name)+"</b></td></tr><tr><td>Competition</td><td>"+esc(c.title)+"</td></tr><tr><td>Position / award</td><td>"+k[0]+" "+esc(k[1])+"</td></tr><tr><td>School</td><td>"+esc(c.school)+"</td></tr><tr><td>Date</td><td>"+new Date(c.issued).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})+"</td></tr><tr><td>Issued by</td><td>"+esc(j.issuer||"Milestone Minds")+"</td></tr><tr><td>Signed by</td><td>"+esc(c.f.name)+(c.t?" &amp; "+esc(c.t.name):"")+"</td></tr><tr><td>Status</td><td><b>"+esc(st)+"</b></td></tr></table>";}
  else b.innerHTML="<div class='vbad'>✗ No certificate was found with this ID.</div><p class='sub'>Check the ID on the certificate. It may be mistyped.</p>";}).catch(function(){o.querySelector("#vBody").textContent="Could not reach the verification service. Check your internet connection.";});}
var m=/[?&]verify=([^&#]+)/.exec(location.search);if(m)setTimeout(function(){verifyPage(decodeURIComponent(m[1]));},400);

window.MMR={state:state,passportHTML:passportHTML,showCert:showCert,zipCerts:zipCerts,renderCert:renderCert,KIND:KIND,setCerts:function(l){jset("mmr_certs",l||[]);},certs:certs,ACH:ACH};
})();
