// src/commands/note.ts
import { Command } from 'commander';
import ora from 'ora';
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

export function noteCommand(): Command {
  const cmd = new Command('note')
    .description('Show details and transcript for a specific note')
    .argument('<id>', 'Note ID')
    .option('-t, --transcript-only', 'Show only the transcript')
    .option('-s, --summary-only', 'Show only the AI summary')
    .option('-r, --raw', 'Show raw content without formatting')
    .action(async (id: string, options: { transcriptOnly?: boolean; summaryOnly?: boolean; raw?: boolean }) => {
      const spinner = ora('Validating input...').start();
      try {
        // Validate and sanitize the note ID
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
        
        // Try to get AI-generated summary from cache
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
        
        // Fetch transcript only if explicitly requested
        let transcript: string | null = null;
        if (options.transcriptOnly || (cmd.opts().transcript)) {
          spinner.text = 'Fetching transcript...';
          try {
            transcript = await getTranscript(validatedId);
          } catch (err) {
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
          } else {
            console.log(aiSummary);
          }
        } else if (!aiSummary && !options.transcriptOnly) {
          // Show original notes if no AI summary and not transcript-only
          if (note.notes_markdown) {
            console.log(`\n--- Original Notes ---\n`);
            console.log(note.notes_markdown);
          } else {
            printWarning('\nNo AI summary available for this note.');
          }
        }
        
        // Show transcript only if explicitly requested
        if (transcript && (options.transcriptOnly || cmd.opts().transcript)) {
          console.log(`\n--- Transcript ---\n`);
          console.log(transcript);
        } else if ((options.transcriptOnly || cmd.opts().transcript) && !transcript) {
          printWarning('\nNo transcript available for this note.');
        }
        
      } catch (err: any) {
        spinner.fail('Failed to fetch note');
        printError(err?.message || String(err));
        process.exit(1);
      }
    });
  return cmd;
}