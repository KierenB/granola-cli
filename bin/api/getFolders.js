"use strict";
// src/api/getFolders.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getFolders;
const getAccessToken_1 = __importDefault(require("./getAccessToken"));
const validation_1 = require("../utils/validation");
/**
 * Fetches folder metadata from the Granola API.
 * @returns The folders response object.
 */
async function getFolders() {
    const url = "https://api.granola.ai/v1/get-document-lists-metadata";
    const accessToken = await (0, getAccessToken_1.default)();
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
        }
        catch {
            // Use raw text if parsing fails
        }
        // Sanitize error message to prevent sensitive data leakage
        const sanitizedError = (0, validation_1.sanitizeApiErrorResponse)(errorText);
        throw new Error(`API request failed with status ${response.status}: ${sanitizedError}`);
    }
    return (await response.json());
}
