import { z } from 'zod';

/**
 * A robust function to clean and parse a JSON string from an AI response.
 * It specifically targets the 'markdownBody' field, which is expected to be the
 * last field in the JSON object, and correctly escapes its content before parsing.
 *
 * @param aiResponseText The raw text response from the AI.
 * @param schema The Zod schema to validate the parsed JSON against.
 * @returns The validated data object or null if parsing or validation fails.
 */
export function sanitizeAndParseJson<T extends z.ZodType<any, any>>(
  aiResponseText: string,
  schema: T
): z.infer<T> | null {
  if (!aiResponseText) {
    return null;
  }

  // Attempt to find the JSON object within the string, accommodating leading/trailing text.
  const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch || !jsonMatch[0]) {
    console.error("No valid JSON object found in AI response.");
    console.error("Raw AI Response:", aiResponseText);
    return null;
  }

  const jsonString = jsonMatch[0];
  let parsedJson;

  try {
    const markdownBodyMarker = '"markdownBody": "';
    const startOfBodyMarker = jsonString.indexOf(markdownBodyMarker);

    if (startOfBodyMarker === -1) {
      // If the marker isn't found, the structure is unexpected.
      // Attempt a direct parse as a fallback.
      parsedJson = JSON.parse(jsonString);
    } else {
      // Find the start of the actual content of markdownBody
      const startOfBodyValue = startOfBodyMarker + markdownBodyMarker.length;
      
      // The markdownBody is the last field, so its value ends right before the final "}"
      const endOfBodyValue = jsonString.lastIndexOf('"');
      
      if (endOfBodyValue <= startOfBodyValue) {
        // This indicates a malformed string, fallback to direct parse
        parsedJson = JSON.parse(jsonString);
      } else {
        // Extract the content before the markdownBody value
        const jsonPrefix = jsonString.substring(0, startOfBodyValue);
        
        // Extract the raw, unescaped content of the markdownBody
        const rawBodyContent = jsonString.substring(startOfBodyValue, endOfBodyValue);
        
        // Use JSON.stringify to correctly escape the body content, then slice off the outer quotes it adds
        const correctlyEscapedBody = JSON.stringify(rawBodyContent).slice(1, -1);

        // Reconstruct the final JSON string
        const reconstructedJsonString = jsonPrefix + correctlyEscapedBody + '"}';
        
        parsedJson = JSON.parse(reconstructedJsonString);
      }
    }
  } catch (error) {
    console.error("Failed to parse JSON even after cleaning attempts:", error);
    console.error("Problematic JSON string:", jsonString);
    return null;
  }

  const validationResult = schema.safeParse(parsedJson);

  if (!validationResult.success) {
    console.error("Error: AI response did not match the expected schema.", validationResult.error);
    console.error("Parsed JSON that failed validation:", parsedJson);
    return null;
  }

  return validationResult.data;
}