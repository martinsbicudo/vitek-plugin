/**
 * AST-based type extraction using ts-morph
 * Falls back to regex if AST parsing fails or ts-morph is not available
 * 
 * Note: This is a placeholder for future AST-based extraction.
 * To use this, add ts-morph as an optional dependency:
 *   npm install --save-optional ts-morph
 */

/**
 * Extracts a type definition from a TypeScript file using AST parsing
 * Returns the type body as a string, or undefined if not found
 * 
 * @deprecated This function requires ts-morph which is not currently installed.
 * The regex-based extraction in dev-server.ts is used instead.
 * To enable AST parsing, install ts-morph and update the extraction logic.
 */
export async function extractTypeFromFileAST(
  filePath: string,
  typeName: string
): Promise<string | undefined> {
  // AST parsing is not currently implemented
  // This would require:
  // 1. Adding ts-morph as optional dependency
  // 2. Making extractTypeFromFile async
  // 3. Updating all call sites
  // 
  // For now, regex-based extraction is used (see dev-server.ts)
  return undefined;
}
