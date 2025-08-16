"use strict";
// src/utils/output.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.printError = printError;
exports.printSuccess = printSuccess;
exports.printWarning = printWarning;
exports.printTable = printTable;
/**
 * Utility functions for CLI output formatting (tables, colors, etc.).
 * Extend with your preferred formatting libraries (e.g., chalk, cli-table3).
 */
function printError(message) {
    // Simple error output; replace with color formatting if desired
    console.error(`[ERROR] ${message}`);
}
function printSuccess(message) {
    // Simple success output; replace with color formatting if desired
    console.log(`[SUCCESS] ${message}`);
}
function printWarning(message) {
    // Simple warning output; replace with color formatting if desired
    console.warn(`[WARNING] ${message}`);
}
function printTable(headers, rows) {
    // Basic table output; replace with cli-table3 or similar for advanced formatting
    const headerRow = headers.join(" | ");
    const separator = headers.map(() => "---").join("|");
    console.log(headerRow);
    console.log(separator);
    rows.forEach((row) => {
        console.log(row.join(" | "));
    });
}
