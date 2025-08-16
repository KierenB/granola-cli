"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getAccessToken;
// src/api/getAccessToken.ts
const fs_1 = require("fs");
const path = __importStar(require("path"));
const os = __importStar(require("os"));
/**
 * Get potential paths for Granola config, prioritizing mounted volumes for containers
 */
function getGranolaPaths() {
    const homeDirectory = os.homedir();
    const paths = [];
    // For containers: Check mounted volume paths first
    // These paths assume the host's Granola config is mounted to container
    paths.push("/granola-config/supabase.json"); // Custom mount point
    paths.push(path.join(homeDirectory, "granola-config", "supabase.json")); // Alternative mount
    // Check for environment variable override
    if (process.env.GRANOLA_CONFIG_PATH) {
        paths.unshift(process.env.GRANOLA_CONFIG_PATH);
    }
    // macOS native path (when running directly on host or mounted correctly)
    paths.push(path.join(homeDirectory, "Library", "Application Support", "Granola", "supabase.json"));
    return paths;
}
/**
 * Reads a file with retry logic to handle race conditions and temporary file locks
 * @param filePath Path to the file to read
 * @param maxRetries Maximum number of retry attempts
 * @param delayMs Delay between retries in milliseconds
 * @returns File content as string
 */
async function readFileWithRetry(filePath, maxRetries = 3, delayMs = 100) {
    let lastError = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fs_1.promises.readFile(filePath, "utf8");
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            // Check if this is a retryable error (file busy, permission temporarily denied, etc.)
            const errorCode = error?.code;
            const isRetryableError = errorCode === 'EBUSY' ||
                errorCode === 'EACCES' ||
                errorCode === 'EAGAIN' ||
                errorCode === 'EMFILE' ||
                errorCode === 'ENFILE';
            // If it's not retryable or we've exhausted retries, throw
            if (!isRetryableError || attempt >= maxRetries) {
                throw lastError;
            }
            // Wait before retrying with exponential backoff
            await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
        }
    }
    // This should never be reached, but just in case
    throw lastError || new Error('File read failed after retries');
}
/**
 * Sanitizes error messages to prevent token information leakage
 * @param errorMessage The original error message
 * @returns A sanitized error message
 */
function sanitizeErrorMessage(errorMessage) {
    // Remove potential tokens, keys, or sensitive data patterns
    const sensitivePatterns = [
        /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, // Bearer tokens
        /[A-Za-z0-9]{20,}/g, // Long alphanumeric strings (potential tokens)
        /"access_token":\s*"[^"]+"/gi, // JSON access_token fields
        /"refresh_token":\s*"[^"]+"/gi, // JSON refresh_token fields
        /"cognito_tokens":\s*"[^"]+"/gi, // JSON cognito_tokens fields
        /eyJ[A-Za-z0-9\-._~+/]*={0,2}/g, // JWT tokens (start with eyJ)
    ];
    let sanitized = errorMessage;
    sensitivePatterns.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '[REDACTED]');
    });
    // Generic fallback for any remaining long strings that might be tokens
    sanitized = sanitized.replace(/\b[A-Za-z0-9]{32,}\b/g, '[REDACTED]');
    return sanitized;
}
/**
 * Retrieves the Granola access token from the user's local configuration.
 * Dynamically reads the token from file each time to handle token rotation.
 * Throws an error if the token cannot be found or parsed.
 */
async function getAccessToken() {
    const possiblePaths = getGranolaPaths();
    let lastError = null;
    // Try each possible path
    for (const filePath of possiblePaths) {
        try {
            // Always read fresh from file to get latest token (handles 24hr rotation)
            // Add retry logic to handle race conditions with concurrent access
            const fileContent = await readFileWithRetry(filePath, 3, 100);
            const jsonData = JSON.parse(fileContent);
            let cognitoTokens;
            try {
                if (typeof jsonData.cognito_tokens === "string") {
                    cognitoTokens = JSON.parse(jsonData.cognito_tokens);
                }
                else if (typeof jsonData.cognito_tokens === "object" && jsonData.cognito_tokens !== null) {
                    cognitoTokens = jsonData.cognito_tokens;
                }
                else {
                    throw new Error("cognito_tokens is neither a valid JSON string nor an object");
                }
            }
            catch (error) {
                const parseError = error instanceof Error ? error : new Error(String(error));
                const sanitizedMessage = sanitizeErrorMessage(parseError.message);
                throw new Error(`Failed to parse local access token: ${sanitizedMessage}`);
            }
            const accessToken = cognitoTokens.access_token;
            if (!accessToken) {
                throw new Error("Access token not found in configuration file");
            }
            return accessToken;
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            // Continue to next path
            continue;
        }
    }
    // If we get here, no valid config was found
    // Sanitize error message to prevent token information leakage
    const sanitizedError = lastError?.message
        ? sanitizeErrorMessage(lastError.message)
        : 'Configuration file not found or invalid format';
    throw new Error(`Failed to find Granola authentication token.\n` +
        `Searched paths:\n${possiblePaths.map(p => `  - ${p}`).join('\n')}\n\n` +
        `For container usage, mount your host Granola config:\n` +
        `docker run -v "$HOME/Library/Application Support/Granola:/granola-config:ro" your-image\n\n` +
        `Or set custom path:\n` +
        `export GRANOLA_CONFIG_PATH="/path/to/supabase.json"\n\n` +
        `Make sure Granola desktop app is running and you're logged in on the host machine.\n` +
        `Last error: ${sanitizedError}`);
}
