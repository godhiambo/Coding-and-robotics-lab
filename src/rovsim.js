// ===== RovSim: a small, honest physics model of a 2-wheel rover car (battery, driver, motors, tyres, sonar) =====
// Pure JS, no DOM. Units: metres, seconds, volts, amps. x/y plane, theta counter-clockwise from +x.
var RovSim=(function(){
var P={track:0.14,radius:0.1,kv:0.11,motorR:4.0,drop:2.0,vStart:1.6,vStartTurn:2.4,tau:0.15,scrub:0.85,brown:6.5,
  idleI:0.06,sonarMax:4.0,sonarMin:0.02,cone:15};
var ARENA=3.0;
function arenaObstacles(){return [{x:1.05,y:1.0,w:0.3,h:0.3},{x:1.9,y:1.9,w:0.35,h:0.25},{x:0.4,y:2.0,w:0.25,h:0.6},{x:2.3,y:0.5,w:0.25,h:0.25},{x:1.2,y:2.55,w:0.9,h:0.12}];}
function Sim(opt){
  opt=opt||{};
  this.t=0;this.x=0.4;this.y=0.4;this.th=0.785;this.vL=0;this.vR=0;
  this.cmdL=0;this.cmdR=0;this.servo=90;this.led=false;this.buzz=false;
  this.tired=!!opt.tired;this.weak=!!opt.weak;this.obs=opt.obstacles||arenaObstacles();
  this.volt=this.v0();this.amps=0;this.resetT=0;this.resets=0;this.stalled=false;
  this.log=[];this.mode="manual";this.auto=null;this.dist=0;this._sonarT=0;this.distTrue=4;this._logT=0;this.manualSpeed=0.7;
  this.hist=[];this.bootT=0;
}
Sim.prototype.v0=function(){return this.tired?7.0:8.2;};
Sim.prototype.rint=function(){return this.tired?0.7:0.3;};
Sim.prototype.say=function(s){this.log.push("["+this.t.toFixed(1)+"s] "+s);if(this.log.length>60)this.log.shift();};
Sim.prototype.setMode=function(m){this.mode=m;this.cmdL=this.cmdR=0;this.auto=null;if(m==="auto"){this.auto={s:"boot",t:2,last:0,turns:0,lastDir:0,since:this.t,ref:0,refT:this.t};this.say("Auto: starting in 2 s");}};
function clamp(v,a,b){return v<a?a:v>b?b:v;}
function sgn(v){return v<0?-1:1;}
// ray vs axis-aligned box; returns distance or Infinity
function rayBox(ox,oy,dx,dy,b){
  var t0=0,t1=1e9,mn=[b.x,b.y],mx=[b.x+b.w,b.y+b.h],o=[ox,oy],d=[dx,dy];
  for(var i=0;i<2;i++){
    if(Math.abs(d[i])<1e-9){if(o[i]<mn[i]||o[i]>mx[i])return Infinity;}
    else{var a=(mn[i]-o[i])/d[i],c=(mx[i]-o[i])/d[i];if(a>c){var q=a;a=c;c=q;}t0=Math.max(t0,a);t1=Math.min(t1,c);if(t0>t1)return Infinity;}
  }
  return t0;
}
Sim.prototype.ray=function(ang){
  var dx=Math.cos(ang),dy=Math.sin(ang),best=Infinity,i;
  var walls=[{x:-1,y:-1,w:ARENA+2,h:1},{x:-1,y:ARENA,w:ARENA+2,h:1},{x:-1,y:-1,w:1,h:ARENA+2},{x:ARENA,y:-1,w:1,h:ARENA+2}];
  var all=walls.concat(this.obs);
  for(i=0;i<all.length;i++){var d=rayBox(this.x,this.y,dx,dy,all[i]);if(d<best)best=d;}
  return best;
};
// what a HC-SR04 on the servo head reports: nearest echo in a narrow cone; 0 when nothing comes back
Sim.prototype.sonar=function(){
  var base=this.th+(this.servo-90)*Math.PI/180,best=Infinity,k;
  for(k=-2;k<=2;k++){var d=this.ray(base+k*P.cone/2*Math.PI/180);if(d<best)best=d;}
  best-=0.05;
  this.distTrue=best;
  if(best>P.sonarMax||best<P.sonarMin)return 0;
  return Math.round((best*100+(Math.random()-0.5)*0.6)*10)/10;
};
Sim.prototype.electrics=function(dtv){
  var L=this.cmdL,R=this.cmdR,V=this.v0(),i,I=0,vb=V;
  for(i=0;i<3;i++){
    var vmL=Math.abs(L)*Math.max(0,vb-P.drop),vmR=Math.abs(R)*Math.max(0,vb-P.drop);
    var fL=P.kv*vmL,fR=P.kv*vmR*(this.weak?0.93:1);
    var sL=fL>0?clamp(Math.abs(this.vL)/fL,0,1):0,sR=fR>0?clamp(Math.abs(this.vR)/fR,0,1):0;
    var iL=Math.abs(L)>0.02?(vmL/P.motorR)*(1-sL)+P.idleI:0,iR=Math.abs(R)>0.02?(vmR/P.motorR)*(1-sR)+P.idleI:0;
    I=iL+iR+0.12;vb=V-I*this.rint();
  }
  this.amps=I;this.volt=vb;
};
Sim.prototype.drive=function(dt){
  var L=this.cmdL,R=this.cmdR,turning=L*R<0;
  var vb=this.volt,vmL=Math.abs(L)*Math.max(0,vb-P.drop),vmR=Math.abs(R)*Math.max(0,vb-P.drop);
  var thr=turning?P.vStartTurn:P.vStart;
  var tL=vmL<thr?0:sgn(L)*P.kv*vmL,tR=vmR<thr?0:sgn(R)*P.kv*vmR*(this.weak?0.93:1);
  if(turning){tL*=P.scrub;tR*=P.scrub;}
  var a=1-Math.exp(-dt/P.tau);
  this.vL+=(tL-this.vL)*a;this.vR+=(tR-this.vR)*a;
  var v=(this.vL+this.vR)/2,w=(this.vR-this.vL)/P.track;
  var nx=this.x+Math.cos(this.th)*v*dt,ny=this.y+Math.sin(this.th)*v*dt;
  this.th+=w*dt;
  var hit=this.collide(nx,ny);
  this.stalled=hit&&Math.abs(v)>0.02||(hit&&(Math.abs(L)>0.2||Math.abs(R)>0.2)&&Math.abs(v)<0.02);
  if(hit&&(L>0.1&&R>0.1||L<-0.1&&R<-0.1)){this.vL*=0.2;this.vR*=0.2;}
};
Sim.prototype.collide=function(nx,ny){
  var r=P.radius,hit=false,i;
  var lo=r,hi=ARENA-r;
  if(nx<lo){nx=lo;hit=true;}if(nx>hi){nx=hi;hit=true;}if(ny<lo){ny=lo;hit=true;}if(ny>hi){ny=hi;hit=true;}
  for(i=0;i<this.obs.length;i++){
    var b=this.obs[i],cx=clamp(nx,b.x,b.x+b.w),cy=clamp(ny,b.y,b.y+b.h),dx=nx-cx,dy=ny-cy,d2=dx*dx+dy*dy;
    if(d2<r*r){hit=true;if(d2>1e-9){var d=Math.sqrt(d2);nx=cx+dx/d*r;ny=cy+dy/d*r;}else{ny=b.y-r;}}
  }
  this.x=nx;this.y=ny;return hit;
};
// the obstacle-avoider routine, written as a state machine (same behaviour as the sketch the learner uploads)
Sim.prototype.autoStep=function(dt){
  var A=this.auto;if(!A)return;
  var d=this.dist,eff=d===0?400:d,self=this;
  function go(l,r){self.cmdL=l;self.cmdR=r;}
  A.t-=dt;
  switch(A.s){
    case "boot":go(0,0);if(A.t<=0){A.s="drive";this.say("Auto: driving");A.ref=eff;A.refT=this.t;}break;
    case "drive":
      go(0.62,0.62);
      if(eff<22){go(0,0);A.s="alert";A.t=0.4;this.led=true;this.buzz=true;this.say("Obstacle at "+eff.toFixed(0)+" cm: stop");break;}
      if(this.t-A.refT>1.2){if(Math.abs(eff-A.ref)<1.5&&Math.abs((this.vL+this.vR)/2)<0.05){A.s="back";A.t=0.6;this.say("Stuck: backing up");}A.ref=eff;A.refT=this.t;}
      break;
    case "alert":go(0,0);if(A.t<=0){this.led=false;this.buzz=false;A.s="lookR";A.t=0.7;this.servo=20;}break;
    case "lookR":go(0,0);if(A.t<=0){A.right=eff;A.s="lookL";A.t=0.9;this.servo=160;}break;
    case "lookL":go(0,0);if(A.t<=0){A.left=eff;A.s="center";A.t=0.6;this.servo=90;}break;
    case "center":go(0,0);if(A.t<=0){
      var dir=A.right>A.left?-1:1;
      if(A.right===A.left)dir=A.lastDir||-1;
      if(this.t-A.since<2.5&&A.lastDir)dir=A.lastDir;
      A.lastDir=dir;A.since=this.t;A.target=this.th+dir*Math.PI/2;A.dir=dir;A.s="turn";A.t=2.5;
      this.say("Room: right "+A.right.toFixed(0)+" cm, left "+A.left.toFixed(0)+" cm: turn "+(dir<0?"right":"left"));}break;
    case "turn":
      go(-A.dir*0.8,A.dir*0.8);
      var diff=A.target-this.th;
      if(A.dir*diff<0.06||A.t<=0){go(0,0);A.s="drive";A.ref=400;A.refT=this.t;this.say("Auto: driving");}
      break;
    case "back":go(-0.6,-0.6);if(A.t<=0){go(0,0);A.s="alert";A.t=0.3;}break;
  }
};
Sim.prototype.step=function(dt){
  this.t+=dt;
  if(this.resetT>0){
    this.resetT-=dt;this.cmdL=this.cmdR=0;this.vL*=0.8;this.vR*=0.8;this.led=false;this.buzz=false;
    this.electrics(dt);this.drive(dt);
    if(this.resetT<=0){this.say("Controller restarted");if(this.mode==="auto"){this.auto={s:"boot",t:2,last:0,turns:0,lastDir:0,since:this.t,ref:0,refT:this.t};}this.servo=90;}
    return;
  }
  this._sonarT-=dt;if(this._sonarT<=0){this.dist=this.sonar();this._sonarT=0.1;}
  if(this.mode==="auto")this.autoStep(dt);
  this.electrics(dt);
  if(this.volt<P.brown&&(Math.abs(this.cmdL)>0.05||Math.abs(this.cmdR)>0.05)){
    this.resets++;this.resetT=1.5;this.say("RESET: supply dipped to "+this.volt.toFixed(1)+" V (needs "+P.brown.toFixed(1)+" V)");this.cmdL=this.cmdR=0;
    return;
  }
  this.drive(dt);
  this._logT-=dt;if(this._logT<=0){this._logT=1;if(this.mode==="manual")this.say("Distance: "+(this.dist?this.dist.toFixed(1)+" cm":"no echo (clear)"));}
};
return {Sim:Sim,P:P,ARENA:ARENA,arenaObstacles:arenaObstacles};
})();
if(typeof module!=="undefined")module.exports=RovSim;
