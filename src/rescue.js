// Rescue Run: a deterministic arena mission. The browser and the server run THIS code, so the server can replay a
// learner's recorded drive (run-length list of [ticks,left,right]) and verify checkpoints, time and collisions.
var Rescue=(function(){
var DT=0.02,MAXT=3000,B=[[0,0,320,6],[0,314,320,6],[0,0,6,320],[314,0,6,320]];
var ARENAS=[
 {id:"run",name:"Rescue Run",tier:"Intermediate",par:30,start:[160,260,-90],walls:B.concat([[90,120,110,10],[200,190,10,80],[40,200,70,10]]),cps:[[60,250],[30,150],[260,60]]},
 {id:"maze",name:"Rescue Maze",tier:"Advanced",par:45,start:[110,280,-90],walls:B.concat([[70,70,10,150],[140,100,10,214],[210,6,10,170]]),cps:[[110,150],[180,250],[270,60]]},
 {id:"slalom",name:"Rescue Slalom",tier:"Intermediate",par:35,start:[40,280,-90],walls:B.concat([[80,6,12,200],[160,114,12,200],[240,6,12,200]]),cps:[[125,250],[200,250],[285,60]]}];
var WALLS=ARENAS[0].walls,CPS=ARENAS[0].cps,CR=18,NAMES=["Checkpoint 1: pick up supplies","Checkpoint 2: reach the survivor","Goal: deliver to the rescue zone"];
function arenaOf(id){if(id&&typeof id==="object"&&id.walls)return id;for(var i=0;i<ARENAS.length;i++)if(ARENAS[i].id===id||i===id)return ARENAS[i];return ARENAS[0];}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function hits(x,y,W){for(var i=0;i<W.length;i++){var w=W[i];if(x+7>w[0]&&x-7<w[0]+w[2]&&y+7>w[1]&&y-7<w[1]+w[3])return true;}return false;}
function Sim(ar){ar=arenaOf(ar);this.ar=ar;this.x=ar.start[0];this.y=ar.start[1];this.a=ar.start[2];this.cp=0;this.n=0;this.hits=0;this.bump=false;this.done=false;this.log=[];}
Sim.prototype.step=function(l,r){if(this.done)return;l=clamp(Math.round(+l||0),-100,100);r=clamp(Math.round(+r||0),-100,100);
 var g=this.log,e=g.length?g[g.length-1]:null;if(e&&e[1]===l&&e[2]===r)e[0]++;else g.push([1,l,r]);
 var ls=l/100*90,rs=r/100*90,v=(ls+rs)/2,om=(ls-rs)/28;this.a+=om*DT*180/Math.PI;var ar=this.a*Math.PI/180,nx=this.x+Math.cos(ar)*v*DT,ny=this.y+Math.sin(ar)*v*DT;
 if(hits(nx,ny,this.ar.walls)){if(!this.bump){this.hits++;this.bump=true;}}else{this.x=nx;this.y=ny;this.bump=false;}
 this.n++;var c=this.ar.cps[this.cp];if(c&&Math.hypot(this.x-c[0],this.y-c[1])<CR){this.cp++;if(this.cp>=this.ar.cps.length)this.done=true;}};
Sim.prototype.t=function(){return this.n*DT;};
function sanitize(log){if(!Array.isArray(log)||log.length>800)return null;var out=[],tot=0;for(var i=0;i<log.length;i++){var e=log[i];if(!Array.isArray(e)||e.length!==3)return null;var k=Math.floor(+e[0]),l=+e[1],r=+e[2];if(!(k>=1&&k<=MAXT)||!isFinite(l)||!isFinite(r))return null;tot+=k;if(tot>MAXT)return null;out.push([k,clamp(Math.round(l),-100,100),clamp(Math.round(r),-100,100)]);}return out;}
function replay(log,ar){var s=new Sim(ar);for(var i=0;i<log.length&&!s.done;i++)for(var k=0;k<log[i][0]&&!s.done;k++)s.step(log[i][1],log[i][2]);return s;}
function rate(s){var ok=s.done,st=ok?1:0;if(ok&&s.hits<=3)st++;if(ok&&s.hits<=1&&s.t()<=s.ar.par)st++;return {ok:ok,stars:st};}
function evaluate(d){var log=sanitize(d&&d.log);if(!log)return {ok:false,t:"Invalid drive log."};var ar=arenaOf(d&&d.arena),s=replay(log,ar),r=rate(s);
 var t="Verified in the arena: "+s.cp+" of "+ar.cps.length+" stops, "+s.hits+" wall hit"+(s.hits===1?"":"s")+", "+s.t().toFixed(1)+" s. ";
 if(d&&d.phys&&typeof d.phys==="object"){var pt=+d.phys.t;t+="Physical run reported: "+(d.phys.ok?"completed":"not completed")+(isFinite(pt)&&pt>0?" in "+Math.min(pt,9999).toFixed(1)+" s":"")+" (teacher to confirm). ";}
 if(!r.ok)t+="The robot has not finished all three stops yet.";else t+=(r.stars<3?"3 stars: at most 1 wall hit and under "+ar.par+" s.":"Excellent run!");
 return {ok:r.ok,stars:r.stars,t:t,tier:ar.tier,name:ar.name,time:s.t()};}
return {ARENAS:ARENAS,arenaOf:arenaOf,Sim:Sim,replay:replay,rate:rate,evaluate:evaluate,sanitize:sanitize,WALLS:WALLS,CPS:CPS,CR:CR,NAMES:NAMES,DT:DT};
})();
if(typeof module!=="undefined")module.exports=Rescue;
