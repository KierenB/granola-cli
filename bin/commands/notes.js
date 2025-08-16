"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notesCommand = notesCommand;
// src/commands/notes.ts
const commander_1 = require("commander");
const ora_1 = __importDefault(require("ora"));
const fetchData_1 = require("../api/fetchData");
const getCache_1 = __importDefault(require("../api/getCache"));
const auth_1 = require("../utils/auth");
const output_1 = require("../utils/output");
const validation_1 = require("../utils/validation");
const getFolders_1 = __importDefault(require("../api/getFolders"));
function notesCommand() {
    const cmd = new commander_1.Command('notes')
        .description('List, search, or filter notes [--title <title>] [--date <date>] [--content <text>] [--folder <folderId>] (folderId only, not folder name)')
        .option('--title <title>', 'Filter by note title')
        .option('--date <date>', 'Filter by creation date (YYYY-MM-DD)')
        .option('--content <text>', 'Search in note content')
        .option('--folder <folderId>', 'Filter by folder ID')
        .option('--show-summary', 'Show if AI summary is available')
        .action(async (opts) => {
        const spinner = (0, ora_1.default)('Validating filters...').start();
        try {
            // Validate and sanitize all filter inputs to prevent injection attacks
            const validatedFilters = {};
            if (opts.title) {
                validatedFilters.title = (0, validation_1.validateTitleFilter)(opts.title);
            }
            if (opts.date) {
                validatedFilters.date = (0, validation_1.validateDateFilter)(opts.date);
            }
            if (opts.content) {
                validatedFilters.content = (0, validation_1.validateSearchText)(opts.content);
            }
            if (opts.folder) {
                validatedFilters.folder = (0, validation_1.validateFolderId)(opts.folder);
            }
            spinner.text = 'Checking authentication...';
            const authed = await (0, auth_1.isAuthenticated)();
            if (!authed) {
                spinner.fail('Not authenticated');
                await (0, auth_1.promptLogin)();
                process.exit(1);
            }
            spinner.text = 'Fetching notes...';
            const data = await (0, fetchData_1.fetchGranolaData)('documents');
            // Get cache for summary availability check
            const cache = (0, getCache_1.default)();
            const panels = cache?.state?.documentPanels;
            spinner.succeed('Notes loaded');
            let notes = data.docs || [];
            // Apply validated filters
            if (validatedFilters.title) {
                notes = notes.filter(n => n.title?.toLowerCase().includes(validatedFilters.title.toLowerCase()));
            }
            if (validatedFilters.date) {
                notes = notes.filter(n => n.created_at?.startsWith(validatedFilters.date));
            }
            if (validatedFilters.content) {
                notes = notes.filter(n => n.notes_markdown?.toLowerCase().includes(validatedFilters.content.toLowerCase()));
            }
            if (validatedFilters.folder) {
                // Fetch folders to resolve folder ID/title and get document IDs
                try {
                    const foldersResp = await (0, getFolders_1.default)();
                    const folders = foldersResp.lists ? Object.values(foldersResp.lists) : [];
                    // Try to find folder by ID first, then by title
                    let targetFolder = folders.find(f => f.id === validatedFilters.folder);
                    if (!targetFolder) {
                        targetFolder = folders.find(f => f.title?.toLowerCase() === validatedFilters.folder.toLowerCase());
                    }
                    if (!targetFolder) {
                        (0, output_1.printError)(`Folder not found: ${validatedFilters.folder}`);
                        return;
                    }
                    // Filter notes by document IDs from the folder
                    const folderDocumentIds = new Set(targetFolder.document_ids || []);
                    notes = notes.filter(n => folderDocumentIds.has(n.id));
                }
                catch (err) {
                    (0, output_1.printError)(`Failed to fetch folders: ${err?.message || String(err)}`);
                    return;
                }
            }
            if (notes.length === 0) {
                (0, output_1.printError)('No notes found.');
                return;
            }
            const headers = ['ID', 'Title', 'Created', 'Source', 'Public'];
            if (opts.showSummary) {
                headers.push('AI Summary');
            }
            (0, output_1.printTable)(headers, notes.map(n => {
                const row = [
                    n.id,
                    n.title,
                    n.created_at ? new Date(n.created_at).toLocaleString() : '',
                    n.creation_source || '',
                    n.public ? 'Yes' : 'No'
                ];
                if (opts.showSummary) {
                    const hasSummary = panels && panels[n.id] ? 'Yes' : 'No';
                    row.push(hasSummary);
                }
                return row;
            }));
        }
        catch (err) {
            spinner.fail('Failed to fetch notes');
            (0, output_1.printError)(err?.message || String(err));
            process.exit(1);
        }
    });
    return cmd;
}
