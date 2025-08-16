"use strict";
// src/utils/auth.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthenticated = isAuthenticated;
exports.getAuthenticationStatus = getAuthenticationStatus;
exports.promptLogin = promptLogin;
const getAccessToken_1 = __importDefault(require("../api/getAccessToken"));
const jwt_1 = require("./jwt");
/**
 * Checks if the user is authenticated (i.e., has a valid, non-expired access token).
 * @returns Object with authentication status and details
 */
async function isAuthenticated() {
    try {
        const token = await (0, getAccessToken_1.default)();
        // Basic token existence check
        if (!token) {
            return false;
        }
        // Validate JWT token format and expiration
        const validation = (0, jwt_1.validateJWTToken)(token);
        if (!validation.isValid) {
            // Log the reason for debugging (but don't expose in production)
            if (process.env.NODE_ENV === 'development') {
                console.warn(`Authentication failed: ${validation.reason}`);
            }
            return false;
        }
        return true;
    }
    catch (error) {
        // Log error for debugging (but don't expose in production)
        if (process.env.NODE_ENV === 'development') {
            console.warn('Authentication check failed:', error);
        }
        return false;
    }
}
/**
 * Gets detailed authentication status including token validation
 * @returns Detailed authentication information
 */
async function getAuthenticationStatus() {
    try {
        const token = await (0, getAccessToken_1.default)();
        if (!token) {
            return {
                isAuthenticated: false,
                error: 'No access token found'
            };
        }
        const validation = (0, jwt_1.validateJWTToken)(token);
        return {
            isAuthenticated: validation.isValid,
            tokenInfo: validation.isValid
                ? (0, jwt_1.getTokenExpirationInfo)(token)
                : validation.reason,
            error: validation.isValid ? undefined : validation.reason
        };
    }
    catch (error) {
        return {
            isAuthenticated: false,
            error: error instanceof Error ? error.message : 'Unknown authentication error'
        };
    }
}
/**
 * Placeholder for CLI login flow.
 * Implement interactive login as needed.
 */
async function promptLogin() {
    console.log("Please log in to Granola using the desktop app.");
    // Future: Implement CLI login flow if API supports it
}
