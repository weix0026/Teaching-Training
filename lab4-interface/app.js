const caseData = {
  forestArea: 6000,
  rotation: 40,
  horizon: 20,
  periodLength: 4,
  compartments: [
    { name: "Compartment 1", area: 1750, yields: [217, 238, 259, 273, 287] },
    { name: "Compartment 2", area: 1610, yields: [308, 315, 308, 343, 294] },
    { name: "Compartment 3", area: 1340, yields: [56, 91, 119, 147, 168] },
    { name: "Compartment 4", area: 1300, yields: [0, 0, 175, 203, 224] },
  ],
};

caseData.avgYieldByPeriod = Array.from({ length: 5 }, (_, period) =>
  caseData.compartments.reduce((sum, compartment) => sum + compartment.area * compartment.yields[period], 0) /
  caseData.forestArea,
);
caseData.avgInventory = caseData.compartments.reduce(
  (sum, compartment) => sum + compartment.area * (compartment.yields.reduce((a, b) => a + b, 0) / 5),
  0,
);
caseData.allowableArea = caseData.forestArea * (caseData.horizon / caseData.rotation);
caseData.periodicArea = caseData.forestArea * (caseData.periodLength / caseData.rotation);
caseData.allowableVolume = caseData.avgInventory * (caseData.horizon / caseData.rotation);
caseData.periodicVolume = caseData.allowableVolume / (caseData.horizon / caseData.periodLength);

const formatNumber = (value, digits = 0) => new Intl.NumberFormat("en-US", {
  maximumFractionDigits: digits,
  minimumFractionDigits: digits,
}).format(value);

const initialParams = new URLSearchParams(window.location.search);
const initialLesson = Math.min(4, Math.max(0, Number(initialParams.get("lesson")) || 0));
const initialMode = initialParams.get("mode") === "volume" ? "volume" : "area";

const state = {
  lesson: initialLesson,
  mode: initialMode,
  ageAreas: [600, 600, 600, 600, 600, 600, 600, 600, 600, 600],
  planAreas: [600, 600, 600, 600, 600],
};

const lessons = [
  {
    short: "Regulated forest",
    render: renderRegulatedForest,
  },
  {
    short: "Area control",
    render: renderAreaControl,
  },
  {
    short: "Volume control",
    render: renderVolumeControl,
  },
  {
    short: "Compare & check",
    render: renderComparison,
  },
  {
    short: "Build the LP",
    render: renderLinearProgram,
  },
];

function renderRegulatedForest() {
  return `
    <div class="lesson-inner">
      <p class="lesson-kicker">01 · See the whole rotation</p>
      <h2>A regulated forest is a rhythm, not a snapshot.</h2>
      <p class="lead">A regulated forest maintains a balanced sequence of age classes so one class reaches harvest age in every cutting cycle. Harvest, regeneration, and aging repeat without exhausting the future forest.</p>
      <div class="concept-grid">
        <article class="concept-card"><h3>Rotation</h3><p>The planned age from regeneration to final harvest: <strong>40 years</strong> in this case.</p></article>
        <article class="concept-card"><h3>Cutting cycle</h3><p>Decisions repeat every <strong>4 years</strong>, so the rotation contains 10 age classes.</p></article>
        <article class="concept-card"><h3>Normal area</h3><p>Each age class holds <strong>600 ha</strong>: 6,000 ha ÷ 10 classes.</p></article>
      </div>
      <section class="visual-panel">
        <div class="panel-head">
          <div><h3>The age-class conveyor</h3><p>The gold class is harvested; every other class advances one step.</p></div>
          <button type="button" class="secondary-button" id="advanceForest">Harvest + advance</button>
        </div>
        <div class="age-chart" id="ageChart"></div>
        <div class="chart-caption"><span>newly regenerated</span><span>rotation age → harvest</span></div>
      </section>
      <div class="next-row"><button class="next-button" type="button" data-next="1">Next: control the area →</button></div>
    </div>`;
}

function renderAreaControl() {
  return `
    <div class="lesson-inner">
      <p class="lesson-kicker">02 · Control the hectares</p>
      <h2>Area control meters the forest floor.</h2>
      <p class="lead">Harvest the same proportion of the forest that the planning horizon occupies within one rotation. The cap is measured in hectares—not timber volume.</p>
      <div class="formula-stage">
        <section class="formula-card">
          <h3>Allowable area</h3>
          <div class="equation">Forest area × <span class="fraction"><span>plan length</span><span>rotation</span></span></div>
          <div class="input-row"><label for="areaForest">Forest area (ha)</label><input id="areaForest" type="number" min="1" value="6000"></div>
          <div class="input-row"><label for="areaHorizon">Plan length (years)</label><input id="areaHorizon" type="number" min="1" value="20"></div>
          <div class="input-row"><label for="areaRotation">Rotation (years)</label><input id="areaRotation" type="number" min="1" value="40"></div>
        </section>
        <section class="result-card">
          <p class="eyebrow">20-year limit</p>
          <div class="result-number" id="areaResult">3,000</div>
          <div class="result-unit">hectares may be harvested</div>
          <p id="areaExplanation" style="margin-top:18px;color:var(--muted);font-size:13px;line-height:1.55">The horizon is half of a rotation, so at most half of the forest area enters the harvest schedule.</p>
        </section>
      </div>
      <section class="visual-panel">
        <div class="panel-head"><div><h3>Translate the horizon into periods</h3><p>Five 4-year periods divide the 20-year plan.</p></div></div>
        <div class="flow-strip">${[1,2,3,4,5].map(period => `<div class="flow-block"><strong>600 ha</strong><span>period ${period}</span></div>`).join("")}</div>
      </section>
      <div class="next-row"><button class="next-button" type="button" data-next="2">Next: control the volume →</button></div>
    </div>`;
}

function renderVolumeControl() {
  const rows = caseData.compartments.map((compartment, index) => {
    const avg = compartment.yields.reduce((a, b) => a + b, 0) / 5;
    return `<tr><td><button class="yield-example-button ${index === 0 ? "active" : ""}" type="button" data-yield-example="${index}">${compartment.name}<span>show math</span></button></td><td>${formatNumber(compartment.area)}</td><td>${formatNumber(avg, 1)}</td><td>${formatNumber(compartment.area * avg)}</td></tr>`;
  }).join("");
  return `
    <div class="lesson-inner">
      <p class="lesson-kicker">03 · Control the timber</p>
      <h2>Volume control meters what the forest grows.</h2>
      <p class="lead">Here, the limiting currency is cubic meters. The lab estimates average inventory across the five yield observations, then assigns the horizon's share of one rotation.</p>
      <section class="visual-panel">
        <div class="panel-head"><div><h3>Build average inventory</h3><p>Area × average yield converts each compartment to cubic meters.</p></div></div>
        <div style="overflow-x:auto">
          <table class="inventory-table">
            <thead><tr><th>Compartment</th><th>Area (ha)</th><th>Avg. yield (m³/ha)</th><th>Inventory (m³)</th></tr></thead>
            <tbody>${rows}</tbody>
            <tfoot><tr><td colspan="3">Average forest inventory</td><td>${formatNumber(caseData.avgInventory)}</td></tr></tfoot>
          </table>
        </div>
        <div class="yield-explainer" id="yieldExplainer" aria-live="polite"></div>
      </section>
      <div class="formula-stage">
        <section class="formula-card" style="border-top-color:var(--blue)"><h3>Allowable volume</h3><div class="equation">1,263,024 m³ × <span class="fraction"><span>20 years</span><span>40 years</span></span></div><p style="color:var(--muted);margin-bottom:0">The plan covers one-half of a rotation.</p></section>
        <section class="result-card"><p class="eyebrow">20-year limit</p><div class="result-number">631,512</div><div class="result-unit">m³ may be harvested</div><p style="margin-top:18px;color:var(--muted);font-size:13px">With strict even flow: ${formatNumber(caseData.periodicVolume, 1)} m³ in each of five periods.</p></section>
      </div>
      <div class="next-row"><button class="next-button" type="button" data-next="3">Next: compare the controls →</button></div>
    </div>`;
}

function renderComparison() {
  return `
    <div class="lesson-inner">
      <p class="lesson-kicker">04 · Choose the right constraint</p>
      <h2>Same forest. Different control lever.</h2>
      <p class="lead">Both methods aim for sustained harvest, but they hold different quantities constant. Yield differences make their period-by-period schedules diverge.</p>
      <div class="comparison-table">
        <article class="comparison-card area"><h3>Area control</h3><dl><div><dt>Limits</dt><dd>hectares harvested</dd></div><div><dt>Needs</dt><dd>forest area, rotation, plan length</dd></div><div><dt>Strength</dt><dd>simple and closely tied to balanced age classes</dd></div><div><dt>Watch for</dt><dd>equal area can produce unequal volume</dd></div></dl></article>
        <article class="comparison-card volume"><h3>Volume control</h3><dl><div><dt>Limits</dt><dd>cubic meters harvested</dd></div><div><dt>Needs</dt><dd>area plus reliable yield or inventory estimates</dd></div><div><dt>Strength</dt><dd>directly targets timber flow</dd></div><div><dt>Watch for</dt><dd>equal volume may require unequal area</dd></div></dl></article>
      </div>
      <section class="quiz-card">
        <p class="eyebrow" style="color:#b9d3c2">Quick check</p>
        <h3>A 4-year period has unusually high yield per hectare. To keep volume even, what should happen?</h3>
        <div class="quiz-options">
          <button class="choice-button" type="button" data-correct="false">Harvest more area</button>
          <button class="choice-button" type="button" data-correct="true">Harvest less area</button>
          <button class="choice-button" type="button" data-correct="false">Ignore the yield difference</button>
        </div>
        <p class="quiz-feedback" id="quizFeedback" aria-live="polite"></p>
      </section>
      <div class="next-row"><button class="next-button" type="button" data-next="4">Next: build the LP →</button></div>
    </div>`;
}

const lpSections = {
  objective: {
    label: "Objective",
    number: "Eq. 1",
    title: "Maximize total pulpwood",
    equation: "Max Z = Σᵢ Σⱼ yᵢⱼXᵢⱼ",
    detail: "Multiply every harvested hectare by its period-specific yield, then add all 20 compartment-period contributions.",
    concrete: "217X₁₁ + 238X₁₂ + … + 224X₄₅",
  },
  land: {
    label: "Land",
    number: "Eq. 2–5",
    title: "Do not harvest more area than exists",
    equation: "Σⱼ Xᵢⱼ ≤ Aᵢ  for each compartment i",
    detail: "Each compartment gets its own area budget. For example, the five decisions for Compartment 1 must sum to no more than 1,750 ha.",
    concrete: "X₁₁ + X₁₂ + X₁₃ + X₁₄ + X₁₅ ≤ 1,750",
  },
  bookkeeping: {
    label: "Bookkeeping",
    number: "Eq. 6–10",
    title: "Convert hectares into period volume",
    equation: "Hⱼ = Σᵢ yᵢⱼXᵢⱼ",
    detail: "Hⱼ records the cubic meters produced in period j. Compartment 4 contributes nothing in periods 1 and 2 because it cannot yet be harvested.",
    concrete: "H₃ = 259X₁₃ + 308X₂₃ + 119X₃₃ + 175X₄₃",
  },
  flow: {
    label: "Even flow",
    number: "Eq. 11–14",
    title: "Hold periodic output constant",
    equation: "H₂ = H₁, H₃ = H₂, H₄ = H₃, H₅ = H₄",
    detail: "These four equalities make all five harvest volumes identical. Removing them relaxes the model and can only maintain or increase the maximum objective value.",
    concrete: "H₁ = H₂ = H₃ = H₄ = H₅",
  },
  control: {
    label: "Control",
    number: "Eq. 15 or 16",
    title: "Choose one regulation limit",
    equation: "Σᵢ Σⱼ Xᵢⱼ ≤ 3,000 ha   OR   Σⱼ Hⱼ ≤ 631,512 m³",
    detail: "The two LP versions share the objective, land, bookkeeping, even-flow, and nonnegativity rules. Only the final regulation constraint changes.",
    concrete: "AreaControl uses Eq. 15; VolControl uses Eq. 16.",
  },
};

function renderLinearProgram() {
  const yieldRows = caseData.compartments.map((compartment, index) => `
    <tr><td>C${index + 1}</td>${compartment.yields.map(value => `<td>${value}</td>`).join("")}<td>${formatNumber(compartment.area)}</td></tr>`).join("");
  return `
    <div class="lesson-inner">
      <p class="lesson-kicker">05 · Formulate the decision</p>
      <h2>Turn the forest story into a linear program.</h2>
      <p class="lead">The solver chooses when and where to harvest. Your job is to translate biological yield, available land, sustained flow, and regulation policy into equations it can obey.</p>

      <div class="problem-ribbon">
        <div><span>Forest</span><strong>6,000 ha</strong></div>
        <div><span>Compartments</span><strong>4</strong></div>
        <div><span>Periods</span><strong>5 × 4 years</strong></div>
        <div><span>Rotation</span><strong>40 years</strong></div>
      </div>

      <section class="visual-panel">
        <div class="panel-head"><div><h3>Start with the decision variables</h3><p>One variable for every compartment–period combination gives 4 × 5 = 20 decisions.</p></div></div>
        <div class="variable-definition"><strong>X<sub>ij</sub></strong><span>= hectares from compartment <em>i</em> harvested in period <em>j</em></span></div>
        <div class="decision-matrix" aria-label="Decision variable matrix">
          <span></span>${[1,2,3,4,5].map(period => `<b>P${period}</b>`).join("")}
          ${caseData.compartments.map((_, compartment) => `<b>C${compartment + 1}</b>${[1,2,3,4,5].map(period => `<span>X<sub>${compartment + 1}${period}</sub></span>`).join("")}`).join("")}
        </div>
        <p class="model-note"><strong>Domain:</strong> every X<sub>ij</sub> ≥ 0. <strong>Special rule:</strong> X<sub>41</sub> = X<sub>42</sub> = 0 because Compartment 4 was cut recently and is unavailable in the first two periods.</p>
      </section>

      <section class="lp-browser">
        <div class="panel-head"><div><h3>Explore the model anatomy</h3><p>Select each layer to see its general form and a lab-specific equation.</p></div></div>
        <div class="lp-tabs" role="tablist" aria-label="LP equation groups">
          ${Object.entries(lpSections).map(([key, section], index) => `<button type="button" role="tab" aria-selected="${index === 0}" class="${index === 0 ? "active" : ""}" data-lp-section="${key}"><span>${section.number}</span>${section.label}</button>`).join("")}
        </div>
        <div class="lp-equation-panel" id="lpEquationPanel" aria-live="polite"></div>
        <details class="full-model">
          <summary>Show the complete Lab 4 formulation</summary>
          <div class="full-model-body">
            <section>
              <h4>Maximize total production</h4>
              <code>Max Z = 217X₁₁ + 238X₁₂ + 259X₁₃ + 273X₁₄ + 287X₁₅</code>
              <code>+ 308X₂₁ + 315X₂₂ + 308X₂₃ + 343X₂₄ + 294X₂₅</code>
              <code>+ 56X₃₁ + 91X₃₂ + 119X₃₃ + 147X₃₄ + 168X₃₅</code>
              <code>+ 0X₄₁ + 0X₄₂ + 175X₄₃ + 203X₄₄ + 224X₄₅</code>
            </section>
            <section>
              <h4>Available area by compartment</h4>
              <code>X₁₁ + X₁₂ + X₁₃ + X₁₄ + X₁₅ ≤ 1,750</code>
              <code>X₂₁ + X₂₂ + X₂₃ + X₂₄ + X₂₅ ≤ 1,610</code>
              <code>X₃₁ + X₃₂ + X₃₃ + X₃₄ + X₃₅ ≤ 1,340</code>
              <code>X₄₁ + X₄₂ + X₄₃ + X₄₄ + X₄₅ ≤ 1,300</code>
            </section>
            <section>
              <h4>Period-volume bookkeeping</h4>
              <code>H₁ = 217X₁₁ + 308X₂₁ + 56X₃₁</code>
              <code>H₂ = 238X₁₂ + 315X₂₂ + 91X₃₂</code>
              <code>H₃ = 259X₁₃ + 308X₂₃ + 119X₃₃ + 175X₄₃</code>
              <code>H₄ = 273X₁₄ + 343X₂₄ + 147X₃₄ + 203X₄₄</code>
              <code>H₅ = 287X₁₅ + 294X₂₅ + 168X₃₅ + 224X₄₅</code>
            </section>
            <section>
              <h4>Even flow and regulation</h4>
              <code>H₂ = H₁; H₃ = H₂; H₄ = H₃; H₅ = H₄</code>
              <code>Area version: ΣᵢΣⱼ Xᵢⱼ ≤ 3,000 ha</code>
              <code>Volume version: H₁ + H₂ + H₃ + H₄ + H₅ ≤ 631,512 m³</code>
              <code>Xᵢⱼ ≥ 0 for every i and j</code>
            </section>
          </div>
        </details>
      </section>

      <section class="visual-panel">
        <div class="panel-head"><div><h3>The coefficients come from the yield table</h3><p>Values are cubic meters per hectare; area availability is shown at right.</p></div></div>
        <div style="overflow-x:auto">
          <table class="inventory-table yield-matrix">
            <thead><tr><th>Comp.</th>${[1,2,3,4,5].map(period => `<th>P${period}</th>`).join("")}<th>Area (ha)</th></tr></thead>
            <tbody>${yieldRows}</tbody>
          </table>
        </div>
      </section>

      <section class="quiz-card lp-check">
        <p class="eyebrow" style="color:#b9d3c2">Formulation check</p>
        <h3>What is the only constraint group that changes between the AreaControl and VolControl worksheets?</h3>
        <div class="quiz-options">
          <button class="choice-button" type="button" data-lp-correct="false">Compartment land constraints</button>
          <button class="choice-button" type="button" data-lp-correct="false">Even-flow constraints</button>
          <button class="choice-button" type="button" data-lp-correct="true">The final regulation constraint</button>
        </div>
        <p class="quiz-feedback" id="lpQuizFeedback" aria-live="polite"></p>
      </section>

      <div class="next-row"><button class="next-button" type="button" data-next="0">Review from the start ↺</button></div>
    </div>`;
}

function renderNav() {
  const nav = document.querySelector("#lessonNav");
  nav.innerHTML = lessons.map((lesson, index) => `
    <button type="button" class="nav-button ${index === state.lesson ? "active" : ""}" data-lesson="${index}" ${index === state.lesson ? 'aria-current="step"' : ""}>
      <span class="nav-index">0${index + 1}</span><span>${lesson.short}</span>
    </button>`).join("");
}

function renderLesson() {
  renderNav();
  document.querySelector("#lesson").innerHTML = lessons[state.lesson].render();
  document.querySelector("#progressLabel").textContent = `${state.lesson + 1} of ${lessons.length}`;
  document.querySelector("#progressBar").style.width = `${((state.lesson + 1) / lessons.length) * 100}%`;
  bindLessonEvents();
}

function bindLessonEvents() {
  document.querySelectorAll("[data-next]").forEach(button => button.addEventListener("click", () => setLesson(Number(button.dataset.next))));
  const advance = document.querySelector("#advanceForest");
  if (advance) advance.addEventListener("click", () => {
    state.ageAreas = [state.ageAreas.at(-1), ...state.ageAreas.slice(0, -1)];
    renderAgeChart();
  });
  if (document.querySelector("#ageChart")) renderAgeChart();
  ["areaForest", "areaHorizon", "areaRotation"].forEach(id => {
    const input = document.querySelector(`#${id}`);
    if (input) input.addEventListener("input", updateAreaCalculator);
  });
  document.querySelectorAll("[data-correct]").forEach(button => button.addEventListener("click", handleQuiz));
  document.querySelectorAll("[data-lp-section]").forEach(button => button.addEventListener("click", () => selectLpSection(button.dataset.lpSection)));
  document.querySelectorAll("[data-lp-correct]").forEach(button => button.addEventListener("click", handleLpQuiz));
  document.querySelectorAll("[data-yield-example]").forEach(button => button.addEventListener("click", () => renderYieldExample(Number(button.dataset.yieldExample))));
  if (document.querySelector("#lpEquationPanel")) selectLpSection("objective");
  if (document.querySelector("#yieldExplainer")) renderYieldExample(0);
}

function renderYieldExample(index) {
  const compartment = caseData.compartments[index];
  const totalYield = compartment.yields.reduce((sum, value) => sum + value, 0);
  const averageYield = totalYield / compartment.yields.length;
  const inventory = compartment.area * averageYield;
  document.querySelectorAll("[data-yield-example]").forEach(button => {
    const active = Number(button.dataset.yieldExample) === index;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  document.querySelector("#yieldExplainer").innerHTML = `
    <div class="yield-explainer-head">
      <div><p class="eyebrow">Worked example</p><h4>${compartment.name}</h4></div>
      <span class="yield-badge">${formatNumber(averageYield, 1)} m³/ha</span>
    </div>
    <div class="yield-steps">
      <div><span class="step-number">1</span><p><strong>Add the five period yields</strong><code>${compartment.yields.join(" + ")} = ${formatNumber(totalYield)} m³/ha</code></p></div>
      <div><span class="step-number">2</span><p><strong>Divide by five observations</strong><code>${formatNumber(totalYield)} ÷ 5 = ${formatNumber(averageYield, 1)} m³/ha</code></p></div>
      <div><span class="step-number">3</span><p><strong>Convert per-hectare yield to inventory</strong><code>${formatNumber(compartment.area)} ha × ${formatNumber(averageYield, 1)} m³/ha = ${formatNumber(inventory)} m³</code></p></div>
    </div>
    <p class="yield-why"><strong>Why average instead of add?</strong> The five yields describe the same compartment at five alternative harvest periods. Averaging gives one representative yield per hectare; using their sum as inventory would count the same hectare five times.${compartment.yields.includes(0) ? " The zero-yield periods are still observations, so they remain in the numerator and the divisor stays five." : ""}</p>`;
}

function selectLpSection(key) {
  const section = lpSections[key];
  if (!section) return;
  document.querySelectorAll("[data-lp-section]").forEach(button => {
    const active = button.dataset.lpSection === key;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  document.querySelector("#lpEquationPanel").innerHTML = `
    <div><p class="eyebrow">${section.number}</p><h3>${section.title}</h3><p>${section.detail}</p></div>
    <div class="equation-stack"><code>${section.equation}</code><span>${section.concrete}</span></div>`;
}

function handleLpQuiz(event) {
  const chosen = event.currentTarget;
  document.querySelectorAll("[data-lp-correct]").forEach(button => {
    button.classList.remove("correct", "incorrect");
    button.disabled = true;
  });
  const correct = chosen.dataset.lpCorrect === "true";
  chosen.classList.add(correct ? "correct" : "incorrect");
  if (!correct) document.querySelector('[data-lp-correct="true"]').classList.add("correct");
  document.querySelector("#lpQuizFeedback").textContent = correct
    ? "Correct. Equation 15 limits hectares; Equation 16 limits cubic meters. The rest of the LP is shared."
    : "The objective, land, bookkeeping, and even-flow groups stay the same. Compare Equations 15 and 16.";
}

function renderAgeChart() {
  const chart = document.querySelector("#ageChart");
  if (!chart) return;
  const max = Math.max(...state.ageAreas, 1);
  chart.innerHTML = state.ageAreas.map((area, index) => `
    <div class="age-column"><span class="age-value">${formatNumber(area)} ha</span><div class="age-bar" style="height:${Math.max(8, (area / max) * 145)}px"></div><span class="age-label">${index * 4}–${index * 4 + 4}</span></div>`).join("");
}

function updateAreaCalculator() {
  const forest = Math.max(0, Number(document.querySelector("#areaForest").value) || 0);
  const horizon = Math.max(0, Number(document.querySelector("#areaHorizon").value) || 0);
  const rotation = Math.max(1, Number(document.querySelector("#areaRotation").value) || 1);
  const result = forest * Math.min(1, horizon / rotation);
  document.querySelector("#areaResult").textContent = formatNumber(result);
  const share = Math.min(100, (horizon / rotation) * 100);
  document.querySelector("#areaExplanation").textContent = `The horizon is ${formatNumber(share, 1)}% of a rotation, so up to that share of the forest enters the harvest schedule.`;
}

function handleQuiz(event) {
  const chosen = event.currentTarget;
  document.querySelectorAll(".choice-button").forEach(button => {
    button.classList.remove("correct", "incorrect");
    button.disabled = true;
  });
  const correct = chosen.dataset.correct === "true";
  chosen.classList.add(correct ? "correct" : "incorrect");
  if (!correct) document.querySelector('[data-correct="true"]').classList.add("correct");
  document.querySelector("#quizFeedback").textContent = correct
    ? "Exactly. More volume per hectare means fewer hectares are needed to meet the same volume target."
    : "Look at the units: when m³/ha rises, the hectares needed for a fixed m³ target fall.";
}

function setLesson(index) {
  state.lesson = index;
  renderLesson();
  document.querySelector("#lesson").focus({ preventScroll: true });
  if (window.innerWidth < 720) document.querySelector("#lesson").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderWorkspace() {
  const isArea = state.mode === "area";
  document.querySelectorAll("[data-mode]").forEach(button => button.classList.toggle("active", button.dataset.mode === state.mode));
  const callout = document.querySelector("#workspaceCallout");
  callout.style.borderLeftColor = isArea ? "var(--amber)" : "var(--blue)";
  callout.innerHTML = isArea
    ? `<strong>Target: ${formatNumber(caseData.periodicArea)} ha per period</strong>Equal area is the teaching benchmark for a 40-year rotation split into 4-year periods.`
    : `<strong>Illustration—not an LP solution</strong>Each bar represents <b>area harvested (ha)</b>, estimated only from the yield table. The text at right shows area → resulting volume.`;

  const plannerRows = state.planAreas.map((area, index) => {
    const volume = area * caseData.avgYieldByPeriod[index];
    const output = isArea ? `${formatNumber(area)} ha` : `${formatNumber(area)} ha → ${formatNumber(volume)} m³`;
    return `<div class="period-row"><label for="period${index}">P${index + 1}</label><input id="period${index}" type="range" min="0" max="1000" step="1" value="${Math.round(area)}" data-period="${index}" aria-label="Period ${index + 1} harvest area"><span class="period-output">${output}</span></div>`;
  }).join("");
  document.querySelector("#periodPlanner").innerHTML = `
    <div class="planner-legend"><span>${isArea ? "Bar: harvest area" : "Bar: illustrative harvest area"}</span><strong>${isArea ? "hectares" : `Target volume: ${formatNumber(caseData.periodicVolume, 1)} m³`}</strong></div>
    ${plannerRows}`;

  document.querySelectorAll("[data-period]").forEach(input => input.addEventListener("input", event => {
    state.planAreas[Number(event.target.dataset.period)] = Number(event.target.value);
    renderWorkspace();
  }));

  const volumes = state.planAreas.map((area, index) => area * caseData.avgYieldByPeriod[index]);
  const totalArea = state.planAreas.reduce((a, b) => a + b, 0);
  const totalVolume = volumes.reduce((a, b) => a + b, 0);
  const controllingTotal = isArea ? totalArea : totalVolume;
  const limit = isArea ? caseData.allowableArea : caseData.allowableVolume;
  const withinLimit = controllingTotal <= limit + 1;
  const spread = isArea
    ? Math.max(...state.planAreas) - Math.min(...state.planAreas)
    : Math.max(...volumes) - Math.min(...volumes);
  const evenTolerance = isArea ? 10 : 1500;
  const even = spread <= evenTolerance;

  document.querySelector("#workspaceSummary").innerHTML = `
    <div class="summary-row ${withinLimit ? "pass" : "fail"}"><span>${isArea ? "20-year area" : "20-year volume"}</span><strong>${formatNumber(controllingTotal)} / ${formatNumber(limit)} ${isArea ? "ha" : "m³"}</strong></div>
    <div class="summary-row ${even ? "pass" : "fail"}"><span>${isArea ? "Area rhythm" : "Volume even flow"}</span><strong>${even ? "Balanced" : "Uneven"}</strong></div>
    <div class="summary-row"><span>${isArea ? "Resulting volume" : "Illustrative total area"}</span><strong>${isArea ? `${formatNumber(totalVolume)} m³` : `${formatNumber(totalArea)} ha`}</strong></div>`;
  document.querySelector("#loadExample").textContent = isArea ? "Load teaching example" : "Load yield-table illustration";
}

function loadTeachingExample() {
  if (state.mode === "area") {
    state.planAreas = [600, 600, 600, 600, 600];
  } else {
    state.planAreas = caseData.avgYieldByPeriod.map(yieldValue => caseData.periodicVolume / yieldValue);
  }
  renderWorkspace();
}

document.querySelector("#lessonNav").addEventListener("click", event => {
  const button = event.target.closest("[data-lesson]");
  if (button) setLesson(Number(button.dataset.lesson));
});

document.querySelector(".mode-switch").addEventListener("click", event => {
  const button = event.target.closest("[data-mode]");
  if (!button) return;
  state.mode = button.dataset.mode;
  loadTeachingExample();
});

document.querySelector("#loadExample").addEventListener("click", loadTeachingExample);
document.querySelector("#resetPlan").addEventListener("click", () => {
  state.planAreas = [0, 0, 0, 0, 0];
  renderWorkspace();
});

renderLesson();
loadTeachingExample();
