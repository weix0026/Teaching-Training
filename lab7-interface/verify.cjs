const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const elements={};
const get=id=>elements[id]??=( {textContent:'',innerHTML:'',value:'',className:''} );
const context={console,localStorage:{getItem:()=>null,setItem:()=>{}},document:{querySelector:s=>get(s),getElementById:id=>get('#'+id)},setTimeout};
vm.createContext(context);
const code=fs.readFileSync(__dirname+'/dist/app.js','utf8');
vm.runInContext(code.slice(0,code.indexOf("document.addEventListener('click'")),context);
const evaluate=s=>vm.runInContext(s,context);
const near=(a,b,t=1e-8)=>assert(Math.abs(a-b)<t,`${a} != ${b}`);
const practice=evaluate('project([120,20,6,2],[20,0,0,0])');
[139.8,20,6,2.04].forEach((n,i)=>near(practice[i],n));
// Independent instructor reference controls; not part of the student bundle.
for(const [stock,harvest] of [
 [[131.75277959450588,16.350555918901176,4.9051667756703523,1.9620667102681451],[50,0,0,0]],
 [[123.11904761904754,11.904761904761891,3.5714285714285667,1.4285714285714344],[63.595238095238045,0,0,0]]
]){const p=evaluate(`project(${JSON.stringify(stock)},${JSON.stringify(harvest)})`);p.forEach((n,i)=>near(n,stock[i]));}
function input(id,n){get('#'+id).value=String(n);get('#'+id).valueAsNumber=Number(n);}
input('price',-2);input('delta',1);input('increase',2);input('decrease',3);get('#price-mode').value='trees';evaluate('calculatePrice()');assert.match(get('#price-feedback').textContent,/-2.000 trees\/ha/);
input('delta',3);evaluate('calculatePrice()');assert.match(get('#price-feedback').textContent,/outside/);
input('delta',-6);evaluate('calculatePrice()');assert.match(get('#price-feedback').textContent,/nonnegative/);
input('delta',1);input('increase',-1);evaluate('calculatePrice()');assert.match(get('#price-feedback').textContent,/must be nonnegative/);
get('#price').value='';evaluate('calculatePrice()');assert.match(get('#price-feedback').textContent,/all four numeric/);
for(let i=0;i<6;i++){const html=evaluate(`pages[${i}]()`);assert.match(html,/<h1>/);assert(!html.includes('undefined'));}
assert.equal(evaluate('formulas.length'),6);
assert(fs.existsSync(__dirname+'/dist/downloads/Lab7_Uneven_Aged.docx'));
const files=fs.readdirSync(__dirname+'/dist/downloads');assert.deepEqual(files,['Lab7_Uneven_Aged.docx']);
for(const file of ['app.js','index.html','styles.css'])assert(fs.statSync(__dirname+'/dist/'+file).size>0);
console.log('PASS: projection reference checks, shadow-price bounds and invalid inputs, six lesson sections, student download isolation. Browser rendering not verified.');
