# Source decisions and Model I interpretation

Source directory: `C:\Users\wei\OneDrive - Colostate\Teaching\F422\2025\Lectures\week_9_10_11_DIII`.

The code subfolder was excluded. No games model was used. Standalone Excel files were not present in the included directory. The PowerPoint's embedded objects are OLE/Visio objects, not a supplied standalone spreadsheet. Original files were copied read-only; no source files were edited.

## Interpretation established from the course material

`ModelI.pptx` slides 2, 10 and 15 and `Model1and2Formal.pdf` identify Model I as a complete-prescription area-assignment formulation. A variable is the number of land units of an initial management unit assigned to a sequence covering the whole planning horizon. The same sequence may include multiple rotations and multiple final harvests. Thus “Model I means at most one harvest” would be incorrect.

Period outputs are precomputed for each initial-unit/prescription combination. The LP allocates area among those columns; their fixed coefficients embed growth, treatment and regeneration. Continuous allocations may divide a stratum. Indivisible-stand selection is a different integer restriction, not an implicit property of Model I.

The formal handout uses different subscript letters (`a,q,n`) from the website (`i,j,t`); the meanings agree. Printed strict inequality symbols in the old handout are interpreted as the non-strict inequalities used in linear programming.

## Primary three-period case

Slides 4–9 and `Prescriptions.docx` supply the ordered action sequences:

1. NNN
2. NNC
3. NCN
4. NCC
5. CNN
6. CNC
7. CCN
8. CCC

Initial areas are 100, 200, 50 and 150 ha. Per-class yields are 50, 250, 500 and 600 m³/ha. Clearcuts return to Age 1 in the next period; no-cut stands advance one class, with the oldest class pooled. Computing these trajectories reproduces the entire slide-4 yield table. No minimum age is imposed in this intentionally simplified case.

The transition mechanism is used to calculate the coefficients, not to reinterpret X as a period-level harvest variable. Final steady-state equalities are not shown in this Model I example and are not silently imported from the separate Lab 6 lesson.

## Primary homework case

Slides 11–13 are authoritative for the live six-period case:

- Poorly stocked pine/fir: 1,000 acres, initial age 40, minimum harvest age 40.
- Fully stocked pine: 2,000 acres, initial age 10, minimum harvest age 30.
- Every harvested stand regenerates as fully stocked pine.
- Six 10-year periods, with harvest at the beginning of each period.
- Base stumpage price $25/cord and zero discount rate.

The completed yields of the 13 poor-stock and six full-stock prescriptions are computed from slide 11's yield table and slide 12's sequences. The site fills blank exercise entries by calculation; it does not imply every entry was explicitly supplied. For example, poorly stocked prescription 3 yields 9 cords/acre in period 1 and 11 in period 4, so the base value is $500/acre.

The slide labels the objective “net revenue,” but no separate treatment costs are specified. The site therefore labels the live quantity harvest revenue and adds no invented costs. Optional positive discount rates use years 0, 10, 20, 30, 40 and 50 and change objective values only. No terminal land value is included.

## Distinct material retained separately

- `modelIandII.pdf` is a 2010 assignment with 5,000 poorly stocked acres, 1,000 fully stocked acres and its own net-revenue coefficients. These differ from the newer slides and are not substituted into the live case. Its table was also visually reviewed after PDF rendering.
- Slides 17–21 use a separate 200/300-acre example with mid-period harvest and end-period ages. Those timing conventions are not mixed with the beginning-of-period homework.
- `ExampleExercise.docx` contains another 200/300-acre age-path exercise. It is provided as a supplementary download, not silently used as the live yield model.
- `Model1_formulation.doc` is retained as an original legacy reference; the teaching equations are grounded in the extracted slide deck and readable formal PDF, rather than a claimed full interpretation of that binary Word file.
- Model II-only slides and the legacy combined PowerPoint are not needed for this site's Model I lessons.

## Harvest-flow terminology

The newer slides use `H1 <= H2 <= H3` and “non-declining even-flow.” The website explicitly labels this **non-declining**, separate from equal flow and a ±10% band. The formal PDF gives a ±10% example and a supplied H0. The site's default has no H0 because neither primary example provides a previous-period harvest. Students may explicitly add one as a what-if scenario.

## Verification evidence

`test_model.cjs` verifies the source yield vectors, representative objective coefficients, feasible and infeasible cases and objective ordering as flow constraints tighten. `verify_scipy.py` independently solves 64 cases with SciPy/HiGHS and compares objective values and feasibility classifications. Browser QA exercises both datasets, every navigation page, mobile overflow, changing prescriptions, quizzes, CSV downloads, solver policies, impossible H0 and invalid inputs. Captures are retained in `qa/`.
