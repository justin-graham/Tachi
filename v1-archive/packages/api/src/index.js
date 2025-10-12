import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { createApp } from './app.js';
import { logger } from './shared/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadEnv = () => {
  const localEnv = path.join(__dirname, '../.env.local');
  const defaultEnv = path.join(__dirname, '../.env');

  if (fs.existsSync(localEnv)) {
    dotenv.config({ path: localEnv });
  } else if (fs.existsSync(defaultEnv)) {
    dotenv.config({ path: defaultEnv });
  } else {
    dotenv.config();
  }
};

loadEnv();

const PORT = parseInt(process.env.PORT || '3001', 10);
const app = createApp();

app.listen(PORT, () => {
  logger.info(`Tachi API listening on port ${PORT}`);
});

export default app;
