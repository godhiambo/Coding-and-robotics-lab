// PIC: pictorial (photo-like) drawings of every electronic part, as SVG. Used for catalog icons,
// the Fritzing-style wiring diagram and the textures on the 3D parts.
var PIC=(function(){
"use strict";
var GOLD="#d9b44a",BLK="#15191e";
function hex(n){return "#"+("000000"+n.toString(16)).slice(-6);}
function Bd(w,h,flip){return {w:w,h:h,flip:flip,b:[],t:[],pins:{},
 r:function(x,y,ww,hh,f,s,rx,sw){this.b.push("<rect x='"+x+"' y='"+y+"' width='"+ww+"' height='"+hh+"' rx='"+(rx||0)+"' fill='"+f+"'"+(s?" stroke='"+s+"' stroke-width='"+(sw||0.8)+"'":"")+"/>");return this;},
 c:function(x,y,rr,f,s,sw){this.b.push("<circle cx='"+x+"' cy='"+y+"' r='"+rr+"' fill='"+f+"'"+(s?" stroke='"+s+"' stroke-width='"+(sw||0.8)+"'":"")+"/>");return this;},
 e:function(x,y,rx,ry,f,s){this.b.push("<ellipse cx='"+x+"' cy='"+y+"' rx='"+rx+"' ry='"+ry+"' fill='"+f+"'"+(s?" stroke='"+s+"' stroke-width='.8'":"")+"/>");return this;},
 l:function(x1,y1,x2,y2,s,sw){this.b.push("<line x1='"+x1+"' y1='"+y1+"' x2='"+x2+"' y2='"+y2+"' stroke='"+s+"' stroke-width='"+(sw||1)+"' stroke-linecap='round'/>");return this;},
 p:function(d,f,s,sw){this.b.push("<path d='"+d+"' fill='"+(f||"none")+"'"+(s?" stroke='"+s+"' stroke-width='"+(sw||1)+"' stroke-linecap='round'":"")+"/>");return this;},
 txt:function(x,y,s,size,f,an,rot){var X=this.flip?this.w-x:x,Y=this.flip?this.h-y:y;this.t.push("<text x='"+X+"' y='"+Y+"'"+(rot?" transform='rotate("+rot+" "+X+" "+Y+")'":"")+" font-size='"+(size||6)+"' fill='"+(f||"#fff")+"' text-anchor='"+(an||"middle")+"' font-family='Arial,sans-serif' font-weight='bold'>"+String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;")+"</text>");return this;},
 pin:function(name,x,y){var X=this.flip?this.w-x:x,Y=this.flip?this.h-y:y;(this.pins[name]=this.pins[name]||[]).push([X,Y]);return this;},
 // row of header pins, label them, register anchors; side 'b' (bottom edge) or 't'
 hdr:function(names,x,y,gap,lbl,up){var n=names.length;this.r(x-3,y-4,n*gap+0,8,BLK,null,1);for(var i=0;i<n;i++){var px=x+gap/2+i*gap-3;this.r(px-1.7,y-1.7,3.4,3.4,"#2b3038",null,.6);this.r(px-1,y-1,2,2,GOLD);this.pin(names[i],px,y);if(lbl!==false){var nm=String(names[i]).replace(/^GPIO/,"");if(n>=10&&gap<9.5)this.txt(px+1.4,y+(up?-6:6),nm,Math.min(4.2,gap*0.62),"#e8eef5",up?"end":"start",-90);else this.txt(px,y+(up?-6.5:9.5),nm,Math.min(4.4,gap*0.92/Math.max(2.2,nm.length*0.62)),"#e8eef5");}}return this;}};}
function Tm(D,x,y,n,gap,col,horiz){for(var i=0;i<n;i++){var px=horiz===false?x:x+i*gap,py=horiz===false?y+i*gap:y;D.r(px,py,11,11,col||"#2e7d32","#124d18",1.2);D.c(px+5.5,py+5.5,3.2,"#c9ced3","#8b9096",.5);D.l(px+3,py+5.5,px+8,py+5.5,"#555",.8);}}

var SZ={uno:[165,128],nano:[150,58],esp32:[158,80],pico:[150,62],pi4:[165,108],microbit:[132,108],
 aa:[96,56],lipo:[90,54],bank:[96,56],l298n:[104,110],l293d:[90,74],tb6612:[80,64],gear:[84,46],
 us:[104,56],sharp:[70,40],irobs:[88,50],line:[64,44],color:[64,64],ldr:[60,50],soil:[66,100],dht:[48,60],imu:[48,48],compass:[48,48],encoder:[56,56],bumper:[70,40],camera:[84,66],
 servo:[78,50],pump:[70,46],led:[34,56],buzzer:[48,50],lcd:[140,62],armkit:[110,80],dronekit:[110,80],relay:[92,60],fan:[70,70],shifter:[60,42],adc:[64,42],buck:[80,46],
 rain:[110,66],flame:[70,50],smoke:[70,60],wlevel:[44,100],gps:[78,60],gsm:[90,66],bt:[88,40],servo2:[80,56],ext:[70,56],soap:[56,80],scoop:[90,56],claw:[84,50]};

var G={};
// ---------------- controllers ----------------
G.uno=function(D){var w=165,h=128,PC="#0e6e9f";
 D.b.push("<defs><linearGradient id='uGb' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#1a8bbf'/><stop offset='1' stop-color='#0a5a86'/></linearGradient><linearGradient id='uGm' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#e5e8ec'/><stop offset='.5' stop-color='#a9afb7'/><stop offset='1' stop-color='#d6dae0'/></linearGradient><radialGradient id='uGc' cx='.35' cy='.3' r='.8'><stop offset='0' stop-color='#f1f3f5'/><stop offset='1' stop-color='#8d949c'/></radialGradient></defs>");
 // board with chamfered corners + glossy edge
 D.p("M6 0 L"+(w-6)+" 0 L"+w+" 6 L"+w+" "+(h-14)+" L"+(w-6)+" "+(h-8)+" L"+(w-6)+" "+(h-2)+" L"+(w-10)+" "+h+" L6 "+h+" L0 "+(h-6)+" L0 6 Z","url(#uGb)","#07405f",1.2);
 D.p("M8 3 L"+(w-8)+" 3","none","rgba(255,255,255,.35)",1);
 // copper traces
 [[40,12,40,60],[48,12,48,52],[130,12,130,40],[60,108,60,80],[75,108,75,86],[96,108,96,82],[108,108,108,80],[44,60,60,60],[150,20,150,100],[156,20,156,100]].forEach(function(t){D.l(t[0],t[1],t[2],t[3],"rgba(255,255,255,.14)",.9);});
 // mounting holes
 [[15,14],[15,"h"],[110,14],[161,"h2"]].forEach(function(q){});
 [[15,14],[15,114],[110,14],[110,114]].forEach(function(q){D.c(q[0],q[1],4,"#e8eef3","#b7bec6",1);D.c(q[0],q[1],2.6,"#0a2a3d");});
 // USB-B (metal shell)
 D.r(0,18,36,34,"url(#uGm)","#6b727a",2);D.r(3,23,26,24,"#1a1d22","#40454b",1.5);D.r(7,27,18,16,"#0c0e11");D.r(0,18,36,3,"rgba(255,255,255,.6)");
 // DC jack
 D.r(0,80,32,36,"#17191d","#000",3);D.r(0,80,32,5,"rgba(255,255,255,.12)");D.r(5,90,22,16,"#0c0d10");D.c(22,98,4.2,"#1f2227","#555",1);D.c(22,98,1.4,"#aab");
 // ATmega16U2 (USB chip) + 328P DIP
 D.r(44,34,14,14,BLK,"#000",1);for(var i=0;i<4;i++){D.r(42,36+i*3.2,2,1.6,"#c5cacf");D.r(58,36+i*3.2,2,1.6,"#c5cacf");D.r(46+i*3.2,32,1.6,2,"#c5cacf");D.r(46+i*3.2,48,1.6,2,"#c5cacf");}D.c(46.5,36.5,1,"#555");
 D.r(66,48,58,22,"#16181c","#000",2);D.r(66,48,58,3,"rgba(255,255,255,.1)");for(var j=0;j<14;j++){D.r(68+j*4,44.5,2.2,3.6,"url(#uGm)");D.r(68+j*4,70.5,2.2,3.6,"url(#uGm)");}D.c(70,52,1.2,"#3a3d42");D.txt(95,59,"ATMEGA328P-PU",3.6,"#9aa0a6");D.txt(95,64,"1234  ARDUINO",2.8,"#6b7078");
 // crystal, regulator, caps
 D.r(44,66,16,10,"url(#uGm)","#7a8087",3);D.txt(52,72,"16.000",3,"#333");
 D.r(104,92,22,10,"#cfd3d7","#888",1);D.r(104,92,22,3,"rgba(255,255,255,.7)",null,1);D.r(34,92,12,16,"#222",null,1);
 D.c(52,84,6,"url(#uGc)","#6b727a",.8);D.l(48,84,56,84,"#555",.8);D.c(66,84,6,"url(#uGc)","#6b727a",.8);D.l(62,84,70,84,"#555",.8);
 // reset button
 D.r(38,58,12,12,"#c8ccd2","#6b727a",1.5);D.c(44,64,3.8,"#b71c1c","#601010",.8);D.c(42.8,62.8,1.2,"rgba(255,255,255,.6)");D.txt(44,79,"RESET",3.2,"#e3f1fa");
 // status LEDs
 [["#ffd54f","L",132,22],["#66ff66","ON",132,28],["#ff8a80","TX",132,34],["#ff8a80","RX",132,40]].forEach(function(l){D.r(129,l[3]-2,6,3.4,l[0],"#555",.5);D.txt(142,l[3]+.6,l[1],3,"#e3f1fa","start");});
 // ICSP headers
 [[132,64],[27,54]].forEach(function(q){D.r(q[0]-3,q[1]-5,14,10,BLK,null,1);for(var r=0;r<2;r++)for(var c=0;c<3;c++){D.r(q[0]+c*4-.9+0,q[1]-3+r*5,2.4,2.4,GOLD);}});D.txt(139,78,"ICSP",3,"#e3f1fa");
 // silkscreen: infinity logo + text
 D.c(86,23,4.4,"none","#e8f7ff",1.2);D.c(96,23,4.4,"none","#e8f7ff",1.2);D.txt(86,24.6,"−",5,"#e8f7ff");D.txt(96,24.6,"+",5,"#e8f7ff");
 D.txt(112,23,"UNO",7,"#e8f7ff","start");D.txt(80,36,"ARDUINO",6.5,"#e8f7ff");
 D.txt(75,15,"DIGITAL (PWM~)",3.4,"#e3f1fa");D.txt(78,100,"POWER",3.8,"#e3f1fa");D.txt(138,100,"ANALOG IN",3.8,"#e3f1fa");
 var t=["SCL","SDA","AREF","GND","D13","D12","D11","D10","D9","D8"],t2=["D7","D6","D5","D4","D3","D2","D1","D0"];
 D.hdr(t,36,5,6.6,true,false);D.hdr(t2,36+10*6.6+5,5,6.6,true,false);
 D.hdr(["IOREF","RST","3V3","5V","GND","GND","VIN"],56,h-5,7,true,true);D.hdr(["A0","A1","A2","A3","A4","A5"],56+7*7+6,h-5,7,true,true);};
G.nano=function(D){var w=150,h=58;D.r(0,0,w,h,"#0f6a9c","#0a4a70",4);D.r(0,16,22,26,"#c9ccd1","#7a8087",2);D.r(4,20,14,18,"#aeb3b9");
 D.r(56,17,24,24,BLK,"#000",1.5);for(var i=0;i<6;i++){D.c(60+i*3.2,21,.8,"#888");}D.txt(68,31,"ATMEGA",3.8,"#bbb");D.txt(68,36,"328P",3.8,"#bbb");
 D.c(32,29,4,"#d32f2f","#7f1d1d",1);D.c(100,24,1.6,"#ffd54f");D.c(100,30,1.6,"#66ff66");D.c(100,36,1.6,"#ff6b6b");D.r(40,40,10,6,BLK);
 D.txt(95,29,"ARDUINO",6.4,"#e8f7ff");D.txt(95,38,"NANO",5.6,"#e8f7ff");
 D.hdr(["TX1","RX0","RST","GND","D2","D3","D4","D5","D6","D7","D8","D9","D10","D11","D12"],14,5,8.9,true,false);
 D.hdr(["VIN","GND","RST","5V","A7","A6","A5","A4","A3","A2","A1","A0","REF","3V3","D13"],14,h-5,8.9,true,true);};
G.esp32=function(D){var w=158,h=80;D.b.push("<defs><linearGradient id='pGm' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#eef1f4'/><stop offset='.5' stop-color='#a8aeb6'/><stop offset='1' stop-color='#d5dae0'/></linearGradient><radialGradient id='pGc' cx='.35' cy='.3' r='.8'><stop offset='0' stop-color='#f3f5f7'/><stop offset='1' stop-color='#858c95'/></radialGradient><linearGradient id='pGk' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#3a4048'/><stop offset='1' stop-color='#14171b'/></linearGradient></defs>");
 D.r(0,0,w,h,"#1b2027","#05070a",4);D.r(2,2,w-4,3,"rgba(255,255,255,.08)",null,1);
 // micro-USB
 D.r(0,30,18,20,"url(#pGm)","#6b727a",2);D.r(3,34,12,12,"#15181c");D.r(5,37,8,6,"#0a0c0f");
 // CP2102 + regulator
 D.r(24,22,10,10,"#111",null,1);D.txt(29,28,"CP",2.6,"#777");D.r(24,48,10,8,"#222",null,1);
 // buttons EN / BOOT
 D.r(22,13,11,9,"url(#pGm)","#666",1.5);D.c(27.5,17.5,2.8,"#222");D.r(22,58,11,9,"url(#pGm)","#666",1.5);D.c(27.5,62.5,2.8,"#222");D.txt(40,19,"EN",3.4,"#9aa0a6","start");D.txt(40,64,"BOOT",3.4,"#9aa0a6","start");
 // WROOM metal shield
 D.r(50,15,66,50,"url(#pGm)","#7b828a",2);D.r(53,18,60,44,"none","rgba(255,255,255,.5)",1,.6);D.txt(83,33,"ESP32-WROOM-32",4.8,"#444");D.txt(83,40,"FCC ID:2AC7Z-ESPWROOM32",2.8,"#666");D.txt(83,46,"IC:21098-ESPWROOM32",2.8,"#666");D.r(58,50,10,8,"#444",null,.5);D.r(60,52,6,4,"#888",null,.5);
 // antenna (gold meander trace on bare PCB)
 var ant="M118 18 L150 18 L150 26 L122 26 L122 34 L150 34 L150 42 L122 42 L122 50 L150 50 L150 58";D.p(ant,"none",GOLD,1.5);D.r(116,14,40,52,"none","#262c34",1);
 // LEDs + caps
 D.r(40,36,4,3,"#ff3b3b","#800",.4);D.r(40,42,4,3,"#3b82ff","#118",.4);D.c(46,56,3,"url(#pGc)","#666",.6);D.c(50,56,3,"url(#pGc)","#666",.6);
 D.txt(8,26,"3V3",3,"#cfd3d7","start",-90);
 D.hdr(["3V3","EN","GPIO36","GPIO39","GPIO34","GPIO35","GPIO32","GPIO33","GPIO25","GPIO26","GPIO27","GPIO14","GPIO12","GND","GPIO13","SD2","SD3","CMD","5V"],6,5,7.5,true,false);
 D.hdr(["GND","GPIO23","GPIO22","TX0","RX0","GPIO21","GND","GPIO19","GPIO18","GPIO5","GPIO17","GPIO16","GPIO4","GPIO0","GPIO2","GPIO15","SD1","SD0","CLK"],6,h-5,7.5,true,true);};
G.pico=function(D){var w=150,h=62;D.r(0,0,w,h,"#1f7a3b","#0f4d22",4);D.r(0,20,18,22,"#c9ccd1","#7a8087",2);D.r(4,23,10,16,"#aeb3b9");
 D.r(58,18,26,26,BLK,"#000",1.5);D.txt(71,32,"RP2040",4.6,"#bbb");D.r(26,24,16,12,"#f3f3f3","#999",1.5);D.txt(34,32,"BOOTSEL",3,"#555");
 D.r(96,22,20,18,"#cfd3d7","#888");D.c(124,31,2,"#66ff66");D.txt(130,34,"Pico",6,"#e9f8ee");
 var top=["GP0","GP1","GND","GP2","GP3","GP4","GP5","GND","GP6","GP7","GP8","GP9","GND","GP10","GP11","GP12","GP13","GND","GP14","GP15"],bot=["VBUS","VSYS","GND","3V3EN","3V3","ADCV","GP28","GND","GP27","GP26","RUN","GP22","GND","GP21","GP20","GP19","GP18","GND","GP17","GP16"];
 D.hdr(top,4,5,7.2,true,false);D.hdr(bot,4,h-5,7.2,true,true);};
G.pi4=function(D){var w=165,h=108;D.r(0,0,w,h,"#1c7d3c","#0f4d22",5);
 D.r(0,50,26,20,"#c9ccd1","#888");D.r(0,74,26,20,"#c9ccd1","#888");D.r(138,8,27,32,"#c9ccd1","#888");D.r(138,44,27,28,"#2f6fd6","#17408a");D.r(138,76,27,28,"#2f6fd6","#17408a");
 D.r(60,40,30,30,"#cfd3d7","#888",2);D.txt(75,58,"BCM2711",4.5,"#444");D.r(96,46,20,18,BLK);D.r(36,50,16,10,BLK);D.r(36,66,16,10,"#9aa");
 D.txt(75,92,"Raspberry Pi 4 B",6,"#e9f8ee");D.r(34,100,12,8,"#cfd3d7","#888");D.r(50,100,12,8,"#222");D.r(66,100,12,8,"#222");
 var odd=["3V3","GPIO2","GPIO3","GPIO4","GND","GPIO17","GPIO27","GPIO22","3V3","GPIO10","GPIO9","GPIO11","GND","IDSD","GPIO5","GPIO6","GPIO13","GPIO19","GPIO26","GND"],even=["5V","5V","GND","GPIO14","GPIO15","GPIO18","GND","GPIO23","GPIO24","GND","GPIO25","GPIO8","GPIO7","IDSC","GND","GPIO12","GND","GPIO16","GPIO20","GPIO21"];
 D.r(20,2,120,16,BLK,null,1);for(var i=0;i<20;i++){var px=24+i*5.9;D.r(px-1.2,4,2.4,2.4,GOLD);D.r(px-1.2,11,2.4,2.4,GOLD);D.pin(even[i],px,5.2);D.pin(odd[i],px,12.2);}
 D.txt(80,27,"GPIO",4.6,"#e9f8ee");};
G.microbit=function(D){var w=132,h=108;D.r(0,0,w,h,"#1a1d22","#000",10);D.r(4,4,w-8,h-8,"none","#444",8);
 for(var r=0;r<5;r++)for(var c=0;c<5;c++)D.r(40+c*11,22+r*11,6,6,((r+c)%3===0)?"#ff3b3b":"#5a1111",null,1);
 D.c(14,52,6,"#ddd","#888");D.c(w-14,52,6,"#ddd","#888");D.txt(14,66,"A",5,"#ddd");D.txt(w-14,66,"B",5,"#ddd");D.r(48,82,36,10,"#2b2f36","#555",2);D.txt(66,89,"micro:bit",5.4,"#fff");
 var big=[["P0",18],["P1",44],["P2",70],["3V",96],["GND",116]];big.forEach(function(q){D.r(q[1]-7,h-14,14,14,GOLD,"#a8842a",3);D.pin(q[0],q[1],h-6);D.txt(q[1],h-16,q[0],4.6,"#cfd3d7");});
 [["P3",30],["P4",57],["P6",83],["P7",106],["P8",24],["P9",50],["P10",76],["P12",102],["P13",12],["P14",122]].forEach(function(q){D.pin(q[0],q[1],h-2);});};
// ---------------- power ----------------
G.aa=function(D){D.r(0,4,96,48,"#16191d","#000",5);for(var i=0;i<4;i++){D.r(6+i*22,8,19,40,"#d4b02a","#8a6f10",9);D.r(8+i*22,12,15,8,"#fff3c2",null,4);D.txt(15.5+i*22,36,"AA",6,"#3a2d00");}
 D.l(96,18,106,18,"#d32f2f",2);D.l(96,38,106,38,BLK,2);D.pin("+",96,18);D.pin("-",96,38);D.txt(48,52,"6V",4.4,"#6b5a00");};
G.lipo=function(D){D.r(0,2,90,50,"#2a62c9","#173a7c",6);D.r(6,10,60,34,"#1a2f6a",null,3);D.txt(36,28,"LiPo",8,"#fff");D.txt(36,38,"7.4V 2500mAh",5,"#cfe0ff");D.r(88,12,6,10,"#d32f2f");D.r(88,32,6,10,BLK);D.pin("+",94,17);D.pin("-",94,37);};
G.bank=function(D){D.r(0,2,92,52,"#f2f2f2","#b9b9b9",7);D.r(6,8,52,40,"#2a2f36",null,4);D.txt(32,32,"5V 3A",8,"#7be0ff");D.r(66,10,20,8,BLK);D.r(66,24,20,8,"#bbb");D.pin("+",90,14);D.pin("-",90,38);};
// ---------------- drivers & motors ----------------
G.l298n=function(D){D.b.push("<defs><linearGradient id='pGm' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#eef1f4'/><stop offset='.5' stop-color='#a8aeb6'/><stop offset='1' stop-color='#d5dae0'/></linearGradient><radialGradient id='pGc' cx='.35' cy='.3' r='.8'><stop offset='0' stop-color='#f3f5f7'/><stop offset='1' stop-color='#858c95'/></radialGradient><linearGradient id='pGk' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#3a4048'/><stop offset='1' stop-color='#14171b'/></linearGradient></defs>");
 D.r(0,0,104,110,"#c62828","#7f1d1d",4);D.r(2,2,100,3,"rgba(255,255,255,.18)",null,1.5);
 [[5,5],[99,5],[5,105],[99,105]].forEach(function(q){D.c(q[0],q[1],2.4,"#f3d9d9","#8a2a2a",.6);});
 // heatsink with fins
 D.r(27,30,50,42,"url(#pGk)","#000",2);for(var i=0;i<8;i++){D.r(30+i*5.6,33,3,36,"rgba(255,255,255,.12)");}D.r(26,29,52,3,"rgba(255,255,255,.25)",null,1);D.txt(52,84,"L298N",6.6,"#ffe0e0");
 // chip legs
 for(var k=0;k<15;k++){D.r(80,34+k*2.4,3,1.2,"url(#pGm)");}
 // capacitors
 D.c(88,16,6,"url(#pGc)","#6b727a",.8);D.c(88,16,3.8,"none","#555",.6);D.r(86,8,4,8,"#222",null,.5);D.c(14,92,5,"url(#pGc)","#6b727a",.8);
 Tm(D,8,6,3,16,"#1b8a3a");["12V","GND","5V"].forEach(function(n,i){D.pin(n,13.5+i*16,6);D.txt(13.5+i*16,22,n,4,"#fff");});
 [[2,34],[2,52],[86,34],[86,52]].forEach(function(q){D.r(q[0],q[1],16,12,"#1b8a3a","#0d4f20",2);D.r(q[0]+1,q[1]+1,14,2,"rgba(255,255,255,.3)",null,1);});
 D.c(10,40,3.4,"url(#pGm)","#8b9096",.5);D.l(8,40,12,40,"#555",.9);D.c(10,58,3.4,"url(#pGm)","#8b9096",.5);D.l(8,58,12,58,"#555",.9);D.c(94,40,3.4,"url(#pGm)","#8b9096",.5);D.l(92,40,96,40,"#555",.9);D.c(94,58,3.4,"url(#pGm)","#8b9096",.5);D.l(92,58,96,58,"#555",.9);
 D.pin("OUT1",10,40);D.pin("OUT2",10,58);D.pin("OUT3",94,40);D.pin("OUT4",94,58);
 D.txt(10,32,"OUT1",3.6,"#fff");D.txt(10,70,"OUT2",3.6,"#fff");D.txt(94,32,"OUT3",3.6,"#fff");D.txt(94,70,"OUT4",3.6,"#fff");
 D.c(84,50,1.8,"#ff3b3b");D.r(74,92,8,6,"#111");D.r(86,88,12,4,"#222");D.c(94,96,1.8,"#ffd54f");D.r(22,76,14,8,"#222",null,1);
 D.hdr(["ENA","IN1","IN2","IN3","IN4","ENB"],18,104,11,true,true);D.pin("VCC",96,80);};

function h(x){return x;}
G.l293d=function(D){D.r(0,0,90,74,"#1a237e","#0d1250",4);D.r(26,22,38,22,BLK,"#000",2);D.txt(45,35,"L293D",6,"#ccc");D.hdr(["EN1","IN1","IN2","IN3","IN4","EN2"],14,68,10,true,true);["VCC","GND","M1A","M1B","M2A","M2B"].forEach(function(n,i){D.r(7+i*13,3,11,10,"#2e7d32");D.pin(n,12.5+i*13,6);D.txt(12.5+i*13,21,n,3.2,"#fff");});};
G.tb6612=function(D){D.r(0,0,80,64,"#7b1fa2","#4a148c",4);D.r(26,20,26,18,BLK,"#000",2);D.txt(39,31,"TB6612",4.6,"#ccc");D.hdr(["PWMA","AIN1","AIN2","BIN1","BIN2","PWMB"],8,58,10,true,true);["VM","GND","A01","A02","B01","B02"].forEach(function(n,i){D.r(4+i*12,3,10,9,"#c9ced3");D.pin(n,9+i*12,6);D.txt(9+i*12,20,n,3.4,"#fff");});};
G.gear=function(D){D.r(8,8,52,30,"#f4b400","#a37400",4);D.r(60,16,16,14,"#cfd3d7","#888",2);D.r(2,14,8,18,"#222");D.l(76,23,82,23,"#888",3);D.c(30,23,9,"#c98f00","#7a5600");D.txt(30,26,"TT",6,"#5b3d00");D.l(10,16,2,6,"#d32f2f",1.6);D.l(10,30,2,40,BLK,1.6);D.pin("M+",2,6);D.pin("M-",2,40);};
// ---------------- sensors ----------------
G.us=function(D){D.b.push("<defs><linearGradient id='pGm' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#eef1f4'/><stop offset='.5' stop-color='#a8aeb6'/><stop offset='1' stop-color='#d5dae0'/></linearGradient><radialGradient id='pGc' cx='.35' cy='.3' r='.8'><stop offset='0' stop-color='#f3f5f7'/><stop offset='1' stop-color='#858c95'/></radialGradient><linearGradient id='pGk' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#3a4048'/><stop offset='1' stop-color='#14171b'/></linearGradient></defs>");
 D.r(0,0,104,56,"#1565c0","#0b3d80",3);D.r(2,2,100,4,"rgba(255,255,255,.18)",null,2);
 [26,78].forEach(function(cx){D.c(cx,24,19.5,"url(#pGm)","#6b727a",1.2);D.c(cx,24,16,"url(#pGk)");for(var r=13;r>3;r-=3)D.c(cx,24,r,"none","rgba(160,170,180,.45)",.5);for(var g=-12;g<=12;g+=4){D.l(cx+g,24-Math.sqrt(Math.max(0,150-g*g)),cx+g,24+Math.sqrt(Math.max(0,150-g*g)),"rgba(150,160,170,.35)",.4);}D.c(cx,24,2.2,"url(#pGm)");D.c(cx-6,16,1.6,"rgba(255,255,255,.35)");});
 D.r(40,12,24,14,"#14171b","#000",1.5);for(var i=0;i<8;i++){D.r(41+i*3,10,1.5,2.4,"url(#pGm)");D.r(41+i*3,26,1.5,2.4,"url(#pGm)");}D.txt(52,20,"MAX",2.8,"#8a9097");D.txt(52,23.5,"3232",2.4,"#8a9097");
 D.e(52,41,7,3.6,"url(#pGm)","#7a8087");D.txt(52,42.2,"16M",2.6,"#444");D.r(70,36,6,3,"#222");D.r(78,36,6,3,"#222");D.r(88,40,5,3,"#d4af37");
 D.txt(52,8,"HC-SR04",4.6,"#e8f1ff");D.txt(26,53.8,"VCC",3.2);D.txt(42,53.8,"TRIG",3.2);D.txt(58,53.8,"ECHO",3.2);D.txt(74,53.8,"GND",3.2);
 D.hdr(["VCC","TRIG","ECHO","GND"],36,56,8,false,true);};
G.sharp=function(D){D.r(0,0,70,40,"#2b2b2b","#000",3);D.r(8,5,18,20,"#c9ccd1","#888",2);D.r(40,5,20,20,"#c9ccd1","#888",2);D.txt(35,30,"GP2Y0A",3.8,"#ccc");D.hdr(["VCC","GND","AOUT"],12,40,16,true,true);};
G.irobs=function(D){D.r(0,0,88,50,"#1c6dd0","#0f3f86",3);D.c(18,16,8,"#f3f3f3","#bbb");D.c(36,16,8,"#1b1f24","#000");D.r(52,8,14,14,"#2b6cc9","#fff",2);D.c(59,15,4,"#d4b02a");D.r(70,8,12,16,BLK,"#000",1);D.c(8,36,2,"#ff3b3b");D.c(16,36,2,"#66ff66");D.txt(44,27,"IR",4.4,"#fff");D.hdr(["VCC","GND","OUT"],24,50,10,true,true);};
G.line=function(D){D.r(0,0,64,44,"#222",null,3);D.r(0,0,64,44,"#1d3b73","#0f2247",3);D.r(10,8,12,10,BLK);D.c(30,13,4,"#ff3b3b");D.r(40,8,10,10,BLK);D.c(10,32,2,"#66ff66");D.txt(32,28,"TCRT5000",4,"#ddd");D.hdr(["VCC","GND","OUT"],18,44,10,true,true);};
G.color=function(D){D.r(0,0,64,64,"#c8ccd1","#888",4);D.r(14,14,36,36,BLK,"#000",2);D.c(32,32,9,"#e8ecf0","#999");[[18,18],[46,18],[18,46],[46,46]].forEach(function(q){D.c(q[0],q[1],4,"#fff","#bbb");});D.txt(32,10,"TCS3200",5,"#222");D.hdr(["VCC","GND","S0","S1","OUT"],6,62,10.5,false,true);};
G.ldr=function(D){D.r(0,0,60,50,"#1c6dd0","#0f3f86",3);D.c(18,17,10,"#d9822b","#8a4f10");D.l(10,15,26,15,"#6b3a0c",1.2);D.l(10,19,26,19,"#6b3a0c",1.2);D.r(36,8,14,14,"#2b6cc9","#fff",2);D.c(43,15,4,"#d4b02a");D.c(10,36,2,"#ff3b3b");D.hdr(["VCC","GND","AOUT"],8,50,14,true,true);};
G.soil=function(D){D.r(8,14,50,36,"#1b5e20","#0c3a10",3);D.r(14,22,14,12,"#2b6cc9","#fff",2);D.c(21,28,4,"#d4b02a");D.r(34,22,18,12,BLK);D.txt(33,46,"Soil",4.4,"#cde");
 D.r(10,50,46,6,"#b88a2e");D.r(10,56,18,42,"#d4a437","#8a6a1c",2);D.r(38,56,18,42,"#d4a437","#8a6a1c",2);for(var i=0;i<6;i++){D.l(14,62+i*6,24,62+i*6,"#8a6a1c",.8);D.l(42,62+i*6,52,62+i*6,"#8a6a1c",.8);}
 D.hdr(["VCC","GND","AOUT"],14,6,12.5,true,false);};
G.dht=function(D){D.r(2,0,44,40,"#33a7e8","#1a6fa5",3);for(var i=0;i<5;i++)for(var j=0;j<4;j++)D.r(7+i*7.4,5+j*7.4,4,4,"#1a6fa5",null,1);D.txt(24,37,"DHT",4.4,"#fff");D.hdr(["VCC","DATA","GND"],7.5,60,13,true,true);D.l(11,40,11,56,"#aaa",1.4);D.l(24,40,24,56,"#aaa",1.4);D.l(37,40,37,56,"#aaa",1.4);};
G.imu=function(D){D.r(0,0,48,48,"#6a1b9a","#3c0f5a",3);D.r(18,8,12,12,BLK);D.txt(24,28,"MPU6050",3.6,"#eee");D.hdr(["VCC","GND","SCL","SDA"],4,48,10,true,true);};
G.compass=function(D){D.r(0,0,48,48,"#c62828","#7a1313",3);D.r(18,8,12,12,BLK);D.txt(24,28,"HMC5883L",3.4,"#eee");D.hdr(["VCC","GND","SCL","SDA"],4,48,10,true,true);};
G.encoder=function(D){D.r(0,0,56,56,"#1b1b1b","#000",3);D.c(28,24,17,"#2a2a2a","#555");for(var i=0;i<12;i++){var a=i*Math.PI/6;D.l(28+Math.cos(a)*9,24+Math.sin(a)*9,28+Math.cos(a)*16,24+Math.sin(a)*16,"#888",2.4);}D.c(28,24,4,"#ccc");D.hdr(["VCC","GND","OUT"],12,56,10,true,true);};
G.bumper=function(D){D.r(0,10,70,28,"#b71c1c","#7f1d1d",4);D.r(6,2,58,10,"#888","#555",2);D.c(14,24,3,"#ddd");D.c(56,24,3,"#ddd");D.txt(35,28,"BUMPER",5,"#fff");D.pin("SIG",14,38);D.pin("GND",56,38);};
G.camera=function(D){D.r(0,0,84,66,"#1f2d3a","#0c141b",3);D.c(42,28,18,"#b8bec5","#6b7178",2);D.c(42,28,13,"#0e1a26","#223");D.c(42,28,6,"#1d3550");D.c(36,22,2,"#7ec8ff");D.r(26,52,32,8,"#d4b02a");D.txt(42,10,"OV2640",5,"#ccc");};
G.rain=function(D){D.r(0,0,66,66,"#222",null,3);D.r(2,2,62,62,"#2b3a42","#111",3);for(var i=0;i<9;i++){D.l(8,8+i*6.4,58,8+i*6.4+(i%2?0:0),i%2?"#d9b44a":"#8a7a3a",2.2);}D.txt(33,62,"RAIN",4.6,"#ddd");
 D.r(72,6,38,36,"#c62828","#7a1313",3);D.r(78,12,14,12,"#2b6cc9","#fff",2);D.c(85,18,4,"#d4b02a");D.r(96,12,10,10,BLK);D.hdr(["VCC","GND","DOUT","AOUT"],70,66,10.5,true,true);D.l(66,34,72,34,"#aaa",1.4);};
G.flame=function(D){D.r(0,0,70,50,"#7b1313","#450a0a",3);D.c(16,16,8,"#1b1b1b","#000");D.r(12,12,8,8,"#3a0c0c");D.c(16,16,3,"#aa2222");D.r(36,8,14,14,"#2b6cc9","#fff",2);D.c(43,15,4,"#d4b02a");D.r(54,10,12,14,BLK);D.c(8,36,2,"#ff3b3b");D.txt(40,34,"FLAME",4.4,"#fff");D.hdr(["VCC","GND","DOUT","AOUT"],4,50,15,true,true);};
G.smoke=function(D){D.r(0,0,70,60,"#1c6dd0","#0f3f86",3);D.c(24,24,18,"#bfc3c8","#7b8086",2);D.c(24,24,14,"#8f9399");for(var i=0;i<12;i++){D.l(14,18+i*1.6,34,18+i*1.6,"#777",.5);}D.txt(24,45,"MQ-2",5,"#fff");D.r(46,10,14,14,"#2b6cc9","#fff",2);D.c(53,17,4,"#d4b02a");D.hdr(["VCC","GND","DOUT","AOUT"],4,60,15,true,true);};
G.wlevel=function(D){D.r(0,0,44,100,"#ece6cf","#b5ab82",3);for(var i=0;i<9;i++){D.r(6,20+i*8.4,32,4,"#c9a227");}D.txt(22,95,"WATER",3.6,"#555");D.hdr(["S","VCC","GND"],4,6,12,true,false);};
G.gps=function(D){D.r(0,0,78,60,"#1b3a8c","#0f2257",3);D.r(8,6,40,40,"#d9d3b8","#a69f80",2);D.r(14,12,28,28,"#b8b093");D.txt(28,29,"NEO-6M",5,"#444");D.r(54,8,18,18,BLK);D.c(60,50,2,"#66ff66");D.hdr(["VCC","RX","TX","GND"],10,60,14,true,true);};
G.gsm=function(D){D.r(0,0,90,66,"#c2185b","#7a0e3a",3);D.r(10,10,30,24,"#2b2f36","#000",2);D.txt(25,24,"SIM800L",4.6,"#ccc");D.r(48,8,34,22,"#f5f5f5","#bbb",2);D.txt(65,22,"SIM",5,"#444");D.l(70,38,86,38,"#bbb",2);D.c(14,46,2,"#66ff66");D.hdr(["VCC","GND","TX","RX","RST"],10,66,14,true,true);};
G.bt=function(D){D.r(0,0,88,40,"#1b3a8c","#0f2257",3);D.r(8,8,34,22,"#c3c8cd","#7a8087",2);D.txt(25,22,"HC-05",5,"#333");D.r(48,10,12,12,BLK);D.c(70,14,3,"#4aa3ff");D.hdr(["VCC","GND","TX","RX"],8,40,13,true,true);};
// ---------------- actuators ----------------
G.servo=function(D){D.b.push("<defs><linearGradient id='pGm' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#eef1f4'/><stop offset='.5' stop-color='#a8aeb6'/><stop offset='1' stop-color='#d5dae0'/></linearGradient><radialGradient id='pGc' cx='.35' cy='.3' r='.8'><stop offset='0' stop-color='#f3f5f7'/><stop offset='1' stop-color='#858c95'/></radialGradient><linearGradient id='pGk' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#3a4048'/><stop offset='1' stop-color='#14171b'/></linearGradient></defs>");
 D.r(8,10,54,30,"#1f63c8","#0f3a80",3);D.r(8,10,54,5,"rgba(255,255,255,.25)",null,2);
 D.r(2,16,6,18,"#1f63c8","#0f3a80",1);D.r(62,16,6,18,"#1f63c8","#0f3a80",1);D.c(4.5,25,1.4,"#0a2550");D.c(65.5,25,1.4,"#0a2550");
 D.r(38,16,20,18,"#f2f5f9","#b6bdc6",2);D.txt(48,26,"TowerPro",3,"#c62828");D.txt(48,31,"SG90 9g",3.2,"#1f63c8");
 // output shaft + white horn
 D.c(26,25,10,"url(#pGm)","#8b9096",.8);D.c(26,25,4.2,"#444");D.r(21,0,10,14,"#f4f4f4","#b8b8b8",3);for(var i=0;i<3;i++)D.c(26,3+i*3.6,1,"#9aa");D.c(26,25,1.4,"#ddd");
 D.l(62,22,76,22,"#f4a000",2.2);D.l(62,25,76,25,"#d32f2f",2.2);D.l(62,28,76,28,"#7a4a1c",2.2);D.pin("SIG",76,22);D.pin("VCC",76,25);D.pin("GND",76,28);};
G.servo2=function(D){D.r(10,12,56,36,"#1b1b1b","#000",3);D.r(2,20,8,20,"#1b1b1b");D.r(66,20,8,20,"#1b1b1b");D.c(30,30,12,"#c9ccd1","#888");D.c(30,30,5,"#555");D.r(26,3,8,14,"#cfd3d7","#888",2);D.txt(50,34,"MG996R",5,"#ddd");D.l(66,26,78,26,"#f4b400",1.8);D.l(66,30,78,30,"#d32f2f",1.8);D.l(66,34,78,34,"#7a4a1c",1.8);D.pin("SIG",78,26);D.pin("VCC",78,30);D.pin("GND",78,34);};
G.pump=function(D){D.r(8,10,34,26,"#1b1b1b","#000",5);D.r(42,14,18,18,"#2b6fd6","#17408a",4);D.c(51,23,5,"#9cd0ff");D.l(60,23,68,23,"#7ec8ff",3);D.l(8,18,0,14,"#d32f2f",1.6);D.l(8,28,0,34,BLK,1.6);D.pin("+",0,14);D.pin("-",0,34);};
G.led=function(D){D.r(7,18,20,20,"#d32f2f","#8f1c1c",9);D.e(17,14,10,12,"#ef5350","#8f1c1c");D.e(14,11,3,5,"rgba(255,255,255,.6)");D.l(13,38,13,56,"#bbb",1.6);D.l(21,38,21,50,"#bbb",1.6);D.pin("+",13,56);D.pin("-",21,50);};
G.buzzer=function(D){D.c(24,22,20,"#111","#000");D.c(24,22,16,"#1b1b1b");D.c(24,22,4,"#333");D.txt(24,8,"+",6,"#aaa");D.l(14,42,14,50,"#bbb",1.6);D.l(34,42,34,50,"#bbb",1.6);D.pin("+",14,50);D.pin("-",34,50);};
G.lcd=function(D){D.r(0,0,140,62,"#1a6f43","#0c4026",3);D.r(14,8,112,38,"#0e5aa8","#08305a",2);D.r(20,13,100,28,"#1d86ea");for(var i=0;i<16;i++){D.r(22+i*6,16,4.6,8,"#0d4f94",null,.6);D.r(22+i*6,28,4.6,8,"#0d4f94",null,.6);}D.txt(70,56,"LCD 16x2 I2C",4.6,"#e4f7ec");D.hdr(["GND","VCC","SDA","SCL"],96,62,10,true,true);};
G.relay=function(D){D.r(0,0,92,60,"#1c6dd0","#0f3f86",3);D.r(8,8,34,34,"#1b6fe0","#0a3f8a",2);D.txt(25,26,"SRD-05VDC",3.6,"#eef");D.txt(25,32,"10A 250VAC",3.2,"#eef");Tm(D,52,6,3,13,"#2e7d32");D.pin("COM",57.5,12);D.pin("NO",70.5,12);D.pin("NC",83.5,12);D.c(14,50,2,"#ff3b3b");D.c(22,50,2,"#66ff66");D.hdr(["VCC","GND","IN"],54,60,10,true,true);};
G.fan=function(D){D.r(2,2,66,66,"#1b1b1b","#000",5);D.c(35,35,28,"#2b2f36","#111");for(var i=0;i<5;i++){var a=i*Math.PI*2/5;D.p("M35 35 Q"+(35+Math.cos(a)*30)+" "+(35+Math.sin(a)*30)+" "+(35+Math.cos(a+0.9)*24)+" "+(35+Math.sin(a+0.9)*24)+" Z","#cfd3d7","#888",.5);}D.c(35,35,6,"#444");D.pin("+",2,66);D.pin("-",10,66);};
G.ext=function(D){D.r(6,14,34,28,"#d32f2f","#7f1d1d",5);D.r(40,22,22,12,"#cfd3d7","#888",2);D.c(60,28,4,"#7ec8ff");D.l(6,22,0,18,"#d32f2f",1.6);D.l(6,34,0,40,BLK,1.6);D.txt(23,32,"VALVE",4.4,"#fff");D.pin("+",0,18);D.pin("-",0,40);};
G.soap=function(D){D.r(8,26,40,50,"#81c784","#388e3c",6);D.r(20,12,16,14,"#e8eef2","#999",2);D.l(28,12,28,4,"#ccc",3);D.l(28,4,44,4,"#ccc",3);D.txt(28,52,"SOAP",6,"#1b5e20");D.l(8,60,0,56,"#d32f2f",1.6);D.l(8,68,0,74,BLK,1.6);D.pin("+",0,56);D.pin("-",0,74);};
G.scoop=function(D){D.p("M10 10 L80 10 L70 46 L20 46 Z","rgba(239,108,0,.25)","#ef6c00",2);for(var i=0;i<6;i++){D.l(18+i*10,10,24+i*8,46,"#ef6c00",.8);}for(var j=0;j<3;j++)D.l(14+j*2,18+j*10,76-j*2,18+j*10,"#ef6c00",.8);D.l(45,10,45,2,"#888",3);D.l(46,2,46,2,"#888",1);D.pin("+",45,2);D.pin("-",46,2);};
G.claw=function(D){D.r(30,6,24,18,"#00838f","#00535c",3);D.p("M32 24 Q14 30 18 46 L26 40 Q28 32 38 28 Z","#cfd8dc","#78909c",1);D.p("M52 24 Q70 30 66 46 L58 40 Q56 32 46 28 Z","#cfd8dc","#78909c",1);D.txt(42,18,"CLAW",4.4,"#fff");D.pin("SIG",42,6);};
G.armkit=function(D){D.r(2,60,44,18,"#37474f","#222",3);D.r(14,34,12,30,"#cfd3d7","#888",3);D.c(20,34,6,"#00838f");D.l(20,34,52,14,"#cfd3d7",7);D.c(52,14,5,"#00838f");D.l(52,14,84,34,"#cfd3d7",6);D.r(80,32,12,12,"#78909c","#444",2);D.txt(56,74,"ROBOT ARM KIT",5,"#ddd");};
G.dronekit=function(D){D.r(38,28,34,24,"#212121","#000",4);[[10,12],[100,12],[10,66],[100,66]].forEach(function(q){D.l(55,40,q[0],q[1],"#444",3);D.c(q[0],q[1],9,"rgba(200,200,200,.35)","#888",1);D.c(q[0],q[1],2,"#222");});D.c(55,40,4,"#00e676");D.txt(55,46,"DRONE KIT",4.4,"#ddd");};
G.shifter=function(D){D.r(0,0,60,42,"#1c6dd0","#0f3f86",3);D.r(22,12,16,14,BLK);D.txt(30,10,"LEVEL SHIFT",3.4,"#fff");D.hdr(["LV","GND","HV","L1","H1"],6,42,10,true,true);};
G.adc=function(D){D.r(0,0,64,42,"#1b3a8c","#0f2257",3);D.r(18,10,26,16,BLK);D.txt(31,20,"ADS1115",4,"#ccc");D.hdr(["VCC","GND","SCL","SDA"],8,42,12,true,true);};
G.buck=function(D){D.r(0,0,80,46,"#1c6dd0","#0f3f86",3);D.r(10,10,22,22,"#222","#000",2);D.c(50,22,8,"#cfd3d7","#888");D.l(46,22,54,22,"#555",1.4);D.txt(30,8,"LM2596",4,"#fff");D.hdr(["IN+","IN-","OUT+","OUT-"],8,46,16,true,true);};

function build(pid,flip,opts){opts=opts||{};var P=(typeof Core!=="undefined"&&Core.PARTS&&Core.PARTS[pid]);var sz=SZ[pid]||[70,50];var D=Bd(sz[0],sz[1],!!flip);
 if(G[pid])G[pid](D);else{D.r(0,0,sz[0],sz[1],P?hex(P.col):"#455a64","#222",3);D.txt(sz[0]/2,sz[1]/2,P?P.name.slice(0,10):pid,6,"#fff");}
 return D;}
function wrap(D,inner){var w=D.w,h=D.h;return D.flip?"<g transform='rotate(180 "+w/2+" "+h/2+")'>"+D.b.join("")+"</g>"+D.t.join(""):D.b.join("")+D.t.join("");}
function drawn(pid,flip){var D=build(pid,flip);return {w:D.w,h:D.h,pins:D.pins,svg:wrap(D)};}
var cache={};
function part(pid,flip){var k=pid+(flip?"f":"");return cache[k]||(cache[k]=drawn(pid,flip));}
function has(pid){return !!G[pid];}
function svg(pid,extra){var d=part(pid);return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='-2 -2 "+(d.w+4)+" "+(d.h+4)+"' "+(extra||"")+">"+d.svg+"</svg>";}
function thumb(pid){var d=part(pid);return "<svg class='thumb' xmlns='http://www.w3.org/2000/svg' viewBox='-2 -2 "+(d.w+4)+" "+(d.h+4)+"' preserveAspectRatio='xMidYMid meet'>"+d.svg.replace(/<text[^>]*>[^<]*<\/text>/g,function(m){return /font-size='(?:[89]|1\d)/.test(m)?m:"";})+"</svg>";}
// 3D texture (top view of the board)
var texCache={};
function texture(pid,THREE){if(texCache[pid])return texCache[pid];var d=part(pid),W=Math.min(512,Math.round(d.w*4)),H=Math.round(W*d.h/d.w),c=document.createElement("canvas");c.width=W;c.height=H;var x=c.getContext("2d");x.fillStyle="#333";x.fillRect(0,0,W,H);
 var t=new THREE.CanvasTexture(c);t.anisotropy=4;texCache[pid]=t;var im=new Image();im.onload=function(){x.clearRect(0,0,W,H);x.drawImage(im,0,0,W,H);t.needsUpdate=true;};im.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 "+d.w+" "+d.h+"' width='"+W+"' height='"+H+"'>"+d.svg+"</svg>");return t;}

// ---------------- Fritzing-style wiring diagram ----------------
var WC=["#2e9b4a","#f2c200","#ff8a1f","#3a86ff","#9b59d6","#e8e8e8","#ff5ca8","#18c7c7"];
var LANE=0;function bez(a,b,col,k,dash){var dy=Math.max(14,Math.abs(b[1]-a[1])*0.45)+((LANE++)%7)*4;var sgn=b[1]>=a[1]?1:-1;return "<path d='M"+a[0]+" "+a[1]+" C"+a[0]+" "+(a[1]+sgn*dy)+" "+b[0]+" "+(b[1]-sgn*dy)+" "+b[0]+" "+b[1]+"' fill='none' stroke='"+col+"' stroke-width='1.9' stroke-linecap='round' opacity='.95'"+(dash?" stroke-dasharray='4 3'":"")+"/><circle cx='"+a[0]+"' cy='"+a[1]+"' r='1.9' fill='"+col+"'/><circle cx='"+b[0]+"' cy='"+b[1]+"' r='1.9' fill='"+col+"'/>";}
function pick(pins,name,side){var l=pins[name];if(!l||!l.length)return null;if(l.length===1)return l[0];var best=l[0];l.forEach(function(p){if(side==="top"?p[1]<best[1]:p[1]>best[1])best=p;});return best;}
var I2C={uno:["A4","A5"],nano:["A4","A5"],esp32:["GPIO21","GPIO22"],pi4:["GPIO2","GPIO3"],pico:["GP4","GP5"]};
function diagram(v,ctlId,ctlName,opts){opts=opts||{};var W=380,rows=v.wiring||[];if(!ctlId)return "";
 var C=part(ctlId),sc=Math.min(1.7,(W-30)/C.w);if(ctlId==="uno"||ctlId==="pi4")sc=Math.min(sc,1.35);
 var cw=C.w*sc,ch=C.h*sc,cx=(W-cw)/2;
 var items=rows.map(function(r,i){var pid=r.pid,flip=false,hasA=r.pins.some(function(q){return q.kind==="a";});return {r:r,pid:pid,below:hasA&&(ctlId==="uno"||ctlId==="nano"||ctlId==="esp32"||ctlId==="pico"),col:WC[i%WC.length]};});
 var drv=items.filter(function(it){return Core.PARTS[it.pid]&&Core.PARTS[it.pid].single==="driver";})[0];
 var pwr=null,mot=null;if(opts.power){pwr=opts.power;}if(opts.motors)mot=true;
 function layout(list,side){var x=8,y=0,rowH=0,gap=44,res=[],rowsH=[];list.forEach(function(it){var d=part(it.pid,side==="below"),s=Math.min(1.05,(W-16)/d.w*0.5);if(d.w*s>150)s=150/d.w;var pw=d.w*s,ph=d.h*s;if(x+pw>W-4){x=8;y+=rowH+gap;rowH=0;}it.d=d;it.s=s;it.x=x;it.ry=y;it.w=pw;it.h=ph;x+=pw+10;rowH=Math.max(rowH,ph);res.push(it);});return {items:res,h:list.length?y+rowH:0};}
 function keyX(it){var xs=[];it.r.pins.forEach(function(q){var n=q.kind==="i"?(I2C[ctlId]||[])[0]:q.pin;var l=C.pins[n]||C.pins[String(n).replace(/^GPIO/,"")];if(l&&l.length)xs.push(l[0][0]);});return xs.length?xs.reduce(function(a,b){return a+b;},0)/xs.length:C.w/2;}
 items.forEach(function(it){it.kx=keyX(it);});LANE=0;
 var up=items.filter(function(i){return !i.below;}).sort(function(a,b){return a.kx-b.kx;}),dn=items.filter(function(i){return i.below;}).sort(function(a,b){return a.kx-b.kx;});
 // battery & motors strip above the driver
 var strip=[];if(drv&&(pwr||mot)){if(pwr)strip.push({pid:pwr,kind:"pwr"});strip.push({pid:"gear",kind:"mot",n:2});}
 var LU=layout(up,"above"),LD=layout(dn,"below"),LS=layout(strip.map(function(s){return {pid:s.pid,kind:s.kind,r:{pins:[]},col:"#ddd"};}),"above");
 var top0=LS.h?LS.h+gap0():0;function gap0(){return 50;}
 var y0=top0,ctlY=y0+LU.h+(LU.items.length?58:8),ctlTop=ctlY;
 // place items (above: ry measured from the top, nearest row to controller is the LAST row)
 var s="",wires="",parts="";
 var lastRowY=LU.items.length?Math.max.apply(null,LU.items.map(function(i){return i.ry;})):0;
 LU.items.forEach(function(it){it.Y=y0+(lastRowY-it.ry)+(LU.h-lastRowY-0)-0;});
 // simpler: stack rows so row index 0 is farthest
 var rowYs=[];LU.items.forEach(function(it){if(rowYs.indexOf(it.ry)<0)rowYs.push(it.ry);});rowYs.sort(function(a,b){return a-b;});
 var rowMaxH={};LU.items.forEach(function(it){rowMaxH[it.ry]=Math.max(rowMaxH[it.ry]||0,it.h);});
 var yy=y0;rowYs.forEach(function(ry){LU.items.forEach(function(it){if(it.ry===ry)it.Y=yy;});yy+=rowMaxH[ry]+44;});
 ctlY=LU.items.length?yy+14:y0+8;
 var bel=ctlY+ch+(LD.items.length?52:8);
 var rowYs2=[],rowMaxH2={};LD.items.forEach(function(it){if(rowYs2.indexOf(it.ry)<0)rowYs2.push(it.ry);rowMaxH2[it.ry]=Math.max(rowMaxH2[it.ry]||0,it.h);});rowYs2.sort(function(a,b){return a-b;});
 var yb=bel;rowYs2.forEach(function(ry){LD.items.forEach(function(it){if(it.ry===ry)it.Y=yb;});yb+=rowMaxH2[ry]+44;});
 var H=Math.max(yb,ctlY+ch+10)+6;
 // strip placement (batteries / motors) above everything
 var sx=8;LS.items.forEach(function(it){it.Y=2;});
 // controller
 s+="<g transform='translate("+cx+" "+ctlY+") scale("+sc+")'>"+C.svg+"</g>";
 function cpin(name,side){var p=pick(C.pins,name,side);return p?[cx+p[0]*sc,ctlY+p[1]*sc]:null;}
 var ctl=Core.PARTS[ctlId],pwr5=ctl.lv===3.3?"3V3":"5V",usedPwr={};
 function ppin(it,name,side){var p=pick(it.d.pins,name,side);return p?[it.x+p[0]*it.s,it.Y+p[1]*it.s]:null;}
 function wireFor(it,side){var r=it.r,k=0;
  r.pins.forEach(function(q){var cn=null,pn=q.fn;
   if(q.kind==="i"){var ic=I2C[ctlId];if(ic){var a=ppin(it,"SDA",side),b=ppin(it,"SCL",side),ca=cpin(ic[0],side),cb=cpin(ic[1],side);if(a&&ca)wires+=bez(ca,a,"#3a86ff");if(b&&cb)wires+=bez(cb,b,"#f2c200");}return;}
   var pp=ppin(it,pn,side)||ppin(it,"SIG",side)||ppin(it,"OUT",side)||ppin(it,"AOUT",side)||ppin(it,"DOUT",side)||ppin(it,"DATA",side)||ppin(it,"+",side),cp=cpin(String(q.pin).replace(/^GPIO/,"GPIO"),side);
   if(!cp&&q.pin&&q.pin!=="—")cp=cpin(q.pin,side);
   if(pp&&cp)wires+=bez(cp,pp,WC[(WC.indexOf(it.col)+k++)%WC.length]);});
  // power
  var vcc=ppin(it,"VCC",side)||ppin(it,"VCC",side),gnd=ppin(it,"GND",side)||ppin(it,"-",side),cv=cpin(pwr5,side)||cpin("5V",side)||cpin("3V3",side),cg=cpin("GND",side);
  var pv=Core.PARTS[it.pid];if(vcc&&cv)wires+=bez(cv,vcc,"#e53935");if(gnd&&cg)wires+=bez(cg,gnd,"#111","","");};
 LU.items.forEach(function(it){var t=0;parts+="<g transform='translate("+it.x+" "+it.Y+") scale("+it.s+")'>"+it.d.svg+"</g><text x='"+(it.x+it.w/2)+"' y='"+(it.Y-3)+"' font-size='7' fill='#334155' text-anchor='middle' font-family='Arial'>"+(it.r.name||"").replace(/&/g,"&amp;").slice(0,24)+"</text>";wireFor(it,"top");});
 LD.items.forEach(function(it){parts+="<g transform='translate("+it.x+" "+it.Y+") scale("+it.s+")'>"+it.d.svg+"</g><text x='"+(it.x+it.w/2)+"' y='"+(it.Y+it.h+9)+"' font-size='7' fill='#334155' text-anchor='middle' font-family='Arial'>"+(it.r.name||"").replace(/&/g,"&amp;").slice(0,24)+"</text>";wireFor(it,"bottom");});
 // battery & motors to the driver terminals
 if(drv&&LS.items.length){var dit=drv,bx=LS.items[0];
  LS.items.forEach(function(it,ix){var x=8+ix*(130);it.x=x;parts+="<g transform='translate("+it.x+" "+it.Y+") scale("+it.s+")'>"+it.d.svg+"</g>";});
  var bt=LS.items.filter(function(i){return i.kind==="pwr";})[0],mt=LS.items.filter(function(i){return i.kind==="mot";})[0];
  function dp(n){var p=pick(dit.d.pins,n,"top");return p?[dit.x+p[0]*dit.s,dit.Y+p[1]*dit.s]:null;}
  if(bt){var bp=pick(bt.d.pins,"+","top"),bm=pick(bt.d.pins,"-","top");var P=dp("12V")||dp("VM")||dp("VCC"),Gp=dp("GND");if(bp&&P)wires+=bez([bt.x+bp[0]*bt.s,bt.Y+bp[1]*bt.s],P,"#e53935");if(bm&&Gp)wires+=bez([bt.x+bm[0]*bt.s,bt.Y+bm[1]*bt.s],Gp,"#111");}
  if(mt){var m1=pick(mt.d.pins,"M+","top"),m2=pick(mt.d.pins,"M-","top");var o1=dp("OUT1")||dp("M1A")||dp("A01"),o2=dp("OUT2")||dp("M1B")||dp("A02");if(m1&&o1)wires+=bez([mt.x+m1[0]*mt.s,mt.Y+m1[1]*mt.s],o1,"#e53935");if(m2&&o2)wires+=bez([mt.x+m2[0]*mt.s,mt.Y+m2[1]*mt.s],o2,"#111");}
 }
 H=Math.max(H,ctlY+ch+10);
 return "<svg viewBox='0 0 "+W+" "+(H+6)+"' width='100%' xmlns='http://www.w3.org/2000/svg' font-family='Arial,sans-serif' style='background:#e8edf2;border-radius:10px'>"+parts+s+wires+"<text x='"+(W/2)+"' y='"+(ctlY+ch+(dn.length?0:12))+"' font-size='0' fill='#000'></text></svg>";}
return {part:part,svg:svg,thumb:thumb,has:has,texture:texture,diagram:diagram,SZ:SZ};
})();
