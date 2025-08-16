"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
const commander_1 = require("commander");
const folders_1 = require("./commands/folders");
const notes_1 = require("./commands/notes");
const note_1 = require("./commands/note");
const create_1 = require("./commands/create");
const export_1 = require("./commands/export");
const program = new commander_1.Command();
program
    .name('granola')
    .description('Granola CLI - Manage your notes and folders')
    .version('1.0.0');
program.addCommand((0, folders_1.foldersCommand)());
program.addCommand((0, notes_1.notesCommand)());
program.addCommand((0, note_1.noteCommand)());
program.addCommand((0, create_1.createCommand)());
program.addCommand((0, export_1.exportCommand)());
program.parseAsync(process.argv);
