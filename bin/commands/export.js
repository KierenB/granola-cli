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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportCommand = exportCommand;
// src/commands/export.ts
const commander_1 = require("commander");
const ora_1 = __importDefault(require("ora"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const getTranscript_1 = __importDefault(require("../api/getTranscript"));
const fetchData_1 = require("../api/fetchData");
const getCache_1 = __importDefault(require("../api/getCache"));
const getPanelId_1 = require("../utils/getPanelId");
const convertJsonNodes_1 = require("../utils/convertJsonNodes");
const convertHtmlToMarkdown_1 = __importDefault(require("../utils/convertHtmlToMarkdown"));
const auth_1 = require("../utils/auth");
const output_1 = require("../utils/output");
const validation_1 = require("../utils/validation");
function sanitizeFilename(filename) {
    return filename
        .replace(/[<>:"/\\|?*]/g, '-')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}
function createOutputDirectory(outputPath) {
    try {
        if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath, { recursive: true });
        }
        return true;
    }
    catch (error) {
        return false;
    }
}
function generateMarkdownContent(note, content, type) {
    const metadata = [
        `---`,
        `title: "${note.title}"`,
        `id: ${note.id}`,
        `created: ${note.created_at ? new Date(note.created_at).toISOString() : ''}`,
        `source: ${note.creation_source || ''}`,
        `public: ${note.public}`,
        `type: ${type}`,
        `exported: ${new Date().toISOString()}`,
        `---`,
        ``,
        `# ${note.title}`,
        ``,
        content
    ].join('\n');
    return metadata;
}
function exportCommand() {
    const cmd = new commander_1.Command('export')
        .description('Export note content as markdown')
        .argument('<id>', 'Note ID to export')
        .option('--transcript', 'Export transcript instead of summary')
        .option('--all', 'Export both summary and transcript')
        .option('--raw', 'Export raw content without formatting')
        .option('-o, --output <directory>', 'Output directory', './exports')
        .action(async (id, options) => {
        const spinner = (0, ora_1.default)('Validating input...').start();
        try {
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
            const outputDir = options.output || './exports';
            if (!createOutputDirectory(outputDir)) {
                spinner.fail('Failed to create output directory');
                (0, output_1.printError)(`Could not create output directory: ${outputDir}`);
                return;
            }
            const baseFilename = sanitizeFilename(note.title || `note-${note.id}`);
            const exports = [];
            // Get AI summary
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
            // Export summary (default behavior)
            if (!options.transcript || options.all) {
                const summaryContent = options.raw
                    ? (note.notes_markdown || 'No content available')
                    : (aiSummary || note.notes_markdown || 'No summary available');
                const summaryFilename = `${baseFilename}-summary.md`;
                const summaryMarkdown = generateMarkdownContent(note, summaryContent, options.raw ? 'raw' : 'summary');
                exports.push({
                    filename: summaryFilename,
                    content: summaryMarkdown
                });
            }
            // Export transcript if requested
            if (options.transcript || options.all) {
                spinner.text = 'Fetching transcript...';
                try {
                    const transcript = await (0, getTranscript_1.default)(validatedId);
                    if (transcript) {
                        const transcriptFilename = `${baseFilename}-transcript.md`;
                        const transcriptMarkdown = generateMarkdownContent(note, transcript, 'transcript');
                        exports.push({
                            filename: transcriptFilename,
                            content: transcriptMarkdown
                        });
                    }
                    else {
                        (0, output_1.printWarning)('No transcript available for this note.');
                    }
                }
                catch (err) {
                    (0, output_1.printWarning)('Could not fetch transcript for this note.');
                }
            }
            // Write files
            const writtenFiles = [];
            for (const exportItem of exports) {
                const filePath = path.join(outputDir, exportItem.filename);
                try {
                    fs.writeFileSync(filePath, exportItem.content, 'utf8');
                    writtenFiles.push(filePath);
                }
                catch (error) {
                    spinner.fail(`Failed to write ${exportItem.filename}`);
                    (0, output_1.printError)(`Could not write file: ${filePath}`);
                    return;
                }
            }
            spinner.succeed(`Exported ${writtenFiles.length} file(s)`);
            console.log('\nExported files:');
            writtenFiles.forEach(file => console.log(`  ${file}`));
        }
        catch (err) {
            spinner.fail('Failed to export note');
            (0, output_1.printError)(err?.message || String(err));
            process.exit(1);
        }
    });
    return cmd;
}
