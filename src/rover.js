// ===== Guided Build: Rover. A 10-step build of a real obstacle-avoiding car, with a 3D model, a pin map, working sketches, fixes, and a physics-based test drive =====
(function(){
var $=function(id){return document.getElementById(id);},LS="mm_rover";
var root=$("rvRoot");if(!root||typeof RovSim==="undefined")return;
var st=(function(){try{return JSON.parse(localStorage.getItem(LS)||"{}")||{};}catch(e){return {};}})();
var lang=st.lang||"en",board=st.board||"uno",step=Math.min(10,Math.max(1,st.step||1)),checks=st.checks||{},prices=st.prices||{};
function save(){try{localStorage.setItem(LS,JSON.stringify({lang:lang,board:board,step:step,checks:checks,prices:prices}));}catch(e){}}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c];});}
function X(en,sw){return lang==="sw"?sw:en;}
var ESP=function(){return board==="esp";};
var PIN={uno:{ENA:"D5",IN1:"D7",IN2:"D8",ENB:"D6",IN3:"D9",IN4:"D10",TRIG:"D4",ECHO:"D3",SERVO:"D11",LED:"D13",BUZ:"A0"},
         esp:{ENA:"GPIO14",IN1:"GPIO26",IN2:"GPIO27",ENB:"GPIO32",IN3:"GPIO25",IN4:"GPIO33",TRIG:"GPIO19",ECHO:"GPIO18",SERVO:"GPIO13",LED:"GPIO2",BUZ:"GPIO4"}};
function num(k){return PIN[board][k].replace(/^(D|GPIO)/,"");}

// ---------------- the ten steps ----------------
function steps(){
 var B=ESP()?"ESP32 DevKit":"Arduino Uno";
 return [
 {k:"parts",t:X("Know your parts","Zijue vipuri vyako"),
  why:X("A robot car is a handful of simple parts working together. Lay everything out and name each part before you build. A missing part found late costs the most time.","Gari la roboti ni vipuri vichache rahisi vinavyofanya kazi pamoja. Viweke vyote mezani na utaje kimoja kimoja kabla ya kujenga. Kipuri kinachokosekana kugunduliwa baadaye hupoteza muda mwingi."),
  need:PARTS(),
  todo:[X("Lay out every part and tick it off the list above.","Weka kila kipuri mezani na ukiweke alama kwenye orodha hapo juu."),X("Check each motor has two wires and the battery cells are charged.","Hakikisha kila motor ina waya mbili na betri zimechajiwa."),X("Choose your board with the switch at the top: Arduino Uno or ESP32.","Chagua ubao wako kwa kitufe cha juu: Arduino Uno au ESP32.")],
  note:X("Cheap parts vary. If a measurement here does not match yours, trust the markings on your own part.","Vipuri vya bei nafuu hutofautiana. Kama kipimo hapa hakilingani na chako, amini alama zilizo kwenye kipuri chako.")},
 {k:"motors",t:X("Fit the motors and wheels","Weka motor na magurudumu"),
  why:X("Each drive wheel has its own geared DC motor. The gearbox slows the motor down and multiplies its turning force, which is what lets a small motor push the whole car. Two motors turning at different speeds steer the car, with no steering wheel needed.","Kila gurudumu la kuendesha lina motor yake ya gia. Gia hupunguza kasi ya motor na kuongeza nguvu ya kuzungusha, ndiyo inayoiwezesha motor ndogo kusukuma gari lote. Motor mbili zinazozunguka kwa kasi tofauti huliongoza gari bila usukani."),
  need:[[2,X("TT gear motors","Motor za gia (TT)")],[2,X("Wheels","Magurudumu")],[1,X("Caster ball wheel","Gurudumu la mpira (caster)")],[1,X("Chassis base plate","Bamba la chasisi")],[4,X("M3 screws and nuts","Skrubu na nati za M3")]],
  todo:[X("Screw one motor to each side of the base plate with its bracket, shafts pointing outwards.","Funga motor moja kila upande wa bamba kwa bracket yake, shaft zikielekea nje."),X("Press a wheel firmly onto each shaft.","Bonyeza gurudumu kwenye kila shaft hadi lishike."),X("Fix the caster at the front so the car rests on three points.","Funga caster mbele ili gari lisimame kwa sehemu tatu."),X("Make sure each motor has two wires fixed to it (solder or screw).","Hakikisha kila motor ina waya mbili zilizounganishwa (solder au skrubu).")],
  note:X("A motor turns the other way if its two wires are swapped, so do not worry about direction yet: the wiring test in step 9 shows any side that runs backwards.","Motor huzunguka upande mwingine ukibadilisha waya zake mbili, kwa hiyo usijali mwelekeo bado: jaribio la nyaya la hatua ya 9 litaonyesha upande wowote unaokwenda nyuma.")},
 {k:"deck",t:X("Raise the electronics deck","Inua bamba la vifaa vya umeme"),
  why:X("A second plate on standoffs gives the electronics a flat floor above the wheels and keeps wires away from the spinning tyres.","Bamba la pili juu ya standoff huipa elektroniki sakafu tambarare juu ya magurudumu na huweka waya mbali na matairi yanayozunguka."),
  need:[[1,X("Second plate (top deck)","Bamba la pili (juu)")],[4,X("M3 x 25 mm standoffs","Standoff za M3 x 25 mm")],[8,X("M3 x 6 mm screws","Skrubu za M3 x 6 mm")]],
  todo:[X("Screw four standoffs to the base plate, one near each corner, clear of the wheels.","Funga standoff nne kwenye bamba la chini, moja karibu na kila kona, mbali na magurudumu."),X("Lay the motor wires up through a gap so they will reach the top deck.","Pitisha waya za motor kupitia pengo ili zifike bamba la juu."),X("Lower the top plate on and screw it down.","Weka bamba la juu na ulifunge kwa skrubu.")],
  note:X("Acrylic cracks if you over-tighten. Snug is enough.","Akriliki hupasuka ukibana kupita kiasi. Kubana kidogo kunatosha.")},
 {k:"driver",t:X("Fit the motor driver","Weka kiendeshi cha motor"),
  why:X("A microcontroller pin can safely give only about 20 mA. A small gear motor draws a few hundred mA while running and over 1 A when it is held still (stalled). So the pin never touches the motor. The L298N driver switches battery power to the motors, and can reverse it, while your pins send only tiny signals.","Pini ya microcontroller hutoa salama takriban mA 20 tu. Motor ndogo ya gia huvuta mA mia kadhaa inapozunguka na zaidi ya A 1 inaposhikiliwa isizunguke. Kwa hiyo pini haigusi motor kamwe. Kiendeshi cha L298N hupitisha nguvu ya betri kwa motor, na kinaweza kuigeuza, huku pini zako zikituma ishara ndogo tu."),
  need:[[1,X("L298N motor driver module","Moduli ya kiendeshi cha motor L298N")],[1,X("Double-sided foam tape","Utepe wa pande mbili")]],
  todo:[X("Stick the driver to the top deck with foam tape, screw terminals facing the car's sides.","Bandika kiendeshi kwenye bamba la juu kwa utepe, terminali za skrubu zikielekea pande za gari."),X("Left motor wires into OUT1 and OUT2. Right motor wires into OUT3 and OUT4.","Waya za motor ya kushoto kwenye OUT1 na OUT2. Za kulia kwenye OUT3 na OUT4."),X("Pull off the small jumper caps on ENA and ENB. Your controller will set the speed through those pins.","Ondoa vifuniko vidogo (jumper) kwenye ENA na ENB. Kidhibiti chako kitaweka kasi kupitia pini hizo.")],
  note:X("The L298N loses about 2 V inside itself, so a 7.4 V battery leaves about 5.4 V at the motors. It handles 2 A per channel and gets warm. Never hold the wheels still with the motors on.","L298N hupoteza takriban V 2 ndani yake, kwa hiyo betri ya V 7.4 huacha takriban V 5.4 kwenye motor. Inastahimili A 2 kwa kila chaneli na huwa na joto. Usishikilie magurudumu yasizunguke motor zikiwa zimewashwa.")},
 {k:"controller",t:X("Mount the controller","Weka kidhibiti"),
  why:ESP()?X("The ESP32 is the brain: it reads the sensor and tells the driver how to move. It runs on 3.3 V logic, not 5 V, and has Wi-Fi and Bluetooth built in. That 3.3 V matters again at the sensor in step 6.","ESP32 ndiyo ubongo: husoma kihisi na kuiambia kiendeshi namna ya kusogea. Hutumia mantiki ya V 3.3, si V 5, na ina Wi-Fi na Bluetooth ndani yake. V 3.3 hiyo itajitokeza tena kwenye kihisi katika hatua ya 6."):X("The Arduino Uno is the brain: it reads the sensor and tells the driver how to move. It uses 5 V logic, the same voltage as the sensor and the driver's inputs, so they connect directly.","Arduino Uno ndiyo ubongo: husoma kihisi na kuiambia kiendeshi namna ya kusogea. Hutumia mantiki ya V 5, voltage ile ile ya kihisi na ingizo za kiendeshi, kwa hiyo huunganishwa moja kwa moja."),
  need:[[1,B],[4,X("M3 x 10 mm standoffs or foam pads","Standoff za M3 x 10 mm au pedi za povu")],[1,X("USB cable (to upload code)","Kebo ya USB (kupakia msimbo)")]],
  todo:[X("Fix the board to the top deck, behind the driver, with the USB socket facing the back so the cable is easy to reach.","Funga ubao kwenye bamba la juu, nyuma ya kiendeshi, soketi ya USB ikielekea nyuma ili kebo ifikike kwa urahisi."),X("Leave a hand's width free at the front for the sensor head.","Acha nafasi ya upana wa mkono mbele kwa kichwa cha kihisi.")],
  note:ESP()?X("The ESP32's pins are not 5 V tolerant. Never connect a 5 V signal straight to a GPIO pin.","Pini za ESP32 hazistahimili V 5. Usiunganishe ishara ya V 5 moja kwa moja kwenye pini ya GPIO."):X("The Uno's USB port can power the board for testing, but the motors always need the battery.","Mlango wa USB wa Uno unaweza kuwasha ubao wakati wa kujaribu, lakini motor zinahitaji betri daima.")},
 {k:"sensor",t:X("Build the sensor head","Tengeneza kichwa cha kihisi"),
  why:X("The HC-SR04 sends a 40 kHz chirp and times the echo. Sound covers about 1 cm in 29 microseconds, and the echo travels there and back, so distance in cm = echo time in microseconds / 58. Mounted on a servo, the head can look left and right before the car decides where to turn.","HC-SR04 hutuma mlio wa 40 kHz na kupima muda wa mwangwi. Sauti husafiri takriban sm 1 kwa mikrosekunde 29, na mwangwi huenda na kurudi, kwa hiyo umbali kwa sm = muda wa mwangwi (mikrosekunde) / 58. Ikiwa juu ya servo, kichwa kinaweza kutazama kushoto na kulia kabla gari halijaamua pa kugeukia."),
  need:[[1,"HC-SR04"],[1,X("SG90 micro servo with horn","Servo ndogo SG90 na pembe")],[1,X("Sensor bracket","Bracket ya kihisi")],[1,X("LED and 220 ohm resistor","LED na kipingamizi cha ohm 220")],[1,X("Active buzzer","Buzzer hai")]],
  todo:[X("Screw the servo to the front of the top deck.","Funga servo mbele ya bamba la juu."),X("Set the servo to its centre (90 degrees) before fitting the horn, then push the bracket and sensor onto the horn so it faces straight ahead.","Weka servo katikati (digrii 90) kabla ya kuweka pembe, kisha bonyeza bracket na kihisi kwenye pembe ili kitazame mbele moja kwa moja."),X("Stick the LED and the buzzer near the front where you can see and hear them.","Bandika LED na buzzer karibu na mbele ili uone na usikie.")],
  note:ESP()?X("The HC-SR04 Echo pin outputs 5 V, too high for the ESP32. Put a 1 kohm and a 2 kohm resistor in series from Echo to ground, and take the ESP32 wire from the joint between them. That divider turns 5 V into about 3.3 V.","Pini ya Echo ya HC-SR04 hutoa V 5, nyingi mno kwa ESP32. Weka kipingamizi cha kohm 1 na kohm 2 mfululizo kutoka Echo hadi ground, na uchukue waya wa ESP32 kutoka kwenye kiungo chao. Mgawanyiko huo hugeuza V 5 kuwa takriban V 3.3."):X("The beam is narrow, about 15 degrees each side. Soft cloth soaks up the chirp and slanted walls bounce it away, so the car can miss them. If nothing echoes back, the sensor reports no echo, not zero distance.","Mwale ni mwembamba, takriban digrii 15 kila upande. Kitambaa laini hufyonza mlio na kuta zilizoinama huuangusha pembeni, kwa hiyo gari linaweza kuzikosa. Kama hakuna mwangwi, kihisi huripoti kuwa hakuna mwangwi, si umbali sifuri.")},
 {k:"power",t:X("Connect the power","Unganisha umeme"),
  why:X("The motors are the biggest power problem. When they start they pull a surge of current and the battery voltage dips. If the dip goes too low, the controller restarts in the middle of driving. A fresh 2-cell 18650 pack (7.4 V) has more spare voltage than 4 AA cells, and the L298N's 5 V regulator needs at least about 7 V coming in.","Motor ndizo changamoto kubwa ya umeme. Zinapoanza kuzunguka hutoa mshtuko wa mkondo na voltage ya betri hushuka. Ikishuka sana, kidhibiti huanza upya katikati ya kuendesha. Betri mpya za 18650 mbili (V 7.4) zina voltage ya ziada kuliko AA nne, na kidhibiti cha V 5 cha L298N kinahitaji angalau takriban V 7 zinazoingia."),
  need:[[1,X("2 x 18650 battery holder with switch","Kishikio cha betri 2 x 18650 chenye swichi")],[2,X("18650 cells (charged)","Betri za 18650 (zimechajiwa)")],[1,X("470 to 1000 uF capacitor, 16 V","Kapasita ya uF 470 hadi 1000, V 16")],[1,X("Jumper wires","Waya za jumper")]],
  todo:[X("With the switch OFF, fit the battery holder to the top deck near the back.","Swichi ikiwa IMEZIMWA, weka kishikio cha betri kwenye bamba la juu karibu na nyuma."),X("Battery red wire to the L298N 12V screw terminal, black to its GND terminal.","Waya nyekundu ya betri kwenye terminali ya 12V ya L298N, nyeusi kwenye GND."),ESP()?X("L298N 5V terminal to the ESP32 VIN pin.","Terminali ya 5V ya L298N kwenye pini ya VIN ya ESP32."):X("L298N 5V terminal to the Uno 5V pin.","Terminali ya 5V ya L298N kwenye pini ya 5V ya Uno."),X("L298N GND to a controller GND pin. All grounds must be joined.","GND ya L298N kwenye pini ya GND ya kidhibiti. Ground zote lazima ziunganishwe."),X("Put the capacitor across the battery wires: long leg to red, stripe side to black.","Weka kapasita kwenye waya za betri: mguu mrefu kwa nyekundu, upande wenye mstari kwa nyeusi.")],
  note:X("Check polarity twice before the first switch-on: reversed power can destroy the driver and the controller. Keep the L298N's 5 V enable jumper on.","Hakiki polarity mara mbili kabla ya kuwasha mara ya kwanza: umeme uliogeuzwa unaweza kuharibu kiendeshi na kidhibiti. Acha jumper ya kuwezesha V 5 ya L298N ikiwa imewekwa.")},
 {k:"wiring",t:X("Wire the signals","Unganisha ishara"),
  why:X("Every signal wire goes to one pin, and the pins are chosen for a reason. The two speed wires (ENA, ENB) use PWM-capable pins: PWM switches power on and off very fast, so a value of 150 out of 255 gives about 59% of the battery voltage on average. The other four driver pins only decide direction.","Kila waya ya ishara huenda kwenye pini moja, na pini huchaguliwa kwa sababu. Waya mbili za kasi (ENA, ENB) hutumia pini zinazoweza PWM: PWM huwasha na kuzima umeme kwa kasi sana, kwa hiyo thamani 150 kati ya 255 hutoa takriban 59% ya voltage ya betri kwa wastani. Pini nne nyingine za kiendeshi huamua mwelekeo tu."),
  pins:true,
  need:[[1,X("Jumper wires, 12 or more","Waya za jumper, 12 au zaidi")]],
  todo:[X("Switch the battery OFF.","Zima swichi ya betri."),X("Work down the pin map, one wire at a time: push one end on, then the other.","Fuata ramani ya pini, waya moja baada ya nyingine: ingiza upande mmoja kisha mwingine."),X("Wire the sensor last, because its wires arch over everything else.","Unganisha kihisi mwisho, kwa sababu waya zake hupita juu ya vingine vyote."),X("Check every wire against the table before you power on.","Hakiki kila waya kwa kulinganisha na jedwali kabla ya kuwasha.")],
  note:ESP()?X("GPIO14 pulses briefly when the ESP32 starts, so keep the wheels off the ground for the first upload. The sensor Echo wire goes through the voltage divider from step 6.","GPIO14 hutoa mpigo mfupi ESP32 inapoanza, kwa hiyo inua magurudumu juu wakati wa kupakia mara ya kwanza. Waya ya Echo ya kihisi hupita kwenye mgawanyiko wa voltage wa hatua ya 6."):X("The servo library takes over timer 1, which switches off PWM on pins 9 and 10. That is why speed uses pins 5 and 6, and 9 and 10 only carry on/off direction signals.","Maktaba ya servo hutumia timer 1, ambayo huzima PWM kwenye pini 9 na 10. Ndiyo sababu kasi hutumia pini 5 na 6, na pini 9 na 10 hubeba ishara za mwelekeo tu.")},
 {k:"code",t:X("Upload the code","Pakia msimbo"),
  why:X("Two sketches. The wiring test goes through every part in turn so you can see that each one works and that both sides turn the right way. The obstacle avoider is the car's real program: drive until something is closer than 22 cm, stop and beep, look right and left, turn towards the side with more room, and back up if stuck.","Michoro miwili ya msimbo. Jaribio la nyaya hupitia kila kipuri kimoja kimoja ili uone kama kila kimoja kinafanya kazi na pande zote mbili zinageuka sawa. Kiepusha vikwazo ni programu halisi ya gari: endesha hadi kitu kiwe karibu zaidi ya sm 22, simama na ulie, tazama kulia na kushoto, geuka upande wenye nafasi zaidi, na rudi nyuma ukikwama."),
  code:true,
  need:[],
  todo:ESP()?[X("In the Arduino IDE, install the ESP32 boards package, then the ESP32Servo library. Choose Tools, Board, ESP32 Dev Module and the right port. Use board package version 3.0 or newer, which adds analogWrite.","Kwenye Arduino IDE, sakinisha kifurushi cha bodi za ESP32, kisha maktaba ya ESP32Servo. Chagua Tools, Board, ESP32 Dev Module na port sahihi. Tumia toleo la 3.0 au jipya zaidi, lenye analogWrite."),X("Prop the car up so both wheels are off the table. Upload the wiring test, switch the battery on and open the Serial Monitor at 115200 baud.","Inua gari ili magurudumu yote mawili yasiguse meza. Pakia jaribio la nyaya, washa betri na ufungue Serial Monitor kwa 115200 baud."),X("Fix anything that did not match (see the list below), then upload the obstacle avoider.","Rekebisha chochote kisichofanana (tazama orodha hapo chini), kisha pakia kiepusha vikwazo."),X("Put the car on the floor and switch on. It waits two seconds, then sets off. Adjust TURN_MS until each turn is about a quarter turn on your floor.","Weka gari sakafuni na uwashe. Hukaa sekunde mbili kisha huondoka. Rekebisha TURN_MS hadi kila kugeuka kuwe robo zamu kwenye sakafu yako.")]:[X("In the Arduino IDE choose Tools, Board, Arduino Uno and the right port. Both sketches use the Servo library that comes with the IDE.","Kwenye Arduino IDE chagua Tools, Board, Arduino Uno na port sahihi. Michoro yote miwili hutumia maktaba ya Servo inayokuja na IDE."),X("Prop the car up so both wheels are off the table. Upload the wiring test, switch the battery on and open the Serial Monitor at 115200 baud.","Inua gari ili magurudumu yote mawili yasiguse meza. Pakia jaribio la nyaya, washa betri na ufungue Serial Monitor kwa 115200 baud."),X("Fix anything that did not match (see the list below), then upload the obstacle avoider.","Rekebisha chochote kisichofanana (tazama orodha hapo chini), kisha pakia kiepusha vikwazo."),X("Unplug USB, put the car on the floor and switch on. It waits two seconds, then sets off. Adjust TURN_MS until each turn is about a quarter turn on your floor.","Ondoa USB, weka gari sakafuni na uwashe. Hukaa sekunde mbili kisha huondoka. Rekebisha TURN_MS hadi kila kugeuka kuwe robo zamu kwenye sakafu yako.")],
  note:X("When nothing reflects the chirp, the sensor holds Echo high for about 38 ms, longer than our 30 ms timeout, so the reading is 0. The program treats 0 as clear road, not as touching. A reading that stops changing while the wheels push tells the car it is stuck. If it is blocked again straight after a turn, it turns the same way again, so in a corner it cannot flip left, right, left for ever.","Kama hakuna kinachorudisha mlio, kihisi hushikilia Echo juu kwa takriban ms 38, zaidi ya muda wetu wa ms 30, kwa hiyo usomaji ni 0. Programu huchukulia 0 kama njia wazi, si kugusa. Usomaji usiobadilika magurudumu yakisukuma huliambia gari limekwama. Likizuiwa tena mara baada ya kugeuka, hugeuka upande ule ule tena, kwa hiyo kwenye kona haliwezi kuyumba kushoto, kulia, kushoto milele.")},
 {k:"drive",t:X("Drive it","Liendeshe"),
  why:X("The simulated car carries the same parts and obeys the same limits as yours: the battery sags when the motors start, the driver wastes 2 V, the tyres scrub when it turns on the spot, and the sonar sees only what is in its narrow beam. Drive by hand, then switch to Auto to watch it avoid obstacles. Then break things on purpose in the Failure lab.","Gari la kuigiza lina vipuri vile vile na hufuata mipaka ile ile kama lako: betri hushuka voltage motor zinapoanza, kiendeshi hupoteza V 2, matairi hukwaruza gari linapogeuka papo hapo, na sonar huona tu kilicho kwenye mwale wake mwembamba. Endesha kwa mkono, kisha ubadilishe kuwa Auto uone linavyoepuka vikwazo. Kisha vunja vitu kwa makusudi kwenye Maabara ya Hitilafu."),
  sim:true,need:[],todo:[X("Hold the arrows to drive. Try slow speeds: the car will not turn on the spot below a certain power.","Shikilia mishale kuendesha. Jaribu kasi ndogo: gari halitageuka papo hapo chini ya nguvu fulani."),X("Press Auto and watch the serial monitor explain each decision.","Bonyeza Auto na utazame serial monitor ikieleza kila uamuzi."),X("Turn on Tired batteries and drive. Read the serial monitor, then fix it with the advice in step 7.","Washa Betri zilizochoka na uendeshe. Soma serial monitor, kisha urekebishe kwa ushauri wa hatua ya 7.")],
  note:X("The test drive follows the same logic as the sketch, but turns until it has rotated 90 degrees. On a real car you tune TURN_MS to get the same result.","Jaribio hufuata mantiki ile ile ya mchoro, lakini hugeuka hadi limezunguka digrii 90. Kwenye gari halisi unarekebisha TURN_MS kupata matokeo yale yale.")}
 ];
}
function PARTS(){
 return [[1,X("Chassis kit: base plate, 2 wheels, caster","Seti ya chasisi: bamba, magurudumu 2, caster")],[2,X("TT gear motors","Motor za gia (TT)")],[1,"L298N"],[1,ESP()?"ESP32 DevKit":"Arduino Uno"],[1,"HC-SR04"],[1,"SG90 "+X("servo","servo")],[1,X("Battery holder, 2 x 18650, with switch","Kishikio cha betri, 2 x 18650, chenye swichi")],[2,X("18650 cells","Betri 18650")],[1,X("LED and 220 ohm resistor","LED na kipingamizi cha ohm 220")],[1,X("Active buzzer","Buzzer hai")],[1,X("Capacitor 470 to 1000 uF","Kapasita 470 hadi 1000 uF")],[1,X("Jumper wires (20)","Waya za jumper (20)")],[1,X("Standoffs and M3 screws","Standoff na skrubu za M3")],[1,X("Foam tape","Utepe wa povu")]]
  .concat(ESP()?[[1,X("Resistors 1 kohm and 2 kohm","Vipingamizi kohm 1 na kohm 2")]]:[]);
}
function pinRows(){
 var p=PIN[board],n=ESP()?"GPIO":"";
 return [
  [X("Driver ENA (left speed)","Kiendeshi ENA (kasi ya kushoto)"),p.ENA],[X("Driver IN1 (left direction)","Kiendeshi IN1 (mwelekeo wa kushoto)"),p.IN1],[X("Driver IN2 (left direction)","Kiendeshi IN2 (mwelekeo wa kushoto)"),p.IN2],
  [X("Driver ENB (right speed)","Kiendeshi ENB (kasi ya kulia)"),p.ENB],[X("Driver IN3 (right direction)","Kiendeshi IN3 (mwelekeo wa kulia)"),p.IN3],[X("Driver IN4 (right direction)","Kiendeshi IN4 (mwelekeo wa kulia)"),p.IN4],
  [X("Sensor Trig","Kihisi Trig"),p.TRIG],[X("Sensor Echo","Kihisi Echo")+(ESP()?X(" (through the divider)"," (kupitia mgawanyiko)"):""),p.ECHO],[X("Servo signal (orange wire)","Servo ishara (waya ya machungwa)"),p.SERVO],[X("LED (through 220 ohm)","LED (kupitia ohm 220)"),p.LED],[X("Buzzer +","Buzzer +"),p.BUZ],
  [X("Sensor VCC and servo red","Kihisi VCC na servo nyekundu"),ESP()?"VIN / 5V":"5V"],[X("All grounds (sensor, servo, LED, buzzer, driver)","Ground zote (kihisi, servo, LED, buzzer, kiendeshi)"),"GND"]
 ];
}

// ---------------- sketches (written for this app) ----------------
function sketch(kind){
 var p=PIN[board],e=ESP(),L=[];
 var servoInc=e?"#include <ESP32Servo.h>":"#include <Servo.h>";
 L.push("// Rover "+(kind==="test"?"wiring test":"obstacle avoider")+" for "+(e?"ESP32 DevKit":"Arduino Uno")+" + L298N + HC-SR04 + SG90.");
 L.push(kind==="test"?"// Lift the wheels off the table, switch the battery on, open Serial Monitor at 115200.":"// Put the car on the floor. It waits 2 seconds, then drives.");
 L.push(servoInc,"");
 L.push("const byte ENA="+num("ENA")+", IN1="+num("IN1")+", IN2="+num("IN2")+";   // left motor: speed, direction");
 L.push("const byte ENB="+num("ENB")+", IN3="+num("IN3")+", IN4="+num("IN4")+";   // right motor");
 L.push("const byte TRIG="+num("TRIG")+", ECHO="+num("ECHO")+", SERVO_PIN="+num("SERVO")+", LED_PIN="+num("LED")+", BUZZER="+(e?num("BUZ"):"A0")+";");
 L.push("","Servo head;","");
 L.push("// one side of the car: v from -255 (full back) to 255 (full forward)");
 L.push("void side(byte en, byte a, byte b, int v) {","  digitalWrite(a, v > 0);","  digitalWrite(b, v < 0);","  analogWrite(en, abs(v));","}");
 L.push("void drive(int l, int r) { side(ENA, IN1, IN2, l); side(ENB, IN3, IN4, r); }","");
 L.push("// distance in cm. 0 means no echo came back (nothing within about 4 m)");
 L.push("float distanceCm() {","  digitalWrite(TRIG, LOW);  delayMicroseconds(2);","  digitalWrite(TRIG, HIGH); delayMicroseconds(10);   // 10 us trigger pulse","  digitalWrite(TRIG, LOW);","  unsigned long us = pulseIn(ECHO, HIGH, 30000UL);   // give up after 30 ms","  return us / 58.0;                                  // 58 us per cm, there and back","}","");
 L.push("void beep(int ms) { digitalWrite(BUZZER, HIGH); digitalWrite(LED_PIN, HIGH); delay(ms); digitalWrite(BUZZER, LOW); digitalWrite(LED_PIN, LOW); }","");
 if(kind==="test"){
  L.push("void test(const char *what, int l, int r) {","  Serial.println(what);","  drive(l, r); delay(1000);","  drive(0, 0); delay(700);","}","");
  L.push("void setup() {");
  L.push("  byte outs[] = {ENA, IN1, IN2, ENB, IN3, IN4, TRIG, LED_PIN, BUZZER};","  for (byte i = 0; i < 9; i++) pinMode(outs[i], OUTPUT);","  pinMode(ECHO, INPUT);","  Serial.begin(115200);");
  L.push('  Serial.println("1 LED on, one beep");',"  beep(300); delay(500);");
  L.push('  Serial.println("2 Head: right, left, centre");',"  head.attach(SERVO_PIN);","  head.write(20);  delay(700);   // 20 = right","  head.write(160); delay(900);   // 160 = left","  head.write(90);  delay(700);");
  L.push('  test("3 Left wheel forwards", 150, 0);','  test("4 Left wheel backwards", -150, 0);','  test("5 Right wheel forwards", 0, 150);','  test("6 Right wheel backwards", 0, -150);','  Serial.println("7 Distance, twice a second:");',"}","");
  L.push("void loop() {","  Serial.print(distanceCm(), 1);","  Serial.println(\" cm\");","  delay(500);","}");
 }else{
  L.push("const int STOP_CM = 22, CRUISE = 160, TURN_PWM = 200, BACK_PWM = 150;","const int TURN_MS = 420;        // tune: one quarter turn on your floor","int lastDir = 0;               // -1 right, +1 left","unsigned long lastTurn = 0;","float lastD = 0; unsigned long lastCheck = 0;","");
  L.push("float look(int angle) { head.write(angle); delay(500); float d = distanceCm(); return d == 0 ? 400 : d; }","");
  L.push("void setup() {");
  L.push("  byte outs[] = {ENA, IN1, IN2, ENB, IN3, IN4, TRIG, LED_PIN, BUZZER};","  for (byte i = 0; i < 9; i++) pinMode(outs[i], OUTPUT);","  pinMode(ECHO, INPUT);","  Serial.begin(115200);","  head.attach(SERVO_PIN); head.write(90);","  delay(2000);                  // time to put the car down","}","");
  L.push("void loop() {");
  L.push("  float d = distanceCm(); if (d == 0) d = 400;       // no echo = clear road","  if (d > STOP_CM) {","    drive(CRUISE, CRUISE);","    if (millis() - lastCheck > 1200) {             // stuck? the reading stopped changing","      if (abs(d - lastD) < 1.5) { drive(-BACK_PWM, -BACK_PWM); delay(600); drive(0, 0); }","      lastD = d; lastCheck = millis();","    }","    return;","  }");
  L.push("  drive(0, 0); beep(400);","  float right = look(20), left = look(160); head.write(90); delay(400);","  int dir = (right > left) ? -1 : 1;","  if (millis() - lastTurn < 2500 && lastDir != 0) dir = lastDir;   // blocked again after a turn: same way","  lastDir = dir; lastTurn = millis();","  Serial.print(\"right \"); Serial.print(right); Serial.print(\" left \"); Serial.println(left);","  drive(-dir * TURN_PWM, dir * TURN_PWM); delay(TURN_MS);","  drive(0, 0); lastD = 0; lastCheck = millis();","}");
 }
 return L.join("\n");
}
function fixes(){
 return [
 [X("Nothing lights when I switch on","Hakuna kinachowaka ninapowasha"),X("Switch off. Check the cells are charged and the right way round, that red goes to 12V and black to GND, and that the switch is in the red wire.","Zima. Hakiki betri zimechajiwa na zimeingizwa sawasawa, kwamba nyekundu iko 12V na nyeusi GND, na swichi iko kwenye waya nyekundu.")],
 [X("A side turns backwards in the test","Upande mmoja unakwenda nyuma kwenye jaribio"),X("Swap that side's two motor wires in the OUT terminals.","Badilishana waya mbili za motor ya upande huo kwenye terminali za OUT.")],
 [X("The wrong side moves in test 3","Upande usio sahihi unasogea kwenye jaribio la 3"),X("The left and right driver wires are crossed. Left motor uses ENA, IN1, IN2 and right motor uses ENB, IN3, IN4.","Waya za kushoto na kulia za kiendeshi zimechanganywa. Motor ya kushoto hutumia ENA, IN1, IN2 na ya kulia ENB, IN3, IN4.")],
 [X("The head looks left first","Kichwa kinatazama kushoto kwanza"),X("Some servos turn the other way. Swap 20 and 160 in the sketches.","Baadhi ya servo huzunguka upande mwingine. Badilisha 20 na 160 kwenye michoro.")],
 [X("Distance is always 0.0","Umbali ni 0.0 kila mara"),X("No echo is coming back. Check Trig and Echo are on the right pins and the sensor has 5 V and GND."+(ESP()?" On the ESP32 check the divider.":""),"Hakuna mwangwi unaorudi. Hakiki Trig na Echo ziko pini sahihi na kihisi kina V 5 na GND."+(ESP()?" Kwenye ESP32 hakiki mgawanyiko.":""))],
 [X("The controller restarts when the motors start","Kidhibiti kinaanza upya motor zinapoanza"),X("The battery voltage dips. Recharge the cells, check the capacitor is across the battery wires, and keep the wheels free to turn.","Voltage ya betri inashuka. Chaji betri, hakiki kapasita iko kwenye waya za betri, na acha magurudumu yazunguke kwa uhuru.")],
 [X("The car hums but will not turn on the spot","Gari linavuma lakini halizunguki papo hapo"),X("Turning scrubs both tyres sideways and needs more push than driving straight. Raise TURN_PWM and recharge the cells.","Kugeuka kunakwaruza matairi na kunahitaji nguvu zaidi kuliko kwenda moja kwa moja. Ongeza TURN_PWM na uchaji betri.")],
 [X("It drifts to one side","Inaelekea upande mmoja"),X("No two motors are exactly alike. Slow the faster side a little, for example drive(CRUISE - 10, CRUISE).","Hakuna motor mbili zinazofanana kabisa. Punguza kasi ya upande wa haraka kidogo, mfano drive(CRUISE - 10, CRUISE).")]
 ];
}

// ---------------- 3D model ----------------
var T={ok:false,parts:[],cur:0,fail:false};
function attach3d(){
 var box=$("rv3d");if(!box)return;
 if(T.fail){box.insertAdjacentHTML("afterbegin","<div class='sub' style='padding:30px;text-align:center;color:#334155'>"+X("3D is not available on this device. Follow the written steps.","3D haipatikani kwenye kifaa hiki. Fuata hatua zilizoandikwa.")+"</div>");return;}
 if(!T.sc){init3d(box);if(T.fail){attach3d();return;}}else{box.insertBefore(T.r.domElement,box.firstChild);resize3d();}
 T.cur=step;box.style.display=step===10?"none":"";
}
function cvTex(w,h,fn){var c=document.createElement("canvas");c.width=w;c.height=h;fn(c.getContext("2d"),w,h);var t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t;}
function rrect(w,d,r){var s=new THREE.Shape(),x=-w/2,y=-d/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.absarc(x+w-r,y+r,r,-Math.PI/2,0);s.lineTo(x+w,y+d-r);s.absarc(x+w-r,y+d-r,r,0,Math.PI/2);s.lineTo(x+r,y+d);s.absarc(x+r,y+d-r,r,Math.PI/2,Math.PI);s.lineTo(x,y+r);s.absarc(x+r,y+r,r,Math.PI,Math.PI*1.5);return s;}
function plateGeo(w,d,t,r){var g=new THREE.ExtrudeGeometry(rrect(w,d,r),{depth:t,bevelEnabled:false,curveSegments:6});g.rotateX(-Math.PI/2);g.translate(0,0,0);return g;}
function init3d(box){
 var r;try{r=new THREE.WebGLRenderer({antialias:true});}catch(e){T.fail=true;return;}
 T.r=r;var lowmem=(navigator.deviceMemory&&navigator.deviceMemory<=2);
 r.setPixelRatio(Math.min(window.devicePixelRatio||1,lowmem?1:2));
 r.outputEncoding=THREE.sRGBEncoding;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.05;
 if(!lowmem){r.shadowMap.enabled=true;r.shadowMap.type=THREE.PCFSoftShadowMap;}
 box.insertBefore(r.domElement,box.firstChild);
 var sc=T.sc=new THREE.Scene();sc.background=new THREE.Color(0xe9e4d6);
 var cam=T.cam=new THREE.PerspectiveCamera(38,1,0.5,300);
 // soft studio reflections for metals and acrylic
 try{var room=new THREE.Scene();room.add(new THREE.Mesh(new THREE.BoxGeometry(60,60,60),new THREE.MeshBasicMaterial({color:0xb9c3d0,side:THREE.BackSide})));
  [[0,28,0,30,30,1],[26,10,10,2,16,16],[-26,10,-8,2,16,16]].forEach(function(p){var m=new THREE.Mesh(new THREE.BoxGeometry(p[3],p[4],p[5]),new THREE.MeshBasicMaterial({color:0xffffff}));m.position.set(p[0],p[1],p[2]);room.add(m);});
  var pm=new THREE.PMREMGenerator(r);sc.environment=pm.fromScene(room,0.04).texture;}catch(e){}
 sc.add(new THREE.HemisphereLight(0xffffff,0xb7ad98,0.55));
 var dl=new THREE.DirectionalLight(0xffffff,0.95);dl.position.set(18,34,14);
 if(r.shadowMap.enabled){dl.castShadow=true;dl.shadow.mapSize.set(1024,1024);var sh=dl.shadow.camera;sh.left=-22;sh.right=22;sh.top=22;sh.bottom=-22;sh.near=5;sh.far=90;dl.shadow.bias=-0.0004;}
 sc.add(dl);
 // cutting mat
 var mat=cvTex(512,512,function(c,w,h){c.fillStyle="#2f7d55";c.fillRect(0,0,w,h);c.strokeStyle="rgba(255,255,255,.55)";c.lineWidth=2;for(var i=0;i<=16;i++){c.beginPath();c.moveTo(i*32,0);c.lineTo(i*32,h);c.moveTo(0,i*32);c.lineTo(w,i*32);c.stroke();}c.strokeStyle="rgba(255,255,255,.2)";c.lineWidth=1;for(var j=0;j<=64;j++){c.beginPath();c.moveTo(j*8,0);c.lineTo(j*8,h);c.moveTo(0,j*8);c.lineTo(w,j*8);c.stroke();}});
 mat.wrapS=mat.wrapT=THREE.RepeatWrapping;mat.repeat.set(2.6,1.9);
 var fl=new THREE.Mesh(new THREE.PlaneGeometry(52,38),new THREE.MeshStandardMaterial({map:mat,roughness:0.85,metalness:0}));fl.rotation.x=-Math.PI/2;fl.position.y=-0.02;fl.receiveShadow=true;sc.add(fl);
 var rimM=new THREE.Mesh(new THREE.BoxGeometry(52.6,0.5,38.6),new THREE.MeshStandardMaterial({color:0x1f5a3d,roughness:0.9}));rimM.position.y=-0.28;sc.add(rimM);

 function MS(c,rough,metal,extra){var o={color:c,roughness:rough==null?0.6:rough,metalness:metal||0};if(extra)for(var k in extra)o[k]=extra[k];return new THREE.MeshStandardMaterial(o);}
 function acrylic(c){return new THREE.MeshPhysicalMaterial({color:c||0xdff1ff,roughness:0.08,metalness:0,transparent:true,opacity:0.38,clearcoat:1,clearcoatRoughness:0.05,depthWrite:false,side:THREE.DoubleSide});}
 // a part = a group of meshes that appears at a build step
 function part(name,step,x,y,z){var g=new THREE.Group();g.position.set(x||0,y||0,z||0);sc.add(g);var p={g:g,step:step,name:name,meshes:[]};T.parts.push(p);return p;}
 function mesh(p,geo,mat_,x,y,z,rx,ry,rz,shadow){var m=new THREE.Mesh(geo,mat_);m.position.set(x||0,y||0,z||0);if(rx)m.rotation.x=rx;if(ry)m.rotation.y=ry;if(rz)m.rotation.z=rz;if(shadow!==false&&r.shadowMap.enabled){m.castShadow=true;m.receiveShadow=true;}
   m.userData.e0=mat_.emissive?mat_.emissive.getHex():0;m.userData.o0=mat_.opacity;p.g.add(m);p.meshes.push(m);return m;}
 var Bx=function(w,h,d){return new THREE.BoxGeometry(w,h,d);},Cy=function(a,b,h,n){return new THREE.CylinderGeometry(a,b,h,n||24);};
 var BRASS=0xc9a24b,STEEL=0xb8c0c9;
 function screw(p,x,y,z){mesh(p,Cy(0.28,0.28,0.18,12),MS(STEEL,0.35,0.9),x,y,z,0,0,0,false);}

 // ---- step 2: base plate, motors, wheels, caster
 var base=part("base",2);var PY=3.0;
 mesh(base,plateGeo(21,11.6,0.35,1.2),acrylic(0xd9ecff),0,PY,0,0,0,0,false).renderOrder=2;
 [[-9,-4.6],[-9,4.6],[7,-4.6],[7,4.6],[-1,-4.6],[-1,4.6]].forEach(function(s){screw(base,s[0],PY+0.4,s[1]);});
 [-1,1].forEach(function(s){
  var m=part("motor"+s,2);
  mesh(m,Bx(6.6,2.3,2.0),MS(0xf4c20d,0.55),-0.5,PY-1.7,s*5.9);                       // yellow gearbox
  mesh(m,Cy(1.05,1.05,3.1,20),MS(STEEL,0.35,0.85),-0.5,PY-1.7,s*3.7,Math.PI/2);       // motor can
  mesh(m,Cy(0.2,0.2,1.8,10),MS(0xdddddd,0.3,0.9),-0.5,PY-1.7,s*3.0,Math.PI/2);         // end cap
  mesh(m,Bx(3.2,0.18,0.9),MS(0xa8a8a8,0.4,0.8),-0.5,PY-0.6,s*5.2);                       // mounting bracket
  mesh(m,Cy(0.35,0.35,6.6,12),MS(STEEL,0.3,0.9),-0.5,PY-1.7,s*6.2,Math.PI/2);          // axle
  mesh(m,Bx(0.12,0.12,1.2),MS(0xd33,0.5),1.7,PY-2.2,s*3.9);mesh(m,Bx(0.12,0.12,1.2),MS(0x111,0.5),1.9,PY-2.2,s*3.9);  // leads
  var w=part("wheel"+s,2,-0.5,PY-1.7,s*8.0);
  mesh(w,Cy(3.25,3.25,2.5,32),MS(0x16181d,0.9),0,0,0,Math.PI/2);
  var inst=new THREE.InstancedMesh(Bx(0.55,0.5,2.55),MS(0x0e1014,0.95),26);var d=new THREE.Object3D();
  for(var i=0;i<26;i++){var a=i/26*Math.PI*2;d.position.set(Math.cos(a)*3.42,Math.sin(a)*3.42,0);d.rotation.set(0,0,a+Math.PI/2);d.updateMatrix();inst.setMatrixAt(i,d.matrix);}
  inst.castShadow=r.shadowMap.enabled;w.g.add(inst);w.meshes.push(inst);inst.userData.e0=0;
  mesh(w,Cy(2.25,2.25,2.6,28),MS(0xf4c20d,0.5),0,0,0,Math.PI/2);
  mesh(w,Cy(0.95,0.95,2.75,20),MS(0x333840,0.5),0,0,0,Math.PI/2);
  for(var k=0;k<6;k++){var b=k/6*Math.PI*2;mesh(w,Cy(0.42,0.42,2.72,12),MS(0x16181d,0.8),Math.cos(b)*1.5,Math.sin(b)*1.5,0,Math.PI/2,0,0,false);}
 });
 var cas=part("caster",2,-8.6,PY-0.2,0);
 mesh(cas,Cy(0.55,0.55,1.6,14),MS(0xcfd6dd,0.3,0.9),0,-0.9,0);mesh(cas,Cy(1.1,0.9,0.5,18),MS(0xcfd6dd,0.3,0.9),0,-1.9,0);
 mesh(cas,new THREE.SphereGeometry(0.95,20,16),MS(0xe8edf2,0.2,1),0,-2.1,0);

 // ---- step 3: standoffs and top deck
 var deck=part("deck",3);var DY=PY+3.7;
 [[-8,-4.2],[-8,4.2],[7,-4.2],[7,4.2]].forEach(function(s){mesh(deck,Cy(0.42,0.42,3.4,6),MS(BRASS,0.35,0.85),s[0],PY+2.0,s[1]);mesh(deck,Cy(0.3,0.3,0.2,10),MS(STEEL,0.3,0.9),s[0],DY+0.3,s[1],0,0,0,false);});
 mesh(deck,plateGeo(19,10.4,0.35,1.1),acrylic(0xe3f3ff),0,DY,0,0,0,0,false).renderOrder=2;
 var TY=DY+0.35;

 // ---- step 4: L298N driver
 var drv=part("driver",4,3.4,TY,0);
 mesh(drv,plateGeo(4.4,4.4,0.16,0.15),MS(0xc62828,0.55),0,0,0);
 mesh(drv,Bx(2.4,0.5,1.7),MS(0x14161a,0.5),0,0.33,0.0);
 for(var f=0;f<7;f++)mesh(drv,Bx(2.1,1.5,0.1),MS(0x1c1f25,0.45,0.6),0,1.15,-0.9+f*0.3,0,0,0,false);
 [-1,1].forEach(function(s){mesh(drv,Bx(0.9,0.9,1.9),MS(0x1565c0,0.5),s*0.7,0.55,s*2.3);});
 [-1,1].forEach(function(s){mesh(drv,Bx(1.5,0.8,0.9),MS(0x1565c0,0.5),s*1.7,0.5,-2.1*0);});
 mesh(drv,Bx(0.3,0.8,3.2),MS(0x15171b,0.6),-2.0,0.5,0);
 for(var n=0;n<6;n++)mesh(drv,Bx(0.12,0.5,0.12),MS(0xd4af37,0.3,0.9),-2.0,0.95,-1.3+n*0.52,0,0,0,false);
 mesh(drv,Bx(0.5,0.3,0.5),MS(0xf2c500,0.5),1.4,0.25,-1.8);
 var lab=new THREE.Mesh(new THREE.PlaneGeometry(2.0,0.7),new THREE.MeshBasicMaterial({map:cvTex(128,48,function(c,w,h){c.fillStyle="rgba(0,0,0,0)";c.clearRect(0,0,w,h);c.fillStyle="#fff";c.font="bold 22px sans-serif";c.textAlign="center";c.fillText("L298N",w/2,34);}),transparent:true}));lab.rotation.x=-Math.PI/2;lab.position.set(-0.2,0.12,1.7);drv.g.add(lab);drv.meshes.push(lab);lab.userData.e0=0;

 // ---- step 5: controller (Uno or ESP32)
 var uno=part("uno",5,-3.8,TY,0);var esp=part("esp",5,-3.8,TY,0);
 mesh(uno,plateGeo(6.9,5.3,0.16,0.3),MS(0x0f6fa8,0.45),0,0.0,0);
 var tex=cvTex(256,200,function(c,w,h){c.clearRect(0,0,w,h);c.fillStyle="#e8f4ff";c.font="bold 26px sans-serif";c.textAlign="center";c.fillText("ARDUINO",w/2,92);c.font="bold 22px sans-serif";c.fillText("UNO",w/2,124);});
 var sil=new THREE.Mesh(new THREE.PlaneGeometry(4.6,3.2),new THREE.MeshBasicMaterial({map:tex,transparent:true}));sil.rotation.x=-Math.PI/2;sil.position.set(0.3,0.1,0);uno.g.add(sil);uno.meshes.push(sil);sil.userData.e0=0;
 mesh(uno,Bx(1.9,1.1,1.5),MS(0xcfd6dd,0.3,0.9),-3.0,0.65,-1.2);                      // USB-B
 mesh(uno,Bx(1.5,1.2,1.3),MS(0x15171b,0.5),-3.0,0.7,1.5);                             // DC jack
 mesh(uno,Bx(3.6,0.5,0.9),MS(0x14161a,0.5),0.6,0.38,0.2);                               // ATmega
 mesh(uno,Bx(0.5,0.4,0.5),MS(0xc62828,0.5),-1.6,0.3,-1.8);                              // reset button
 mesh(uno,Bx(0.9,0.5,0.45),MS(STEEL,0.3,0.9),-1.4,0.35,1.1);
 mesh(uno,Bx(5.9,0.9,0.25),MS(0x16181d,0.55),0.9,0.55,-2.45);mesh(uno,Bx(5.9,0.9,0.25),MS(0x16181d,0.55),0.9,0.55,2.45);
 for(var q=0;q<2;q++)mesh(uno,Cy(0.3,0.3,0.7,10),MS(0x222,0.6),-0.4+q*0.9,0.5,0.9,0,0,0,false);
 mesh(esp,plateGeo(5.4,2.9,0.16,0.2),MS(0x14161a,0.5),0,0,0);
 mesh(esp,Bx(2.6,0.25,2.3),MS(0xb9c0c7,0.3,0.9),1.0,0.22,0);
 mesh(esp,Bx(1.1,0.9,1.4),MS(0xcfd6dd,0.3,0.9),-2.6,0.55,0);
 mesh(esp,Bx(4.8,0.9,0.2),MS(0x0b0c0f,0.55),0,0.55,-1.3);mesh(esp,Bx(4.8,0.9,0.2),MS(0x0b0c0f,0.55),0,0.55,1.3);
 mesh(esp,Bx(0.4,0.3,0.4),MS(0xc62828,0.5),-1.6,0.25,0.9);
 var el=new THREE.Mesh(new THREE.PlaneGeometry(2.4,0.8),new THREE.MeshBasicMaterial({map:cvTex(160,56,function(c,w,h){c.clearRect(0,0,w,h);c.fillStyle="#fff";c.font="bold 26px sans-serif";c.textAlign="center";c.fillText("ESP32",w/2,38);}),transparent:true}));el.rotation.x=-Math.PI/2;el.position.set(1.0,0.36,0);esp.g.add(el);esp.meshes.push(el);el.userData.e0=0;

 // ---- step 6: servo head, HC-SR04, LED, buzzer
 var hd=part("head",6,7.4,TY,0);
 mesh(hd,Bx(2.3,2.3,1.2),MS(0x1d4ed8,0.5),0,1.15,0);mesh(hd,Bx(0.6,0.15,3.4),MS(0x1d4ed8,0.5),0,1.8,0);
 var arm=new THREE.Group();arm.position.set(0.9,2.4,0);hd.g.add(arm);
 var hm=new THREE.Mesh(Cy(0.6,0.6,0.35,16),MS(0xf2f2f2,0.5));arm.add(hm);hd.meshes.push(hm);hm.userData.e0=0;
 var br=new THREE.Mesh(Bx(0.5,2.0,5.2),MS(0x16181d,0.55));br.position.set(0.9,3.4,0);hd.g.add(br);hd.meshes.push(br);br.userData.e0=0;br.castShadow=r.shadowMap.enabled;
 var hs=new THREE.Mesh(plateGeo(4.6,2.0,0.16,0.2),MS(0x1976d2,0.45));hs.rotation.z=Math.PI/2;hs.rotation.y=0;hs.position.set(1.5,3.0,0);hs.rotation.set(0,0,0);
 var hsg=new THREE.Group();hsg.position.set(1.5,3.5,0);hsg.rotation.z=Math.PI/2;hd.g.add(hsg);
 var board=new THREE.Mesh(Bx(4.6,0.16,2.0),MS(0x1976d2,0.45));board.rotation.set(0,0,0);board.position.set(0,0,0);hsg.add(board);hd.meshes.push(board);board.userData.e0=0;
 board.rotation.y=Math.PI/2;board.scale.set(1,1,1);
 [-1.15,1.15].forEach(function(z){var e=new THREE.Mesh(Cy(0.85,0.85,0.95,28),MS(0xc9d0d8,0.25,0.9));e.rotation.set(0,0,0);e.position.set(0,-0.55,z*1.0);e.rotation.z=0;hsg.add(e);hd.meshes.push(e);e.userData.e0=0;
   var gr=new THREE.Mesh(Cy(0.68,0.68,0.98,24),MS(0x1a1c20,0.7));gr.position.copy(e.position);hsg.add(gr);hd.meshes.push(gr);gr.userData.e0=0;});
 hsg.children.forEach(function(c){c.visible=true;});
 hsg.rotation.set(0,Math.PI/2*0,Math.PI/2);hsg.position.set(1.5,3.4,0);
 var led=part("led",6,3.4,TY,3.6);
 mesh(led,Cy(0.35,0.35,0.5,14),MS(0xd22,0.35,0,{emissive:0x330000}),0,0.45,0);mesh(led,new THREE.SphereGeometry(0.35,14,10,0,Math.PI*2,0,Math.PI/2),MS(0xff3b30,0.25,0,{emissive:0x440000}),0,0.7,0);
 mesh(led,Cy(0.04,0.04,0.7,6),MS(STEEL,0.3,1),-0.12,0.1,0);mesh(led,Cy(0.04,0.04,0.7,6),MS(STEEL,0.3,1),0.12,0.1,0);
 var bz=part("buzzer",6,3.4,TY,-3.6);
 mesh(bz,Cy(0.85,0.85,0.9,24),MS(0x17181c,0.5),0,0.45,0);mesh(bz,Cy(0.17,0.17,0.02,10),MS(0xdddddd,0.4),0,0.91,0);mesh(bz,Cy(0.45,0.45,0.02,14),MS(0xffffff,0.6),0,0.92,0.0);

 // ---- step 7: battery, capacitor, switch, power leads
 var bt=part("batt",7,-5.8,TY,3.0);
 mesh(bt,Bx(7.4,2.1,3.6),MS(0x15171b,0.55),0,1.05,0);
 [-0.95,0.95].forEach(function(z){mesh(bt,Cy(0.88,0.88,6.6,24),MS(0x2f9bd6,0.35,0.35),0,2.0,z,0,0,Math.PI/2);mesh(bt,Cy(0.4,0.4,0.2,14),MS(STEEL,0.3,0.95),3.4,2.0,z,0,0,Math.PI/2);});
 mesh(bt,Bx(1.0,0.5,0.7),MS(0xc62828,0.4),-3.9,0.9,1.5);
 var cp=part("cap",7,-5.8,TY,-1.0);
 mesh(cp,Cy(0.45,0.45,1.5,16),MS(0x1e3a8a,0.45),0,0.75,0);mesh(cp,Bx(0.1,1.4,0.35),MS(0xe5e7eb,0.5),0.46,0.75,0,0,0,0,false);
 function wire(name,step,pts,col,rad){var c=new THREE.CatmullRomCurve3(pts.map(function(p){return new THREE.Vector3(p[0],p[1],p[2]);}),false,"catmullrom",0.35);var p=part(name,step);var m=new THREE.Mesh(new THREE.TubeGeometry(c,28,rad||0.1,8,false),MS(col,0.45));if(r.shadowMap.enabled)m.castShadow=true;m.userData.e0=0;p.g.add(m);p.meshes.push(m);return p;}
 wire("pw+",7,[[-8.2,TY+1.2,4.5],[-7.5,TY+3.5,3.5],[0,TY+3.5,3.0],[3.5,TY+2.4,2.4],[3.9,TY+0.9,2.2]],0xd32f2f,0.16);
 wire("pw-",7,[[-8.2,TY+0.9,4.2],[-6,TY+3.0,4.4],[1,TY+3.1,3.9],[3.0,TY+2.0,2.8],[3.2,TY+0.9,2.3]],0x1a1a1a,0.16);
 wire("m1",4,[[-0.5-0.0,PY-0.3,3.7],[0,DY+0.5,3.5],[3.4,TY+0.8,2.3]],0xd32f2f,0.1);
 wire("m2",4,[[0,PY-0.3,-3.7],[0,DY+0.5,-3.5],[3.4,TY+0.8,-2.3]],0x1a1a1a,0.1);
 wire("5v",7,[[2.0,TY+0.9,-1.5],[-1.0,TY+3.2,-1.0],[-3.0,TY+0.9,-2.6]],0xfb8c00,0.09);

 // ---- step 8: signal wires
 var pairs=[[0xf9a825,[[1.4,TY+0.9,-0.6],[0,TY+3.8,-1.2],[-1.6,TY+0.9,-2.3]]],[0x43a047,[[1.4,TY+0.9,-0.1],[0,TY+4.2,-0.6],[-1.2,TY+0.9,-2.3]]],[0x1e88e5,[[1.4,TY+0.9,0.4],[0,TY+4.6,0.2],[-0.8,TY+0.9,-2.3]]],[0x8e24aa,[[1.4,TY+0.9,0.9],[0,TY+5.0,0.8],[-0.4,TY+0.9,-2.3]]],[0xe53935,[[1.4,TY+0.9,1.4],[-1,TY+5.2,1.4],[0.0,TY+0.9,-2.3]]],[0xfdd835,[[1.4,TY+0.9,1.9],[-1.5,TY+5.4,2.0],[0.4,TY+0.9,-2.3]]],
  [0x00acc1,[[-2.4,TY+0.9,2.5],[2,TY+6.0,1.5],[7.8,TY+3.2,0.6]]],[0xff7043,[[-2.0,TY+0.9,2.5],[3,TY+6.4,1.0],[7.8,TY+3.3,0.2]]],[0x7cb342,[[-1.6,TY+0.9,2.5],[4,TY+6.6,0.4],[7.8,TY+3.2,-0.2]]],[0xab47bc,[[-1.2,TY+0.9,2.5],[4,TY+6.8,-0.2],[7.8,TY+3.1,-0.6]]],
  [0xffffff,[[-0.8,TY+0.9,2.5],[3,TY+4.0,3.2],[3.4,TY+0.5,3.6]]],[0x1a1a1a,[[-0.4,TY+0.9,2.5],[1,TY+4.0,-3.0],[3.4,TY+0.5,-3.6]]]];
 pairs.forEach(function(w,i){wire("sw"+i,8,w[1],w[0],0.085);});
 T.yaw=0.9;T.pitch=0.42;T.dist=36;T.tx=0;T.ty=4;T.tz=0;T.drag=false;T.auto=true;
 var cv=r.domElement;cv.style.touchAction="none";cv.style.width="100%";cv.style.display="block";
 var pts={};
 cv.addEventListener("pointerdown",function(e){pts[e.pointerId]=[e.clientX,e.clientY];T.drag=true;T.manual=true;T.lx=e.clientX;T.ly=e.clientY;try{cv.setPointerCapture(e.pointerId);}catch(x){}});
 cv.addEventListener("pointermove",function(e){if(!pts[e.pointerId])return;var ids=Object.keys(pts);
   if(ids.length>=2){var o=pts[ids[0]==e.pointerId?ids[1]:ids[0]],d0=Math.hypot(pts[e.pointerId][0]-o[0],pts[e.pointerId][1]-o[1]),d1=Math.hypot(e.clientX-o[0],e.clientY-o[1]);T.dist=Math.max(14,Math.min(60,T.dist*(d0/Math.max(1,d1))));pts[e.pointerId]=[e.clientX,e.clientY];return;}
   T.yaw-=(e.clientX-T.lx)*0.01;T.pitch=Math.max(0.08,Math.min(1.45,T.pitch+(e.clientY-T.ly)*0.01));T.lx=e.clientX;T.ly=e.clientY;pts[e.pointerId]=[e.clientX,e.clientY];});
 function up(e){delete pts[e.pointerId];if(!Object.keys(pts).length)T.drag=false;}
 cv.addEventListener("pointerup",up);cv.addEventListener("pointercancel",up);
 cv.addEventListener("wheel",function(e){e.preventDefault();T.manual=true;T.dist=Math.max(14,Math.min(60,T.dist+e.deltaY*0.03));},{passive:false});
 T.ok=true;resize3d();tick3d();
}
var FOCUS={1:[0,4,0,42],2:[-0.5,3,0,34],3:[0,5,0,36],4:[3.4,6,0,30],5:[-3.8,6,0,30],6:[7.4,7,0,30],7:[-5.8,7,2,30],8:[1,7,0,32],9:[0,6,0,38],10:[0,5,0,38]};
function resize3d(){if(!T.ok)return;var box=$("rv3d"),w=box.clientWidth||320,h=Math.round(w*0.78);T.r.setSize(w,h);T.cam.aspect=w/h;T.cam.updateProjectionMatrix();}
function tick3d(){
 if(!T.ok)return;
 var v=$("rover")&&$("rover").classList.contains("on");
 if(v&&!document.hidden&&T.cur!==10){
  var f=FOCUS[T.cur]||FOCUS[1];
  if(!T.manual){T.tx+=(f[0]-T.tx)*0.08;T.ty+=(f[1]-T.ty)*0.08;T.tz+=(f[2]-T.tz)*0.08;T.dist+=(f[3]-T.dist)*0.08;}
  if(!T.drag&&T.auto)T.yaw+=0.0035;
  T.cam.position.set(T.tx+Math.cos(T.yaw)*Math.cos(T.pitch)*T.dist,T.ty+Math.sin(T.pitch)*T.dist,T.tz+Math.sin(T.yaw)*Math.cos(T.pitch)*T.dist);
  T.cam.lookAt(T.tx,T.ty,T.tz);
  var pulse=0.5+0.5*Math.sin(Date.now()/280),s=T.cur,showEsp=ESP();
  T.parts.forEach(function(p){
   var vis=p.step<=s;
   if(p.name==="uno")vis=vis&&!showEsp;if(p.name==="esp")vis=vis&&showEsp;
   p.g.visible=s===1?(p.name==="uno"?!showEsp:p.name==="esp"?showEsp:true):vis;
   var hi=(p.step===s&&s>1&&s<10);
   p.meshes.forEach(function(m){var mt=m.material;if(!mt)return;
    if(s===1){mt.transparent=true;mt.opacity=Math.min(m.userData.o0||1,1)*0.5;}else{mt.opacity=m.userData.o0==null?1:m.userData.o0;mt.transparent=(m.userData.o0||1)<1;}
    if(mt.emissive){if(hi)mt.emissive.setRGB(0.0,0.05+0.07*pulse,0.14+0.12*pulse);else mt.emissive.setHex(m.userData.e0||0);}});
  });
  T.r.render(T.sc,T.cam);
 }
 requestAnimationFrame(tick3d);
}

// ---------------- the test drive (2D, top-down) ----------------
var SIM=null,SC={sz:0,k:0},keys={},hold={l:0,r:0},rafT=0,lastNow=0;
function simInit(){
 var tired=$("rvTired")&&$("rvTired").checked,weak=$("rvWeak")&&$("rvWeak").checked;
 var mode=SIM?SIM.mode:"manual";SIM=new RovSim.Sim({tired:tired,weak:weak});SIM.manualSpeed=(+($("rvSpd")||{value:70}).value)/100;SIM.setMode(mode==="auto"?"auto":"manual");
}
function manualCmd(){
 if(!SIM||SIM.mode!=="manual")return;
 var f=(keys.ArrowUp||keys.w||hold.f?1:0)-(keys.ArrowDown||keys.s||hold.b?1:0),t=(keys.ArrowRight||keys.d||hold.r?1:0)-(keys.ArrowLeft||keys.a||hold.l?1:0);
 var sp=SIM.manualSpeed;
 var l=f*sp+t*sp*(f?0.55:1),r=f*sp-t*sp*(f?0.55:1);
 if(!f&&t){l=t*sp;r=-t*sp;}
 SIM.cmdL=Math.max(-1,Math.min(1,l));SIM.cmdR=Math.max(-1,Math.min(1,r));
}
function drawSim(){
 var cv=$("rvSim");if(!cv)return;var c=cv.getContext("2d"),W=cv.width,k=W/RovSim.ARENA;
 c.fillStyle="#0f1d33";c.fillRect(0,0,W,W);
 c.strokeStyle="#16304f";c.lineWidth=1;for(var i=1;i<6;i++){c.beginPath();c.moveTo(i*W/6,0);c.lineTo(i*W/6,W);c.moveTo(0,i*W/6);c.lineTo(W,i*W/6);c.stroke();}
 c.fillStyle="#475569";SIM.obs.forEach(function(o){c.fillRect(o.x*k,W-(o.y+o.h)*k,o.w*k,o.h*k);});
 c.strokeStyle="#64748b";c.lineWidth=4;c.strokeRect(2,2,W-4,W-4);
 var x=SIM.x*k,y=W-SIM.y*k,th=-SIM.th;
 // sonar cone
 var a0=-(SIM.th+(SIM.servo-90)*Math.PI/180),len=Math.min(SIM.distTrue,RovSim.P.sonarMax)*k;
 c.fillStyle="rgba(56,189,248,0.18)";c.beginPath();c.moveTo(x,y);c.arc(x,y,Math.max(4,len),a0-0.26,a0+0.26);c.closePath();c.fill();
 c.save();c.translate(x,y);c.rotate(th);
 c.fillStyle="#f5c518";c.fillRect(-0.1*k,-0.075*k,0.2*k,0.15*k);
 c.fillStyle="#111827";c.fillRect(-0.04*k,-0.095*k,0.08*k,0.02*k);c.fillRect(-0.04*k,0.075*k,0.08*k,0.02*k);
 c.fillStyle="#38bdf8";c.fillRect(0.08*k,-0.03*k,0.03*k,0.06*k);
 if(SIM.led){c.fillStyle="#ef4444";c.beginPath();c.arc(0.03*k,0,0.025*k,0,6.3);c.fill();}
 c.restore();
 if(SIM.buzz){c.strokeStyle="#fbbf24";c.lineWidth=2;c.beginPath();c.arc(x,y,0.16*k,0,6.3);c.stroke();}
 if(SIM.resetT>0){c.fillStyle="rgba(239,68,68,.35)";c.fillRect(0,0,W,W);c.fillStyle="#fff";c.font="bold 18px sans-serif";c.textAlign="center";c.fillText(X("CONTROLLER RESET","KIDHIBITI KIMEANZA UPYA"),W/2,W/2);}
}
function hud(){
 var h=$("rvHud");if(!h||!SIM)return;
 var vlow=SIM.volt<RovSim.P.brown+0.3;
 h.innerHTML="<span>"+X("Battery","Betri")+" <b style='color:"+(vlow?"#fca5a5":"#86efac")+"'>"+SIM.volt.toFixed(1)+" V</b></span><span>"+X("Current","Mkondo")+" <b>"+SIM.amps.toFixed(1)+" A</b></span><span>"+X("Distance","Umbali")+" <b>"+(SIM.dist?SIM.dist.toFixed(0)+" cm":X("no echo","hakuna mwangwi"))+"</b></span><span>"+X("Speed","Kasi")+" <b>"+(Math.abs(SIM.vL+SIM.vR)/2*100).toFixed(0)+" cm/s</b></span><span>"+X("Servo","Servo")+" <b>"+SIM.servo+"&deg;</b></span><span>"+X("Resets","Kuanza upya")+" <b>"+SIM.resets+"</b></span>";
 var m=$("rvSer");if(m){var t=SIM.log.join("\n");if(m.dataset.t!==t){m.dataset.t=t;m.textContent=t;m.scrollTop=m.scrollHeight;}}
}
function simLoop(now){
 rafT=0;
 if(step!==10||!$("rover").classList.contains("on")||!SIM)return;
 var dt=Math.min(0.05,(now-lastNow)/1000||0.016);lastNow=now;
 var n=Math.max(1,Math.round(dt/0.02)),i;for(i=0;i<n;i++){manualCmd();SIM.step(dt/n);}
 drawSim();hud();rafT=requestAnimationFrame(simLoop);
}
function simStart(){if(!SIM)simInit();if(!rafT){lastNow=performance.now();rafT=requestAnimationFrame(simLoop);}}

// ---------------- the screen ----------------
function short(i){return [X('Parts','Vipuri'),X('Motors','Motor'),X('Deck','Bamba'),X('Driver','Kiendeshi'),X('Brain','Kidhibiti'),X('Sensor','Kihisi'),X('Power','Umeme'),X('Wiring','Nyaya'),X('Code','Msimbo'),X('Drive','Endesha')][i];}
function stepKey(i,j){return i+"."+j;}
function pct(){var n=0,tot=0;steps().forEach(function(s,i){s.todo.forEach(function(_,j){tot++;if(checks[stepKey(i+1,j)])n++;});});return tot?Math.round(100*n/tot):0;}
function render(){
 var S=steps(),s=S[step-1];
 var h="<div class='rvbar'><button id='rvBack'>&larr; "+X("Build","Jenga")+"</button><div class='seg'><button data-bd='uno' class='"+(board==="uno"?"p":"")+"'>Arduino Uno</button><button data-bd='esp' class='"+(board==="esp"?"p":"")+"'>ESP32</button></div><div class='seg'><button data-lg='en' class='"+(lang==="en"?"p":"")+"'>EN</button><button data-lg='sw' class='"+(lang==="sw"?"p":"")+"'>Kiswahili</button></div></div>";
 h+="<div class='rvstrip'>"+S.map(function(x,i){return "<button data-st='"+(i+1)+"' class='"+(i+1===step?"on":"")+"'><b>"+(i+1<10?"0":"")+(i+1)+"</b><span>"+esc(short(i))+"</span></button>";}).join("")+"</div>";
 h+="<div id='rv3d' class='rv3d'><div class='rvz'><button data-z='in'>+</button><button data-z='out'>&minus;</button><button data-z='rot' title='auto-rotate'>&#8635;</button><button data-z='home' title='reset view'>&#8962;</button></div></div>";
 h+="<div class='card rvcard'><div class='rvk'>"+X("BUILD","JENGA")+" &middot; "+X("STEP","HATUA")+" "+step+" "+X("OF","KATI YA")+" 10</div><h2>"+esc(s.t)+"</h2>"+(s.sim?simHTML():"")+"<p class='rvwhy'>"+esc(s.why)+"</p>";
 if(s.need.length){h+="<div class='rvk'>"+X("YOU WILL NEED","UTAHITAJI")+"</div><ul class='rvneed'>"+s.need.map(function(n){return "<li><b>"+n[0]+"&times;</b> "+esc(n[1])+"</li>";}).join("")+"</ul>";}
 if(s.k==="parts"){h+=partsTable();}
 var done=0;s.todo.forEach(function(_,j){if(checks[stepKey(step,j)])done++;});
 h+="<div class='rvk'>"+X("DO THIS","FANYA HIVI")+" &middot; "+done+" / "+s.todo.length+"</div><div class='rvdo'>"+s.todo.map(function(t,j){return "<label><input type='checkbox' data-ck='"+stepKey(step,j)+"'"+(checks[stepKey(step,j)]?" checked":"")+"><span>"+esc(t)+"</span></label>";}).join("")+"</div>";
 if(s.pins){h+="<div class='rvk'>"+X("PIN MAP","RAMANI YA PINI")+" &middot; "+(ESP()?"ESP32":"Arduino Uno")+"</div><table class='rvtbl'>"+pinRows().map(function(r){return "<tr><td>"+esc(r[0])+"</td><td><b>"+esc(r[1])+"</b></td></tr>";}).join("")+"</table>";}
 if(s.code){h+="<div class='seg' style='margin-top:10px'><button data-sk='test' class='"+(skSel==="test"?"p":"")+"'>1 &middot; "+X("Wiring test","Jaribio la nyaya")+"</button><button data-sk='avoid' class='"+(skSel==="avoid"?"p":"")+"'>2 &middot; "+X("Obstacle avoider","Kiepusha vikwazo")+"</button></div><pre class='rvcode' id='rvCode'></pre><div class='row2'><button id='rvCopy'>"+X("Copy code","Nakili msimbo")+"</button><button id='rvDl'>"+X("Download .ino","Pakua .ino")+"</button></div><div class='rvk' style='margin-top:12px'>"+X("IF SOMETHING IS WRONG","IKIWA KUNA TATIZO")+"</div>"+fixes().map(function(f){return "<details class='rvfix'><summary>"+esc(f[0])+"</summary><p>"+esc(f[1])+"</p></details>";}).join("");}
 h+="<div class='rvk' style='margin-top:12px'>"+X("NOTE","KUMBUKA")+"</div><p class='rvnote'>"+esc(s.note)+"</p>";
 h+="<div class='rvnav'><button id='rvPrev'"+(step===1?" disabled":"")+">&larr; "+X("Back","Rudi")+"</button><button class='p' id='rvNext'>"+(step===10?X("Start over","Anza upya"):X("Next","Endelea")+" &rarr;")+"</button></div></div>";
 h+="<div class='sub' style='text-align:center;margin:6px 0'>"+X("Build progress","Maendeleo ya ujenzi")+": "+pct()+"%</div>";
 var sc=window.scrollY;root.innerHTML=h;attach3d();
 if(s.code)showCode();
 if(s.sim){simStart();}
 window.scrollTo(0,sc);
}
var skSel="test";
function showCode(){var el=$("rvCode");if(el)el.textContent=sketch(skSel);}
function simHTML(){
 return "<div class='rvk' style='margin-top:10px'>"+X("TEST ARENA (3 x 3 m)","UWANJA WA MAJARIBIO (m 3 x 3)")+"</div><canvas id='rvSim' width='340' height='340' class='rvsim'></canvas><div id='rvHud' class='rvhud'></div>"+
 "<div class='rvctl'><div class='rvpad'><button data-h='f'>&uarr;</button><button data-h='l'>&larr;</button><button data-h='b'>&darr;</button><button data-h='r'>&rarr;</button></div><div><label class='sub'>"+X("Speed","Kasi")+" <b id='rvSpdV'>70</b>%<input type='range' id='rvSpd' min='20' max='100' value='70'></label><div class='seg'><button data-mode='manual' class='"+(SIM&&SIM.mode==="manual"?"p":(SIM?"":"p"))+"'>"+X("Manual","Mkono")+"</button><button data-mode='auto' class='"+(SIM&&SIM.mode==="auto"?"p":"")+"'>Auto</button><button data-mode='stop'>"+X("Stop","Simama")+"</button></div><button id='rvReset' style='margin-top:6px;width:100%'>"+X("Reset car","Anzisha upya gari")+"</button></div></div>"+
 "<div class='rvk' style='margin-top:10px'>"+X("FAILURE LAB","MAABARA YA HITILAFU")+"</div><label class='rvdo'><span style='display:flex;gap:8px;align-items:flex-start'><input type='checkbox' id='rvTired'"+(SIM&&SIM.tired?" checked":"")+"> <span>"+X("Tired batteries (7.0 V, weak). The controller restarts when the motors start.","Betri zilizochoka (V 7.0, dhaifu). Kidhibiti huanza upya motor zinapoanza.")+"</span></span></label><label class='rvdo'><span style='display:flex;gap:8px;align-items:flex-start'><input type='checkbox' id='rvWeak'"+(SIM&&SIM.weak?" checked":"")+"> <span>"+X("One weaker motor. The car drifts to one side.","Motor moja dhaifu. Gari linaelekea upande mmoja.")+"</span></span></label>"+
 "<div class='rvk' style='margin-top:10px'>SERIAL MONITOR</div><pre id='rvSer' class='rvser'></pre>";
}
function partsTable(){
 var p=PARTS(),tot=0;
 var rows=p.map(function(r,i){var v=+prices[i]||0;tot+=v*r[0];return "<tr><td>"+r[0]+"&times;</td><td>"+esc(r[1])+"</td><td><input class='rvpr' data-pr='"+i+"' inputmode='numeric' placeholder='KSh' value='"+(prices[i]||"")+"'></td></tr>";}).join("");
 return "<div id='rvParts'><div class='rvk'>"+X("PARTS LIST","ORODHA YA VIPURI")+"</div><table class='rvtbl'><tr><th>"+X("Qty","Idadi")+"</th><th>"+X("Part","Kipuri")+"</th><th>KSh "+X("each","kila kimoja")+"</th></tr>"+rows+"<tr><td></td><td><b>"+X("Total","Jumla")+"</b></td><td><b id='rvTot'>"+tot+"</b></td></tr></table></div><div class='row2'><button id='rvPrint'>"+X("Print or save as PDF","Chapisha au hifadhi PDF")+"</button></div><div class='sub'>"+X("Type the prices you find at your local shop. They are saved on this device.","Andika bei unazopata dukani kwako. Zinahifadhiwa kwenye kifaa hiki.")+"</div>";
}
function go(n){step=Math.max(1,Math.min(10,n));T.manual=false;save();render();}
root.addEventListener("click",function(e){
 var b=e.target.closest("button");if(!b)return;
 if(b.dataset.z){T.manual=true;if(b.dataset.z==="in")T.dist=Math.max(14,T.dist-5);else if(b.dataset.z==="out")T.dist=Math.min(60,T.dist+5);else if(b.dataset.z==="rot")T.auto=!T.auto;else{T.manual=false;T.yaw=0.9;T.pitch=0.42;}return;}
 if(b.id==="rvBack"){window.MM.showTab("build");return;}
 if(b.dataset.bd){board=b.dataset.bd;save();render();return;}
 if(b.dataset.lg){lang=b.dataset.lg;save();render();return;}
 if(b.dataset.st){go(+b.dataset.st);return;}
 if(b.id==="rvPrev"){go(step-1);return;}
 if(b.id==="rvNext"){if(step===10){checks={};go(1);}else go(step+1);return;}
 if(b.dataset.sk){skSel=b.dataset.sk;render();return;}
 if(b.id==="rvCopy"){var t=sketch(skSel);try{navigator.clipboard.writeText(t).then(function(){b.textContent=X("Copied","Imenakiliwa");});}catch(x){}return;}
 if(b.id==="rvDl"){var bl=new Blob([sketch(skSel)],{type:"text/plain"}),a=document.createElement("a");a.href=URL.createObjectURL(bl);a.download="rover_"+skSel+"_"+board+".ino";document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);return;}
 if(b.id==="rvPrint"){document.body.classList.add("rvprint");setTimeout(function(){window.print();setTimeout(function(){document.body.classList.remove("rvprint");},500);},50);return;}
 if(b.dataset.mode){if(!SIM)simInit();if(b.dataset.mode==="stop"){SIM.setMode("manual");SIM.cmdL=SIM.cmdR=0;}else SIM.setMode(b.dataset.mode);[].forEach.call(root.querySelectorAll("[data-mode]"),function(x){x.classList.toggle("p",x.dataset.mode===(b.dataset.mode==="stop"?"manual":b.dataset.mode));});return;}
 if(b.id==="rvReset"){var md=SIM?SIM.mode:"manual";simInit();SIM.setMode(md);return;}
});
root.addEventListener("change",function(e){
 var t=e.target;
 if(t.dataset&&t.dataset.ck){checks[t.dataset.ck]=t.checked?1:0;save();return;}
 if(t.id==="rvTired"||t.id==="rvWeak"){var md=SIM?SIM.mode:"manual";simInit();SIM.setMode(md);}
});
root.addEventListener("input",function(e){
 var t=e.target;
 if(t.id==="rvSpd"){$("rvSpdV").textContent=t.value;if(SIM)SIM.manualSpeed=t.value/100;}
 if(t.dataset&&t.dataset.pr!==undefined){prices[t.dataset.pr]=t.value.replace(/[^0-9]/g,"");save();var p=PARTS(),tot=0;p.forEach(function(r,i){tot+=(+prices[i]||0)*r[0];});var el=$("rvTot");if(el)el.textContent=tot;}
});
["pointerdown","touchstart"].forEach(function(ev){root.addEventListener(ev,function(e){var b=e.target.closest&&e.target.closest("[data-h]");if(b){hold[b.dataset.h]=1;if(SIM&&SIM.mode!=="manual"){SIM.setMode("manual");}e.preventDefault();}},{passive:false});});
["pointerup","pointercancel","pointerleave","touchend"].forEach(function(ev){root.addEventListener(ev,function(e){var b=e.target.closest&&e.target.closest("[data-h]");if(b)hold[b.dataset.h]=0;});});
window.addEventListener("keydown",function(e){if($("rover").classList.contains("on")&&step===10){keys[e.key]=1;if(e.key.indexOf("Arrow")===0)e.preventDefault();}});
window.addEventListener("keyup",function(e){keys[e.key]=0;});
window.addEventListener("resize",resize3d);
var open=function(){render();};
var ob=$("rvOpen");if(ob)ob.onclick=function(){window.MM.showTab("rover");render();};
var navs=document.querySelectorAll("[data-tab=build]");
window.MM_rover={open:function(){window.MM.showTab("rover");render();},go:go,sim:function(){return SIM;},setBoard:function(b){board=b;render();},setLang:function(l){lang=l;render();},steps:steps,sketch:sketch,state:function(){return {step:step,board:board,lang:lang};}};
})();
