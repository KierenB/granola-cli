"use strict";
// src/utils/convertHtmlToMarkdown.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = convertHtmlToMarkdown;
const turndown_1 = __importDefault(require("turndown"));
/**
 * Converts HTML content to Markdown.
 * @param htmlContent The HTML string to convert.
 * @returns The converted Markdown string.
 */
function convertHtmlToMarkdown(htmlContent) {
    if (!htmlContent) {
        return "";
    }
    try {
        const turndownService = new turndown_1.default();
        return turndownService.turndown(htmlContent);
    }
    catch (error) {
        // For CLI, just log the error and return the original content
        console.error("Error converting HTML to Markdown:", error);
        return htmlContent;
    }
}
