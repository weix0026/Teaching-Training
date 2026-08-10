const forest = {
  totalArea: 500,
  periods: 3,
  periodYears: 10,
  ageClasses: [
    { label: "Age 1", range: "0–10", yield: 50 },
    { label: "Age 2", range: "11–20", yield: 250 },
    { label: "Age 3", range: "21–30", yield: 500 },
    { label: "Age 4", range: "31+", yield: 600 },
  ],
  initialState: [100, 200, 50, 150],
};

const lpSolutions = {
  q1: {
    title: "Q1 · Maximize transition-period timber",
    note: "Reference solution stored in the Lab6DM workbook. States A₃ and A₄ are equal, so the path ends in steady state.",
    cuts: [[0, 0, 50, 150], [0, 100, 200, 0], [100, 200, 0, 0]],
    volumes: [115000, 125000, 55000],
    total: 295000,
  },
  q3: {
    title: "Q3 · Preserve at least 150 ha in Age 4",
    note: "Reference solution stored in the Lab6DM workbook. The extra Age-4 condition reduces the maximum transition-period harvest.",
    cuts: [[0, 0, 0, 150], [25, 0, 50, 50], [0, 25, 0, 100]],
    volumes: [90000, 56250, 66250],
    total: 212500,
  },
};

const state = {
  lesson: Math.min(4, Math.max(0, Number(new URLSearchParams(window.location.search).get("lesson")) || 0)),
  period: 1,
  currentA: [...forest.initialState],
  currentX: [0, 0, 0, 0],
  totalVolume: 0,
  history: [{ period: 1, areas: [...forest.initialState] }],
};

const format = (value, digits = 0) => new Intl.NumberFormat("en-US", {
  minimumFractionDigits: digits,
  maximumFractionDigits: digits,
}).format(value);

function transition(areas, cuts) {
  return [
    cuts.reduce((sum, value) => sum + value, 0),
    areas[0] - cuts[0],
    areas[1] - cuts[1],
    (areas[2] - cuts[2]) + (areas[3] - cuts[3]),
  ];
}

function harvestVolume(cuts) {
  return cuts.reduce((sum, cut, index) => sum + cut * forest.ageClasses[index].yield, 0);
}

const lessons = [
  { short: "Why dynamic?", render: renderWhyDynamic },
  { short: "A versus X", render: renderVariables },
  { short: "Transitions", render: renderTransitions },
  { short: "Steady state", render: renderSteadyState },
  { short: "Build the LP", render: renderLp },
];

function renderWhyDynamic() {
  return `
    <div class="lesson-inner">
      <p class="lesson-kicker">01 · Look beyond one rotation</p>
      <h2>The forest remembers every harvest decision.</h2>
      <p class="lead">When a planning horizon spans multiple rotations, a stand may be harvested, regenerated, grown, and harvested again. A dynamic—or Model III—formulation tracks how today's decision reshapes tomorrow's forest.</p>
      <div class="concept-grid">
        <article class="concept-card"><h3>500 hectares</h3><p>The entire forest remains in the model. Harvest transfers area; it does not make land disappear.</p></article>
        <article class="concept-card"><h3>10-year periods</h3><p>Age is tallied at each decade's start. Harvest may occur during that decade.</p></article>
        <article class="concept-card"><h3>Four age classes</h3><p>All forest older than 30 years is pooled into Age Class 4.</p></article>
      </div>
      <section class="visual-panel">
        <div class="panel-head"><div><h3>From schedule to system</h3><p>The key change is feedback: decisions alter the next period's available stock.</p></div></div>
        <div class="static-dynamic">
          <article class="model-card"><h3>Static schedule</h3><ul><li>Each stand is scheduled once</li><li>Initial inventory drives all choices</li><li>Best for horizons within one rotation</li></ul></article>
          <div class="bridge-arrow" aria-hidden="true">→</div>
          <article class="model-card dynamic"><h3>Dynamic model</h3><ul><li>Harvested area regenerates</li><li>Uncut area grows to older classes</li><li>Future choices depend on earlier cuts</li></ul></article>
        </div>
      </section>
      <div class="next-row"><button type="button" class="next-button" data-next="1">Next: meet A and X →</button></div>
    </div>`;
}

function renderVariables() {
  return `
    <div class="lesson-inner">
      <p class="lesson-kicker">02 · Separate condition from choice</p>
      <h2>Two variable families play different roles.</h2>
      <p class="lead">State variables describe what exists at a period's start. Harvest variables describe what the manager chooses to cut during that period. Confusing them breaks the transition logic.</p>
      <div class="variable-pair">
        <article class="variable-card state"><div class="variable-symbol"><strong>A<sub>ij</sub></strong><div><h3>State variable</h3><p>endogenous forest condition</p></div></div><p>Area in age class <em>i</em> at the start of period <em>j</em>. Only the first-period states are fixed data; transition equations determine later states. Solver may include these cells as changing variables, but they are not free management choices.</p></article>
        <article class="variable-card harvest"><div class="variable-symbol"><strong>X<sub>ij</sub></strong><div><h3>Harvest variable</h3><p>management decision</p></div></div><p>Area cut and reforested from age class <em>i</em> during period <em>j</em>. Every decision is limited by its matching state: X<sub>ij</sub> ≤ A<sub>ij</sub>.</p></article>
      </div>
      <section class="visual-panel">
        <div class="panel-head"><div><h3>Read the subscripts</h3><p>The same index positions always carry the same meaning.</p></div></div>
        <div class="index-anatomy"><div class="big-variable">A<sub>23</sub></div><div class="index-list"><span><strong>A</strong> = state area, not a decision</span><span><strong>2</strong> = Age Class 2</span><span><strong>3</strong> = start of Period 3</span></div></div>
        <div class="index-anatomy"><div class="big-variable" style="color:var(--harvest-dark)">X<sub>32</sub></div><div class="index-list"><span><strong>X</strong> = harvested area</span><span><strong>3</strong> = Age Class 3</span><span><strong>2</strong> = during Period 2</span></div></div>
      </section>
      <section class="quiz-card">
        <p class="eyebrow" style="color:#b9d1c8">Quick check</p>
        <h3>Which variable represents the direct management action?</h3>
        <div class="quiz-options"><button class="quiz-choice" data-correct="false" type="button">A<sub>32</sub>, the Age-3 state in Period 2</button><button class="quiz-choice" data-correct="true" type="button">X<sub>32</sub>, the Age-3 harvest in Period 2</button></div>
        <p class="quiz-feedback" id="quizFeedback" aria-live="polite"></p>
      </section>
      <div class="next-row"><button type="button" class="next-button" data-next="2">Next: move the forest →</button></div>
    </div>`;
}

function renderTransitions() {
  return `
    <div class="lesson-inner">
      <p class="lesson-kicker">03 · Connect one decade to the next</p>
      <h2>Harvest resets age; survival moves forward.</h2>
      <p class="lead">Every transition equation is an accounting identity. Harvested hectares return as Age Class 1. Unharvested hectares age, while Classes 3 and 4 merge into the oldest class.</p>
      <section class="transition-board">
        <div class="panel-head"><div><h3>General transition from j to j + 1</h3><p>Use the live lab at right to test each identity.</p></div></div>
        <div class="transition-equations">
          <div class="transition-equation"><code>A<sub>1,j+1</sub> = Σ<sub>i</sub>X<sub>ij</sub></code><span>Every harvested hectare is immediately reforested into Age Class 1.</span></div>
          <div class="transition-equation"><code>A<sub>2,j+1</sub> = A<sub>1j</sub> − X<sub>1j</sub></code><span>Uncut Age-1 area grows into Age Class 2.</span></div>
          <div class="transition-equation"><code>A<sub>3,j+1</sub> = A<sub>2j</sub> − X<sub>2j</sub></code><span>Uncut Age-2 area grows into Age Class 3.</span></div>
          <div class="transition-equation"><code>A<sub>4,j+1</sub> = (A<sub>3j</sub>−X<sub>3j</sub>) + (A<sub>4j</sub>−X<sub>4j</sub>)</code><span>Uncut Age-3 area ages in; uncut Age-4 area remains pooled here.</span></div>
          <div class="transition-equation"><code>Σ<sub>i</sub>A<sub>i,j+1</sub> = 500 ha</code><span>Because clearcut area is reforested, the transition conserves the entire forest area.</span></div>
        </div>
      </section>
      <div class="flow-diagram"><div class="flow-node"><strong>Age 1</strong><span>0–10 years</span></div><div class="flow-node"><strong>Age 2</strong><span>11–20 years</span></div><div class="flow-node"><strong>Age 3</strong><span>21–30 years</span></div><div class="flow-node"><strong>Age 4</strong><span>31+ years, pooled</span></div></div>
      <div class="next-row"><button type="button" class="next-button" data-next="3">Next: recognize steady state →</button></div>
    </div>`;
}

function renderSteadyState() {
  return `
    <div class="lesson-inner">
      <p class="lesson-kicker">04 · Hold the future condition</p>
      <h2>Steady state means the forest can repeat itself.</h2>
      <p class="lead">The transition period ends when the state entering the next decade matches the state already achieved. Harvest may continue, but the age-class distribution no longer changes.</p>
      <div class="steady-equality"><code>A<sub>i3</sub> = A<sub>i4</sub> for i = 1, 2, 3, 4</code><p>Four equality constraints connect the final transition decision to the perpetual future condition.</p></div>
      <div class="state-compare"><div class="state-vector"><h3>Start of Period 3</h3><div class="vector-cells"><span>A<sub>13</sub></span><span>A<sub>23</sub></span><span>A<sub>33</sub></span><span>A<sub>43</sub></span></div></div><div class="equality-mark">=</div><div class="state-vector"><h3>Start of Period 4</h3><div class="vector-cells"><span>A<sub>14</sub></span><span>A<sub>24</sub></span><span>A<sub>34</sub></span><span>A<sub>44</sub></span></div></div></div>
      <section class="visual-panel">
        <div class="panel-head"><div><h3>Steady state is broader than regulated forest</h3><p>A state can repeat without equal area in every age class.</p></div></div>
        <div class="concept-grid" style="margin:0"><article class="concept-card"><h3>Steady state</h3><p>The entire state vector repeats: A<sub>i3</sub> = A<sub>i4</sub>. Its components do not need to be equal to one another.</p></article><article class="concept-card"><h3>Regulated forest</h3><p>A special steady state with equal or intentionally balanced age-class areas under a chosen rotation.</p></article><article class="concept-card"><h3>Long-term yield</h3><p>The harvest compatible with a repeating state can continue into future periods.</p></article></div>
      </section>
      <div class="next-row"><button type="button" class="next-button" data-next="4">Next: formulate the LP →</button></div>
    </div>`;
}

function renderLp() {
  return `
    <div class="lesson-inner">
      <p class="lesson-kicker">05 · Assemble the Model III LP</p>
      <h2>Decisions create states; states limit decisions.</h2>
      <p class="lead">The complete model combines harvest value, stock limits, transition identities, steady-state equalities, and nonnegativity. Lab 6 then changes the objective or adds one ecological condition.</p>
      <section class="visual-panel">
        <div class="panel-head"><div><h3>Objective for Question 1</h3><p>Maximize all timber harvested during the three-decade transition.</p></div></div>
        <div class="steady-equality" style="margin:0"><code>Max Z = Σ<sub>j=1..3</sub>(50X<sub>1j</sub> + 250X<sub>2j</sub> + 500X<sub>3j</sub> + 600X<sub>4j</sub>)</code><p>Coefficients are yield in m³/ha for Age Classes 1–4.</p></div>
      </section>
      <div class="assignment-grid">
        <article class="assignment-card"><span>Question 1</span><h3>Max transition timber</h3><p>Use all three decades in the objective and require the forest to reach steady state after the transition.</p></article>
        <article class="assignment-card"><span>Question 2</span><h3>Max sustainable timber</h3><p>Change the objective to the harvest compatible with the final repeating state rather than all transition harvests.</p></article>
        <article class="assignment-card"><span>Question 3</span><h3>Protect older forest</h3><p>Restore the Question 1 objective and add A<sub>43</sub> ≥ 150 ha at the final steady state.</p></article>
      </div>
      <section class="solution-panel">
        <div class="panel-head"><div><h3>Reference LP outputs</h3><p>These are Solver results from the supplied workbook—not values generated by the live sliders.</p></div></div>
        <div class="solution-tabs" role="tablist"><button class="active" type="button" data-solution="q1" role="tab" aria-selected="true">Q1 maximum timber</button><button type="button" data-solution="q3" role="tab" aria-selected="false">Q3 Age 4 ≥ 150 ha</button></div>
        <div class="solution-content" id="solutionContent"></div>
      </section>
      <section class="visual-panel">
        <div class="panel-head"><div><h3>Constraint checklist</h3><p>Each group has a distinct job.</p></div></div>
        <div class="concept-grid" style="margin:0"><article class="concept-card"><h3>Stock</h3><p>X<sub>ij</sub> ≤ A<sub>ij</sub> prevents harvesting area that does not exist.</p></article><article class="concept-card"><h3>Transition</h3><p>Four equations per boundary compute the next forest state.</p></article><article class="concept-card"><h3>Future</h3><p>A<sub>i3</sub> = A<sub>i4</sub> establishes the final steady state; A and X remain nonnegative.</p></article></div>
      </section>
      <div class="next-row"><button type="button" class="next-button" data-next="0">Review from the start ↺</button></div>
    </div>`;
}

function renderNav() {
  document.querySelector("#lessonNav").innerHTML = lessons.map((lesson, index) => `
    <button type="button" class="nav-button ${index === state.lesson ? "active" : ""}" data-lesson="${index}" ${index === state.lesson ? 'aria-current="step"' : ""}><span class="nav-index">0${index + 1}</span><span>${lesson.short}</span></button>`).join("");
}

function renderLesson() {
  renderNav();
  document.querySelector("#lesson").innerHTML = lessons[state.lesson].render();
  document.querySelector("#progressText").textContent = `${state.lesson + 1} of ${lessons.length}`;
  document.querySelector("#progressBar").style.width = `${((state.lesson + 1) / lessons.length) * 100}%`;
  bindLessonEvents();
}

function bindLessonEvents() {
  document.querySelectorAll("[data-next]").forEach(button => button.addEventListener("click", () => setLesson(Number(button.dataset.next))));
  document.querySelectorAll("[data-correct]").forEach(button => button.addEventListener("click", handleQuiz));
  document.querySelectorAll("[data-solution]").forEach(button => button.addEventListener("click", () => renderSolution(button.dataset.solution)));
  if (document.querySelector("#solutionContent")) renderSolution("q1");
}

function setLesson(index) {
  state.lesson = index;
  renderLesson();
  document.querySelector("#lesson").focus({ preventScroll: true });
  if (window.innerWidth < 740) document.querySelector("#lesson").scrollIntoView({ behavior: "smooth", block: "start" });
}

function handleQuiz(event) {
  const selected = event.currentTarget;
  const correct = selected.dataset.correct === "true";
  document.querySelectorAll("[data-correct]").forEach(button => {
    button.disabled = true;
    button.classList.remove("correct", "incorrect");
  });
  selected.classList.add(correct ? "correct" : "incorrect");
  if (!correct) document.querySelector('[data-correct="true"]').classList.add("correct");
  document.querySelector("#quizFeedback").textContent = correct
    ? "Correct. X represents the harvest action; transition equations determine the compatible A states."
    : "A is an endogenous forest condition. X is the variable that represents the manager's harvest action.";
}

function renderSolution(key) {
  const solution = lpSolutions[key];
  document.querySelectorAll("[data-solution]").forEach(button => {
    const active = button.dataset.solution === key;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  const rows = forest.ageClasses.map((ageClass, i) => `<tr><td>${ageClass.label}</td>${solution.cuts.map(period => `<td>${format(period[i], 1)} ha</td>`).join("")}</tr>`).join("");
  document.querySelector("#solutionContent").innerHTML = `
    <div class="solution-metrics"><div><span>Decade 1</span><strong>${format(solution.volumes[0])} m³</strong></div><div><span>Decade 2</span><strong>${format(solution.volumes[1])} m³</strong></div><div><span>Decade 3</span><strong>${format(solution.volumes[2])} m³</strong></div></div>
    <table class="solution-table"><thead><tr><th>Harvest X</th><th>Period 1</th><th>Period 2</th><th>Period 3</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><th>Total volume</th><td colspan="3">${format(solution.total)} m³</td></tr></tfoot></table>
    <p class="solution-caveat">${solution.note}</p>`;
}

function renderSimulator() {
  const done = state.period > forest.periods;
  const nextA = transition(state.currentA, state.currentX);
  const displayedNextA = done ? state.currentA : nextA;
  const currentVolume = harvestVolume(state.currentX);
  const maxArea = Math.max(...state.currentA, 1);

  document.querySelector("#periodBadge").textContent = done ? "Transition complete" : `Decade ${state.period}`;
  document.querySelector("#stateBars").innerHTML = state.currentA.map((area, index) => `
    <div class="state-bar-wrap"><b>${format(area, 1)}</b><div class="state-bar" style="height:${Math.max(3, (area / maxArea) * 70)}px"></div><span>A${index + 1}${state.period}</span></div>`).join("");

  document.querySelector("#harvestControls").innerHTML = state.currentA.map((area, index) => `
    <div class="harvest-row"><label for="cut${index}">X<sub>${index + 1}${Math.min(state.period, 3)}</sub></label><input id="cut${index}" type="range" min="0" max="${area}" step="1" value="${state.currentX[index]}" data-cut="${index}" ${done ? "disabled" : ""} aria-label="Harvest area from ${forest.ageClasses[index].label}"><output>${format(state.currentX[index])} ha</output></div>`).join("");

  document.querySelectorAll("[data-cut]").forEach(input => input.addEventListener("input", event => {
    state.currentX[Number(event.target.dataset.cut)] = Number(event.target.value);
    renderSimulator();
  }));

  document.querySelector("#nextPeriodLabel").innerHTML = done ? "final A" : `A<sub>i${state.period + 1}</sub>`;
  document.querySelector("#nextState").innerHTML = displayedNextA.map((area, index) => `<div class="next-state-cell"><strong>${format(area, 1)}</strong><span>${done ? `A${index + 1}${state.period}` : `A${index + 1}${state.period + 1}`} · ha</span></div>`).join("");

  const displayedTotal = displayedNextA.reduce((a, b) => a + b, 0);
  const conserved = Math.abs(displayedTotal - forest.totalArea) < .01;
  document.querySelector("#simMetrics").innerHTML = `
    <div class="metric-row"><span>This decade's volume</span><strong>${format(done ? 0 : currentVolume)} m³</strong></div>
    <div class="metric-row"><span>Transition total</span><strong>${format(state.totalVolume + (done ? 0 : currentVolume))} m³</strong></div>
    <div class="metric-row ${conserved ? "pass" : "fail"}"><span>${done ? "Final-state area" : "Next-state area"}</span><strong>${format(displayedTotal)} / 500 ha</strong></div>`;

  const commit = document.querySelector("#commitPeriod");
  commit.disabled = done;
  commit.textContent = state.period === forest.periods ? "Commit final decade" : done ? "Transition complete" : "Commit decade";
  document.querySelector("#historyStrip").innerHTML = state.history.map(item => `<div class="history-chip"><strong>Start P${item.period}</strong>${item.areas.map(value => format(value)).join(" · ")}</div>`).join("");
}

function commitPeriod() {
  if (state.period > forest.periods) return;
  const nextA = transition(state.currentA, state.currentX);
  state.totalVolume += harvestVolume(state.currentX);
  state.period += 1;
  state.currentA = nextA;
  state.currentX = [0, 0, 0, 0];
  state.history.push({ period: state.period, areas: [...nextA] });
  renderSimulator();
}

function resetSimulator() {
  state.period = 1;
  state.currentA = [...forest.initialState];
  state.currentX = [0, 0, 0, 0];
  state.totalVolume = 0;
  state.history = [{ period: 1, areas: [...forest.initialState] }];
  renderSimulator();
}

document.querySelector("#lessonNav").addEventListener("click", event => {
  const button = event.target.closest("[data-lesson]");
  if (button) setLesson(Number(button.dataset.lesson));
});
document.querySelector("#commitPeriod").addEventListener("click", commitPeriod);
document.querySelector("#resetSim").addEventListener("click", resetSimulator);

renderLesson();
renderSimulator();
