'use strict';
// Symmetric, degree-one CES. The limits are evaluated explicitly.
function production(p,s,sigma){
  if(sigma===0)return Math.min(p,s);
  if(sigma===Infinity)return (p+s)/2;
  if(sigma===1)return Math.sqrt(p*s);
  const rho=(sigma-1)/sigma;
  if(p===0||s===0){if(rho<0)return 0;return Math.pow(.5*Math.pow(p||s,rho),1/rho);}
  // Log-sum-exp avoids overflow near the complements limit.
  const a=rho*Math.log(p),b=rho*Math.log(s),m=Math.max(a,b);
  return Math.exp((m+Math.log((Math.exp(a-m)+Math.exp(b-m))/2))/rho);
}
function isoPoints(q,sigma){
  if(sigma===0)return [[q,100],[q,q],[100,q]];
  if(sigma===Infinity)return [[0,2*q],[2*q,0]];
  const pts=[];
  // Parameterize rays; homogeneity maps each ray exactly onto the isoquant.
  for(let i=0;i<=600;i++){
    const t=i/600*Math.PI/2,p=i===600?0:Math.cos(t),s=i===0?0:Math.sin(t),v=production(p,s,sigma);
    if(v>0){const x=q*p/v,y=q*s/v;if(x<10000&&y<10000)pts.push([x,y]);}
  }
  return pts;
}
const $=id=>document.getElementById(id);
const state={sigma:1,p:50,s:50,target:40,yaw:-.72,pitch:.56};
const fmt=x=>Number.isFinite(x)?x.toFixed(x%1?2:0):'∞';
const canvas=$('surface'),ctx=canvas.getContext('2d');
const descriptions={
  complements:['Perfect complements','Both investments are needed together.','The L-shaped isoquants show a bottleneck: increasing only the larger input adds no output. More preparedness cannot compensate for suppression below the required level.'],
  low:['Low substitution','A shortage of either input is costly.','Strongly curved isoquants favor balanced input mixes. Replacing scarce preparedness with suppression requires increasingly large additions of suppression.'],
  cobb:['Cobb–Douglas','Balanced inputs, flexible trade-offs.','Both inputs are essential. You can trade one for the other along an isoquant, but the input you give up becomes harder to replace as it gets scarce.'],
  high:['High substitution','More room to change the investment mix.','Flatter isoquants mean the two inputs can replace each other more readily. Compared with Cobb–Douglas, an uneven mix produces more output with these equal weights.'],
  substitutes:['Perfect substitutes','Only the combined investment matters.','Straight isoquants imply a constant trade-off: one unit of preparedness replaces one unit of suppression. Any mix with the same total investment produces the same output.']
};
function render(){
  const {sigma,p,s,target}=state,q=production(p,s,sigma);
  $('pValue').value=p;$('sValue').value=s;$('preparedness').value=p;$('suppression').value=s;
  $('sigmaValue').value=fmt(sigma);$('sigmaBadge').textContent=sigma===Infinity?'σ → ∞':`σ = ${fmt(sigma)}`;
  $('qValue').innerHTML=`${q.toFixed(1)} <small>Q</small>`;$('mixNote').textContent=`P = ${p}  ·  S = ${s}`;
  $('targetValue').value=`Q = ${target}`;
  document.querySelectorAll('[data-sigma]').forEach(b=>{const active=Number(b.dataset.sigma)===sigma;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);});
  const key=sigma===0?'complements':sigma===Infinity?'substitutes':sigma===1?'cobb':sigma<1?'low':'high';
  const d=descriptions[key];$('technology').textContent=d[0];$('insightTitle').textContent=d[1];$('insightText').textContent=d[2];
  const formula=sigma===0?'Q = min(P, S)':sigma===Infinity?'Q = ½P + ½S':sigma===1?'Q = P<sup>½</sup>S<sup>½</sup>':'Q = [½P<sup>ρ</sup> + ½S<sup>ρ</sup>]<sup>1/ρ</sup>';
  $('formula').innerHTML=formula;
  $('formulaDetail').textContent=sigma===0?'Leontief limit: output is determined by the smaller investment.':sigma===Infinity?'Linear limit: the two inputs replace each other one for one.':sigma===1?'Cobb–Douglas limit: output is the geometric mean of the inputs.':`CES with ρ = (σ − 1) / σ = ${((sigma-1)/sigma).toFixed(3)}. Equal weights: ½ on each input.`;
  drawIso();drawSurface();
}
function drawIso(){
  const X=x=>58+3.55*x,Y=y=>333-2.8*y;
  let html='<defs><clipPath id="plotClip"><rect x="58" y="53" width="355" height="280"/></clipPath></defs>';
  for(let t=0;t<=100;t+=20){html+=`<path d="M${X(t)} 53V333 M58 ${Y(t)}H413" stroke="#e2e8de" fill="none"/><text x="${X(t)}" y="352" text-anchor="middle" class="tick">${t}</text><text x="47" y="${Y(t)+4}" text-anchor="end" class="tick">${t}</text>`;}
  html+='<path d="M58 53V333H413" stroke="#97aa98" fill="none"/><text x="235" y="378" text-anchor="middle" class="axis">Preparedness investment (P)</text><text transform="translate(16 193) rotate(-90)" text-anchor="middle" class="axis">Suppression investment (S)</text>';
  html+='<g clip-path="url(#plotClip)">';
  for(const q of [20,40,60,80].filter(q=>q!==state.target)){
    const pts=isoPoints(q,state.sigma);html+=`<path d="${path(pts,X,Y)}" fill="none" stroke="#82a48e" stroke-width="1.5"/>`;
  }
  const targetPts=isoPoints(state.target,state.sigma);
  html+=`<path d="${path(targetPts,X,Y)}" fill="none" stroke="#be8125" stroke-width="3"/>`;
  html+=`<path d="M${X(state.p)} 333V${Y(state.s)}H58" stroke="#cc9277" stroke-dasharray="4 4" fill="none"/><circle cx="${X(state.p)}" cy="${Y(state.s)}" r="6" fill="#dc8057" stroke="white" stroke-width="2"/></g>`;
  for(const q of [20,40,60,80].filter(q=>q!==state.target)){
    const pts=isoPoints(q,state.sigma).filter(([x,y])=>x>2&&x<95&&y>3&&y<94);
    if(pts.length){const [x,y]=pts[Math.floor(pts.length*.18)];html+=`<text x="${X(x)+3}" y="${Y(y)-5}" class="curve-label">${q}</text>`;}
  }
  html+=`<rect x="60" y="13" width="99" height="24" rx="4" fill="#f4eddc"/><text x="70" y="29" fill="#96651c" font-size="12">Gold: Q = ${state.target}</text><text x="411" y="29" text-anchor="end" class="tick">P = ${state.p}, S = ${state.s}</text>`;
  $('isoquants').innerHTML=`<style>.tick{font:11px 'Segoe UI',sans-serif;fill:#687d6b}.axis{font:12px 'Segoe UI',sans-serif;fill:#3e5b48}.curve-label{font:11px 'Segoe UI',sans-serif;fill:#688d73;paint-order:stroke;stroke:#fdfefb;stroke-width:4px}</style>${html}`;
}
function path(pts,X,Y){return pts.map(([x,y],i)=>`${i?'L':'M'}${X(x).toFixed(2)},${Y(y).toFixed(2)}`).join(' ');}
function drawSurface(){
  const rect=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
  if(!rect.width)return;
  canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
  const w=rect.width,h=rect.height,scale=Math.min(w/3.1,h/2.7),co=Math.cos(state.yaw),si=Math.sin(state.yaw),cp=Math.cos(state.pitch),sp=Math.sin(state.pitch);
  const project=(p,s,q)=>{const x=(p-50)/50,y=(s-50)/50,z=q/50;const a=x*co-y*si,b=x*si+y*co;return [w*.5+a*scale,h*.77+(b*sp-z*cp)*scale,b*cp+z*sp];};
  const line=(pts,color,width=1,dash=[])=>{ctx.beginPath();pts.forEach((p,i)=>{const v=project(...p);i?ctx.lineTo(v[0],v[1]):ctx.moveTo(v[0],v[1]);});ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);};
  for(let t=0;t<=100;t+=20){line([[t,0,0],[t,100,0]],'#e0e7dc');line([[0,t,0],[100,t,0]],'#e0e7dc');}
  const quads=[],n=30;
  for(let i=0;i<n;i++)for(let j=0;j<n;j++){
    const corners=[[i,j],[i+1,j],[i+1,j+1],[i,j+1]].map(([a,b])=>{const p=a*100/n,s=b*100/n,q=production(p,s,state.sigma);return {v:project(p,s,q),q};});
    quads.push({corners,depth:corners.reduce((a,b)=>a+b.v[2],0)/4,q:corners.reduce((a,b)=>a+b.q,0)/4});
  }
  quads.sort((a,b)=>a.depth-b.depth);
  for(const {corners,q} of quads){ctx.beginPath();corners.forEach(({v},i)=>i?ctx.lineTo(v[0],v[1]):ctx.moveTo(v[0],v[1]));ctx.closePath();ctx.fillStyle=`hsl(${146-q*.32} ${22+q*.12}% ${83-q*.43}%)`;ctx.fill();ctx.strokeStyle='#305b3b30';ctx.lineWidth=.45;ctx.stroke();}
  // The selected level is drawn directly on the production surface.
  const contour=isoPoints(state.target,state.sigma).filter(([p,s])=>p>=0&&p<=100&&s>=0&&s<=100);
  line(contour.map(([p,s])=>[p,s,state.target]),'#bd8023',2.7);
  line([[0,0,0],[100,0,0]],'#748e77',1.2);line([[0,0,0],[0,100,0]],'#748e77',1.2);line([[0,0,0],[0,0,100]],'#748e77',1.2);
  ctx.font=`${Math.max(9,Math.min(11,w/37))}px 'Segoe UI',sans-serif`;ctx.fillStyle='#58715c';
  function label(p,s,q,text,dx=0,dy=0){const v=project(p,s,q);ctx.fillText(text,v[0]+dx,v[1]+dy);}
  for(let t=0;t<=100;t+=50){label(t,0,0,String(t),-4,14);if(t)label(0,t,0,String(t),-17,5);if(t)label(0,0,t,String(t),-22,4);}
  ctx.textAlign='center';label(65,0,0,'Preparedness (P)',15,31);label(0,65,0,'Suppression (S)',-18,24);ctx.textAlign='left';label(0,0,100,'Output (Q)',-16,-13);
  const q=production(state.p,state.s,state.sigma);line([[state.p,state.s,0],[state.p,state.s,q]],'#c97653',1.5,[4,3]);
  const dot=project(state.p,state.s,q);ctx.beginPath();ctx.arc(dot[0],dot[1],5,0,Math.PI*2);ctx.fillStyle='#dc8057';ctx.fill();ctx.strokeStyle='white';ctx.lineWidth=2;ctx.stroke();
}
document.querySelectorAll('[data-sigma]').forEach(b=>b.addEventListener('click',()=>{state.sigma=Number(b.dataset.sigma);$('sigma').value=Number.isFinite(state.sigma)?Math.max(.1,state.sigma):5;render();}));
for(const [id,key] of [['sigma','sigma'],['preparedness','p'],['suppression','s'],['target','target']])$(id).addEventListener('input',e=>{state[key]=Number(e.target.value);render();});
$('reset').addEventListener('click',()=>{Object.assign(state,{sigma:1,p:50,s:50,target:40,yaw:-.72,pitch:.56});$('sigma').value=1;$('target').value=40;render();});
$('camera').addEventListener('click',()=>{state.yaw=-.72;state.pitch=.56;drawSurface();});
$('isoquants').addEventListener('click',e=>{const svg=$('isoquants'),point=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse());if(point.x<58||point.x>413||point.y<53||point.y>333)return;state.p=Math.round((point.x-58)/3.55);state.s=Math.round((333-point.y)/2.8);render();});
let drag=null;canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!drag)return;state.yaw+=(e.clientX-drag.x)*.008;state.pitch=Math.max(.2,Math.min(1.2,state.pitch+(e.clientY-drag.y)*.006));drag={x:e.clientX,y:e.clientY};drawSurface();});
canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
new ResizeObserver(drawSurface).observe(canvas);render();
