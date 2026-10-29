# F422 Lab 7 independent study guide

The student-facing, dependency-free site is in `dist/`. Open `dist/index.html` directly or serve that directory with a static web server. Upload all contents of `dist/` together to a static host. Relative links work under a subdirectory. A downloadable handout is included.

## Content decisions

The 2025 `Lab7_Uneven_Aged.docx` controls the requirements and 100-point rubric. The older answer document has different sheet names, a Lab 6 title, and different screenshot instructions; those were not carried into this guide. UEM.xlsx has a saved RHS of 6 and an existing sensitivity report for RHS 5. It is intentionally not distributed. Students build a fresh workbook using its cell layout, the handout's RHS 5, and new Solver reports.

Instructor keys and grading notes are not in the distributable directory. The explorer evaluates the supplied equations and checks feasibility; it is not an optimizer and does not reveal reference optimal solutions. The shadow-price calculator uses student-supplied values and enforces the supplied allowable range.

## Features

Six-step navigation, class-stock/harvest explorer and chart, copyable Excel formulas, both Solver configurations, formative quizzes, shadow-price calculator, locally saved reflection drafts and progress, note export, complete-lesson printing, and an eight-item submission checklist. No accounts, analytics, external fonts, or JavaScript dependencies. Notes and progress remain on the student's device and are not submitted to an instructor.

## Publishing

`lab7-student-site.zip` contains only the deployable site. Extract and upload its contents, keeping `downloads/` alongside `index.html`. For an LMS, host as a website or use an LMS-supported HTML package rather than pasting JavaScript into a text editor that may strip scripts. Students still submit an Excel workbook through the course's normal assignment workflow. Set that assignment's deadline and submission location in the LMS.

The Sites registration is private by default; a private preview link is for instructor review and is not a student-accessible course link. Use the portable package on your course host or explicitly change Sites access before sharing with students.
