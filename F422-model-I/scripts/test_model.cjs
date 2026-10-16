const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const M=require('../model.js');
const bridge=M.datasets.bridge,homework=M.datasets.homework;
assert.equal(M.columns(bridge).length,32);
assert.equal(M.columns(homework).length,19);
const bridgeTotals=[[0,500,250,300,50,300,100,150],[0,600,500,550,250,500,300,350],[0,600,600,650,500,750,550,600],[0,600,600,650,600,850,650,700]];
for(let i=0;i<4;i++)assert.deepEqual(M.columns(bridge).filter(c=>c.i===i).map(c=>c.total),bridgeTotals[i]);
const expectedPoor=[[0,0,0,0,0,0],[9,0,0,0,0,0],[9,0,0,11,0,0],[9,0,0,0,18,0],[9,0,0,0,0,21],[0,13,0,0,0,0],[0,13,0,0,11,0],[0,13,0,0,0,18],[0,0,16,0,0,0],[0,0,16,0,0,11],[0,0,0,19,0,0],[0,0,0,0,22,0],[0,0,0,0,0,25]];
const expectedFull=[[0,0,0,0,0,0],[0,0,11,0,0,0],[0,0,11,0,0,11],[0,0,0,18,0,0],[0,0,0,0,21,0],[0,0,0,0,0,24]];
assert.deepEqual(M.columns(homework).filter(c=>c.i===0).map(c=>c.yields),expectedPoor);
assert.deepEqual(M.columns(homework).filter(c=>c.i===1).map(c=>c.yields),expectedFull);
assert.equal(M.columns(homework)[2].c,500);
assert.equal(M.columns(homework)[7].c,775);
assert.equal(M.solve(bridge,{flow:'none'}).value,335000);
assert.equal(M.solve(homework,{flow:'none'}).value,1975000);
assert.equal(M.trajectory(homework,1,[1,0,0,0,0,0])[0].valid,false);
assert.equal(M.trajectory(homework,0,[1,0,1,0,0,0])[2].valid,false);
assert.equal(M.solve(homework,{flow:'equal',h0:1e7}).status,'infeasible');
assert.equal(M.simplex([[1],[-1]],[0,-1],[1]).status,'infeasible');
assert.equal(M.simplex([[-1]],[0],[1]).status,'unbounded');
assert.equal(M.simplex([[1],[-1]],[5,-2],[1]).value,5);
const cases=[];
for(const d of [bridge,homework])for(const flow of ['none','nondeclining','equal','band'])for(const h0 of [null,0,1000,1000000])for(const rate of d.id==='homework'?[0,5,20]:[0]){
 const options={flow,h0,rate,price:25},cols=M.columns(d,25,rate),rows=M.constraints(d,cols,flow,h0),result=M.solve(d,options);
 cases.push({dataset:d.id,options,c:cols.map(c=>c.c),rows,result});
 if(result.status==='optimal')assert.equal(result.feasible,true);
}
for(const d of [bridge,homework]){
 const values=['none','nondeclining','equal'].map(flow=>M.solve(d,{flow}).value);
 assert(values[0]+1e-5>=values[1]&&values[1]+1e-5>=values[2]);
 console.log(d.id,JSON.stringify(values));
}
fs.writeFileSync(path.join(__dirname,'../research/solver-cases.json'),JSON.stringify(cases));
console.log('Source coefficient checks and '+cases.length+' LP scenarios passed.');
