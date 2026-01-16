// NYS Algebra I and Algebra II Standards
// Aligned with Next Generation Learning Standards and Regents Exams

export interface AlgebraStandard {
  code: string;
  course: "Algebra 1" | "Algebra 2";
  domain: string;
  cluster: string;
  standardText: string;
  keyTopics: string[];
}

// ============================================
// ALGEBRA I STANDARDS (Grade 9)
// ============================================
export const ALGEBRA_1_STANDARDS: AlgebraStandard[] = [
  // Number and Quantity
  {
    code: "AI-N.RN.3",
    course: "Algebra 1",
    domain: "Number and Quantity",
    cluster: "Real Number System",
    standardText: "Explain why the sum or product of two rational numbers is rational; that the sum of a rational number and an irrational number is irrational.",
    keyTopics: ["Rational numbers", "Irrational numbers", "Number operations"],
  },

  // Seeing Structure in Expressions
  {
    code: "AI-A.SSE.1",
    course: "Algebra 1",
    domain: "Algebra",
    cluster: "Seeing Structure in Expressions",
    standardText: "Interpret expressions that represent a quantity in terms of its context.",
    keyTopics: ["Algebraic expressions", "Variables", "Coefficients", "Terms"],
  },
  {
    code: "AI-A.SSE.1a",
    course: "Algebra 1",
    domain: "Algebra",
    cluster: "Seeing Structure in Expressions",
    standardText: "Interpret parts of an expression, such as terms, factors, and coefficients.",
    keyTopics: ["Terms", "Factors", "Coefficients", "Constants"],
  },
  {
    code: "AI-A.SSE.1b",
    course: "Algebra 1",
    domain: "Algebra",
    cluster: "Seeing Structure in Expressions",
    standardText: "Interpret complicated expressions by viewing one or more of their parts as a single entity.",
    keyTopics: ["Composite expressions", "Grouping", "Expression structure"],
  },
  {
    code: "AI-A.SSE.2",
    course: "Algebra 1",
    domain: "Algebra",
    cluster: "Seeing Structure in Expressions",
    standardText: "Use the structure of an expression to identify ways to rewrite it.",
    keyTopics: ["Factoring", "Difference of squares", "Perfect square trinomials"],
  },
  {
    code: "AI-A.SSE.3",
    course: "Algebra 1",
    domain: "Algebra",
    cluster: "Seeing Structure in Expressions",
    standardText: "Choose and produce an equivalent form of an expression to reveal and explain properties of the quantity represented.",
    keyTopics: ["Equivalent expressions", "Factored form", "Standard form"],
  },
  {
    code: "AI-A.SSE.3a",
    course: "Algebra 1",
    domain: "Algebra",
    cluster: "Seeing Structure in Expressions",
    standardText: "Factor a quadratic expression to reveal the zeros of the function it defines.",
    keyTopics: ["Factoring quadratics", "Zeros", "Roots", "X-intercepts"],
  },
  {
    code: "AI-A.SSE.3b",
    course: "Algebra 1",
    domain: "Algebra",
    cluster: "Seeing Structure in Expressions",
    standardText: "Complete the square in a quadratic expression to reveal the maximum or minimum value.",
    keyTopics: ["Completing the square", "Vertex form", "Maximum/minimum"],
  },

  // Arithmetic with Polynomials
  {
    code: "AI-A.APR.1",
    course: "Algebra 1",
    domain: "Algebra",
    cluster: "Arithmetic with Polynomials",
    standardText: "Understand that polynomials form a system analogous to the integers in that they are closed under addition, subtraction, and multiplication.",
    keyTopics: ["Polynomials", "Closure property", "Polynomial operations"],
  },

  // Creating Equations
  {
    code: "AI-A.CED.1",
    course: "Algebra 1",
    domain: "Algebra",
    cluster: "Creating Equations",
    standardText: "Create equations and inequalities in one variable and use them to solve problems.",
    keyTopics: ["Linear equations", "Inequalities", "Word problems", "Modeling"],
  },
  {
    code: "AI-A.CED.2",
    course: "Algebra 1",
    domain: "Algebra",
    cluster: "Creating Equations",
    standardText: "Create equations in two or more variables to represent relationships between quantities.",
    keyTopics: ["Two-variable equations", "Linear relationships", "Modeling"],
  },
  {
    code: "AI-A.CED.3",
    course: "Algebra 1",
    domain: "Algebra",
    cluster: "Creating Equations",
    standardText: "Represent constraints by equations or inequalities, and by systems of equations and/or inequalities.",
    keyTopics: ["Systems of equations", "Constraints", "Feasible region"],
  },
  {
    code: "AI-A.CED.4",
    course: "Algebra 1",
    domain: "Algebra",
    cluster: "Creating Equations",
    standardText: "Rearrange formulas to highlight a quantity of interest, using the same reasoning as in solving equations.",
    keyTopics: ["Literal equations", "Formula manipulation", "Isolating variables"],
  },

  // Reasoning with Equations and Inequalities
  {
    code: "AI-A.REI.1",
    course: "Algebra 1",
    domain: "Algebra",
    cluster: "Reasoning with Equations",
    standardText: "Explain each step in solving a simple equation as following from the equality of numbers asserted at the previous step.",
    keyTopics: ["Equation solving", "Properties of equality", "Justification"],
  },
  {
    code: "AI-A.REI.3",
    course: "Algebra 1",
    domain: "Algebra",
    cluster: "Reasoning with Equations",
    standardText: "Solve linear equations and inequalities in one variable, including equations with coefficients represented by letters.",
    keyTopics: ["Linear equations", "Inequalities", "Variables", "Literal equations"],
  },
  {
    code: "AI-A.REI.4",
    course: "Algebra 1",
    domain: "Algebra",
    cluster: "Reasoning with Equations",
    standardText: "Solve quadratic equations in one variable.",
    keyTopics: ["Quadratic equations", "Factoring", "Quadratic formula", "Square roots"],
  },
  {
    code: "AI-A.REI.4a",
    course: "Algebra 1",
    domain: "Algebra",
    cluster: "Reasoning with Equations",
    standardText: "Use the method of completing the square to transform any quadratic equation in x into an equation of the form (x – p)² = q.",
    keyTopics: ["Completing the square", "Vertex form", "Transformations"],
  },
  {
    code: "AI-A.REI.4b",
    course: "Algebra 1",
    domain: "Algebra",
    cluster: "Reasoning with Equations",
    standardText: "Solve quadratic equations by inspection, taking square roots, completing the square, the quadratic formula, and factoring.",
    keyTopics: ["Quadratic formula", "Factoring", "Square roots", "Completing the square"],
  },
  {
    code: "AI-A.REI.5",
    course: "Algebra 1",
    domain: "Algebra",
    cluster: "Reasoning with Equations",
    standardText: "Prove that, given a system of two equations in two variables, replacing one equation by the sum of that equation and a multiple of the other produces a system with the same solutions.",
    keyTopics: ["Systems of equations", "Elimination method", "Equivalence"],
  },
  {
    code: "AI-A.REI.6",
    course: "Algebra 1",
    domain: "Algebra",
    cluster: "Reasoning with Equations",
    standardText: "Solve systems of linear equations exactly and approximately, focusing on pairs of linear equations in two variables.",
    keyTopics: ["Systems of equations", "Substitution", "Elimination", "Graphing"],
  },
  {
    code: "AI-A.REI.10",
    course: "Algebra 1",
    domain: "Algebra",
    cluster: "Reasoning with Equations",
    standardText: "Understand that the graph of an equation in two variables is the set of all its solutions plotted in the coordinate plane.",
    keyTopics: ["Graphing equations", "Solution sets", "Coordinate plane"],
  },
  {
    code: "AI-A.REI.11",
    course: "Algebra 1",
    domain: "Algebra",
    cluster: "Reasoning with Equations",
    standardText: "Explain why the x-coordinates of the points where the graphs of the equations y = f(x) and y = g(x) intersect are the solutions of f(x) = g(x).",
    keyTopics: ["Intersection points", "Solutions", "Graphical interpretation"],
  },
  {
    code: "AI-A.REI.12",
    course: "Algebra 1",
    domain: "Algebra",
    cluster: "Reasoning with Equations",
    standardText: "Graph the solutions to a linear inequality in two variables as a half-plane.",
    keyTopics: ["Linear inequalities", "Graphing", "Half-planes", "Boundary lines"],
  },

  // Functions - Interpreting Functions
  {
    code: "AI-F.IF.1",
    course: "Algebra 1",
    domain: "Functions",
    cluster: "Interpreting Functions",
    standardText: "Understand that a function from one set to another set assigns to each element of the domain exactly one element of the range.",
    keyTopics: ["Functions", "Domain", "Range", "Function notation"],
  },
  {
    code: "AI-F.IF.2",
    course: "Algebra 1",
    domain: "Functions",
    cluster: "Interpreting Functions",
    standardText: "Use function notation, evaluate functions for inputs in their domains, and interpret statements that use function notation.",
    keyTopics: ["Function notation", "Evaluating functions", "f(x)"],
  },
  {
    code: "AI-F.IF.3",
    course: "Algebra 1",
    domain: "Functions",
    cluster: "Interpreting Functions",
    standardText: "Recognize that sequences are functions, sometimes defined recursively, whose domain is a subset of the integers.",
    keyTopics: ["Sequences", "Recursive formulas", "Arithmetic sequences", "Geometric sequences"],
  },
  {
    code: "AI-F.IF.4",
    course: "Algebra 1",
    domain: "Functions",
    cluster: "Interpreting Functions",
    standardText: "For a function that models a relationship between two quantities, interpret key features of graphs and tables.",
    keyTopics: ["Key features", "Intercepts", "Intervals", "Increasing/decreasing"],
  },
  {
    code: "AI-F.IF.5",
    course: "Algebra 1",
    domain: "Functions",
    cluster: "Interpreting Functions",
    standardText: "Relate the domain of a function to its graph and, where applicable, to the quantitative relationship it describes.",
    keyTopics: ["Domain restrictions", "Real-world context", "Practical domain"],
  },
  {
    code: "AI-F.IF.6",
    course: "Algebra 1",
    domain: "Functions",
    cluster: "Interpreting Functions",
    standardText: "Calculate and interpret the average rate of change of a function over a specified interval.",
    keyTopics: ["Rate of change", "Slope", "Average rate of change"],
  },
  {
    code: "AI-F.IF.7",
    course: "Algebra 1",
    domain: "Functions",
    cluster: "Interpreting Functions",
    standardText: "Graph functions expressed symbolically and show key features of the graph.",
    keyTopics: ["Graphing functions", "Key features", "Linear", "Quadratic", "Exponential"],
  },
  {
    code: "AI-F.IF.8",
    course: "Algebra 1",
    domain: "Functions",
    cluster: "Interpreting Functions",
    standardText: "Write a function defined by an expression in different but equivalent forms to reveal and explain different properties.",
    keyTopics: ["Equivalent forms", "Vertex form", "Standard form", "Factored form"],
  },
  {
    code: "AI-F.IF.9",
    course: "Algebra 1",
    domain: "Functions",
    cluster: "Interpreting Functions",
    standardText: "Compare properties of two functions each represented in a different way.",
    keyTopics: ["Comparing functions", "Multiple representations", "Tables", "Graphs", "Equations"],
  },

  // Functions - Building Functions
  {
    code: "AI-F.BF.1",
    course: "Algebra 1",
    domain: "Functions",
    cluster: "Building Functions",
    standardText: "Write a function that describes a relationship between two quantities.",
    keyTopics: ["Writing functions", "Modeling", "Combining functions"],
  },
  {
    code: "AI-F.BF.2",
    course: "Algebra 1",
    domain: "Functions",
    cluster: "Building Functions",
    standardText: "Write arithmetic and geometric sequences both recursively and with an explicit formula.",
    keyTopics: ["Arithmetic sequences", "Geometric sequences", "Explicit formulas", "Recursive formulas"],
  },
  {
    code: "AI-F.BF.3",
    course: "Algebra 1",
    domain: "Functions",
    cluster: "Building Functions",
    standardText: "Identify the effect on the graph of replacing f(x) by f(x) + k, k f(x), f(kx), and f(x + k).",
    keyTopics: ["Transformations", "Translations", "Reflections", "Stretches"],
  },

  // Functions - Linear and Exponential Models
  {
    code: "AI-F.LE.1",
    course: "Algebra 1",
    domain: "Functions",
    cluster: "Linear and Exponential Models",
    standardText: "Distinguish between situations that can be modeled with linear functions and with exponential functions.",
    keyTopics: ["Linear vs exponential", "Growth patterns", "Modeling"],
  },
  {
    code: "AI-F.LE.2",
    course: "Algebra 1",
    domain: "Functions",
    cluster: "Linear and Exponential Models",
    standardText: "Construct linear and exponential functions, including arithmetic and geometric sequences, given a graph, a description of a relationship, or two input-output pairs.",
    keyTopics: ["Constructing functions", "Linear functions", "Exponential functions"],
  },
  {
    code: "AI-F.LE.3",
    course: "Algebra 1",
    domain: "Functions",
    cluster: "Linear and Exponential Models",
    standardText: "Observe using graphs and tables that a quantity increasing exponentially eventually exceeds a quantity increasing linearly.",
    keyTopics: ["Exponential growth", "Linear growth", "Comparison"],
  },
  {
    code: "AI-F.LE.5",
    course: "Algebra 1",
    domain: "Functions",
    cluster: "Linear and Exponential Models",
    standardText: "Interpret the parameters in a linear or exponential function in terms of a context.",
    keyTopics: ["Parameters", "Slope", "Y-intercept", "Growth rate", "Initial value"],
  },

  // Statistics and Probability
  {
    code: "AI-S.ID.1",
    course: "Algebra 1",
    domain: "Statistics",
    cluster: "Interpreting Categorical Data",
    standardText: "Represent data with plots on the real number line (dot plots, histograms, and box plots).",
    keyTopics: ["Data representation", "Dot plots", "Histograms", "Box plots"],
  },
  {
    code: "AI-S.ID.2",
    course: "Algebra 1",
    domain: "Statistics",
    cluster: "Interpreting Categorical Data",
    standardText: "Use statistics appropriate to the shape of the data distribution to compare center and spread of two or more different data sets.",
    keyTopics: ["Mean", "Median", "Standard deviation", "IQR"],
  },
  {
    code: "AI-S.ID.3",
    course: "Algebra 1",
    domain: "Statistics",
    cluster: "Interpreting Categorical Data",
    standardText: "Interpret differences in shape, center, and spread in the context of the data sets.",
    keyTopics: ["Data interpretation", "Distribution shape", "Outliers"],
  },
  {
    code: "AI-S.ID.5",
    course: "Algebra 1",
    domain: "Statistics",
    cluster: "Interpreting Categorical Data",
    standardText: "Summarize categorical data for two categories in two-way frequency tables.",
    keyTopics: ["Two-way tables", "Frequency tables", "Relative frequency"],
  },
  {
    code: "AI-S.ID.6",
    course: "Algebra 1",
    domain: "Statistics",
    cluster: "Interpreting Categorical Data",
    standardText: "Represent data on two quantitative variables on a scatter plot, and describe how the variables are related.",
    keyTopics: ["Scatter plots", "Correlation", "Line of best fit"],
  },
  {
    code: "AI-S.ID.7",
    course: "Algebra 1",
    domain: "Statistics",
    cluster: "Interpreting Categorical Data",
    standardText: "Interpret the slope and the intercept of a linear model in the context of the data.",
    keyTopics: ["Slope interpretation", "Y-intercept interpretation", "Context"],
  },
  {
    code: "AI-S.ID.8",
    course: "Algebra 1",
    domain: "Statistics",
    cluster: "Interpreting Categorical Data",
    standardText: "Compute and interpret the correlation coefficient of a linear fit.",
    keyTopics: ["Correlation coefficient", "r-value", "Strength of relationship"],
  },
  {
    code: "AI-S.ID.9",
    course: "Algebra 1",
    domain: "Statistics",
    cluster: "Interpreting Categorical Data",
    standardText: "Distinguish between correlation and causation.",
    keyTopics: ["Correlation", "Causation", "Statistical reasoning"],
  },
];

// ============================================
// ALGEBRA II STANDARDS (Grades 11-12)
// ============================================
export const ALGEBRA_2_STANDARDS: AlgebraStandard[] = [
  // Complex Number System
  {
    code: "AII-N.CN.1",
    course: "Algebra 2",
    domain: "Complex Numbers",
    cluster: "Complex Number System",
    standardText: "Know there is a complex number i such that i² = −1, and every complex number has the form a + bi with a and b real.",
    keyTopics: ["Imaginary unit", "Complex numbers", "Real and imaginary parts"],
  },
  {
    code: "AII-N.CN.2",
    course: "Algebra 2",
    domain: "Complex Numbers",
    cluster: "Complex Number System",
    standardText: "Use the relation i² = −1 and the commutative, associative, and distributive properties to add, subtract, and multiply complex numbers.",
    keyTopics: ["Complex arithmetic", "Addition", "Subtraction", "Multiplication"],
  },
  {
    code: "AII-N.CN.7",
    course: "Algebra 2",
    domain: "Complex Numbers",
    cluster: "Complex Number System",
    standardText: "Solve quadratic equations with real coefficients that have complex solutions.",
    keyTopics: ["Complex solutions", "Quadratic equations", "Discriminant"],
  },

  // Seeing Structure in Expressions
  {
    code: "AII-A.SSE.2",
    course: "Algebra 2",
    domain: "Algebra",
    cluster: "Seeing Structure in Expressions",
    standardText: "Use the structure of an expression to identify ways to rewrite it.",
    keyTopics: ["Expression structure", "Factoring", "Equivalent expressions"],
  },
  {
    code: "AII-A.SSE.4",
    course: "Algebra 2",
    domain: "Algebra",
    cluster: "Seeing Structure in Expressions",
    standardText: "Derive the formula for the sum of a finite geometric series, and use the formula to solve problems.",
    keyTopics: ["Geometric series", "Series formula", "Sum of series"],
  },

  // Arithmetic with Polynomials and Rational Expressions
  {
    code: "AII-A.APR.1",
    course: "Algebra 2",
    domain: "Algebra",
    cluster: "Polynomial Operations",
    standardText: "Understand that polynomials form a system analogous to the integers, namely, they are closed under the operations of addition, subtraction, and multiplication.",
    keyTopics: ["Polynomial closure", "Polynomial operations"],
  },
  {
    code: "AII-A.APR.2",
    course: "Algebra 2",
    domain: "Algebra",
    cluster: "Polynomial Operations",
    standardText: "Know and apply the Remainder Theorem.",
    keyTopics: ["Remainder Theorem", "Polynomial division", "Synthetic division"],
  },
  {
    code: "AII-A.APR.3",
    course: "Algebra 2",
    domain: "Algebra",
    cluster: "Polynomial Operations",
    standardText: "Identify zeros of polynomials when suitable factorizations are available, and use the zeros to construct a rough graph of the function.",
    keyTopics: ["Zeros of polynomials", "Factoring", "Graphing polynomials"],
  },
  {
    code: "AII-A.APR.4",
    course: "Algebra 2",
    domain: "Algebra",
    cluster: "Polynomial Operations",
    standardText: "Prove polynomial identities and use them to describe numerical relationships.",
    keyTopics: ["Polynomial identities", "Binomial theorem", "Difference of cubes"],
  },
  {
    code: "AII-A.APR.6",
    course: "Algebra 2",
    domain: "Algebra",
    cluster: "Polynomial Operations",
    standardText: "Rewrite simple rational expressions in different forms.",
    keyTopics: ["Rational expressions", "Simplifying", "Long division"],
  },

  // Creating Equations
  {
    code: "AII-A.CED.1",
    course: "Algebra 2",
    domain: "Algebra",
    cluster: "Creating Equations",
    standardText: "Create equations and inequalities in one variable and use them to solve problems.",
    keyTopics: ["Polynomial equations", "Rational equations", "Radical equations"],
  },

  // Reasoning with Equations and Inequalities
  {
    code: "AII-A.REI.2",
    course: "Algebra 2",
    domain: "Algebra",
    cluster: "Reasoning with Equations",
    standardText: "Solve simple rational and radical equations in one variable, and give examples showing how extraneous solutions may arise.",
    keyTopics: ["Rational equations", "Radical equations", "Extraneous solutions"],
  },
  {
    code: "AII-A.REI.4",
    course: "Algebra 2",
    domain: "Algebra",
    cluster: "Reasoning with Equations",
    standardText: "Solve quadratic equations in one variable.",
    keyTopics: ["Complex solutions", "Quadratic formula", "Discriminant"],
  },
  {
    code: "AII-A.REI.7",
    course: "Algebra 2",
    domain: "Algebra",
    cluster: "Reasoning with Equations",
    standardText: "Solve a simple system consisting of a linear equation and a quadratic equation in two variables algebraically and graphically.",
    keyTopics: ["Systems with quadratics", "Linear-quadratic systems", "Intersection points"],
  },
  {
    code: "AII-A.REI.11",
    course: "Algebra 2",
    domain: "Algebra",
    cluster: "Reasoning with Equations",
    standardText: "Explain why the x-coordinates of the points where the graphs of equations y = f(x) and y = g(x) intersect are the solutions of the equation f(x) = g(x).",
    keyTopics: ["Graphical solutions", "Intersection points", "Function equations"],
  },

  // Interpreting Functions
  {
    code: "AII-F.IF.4",
    course: "Algebra 2",
    domain: "Functions",
    cluster: "Interpreting Functions",
    standardText: "For a function that models a relationship between two quantities, interpret key features of graphs and tables in terms of the quantities.",
    keyTopics: ["Key features", "Polynomial functions", "Rational functions", "Trigonometric functions"],
  },
  {
    code: "AII-F.IF.6",
    course: "Algebra 2",
    domain: "Functions",
    cluster: "Interpreting Functions",
    standardText: "Calculate and interpret the average rate of change of a function over a specified interval.",
    keyTopics: ["Average rate of change", "Secant lines", "Function analysis"],
  },
  {
    code: "AII-F.IF.7",
    course: "Algebra 2",
    domain: "Functions",
    cluster: "Interpreting Functions",
    standardText: "Graph functions expressed symbolically and show key features of the graph, by hand in simple cases and using technology for more complicated cases.",
    keyTopics: ["Graphing", "Polynomial graphs", "Rational graphs", "Logarithmic graphs"],
  },
  {
    code: "AII-F.IF.8",
    course: "Algebra 2",
    domain: "Functions",
    cluster: "Interpreting Functions",
    standardText: "Write a function defined by an expression in different but equivalent forms to reveal and explain different properties of the function.",
    keyTopics: ["Equivalent forms", "Function properties", "Transformations"],
  },
  {
    code: "AII-F.IF.9",
    course: "Algebra 2",
    domain: "Functions",
    cluster: "Interpreting Functions",
    standardText: "Compare properties of two functions each represented in a different way (algebraically, graphically, numerically in tables, or by verbal descriptions).",
    keyTopics: ["Function comparison", "Multiple representations"],
  },

  // Building Functions
  {
    code: "AII-F.BF.1",
    course: "Algebra 2",
    domain: "Functions",
    cluster: "Building Functions",
    standardText: "Write a function that describes a relationship between two quantities.",
    keyTopics: ["Function writing", "Composite functions", "Modeling"],
  },
  {
    code: "AII-F.BF.3",
    course: "Algebra 2",
    domain: "Functions",
    cluster: "Building Functions",
    standardText: "Identify the effect on the graph of replacing f(x) by f(x) + k, k f(x), f(kx), and f(x + k) for specific values of k.",
    keyTopics: ["Transformations", "Horizontal/vertical shifts", "Stretches/compressions"],
  },
  {
    code: "AII-F.BF.4",
    course: "Algebra 2",
    domain: "Functions",
    cluster: "Building Functions",
    standardText: "Find inverse functions.",
    keyTopics: ["Inverse functions", "One-to-one functions", "Horizontal line test"],
  },

  // Linear, Quadratic, and Exponential Models
  {
    code: "AII-F.LE.2",
    course: "Algebra 2",
    domain: "Functions",
    cluster: "Exponential Models",
    standardText: "Construct linear and exponential functions, including arithmetic and geometric sequences, given a graph, a description of a relationship, or two input-output pairs.",
    keyTopics: ["Exponential functions", "Growth/decay", "Modeling"],
  },
  {
    code: "AII-F.LE.4",
    course: "Algebra 2",
    domain: "Functions",
    cluster: "Exponential Models",
    standardText: "For exponential models, express as a logarithm the solution to ab^(ct) = d where a, c, and d are numbers and the base b is 2, 10, or e.",
    keyTopics: ["Logarithms", "Solving exponential equations", "Natural logarithm"],
  },

  // Trigonometric Functions
  {
    code: "AII-F.TF.1",
    course: "Algebra 2",
    domain: "Trigonometry",
    cluster: "Trigonometric Functions",
    standardText: "Understand radian measure of an angle as the length of the arc on the unit circle subtended by the angle.",
    keyTopics: ["Radian measure", "Unit circle", "Arc length"],
  },
  {
    code: "AII-F.TF.2",
    course: "Algebra 2",
    domain: "Trigonometry",
    cluster: "Trigonometric Functions",
    standardText: "Explain how the unit circle in the coordinate plane enables the extension of trigonometric functions to all real numbers.",
    keyTopics: ["Unit circle", "Sine", "Cosine", "Reference angles"],
  },
  {
    code: "AII-F.TF.5",
    course: "Algebra 2",
    domain: "Trigonometry",
    cluster: "Trigonometric Functions",
    standardText: "Choose trigonometric functions to model periodic phenomena with specified amplitude, frequency, and midline.",
    keyTopics: ["Periodic functions", "Amplitude", "Frequency", "Sinusoidal modeling"],
  },
  {
    code: "AII-F.TF.8",
    course: "Algebra 2",
    domain: "Trigonometry",
    cluster: "Trigonometric Identities",
    standardText: "Prove the Pythagorean identity sin²(θ) + cos²(θ) = 1 and use it to find sin(θ), cos(θ), or tan(θ) given sin(θ), cos(θ), or tan(θ) and the quadrant of the angle.",
    keyTopics: ["Pythagorean identity", "Trigonometric identities", "Quadrant analysis"],
  },

  // Statistics and Probability
  {
    code: "AII-S.ID.4",
    course: "Algebra 2",
    domain: "Statistics",
    cluster: "Interpreting Data",
    standardText: "Use the mean and standard deviation of a data set to fit it to a normal distribution and to estimate population percentages.",
    keyTopics: ["Normal distribution", "Mean", "Standard deviation", "Z-scores"],
  },
  {
    code: "AII-S.IC.1",
    course: "Algebra 2",
    domain: "Statistics",
    cluster: "Making Inferences",
    standardText: "Understand statistics as a process for making inferences about population parameters based on a random sample from that population.",
    keyTopics: ["Statistical inference", "Sampling", "Population parameters"],
  },
  {
    code: "AII-S.IC.2",
    course: "Algebra 2",
    domain: "Statistics",
    cluster: "Making Inferences",
    standardText: "Decide if a specified model is consistent with results from a given data-generating process.",
    keyTopics: ["Model validation", "Data analysis", "Statistical reasoning"],
  },
  {
    code: "AII-S.CP.1",
    course: "Algebra 2",
    domain: "Statistics",
    cluster: "Conditional Probability",
    standardText: "Describe events as subsets of a sample space using characteristics of the outcomes, or as unions, intersections, or complements of other events.",
    keyTopics: ["Sample space", "Events", "Set operations", "Probability"],
  },
];

// Combined standards for easy access
export const ALL_ALGEBRA_STANDARDS = [...ALGEBRA_1_STANDARDS, ...ALGEBRA_2_STANDARDS];

// Helper functions
export function getAlgebraStandardsByCourse(course: "Algebra 1" | "Algebra 2"): AlgebraStandard[] {
  return ALL_ALGEBRA_STANDARDS.filter(s => s.course === course);
}

export function getAlgebraStandardsByDomain(course: "Algebra 1" | "Algebra 2", domain: string): AlgebraStandard[] {
  return ALL_ALGEBRA_STANDARDS.filter(s => s.course === course && s.domain === domain);
}

export function getAlgebraDomainsForCourse(course: "Algebra 1" | "Algebra 2"): string[] {
  const standards = getAlgebraStandardsByCourse(course);
  return [...new Set(standards.map(s => s.domain))];
}

export function searchAlgebraStandards(query: string): AlgebraStandard[] {
  const lowerQuery = query.toLowerCase();
  return ALL_ALGEBRA_STANDARDS.filter(s => 
    s.code.toLowerCase().includes(lowerQuery) ||
    s.standardText.toLowerCase().includes(lowerQuery) ||
    s.keyTopics.some(t => t.toLowerCase().includes(lowerQuery))
  );
}
