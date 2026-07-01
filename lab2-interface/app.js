const model = {
  variables: [
    {
      key: "xhw",
      label: "Xhw",
      name: "High-site wilderness",
      description: "hectares of high-site land managed as wilderness",
      group: "high",
      role: "wilderness",
      max: 1600,
    },
    {
      key: "xhm",
      label: "Xhm",
      name: "High-site multiple use",
      description: "hectares of high-site land managed for recreation and timber",
      group: "high",
      role: "multiple use",
      max: 1600,
    },
    {
      key: "xlw",
      label: "Xlw",
      name: "Low-site wilderness",
      description: "hectares of low-site land managed as wilderness",
      group: "low",
      role: "wilderness",
      max: 2400,
    },
    {
      key: "xlm",
      label: "Xlm",
      name: "Low-site multiple use",
      description: "hectares of low-site land managed for recreation and timber",
      group: "low",
      role: "multiple use",
      max: 2400,
    },
  ],
  objective: {
    name: "Recreation",
    unit: "visitor-days/year",
    coefficients: { xhw: 1, xhm: 0.25, xlw: 0.6, xlm: 0.15 },
    sense: "Maximize",
  },
  constraints: [
    {
      name: "High-site land",
      coefficients: { xhw: 1, xhm: 1, xlw: 0, xlm: 0 },
      sense: "<=",
      rhs: 1600,
      unit: "ha",
    },
    {
      name: "Low-site land",
      coefficients: { xhw: 0, xhm: 0, xlw: 1, xlm: 1 },
      sense: "<=",
      rhs: 2400,
      unit: "ha",
    },
    {
      name: "Sediment",
      coefficients: { xhw: 0.06, xhm: 0.12, xlw: 0.03, xlm: 0.06 },
      sense: "<=",
      rhs: 200,
      unit: "m3/year",
    },
    {
      name: "Timber",
      coefficients: { xhw: 0, xhm: 3.5, xlw: 0, xlm: 1.2 },
      sense: ">=",
      rhs: 1400,
      unit: "m3/year",
    },
  ],
  optimum: {
    xhw: 1200,
    xhm: 400,
    xlw: 2400,
    xlm: 0,
    objective: 2740,
    sediment: 192,
    timber: 1400,
  },
};

const steps = [
  {
    title: "Define the decisions",
    render() {
      return `
        <p class="lesson-kicker">Ponderosa pine forest management</p>
        <h2>Separate site quality from management option</h2>
        <p class="lesson-lead">
          The forest has 1,600 ha of high-site land and 2,400 ha of low-site land. Each hectare must be
          allocated to either wilderness or multiple use.
        </p>
        <div class="content-band split">
          <dl class="definition-list">
            ${model.variables
              .map(
                (variable) => `
                  <div>
                    <dt>${variable.label}</dt>
                    <dd>${variable.description}</dd>
                  </div>
                `,
              )
              .join("")}
          </dl>
          <div class="note-panel">
            This is a four-variable LP. Instead of drawing a 2D graph, track the model through a
            coefficient table and Solver.
          </div>
        </div>
        <div class="content-band">
          <h3>Student task</h3>
          <ul class="prompt-list">
            <li>Write each variable with both its site type and management option.</li>
            <li>Confirm that all decision variables are measured in hectares.</li>
            <li>Add nonnegativity: Xhw, Xhm, Xlw, Xlm >= 0.</li>
          </ul>
        </div>
      `;
    },
  },
  {
    title: "Write the LP model",
    render() {
      return `
        <p class="lesson-kicker">Ponderosa pine forest management</p>
        <h2>Write the objective and constraints</h2>
        <p class="lesson-lead">
          The management goal is to maximize recreation while meeting timber and sediment requirements.
        </p>
        <div class="content-band">
          <h3>Objective</h3>
          <ul class="equation-list">
            <li>
              Maximize recreation
              <span class="formula">Max Z = Xhw + 0.25Xhm + 0.6Xlw + 0.15Xlm</span>
            </li>
          </ul>
        </div>
        <div class="content-band">
          <h3>Constraints</h3>
          <ul class="equation-list">
            <li>High-site land limit <span class="formula">Xhw + Xhm <= 1600</span></li>
            <li>Low-site land limit <span class="formula">Xlw + Xlm <= 2400</span></li>
            <li>Sediment limit <span class="formula">0.06Xhw + 0.12Xhm + 0.03Xlw + 0.06Xlm <= 200</span></li>
            <li>Timber requirement <span class="formula">3.5Xhm + 1.2Xlm >= 1400</span></li>
            <li>Nonnegativity <span class="formula">Xhw, Xhm, Xlw, Xlm >= 0</span></li>
          </ul>
        </div>
      `;
    },
  },
  {
    title: "Build the coefficient table",
    render() {
      return `
        <p class="lesson-kicker">Excel model structure</p>
        <h2>Use one row per constraint</h2>
        <p class="lesson-lead">
          The Excel template stores all coefficients in a matrix. This keeps the model auditable and
          makes the Solver setup easier.
        </p>
        <div class="content-band">
          ${renderCoefficientTable()}
        </div>
        <div class="content-band split">
          <div class="color-key">
            <span><i class="swatch decision"></i> Decision variables</span>
            <span><i class="swatch objective"></i> Objective coefficients</span>
            <span><i class="swatch matrix"></i> Constraint matrix</span>
            <span><i class="swatch lhs"></i> LHS formulas</span>
            <span><i class="swatch rhs"></i> RHS values</span>
            <span><i class="swatch result"></i> Objective result</span>
          </div>
          <div class="note-panel">
            In Excel, the LHS cells are SUMPRODUCT formulas. For example, the sediment LHS multiplies
            the land allocation row by the sediment coefficient row.
          </div>
        </div>
      `;
    },
  },
  {
    title: "Calculate LHS and objective",
    render() {
      return `
        <p class="lesson-kicker">SUMPRODUCT logic</p>
        <h2>Every result is a dot product</h2>
        <p class="lesson-lead">
          The decision row and coefficient rows have the same four-variable order, so each total is a
          SUMPRODUCT calculation.
        </p>
        <div class="content-band">
          <ul class="solver-list">
            <li><strong>F6 high-site LHS:</strong> <span class="formula">=SUMPRODUCT(B3:E3, B6:E6)</span></li>
            <li><strong>F7 low-site LHS:</strong> <span class="formula">=SUMPRODUCT(B3:E3, B7:E7)</span></li>
            <li><strong>F8 sediment LHS:</strong> <span class="formula">=SUMPRODUCT(B3:E3, B8:E8)</span></li>
            <li><strong>F9 timber LHS:</strong> <span class="formula">=SUMPRODUCT(B3:E3, B9:E9)</span></li>
            <li><strong>F11 objective:</strong> <span class="formula">=SUMPRODUCT(B3:E3, B11:E11)</span></li>
          </ul>
        </div>
        <div class="content-band">
          <div class="note-panel">
            Try changing the sliders in the workspace. The constraint checks update the same way the
            Excel LHS cells update when decision variables change.
          </div>
        </div>
      `;
    },
  },
  {
    title: "Set up Solver",
    render() {
      return `
        <p class="lesson-kicker">Excel Solver</p>
        <h2>Connect the model to Solver</h2>
        <p class="lesson-lead">
          Solver changes the decision-variable cells until the objective is as large as possible while
          all constraints are satisfied.
        </p>
        <div class="content-band split">
          <ul class="solver-list">
            <li><strong>Set objective:</strong> F11</li>
            <li><strong>To:</strong> Max</li>
            <li><strong>By changing variable cells:</strong> B3:E3</li>
            <li><strong>Add constraints:</strong> F6:F8 <= H6:H8</li>
            <li><strong>Add constraint:</strong> F9 >= H9</li>
            <li><strong>Add nonnegativity:</strong> B3:E3 >= 0</li>
            <li><strong>Solving method:</strong> Simplex LP</li>
          </ul>
          <div class="note-panel">
            If Solver reports a different answer, check cell ranges first. A common error is omitting
            one variable from the changing-cell range or reversing the timber inequality.
          </div>
        </div>
      `;
    },
  },
  {
    title: "Interpret the optimum",
    render() {
      return `
        <p class="lesson-kicker">Optimal plan</p>
        <h2>Translate the numbers back into a forest plan</h2>
        <p class="lesson-lead">
          Solver returns cell values. The final answer should explain what those cell values mean as a
          management plan.
        </p>
        <div class="content-band">
          <table class="summary-table">
            <thead>
              <tr><th>Decision</th><th class="num">Optimal hectares</th><th>Interpretation</th></tr>
            </thead>
            <tbody>
              <tr><td>Xhw</td><td class="num">1,200</td><td>High-site land managed as wilderness.</td></tr>
              <tr><td>Xhm</td><td class="num">400</td><td>High-site land managed for multiple use.</td></tr>
              <tr><td>Xlw</td><td class="num">2,400</td><td>Low-site land managed as wilderness.</td></tr>
              <tr><td>Xlm</td><td class="num">0</td><td>No low-site land assigned to multiple use.</td></tr>
            </tbody>
          </table>
        </div>
        <div class="content-band">
          <ul class="prompt-list">
            <li>Total recreation: 2,740 visitor-days per year.</li>
            <li>Total timber: 1,400 m3 per year.</li>
            <li>Total sediment: 192 m3 per year.</li>
          </ul>
        </div>
      `;
    },
  },
  {
    title: "Check your answer",
    render() {
      return `
        <p class="lesson-kicker">Self-check</p>
        <h2>Compare your Solver result</h2>
        <p class="lesson-lead">
          Enter your proposed solution. The checker confirms the four decision values and the objective.
        </p>
        <div class="content-band">
          <div class="answer-check">
            ${model.variables
              .map(
                (variable) => `
                  <label>
                    ${variable.label}
                    <input type="number" id="answer-${variable.key}" step="0.01">
                  </label>
                `,
              )
              .join("")}
            <label>
              Z
              <input type="number" id="answer-objective" step="0.01">
            </label>
          </div>
          <button class="primary-button" type="button" id="checkAnswerButton">Check answer</button>
          <div class="feedback" id="answerFeedback">
            Your result should satisfy all four constraints and maximize visitor-days.
          </div>
        </div>
        <div class="content-band">
          <h3>Submission checklist</h3>
          <ul class="prompt-list">
            <li>Upload the Excel model with Solver results.</li>
            <li>Explain the best management plan in words.</li>
            <li>Report recreation, timber, and sediment totals with units.</li>
          </ul>
        </div>
      `;
    },
  },
];

const state = {
  stepIndex: 0,
  decision: {
    xhw: 1200,
    xhm: 400,
    xlw: 2400,
    xlm: 0,
  },
};

const stepList = document.querySelector("#stepList");
const lessonPanel = document.querySelector("#lessonPanel");
const metricGrid = document.querySelector("#metricGrid");
const allocationBars = document.querySelector("#allocationBars");
const decisionControls = document.querySelector("#decisionControls");
const constraintCheck = document.querySelector("#constraintCheck");
const sourceDialog = document.querySelector("#sourceDialog");

function formatNumber(value, digits = 2) {
  if (Number.isInteger(value)) return Number(value).toLocaleString();
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: digits });
}

function dot(coefficients, decision = state.decision) {
  return model.variables.reduce((sum, variable) => sum + coefficients[variable.key] * decision[variable.key], 0);
}

function constraintStatus(constraint) {
  const lhs = dot(constraint.coefficients);
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
  const step = steps[state.stepIndex];
  lessonPanel.innerHTML = `
    ${step.render()}
    <div class="nav-row">
      <button class="secondary-button" type="button" id="backStep" ${state.stepIndex === 0 ? "disabled" : ""}>Back</button>
      <span class="step-count">Step ${state.stepIndex + 1} of ${steps.length}</span>
      <button class="primary-button" type="button" id="nextStep" ${state.stepIndex === steps.length - 1 ? "disabled" : ""}>Next</button>
    </div>
  `;
}

function renderWorkspace() {
  const recreation = dot(model.objective.coefficients);
  const sediment = constraintStatus(model.constraints[2]).lhs;
  const timber = constraintStatus(model.constraints[3]).lhs;

  metricGrid.innerHTML = `
    <div class="metric-card"><span>Recreation</span><strong>${formatNumber(recreation, 1)}</strong></div>
    <div class="metric-card"><span>Timber</span><strong>${formatNumber(timber, 1)}</strong></div>
    <div class="metric-card"><span>Sediment</span><strong>${formatNumber(sediment, 2)}</strong></div>
  `;

  allocationBars.innerHTML = `
    ${renderAllocationGroup("high", "High-site land", 1600)}
    ${renderAllocationGroup("low", "Low-site land", 2400)}
  `;

  decisionControls.innerHTML = model.variables
    .map(
      (variable) => `
        <div class="decision-control">
          <label>
            ${variable.label}: ${variable.name}
            <small>${variable.description}</small>
            <input type="range" data-variable="${variable.key}" min="0" max="${variable.max}" step="10" value="${state.decision[variable.key]}">
          </label>
          <input type="number" data-variable-number="${variable.key}" min="0" max="${variable.max}" step="10" value="${state.decision[variable.key]}">
        </div>
      `,
    )
    .join("");

  constraintCheck.innerHTML = `
    <div class="constraint-checks">
      ${model.constraints
        .map((constraint) => {
          const result = constraintStatus(constraint);
          return `
            <div class="constraint-check">
              <span class="check-dot ${result.ok ? "ok" : ""}"></span>
              <span>${constraint.name}: ${formatNumber(result.lhs, 2)} ${constraint.sense} ${formatNumber(constraint.rhs)} ${constraint.unit}</span>
              <strong>${result.ok ? "OK" : "Check"}</strong>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderAllocationGroup(group, title, capacity) {
  const variables = model.variables.filter((variable) => variable.group === group);
  const total = variables.reduce((sum, variable) => sum + state.decision[variable.key], 0);
  return `
    <section class="allocation-group">
      <h3>${title}</h3>
      <div class="bar-track" aria-label="${title} allocation">
        ${variables
          .map((variable) => {
            const width = capacity === 0 ? 0 : (state.decision[variable.key] / capacity) * 100;
            const label = width >= 14 ? variable.label : "";
            const className = variable.role === "wilderness" ? "bar-wild" : "bar-mult";
            return `<span class="bar-segment ${className}" style="width: ${Math.max(width, 0)}%">${label}</span>`;
          })
          .join("")}
      </div>
      <p class="bar-caption">${formatNumber(total)} of ${formatNumber(capacity)} ha allocated.</p>
    </section>
  `;
}

function renderCoefficientTable() {
  return `
    <table class="model-table">
      <thead>
        <tr>
          <th>Row</th>
          ${model.variables.map((variable) => `<th class="num">${variable.label}</th>`).join("")}
          <th class="num">Sign</th>
          <th class="num">RHS</th>
        </tr>
      </thead>
      <tbody>
        ${model.constraints
          .map(
            (constraint) => `
              <tr>
                <td>${constraint.name}</td>
                ${model.variables
                  .map((variable) => `<td class="num">${formatNumber(constraint.coefficients[variable.key], 3)}</td>`)
                  .join("")}
                <td class="num">${constraint.sense}</td>
                <td class="num">${formatNumber(constraint.rhs)}</td>
              </tr>
            `,
          )
          .join("")}
        <tr>
          <td>Objective</td>
          ${model.variables
            .map((variable) => `<td class="num">${formatNumber(model.objective.coefficients[variable.key], 3)}</td>`)
            .join("")}
          <td class="num">Max</td>
          <td class="num">Z</td>
        </tr>
      </tbody>
    </table>
  `;
}

function setStep(index) {
  state.stepIndex = Math.max(0, Math.min(steps.length - 1, index));
  renderAll();
  lessonPanel.focus({ preventScroll: true });
}

function setDecision(key, value) {
  const variable = model.variables.find((item) => item.key === key);
  if (!variable) return;
  state.decision[key] = Math.max(0, Math.min(variable.max, Number(value) || 0));
  renderWorkspace();
}

function checkAnswer() {
  const expected = model.optimum;
  const values = Object.fromEntries(
    model.variables.map((variable) => [variable.key, Number(document.querySelector(`#answer-${variable.key}`).value)]),
  );
  const objective = Number(document.querySelector("#answer-objective").value);
  const variablesOk = model.variables.every((variable) => Math.abs(values[variable.key] - expected[variable.key]) <= 0.05);
  const objectiveOk = Math.abs(objective - expected.objective) <= 0.1;
  const feedback = document.querySelector("#answerFeedback");

  if (variablesOk && objectiveOk) {
    feedback.classList.add("ok");
    feedback.textContent = "Correct. This matches the Solver optimum and satisfies all constraints.";
    return;
  }

  feedback.classList.remove("ok");
  feedback.textContent =
    "Check again: the expected optimum is Xhw = 1200, Xhm = 400, Xlw = 2400, Xlm = 0, with Z = 2740 visitor-days/year.";
}

function renderAll() {
  renderStepList();
  renderLesson();
  renderWorkspace();
}

stepList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-step]");
  if (button) setStep(Number(button.dataset.step));
});

lessonPanel.addEventListener("click", (event) => {
  if (event.target.id === "backStep") setStep(state.stepIndex - 1);
  if (event.target.id === "nextStep") setStep(state.stepIndex + 1);
  if (event.target.id === "checkAnswerButton") checkAnswer();
});

decisionControls.addEventListener("input", (event) => {
  if (event.target.dataset.variable) {
    setDecision(event.target.dataset.variable, event.target.value);
  }
  if (event.target.dataset.variableNumber) {
    setDecision(event.target.dataset.variableNumber, event.target.value);
  }
});

document.querySelector("#toggleSources").addEventListener("click", () => {
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
