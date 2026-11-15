var Core=(function(){
"use strict";
var W=300,H=200,R=7,MAXR=150,VMAX=40,ACC=100,WMAX=130,WACC=420,STOP={};
var OUTER=[[-20,-20,340,20],[-20,200,340,20],[-20,0,20,200],[300,0,20,200]];
function curve(){var p=[],x;for(x=25;x<=292;x+=4)p.push([x,70+25*(1-Math.cos((x-25)/42))]);return p;}
function wave(){var p=[],x;for(x=25;x<=292;x+=4)p.push([x,100+30*Math.sin((x-25)/45)]);return p;}
function seq(pre,arr){return arr.map(function(n){return pre+n;});}
function range(a,b){var r=[];for(var i=a;i<=b;i++)r.push(i);return r;}
// ================= PARTS CATALOG =================
var CATS=["Controllers","Power","Drive","Sensors","Actuators","Interface"];
var PARTS={};
function P(o){PARTS[o.id]=o;return o;}
// --- controllers ---
P({id:"uno",cat:"Controllers",name:"Arduino Uno",spec:"5V logic · 12 free digital · 6 analog · C++",mA:50,ctl:true,dN:12,aN:6,vmin:5,vmax:12,lv:5,lang:"arduino",dNames:seq("D",range(2,13)),aNames:seq("A",range(0,5)),col:0x1565c0});
P({id:"nano",cat:"Controllers",name:"Arduino Nano",spec:"5V logic · 12 digital · 8 analog · C++",mA:30,ctl:true,dN:12,aN:8,vmin:5,vmax:12,lv:5,lang:"arduino",dNames:seq("D",range(2,13)),aNames:seq("A",range(0,7)),col:0x00838f});
P({id:"esp32",cat:"Controllers",name:"ESP32 DevKit",spec:"3.3V logic · 18 GPIO · 6 analog · WiFi+Bluetooth · MicroPython",mA:160,ctl:true,dN:18,aN:6,vmin:5,vmax:12,lv:3.3,lang:"micropython",cam:true,dNames:seq("GPIO",[4,5,12,13,14,16,17,18,19,21,22,23,25,26,27,32,33,15]),aNames:seq("GPIO",[34,35,36,39,32,33]),col:0x212121});
P({id:"pi4",cat:"Controllers",name:"Raspberry Pi 4",spec:"3.3V logic · 17 GPIO · NO analog inputs · full Linux + Python",mA:1200,ctl:true,dN:17,aN:0,vmin:5,vmax:5.25,lv:3.3,lang:"python",cam:true,dNames:seq("GPIO",[4,5,6,12,13,16,17,18,19,20,21,22,23,24,25,26,27]),aNames:[],col:0x2e7d32});
P({id:"pico",cat:"Controllers",name:"Raspberry Pi Pico",spec:"3.3V logic · 20 GPIO · 3 analog · MicroPython",mA:30,ctl:true,dN:20,aN:3,vmin:1.8,vmax:5.5,lv:3.3,lang:"micropython",dNames:seq("GP",range(0,19)).concat(["GP22"]),aNames:["GP26","GP27","GP28"],col:0x1b5e20});
P({id:"microbit",cat:"Controllers",name:"BBC micro:bit",spec:"3.3V logic · 10 digital · 3 analog · MicroPython",mA:40,ctl:true,dN:10,aN:3,vmin:3,vmax:5,lv:3.3,lang:"micropython",dNames:seq("P",[3,4,6,7,8,9,10,12,13,14]),aNames:["P0","P1","P2"],col:0x263238});
// --- power ---
P({id:"aa",cat:"Power",name:"4×AA battery pack",spec:"6V · 2000 mAh",single:"power",V:6,cap:2000,mA:0,col:0xf9a825});
P({id:"lipo",cat:"Power",name:"2S LiPo battery",spec:"7.4V · 2500 mAh",single:"power",V:7.4,cap:2500,mA:0,col:0xc62828});
P({id:"bank",cat:"Power",name:"USB power bank",spec:"5V · 3A",single:"power",V:5,cap:3000,mA:0,col:0x37474f});
// --- drive ---
P({id:"l298n",cat:"Drive",name:"L298N motor driver",spec:"Dual H-bridge · 2A · 6 control pins",single:"driver",maxMA:2000,mA:30,d:6,pn:["ENA","IN1","IN2","IN3","IN4","ENB"],col:0xd32f2f});
P({id:"l293d",cat:"Drive",name:"L293D motor driver",spec:"Dual H-bridge · 600mA · 6 control pins",single:"driver",maxMA:600,mA:25,d:6,pn:["EN1","IN1","IN2","IN3","IN4","EN2"],col:0x1a237e});
P({id:"tb6612",cat:"Drive",name:"TB6612 motor driver",spec:"Efficient dual driver · 1.2A · 6 pins",single:"driver",maxMA:1200,mA:15,d:6,pn:["PWMA","AIN1","AIN2","BIN1","BIN2","PWMB"],col:0x6a1b9a});
P({id:"gear",cat:"Drive",name:"2× DC gear motors + wheels",spec:"3–6V · ~250 mA each",single:"motors",mA:500,col:0xffc107});
// --- sensors ---
P({id:"us",cat:"Sensors",name:"Ultrasonic HC-SR04",spec:"Distance 2–150 cm · cone beam · 5V",mA:15,d:2,pn:["TRIG","ECHO"],lv:5,slotType:"dist",col:0x1976d2});
P({id:"sharp",cat:"Sensors",name:"Sharp IR distance",spec:"Distance 10–80 cm · narrow beam · analog",mA:30,a:1,pn:["AOUT"],slotType:"dist",col:0x424242});
P({id:"irobs",cat:"Sensors",name:"IR obstacle sensor",spec:"Obstacle within ~15 cm · digital",mA:20,d:1,pn:["OUT"],lv:5,slotType:"dist",col:0x5d4037});
P({id:"line",cat:"Sensors",name:"IR line sensor (TCRT5000)",spec:"Detects dark tape under the robot · digital",mA:20,d:1,pn:["OUT"],lv:5,slotType:"line",col:0x212121});
P({id:"color",cat:"Sensors",name:"Colour sensor (TCS3200)",spec:"Reads floor colour · 5 pins",mA:20,d:5,pn:["S0","S1","S2","S3","OUT"],lv:5,col:0x7b1fa2});
P({id:"ldr",cat:"Sensors",name:"Light sensor (LDR)",spec:"Brightness 0–100% · analog",mA:1,a:1,pn:["AOUT"],col:0xef6c00});
P({id:"soil",cat:"Sensors",name:"Soil moisture sensor",spec:"Moisture 0–100% · analog",mA:5,a:1,pn:["AOUT"],col:0x558b2f});
P({id:"dht",cat:"Sensors",name:"DHT11 temp + humidity",spec:"Temperature °C and humidity % · 1 wire",mA:2,d:1,pn:["DATA"],lv:5,col:0x0288d1});
P({id:"imu",cat:"Sensors",name:"MPU6050 gyro",spec:"Heading / rotation · I²C",mA:4,i2c:true,col:0x00695c});
P({id:"compass",cat:"Sensors",name:"HMC5883L compass",spec:"Magnetic heading · I²C",mA:3,i2c:true,col:0x4527a0});
P({id:"encoder",cat:"Sensors",name:"Wheel encoder",spec:"Counts distance travelled · 2 pins",mA:10,d:2,pn:["A","B"],lv:5,col:0x455a64});
P({id:"bumper",cat:"Sensors",name:"Bumper switch",spec:"Detects physical contact · digital",mA:0,d:1,pn:["SIG"],col:0xb71c1c});
P({id:"camera",cat:"Sensors",name:"Camera module",spec:"Sees objects ahead · Raspberry Pi / ESP32 only",mA:250,camReq:true,col:0x263238});
// --- actuators ---
P({id:"servo",cat:"Actuators",name:"Servo gripper",spec:"Grabs and releases objects · 1 PWM pin",mA:250,d:1,pn:["SIG"],lv:5,col:0x0097a7});
P({id:"pump",cat:"Actuators",name:"Water pump module",spec:"Waters plants · 1 pin",mA:300,d:1,pn:["SIG"],lv:5,col:0x1e88e5});
P({id:"led",cat:"Actuators",name:"RGB LED",spec:"Shows red / green / blue · 3 pins",mA:20,d:3,pn:["R","G","B"],col:0xe91e63});
P({id:"buzzer",cat:"Actuators",name:"Buzzer",spec:"Plays beeps · 1 pin",mA:30,d:1,pn:["SIG"],col:0x111111});
P({id:"lcd",cat:"Actuators",name:"16×2 LCD (I²C)",spec:"Shows text messages · I²C",mA:40,i2c:true,col:0x388e3c});
P({id:"armkit",cat:"Actuators",name:"3-axis robot arm (4 servos)",spec:"Base, shoulder, elbow + gripper with colour sensor · 4 PWM pins",mA:900,d:4,pn:["BASE","SHOULDER","ELBOW","GRIP"],lv:5,col:0xea580c});
P({id:"dronekit",cat:"Actuators",name:"Quadcopter drone kit",spec:"4 motors + flight controller + forward sensor + LiPo · flies, hovers, lands",mA:1200,d:2,pn:["TX","RX"],lv:5,col:0x0891b2});
P({id:"relay",cat:"Actuators",name:"Relay module",spec:"Switches big loads on/off · 1 pin",mA:20,d:1,pn:["IN"],lv:5,col:0x1565c0});
P({id:"fan",cat:"Actuators",name:"Cooling fan 12V",spec:"Needs a relay module to switch it",mA:200,needs:"relay",col:0x37474f});
// --- interface ---
P({id:"shifter",cat:"Interface",name:"Logic level shifter",spec:"Makes 5V sensors safe on 3.3V boards",mA:5,col:0x8d6e63});
P({id:"adc",cat:"Interface",name:"MCP3008 ADC",spec:"Adds 8 analog inputs · uses 4 pins (SPI)",mA:5,d:4,pn:["CS","CLK","MOSI","MISO"],adc:true,col:0x6d4c41});
P({id:"buck",cat:"Interface",name:"5V buck converter",spec:"Steps any battery down to a clean 5V",mA:20,buck:true,col:0x00acc1});
// ================= CHASSIS & MOUNTS =================
var CHASSIS={
 compact:{id:"compact",name:"Compact 2WD",desc:"Small and quick. 6 deck pads. Fits tight spaces.",R:6,vmax:45,acc:110,pads:6,motorMA:400,wheels:2},
 standard:{id:"standard",name:"Standard 2WD",desc:"Balanced. 8 deck pads.",R:7,vmax:40,acc:100,pads:8,motorMA:500,wheels:2},
 heavy:{id:"heavy",name:"Heavy 4WD rover",desc:"Bigger and slower, 10 deck pads. Four motors draw 1400 mA: needs a strong driver.",R:9,vmax:30,acc:70,pads:10,motorMA:1400,wheels:4}
};
var MT={ctl:["ctl"],batt:["batt"],drv:["drv"],axle:["axle"],axleEnc:["axleEnc"],dist:["front","sideL","sideR"],line:["floorL","floorR"],colour:["floorC","floorL","floorR"],bumper:["bumper"],probe:["probe"],cam:["camTop"],tool:["tool"]};
var SLOT_OF={front:"front",sideL:"left",sideR:"right",floorL:"left",floorR:"right",floorC:"center"};
var SLOTMOUNT={us:{front:"front",left:"sideL",right:"sideR"},sharp:{front:"front",left:"sideL",right:"sideR"},irobs:{front:"front",left:"sideL",right:"sideR"},line:{left:"floorL",right:"floorR"}};
var MLABEL={ctl:"Controller deck",batt:"Battery bay",drv:"Driver bay",axle:"Axle (motors)",axleEnc:"Axle (encoder)",front:"Front bar",sideL:"Left side bar",sideR:"Right side bar",floorL:"Underside left",floorR:"Underside right",floorC:"Underside centre",bumper:"Bumper bar",probe:"Soil probe arm",camTop:"Camera mast",tool:"Gripper arm"};
var WHY={ctl:"Controllers sit on the controller deck.",batt:"The battery goes in the battery bay (heavy parts low and central).",drv:"The motor driver goes in the driver bay, close to the motors.",axle:"Motors with wheels mount on the axle.",axleEnc:"A wheel encoder must sit at the axle to count wheel turns.",dist:"Distance sensors must face outward: use the front bar or a side bar.",line:"Line sensors must face the floor: use an underside mount (left or right).",colour:"A colour sensor must face the floor: use an underside mount.",bumper:"The bumper switch belongs on the front bumper bar.",probe:"The soil probe must reach the ground: use the soil probe arm at the front.",cam:"The camera needs a high mast with a clear view ahead.",tool:"The gripper mounts on the tool arm at the front.",deck:"Small electronics sit on the top deck pads."};
function mtype(p){if(p.id==="armkit"||p.id==="dronekit")return"tool";if(p.ctl)return"ctl";if(p.single==="power")return"batt";if(p.single==="driver")return"drv";if(p.single==="motors")return"axle";if(p.id==="encoder")return"axleEnc";if(p.slotType==="dist")return"dist";if(p.id==="line")return"line";if(p.id==="color")return"colour";if(p.id==="bumper")return"bumper";if(p.id==="soil")return"probe";if(p.id==="camera")return"cam";if(p.id==="servo")return"tool";return"deck";}
// ================= LEVELS =================
var K_BASE=["uno","l298n","gear","aa"];
var LEVELS=[
 {id:"drive",name:"1 Drive",floor:"workshop",mission:"Drive the robot into the <b>green zone</b>.",hint:"Hint: one Forward block. The zone is about 230 cm away.",start:{x:25,y:100,a:0},goal:[245,80,45,40],walls:[],kit:K_BASE},
 {id:"detour",name:"2 Detour",floor:"workshop",mission:"Get around the wall and reach the <b>green zone</b>.",hint:"Hint: turn left, go up, turn right, then go forward. Turns use degrees.",start:{x:25,y:160,a:0},goal:[255,15,35,40],walls:[[140,60,10,140]],kit:K_BASE},
 {id:"sensor",name:"3 Sensor",floor:"workshop",mission:"Stop inside the <b>green zone</b> without touching the wall. Use a distance sensor.",hint:"Hint: Forever → If front distance &lt; 30 then Stop, else Forward 2.",start:{x:25,y:100,a:0},goal:[212,70,36,60],walls:[[250,40,10,120]],noBump:true,kit:K_BASE.concat(["us@front"])},
 {id:"line",name:"4 Line",floor:"tape",mission:"Follow the <b>black tape</b> to the green zone using two line sensors.",hint:"Hint: Forever → If line LEFT then Turn left 5, else If line RIGHT then Turn right 5, else Forward 2.",start:{x:25,y:70,a:0},goal:[262,55,36,36],walls:[],track:curve(),reach:true,kit:K_BASE.concat(["line@left","line@right"])},
 {id:"maze",name:"5 Maze",floor:"workshop",mission:"Escape the maze and reach the <b>green zone</b>. The corners are not all the same!",hint:"Hint: Forever → If front &lt; 20 then (If right distance &lt; 60 then Turn left 90 else Turn right 90) else Forward 2.",start:{x:20,y:30,a:0},goal:[262,150,38,50],walls:[[0,60,230,10],[70,130,230,10]],reach:true,kit:K_BASE.concat(["us@front","us@left","us@right"])},
 {id:"farm",name:"6 Shamba",floor:"farm",mission:"One plot is <b>dry</b> (it changes every run). Use the soil sensor and water <b>only</b> the dry plot.",hint:"Hint: Repeat 3 → Forward 70, If soil moisture &lt; 30 then Water plant.",start:{x:20,y:100,a:0},goal:null,walls:[],plots:[[55,70,55,60],[125,70,55,60],[195,70,55,60]],kit:K_BASE.concat(["soil","pump"])},
 {id:"cargo",name:"7 Cargo",floor:"workshop",mission:"Pick up the <b>wooden cube</b> with the gripper and release it inside the <b>green zone</b>.",hint:"Hint: Forward 63 → Grip close → Forward 150 → Grip open.",start:{x:25,y:150,a:0},goal:[230,110,60,70],walls:[],cube:{x:100,y:150},kit:K_BASE.concat(["us@front","servo"])},
 {id:"greenhouse",name:"8 Greenhouse",floor:"workshop",mission:"One greenhouse bay is <b>overheating</b> (above 30°C, changes every run). Use the temperature sensor and switch the cooling fan on <b>only</b> in the hot bay.",hint:"Hint: Forward 70 → If temperature &gt; 30 then Fan on → Forward 95 → check again.",start:{x:20,y:100,a:0},goal:null,walls:[],zonesDef:[[55,60,70,80],[150,60,70,80]],kit:K_BASE.concat(["dht","relay","fan"])},
 {id:"beacon",name:"9 Beacon",floor:"workshop",mission:"A <b>wooden beacon</b> is hidden somewhere in front of the robot (it moves every run). Use the <b>camera</b> to find it, then drive up to it (within 25 cm).",hint:"Hint: Forever → If camera sees object then Forward 2, else Turn right 5. The camera needs a Raspberry Pi.",start:{x:25,y:100,a:0},goal:null,walls:[],cube:{x:200,y:100},find:true,kit:["pi4","l298n","gear","bank","shifter","camera","imu"]},
 {id:"compass",name:"10 Compass",floor:"workshop",mission:"A <b>side wind</b> pushes the robot off course while it drives. Use the <b>gyro</b> to keep the heading and reach the small <b>green zone</b>.",hint:"Hint: the robot starts facing 30°. Forever → If heading &lt; 30 then Forward 2, else Turn left 2. The wind turns the robot to the right.",start:{x:30,y:50,a:30},goal:[200,135,32,36],walls:[],drift:0.12,reach:true,kit:K_BASE.concat(["imu"])},
 {id:"homeeyes",name:"11 Home-made eyes",floor:"tape",mission:"Follow the <b>wavy tape</b> to the green zone. The line sensors use the <b>light-sensor circuit you built</b>: finish Breadboard Lab challenge 6 first.",hint:"Hint: same idea as mission 4: Forever → If line LEFT then Turn left 5, else If line RIGHT then Turn right 5, else Forward 2.",start:{x:25,y:100,a:0},goal:[262,63,36,36],walls:[],track:wave(),reach:true,needs:"ldr",needsName:"Breadboard Lab challenge 6: Light sensor",kit:K_BASE.concat(["line@left","line@right"])},
 {id:"armpick",name:"12 Arm: Pick & place",floor:"workshop",arm:true,mission:"Use the <b>robot arm</b> to pick up the cube and drop it into the <b>bin</b> on the left.",hint:"Hint: turn the base to face the cube, lower the shoulder and bend the elbow until the gripper is at the cube, close the gripper, lift, turn to the bin, open. Use the Teach pendant to find the angles.",start:{x:150,y:178,a:270},goal:null,walls:[],cubes:[[205,140,"orange"]],bins:[[60,115,50,50,"any"]],kit:["uno","bank","armkit"]},
 {id:"armstack",name:"13 Arm: Stack",floor:"workshop",arm:true,mission:"Stack the <b>red cube</b> on top of the <b>blue cube</b>.",hint:"Hint: pick the red cube up, lift it higher than 12 cm, move over the blue cube, then open the gripper so it lands on top.",start:{x:150,y:178,a:270},goal:null,walls:[],cubes:[[200,125,"blue"],[110,125,"red"]],bins:[],kit:["uno","bank","armkit"]},
 {id:"armsort",name:"14 Arm: Sort by colour",floor:"workshop",arm:true,mission:"Sort the three cubes: <b>red</b> cubes into the red bin on the left, <b>blue</b> cubes into the blue bin on the right. The colours change every run!",hint:"Hint: Repeat 3: move over a cube, check its colour with If, then carry it to the correct bin. Teach the arm the 3 cube positions and 2 bin positions.",start:{x:150,y:178,a:270},goal:null,walls:[],cubes:[[110,125,"red"],[150,125,"red"],[190,125,"red"]],bins:[[45,110,50,50,"red"],[205,110,50,50,"blue"]],kit:["uno","bank","armkit"]},
 {id:"dronefirst",name:"15 Drone: First flight",floor:"workshop",drone:true,mission:"Your first <b>drone flight</b>: take off, climb to <b>at least 100 cm</b>, then land back on the <b>orange pad</b>.",hint:"Hint: Take off → Fly up 50 → Wait 1 → Land. Take off lifts the drone to 60 cm, so you need to climb about 40 cm more.",start:{x:40,y:100,a:0},goal:null,walls:[],pad:[40,100,24],kit:["uno","bank","dronekit"]},
 {id:"dronegate",name:"16 Drone: The gate",floor:"workshop",drone:true,mission:"Fly <b>through the orange gate</b> without touching it, then land on the far pad. The opening is between 45 and 125 cm high.",hint:"Hint: Take off, Forward 120 (the gate is 120 cm ahead), Forward 110, then Land on the pad. Take off already puts you at 60 cm, which fits the gate.",start:{x:30,y:100,a:0},goal:null,walls:[],gate:[150,100,70,45,125],pad:[260,100,26],kit:["uno","bank","dronekit"]},
 {id:"dronewall",name:"17 Drone: Over the wall",floor:"workshop",drone:true,mission:"A <b>70 cm wall</b> blocks the way. Fly <b>over it</b> and land on the pad on the other side.",hint:"Hint: Take off, Fly up 40 (you need more than 75 cm), Forward 100, Forward 100, Fly down, Land. Or use a sensor: If wall ahead closer than 40, fly up.",start:{x:30,y:100,a:0},goal:null,walls:[[135,0,12,200]],wallH:70,pad:[250,100,26],kit:["uno","bank","dronekit"]},
 {id:"armbelt",name:"18 Arm: Conveyor",floor:"workshop",arm:true,belt:{x:20,y:100,w:265,h:30,speed:24,spot:150},mission:"Boxes ride the <b>conveyor belt</b>. Use the arm to lift all <b>3 boxes</b> off the belt and into the <b>bin</b>. Don't let a box fall off the end!",hint:"Hint: Repeat 3: Belt run until box, then pick it up at the yellow pick spot, carry it to the bin and release. The belt stops itself when a box arrives.",start:{x:150,y:178,a:270},goal:null,walls:[],cubes:[[180,115,"orange"],[225,115,"orange"],[270,115,"orange"]],bins:[[200,148,65,45,"any"]],kit:["uno","bank","armkit"]},
 {id:"armbelt2",name:"19 Arm: Belt sort",floor:"workshop",arm:true,belt:{x:20,y:100,w:265,h:30,speed:24,spot:150},mission:"Boxes arrive on the belt in a <b>random colour order</b>. Put <b>red</b> boxes in the red bin (left) and <b>blue</b> boxes in the blue bin (right).",hint:"Hint: Repeat 3: Belt run until box, check the colour with If, then carry the box to the matching bin.",start:{x:150,y:178,a:270},goal:null,walls:[],cubes:[[180,115,"red"],[225,115,"red"],[270,115,"red"]],bins:[[45,148,55,45,"red"],[200,148,55,45,"blue"]],kit:["uno","bank","armkit"]},
 {id:"dronenight",name:"20 Drone: Night flight",floor:"workshop",drone:true,night:true,drain:1.3,mission:"It is <b>night</b>. Only <b>one</b> of the three far pads has its lamp on (it changes every run). Use the drone's <b>light sensor</b> to find it, then land on it before the battery runs out.",hint:"Hint: Take off, Forward 210, then If light under drone &gt; 50 → Land. Otherwise turn, fly 60 cm to the next pad and check again. The battery drains fast at night!",start:{x:30,y:100,a:0},goal:null,walls:[],pad:[30,100,24],pads:[[250,40,26],[250,100,26],[250,160,26]],kit:["uno","bank","dronekit"]},
 {id:"boda",name:"21 Boda delivery",floor:"workshop",mission:"A boda-boda rider must deliver a parcel through the <b>market stalls</b>. Drive the robot around the stalls into the <b>green delivery zone</b> without touching them.",hint:"Hint: the stalls are walls. Go forward, turn, pass the first stall, turn back, pass the second, then straight to the zone. Or use the front distance sensor.",start:{x:20,y:40,a:0},goal:[250,140,42,48],walls:[[85,0,12,130],[175,70,12,130]],noBump:true,kit:K_BASE.concat(["us@front"])},
 {id:"solar",name:"22 Solar farm",floor:"workshop",kind:"greenhouse",mission:"One row of <b>solar panels</b> is overheating (above 30°C, changes every run). Use the temperature sensor and switch the cooling fan on <b>only</b> in the hot row.",hint:"Hint: Forward 70 → If temperature &gt; 30 then Fan on → Forward 95 → check again.",start:{x:20,y:100,a:0},goal:null,walls:[],zonesDef:[[55,60,70,80],[150,60,70,80]],kit:K_BASE.concat(["dht","relay","fan"])},
 {id:"escarp",name:"23 Escarpment",floor:"workshop",kind:"dronewall",drone:true,mission:"A <b>140 cm cliff</b> (the Rift Valley escarpment) blocks the way. Fly <b>over it</b> and land on the pad on the far side.",hint:"Hint: Take off puts you at 60 cm. Fly up 100 (you need more than 145 cm), cross the cliff, Fly down, then Land.",start:{x:30,y:100,a:0},goal:null,walls:[[135,0,14,200]],wallH:140,pad:[250,100,26],kit:["uno","bank","dronekit"]},
 {id:"sandbox",name:"Free Lab",floor:"workshop",mission:"<b>Free lab.</b> Swap the controller, add any sensors, and watch the readings. Colour tiles, a shaded area, a hot zone, a soil plot and a cube are waiting.",hint:"Try: Raspberry Pi + MCP3008 for analog sensors, or add the colour sensor and see the pin limit.",start:{x:20,y:100,a:0},goal:null,walls:[[200,125,50,8]],tiles:[[30,25,40,35,"red"],[30,75,40,35,"green"],[30,125,40,35,"blue"]],shade:[[110,20,60,70]],hot:[[205,20,80,70,38]],plots:[[110,110,60,60]],cube:{x:270,y:160},kit:["pi4","adc","l298n","gear","bank","shifter","us@front","dht","soil","ldr","imu","led","lcd"]}
];
// ================= STATE =================
var st={drone:{z:0,flying:false,bat:100,maxZ:0,gate:false,landedOk:false,spin:0},arm:{b:90,s:90,e:0,g:false,held:null},cubes:[],unlocked:{},hands:false,chassis:"standard",lvl:0,robot:{x:0,y:0,a:0},bumps:0,dt:0.02,v:0,w:0,wl:0,wr:0,pump:false,dryWatered:false,wasted:0,status:"idle",msg:"",gen:null,plots:[],zones:[],seed:12345,parts:[],uid:1,odo:0,touching:0,cube:null,gripClosed:false,relay:false,fanHot:false,fanWrong:0,led:"off",lcd:"",beeps:0};
function L(){return LEVELS[st.lvl];}
function CH(){return CHASSIS[st.chassis]||CHASSIS.standard;}
function walls(){return L().walls.concat(OUTER);}
function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
function rnd(){st.seed=(st.seed*1664525+1013904223)>>>0;return st.seed/4294967296;}
function noise(s){return (rnd()-0.5)*(s||0.8);}
// ================= PARTS MANAGEMENT =================
function mountsFor(pid){var t=mtype(PARTS[pid]);if(t==="deck"){var r=[];for(var i=1;i<=CH().pads;i++)r.push("deck"+i);return r;}return MT[t];}
function mountLabel(m){return MLABEL[m]||("Deck pad "+m.replace("deck",""));}
function instAt(m){return st.parts.filter(function(i){return i.mount===m;})[0];}
function mountPart(uid,m){
 var inst=st.parts.filter(function(i){return i.uid===uid;})[0];if(!inst)return {ok:false,why:"Part not found."};
 var p=PARTS[inst.pid];
 if(mountsFor(inst.pid).indexOf(m)<0)return {ok:false,why:WHY[mtype(p)]};
 var o=instAt(m);if(o&&o!==inst)return {ok:false,why:"That mount is already used by the "+PARTS[o.pid].name+". Remove it first."};
 inst.mount=m;inst.slot=SLOT_OF[m]||null;return {ok:true};
}
function unmountPart(uid){st.parts.forEach(function(i){if(i.uid===uid){i.mount=null;i.slot=null;}});}
function automount(inst,slot){
 var opts=mountsFor(inst.pid),want=slot&&SLOTMOUNT[inst.pid]&&SLOTMOUNT[inst.pid][slot],c=want?[want]:opts;
 for(var k=0;k<c.length;k++){if(!instAt(c[k])){mountPart(inst.uid,c[k]);return;}}
}
function addPart(pid,slot,auto){
 var p=PARTS[pid];if(!p)return null;
 if(p.ctl||p.single){st.parts=st.parts.filter(function(i){var q=PARTS[i.pid];return p.ctl?!q.ctl:q.single!==p.single;});}
 var inst={uid:st.uid++,pid:pid,mount:null,slot:null,pins:null};
 st.parts.push(inst);
 if(!st.hands||auto)automount(inst,slot);
 return inst;
}
function removePart(uid){st.parts=st.parts.filter(function(i){return i.uid!==uid;});}
function applyKit(list){st.parts=[];(list||[]).forEach(function(k){var a=k.split("@");addPart(a[0],a[1],true);});autoWire();}
function autoWire(){var sv=st.hands;st.hands=false;validate();st.hands=sv;}
function setPin(uid,idx,name){st.parts.forEach(function(i){if(i.uid===uid){if(!i.pins)i.pins=[];i.pins[idx]=name||null;}});}
function setHands(on){
 if(on){autoWire();st.hands=true;}
 else{st.hands=false;st.parts.forEach(function(i){if(!i.mount)automount(i);});}
}
function setChassis(id){if(CHASSIS[id]){st.chassis=id;st.parts.forEach(function(i){if(i.mount&&mountsFor(i.pid).indexOf(i.mount)<0){i.mount=null;i.slot=null;if(!st.hands)automount(i);}});}}
function clearAll(){st.parts=[];}
function find(pid,slot){return st.parts.filter(function(i){return i.mount&&i.pid===pid&&(!slot||i.slot===slot);})[0];}
function has(pid){return !!find(pid);}
function hasRaw(pid){return st.parts.some(function(i){return i.pid===pid;});}
function ctlInst(){return st.parts.filter(function(i){return PARTS[i.pid].ctl;})[0];}
function byCat(c){return Object.keys(PARTS).filter(function(k){return PARTS[k].cat===c;}).map(function(k){return PARTS[k];});}
// ================= VALIDATION (the engineering rules) =================
function label(i){var p=PARTS[i.pid];return p.name+(i.slot&&i.slot!=="center"?" ("+i.slot+")":"");}
function validate(){
 var E=[],Wn=[],ci=ctlInst(),ctl=ci&&PARTS[ci.pid],pw=st.parts.filter(function(i){return PARTS[i.pid].single==="power";})[0],pp=pw&&PARTS[pw.pid];
 var drv=st.parts.filter(function(i){return PARTS[i.pid].single==="driver";})[0],mot=hasRaw("gear"),chs=CH();
 if(L().needs&&!(st.unlocked&&st.unlocked[L().needs]))E.push("This mission uses a sensor you must build first. Complete "+L().needsName+".");
 if(!ctl)E.push("No controller: add an Arduino, Raspberry Pi, ESP32, Pico or micro:bit.");
 if(!pp)E.push("No power source: add a battery pack or power bank.");
 var AR=!!(L().arm||L().drone);
 if(L().drone&&!hasRaw("dronekit"))E.push("This mission needs the quadcopter drone kit. Add it from Actuators.");
 if(L().arm&&!hasRaw("armkit"))E.push("This mission needs the 3-axis robot arm. Add it from Actuators.");
 if(!AR&&!drv)E.push("The motors need a motor driver (L298N, L293D or TB6612). A microcontroller pin cannot power a motor directly.");
 if(!AR&&!mot)E.push("No motors: add the DC gear motors with wheels.");
 var buck=hasRaw("buck"),adc=hasRaw("adc");
 if(drv&&mot&&chs.motorMA>PARTS[drv.pid].maxMA)E.push("The "+PARTS[drv.pid].name+" can only deliver "+PARTS[drv.pid].maxMA+" mA but the "+chs.name+" motors need up to "+chs.motorMA+" mA. Use a stronger driver (L298N).");
 if(ctl&&pp&&!buck&&(pp.V<ctl.vmin||pp.V>ctl.vmax))E.push(ctl.name+" needs "+ctl.vmin+(ctl.vmax>ctl.vmin?"–"+ctl.vmax:"")+"V but the "+pp.name+" gives "+pp.V+"V. "+(pp.V>ctl.vmax?"Too high: it could destroy the board. Add a 5V buck converter or use a USB power bank.":"Too low: add a suitable supply."));
 // mounting
 var unm=st.parts.filter(function(i){return !i.mount;}).map(function(i){return PARTS[i.pid].name;});
 if(unm.length)E.push("Not mounted on the chassis: "+unm.slice(0,4).join(", ")+(unm.length>4?" +"+(unm.length-4)+" more":"")+". "+(st.hands?"Drag each part onto a mount point in the Assembly Bench.":"No free mounting point is left: remove a part or use a bigger chassis."));
 var seen={};
 st.parts.forEach(function(i){var p=PARTS[i.pid];if(p.slotType&&i.slot){var k=p.slotType+":"+i.slot;if(seen[k])E.push("Two "+(p.slotType==="dist"?"distance":"line")+" sensors are both on the "+i.slot+" position. Move one.");seen[k]=1;}});
 st.parts.forEach(function(i){var p=PARTS[i.pid];
  if(p.camReq&&ctl&&!ctl.cam)E.push("The camera module needs a Raspberry Pi or ESP32. "+ctl.name+" cannot drive it.");
  if(p.needs&&!hasRaw(p.needs))E.push(p.name+" needs a "+PARTS[p.needs].name+" to switch it.");
  if(ctl&&ctl.lv<4&&p.lv===5&&!hasRaw("shifter"))Wn.push(p.name+" outputs 5V signals but "+ctl.name+" pins are 3.3V. Add a logic level shifter to protect the board.");
 });
 if(pp&&pp.V>6&&mot)Wn.push("The gear motors are rated 3–6V but the battery is "+pp.V+"V. They will run hot and wear out quickly.");
 // wiring
 var dNames=ctl?ctl.dNames:[],aNames=ctl?ctl.aNames:[],adcNames=adc?range(0,7).map(function(n){return "ADC CH"+n;}):[];
 var dPool=dNames.slice(),aPool=aNames.slice(),chN=0,wiring=[],analogNeed=0,digNeed=0,manual=st.hands;
 st.parts.forEach(function(i){var p=PARTS[i.pid];
  if(p.ctl||p.single==="power"||!(p.d||p.a||p.i2c))return;
  var row={uid:i.uid,name:label(i),pid:i.pid,slot:i.slot,pins:[]},idx=0,k,j;
  if(!manual){i.pins=[];}
  for(k=0;k<(p.d||0);k++){digNeed++;var nm;if(manual)nm=(i.pins&&i.pins[idx])||null;else{nm=dPool.shift()||null;i.pins[idx]=nm;}row.pins.push({fn:(p.pn&&p.pn[k])||"SIG",pin:nm||"—",kind:"d",idx:idx});idx++;}
  for(j=0;j<(p.a||0);j++){analogNeed++;var an;if(manual)an=(i.pins&&i.pins[idx])||null;else{an=aPool.shift();if(!an&&adc){an="ADC CH"+chN;chN++;}an=an||null;i.pins[idx]=an;}row.pins.push({fn:"AOUT",pin:an||"—",kind:"a",idx:idx});idx++;}
  if(p.i2c)row.pins.push({fn:"SDA/SCL",pin:"I²C bus (shared)",kind:"i"});
  wiring.push(row);
 });
 if(ctl&&!manual){
  if(digNeed>ctl.dN)E.push("Not enough digital pins: parts need "+digNeed+" but "+ctl.name+" has "+ctl.dN+". Remove a sensor or use a board with more pins (ESP32 has 18).");
  var aCap=ctl.aN+(adc?8:0);
  if(analogNeed>aCap)E.push(ctl.aN===0?ctl.name+" has no analog inputs, but your analog sensors need them. Add an MCP3008 ADC chip.":"Not enough analog inputs: sensors need "+analogNeed+" but only "+aCap+" are available. Add an MCP3008 ADC or remove a sensor.");
 }
 if(ctl&&manual){
  var used={},unw=0,name2;
  wiring.forEach(function(r){r.pins.forEach(function(q){
   if(q.kind==="i")return;
   if(!q.pin||q.pin==="—"){unw++;return;}
   var pn=q.pin;
   var okD=dNames.indexOf(pn)>=0||aNames.indexOf(pn)>=0,okA=aNames.indexOf(pn)>=0||adcNames.indexOf(pn)>=0;
   if(!(okD||okA)){E.push(r.name+" "+q.fn+": pin "+pn+" does not exist on "+ctl.name+" (or the ADC is missing). Rewire it.");return;}
   if(q.kind==="a"&&!okA)E.push(r.name+" outputs a voltage (analog). Pin "+pn+" is digital-only: use an analog pin or an ADC channel.");
   if(q.kind==="d"&&adcNames.indexOf(pn)>=0)E.push(r.name+" "+q.fn+" is a digital signal and cannot use ADC channel "+pn+".");
   if(used[pn]&&used[pn]!==r.name+"/"+q.fn)E.push("Pin "+pn+" is connected to two things: "+used[pn].split("/")[0]+" and "+r.name+". Each pin can only do one job.");
   used[pn]=r.name+"/"+q.fn;
  });});
  if(unw)E.push(unw+" pin"+(unw>1?"s are":" is")+" not wired yet. Wire them in the Wiring panel (or press Auto-wire).");
 }
 var mA=0;st.parts.forEach(function(i){mA+=i.pid==="gear"?chs.motorMA:(PARTS[i.pid].mA||0);});
 var cap=pp?pp.cap:0;
 if(pp&&mA>cap*0.8)E.push("Power: parts draw about "+mA+" mA but the "+pp.name+" can safely supply about "+Math.round(cap*0.8)+" mA. The robot would brown out and reset.");
 return {errors:E,warnings:Wn,wiring:wiring,mA:mA,capMA:Math.round(cap*0.8),ok:E.length===0};
}
function pinOptions(uid,idx){
 var inst=st.parts.filter(function(i){return i.uid===uid;})[0],ci=ctlInst();if(!inst||!ci)return [];
 var ctl=PARTS[ci.pid],p=PARTS[inst.pid],kind=idx<(p.d||0)?"d":"a",adc=hasRaw("adc");
 if(kind==="d")return ctl.dNames.concat(ctl.aNames);
 return ctl.aNames.concat(adc?range(0,7).map(function(n){return "ADC CH"+n;}):[]);
}
function exportDesign(){return {v:1,chassis:st.chassis,parts:st.parts.map(function(i){return {pid:i.pid,mount:i.mount,pins:i.pins};})};}
function importDesign(o){
 if(!o||o.v!==1||!Array.isArray(o.parts))return false;
 if(CHASSIS[o.chassis])st.chassis=o.chassis;
 st.parts=[];
 o.parts.forEach(function(q){if(!PARTS[q.pid])return;var inst={uid:st.uid++,pid:q.pid,mount:null,slot:null,pins:Array.isArray(q.pins)?q.pins.slice(0,12):null};st.parts.push(inst);if(q.mount&&typeof q.mount==="string")mountPart(inst.uid,q.mount);});
 st.hands=true;return true;
}
// ================= WORLD =================
function setLevel(i){st.lvl=i;if(!st.hands){st.chassis="standard";applyKit(L().kit);}reset();}
function reset(){liveFlush();st.man=null;
 var l=L(),s=l.start;st.robot={x:s.x,y:s.y,a:s.a};st.bumps=0;st.v=0;st.w=0;st.wl=0;st.wr=0;st.pump=false;st.odo=0;st.touching=0;
 st.simt=0;st.dryWatered=false;st.wasted=0;st.status="idle";st.msg="";st.gen=null;st.gripClosed=false;st.relay=false;st.fanHot=false;st.fanWrong=0;st.led="off";st.lcd="";st.beeps=0;
 armReset(l);droneReset(l);
 st.cube=l.cube?{x:l.cube.x,y:l.cube.y,held:false}:null;
 if(l.find&&st.cube){var da=(Math.random()*100-50)*Math.PI/180,dd=55+Math.random()*30;st.cube.x=Math.round(l.start.x+dd*Math.cos(da));st.cube.y=Math.round(l.start.y+dd*Math.sin(da));}
 if(l.plots){
  if((l.kind||l.id)==="farm"){var dry=Math.floor(Math.random()*3);st.plots=l.plots.map(function(p,i){return {x:p[0],y:p[1],w:p[2],h:p[3],m:i===dry?Math.round(8+Math.random()*14):Math.round(55+Math.random()*30),dry:i===dry,watered:false};});}
  else st.plots=l.plots.map(function(p){return {x:p[0],y:p[1],w:p[2],h:p[3],m:20,dry:true,watered:false};});
 }else st.plots=[];
 if(l.zonesDef){var hot=Math.floor(Math.random()*2);st.zones=l.zonesDef.map(function(z,i){return {x:z[0],y:z[1],w:z[2],h:z[3],t:i===hot?Math.round(34+Math.random()*5):Math.round(22+Math.random()*4),hot:i===hot};});}
 else if(l.hot)st.zones=l.hot.map(function(z){return {x:z[0],y:z[1],w:z[2],h:z[3],t:z[4],hot:true};});
 else st.zones=[];
}
function inRect(x,y,r){return x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;}
function zoneAt(){for(var i=0;i<st.zones.length;i++)if(inRect(st.robot.x,st.robot.y,st.zones[i]))return st.zones[i];return null;}
function hitsWall(x,y){
 var rs=walls(),rr=CH().R;
 for(var i=0;i<rs.length;i++){var r=rs[i],cx=clamp(x,r[0],r[0]+r[2]),cy=clamp(y,r[1],r[1]+r[3]),dx=x-cx,dy=y-cy;if(dx*dx+dy*dy<rr*rr)return true;}
 return false;
}
function rayAt(off){
 var a=(st.robot.a+off)*Math.PI/180,dx=Math.cos(a),dy=Math.sin(a),best=MAXR,rs=walls(),ox=st.robot.x,oy=st.robot.y;
 for(var i=0;i<rs.length;i++){var r=rs[i],t0=0,t1=best,ok=true,ax=[[ox,dx,r[0],r[0]+r[2]],[oy,dy,r[1],r[1]+r[3]]];
  for(var k=0;k<2;k++){var o=ax[k][0],d=ax[k][1],lo=ax[k][2],hi=ax[k][3];
   if(Math.abs(d)<1e-9){if(o<lo||o>hi){ok=false;break;}}
   else{var ta=(lo-o)/d,tb=(hi-o)/d;if(ta>tb){var tmp=ta;ta=tb;tb=tmp;}t0=Math.max(t0,ta);t1=Math.min(t1,tb);if(t0>t1){ok=false;break;}}}
  if(ok&&t0<best)best=t0;}
 return best;
}
var SLOTOFF={front:0,left:-90,right:90};
var frontOvr=null;function setFrontDistance(fn){frontOvr=fn||null;}
function distFrom(inst){if(frontOvr&&inst.slot==="front"){var o=frontOvr();return o==null?MAXR:Math.max(0,Math.min(MAXR,o));}
 var off=SLOTOFF[inst.slot],pid=inst.pid;
 if(pid==="us")return clamp(Math.min(rayAt(off-8),rayAt(off),rayAt(off+8))+noise(0.8),0,MAXR);
 if(pid==="sharp"){var d=rayAt(off)+noise(1.6);return d<10?10:Math.min(d,80);}
 var d2=rayAt(off);return d2<15?d2:15;
}
function distSensor(slot){var o=["us","sharp","irobs"];for(var i=0;i<o.length;i++){var f=find(o[i],slot);if(f)return f;}return null;}
function dist(slot){var s=distSensor(slot);if(!s)throw new Error("No distance sensor on the "+slot+". Add an ultrasonic or IR sensor and set its position to '"+slot+"'.");return distFrom(s);}
function segDist(px,py,a,b){var vx=b[0]-a[0],vy=b[1]-a[1],t=clamp(((px-a[0])*vx+(py-a[1])*vy)/(vx*vx+vy*vy),0,1),dx=px-(a[0]+vx*t),dy=py-(a[1]+vy*t);return Math.sqrt(dx*dx+dy*dy);}
function irPoint(sd,f){var a=st.robot.a*Math.PI/180;return [st.robot.x+Math.cos(a)*(f||7)+(-Math.sin(a))*sd*4,st.robot.y+Math.sin(a)*(f||7)+Math.cos(a)*sd*4];}
function onLineRaw(sd){var tr=L().track;if(!tr)return false;var p=irPoint(sd);for(var i=0;i<tr.length-1;i++)if(segDist(p[0],p[1],tr[i],tr[i+1])<1.8)return true;return false;}
function line(side){if(!find("line",side===-1?"left":"right"))throw new Error("No line sensor on the "+(side===-1?"left":"right")+". Add an IR line sensor and set its position.");
 var on=onLineRaw(side);
 if(L().needs==="ldr"&&st.sens){var v=st.sens(on?0.08:0.9)+(Math.random()-0.5)*0.5,vt=st.sens(0.08),vf=st.sens(0.9);st.sensV=v;return Math.abs(v-vt)<Math.abs(v-vf);}
 return on;}
function setSensor(fn){st.sens=typeof fn==="function"?fn:null;st.sensV=null;}
function plotAt(){for(var i=0;i<st.plots.length;i++)if(inRect(st.robot.x,st.robot.y,st.plots[i]))return st.plots[i];return null;}
function need(pid,msg){if(!has(pid))throw new Error(msg||("Missing part: "+PARTS[pid].name+"."));}
function soil(){need("soil","No soil moisture sensor installed.");var p=plotAt();return p?clamp(p.m+noise(2),0,100):100;}
function colorName(){
 need("color","No colour sensor installed.");var p=irPoint(0,6),l=L(),i,t;
 for(i=0;i<(l.tiles||[]).length;i++){t=l.tiles[i];if(p[0]>=t[0]&&p[0]<=t[0]+t[2]&&p[1]>=t[1]&&p[1]<=t[1]+t[3])return t[4];}
 if(l.track){var tr=l.track;for(i=0;i<tr.length-1;i++)if(segDist(p[0],p[1],tr[i],tr[i+1])<1.8)return "black";}
 return l.floor==="farm"?"brown":l.floor==="tape"?"white":"grey";
}
function light(){need("ldr","No light sensor installed.");var l=L(),sh=l.shade||[],x=st.robot.x,y=st.robot.y;for(var i=0;i<sh.length;i++)if(x>=sh[i][0]&&x<=sh[i][0]+sh[i][2]&&y>=sh[i][1]&&y<=sh[i][1]+sh[i][3])return clamp(15+noise(4),0,100);return clamp(85+noise(4),0,100);}
function temp(){need("dht","No temperature sensor installed.");var z=zoneAt();return (z?z.t:26)+noise(0.6);}
function humid(){need("dht","No humidity sensor installed.");var z=zoneAt();return clamp((z?(z.hot?38:52):55)+noise(1.5),0,100);}
function heading(){if(!has("imu")&&!has("compass"))throw new Error("No gyro or compass installed.");return (((st.robot.a%360)+360)%360)+noise(has("compass")?2:1);}
function odo(){need("encoder","No wheel encoder installed.");return st.odo+noise(0.3);}
function bump(){need("bumper","No bumper switch installed.");return st.touching>0;}
function camSees(){need("camera","No camera installed.");if(!st.cube)return false;var a=st.robot.a*Math.PI/180,dx=st.cube.x-st.robot.x,dy=st.cube.y-st.robot.y,d=Math.hypot(dx,dy),ang=Math.atan2(dy,dx)-a;ang=Math.atan2(Math.sin(ang),Math.cos(ang));return d<90&&Math.abs(ang)<0.45;}
function inGoal(){var g=L().goal;return !!g&&st.robot.x>=g[0]&&st.robot.x<=g[0]+g[2]&&st.robot.y>=g[1]&&st.robot.y<=g[1]+g[3];}
function cond(b){
 var k=b.k||"front";
 switch(k){
  case "front":case "left":case "right":return dist(k)<b.v;
  case "lineL":return line(-1);
  case "lineR":return line(1);
  case "soil":return soil()<b.v;
  case "color":return colorName()===(b.q||"red");
  case "light":return light()<b.v;
  case "temp":return temp()>b.v;
  case "humid":return humid()<b.v;
  case "heading":return heading()<b.v;
  case "odo":return odo()>b.v;
  case "bump":return bump();
  case "cam":return camSees();
  case "alt":need("dronekit","No drone installed.");return st.drone.z<b.v;
  case "dfront":need("dronekit","No drone installed.");return droneFront()<b.v;
  case "bat":need("dronekit","No drone installed.");return st.drone.bat<b.v;
  case "dlight":need("dronekit","No drone installed.");return droneLight()>b.v;
  case "cubecol":return cubeColour()===(b.q||"red");
  case "boxspot":need("armkit","No robot arm installed.");return !!boxAtSpot();
 }
 return false;
}
function syncCube(){if(st.cube&&st.cube.held){var a=st.robot.a*Math.PI/180;st.cube.x=st.robot.x+Math.cos(a)*13;st.cube.y=st.robot.y+Math.sin(a)*13;}}
// ================= INTERPRETER =================
function* move(d){
 var dir=d<0?-1:1,rem=Math.abs(d),dt,look=Math.abs(d)<=6?8:0,vmx=CH().vmax,acc=CH().acc;
 while(rem>0.02){
  dt=st.dt;var want=Math.min(vmx,Math.sqrt(2*acc*(rem+look)));
  st.v+=clamp(want-st.v,-acc*2*dt,acc*dt);if(st.v<0.5)st.v=0.5;
  var step=Math.min(rem,st.v*dt);if(L().drift)st.robot.a+=L().drift*step*dir;var a=st.robot.a*Math.PI/180,nx=st.robot.x+Math.cos(a)*step*dir,ny=st.robot.y+Math.sin(a)*step*dir;
  if(hitsWall(nx,ny)){st.bumps++;st.touching=0.5;st.v=0;return;}
  st.robot.x=nx;st.robot.y=ny;rem-=step;st.odo+=step;st.wl+=dir*step/3.5;st.wr+=dir*step/3.5;syncCube();if(st.touching>0)st.touching-=dt;yield;
 }
}
function* turn(d){
 var dir=d<0?-1:1,rem=Math.abs(d),dt,sc=CH().vmax/40,wmx=WMAX*sc,wac=WACC*sc;st.v=0;
 while(rem>0.05){
  dt=st.dt;var want=Math.min(wmx,Math.sqrt(2*wac*rem));
  st.w+=clamp(want-st.w,-wac*2*dt,wac*dt);if(st.w<4)st.w=4;
  var step=Math.min(rem,st.w*dt);st.robot.a+=step*dir;rem-=step;
  var arc=step*Math.PI/180*6.5/3.5;st.wl+=dir*arc;st.wr-=dir*arc;syncCube();if(st.touching>0)st.touching-=dt;yield;
 }
 st.robot.a=((st.robot.a%360)+360)%360;
}
function* wait(sec){var t=sec;while(t>0){t-=st.dt;yield;}}
function* water(){
 need("pump","No water pump installed. Add the Water pump module.");
 var pl=plotAt(),t=1.2;st.pump=true;
 while(t>0){t-=st.dt;yield;}
 st.pump=false;
 if((L().kind||L().id)==="farm"){if(pl&&!pl.watered&&pl.dry){pl.watered=true;pl.m=90;st.dryWatered=true;}else st.wasted++;}
 else if(pl){pl.watered=true;pl.m=90;}
}
function fan(on){
 need("relay","No relay module installed.");need("fan","No cooling fan installed.");
 st.relay=on;
 if(on&&(L().kind||L().id)==="greenhouse"){var z=zoneAt();if(z&&z.hot)st.fanHot=true;else st.fanWrong++;}
}

var ARM={x:150,y:178,H0:14,L1:55,L2:52,LIM:{b:[0,180],s:[0,160],e:[-40,150]},SP:{b:70,s:55,e:75}};
function armTip(){var a=st.arm,s=a.s*Math.PI/180,f=(a.s-a.e)*Math.PI/180,r=ARM.L1*Math.cos(s)+ARM.L2*Math.cos(f),z=ARM.H0+ARM.L1*Math.sin(s)+ARM.L2*Math.sin(f),b=a.b*Math.PI/180;
 return {r:r,z:z,x:ARM.x+r*Math.cos(b),y:ARM.y-r*Math.sin(b)};}
function armSet(b,s,e){var a=st.arm,Lm=ARM.LIM;function cl(v,k){return Math.max(Lm[k][0],Math.min(Lm[k][1],v));}if(b!==undefined)a.b=cl(b,"b");if(s!==undefined)a.s=cl(s,"s");if(e!==undefined)a.e=cl(e,"e");}
function armReset(l){
 st.arm={b:90,s:90,e:0,g:false,held:null};st.cubes=[];st.belt={on:false,t:0};
 if(!l.arm)return;
 var cs=(l.cubes||[]).map(function(q){return {x:q[0],y:q[1],z:6,c:q[2],held:false,vz:0};});
 if(l.id==="armsort"){var cols=["red","blue","red","blue"].slice(0,3);if(Math.random()<0.5)cols=["blue","red","blue"];if(Math.random()<0.34)cols=["red","red","blue"];cs.forEach(function(q,i){q.c=cols[i];});}
 if(l.id==="armbelt2"){var c2=[["red","blue","red"],["blue","red","blue"],["red","red","blue"],["blue","blue","red"]][Math.floor(Math.random()*4)];cs.forEach(function(q,i){q.c=c2[i];});}
 st.cubes=cs;
}
function cubeRest(c){var z=6;st.cubes.forEach(function(o){if(o!==c&&!o.held&&Math.abs(o.x-c.x)<9&&Math.abs(o.y-c.y)<9&&o.z<c.z-3)z=Math.max(z,o.z+12);});return z;}
function armPhysics(dt){
 var t=armTip();
 st.cubes.forEach(function(c){
  if(c.held){c.x=t.x;c.y=t.y;c.z=Math.max(6,t.z);c.vz=0;return;}
  var rz=cubeRest(c);if(c.z>rz){c.vz=Math.min(c.vz+400*dt,200);c.z=Math.max(rz,c.z-c.vz*dt);}else{c.z=rz;c.vz=0;}
 });
 if(t.z<1.5&&L().arm){throw new Error("The arm hit the table! Raise the shoulder or bend the elbow less.");}
}
function onBelt(c){var b=L().belt;return !!b&&!c.held&&c.z<=7&&c.y>=b.y&&c.y<=b.y+b.h&&c.x>b.x-2;}
function boxAtSpot(){var b=L().belt;if(!b)return null;var f=null;st.cubes.forEach(function(c){if(onBelt(c)&&Math.abs(c.x-b.spot)<=1.5)f=c;});return f;}
function beltStep(dt){var b=L().belt;if(!b||!st.belt||!st.belt.on)return;
 st.cubes.forEach(function(c){if(onBelt(c)){c.x-=b.speed*dt;if(c.x<b.x+4)throw new Error("A box fell off the end of the belt! Stop the belt sooner.");}});}
function* beltGo(){need("armkit","No robot arm installed.");var b=L().belt;if(!b)throw new Error("There is no conveyor belt in this mission.");
 if(!st.cubes.some(function(c){return onBelt(c);}))throw new Error("No more boxes on the belt.");
 var t=0;st.belt.on=true;
 while(true){var hit=null;st.cubes.forEach(function(c){if(onBelt(c)&&c.x<=b.spot+0.01&&c.x>b.spot-b.speed*0.12)hit=c;});
  if(hit){hit.x=b.spot;st.belt.on=false;yield;return;}
  t+=st.dt;if(t>40){st.belt.on=false;throw new Error("No box reached the pick spot.");}yield;}}
function armIdle(dt){if(L().arm&&st.status!=="run")try{armPhysics(dt);}catch(e){}}
function* armTo(key,target){
 var Lm=ARM.LIM[key];target=Math.max(Lm[0],Math.min(Lm[1],target));var a=st.arm,sp=ARM.SP[key];
 while(Math.abs(a[key]-target)>0.2){var step=Math.min(Math.abs(target-a[key]),sp*st.dt);a[key]+=Math.sign(target-a[key])*step;yield;}
 a[key]=target;
}
function cubeAtTip(rad){var t=armTip(),best=null,bd=1e9;st.cubes.forEach(function(c){var d=Math.hypot(c.x-t.x,c.y-t.y);if(d<rad&&Math.abs(c.z-t.z)<12&&d<bd){bd=d;best=c;}});return best;}
function armGrip(close){
 need("armkit","No robot arm installed.");
 var a=st.arm;a.g=close;
 if(close&&!a.held){var c=cubeAtTip(9);if(c){c.held=true;a.held=c;}}
 else if(!close&&a.held){a.held.held=false;a.held=null;}
}
function cubeColour(){need("armkit","No robot arm installed.");var c=cubeAtTip(16);return c?c.c:"none";}
function inBin(c,r){return c.x>=r[0]&&c.x<=r[0]+r[2]&&c.y>=r[1]&&c.y<=r[1]+r[3];}

var DR={R:12,VH:70,VZ:55,YAW:100,MAXZ:220,BATRATE:0.55};
function droneReset(l){st.drone={z:0,flying:false,bat:100,maxZ:0,gate:false,landedOk:false,spin:0,lit:l.pads?Math.floor(Math.random()*l.pads.length):0};}
function droneLight(){var l=L();if(!l.pads)return 5;var p=l.pads[st.drone.lit],d=Math.hypot(st.robot.x-p[0],st.robot.y-p[1]);return Math.round(Math.max(5,100*(1-d/55)));}
function droneCrash(msg){throw new Error(msg);}
function dFly(){if(!st.drone.flying)droneCrash("The drone is on the ground. Use a Take off block first.");}
function wallH(){return L().wallH||16;}
function droneHitsWall(x,y,z){
 var l=L(),rs=l.walls||[],rr=DR.R,wh=wallH();
 if(x<-2||y<-2||x>W+2||y>H+2)droneCrash("The drone left the safe flight area.");
 if(z>wh+2)return false;
 for(var i=0;i<rs.length;i++){var r=rs[i],cx=clamp(x,r[0],r[0]+r[2]),cy=clamp(y,r[1],r[1]+r[3]),dx=x-cx,dy=y-cy;if(dx*dx+dy*dy<rr*rr)return true;}
 return false;
}
function droneFront(){
 var d=st.drone,a=st.robot.a*Math.PI/180,dx=Math.cos(a),dy=Math.sin(a),best=MAXR,wh=wallH();
 if(d.z>wh+2)return MAXR;
 (L().walls||[]).forEach(function(r){var t0=0,t1=best,ok=true,ax=[[st.robot.x,dx,r[0],r[0]+r[2]],[st.robot.y,dy,r[1],r[1]+r[3]]];
  for(var k=0;k<2;k++){var o=ax[k][0],dd=ax[k][1],lo=ax[k][2],hi=ax[k][3];if(Math.abs(dd)<1e-9){if(o<lo||o>hi){ok=false;break;}}else{var u=(lo-o)/dd,v=(hi-o)/dd;if(u>v){var tt=u;u=v;v=tt;}t0=Math.max(t0,u);t1=Math.min(t1,v);if(t0>t1){ok=false;break;}}}
  if(ok&&t0>0&&t0<best)best=t0;});
 return Math.max(0,best-DR.R);
}
function* droneTakeoff(){
 need("dronekit","No drone installed.");var d=st.drone;if(d.flying)return;
 d.flying=true;
 while(d.z<60){d.z=Math.min(60,d.z+DR.VZ*st.dt);d.maxZ=Math.max(d.maxZ,d.z);yield;}
 yield* wait(0.4);
}
function* droneLand(){
 need("dronekit","No drone installed.");var d=st.drone;if(!d.flying)return;
 while(d.z>0.1){d.z=Math.max(0,d.z-DR.VZ*0.7*st.dt);yield;}
 d.z=0;d.flying=false;yield* wait(0.3);
}
function* droneAlt(dz){
 need("dronekit","No drone installed.");dFly();var d=st.drone,target=d.z+dz;
 if(target>DR.MAXZ)droneCrash("The drone flew too high and lost signal. The limit is "+DR.MAXZ+" cm.");
 if(target<0)target=0;
 var dir=target>=d.z?1:-1;
 while(Math.abs(target-d.z)>0.2){var step=Math.min(Math.abs(target-d.z),DR.VZ*st.dt);d.z+=dir*step;d.maxZ=Math.max(d.maxZ,d.z);
  if(d.z<=0.05&&dir<0){d.z=0;droneCrash("The drone dived into the ground. Use the Land block to land gently.");}
  yield;}
 d.z=target;
 if(d.z<=0.05&&dir<0)droneCrash("The drone dived into the ground. Use the Land block to land gently.");
}
function* droneMove(dist){
 need("dronekit","No drone installed.");dFly();var d=st.drone,dir=dist<0?-1:1,rem=Math.abs(dist),L0=L(),g=L0.gate;
 while(rem>0.02){
  var step=Math.min(rem,DR.VH*st.dt),a=st.robot.a*Math.PI/180,nx=st.robot.x+Math.cos(a)*step*dir,ny=st.robot.y+Math.sin(a)*step*dir;
  if(g){var gx=g[0],cross=(st.robot.x<gx&&nx>=gx)||(st.robot.x>gx&&nx<=gx);
   if(cross){var gy=g[1],gw=g[2],ok=Math.abs(ny-gy)<=gw/2-DR.R*0.7&&d.z>=g[3]+4&&d.z<=g[4]-4;if(ok)d.gate=true;else droneCrash("The drone hit the gate frame. Line up with the opening and fly at the right height.");}}
  if(droneHitsWall(nx,ny,d.z))droneCrash("The drone crashed into the wall. Climb higher before flying over it.");
  st.robot.x=nx;st.robot.y=ny;rem-=step;yield;
 }
}
function* droneTurn(deg){need("dronekit","No drone installed.");dFly();var dir=deg<0?-1:1,rem=Math.abs(deg);while(rem>0.05){var step=Math.min(rem,DR.YAW*st.dt);st.robot.a+=step*dir;rem-=step;yield;}st.robot.a=((st.robot.a%360)+360)%360;}
function dronePhysics(dt){
 var d=st.drone;if(!L().drone)return;
 if(d.flying){d.spin=(d.spin+dt*40)%1000;d.bat=Math.max(0,d.bat-(L().drain||DR.BATRATE)*dt);if(d.bat<=0)droneCrash("The battery ran out in mid-air and the drone fell. Land earlier.");}
}
function grip(close){
 if(L().arm)return armGrip(close);
 need("servo","No servo gripper installed.");
 st.gripClosed=close;
 if(st.cube){
  if(close&&!st.cube.held){var a=st.robot.a*Math.PI/180,fx=st.robot.x+Math.cos(a)*13,fy=st.robot.y+Math.sin(a)*13;if(Math.hypot(st.cube.x-fx,st.cube.y-fy)<9)st.cube.held=true;}
  else if(!close&&st.cube.held){syncCube();st.cube.held=false;}
 }
}
function* runList(list){
 for(var i=0;i<list.length;i++){var b=list[i];
  switch(b.t){
   case "fwd":yield* (L().drone?droneMove(b.v):move(b.v));break;
   case "back":yield* (L().drone?droneMove(-b.v):move(-b.v));break;
   case "left":yield* (L().drone?droneTurn(-b.v):turn(-b.v));break;
   case "right":yield* (L().drone?droneTurn(b.v):turn(b.v));break;
   case "takeoff":yield* droneTakeoff();break;
   case "land":yield* droneLand();break;
   case "up":yield* droneAlt(b.v);break;
   case "down":yield* droneAlt(-b.v);break;
   case "wait":yield* wait(b.v);break;
   case "water":yield* water();break;
   case "fanon":fan(true);yield;break;
   case "fanoff":fan(false);yield;break;
   case "beltgo":yield* beltGo();break;
   case "beltoff":st.belt.on=false;yield;break;
   case "armb":yield* armTo("b",b.v);break;
   case "arms":yield* armTo("s",b.v);break;
   case "arme":yield* armTo("e",b.v);break;
   case "gripc":grip(true);yield* wait(0.5);break;
   case "gripo":grip(false);yield* wait(0.5);break;
   case "led":need("led","No RGB LED installed.");st.led=b.q||"red";yield;break;
   case "beep":need("buzzer","No buzzer installed.");st.beeps++;yield* wait(0.3);break;
   case "print":need("lcd","No LCD installed.");st.lcd=String(b.q||"");yield;break;
   case "stop":throw STOP;
   case "repeat":for(var k=0;k<b.v;k++){yield* runList(b.c);yield;}break;
   case "forever":while(true){yield* runList(b.c);yield;}
   case "if":if(cond(b))yield* runList(b.c);else yield* runList(b.e);break;
  }}
}
function* main(prog){try{yield* runList(prog);}catch(e){if(e!==STOP)throw e;}}
function finish(win,msg){st.status=win?"win":"lose";st.msg=msg;st.gen=null;st.v=0;st.w=0;st.pump=false;}
function end(){
 var l=L();
 if(l.drone){
  var dd=st.drone;if(dd.flying)return finish(false,"The drone is still in the air. Add a Land block at the end.");
  var pad=l.pad,onpad=Math.hypot(st.robot.x-pad[0],st.robot.y-pad[1])<=pad[2];
  if(l.id==="dronenight"){var lp=l.pads[dd.lit],okp=Math.hypot(st.robot.x-lp[0],st.robot.y-lp[1])<=lp[2];if(okp)return finish(true,"★ Found the lit pad in the dark! Battery left: "+Math.round(dd.bat)+"%.");var other=l.pads.some(function(q){return Math.hypot(st.robot.x-q[0],st.robot.y-q[1])<=q[2];});return finish(false,other?"You landed on a dark pad. Check the light sensor before landing.":"You landed away from the lit pad ("+Math.round(Math.hypot(st.robot.x-lp[0],st.robot.y-lp[1]))+" cm). Search the three pads.");}
  if(l.id==="dronefirst"){if(dd.maxZ<100)return finish(false,"The drone only reached "+Math.round(dd.maxZ)+" cm. Climb to at least 100 cm.");return onpad?finish(true,"★ Great first flight! You climbed to "+Math.round(dd.maxZ)+" cm and landed on the pad."):finish(false,"You landed "+Math.round(Math.hypot(st.robot.x-pad[0],st.robot.y-pad[1]))+" cm from the pad. Land on the orange circle.");}
  if(l.id==="dronegate"){if(!dd.gate)return finish(false,"The drone never flew through the gate.");return onpad?finish(true,"★ Through the gate and landed on the pad!"):finish(false,"You passed the gate but landed "+Math.round(Math.hypot(st.robot.x-pad[0],st.robot.y-pad[1]))+" cm from the pad.");}
  if((l.kind||l.id)==="dronewall")return onpad?finish(true,"★ Over the wall and landed on the pad!"):finish(false,"The drone isn't on the landing pad ("+Math.round(Math.hypot(st.robot.x-pad[0],st.robot.y-pad[1]))+" cm away).");
 }
 if(l.arm){
  var bins=l.bins||[],held=st.arm.held;
  if(held)return finish(false,"The cube is still in the gripper. Open it above the target.");
  if(l.id==="armpick"){var c0=st.cubes[0];return inBin(c0,bins[0])?finish(true,"★ Cube is in the bin!"):finish(false,"The cube isn't in the bin yet.");}
  if(l.id==="armstack"){var b=st.cubes[0],r=st.cubes[1];return Math.abs(b.x-r.x)<8&&Math.abs(b.y-r.y)<8&&r.z>14?finish(true,"★ Stacked! The red cube sits on the blue one."):finish(false,"The red cube isn't resting on the blue cube.");}
  if(l.id==="armbelt"){var inb=st.cubes.filter(function(q){return inBin(q,bins[0]);}).length;return inb===st.cubes.length?finish(true,"★ All 3 boxes are in the bin!"):finish(false,inb+" of 3 boxes are in the bin.");}
  if(l.id==="armbelt2"){var bad2=0,ok2=0;st.cubes.forEach(function(q){var right=bins.filter(function(bn){return bn[4]===q.c;})[0];if(right&&inBin(q,right))ok2++;else bad2++;});return bad2===0?finish(true,"★ All boxes sorted by colour!"):finish(false,ok2+" of 3 boxes are in the right bin. Check each colour before moving it.");}
  if(l.id==="armsort"){var bad=0,ok=0;st.cubes.forEach(function(q){var right=bins.filter(function(bn){return bn[4]===q.c;})[0];if(right&&inBin(q,right))ok++;else bad++;});return bad===0?finish(true,"★ All cubes sorted!"):finish(false,ok+" of 3 cubes are in the right bin. Check each colour before moving it.");}
 }
 if((l.kind||l.id)==="farm"){
  if(st.wasted>0)return finish(false,"Water wasted: a pump run was not on the dry plot. Use the soil sensor.");
  return st.dryWatered?finish(true,"★ The dry plot is watered and no water was wasted!"):finish(false,"The dry plot was not watered.");
 }
 if((l.kind||l.id)==="greenhouse"){
  if(st.fanWrong>0)return finish(false,"The fan was switched on where it wasn't needed. Check the temperature first.");
  return st.fanHot?finish(true,"★ The hot bay is cooling and no energy was wasted!"):finish(false,"The overheating bay was not cooled. Switch the fan on there.");
 }
 if(l.id==="cargo"){
  var g=l.goal,c=st.cube;
  if(c&&!c.held&&c.x>=g[0]&&c.x<=g[0]+g[2]&&c.y>=g[1]&&c.y<=g[1]+g[3])return finish(true,"★ Cargo delivered!");
  return finish(false,c&&c.held?"The cube is still in the gripper. Release it in the zone.":"The cube is not in the green zone.");
 }
 if(l.id==="beacon")return finish(false,"The beacon was not reached. The camera only sees about 90 cm ahead, so search by turning.");
 if(l.id==="sandbox")return finish(true,"Program finished. Change the parts and try again.");
 if(inGoal()){
  if(l.noBump&&st.bumps>0)return finish(false,"In the zone, but the robot hit the wall. Use the sensor to stop earlier.");
  return finish(true,"★ Mission complete!");
 }
 var g2=l.goal,d=Math.round(Math.hypot(g2[0]+g2[2]/2-st.robot.x,g2[1]+g2[3]/2-st.robot.y));
 finish(false,"Not there yet: "+d+" cm from the zone"+(st.bumps?" and bumped "+st.bumps+"×":"")+". Adjust your program and run again.");
}

// ---- Live mode: lets real (full) Python drive the robot one command at a time ----
var liveQ=[],liveCur=null,liveDone=false;
function liveFlush(){var err=new Error(st.status==="run"?"The run was stopped.":"The run has ended.");if(liveCur){var c=liveCur;liveCur=null;c.rej(err);}while(liveQ.length)liveQ.shift().rej(err);}
function* liveGen(){while(true){if(liveQ.length){var j=liveQ.shift();liveCur=j;yield* runList([j.b]);liveCur=null;j.res();}else if(liveDone)return;else yield;}}
function startLive(){var v=validate();if(!v.ok){st.status="lose";st.msg="Robot not ready: "+v.errors[0];return false;}
 reset();liveQ=[];liveCur=null;liveDone=false;st.gen=(function*(){try{yield* liveGen();}catch(e){if(e!==STOP)throw e;}})();st.status="run";return true;}
function liveDo(b){return new Promise(function(res,rej){if(st.status!=="run"){rej(new Error(st.status==="idle"?"The run was stopped.":"The run has ended."));return;}liveQ.push({b:b,res:res,rej:rej});});}
function liveEnd(){liveDone=true;}
function liveFail(msg){if(st.status==="run"){finish(false,msg);}liveFlush();}
function liveAlive(){return st.status==="run";}
function sense(name,arg){switch(name){
 case "distance":return dist(arg);case "line":return line(arg==="left"?-1:1);case "soil":return soil();case "light":return light();case "temperature":return temp();
 case "humidity":return humid();case "heading":return heading();case "odo":return odo();case "bump":return bump();case "cam":return camSees();case "color":return colorName();
 case "cube":need("armkit","No robot arm installed.");return cubeColour();case "alt":need("dronekit","No drone installed.");return st.drone.z;
 case "dfront":need("dronekit","No drone installed.");return droneFront();case "bat":need("dronekit","No drone installed.");return st.drone.bat;case "dlight":need("dronekit","No drone installed.");return droneLight();
 case "box":need("armkit","No robot arm installed.");return !!boxAtSpot();}
 throw new Error("Unknown sensor "+name);}

// ---- Manual driving (joystick / keyboard / tilt) ----
function* manualGen(){while(true){var dt=st.dt,vmx=CH().vmax,acc=CH().acc,sc=vmx/40,wmx=WMAX*sc,wac=WACC*sc,m=st.man||{f:0,w:0};
 st.v+=clamp(m.f*vmx-st.v,-acc*2*dt,acc*dt);st.w+=clamp(m.w*wmx-st.w,-wac*2*dt,wac*dt);
 st.robot.a=((st.robot.a+st.w*dt)%360+360)%360;
 var step=st.v*dt,a=st.robot.a*Math.PI/180,nx=st.robot.x+Math.cos(a)*step,ny=st.robot.y+Math.sin(a)*step;
 if(Math.abs(step)>1e-4){if(hitsWall(nx,ny)){if(!(st.touching>0))st.bumps++;st.touching=0.5;st.v=0;}else{st.robot.x=nx;st.robot.y=ny;st.odo+=Math.abs(step);syncCube();}}
 var arc=st.v*dt/3.5,tr=st.w*dt*Math.PI/180*6.5/3.5;st.wl+=arc+tr;st.wr+=arc-tr;
 if(st.touching>0)st.touching-=dt;
 if(L().goal&&inGoal()){finish(true,"★ You drove to the goal by hand! (Practice run: build a program to earn stars.)");}
 yield;}}
function startManual(){if(L().drone||L().arm){st.msg="Hand driving works on wheeled missions.";return false;}
 var v=validate();if(!v.ok){st.status="lose";st.msg="Robot not ready: "+v.errors[0];return false;}
 reset();st.man={f:0,w:0};st.gen=manualGen();st.status="run";return true;}
function manual(f,w){st.man={f:Math.max(-1,Math.min(1,+f||0)),w:Math.max(-1,Math.min(1,+w||0))};}
function start(prog){
 var v=validate();if(!v.ok){st.status="lose";st.msg="Robot not ready: "+v.errors[0];return false;}
 reset();st.gen=main(prog);st.status="run";return true;
}
function stop(){reset();}
function tick(el){_tick(el);if(st.status!=="run")liveFlush();}
function _tick(el){
 if(st.status!=="run")return;
 var n=Math.max(1,Math.ceil(el/0.02)),d=el/n;
 for(var i=0;i<n&&st.status==="run";i++){
  st.dt=d;st.simt=(st.simt||0)+d;var r;
  try{r=st.gen.next();}catch(e){st.status="lose";st.msg=e.message&&e.message.indexOf("No ")===0||/Missing/.test(e.message)?"Sensor / part problem: "+e.message:"Program error: "+e.message;st.gen=null;st.v=0;st.w=0;return;}
  if(L().drone&&st.status==="run"){try{dronePhysics(d);}catch(e){st.status="lose";st.msg=e.message;st.gen=null;return;}}
  if(L().arm&&st.status==="run"){try{armPhysics(d);beltStep(d);}catch(e){st.status="lose";st.msg=e.message;st.gen=null;return;}}
  if(L().find&&st.cube&&Math.hypot(st.cube.x-st.robot.x,st.cube.y-st.robot.y)<=25){finish(true,"★ Beacon reached!");return;}
  if(L().reach&&inGoal()){finish(true,"★ Mission complete!");return;}
  if(r.done)end();
 }
}
// ================= LIVE READOUTS =================
function readouts(){
 var out=[];function add(l,f){try{out.push([l,f()]);}catch(e){}}
 if(L().drone){var dz=st.drone;add("Altitude",function(){return Math.round(dz.z)+" cm";});if(L().night)add("Light",function(){return droneLight()+"%";});add("Battery",function(){return Math.round(dz.bat)+"%";});add("Wall ahead",function(){var f=droneFront();return f>=MAXR-1?"clear":Math.round(f)+" cm";});add("Heading",function(){return Math.round(((st.robot.a%360)+360)%360)+"°";});add("Status",function(){return dz.flying?"flying":"landed";});}
 if(L().needs==="ldr"&&st.sens)add("Circuit sensor",function(){return st.sensV==null?"ready":st.sensV.toFixed(2)+" V";});
 if(L().arm){var tp=armTip(),ar=st.arm;add("Base",function(){return Math.round(ar.b)+"°";});add("Shoulder",function(){return Math.round(ar.s)+"°";});add("Elbow",function(){return Math.round(ar.e)+"°";});add("Reach",function(){return Math.round(tp.r)+" cm";});add("Height",function(){return Math.round(tp.z)+" cm";});add("Gripper",function(){return ar.held?"holding":ar.g?"closed":"open";});if(L().belt)add("Belt",function(){return st.belt&&st.belt.on?"running":"stopped";});}
 st.parts.forEach(function(i){
  if(!i.mount)return;var p=PARTS[i.pid];
  if(p.slotType==="dist"){var d=distFrom(i);out.push([(i.slot==="front"?"Front":i.slot==="left"?"Left":"Right")+" ("+p.name.split(" ")[0]+")",(d>=MAXR?"150+":d.toFixed(1))+" cm"]);}
  else if(i.pid==="line")out.push(["Line "+i.slot,onLineRaw(i.slot==="left"?-1:1)?"■ on tape":"□ off"]);
  else if(i.pid==="color")add("Colour",colorName);
  else if(i.pid==="ldr")add("Light",function(){return light().toFixed(0)+"%";});
  else if(i.pid==="soil")add("Soil",function(){var s=soil();return s>=100?"--":s.toFixed(0)+"%";});
  else if(i.pid==="dht"){add("Temp",function(){return temp().toFixed(1)+"°C";});add("Humidity",function(){return humid().toFixed(0)+"%";});}
  else if(i.pid==="imu"||i.pid==="compass")add(i.pid==="imu"?"Gyro heading":"Compass",function(){return heading().toFixed(0)+"°";});
  else if(i.pid==="encoder")add("Odometer",function(){return odo().toFixed(0)+" cm";});
  else if(i.pid==="bumper")add("Bumper",function(){return bump()?"PRESSED":"free";});
  else if(i.pid==="camera")add("Camera",function(){return camSees()?"cube ahead":"nothing";});
 });
 if(st.lcd)out.push(["LCD",st.lcd]);
 if(!L().arm&&!L().drone)out.push(["Bumps",String(st.bumps)]);
 return out;
}
// ================= CODE GENERATOR =================
var CONDTXT={
 arduino:{front:function(b){return "distanceCm(FRONT) < "+b.v;},left:function(b){return "distanceCm(LEFT) < "+b.v;},right:function(b){return "distanceCm(RIGHT) < "+b.v;},lineL:function(){return "lineSensor(LEFT)";},lineR:function(){return "lineSensor(RIGHT)";},soil:function(b){return "soilPercent() < "+b.v;},alt:function(b){return "droneAltitudeCm() < "+b.v;},dfront:function(b){return "droneFrontCm() < "+b.v;},bat:function(b){return "droneBatteryPct() < "+b.v;},dlight:function(b){return "droneLightPct() > "+b.v;},boxspot:function(){return "boxAtPickSpot()";},cubecol:function(b){return "cubeColourIs("+String(b.q||"red").toUpperCase()+")";},color:function(b){return "colorIs("+String(b.q||"red").toUpperCase()+")";},light:function(b){return "lightPercent() < "+b.v;},temp:function(b){return "temperatureC() > "+b.v;},humid:function(b){return "humidityPercent() < "+b.v;},heading:function(b){return "headingDeg() < "+b.v;},odo:function(b){return "distanceTravelledCm() > "+b.v;},bump:function(){return "bumperPressed()";},cam:function(){return "cameraSeesObject()";}},
 python:{front:function(b){return 'bot.distance("front") < '+b.v;},left:function(b){return 'bot.distance("left") < '+b.v;},right:function(b){return 'bot.distance("right") < '+b.v;},lineL:function(){return 'bot.line("left")';},lineR:function(){return 'bot.line("right")';},soil:function(b){return "bot.soil_percent() < "+b.v;},alt:function(b){return "drone.altitude() < "+b.v;},dfront:function(b){return "drone.front_cm() < "+b.v;},bat:function(b){return "drone.battery() < "+b.v;},dlight:function(b){return "drone.light_percent() > "+b.v;},boxspot:function(){return 'belt.box_at_pick_spot()';},cubecol:function(b){return 'arm.cube_colour() == "'+(b.q||"red")+'"';},color:function(b){return 'bot.color() == "'+(b.q||"red")+'"';},light:function(b){return "bot.light_percent() < "+b.v;},temp:function(b){return "bot.temperature_c() > "+b.v;},humid:function(b){return "bot.humidity_percent() < "+b.v;},heading:function(b){return "bot.heading_deg() < "+b.v;},odo:function(b){return "bot.distance_travelled_cm() > "+b.v;},bump:function(){return "bot.bumper_pressed()";},cam:function(){return "bot.camera_sees_object()";}}
};
function codeFor(prog,force){
 var ci=ctlInst(),ctl=ci&&PARTS[ci.pid],lang=force||(ctl?ctl.lang:"python"),ard=lang==="arduino",v=validate(),T=CONDTXT[ard?"arduino":"python"],out=[];
 function ind(n){return new Array(n+1).join(ard?"  ":"    ");}
 function act(b){
  var n=b.v;
  switch(b.t){
   case "takeoff":return ard?"droneTakeoff();":"drone.takeoff()";
   case "land":return ard?"droneLand();":"drone.land()";
   case "up":return ard?"droneUp("+n+");":"drone.up("+n+")";
   case "down":return ard?"droneDown("+n+");":"drone.down("+n+")";
   case "fwd":if(L().drone)return ard?"droneForward("+n+");":"drone.forward("+n+")";return ard?"forwardCm("+n+");":"bot.forward("+n+")";
   case "back":return ard?"backwardCm("+n+");":"bot.backward("+n+")";
   case "left":return ard?"turnLeft("+n+");":"bot.turn_left("+n+")";
   case "right":return ard?"turnRight("+n+");":"bot.turn_right("+n+")";
   case "wait":return ard?"delay("+Math.round(n*1000)+");":"time.sleep("+n+")";
   case "water":return ard?"pumpRun(1200);":"bot.pump(1.2)";
   case "fanon":return ard?"relaySet(true);":"bot.relay(True)";
   case "fanoff":return ard?"relaySet(false);":"bot.relay(False)";
   case "beltgo":return ard?"beltRunUntilBox();":"belt.run_until_box()";
   case "beltoff":return ard?"beltStop();":"belt.stop()";
   case "armb":return ard?"baseServo.write("+n+");":"arm.base("+n+")";
   case "arms":return ard?"shoulderServo.write("+n+");":"arm.shoulder("+n+")";
   case "arme":return ard?"elbowServo.write("+n+");":"arm.elbow("+n+")";
   case "gripc":return ard?"gripperClose();":"bot.gripper_close()";
   case "gripo":return ard?"gripperOpen();":"bot.gripper_open()";
   case "led":return ard?"setLed("+String(b.q||"red").toUpperCase()+");":'bot.led("'+(b.q||"red")+'")';
   case "beep":return ard?"beep(300);":"bot.beep(0.3)";
   case "print":return ard?'lcdPrint("'+(b.q||"")+'");':'bot.lcd("'+(b.q||"")+'")';
   case "stop":return ard?"motorsStop(); while (true) {}":"bot.stop(); raise SystemExit";
  }
  return "";
 }
 function body(list,n){
  if(!list.length){if(!ard)out.push(ind(n)+"pass");return;}
  list.forEach(function(b){
   if(b.t==="repeat"){out.push(ard?ind(n)+"for (int i = 0; i < "+b.v+"; i++) {":ind(n)+"for _ in range("+b.v+"):");body(b.c,n+1);if(ard)out.push(ind(n)+"}");}
   else if(b.t==="forever"){out.push(ard?ind(n)+"while (true) {":ind(n)+"while True:");body(b.c,n+1);if(ard)out.push(ind(n)+"}");}
   else if(b.t==="if"){var fn=T[b.k||"front"],c=fn?fn(b):"false";out.push(ard?ind(n)+"if ("+c+") {":ind(n)+"if "+c+":");body(b.c,n+1);
    if(b.e&&b.e.length){out.push(ard?ind(n)+"} else {":ind(n)+"else:");body(b.e,n+1);}if(ard)out.push(ind(n)+"}");}
   else out.push(ind(n)+act(b));
  });
 }
 var pins=[];v.wiring.forEach(function(w){w.pins.forEach(function(p){pins.push([w.pid+(w.slot?"_"+w.slot:"")+"_"+p.fn,p.pin]);});});
 if(ard){
  out.push("// Arduino sketch generated by Milestone Minds Robotics Lab");out.push('#include "MilestoneBot.h"  // helper library: forwardCm(), distanceCm() ...');out.push("");
  pins.forEach(function(p){out.push("#define "+p[0].toUpperCase()+" "+p[1].replace(/^D/,""));});
  out.push("");out.push("void setup() {");out.push("  botBegin();");out.push("}");out.push("");out.push("void loop() {");body(prog,1);out.push("  while (true) {}  // program finished");out.push("}");
 }else{
  out.push(lang==="python"?"# Python on Raspberry Pi, generated by Milestone Minds Robotics Lab":"# MicroPython, generated by Milestone Minds Robotics Lab");
  out.push("import time");out.push("import milestonebot as bot  # helper library: forward(), distance() ...");out.push("");
  out.push("PINS = {");pins.forEach(function(p){out.push('    "'+p[0]+'": "'+p[1]+'",');});out.push("}");out.push("bot.begin(PINS)");out.push("");body(prog,0);
 }
 return out.join("\n");
}
return {setFrontDistance:setFrontDistance,startManual:startManual,manual:manual,startLive:startLive,liveDo:liveDo,liveEnd:liveEnd,liveFail:liveFail,liveAlive:liveAlive,sense:sense,setSensor:setSensor,droneLight:droneLight,drone:function(){return st.drone;},armIdle:armIdle,armGrip:function(x){try{armGrip(x);}catch(e){}},ARM:ARM,armTip:armTip,armSet:armSet,W:W,H:H,R:R,MAXR:MAXR,LEVELS:LEVELS,PARTS:PARTS,CATS:CATS,CHASSIS:CHASSIS,st:st,byCat:byCat,mountsFor:mountsFor,mountLabel:mountLabel,mountPart:mountPart,unmountPart:unmountPart,instAt:instAt,setPin:setPin,pinOptions:pinOptions,setHands:setHands,setChassis:setChassis,clearAll:clearAll,autoWire:autoWire,exportDesign:exportDesign,importDesign:importDesign,mtype:mtype,WHY:WHY,addPart:addPart,removePart:removePart,applyKit:applyKit,validate:validate,setLevel:setLevel,reset:reset,start:start,stop:stop,tick:tick,readouts:readouts,codeFor:codeFor,find:find,has:has,distSafe:function(slot){try{return dist(slot);}catch(e){return null;}},ctlInst:ctlInst,plotAt:plotAt};
})();
if(typeof module!=="undefined")module.exports=Core;
