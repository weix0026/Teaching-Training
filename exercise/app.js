"use strict";

const F = {
  single_future: {
    key: "single_future", tag: "Single · Future", name: "Compound a single amount",
    formula: "V<sub>n</sub> = V<sub>0</sub>(1 + i)<sup>n</sup>", short: "Vn = V0(1+i)^n",
    why: "Move one amount forward in time by compounding it for n years.",
    cue: "What will today’s planting cost be equivalent to at harvest?",
    mistake: "Do not divide when moving forward in time.", calc: x => x.v * (1 + x.i) ** x.n
  },
  single_present: {
    key: "single_present", tag: "Single · Present", name: "Discount a single amount",
    formula: "V<sub>0</sub> = V<sub>n</sub> / (1 + i)<sup>n</sup>", short: "V0 = Vn/(1+i)^n",
    why: "Move one future amount back to year 0 by discounting it n years.",
    cue: "What is a timber-sale receipt received at harvest worth today?",
    mistake: "Discount the future amount; do not multiply by the factor.", calc: x => x.v / (1 + x.i) ** x.n
  },
  periodic_future_terminal: {
    key: "periodic_future_terminal", tag: "Series · Future · Periodic · Terminal", name: "Periodic terminating series—future value",
    formula: "V<sub>n</sub> = p[(1 + i)<sup>n</sup> − 1] / [(1 + i)<sup>t</sup> − 1]", short: "Vn = p[(1+i)^n−1]/[(1+i)^t−1]",
    why: "Accumulate equal payments made every t years through year n.",
    cue: "What is a thinning income received every 10 years worth at the final harvest?",
    mistake: "t is the interval between payments—not the number of payments.", calc: x => x.p * ((1 + x.i) ** x.n - 1) / ((1 + x.i) ** x.t - 1)
  },
  annual_future_terminal: {
    key: "annual_future_terminal", tag: "Series · Future · Annual · Terminal", name: "Annual terminating series—future value",
    formula: "V<sub>n</sub> = p[(1 + i)<sup>n</sup> − 1] / i", short: "Vn = p[(1+i)^n−1]/i",
    why: "Accumulate equal end-of-year payments through year n.",
    cue: "What will equal annual recreation fees be worth at the end of the project?",
    mistake: "This assumes end-of-year payments. An immediate year-0 payment is separate.", calc: x => x.p * ((1 + x.i) ** x.n - 1) / x.i
  },
  periodic_present_perpetual: {
    key: "periodic_present_perpetual", tag: "Series · Present · Periodic · Perpetual", name: "Periodic perpetual series—present value",
    formula: "V<sub>0</sub> = p / [(1 + i)<sup>t</sup> − 1]", short: "V0 = p/[(1+i)^t−1]",
    why: "Value equal payments every t years that continue forever.",
    cue: "What is an endless cycle of timber revenue every 40 years worth today?",
    mistake: "This is not p/i unless payments occur every year.", calc: x => x.p / ((1 + x.i) ** x.t - 1)
  },
  periodic_present_terminal: {
    key: "periodic_present_terminal", tag: "Series · Present · Periodic · Terminal", name: "Periodic terminating series—present value",
    formula: "V<sub>0</sub> = p[(1 + i)<sup>n</sup> − 1] / {[(1 + i)<sup>t</sup> − 1](1 + i)<sup>n</sup>}", short: "V0 = p[(1+i)^n−1]/{[(1+i)^t−1](1+i)^n}",
    why: "Discount equal payments every t years, ending at year n, back to today.",
    cue: "What are three thinning receipts over a 30-year horizon worth today?",
    mistake: "The series ends, so include the final (1+i)^n discount term.", calc: x => x.p * ((1 + x.i) ** x.n - 1) / (((1 + x.i) ** x.t - 1) * (1 + x.i) ** x.n)
  },
  annual_present_perpetual: {
    key: "annual_present_perpetual", tag: "Series · Present · Annual · Perpetual", name: "Annual perpetuity—present value",
    formula: "V<sub>0</sub> = p / i", short: "V0 = p/i",
    why: "Value an equal end-of-year payment that continues every year forever.",
    cue: "What is a permanent annual hunting-lease payment worth today?",
    mistake: "Use only when the first payment is one year from now and payments never stop.", calc: x => x.p / x.i
  },
  annual_present_terminal: {
    key: "annual_present_terminal", tag: "Series · Present · Annual · Terminal", name: "Annual terminating series—present value",
    formula: "V<sub>0</sub> = p[(1 + i)<sup>n</sup> − 1] / [i(1 + i)<sup>n</sup>]", short: "V0 = p[(1+i)^n−1]/[i(1+i)^n]",
    why: "Discount equal end-of-year payments through year n back to today.",
    cue: "What are annual road-maintenance costs for the next 20 years worth today?",
    mistake: "Do not use p/i: these payments stop at year n.", calc: x => x.p * ((1 + x.i) ** x.n - 1) / (x.i * (1 + x.i) ** x.n)
  }
};

const formulas = Object.values(F);
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const money = n => Math.round(n).toLocaleString("en-US");
const saved = JSON.parse(localStorage.getItem("nr444-finance-progress") || "{}");
const explored = new Set(saved.explored || []);

function stateKey() {
  const occurrence = $("input[name=occurrences]:checked").value;
  const time = $("input[name=valueTime]:checked").value;
  if (occurrence === "single") return `single_${time}`;
  const frequency = $("input[name=frequency]:checked").value;
  let length = $("input[name=length]:checked").value;
  if (time === "future") length = "terminal";
  return `${frequency}_${time}_${length}`;
}

function timelineSvg(key) {
  const series = !key.startsWith("single");
  const future = key.includes("future");
  const perpetual = key.includes("perpetual");
  const periodic = key.includes("periodic");
  const xs = periodic ? [120, 220, 320] : [90, 150, 210, 270, 330];
  let arrows = "";
  if (series) arrows = xs.map((x, j) => `<line class="payment-arrow" x1="${x}" y1="95" x2="${x}" y2="${55 + (j%2)*3}"/><polygon fill="#edaa73" points="${x-5},60 ${x+5},60 ${x},51"/>`).join("");
  else arrows = `<line class="payment-arrow" x1="${future ? 55 : 345}" y1="95" x2="${future ? 55 : 345}" y2="55"/><polygon fill="#edaa73" points="${future ? 50 : 340},60 ${future ? 60 : 350},60 ${future ? 55 : 345},51"/>`;
  const targetX = future ? 345 : 55;
  return `<svg class="timeline-svg" viewBox="0 0 400 150" aria-hidden="true"><line class="axis" x1="45" y1="96" x2="360" y2="96"/><polygon fill="#a9beb7" points="360,91 372,96 360,101"/><line class="tick" x1="55" y1="87" x2="55" y2="105"/><line class="tick" x1="345" y1="87" x2="345" y2="105"/><text x="48" y="122">0</text><text x="338" y="122">n</text>${arrows}<line class="value-arrow" x1="${targetX}" y1="98" x2="${targetX}" y2="136"/><polygon fill="#9dd39f" points="${targetX-6},130 ${targetX+6},130 ${targetX},142"/>${perpetual ? '<text x="335" y="75">…∞</text>' : ''}</svg>`;
}

function updateFinder() {
  const series = $("input[name=occurrences]:checked").value === "series";
  const future = $("input[name=valueTime]:checked").value === "future";
  $("#frequencyField").disabled = !series;
  $("#lengthField").disabled = !series;
  $("input[name=length][value=perpetual]").disabled = future;
  if (future) $("input[name=length][value=terminal]").checked = true;
  const f = F[stateKey()];
  $("#resultTag").textContent = f.tag;
  $("#resultName").textContent = f.name;
  $("#resultFormula").innerHTML = f.formula;
  $("#resultWhy").textContent = f.why;
  $("#resultExample").innerHTML = `<b>Forestry cue:</b> ${f.cue}`;
  $("#timeline").innerHTML = timelineSvg(f.key);
  $("#markExplored").textContent = explored.has(f.key) ? "✓ Explored" : "Mark this formula explored";
  $("#finderNote").hidden = !(series && future);
  $("#finderNote").textContent = "A future value must have an ending date, so a future series is always terminal. A perpetuity has no final year at which to measure future value.";
}

function saveProgress() {
  localStorage.setItem("nr444-finance-progress", JSON.stringify({ explored: [...explored] }));
  $("#progressText").textContent = `${explored.size} of 8 formulas explored`;
  $("#progressBar").style.width = `${explored.size / 8 * 100}%`;
}

function renderFormulaCards() {
  $("#formulaGrid").innerHTML = formulas.map((f, i) => `<article class="formula-card"><button aria-expanded="false" aria-controls="detail-${i}"><span class="card-name">${f.name}</span><span class="card-equation">${f.formula}</span><span class="toggle" aria-hidden="true">+</span></button><div class="formula-detail" id="detail-${i}" hidden><p><b>Use it when:</b> ${f.why}</p><p><b>Forestry example:</b> ${f.cue}</p><p class="mistake"><b>Watch out:</b> ${f.mistake}</p></div></article>`).join("");
  $$(".formula-card button").forEach((button, i) => button.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!open));
    button.querySelector(".toggle").textContent = open ? "+" : "−";
    $(`#detail-${i}`).hidden = open;
    if (!open) { explored.add(formulas[i].key); saveProgress(); }
  }));
}

const guided = [
  { key:"single_future", context:"Site preparation", q:"A site-preparation treatment costs $8,000 today. At 4% interest, what is its equivalent cost 12 years from now?", x:{v:8000,i:.04,n:12}, hint:"There is one cost at year 0, and you are moving it forward to year 12." },
  { key:"single_present", context:"Timber sale", q:"A timber sale will return $65,000 in 25 years. What is that revenue worth today at 5%?", x:{v:65000,i:.05,n:25}, hint:"There is one future receipt. Move it backward to year 0." },
  { key:"annual_future_terminal", context:"Recreation fees", q:"A forest earns $3,000 at the end of every year for 10 years. What is the series worth at the end of year 10 at 4%?", x:{p:3000,i:.04,n:10}, hint:"Equal payments occur every year, end at year 10, and are valued at year 10." },
  { key:"periodic_future_terminal", context:"Thinning program", q:"A stand produces $12,000 every 5 years through year 20. What is the series worth at year 20 at 3%?", x:{p:12000,i:.03,n:20,t:5}, hint:"The payments form a terminating series, but the interval t is 5—not 1." },
  { key:"annual_present_perpetual", context:"Hunting lease", q:"A hunting lease pays $2,400 at the end of every year forever. What is it worth today at 6%?", x:{p:2400,i:.06}, hint:"Annual, present value, and no ending year: this is a perpetuity." },
  { key:"periodic_present_perpetual", context:"Sustained-yield forest", q:"A perpetual forest produces net revenue of $90,000 every 30 years, first at year 30. What is its present value at 4%?", x:{p:90000,i:.04,t:30}, hint:"Payments repeat forever, but only once every 30 years." },
  { key:"annual_present_terminal", context:"Road maintenance", q:"Road maintenance costs $1,500 at the end of every year for 15 years. What is the present value of these costs at 5%?", x:{p:1500,i:.05,n:15}, hint:"The costs are annual and stop after year 15; value them at year 0." },
  { key:"periodic_present_terminal", context:"Fuel treatments", q:"A fuel treatment costs $18,000 every 6 years through year 24. What is the present value of the series at 4%?", x:{p:18000,i:.04,n:24,t:6}, hint:"Equal costs occur at years 6, 12, 18, and 24, then stop." }
];

const choiceKeys = ["single_future","single_present","annual_future_terminal","periodic_future_terminal","annual_present_perpetual","periodic_present_perpetual","annual_present_terminal","periodic_present_terminal"];
let guidedIndex = 0;

function choicesHtml(name, correctKey) {
  const distractors = choiceKeys.filter(k => k !== correctKey).sort(() => Math.random() - .5).slice(0,3);
  return [correctKey, ...distractors].sort(() => Math.random() - .5).map(k => `<label><input type="radio" name="${name}" value="${k}"><span>${F[k].short}</span></label>`).join("");
}

function renderGuided() {
  const q = guided[guidedIndex];
  $("#guidedNumber").textContent = guidedIndex + 1;
  $("#guidedContext").textContent = q.context;
  $("#guidedQuestion").textContent = q.q;
  $("#guidedChoices").innerHTML = choicesHtml("guidedFormula", q.key);
  $("#guidedInput").value = "";
  $("#guidedFeedback").hidden = true;
  $("#guidedNext").hidden = true;
  $("#guidedCheck").hidden = false;
  $("#guidedHint").hidden = false;
  $("#guidedDots").innerHTML = guided.map((_, i) => `<span class="${i < guidedIndex ? "done" : i === guidedIndex ? "current" : ""}"></span>`).join("");
}

function checkAnswer(mode, q) {
  const selected = $(`input[name=${mode}Formula]:checked`);
  const raw = $(`#${mode}Input`).value;
  const feedback = $(`#${mode}Feedback`);
  if (!selected || raw === "") {
    feedback.className = "feedback error"; feedback.innerHTML = "<h4>Complete both parts.</h4><p>Choose an equation and enter a dollar value.</p>"; feedback.hidden = false; return false;
  }
  const expected = F[q.key].calc(q.x);
  const formulaOK = selected.value === q.key;
  const numberOK = Math.abs(Number(raw) - expected) <= Math.max(1, expected * .005);
  const allOK = formulaOK && numberOK;
  feedback.className = `feedback${allOK ? "" : " error"}`;
  feedback.innerHTML = `<h4>${allOK ? "Correct—good pattern recognition." : "Not quite. Use the cash-flow pattern to revise."}</h4><p><b>Equation:</b> ${F[q.key].formula}</p><p><b>Answer:</b> $${money(expected)} ${formulaOK ? "· Your equation choice is correct." : "· Recheck whether the cash flow is single/series, present/future, annual/periodic, and terminal/perpetual."}</p>`;
  feedback.hidden = false;
  return allOK;
}

function randomQuestion() {
  const key = choiceKeys[Math.floor(Math.random() * choiceKeys.length)];
  const rate = [3,4,5,6][Math.floor(Math.random()*4)];
  const i = rate/100;
  const amount = [1200,2500,5000,12000,30000][Math.floor(Math.random()*5)];
  const n = [10,12,20,24,30][Math.floor(Math.random()*5)];
  const tOptions = [2,4,5,6];
  const t = tOptions.filter(v => n % v === 0)[0] || 2;
  const f = F[key];
  let x, q;
  if (key === "single_future") { x={v:amount,i,n}; q=`A $${amount.toLocaleString()} restoration cost occurs today. What is its equivalent value in year ${n} at ${rate}%?`; }
  else if (key === "single_present") { x={v:amount*5,i,n}; q=`A timber receipt of $${(amount*5).toLocaleString()} occurs in year ${n}. What is its value today at ${rate}%?`; }
  else if (key === "annual_future_terminal") { x={p:amount,i,n}; q=`Annual recreation revenue is $${amount.toLocaleString()} for ${n} years. What is its value at the end of year ${n} at ${rate}%?`; }
  else if (key === "periodic_future_terminal") { x={p:amount,i,n,t}; q=`Thinning returns $${amount.toLocaleString()} every ${t} years through year ${n}. What is the series worth in year ${n} at ${rate}%?`; }
  else if (key === "annual_present_perpetual") { x={p:amount,i}; q=`An annual lease returns $${amount.toLocaleString()} forever, starting one year from now. What is it worth today at ${rate}%?`; }
  else if (key === "periodic_present_perpetual") { x={p:amount,i,t}; q=`A sustainable harvest returns $${amount.toLocaleString()} every ${t} years forever, first in year ${t}. What is it worth today at ${rate}%?`; }
  else if (key === "annual_present_terminal") { x={p:amount,i,n}; q=`Annual monitoring costs $${amount.toLocaleString()} for ${n} years. What is their value today at ${rate}%?`; }
  else { x={p:amount,i,n,t}; q=`Fuel treatment costs $${amount.toLocaleString()} every ${t} years through year ${n}. What is the series worth today at ${rate}%?`; }
  return {key, x, q, context:"Mixed field scenario"};
}

let challenge = [], challengeIndex = 0, score = 0, challengeAnswered = false;
function newRound() { challenge = Array.from({length:5}, randomQuestion); challengeIndex=0; score=0; renderChallenge(); }
function renderChallenge() {
  const q=challenge[challengeIndex]; challengeAnswered=false;
  $("#challengeScore").textContent=score; $("#challengeStatus").textContent=`Question ${challengeIndex+1} of 5`;
  $("#challengeContext").textContent=q.context; $("#challengeQuestion").textContent=q.q;
  $("#challengeChoices").innerHTML=choicesHtml("challengeFormula",q.key); $("#challengeInput").value="";
  $("#challengeFeedback").hidden=true; $("#challengeCheck").hidden=false; $("#challengeNext").hidden=true;
}

$$('[data-jump]').forEach(b => b.addEventListener('click', () => document.getElementById(b.dataset.jump).scrollIntoView({behavior:'smooth'})));
$$('.section-nav button').forEach(b => b.addEventListener('click', () => { $$('.section-nav button').forEach(x=>x.classList.remove('active')); b.classList.add('active'); }));
$$('.decision-grid input').forEach(i => i.addEventListener('change', updateFinder));
$('#markExplored').addEventListener('click', () => { explored.add(stateKey()); saveProgress(); updateFinder(); });
$('#guidedHint').addEventListener('click', () => { const f=$('#guidedFeedback'); f.className='feedback'; f.innerHTML=`<h4>Hint</h4><p>${guided[guidedIndex].hint}</p>`; f.hidden=false; });
$('#guidedCheck').addEventListener('click', () => { if(checkAnswer('guided',guided[guidedIndex])) { explored.add(guided[guidedIndex].key); saveProgress(); $('#guidedNext').hidden=false; $('#guidedCheck').hidden=true; $('#guidedHint').hidden=true; } });
$('#guidedNext').addEventListener('click', () => { guidedIndex=(guidedIndex+1)%guided.length; renderGuided(); });
$('#challengeCheck').addEventListener('click', () => { if(challengeAnswered)return; const ok=checkAnswer('challenge',challenge[challengeIndex]); challengeAnswered=true; if(ok)score++; $('#challengeScore').textContent=score; $('#challengeCheck').hidden=true; $('#challengeNext').hidden=false; $('#challengeNext').textContent=challengeIndex===4?'See results':'Continue'; });
$('#challengeNext').addEventListener('click', () => { if(challengeIndex<4){challengeIndex++;renderChallenge();}else{const f=$('#challengeFeedback');f.className='feedback';f.innerHTML=`<h4>Round complete: ${score}/5</h4><p>${score>=4?'You are ready to apply the decision tree independently.':'Review the formula field guide, then try a new round.'}</p>`;f.hidden=false;$('#challengeNext').hidden=true;} });
$('#newRound').addEventListener('click',newRound);
$('#resetProgress').addEventListener('click', () => { explored.clear(); localStorage.removeItem('nr444-finance-progress'); saveProgress(); updateFinder(); });

renderFormulaCards(); saveProgress(); updateFinder(); renderGuided(); newRound();
