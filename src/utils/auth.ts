// src/utils/auth.ts

import getAccessToken from "../api/getAccessToken";
import { validateJWTToken, getTokenExpirationInfo } from "./jwt";

/**
 * Checks if the user is authenticated (i.e., has a valid, non-expired access token).
 * @returns Object with authentication status and details
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const token = await getAccessToken();
    
    // Basic token existence check
    if (!token) {
      return false;
    }

    // Validate JWT token format and expiration
    const validation = validateJWTToken(token);
    
    if (!validation.isValid) {
      // Log the reason for debugging (but don't expose in production)
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Authentication failed: ${validation.reason}`);
      }
      return false;
    }

    return true;
  } catch (error) {
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
export async function getAuthenticationStatus(): Promise<{
  isAuthenticated: boolean;
  tokenInfo?: string;
  error?: string;
}> {
  try {
    const token = await getAccessToken();
    
    if (!token) {
      return {
        isAuthenticated: false,
        error: 'No access token found'
      };
    }

    const validation = validateJWTToken(token);
    
    return {
      isAuthenticated: validation.isValid,
      tokenInfo: validation.isValid
        ? getTokenExpirationInfo(token)
        : validation.reason,
      error: validation.isValid ? undefined : validation.reason
    };
  } catch (error) {
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
export async function promptLogin(): Promise<void> {
  console.log("Please log in to Granola using the desktop app.");
  // Future: Implement CLI login flow if API supports it
}