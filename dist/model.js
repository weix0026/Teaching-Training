(function(root){
'use strict';
const stands=[{id:'A',age:50,risk:1},{id:'B',age:60,risk:1},{id:'C',age:40,risk:1},{id:'D',age:50,risk:.25},{id:'E',age:60,risk:.25},{id:'F',age:40,risk:.25}];
const plans=[];for(let i=0;i<6;i++)for(let j=i+1;j<6;j++)plans.push([i,j]);
function rng(seed){let a=seed>>>0;return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function scenarios(n,p,seed){const random=rng(seed);return Array.from({length:n},()=>Array.from({length:10},()=>stands.map(s=>random()<p*s.risk)));}
const volume=age=>100*Math.min(4*age,360);
function simulate(plan,fires,trace=false){let ages=stands.map(s=>s.age),total=0;const decades=[];for(let t=0;t<10;t++){const before=ages.slice();const cut=t===0?plan.slice():ages.map((a,i)=>({a,i})).filter(s=>s.a>=40).sort((a,b)=>b.a-a.a||a.i-b.i).slice(0,2).map(s=>s.i);const harvest=cut.reduce((sum,i)=>sum+volume(ages[i]),0);total+=harvest;cut.forEach(i=>ages[i]=0);const lost=fires[t].reduce((sum,b,i)=>sum+(b?volume(ages[i]):0),0);ages=ages.map((a,i)=>(fires[t][i]?0:a)+10);if(trace)decades.push({t,before,cut,fires:fires[t].slice(),harvest,lost,after:ages.slice(),total});}return trace?{total,decades}:total;}
function fit(paths){const scores=plans.map(plan=>paths.reduce((s,path)=>s+simulate(plan,path),0)/paths.length);let best=0;for(let i=1;i<scores.length;i++)if(scores[i]>scores[best]+1e-8)best=i;return {plan:plans[best].slice(),score:scores[best],scores};}
function stats(values,target){const mean=values.reduce((s,v)=>s+v,0)/values.length,sorted=values.slice().sort((a,b)=>a-b);return {mean,p10:sorted[Math.floor(.1*(sorted.length-1))],success:values.filter(v=>v>=target).length/values.length};}
function compare(det,saa,paths,target){const a=paths.map(s=>simulate(det,s)),b=paths.map(s=>simulate(saa,s)),diff=b.map((v,i)=>v-a[i]);const mean=diff.reduce((s,v)=>s+v,0)/diff.length,variance=diff.reduce((s,v)=>s+(v-mean)**2,0)/(diff.length-1),se=Math.sqrt(variance/diff.length);return {a,b,diff,det:stats(a,target),saa:stats(b,target),gain:mean,ci:[mean-1.96*se,mean+1.96*se],wins:diff.filter(d=>d>0).length/diff.length,ties:diff.filter(d=>d===0).length/diff.length};}
const api={stands,plans,rng,scenarios,volume,simulate,fit,stats,compare};if(typeof module!=='undefined')module.exports=api;else root.ForestModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
