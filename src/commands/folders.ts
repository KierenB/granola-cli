// src/commands/folders.ts
import { Command } from 'commander';
import ora from 'ora';
import getFolders from '../api/getFolders';
import { isAuthenticated, promptLogin } from '../utils/auth';
import { printTable, printError } from '../utils/output';
import type { Folder } from '../utils/types';

export function foldersCommand(): Command {
  const cmd = new Command('folders')
    .description('List all folders')
    .action(async () => {
      const spinner = ora('Fetching folders...').start();
      try {
        const authed = await isAuthenticated();
        if (!authed) {
          spinner.fail('Not authenticated');
          await promptLogin();
          process.exit(1);
        }
        const foldersResp = await getFolders();
        spinner.succeed('Folders loaded');
        const folders: Folder[] = foldersResp.lists ? Object.values(foldersResp.lists) : [];
        if (folders.length === 0) {
          printError('No folders found.');
          return;
        }
        printTable(
          ['ID', 'Title', 'Notes', 'Created'],
          folders.map((f) => [
            f.id || '',
            f.title || '',
            (f.document_ids?.length ?? 0).toString(),
            f.created_at ? new Date(f.created_at).toLocaleString() : ''
          ])
        );
      } catch (err: any) {
        spinner.fail('Failed to fetch folders');
        printError(err?.message || String(err));
        process.exit(1);
      }
    });
  return cmd;
}