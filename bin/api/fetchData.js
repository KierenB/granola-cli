"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchGranolaData = fetchGranolaData;
// src/api/fetchData.ts
const getAccessToken_1 = __importDefault(require("./getAccessToken"));
const validation_1 = require("../utils/validation");
/**
 * Fetches data from the Granola API for a given route.
 * @param route API route (e.g., "documents")
 * @returns The API response data
 */
async function fetchGranolaData(route) {
    const accessToken = await (0, getAccessToken_1.default)();
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
