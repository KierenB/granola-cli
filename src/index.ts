// src/index.ts
import { Command } from 'commander';
import { foldersCommand } from './commands/folders';
import { notesCommand } from './commands/notes';
import { noteCommand } from './commands/note';
import { createCommand } from './commands/create';
import { exportCommand } from './commands/export';

const program = new Command();

program
  .name('granola')
  .description('Granola CLI - Manage your notes and folders')
  .version('1.0.0');

program.addCommand(foldersCommand());
program.addCommand(notesCommand());
program.addCommand(noteCommand());
program.addCommand(createCommand());
program.addCommand(exportCommand());

program.parseAsync(process.argv);