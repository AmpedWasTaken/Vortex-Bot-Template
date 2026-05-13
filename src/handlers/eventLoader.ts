import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Client } from 'discord.js';
import type { BotEvent } from '../types/index.js';

const eventFilePattern = /\.(js|ts)$/;

export async function loadEventsFromDirectory(directory: string): Promise<BotEvent[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const events: BotEvent[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || !eventFilePattern.test(entry.name)) continue;
    const filePath = join(directory, entry.name);
    const mod = (await import(filePath)) as { event?: BotEvent };
    const event = mod.event;
    if (!event?.name) continue;
    events.push(event);
  }

  return events;
}

export function eventsDirectory(): string {
  return join(fileURLToPath(import.meta.url), '..', '..', 'events');
}

export function registerEvents(client: Client, events: BotEvent[]): void {
  for (const event of events) {
    if (event.once) {
      client.once(event.name, (...args) => {
        void event.execute(...args);
      });
    } else {
      client.on(event.name, (...args) => {
        void event.execute(...args);
      });
    }
  }
}
