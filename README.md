# MathsLab

A web application that solves II PUC (Class 12) Mathematics problems step by step.

Open `index.html` in a browser. There is nothing to install or build, and it works offline.

## Chapters and solvers

**Part I**

1. Relations and Functions: type of relation, one-one and onto, composition
2. Inverse Trigonometric Functions: principal value, evaluating expressions
3. Matrices: operations, symmetric + skew-symmetric parts, inverse by row operations
4. Determinants: determinant, adjoint and inverse, solving linear equations, area of a triangle
5. Continuity and Differentiability: derivative with steps, continuity at a point, parametric and implicit functions
6. Application of Derivatives: increasing/decreasing and maxima/minima, tangent and normal, rate of change

**Part II** (arranged by the sections of the Part II textbook)

7. Integrals: indefinite (substitution, particular forms, partial fractions, by parts) and definite
8. Application of Integrals: area under a curve, area between two curves
9. Differential Equations: order and degree, variable separable, homogeneous, linear
10. Vector Algebra: magnitude and unit vector, dot product, cross product, section formula, scalar triple product
11. Three Dimensional Geometry: direction cosines, lines, angle and shortest distance between lines, planes
12. Linear Programming: graphical (corner point) method with the feasible region drawn
13. Probability: conditional probability, Bayes' theorem, random variables, binomial distribution

## Asking by photo

The Ask box on the first page accepts a photo, a dropped picture or a pasted screenshot of a question.

- **Built-in reader (free):** works on the hosted site with no setup. It reads plain printed lines well, but powers, roots and fractions usually need correcting before solving.
- **AI reader (optional):** `api/read-photo.js` is a Vercel serverless function that sends the photo to an AI model and returns the question as text. To switch it on, import this repository into Vercel and add the environment variable `ANTHROPIC_API_KEY`. The app detects the function by itself and falls back to the built-in reader when it is missing. Each photo costs a small amount on that key, so set a spending limit on it.

## How it is built

Plain HTML, CSS and JavaScript.

- `js/core.js`: parsing, exact fractions, the step-by-step differentiator, integration, plotting
- `js/chapters/`: one file per group of chapters; each solver is a small object with its input fields and a `solve` function
- `js/ask.js` and `js/photo.js`: the Ask box (reading typed, pasted and photographed questions)
- `js/app.js`: the page shell and navigation
- `vendor/`: [math.js](https://mathjs.org) (Apache-2.0), [nerdamer](https://github.com/jiggzson/nerdamer) (Apache-2.0) and [KaTeX](https://katex.org) (MIT), [Tesseract.js](https://github.com/naptha/tesseract.js) (Apache-2.0)

To add a solver, push another entry into the `tools` list of its chapter.
