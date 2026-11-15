// ===== Extras: scores, Club, sharing, portfolio, real-hardware export =====
(function(){
var C=Core,$=function(id){return document.getElementById(id);};
var LSS="mm_scores",LSP="mm_player",LSF="mm_club";
function jget(k,d){try{var v=JSON.parse(localStorage.getItem(k)||"null");return v===null?d:v;}catch(e){return d;}}
function jset(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
var PAR={drive:1,detour:5,sensor:4,line:7,maze:7,farm:5,cargo:4,greenhouse:5,beacon:8,compass:8,homeeyes:7,armpick:12,armstack:20,armsort:25,armbelt:14,armbelt2:22,dronefirst:4,dronegate:4,dronewall:6,dronenight:9,boda:11,solar:5,escarp:6};
function countBlocks(p){var n=0;(p||[]).forEach(function(b){n++;if(b.c)n+=countBlocks(b.c);if(b.e)n+=countBlocks(b.e);});return n;}
function starsFor(id,blocks){var par=PAR[id];if(!par)return 1;return blocks<=par?3:blocks<=Math.ceil(par*1.5)?2:1;}
function starStr(n){return "★★★".slice(0,n)+"☆☆☆".slice(0,3-n);}
function better(a,b){if(!b)return true;if(a.stars!==b.stars)return a.stars>b.stars;if(a.blocks!==b.blocks)return a.blocks<b.blocks;return a.time<b.time;}
function nameOf(){return (jget(LSP,"")||"").trim();}
window.MM_onWin=function(lvl,prog,time){
 var id=C.LEVELS[lvl].id;if(id==="sandbox")return;
 var blocks=countBlocks(prog),stars=starsFor(id,blocks),t=Math.round(time*10)/10,all=jget(LSS,{}),prev=all[id],rec={blocks:blocks,time:t,stars:stars,at:Date.now()};
 var code="";try{code=C.codeFor(prog);}catch(e){}
 var isBest=better(rec,prev);
 if(isBest){rec.code=code.slice(0,4000);rec.name=C.LEVELS[lvl].name;all[id]=rec;jset(LSS,all);}
 var el=$("scoreline");if(el){el.style.display="block";el.innerHTML="<b>"+starStr(stars)+"</b> "+blocks+" blocks · "+t+" s"+(PAR[id]?" · par "+PAR[id]+" blocks":"")+(isBest?(prev?" · <span class='nb'>new best!</span>":" · first win"):" · best: "+starStr(prev.stars)+" "+prev.blocks+" blocks");}
 renderClub();
};
// hide the score line when a new run starts
document.addEventListener("click",function(e){var t=e.target;if(t&&t.id==="run"){var el=$("scoreline");if(el)el.style.display="none";}},true);
function totals(){var all=jget(LSS,{}),ids=Object.keys(all),s=0;ids.forEach(function(k){s+=all[k].stars;});return {stars:s,done:ids.length,max:C.LEVELS.length*3-3};}
// ---- Club ----
function encode(o){return btoa(unescape(encodeURIComponent(JSON.stringify(o))));}
function decode(s){return JSON.parse(decodeURIComponent(escape(atob(s.trim()))));}
function myCode(){var t=totals();return "MM1:"+encode({n:nameOf()||"Learner",s:t.stars,m:t.done,t:Date.now()});}
function renderClub(){
 var box=$("clubBoard");if(!box)return;var t=totals(),me={n:nameOf()||"You",s:t.stars,m:t.done,me:true},list=[me].concat(jget(LSF,[]).map(function(f,i){f.i=i;return f;}));
 list.sort(function(a,b){return b.s-a.s||b.m-a.m;});
 box.innerHTML="";
 list.forEach(function(r,k){var d=document.createElement("div");d.className="crow"+(r.me?" me":"");d.innerHTML="<span class='rk'>"+(k+1)+"</span><span class='cn'></span><span class='cs'>"+r.s+" ★</span><span class='cm'>"+r.m+" missions</span>";d.querySelector(".cn").textContent=r.n+(r.me?" (you)":"");
  if(!r.me){var x=document.createElement("button");x.textContent="✕";x.className="sm";x.onclick=function(){var f=jget(LSF,[]);f.splice(r.i,1);jset(LSF,f);renderClub();};d.appendChild(x);}box.appendChild(d);});
 var ms=$("clubMissions");if(ms){var all=jget(LSS,{});ms.innerHTML="";C.LEVELS.forEach(function(l){if(l.id==="sandbox")return;var s=all[l.id],d=document.createElement("div");d.className="crow";d.innerHTML="<span class='cn'>"+l.name+"</span><span class='cs'>"+(s?starStr(s.stars):"☆☆☆")+"</span><span class='cm'>"+(s?s.blocks+" blocks · "+s.time+" s":"not yet")+"</span>";ms.appendChild(d);});}
 $("clubTotal").textContent=t.stars+" ★ from "+t.done+" missions";
}
function copyText(txt,done){try{navigator.clipboard.writeText(txt).then(function(){done&&done(true);},function(){fb();});}catch(e){fb();}function fb(){try{var ta=document.createElement("textarea");ta.value=txt;document.body.appendChild(ta);ta.select();document.execCommand("copy");document.body.removeChild(ta);done&&done(true);}catch(e){done&&done(false);}}}
function say(id,t,ok){var e=$(id);if(!e)return;e.textContent=t;e.style.color=ok===false?"#fca5a5":"#86efac";}
if($("playerName")){$("playerName").value=nameOf();$("playerName").oninput=function(){jset(LSP,this.value.slice(0,24));renderClub();};}
if($("clubCopy"))$("clubCopy").onclick=function(){var c=myCode();$("clubMine").value=c;copyText(c,function(ok){say("clubMsg",ok?"Code copied. Send it to a friend.":"Select the code and copy it.",ok);});};
if($("clubAdd"))$("clubAdd").onclick=function(){try{var s=$("clubIn").value.trim();if(s.indexOf("MM1:")!==0)throw 0;var o=decode(s.slice(4));if(typeof o.s!=="number")throw 0;var f=jget(LSF,[]).filter(function(x){return x.n!==o.n;});f.push({n:String(o.n).slice(0,24),s:o.s,m:o.m||0});jset(LSF,f);$("clubIn").value="";say("clubMsg","Added "+o.n+" to your club.");renderClub();}catch(e){say("clubMsg","That code is not valid.",false);}};
// ---- Share ----
function shareObj(){var P=window.MM.prog();return {v:1,lvl:C.LEVELS[C.st.lvl].id,prog:P,design:C.exportDesign()};}
function shareCode(){return "MMS:"+encode(shareObj());}
function loadShare(code){try{if(code.indexOf("MMS:")!==0)throw 0;var o=decode(code.slice(4));var i=C.LEVELS.map(function(l){return l.id;}).indexOf(o.lvl);if(i<0||!Array.isArray(o.prog))throw 0;if(o.design)C.importDesign(o.design);window.MM.setLevel(i);window.MM.setProg(o.prog);window.MM.partsChanged();window.MM.showTab("play");return true;}catch(e){return false;}}
if($("shareCopy"))$("shareCopy").onclick=function(){var c=shareCode();$("shareBox").value=c;copyText(c,function(ok){say("shareMsg",ok?"Share code copied. Anyone can paste it into Load.":"Select the code and copy it.",ok);});if(navigator.share){try{navigator.share({title:"My Milestone Minds robot program",text:c}).catch(function(){});}catch(e){}}};
if($("shareLoad"))$("shareLoad").onclick=function(){var ok=loadShare($("shareBox").value.trim());if(!ok)say("shareMsg","That share code is not valid.",false);else say("shareMsg","Loaded! Press Run to test it.");};
setTimeout(function(){try{var m=/[#&]share=([^&]+)/.exec(location.hash);if(m&&loadShare(decodeURIComponent(m[1]))){var e=$("msg");if(e){e.textContent="Loaded a shared program. Press Run to test it.";e.className="ok";}}}catch(e){}},300);
// ---- Portfolio ----
function esc(s){return String(s).replace(/[&<>]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;"}[c];});}
function portfolioHTML(){var all=jget(LSS,{}),t=totals(),n=nameOf()||"Learner",d=new Date().toLocaleDateString();
 var rows="",codes="";C.LEVELS.forEach(function(l){var s=all[l.id];if(!s)return;rows+="<tr><td>"+esc(l.name)+"</td><td>"+starStr(s.stars)+"</td><td>"+s.blocks+"</td><td>"+s.time+" s</td></tr>";if(s.code)codes+="<h3>"+esc(l.name)+"</h3><pre>"+esc(s.code)+"</pre>";});
 return "<!DOCTYPE html><html><head><meta charset='utf-8'><title>"+esc(n)+" - Robotics portfolio</title><meta name='viewport' content='width=device-width,initial-scale=1'><style>body{font-family:system-ui,sans-serif;max-width:760px;margin:24px auto;padding:0 16px;color:#0f172a}h1{margin-bottom:0}.cert{border:4px double #0ea5e9;border-radius:12px;padding:20px;text-align:center;margin:16px 0}.cert .big{font-size:26px;font-weight:800}table{width:100%;border-collapse:collapse}td,th{border-bottom:1px solid #e2e8f0;padding:6px;text-align:left}pre{background:#0f172a;color:#e2e8f0;padding:10px;border-radius:8px;overflow:auto;font-size:12px}@media print{pre{white-space:pre-wrap}}</style></head><body><h1>Robotics portfolio</h1><p>Milestone Minds Robotics Lab · "+d+"</p><div class='cert'><div>Certificate of achievement</div><div class='big'>"+esc(n)+"</div><div>completed <b>"+t.done+"</b> robotics missions and earned <b>"+t.stars+" stars</b> in the Milestone Minds Virtual Robotics Lab.</div></div><h2>Missions</h2><table><tr><th>Mission</th><th>Stars</th><th>Blocks</th><th>Time</th></tr>"+(rows||"<tr><td colspan=4>No missions completed yet.</td></tr>")+"</table><h2>My programs</h2>"+(codes||"<p>Complete a mission to add your code here.</p>")+"<p style='color:#64748b;font-size:12px'>Tip: use your browser's Print option to save this page as a PDF.</p></body></html>";}
var DLK=null;try{if(window.claude&&claude.use)claude.use("downloads").then(function(d){DLK=d||null;}).catch(function(){});}catch(e){}
function download(name,text,type,cb){
 function fallback(){try{var b=new Blob([text],{type:type||"text/plain"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(a.href);},500);cb&&cb(true);}catch(e){cb&&cb(false);}}
 if(DLK){try{DLK.save({filename:name,data:text}).then(function(){cb&&cb(true);},function(){cb&&cb(false);});return;}catch(e){}}
 // Android/iOS app (Capacitor WebView): blob downloads do not work, so save to cache and open the share sheet
 try{var CAP=window.Capacitor;if(CAP&&CAP.isNativePlatform&&CAP.isNativePlatform()&&CAP.registerPlugin){var FS=CAP.registerPlugin("Filesystem"),SH=CAP.registerPlugin("Share");
  FS.writeFile({path:name,data:text,directory:"CACHE",encoding:"utf8"}).then(function(r){return SH.share({title:name,url:r.uri,dialogTitle:"Save or share "+name});}).then(function(){cb&&cb(true);},function(e){cb&&cb(!!(e&&/cancel/i.test(e.message||"")));});return;}}catch(e){}
 fallback();}
if($("portBtn"))$("portBtn").onclick=function(){download("portfolio.html",portfolioHTML(),"text/html",function(ok){say("portMsg",ok?"Portfolio saved. Open it and print to PDF.":"Download was cancelled or blocked. Try again.",ok);});};
// ---- Real hardware export ----
function sketchText(){return C.codeFor(window.MM.prog());}
function isArduino(){return /Arduino sketch/.test(sketchText());}
function helperHeader(){
return '// MilestoneBot.h - starter helper library for Arduino Uno + L298N motor driver + HC-SR04 ultrasonic sensors.\n// Generated by Milestone Minds Robotics Lab. Put this file in the same folder as your .ino sketch.\n// CALIBRATE the two numbers below on your real robot (measure how far/how much it moves in one second).\n#ifndef MILESTONEBOT_H\n#define MILESTONEBOT_H\n#include <Arduino.h>\n#define CM_PER_SEC 20.0     // distance the robot drives in 1 second at full speed\n#define DEG_PER_SEC 180.0   // degrees the robot turns in 1 second when spinning\n#define MOTOR_PWM 200       // 0-255\nenum Side {FRONT, LEFT, RIGHT};\n#ifdef L298N_ENA\nvoid botBegin(){pinMode(L298N_ENA,OUTPUT);pinMode(L298N_IN1,OUTPUT);pinMode(L298N_IN2,OUTPUT);pinMode(L298N_IN3,OUTPUT);pinMode(L298N_IN4,OUTPUT);pinMode(L298N_ENB,OUTPUT);\n#ifdef US_FRONT_TRIG\n pinMode(US_FRONT_TRIG,OUTPUT);pinMode(US_FRONT_ECHO,INPUT);\n#endif\n#ifdef US_LEFT_TRIG\n pinMode(US_LEFT_TRIG,OUTPUT);pinMode(US_LEFT_ECHO,INPUT);\n#endif\n#ifdef US_RIGHT_TRIG\n pinMode(US_RIGHT_TRIG,OUTPUT);pinMode(US_RIGHT_ECHO,INPUT);\n#endif\n}\nvoid motorsStop(){analogWrite(L298N_ENA,0);analogWrite(L298N_ENB,0);digitalWrite(L298N_IN1,LOW);digitalWrite(L298N_IN2,LOW);digitalWrite(L298N_IN3,LOW);digitalWrite(L298N_IN4,LOW);}\nvoid _drive(bool l,bool r,unsigned long ms){digitalWrite(L298N_IN1,l);digitalWrite(L298N_IN2,!l);digitalWrite(L298N_IN3,r);digitalWrite(L298N_IN4,!r);analogWrite(L298N_ENA,MOTOR_PWM);analogWrite(L298N_ENB,MOTOR_PWM);delay(ms);motorsStop();}\nvoid forwardCm(float cm){_drive(true,true,(unsigned long)(abs(cm)/CM_PER_SEC*1000));}\nvoid backwardCm(float cm){_drive(false,false,(unsigned long)(abs(cm)/CM_PER_SEC*1000));}\nvoid turnLeft(float deg){_drive(false,true,(unsigned long)(abs(deg)/DEG_PER_SEC*1000));}\nvoid turnRight(float deg){_drive(true,false,(unsigned long)(abs(deg)/DEG_PER_SEC*1000));}\n#else\nvoid botBegin(){}\nvoid motorsStop(){}\nvoid forwardCm(float){}\nvoid backwardCm(float){}\nvoid turnLeft(float){}\nvoid turnRight(float){}\n#endif\nfloat _ping(int trig,int echo){digitalWrite(trig,LOW);delayMicroseconds(2);digitalWrite(trig,HIGH);delayMicroseconds(10);digitalWrite(trig,LOW);unsigned long d=pulseIn(echo,HIGH,30000);return d?d*0.0343/2:400;}\nfloat distanceCm(Side s){\n#ifdef US_FRONT_TRIG\n if(s==FRONT)return _ping(US_FRONT_TRIG,US_FRONT_ECHO);\n#endif\n#ifdef US_LEFT_TRIG\n if(s==LEFT)return _ping(US_LEFT_TRIG,US_LEFT_ECHO);\n#endif\n#ifdef US_RIGHT_TRIG\n if(s==RIGHT)return _ping(US_RIGHT_TRIG,US_RIGHT_ECHO);\n#endif\n return 400;}\n// ---- Not implemented yet: fill these in for the sensors you added (they return a safe default) ----\nbool lineSensor(Side){return false;}      // TODO: read your IR line sensor pin\nfloat soilPercent(){return 100;}           // TODO: analogRead soil sensor and map to 0-100\nfloat lightPercent(){return 50;}           // TODO\nfloat temperatureC(){return 25;}           // TODO\nfloat humidityPercent(){return 50;}        // TODO\nfloat headingDeg(){return 0;}              // TODO: gyro / compass\nfloat distanceTravelledCm(){return 0;}     // TODO: wheel encoder\nbool bumperPressed(){return false;}        // TODO\nvoid pumpRun(int ms){delay(ms);}           // TODO: switch the pump relay for ms milliseconds\nvoid relaySet(bool on){(void)on;}          // TODO\n#endif\n';}
function buildGuide(){var out=["MILESTONE MINDS ROBOTICS LAB - BUILD GUIDE","Mission: "+C.LEVELS[C.st.lvl].name,"","PARTS TO BUY OR BORROW","----------------------"];
 C.st.parts.forEach(function(i){var p=C.PARTS[i.pid]||{};out.push("- "+(p.name||i.pid)+(i.mount?"   [placed: "+i.mount+(i.slot&&i.slot!==i.mount?" / "+i.slot:"")+"]":"")+(i.pins&&i.pins.length?"   pins: "+i.pins.join(", "):""));});
 out.push("","HOW TO USE","----------","1. Wire each part to the pins listed above (the #define lines in the sketch use the same pin numbers).","2. Put MilestoneBot.h in the same folder as the .ino file, then open the .ino in the Arduino IDE.","3. Choose the board (Arduino Uno), pick the port and press Upload.","4. Lift the wheels off the table for the first test. Calibrate CM_PER_SEC and DEG_PER_SEC in MilestoneBot.h by measuring how far and how much the robot really moves.","","Note: the helper file drives the L298N motors and HC-SR04 sensors. Other sensors have TODO functions you can fill in. The simulator is idealised, so a real robot needs small tuning.");
 return out.join("\n");}
function hwMsg(t,ok){say("hwMsg",t,ok);}
if($("dlSketch"))$("dlSketch").onclick=function(){var a=isArduino(),n=a?"robot.ino":"robot.py";download(n,sketchText(),"text/plain",function(ok){hwMsg(ok?"Saved "+n+".":"Download cancelled or blocked. Use Copy code instead.",ok);});};
if($("dlHeader"))$("dlHeader").onclick=function(){download("MilestoneBot.h",helperHeader(),"text/plain",function(ok){hwMsg(ok?"Saved MilestoneBot.h. Keep it next to robot.ino.":"Download cancelled or blocked.",ok);});};
if($("dlGuide"))$("dlGuide").onclick=function(){download("build-guide.txt",buildGuide(),"text/plain",function(ok){hwMsg(ok?"Saved the parts and wiring guide.":"Download cancelled or blocked.",ok);});};

// ---- Teacher tools (offline: learners send report codes, teacher builds the class table) ----
var LSC="mm_class",LST="mm_teacher";
function clsOf(){return ((jget(LSC,"")||"")+"").trim().toUpperCase();}
function myReport(){var all=jget(LSS,{}),s={};Object.keys(all).forEach(function(k){s[k]=[all[k].stars,all[k].blocks,all[k].time];});return "MM2:"+encode({v:2,c:clsOf(),n:nameOf()||"Learner",s:s,t:Date.now()});}
if($("classCode")){$("classCode").value=clsOf();$("classCode").oninput=function(){this.value=this.value.toUpperCase();jset(LSC,this.value.slice(0,16));};}
if($("repCopy"))$("repCopy").onclick=function(){if(!nameOf()){say("repMsg","Type your name in the Robotics Club box above first.",false);return;}if(!clsOf()){say("repMsg","Enter your class code first.",false);return;}var c=myReport();$("repBox").value=c;copyText(c,function(ok){say("repMsg",ok?"Report copied. Send it to your teacher.":"Select the report and copy it.",ok);});};
function tdata(){return jget(LST,{cls:"",st:{}});}
function missionIds(){return C.LEVELS.filter(function(l){return l.id!=="sandbox";});}
function renderTeacher(){var box=$("tTable");if(!box)return;var d=tdata();if($("tClass")&&document.activeElement!==$("tClass"))$("tClass").value=d.cls||"";
 var names=Object.keys(d.st).sort(function(a,b){return d.st[a].n.localeCompare(d.st[b].n);}),ms=missionIds();
 if(!names.length){box.innerHTML="";$("tStats").textContent="No learners yet.";return;}
 var h="<table><tr><th>Learner</th><th>★</th><th>Done</th>"+ms.map(function(l){return "<th>"+l.name.split(" ")[0]+"</th>";}).join("")+"<th></th></tr>",tot=0,done=0,per={};
 names.forEach(function(k){var r=d.st[k],stars=0,dn=0;var row=ms.map(function(l){var x=r.s[l.id];if(x){stars+=x[0];dn++;per[l.id]=(per[l.id]||0)+1;return "<td class='c"+x[0]+"'>"+"★".repeat(x[0])+"</td>";}return "<td class='c0'>–</td>";}).join("");tot+=stars;done+=dn;
  h+="<tr><td class='nm'>"+esc(r.n)+"</td><td>"+stars+"</td><td>"+dn+"</td>"+row+"<td><button class='sm' data-cert='"+esc(k)+"'>🎓</button> <button class='sm' data-del='"+esc(k)+"'>✕</button></td></tr>";});
 box.innerHTML=h+"</table>";
 var hard=ms.map(function(l){return [l.name,per[l.id]||0];}).sort(function(a,b){return a[1]-b[1];})[0];
 $("tStats").textContent=names.length+" learners · average "+(tot/names.length).toFixed(1)+" stars · "+(done/names.length).toFixed(1)+" missions each"+(hard?" · fewest finished: "+hard[0]+" ("+hard[1]+")":"");
 [].forEach.call(box.querySelectorAll("[data-del]"),function(b){b.onclick=function(){var d2=tdata();delete d2.st[b.getAttribute("data-del")];jset(LST,d2);renderTeacher();};});
 [].forEach.call(box.querySelectorAll("[data-cert]"),function(b){b.onclick=function(){var d2=tdata(),r=d2.st[b.getAttribute("data-cert")];download("certificate-"+r.n.replace(/[^\w]+/g,"_")+".html",certHTML(r),"text/html",function(ok){say("tMsg",ok?"Certificate saved. Open it and print.":"Download cancelled or blocked.",ok);});};});}
function certHTML(r){var ms=missionIds(),stars=0,dn=0,rows="";ms.forEach(function(l){var x=r.s[l.id];if(x){stars+=x[0];dn++;rows+="<tr><td>"+esc(l.name)+"</td><td>"+starStr(x[0])+"</td><td>"+x[1]+"</td></tr>";}});
 return "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Certificate - "+esc(r.n)+"</title><meta name='viewport' content='width=device-width,initial-scale=1'><style>body{font-family:Georgia,serif;max-width:720px;margin:30px auto;padding:0 16px;color:#0f172a}.cert{border:8px double #0ea5e9;border-radius:14px;padding:34px 20px;text-align:center}.t{font-size:15px;letter-spacing:3px;color:#0369a1}.big{font-size:38px;font-weight:700;margin:14px 0}.sm{color:#475569}table{width:100%;border-collapse:collapse;margin-top:20px;font-family:system-ui,sans-serif;font-size:13px}td,th{border-bottom:1px solid #e2e8f0;padding:5px;text-align:left}.sig{display:flex;justify-content:space-around;margin-top:46px;font-family:system-ui,sans-serif;font-size:13px}.sig div{border-top:1px solid #0f172a;padding-top:4px;min-width:160px}</style></head><body><div class='cert'><div class='t'>MILESTONE MINDS VIRTUAL ROBOTICS LAB</div><h1>Certificate of Achievement</h1><div class='sm'>This certifies that</div><div class='big'>"+esc(r.n)+"</div><div>has completed <b>"+dn+" of "+ms.length+"</b> robotics missions and earned <b>"+stars+" stars</b>"+(r.c?" in class <b>"+esc(r.c)+"</b>":"")+".</div><table><tr><th>Mission</th><th>Stars</th><th>Blocks</th></tr>"+rows+"</table><div class='sig'><div>Teacher</div><div>Date: "+new Date().toLocaleDateString()+"</div></div></div></body></html>";}
if($("tClass"))$("tClass").oninput=function(){var d=tdata();d.cls=this.value.toUpperCase().slice(0,16);this.value=d.cls;jset(LST,d);};
if($("tAdd"))$("tAdd").onclick=function(){try{var s=$("tIn").value.trim();if(s.indexOf("MM2:")!==0)throw 0;var o=decode(s.slice(4));if(!o.n||typeof o.s!=="object")throw 0;var d=tdata();if(d.cls&&o.c!==d.cls){say("tMsg","This report is for class "+(o.c||"(none)")+", not "+d.cls+".",false);return;}var k=String(o.n).trim().toLowerCase();d.st[k]={n:String(o.n).slice(0,30),c:o.c||"",s:o.s,t:o.t||0};jset(LST,d);$("tIn").value="";say("tMsg","Added "+o.n+".");renderTeacher();}catch(e){say("tMsg","That report is not valid. Ask the learner to copy it again.",false);}};
if($("tClear"))$("tClear").onclick=function(){if(this.dataset.sure){jset(LST,{cls:tdata().cls,st:{}});this.dataset.sure="";this.textContent="🗑 Clear class";renderTeacher();return;}this.dataset.sure="1";this.textContent="Tap again to confirm";var b=this;setTimeout(function(){b.dataset.sure="";b.textContent="🗑 Clear class";},3000);};
if($("tCsv"))$("tCsv").onclick=function(){var d=tdata(),ms=missionIds(),lines=[["Learner","Class","Total stars","Missions done"].concat(ms.map(function(l){return l.name;})).join(",")];Object.keys(d.st).forEach(function(k){var r=d.st[k],st=0,dn=0,cells=ms.map(function(l){var x=r.s[l.id];if(x){st+=x[0];dn++;return x[0];}return "";});lines.push(['"'+r.n.replace(/"/g,'""')+'"',r.c||"",st,dn].concat(cells).join(","));});download("class-progress.csv",lines.join("\n"),"text/csv",function(ok){say("tMsg",ok?"CSV saved. Open it in Excel or Sheets.":"Download cancelled or blocked.",ok);});};
renderTeacher();

// ---- Python mode ----
(function(){
 var inp=$("pyIn");if(!inp||typeof PyX==="undefined")return;
 function lv(){return C.LEVELS[C.st.lvl];}
 function kind(){var l=lv();return l.drone?"drone":l.arm?"arm":"wheeled";}
 var COND={wheeled:'bot.distance("front") < 30',arm:'arm.cube_colour() == "red"',drone:'drone.altitude() < 100'};
 function key(){return "mm_py_"+lv().id;}
 var curLvl=-1;
 function chips(){var box=$("pyChips");box.innerHTML="";PyX.CMDS[kind()].forEach(function(c){var txt=c,label=c;if(c==="if"){txt="if "+COND[kind()]+":\n    ";label="if …:";}else if(c==="else:"){txt="else:\n    ";}else if(/^(for|while) /.test(c)){txt=c+"\n    ";}else if(/ < | > | == |^bot\.line|^belt\.box/.test(c)){txt="if "+c+":\n    ";label=c;}
  var b=document.createElement("button");b.textContent=label;b.onclick=function(){ins(txt);};box.appendChild(b);});}
 function ins(txt){var v=inp.value,p=inp.selectionStart||v.length,ls=v.lastIndexOf("\n",p-1)+1,line=v.slice(ls,p),ind=/^ */.exec(line)[0],pre="";
  if(line.trim()){pre="\n"+ind;}else{pre=""; }
  var body=txt.split("\n").map(function(l,i){return i===0?l:ind+l;}).join("\n");
  var out=v.slice(0,p)+pre+body+v.slice(p);inp.value=out;var np=p+pre.length+body.length;inp.focus();try{inp.setSelectionRange(np,np);}catch(e){}save();}
 function save(){try{localStorage.setItem(key(),inp.value);}catch(e){}}
 function load(){var v="";try{v=localStorage.getItem(key())||"";}catch(e){}inp.value=v||"# Write your program here.\n# Example:\n# bot.forward(50)\n";$("pyMsg").textContent="";$("pyMsg").className="sub";}
 inp.addEventListener("input",save);
 inp.addEventListener("keydown",function(e){if(e.key==="Tab"){e.preventDefault();var p=inp.selectionStart;inp.value=inp.value.slice(0,p)+"    "+inp.value.slice(inp.selectionEnd);inp.setSelectionRange(p+4,p+4);}
  if(e.key==="Enter"){var v=inp.value,p=inp.selectionStart,ls=v.lastIndexOf("\n",p-1)+1,line=v.slice(ls,p),ind=/^ */.exec(line)[0];if(/:\s*$/.test(line))ind+="    ";if(ind){e.preventDefault();inp.value=v.slice(0,p)+"\n"+ind+v.slice(inp.selectionEnd);inp.setSelectionRange(p+1+ind.length,p+1+ind.length);save();}}});
 function msg(t,cls){$("pyMsg").textContent=t;$("pyMsg").className="sub "+(cls||"");}
 function selectLine(n){var ls=inp.value.split("\n"),a=0;for(var i=0;i<n-1&&i<ls.length;i++)a+=ls[i].length+1;try{inp.focus();inp.setSelectionRange(a,a+(ls[n-1]||"").length);}catch(e){}}
 function mode3(m){var py=m==="py",ask=m==="ask";$("pyCard").style.display=py?"block":"none";$("vibeCard").style.display=ask?"block":"none";$("blocksCard").style.display=(py||ask)?"none":"block";$("modePy").classList.toggle("on",py);$("modeAsk").classList.toggle("on",ask);$("modeBlocks").classList.toggle("on",m==="blocks");if(py){curLvl=-1;sync();}}
 function mode(py){mode3(py?"py":"blocks");}
 $("modeAsk").onclick=function(){mode3("ask");};
 $("modePy").onclick=function(){mode(true);};$("modeBlocks").onclick=function(){mode(false);};
 var PYGLUE=__PYGLUE__,pyo=null,pyLoading=false,PYVER="0.26.4",PYBASE="https://cdn.jsdelivr.net/pyodide/v"+PYVER+"/full/";
 function out(t,clr){var o=$("pyOut");o.style.display="block";if(clr)o.textContent="";o.textContent+=t;o.scrollTop=o.scrollHeight;}
 window.MM_live={do:function(b){return C.liveDo(b);},sense:function(n,a){return C.sense(n,a);},tick:function(){return new Promise(function(res,rej){setTimeout(function(){C.liveAlive()?res():rej(new Error("The run was stopped."));},0);});}};
 function loadPy(){if(pyo)return Promise.resolve(pyo);return new Promise(function(res,rej){
  var done=false,t=setTimeout(function(){if(!done){done=true;rej(new Error("Loading took too long."));}},90000);
  function fail(e){if(!done){done=true;clearTimeout(t);rej(e);}}
  function go(){window.loadPyodide({indexURL:PYBASE}).then(function(p){p.setStdout({batched:function(x){out(x+"\n");}});p.setStderr({batched:function(x){out(x+"\n");}});return p.runPythonAsync(PYGLUE).then(function(){if(!done){done=true;clearTimeout(t);pyo=p;res(p);}});}).catch(fail);}
  if(window.loadPyodide)return go();
  var sc=document.createElement("script");sc.src=PYBASE+"pyodide.js";sc.onload=go;sc.onerror=function(){fail(new Error("Could not download Python."));};document.head.appendChild(sc);});}
 function runFull(){if(pyLoading)return;var src=inp.value;
  if(!src.trim()){msg("Write some Python first.","err");return;}
  pyLoading=true;$("pyRun").disabled=true;msg(pyo?"Starting…":"Downloading Python (about 10 MB). Please wait…","ok");
  loadPy().then(function(p){pyLoading=false;$("pyRun").disabled=false;
   if(!window.MM.startLive()){return;}
   out("",true);msg("Running full Python…","ok");var tok={};runFull.tok=tok;
   p.globals.set("_src",src);p.globals.set("_gen",(runFull.n=(runFull.n||0)+1));
   p.runPythonAsync("await _run(_src,_gen)").then(function(j){if(runFull.tok!==tok)return;var r=JSON.parse(j);
    if(r.ok){C.liveEnd();msg("Program finished. Watch the robot…","ok");}
    else if(r.stopped){msg("","");}
    else{var m="Line "+(r.line||"?")+": "+r.msg;msg(m,"err");if(r.line)selectLine(r.line);out(m+"\n");C.liveFail("Python error"+(r.line?" on line "+r.line:"")+": "+r.msg);window.MM.announce();}
   }).catch(function(e){msg("Python crashed: "+e.message,"err");C.liveFail("Python crashed");window.MM.announce();});
  }).catch(function(e){pyLoading=false;$("pyRun").disabled=false;msg("Full Python could not load here ("+e.message+"). Using the simple Python mode instead.","err");$("pyFull").checked=false;try{localStorage.setItem("mm_pyfull","0");}catch(x){}});}
 try{$("pyFull").checked=localStorage.getItem("mm_pyfull")==="1";}catch(e){}
 $("pyFull").onchange=function(){try{localStorage.setItem("mm_pyfull",this.checked?"1":"0");}catch(e){}if(!this.checked)$("pyOut").style.display="none";};
 $("pyRun").onclick=function(){if($("pyFull").checked){runFull();return;}
  var r=PyX.compile(inp.value);if(r.errors.length){var e=r.errors[0];msg("Line "+e.line+": "+e.msg+(r.errors.length>1?"  (+"+(r.errors.length-1)+" more)":""),"err");selectLine(e.line);return;}
  if(!r.prog.length){msg("Write at least one command first.","err");return;}
  window.MM.setProg(r.prog);msg("OK: "+X_count(r.prog)+" blocks. Running…","ok");$("run").click();};
 function X_count(p){return window.MM_extras.countBlocks(p);}
 $("pyFromBlocks").onclick=function(){var P=window.MM.prog();if(!P.length){msg("Your block program is empty. Build one in Blocks mode first.","err");return;}var py=C.codeFor(P,"python"),a=py.indexOf("bot.begin(PINS)");if(a>=0){var nl=py.indexOf("\n",a);py=py.slice(nl+1).replace(/^\n+/,"");}else{py=py.replace(/^(#.*\n|import .*\n|from .*\n)+\n*/,"");}
  inp.value="import time\n\n"+py;save();msg("Your blocks, as Python. Edit it and press Run.","ok");};
 function sync(){if(C.st.lvl!==curLvl&&$("pyCard").style.display!=="none"){curLvl=C.st.lvl;chips();load();}}
 setInterval(sync,400);
 window.MM_py={compile:PyX.compile,mode:mode,mode3:mode3,setCode:function(t){inp.value=t;save();},kind:kind};
})();
renderClub();

// ---- Mila vibe coding: describe it, get blocks + Python ----
(function(){
 if(!$("vibeGo")||typeof PyX==="undefined")return;
 var busy=false,last=null;function USE(n){try{return (typeof claude!=="undefined"&&claude.use)?claude.use(n):Promise.resolve(null);}catch(e){return Promise.resolve(null);}}
 function lv(){return C.LEVELS[C.st.lvl];}
 function plain(h){return String(h||"").replace(/<[^>]+>/g," ").replace(/&[a-z]+;/g," ").replace(/\s+/g," ").trim();}
 function say(t,cls){$("vibeMsg").textContent=t;$("vibeMsg").className="sub "+(cls||"");}
 function kind(){return window.MM_py.kind();}
 function allowed(){var k=kind();return PyX.ACTS.map(function(a){return a[0];}).filter(function(n){
   if(k==="wheeled")return /^(bot|time)\./.test(n)&&n!=="drone.forward";
   if(k==="arm")return /^(arm|belt|time)\./.test(n)||/^bot\.(gripper|beep|stop)/.test(n);
   return /^(drone|time)\./.test(n)||/^bot\.turn_/.test(n);});}
 function prompt(extra){var k=kind(),l=lv();
  return "You are Mila, a friendly robotics mentor for school learners in Kenya (ages 12-18). A learner described, in plain words, what their robot should do. Write a Python program for the robot simulator.\n\n"+
  "Current mission: "+plain(l.name+". "+l.mission)+"\nRobot type: "+k+"\n\n"+
  "STRICT RULES (the program is compiled by a small teaching compiler, so anything else fails):\n"+
  "- Only these commands, one per line: "+allowed().join(", ")+"\n"+
  "- Command arguments must be plain numbers or a quoted string (no variables, no maths). Distances in cm, turns in degrees, sleep in seconds. bot.led(\"red\"), bot.beep(0.3), bot.pump(1.2) are allowed where listed.\n"+
  "- Loops: `for _ in range(N):` with a number, or `while True:`\n"+
  "- Decisions: `if CONDITION:` / `elif CONDITION:` / `else:` using ONLY conditions like these: "+PyX.CMDS[k].filter(function(c){return / < | > | == |^bot\\.line|^belt\\.box/.test(c);}).join(" ; ")+"\n"+
  "  (distance sensors accept \"front\", \"left\" or \"right\"; line sensors \"left\" or \"right\")\n"+
  "- No functions, classes, variables, imports other than `import time`, print, lists or maths.\n"+
  "- Keep it short and readable, with a `#` comment on the key lines.\n"+
  "- If the request is impossible for this robot, write the closest safe program and say so in the explanation.\n\n"+
  "Learner's request: \""+extra.req+"\"\n"+(extra.err?"\nYour previous program had these problems, fix them:\n"+extra.err+"\nPrevious program:\n"+extra.prev+"\n":"")+
  "\nReturn ONLY JSON: {\"python\": \"<the program, with \\n for new lines>\", \"explain\": \"<2-3 short sentences in Mila's friendly voice: what the robot will do and one idea they just used (like a loop or an if)>\"}";}
 function errText(r){return r.errors.slice(0,4).map(function(e){return "Line "+e.line+": "+e.msg;}).join("\n");}
 function show(py,exp,r){last={py:py,prog:r.prog};window.MM.setProg(r.prog);window.MM_py.setCode(py);
  $("vibeRes").style.display="block";$("vibeExp").textContent="🤖 Mila: "+exp;$("vibeCode").textContent=py;
  say("Done: "+window.MM_extras.countBlocks(r.prog)+" blocks added to your program. Press Run to test it.","ok");}
 function offline(req){var t=req.toLowerCase(),out=["import time",""],k=kind();
  var parts=t.split(/,|\bthen\b|\band\b|\.|;/).map(function(x){return x.trim();}).filter(Boolean);
  function num(x,d){var m=/(\d+(?:\.\d+)?)/.exec(x);return m?+m[1]:d;}
  parts.forEach(function(p){
   if(/square/.test(p)){out.push("for _ in range(4):","    bot.forward("+num(p,50)+")","    bot.turn_right(90)");}
   else if(/take ?off/.test(p)&&k==="drone")out.push("drone.takeoff()");
   else if(/land/.test(p)&&k==="drone")out.push("drone.land()");
   else if(/\bup\b|rise|climb/.test(p)&&k==="drone")out.push("drone.up("+num(p,50)+")");
   else if(/\bdown\b|descend/.test(p)&&k==="drone")out.push("drone.down("+num(p,50)+")");
   else if(/back/.test(p)&&k==="wheeled")out.push("bot.backward("+num(p,30)+")");
   else if(/forward|ahead|straight|drive|go|move/.test(p))out.push((k==="drone"?"drone":"bot")+".forward("+num(p,50)+")");
   else if(/left/.test(p))out.push("bot.turn_left("+num(p,90)+")");
   else if(/right|turn/.test(p))out.push("bot.turn_right("+num(p,90)+")");
   else if(/beep/.test(p)&&k==="wheeled")out.push("bot.beep(0.3)");
   else if(/wait|pause|sleep/.test(p))out.push("time.sleep("+num(p,1)+")");
   else if(/stop/.test(p)&&k==="wheeled")out.push("bot.stop()");});
  return out.length>2?out.join("\n")+"\n":null;}
 function ask(){if(busy)return;var req=$("vibeIn").value.trim();if(!req){say("Tell Mila what the robot should do first.","err");return;}
  busy=true;$("vibeGo").disabled=true;say("Mila is thinking…","ok");
  var tries=0;
  function done(){busy=false;$("vibeGo").disabled=false;}
  function localFallback(why){var py=offline(req);
   if(py){var r=PyX.compile(py);if(!r.errors.length){show(py,"I could not reach my AI brain ("+why+"), so I wrote this from simple keywords. Try short steps like 'forward 50, turn right 90'.",r);return done();}}
   $("vibeRes").style.display="none";say("Mila's AI is not available here ("+why+"). Try short steps like “forward 50, turn right 90, beep”.","err");done();}
  USE("sample").then(function(sample){
   if(!sample)return localFallback("AI is not enabled in this view");
   function go(extra){
    sample.json(prompt(extra),{modelTier:"default",cache:false}).then(function(v){
     var py=String((v&&v.python)||"").replace(/\\n/g,"\n").trim()+"\n",exp=String((v&&v.explain)||"Here is a program for your idea.");
     var r=PyX.compile(py);
     if(!r.errors.length&&r.prog.length){show(py,exp,r);return done();}
     if(tries++<1){say("Mila is polishing the program…","ok");return go({req:req,err:r.errors.length?errText(r):"The program had no commands.",prev:py});}
     window.MM_py.setCode(py);$("vibeRes").style.display="none";say("Mila's program still has a problem: "+(r.errors[0]?"line "+r.errors[0].line+": "+r.errors[0].msg:"empty")+". Try rewording your idea. Her draft is in the Python editor.","err");done();
    }).catch(function(e){var c=e&&e.code;if(c==="not_granted")return localFallback("permission was not given");if(c==="rate_limited"){say("Mila needs a short rest. Try again in a minute.","err");return done();}localFallback((e&&e.message)||"AI error");});}
   go({req:req});
  }).catch(function(){localFallback("AI is not available");});}
 $("vibeGo").onclick=ask;
 $("vibeBlocks").onclick=function(){window.MM_py.mode(false);var el=$("blocksCard");if(el&&el.scrollIntoView)el.scrollIntoView({behavior:"smooth",block:"start"});};
 $("vibePy").onclick=function(){window.MM_py.mode(true);var el=$("pyCard");if(el&&el.scrollIntoView)el.scrollIntoView({behavior:"smooth",block:"start"});};
 $("vibeRun").onclick=function(){if(!last)return;window.MM.setProg(last.prog);if(C.st.status==="run"){$("run").click();}$("run").click();};
 // optional voice input
 USE("dictation").then(function(d){if(!d)return;var b=$("vibeMic");b.style.display="";var on=false;
  d.onFinal(function(x){var v=$("vibeIn").value;$("vibeIn").value=(v&&!/\s$/.test(v)?v+" ":v)+x.text;});
  d.onState(function(s){on=s.state==="listening";b.textContent=on?"⏹ Stop":"🎤 Speak";});
  b.onclick=function(){if(on){d.stop();}else{d.start().catch(function(){});}};}).catch(function(){});
})();

// ---- Welcome guide ----
(function(){var o=$("welcome");if(!o)return;
 function show(){o.classList.add("on");try{$("wGo").focus();}catch(e){}}
 function hide(){o.classList.remove("on");try{localStorage.setItem("mm_seen","1");}catch(e){}}
 $("wGo").onclick=function(){hide();try{window.MM.showTab("play");window.MM.setLevel(0);}catch(e){}};
 o.addEventListener("click",function(e){if(e.target===o)hide();});
 document.addEventListener("keydown",function(e){if(e.key==="Escape"&&o.classList.contains("on"))hide();});
 $("helpBtn").onclick=show;
 var seen=false;try{seen=localStorage.getItem("mm_seen")==="1"||/[#&](lv|tab)=/.test(location.hash)||Object.keys(C.st).length===0;}catch(e){}
 if(!seen&&!(window.MM_noWelcome))setTimeout(show,600);
})();

// ---- Device features: wake lock, hand driving (stick/keys/tilt), camera light sensor ----
(function(){
 // wake lock while a run is active
 var wl=null;
 function lock(){try{if(navigator.wakeLock&&!wl){navigator.wakeLock.request("screen").then(function(l){wl=l;l.addEventListener("release",function(){wl=null;});}).catch(function(){});}}catch(e){}}
 function unlock(){try{if(wl){wl.release();wl=null;}}catch(e){}}
 setInterval(function(){if(C.st.status==="run")lock();else unlock();},700);

 document.addEventListener("keydown",function(e){var t=e.target&&e.target.tagName;if(t==="INPUT"||t==="TEXTAREA"||t==="SELECT"||t==="BUTTON"||t==="SUMMARY")return;
  if(e.key===" "||e.code==="Space"){e.preventDefault();$("run").click();}else if(e.key==="Escape"&&C.st.status==="run"){$("run").click();}});
 // hand driving
 var man=$("manCard");if(!man)return;
 var f=0,w=0,keys={},joy={x:0,y:0},tilt={f:0,w:0},gp={f:0,w:0},tiltOn=false,base=null,driving=false;
 function push(){var kf=(keys.up?1:0)-(keys.down?1:0),kw=(keys.right?1:0)-(keys.left?1:0);
  var ff=kf||(-joy.y)||tilt.f||gp.f,ww=kw||joy.x||tilt.w||gp.w;if(driving&&C.st.status==="run")C.manual(ff,ww);}
 function say(t,c){$("manMsg").textContent=t;$("manMsg").className="sub "+(c||"");}
 $("manGo").onclick=function(){if(window.MM.startManual()){driving=true;say("Driving. Use the stick, arrow keys / WASD, or tilt.","ok");}else{driving=false;say(C.st.msg||"Cannot drive here.","err");}};
 var K={ArrowUp:"up",w:"up",W:"up",ArrowDown:"down",s:"down",S:"down",ArrowLeft:"left",a:"left",A:"left",ArrowRight:"right",d:"right",D:"right"};
 document.addEventListener("keydown",function(e){var k=K[e.key];if(!k||!driving)return;var t=e.target&&e.target.tagName;if(t==="INPUT"||t==="TEXTAREA"||t==="SELECT")return;keys[k]=true;e.preventDefault();push();});
 document.addEventListener("keyup",function(e){var k=K[e.key];if(!k)return;keys[k]=false;push();});

 // game controller (Gamepad API)
 var gpLast=false,gpTimer=null;
 function gpPoll(){var pads=(navigator.getGamepads&&navigator.getGamepads())||[],p=null;for(var i=0;i<pads.length;i++){if(pads[i]&&pads[i].connected){p=pads[i];break;}}
  if(!p){gp.f=gp.w=0;return;}
  function dz(v){return Math.abs(v)<0.15?0:v;}
  var x=dz(p.axes[0]||0),y=dz(p.axes[1]||0);if(p.buttons[12]&&p.buttons[12].pressed)y=-1;if(p.buttons[13]&&p.buttons[13].pressed)y=1;if(p.buttons[14]&&p.buttons[14].pressed)x=-1;if(p.buttons[15]&&p.buttons[15].pressed)x=1;
  var a=p.buttons[0]&&p.buttons[0].pressed;if(a&&!gpLast){if(C.st.status==="run"){$("run").click();}else{$("manGo").click();}}gpLast=!!a;
  gp.f=-y;gp.w=x;push();}
 window.addEventListener("gamepadconnected",function(e){say("Controller connected: "+e.gamepad.id.slice(0,40)+". Stick to drive, A button to start/stop.","ok");if(!gpTimer)gpTimer=setInterval(gpPoll,50);});
 window.addEventListener("gamepaddisconnected",function(){gp.f=gp.w=0;push();});
 // joystick
 var J=$("joy"),KN=$("joyK"),act=false;
 function jm(e){var r=J.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=(e.clientX-cx)/(r.width/2),dy=(e.clientY-cy)/(r.height/2),m=Math.hypot(dx,dy);if(m>1){dx/=m;dy/=m;}
  joy.x=Math.abs(dx)<0.12?0:dx;joy.y=Math.abs(dy)<0.12?0:dy;KN.style.left=(55+dx*55)+"px";KN.style.top=(55+dy*55)+"px";push();}
 function jr(){act=false;joy.x=joy.y=0;KN.style.left="55px";KN.style.top="55px";push();}
 J.addEventListener("pointerdown",function(e){act=true;try{J.setPointerCapture(e.pointerId);}catch(x){}if(!driving)$("manGo").click();jm(e);});
 J.addEventListener("pointermove",function(e){if(act)jm(e);});J.addEventListener("pointerup",jr);J.addEventListener("pointercancel",jr);
 // tilt
 function onOri(e){if(e.beta==null)return;if(!base)base={b:e.beta,g:e.gamma||0};var g=(e.gamma||0)-base.g,b=e.beta-base.b;
  tilt.w=Math.abs(g)<6?0:Math.max(-1,Math.min(1,g/30));tilt.f=Math.abs(b)<6?0:Math.max(-1,Math.min(1,-b/30));push();}
 function tiltStart(){window.addEventListener("deviceorientation",onOri);tiltOn=true;base=null;$("manTilt").textContent="📱 Tilt: on";say("Hold the phone like a steering board. The position now is neutral; tilt left/right to steer, forward/back to drive.","ok");if(!driving)$("manGo").click();}
 function tiltStop(){window.removeEventListener("deviceorientation",onOri);tiltOn=false;tilt.f=tilt.w=0;$("manTilt").textContent="📱 Tilt: off";push();}
 $("manTilt").onclick=function(){if(tiltOn){tiltStop();return;}
  if(typeof DeviceOrientationEvent==="undefined"){say("This device has no tilt sensor.","err");return;}
  if(typeof DeviceOrientationEvent.requestPermission==="function"){DeviceOrientationEvent.requestPermission().then(function(r){if(r==="granted")tiltStart();else say("Tilt permission was not given.","err");}).catch(function(){say("Tilt is not available here.","err");});}
  else{var got=false;function probe(e){if(e.beta!=null)got=true;}window.addEventListener("deviceorientation",probe);setTimeout(function(){window.removeEventListener("deviceorientation",probe);if(got)tiltStart();else say("No tilt data from this device (laptops usually have none). Use the stick or arrow keys.","err");},600);}};
 // hide on drone/arm missions; stop driving when run ends
 setInterval(function(){var l=C.LEVELS[C.st.lvl];man.style.display=(l.drone||l.arm)?"none":"";if(C.st.status!=="run"&&driving){driving=false;if(tiltOn)tiltStop();}},400);
 // camera light sensor
 var stream=null,vid=null,cv=document.createElement("canvas"),tm=null;cv.width=16;cv.height=12;
 function cm(t,c){$("camMsg").textContent=t;$("camMsg").className="sub "+(c||"");}
 function camOff(){clearInterval(tm);tm=null;if(stream){stream.getTracks().forEach(function(t){t.stop();});stream=null;}if(vid){vid.srcObject=null;}$("camGo").style.display="";$("camStop").style.display="none";$("camBarW").style.display="none";$("camRead").textContent="";}
 $("camStop").onclick=function(){camOff();cm("Camera stopped.","");};
 $("camGo").onclick=function(){if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){cm("Camera is not available in this view. Try opening the lab in your browser directly.","err");return;}
  navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:160},height:{ideal:120}},audio:false}).then(function(s){stream=s;vid=vid||document.createElement("video");vid.muted=true;vid.playsInline=true;vid.srcObject=s;vid.play();
   $("camGo").style.display="none";$("camStop").style.display="";$("camBarW").style.display="block";cm("Cover the camera with your hand to make it dark. Point it at a window or torch to make it bright.","ok");
   var ctx=cv.getContext("2d",{willReadFrequently:true}),sm=null;
   tm=setInterval(function(){try{ctx.drawImage(vid,0,0,16,12);var d=ctx.getImageData(0,0,16,12).data,sum=0;for(var i=0;i<d.length;i+=4)sum+=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];var v=sum/(d.length/4)/255;sm=sm==null?v:sm*0.6+v*0.4;
    var n=window.MM_bb?window.MM_bb.setLight(sm):0;$("camBar").style.width=Math.round(sm*100)+"%";$("camRead").textContent="Light: "+Math.round(sm*100)+"%  "+(n?"→ sent to "+n+" light sensor"+(n>1?"s":"")+" in your circuit":"(add a Light sensor (LDR) on the breadboard to use it)");}catch(e){}},250);
  }).catch(function(e){cm(e&&e.name==="NotAllowedError"?"Camera permission was not given.":"Camera could not start here ("+((e&&e.name)||"error")+").","err");});};
})();

// ---- Live link: mirror the simulator onto a real Arduino robot over Web Serial ----
(function(){
 var b=$("serBtn");if(!b)return;
 var port=null,writer=null,reader=null,open=false,buf="",lastSend=0,idleSent=true;
 function say(t,c){$("serMsg").textContent=t;$("serMsg").className="sub "+(c||"");}
 function mon(t){var m=$("serMon");m.style.display="block";m.textContent+=t;if(m.textContent.length>3000)m.textContent=m.textContent.slice(-2000);m.scrollTop=m.scrollHeight;}
 var SK='// Milestone Minds LIVE sketch: lets the simulator drive this real robot over USB.\n// Hardware: Arduino Uno + L298N motor driver (+ optional HC-SR04 at the front).\n// Wiring (PWM pins on purpose, so speed control works). Change the numbers if you wired differently.\n#define ENA 5   // left motor speed (PWM)\n#define IN1 7\n#define IN2 8\n#define ENB 6   // right motor speed (PWM)\n#define IN3 9\n#define IN4 10\n#define TRIG 11 // optional HC-SR04 front sensor\n#define ECHO 12\n#define WATCHDOG_MS 600  // motors stop if the computer goes quiet\nunsigned long lastCmd=0;\nvoid setMotor(int en,int a,int b,int v){ // v = -100..100\n  if(v>100)v=100; if(v<-100)v=-100;\n  digitalWrite(a,v>0); digitalWrite(b,v<0);\n  analogWrite(en,map(abs(v),0,100,0,255));\n}\nvoid stopAll(){setMotor(ENA,IN1,IN2,0);setMotor(ENB,IN3,IN4,0);}\nfloat ping(){digitalWrite(TRIG,LOW);delayMicroseconds(2);digitalWrite(TRIG,HIGH);delayMicroseconds(10);digitalWrite(TRIG,LOW);unsigned long d=pulseIn(ECHO,HIGH,30000);return d?d*0.0343/2:400;}\nvoid setup(){\n  Serial.begin(115200);\n  pinMode(ENA,OUTPUT);pinMode(IN1,OUTPUT);pinMode(IN2,OUTPUT);pinMode(ENB,OUTPUT);pinMode(IN3,OUTPUT);pinMode(IN4,OUTPUT);\n  pinMode(TRIG,OUTPUT);pinMode(ECHO,INPUT);\n  stopAll();Serial.println("MilestoneBot live ready");\n}\nvoid loop(){\n  if(Serial.available()){\n    String line=Serial.readStringUntil(\'\\n\');line.trim();lastCmd=millis();\n    if(line.startsWith("M ")){int sp=line.indexOf(\' \',2);int l=line.substring(2,sp).toInt();int r=line.substring(sp+1).toInt();setMotor(ENA,IN1,IN2,l);setMotor(ENB,IN3,IN4,r);}\n    else if(line=="S"){stopAll();Serial.println("OK stop");}\n    else if(line=="P"){Serial.print("D ");Serial.println(ping());}\n  }\n  if(millis()-lastCmd>WATCHDOG_MS)stopAll();\n}\n';
 $("serSketch").onclick=function(){download("milestonebot_live.ino",SK,"text/plain",function(ok){say(ok?"Saved milestonebot_live.ino. Open it in the Arduino IDE and upload it to your Uno.":"Download cancelled or blocked.",ok?"ok":"err");});};
 if(!("serial" in navigator)){b.disabled=true;b.textContent="🔌 Not supported here";say("This browser has no Web Serial. Use Chrome or Edge on a laptop (Android Chrome 148+ is arriving). You can still download the Live sketch.","err");return;}
 function send(t){if(!writer)return;try{writer.write(new TextEncoder().encode(t));}catch(e){}}
 function readLoop(){var dec=new TextDecoder();(function pump(){reader.read().then(function(r){if(r.done){return;}buf+=dec.decode(r.value);var ls=buf.split("\n");buf=ls.pop();ls.forEach(function(l){mon(l.trim()+"\n");});pump();}).catch(function(){});})();}
 function connect(){navigator.serial.requestPort().then(function(p){port=p;return port.open({baudRate:115200});}).then(function(){
   writer=port.writable.getWriter();reader=port.readable.getReader();open=true;b.textContent="⏏ Disconnect";say("Connected. Press Run or drive by hand and the real robot will follow. Keep it on a stand the first time!","ok");readLoop();
  }).catch(function(e){open=false;say(e&&e.name==="NotFoundError"?"No port chosen.":"Could not open the port ("+((e&&e.message)||"error")+"). Close the Arduino IDE serial monitor and try again.","err");});}
 function disconnect(){send("S\n");open=false;try{reader.cancel();}catch(e){}setTimeout(function(){try{writer.releaseLock();}catch(e){}try{reader.releaseLock();}catch(e){}try{port.close();}catch(e){}writer=reader=port=null;b.textContent="🔌 Connect robot";say("Disconnected.","");},120);}
 b.onclick=function(){if(open)disconnect();else connect();};
 setInterval(function(){if(!open)return;var st=C.st,run=st.status==="run"&&$("serMirror").checked;
  if(run){var vmax=40,wmax=130,f=Math.max(-1,Math.min(1,st.v/vmax)),t=Math.max(-1,Math.min(1,st.w/wmax))*0.8,l=f+t,r=f-t,m=Math.max(1,Math.abs(l),Math.abs(r));
   send("M "+Math.round(l/m*100)+" "+Math.round(r/m*100)+"\n");idleSent=false;}
  else if(!idleSent){send("S\n");idleSent=true;}},100);
})();

// ---- Echo sonar lab: phone speaker + microphone as a time-of-flight distance sensor ----
(function(){
 var go=$("echoGo");if(!go||typeof Echo==="undefined")return;
 var ctx=null,stream=null,proc=null,running=false,cap=null,need=0,hist=[],lastOk=0,chirpI=null,chirpQ=null,cb=null,band="a";
 function say(t,c){$("echoMsg").textContent=t;$("echoMsg").className="sub "+(c||"");}
 function temp(){return +$("echoT").value;}
 function showC(){var c=Echo.speedOfSound(temp());$("echoTv").textContent=temp()+"°C";$("echoC").textContent="Speed of sound at this temperature: "+c.toFixed(1)+" m/s. Warmer air = faster sound.";}
 $("echoT").oninput=showC;showC();
 function plot(r){var cv=$("echoPlot"),g=cv.getContext("2d"),W=cv.width,H=cv.height;g.clearRect(0,0,W,H);if(!r||!r.res)return;var res=r.res,mx=0,i;for(i=0;i<res.length;i++)if(res[i]>mx)mx=res[i];if(mx<=0)return;
  g.strokeStyle="#334155";g.beginPath();for(var d=50;d<=300;d+=50){var x=d/300*W;g.moveTo(x,0);g.lineTo(x,H);}g.stroke();
  g.fillStyle="#64748b";g.font="9px sans-serif";for(var d2=50;d2<=300;d2+=50)g.fillText(d2+"cm",d2/300*W-14,H-2);
  var sr=ctx.sampleRate,c=Echo.speedOfSound(temp()),a=r.a-r.d0;g.strokeStyle="#38bdf8";g.beginPath();
  for(i=0;i<res.length;i++){var cm=(a+i)/sr*c/2*100,x2=cm/300*W,y=H-4-(res[i]/mx)*(H-14);if(i===0)g.moveTo(x2,y);else g.lineTo(x2,y);}g.stroke();
  if(r.ok){var xm=r.cm/300*W;g.strokeStyle="#22c55e";g.beginPath();g.moveTo(xm,0);g.lineTo(xm,H);g.stroke();}}
 function result(r){plot(r);
  if(r&&r.ok){hist.push(r.cm);if(hist.length>5)hist.shift();var s=hist.slice().sort(function(a,b){return a-b;}),m=s[s.length>>1];lastOk=Date.now();window.__echoCm=m;
   $("echoCm").textContent=Math.round(m)+" cm";var q=r.peak/(r.noise||1);$("echoQ").textContent="signal "+(q>30?"strong":q>12?"good":"weak");}
  else{$("echoQ").textContent="no clear echo";if(Date.now()-lastOk>1500){$("echoCm").textContent="-- cm";window.__echoCm=null;}}}
 function ping(){if(!running||cap)return;cap=[];var got=0;need=Math.round(ctx.sampleRate*0.3);
  var b=ctx.createBuffer(1,chirpI.length,ctx.sampleRate);b.getChannelData(0).set(chirpI);var src=ctx.createBufferSource();src.buffer=b;var gn=ctx.createGain();gn.gain.value=0.9;src.connect(gn);gn.connect(ctx.destination);src.start();}
 function onAudio(e){if(!cap)return;var d=e.inputBuffer.getChannelData(0);cap.push(new Float32Array(d));var n=0;cap.forEach(function(x){n+=x.length;});
  if(n>=need){var rec=new Float32Array(n),o=0;cap.forEach(function(x){rec.set(x,o);o+=x.length;});cap=null;
   var r=null;try{r=Echo.measure(rec,ctx.sampleRate,Echo.speedOfSound(temp()),{sens:6},chirpI,chirpQ);}catch(err){}
   result(r);if(running)setTimeout(ping,120);}}
 function build(){var sr=ctx.sampleRate,f=band==="q"?[15000,20000]:[2000,9000];chirpI=Echo.chirp(sr,f[0],f[1],8);chirpQ=Echo.chirpQ(sr,f[0],f[1],8);}
 $("echoBand").onchange=function(){band=this.value;if(ctx)build();if(band==="q")say("Quiet chirp: many phone speakers are weak above 15 kHz. If you get no echo, switch back to audible.","");else say("","");};
 function stop(){running=false;cap=null;try{if(proc){proc.disconnect();proc.onaudioprocess=null;}}catch(e){}if(stream){stream.getTracks().forEach(function(t){t.stop();});stream=null;}try{if(ctx)ctx.close();}catch(e){}ctx=null;proc=null;go.textContent="🔊 Start sonar";$("echoCm").textContent="-- cm";$("echoQ").textContent="";window.__echoCm=null;plot(null);}
 go.onclick=function(){if(running){stop();say("Sonar stopped.","");return;}
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){say("The microphone is not available in this view. Try opening the lab in your browser directly.","err");return;}
  var AC=window.AudioContext||window.webkitAudioContext;if(!AC){say("Audio is not supported here.","err");return;}
  ctx=new AC();
  navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}}).then(function(s){stream=s;
   var src=ctx.createMediaStreamSource(s);proc=ctx.createScriptProcessor(2048,1,1);proc.onaudioprocess=onAudio;var mute=ctx.createGain();mute.gain.value=0;src.connect(proc);proc.connect(mute);mute.connect(ctx.destination);
   build();running=true;hist=[];go.textContent="■ Stop sonar";say("Listening. Turn the phone volume up. Point the speaker end at a wall or book and move it closer and farther.","ok");
   if(ctx.state==="suspended")ctx.resume();ping();
  }).catch(function(e){try{ctx.close();}catch(x){}ctx=null;say(e&&e.name==="NotAllowedError"?"Microphone permission was not given.":"Microphone could not start here ("+((e&&e.name)||"error")+").","err");});};
 $("echoUse").onchange=function(){if(this.checked){C.setFrontDistance(function(){return (Date.now()-lastOk<1500&&window.__echoCm!=null)?window.__echoCm:null;});say("Your robot's front distance sensor now reads the phone sonar. Run a wall mission and move the phone toward and away from a wall!","ok");}
  else{C.setFrontDistance(null);say("Back to the simulated sensor.","");}};
})();
window.MM_extras={countBlocks:countBlocks,starsFor:starsFor,helperHeader:helperHeader,buildGuide:buildGuide,shareCode:shareCode,loadShare:loadShare,portfolioHTML:portfolioHTML,totals:totals,myCode:myCode,myReport:myReport,certHTML:certHTML,renderTeacher:renderTeacher};
})();
