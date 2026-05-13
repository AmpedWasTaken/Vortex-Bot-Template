import type { Logger } from '../services/logger.js';

type ShutdownHandler = () => Promise<void> | void;

/**
 * PM2-friendly graceful shutdown hooks for SIGINT/SIGTERM.
 */
export function registerGracefulShutdown(handlers: ShutdownHandler[], logger?: Logger): void {
  let shuttingDown = false;

  const run = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger?.warn(`Handling ${signal}`);
    for (const handler of handlers) {
      await handler();
    }
    process.exit(0);
  };

  process.on('SIGINT', () => {
    void run('SIGINT');
  });
  process.on('SIGTERM', () => {
    void run('SIGTERM');
  });
}
