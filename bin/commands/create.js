"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommand = createCommand;
// src/commands/create.ts
const commander_1 = require("commander");
const child_process_1 = require("child_process");
const util_1 = require("util");
const ora_1 = __importDefault(require("ora"));
const auth_1 = require("../utils/auth");
const output_1 = require("../utils/output");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * Validates and sanitizes URL scheme to prevent command injection
 * @param url The URL to validate
 * @returns true if URL is safe, false otherwise
 */
function validateGranolaUrl(url) {
    // Only allow the specific granola:// scheme with expected parameters
    const allowedPattern = /^granola:\/\/new-document\?creation_source=cli$/;
    return allowedPattern.test(url);
}
/**
 * Safely executes the open command with validated URL
 * @param url The URL to open
 */
async function safeOpenUrl(url) {
    if (!validateGranolaUrl(url)) {
        throw new Error('Invalid URL scheme - potential security risk detected');
    }
    // Use array form of exec to prevent shell injection
    // Note: We still need to use shell for 'open' command on macOS
    // but we've validated the URL is safe
    const safeUrl = url.replace(/'/g, "\\'"); // Escape single quotes
    await execAsync(`open '${safeUrl}'`);
}
function createCommand() {
    const cmd = new commander_1.Command('create')
        .description('Create a new note (opens Granola app)')
        .action(async () => {
        const spinner = (0, ora_1.default)('Checking authentication...').start();
        try {
            const authed = await (0, auth_1.isAuthenticated)();
            if (!authed) {
                spinner.fail('Not authenticated');
                await (0, auth_1.promptLogin)();
                process.exit(1);
            }
            spinner.text = 'Opening Granola app...';
            try {
                // Try to open Granola directly using the same URL scheme as Raycast extension
                // Use safe URL validation to prevent command injection
                const granolaUrl = 'granola://new-document?creation_source=cli';
                await safeOpenUrl(granolaUrl);
                spinner.succeed('Opened new note in Granola app');
                (0, output_1.printSuccess)('New note created successfully in Granola.');
            }
            catch (openError) {
                spinner.warn('Could not open Granola app directly');
                // Check if we're in a container environment
                const isContainer = process.env.CONTAINER ||
                    process.env.DOCKER_CONTAINER ||
                    process.env.CODESPACES ||
                    process.env.GITPOD_WORKSPACE_ID ||
                    process.env.REMOTE_CONTAINERS ||
                    await isRunningInContainer();
                if (isContainer) {
                    (0, output_1.printWarning)('Running in container environment - cannot open desktop applications.');
                    (0, output_1.printError)('Please create a new note manually using the Granola desktop app on your host machine.');
                    console.log('\nContainer detected. The CLI cannot open desktop applications from within containers.');
                    console.log('You can still use other CLI commands like "granola notes list" to view your notes.');
                }
                else {
                    (0, output_1.printWarning)('Failed to open Granola app automatically.');
                    (0, output_1.printError)('Please ensure Granola is installed and create a new note manually using the desktop app.');
                    console.log('\nTroubleshooting:');
                    console.log('1. Make sure Granola desktop app is installed');
                    console.log('2. Try opening Granola manually first');
                    console.log('3. Check if URL scheme handlers are properly configured');
                }
            }
        }
        catch (err) {
            spinner.fail('Failed to start note creation');
            (0, output_1.printError)(err?.message || String(err));
            process.exit(1);
        }
    });
    return cmd;
}
/**
 * Check if we're running inside a container
 */
async function isRunningInContainer() {
    try {
        // Check for container-specific files/environment
        const { stdout } = await execAsync('cat /proc/1/cgroup 2>/dev/null || echo ""');
        return stdout.includes('docker') || stdout.includes('containerd');
    }
    catch {
        return false;
    }
}
