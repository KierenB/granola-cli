// src/utils/output.ts

/**
 * Utility functions for CLI output formatting (tables, colors, etc.).
 * Extend with your preferred formatting libraries (e.g., chalk, cli-table3).
 */

export function printError(message: string) {
  // Simple error output; replace with color formatting if desired
  console.error(`[ERROR] ${message}`);
}

export function printSuccess(message: string) {
  // Simple success output; replace with color formatting if desired
  console.log(`[SUCCESS] ${message}`);
}

export function printWarning(message: string) {
  // Simple warning output; replace with color formatting if desired
  console.warn(`[WARNING] ${message}`);
}

export function printTable(headers: string[], rows: string[][]) {
  // Basic table output; replace with cli-table3 or similar for advanced formatting
  const headerRow = headers.join(" | ");
  const separator = headers.map(() => "---").join("|");
  console.log(headerRow);
  console.log(separator);
  rows.forEach((row) => {
    console.log(row.join(" | "));
  });
}