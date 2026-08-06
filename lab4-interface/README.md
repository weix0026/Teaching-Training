# Forest Regulation Studio

A dependency-free interactive lesson for regulated forests, area control, volume control, and the complete Lab 4 linear-programming formulation. Open `index.html` directly in a modern browser.

The calculations are based on the Lab 4 Wisconsin aspen case:

- 6,000 ha forest area
- 40-year rotation
- 20-year planning horizon in five 4-year periods
- 3,000 ha area-control limit
- 631,512 m³ volume-control limit

The LP lesson covers the 20 decision variables, objective function, compartment-area constraints, period-volume bookkeeping equations, even-flow constraints, alternative area/volume regulation limits, and nonnegativity.

The volume-control lesson includes selectable worked examples showing how each compartment's average yield is calculated from its five period yields and then converted to inventory.

The source case was found in `F422/2025/Labs/Lab4`; the current `NR422/Lab4` materials cover ArcGIS network analysis and do not contain the forest-regulation concepts requested for this interface.
