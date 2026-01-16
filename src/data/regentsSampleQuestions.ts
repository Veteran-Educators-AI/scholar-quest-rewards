// Sample Regents Exam Questions organized by subject and standard
// These are modeled after real NY Regents exam questions

import { ALGEBRA_1_QUESTIONS, ALGEBRA_2_QUESTIONS, type AlgebraQuestion } from "./algebraQuestions";

export interface RegentsQuestion {
  id: string;
  standardCode: string;
  subject: string;
  examType: string; // e.g., "Algebra I", "Living Environment", "US History"
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: number; // 1-3
  pointValue: number;
  hint?: string;
  topic?: string;
  course?: string;
}

// Convert AlgebraQuestion to RegentsQuestion format
function convertAlgebraQuestion(q: AlgebraQuestion, examType: string): RegentsQuestion {
  return {
    id: q.id,
    standardCode: q.standardCode,
    subject: "Mathematics",
    examType,
    prompt: q.prompt,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    difficulty: q.difficulty,
    pointValue: q.pointValue,
    hint: q.hint,
    topic: q.topic,
    course: q.course,
  };
}

export const REGENTS_EXAMS = [
  { id: "algebra1", name: "Algebra I", subject: "Mathematics", gradeBand: "9-10", hasAITutor: true },
  { id: "geometry", name: "Geometry", subject: "Mathematics", gradeBand: "9-10", hasAITutor: false },
  { id: "algebra2", name: "Algebra II", subject: "Mathematics", gradeBand: "11-12", hasAITutor: true },
  { id: "living_env", name: "Living Environment", subject: "Science", gradeBand: "9-10", hasAITutor: false },
  { id: "chemistry", name: "Chemistry", subject: "Science", gradeBand: "11-12", hasAITutor: false },
  { id: "physics", name: "Physics", subject: "Science", gradeBand: "11-12", hasAITutor: false },
  { id: "us_history", name: "US History & Government", subject: "Social Studies", gradeBand: "11-12", hasAITutor: false },
  { id: "global_history", name: "Global History & Geography", subject: "Social Studies", gradeBand: "9-10", hasAITutor: false },
  { id: "ela", name: "English Language Arts", subject: "English Language Arts", gradeBand: "11-12", hasAITutor: false },
];

// Convert Algebra questions to Regents format
const ALGEBRA_1_REGENTS: RegentsQuestion[] = ALGEBRA_1_QUESTIONS.map(q => convertAlgebraQuestion(q, "algebra1"));
const ALGEBRA_2_REGENTS: RegentsQuestion[] = ALGEBRA_2_QUESTIONS.map(q => convertAlgebraQuestion(q, "algebra2"));

export const REGENTS_QUESTIONS: RegentsQuestion[] = [
  // Include all converted Algebra 1 and Algebra 2 questions
  ...ALGEBRA_1_REGENTS,
  ...ALGEBRA_2_REGENTS,
  
  // ADDITIONAL ALGEBRA I (legacy)
  {
    id: "alg1-001",
    standardCode: "AI-A.SSE.1",
    subject: "Mathematics",
    examType: "algebra1",
    prompt: "Which expression is equivalent to 2(3x + 4) - 5?",
    options: ["6x + 3", "6x + 8", "6x - 1", "5x + 3"],
    correctAnswer: "6x + 3",
    explanation: "Distribute: 2(3x) + 2(4) - 5 = 6x + 8 - 5 = 6x + 3",
    difficulty: 1,
    pointValue: 2,
  },
  {
    id: "alg1-002",
    standardCode: "AI-A.REI.3",
    subject: "Mathematics",
    examType: "algebra1",
    prompt: "Solve for x: 3x - 7 = 14",
    options: ["x = 7", "x = 3", "x = 21", "x = -7"],
    correctAnswer: "x = 7",
    explanation: "Add 7 to both sides: 3x = 21. Divide by 3: x = 7",
    difficulty: 1,
    pointValue: 2,
  },
  {
    id: "alg1-003",
    standardCode: "AI-A.REI.6",
    subject: "Mathematics",
    examType: "algebra1",
    prompt: "What is the solution to the system of equations: y = 2x + 1 and y = -x + 7?",
    options: ["(2, 5)", "(3, 4)", "(1, 3)", "(4, 3)"],
    correctAnswer: "(2, 5)",
    explanation: "Set equations equal: 2x + 1 = -x + 7. Solve: 3x = 6, x = 2. Substitute: y = 2(2) + 1 = 5",
    difficulty: 2,
    pointValue: 2,
  },
  {
    id: "alg1-004",
    standardCode: "AI-F.IF.1",
    subject: "Mathematics",
    examType: "algebra1",
    prompt: "If f(x) = 3x² - 2x + 1, what is f(2)?",
    options: ["9", "13", "5", "7"],
    correctAnswer: "9",
    explanation: "f(2) = 3(2)² - 2(2) + 1 = 3(4) - 4 + 1 = 12 - 4 + 1 = 9",
    difficulty: 2,
    pointValue: 2,
  },
  {
    id: "alg1-005",
    standardCode: "AI-A.SSE.2",
    subject: "Mathematics",
    examType: "algebra1",
    prompt: "Factor completely: x² - 9",
    options: ["(x - 3)(x + 3)", "(x - 9)(x + 1)", "(x - 3)²", "(x + 3)²"],
    correctAnswer: "(x - 3)(x + 3)",
    explanation: "This is a difference of squares: a² - b² = (a-b)(a+b), so x² - 9 = (x-3)(x+3)",
    difficulty: 2,
    pointValue: 2,
  },

  // GEOMETRY
  {
    id: "geo-001",
    standardCode: "GEO-G.CO.1",
    subject: "Mathematics",
    examType: "geometry",
    prompt: "Two lines are perpendicular. If one line has a slope of 2, what is the slope of the other line?",
    options: ["-1/2", "-2", "1/2", "2"],
    correctAnswer: "-1/2",
    explanation: "Perpendicular lines have slopes that are negative reciprocals. The negative reciprocal of 2 is -1/2.",
    difficulty: 1,
    pointValue: 2,
  },
  {
    id: "geo-002",
    standardCode: "GEO-G.SRT.4",
    subject: "Mathematics",
    examType: "geometry",
    prompt: "In a right triangle, if the legs are 3 and 4, what is the length of the hypotenuse?",
    options: ["5", "7", "12", "25"],
    correctAnswer: "5",
    explanation: "Using the Pythagorean Theorem: c² = a² + b² = 9 + 16 = 25, so c = 5",
    difficulty: 1,
    pointValue: 2,
  },
  {
    id: "geo-003",
    standardCode: "GEO-G.SRT.1",
    subject: "Mathematics",
    examType: "geometry",
    prompt: "A figure is dilated by a scale factor of 3. If the original area is 12 square units, what is the area of the dilated figure?",
    options: ["108 square units", "36 square units", "15 square units", "4 square units"],
    correctAnswer: "108 square units",
    explanation: "When dilating, area changes by the square of the scale factor: 12 × 3² = 12 × 9 = 108",
    difficulty: 3,
    pointValue: 2,
  },

  // LIVING ENVIRONMENT
  {
    id: "le-001",
    standardCode: "LE.1.1",
    subject: "Science",
    examType: "living_env",
    prompt: "Which molecule contains the genetic information that determines the traits of an organism?",
    options: ["DNA", "ATP", "Glucose", "Protein"],
    correctAnswer: "DNA",
    explanation: "DNA (deoxyribonucleic acid) contains the genetic code that determines an organism's traits.",
    difficulty: 1,
    pointValue: 1,
  },
  {
    id: "le-002",
    standardCode: "LE.1.2",
    subject: "Science",
    examType: "living_env",
    prompt: "During mitosis, chromosomes are replicated and distributed to ensure that each daughter cell receives:",
    options: [
      "the same genetic information as the parent cell",
      "half the genetic information of the parent cell",
      "twice the genetic information of the parent cell",
      "different genetic information than the parent cell"
    ],
    correctAnswer: "the same genetic information as the parent cell",
    explanation: "Mitosis produces two identical daughter cells with the same genetic information as the parent cell.",
    difficulty: 2,
    pointValue: 1,
  },
  {
    id: "le-003",
    standardCode: "LE.2.1",
    subject: "Science",
    examType: "living_env",
    prompt: "Which organ system is primarily responsible for maintaining homeostasis through hormone regulation?",
    options: ["Endocrine system", "Skeletal system", "Muscular system", "Integumentary system"],
    correctAnswer: "Endocrine system",
    explanation: "The endocrine system secretes hormones that regulate body functions to maintain homeostasis.",
    difficulty: 1,
    pointValue: 1,
  },
  {
    id: "le-004",
    standardCode: "LE.3.1",
    subject: "Science",
    examType: "living_env",
    prompt: "Natural selection results in:",
    options: [
      "organisms better adapted to their environment",
      "all organisms becoming identical",
      "organisms with harmful traits surviving",
      "genetic information remaining unchanged"
    ],
    correctAnswer: "organisms better adapted to their environment",
    explanation: "Natural selection favors organisms with traits that help them survive and reproduce in their environment.",
    difficulty: 2,
    pointValue: 1,
  },
  {
    id: "le-005",
    standardCode: "LE.5.1",
    subject: "Science",
    examType: "living_env",
    prompt: "In an ecosystem, which organisms convert solar energy into chemical energy?",
    options: ["Producers", "Consumers", "Decomposers", "Scavengers"],
    correctAnswer: "Producers",
    explanation: "Producers (like plants) use photosynthesis to convert solar energy into chemical energy stored in glucose.",
    difficulty: 1,
    pointValue: 1,
  },

  // CHEMISTRY
  {
    id: "chem-001",
    standardCode: "CHEM.1.1",
    subject: "Science",
    examType: "chemistry",
    prompt: "Which element has the electron configuration 1s² 2s² 2p⁶ 3s¹?",
    options: ["Sodium (Na)", "Magnesium (Mg)", "Chlorine (Cl)", "Neon (Ne)"],
    correctAnswer: "Sodium (Na)",
    explanation: "Sodium has 11 electrons arranged as 1s² 2s² 2p⁶ 3s¹, giving it one valence electron.",
    difficulty: 2,
    pointValue: 1,
  },
  {
    id: "chem-002",
    standardCode: "CHEM.2.1",
    subject: "Science",
    examType: "chemistry",
    prompt: "What type of bond is formed when electrons are shared between two atoms?",
    options: ["Covalent bond", "Ionic bond", "Metallic bond", "Hydrogen bond"],
    correctAnswer: "Covalent bond",
    explanation: "Covalent bonds form when atoms share electrons to achieve stable electron configurations.",
    difficulty: 1,
    pointValue: 1,
  },
  {
    id: "chem-003",
    standardCode: "CHEM.3.1",
    subject: "Science",
    examType: "chemistry",
    prompt: "When balancing the equation __Fe + __O₂ → __Fe₂O₃, the coefficients are:",
    options: ["4, 3, 2", "2, 3, 1", "1, 1, 1", "2, 1, 2"],
    correctAnswer: "4, 3, 2",
    explanation: "4Fe + 3O₂ → 2Fe₂O₃ balances with 4 Fe atoms and 6 O atoms on each side.",
    difficulty: 2,
    pointValue: 1,
  },

  // US HISTORY
  {
    id: "ush-001",
    standardCode: "USH.11.1",
    subject: "Social Studies",
    examType: "us_history",
    prompt: "The system of checks and balances was included in the Constitution to:",
    options: [
      "prevent any branch from becoming too powerful",
      "give the President absolute authority",
      "eliminate the need for a legislative branch",
      "ensure rapid passage of all laws"
    ],
    correctAnswer: "prevent any branch from becoming too powerful",
    explanation: "Checks and balances allow each branch to limit the powers of the other branches.",
    difficulty: 1,
    pointValue: 1,
  },
  {
    id: "ush-002",
    standardCode: "USH.11.2",
    subject: "Social Studies",
    examType: "us_history",
    prompt: "The rapid industrialization of the late 1800s led to:",
    options: [
      "growth of cities and immigration",
      "decline in factory production",
      "return to agricultural economy",
      "decrease in railroad construction"
    ],
    correctAnswer: "growth of cities and immigration",
    explanation: "Industrialization created factory jobs that attracted workers to cities, including many immigrants.",
    difficulty: 1,
    pointValue: 1,
  },
  {
    id: "ush-003",
    standardCode: "USH.11.3",
    subject: "Social Studies",
    examType: "us_history",
    prompt: "Which amendment to the Constitution granted women the right to vote?",
    options: ["19th Amendment", "15th Amendment", "13th Amendment", "21st Amendment"],
    correctAnswer: "19th Amendment",
    explanation: "The 19th Amendment, ratified in 1920, prohibited denying the right to vote based on sex.",
    difficulty: 1,
    pointValue: 1,
  },

  // GLOBAL HISTORY
  {
    id: "gh-001",
    standardCode: "GH.9-10.1",
    subject: "Social Studies",
    examType: "global_history",
    prompt: "Which geographic feature most influenced the development of ancient Egyptian civilization?",
    options: ["Nile River", "Sahara Desert", "Mediterranean Sea", "Red Sea"],
    correctAnswer: "Nile River",
    explanation: "The Nile provided water, fertile soil through annual flooding, and transportation for ancient Egypt.",
    difficulty: 1,
    pointValue: 1,
  },
  {
    id: "gh-002",
    standardCode: "GH.9-10.3",
    subject: "Social Studies",
    examType: "global_history",
    prompt: "Buddhism and Hinduism both originated in:",
    options: ["South Asia (India)", "East Asia (China)", "Middle East", "Mediterranean region"],
    correctAnswer: "South Asia (India)",
    explanation: "Both Hinduism and Buddhism developed in ancient India, with Buddhism spreading throughout Asia.",
    difficulty: 1,
    pointValue: 1,
  },

  // ELA
  {
    id: "ela-001",
    standardCode: "RL.11-12.1",
    subject: "English Language Arts",
    examType: "ela",
    prompt: "When analyzing a text, 'textual evidence' refers to:",
    options: [
      "direct quotes or specific details from the text",
      "the reader's personal opinions",
      "information from other sources",
      "the author's biography"
    ],
    correctAnswer: "direct quotes or specific details from the text",
    explanation: "Textual evidence consists of specific quotes, details, or references from the text being analyzed.",
    difficulty: 1,
    pointValue: 1,
  },
  {
    id: "ela-002",
    standardCode: "RL.11-12.3",
    subject: "English Language Arts",
    examType: "ela",
    prompt: "An author's use of flashback in a narrative primarily serves to:",
    options: [
      "provide background information and context",
      "describe the story's setting",
      "introduce the main conflict",
      "predict future events"
    ],
    correctAnswer: "provide background information and context",
    explanation: "Flashbacks interrupt the chronological sequence to reveal past events that inform the present narrative.",
    difficulty: 2,
    pointValue: 1,
  },
];

export function getQuestionsByExam(examType: string): RegentsQuestion[] {
  return REGENTS_QUESTIONS.filter(q => q.examType === examType);
}

export function getQuestionsByStandard(standardCode: string): RegentsQuestion[] {
  return REGENTS_QUESTIONS.filter(q => q.standardCode === standardCode);
}

export function getRandomQuestionsForExam(examType: string, count: number): RegentsQuestion[] {
  const questions = getQuestionsByExam(examType);
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
