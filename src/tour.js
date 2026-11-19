// ===== Guided tour: a short, friendly walk through every tab for people new to robotics =====
(function(){
var $=function(id){return document.getElementById(id);};
var S=[
 {t:"Robotics in one minute",tab:"play",b:"A robot has <b>sensors</b> (eyes and ears: they measure), a <b>controller</b> (the brain: it runs your program) and <b>motors</b> (the legs and hands: they move). You write the instructions. Here, a virtual robot follows them, so you can test safely and fix mistakes in seconds."},
 {t:"Missions: learn by doing",tab:"play",b:"Pick a mission and tap blocks to build a program, then press <b>Run</b>. No blocks? Switch to <b>Python</b>, or tell <b>Mila</b> what you want. Stuck? Mila gives a <b>Hint</b>, not the answer. Finish with few blocks to earn 3 stars."},
 {t:"Build: design your own robot",tab:"build",b:"Choose a body, then add a controller, power, motor driver, sensors and tools. The checklist tells you what is missing and why a part will not work, just like real engineering. Give it a name and <b>Save</b>. New to building? Tap <b>Guided Build</b> at the top for a 10-step rover with 3D, wiring, code and a test drive."},
 {t:"Circuits: electronics without wires",tab:"circuits",b:"Place a battery, resistor and LED on a breadboard and press <b>Check my circuit</b>. Switch to <b>Arduino Uno</b> or <b>ESP32</b> to program what the circuit does. Phone tricks: Echo sonar measures distance, and the camera can act as a light sensor."},
 {t:"Code: see the real thing",tab:"codetab",b:"Your blocks become real Arduino or Python code here. Copy it, share it with a friend, or download sketches to run on a real robot."},
 {t:"Club: your progress",tab:"club",b:"See your stars and scores, swap score codes with friends, send a progress report to your teacher, and download a printable portfolio with your certificate."},
 {t:"Class: for school",tab:"classroom",b:"Learners join with the <b>class code</b> from their teacher. Teachers create a class, run timed competitions, watch a live board and print certificates."},
 {t:"Link: drive it live",tab:"mmcr",b:"Drive a virtual robot or drone with a joystick or by tilting your phone. Use a second phone as the controller, or connect a real ESP32 robot or LEGO hub with Bluetooth."},
 {t:"Projects: make your own",tab:"projects",b:"Invent something, give it a name, and <b>Save</b>. Publish it to your class gallery and try your classmates' ideas. Your teacher may set a class challenge here."},
 {t:"You are ready",tab:"play",b:"Start with <b>Mission 1</b>: one block, one Run. Tap the <b>?</b> at the top any time to see the welcome card or restart this tour.",last:true}
];
var i=0,card=null;
function glow(tab){[].forEach.call(document.querySelectorAll("#tabs button"),function(b){var on=!!tab&&b.dataset.tab===tab;b.classList.toggle("tourhi",on);if(on){var n=b.parentNode;try{n.scrollLeft=b.offsetLeft-(n.clientWidth-b.offsetWidth)/2;}catch(e){}}});}
function esc(s){return s;}
function draw(){
  var s=S[i];try{window.MM.showTab(s.tab);}catch(e){}
  if(!card){card=document.createElement("div");card.id="tourCard";card.setAttribute("role","dialog");card.setAttribute("aria-live","polite");document.body.appendChild(card);}
  var dots="";for(var k=0;k<S.length;k++)dots+="<i"+(k===i?" class='on'":"")+"></i>";
  card.innerHTML="<div class='tdots'>"+dots+"</div><h3>"+s.t+"</h3><p>"+s.b+"</p><div class='trow'>"+(i>0?"<button data-t='back'>Back</button>":"<button data-t='skip'>Skip</button>")+"<button class='p' data-t='next'>"+(s.last?"Start Mission 1":"Next")+"</button></div>"+(i>0&&!s.last?"<a href='#' data-t='skip'>Skip tour</a>":"");
  card.style.display="block";glow(i>0?s.tab:null);if(i===0)glow(null);
  var nb=card.querySelector("[data-t=next]");try{nb.focus({preventScroll:true});}catch(e){}
}
function end(go){if(card)card.style.display="none";glow(null);try{localStorage.setItem("mm_tour","1");}catch(e){}if(go){try{window.MM.showTab("play");window.MM.setLevel(0);}catch(e){}}}
function start(){var w=$("welcome");if(w)w.classList.remove("on");try{localStorage.setItem("mm_seen","1");}catch(e){}i=0;draw();}
function init(){
  var w=$("welcome");if(!w)return;
  var go=$("wGo");if(go&&!$("wTour")){var b=document.createElement("button");b.id="wTour";b.textContent="🧭 Take the 2-minute tour";go.parentNode.insertBefore(b,go);}
  $("wTour").onclick=start;
  document.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest("[data-t]");if(!b||!card||!card.contains(b))return;e.preventDefault();var a=b.dataset.t;
    if(a==="next"){if(S[i].last){end(true);}else{i++;draw();}}else if(a==="back"){i=Math.max(0,i-1);draw();}else end(false);});
  document.addEventListener("keydown",function(e){if(e.key==="Escape"&&card&&card.style.display==="block")end(false);});
  ["play","club","classroom"].forEach(function(id){var v=$(id);if(!v||v.querySelector(".tourbtn"))return;var b=document.createElement("button");b.className="tourbtn";b.textContent="🧭 New here? Take the 2-minute tour";b.onclick=start;v.insertBefore(b,v.firstChild);});
  window.MM_tour={start:start,end:end};
}
init();
})();
