/* Model I teaching engine. Pure functions, usable in a browser or Node. */
(function(root){
  'use strict';
  const sum=a=>a.reduce((s,x)=>s+x,0);
  const patterns3=Array.from({length:8},(_,j)=>[2,1,0].map(b=>(j>>b)&1));
  const poorPatterns=[[],[1],[1,4],[1,5],[1,6],[2],[2,5],[2,6],[3],[3,6],[4],[5],[6]];
  const fullPatterns=[[],[3],[3,6],[4],[5],[6]];
  const pattern=(n,periods)=>Array.from({length:n},(_,t)=>Number(periods.includes(t+1)));
  const datasets={
    bridge:{id:'bridge',title:'Three-decade bridge',subtitle:'4 initial age classes · 8 prescriptions each',periods:3,years:10,areaUnit:'ha',volumeUnit:'m³',objective:'volume',source:'ModelI.pptx, slides 4–9',
      units:[100,200,50,150].map((area,i)=>({id:i+1,name:`Initial Age ${i+1}`,area,initial:i+1,patterns:patterns3})),
      description:'The lecture’s 500-hectare example. All eight C/N sequences are allowed. This simplified case permits harvest in every age class; it has no minimum harvest-age restriction.'},
    homework:{id:'homework',title:'Six-decade homework',subtitle:'2 forest types · 19 prescriptions',periods:6,years:10,areaUnit:'acres',volumeUnit:'cords',objective:'revenue',source:'ModelI.pptx, slides 11–13',
      units:[{id:1,name:'Poorly stocked pine/fir',area:1000,initial:40,patterns:poorPatterns.map(p=>pattern(6,p))},{id:2,name:'Fully stocked pine',area:2000,initial:10,patterns:fullPatterns.map(p=>pattern(6,p))}],
      description:'The newer slide example: 1,000 acres of poorly stocked pine/fir and 2,000 acres of fully stocked pine. Harvest at the beginning of each decade; regenerate to fully stocked pine. Base price $25/cord; discount rate 0%.'}
  };
  const poorYield={30:5,40:9,50:13,60:16,70:19,80:22,90:25};
  const fullYield={30:11,40:18,50:21,60:24,70:27,80:29,90:30};
  function trajectory(dataset,unitIndex,actions){
    const u=dataset.units[unitIndex]; let age=u.initial,fully=unitIndex===1;
    const rows=[];
    actions.forEach((cut,t)=>{
      const start=age; let yieldValue=0,valid=true,reason='';
      if(dataset.id==='bridge'){
        yieldValue=cut?[50,250,500,600][age-1]:0;
        age=cut?1:Math.min(4,age+1);
      }else{
        const minimum=fully?30:40;
        if(cut&&age<minimum){valid=false;reason=`Age ${age} is below the ${minimum}-year minimum.`;}
        if(cut){yieldValue=valid?(fully?fullYield:poorYield)[age]||0:0;age=10;fully=true;}
        else age+=10;
      }
      rows.push({period:t+1,start,cut:!!cut,yield:yieldValue,next:age,valid,reason});
    });
    return rows;
  }
  function columns(dataset,price=25,rate=0){
    return dataset.units.flatMap((u,i)=>u.patterns.map((actions,j)=>{
      const trace=trajectory(dataset,i,actions),yields=trace.map(r=>r.yield);
      const c=dataset.objective==='volume'?sum(yields):sum(yields.map((v,t)=>v*price/Math.pow(1+rate/100,t*dataset.years)));
      return {i,j,name:`X${i+1},${j+1}`,actions,yields,total:sum(yields),c,trace};
    }));
  }
  function constraints(dataset,cols,flow='nondeclining',h0=null){
    const rows=[];
    dataset.units.forEach((u,i)=>rows.push({name:`Area ${i+1}`,a:cols.map(c=>Number(c.i===i)),sense:'=',b:u.area,kind:'area'}));
    const harvest=t=>cols.map(c=>c.yields[t]);
    for(let t=1;t<dataset.periods;t++){
      const p=harvest(t-1),q=harvest(t);
      if(flow==='nondeclining')rows.push({name:`H${t} ≤ H${t+1}`,a:p.map((v,k)=>v-q[k]),sense:'≤',b:0,kind:'flow'});
      if(flow==='equal')rows.push({name:`H${t} = H${t+1}`,a:p.map((v,k)=>v-q[k]),sense:'=',b:0,kind:'flow'});
      if(flow==='band'){
        rows.push({name:`H${t+1} ≥ 0.9 H${t}`,a:p.map((v,k)=>.9*v-q[k]),sense:'≤',b:0,kind:'flow'});
        rows.push({name:`H${t+1} ≤ 1.1 H${t}`,a:q.map((v,k)=>v-1.1*p[k]),sense:'≤',b:0,kind:'flow'});
      }
    }
    if(h0!==null&&flow!=='none'){
      const h=harvest(0);
      if(flow==='nondeclining')rows.push({name:'H1 ≥ H0',a:h.map(v=>-v),sense:'≤',b:-h0,kind:'flow'});
      if(flow==='equal')rows.push({name:'H1 = H0',a:h,sense:'=',b:h0,kind:'flow'});
      if(flow==='band'){
        rows.push({name:'H1 ≥ 0.9 H0',a:h.map(v=>-v),sense:'≤',b:-.9*h0,kind:'flow'});
        rows.push({name:'H1 ≤ 1.1 H0',a:h,sense:'≤',b:1.1*h0,kind:'flow'});
      }
    }
    return rows;
  }
  // Two-phase tableau simplex for max c*x, A*x <= b, x >= 0.
  // Artificial variable establishes feasibility when a right-hand side is negative.
  function simplex(A,b,c){
    const m=b.length,n=c.length,EPS=1e-8;
    const B=Array.from({length:m},(_,i)=>n+i),N=Array.from({length:n+1},(_,j)=>j);
    N[n]=-1;
    const D=Array.from({length:m+2},()=>Array(n+2).fill(0));
    for(let i=0;i<m;i++){for(let j=0;j<n;j++)D[i][j]=A[i][j];D[i][n]=-1;D[i][n+1]=b[i];}
    for(let j=0;j<n;j++)D[m][j]=-c[j];D[m+1][n]=1;
    const pivot=(r,s)=>{
      const inv=1/D[r][s];
      for(let i=0;i<m+2;i++)if(i!==r)for(let j=0;j<n+2;j++)if(j!==s)D[i][j]-=D[r][j]*D[i][s]*inv;
      for(let j=0;j<n+2;j++)if(j!==s)D[r][j]*=inv;
      for(let i=0;i<m+2;i++)if(i!==r)D[i][s]*=-inv;
      D[r][s]=inv;[B[r],N[s]]=[N[s],B[r]];
    };
    let iterations=0;
    const phase=which=>{
      const x=which===1?m+1:m;
      for(;;){
        if(++iterations>20000)throw Error('Solver iteration limit reached.');
        let s=-1;
        for(let j=0;j<=n;j++){
          if(which===2&&N[j]===-1)continue;
          if(s===-1||D[x][j]<D[x][s]-EPS||(Math.abs(D[x][j]-D[x][s])<=EPS&&N[j]<N[s]))s=j;
        }
        if(D[x][s]>=-EPS)return true;
        let r=-1;
        for(let i=0;i<m;i++)if(D[i][s]>EPS){
          const v=D[i][n+1]/D[i][s],old=r<0?Infinity:D[r][n+1]/D[r][s];
          if(r<0||v<old-EPS||(Math.abs(v-old)<=EPS&&B[i]<B[r]))r=i;
        }
        if(r===-1)return false;pivot(r,s);
      }
    };
    let r=0;for(let i=1;i<m;i++)if(D[i][n+1]<D[r][n+1])r=i;
    if(D[r][n+1]<-EPS){
      pivot(r,n);
      if(!phase(1)||D[m+1][n+1]<-EPS||Math.abs(D[m+1][n+1])>EPS)return {status:'infeasible'};
      for(let i=0;i<m;i++)if(B[i]===-1){
        let s=-1;
        for(let j=0;j<=n;j++)if(Math.abs(D[i][j])>EPS&&(s<0||N[j]<N[s]))s=j;
        if(s>=0)pivot(i,s);
      }
    }
    if(!phase(2))return {status:'unbounded'};
    const solution=Array(n).fill(0);for(let i=0;i<m;i++)if(B[i]>=0&&B[i]<n)solution[B[i]]=Math.max(0,D[i][n+1]);
    return {status:'optimal',x:solution,value:sum(solution.map((v,j)=>v*c[j])),iterations};
  }
  function solve(dataset,options={}){
    const cols=columns(dataset,options.price??25,options.rate??0);
    const rows=constraints(dataset,cols,options.flow??'nondeclining',options.h0??null),A=[],b=[];
    rows.forEach(r=>{
      A.push(r.a);b.push(r.b);
      if(r.sense==='='){A.push(r.a.map(v=>-v));b.push(-r.b);}
    });
    const result=simplex(A,b,cols.map(c=>c.c));
    if(result.status==='optimal'){
      const audit=evaluate(dataset,cols,result.x,rows);
      if(!audit.feasible)return {status:'numerical-error',audit};
      return {...result,...audit};
    }
    return result;
  }
  function evaluate(dataset,cols,x,rows){
    const harvest=Array.from({length:dataset.periods},(_,t)=>sum(cols.map((c,k)=>c.yields[t]*x[k])));
    const area=dataset.units.map((u,i)=>sum(cols.map((c,k)=>c.i===i?x[k]:0)));
    const checks=rows.map(r=>{
      const lhs=sum(r.a.map((v,k)=>v*x[k]));
      const tolerance=1e-5*Math.max(1,Math.abs(r.b));
      return {...r,lhs,pass:r.sense==='='?Math.abs(lhs-r.b)<=tolerance:lhs<=r.b+tolerance};
    });
    return {harvest,area,checks,feasible:x.every(v=>Number.isFinite(v)&&v>=-1e-7)&&checks.every(r=>r.pass),value:sum(cols.map((c,k)=>c.c*x[k]))};
  }
  const api={datasets,columns,trajectory,constraints,simplex,solve,evaluate,sum};
  if(typeof module!=='undefined')module.exports=api;else root.ModelI=api;
})(typeof window==='undefined'?globalThis:window);
