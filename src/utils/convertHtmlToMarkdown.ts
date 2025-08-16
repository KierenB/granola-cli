// src/utils/convertHtmlToMarkdown.ts

import TurndownService from "turndown";

/**
 * Converts HTML content to Markdown.
 * @param htmlContent The HTML string to convert.
 * @returns The converted Markdown string.
 */
export default function convertHtmlToMarkdown(htmlContent: string): string {
  if (!htmlContent) {
    return "";
  }

  try {
    const turndownService = new TurndownService();
    return turndownService.turndown(htmlContent);
  } catch (error) {
    // For CLI, just log the error and return the original content
    console.error("Error converting HTML to Markdown:", error);
    return htmlContent;
  }
}