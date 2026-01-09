// NYS Learning Standards for Grades 9-12
// Aligned with Next Generation Learning Standards

export interface NYSStandard {
  code: string;
  subject: string;
  gradeBand: string;
  domain: string;
  cluster?: string;
  standardText: string;
}

export const NYS_STANDARDS: NYSStandard[] = [
  // MATHEMATICS - Algebra I (Grade 9)
  {
    code: "AI-A.SSE.1",
    subject: "Mathematics",
    gradeBand: "9-10",
    domain: "Algebra",
    cluster: "Seeing Structure in Expressions",
    standardText: "Interpret expressions that represent a quantity in terms of its context."
  },
  {
    code: "AI-A.SSE.2",
    subject: "Mathematics",
    gradeBand: "9-10",
    domain: "Algebra",
    cluster: "Seeing Structure in Expressions",
    standardText: "Use the structure of an expression to identify ways to rewrite it."
  },
  {
    code: "AI-A.REI.1",
    subject: "Mathematics",
    gradeBand: "9-10",
    domain: "Algebra",
    cluster: "Reasoning with Equations",
    standardText: "Explain each step in solving a simple equation as following from the equality of numbers asserted at the previous step."
  },
  {
    code: "AI-A.REI.3",
    subject: "Mathematics",
    gradeBand: "9-10",
    domain: "Algebra",
    cluster: "Reasoning with Equations",
    standardText: "Solve linear equations and inequalities in one variable, including equations with coefficients represented by letters."
  },
  {
    code: "AI-A.REI.6",
    subject: "Mathematics",
    gradeBand: "9-10",
    domain: "Algebra",
    cluster: "Reasoning with Equations",
    standardText: "Solve systems of linear equations exactly and approximately, focusing on pairs of linear equations in two variables."
  },
  {
    code: "AI-F.IF.1",
    subject: "Mathematics",
    gradeBand: "9-10",
    domain: "Functions",
    cluster: "Interpreting Functions",
    standardText: "Understand that a function from one set to another set assigns to each element of the domain exactly one element of the range."
  },
  {
    code: "AI-F.IF.4",
    subject: "Mathematics",
    gradeBand: "9-10",
    domain: "Functions",
    cluster: "Interpreting Functions",
    standardText: "For a function that models a relationship between two quantities, interpret key features of graphs and tables."
  },
  {
    code: "AI-F.BF.1",
    subject: "Mathematics",
    gradeBand: "9-10",
    domain: "Functions",
    cluster: "Building Functions",
    standardText: "Write a function that describes a relationship between two quantities."
  },
  
  // MATHEMATICS - Geometry (Grades 9-10)
  {
    code: "GEO-G.CO.1",
    subject: "Mathematics",
    gradeBand: "9-10",
    domain: "Geometry",
    cluster: "Congruence",
    standardText: "Know precise definitions of angle, circle, perpendicular line, parallel line, and line segment."
  },
  {
    code: "GEO-G.CO.6",
    subject: "Mathematics",
    gradeBand: "9-10",
    domain: "Geometry",
    cluster: "Congruence",
    standardText: "Use geometric descriptions of rigid motions to transform figures and to predict the effect of a given rigid motion."
  },
  {
    code: "GEO-G.SRT.1",
    subject: "Mathematics",
    gradeBand: "9-10",
    domain: "Geometry",
    cluster: "Similarity",
    standardText: "Verify experimentally the properties of dilations given by a center and a scale factor."
  },
  {
    code: "GEO-G.SRT.4",
    subject: "Mathematics",
    gradeBand: "9-10",
    domain: "Geometry",
    cluster: "Similarity",
    standardText: "Prove theorems about triangles including the Pythagorean Theorem."
  },

  // MATHEMATICS - Algebra II (Grades 11-12)
  {
    code: "AII-N.CN.1",
    subject: "Mathematics",
    gradeBand: "11-12",
    domain: "Complex Numbers",
    cluster: "Complex Number System",
    standardText: "Know there is a complex number i such that i² = −1, and every complex number has the form a + bi."
  },
  {
    code: "AII-A.APR.1",
    subject: "Mathematics",
    gradeBand: "11-12",
    domain: "Algebra",
    cluster: "Polynomial Operations",
    standardText: "Understand that polynomials form a system analogous to the integers, namely, they are closed under certain operations."
  },
  {
    code: "AII-F.TF.1",
    subject: "Mathematics",
    gradeBand: "11-12",
    domain: "Trigonometry",
    cluster: "Trigonometric Functions",
    standardText: "Understand radian measure of an angle as the length of the arc on the unit circle subtended by the angle."
  },
  {
    code: "AII-F.TF.2",
    subject: "Mathematics",
    gradeBand: "11-12",
    domain: "Trigonometry",
    cluster: "Trigonometric Functions",
    standardText: "Explain how the unit circle in the coordinate plane enables the extension of trigonometric functions."
  },
  {
    code: "AII-S.ID.4",
    subject: "Mathematics",
    gradeBand: "11-12",
    domain: "Statistics",
    cluster: "Interpreting Data",
    standardText: "Use the mean and standard deviation of a data set to fit it to a normal distribution."
  },

  // ENGLISH LANGUAGE ARTS - Reading (Grades 9-10)
  {
    code: "RL.9-10.1",
    subject: "English Language Arts",
    gradeBand: "9-10",
    domain: "Reading Literature",
    cluster: "Key Ideas and Details",
    standardText: "Cite strong and thorough textual evidence to support analysis of what the text says explicitly as well as inferentially."
  },
  {
    code: "RL.9-10.2",
    subject: "English Language Arts",
    gradeBand: "9-10",
    domain: "Reading Literature",
    cluster: "Key Ideas and Details",
    standardText: "Determine a theme or central idea of a text and analyze its development over the course of the text."
  },
  {
    code: "RL.9-10.4",
    subject: "English Language Arts",
    gradeBand: "9-10",
    domain: "Reading Literature",
    cluster: "Craft and Structure",
    standardText: "Determine the meaning of words and phrases as they are used in the text, including figurative and connotative meanings."
  },
  {
    code: "RI.9-10.1",
    subject: "English Language Arts",
    gradeBand: "9-10",
    domain: "Reading Informational",
    cluster: "Key Ideas and Details",
    standardText: "Cite strong and thorough textual evidence to support analysis of what the text says explicitly as well as inferentially."
  },
  {
    code: "RI.9-10.6",
    subject: "English Language Arts",
    gradeBand: "9-10",
    domain: "Reading Informational",
    cluster: "Craft and Structure",
    standardText: "Determine an author's point of view or purpose in a text and analyze how an author uses rhetoric."
  },
  {
    code: "W.9-10.1",
    subject: "English Language Arts",
    gradeBand: "9-10",
    domain: "Writing",
    cluster: "Text Types and Purposes",
    standardText: "Write arguments to support claims in an analysis of substantive topics or texts using valid reasoning and relevant evidence."
  },
  {
    code: "W.9-10.2",
    subject: "English Language Arts",
    gradeBand: "9-10",
    domain: "Writing",
    cluster: "Text Types and Purposes",
    standardText: "Write informative/explanatory texts to examine and convey complex ideas, concepts, and information."
  },

  // ENGLISH LANGUAGE ARTS - Reading (Grades 11-12)
  {
    code: "RL.11-12.1",
    subject: "English Language Arts",
    gradeBand: "11-12",
    domain: "Reading Literature",
    cluster: "Key Ideas and Details",
    standardText: "Cite strong and thorough textual evidence to support analysis, including determining where the text leaves matters uncertain."
  },
  {
    code: "RL.11-12.3",
    subject: "English Language Arts",
    gradeBand: "11-12",
    domain: "Reading Literature",
    cluster: "Key Ideas and Details",
    standardText: "Analyze the impact of the author's choices regarding how to develop and relate elements of a story or drama."
  },
  {
    code: "RI.11-12.7",
    subject: "English Language Arts",
    gradeBand: "11-12",
    domain: "Reading Informational",
    cluster: "Integration of Knowledge",
    standardText: "Integrate and evaluate multiple sources of information presented in different media or formats."
  },
  {
    code: "W.11-12.1",
    subject: "English Language Arts",
    gradeBand: "11-12",
    domain: "Writing",
    cluster: "Text Types and Purposes",
    standardText: "Write arguments to support claims in an analysis of substantive topics, using valid reasoning and sufficient evidence."
  },

  // SCIENCE - Living Environment (Biology) (Grades 9-10)
  {
    code: "LE.1.1",
    subject: "Science",
    gradeBand: "9-10",
    domain: "Living Environment",
    cluster: "Unity and Diversity",
    standardText: "Explain how the structure and replication of genetic material result in offspring that resemble their parents."
  },
  {
    code: "LE.1.2",
    subject: "Science",
    gradeBand: "9-10",
    domain: "Living Environment",
    cluster: "Unity and Diversity",
    standardText: "Describe how hereditary information is contained in genes, located in chromosomes of each cell."
  },
  {
    code: "LE.2.1",
    subject: "Science",
    gradeBand: "9-10",
    domain: "Living Environment",
    cluster: "Homeostasis",
    standardText: "Explain how organisms maintain a dynamic equilibrium that sustains life."
  },
  {
    code: "LE.3.1",
    subject: "Science",
    gradeBand: "9-10",
    domain: "Living Environment",
    cluster: "Evolution",
    standardText: "Explain the mechanisms and patterns of evolution."
  },
  {
    code: "LE.5.1",
    subject: "Science",
    gradeBand: "9-10",
    domain: "Living Environment",
    cluster: "Ecology",
    standardText: "Explain the flow of energy and cycling of matter through ecosystems."
  },

  // SCIENCE - Chemistry (Grades 10-11)
  {
    code: "CHEM.1.1",
    subject: "Science",
    gradeBand: "11-12",
    domain: "Chemistry",
    cluster: "Atomic Structure",
    standardText: "Use the periodic table to predict properties of elements based on patterns of electrons."
  },
  {
    code: "CHEM.2.1",
    subject: "Science",
    gradeBand: "11-12",
    domain: "Chemistry",
    cluster: "Chemical Bonding",
    standardText: "Explain how atoms combine to form compounds through ionic and covalent bonding."
  },
  {
    code: "CHEM.3.1",
    subject: "Science",
    gradeBand: "11-12",
    domain: "Chemistry",
    cluster: "Chemical Reactions",
    standardText: "Balance chemical equations and predict products of chemical reactions."
  },
  {
    code: "CHEM.4.1",
    subject: "Science",
    gradeBand: "11-12",
    domain: "Chemistry",
    cluster: "Stoichiometry",
    standardText: "Use mole ratios to calculate quantities in chemical reactions."
  },

  // SCIENCE - Physics (Grades 11-12)
  {
    code: "PHYS.1.1",
    subject: "Science",
    gradeBand: "11-12",
    domain: "Physics",
    cluster: "Mechanics",
    standardText: "Analyze motion using kinematics equations and Newton's laws."
  },
  {
    code: "PHYS.2.1",
    subject: "Science",
    gradeBand: "11-12",
    domain: "Physics",
    cluster: "Energy",
    standardText: "Apply conservation of energy and momentum to solve problems."
  },
  {
    code: "PHYS.3.1",
    subject: "Science",
    gradeBand: "11-12",
    domain: "Physics",
    cluster: "Electricity",
    standardText: "Analyze circuits using Ohm's law and Kirchhoff's rules."
  },

  // SOCIAL STUDIES - US History (Grades 11)
  {
    code: "USH.11.1",
    subject: "Social Studies",
    gradeBand: "11-12",
    domain: "US History",
    cluster: "Constitutional Foundations",
    standardText: "Analyze the development and impact of the United States Constitution and Bill of Rights."
  },
  {
    code: "USH.11.2",
    subject: "Social Studies",
    gradeBand: "11-12",
    domain: "US History",
    cluster: "Industrialization",
    standardText: "Examine the causes and effects of industrialization and urbanization in the United States."
  },
  {
    code: "USH.11.3",
    subject: "Social Studies",
    gradeBand: "11-12",
    domain: "US History",
    cluster: "20th Century",
    standardText: "Analyze the United States' role in global conflicts and its impact on domestic policy."
  },

  // SOCIAL STUDIES - Global History (Grades 9-10)
  {
    code: "GH.9-10.1",
    subject: "Social Studies",
    gradeBand: "9-10",
    domain: "Global History",
    cluster: "Ancient Civilizations",
    standardText: "Compare and contrast the development of early civilizations across different regions."
  },
  {
    code: "GH.9-10.2",
    subject: "Social Studies",
    gradeBand: "9-10",
    domain: "Global History",
    cluster: "Classical Era",
    standardText: "Analyze the political, economic, and cultural achievements of classical civilizations."
  },
  {
    code: "GH.9-10.3",
    subject: "Social Studies",
    gradeBand: "9-10",
    domain: "Global History",
    cluster: "World Religions",
    standardText: "Examine the origins, beliefs, and spread of major world religions."
  },

  // SOCIAL STUDIES - Economics (Grades 12)
  {
    code: "ECON.12.1",
    subject: "Social Studies",
    gradeBand: "11-12",
    domain: "Economics",
    cluster: "Microeconomics",
    standardText: "Analyze how supply and demand determine prices in a market economy."
  },
  {
    code: "ECON.12.2",
    subject: "Social Studies",
    gradeBand: "11-12",
    domain: "Economics",
    cluster: "Macroeconomics",
    standardText: "Explain how fiscal and monetary policies influence economic performance."
  },
  {
    code: "ECON.12.3",
    subject: "Social Studies",
    gradeBand: "11-12",
    domain: "Economics",
    cluster: "Personal Finance",
    standardText: "Apply economic principles to personal financial decision-making."
  },
];

export const GRADE_BANDS = [
  { value: "K-2", label: "Grades K-2 (Elementary)" },
  { value: "3-5", label: "Grades 3-5 (Elementary)" },
  { value: "6-8", label: "Grades 6-8 (Middle School)" },
  { value: "9-10", label: "Grades 9-10 (High School)" },
  { value: "11-12", label: "Grades 11-12 (High School)" },
];

export const SUBJECTS = [
  "Mathematics",
  "English Language Arts", 
  "Science",
  "Social Studies",
];

export function getStandardsBySubjectAndGrade(subject: string, gradeBand: string): NYSStandard[] {
  return NYS_STANDARDS.filter(
    s => s.subject === subject && s.gradeBand === gradeBand
  );
}

export function getDomainsForSubject(subject: string, gradeBand: string): string[] {
  const standards = getStandardsBySubjectAndGrade(subject, gradeBand);
  return [...new Set(standards.map(s => s.domain))];
}
