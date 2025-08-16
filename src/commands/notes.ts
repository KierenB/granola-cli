// src/commands/notes.ts
import { Command } from 'commander';
import ora from 'ora';
import { fetchGranolaData } from '../api/fetchData';
import getCache from '../api/getCache';
import { isAuthenticated, promptLogin } from '../utils/auth';
import { printTable, printError } from '../utils/output';
import { validateTitleFilter, validateDateFilter, validateSearchText, validateFolderId } from '../utils/validation';
import getFolders from '../api/getFolders';
import type { Document } from '../utils/types';

export function notesCommand(): Command {
  const cmd = new Command('notes')
    .description('List, search, or filter notes [--title <title>] [--date <date>] [--content <text>] [--folder <folderId>] (folderId only, not folder name)')
    .option('--title <title>', 'Filter by note title')
    .option('--date <date>', 'Filter by creation date (YYYY-MM-DD)')
    .option('--content <text>', 'Search in note content')
    .option('--folder <folderId>', 'Filter by folder ID')
    .option('--show-summary', 'Show if AI summary is available')
    .action(async (opts: { title?: string; date?: string; content?: string; folder?: string; showSummary?: boolean }) => {
      const spinner = ora('Validating filters...').start();
      try {
        // Validate and sanitize all filter inputs to prevent injection attacks
        const validatedFilters: {
          title?: string;
          date?: string;
          content?: string;
          folder?: string;
        } = {};

        if (opts.title) {
          validatedFilters.title = validateTitleFilter(opts.title);
        }
        if (opts.date) {
          validatedFilters.date = validateDateFilter(opts.date);
        }
        if (opts.content) {
          validatedFilters.content = validateSearchText(opts.content);
        }
        if (opts.folder) {
          validatedFilters.folder = validateFolderId(opts.folder);
        }

        spinner.text = 'Checking authentication...';
        const authed = await isAuthenticated();
        if (!authed) {
          spinner.fail('Not authenticated');
          await promptLogin();
          process.exit(1);
        }
        
        spinner.text = 'Fetching notes...';
        const data = await fetchGranolaData('documents');
        
        // Get cache for summary availability check
        const cache = getCache();
        const panels = cache?.state?.documentPanels;
        
        spinner.succeed('Notes loaded');
        let notes: Document[] = data.docs || [];

        // Apply validated filters
        if (validatedFilters.title) {
          notes = notes.filter(n => n.title?.toLowerCase().includes(validatedFilters.title!.toLowerCase()));
        }
        if (validatedFilters.date) {
          notes = notes.filter(n => n.created_at?.startsWith(validatedFilters.date!));
        }
        if (validatedFilters.content) {
          notes = notes.filter(n => n.notes_markdown?.toLowerCase().includes(validatedFilters.content!.toLowerCase()));
        }
        if (validatedFilters.folder) {
          // Fetch folders to resolve folder ID/title and get document IDs
          try {
            const foldersResp = await getFolders();
            const folders = foldersResp.lists ? Object.values(foldersResp.lists) : [];
            
            // Try to find folder by ID first, then by title
            let targetFolder = folders.find(f => f.id === validatedFilters.folder);
            if (!targetFolder) {
              targetFolder = folders.find(f => f.title?.toLowerCase() === validatedFilters.folder!.toLowerCase());
            }
            
            if (!targetFolder) {
              printError(`Folder not found: ${validatedFilters.folder}`);
              return;
            }
            
            // Filter notes by document IDs from the folder
            const folderDocumentIds = new Set(targetFolder.document_ids || []);
            notes = notes.filter(n => folderDocumentIds.has(n.id));
            
          } catch (err: any) {
            printError(`Failed to fetch folders: ${err?.message || String(err)}`);
            return;
          }
        }

        if (notes.length === 0) {
          printError('No notes found.');
          return;
        }

        const headers = ['ID', 'Title', 'Created', 'Source', 'Public'];
        if (opts.showSummary) {
          headers.push('AI Summary');
        }

        printTable(
          headers,
          notes.map(n => {
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
          })
        );
      } catch (err: any) {
        spinner.fail('Failed to fetch notes');
        printError(err?.message || String(err));
        process.exit(1);
      }
    });
  return cmd;
}