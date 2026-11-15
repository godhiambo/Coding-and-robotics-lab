// ===== PyX: a small Python subset that compiles to Robotics Lab blocks =====
var PyX=(function(){
var ACTS=[
 ["bot.forward","fwd","n"],["drone.forward","fwd","n"],["bot.backward","back","n"],["bot.turn_left","left","n"],["bot.turn_right","right","n"],
 ["time.sleep","wait","n"],["bot.pump","water","x"],["bot.gripper_close","gripc"],["bot.gripper_open","gripo"],["bot.beep","beep","x"],["bot.stop","stop"],
 ["arm.base","armb","n"],["arm.shoulder","arms","n"],["arm.elbow","arme","n"],
 ["belt.run_until_box","beltgo"],["belt.stop","beltoff"],
 ["drone.takeoff","takeoff"],["drone.land","land"],["drone.up","up","n"],["drone.down","down","n"],
 ["bot.relay","relay","b"],["bot.led","led","s"],["bot.lcd","print","s"]];
var CONDS=[];
function C(src,fn){CONDS.push([new RegExp("^"+src+"$"),fn]);}
var N="(-?\\d+(?:\\.\\d+)?)";
C('bot\\.distance\\("(front|left|right)"\\)\\s*<\\s*'+N,function(m){return {k:m[1],v:+m[2]};});
C('bot\\.line\\("left"\\)',function(){return {k:"lineL"};});C('bot\\.line\\("right"\\)',function(){return {k:"lineR"};});
[["bot\\.soil_percent\\(\\)","<","soil"],["drone\\.altitude\\(\\)","<","alt"],["drone\\.front_cm\\(\\)","<","dfront"],["drone\\.battery\\(\\)","<","bat"],["drone\\.light_percent\\(\\)",">","dlight"],["bot\\.light_percent\\(\\)","<","light"],["bot\\.temperature_c\\(\\)",">","temp"],["bot\\.humidity_percent\\(\\)","<","humid"],["bot\\.heading_deg\\(\\)","<","heading"],["bot\\.distance_travelled_cm\\(\\)",">","odo"]].forEach(function(r){C(r[0]+"\\s*"+r[1]+"\\s*"+N,function(m){return {k:r[2],v:+m[1]};});});
C('belt\\.box_at_pick_spot\\(\\)',function(){return {k:"boxspot"};});
C('arm\\.cube_colour\\(\\)\\s*==\\s*"(\\w+)"',function(m){return {k:"cubecol",q:m[1]};});
C('bot\\.color\\(\\)\\s*==\\s*"(\\w+)"',function(m){return {k:"color",q:m[1]};});
C('bot\\.bumper_pressed\\(\\)',function(){return {k:"bump"};});C('bot\\.camera_sees_object\\(\\)',function(){return {k:"cam"};});
function lev(a,b){var d=[],i,j;for(i=0;i<=a.length;i++){d[i]=[i];}for(j=1;j<=b.length;j++)d[0][j]=j;for(i=1;i<=a.length;i++)for(j=1;j<=b.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[a.length][b.length];}
function suggest(name){var best=null,bd=99;ACTS.forEach(function(a){var d=lev(name,a[0]);if(d<bd){bd=d;best=a[0];}});return bd<=4?best:null;}
function compile(src){
 var lines=src.replace(/\r/g,"").split("\n"),consts={},errs=[],items=[],skipDict=false;
 lines.forEach(function(raw,i){
  var ln=i+1,t=raw.replace(/\t/g,"    "),c=t.indexOf("#");if(c>=0){var q=t.slice(0,c);if((q.match(/"/g)||[]).length%2===0)t=q;}
  if(!t.trim())return;
  if(skipDict){if(/\}/.test(t))skipDict=false;return;}
  var s=t.trim();
  if(/^(import|from)\s/.test(s)||/^bot\.begin\(/.test(s)||/^[A-Za-z_]\w*\s*=\s*[A-Za-z_][\w.]*\(.*\)$/.test(s))return;
  if(/^[A-Za-z_]\w*\s*=\s*\{/.test(s)){if(!/\}/.test(s))skipDict=true;return;}
  var cm=/^([A-Za-z_]\w*)\s*=\s*(-?\d+(?:\.\d+)?)$/.exec(s);if(cm){consts[cm[1]]=+cm[2];return;}
  items.push({ln:ln,ind:t.length-t.replace(/^ +/,"").length,s:s});});
 function sub(expr){return expr.replace(/\b[A-Za-z_]\w*\b/g,function(w){return consts.hasOwnProperty(w)?String(consts[w]):w;});}
 function cond(txt,ln){var e=sub(txt.trim());for(var i=0;i<CONDS.length;i++){var m=CONDS[i][0].exec(e);if(m)return CONDS[i][1](m);}
  errs.push({line:ln,msg:"I can't use the condition \""+txt.trim()+"\". Try something like bot.distance(\"front\") < 30."});return {k:"front",v:30};}
 var pos=0;
 function block(ind){var out=[];
  while(pos<items.length){var it=items[pos];
   if(it.ind<ind)break;
   if(it.ind>ind){errs.push({line:it.ln,msg:"Unexpected indent. Lines inside a loop or if must all be indented the same amount."});pos++;continue;}
   var s=it.s;pos++;
   var m;
   if((m=/^for\s+\w+\s+in\s+range\((.+)\)\s*:$/.exec(s))){var n=Number(sub(m[1]));if(!isFinite(n)||n<1||n%1){errs.push({line:it.ln,msg:"range() needs a whole number like range(3)."});n=1;}out.push({t:"repeat",v:n,c:child(ind,it)});continue;}
   if(/^while\s+True\s*:$/.test(s)){out.push({t:"forever",c:child(ind,it)});continue;}
   if((m=/^if\s+(.+):$/.exec(s))){out.push(ifChain(m[1],it,ind));continue;}
   if(/^(elif|else)\b/.test(s)){errs.push({line:it.ln,msg:"This "+s.split(/[\s:]/)[0]+" has no matching if above it."});child(ind,it);continue;}
   if(/^def\s/.test(s)||/^while\s/.test(s)||/^for\s/.test(s)){errs.push({line:it.ln,msg:/^def/.test(s)?"Functions (def) are not supported yet. Use loops and if instead.":"Only \"for _ in range(n):\" and \"while True:\" loops are supported."});child(ind,it);continue;}
   s.split(";").forEach(function(part){part=part.trim();if(!part||part==="pass"||part==="raise SystemExit")return;stmt(part,it.ln,out);});}
  return out;}
 function child(ind,it){if(pos>=items.length||items[pos].ind<=ind){errs.push({line:it.ln,msg:"Nothing inside this block. Indent the next line (4 spaces)."});return [];}return block(items[pos].ind);}
 function ifChain(condTxt,it,ind){var b={t:"if",c:[],e:[]},k=cond(condTxt,it.ln);Object.keys(k).forEach(function(x){b[x]=k[x];});b.c=child(ind,it);
  if(pos<items.length&&items[pos].ind===ind){var nx=items[pos],m;
   if((m=/^elif\s+(.+):$/.exec(nx.s))){pos++;b.e=[ifChain(m[1],nx,ind)];}
   else if(/^else\s*:$/.test(nx.s)){pos++;b.e=child(ind,nx);}}
  return b;}
 function stmt(s,ln,out){var m=/^([A-Za-z_][\w.]*)\((.*)\)$/.exec(s);
  if(!m){errs.push({line:ln,msg:"I don't understand \""+s+"\". Each line should be a command like bot.forward(50)."});return;}
  var name=m[1],arg=sub(m[2].trim()),def=null;ACTS.forEach(function(a){if(a[0]===name)def=a;});
  if(!def){var sg=suggest(name);errs.push({line:ln,msg:"I don't know \""+name+"\"."+(sg?" Did you mean "+sg+"?":" Tap a command below to insert it.")});return;}
  var b={t:def[1]},kind=def[2];
  if(kind==="n"){if(!new RegExp("^"+N+"$").test(arg)){errs.push({line:ln,msg:name+"() needs a number inside the brackets, like "+name+"(50)."});return;}b.v=+arg;}
  else if(kind==="x"){if(arg&&!new RegExp("^"+N+"$").test(arg)){errs.push({line:ln,msg:name+"() takes a number or nothing."});return;}}
  else if(kind==="b"){if(arg==="True")b.t="fanon";else if(arg==="False")b.t="fanoff";else{errs.push({line:ln,msg:"Use bot.relay(True) or bot.relay(False)."});return;}}
  else if(kind==="s"){var sm=/^"([^"]*)"$/.exec(arg);if(!sm){errs.push({line:ln,msg:name+"() needs text in quotes, like "+name+"(\"red\")."});return;}b.q=sm[1];}
  else if(arg){errs.push({line:ln,msg:name+"() takes nothing inside the brackets."});return;}
  if(b.t==="wait"&&b.v>60){errs.push({line:ln,msg:"time.sleep() is limited to 60 seconds."});return;}
  out.push(b);}
 var prog=block(items.length?items[0].ind:0);
 while(pos<items.length){var it=items[pos];errs.push({line:it.ln,msg:"Check the indentation of this line."});pos++;}
 return {prog:prog,errors:errs};}
var CMDS={wheeled:["bot.forward(50)","bot.backward(30)","bot.turn_left(90)","bot.turn_right(90)","time.sleep(1)",'bot.led("red")',"bot.beep(0.3)",'bot.distance("front") < 30','bot.line("left")',"for _ in range(3):","while True:","if","else:","bot.stop()"],
 arm:["arm.base(90)","arm.shoulder(60)","arm.elbow(30)","bot.gripper_close()","bot.gripper_open()","time.sleep(1)","belt.run_until_box()","belt.box_at_pick_spot()",'arm.cube_colour() == "red"',"for _ in range(3):","if","else:"],
 drone:["drone.takeoff()","drone.land()","drone.up(50)","drone.down(50)","drone.forward(100)","bot.turn_left(90)","bot.turn_right(90)","drone.altitude() < 100","drone.front_cm() < 40","drone.light_percent() > 50","for _ in range(3):","if","else:"]};
return {compile:compile,CMDS:CMDS,ACTS:ACTS};
})();
if(typeof module!=="undefined")module.exports=PyX;
