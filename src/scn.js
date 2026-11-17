// SCN: scenario missions (waste sorting, lake clean-up, irrigation, clothesline, fruit-picking drone,
// crop monitoring, pothole drone, fire-fighting arm, hand washing, dam gate). Pure logic, no THREE.
var SCN=(function(){
"use strict";
var def={},levels=[],api=null;
function bind(a){api=a;}
function R(a,b){return a+Math.random()*(b-a);}
function RI(a,b){return Math.floor(R(a,b+1));}
function pick(a){return a[Math.floor(Math.random()*a.length)];}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}
function D(ax,ay,bx,by){return Math.hypot(ax-bx,ay-by);}
function rad(d){return d*Math.PI/180;}
function wrap(a){a%=360;if(a>180)a-=360;if(a<-180)a+=360;return a;}
function fwd(st,r){var a=rad(st.robot.a);return [st.robot.x+Math.cos(a)*r,st.robot.y+Math.sin(a)*r];}
function bearing(st,x,y){return wrap(Math.atan2(y-st.robot.y,x-st.robot.x)*180/Math.PI-st.robot.a);}
function noise(s){return (Math.random()-0.5)*(s||1);}
function register(d){def[d.id]=d;
 var l={id:d.id,name:d.name,floor:d.floor||"workshop",mission:d.mission,hint:d.hint,start:d.start||{x:25,y:100,a:0},goal:null,walls:d.walls||[],kit:d.kit,scn:d.id,kind:d.kind||d.id};
 ["station","drone","arm","chassis","pad","wallH","drain","bins","cubes","dur","needsAny"].forEach(function(k){if(d[k]!==undefined)l[k]=d[k];});
 levels.push(l);}
function inRect(x,y,r){return x>=r[0]&&x<=r[0]+r[2]&&y>=r[1]&&y<=r[1]+r[3];}
function nearestAhead(st,list,maxd,cone,filter,off){
 var best=null,bd=1e9,fp=off?fwd(st,off):[st.robot.x,st.robot.y];
 list.forEach(function(it){if(it.held||it.bin||it.hold||it.gone||(filter&&!filter(it)))return;var d=D(st.robot.x,st.robot.y,it.x,it.y);if(d>maxd)return;var b=Math.abs(bearing(st,it.x,it.y));if(b>cone)return;if(d<bd){bd=d;best=it;}});
 return best;}

// ============================ 1 & 2: land waste sorting ============================
function wasteDef(o){
 var d={id:o.id,name:o.name,floor:"workshop",mission:o.mission,hint:o.hint,kit:o.kit,dur:o.dur||160,
  actions:[{id:"grab",label:"Grab item",need:"servo",tip:"Close the gripper on the item in front"},{id:"release",label:"Release item",need:"servo",tip:"Open the gripper (drops into a bin if you are over one)"}],
  sensors:o.sensors,
  init:function(S){var st=api.st();S.t=0;S.held=null;S.sorted=0;S.bins=o.bins;S.items=[];var types=shuffle(o.types);
   types.forEach(function(ty,i){var k=pick(o.kinds[ty]);S.items.push({id:i,type:ty,kind:k,x:o.lane.x0+i*o.lane.dx,y:o.lane.y+noise(4),m:ty==="wet"||ty==="organic"?RI(62,92):RI(2,20),held:false,bin:null,rot:R(0,6)});});
   S.total=S.items.length;S.log=[];},
  step:function(S,dt){S.t+=dt;var st=api.st();if(S.held){var f=fwd(st,13);S.held.x=f[0];S.held.y=f[1];}},
  act:function*(S,id){var st=api.st();
   if(id==="grab"){if(S.held){S.log.push("Already holding something");return;}var f=nearestAhead(st,S.items,22,45);if(!f){S.log.push("Nothing in reach");yield* api.wait(0.4);return;}S.held=f;f.held=true;yield* api.wait(0.5);return;}
   if(id==="release"){if(!S.held){yield* api.wait(0.3);return;}var it=S.held,fp=fwd(st,13),bn=null;S.bins.forEach(function(b){if(inRect(fp[0],fp[1],b.r))bn=b;});S.held=null;it.held=false;
    if(!bn){it.x=fp[0];it.y=fp[1];yield* api.wait(0.4);return;}
    if(bn.accepts.indexOf(it.type)<0){S.bad={item:it,bin:bn};return;}
    it.bin=bn.id;it.x=bn.r[0]+8+Math.random()*(bn.r[2]-16);it.y=bn.r[1]+8+Math.random()*(bn.r[3]-16);S.sorted++;yield* api.wait(0.5);}},
  sense:function(S,id){var st=api.st();
   if(id==="moisture"){var f=nearestAhead(st,S.items,22,45);return f?Math.round(f.m+noise(6)):Math.round(2+Math.random()*3);}
   if(id==="item_dist"){var f2=nearestAhead(st,S.items,150,22);return f2?Math.round(Math.max(0,D(st.robot.x,st.robot.y,f2.x,f2.y)-8)):150;}
   if(id==="item_type"){var f3=nearestAhead(st,S.items,70,30);return f3?f3.type:"none";}
   if(id==="holding")return !!S.held;return 0;},
  check:function(S){if(S.bad)return {win:false,msg:"Contaminated bin: a "+S.bad.item.kind+" ("+S.bad.item.type+") was put in the "+S.bad.bin.label+" bin. Check the item before you release it."};
   if(S.sorted>=S.total)return {win:true,msg:"★ All "+S.total+" items are in the right bins! "+o.win};
   if(S.t>=this.dur)return {win:false,msg:"Time is up: "+S.sorted+" of "+S.total+" items sorted."};return null;},
  end:function(S){return S.sorted>=S.total?{win:true,msg:"★ All "+S.total+" items are in the right bins! "+o.win}:{win:false,msg:"The program ended with "+(S.total-S.sorted)+" item(s) still on the floor."};},
  info:function(S){return [["Sorted",S.sorted+" / "+S.total],["Holding",S.held?"yes":"no"]];}};
 return d;}
register(wasteDef({id:"wetdry",name:"24 Wet & Dry",
 mission:"Sort the rubbish! <b>Wet waste</b> (food, damp) goes in the <b>WET</b> bin at the top. <b>Dry waste</b> (paper, plastic, cans) goes in the <b>DRY</b> bin at the bottom. A moisture probe tells you which is which.",
 hint:"Hint: Forever → Forward until item distance &lt; 15 → Grab → If moisture &gt; 40: turn left 90, forward 60, release, back 60, turn right 90 (else the same towards the DRY bin).",
 kit:["uno","bank","l298n","gear","us@front","soil","servo","buzzer"],
 types:["wet","dry","wet","dry","wet","dry"],lane:{x0:62,dx:32,y:100},
 kinds:{wet:["banana peel","orange peel","leftover ugali"],dry:["paper","plastic bottle","tin can"]},
 bins:[{id:"wet",label:"WET",accepts:["wet"],r:[20,8,260,34]},{id:"dry",label:"DRY",accepts:["dry"],r:[20,158,260,34]}],
 sensors:[{id:"moisture",label:"Moisture of item ahead >",unit:"%",type:"num",gt:true,need:"soil"},{id:"item_dist",label:"Item ahead closer than",unit:"cm",type:"num",need:"us"},{id:"holding",label:"Holding an item",type:"bool"}],
 win:"The city stays clean and the compost is pure."}));
register(wasteDef({id:"wastetype",name:"25 Recycling Centre",
 mission:"Sort 4 items into <b>four labelled bins</b>: <b>PLASTIC, PAPER, METAL, ORGANIC</b>. The AI camera names each item. Carry it to the matching bin.",
 hint:"Hint: the camera says what the item is (plastic, paper, metal, organic). Bins along the top wall, left to right: PLASTIC, PAPER, METAL, ORGANIC.",
 kit:["esp32","bank","l298n","gear","us@front","camera","servo","buzzer"],
 types:["plastic","paper","metal","organic"],lane:{x0:62,dx:40,y:128},
 kinds:{plastic:["plastic bottle","plastic bag"],paper:["newspaper","cardboard box"],metal:["tin can","soda can"],organic:["banana peel","mango seed"]},
 bins:[{id:"plastic",label:"PLASTIC",accepts:["plastic"],r:[10,8,64,36]},{id:"paper",label:"PAPER",accepts:["paper"],r:[82,8,64,36]},{id:"metal",label:"METAL",accepts:["metal"],r:[154,8,64,36]},{id:"organic",label:"ORGANIC",accepts:["organic"],r:[226,8,64,36]}],
 sensors:[{id:"item_type",label:"Item ahead is",type:"enum",opts:["plastic","paper","metal","organic","none"],need:"camera"},{id:"item_dist",label:"Item ahead closer than",unit:"cm",type:"num",need:"us"},{id:"holding",label:"Holding an item",type:"bool"}],
 win:"Recycling rate: 100%."}));

// ============================ 3: floating lake clean-up ============================
register({id:"lake",name:"26 Lake Clean-up",floor:"lake",chassis:"boat",walls:[[272,0,28,200]],wallH:6,start:{x:30,y:100,a:0},dur:180,
 mission:"Lake Victoria is full of rubbish! Drive the <b>floating robot</b>, scoop up plastic, cans and other waste, and unload each item into the matching <b>labelled bin at the shore</b> (right side).",
 hint:"Hint: Scoop down → drive into an item to collect it (the hold carries 3) → drive to the shore → Drop in bin. The camera tells you what each item is.",
 kit:["esp32","bank","l298n","gear","us@front","camera","scoop","buzzer"],
 actions:[{id:"scoop_down",label:"Scoop down",need:"scoop",tip:"Lower the net: items ahead are collected"},{id:"scoop_up",label:"Scoop up",need:"scoop"},{id:"drop_bin",label:"Drop top item in bin",need:"scoop",tip:"At the shore: unload the last item into the bin in front"}],
 sensors:[{id:"item_type",label:"Item ahead is",type:"enum",opts:["plastic","metal","other","none"],need:"camera"},{id:"item_dist",label:"Item ahead closer than",unit:"cm",type:"num",need:"us"},{id:"hold",label:"Items in hold >",unit:"",type:"num",gt:true}],
 init:function(S){S.t=0;S.scoop=false;S.hold=[];S.sorted=0;S.bins=[{id:"plastic",label:"PLASTIC",accepts:["plastic"],r:[274,12,24,52]},{id:"metal",label:"METAL",accepts:["metal"],r:[274,74,24,52]},{id:"other",label:"OTHER",accepts:["other"],r:[274,136,24,52]}];
  var kinds={plastic:["plastic bottle","plastic bag","plastic bottle"],metal:["tin can","tin can"],other:["old sandal","tyre"]},ty=shuffle(["plastic","plastic","plastic","metal","metal","other","other"]);
  S.items=ty.map(function(t,i){return {id:i,type:t,kind:pick(kinds[t]),x:R(80,205),y:R(25,175),hold:false,bin:null,vx:R(-1,1),vy:R(-1,1),rot:R(0,6)};});
  for(var i=0;i<S.items.length;i++)for(var j=0;j<i;j++)if(D(S.items[i].x,S.items[i].y,S.items[j].x,S.items[j].y)<22)S.items[i].y=Math.min(175,S.items[i].y+26);
  S.total=S.items.length;S.cur={x:2.4,y:1.2};},
 step:function(S,dt){var st=api.st();S.t+=dt;
  var cx=Math.cos(S.t*.3)*0.8+S.cur.x,cy=Math.sin(S.t*.23)*1.0+S.cur.y;
  if(st.status==="run"){var nx=st.robot.x+cx*dt*0.6,ny=st.robot.y+cy*dt*0.6;if(!api.hitsWall(nx,ny)){st.robot.x=nx;st.robot.y=ny;}}
  S.items.forEach(function(it){if(it.hold||it.bin)return;var nx=it.x+(cx*0.5+it.vx*.3)*dt,ny=it.y+(cy*0.5+it.vy*.3)*dt;if(nx>6&&nx<262)it.x=nx;if(ny>6&&ny<194)it.y=ny;});
  if(S.scoop&&S.hold.length<3){var f=fwd(st,12);S.items.forEach(function(it){if(it.hold||it.bin||S.hold.length>=3)return;if(D(f[0],f[1],it.x,it.y)<=12){it.hold=true;S.hold.push(it);}});}},
 act:function*(S,id){var st=api.st();
  if(id==="scoop_down"){S.scoop=true;yield* api.wait(0.5);return;}if(id==="scoop_up"){S.scoop=false;yield* api.wait(0.4);return;}
  if(id==="drop_bin"){if(!S.hold.length){yield* api.wait(0.3);return;}var f=fwd(st,13),bn=null;S.bins.forEach(function(b){if(f[0]>=b.r[0]-14&&f[1]>=b.r[1]-6&&f[1]<=b.r[1]+b.r[3]+6)bn=b;});
   if(!bn){S.msg="Not at a bin";yield* api.wait(0.3);return;}var it=S.hold.pop();it.hold=false;
   if(bn.accepts.indexOf(it.type)<0){S.bad={item:it,bin:bn};return;}it.bin=bn.id;it.x=bn.r[0]+6+Math.random()*(bn.r[2]-12);it.y=bn.r[1]+6+Math.random()*(bn.r[3]-12);S.sorted++;yield* api.wait(0.6);}},
 sense:function(S,id){var st=api.st();
  if(id==="item_type"){var f=nearestAhead(st,S.items,70,30);return f?f.type:"none";}
  if(id==="item_dist"){var f2=nearestAhead(st,S.items,150,22);return f2?Math.round(Math.max(0,D(st.robot.x,st.robot.y,f2.x,f2.y)-8)):150;}
  if(id==="hold")return S.hold.length;return 0;},
 check:function(S){if(S.bad)return {win:false,msg:"Wrong bin: a "+S.bad.item.kind+" ("+S.bad.item.type+") went into the "+S.bad.bin.label+" bin."};
  if(S.sorted>=S.total)return {win:true,msg:"★ The lake is clean! All "+S.total+" items are in the right bins."};if(S.t>=this.dur)return {win:false,msg:"Time is up: "+S.sorted+" of "+S.total+" items recovered."};return null;},
 end:function(S){return S.sorted>=S.total?{win:true,msg:"★ The lake is clean!"}:{win:false,msg:"The program ended with "+(S.total-S.sorted)+" item(s) still in the lake or in the hold."};},
 info:function(S){return [["Recovered",S.sorted+" / "+S.total],["In hold",S.hold.length+" / 3"]];}});

// ============================ 4: irrigation robot ============================
register({id:"irrigate",name:"27 Smart Irrigation",floor:"farm",start:{x:18,y:100,a:0},dur:170,
 mission:"Drive down the aisle between the crop rows. Test the <b>soil moisture</b> of each plant and water <b>only the dry ones</b> (below 35%). The tank holds 4 waterings: refill at the <b>depot</b> at the end.",
 hint:"Hint: Repeat 5 → Forward 50 → If moisture left &lt; 35: water left. Same on the right. Refill at the depot (right end).",
 kit:["uno","bank","l298n","gear","soil","pump","buzzer"],
 actions:[{id:"water_left",label:"Water plant on the left",need:"pump"},{id:"water_right",label:"Water plant on the right",need:"pump"},{id:"refill",label:"Refill tank (at depot)",need:"pump"}],
 sensors:[{id:"moisture_left",label:"Moisture on LEFT <",unit:"%",type:"num",need:"soil"},{id:"moisture_right",label:"Moisture on RIGHT <",unit:"%",type:"num",need:"soil"},{id:"tank",label:"Water tank left <",unit:"units",type:"num"}],
 init:function(S){S.t=0;S.tank=4;S.cap=4;S.wasted=0;S.pump=0;S.plants=[];var xs=[62,106,150,194,238],dryN=RI(3,5),ids=shuffle([0,1,2,3,4,5,6,7,8,9]).slice(0,dryN);
  [60,140].forEach(function(y,r){xs.forEach(function(x,c){var i=r*5+c,dry=ids.indexOf(i)>=0;S.plants.push({x:x+noise(6),y:y,side:r===0?"left":"right",m:dry?RI(6,28):RI(48,88),dry:dry,watered:false});});});
  S.dryN=dryN;S.msg="";},
 step:function(S,dt){S.t+=dt;S.pump=Math.max(0,S.pump-dt);},
 plantAt:function(S,side){var st=api.st(),best=null,bd=99;S.plants.forEach(function(p){if(p.side!==side)return;var d=Math.abs(p.x-st.robot.x);if(d<14&&d<bd){bd=d;best=p;}});return best;},
 act:function*(S,id){var st=api.st(),me=def.irrigate;
  if(id==="refill"){if(st.robot.x>=246){S.tank=S.cap;S.msg="Tank refilled";yield* api.wait(1.2);}else{S.msg="Not at the depot";yield* api.wait(0.3);}return;}
  var side=id==="water_left"?"left":"right",p=me.plantAt(S,side);
  if(S.tank<=0){S.msg="Tank empty";yield* api.wait(0.5);return;}
  S.tank--;S.pump=1.3;S.pside=side;S.pp=p;
  yield* api.wait(1.3);
  if(p&&p.dry&&!p.watered){p.watered=true;p.m=Math.min(90,p.m+55);}else S.wasted++;},
 sense:function(S,id){var me=def.irrigate;
  if(id==="moisture_left"||id==="moisture_right"){var p=me.plantAt(S,id==="moisture_left"?"left":"right");return p?Math.round(p.m+noise(4)):0;}
  if(id==="tank")return S.tank;return 0;},
 check:function(S){if(S.t>=this.dur)return me2(S);return null;},
 end:function(S){return me2(S);},
 info:function(S){var d=S.plants.filter(function(p){return p.dry&&p.watered;}).length;return [["Dry plants watered",d+" / "+S.dryN],["Tank",S.tank+" / "+S.cap],["Water wasted",String(S.wasted)]];}});
function me2(S){var left=S.plants.filter(function(p){return p.dry&&!p.watered;}).length;
 if(S.wasted>0)return {win:false,msg:"Water wasted "+S.wasted+"×: you watered a plant that was already moist (or empty air). Test the soil first."};
 if(left>0)return {win:false,msg:left+" dry plant"+(left>1?"s were":" was")+" not watered."};
 return {win:true,msg:"★ Every dry plant is watered and not a drop was wasted!"};}

// ============================ 5: rain clothesline ============================
register({id:"cloth",name:"28 Rain Clothesline",floor:"farm",station:true,dur:100,start:{x:150,y:100,a:0},
 mission:"The washing is hanging out to dry. When <b>drizzle</b> starts, <b>fold</b> the clothesline under the roof. When the rain <b>stops</b>, <b>unfold</b> it so the sun can dry the clothes. Be fast: wet clothes never dry!",
 hint:"Hint: Forever → If rain sensor &gt; 25: Fold line, else: Unfold line. The clothes need about 45 s of sunshine to dry.",
 kit:["uno","bank","rain","servo2","ldr","lcd"],
 actions:[{id:"fold",label:"Fold clothesline (cover)",need:"servo2",tip:"Winch pulls the clothes under the roof"},{id:"unfold",label:"Unfold clothesline",need:"servo2"}],
 sensors:[{id:"rain",label:"Rain sensor >",unit:"%",type:"num",gt:true,need:"rain"},{id:"sunlight",label:"Sunlight >",unit:"%",type:"num",gt:true,need:"ldr"},{id:"line_pos",label:"Line extended >",unit:"%",type:"num",gt:true}],
 init:function(S){S.t=0;S.pos=1;S.target=1;S.damp=100;S.rain=0;S.showers=[];var s1=R(10,22);S.showers.push({s:s1,e:s1+R(14,20),k:R(45,70)});var s2=R(55,66);S.showers.push({s:s2,e:s2+R(12,16),k:R(60,90)});S.wetSec=0;S.sun=true;},
 step:function(S,dt){S.t+=dt;var r=0;S.showers.forEach(function(w){if(S.t>=w.s&&S.t<=w.e)r=w.k*Math.min(1,(S.t-w.s)/2.5)*Math.min(1,(w.e-S.t)/1.5+0.2);});
  S.rain+=(r-S.rain)*Math.min(1,dt*3);if(Math.abs(S.rain)<0.5)S.rain=0;S.sun=S.rain===0;
  var sp=0.45*dt;S.pos+=Math.max(-sp,Math.min(sp,S.target-S.pos));
  if(S.pos>0.3&&S.rain>0){S.damp=Math.min(100,S.damp+S.rain*0.09*dt);S.wetSec+=dt;}
  else if(S.pos>0.8&&S.sun){S.damp=Math.max(0,S.damp-2.3*dt);}},
 act:function*(S,id){S.target=id==="fold"?0:1;yield* api.wait(0.25);},
 sense:function(S,id){if(id==="rain")return Math.round(Math.max(0,S.rain*(S.pos>0.3?1:1)+noise(3)));if(id==="sunlight")return Math.round(S.sun?(80+noise(6)):(25+noise(6)));if(id==="line_pos")return Math.round(S.pos*100);return 0;},
 check:function(S){if(S.t>=this.dur)return cl2(S);return null;},end:function(S){return cl2(S);},
 info:function(S){return [["Rain",Math.round(S.rain)+"%"],["Clothes dampness",Math.round(S.damp)+"%"],["Line",S.pos>0.9?"out":S.pos<0.1?"folded":"moving"]];}});
function cl2(S){if(S.damp<=30)return {win:true,msg:"★ Dry, clean clothes! The line folded in time and spent "+Math.round(S.wetSec)+" s in the rain."};
 return {win:false,msg:"The clothes are still "+Math.round(S.damp)+"% damp. "+(S.wetSec>6?"They stayed out in the rain for "+Math.round(S.wetSec)+" s. Fold faster.":"They did not get enough sunshine. Unfold as soon as the rain stops.")};}

// ============================ 6: drone picks ripe tomatoes ============================
register({id:"tomato",name:"29 Tomato Picker",floor:"farm",drone:true,pad:[30,40,20],start:{x:30,y:40,a:0},walls:[],dur:170,
 mission:"Fly the <b>drone</b> over the tomato rows. Use the <b>camera</b> to spot <b>ripe (red)</b> tomatoes, pick them with the gripper, and drop them in the <b>basket</b> next to the pad. Leave the <b>green</b> ones to ripen, then land.",
 hint:"Hint: Take off, climb to the fruit height, turn to line up (fruit offset), fly forward until fruit distance &lt; 20, Pick. The tray holds 3.",
 kit:["esp32","bank","dronekit","camera","claw"],
 actions:[{id:"pick",label:"Pick fruit in claw reach",need:"claw",tip:"Grabs the fruit just in front of the drone"},{id:"drop_basket",label:"Drop tray into basket",need:"claw",tip:"Above the basket by the pad"}],
 sensors:[{id:"fruit_colour",label:"Fruit ahead is",type:"enum",opts:["red","green","none"],need:"camera"},{id:"fruit_dx",label:"Fruit sideways offset >",unit:"cm",type:"num",gt:true,need:"camera"},{id:"fruit_dz",label:"Fruit height offset >",unit:"cm",type:"num",gt:true,need:"camera"},{id:"fruit_dist",label:"Fruit distance <",unit:"cm",type:"num",need:"camera"}],
 init:function(S){S.t=0;S.fruit=[];S.tray=[];S.basket=0;S.bad=null;S.lost=0;S.basketPos=[30,110];
  var plants=[[95,60],[155,60],[215,60],[95,140],[155,140],[215,140]];S.plants=plants.map(function(p){return {x:p[0],y:p[1]};});
  var ripeN=RI(3,5),slots=shuffle([0,1,2,3,4,5,6,7,8,9,10,11]).slice(0,ripeN);
  plants.forEach(function(p,i){for(var k=0;k<2;k++){var idx=i*2+k,side=p[1]<100?1:-1;S.fruit.push({id:idx,x:p[0]+noise(8),y:p[1]+side*14+noise(3),z:RI(70,115)+k*8,ripe:slots.indexOf(idx)>=0,gone:false,hold:false});}});
  S.ripeN=ripeN;},
 step:function(S,dt){S.t+=dt;},
 view:function(S,f){var st=api.st(),d=st.drone;var a=rad(st.robot.a),dx=f.x-st.robot.x,dy=f.y-st.robot.y,fw=dx*Math.cos(a)+dy*Math.sin(a),sd=-dx*Math.sin(a)+dy*Math.cos(a);return {fw:fw,sd:sd,dz:f.z-d.z};},
 near:function(S,fw,sd,dz,filter){var me=def.tomato,best=null,bd=1e9;S.fruit.forEach(function(f){if(f.gone||f.hold||(filter&&!filter(f)))return;var v=me.view(S,f);if(v.fw<0||v.fw>fw||Math.abs(v.sd)>sd||Math.abs(v.dz)>dz)return;if(v.fw<bd){bd=v.fw;best=f;}});return best;},
 act:function*(S,id){var st=api.st(),me=def.tomato;
  if(id==="pick"){if(!st.drone.flying)throw new Error("The drone must be flying to pick fruit.");if(S.tray.length>=3){S.msg="Tray full";yield* api.wait(0.4);return;}var f=me.near(S,26,15,15);if(!f){S.msg="Nothing in reach";yield* api.wait(0.5);return;}
   if(!f.ripe){S.bad="You picked an unripe (green) tomato. Check the colour with the camera first.";return;}f.hold=true;S.tray.push(f);yield* api.wait(0.8);return;}
  if(id==="drop_basket"){if(!S.tray.length){yield* api.wait(0.3);return;}var d=D(st.robot.x,st.robot.y,S.basketPos[0],S.basketPos[1]);
   if(d<=26&&st.drone.z<=95){S.tray.forEach(function(f){f.hold=false;f.gone=true;f.inBasket=true;S.basket++;});S.tray=[];yield* api.wait(0.8);return;}
   S.tray.forEach(function(f){f.hold=false;f.gone=true;S.lost++;});S.tray=[];S.bad="You dropped the tomatoes away from the basket. Fly above the basket (next to the pad) first.";}},
 sense:function(S,id){var me=def.tomato,f=me.near(S,70,28,32);
  if(id==="fruit_colour")return f?(f.ripe?"red":"green"):"none";
  if(!f)return id==="fruit_dist"?150:0;var v=me.view(S,f);
  if(id==="fruit_dx")return Math.round(v.sd);if(id==="fruit_dz")return Math.round(v.dz);if(id==="fruit_dist")return Math.round(v.fw);return 0;},
 check:function(S){if(S.bad)return {win:false,msg:S.bad};if(S.t>=this.dur)return {win:false,msg:"Time is up: "+S.basket+" of "+S.ripeN+" ripe tomatoes are in the basket."};return null;},
 end:function(S){var st=api.st();if(st.drone.flying)return {win:false,msg:"The drone is still in the air. Land it at the end."};
  if(S.tray.length)return {win:false,msg:"There are still tomatoes in the tray. Drop them in the basket."};
  return S.basket>=S.ripeN?{win:true,msg:"★ "+S.ripeN+" ripe tomatoes picked, none wasted, drone landed safely!"}:{win:false,msg:S.basket+" of "+S.ripeN+" ripe tomatoes are in the basket."};},
 info:function(S){return [["In basket",S.basket+" / "+S.ripeN],["Tray",S.tray.length+" / 3"]];}});

// ============================ 7: crop monitoring + phone app ============================
register({id:"cropmon",name:"30 Crop Monitor",floor:"farm",start:{x:18,y:100,a:0},dur:150,needsAny:true,
 plots:[[40,70,52,60],[104,70,52,60],[168,70,52,60],[232,70,52,60]],
 mission:"Patrol the farm and check every plot: <b>moisture, temperature, humidity and leaf health</b> (camera AI). <b>Send the data</b> to the farmer's phone, and send an <b>alert</b> for each problem you find: dry soil, heat stress, high humidity (fungus risk) or crop disease. No false alarms!",
 hint:"Hint: Repeat 4 → Forward 64 → Send data. If moisture &lt; 30 → Alert 1 (dry). If temperature &gt; 33 → Alert 2. If leaf is blight/rust → Alert 3. If humidity &gt; 80 → Alert 4.",
 kit:["esp32","bank","l298n","gear","soil","dht","camera","bt"],
 actions:[{id:"send_data",label:"Send plot data to phone",need:["esp32","bt","gsm"],tip:"Updates the farmer's phone dashboard"},{id:"send_alert",label:"Send alert to phone (1 dry, 2 hot, 3 disease, 4 humid)",p:{def:1,unit:"",min:1,max:4},need:["esp32","bt","gsm"]}],
 sensors:[{id:"moisture",label:"Soil moisture <",unit:"%",type:"num",need:"soil"},{id:"temperature",label:"Temperature >",unit:"°C",type:"num",gt:true,need:"dht"},{id:"humidity",label:"Humidity >",unit:"%",type:"num",gt:true,need:"dht"},{id:"leaf",label:"Leaf health is",type:"enum",opts:["healthy","blight","rust"],need:"camera"}],
 init:function(S){S.t=0;S.msgs=[];S.data={};S.false=0;S.rep={};S.plots=[0,1,2,3].map(function(i){return {i:i,m:RI(48,78),t:+(R(25,30)).toFixed(1),h:RI(50,68),leaf:"healthy",x:40+i*64,y:70,w:52,h2:60};});
  var kinds=shuffle(["dry","hot","disease","humid"]).slice(0,RI(2,3)),spots=shuffle([0,1,2,3]);S.issues=[];
  kinds.forEach(function(k,j){var p=S.plots[spots[j]];if(k==="dry")p.m=RI(8,24);else if(k==="hot")p.t=+(R(35,40)).toFixed(1);else if(k==="disease")p.leaf=pick(["blight","rust"]);else p.h=RI(86,96);S.issues.push({plot:p.i,code:{dry:1,hot:2,disease:3,humid:4}[k],kind:k,done:false});});},
 step:function(S,dt){S.t+=dt;},
 plot:function(S){var st=api.st(),p=null;S.plots.forEach(function(q){if(st.robot.x>=q.x&&st.robot.x<=q.x+q.w)p=q;});return p;},
 act:function*(S,id,v){var me=def.cropmon,p=me.plot(S),st=api.st();if(!p){S.msg="Not over a plot";yield* api.wait(0.3);return;}
  if(id==="send_data"){S.data[p.i]={m:p.m,t:p.t,h:p.h,leaf:p.leaf};S.msgs.push({t:S.t,txt:"Plot "+(p.i+1)+": moisture "+p.m+"%, "+p.t+"°C, humidity "+p.h+"%, leaf "+p.leaf});yield* api.wait(0.6);return;}
  var code=Math.round(v||1),iss=S.issues.filter(function(x){return x.plot===p.i&&x.code===code;})[0],names={1:"DRY SOIL",2:"HEAT STRESS",3:"CROP DISEASE",4:"HIGH HUMIDITY (fungus risk)"};
  if(!iss||iss.done){S.false++;S.msgs.push({t:S.t,txt:"⚠ FALSE ALARM: "+(names[code]||"alert")+" at plot "+(p.i+1),bad:true});return;}
  iss.done=true;S.msgs.push({t:S.t,txt:"🚨 ALERT: "+names[code]+" at plot "+(p.i+1),alert:true});yield* api.wait(0.6);},
 sense:function(S,id){var p=def.cropmon.plot(S);if(!p)return id==="leaf"?"healthy":(id==="moisture"?0:id==="temperature"?24:50);
  if(id==="moisture")return Math.round(p.m+noise(4));if(id==="temperature")return +(p.t+noise(.8)).toFixed(1);if(id==="humidity")return Math.round(p.h+noise(3));if(id==="leaf")return p.leaf;return 0;},
 check:function(S){if(S.false>=1)return {win:false,msg:"False alarm sent to the farmer. Only send an alert when a reading is really out of range."};if(S.t>=this.dur)return cm2(S);return null;},end:function(S){return cm2(S);},
 info:function(S){return [["Problems reported",S.issues.filter(function(x){return x.done;}).length+" / "+S.issues.length],["Plots logged",Object.keys(S.data).length+" / 4"]];}});
function cm2(S){var left=S.issues.filter(function(x){return !x.done;}).length;if(left)return {win:false,msg:left+" problem"+(left>1?"s were":" was")+" not reported to the farmer's phone."};
 if(Object.keys(S.data).length<4)return {win:false,msg:"All problems found, but only "+Object.keys(S.data).length+" of 4 plots sent their data. Log every plot."};
 return {win:true,msg:"★ Smart farm! All "+S.issues.length+" problems reported to the phone and all plots logged."};}

// ============================ 8: pothole drone ============================
register({id:"pothole",name:"31 Pothole Patrol",floor:"road",drone:true,pad:[30,100,22],start:{x:30,y:100,a:0},walls:[],dur:150,drain:1.0,
 mission:"Fly the <b>drone along the road</b>. The camera AI spots <b>potholes</b>. For each one, send an <b>SMS to the roads authority</b> and <b>warn drivers on the map</b> (through the phone), then land back on the pad. No false reports!",
 hint:"Hint: Take off, climb to ~80 cm, fly forward in short steps. If pothole below → SMS authority, Warn on map. Then Land on the pad.",
 kit:["esp32","bank","dronekit","camera","gps","gsm"],
 actions:[{id:"sms_authority",label:"SMS the roads authority (KURA/KeRRA)",need:"gsm",needAlso:"gps",tip:"Sends the GPS position of the pothole"},{id:"warn_map",label:"Warn road users on the map",need:["bt","esp32"],needAlso:"gps"}],
 sensors:[{id:"pothole_below",label:"Pothole below drone",type:"bool",need:"camera"},{id:"pothole_dist",label:"Pothole ahead closer than",unit:"cm",type:"num",need:"camera"}],
 init:function(S){S.t=0;S.holes=[];var n=RI(3,4),xs=shuffle([90,125,160,195,230]).slice(0,n);xs.forEach(function(x,i){S.holes.push({id:i,x:x+noise(8),y:100+R(-22,22),r:R(8,12),sms:false,map:false});});S.msgs=[];S.warn=[];S.bad=null;S.roadName="Thika Road";},
 step:function(S,dt){S.t+=dt;},
 under:function(S,hole){var st=api.st(),d=st.drone;return D(st.robot.x,st.robot.y,hole.x,hole.y)<=hole.r+8&&d.z>=15&&d.z<=180;},
 act:function*(S,id){var st=api.st(),me=def.pothole,h=S.holes.filter(function(q){return me.under(S,q);})[0];
  if(!st.drone.flying)throw new Error("The drone must be flying over the pothole to report it.");
  if(!h){S.bad="False report: there is no pothole under the drone. Use the camera to check first.";return;}
  var lat=(-1.2183-(h.x-30)*0.00009).toFixed(5),lon=(36.8872+(h.y-100)*0.00004+ (h.x-30)*0.00003).toFixed(5);
  if(id==="sms_authority"){if(h.sms){yield* api.wait(0.3);return;}h.sms=true;S.msgs.push({t:S.t,txt:"To: KURA Roads Authority\nPOTHOLE REPORT #"+(h.id+1)+": "+S.roadName+", GPS "+lat+", "+lon+". Approx "+Math.round(h.r*2)+" cm wide. Please repair.",ok:true});yield* api.wait(0.8);return;}
  if(!h.map){h.map=true;S.warn.push({id:h.id,x:h.x,y:h.y,lat:lat,lon:lon});}yield* api.wait(0.8);},
 sense:function(S,id){var st=api.st(),me=def.pothole;
  if(id==="pothole_below")return S.holes.some(function(h){return me.under(S,h);});
  var best=150;S.holes.forEach(function(h){var b=Math.abs(bearing(st,h.x,h.y));var d=D(st.robot.x,st.robot.y,h.x,h.y);if(b<30&&d<best)best=d;});return Math.round(best);},
 check:function(S){if(S.bad)return {win:false,msg:S.bad};if(S.t>=this.dur)return {win:false,msg:"Time is up before every pothole was reported."};return null;},
 end:function(S){var st=api.st(),d=st.drone;if(d.flying)return {win:false,msg:"The drone is still in the air. Land on the pad."};var left=S.holes.filter(function(h){return !h.sms||!h.map;}).length;
  if(left)return {win:false,msg:left+" pothole"+(left>1?"s still need":" still needs")+" both an SMS and a map warning."};
  if(D(st.robot.x,st.robot.y,30,100)>22)return {win:false,msg:"All potholes reported, but the drone did not land on the pad."};
  return {win:true,msg:"★ "+S.holes.length+" potholes reported to the roads authority and shown on the map. Safer roads!"};},
 info:function(S){return [["SMS sent",S.holes.filter(function(h){return h.sms;}).length+" / "+S.holes.length],["Map warnings",S.holes.filter(function(h){return h.map;}).length+" / "+S.holes.length]];}});

// ============================ 9: fire detection + extinguisher arm ============================
register({id:"fire",name:"32 Fire Fighter",floor:"workshop",arm:true,start:{x:150,y:178,a:270},walls:[],cubes:[],bins:[],dur:70,
 mission:"A <b>fire</b> starts! Sound the <b>alarm</b>, then aim the robot arm at the flames and <b>spray</b> the extinguisher. The fire <b>moves</b>: follow it with the flame sensor until it is out. Do not waste water!",
 hint:"Hint: Alarm on → Forever: Spray off; if fire direction &gt; 6 → turn base +6; else if &lt; −6 → turn base −6; else Spray on, wait 0.5.",
 kit:["uno","bank","armkit","flame","smoke","ext","buzzer"],
 actions:[{id:"alarm_on",label:"Sound the fire alarm",need:"buzzer"},{id:"base_by",label:"Turn arm base by",p:{def:6,unit:"°",min:-45,max:45},need:"armkit",tip:"Relative turn: positive = towards the right"},{id:"alarm_off",label:"Alarm off",need:"buzzer"},{id:"spray_on",label:"Spray extinguisher ON",need:"ext"},{id:"spray_off",label:"Spray OFF",need:"ext"}],
 sensors:[{id:"flame_dir",label:"Fire direction (− left, + right) >",unit:"°",type:"num",gt:true,need:"flame"},{id:"flame",label:"Flame strength >",unit:"%",type:"num",gt:true,need:"flame"},{id:"smoke",label:"Smoke level >",unit:"%",type:"num",gt:true,need:"smoke"}],
 init:function(S){var A0=api.st().arm;A0.s=55;A0.e=40;S.t=0;S.fire=100;S.ang=RI(40,140);S.alarm=false;S.alarmT=null;S.spray=false;S.tank=100;S.used=0;S.hit=false;S.moves=[{t:16,a:null},{t:32,a:null}];S.moves.forEach(function(m){m.a=Math.max(25,Math.min(155,S.ang+(Math.random()<.5?-1:1)*RI(35,60)));});S.mi=0;S.smoke=0;S.fireT0=3;},
 step:function(S,dt){var st=api.st();S.t+=dt;
  if(S.t>=S.fireT0&&S.fire>0){S.smoke=Math.min(100,S.smoke+9*dt);}
  if(S.mi<S.moves.length&&S.t>=S.moves[S.mi].t&&S.fire>0){S.ang=S.moves[S.mi].a;S.mi++;}
  var err=S.ang-st.arm.b;
  if(S.spray&&S.tank>0){S.tank=Math.max(0,S.tank-4.5*dt);S.used+=4.5*dt;if(Math.abs(err)<=8){S.fire=Math.max(0,S.fire-16*dt);S.hit=true;}}
  else if(S.fire>0&&S.t>S.fireT0)S.fire=Math.min(100,S.fire+1.4*dt);
  if(S.fire<=0)S.smoke=Math.max(0,S.smoke-20*dt);},
 act:function*(S,id,v){var st=api.st();if(id==="base_by"){var nb=Math.max(0,Math.min(180,st.arm.b+(v==null?6:+v)));yield* api.armTo("b",nb);return;}if(id==="alarm_on"){S.alarm=true;if(S.alarmT==null)S.alarmT=S.t;}else if(id==="alarm_off")S.alarm=false;else if(id==="spray_on")S.spray=true;else if(id==="spray_off")S.spray=false;yield* api.wait(0.15);},
 sense:function(S,id){var st=api.st();var err=S.ang-st.arm.b;
  if(id==="flame_dir")return S.fire>0?Math.round(err+noise(2)):0;if(id==="flame")return S.fire>0?Math.round(Math.max(0,S.fire*(1-Math.min(1,Math.abs(err)/110)))+noise(3)):0;
  if(id==="smoke")return Math.round(S.smoke+noise(3));return 0;},
 check:function(S){if(S.fire<=0){if(S.alarmT==null)return {win:false,msg:"The fire is out, but you never sounded the alarm. People must be warned first!"};
   if(S.used>70)return {win:false,msg:"Fire out, but you used "+Math.round(S.used)+"% of the water tank. Aim better next time."};return {win:true,msg:"★ Fire out in "+Math.round(S.t)+" s, alarm raised and only "+Math.round(S.used)+"% of the water used!"};}
  if(S.tank<=0&&S.fire>0)return {win:false,msg:"The extinguisher tank ran empty and the fire is still burning."};
  if(S.t>=this.dur)return {win:false,msg:"The fire spread out of control. Be faster at aiming."};return null;},
 end:function(S){return S.fire<=0?this.check(S):{win:false,msg:"The program ended with the fire still burning ("+Math.round(S.fire)+"%)."};},
 info:function(S){return [["Fire",Math.round(S.fire)+"%"],["Alarm",S.alarm?"ON":"off"],["Water tank",Math.round(S.tank)+"%"]];}});

// ============================ 10: automatic hand washing ============================
register({id:"handwash",name:"33 Hand Washing",floor:"workshop",station:true,dur:80,start:{x:150,y:100,a:0},
 mission:"Build an <b>automatic hand-washing station</b>. When <b>hands</b> appear: run the water, dispense <b>soap once</b>, keep scrubbing, and <b>turn the water off</b> as soon as the hands leave. 3 people will come. Do not waste water!",
 hint:"Hint: Forever → If hands detected: Water on, Soap, Wait 4, … else: Water off. Soap only once per person!",
 kit:["uno","bank","irobs","pump","soap","buzzer","lcd"],
 actions:[{id:"water_on",label:"Tap water ON",need:"pump"},{id:"water_off",label:"Tap water OFF",need:"pump"},{id:"soap",label:"Dispense soap",need:"soap"},{id:"beep",label:"Scrub timer beep",need:"buzzer"}],
 sensors:[{id:"hands",label:"Hands under the tap",type:"bool",need:["irobs","us","sharp"]}],
 init:function(S){S.t=0;S.water=false;S.visits=[];var t=R(5,9);for(var i=0;i<3;i++){S.visits.push({s:t,e:t+14,soap:0,wetT:0,done:false,beeps:0});t+=14+R(8,14);}S.waste=0;S.used=0;S.bad=null;S.last=null;},
 step:function(S,dt){S.t+=dt;var v=S.visits.filter(function(q){return S.t>=q.s&&S.t<=q.e;})[0];S.here=v||null;
  if(S.water){S.used+=0.15*dt;if(v)v.wetT+=dt;else S.waste+=0.15*dt;}
  S.visits.forEach(function(q){if(!q.done&&S.t>q.e){q.done=true;if(q.soap===0)S.bad="Person "+(S.visits.indexOf(q)+1)+" left without soap. Dispense soap when hands are under the tap.";else if(q.wetT<4)S.bad="Person "+(S.visits.indexOf(q)+1)+" got only "+q.wetT.toFixed(1)+" s of running water (need 4 s) to rinse.";}});},
 act:function*(S,id){if(id==="water_on")S.water=true;else if(id==="water_off")S.water=false;
  else if(id==="soap"){var v=S.here;if(v){v.soap++;if(v.soap>1){S.bad="Soap wasted: you dispensed soap twice for the same person.";return;}}else{S.bad="Soap wasted: no hands were under the dispenser.";return;}S.soapT=S.t;yield* api.wait(0.6);return;}
  else if(id==="beep"){if(S.here)S.here.beeps++;yield* api.wait(0.3);return;}yield* api.wait(0.1);},
 sense:function(S,id){return !!S.here;},
 check:function(S){if(S.bad)return {win:false,msg:S.bad};if(S.waste>0.45)return {win:false,msg:"Water wasted: the tap ran with nobody there ("+S.waste.toFixed(2)+" L). Switch it off when hands leave."};if(S.t>=this.dur)return hw2(S);return null;},end:function(S){return hw2(S);},
 info:function(S){return [["Tap",S.water?"RUNNING":"off"],["Water used",S.used.toFixed(2)+" L"],["Wasted",S.waste.toFixed(2)+" L"]];}});
function hw2(S){if(S.visits.some(function(v){return v.soap===0||v.wetT<4;}))return {win:false,msg:"Not every person got soap and water."};
 return {win:true,msg:"★ 3 people washed their hands properly. Water used "+S.used.toFixed(2)+" L, wasted only "+S.waste.toFixed(2)+" L."};}

// ============================ 11: smart dam gate ============================
register({id:"dam",name:"34 Smart Dam Gate",floor:"workshop",station:true,dur:120,start:{x:150,y:100,a:0},
 mission:"Run the <b>dam gate</b> automatically. Rain is coming! Keep the water level <b>between 35% and 85%</b>. Open the gate when it rises, close it when it falls, and sound the <b>siren</b> before opening wide (&gt; 60%) to warn people downstream.",
 hint:"Hint: Forever → If water level &gt; 70: Set gate 80 (siren first!), else if level &lt; 45: Set gate 10. The rain gauge warns you about storms.",
 kit:["uno","bank","wlevel","servo2","rain","buzzer","lcd"],
 actions:[{id:"set_gate",label:"Set gate opening to",p:{def:50,unit:"%",min:0,max:100},need:"servo2"},{id:"siren",label:"Sound downstream siren",need:"buzzer"}],
 sensors:[{id:"water_level",label:"Dam water level >",unit:"%",type:"num",gt:true,need:["wlevel","us"]},{id:"rain_gauge",label:"Upstream rain gauge >",unit:"%",type:"num",gt:true,need:"rain"},{id:"gate",label:"Gate opening >",unit:"%",type:"num",gt:true}],
 init:function(S){S.t=0;S.level=52;S.gate=0;S.target=0;S.inband=0;S.siren=-99;S.warnDue=null;S.bad=null;S.storm=R(24,34);S.peak=R(6.4,7.4);S.hist=[];S.over=0;},
 inflow:function(S){var t=S.t,s=S.storm,base=1.6;if(t>s&&t<s+34){var k=Math.sin(Math.PI*(t-s)/34);return base+(S.peak-base)*Math.pow(k,0.7);}if(t>s+60&&t<s+80){return base+3.2*Math.sin(Math.PI*(t-s-60)/20);}return base;},
 step:function(S,dt){S.t+=dt;var sp=24*dt;S.gate+=Math.max(-sp,Math.min(sp,S.target-S.gate));
  var inf=def.dam.inflow(S),out=S.gate/100*9*Math.sqrt(Math.max(0,S.level)/100);S.level+=(inf-out)*dt;S.level=Math.max(0,S.level);
  if(S.level>=35&&S.level<=85)S.inband+=dt;S.in=inf;
  if(S.warnDue!=null&&S.t>S.warnDue&&S.t-S.siren>6&&!S.bad)S.bad="The gate opened wide but the downstream siren was not sounded. People and cattle by the river were not warned.";
  if(S.t%1<dt)S.hist.push(S.level);},
 act:function*(S,id,v){if(id==="siren"){S.siren=S.t;S.warnDue=null;yield* api.wait(0.5);return;}
  var g=Math.max(0,Math.min(100,Math.round(v==null?50:v)));if(g>60&&S.target<=60&&S.t-S.siren>15)S.warnDue=S.t+3;S.target=g;yield* api.wait(0.2);},
 sense:function(S,id){if(id==="water_level")return Math.round(S.level+noise(1.2));if(id==="gate")return Math.round(S.gate);
  if(id==="rain_gauge"){var lead=S.storm-7,t=S.t,v=0;if(t>lead&&t<S.storm+34)v=Math.min(100,(t-lead)/10*60+Math.max(0,t-S.storm)*1.2);if(t>S.storm+34)v=Math.max(0,60-(t-S.storm-34)*4);if(t>S.storm+57&&t<S.storm+80)v=45;return Math.round(Math.max(0,v+noise(4)));}return 0;},
 check:function(S){if(S.bad)return {win:false,msg:S.bad};if(S.level>=95)return {win:false,msg:"The dam overtopped at "+Math.round(S.level)+"%! Open the gate earlier (watch the rain gauge)."};if(S.level<=10&&S.t>5)return {win:false,msg:"The reservoir ran almost dry ("+Math.round(S.level)+"%): downstream farms and towns lose their water supply."};
  if(S.t>=this.dur){var pc=S.inband/S.t*100;return pc>=80?{win:true,msg:"★ Dam under control! The level stayed in the safe band "+Math.round(pc)+"% of the time."}:{win:false,msg:"The level was safe only "+Math.round(pc)+"% of the time (need 80%). Respond faster."};}return null;},
 end:function(S){return this.check(S)||{win:false,msg:"Program ended early."};},
 info:function(S){return [["Water level",Math.round(S.level)+"%"],["Gate",Math.round(S.gate)+"%"],["Inflow",S.in.toFixed(1)+" /s"]];}});

return {def:def,levels:levels,bind:bind};
})();
if(typeof module!=="undefined")module.exports=SCN;
