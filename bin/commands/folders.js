"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.foldersCommand = foldersCommand;
// src/commands/folders.ts
const commander_1 = require("commander");
const ora_1 = __importDefault(require("ora"));
const getFolders_1 = __importDefault(require("../api/getFolders"));
const auth_1 = require("../utils/auth");
const output_1 = require("../utils/output");
function foldersCommand() {
    const cmd = new commander_1.Command('folders')
        .description('List all folders')
        .action(async () => {
        const spinner = (0, ora_1.default)('Fetching folders...').start();
        try {
            const authed = await (0, auth_1.isAuthenticated)();
            if (!authed) {
                spinner.fail('Not authenticated');
                await (0, auth_1.promptLogin)();
                process.exit(1);
            }
            const foldersResp = await (0, getFolders_1.default)();
            spinner.succeed('Folders loaded');
            const folders = foldersResp.lists ? Object.values(foldersResp.lists) : [];
            if (folders.length === 0) {
                (0, output_1.printError)('No folders found.');
                return;
            }
            (0, output_1.printTable)(['ID', 'Title', 'Notes', 'Created'], folders.map((f) => [
                f.id || '',
                f.title || '',
                (f.document_ids?.length ?? 0).toString(),
                f.created_at ? new Date(f.created_at).toLocaleString() : ''
            ]));
        }
        catch (err) {
            spinner.fail('Failed to fetch folders');
            (0, output_1.printError)(err?.message || String(err));
            process.exit(1);
        }
    });
    return cmd;
}
