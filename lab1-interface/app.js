const problems = {
  poet: {
    key: "poet",
    title: "Poet-forester problem",
    source:
      "The lab changes the textbook revenue assumptions to $180 per ha for Red Pine and $360 per ha for Northern Hardwood.",
    sense: "Maximize",
    objectiveName: "Revenue",
    objectiveUnit: "$",
    objective: [180, 360],
    variables: [
      ["x1", "hectares managed as Red Pine"],
      ["x2", "hectares managed as Northern Hardwood"],
    ],
    constraints: [
      { name: "Red Pine land", a: 1, b: 0, sense: "<=", rhs: 40, unit: "ha", color: "#2f6f4e" },
      { name: "Hardwood land", a: 0, b: 1, sense: "<=", rhs: 50, unit: "ha", color: "#c58b26" },
      { name: "Poet time", a: 2, b: 3, sense: "<=", rhs: 180, unit: "days", color: "#2d5f9a" },
    ],
    polygon: [
      { x: 0, y: 0 },
      { x: 0, y: 50 },
      { x: 15, y: 50 },
      { x: 40, y: 100 / 3 },
      { x: 40, y: 0 },
    ],
    corners: [
      { name: "O", x: 0, y: 0 },
      { name: "A", x: 0, y: 50 },
      { name: "B", x: 15, y: 50 },
      { name: "C", x: 40, y: 100 / 3 },
      { name: "D", x: 40, y: 0 },
    ],
    optimum: { x: 15, y: 50, value: 20700 },
    maxX: 70,
    maxY: 70,
    gridStep: 10,
    solver: {
      changingCells: "B3:C3",
      objectiveCell: "D10",
      direction: "Max",
      constraints: ["D6 <= F6", "D7 <= F7", "D8 <= F8"],
      result: "x1 = 15, x2 = 50, revenue = $20,700",
    },
    references: [
      {
        src: "assets/references/q1-board-reference.jpg",
        caption: "Board reference from the hand-graph solution.",
      },
      {
        src: "assets/ppt-media/image1.png",
        caption: "Textbook-style Solver result screenshot for the poet problem.",
        className: "rotate-180",
      },
      {
        src: "assets/ppt-media/image4.png",
        caption: "Solver options reference: use the linear model option.",
      },
    ],
  },
  river: {
    key: "river",
    title: "River pollution problem",
    source:
      "The lab adds the constraint that chemical pulp production cannot exceed mechanical pulp production.",
    sense: "Minimize",
    objectiveName: "Pollution",
    objectiveUnit: "",
    objective: [1, 1.5],
    variables: [
      ["x1", "tons of mechanical pulp"],
      ["x2", "tons of chemical pulp"],
    ],
    constraints: [
      { name: "Worker requirement", a: 1, b: 1, sense: ">=", rhs: 300, unit: "tons", color: "#c58b26" },
      { name: "Relative production", a: 1, b: -1, sense: ">=", rhs: 0, unit: "tons", color: "#9b3c2f" },
      { name: "Revenue requirement", a: 100, b: 200, sense: ">=", rhs: 40000, unit: "$", color: "#2f6f4e" },
      { name: "Chemical capacity", a: 0, b: 1, sense: "<=", rhs: 200, unit: "tons", color: "#2d5f9a" },
      { name: "Mechanical capacity", a: 1, b: 0, sense: "<=", rhs: 300, unit: "tons", color: "#2d5f9a" },
    ],
    polygon: [
      { x: 150, y: 150 },
      { x: 200, y: 100 },
      { x: 300, y: 50 },
      { x: 300, y: 200 },
      { x: 200, y: 200 },
    ],
    corners: [
      { name: "A", x: 150, y: 150 },
      { name: "B", x: 200, y: 100 },
      { name: "C", x: 300, y: 50 },
      { name: "D", x: 300, y: 200 },
      { name: "E", x: 200, y: 200 },
    ],
    optimum: { x: 200, y: 100, value: 350 },
    maxX: 360,
    maxY: 340,
    gridStep: 50,
    solver: {
      changingCells: "B5:C5",
      objectiveCell: "D13",
      direction: "Min",
      constraints: ["D7 >= F7", "D8 >= F8", "D9 >= F9", "D10 <= F10", "D11 <= F11"],
      result: "x1 = 200, x2 = 100, pollution = 350",
    },
    references: [
      {
        src: "assets/references/q2-graph-solution.png",
        caption: "Generated graph solution for the river pollution problem.",
      },
      {
        src: "assets/ppt-media/image3.png",
        caption: "Textbook Solver parameter screenshot.",
        className: "rotate-180",
      },
      {
        src: "assets/ppt-media/image4.png",
        caption: "Solver options reference: use the linear model option.",
      },
    ],
  },
};

const steps = [
  {
    title: "Define the decision variables",
    render(problem) {
      return `
        <p class="lesson-kicker">${problem.title}</p>
        <h2>Start with what the model controls</h2>
        <p class="lesson-lead">${problem.source}</p>
        <div class="content-band split">
          <dl class="definition-list">
            ${problem.variables
              .map(([symbol, label]) => `<div><dt>${symbol}</dt><dd>${label}</dd></div>`)
              .join("")}
          </dl>
          <div class="note-panel">
            Keep units attached to the variable. A correct equation can still be wrong if hectares,
            days, tons, and dollars are mixed without tracking what each coefficient means.
          </div>
        </div>
        <div class="content-band">
          <h3>Student task</h3>
          <ul class="prompt-list">
            <li>Write one sentence for each variable before writing equations.</li>
            <li>Mark whether the problem asks for a maximum or a minimum.</li>
            <li>Use nonnegative variables unless the story explicitly allows negative production.</li>
          </ul>
        </div>
      `;
    },
  },
  {
    title: "Write the LP model",
    render(problem) {
      return `
        <p class="lesson-kicker">${problem.title}</p>
        <h2>Convert the story into equations</h2>
        <p class="lesson-lead">The Excel template uses one row per constraint and SUMPRODUCT formulas for the left-hand side.</p>
        <div class="content-band">
          <h3>Objective</h3>
          <ul class="equation-list">
            <li>
              ${problem.sense} ${problem.objectiveName}
              <span class="formula">${objectiveText(problem)}</span>
            </li>
          </ul>
        </div>
        <div class="content-band">
          <h3>Constraints</h3>
          <ul class="equation-list">
            ${problem.constraints
              .map(
                (constraint) => `
                  <li>
                    ${constraint.name}
                    <span class="formula">${constraintText(constraint)}</span>
                  </li>
                `,
              )
              .join("")}
            <li>
              Nonnegativity
              <span class="formula">x1 >= 0, x2 >= 0</span>
            </li>
          </ul>
        </div>
      `;
    },
  },
  {
    title: "Graph each constraint",
    render(problem) {
      return `
        <p class="lesson-kicker">${problem.title}</p>
        <h2>Turn each constraint into a boundary line</h2>
        <p class="lesson-lead">For each inequality, draw the equality line first, then shade the side that satisfies the inequality.</p>
        <div class="content-band split">
          <table class="constraint-table">
            <thead>
              <tr><th>Constraint</th><th>Boundary line</th><th>Feasible side</th></tr>
            </thead>
            <tbody>
              ${problem.constraints
                .map(
                  (constraint) => `
                    <tr>
                      <td>${constraint.name}</td>
                      <td>${lineText(constraint)}</td>
                      <td>${sideText(constraint)}</td>
                    </tr>
                  `,
                )
                .join("")}
            </tbody>
          </table>
          <div class="note-panel">
            The feasible region is the overlap of every shaded side. If one constraint points the
            opposite way, the final polygon changes completely.
          </div>
        </div>
      `;
    },
  },
  {
    title: "Test corner points",
    render(problem) {
      const isMax = problem.sense === "Maximize";
      return `
        <p class="lesson-kicker">${problem.title}</p>
        <h2>Evaluate only the vertices</h2>
        <p class="lesson-lead">For a linear objective, the best feasible solution occurs at a corner point when a bounded optimum exists.</p>
        <div class="content-band">
          <table class="corner-table">
            <thead>
              <tr><th>Point</th><th>x1</th><th>x2</th><th>${problem.objectiveName}</th></tr>
            </thead>
            <tbody>
              ${problem.corners
                .map((corner) => {
                  const value = objectiveValue(problem, corner.x, corner.y);
                  const best = nearly(value, problem.optimum.value);
                  return `
                    <tr class="${best ? "best-row" : ""}">
                      <td>${corner.name}</td>
                      <td>${formatNumber(corner.x)}</td>
                      <td>${formatNumber(corner.y)}</td>
                      <td>${formatObjective(problem, value)}</td>
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>
        </div>
        <div class="content-band">
          <div class="note-panel">
            ${isMax ? "Choose the largest objective value." : "Choose the smallest objective value."}
            The answer is x1 = ${formatNumber(problem.optimum.x)}, x2 = ${formatNumber(problem.optimum.y)},
            with ${problem.objectiveName.toLowerCase()} ${formatObjective(problem, problem.optimum.value)}.
          </div>
        </div>
      `;
    },
  },
  {
    title: "Set up Excel Solver",
    render(problem) {
      return `
        <p class="lesson-kicker">${problem.title}</p>
        <h2>Match the graph model inside Excel</h2>
        <p class="lesson-lead">Use the downloaded template. The decision cells feed the LHS and objective cells through SUMPRODUCT.</p>
        <div class="content-band split">
          <ul class="solver-list">
            <li><strong>Set objective:</strong> ${problem.solver.objectiveCell}</li>
            <li><strong>To:</strong> ${problem.solver.direction}</li>
            <li><strong>By changing variable cells:</strong> ${problem.solver.changingCells}</li>
            <li><strong>Add constraints:</strong> ${problem.solver.constraints.join("; ")}</li>
            <li><strong>Solver option:</strong> assume a linear model.</li>
          </ul>
          <figure class="reference-item">
            <img src="assets/ppt-media/image4.png" alt="Excel Solver options showing Assume Linear Model selected">
            <figcaption>Use the linear model option before solving.</figcaption>
          </figure>
        </div>
        <div class="content-band">
          <div class="note-panel">
            Expected Solver result: ${problem.solver.result}. If Solver returns a different point,
            check the inequality signs and the objective direction first.
          </div>
        </div>
      `;
    },
  },
  {
    title: "Check your answer",
    render(problem) {
      return `
        <p class="lesson-kicker">${problem.title}</p>
        <h2>Run a final self-check</h2>
        <p class="lesson-lead">Enter your proposed solution and compare it with the model, graph, and Excel result.</p>
        <div class="content-band">
          <div class="answer-check">
            <label>
              x1
              <input type="number" id="answerX1" step="0.01">
            </label>
            <label>
              x2
              <input type="number" id="answerX2" step="0.01">
            </label>
            <label>
              ${problem.objectiveName}
              <input type="number" id="answerObjective" step="0.01">
            </label>
          </div>
          <button class="primary-button" type="button" id="checkAnswerButton">Check answer</button>
          <div class="feedback" id="answerFeedback">Your result should satisfy every constraint and match the best corner point.</div>
        </div>
        <div class="content-band">
          <h3>Submission checklist</h3>
          <ul class="prompt-list">
            <li>Variables are defined with units.</li>
            <li>Objective direction matches the story.</li>
            <li>Every constraint has the correct sign.</li>
            <li>Graph and Solver identify the same optimum.</li>
          </ul>
        </div>
      `;
    },
  },
];

const state = {
  problemKey: "poet",
  stepIndex: 0,
  points: {
    poet: { x: 0, y: 0 },
    river: { x: 0, y: 0 },
  },
};

const stepList = document.querySelector("#stepList");
const lessonPanel = document.querySelector("#lessonPanel");
const graphWrap = document.querySelector("#graphWrap");
const graphLegend = document.querySelector("#graphLegend");
const graphTitle = document.querySelector("#graphTitle");
const sensePill = document.querySelector("#sensePill");
const pointCheck = document.querySelector("#pointCheck");
const x1Input = document.querySelector("#x1Input");
const x2Input = document.querySelector("#x2Input");
const x1Slider = document.querySelector("#x1Slider");
const x2Slider = document.querySelector("#x2Slider");
const sourceSummary = document.querySelector("#sourceSummary");
const sourceDialog = document.querySelector("#sourceDialog");
const referenceGrid = document.querySelector("#referenceGrid");

function currentProblem() {
  return problems[state.problemKey];
}

function currentPoint() {
  return state.points[state.problemKey];
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatNumber(value) {
  if (Number.isInteger(value)) return String(value);
  return Number(value).toFixed(2).replace(/\.?0+$/, "");
}

function nearly(a, b, tolerance = 0.01) {
  return Math.abs(a - b) <= tolerance;
}

function objectiveValue(problem, x, y) {
  return problem.objective[0] * x + problem.objective[1] * y;
}

function formatObjective(problem, value) {
  const rounded = Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
  return problem.objectiveUnit === "$" ? `$${rounded}` : rounded;
}

function objectiveText(problem) {
  const [c1, c2] = problem.objective;
  return `${problem.objectiveName} = ${c1}x1 + ${c2}x2`;
}

function constraintText(constraint) {
  return `${termText(constraint.a, "x1")} ${signedTerm(constraint.b, "x2")} ${constraint.sense} ${constraint.rhs}`;
}

function lineText(constraint) {
  return `${termText(constraint.a, "x1")} ${signedTerm(constraint.b, "x2")} = ${constraint.rhs}`;
}

function sideText(constraint) {
  if (constraint.b === 0) {
    const leftIsFeasible = constraint.sense === "<=" ? constraint.a > 0 : constraint.a < 0;
    return leftIsFeasible ? "left of the line" : "right of the line";
  }
  if (constraint.a === 0) {
    const belowIsFeasible = constraint.sense === "<=" ? constraint.b > 0 : constraint.b < 0;
    return belowIsFeasible ? "below the line" : "above the line";
  }
  const belowIsFeasible = constraint.sense === "<=" ? constraint.b > 0 : constraint.b < 0;
  return belowIsFeasible ? "below the line" : "above the line";
}

function termText(coefficient, variable) {
  if (coefficient === 0) return "0";
  if (coefficient === 1) return variable;
  if (coefficient === -1) return `-${variable}`;
  return `${coefficient}${variable}`;
}

function signedTerm(coefficient, variable) {
  if (coefficient === 0) return "+ 0";
  const sign = coefficient < 0 ? "-" : "+";
  const abs = Math.abs(coefficient);
  return `${sign} ${abs === 1 ? variable : `${abs}${variable}`}`;
}

function checkConstraint(constraint, x, y) {
  const lhs = constraint.a * x + constraint.b * y;
  const ok = constraint.sense === "<=" ? lhs <= constraint.rhs + 0.0001 : lhs >= constraint.rhs - 0.0001;
  return { lhs, ok };
}

function renderStepList() {
  stepList.innerHTML = steps
    .map(
      (step, index) => `
        <li>
          <button type="button" class="${index === state.stepIndex ? "active" : ""}" data-step="${index}">
            <span class="step-number">${index + 1}</span>
            <span>${step.title}</span>
          </button>
        </li>
      `,
    )
    .join("");
}

function renderLesson() {
  const problem = currentProblem();
  const step = steps[state.stepIndex];
  lessonPanel.innerHTML = `
    ${step.render(problem)}
    <div class="nav-row">
      <button class="secondary-button" type="button" id="backStep" ${state.stepIndex === 0 ? "disabled" : ""}>Back</button>
      <span class="step-count">Step ${state.stepIndex + 1} of ${steps.length}</span>
      <button class="primary-button" type="button" id="nextStep" ${state.stepIndex === steps.length - 1 ? "disabled" : ""}>Next</button>
    </div>
  `;
}

function renderWorkspace() {
  const problem = currentProblem();
  const point = currentPoint();

  graphTitle.textContent = problem.title;
  sensePill.textContent = problem.sense === "Maximize" ? "Max" : "Min";
  sourceSummary.textContent = problem.source;

  x1Input.max = problem.maxX;
  x2Input.max = problem.maxY;
  x1Slider.max = problem.maxX;
  x2Slider.max = problem.maxY;
  x1Input.value = formatNumber(point.x);
  x2Input.value = formatNumber(point.y);
  x1Slider.value = point.x;
  x2Slider.value = point.y;

  graphWrap.innerHTML = renderGraph(problem, point);
  graphLegend.innerHTML = problem.constraints
    .map(
      (constraint) => `
        <span class="legend-item">
          <span class="legend-line" style="background: ${constraint.color}"></span>
          <span>${escapeHtml(constraint.name)}</span>
        </span>
      `,
    )
    .join("");
  pointCheck.innerHTML = renderPointCheck(problem, point);
}

function renderPointCheck(problem, point) {
  const value = objectiveValue(problem, point.x, point.y);
  const checks = problem.constraints.map((constraint) => ({
    constraint,
    result: checkConstraint(constraint, point.x, point.y),
  }));
  const feasible = checks.every((item) => item.result.ok) && point.x >= 0 && point.y >= 0;
  return `
    <div class="metric-row">
      <span>Point</span>
      <strong>(${formatNumber(point.x)}, ${formatNumber(point.y)})</strong>
    </div>
    <div class="metric-row">
      <span>${problem.objectiveName}</span>
      <strong>${formatObjective(problem, value)}</strong>
    </div>
    <div class="metric-row">
      <span>Feasible</span>
      <strong>${feasible ? "Yes" : "No"}</strong>
    </div>
    <div class="constraint-checks">
      ${checks
        .map(
          ({ constraint, result }) => `
            <div class="constraint-check">
              <span class="check-dot ${result.ok ? "ok" : ""}"></span>
              <span>${constraint.name}: LHS ${formatNumber(result.lhs)} ${constraint.sense} ${constraint.rhs}</span>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderGraph(problem, point) {
  const width = 720;
  const height = 520;
  const margin = { left: 62, right: 26, top: 24, bottom: 58 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const sx = (x) => margin.left + (x / problem.maxX) * innerWidth;
  const sy = (y) => margin.top + (1 - y / problem.maxY) * innerHeight;

  const grid = [];
  for (let x = 0; x <= problem.maxX; x += problem.gridStep) {
    grid.push(`<line x1="${sx(x)}" y1="${margin.top}" x2="${sx(x)}" y2="${height - margin.bottom}" stroke="#e2e7e1"/>`);
    grid.push(`<text x="${sx(x)}" y="${height - 30}" text-anchor="middle" class="grid-label">${x}</text>`);
  }
  for (let y = 0; y <= problem.maxY; y += problem.gridStep) {
    grid.push(`<line x1="${margin.left}" y1="${sy(y)}" x2="${width - margin.right}" y2="${sy(y)}" stroke="#e2e7e1"/>`);
    grid.push(`<text x="46" y="${sy(y) + 4}" text-anchor="end" class="grid-label">${y}</text>`);
  }

  const polygonPoints = problem.polygon.map((p) => `${sx(p.x)},${sy(p.y)}`).join(" ");
  const constraintLines = problem.constraints
    .map((constraint) => {
      const endpoints = lineEndpoints(constraint, problem.maxX, problem.maxY);
      if (endpoints.length < 2) return "";
      const [p1, p2] = endpoints;
      return `
        <line x1="${sx(p1.x)}" y1="${sy(p1.y)}" x2="${sx(p2.x)}" y2="${sy(p2.y)}"
          stroke="${constraint.color}" stroke-width="3" />
      `;
    })
    .join("");

  const objectiveLine = objectiveLineSvg(problem, point, sx, sy);
  const pointInRange = point.x >= 0 && point.y >= 0 && point.x <= problem.maxX && point.y <= problem.maxY;
  const selectedPoint = pointInRange
    ? `<circle cx="${sx(point.x)}" cy="${sy(point.y)}" r="7" fill="#a63f3f" stroke="#ffffff" stroke-width="2" />`
    : "";

  return `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(problem.title)} graph">
      <rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff"/>
      ${grid.join("")}
      <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="#1f2b24" stroke-width="2"/>
      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="#1f2b24" stroke-width="2"/>
      <polygon points="${polygonPoints}" fill="#9dc3df" opacity="0.38" stroke="#3d6d8c" stroke-width="2"/>
      ${constraintLines}
      ${objectiveLine}
      ${selectedPoint}
      <text x="${width / 2}" y="${height - 8}" text-anchor="middle" class="axis-label">x1</text>
      <text x="18" y="${height / 2}" text-anchor="middle" class="axis-label" transform="rotate(-90 18 ${height / 2})">x2</text>
    </svg>
  `;
}

function lineEndpoints(constraint, maxX, maxY) {
  const pts = [];
  const add = (x, y) => {
    if (Number.isFinite(x) && Number.isFinite(y) && x >= -0.0001 && x <= maxX + 0.0001 && y >= -0.0001 && y <= maxY + 0.0001) {
      const exists = pts.some((p) => nearly(p.x, x, 0.001) && nearly(p.y, y, 0.001));
      if (!exists) pts.push({ x: Math.max(0, Math.min(maxX, x)), y: Math.max(0, Math.min(maxY, y)) });
    }
  };

  if (constraint.b !== 0) {
    add(0, constraint.rhs / constraint.b);
    add(maxX, (constraint.rhs - constraint.a * maxX) / constraint.b);
  }
  if (constraint.a !== 0) {
    add(constraint.rhs / constraint.a, 0);
    add((constraint.rhs - constraint.b * maxY) / constraint.a, maxY);
  }
  return pts.slice(0, 2);
}

function objectiveLineSvg(problem, point, sx, sy) {
  const value = objectiveValue(problem, point.x, point.y);
  if (value <= 0) return "";
  const constraint = {
    a: problem.objective[0],
    b: problem.objective[1],
    rhs: value,
  };
  const endpoints = lineEndpoints(constraint, problem.maxX, problem.maxY);
  if (endpoints.length < 2) return "";
  const [p1, p2] = endpoints;
  return `
    <line x1="${sx(p1.x)}" y1="${sy(p1.y)}" x2="${sx(p2.x)}" y2="${sy(p2.y)}"
      stroke="#17201b" stroke-width="2" stroke-dasharray="8 7" opacity="0.72" />
  `;
}

function setStep(index) {
  state.stepIndex = Math.max(0, Math.min(steps.length - 1, index));
  renderAll();
  lessonPanel.focus({ preventScroll: true });
}

function setProblem(key) {
  state.problemKey = key;
  state.stepIndex = 0;
  renderAll();
}

function setPoint(axis, value) {
  const problem = currentProblem();
  const point = currentPoint();
  const max = axis === "x" ? problem.maxX : problem.maxY;
  const next = Math.max(0, Math.min(max, Number(value) || 0));
  point[axis] = next;
  renderWorkspace();
}

function renderSources() {
  const problem = currentProblem();
  document.querySelector("#dialogTitle").textContent = `${problem.title} references`;
  referenceGrid.innerHTML = problem.references
    .map(
      (ref) => `
        <article class="reference-item">
          <figure>
            <img class="${ref.className || ""}" src="${ref.src}" alt="${escapeHtml(ref.caption)}">
            <figcaption>${escapeHtml(ref.caption)}</figcaption>
          </figure>
        </article>
      `,
    )
    .join("");
}

function checkAnswer() {
  const problem = currentProblem();
  const x = Number(document.querySelector("#answerX1").value);
  const y = Number(document.querySelector("#answerX2").value);
  const objective = Number(document.querySelector("#answerObjective").value);
  const feedback = document.querySelector("#answerFeedback");

  const xOk = nearly(x, problem.optimum.x, 0.05);
  const yOk = nearly(y, problem.optimum.y, 0.05);
  const objectiveOk = nearly(objective, problem.optimum.value, 0.1);

  if (xOk && yOk && objectiveOk) {
    feedback.classList.add("ok");
    feedback.textContent = "Correct. Your solution matches the best feasible corner point and the Solver result.";
    return;
  }

  feedback.classList.remove("ok");
  feedback.textContent = `Check again: the expected result is x1 = ${formatNumber(problem.optimum.x)}, x2 = ${formatNumber(
    problem.optimum.y,
  )}, ${problem.objectiveName.toLowerCase()} = ${formatObjective(problem, problem.optimum.value)}.`;
}

function renderAll() {
  document.querySelectorAll(".tab-button").forEach((button) => {
    const active = button.dataset.problem === state.problemKey;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
  });
  renderStepList();
  renderLesson();
  renderWorkspace();
}

document.querySelector(".problem-tabs").addEventListener("click", (event) => {
  const button = event.target.closest("[data-problem]");
  if (button) setProblem(button.dataset.problem);
});

stepList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-step]");
  if (button) setStep(Number(button.dataset.step));
});

lessonPanel.addEventListener("click", (event) => {
  if (event.target.id === "backStep") setStep(state.stepIndex - 1);
  if (event.target.id === "nextStep") setStep(state.stepIndex + 1);
  if (event.target.id === "checkAnswerButton") checkAnswer();
});

x1Input.addEventListener("input", (event) => setPoint("x", event.target.value));
x2Input.addEventListener("input", (event) => setPoint("y", event.target.value));
x1Slider.addEventListener("input", (event) => setPoint("x", event.target.value));
x2Slider.addEventListener("input", (event) => setPoint("y", event.target.value));

document.querySelector("#toggleSources").addEventListener("click", () => {
  renderSources();
  if (typeof sourceDialog.showModal === "function") {
    sourceDialog.showModal();
  } else {
    sourceDialog.setAttribute("open", "");
  }
});

document.querySelector("#closeSources").addEventListener("click", () => {
  sourceDialog.close();
});

renderAll();
