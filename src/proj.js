// ===== My Projects: learners save their own robots, circuits and programs, and publish them to the class gallery =====
(function(){
var C=Core,$=function(id){return document.getElementById(id);},KEY="mm_projects",KINDS={robot:"🤖 Robot",circuit:"⚡ Circuit",python:"🐍 Python"};
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c];});}
function jget(k,d){try{var v=JSON.parse(localStorage.getItem(k)||"null");return v===null?d:v;}catch(e){return d;}}
function jset(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){return false;}}
function say(t,ok){var m=$("prMsg");if(!m)return;m.textContent=t;m.style.color=ok===false?"#fca5a5":ok?"#86efac":"";}
function list(){var a=jget(KEY,[]);return Array.isArray(a)?a:[];}
function me(){return jget("mmc_learner",null);}
function tch(){return jget("mmc_teacher",null);}
function api(path,body){return fetch("/api/"+path,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body||{})}).then(function(r){return r.json().catch(function(){return {};}).then(function(j){if(!r.ok)throw new Error(j.error||("Error "+r.status));return j;});});}
function auth(){var L=me(),T=tch();return T?{code:T.code,key:T.key}:L?{lt:L.lt}:null;}
function enc(o){return btoa(unescape(encodeURIComponent(JSON.stringify(o))));}
function dec(s){return JSON.parse(decodeURIComponent(escape(atob(s))));}

// ---- capture the learner's current work ----
function capture(kind){
  if(kind==="robot"){if(!window.MM_extras)throw new Error("Not ready yet.");return window.MM_extras.shareCode();}
  if(kind==="circuit"){var M=window.MM_mcu;if(!M)throw new Error("Open the Circuits tab first.");var m=M.mode(),cs=M.comps();if(!cs||cs.length<2)throw new Error("Build something in the Circuits tab first.");
    return JSON.stringify({mode:m,comps:JSON.parse(JSON.stringify(cs)),prog:m==="basic"?[]:JSON.parse(JSON.stringify(M.prog()))});}
  if(kind==="python"){var t=($("pyIn")||{}).value||"";if(t.trim().length<10)throw new Error("Write some Python in the Missions tab (Python mode) first.");return t;}
  throw new Error("Unknown type.");
}
// ---- put a project back to work ----
function validComps(cs){return Array.isArray(cs)&&cs.length<=300&&cs.every(function(q){return q&&typeof q.type==="string"&&q.type.length<24&&Array.isArray(q.holes)&&q.holes.length<=8&&q.holes.every(function(h){return typeof h==="string"&&h.length<8;});});}
function openIt(kind,data){
  try{
    if(kind==="robot"){if(!window.MM_extras.loadShare(data))throw 0;return true;}
    if(kind==="circuit"){var o=JSON.parse(data);if(!validComps(o.comps)||["basic","mcu","esp"].indexOf(o.mode)<0)throw 0;var M=window.MM_mcu;M.setMode(o.mode,true);M.setComps(o.comps);if(o.mode!=="basic"&&Array.isArray(o.prog))M.setProg(o.prog);window.MM.showTab("circuits");return true;}
    if(kind==="python"){if(typeof data!=="string"||data.length>20000)throw 0;window.MM_py.mode(true);window.MM_py.setCode(data);window.MM.showTab("play");return true;}
  }catch(e){}
  return false;
}
function ago(t){var d=Math.max(0,Date.now()-t),m=Math.round(d/60000);return m<1?"just now":m<60?m+" min ago":m<1440?Math.round(m/60)+" h ago":Math.round(m/1440)+" d ago";}

// ---- my saved list ----
function renderList(){
  var a=list(),el=$("prList");if(!el)return;
  if(!a.length){el.textContent="Nothing saved yet. Build something, give it a name above and press Save.";return;}
  el.innerHTML=a.map(function(p,i){return "<div class='lrow' style='display:block;padding:8px 0;border-bottom:1px solid #1e293b'><b>"+esc(p.title)+"</b> <span class='sub'>"+KINDS[p.kind]+" · "+ago(p.at)+(p.pub?" · 🏫 in gallery":"")+"</span>"+(p.about?"<div class='sub'>"+esc(p.about)+"</div>":"")+
    "<div class='row2' style='margin-top:6px'><button data-pa='open' data-i='"+i+"'>Open</button><button data-pa='pub' data-i='"+i+"'>🏫 "+(p.pub?"Update":"Publish")+"</button><button data-pa='copy' data-i='"+i+"'>📋 Code</button><button data-pa='del' data-i='"+i+"'>🗑</button></div></div>";}).join("");
}
function save(kind){
  var name=($("prName").value||"").trim().slice(0,60);if(!name){say("Give your project a name first.",false);return;}
  var data;try{data=capture(kind);}catch(e){say(e.message,false);return;}
  var a=list(),about=($("prAbout").value||"").trim().slice(0,300),i=a.findIndex(function(p){return p.title===name&&p.kind===kind;});
  var rec={title:name,about:about,kind:kind,data:data,at:Date.now(),pub:i>=0?a[i].pub:false};
  if(i>=0)a[i]=rec;else a.unshift(rec);
  if(a.length>40)a.length=40;
  if(!jset(KEY,a)){say("Your device is full. Delete an old project and try again.",false);return;}
  renderList();say(i>=0?"Updated “"+name+"”.":"Saved “"+name+"”. Find it below.",true);
}
function publish(p){
  var A=auth();if(!me()){say("Join your class in the Class tab (as a learner) to publish.",false);return;}
  say("Publishing…");
  api("proj/publish",{lt:me().lt,title:p.title,about:p.about,kind:p.kind,data:p.data}).then(function(){p.pub=true;jset(KEY,list().map(function(x){return x.title===p.title&&x.kind===p.kind?p:x;}));renderList();say("Published to your class gallery.",true);loadGallery();}).catch(function(e){say(e.message,false);});
}

// ---- class gallery ----
var gal=[],galKey="";
function loadGallery(){
  var A=auth(),el=$("prGal");if(!el)return;
  if(!A){el.textContent="Join a class in the Class tab to see projects from your classmates.";return;}
  api("proj/list",A).then(function(j){gal=j.projects||[];renderGallery();}).catch(function(){});
}
function renderGallery(){
  var el=$("prGal"),T=!!tch();if(!el)return;
  var h=gal.length?gal.map(function(p){return "<div style='padding:8px 0;border-bottom:1px solid #1e293b'>"+(p.feat?"⭐ ":"")+"<b>"+esc(p.title)+"</b> <span class='sub'>"+KINDS[p.kind]+" · "+esc(p.author)+" · "+ago(p.at)+"</span>"+(p.about?"<div class='sub'>"+esc(p.about)+"</div>":"")+(p.note?"<div class='sub' style='color:#fde68a'>Teacher: "+esc(p.note)+"</div>":"")+
    "<div class='row2' style='margin-top:6px'><button data-ga='open' data-id='"+esc(p.id)+"'>Open my copy</button>"+(T?"<button data-ga='feat' data-id='"+esc(p.id)+"'>"+(p.feat?"Unstar":"⭐ Star")+"</button><button data-ga='note' data-id='"+esc(p.id)+"'>💬 Note</button>":"")+((T||p.mine)?"<button data-ga='rm' data-id='"+esc(p.id)+"'>🗑 Remove</button>":"")+"</div></div>";}).join(""):"No projects published yet. Be the first!";
  if(h!==galKey){galKey=h;el.innerHTML=h;}
}
function onGal(e){
  var b=e.target.closest("button[data-ga]");if(!b)return;var A=auth(),id=b.dataset.id,a=b.dataset.ga;if(!A)return;
  if(a==="open"){api("proj/get",{lt:A.lt,code:A.code,key:A.key,id:id}).then(function(j){if(openIt(j.kind,j.data))say("Opened a copy of “"+j.title+"”. Your changes stay on your device.",true);else say("That project could not be opened.",false);}).catch(function(x){say(x.message,false);});}
  else if(a==="rm"){if(!confirm("Remove this project from the gallery?"))return;var q=Object.assign({id:id,action:"remove"},A);api("proj/act",q).then(loadGallery).catch(function(x){say(x.message,false);});}
  else if(a==="feat"){var p=gal.filter(function(x){return x.id===id;})[0];api("proj/act",Object.assign({id:id,action:"feature",on:!(p&&p.feat)},A)).then(loadGallery).catch(function(x){say(x.message,false);});}
  else if(a==="note"){var n=prompt("A note for the learner (max 200 characters):","");if(n===null)return;api("proj/act",Object.assign({id:id,action:"note",note:n},A)).then(loadGallery).catch(function(x){say(x.message,false);});}
}
function onList(e){
  var b=e.target.closest("button[data-pa]");if(!b)return;var a=list(),p=a[+b.dataset.i];if(!p)return;
  if(b.dataset.pa==="open"){if(openIt(p.kind,p.data))say("Opened “"+p.title+"”.",true);else say("This project could not be opened.",false);}
  else if(b.dataset.pa==="pub")publish(p);
  else if(b.dataset.pa==="del"){if(!confirm("Delete “"+p.title+"” from this device?"))return;a.splice(+b.dataset.i,1);jset(KEY,a);renderList();}
  else if(b.dataset.pa==="copy"){var c="MMP:"+enc({t:p.title,a:p.about,k:p.kind,d:p.data});$("prCode").value=c;$("prCode").closest("details").open=true;try{navigator.clipboard.writeText(c).then(function(){say("Project code copied. Send it to a friend.",true);},function(){say("Select the code below and copy it.");});}catch(x){say("Select the code below and copy it.");}}
}
function importCode(){
  try{var s=($("prCode").value||"").trim();if(s.indexOf("MMP:")!==0)throw 0;var o=dec(s.slice(4));if(!KINDS[o.k]||typeof o.d!=="string"||o.d.length>40000)throw 0;
    var a=list();a.unshift({title:String(o.t||"Shared project").slice(0,60),about:String(o.a||"").slice(0,300),kind:o.k,data:o.d,at:Date.now(),pub:false});jset(KEY,a.slice(0,40));renderList();$("prCode").value="";say("Added to your projects. Press Open to try it.",true);
  }catch(e){say("That project code is not valid.",false);}
}
function init(){
  if(!$("projects"))return;
  $("prSaveR").onclick=function(){save("robot");};$("prSaveC").onclick=function(){save("circuit");};$("prSaveP").onclick=function(){save("python");};
  $("prList").addEventListener("click",onList);$("prGal").addEventListener("click",onGal);$("prImport").onclick=importCode;
  renderList();
  var nav=document.querySelector("[data-tab=projects]");if(nav)nav.addEventListener("click",loadGallery);
  setInterval(function(){if($("projects").classList.contains("on")&&!document.hidden)loadGallery();},15000);
}
init();
window.MM_proj={capture:capture,openIt:openIt,list:list,save:save,renderGallery:renderGallery};
})();
