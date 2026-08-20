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

  // 2. Find the first { or [ and then find the matching closing brace/bracket
  // by counting nested structures
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  
  let startIdx = -1;
  
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }
  
  if (startIdx === -1) {
    throw new Error('No JSON object or array found in response');
  }
  
  // Find the matching closing bracket by counting nested structures
  let depth = 0;
  let inString = false;
  let escapeNext = false;
  let endIdx = -1;
  
  for (let i = startIdx; i < cleaned.length; i++) {
    const char = cleaned[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }
    
    if (inString) continue;
    
    if (char === '{' || char === '[') {
      depth++;
    } else if (char === '}' || char === ']') {
      depth--;
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
  }
  
  if (endIdx === -1) {
    throw new Error('Could not find matching closing bracket for JSON');
  }
  
  cleaned = cleaned.substring(startIdx, endIdx + 1);

  // 3. Remove trailing commas before closing braces/brackets
  // This is a common LLM error in large arrays/objects
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('[robustParseJSON] Failed to parse JSON:', err.message);
    console.error('[robustParseJSON] Raw snippet (start):', cleaned.substring(0, 200));
    console.error('[robustParseJSON] Raw snippet (end):', cleaned.substring(cleaned.length - 200));
    
    throw new Error(`JSON Parsing failed: ${err.message}. Position: ${err.at || 'unknown'}`);
  }
}
