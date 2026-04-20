/**
 * Extract and parse JSON from an AI response that may include code fences or prose.
 */
export function extractJson<T>(raw: string): T {
  let jsonText = raw.trim();

  // Strip markdown code fences if the model wraps the response
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  // If the response has text before the JSON, try to extract just the JSON
  const jsonStart = jsonText.indexOf('{');
  const jsonEnd = jsonText.lastIndexOf('}');
  if (jsonStart >= 0 && jsonEnd > jsonStart) {
    jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
  }

  try {
    return JSON.parse(jsonText) as T;
  } catch (e) {
    const preview = jsonText.substring(0, 200);
    throw new Error(
      `Failed to parse AI response as JSON: ${e instanceof Error ? e.message : 'unknown error'}. ` +
      `Response preview: ${preview}...`
    );
  }
}
