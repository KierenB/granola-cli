// src/commands/export.ts
import { Command } from 'commander';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';
import getTranscript from '../api/getTranscript';
import { fetchGranolaData } from '../api/fetchData';
import getCache from '../api/getCache';
import { getPanelId } from '../utils/getPanelId';
import { convertDocumentToMarkdown } from '../utils/convertJsonNodes';
import convertHtmlToMarkdown from '../utils/convertHtmlToMarkdown';
import { isAuthenticated, promptLogin } from '../utils/auth';
import { printError, printWarning } from '../utils/output';
import { validateNoteId } from '../utils/validation';
import type { Document } from '../utils/types';

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function createOutputDirectory(outputPath: string): boolean {
  try {
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
    return true;
  } catch (error) {
    return false;
  }
}

function generateMarkdownContent(note: Document, content: string, type: 'summary' | 'transcript' | 'raw'): string {
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

export function exportCommand(): Command {
  const cmd = new Command('export')
    .description('Export note content as markdown')
    .argument('<id>', 'Note ID to export')
    .option('--transcript', 'Export transcript instead of summary')
    .option('--all', 'Export both summary and transcript')
    .option('--raw', 'Export raw content without formatting')
    .option('-o, --output <directory>', 'Output directory', './exports')
    .action(async (id: string, options: { 
      transcript?: boolean; 
      all?: boolean; 
      raw?: boolean; 
      output?: string; 
    }) => {
      const spinner = ora('Validating input...').start();
      try {
        const validatedId = validateNoteId(id);
        
        spinner.text = 'Checking authentication...';
        const authed = await isAuthenticated();
        if (!authed) {
          spinner.fail('Not authenticated');
          await promptLogin();
          process.exit(1);
        }
        
        spinner.text = 'Fetching note details...';
        const data = await fetchGranolaData('documents');
        const note: Document | undefined = (data.docs || []).find(n => n.id === validatedId);
        
        if (!note) {
          spinner.fail('Note not found');
          printError('No note found with the given ID.');
          return;
        }

        const outputDir = options.output || './exports';
        if (!createOutputDirectory(outputDir)) {
          spinner.fail('Failed to create output directory');
          printError(`Could not create output directory: ${outputDir}`);
          return;
        }

        const baseFilename = sanitizeFilename(note.title || `note-${note.id}`);
        const exports: Array<{ filename: string; content: string }> = [];

        // Get AI summary
        let aiSummary: string | null = null;
        const cache = getCache();
        
        if (cache?.state?.documentPanels) {
          const panels = cache.state.documentPanels;
          const panelId = getPanelId(panels, validatedId);
          
          if (panelId && panels[validatedId] && panels[validatedId][panelId]) {
            const panelData = panels[validatedId][panelId];
            
            if (panelData.content) {
              aiSummary = convertDocumentToMarkdown(panelData.content);
            } else if (panelData.original_content) {
              aiSummary = convertHtmlToMarkdown(panelData.original_content);
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
            const transcript = await getTranscript(validatedId);
            if (transcript) {
              const transcriptFilename = `${baseFilename}-transcript.md`;
              const transcriptMarkdown = generateMarkdownContent(note, transcript, 'transcript');
              
              exports.push({
                filename: transcriptFilename,
                content: transcriptMarkdown
              });
            } else {
              printWarning('No transcript available for this note.');
            }
          } catch (err) {
            printWarning('Could not fetch transcript for this note.');
          }
        }

        // Write files
        const writtenFiles: string[] = [];
        for (const exportItem of exports) {
          const filePath = path.join(outputDir, exportItem.filename);
          try {
            fs.writeFileSync(filePath, exportItem.content, 'utf8');
            writtenFiles.push(filePath);
          } catch (error) {
            spinner.fail(`Failed to write ${exportItem.filename}`);
            printError(`Could not write file: ${filePath}`);
            return;
          }
        }

        spinner.succeed(`Exported ${writtenFiles.length} file(s)`);
        console.log('\nExported files:');
        writtenFiles.forEach(file => console.log(`  ${file}`));
        
      } catch (err: any) {
        spinner.fail('Failed to export note');
        printError(err?.message || String(err));
        process.exit(1);
      }
    });
  return cmd;
}