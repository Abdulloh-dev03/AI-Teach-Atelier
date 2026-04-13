export type GeneratedTestCase = {
  input: string;
  expected: string;
  isHidden: boolean;
};

export type GeneratedProblem = {
  title: string;
  slug: string;
  description: string;
  /** Hidden reference solution — never exposed to users, stored internally only. */
  referenceSolution: string;
  testCases: GeneratedTestCase[];
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

export type AIFeedbackResult = {
  analysis: string;
  suggestions: string;
  complexity: string;
};

export type MessageContent =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type ChatMessageType = {
  role: "user" | "assistant";
  content: MessageContent[];
};
