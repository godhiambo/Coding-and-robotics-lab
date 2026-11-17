// COMP: classroom + competition mode (learner and teacher screens). Talks to /api/* (Worker + D1).
(function(){
"use strict";
var C=window.Core,$=function(i){return document.getElementById(i);},root=$("classroom");if(!root||!C)return;
var LS={get:function(k){try{return JSON.parse(localStorage.getItem(k)||"null");}catch(e){return null;}},set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}},del:function(k){try{localStorage.removeItem(k);}catch(e){}}};
var T=LS.get("mmc_teacher"),L=LS.get("mmc_learner"),role=T?"teacher":(L?"learner":"choose"),offset=0,me=null,att=null,lastRun=null,pollT=null,barT=null,saveT=null,boardId=null,dash=null,boardData=null,notice="",lastProgHash="",ev=[],submitting=false;
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c];});}
function now(){return Date.now()+offset;}
function api(path,body){return fetch("/api/"+path,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body||{})}).then(function(r){return r.json().catch(function(){return {};}).then(function(j){if(j.now)offset=j.now-Date.now();if(!r.ok){var e=new Error(j.error||("Error "+r.status));e.status=r.status;e.setup=j.setup;throw e;}return j;});});}
function fmt(ms){ms=Math.max(0,Math.round(ms/1000));var m=Math.floor(ms/60),s=ms%60;return (m<10?"0":"")+m+":"+(s<10?"0":"")+s;}
function levelIdx(id){for(var i=0;i<C.LEVELS.length;i++)if(C.LEVELS[i].id===id)return i;return -1;}
function cnt(l){var n=0;(l||[]).forEach(function(b){n++;for(var k in b)if(Array.isArray(b[k]))n+=cnt(b[k]);});return n;}
function say(t){notice=t||"";var n=root.querySelector(".cmsg");if(n){n.textContent=notice;}}
function errMsg(e){return e.setup?"The classroom database is not connected yet. The school admin must finish the Cloudflare setup (see README).":(e.message||"Something went wrong.");}
function badge(on,label){return "<span class='cbadge "+(on?"on":"off")+"'>"+label+": "+(on?"ON":"OFF")+"</span>";}
function rulesBadges(r){return badge(r.mila,"Mila")+badge(r.hints,"Hints")+badge(r.suggest,"Suggestions")+"<span class='cbadge'>"+r.duration+" min</span><span class='cbadge'>"+(r.attempts?r.attempts+" attempt"+(r.attempts>1?"s":""):"Unlimited attempts")+"</span>";}

// ================= learner run tracking =================
window.MM_onEnd=function(st){try{var l=C.LEVELS[st.lvl],g=l.goal,prog=window.MM.prog(),ideal=0,pr=st.status==="win"?100:0;
 if(g){var gx=g[0]+g[2]/2,gy=g[1]+g[3]/2,d0=Math.hypot(l.start.x-gx,l.start.y-gy),d1=Math.hypot(st.robot.x-gx,st.robot.y-gy);ideal=Math.max(0,d0-Math.max(g[2],g[3])/2);if(pr<100)pr=Math.round(Math.max(0,Math.min(0.95,1-d1/Math.max(d0,1)))*100);}
 lastRun={win:st.status==="win",collisions:st.bumps||0,time:st.simt||0,odo:st.odo||0,ideal:ideal,progress:pr,blocks:cnt(prog)};ev.push({type:"run",data:{win:lastRun.win}});updateBar();}catch(e){}};
window.MM_lt=function(){return L?L.lt:"";};
document.addEventListener("visibilitychange",function(){if(att&&document.hidden)ev.push({type:"tab_hidden"});});

// ================= competition mode (learner) =================
function setCls(r){var b=document.body;b.classList.add("comp");b.classList.toggle("c-nomila",!r.mila);b.classList.toggle("c-nohint",!r.hints);b.classList.toggle("c-nosug",!r.suggest);}
function clearCls(){document.body.classList.remove("comp","c-nomila","c-nohint","c-nosug","c-paused");var b=$("compBar");if(b)b.remove();var p=$("compPause");if(p)p.remove();clearInterval(barT);clearInterval(saveT);}
function barEl(){var b=$("compBar");if(!b){b=document.createElement("div");b.id="compBar";b.innerHTML="<div class='cbt'><b id='cbTitle'></b><span id='cbTime'>--:--</span></div><div class='cbs'><span>💥 <b id='cbCol'>0</b></span><span>📍 <b id='cbPro'>0%</b></span><span>🧱 <b id='cbBlk'>0</b></span><button id='cbSub' class='p'>Submit</button></div>";document.body.insertBefore(b,document.body.firstChild);$("cbSub").onclick=function(){if(confirm("Submit your mission now? Your latest run will be scored."))submit(false);};}return b;}
function updateBar(){if(!att)return;var s=C.st,col=(s.status==="run"?s.bumps:(lastRun?lastRun.collisions:s.bumps))||0;$("cbCol")&&($("cbCol").textContent=col);$("cbPro")&&($("cbPro").textContent=(lastRun?lastRun.progress:0)+"%");$("cbBlk")&&($("cbBlk").textContent=cnt(window.MM.prog()));
 var left=att.deadline-now();$("cbTime")&&($("cbTime").textContent=fmt(left),$("cbTime").className=left<60000?"warn":"");if(left<=0&&!submitting)submit(true);}
function enter(comp,lv0){var ids=comp.levels||[comp.level];if(!lv0)lv0=ids[0];if(levelIdx(lv0)<0){say("This mission is not available in your version.");return;}
 api("attempt/start",{lt:L.lt,compId:comp.id,level:lv0}).then(function(j){var li=levelIdx(j.level||lv0);if(li<0){say("This mission is not available in your version.");return;}var w=$("welcome");if(w)w.classList.remove("on");try{localStorage.setItem("mm_seen","1");}catch(x){}att={id:j.attemptId,deadline:j.deadline,comp:comp,rules:j.rules};lastRun=null;submitting=false;ev=[];setCls(j.rules);barEl();$("cbTitle").textContent=comp.title;
  window.MM.showTab("play");window.MM.setLevel(li);if(j.prog&&window.MM.setProg)window.MM.setProg(j.prog);lastProgHash=JSON.stringify(window.MM.prog());
  clearInterval(barT);barT=setInterval(updateBar,250);clearInterval(saveT);saveT=setInterval(save,8000);startPoll();}).catch(function(e){say(errMsg(e));render();});}
function save(){if(!att)return;var h=JSON.stringify(window.MM.prog());if(h!==lastProgHash){lastProgHash=h;ev.push({type:"code_change"});}
 var e=ev.splice(0,8);api("attempt/save",{lt:L.lt,attemptId:att.id,prog:window.MM.prog(),progress:lastRun?lastRun.progress:0,collisions:lastRun?lastRun.collisions:0,events:e}).catch(function(){});}
function submit(auto){if(!att||submitting)return;submitting=true;if(C.st.status==="run"){try{$("run").click();}catch(e){}}
 var r=lastRun||{win:false,collisions:0,time:0,odo:0,ideal:0,progress:0,blocks:cnt(window.MM.prog())};r.blocks=cnt(window.MM.prog());
 api("attempt/submit",{lt:L.lt,attemptId:att.id,prog:window.MM.prog(),result:r}).then(function(j){notice=(auto?"Time is up. ":"")+"Submitted: "+j.score+" / "+j.max+" points.";done();}).catch(function(e){notice=errMsg(e);done();});}
function done(){att=null;clearCls();submitting=false;window.MM.showTab("classroom");poll();}
function pauseOverlay(on){var p=$("compPause");if(on&&!p){p=document.createElement("div");p.id="compPause";p.innerHTML="<div><h2>⏸ Competition paused</h2><p>Your teacher paused the competition. Please wait.</p></div>";document.body.appendChild(p);if(C.st.status==="run"){try{$("run").click();}catch(e){}}}else if(!on&&p)p.remove();}

// ================= polling =================
function startPoll(){clearInterval(pollT);pollT=setInterval(poll,4000);poll();}
function poll(){if(role==="learner"&&L){api("me",{lt:L.lt}).then(function(j){me=j;if(att){var c=j.comp;if(!c||c.status==="ended"){if(!submitting)submit(true);}else{att.deadline=c.deadline;pauseOverlay(c.status==="paused");}}render();}).catch(function(e){if(e.status===401){L=null;LS.del("mmc_learner");role="choose";}notice=errMsg(e);render();});}
 else if(role==="teacher"&&T&&root.classList.contains("on")){loadDash();}}
document.addEventListener("click",function(e){if(e.target&&e.target.getAttribute&&e.target.getAttribute("data-tab")==="classroom"){render();poll();}});
setInterval(function(){if(root.classList.contains("on")&&!att)poll();},5000);

// ================= rendering =================
function chooseHTML(){return "<h2>🏫 Class & competitions</h2><p class='sub'>Join your teacher's class, or set up a class as a teacher. No account needed.</p>"+
 "<div class='card'><h3>🎒 I'm a learner</h3><input id='jCode' placeholder='Class code (e.g. K7P2X)' autocapitalize='characters'><input id='jName' placeholder='Your name'><button class='p' data-act='join'>Join class</button></div>"+
 "<div class='card'><h3>👩‍🏫 I'm a teacher</h3><button class='p' data-act='tNew'>Create a class</button><details class='fold'><summary>I already have a class</summary><input id='sCode' placeholder='Class code'><input id='sKey' placeholder='Teacher key' type='password'><button data-act='tIn'>Sign in</button></details></div><div class='cmsg sub'>"+esc(notice)+"</div>";}
function learnerHTML(){var h="<h2>🏫 "+esc((me&&me.cls.name)||(L&&L.cls&&L.cls.name)||"Class")+"</h2><p class='sub'>You: <b>"+esc(L.name)+"</b> · Code "+esc(L.code||"")+" · <a href='#' data-act='leave'>Leave class</a></p>";
 var c=me&&me.comp;
 if(!c){h+="<div class='card'><b>No competition right now.</b><p class='sub'>When your teacher starts one, it appears here. Keep practising in Missions.</p></div>";}
 else{var r=c.rules,start=c.startAt,tNow=now(),mine=(me.mine||[]),open=mine.filter(function(a){return a.status==="open";})[0],best=mine.filter(function(a){return a.status==="submitted"&&!a.disq;}).sort(function(a,b){return b.score-a.score;})[0],li=levelIdx((c.levels||[c.level])[0]),lv=li>=0?C.LEVELS[li]:null,multi=(c.levels||[]).length>1;
  h+="<div class='card'><div class='cst "+c.status+"'>"+(c.status==="live"?"● LIVE":c.status==="paused"?"⏸ PAUSED":c.status==="ended"?"Finished":"Draft")+"</div><h3>"+esc(c.title)+"</h3><div>"+rulesBadges(r)+"</div>";
  if(multi)h+="<p class='sub'><b>Missions:</b> choose one at a time. Your score is the total of your best result on each.</p><select id='eLevel'>"+c.levels.map(function(id){var i=levelIdx(id),b=mine.filter(function(a){return a.level===id&&a.status==="submitted"&&!a.disq;}).sort(function(x,y){return y.score-x.score;})[0];return i<0?"":"<option value='"+id+"'"+(open&&open.level===id?" selected":"")+">"+esc(C.LEVELS[i].name)+(b?" ✓ "+b.score:"")+"</option>";}).join("")+"</select>";else if(lv)h+="<p class='sub'><b>Mission:</b> "+lv.mission+"</p>";
  h+="<details class='fold'><summary>How you are scored (1,000 marks)</summary><table class='ct'><tr><td>Reaches destination</td><td>300</td></tr><tr><td>Completes mission</td><td>200</td></tr><tr><td>Avoids collisions</td><td>150</td></tr><tr><td>Efficient logic (≤ "+r.parBlocks+" blocks)</td><td>150</td></tr><tr><td>"+(r.speed?"Within "+r.targetTime+" s":"Speed is a tie-breaker only")+"</td><td>"+(r.speed?100:"–")+"</td></tr><tr><td>Fewer wasted movements</td><td>100</td></tr></table></details>";
  if(c.status==="live"||c.status==="paused"){var left=c.deadline-tNow;
   if(tNow<start-200)h+="<div class='big'>Starting in "+Math.ceil((start-tNow)/1000)+"…</div>";
   else h+="<div class='big'>"+fmt(left)+" left</div>";
   if(c.status==="live"&&tNow>=start-200&&left>0){var canNew=!r.attempts||multi||mine.length<r.attempts;
    if(open)h+="<button class='p' data-act='enter'>▶ Resume your attempt</button>";else if(canNew)h+="<button class='p' data-act='enter'>▶ "+(mine.length?"Start next attempt":"Enter competition")+"</button>";else h+="<p class='sub'>You have used all your attempts.</p>";}
   if(c.status==="paused")h+="<p class='sub'>The teacher paused the competition.</p>";}
  if(best)h+="<div class='res'>Your best: <b>"+best.score+"</b> points"+(best.win?" · mission complete":"")+" · "+best.collisions+" collision"+(best.collisions===1?"":"s")+"</div>"+(best.breakdown?"<table class='ct'>"+[["reach","Reaches destination"],["complete","Completes mission"],["collisions","Avoids collisions"],["logic","Efficient logic"],["time","Time"],["movement","Fewer wasted movements"]].map(function(k){return "<tr><td>"+k[1]+"</td><td>"+best.breakdown[k[0]]+"</td></tr>";}).join("")+"</table>":"");
  h+="</div>";
  if(me.board&&me.board.length)h+="<div class='card'><h3>🏆 Leaderboard</h3><table class='ct lb'>"+me.board.map(function(b){return "<tr"+(b.me?" class='me'":"")+"><td>"+b.rank+"</td><td>"+esc(b.name)+"</td><td>"+esc(b.status)+"</td><td><b>"+b.score+"</b></td></tr>";}).join("")+"</table></div>";
  else if(me.boardHidden)h+="<div class='card sub'>🏆 The leaderboard will be shown when your teacher publishes the results.</div>";}
 return h+"<div class='cmsg sub'>"+esc(notice)+"</div>";}

var PRESETS={guided:{mila:true,hints:true,suggest:true},practice:{mila:false,hints:true,suggest:false},assess:{mila:false,hints:false,suggest:false},open:{mila:true,hints:false,suggest:false}};
function teacherHTML(){if(!dash)return "<p class='sub'>Loading your class…</p><div class='cmsg sub'>"+esc(notice)+"</div>";
 var d=dash,h="<h2>👩‍🏫 "+esc(d.cls.name)+"</h2><div class='codebox'>Class code <b>"+esc(d.cls.code)+"</b> <button data-act='copy' data-v='"+esc(d.cls.code)+"'>Copy</button></div><p class='sub'>Learners join with this code. <a href='#' data-act='tOut'>Sign out</a> · <a href='#' data-act='copyKey'>Copy teacher key</a></p>";
 h+="<details class='card fold'><summary><b>Learners ("+d.learners.length+")</b></summary>"+(d.learners.length?d.learners.map(function(l){return "<div class='lrow'><span>"+esc(l.name)+(l.extra_s?" <small>(+"+l.extra_s/60+" min)</small>":"")+"</span><span><button data-act='extra' data-id='"+l.id+"'>＋time</button><button data-act='rm' data-id='"+l.id+"'>Remove</button></span></div>";}).join(""):"<p class='sub'>No learners yet.</p>")+"</details>";
 h+="<details class='card fold' "+(d.comps.length?"":"open")+"><summary><b>＋ New competition</b></summary>"+
  "<label>Missions <small>(tick one or more)</small></label><div class='mpick'>"+C.LEVELS.filter(function(l){return l.id!=="sandbox";}).map(function(l){return "<label><input type='checkbox' class='nLv' value='"+l.id+"'> "+esc(l.name)+"</label>";}).join("")+"</div><div class='sub'><a href='#' data-act='lvAll'>Select all</a> · <a href='#' data-act='lvNone'>Clear</a></div>"+
  "<label>Title</label><input id='nTitle' placeholder='e.g. The Great Maze Escape'>"+
  "<label>Type</label><select id='nPre'><option value='assess'>Assessment (Mila OFF, Hints OFF)</option><option value='practice'>Independent practice (Mila OFF, Hints ON)</option><option value='guided'>Guided learning (Mila ON, Hints ON)</option><option value='open'>Open exploration (Mila ON, Hints OFF)</option></select>"+
  "<div class='tg'><label><input type='checkbox' id='nMila'> Mila AI</label><label><input type='checkbox' id='nHints'> Hints</label><label><input type='checkbox' id='nSug'> Code suggestions (Check)</label></div>"+
  "<div class='two'><div><label>Duration</label><select id='nDur'><option>5</option><option>10</option><option selected>15</option><option>30</option><option>60</option></select></div><div><label>Attempts</label><select id='nAtt'><option value='1'>One</option><option value='3'>Three</option><option value='0'>Unlimited</option></select></div></div>"+
  "<label>Participation</label><select id='nMode'><option>Individual competition</option><option disabled>Team competition (coming soon)</option></select>"+
  "<div class='two'><div><label>Target time (s)</label><input id='nTT' type='number' value='60'></div><div><label>Par blocks</label><input id='nPar' type='number' value='12'></div></div>"+
  "<div class='tg'><label><input type='checkbox' id='nSpeed' checked> Speed earns marks (else tie-breaker only)</label><label><input type='checkbox' id='nBoardLive' checked> Learners see live leaderboard</label></div>"+
  "<button class='p' data-act='cCreate'>Create competition</button></details>";
 d.comps.forEach(function(c){var st=c.status;h+="<div class='card'><div class='cst "+st+"'>"+(st==="live"?"● LIVE":st==="paused"?"⏸ PAUSED":st==="ended"?"Ended":"Draft")+"</div><b>"+esc(c.title)+"</b><div class='sub'>"+esc((c.levels||[c.level]).map(function(id){return (C.LEVELS[levelIdx(id)]||{}).name||id;}).join(", "))+"</div><div>"+rulesBadges(c.rules)+"</div>";
  if(st==="live"||st==="paused")h+="<div class='big' data-dl='"+c.deadline+"'>"+fmt(c.deadline-now())+"</div>";
  h+="<div class='row'>"+(st==="draft"?"<button class='p' data-act='cAct' data-a='start' data-id='"+c.id+"'>▶ Start</button>":"")+(st==="live"?"<button data-act='cAct' data-a='pause' data-id='"+c.id+"'>⏸ Pause</button>":"")+(st==="paused"?"<button class='p' data-act='cAct' data-a='resume' data-id='"+c.id+"'>▶ Resume</button>":"")+((st==="live"||st==="paused")?"<button data-act='cAct' data-a='extend' data-id='"+c.id+"'>＋5 min</button><button data-act='cAct' data-a='end' data-id='"+c.id+"'>■ End</button>":"")+(st==="ended"?"<button data-act='cAct' data-a='"+(c.published?"unpublish":"publish")+"' data-id='"+c.id+"'>"+(c.published?"Hide results":"Publish results")+"</button>":"")+(st!=="draft"?"<button data-act='board' data-id='"+c.id+"'>"+(boardId===c.id?"Hide board":"Live board")+"</button>":"")+"</div>";
  if(boardId===c.id&&boardData)h+=boardHTML(boardData);h+="</div>";});
 return h+"<div class='cmsg sub'>"+esc(notice)+"</div>";}
function boardHTML(b){var h="<div class='sub'>"+b.rows.length+" of "+b.enrolled+" learners joined in</div><table class='ct lb'><tr><th>#</th><th>Learner</th><th>Status</th><th>Prog.</th><th>Pts</th></tr>"+b.rows.map(function(r){return "<tr><td>"+r.rank+"</td><td>"+esc(r.name)+"</td><td>"+esc(r.status)+"</td><td>"+r.progress+"%</td><td><b>"+r.score+"</b></td></tr>"+(r.detail||[]).map(function(a){return "<tr class='att'><td></td><td colspan='3'>Attempt "+a.n+" · "+a.status+" · "+a.collisions+" collisions · "+Math.round(a.time)+"s · "+a.blocks+" blocks"+(a.disq?" · <b>DISQ</b>":"")+"</td><td>"+(a.status==="submitted"?"<button data-act='disq' data-a='"+(a.disq?"undisq":"disq")+"' data-id='"+a.id+"'>"+(a.disq?"Reinstate":"Disqualify")+"</button>":"")+"</td></tr>";}).join("");}).join("")+"</table>";
 h+="<details class='fold'><summary>Integrity log</summary><div class='log'>"+b.events.map(function(e){return "<div>"+new Date(e.at).toLocaleTimeString()+" · "+esc(e.name||"Teacher")+" · "+esc(e.type)+(e.data?" "+esc(e.data):"")+"</div>";}).join("")+"</div></details>";return h;}
function loadDash(){if(!T)return;api("class/get",{code:T.code,key:T.key}).then(function(j){dash=j;if(boardId)return api("comp/board",{code:T.code,key:T.key,compId:boardId}).then(function(b){boardData=b;});}).then(function(){if(root.classList.contains("on"))render();}).catch(function(e){if(e.status===401){T=null;LS.del("mmc_teacher");role="choose";}notice=errMsg(e);render();});}
function render(){if(att)return;var a=document.activeElement;if(a&&/^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName)&&root.contains(a))return;var h=role==="learner"&&L?learnerHTML():role==="teacher"&&T?teacherHTML():chooseHTML();root.innerHTML="<div class='card cwrap'>"+h+"</div>";}
setInterval(function(){[].forEach.call(root.querySelectorAll("[data-dl]"),function(n){n.textContent=fmt(+n.getAttribute("data-dl")-now());});},1000);

// ================= actions =================
function val(i){var e=$(i);return e?e.value.trim():"";}
root.addEventListener("change",function(e){if(e.target.id==="nPre"){var p=PRESETS[e.target.value];$("nMila").checked=p.mila;$("nHints").checked=p.hints;$("nSug").checked=p.suggest;}});
root.addEventListener("click",function(e){var t=e.target.closest?e.target.closest("[data-act]"):null;if(!t)return;e.preventDefault();var a=t.getAttribute("data-act"),id=t.getAttribute("data-id");
 if(a==="join"){api("join",{code:val("jCode"),name:val("jName")}).then(function(j){L={lt:j.lt,name:j.name,code:j.cls.code,cls:j.cls};LS.set("mmc_learner",L);role="learner";notice="";startPoll();render();}).catch(function(x){say(errMsg(x));});}
 else if(a==="leave"){L=null;LS.del("mmc_learner");role="choose";me=null;render();}
 else if(a==="tNew"){var n=prompt("Class name (e.g. Grade 9 Robotics):");if(!n)return;var g=prompt("Grade (optional):","")||"";api("class/create",{name:n,grade:g}).then(function(j){T={code:j.code,key:j.key};LS.set("mmc_teacher",T);role="teacher";notice="Class created. Your teacher key is "+j.key+". Save it somewhere safe: you need it to sign in on another device.";dash=null;loadDash();render();}).catch(function(x){say(errMsg(x));});}
 else if(a==="tIn"){T={code:val("sCode").toUpperCase(),key:val("sKey")};role="teacher";dash=null;LS.set("mmc_teacher",T);loadDash();render();}
 else if(a==="tOut"){T=null;LS.del("mmc_teacher");role="choose";dash=null;render();}
 else if(a==="copy"||a==="copyKey"){var v=a==="copy"?t.getAttribute("data-v"):T.key;try{navigator.clipboard.writeText(v);say("Copied.");}catch(x){prompt("Copy this:",v);}}
 else if(a==="extra"){var m=prompt("Extra minutes for this learner (accommodation):","5");if(m===null)return;api("class/learner",{code:T.code,key:T.key,learnerId:id,action:"extra",minutes:+m}).then(loadDash).catch(function(x){say(errMsg(x));});}
 else if(a==="rm"){if(!confirm("Remove this learner from the class?"))return;api("class/learner",{code:T.code,key:T.key,learnerId:id,action:"remove"}).then(loadDash).catch(function(x){say(errMsg(x));});}
 else if(a==="lvAll"||a==="lvNone"){e.preventDefault();[].forEach.call(document.querySelectorAll(".nLv"),function(x){x.checked=a==="lvAll";});}
 else if(a==="cCreate"){if(!document.querySelector(".nLv:checked")){say("Tick at least one mission.");return;}var rules={mila:$("nMila").checked,hints:$("nHints").checked,suggest:$("nSug").checked,duration:+val("nDur"),attempts:+val("nAtt"),speed:$("nSpeed").checked,board:$("nBoardLive").checked?"live":"after",targetTime:+val("nTT"),parBlocks:+val("nPar")};
  api("comp/create",{code:T.code,key:T.key,levels:[].slice.call(document.querySelectorAll(".nLv:checked")).map(function(x){return x.value;}),title:val("nTitle")||"Robotics challenge",rules:rules}).then(function(){notice="Competition created. Press Start when everyone is ready.";loadDash();}).catch(function(x){say(errMsg(x));});}
 else if(a==="cAct"){var act=t.getAttribute("data-a");if(act==="end"&&!confirm("End the competition for everyone?"))return;api("comp/act",{code:T.code,key:T.key,compId:id,action:act,minutes:5}).then(loadDash).catch(function(x){say(errMsg(x));});}
 else if(a==="board"){boardId=boardId===id?null:id;boardData=null;loadDash();}
 else if(a==="disq"){var why=t.getAttribute("data-a")==="disq"?prompt("Reason for disqualification (recorded in the integrity log):","Rule violation"):"";if(why===null)return;api("comp/act",{code:T.code,key:T.key,compId:boardId,action:t.getAttribute("data-a"),attemptId:id,reason:why}).then(loadDash).catch(function(x){say(errMsg(x));});}
 else if(a==="enter"){var c=me&&me.comp;if(c){var sel=$("eLevel");enter(c,sel?sel.value:null);}}});

if(L){startPoll();}else if(T){loadDash();}
render();
})();
