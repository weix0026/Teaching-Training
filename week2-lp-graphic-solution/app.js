const EPS = 1e-7;
const desktopSvgBox = {
  width: 760,
  height: 540,
  margin: { left: 60, right: 28, top: 24, bottom: 50 },
};
const mobileSvgBox = {
  width: 360,
  height: 360,
  margin: { left: 50, right: 16, top: 34, bottom: 46 },
};
const svgBox = cloneBox(desktopSvgBox);

const palette = ["#9f3e34", "#2f6f8d", "#d99a28", "#6f5b9a", "#1f6b4c", "#a85f2a"];

const examples = {
  warmup: {
    id: "warmup",
    title: "Warm-up: identify the feasible polygon",
    subtitle: "The compact example from the graphic-solution slides isolates the geometry before the full forest problem.",
    source: "Slides 9-13",
    sense: "max",
    objectiveName: "Z",
    objectivePrefix: "",
    objectiveSuffix: "",
    objective: { c1: 2, c2: 1 },
    axis: { xMax: 45, yMax: 45 },
    variables: [
      { symbol: "x1", label: "Decision variable 1", short: "x1", unit: "units" },
      { symbol: "x2", label: "Decision variable 2", short: "x2", unit: "units" },
    ],
    formulation: "This is the lecture's first graph. Students can name the interior, boundary, extreme points, and active constraints before solving the full poet example.",
    facts: [
      ["Objective", "Max 2x1 + x2"],
      ["Feasible set", "bounded polygon"],
      ["Expected optimum", "(25, 15)"],
    ],
    constraints: [
      { label: "Total resource", a: 1, b: 1, sense: "<=", rhs: 40, note: "The combined use cannot exceed 40." },
      { label: "x1 upper bound", a: 1, b: 0, sense: "<=", rhs: 25, note: "x1 cannot exceed 25." },
    ],
  },
  poet: {
    id: "poet",
    title: "A poet and his woods",
    subtitle: "Choose hectares of Red Pine and Northern Hardwood to manage next year while staying within the poet's 180-day work limit.",
    source: "Slides 2-6 and 14",
    sense: "max",
    objectiveName: "Profit",
    objectivePrefix: "$",
    objectiveSuffix: "",
    objective: { c1: 90, c2: 120 },
    axis: { xMax: 70, yMax: 70 },
    variables: [
      { symbol: "x1", label: "Red Pine managed next year", short: "Red Pine", unit: "ha" },
      { symbol: "x2", label: "Northern Hardwood managed next year", short: "Hardwood", unit: "ha" },
    ],
    formulation: "Historical days and income are converted to per-hectare coefficients: Red Pine needs 2 days/ha and returns $90/ha; hardwood needs 3 days/ha and returns $120/ha.",
    facts: [
      ["Red Pine", "40 ha available"],
      ["Hardwood", "50 ha available"],
      ["Work limit", "180 days"],
    ],
    constraints: [
      { label: "Red Pine area", a: 1, b: 0, sense: "<=", rhs: 40, note: "At most 40 ha of Red Pine are available." },
      { label: "Hardwood area", a: 0, b: 1, sense: "<=", rhs: 50, note: "At most 50 ha of Northern Hardwood are available." },
      { label: "Management time", a: 2, b: 3, sense: "<=", rhs: 180, note: "Each ha uses annual management days: 2 for Red Pine and 3 for hardwood." },
    ],
  },
  river: {
    id: "river",
    title: "Keep the river clean",
    subtitle: "Choose pulp production to minimize daily pollution while meeting worker and revenue requirements.",
    source: "Slides 15-16",
    sense: "min",
    objectiveName: "Pollution",
    objectivePrefix: "",
    objectiveSuffix: " BOD",
    objective: { c1: 1, c2: 1.5 },
    axis: { xMax: 340, yMax: 240 },
    variables: [
      { symbol: "x1", label: "Mechanical pulp", short: "Mechanical", unit: "tons/day" },
      { symbol: "x2", label: "Chemical pulp", short: "Chemical", unit: "tons/day" },
    ],
    formulation: "This practice case reverses the usual visual intuition because the objective is minimized and two requirements use greater-than-or-equal-to constraints.",
    image: "assets/river-source-sketch.png",
    facts: [
      ["Objective", "Min x1 + 1.5x2"],
      ["Labor", "at least 300 workers"],
      ["Revenue", "at least $40,000"],
    ],
    constraints: [
      { label: "Worker requirement", a: 1, b: 1, sense: ">=", rhs: 300, note: "Both pulp types require one worker day per ton." },
      { label: "Revenue requirement", a: 1, b: 2, sense: ">=", rhs: 400, note: "Revenue in hundreds of dollars: 100x1 + 200x2 >= 40000." },
      { label: "Mechanical capacity", a: 1, b: 0, sense: "<=", rhs: 300, note: "Mechanical pulp capacity is 300 tons/day." },
      { label: "Chemical capacity", a: 0, b: 1, sense: "<=", rhs: 200, note: "Chemical pulp capacity is 200 tons/day." },
    ],
  },
};

const steps = [
  { short: "Formulate", label: "Translate story to math" },
  { short: "Draw lines", label: "Replace inequalities with equals" },
  { short: "Feasible set", label: "Keep the side that satisfies signs" },
  { short: "Objective", label: "Move a parallel contour" },
  { short: "Active", label: "Solve active constraints" },
  { short: "Audit", label: "Check slack and test points" },
];

const initialParams = new URLSearchParams(window.location.search);
const requestedExample = initialParams.get("case");
const initialExampleKey = Object.prototype.hasOwnProperty.call(examples, requestedExample) ? requestedExample : "poet";
const requestedStep = Number(initialParams.get("step"));
const initialStep = Number.isFinite(requestedStep) ? Math.min(steps.length - 1, Math.max(0, Math.round(requestedStep))) : 0;
const initialModel = cloneModel(examples[initialExampleKey]);

const state = {
  exampleKey: initialExampleKey,
  baseExampleKey: initialExampleKey,
  model: initialModel,
  step: initialStep,
  selectedConstraint: 0,
  objectiveZ: null,
  probe: defaultProbe(initialModel),
  probeResult: null,
  editorMessage: "",
  animationId: null,
};

const numberFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

function cloneModel(model) {
  return JSON.parse(JSON.stringify(model));
}

function cloneBox(box) {
  return {
    width: box.width,
    height: box.height,
    margin: { ...box.margin },
  };
}

function configureSvgBox() {
  const compact = window.matchMedia("(max-width: 860px)").matches;
  const next = compact ? mobileSvgBox : desktopSvgBox;
  svgBox.width = next.width;
  svgBox.height = next.height;
  svgBox.margin = { ...next.margin };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function trimNumber(value, digits = 2) {
  if (!Number.isFinite(value)) return "n/a";
  const clean = Math.abs(value) < EPS ? 0 : value;
  if (Math.abs(clean - Math.round(clean)) < 1e-6) {
    return numberFormat.format(Math.round(clean));
  }
  return numberFormat.format(Number(clean.toFixed(digits)));
}

function formatObjectiveValue(value, model) {
  return `${model.objectivePrefix || ""}${trimNumber(value, 2)}${model.objectiveSuffix || ""}`;
}

function senseHtml(sense) {
  if (sense === "<=") return "&le;";
  if (sense === ">=") return "&ge;";
  return "=";
}

function sensePlain(sense) {
  return sense;
}

function variableHtml(model, index) {
  return model.variables[index].symbol.replace(/(\d+)/g, "<sub>$1</sub>");
}

function variablePlain(model, index) {
  return model.variables[index].symbol;
}

function termHtml(coeff, symbol, isFirst) {
  if (Math.abs(coeff) < EPS) return "";
  const sign = coeff < 0 ? "-" : isFirst ? "" : "+";
  const abs = Math.abs(coeff);
  const coeffText = Math.abs(abs - 1) < EPS ? "" : trimNumber(abs);
  return `${sign ? `${sign} ` : ""}${coeffText}${symbol}`;
}

function linearExpressionHtml(a, b, model) {
  const terms = [];
  const first = termHtml(a, variableHtml(model, 0), true);
  if (first) terms.push(first);
  const second = termHtml(b, variableHtml(model, 1), terms.length === 0);
  if (second) terms.push(second);
  return terms.length ? terms.join(" ") : "0";
}

function termPlain(coeff, symbol, isFirst) {
  if (Math.abs(coeff) < EPS) return "";
  const sign = coeff < 0 ? "-" : isFirst ? "" : "+";
  const abs = Math.abs(coeff);
  const coeffText = Math.abs(abs - 1) < EPS ? "" : trimNumber(abs);
  return `${sign ? `${sign} ` : ""}${coeffText}${symbol}`;
}

function linearExpressionPlain(a, b, model) {
  const terms = [];
  const first = termPlain(a, variablePlain(model, 0), true);
  if (first) terms.push(first);
  const second = termPlain(b, variablePlain(model, 1), terms.length === 0);
  if (second) terms.push(second);
  return terms.length ? terms.join(" ") : "0";
}

function objectiveHtml(model, zValue) {
  const prefix = model.sense === "max" ? "Max" : "Min";
  const expr = linearExpressionHtml(model.objective.c1, model.objective.c2, model);
  if (Number.isFinite(zValue)) {
    return `${model.objectiveName} = ${expr} = ${trimNumber(zValue, 2)}`;
  }
  return `${prefix} ${model.objectiveName} = ${expr}`;
}

function constraintHtml(constraint, model, equality = false) {
  return `${linearExpressionHtml(constraint.a, constraint.b, model)} ${equality ? "=" : senseHtml(constraint.sense)} ${trimNumber(constraint.rhs)}`;
}

function constraintPlain(constraint, model, equality = false) {
  return `${linearExpressionPlain(constraint.a, constraint.b, model)} ${equality ? "=" : sensePlain(constraint.sense)} ${trimNumber(constraint.rhs)}`;
}

function allConstraints(model) {
  return [
    ...model.constraints.map((constraint, index) => ({ ...constraint, index, color: palette[index % palette.length] })),
    { label: `${model.variables[0].symbol} nonnegative`, a: 1, b: 0, sense: ">=", rhs: 0, system: true },
    { label: `${model.variables[1].symbol} nonnegative`, a: 0, b: 1, sense: ">=", rhs: 0, system: true },
  ];
}

function lhsValue(constraint, point) {
  return constraint.a * point.x + constraint.b * point.y;
}

function satisfiesConstraint(point, constraint, tolerance = EPS) {
  const lhs = lhsValue(constraint, point);
  if (constraint.sense === "<=") return lhs <= constraint.rhs + tolerance;
  if (constraint.sense === ">=") return lhs >= constraint.rhs - tolerance;
  return Math.abs(lhs - constraint.rhs) <= tolerance;
}

function feasible(point, constraints) {
  return constraints.every((constraint) => satisfiesConstraint(point, constraint));
}

function intersectLines(a, b) {
  const det = a.a * b.b - b.a * a.b;
  if (Math.abs(det) < EPS) return null;
  return {
    x: (a.rhs * b.b - b.rhs * a.b) / det,
    y: (a.a * b.rhs - b.a * a.rhs) / det,
  };
}

function cleanPoint(point) {
  return {
    x: Math.abs(point.x) < EPS ? 0 : point.x,
    y: Math.abs(point.y) < EPS ? 0 : point.y,
  };
}

function dedupePoints(points) {
  const seen = new Map();
  points.forEach((point) => {
    const clean = cleanPoint(point);
    const key = `${clean.x.toFixed(7)},${clean.y.toFixed(7)}`;
    if (!seen.has(key)) seen.set(key, clean);
  });
  return [...seen.values()];
}

function sortPolygon(points) {
  if (points.length <= 2) return points;
  const center = points.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), { x: 0, y: 0 });
  center.x /= points.length;
  center.y /= points.length;
  return [...points].sort((a, b) => Math.atan2(a.y - center.y, a.x - center.x) - Math.atan2(b.y - center.y, b.x - center.x));
}

function feasibleVertices(model) {
  const constraints = allConstraints(model);
  const candidates = [];
  for (let i = 0; i < constraints.length; i += 1) {
    for (let j = i + 1; j < constraints.length; j += 1) {
      const point = intersectLines(constraints[i], constraints[j]);
      if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) continue;
      if (feasible(point, constraints)) candidates.push(point);
    }
  }
  return sortPolygon(dedupePoints(candidates));
}

function objectiveAt(point, model) {
  return model.objective.c1 * point.x + model.objective.c2 * point.y;
}

function activeConstraintsAt(point, model) {
  return allConstraints(model).filter((constraint) => Math.abs(lhsValue(constraint, point) - constraint.rhs) <= 1e-5);
}

function analyzeModel(model) {
  const vertices = feasibleVertices(model);
  const rows = vertices.map((point) => ({
    point,
    value: objectiveAt(point, model),
    active: activeConstraintsAt(point, model),
  }));
  let optimum = null;
  if (rows.length) {
    optimum = rows.reduce((best, row) => {
      if (!best) return row;
      return model.sense === "max"
        ? row.value > best.value + EPS ? row : best
        : row.value < best.value - EPS ? row : best;
    }, null);
  }
  const values = rows.map((row) => row.value);
  const minValue = values.length ? Math.min(...values) : 0;
  const maxValue = values.length ? Math.max(...values) : 100;
  const span = Math.max(1, maxValue - minValue);
  return {
    vertices: rows,
    optimum,
    range: {
      min: Math.min(0, minValue - span * 0.15),
      max: maxValue + span * 0.18,
      span,
    },
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function ensureObjectiveZ(analysis) {
  const fallback = analysis.optimum ? analysis.optimum.value : (analysis.range.min + analysis.range.max) / 2;
  if (!Number.isFinite(state.objectiveZ)) state.objectiveZ = fallback;
  state.objectiveZ = clamp(state.objectiveZ, analysis.range.min, analysis.range.max);
}

function makeScale(model) {
  const { width, height, margin } = svgBox;
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const axis = model.axis;
  return {
    plotWidth,
    plotHeight,
    x: (value) => margin.left + (value / axis.xMax) * plotWidth,
    y: (value) => margin.top + plotHeight - (value / axis.yMax) * plotHeight,
  };
}

function ticks(max) {
  const rough = max / 6;
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(rough, 1)));
  const normalized = rough / magnitude;
  const factor = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  const step = factor * magnitude;
  const result = [];
  for (let value = 0; value <= max + EPS; value += step) {
    result.push(Number(value.toFixed(8)));
  }
  if (Math.abs(result.at(-1) - max) > EPS) result.push(max);
  return result;
}

function pointInAxis(point, model) {
  return point.x >= -EPS && point.y >= -EPS && point.x <= model.axis.xMax + EPS && point.y <= model.axis.yMax + EPS;
}

function lineSegment(constraint, model) {
  const axis = model.axis;
  const points = [];
  const add = (point) => {
    if (Number.isFinite(point.x) && Number.isFinite(point.y) && pointInAxis(point, model)) points.push(cleanPoint(point));
  };
  if (Math.abs(constraint.b) > EPS) {
    add({ x: 0, y: constraint.rhs / constraint.b });
    add({ x: axis.xMax, y: (constraint.rhs - constraint.a * axis.xMax) / constraint.b });
  }
  if (Math.abs(constraint.a) > EPS) {
    add({ x: constraint.rhs / constraint.a, y: 0 });
    add({ x: (constraint.rhs - constraint.b * axis.yMax) / constraint.a, y: axis.yMax });
  }
  const unique = dedupePoints(points);
  if (unique.length < 2) return null;
  let pair = [unique[0], unique[1]];
  let distance = -Infinity;
  for (let i = 0; i < unique.length; i += 1) {
    for (let j = i + 1; j < unique.length; j += 1) {
      const current = (unique[i].x - unique[j].x) ** 2 + (unique[i].y - unique[j].y) ** 2;
      if (current > distance) {
        distance = current;
        pair = [unique[i], unique[j]];
      }
    }
  }
  return pair;
}

function clipPolygon(poly, constraint) {
  if (!poly.length) return [];
  const output = [];
  const intersectSegment = (start, end) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const denom = constraint.a * dx + constraint.b * dy;
    if (Math.abs(denom) < EPS) return end;
    const t = (constraint.rhs - constraint.a * start.x - constraint.b * start.y) / denom;
    return { x: start.x + t * dx, y: start.y + t * dy };
  };
  for (let i = 0; i < poly.length; i += 1) {
    const current = poly[i];
    const previous = poly[(i - 1 + poly.length) % poly.length];
    const currentInside = satisfiesConstraint(current, constraint, 1e-9);
    const previousInside = satisfiesConstraint(previous, constraint, 1e-9);
    if (currentInside) {
      if (!previousInside) output.push(intersectSegment(previous, current));
      output.push(current);
    } else if (previousInside) {
      output.push(intersectSegment(previous, current));
    }
  }
  return output.map(cleanPoint);
}

function clippedFeasiblePolygon(model, selectedOnly = false) {
  const box = [
    { x: 0, y: 0 },
    { x: model.axis.xMax, y: 0 },
    { x: model.axis.xMax, y: model.axis.yMax },
    { x: 0, y: model.axis.yMax },
  ];
  const constraints = selectedOnly ? [model.constraints[state.selectedConstraint]].filter(Boolean) : model.constraints;
  return constraints.reduce((poly, constraint) => clipPolygon(poly, constraint), box);
}

function pointsPath(points, scale) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${scale.x(point.x).toFixed(2)} ${scale.y(point.y).toFixed(2)}`).join(" ") + " Z";
}

function renderGraph(analysis) {
  configureSvgBox();
  const model = state.model;
  const scale = makeScale(model);
  const compact = window.matchMedia("(max-width: 860px)").matches;
  const xTicks = ticks(model.axis.xMax);
  const yTicks = ticks(model.axis.yMax);
  const layer = state.step;
  const selected = model.constraints[state.selectedConstraint] || model.constraints[0];
  const halfPlane = layer >= 1 && selected ? clippedFeasiblePolygon(model, true) : [];
  const feasiblePoly = layer >= 2 ? clippedFeasiblePolygon(model) : [];
  const constraintLines = layer >= 1 ? model.constraints.map((constraint, index) => {
    const segment = lineSegment(constraint, model);
    if (!segment) return "";
    const color = palette[index % palette.length];
    const cls = index === state.selectedConstraint ? "constraint-line selected" : "constraint-line muted";
    const labelFractions = [0.28, 0.62, 0.76, 0.38, 0.52];
    const labelT = labelFractions[index % labelFractions.length];
    const labelPoint = {
      x: segment[0].x + (segment[1].x - segment[0].x) * labelT,
      y: segment[0].y + (segment[1].y - segment[0].y) * labelT,
    };
    const labelAnchor = compact && scale.x(labelPoint.x) > svgBox.width - 150 ? "end" : "start";
    const labelX = labelAnchor === "end"
      ? clamp(scale.x(labelPoint.x) - 8, svgBox.margin.left + 80, svgBox.width - svgBox.margin.right - 4)
      : clamp(scale.x(labelPoint.x) + 8, svgBox.margin.left + 4, svgBox.width - svgBox.margin.right - 120);
    const labelY = clamp(scale.y(labelPoint.y) - 8, svgBox.margin.top + 12, svgBox.height - svgBox.margin.bottom - 8);
    return `
      <line class="${cls}" x1="${scale.x(segment[0].x)}" y1="${scale.y(segment[0].y)}" x2="${scale.x(segment[1].x)}" y2="${scale.y(segment[1].y)}" stroke="${color}" />
      <text class="constraint-label" x="${labelX}" y="${labelY}" text-anchor="${labelAnchor}">${escapeHtml(constraintPlain(constraint, model))}</text>`;
  }).join("") : "";

  const objectiveSegment = layer >= 3 ? lineSegment({ a: model.objective.c1, b: model.objective.c2, rhs: state.objectiveZ, sense: "=" }, model) : null;
  const objectiveMarkup = objectiveSegment ? renderObjectiveSvg(objectiveSegment, model, scale) : "";

  const vertexMarkup = layer >= 2 ? analysis.vertices.map((row, index) => {
    const point = row.point;
    if (!pointInAxis(point, model)) return "";
    const isOptimum = analysis.optimum && closePoints(point, analysis.optimum.point);
    const radius = isOptimum && layer >= 4 ? 6 : 4.5;
    const cls = isOptimum && layer >= 4 ? "vertex-point optimum" : "vertex-point";
    const label = `(${trimNumber(point.x)}, ${trimNumber(point.y)})`;
    return `
      <circle class="${cls}" cx="${scale.x(point.x)}" cy="${scale.y(point.y)}" r="${radius}">
        <title>${escapeHtml(label)}; ${model.objectiveName} ${trimNumber(row.value, 2)}</title>
      </circle>
      ${layer >= 4 || index < 6 ? `<text class="point-label" x="${scale.x(point.x) + 7}" y="${scale.y(point.y) - 7}">${escapeHtml(label)}</text>` : ""}`;
  }).join("") : "";

  const optimumMarkup = layer >= 4 && analysis.optimum ? renderOptimumCallout(analysis.optimum, model, scale) : "";
  const probeMarkup = state.probeResult && pointInAxis(state.probeResult.point, model)
    ? `<circle class="probe-point" cx="${scale.x(state.probeResult.point.x)}" cy="${scale.y(state.probeResult.point.y)}" r="6" fill="${state.probeResult.feasible ? "#24724f" : "#a43f35"}"><title>Probe point</title></circle>`
    : "";

  const html = `
    <svg viewBox="0 0 ${svgBox.width} ${svgBox.height}" role="img" aria-label="Two variable LP graph">
      <defs>
        <marker id="objectiveArrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
          <path d="M0,0 L9,4.5 L0,9 Z" fill="#151b18"></path>
        </marker>
      </defs>
      <rect x="0" y="0" width="${svgBox.width}" height="${svgBox.height}" fill="#fff"></rect>
      ${xTicks.map((tick) => `<line class="grid-line" x1="${scale.x(tick)}" y1="${svgBox.margin.top}" x2="${scale.x(tick)}" y2="${svgBox.height - svgBox.margin.bottom}"></line>`).join("")}
      ${yTicks.map((tick) => `<line class="grid-line" x1="${svgBox.margin.left}" y1="${scale.y(tick)}" x2="${svgBox.width - svgBox.margin.right}" y2="${scale.y(tick)}"></line>`).join("")}
      ${halfPlane.length >= 3 ? `<path class="half-plane" fill="${palette[state.selectedConstraint % palette.length]}" d="${pointsPath(halfPlane, scale)}"></path>` : ""}
      ${feasiblePoly.length >= 3 ? `<path class="feasible-region" d="${pointsPath(feasiblePoly, scale)}"></path>` : ""}
      <line class="axis-line" x1="${svgBox.margin.left}" y1="${scale.y(0)}" x2="${svgBox.width - svgBox.margin.right}" y2="${scale.y(0)}"></line>
      <line class="axis-line" x1="${scale.x(0)}" y1="${svgBox.margin.top}" x2="${scale.x(0)}" y2="${svgBox.height - svgBox.margin.bottom}"></line>
      ${xTicks.map((tick) => `<text class="tick-label" x="${scale.x(tick)}" y="${svgBox.height - 27}" text-anchor="middle">${trimNumber(tick)}</text>`).join("")}
      ${yTicks.map((tick) => `<text class="tick-label" x="${svgBox.margin.left - 10}" y="${scale.y(tick) + 4}" text-anchor="end">${trimNumber(tick)}</text>`).join("")}
      <text class="axis-label" x="${svgBox.width - svgBox.margin.right}" y="${svgBox.height - 8}" text-anchor="end">${escapeHtml(model.variables[0].short)} (${escapeHtml(model.variables[0].unit)})</text>
      <text class="axis-label" x="${svgBox.margin.left}" y="${svgBox.margin.top - 8}" text-anchor="start">${escapeHtml(model.variables[1].short)} (${escapeHtml(model.variables[1].unit)})</text>
      ${constraintLines}
      ${objectiveMarkup}
      ${vertexMarkup}
      ${optimumMarkup}
      ${probeMarkup}
    </svg>`;
  document.querySelector("#graphCanvas").innerHTML = html;
}

function closePoints(a, b) {
  return Math.abs(a.x - b.x) < 1e-5 && Math.abs(a.y - b.y) < 1e-5;
}

function renderObjectiveSvg(segment, model, scale) {
  const p1 = segment[0];
  const p2 = segment[1];
  const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  const labelT = model.sense === "min" ? 0.72 : 0.35;
  const labelPoint = {
    x: p1.x + (p2.x - p1.x) * labelT,
    y: p1.y + (p2.y - p1.y) * labelT,
  };
  const label = `${model.objectiveName} = ${trimNumber(state.objectiveZ, 2)}`;
  const compact = window.matchMedia("(max-width: 860px)").matches;
  const sign = model.sense === "max" ? 1 : -1;
  const vx = model.objective.c1 * sign * scale.plotWidth / model.axis.xMax;
  const vy = -model.objective.c2 * sign * scale.plotHeight / model.axis.yMax;
  const length = Math.hypot(vx, vy);
  const arrow = length > EPS ? {
    x1: scale.x(mid.x) - (vx / length) * 10,
    y1: scale.y(mid.y) - (vy / length) * 10,
    x2: scale.x(mid.x) + (vx / length) * 34,
    y2: scale.y(mid.y) + (vy / length) * 34,
  } : null;
  const showLabel = !(compact && state.step >= 4);
  return `
    <line class="objective-line" x1="${scale.x(p1.x)}" y1="${scale.y(p1.y)}" x2="${scale.x(p2.x)}" y2="${scale.y(p2.y)}"></line>
    ${arrow ? `<line class="objective-arrow" x1="${arrow.x1}" y1="${arrow.y1}" x2="${arrow.x2}" y2="${arrow.y2}" marker-end="url(#objectiveArrow)"></line>` : ""}
    ${showLabel ? `<text class="objective-label" x="${objectiveLabelX(labelPoint, scale, compact)}" y="${clamp(scale.y(labelPoint.y) + 18, svgBox.margin.top + 16, svgBox.height - svgBox.margin.bottom - 6)}" text-anchor="${objectiveLabelAnchor(labelPoint, scale, compact)}">${escapeHtml(label)}</text>` : ""}`;
}

function objectiveLabelAnchor(labelPoint, scale, compact) {
  return compact && scale.x(labelPoint.x) > svgBox.width - 145 ? "end" : "start";
}

function objectiveLabelX(labelPoint, scale, compact) {
  const anchor = objectiveLabelAnchor(labelPoint, scale, compact);
  return anchor === "end"
    ? clamp(scale.x(labelPoint.x) - 8, svgBox.margin.left + 90, svgBox.width - svgBox.margin.right - 4)
    : clamp(scale.x(labelPoint.x) + 10, svgBox.margin.left + 6, svgBox.width - svgBox.margin.right - 120);
}

function renderOptimumCallout(row, model, scale) {
  const point = row.point;
  const placeLeft = window.matchMedia("(max-width: 860px)").matches || scale.x(point.x) > svgBox.width - 220;
  const proposedX = placeLeft ? scale.x(point.x) - 170 : scale.x(point.x) + 14;
  const x = clamp(proposedX, svgBox.margin.left + 8, svgBox.width - 175);
  const y = clamp(scale.y(point.y) - 18, svgBox.margin.top + 20, svgBox.height - svgBox.margin.bottom - 38);
  return `
    <g>
      <rect x="${x}" y="${y - 23}" width="156" height="45" rx="4" fill="#fff8e9" stroke="#d7b45a"></rect>
      <text class="objective-label" x="${x + 10}" y="${y - 5}">Optimum ${escapeHtml(`(${trimNumber(point.x)}, ${trimNumber(point.y)})`)}</text>
      <text class="point-label" x="${x + 10}" y="${y + 13}">${escapeHtml(model.objectiveName)} ${escapeHtml(formatObjectiveValue(row.value, model))}</text>
    </g>`;
}

function renderCaseSelect() {
  const select = document.querySelector("#caseSelect");
  const options = Object.values(examples).map((example) => `<option value="${example.id}">${escapeHtml(example.title)}</option>`);
  if (state.exampleKey === "custom") options.push('<option value="custom">Custom edited model</option>');
  select.innerHTML = options.join("");
  select.value = state.exampleKey;
}

function renderHeader(analysis) {
  const model = state.model;
  document.querySelector("#caseSource").textContent = model.source;
  document.querySelector("#caseTitle").textContent = model.title;
  document.querySelector("#caseSubtitle").textContent = model.subtitle;
  document.querySelector("#graphTitle").textContent = steps[state.step].label;
  const status = document.querySelector("#solutionStatus");
  if (!analysis.optimum) {
    status.innerHTML = "<span>No feasible vertex found</span><strong>Check model</strong>";
    return;
  }
  status.innerHTML = `
    <span>${model.sense === "max" ? "Maximum" : "Minimum"} ${escapeHtml(model.objectiveName)}</span>
    <strong>${escapeHtml(formatObjectiveValue(analysis.optimum.value, model))}</strong>
    <span>${escapeHtml(pointLabel(analysis.optimum.point))}</span>`;
}

function renderStepNav() {
  document.querySelector("#stepNav").innerHTML = steps.map((step, index) => `
    <button class="nav-button ${index === state.step ? "active" : ""}" type="button" data-step="${index}" ${index === state.step ? 'aria-current="step"' : ""}>
      <span class="nav-index">0${index + 1}</span>
      <span>${escapeHtml(step.short)}</span>
    </button>`).join("");
}

function renderFacts(analysis) {
  const model = state.model;
  const factRows = [
    ...(model.facts || []),
    ["Vertices", String(analysis.vertices.length)],
  ];
  if (analysis.optimum) {
    factRows.push(["Optimum", pointLabel(analysis.optimum.point)]);
  }
  document.querySelector("#caseFacts").innerHTML = factRows.map(([label, value]) => `
    <div class="fact-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("");
}

function pointLabel(point) {
  return `(${trimNumber(point.x)}, ${trimNumber(point.y)})`;
}

function renderLessonPanel(analysis) {
  const model = state.model;
  const panel = document.querySelector("#lessonPanel");
  if (state.step === 0) panel.innerHTML = renderFormulateStep(model);
  if (state.step === 1) panel.innerHTML = renderDrawLinesStep(model);
  if (state.step === 2) panel.innerHTML = renderFeasibleStep(model, analysis);
  if (state.step === 3) panel.innerHTML = renderObjectiveStep(model, analysis);
  if (state.step === 4) panel.innerHTML = renderActiveStep(model, analysis);
  if (state.step === 5) panel.innerHTML = renderAuditStep(model, analysis);
}

function renderFormulateStep(model) {
  return `
    <p class="eyebrow">Step 1</p>
    <h3>Formulate the two-variable LP.</h3>
    <p>${escapeHtml(model.formulation)}</p>
    <div class="concept-list">
      <div class="concept-item"><strong>${variableHtml(model, 0)}</strong><span>${escapeHtml(model.variables[0].label)}</span></div>
      <div class="concept-item"><strong>${variableHtml(model, 1)}</strong><span>${escapeHtml(model.variables[1].label)}</span></div>
      <div class="concept-item"><strong>${model.sense === "max" ? "Maximize" : "Minimize"}</strong><span>${escapeHtml(model.objectiveName)}</span></div>
    </div>
    <div class="equation-card"><code>${objectiveHtml(model)}</code></div>
    <div class="constraint-list">
      ${model.constraints.map((constraint) => `
        <div class="constraint-pill">
          <span>${escapeHtml(constraint.label)}</span>
          <code>${constraintHtml(constraint, model)}</code>
        </div>`).join("")}
      <div class="constraint-pill">
        <span>Nonnegativity</span>
        <code>${variableHtml(model, 0)}, ${variableHtml(model, 1)} &ge; 0</code>
      </div>
    </div>`;
}

function renderDrawLinesStep(model) {
  return `
    <p class="eyebrow">Step 2</p>
    <h3>Turn each constraint into a boundary line.</h3>
    <p>Every inequality gets graphed first as an equality. Vertical and horizontal limits are still boundary lines, and sloped lines can be drawn from intercepts.</p>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Constraint</th><th>Boundary</th><th>Easy points</th></tr></thead>
        <tbody>
          ${model.constraints.map((constraint) => `
            <tr>
              <td>${escapeHtml(constraint.label)}</td>
              <td><code>${constraintHtml(constraint, model, true)}</code></td>
              <td>${boundaryPointsHtml(constraint)}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>
    <p class="model-note">The shaded strip in the graph shows the side that satisfies the selected constraint.</p>`;
}

function renderFeasibleStep(model, analysis) {
  return `
    <p class="eyebrow">Step 3</p>
    <h3>Intersect all satisfying sides.</h3>
    <p>The feasible region is the overlap of every constraint and the two nonnegativity bounds. Any point inside it is feasible; the graphic optimum will occur at a vertex when a finite optimum exists.</p>
    ${analysis.vertices.length ? `
      <div class="table-wrap">
        <table>
          <thead><tr><th>Extreme point</th><th>${escapeHtml(model.objectiveName)}</th><th>Active boundaries</th></tr></thead>
          <tbody>${analysis.vertices.map((row) => `
            <tr>
              <td>${escapeHtml(pointLabel(row.point))}</td>
              <td>${escapeHtml(formatObjectiveValue(row.value, model))}</td>
              <td>${activeLabels(row.active)}</td>
            </tr>`).join("")}</tbody>
        </table>
      </div>` : `<p class="model-note">No feasible vertex was found with the current coefficients.</p>`}`;
}

function renderObjectiveStep(model, analysis) {
  const slope = Math.abs(model.objective.c2) > EPS ? -model.objective.c1 / model.objective.c2 : null;
  const target = analysis.optimum ? formatObjectiveValue(analysis.optimum.value, model) : "n/a";
  return `
    <p class="eyebrow">Step 4</p>
    <h3>Move a parallel objective contour.</h3>
    <p>Assigning a value to ${escapeHtml(model.objectiveName)} creates one contour line. All other contours for the same objective have the same slope.</p>
    <div class="matrix">
      <div class="matrix-cell"><span>Contour shown</span><code>${objectiveHtml(model, state.objectiveZ)}</code></div>
      <div class="matrix-cell"><span>Best contour</span><code>${escapeHtml(target)}</code></div>
      <div class="matrix-cell"><span>Slope</span><code>${slope === null ? "vertical objective" : trimNumber(slope, 3)}</code></div>
      <div class="matrix-cell"><span>Direction</span><code>${model.sense === "max" ? "higher objective values" : "lower objective values"}</code></div>
    </div>`;
}

function renderActiveStep(model, analysis) {
  if (!analysis.optimum) {
    return `
      <p class="eyebrow">Step 5</p>
      <h3>No optimum is available.</h3>
      <p>The current model needs a nonempty feasible region with at least one extreme point before active constraints can be solved.</p>`;
  }
  return `
    <p class="eyebrow">Step 5</p>
    <h3>Solve the active constraints at the optimum.</h3>
    <p>At the optimal vertex, the binding constraints meet as equalities. Solving that pair retrieves the decision-variable values.</p>
    <div class="equation-card"><code>${variableHtml(model, 0)} = ${trimNumber(analysis.optimum.point.x, 2)}, ${variableHtml(model, 1)} = ${trimNumber(analysis.optimum.point.y, 2)}</code><code>${objectiveHtml(model, analysis.optimum.value)}</code></div>
    <div class="active-list">
      ${analysis.optimum.active.map((constraint) => `<code>${constraintHtml(constraint, model, true)}</code>`).join("")}
    </div>`;
}

function renderAuditStep(model, analysis) {
  return `
    <p class="eyebrow">Step 6</p>
    <h3>Audit each constraint at the solution.</h3>
    <p>Binding constraints have zero slack or zero surplus. Nonbinding constraints show how much unused room remains at the chosen vertex.</p>
    ${renderSlackTable(model, analysis)}
    <form class="probe-form" id="probeForm">
      <div class="editor-field">
        <label for="probeX">${escapeHtml(model.variables[0].symbol)}</label>
        <input id="probeX" type="number" step="0.01" value="${trimNumber(state.probe.x, 2)}">
      </div>
      <div class="editor-field">
        <label for="probeY">${escapeHtml(model.variables[1].symbol)}</label>
        <input id="probeY" type="number" step="0.01" value="${trimNumber(state.probe.y, 2)}">
      </div>
      <button class="primary-button" type="submit">Evaluate point</button>
    </form>
    ${state.probeResult ? renderProbeResult(state.probeResult, model) : ""}`;
}

function boundaryPointsHtml(constraint) {
  if (Math.abs(constraint.a) < EPS && Math.abs(constraint.b) < EPS) return "Not a line";
  if (Math.abs(constraint.b) < EPS) return `${trimNumber(constraint.rhs / constraint.a)} on x-axis, vertical line`;
  if (Math.abs(constraint.a) < EPS) return `${trimNumber(constraint.rhs / constraint.b)} on y-axis, horizontal line`;
  const xIntercept = constraint.rhs / constraint.a;
  const yIntercept = constraint.rhs / constraint.b;
  return `(${trimNumber(xIntercept)}, 0) and (0, ${trimNumber(yIntercept)})`;
}

function activeLabels(active) {
  return active.map((constraint) => escapeHtml(constraint.label)).join(", ");
}

function renderSlackTable(model, analysis) {
  if (!analysis.optimum) return '<p class="model-note">No optimum to audit.</p>';
  const point = analysis.optimum.point;
  const rows = allConstraints(model).map((constraint) => {
    const lhs = lhsValue(constraint, point);
    const gap = constraint.sense === "<=" ? constraint.rhs - lhs : constraint.sense === ">=" ? lhs - constraint.rhs : Math.abs(lhs - constraint.rhs);
    const binding = Math.abs(gap) <= 1e-5;
    const gapLabel = constraint.sense === "<=" ? "slack" : constraint.sense === ">=" ? "surplus" : "residual";
    return `
      <tr>
        <td>${escapeHtml(constraint.label)}</td>
        <td><code>${constraintHtml(constraint, model)}</code></td>
        <td>${trimNumber(lhs, 2)}</td>
        <td class="${binding ? "binding" : "clear"}">${binding ? "binding" : `${trimNumber(gap, 2)} ${gapLabel}`}</td>
      </tr>`;
  }).join("");
  return `
    <div class="table-wrap">
      <table class="slack-table">
        <thead><tr><th>Constraint</th><th>Rule</th><th>LHS at optimum</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderProbeResult(result, model) {
  const objective = objectiveAt(result.point, model);
  return `
    <div class="probe-result ${result.feasible ? "pass" : "fail"}">
      <strong>${escapeHtml(pointLabel(result.point))} is ${result.feasible ? "feasible" : "not feasible"}.</strong>
      <div>${escapeHtml(model.objectiveName)} = ${escapeHtml(formatObjectiveValue(objective, model))}</div>
      ${result.violations.length ? `<div>Violates: ${result.violations.map((constraint) => escapeHtml(constraint.label)).join(", ")}</div>` : "<div>All listed constraints and nonnegativity bounds are satisfied.</div>"}
    </div>`;
}

function renderCalculationPanel(analysis) {
  const model = state.model;
  const rows = analysis.vertices.map((row, index) => {
    const isOptimum = analysis.optimum && closePoints(row.point, analysis.optimum.point);
    return `
      <tr class="${isOptimum ? "optimum-row" : ""}">
        <td><button class="vertex-button" type="button" data-vertex-index="${index}">${escapeHtml(pointLabel(row.point))}</button></td>
        <td>${escapeHtml(formatObjectiveValue(row.value, model))}</td>
        <td>${isOptimum ? "optimum" : activeLabels(row.active)}</td>
      </tr>`;
  }).join("");
  document.querySelector("#calculationPanel").innerHTML = `
    <p class="eyebrow">Vertex ledger</p>
    <h3>Extreme points carry the comparison.</h3>
    <p>The table recomputes whenever coefficients change. Select a point to send it to the audit probe.</p>
    ${rows ? `
      <div class="table-wrap">
        <table>
          <thead><tr><th>Point</th><th>${escapeHtml(model.objectiveName)}</th><th>Status</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>` : `<p class="model-note">The current system has no feasible extreme point inside the model geometry.</p>`}`;
}

function renderObjectiveControls(analysis) {
  const model = state.model;
  const range = analysis.range;
  const step = range.span > 600 ? 10 : range.span > 60 ? 1 : 0.1;
  document.querySelector("#objectiveControls").innerHTML = `
    <p class="eyebrow">Objective contour</p>
    <h3>${model.sense === "max" ? "Maximize" : "Minimize"} ${escapeHtml(model.objectiveName)}</h3>
    <div class="objective-readout">
      <span>${objectiveHtml(model)}</span>
      <strong>${escapeHtml(formatObjectiveValue(state.objectiveZ, model))}</strong>
    </div>
    <div class="range-row">
      <input id="objectiveSlider" type="range" min="${range.min}" max="${range.max}" step="${step}" value="${state.objectiveZ}" aria-label="Objective contour value">
    </div>
    <div class="button-row">
      <button class="small-button" id="animateObjective" type="button">Animate contour</button>
      <button class="primary-button" id="setOptimumContour" type="button">Optimum contour</button>
    </div>`;
}

function renderConstraintInspector() {
  const model = state.model;
  const selected = model.constraints[state.selectedConstraint] || model.constraints[0];
  document.querySelector("#constraintInspector").innerHTML = `
    <p class="eyebrow">Boundary selector</p>
    <h3>Constraint lines</h3>
    <div class="constraint-buttons">
      ${model.constraints.map((constraint, index) => `
        <button class="constraint-button ${index === state.selectedConstraint ? "active" : ""}" type="button" data-constraint-index="${index}">
          <span class="swatch" style="background:${palette[index % palette.length]}"></span>
          <span><strong>${escapeHtml(constraint.label)}</strong><code>${constraintHtml(constraint, model)}</code></span>
        </button>`).join("")}
    </div>
    ${selected ? `
      <div class="constraint-meta">
        <dl>
          <dt>Boundary</dt><dd><code>${constraintHtml(selected, model, true)}</code></dd>
          <dt>Inequality</dt><dd>${senseHtml(selected.sense)} side</dd>
          <dt>Points</dt><dd>${boundaryPointsHtml(selected)}</dd>
        </dl>
        <p class="model-note">${escapeHtml(selected.note || "")}</p>
      </div>` : ""}`;
}

function renderModelEditor() {
  const model = state.model;
  const rows = [...model.constraints];
  while (rows.length < 5) rows.push({ label: "", a: "", b: "", sense: "<=", rhs: "" });
  document.querySelector("#modelEditor").innerHTML = `
    <details class="editor-details">
      <summary>Model editor</summary>
      <div class="editor-grid">
        <div class="editor-field">
          <label for="editorSense">Goal</label>
          <select id="editorSense">
            <option value="max" ${model.sense === "max" ? "selected" : ""}>Maximize</option>
            <option value="min" ${model.sense === "min" ? "selected" : ""}>Minimize</option>
          </select>
        </div>
        <div class="editor-field">
          <label for="editorName">Objective name</label>
          <input id="editorName" value="${escapeHtml(model.objectiveName)}">
        </div>
        <div class="editor-field">
          <label for="editorC1">${escapeHtml(model.variables[0].symbol)} coefficient</label>
          <input id="editorC1" type="number" step="0.01" value="${model.objective.c1}">
        </div>
        <div class="editor-field">
          <label for="editorC2">${escapeHtml(model.variables[1].symbol)} coefficient</label>
          <input id="editorC2" type="number" step="0.01" value="${model.objective.c2}">
        </div>
        <div class="editor-field">
          <label for="editorXMax">x-axis max</label>
          <input id="editorXMax" type="number" step="1" min="1" value="${model.axis.xMax}">
        </div>
        <div class="editor-field">
          <label for="editorYMax">y-axis max</label>
          <input id="editorYMax" type="number" step="1" min="1" value="${model.axis.yMax}">
        </div>
      </div>
      <div class="constraint-editor">
        <label>Constraints</label>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Label</th><th>a</th><th>b</th><th>Sign</th><th>RHS</th></tr></thead>
            <tbody>
              ${rows.map((constraint, index) => `
                <tr data-editor-row="${index}">
                  <td><input data-field="label" value="${escapeHtml(constraint.label)}" aria-label="Constraint ${index + 1} label"></td>
                  <td><input data-field="a" type="number" step="0.01" value="${constraint.a}" aria-label="Constraint ${index + 1} x1 coefficient"></td>
                  <td><input data-field="b" type="number" step="0.01" value="${constraint.b}" aria-label="Constraint ${index + 1} x2 coefficient"></td>
                  <td>
                    <select data-field="sense" aria-label="Constraint ${index + 1} sense">
                      <option value="<=" ${constraint.sense === "<=" ? "selected" : ""}>&lt;=</option>
                      <option value=">=" ${constraint.sense === ">=" ? "selected" : ""}>&gt;=</option>
                      <option value="=" ${constraint.sense === "=" ? "selected" : ""}>=</option>
                    </select>
                  </td>
                  <td><input data-field="rhs" type="number" step="0.01" value="${constraint.rhs}" aria-label="Constraint ${index + 1} right hand side"></td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>
      </div>
      <div class="button-row">
        <button class="small-button" id="resetExample" type="button">Reset example</button>
        <button class="primary-button" id="applyModel" type="button">Update graph</button>
      </div>
      ${state.editorMessage ? `<p class="model-note">${escapeHtml(state.editorMessage)}</p>` : ""}
    </details>`;
}

function renderSourceSketch() {
  const model = state.model;
  const section = document.querySelector("#sourceSketch");
  if (!model.image) {
    section.classList.remove("visible");
    section.innerHTML = "";
    return;
  }
  section.classList.add("visible");
  section.innerHTML = `
    <p class="eyebrow">Deck sketch</p>
    <figure>
      <img src="${escapeHtml(model.image)}" alt="Hand-drawn river pollution graphic solution from the lecture deck.">
      <figcaption>Reference sketch extracted from the lecture deck. The live graph above rebuilds the same case with computed vertices.</figcaption>
    </figure>`;
}

function render() {
  const analysis = analyzeModel(state.model);
  ensureObjectiveZ(analysis);
  renderCaseSelect();
  renderHeader(analysis);
  renderStepNav();
  renderFacts(analysis);
  renderGraph(analysis);
  renderLessonPanel(analysis);
  renderCalculationPanel(analysis);
  renderObjectiveControls(analysis);
  renderConstraintInspector();
  renderModelEditor();
  renderSourceSketch();
}

function setExample(key) {
  if (!examples[key]) return;
  state.exampleKey = key;
  state.baseExampleKey = key;
  state.model = cloneModel(examples[key]);
  state.step = 0;
  state.selectedConstraint = 0;
  state.objectiveZ = null;
  state.probe = defaultProbe(state.model);
  state.probeResult = null;
  state.editorMessage = "";
  cancelAnimation();
  render();
}

function defaultProbe(model) {
  if (model.id === "warmup") return { x: 25, y: 15 };
  if (model.id === "river") return { x: 200, y: 100 };
  return { x: 40, y: 33.33 };
}

function setStep(index) {
  state.step = clamp(index, 0, steps.length - 1);
  render();
  document.querySelector("#stage").focus({ preventScroll: true });
}

function setOptimumContour() {
  const analysis = analyzeModel(state.model);
  if (analysis.optimum) {
    state.objectiveZ = analysis.optimum.value;
    render();
  }
}

function cancelAnimation() {
  if (state.animationId) {
    cancelAnimationFrame(state.animationId);
    state.animationId = null;
  }
}

function animateObjective() {
  const analysis = analyzeModel(state.model);
  if (!analysis.optimum) return;
  cancelAnimation();
  const start = Number.isFinite(state.objectiveZ) ? state.objectiveZ : analysis.range.min;
  const target = analysis.optimum.value;
  const duration = 900;
  const started = performance.now();
  const tick = (time) => {
    const t = clamp((time - started) / duration, 0, 1);
    const eased = 1 - (1 - t) ** 3;
    state.objectiveZ = start + (target - start) * eased;
    render();
    if (t < 1) {
      state.animationId = requestAnimationFrame(tick);
    } else {
      state.animationId = null;
    }
  };
  state.animationId = requestAnimationFrame(tick);
}

function evaluateProbe(point, model) {
  const constraints = allConstraints(model);
  const violations = constraints.filter((constraint) => !satisfiesConstraint(point, constraint));
  return {
    point,
    feasible: violations.length === 0,
    violations,
  };
}

function readEditorModel() {
  const c1 = Number(document.querySelector("#editorC1").value);
  const c2 = Number(document.querySelector("#editorC2").value);
  const xMax = Number(document.querySelector("#editorXMax").value);
  const yMax = Number(document.querySelector("#editorYMax").value);
  const constraints = [];
  document.querySelectorAll("[data-editor-row]").forEach((row, index) => {
    const a = Number(row.querySelector('[data-field="a"]').value);
    const b = Number(row.querySelector('[data-field="b"]').value);
    const rhs = Number(row.querySelector('[data-field="rhs"]').value);
    const sense = row.querySelector('[data-field="sense"]').value;
    const label = row.querySelector('[data-field="label"]').value.trim() || `Constraint ${index + 1}`;
    const fieldsBlank = [row.querySelector('[data-field="a"]').value, row.querySelector('[data-field="b"]').value, row.querySelector('[data-field="rhs"]').value]
      .every((value) => value.trim() === "");
    if (fieldsBlank) return;
    if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(rhs) || (Math.abs(a) < EPS && Math.abs(b) < EPS)) return;
    constraints.push({ label, a, b, sense, rhs, note: "" });
  });
  const objectiveName = document.querySelector("#editorName").value.trim() || "Z";
  if (!Number.isFinite(c1) || !Number.isFinite(c2) || (Math.abs(c1) < EPS && Math.abs(c2) < EPS)) {
    throw new Error("Enter at least one nonzero objective coefficient.");
  }
  if (!Number.isFinite(xMax) || !Number.isFinite(yMax) || xMax <= 0 || yMax <= 0) {
    throw new Error("Axis maximum values must be positive.");
  }
  if (!constraints.length) {
    throw new Error("Enter at least one usable constraint.");
  }
  return {
    ...state.model,
    id: "custom",
    title: "Custom edited LP model",
    subtitle: "A two-variable LP created from the editable coefficients in the control room.",
    source: `Edited from ${state.model.source}`,
    sense: document.querySelector("#editorSense").value,
    objectiveName,
    objectivePrefix: state.model.objectivePrefix,
    objectiveSuffix: state.model.objectiveSuffix,
    objective: { c1, c2 },
    axis: { xMax, yMax },
    constraints,
  };
}

document.addEventListener("change", (event) => {
  if (event.target.id === "caseSelect") {
    setExample(event.target.value);
  }
});

document.addEventListener("input", (event) => {
  if (event.target.id === "objectiveSlider") {
    state.objectiveZ = Number(event.target.value);
    cancelAnimation();
    const analysis = analyzeModel(state.model);
    renderGraph(analysis);
    renderLessonPanel(analysis);
    renderObjectiveControls(analysis);
  }
});

document.addEventListener("submit", (event) => {
  if (event.target.id === "probeForm") {
    event.preventDefault();
    const x = Number(document.querySelector("#probeX").value);
    const y = Number(document.querySelector("#probeY").value);
    state.probe = {
      x: Number.isFinite(x) ? x : 0,
      y: Number.isFinite(y) ? y : 0,
    };
    state.probeResult = evaluateProbe(state.probe, state.model);
    render();
  }
});

document.addEventListener("click", (event) => {
  const stepButton = event.target.closest("[data-step]");
  if (stepButton) {
    setStep(Number(stepButton.dataset.step));
    return;
  }
  const constraintButton = event.target.closest("[data-constraint-index]");
  if (constraintButton) {
    state.selectedConstraint = Number(constraintButton.dataset.constraintIndex);
    render();
    return;
  }
  const vertexButton = event.target.closest("[data-vertex-index]");
  if (vertexButton) {
    const analysis = analyzeModel(state.model);
    const row = analysis.vertices[Number(vertexButton.dataset.vertexIndex)];
    if (row) {
      state.probe = { ...row.point };
      state.probeResult = evaluateProbe(state.probe, state.model);
      state.step = 5;
      render();
    }
    return;
  }
  if (event.target.id === "autoSolve" || event.target.id === "setOptimumContour") {
    state.step = Math.max(state.step, 4);
    setOptimumContour();
    return;
  }
  if (event.target.id === "animateObjective") {
    state.step = Math.max(state.step, 3);
    animateObjective();
    return;
  }
  if (event.target.id === "resetExample") {
    setExample(state.baseExampleKey);
    return;
  }
  if (event.target.id === "applyModel") {
    try {
      const next = readEditorModel();
      state.exampleKey = "custom";
      state.model = next;
      state.selectedConstraint = 0;
      state.objectiveZ = null;
      state.editorMessage = "Custom model applied.";
      state.probe = { x: 0, y: 0 };
      state.probeResult = null;
    } catch (error) {
      state.editorMessage = error.message;
    }
    render();
  }
});

render();
