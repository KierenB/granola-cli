// src/api/getFolders.ts

import getAccessToken from "./getAccessToken";
import { sanitizeApiErrorResponse } from "../utils/validation";
import type { FoldersResponse } from "../utils/types";

/**
 * Fetches folder metadata from the Granola API.
 * @returns The folders response object.
 */
export default async function getFolders(): Promise<FoldersResponse> {
  const url = "https://api.granola.ai/v1/get-document-lists-metadata";
  const accessToken = await getAccessToken();

  const requestBody = {
    include_document_ids: true,
    include_only_joined_lists: false,
  };

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

  return (await response.json()) as FoldersResponse;
}