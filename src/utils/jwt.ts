// src/utils/jwt.ts

/**
 * JWT token validation utilities
 */

interface JWTPayload {
  exp?: number;
  iat?: number;
  sub?: string;
  [key: string]: any;
}

/**
 * Decodes a JWT token without verifying signature (for reading payload)
 * @param token The JWT token to decode
 * @returns The decoded payload or null if invalid
 */
function decodeJWT(token: string): JWTPayload | null {
  try {
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // The payload is the middle part (index 1)
    const payload = parts[1];
    
    // JWT uses base64url encoding, need to convert to regular base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if needed
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    
    // Decode the base64 string
    const decoded = atob(padded);
    
    // Parse the JSON
    return JSON.parse(decoded) as JWTPayload;
  } catch (error) {
    // If any step fails, the token is invalid
    return null;
  }
}

/**
 * Validates if a JWT token is well-formed and not expired
 * @param token The JWT token to validate
 * @returns Object with validation results
 */
export function validateJWTToken(token: string): {
  isValid: boolean;
  isExpired: boolean;
  expiresAt?: Date;
  reason?: string;
} {
  // Check if token exists and is a string
  if (!token || typeof token !== 'string') {
    return {
      isValid: false,
      isExpired: false,
      reason: 'Token is missing or not a string'
    };
  }

  // Check basic JWT format (should start with eyJ which is base64 for {"...)
  if (!token.startsWith('eyJ')) {
    return {
      isValid: false,
      isExpired: false,
      reason: 'Token does not appear to be a valid JWT'
    };
  }

  // Decode the JWT payload
  const payload = decodeJWT(token);
  if (!payload) {
    return {
      isValid: false,
      isExpired: false,
      reason: 'Unable to decode JWT payload'
    };
  }

  // Check if token has expiration
  if (!payload.exp) {
    return {
      isValid: false,
      isExpired: false,
      reason: 'Token does not contain expiration claim'
    };
  }

  // Check if token is expired
  const currentTime = Math.floor(Date.now() / 1000); // JWT exp is in seconds
  const isExpired = payload.exp < currentTime;
  const expiresAt = new Date(payload.exp * 1000);

  if (isExpired) {
    return {
      isValid: false,
      isExpired: true,
      expiresAt,
      reason: `Token expired at ${expiresAt.toISOString()}`
    };
  }

  // Check if token is not yet valid (optional iat check)
  if (payload.iat && payload.iat > currentTime) {
    return {
      isValid: false,
      isExpired: false,
      expiresAt,
      reason: 'Token is not yet valid (issued in the future)'
    };
  }

  // Token is valid
  return {
    isValid: true,
    isExpired: false,
    expiresAt
  };
}

/**
 * Checks if a token will expire within the specified number of seconds
 * @param token The JWT token to check
 * @param withinSeconds Number of seconds to check ahead (default: 300 = 5 minutes)
 * @returns true if token will expire soon
 */
export function isTokenExpiringSoon(token: string, withinSeconds: number = 300): boolean {
  const validation = validateJWTToken(token);
  
  if (!validation.isValid || !validation.expiresAt) {
    return true; // Consider invalid tokens as "expiring soon"
  }

  const currentTime = Date.now();
  const expirationTime = validation.expiresAt.getTime();
  const timeUntilExpiration = expirationTime - currentTime;

  return timeUntilExpiration <= (withinSeconds * 1000);
}

/**
 * Gets token expiration info in a human-readable format
 * @param token The JWT token to analyze
 * @returns Formatted expiration information
 */
export function getTokenExpirationInfo(token: string): string {
  const validation = validateJWTToken(token);
  
  if (!validation.isValid) {
    return validation.reason || 'Token is invalid';
  }

  if (!validation.expiresAt) {
    return 'Token expiration information not available';
  }

  const now = new Date();
  const expiresAt = validation.expiresAt;
  
  if (validation.isExpired) {
    const expiredAgo = Math.floor((now.getTime() - expiresAt.getTime()) / 1000);
    return `Token expired ${expiredAgo} seconds ago (at ${expiresAt.toLocaleString()})`;
  } else {
    const expiresIn = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
    return `Token expires in ${expiresIn} seconds (at ${expiresAt.toLocaleString()})`;
  }
}