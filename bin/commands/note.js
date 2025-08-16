"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.noteCommand = noteCommand;
// src/commands/note.ts
const commander_1 = require("commander");
const ora_1 = __importDefault(require("ora"));
const getTranscript_1 = __importDefault(require("../api/getTranscript"));
const fetchData_1 = require("../api/fetchData");
const getCache_1 = __importDefault(require("../api/getCache"));
const getPanelId_1 = require("../utils/getPanelId");
const convertJsonNodes_1 = require("../utils/convertJsonNodes");
const convertHtmlToMarkdown_1 = __importDefault(require("../utils/convertHtmlToMarkdown"));
const auth_1 = require("../utils/auth");
const output_1 = require("../utils/output");
const validation_1 = require("../utils/validation");
function noteCommand() {
    const cmd = new commander_1.Command('note')
        .description('Show details and transcript for a specific note')
        .argument('<id>', 'Note ID')
        .option('-t, --transcript-only', 'Show only the transcript')
        .option('-s, --summary-only', 'Show only the AI summary')
        .option('-r, --raw', 'Show raw content without formatting')
        .action(async (id, options) => {
        const spinner = (0, ora_1.default)('Validating input...').start();
        try {
            // Validate and sanitize the note ID
            const validatedId = (0, validation_1.validateNoteId)(id);
            spinner.text = 'Checking authentication...';
            const authed = await (0, auth_1.isAuthenticated)();
            if (!authed) {
                spinner.fail('Not authenticated');
                await (0, auth_1.promptLogin)();
                process.exit(1);
            }
            spinner.text = 'Fetching note details...';
            const data = await (0, fetchData_1.fetchGranolaData)('documents');
            const note = (data.docs || []).find(n => n.id === validatedId);
            if (!note) {
                spinner.fail('Note not found');
                (0, output_1.printError)('No note found with the given ID.');
                return;
            }
            // Try to get AI-generated summary from cache
            let aiSummary = null;
            const cache = (0, getCache_1.default)();
            if (cache?.state?.documentPanels) {
                const panels = cache.state.documentPanels;
                const panelId = (0, getPanelId_1.getPanelId)(panels, validatedId);
                if (panelId && panels[validatedId] && panels[validatedId][panelId]) {
                    const panelData = panels[validatedId][panelId];
                    if (panelData.content) {
                        aiSummary = (0, convertJsonNodes_1.convertDocumentToMarkdown)(panelData.content);
                    }
                    else if (panelData.original_content) {
                        aiSummary = (0, convertHtmlToMarkdown_1.default)(panelData.original_content);
                    }
                }
            }
            // Fetch transcript only if explicitly requested
            let transcript = null;
            if (options.transcriptOnly || (cmd.opts().transcript)) {
                spinner.text = 'Fetching transcript...';
                try {
                    transcript = await (0, getTranscript_1.default)(validatedId);
                }
                catch (err) {
                    // Transcript might not be available for all notes
                    transcript = null;
                }
            }
            spinner.succeed('Note loaded');
            // Print note details
            console.log(`\nTitle: ${note.title}`);
            console.log(`Created: ${note.created_at ? new Date(note.created_at).toLocaleString() : ''}`);
            console.log(`Source: ${note.creation_source || ''}`);
            console.log(`Public: ${note.public ? 'Yes' : 'No'}`);
            // Show AI Summary by default (unless transcript-only is specified)
            if (aiSummary && !options.transcriptOnly) {
                console.log(`\nDescription:`);
                if (options.raw) {
                    console.log(aiSummary);
                }
                else {
                    console.log(aiSummary);
                }
            }
            else if (!aiSummary && !options.transcriptOnly) {
                // Show original notes if no AI summary and not transcript-only
                if (note.notes_markdown) {
                    console.log(`\n--- Original Notes ---\n`);
                    console.log(note.notes_markdown);
                }
                else {
                    (0, output_1.printWarning)('\nNo AI summary available for this note.');
                }
            }
            // Show transcript only if explicitly requested
            if (transcript && (options.transcriptOnly || cmd.opts().transcript)) {
                console.log(`\n--- Transcript ---\n`);
                console.log(transcript);
            }
            else if ((options.transcriptOnly || cmd.opts().transcript) && !transcript) {
                (0, output_1.printWarning)('\nNo transcript available for this note.');
            }
        }
        catch (err) {
            spinner.fail('Failed to fetch note');
            (0, output_1.printError)(err?.message || String(err));
            process.exit(1);
        }
    });
    return cmd;
}
