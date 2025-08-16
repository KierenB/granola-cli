"use strict";
// src/utils/validation.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateNoteId = validateNoteId;
exports.validateSearchText = validateSearchText;
exports.validateDateFilter = validateDateFilter;
exports.validateFolderId = validateFolderId;
exports.validateTitleFilter = validateTitleFilter;
exports.sanitizeApiErrorResponse = sanitizeApiErrorResponse;
/**
 * Input validation utilities to prevent injection attacks and validate user inputs
 */
/**
 * Validates and sanitizes a note ID
 * @param id The note ID to validate
 * @returns The sanitized ID if valid
 * @throws Error if invalid
 */
function validateNoteId(id) {
    if (!id || typeof id !== 'string') {
        throw new Error('Note ID is required and must be a string');
    }
    // Trim whitespace
    const trimmed = id.trim();
    if (trimmed.length === 0) {
        throw new Error('Note ID cannot be empty');
    }
    // Allow only alphanumeric, hyphens, and underscores (common UUID/ID patterns)
    // This prevents injection attacks while allowing legitimate IDs
    const validIdPattern = /^[a-zA-Z0-9\-_]+$/;
    if (!validIdPattern.test(trimmed)) {
        throw new Error('Note ID contains invalid characters. Only alphanumeric characters, hyphens, and underscores are allowed.');
    }
    // Reasonable length limits to prevent DoS
    if (trimmed.length > 100) {
        throw new Error('Note ID is too long. Maximum length is 100 characters.');
    }
    return trimmed;
}
/**
 * Validates and sanitizes search text input
 * @param text The search text to validate
 * @returns The sanitized text if valid
 * @throws Error if invalid
 */
function validateSearchText(text) {
    if (!text || typeof text !== 'string') {
        throw new Error('Search text must be a string');
    }
    // Trim whitespace
    const trimmed = text.trim();
    if (trimmed.length === 0) {
        throw new Error('Search text cannot be empty');
    }
    // Reasonable length limits to prevent DoS
    if (trimmed.length > 1000) {
        throw new Error('Search text is too long. Maximum length is 1000 characters.');
    }
    // Remove potential script tags and other dangerous content
    const sanitized = trimmed
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: URLs
        .replace(/data:/gi, '') // Remove data: URLs
        .replace(/vbscript:/gi, ''); // Remove vbscript: URLs
    return sanitized;
}
/**
 * Validates and sanitizes date input
 * @param date The date string to validate (YYYY-MM-DD format)
 * @returns The sanitized date if valid
 * @throws Error if invalid
 */
function validateDateFilter(date) {
    if (!date || typeof date !== 'string') {
        throw new Error('Date must be a string');
    }
    // Trim whitespace
    const trimmed = date.trim();
    if (trimmed.length === 0) {
        throw new Error('Date cannot be empty');
    }
    // Validate YYYY-MM-DD format
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(trimmed)) {
        throw new Error('Date must be in YYYY-MM-DD format');
    }
    // Validate that it's a real date
    const parsedDate = new Date(trimmed);
    if (isNaN(parsedDate.getTime())) {
        throw new Error('Invalid date provided');
    }
    // Reasonable date range (not too far in the past or future)
    const currentYear = new Date().getFullYear();
    const inputYear = parsedDate.getFullYear();
    if (inputYear < 2000 || inputYear > currentYear + 1) {
        throw new Error(`Date year must be between 2000 and ${currentYear + 1}`);
    }
    return trimmed;
}
/**
 * Validates and sanitizes folder ID
 * @param folderId The folder ID to validate
 * @returns The sanitized folder ID if valid
 * @throws Error if invalid
 */
function validateFolderId(folderId) {
    if (!folderId || typeof folderId !== 'string') {
        throw new Error('Folder ID must be a string');
    }
    // Trim whitespace
    const trimmed = folderId.trim();
    if (trimmed.length === 0) {
        throw new Error('Folder ID cannot be empty');
    }
    // Allow only alphanumeric, hyphens, and underscores (common UUID/ID patterns)
    const validIdPattern = /^[a-zA-Z0-9\-_]+$/;
    if (!validIdPattern.test(trimmed)) {
        throw new Error('Folder ID contains invalid characters. Only alphanumeric characters, hyphens, and underscores are allowed.');
    }
    // Reasonable length limits to prevent DoS
    if (trimmed.length > 100) {
        throw new Error('Folder ID is too long. Maximum length is 100 characters.');
    }
    return trimmed;
}
/**
 * Validates and sanitizes title search input
 * @param title The title to validate
 * @returns The sanitized title if valid
 * @throws Error if invalid
 */
function validateTitleFilter(title) {
    if (!title || typeof title !== 'string') {
        throw new Error('Title must be a string');
    }
    // Trim whitespace
    const trimmed = title.trim();
    if (trimmed.length === 0) {
        throw new Error('Title cannot be empty');
    }
    // Reasonable length limits to prevent DoS
    if (trimmed.length > 500) {
        throw new Error('Title is too long. Maximum length is 500 characters.');
    }
    // Remove potential script tags and other dangerous content
    const sanitized = trimmed
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: URLs
        .replace(/data:/gi, '') // Remove data: URLs
        .replace(/vbscript:/gi, ''); // Remove vbscript: URLs
    return sanitized;
}
/**
 * Sanitizes API error responses to prevent sensitive data leakage
 * @param errorText The raw error text from API response
 * @returns Sanitized error message
 */
function sanitizeApiErrorResponse(errorText) {
    if (!errorText || typeof errorText !== 'string') {
        return 'Unknown API error occurred';
    }
    // Remove potential tokens, sensitive headers, and other sensitive data
    const sensitivePatterns = [
        /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, // Bearer tokens
        /Authorization:\s*[^\s\n]+/gi, // Authorization headers
        /[A-Za-z0-9]{20,}/g, // Long alphanumeric strings (potential tokens)
        /"access_token":\s*"[^"]+"/gi, // JSON access_token fields
        /"refresh_token":\s*"[^"]+"/gi, // JSON refresh_token fields
        /"api_key":\s*"[^"]+"/gi, // API key fields
        /"token":\s*"[^"]+"/gi, // Generic token fields
        /eyJ[A-Za-z0-9\-._~+/]*={0,2}/g, // JWT tokens (start with eyJ)
        /\b[A-Fa-f0-9]{32,}\b/g, // Hex strings that might be secrets
        /(?:password|secret|key):\s*[^\s\n,}]+/gi, // Password/secret fields
    ];
    let sanitized = errorText;
    sensitivePatterns.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '[REDACTED]');
    });
    // Remove stack traces that might contain sensitive file paths or code
    sanitized = sanitized.replace(/\s+at\s+.*\n?/g, '');
    // Limit error message length to prevent information disclosure via long errors
    if (sanitized.length > 500) {
        sanitized = sanitized.substring(0, 500) + '... [truncated]';
    }
    // Provide a generic fallback if the sanitized message is too short or empty
    if (sanitized.trim().length < 10) {
        return 'API request failed with an error';
    }
    return sanitized.trim();
}
