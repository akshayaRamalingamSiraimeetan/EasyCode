const { GoogleGenAI } = require("@google/genai");

// Initialise once — reused across all requests
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Sleep helper for retry backoff.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sends a prompt to Gemini and returns the text response.
 * Retries up to 3 times on transient 503 (service unavailable) errors
 * with exponential backoff (1s → 2s → 4s).
 *
 * All Gemini SDK usage is intentionally isolated to this file.
 * No other part of the project should import @google/genai.
 *
 * @param {string} prompt - The fully built prompt string
 * @returns {Promise<string>} - The model's text response
 */
const generate = async (prompt) => {
  const modelName = process.env.MODEL || "gemini-flash-latest";

  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt <= MAX_RETRIES) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
      });

      return response.text;
    } catch (err) {
      const isRetryable =
        err.message?.includes("503") ||
        err.message?.includes("UNAVAILABLE") ||
        err.message?.includes("high demand") ||
        err.message?.includes("overloaded");

      if (isRetryable && attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.warn(
          `[GeminiService] Attempt ${attempt + 1} failed (503). Retrying in ${delay}ms…`
        );
        await sleep(delay);
        attempt++;
        continue;
      }

      // Non-retryable or exhausted retries — rethrow
      throw err;
    }
  }
};

module.exports = { generate };
