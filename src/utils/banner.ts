import chalk from 'chalk';

/**
 * Futuristic ASCII banner printed once at startup (PM2-friendly).
 */
export function printBanner(): void {
  const lines = [
    '',
    chalk.cyan.bold('██╗   ██╗ ██████╗ ██████╗ ████████╗███████╗██╗  ██╗'),
    chalk.cyan.bold('██║   ██║██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝╚██╗██╔╝'),
    chalk.cyan.bold('██║   ██║██║   ██║██████╔╝   ██║   █████╗   ╚███╔╝ '),
    chalk.cyan.bold('╚██╗ ██╔╝██║   ██║██╔══██╗   ██║   ██╔══╝   ██╔██╗ '),
    chalk.cyan.bold(' ╚████╔╝ ╚██████╔╝██║  ██║   ██║   ███████╗██╔╝ ██╗'),
    chalk.cyan.bold('  ╚═══╝   ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝'),
    '',
    chalk.magenta.bold('  VORTEX BOT TEMPLATE'),
    chalk.gray('  discord.js v14 · TypeScript · production-grade scaffold'),
    '',
  ];
  console.log(lines.join('\n'));
}
