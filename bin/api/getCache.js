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
exports.default = getCache;
// src/api/getCache.ts
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
/**
 * Get potential paths for Granola cache, prioritizing mounted volumes for containers
 */
function getGranolaCachePaths() {
    const homeDirectory = os.homedir();
    const paths = [];
    // For containers: Check mounted volume paths first
    paths.push("/granola-config/cache-v3.json");
    paths.push(path.join(homeDirectory, "granola-config", "cache-v3.json"));
    // Check for environment variable override
    if (process.env.GRANOLA_CACHE_PATH) {
        paths.unshift(process.env.GRANOLA_CACHE_PATH);
    }
    // macOS native path
    paths.push(path.join(homeDirectory, "Library", "Application Support", "Granola", "cache-v3.json"));
    return paths;
}
/**
 * Reads the Granola cache file containing AI-generated summaries
 */
function getCache() {
    const possiblePaths = getGranolaCachePaths();
    for (const filePath of possiblePaths) {
        try {
            const fileContent = fs.readFileSync(filePath, "utf8");
            const jsonData = JSON.parse(fileContent);
            // Get the cache data, parsing it only if it's a string
            const data = typeof jsonData.cache === "string" ? JSON.parse(jsonData.cache) : jsonData.cache;
            if (!data) {
                continue;
            }
            return data;
        }
        catch (error) {
            // Continue to next path
            continue;
        }
    }
    // Cache not found - not critical for CLI operation
    return null;
}
