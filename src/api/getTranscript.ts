// src/api/getTranscript.ts

import getAccessToken from "./getAccessToken";
import { sanitizeApiErrorResponse } from "../utils/validation";
import type { TranscriptSegment } from "../utils/types";

/**
 * Fetches and formats the transcript for a given document ID.
 * @param docId The document ID.
 * @returns The formatted transcript as a string.
 */
export default async function getTranscript(docId: string): Promise<string> {
  const url = "https://api.granola.ai/v1/get-document-transcript";
  const accessToken = await getAccessToken();
  const requestBody = { document_id: docId };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    let errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      errorText = errorJson.message || errorText;
    } catch {
      // Use raw text if parsing fails
    }
    // Sanitize error message to prevent sensitive data leakage
    const sanitizedError = sanitizeApiErrorResponse(errorText);
    throw new Error(`API request failed with status ${response.status}: ${sanitizedError}`);
  }

  const transcriptSegments = (await response.json()) as TranscriptSegment[];

  if (!transcriptSegments || transcriptSegments.length === 0) {
    return "Transcript not available for this note.";
  }

  let formattedTranscript = "";
  transcriptSegments.forEach((segment) => {
    if (segment.source === "microphone") {
      formattedTranscript += `**Me:** ${segment.text}\n\n`;
    } else if (segment.source === "system") {
      formattedTranscript += `**System:** ${segment.text}\n\n`;
    } else {
      formattedTranscript += `${segment.text}\n\n`;
    }
  });

  return formattedTranscript.trim();
}