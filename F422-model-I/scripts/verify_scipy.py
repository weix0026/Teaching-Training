"""Independent numerical cross-check; uses the host's SciPy/HiGHS."""
import json
from pathlib import Path
import numpy as np
from scipy.optimize import linprog

root=Path(__file__).resolve().parents[1]
cases=json.loads((root/'research/solver-cases.json').read_text())
for case in cases:
    eq=[r for r in case['rows'] if r['sense']=='=']
    ub=[r for r in case['rows'] if r['sense']!='=']
    res=linprog(-np.array(case['c']),A_eq=[r['a'] for r in eq] or None,b_eq=[r['b'] for r in eq] or None,A_ub=[r['a'] for r in ub] or None,b_ub=[r['b'] for r in ub] or None,bounds=(0,None),method='highs')
    if res.success:
        assert case['result']['status']=='optimal',(case['dataset'],case['options'])
        assert np.isclose(-res.fun,case['result']['value'],rtol=1e-7,atol=1e-4),(res.fun,case['result'])
    else:
        assert res.status==2 and case['result']['status']=='infeasible',(res.message,case['result'])
print(f'Independent HiGHS comparison passed for all {len(cases)} scenarios.')
