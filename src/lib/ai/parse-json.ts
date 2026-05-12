/**
 * Extract and parse JSON from an AI response that may include code fences or prose.
 */
export function extractJson<T>(raw: string): T {
  let jsonText = raw.trim();

  // Strip markdown code fences if the model wraps the response
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  // Walk the string to find the first balanced { ... } object, ignoring
  // braces inside strings. This is more robust than indexOf/lastIndexOf,
  // which fails when the model emits trailing prose or a second block.
  const jsonStart = jsonText.indexOf('{');
  if (jsonStart >= 0) {
    let depth = 0;
    let inString = false;
    let escape = false;
    let end = -1;
    for (let i = jsonStart; i < jsonText.length; i++) {
      const ch = jsonText[i];
      if (inString) {
        if (escape) escape = false;
        else if (ch === '\\') escape = true;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') inString = true;
      else if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) { end = i; break; }
      }
    }
    if (end > jsonStart) {
      jsonText = jsonText.substring(jsonStart, end + 1);
    }
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
