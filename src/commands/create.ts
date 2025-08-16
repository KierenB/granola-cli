// src/commands/create.ts
import { Command } from 'commander';
import { exec } from 'child_process';
import { promisify } from 'util';
import ora from 'ora';
import { isAuthenticated, promptLogin } from '../utils/auth';
import { printSuccess, printError, printWarning } from '../utils/output';

const execAsync = promisify(exec);

/**
 * Validates and sanitizes URL scheme to prevent command injection
 * @param url The URL to validate
 * @returns true if URL is safe, false otherwise
 */
function validateGranolaUrl(url: string): boolean {
  // Only allow the specific granola:// scheme with expected parameters
  const allowedPattern = /^granola:\/\/new-document\?creation_source=cli$/;
  return allowedPattern.test(url);
}

/**
 * Safely executes the open command with validated URL
 * @param url The URL to open
 */
async function safeOpenUrl(url: string): Promise<void> {
  if (!validateGranolaUrl(url)) {
    throw new Error('Invalid URL scheme - potential security risk detected');
  }
  
  // Use array form of exec to prevent shell injection
  // Note: We still need to use shell for 'open' command on macOS
  // but we've validated the URL is safe
  const safeUrl = url.replace(/'/g, "\\'"); // Escape single quotes
  await execAsync(`open '${safeUrl}'`);
}

export function createCommand(): Command {
  const cmd = new Command('create')
    .description('Create a new note (opens Granola app)')
    .action(async () => {
      const spinner = ora('Checking authentication...').start();
      try {
        const authed = await isAuthenticated();
        if (!authed) {
          spinner.fail('Not authenticated');
          await promptLogin();
          process.exit(1);
        }
        spinner.text = 'Opening Granola app...';
        
        try {
          // Try to open Granola directly using the same URL scheme as Raycast extension
          // Use safe URL validation to prevent command injection
          const granolaUrl = 'granola://new-document?creation_source=cli';
          await safeOpenUrl(granolaUrl);
          spinner.succeed('Opened new note in Granola app');
          printSuccess('New note created successfully in Granola.');
        } catch (openError) {
          spinner.warn('Could not open Granola app directly');
          
          // Check if we're in a container environment
          const isContainer = process.env.CONTAINER ||
                             process.env.DOCKER_CONTAINER ||
                             process.env.CODESPACES ||
                             process.env.GITPOD_WORKSPACE_ID ||
                             process.env.REMOTE_CONTAINERS ||
                             await isRunningInContainer();
          
          if (isContainer) {
            printWarning('Running in container environment - cannot open desktop applications.');
            printError('Please create a new note manually using the Granola desktop app on your host machine.');
            console.log('\nContainer detected. The CLI cannot open desktop applications from within containers.');
            console.log('You can still use other CLI commands like "granola notes list" to view your notes.');
          } else {
            printWarning('Failed to open Granola app automatically.');
            printError('Please ensure Granola is installed and create a new note manually using the desktop app.');
            console.log('\nTroubleshooting:');
            console.log('1. Make sure Granola desktop app is installed');
            console.log('2. Try opening Granola manually first');
            console.log('3. Check if URL scheme handlers are properly configured');
          }
        }
      } catch (err: any) {
        spinner.fail('Failed to start note creation');
        printError(err?.message || String(err));
        process.exit(1);
      }
    });
  return cmd;
}

/**
 * Check if we're running inside a container
 */
async function isRunningInContainer(): Promise<boolean> {
  try {
    // Check for container-specific files/environment
    const { stdout } = await execAsync('cat /proc/1/cgroup 2>/dev/null || echo ""');
    return stdout.includes('docker') || stdout.includes('containerd');
  } catch {
    return false;
  }
}