var Mila=(function(){
var LB={takeoff:"take off",land:"land",up:"fly up",down:"fly down",armb:"turn the arm base to",arms:"raise the shoulder to",arme:"set the elbow to",fwd:"drive forward",back:"drive backward",left:"turn left",right:"turn right",wait:"wait",stop:"stop",water:"water the plant",fanon:"switch the fan on",fanoff:"switch the fan off",gripc:"close the gripper",gripo:"open the gripper",led:"set the LED",beep:"beep",print:"show text on the LCD"};
var UN={up:" cm",down:" cm",armb:"°",arms:"°",arme:"°",fwd:" cm",back:" cm",left:"°",right:"°",wait:" s"};
var CN={alt:"the altitude is below",dfront:"a wall is closer than",bat:"the battery is below",cubecol:"the cube under the gripper is",front:"the front distance is less than",left:"the left distance is less than",right:"the right distance is less than",lineL:"the left line sensor sees the line",lineR:"the right line sensor sees the line",soil:"soil moisture is below",color:"the floor colour is",light:"the light level is below",temp:"the temperature is above",humid:"humidity is below",heading:"the heading is below",odo:"the distance travelled is above",bump:"the bumper is pressed",cam:"the camera sees an object"};
var CU={alt:"cm",dfront:"cm",bat:"%",front:"cm",left:"cm",right:"cm",soil:"%",light:"%",temp:"°C",humid:"%",heading:"°",odo:"cm"};
function walk(list,f,d){(list||[]).forEach(function(b){f(b,d||0);walk(b.c,f,(d||0)+1);walk(b.e,f,(d||0)+1);});}
function explain(prog){
 var out=[];
 (function go(list,ind){list.forEach(function(b){
  var p=ind,t=b.t;
  if(t==="forever")out.push(p+"Again and again, forever:"),go(b.c,ind+"   ");
  else if(t==="repeat")out.push(p+"Do this "+b.v+" times:"),go(b.c,ind+"   ");
  else if(t==="if"){out.push(p+"Check: "+(CN[b.k]||b.k)+(b.k==="color"?" "+b.q:b.k==="lineL"||b.k==="lineR"||b.k==="bump"||b.k==="cam"?"":" "+b.v+(CU[b.k]||""))+"?");out.push(p+" If yes:");go(b.c,ind+"   ");if(b.e&&b.e.length){out.push(p+" If no:");go(b.e,ind+"   ");}}
  else out.push(p+"• "+(LB[t]||t)+(b.v!==undefined?" "+b.v+(UN[t]||""):"")+(b.q&&t==="led"?" ("+b.q+")":""));
 });})(prog,"");
 return out;
}
function stats(prog){
 var s={n:0,forever:false,stop:false,ifs:0,conds:{},fwd:0,turns:0,waits:0,acts:{},foreverNoWait:false};
 walk(prog,function(b){s.n++;if(b.t==="forever")s.forever=true;if(b.t==="stop")s.stop=true;if(b.t==="if"){s.ifs++;s.conds[b.k]=(s.conds[b.k]||0)+1;}if(b.t==="fwd")s.fwd+=b.v;if(b.t==="left"||b.t==="right")s.turns++;s.acts[b.t]=1;});
 return s;
}
var TIPS={
 drive:[["Look at the mission: how far is the green zone? The hint tells you roughly.","Which block moves the robot in a straight line? Its number is a distance in centimetres."],["The zone is about 230 cm from the start, and your robot starts at the left edge.","Distance = number in the Forward block. Try one big number first, then adjust it."]],
 detour:[["Straight ahead is blocked. Draw the path on paper first: which way must you turn to get past the wall?","Turns are measured in degrees. A quarter turn is 90°."],["Think in four moves: turn, go past the wall, turn back, go to the zone.","After turning back, the robot faces the zone again, so the last move is a Forward."]],
 sensor:[["A fixed distance is risky because the start point may differ. Let a sensor decide when to stop.","Which condition tells you the wall is near? Use the front distance."],["Put an If inside Forever: if the front distance is small, stop; otherwise move a little.","Small steps matter: a Forward 2 inside Forever keeps checking the sensor all the time."]],
 line:[["Two line sensors tell you which side the tape is on. What should the robot do when the left one sees black?","If the line moves left, you must steer left to find it again."],["Inside Forever: If left sees line, turn left a little. Else if right sees line, turn right a little. Else go forward.","Use small turns (about 5°). Big turns make the robot lose the tape."]],
 maze:[["The robot must look before it turns. Which sensor warns about a wall ahead?","At a wall, how can it know whether to go left or right? Check the side sensors."],["When the front is blocked, compare: is there space on the right? If yes turn right, else turn left.","Use Forever, then If front distance is small. Put another If inside it that checks the side."]],
 farm:[["Only one plot is dry and it changes each run. A fixed program cannot know which. What can?","The soil moisture sensor reads a percentage. Low means dry."],["Drive to each plot, check the soil, and water only if it is dry.","Repeat 3 times: Forward about 70, then If soil moisture is below 30 → Water plant."]],
 cargo:[["The robot must grab, carry and release. In what order do those happen?","Your gripper only works while it is close to the cube. How far away is it?"],["Drive to the cube, close the gripper, drive to the zone, open the gripper.","About 63 cm to the cube, then about 150 cm to the zone."]],
 greenhouse:[["Only one bay is too hot, and it changes each run. Which sensor can tell the difference?","A fan wastes energy if it runs in the cool bay. So check first."],["Drive to the first bay, If temperature is above 30 → Fan on. Then drive to the second bay and check again.","The fan stays on after you leave. That is fine: only the hot bay needs it."]],
 beacon:[["The beacon could be anywhere in front. You can't drive straight to it if you don't know where it is. What can the robot do to look around?","The camera only sees a narrow cone ahead. A robot that turns slowly sweeps that cone across the room."],["Two behaviours: when the camera sees the beacon, drive toward it; when it does not, turn a little and look again.","Both go inside Forever, in one If block with an Else."]],
 compass:[["The wind turns the robot a little all the time, so a single Forward will end up off course. Which sensor tells you the direction it is facing?","The robot starts facing 30°. If the heading drifts above 30°, which way must you steer to bring it back?"],["Forward in small steps, and after each step check the heading. Too high means turn back; otherwise keep going.","Put the heading check inside Forever, so the correction happens all the time."]],
 homeeyes:[["This robot's eyes come from your own circuit. If the mission is locked, finish the Light sensor challenge in the Breadboard Lab first.","Once unlocked, this is a line-following problem, just like mission 4, but on a wavy track."],["Forever: If the left sensor sees the line, turn left a little. Else if the right one does, turn right a little. Else go forward.","Keep the turns small (about 5°) so the robot follows the waves without overshooting."]],
 armpick:[["Use the Teach pendant: drag the sliders until the gripper tip is at the cube, then note the three angles. The tip readout shows how high it is.","A cube is about 12 cm tall, so the tip should be around 6 cm high when it grabs."],["Order matters: turn the base toward the cube, lower the shoulder and elbow, close the gripper, then lift before turning to the bin.","Lift the cube higher than the bin wall (10 cm) before moving over it."]],
 armstack:[["The blue cube is 12 cm tall. Where must the gripper be when it releases the red cube so it sits on top?","A good release height is about 19 cm (12 cm cube + a little drop)."],["Pick the red cube, lift it, turn the base to the blue cube, lower to about 19 cm high, then open the gripper.","If the gripper is too low it will push the cube; too high and it will fall off."]],
 armbelt:[["The belt moves the boxes for you. Which block waits until a box reaches the yellow ring?","Belt: run until box. It starts the belt and stops it by itself when a box is at the pick spot."],["Put the pick-up steps inside Repeat 3: Belt run until box, lower the arm to the ring, close the gripper, lift, turn to the bin, open.","Teach the pick pose and the bin pose once with the pendant. Every box stops at the same spot, so the same angles work three times."]],
 armbelt2:[["Each box stops at the same yellow ring, so the pick pose never changes. What changes between boxes?","The colour. Use If: cube under gripper is red, to choose the bin."],["Inside Repeat 3: Belt run until box, go to the ring, check the colour with If, then carry to the red bin or the blue bin.","If red goes one way and Else goes the other, one program handles any colour order."]],
 armsort:[["The colours change every run, so the program must decide. Which block lets the arm ask a question?","Move over a cube, then use If: cube under gripper is red."],["Inside If: pick up, carry to the red bin. Else: pick up, carry to the blue bin. Put all of that inside Repeat or repeat the pattern for each cube.","Teach the arm each cube position and each bin position with the pendant first."]],
 boda:[["Draw the route first: which way must the robot turn to pass each stall, and how far does it go between turns?","Forward, turn, pass the stall, turn back. Turns use degrees, so 90 is a quarter turn."],["Try: Forward 80, Turn right 90, Forward 90, Turn left 90, Forward 100, Turn right 90, Forward 80, Turn left 90, Forward 60. Adjust until it fits.","Run it and watch where the robot ends. Change one number at a time."]],
 trafficsmart:[["Which road needs green more, the one with more cars or fewer?","The one with the longer queue. Compare the two vehicle counters in an If block."],["Forever → If queue NS > queue EW then Green NS, else Green EW, then Wait 4.","Switching costs 2 s of amber, so do not flip every second."]],
 trafficled:[["What order do real traffic lights follow?","Red, then Green, then Amber, then back to Red."],["Forever → Light RED, Wait 5, Light GREEN, Wait 5, Light AMBER, Wait 3.","Every colour must stay on between 3 and 6 seconds."]],
 autodoor:[["When should the door open, and when should it close?","Open when a person is close, stay open while they are in the doorway, close once nobody is near."],["Forever → If person closer than 100 then Open door, else Close door.","The sensor keeps seeing the person while they are in the doorway, so the door will not close on them."]],
 solar:[["Which sensor tells the robot a row is too hot?","The temperature sensor. Read it in an If block before you switch the fan on."],["Forward 70, If temperature > 30 then Fan on, Forward 95, then check again for the second row.","The fan should stay off in the cool row to save power."]],
 escarp:[["The cliff is 140 cm tall. How high must the drone be to clear it?","More than 145 cm. Take off gives 60 cm, so you need to fly up about 100 cm."],["Take off, Fly up 100, Forward 100, Forward 100, Fly down 100, Land.","Higher flight uses more battery, so do not wait in the air."]],
 dronenight:[["Only one pad is lit and it changes every run. Which sensor tells the drone where the light is?","Light under drone. It reads high only near the lit pad, so test it with If before you land."],["Fly 210 cm to the far pads, then If light under drone > 50 then Land. Else turn toward the next pad, fly 60 cm and check again.","The three pads are 60 cm apart. Check the middle one first, then the others. The battery drains fast at night, so avoid long searches."]],
 dronefirst:[["A drone must always take off first and land at the end. Which blocks do that?","Take off lifts the drone to 60 cm. The mission needs at least 100 cm. How much higher must it go?"],["Take off, then Fly up about 40 to 50 cm, wait a second, then Land. The pad is where you started, so don't move sideways.","The order matters: if you forget Land, the drone is still in the air when the program ends."]],
 dronegate:[["The gate is a rectangle in the air. The drone must fly through the opening, not over or under it. What height is the opening?","Take off puts you at 60 cm, which is inside the 45–125 cm opening."],["Take off, fly straight forward through the gate (it is 120 cm ahead), keep going to the pad, then Land.","Do not turn: the gate is exactly in line with the start. A turn would send you into the frame."]],
 dronewall:[["The wall is 70 cm tall and the drone is too low at 60 cm. What do you need to do before flying forward?","Fly up until you are above 75 cm, with some margin."],["Take off, Fly up 40, Forward over the wall, Fly down if you like, Land on the pad. Or use the wall sensor to climb only when needed.","With the sensor: Repeat: If wall ahead closer than 35 then Fly up 40, else Forward 5."]],
 sandbox:[["This is a free lab. Pick one idea: for example drive until the front distance is small, then beep.","Try the colour sensor over the red, green and blue tiles."],["Add a part, then use its block. Blocks that need a missing part show a warning.","Watch the readings under the 3D view as the robot moves."]]
};
function lvl(C){return C.LEVELS[C.st.lvl];}
function check(prog,C){
 var l=lvl(C),st=C.st,v=C.validate(),s=stats(prog),notes=[];
 if(!v.ok)return {mood:"fix",say:"Your robot isn't ready to drive yet.",notes:v.errors.slice(0,3).map(function(e){return "🔧 "+e;})};
 if(!prog.length)return {mood:"fix",say:"Your program is empty. Tap a block above to start.",notes:["Start small: make the robot do just one thing, then run it."]};
 // blocks that need a missing part, or sensors that are missing
 var missing=[];
 walk(prog,function(b){
  var need={water:"pump",fanon:"fan",fanoff:"fan",gripc:"servo",gripo:"servo",led:"led",beep:"buzzer",print:"lcd"}[b.t];
  if(need&&!C.has(need)&&missing.indexOf(b.t)<0){missing.push(b.t);notes.push("⚠ A “"+(LB[b.t]||b.t)+"” block needs a part you haven't added ("+C.PARTS[need].name+").");}
  if(b.t==="if"){var k=b.k,ok={front:1,left:1,right:1}[k]?!!(C.find("us",k)||C.find("sharp",k)||C.find("irobs",k)):{lineL:!!C.find("line","left"),lineR:!!C.find("line","right"),soil:C.has("soil"),color:C.has("color"),light:C.has("ldr"),temp:C.has("dht"),humid:C.has("dht"),heading:C.has("imu")||C.has("compass"),odo:C.has("encoder"),bump:C.has("bumper"),cam:C.has("camera")}[k];
   if(ok===false&&notes.indexOf("sensor:"+k)<0){notes.push("⚠ You check “"+(CN[k]||k)+"” but that sensor isn't mounted on your robot.");notes.push("sensor:"+k);}}
 });
 notes=notes.filter(function(n){return n.indexOf("sensor:")!==0;});
 if(s.forever&&!s.stop&&["sensor","line","maze"].indexOf(l.id)>=0&&st.status==="lose")notes.push("♾ Forever never ends by itself. The run ends when the robot reaches the zone or time runs out.");
 // level-specific
 var id=l.id,kd=l.kind||l.id;
 if(id==="sensor"&&!s.conds.front)notes.push("💡 This mission needs the front distance sensor in an If block.");
 if(id==="line"&&!(s.conds.lineL||s.conds.lineR))notes.push("💡 To follow the tape you need If blocks for the line sensors.");
 if(id==="maze"&&!s.conds.front)notes.push("💡 A maze needs the front distance check, or the robot drives into the wall.");
 if(kd==="farm"&&!s.conds.soil)notes.push("💡 Without checking the soil, the robot can't tell which plot is dry.");
 if(kd==="greenhouse"&&!s.conds.temp)notes.push("💡 Check the temperature before switching the fan on.");
 if(id==="boda"&&!s.conds.front)notes.push("💡 The stalls are walls. A front distance check helps you stop before touching one.");
 if(id==="beacon"&&!s.conds.cam)notes.push("💡 Use the camera condition (Camera sees object) to know when the beacon is ahead.");
 if(id==="beacon"&&s.conds.cam&&!s.turns)notes.push("🔄 If the beacon is not in view, the robot needs to turn to search for it.");
 if(id==="compass"&&!s.conds.heading)notes.push("💡 Use the heading condition so the robot can notice when it drifts.");
 if(id==="homeeyes"&&!(s.conds.lineL||s.conds.lineR))notes.push("💡 Use the line-sensor conditions to follow the tape.");
 if(/^arm/.test(id)&&!(s.acts.armb||s.acts.arms||s.acts.arme))notes.push("💡 Use the arm blocks (base, shoulder, elbow) or the pendant button “Add this pose to program”.");
 if(/^arm/.test(id)&&s.acts.gripc&&!s.acts.gripo)notes.push("🖐 You close the gripper but never open it. The cube must be released at the target.");
 if(id==="armbelt2"&&!s.conds.cubecol)notes.push("💡 Check the box colour with the If block (Cube under gripper is …).");
 if((id==="armbelt"||id==="armbelt2")&&!s.acts.beltgo)notes.push("💡 Add Belt: run until box so the next box comes to the pick spot.");
 if(id==="armsort"&&!s.conds.cubecol)notes.push("💡 Check the cube colour with the If block (Cube under gripper is …).");
 if(/^drone/.test(id)&&!s.acts.takeoff)notes.push("🚁 A drone cannot fly until you add a Take off block first.");
 if(/^drone/.test(id)&&s.acts.takeoff&&!s.acts.land)notes.push("🛬 Add a Land block at the end. The mission is only complete when the drone is back on the ground.");
 if(id==="dronewall"&&!s.acts.up&&!s.conds.dfront)notes.push("💡 The wall is 70 cm tall. You need Fly up (or the wall sensor) to get over it.");
 if(id==="dronegate"&&(s.acts.left||s.acts.right))notes.push("🔄 The gate is straight ahead. A turn will take you off line.");
 if(id==="cargo"&&!(s.acts.gripc&&s.acts.gripo))notes.push("💡 You need both Grip close (to pick up) and Grip open (to release).");
 if((id==="drive"||id==="detour")&&l.goal){var dx=l.goal[0]+l.goal[2]/2-l.start.x;if(s.fwd&&Math.abs(s.fwd-dx)>dx*0.6&&id==="drive")notes.push("📏 You drive "+s.fwd+" cm in total, but the zone is roughly "+Math.round(dx)+" cm away.");}
 // run result
 var say;
 if(st.status==="win")say="Well done! "+(st.msg||"");
 else if(st.status==="lose")say="That run didn't work: "+(st.msg||"");
 else say=notes.length?"A few things to check before you run:":"This looks sensible. Run it and watch what the sensors say.";
 if(st.status==="lose"&&st.bumps>0)notes.push("💥 The robot bumped "+st.bumps+"×. Slow down near walls: use shorter steps and check the sensor more often.");
 if(st.status==="lose"&&/Not there yet/.test(st.msg||"")&&!notes.length)notes.push("Compare where the robot stopped with the green zone. Is it too short, too long, or turned the wrong way?");
 return {mood:st.status==="win"?"win":(notes.length||st.status==="lose")?"tip":"ok",say:say,notes:notes};
}
function hint(prog,C,n){
 var id=lvl(C).id,t=TIPS[id]||TIPS.sandbox;
 var i=Math.min(n,2);
 if(i===0)return {say:"Here's a nudge:",notes:[t[0][0],t[0][1]]};
 if(i===1)return {say:"A bigger hint:",notes:t[1]};
 return {say:"Last hint: the idea, not the exact numbers.",notes:[t[1][0],(C.LEVELS[C.st.lvl].hint||"").replace(/<[^>]+>/g,"").replace(/&lt;/g,"<").replace(/&gt;/g,">")]};
}
function quiz(C){
 var id=lvl(C).id,Q={drive:["Why does the robot move farther if you raise the number in Forward?","The number is a distance in cm, so it tells the motors how long to run."],sensor:["Why do we use small steps inside Forever instead of one big Forward?","Small steps let the robot check the sensor again and again, so it can react in time."],line:["Why use small turns when following a line?","Big turns overshoot the tape. Many small corrections keep the robot centred."],maze:["How does the robot decide between turning left and right?","It compares the side distances. More free space means a safer direction."],farm:["Why check the soil before watering?","Checking avoids wasting water. A sensor lets the program make a decision instead of guessing."],greenhouse:["Why not switch the fan on in both bays?","It wastes energy. Reading the sensor first is how real greenhouse controllers save power."],cargo:["Why must the gripper be open before you reach the cube?","A closed gripper can't fit around the cube, so it would push it away."],beacon:["Why does the robot turn in small steps while searching?","The camera sees a narrow cone. Small turns sweep it across the room without skipping over the beacon."],compass:["Why does the robot need a sensor to drive in a straight line?","Motors and wheels are never perfectly equal, so small errors add up. A sensor lets the program notice and correct them."],homeeyes:["Why does a light-dependent resistor work as a line sensor?","The black tape reflects less light than the floor, so the LDR resistance changes and so does the voltage."],armpick:["Why must you lift the cube before turning the base?","Lifting clears the bin wall and the other objects. Moving sideways at table height would knock things over."],armstack:["Why release the cube from a small height instead of dropping it from high up?","A short drop keeps the cube in place. A big drop makes it bounce off or knock the stack over."],armbelt:["Why does the belt stop itself when a box arrives?","A sensor tells the program the box is at the pick spot. Stopping makes the pick-up the same every time, like a real factory line."],armbelt2:["Why use one program for every colour order?","Real sorting lines see random boxes. A sensor plus If lets the arm decide for each box, so no re-programming is needed."],armsort:["Why does the arm check the colour before moving the cube?","The program must act differently for each colour. A sensor lets one program handle any order."],boda:["Why do delivery robots use sensors instead of only counting distance?","Roads change. A sensor lets the robot react to a stall that moved, which a fixed distance cannot do."],solar:["Why switch the fan on only in the hot row?","Cooling uses electricity. Checking first saves power, just like on real solar farms."],escarp:["Why does flying higher drain more battery?","The motors work harder to lift the drone, so extra height costs energy."],dronenight:["Why check the light before landing instead of landing at the first pad?","Only one pad is lit. A sensor lets the drone choose, so the same program works wherever the lamp is."],dronefirst:["Why does a drone need a Land block instead of just stopping?","A drone has no wheels to stop it. Without landing, it stays in the air and drains its battery."],dronegate:["Why must the drone line up before flying forward?","It can only pass through the gate opening. Once flying, a small sideways error means hitting the frame."],dronewall:["Why does a drone need altitude control?","Obstacles are different heights. Flying higher lets it pass over them, and sensors can decide when to climb."],detour:["What happens to the robot's direction after you use a Turn block?","It keeps the new direction until you turn again, so your next Forward goes that way."]};
 return Q[id]||["What did you learn from this run?","Explaining it in your own words is the best way to remember it."];
}
// circuit mentor: escalating hints per challenge and a reading interpreter
function circuitHelp(ch,msg,n){
 var out=[];
 if(msg)out.push("Last check said: "+msg);
 var hint=(ch.hint||"").replace(/^Hint: /,"");
 var steps=[ "Take a moment to read the goal again. What must happen when the input changes (switch, light, temperature)?","Think about what you need in series with the LED, and where the voltage will be measured.",hint ];
 out.push(steps[Math.min(n,2)]);
 return out;
}
return {check:check,hint:hint,explain:explain,quiz:quiz,circuitHelp:circuitHelp,stats:stats};
})();
if(typeof module!=="undefined")module.exports=Mila;
