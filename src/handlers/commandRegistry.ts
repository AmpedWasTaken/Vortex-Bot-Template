import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { BotCommand } from '../types/index.js';

const commandFilePattern = /\.(js|ts)$/;

export async function loadCommandsFromDirectory(directory: string): Promise<Map<string, BotCommand>> {
  const entries = await readdir(directory, { withFileTypes: true });
  const map = new Map<string, BotCommand>();

  for (const entry of entries) {
    if (!entry.isFile() || !commandFilePattern.test(entry.name)) continue;
    const filePath = join(directory, entry.name);
    const mod = (await import(pathToFileURL(filePath).href)) as { command?: BotCommand };
    const command = mod.command;
    if (!command?.data.name) {
      continue;
    }
    map.set(command.data.name, command);
  }

  return map;
}

export function commandsDirectory(): string {
  return join(fileURLToPath(import.meta.url), '..', '..', 'commands');
}
