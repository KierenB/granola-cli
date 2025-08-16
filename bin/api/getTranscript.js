"use strict";
// src/api/getTranscript.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getTranscript;
const getAccessToken_1 = __importDefault(require("./getAccessToken"));
const validation_1 = require("../utils/validation");
/**
 * Fetches and formats the transcript for a given document ID.
 * @param docId The document ID.
 * @returns The formatted transcript as a string.
 */
async function getTranscript(docId) {
    const url = "https://api.granola.ai/v1/get-document-transcript";
    const accessToken = await (0, getAccessToken_1.default)();
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
        }
        catch {
            // Use raw text if parsing fails
        }
        // Sanitize error message to prevent sensitive data leakage
        const sanitizedError = (0, validation_1.sanitizeApiErrorResponse)(errorText);
        throw new Error(`API request failed with status ${response.status}: ${sanitizedError}`);
    }
    const transcriptSegments = (await response.json());
    if (!transcriptSegments || transcriptSegments.length === 0) {
        return "Transcript not available for this note.";
    }
    let formattedTranscript = "";
    transcriptSegments.forEach((segment) => {
        if (segment.source === "microphone") {
            formattedTranscript += `**Me:** ${segment.text}\n\n`;
        }
        else if (segment.source === "system") {
            formattedTranscript += `**System:** ${segment.text}\n\n`;
        }
        else {
            formattedTranscript += `${segment.text}\n\n`;
        }
    });
    return formattedTranscript.trim();
}
