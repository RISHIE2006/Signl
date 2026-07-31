/**
 * Robustly parses a JSON string from an LLM response.
 * Handles markdown code blocks, trailing commas, and minor formatting issues.
 * 
 * @param {string} text - The raw text from the LLM.
 * @returns {any} - The parsed JSON object or array.
 * @throws {Error} - If parsing fails after cleanup.
 */
export function robustParseJSON(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('No text provided for JSON parsing.');
  }

  // 1. Remove markdown backticks if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-z]*\n/i, '').replace(/\n```$/, '').trim();
  }

  // 2. Extract content between the first [ or { and the last ] or }
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  
  let startIdx = -1;
  let endIdx = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    // Looks like an object
    startIdx = firstBrace;
    endIdx = cleaned.lastIndexOf('}');
  } else if (firstBracket !== -1) {
    // Looks like an array
    startIdx = firstBracket;
    endIdx = cleaned.lastIndexOf(']');
  }

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }

  // 3. Remove trailing commas before closing braces/brackets
  // This is a common LLM error in large arrays/objects
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('[robustParseJSON] Failed to parse JSON:', err.message);
    console.error('[robustParseJSON] Raw snippet (start):', cleaned.substring(0, 200));
    console.error('[robustParseJSON] Raw snippet (end):', cleaned.substring(cleaned.length - 200));
    
    // Attempt one last-ditch fix for unquoted property names if position is known
    // But for now, just throw a clearer error
    throw new Error(`JSON Parsing failed: ${err.message}. Position: ${err.at || 'unknown'}`);
  }
}
