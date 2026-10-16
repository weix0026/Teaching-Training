# F422 Model I Forest Planning Studio

Open `index.html` in a modern browser. The website runs directly from disk, with no server, build, accounts or internet connection required. All teaching files are contained in this folder.

## What students can do

1. Learn that Model I allocates initial forest area to complete prescriptions over the entire planning horizon.
2. Trace growth, clearcutting and regeneration through a prescription, including repeated harvests.
3. Inspect period-yield and objective coefficients and assemble the LP formulation.
4. Edit area allocations and solve a continuous LP under no-flow, non-declining, strictly equal or ±10% harvest-flow constraints.
5. Explore a prior-period harvest requirement, price and discount-rate changes.
6. Check understanding, download course references, and export coefficients and plans as CSV files for Excel.

The user-requested source `code` subfolder and games model are excluded. This site does not add a Model II or dynamic Model III optimizer.

## Course cases

- **Three-decade bridge:** four initial age classes with 100, 200, 50 and 150 ha; eight prescriptions per initial class; 32 allocation variables. Source: `ModelI.pptx`, slides 4–9.
- **Six-decade homework:** 1,000 acres of poorly stocked pine/fir initially age 40 and 2,000 acres of fully stocked pine initially age 10; 13 and 6 prescriptions respectively. Base price $25/cord and discount rate 0%. Source: `ModelI.pptx`, slides 11–13.

The older `modelIandII.pdf` has different areas and net-revenue coefficients. It is available as a separately labeled historical exercise. Its inputs are not blended into the live models. See `research/source-notes.md` for source decisions.

## Core formulation

- `X[i,j]`: area of initial unit `i` assigned to full-horizon prescription `j`.
- `Y[i,j,t]`: precomputed period `t` yield per unit area under that prescription.
- `c[i,j]`: precomputed objective value per unit area.
- Maximize `sum(c[i,j] * X[i,j])`.
- For each initial unit, `sum_j X[i,j] = A[i]`.
- `H[t] = sum(Y[i,j,t] * X[i,j])`.
- Apply the explicitly selected harvest-flow policy, plus `X >= 0`.

The in-browser solver substitutes the expressions for H into the flow constraints. It uses two-phase simplex and checks its solution against the original constraints before labeling it optimal. Allocations remain continuous. No final steady-state, terminal value or habitat condition is inferred from the choice of Model I.

## Files

- `index.html`, `styles.css`, `app.js`: accessible, responsive teaching interface.
- `model.js`: source data, prescription simulation, coefficient construction and LP solver.
- `materials/`: local copies of the referenced course files.
- `research/`: source extractions, provenance notes and numerical/browser verification evidence.
- `scripts/`: repeatable extraction and verification utilities.

No standalone Excel workbook was found outside the excluded source `code` subfolder. The website includes CSV exports and instructions for recreating the model with Excel Solver; it does not claim workbook-level verification.

## Verification

From the repository root:

```powershell
node F422-model-I/scripts/test_model.cjs
python -B F422-model-I/scripts/verify_scipy.py
node F422-model-I/scripts/browser_qa.cjs
```

The numerical cross-check requires the host Python's NumPy and SciPy. Browser QA uses Chrome and the Playwright JavaScript package already installed under the repository `.venv`; these are development dependencies only. It checks both examples across all six lessons at desktop and mobile sizes, as well as invalid prescriptions, solver results, infeasible scenarios, input validation, downloads, quizzes and local file links.

Independent HiGHS comparisons passed for 64 policy/discount/prior-harvest scenarios. Source checks verify all 32 three-period coefficients and all 19 homework yield vectors.

Base-case optimal objectives, without a supplied H0:

| Case | No flow constraints | Non-declining | Strictly equal |
|---|---:|---:|---:|
| Three-decade bridge, m³ | 335,000 | 324,000 | 323,642.384106 |
| Six-decade homework, dollars at 0% | 1,975,000 | 1,891,448.370393 | 797,727.272727 |

These are computed optima for this site's stated model, not values transcribed from an unavailable workbook. Different optimal allocations may attain the same objective. The three-decade case deliberately does not impose the Lab 6 final steady-state equalities, so its objective is not directly comparable to the constrained Lab 6 example.
