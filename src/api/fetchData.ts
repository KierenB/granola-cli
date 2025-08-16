// src/api/fetchData.ts
import getAccessToken from "./getAccessToken";
import { sanitizeApiErrorResponse } from "../utils/validation";
import type { GetDocumentsResponse } from "../utils/types";

/**
 * Fetches data from the Granola API for a given route.
 * @param route API route (e.g., "documents")
 * @returns The API response data
 */
export async function fetchGranolaData(route: string): Promise<GetDocumentsResponse> {
  const accessToken = await getAccessToken();
  const url = `https://api.granola.ai/v2/get-${route}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
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

  return (await response.json()) as GetDocumentsResponse;
}