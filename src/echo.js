// Echo sonar DSP: chirp, matched filter, echo search. Pure functions (also tested in Node).
var Echo=(function(){
function chirp(sr,f0,f1,ms){var n=Math.round(sr*ms/1000),c=new Float32Array(n),T=n/sr,k=(f1-f0)/T;
 for(var i=0;i<n;i++){var t=i/sr,w=0.5-0.5*Math.cos(2*Math.PI*i/(n-1));c[i]=Math.sin(2*Math.PI*(f0*t+0.5*k*t*t))*w;}return c;}
// quadrature copy (90 degree shifted) so the envelope is smooth: |corr_I + i*corr_Q|
function chirpQ(sr,f0,f1,ms){var n=Math.round(sr*ms/1000),c=new Float32Array(n),T=n/sr,k=(f1-f0)/T;
 for(var i=0;i<n;i++){var t=i/sr,w=0.5-0.5*Math.cos(2*Math.PI*i/(n-1));c[i]=Math.cos(2*Math.PI*(f0*t+0.5*k*t*t))*w;}return c;}
function envelope(rec,ci,cq){var N=rec.length-ci.length,M=ci.length,out=new Float32Array(Math.max(0,N));
 for(var i=0;i<N;i++){var a=0,b=0;for(var j=0;j<M;j++){var x=rec[i+j];a+=x*ci[j];b+=x*cq[j];}out[i]=Math.sqrt(a*a+b*b);}return out;}
function argmax(a,from,to){var bi=from,bv=-1;for(var i=from;i<to&&i<a.length;i++)if(a[i]>bv){bv=a[i];bi=i;}return bi;}
function median(a){var s=Array.prototype.slice.call(a).sort(function(x,y){return x-y;});return s.length?s[s.length>>1]:0;}
// rec: Float32Array recorded after trigger (speaker->mic direct sound is the loudest peak; echoes are measured relative to it, so audio latency cancels).
// Returns {ok, cm, d0, env(aligned from direct peak), peak, noise}
function measure(rec,sr,c,opt,ci,cq){opt=opt||{};var minCm=opt.minCm||15,maxCm=opt.maxCm||300,sens=opt.sens||6;
 var env=envelope(rec,ci,cq),d0=argmax(env,0,env.length);
 var lag=function(cm){return Math.round(cm/100*2/c*sr);},a=d0+lag(minCm),b=Math.min(env.length,d0+lag(maxCm)+1);
 if(b-a<8)return {ok:false,why:"short",d0:d0};
 var res=new Float32Array(b-a);for(var i=a;i<b;i++)res[i-a]=env[i];
 var noise=median(res)+1e-9,pk=argmax(res,0,res.length),pv=res[pk];
 // prefer the FIRST strong peak: walk up from the start to the earliest local max above 60% of the best
 var thr=pv*0.6,first=pk;for(var k=1;k<pk;k++){if(res[k]>=thr&&res[k]>=res[k-1]&&res[k]>=res[k+1]){first=k;break;}}
 var li=a+first-d0,cm=li/sr*c/2*100;
 var ok=pv>noise*sens&&pv>0.003*env[d0];
 return {ok:ok,cm:cm,d0:d0,peak:pv,noise:noise,env:env,res:res,a:a,first:first,direct:env[d0]};}
function speedOfSound(tC){return 331.3+0.606*tC;}
return {chirp:chirp,chirpQ:chirpQ,measure:measure,speedOfSound:speedOfSound,envelope:envelope};
})();
if(typeof module!=="undefined")module.exports=Echo;
