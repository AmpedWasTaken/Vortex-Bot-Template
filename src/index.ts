import { loadConfig } from './config/index.js';
import { printBanner } from './utils/banner.js';

printBanner();
const config = loadConfig();
console.log(`Vortex scaffold ready (${config.nodeEnv}).`);
