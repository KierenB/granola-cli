// src/api/getCache.ts
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

interface PanelContent {
  original_content: string;
  content?: any;
}

export interface CacheData {
  state?: {
    documents?: Record<string, any>;
    documentPanels?: Record<string, Record<string, PanelContent>>;
  };
}

/**
 * Get potential paths for Granola cache, prioritizing mounted volumes for containers
 */
function getGranolaCachePaths(): string[] {
  const homeDirectory = os.homedir();
  const paths: string[] = [];
  
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
export default function getCache(): CacheData | null {
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
      
      return data as CacheData;
    } catch (error) {
      // Continue to next path
      continue;
    }
  }
  
  // Cache not found - not critical for CLI operation
  return null;
}