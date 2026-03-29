export type GeneratedTestCase = {
  input: string;
  expected: string;
  isHidden: boolean;
};

export type GeneratedProblem = {
  title: string;
  slug: string;
  description: string;
  testCases: GeneratedTestCase[];
};

export type AIFeedbackResult = {
  analysis: string;
  suggestions: string;
  complexity: string;
};

export type GenerateProblemParams = {
  language: string;
  difficulty: string;
};

export type FeedbackParams = {
  code: string;
  language: string;
  problemDescription: string;
  passed: number;
  total: number;
};
