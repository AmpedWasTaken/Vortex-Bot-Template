import { loadConfig } from './config/index.js';
import { createLogger } from './services/logger.js';
import { printBanner } from './utils/banner.js';

printBanner();
const config = loadConfig();
const logger = createLogger(config);
logger.info('Vortex scaffold ready', { nodeEnv: config.nodeEnv });
