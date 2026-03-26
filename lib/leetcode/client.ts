const GRAPHQL_URL = "https://leetcode.com/graphql";

async function graphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Referer": "https://leetcode.com",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`LeetCode GraphQL error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json() as { data?: T; errors?: Array<{ message: string }> };

  if (json.errors?.length) {
    throw new Error(`LeetCode GraphQL errors: ${json.errors.map((e) => e.message).join(", ")}`);
  }

  if (!json.data) {
    throw new Error("LeetCode GraphQL: no data in response");
  }

  return json.data;
}

export type LCListProblem = {
  acRate: number;
  difficulty: string;
  frontendQuestionId: string;
  paidOnly: boolean;
  title: string;
  titleSlug: string;
  topicTags: Array<{ name: string; slug: string }>;
};

export type LCDetailProblem = {
  questionId: string;
  questionFrontendId: string;
  title: string;
  titleSlug: string;
  content: string;
  difficulty: string;
  topicTags: Array<{ name: string; slug: string }>;
  codeSnippets: Array<{ lang: string; langSlug: string; code: string }>;
  sampleTestCase: string;
  exampleTestcases: string;
  constraints: string;
  isPaidOnly: boolean;
  acRate: number;
};

export async function fetchProblemList(skip: number, limit = 100): Promise<{ total: number; questions: LCListProblem[] }> {
  const { PROBLEM_LIST_QUERY } = await import("./queries");
  const data = await graphql<{ problemsetQuestionList: { total: number; questions: LCListProblem[] } }>(
    PROBLEM_LIST_QUERY,
    { categorySlug: "", limit, skip, filters: {} }
  );
  return data.problemsetQuestionList;
}

export async function fetchProblemDetail(slug: string): Promise<LCDetailProblem | null> {
  const { PROBLEM_DETAIL_QUERY } = await import("./queries");
  try {
    const data = await graphql<{ question: LCDetailProblem | null }>(
      PROBLEM_DETAIL_QUERY,
      { titleSlug: slug }
    );
    return data.question;
  } catch {
    return null;
  }
}
