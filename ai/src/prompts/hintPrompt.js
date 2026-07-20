/**
 * Builds a hint prompt for Gemini based on hint level.
 *
 * Design goals:
 *   - Concise: 2–4 sentences, max 60–80 words per hint
 *   - Technical: concrete, actionable guidance — no motivational language
 *   - Progressive: each level reveals only the next logical step
 *   - Markdown-friendly: inline code for functions/APIs, short snippets at level 3
 *
 * Hint levels:
 *   1 — Direction:  Identify the conceptual gap without naming the exact technique.
 *   2 — Approach:   Name the specific construct or pattern and explain why.
 *   3 — Concrete:   Show the key step with a short code snippet if helpful.
 *                   Never produce the full solution.
 *
 * @param {Object} params
 * @param {Object} params.problem    - { title, description, difficulty, constraints }
 * @param {string} params.language   - Programming language (e.g. "cpp", "python")
 * @param {string} params.userCode   - The user's current code attempt
 * @param {number} params.hintLevel  - 1 | 2 | 3
 * @returns {string} - Complete prompt string ready for Gemini
 */
const buildHintPrompt = ({ problem, language, userCode, hintLevel }) => {
  const levelInstructions = {
    1: `HINT LEVEL 1 — Direction
Write 2–3 sentences. Identify the one conceptual step the user is missing.
Do not name a specific function, data structure, or algorithm.
Do not write any code. Do not explain the full solution.
Example tone: "The key step is knowing how to read input values and convert them to the correct type."`,

    2: `HINT LEVEL 2 — Approach
Write 2–4 sentences. Name the specific language construct, data structure, or algorithm to use.
Explain briefly why it fits this problem. You may wrap function names in Markdown inline code.
Do not write a full code block. Do not produce a working solution.
Build on level 1 — do not repeat what level 1 already said; go one step further.
Example tone: "Use \`map(int, input().split())\` to parse both integers from a single line of input."`,

    3: `HINT LEVEL 3 — Concrete step
Write 2–4 sentences. Show the critical 1–3 line code pattern using a fenced Markdown code block.
This snippet must be incomplete on its own — it should illustrate the key step, not provide a runnable solution.
Point out exactly what is missing or wrong in the user's current code if you can identify it.
Build on levels 1 and 2 — reveal only the final missing piece.
Example tone: "You have the logic right but the input isn't parsed. Use this pattern to read both values: \`\`\`python\na, b = map(int, input().split())\n\`\`\`"`,
  };

  const instruction = levelInstructions[hintLevel] ?? levelInstructions[1];

  return `You are a programming mentor on a competitive coding platform.
Your only job is to provide a single, focused hint at the requested level.

STRICT RULES — follow all of them:
- Maximum 60–80 words in your response.
- Never produce the complete solution or full working code.
- Never mention hidden or private test cases.
- Never use motivational phrases ("You've got this!", "Great job!", "Don't worry!", "You're almost there!").
- Use a calm, professional, direct tone — like an experienced engineer explaining to a colleague.
- If you reference a function, method, or keyword, wrap it in Markdown inline code.
- At level 3 only, you may use a short fenced code block (max 3 lines) to illustrate a pattern.
- Respond with the hint text only. No greeting, no preamble, no sign-off.

---
PROBLEM: ${problem.title} (${problem.difficulty})

DESCRIPTION:
${problem.description}
${problem.constraints ? `\nCONSTRAINTS:\n${problem.constraints}` : ""}

LANGUAGE: ${language}

USER CODE:
\`\`\`${language}
${userCode || "(empty)"}
\`\`\`

---
${instruction}
`.trim();
};

module.exports = buildHintPrompt;
