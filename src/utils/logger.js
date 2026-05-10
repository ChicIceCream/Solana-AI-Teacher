import winston from 'winston';
import config from '../../config/index.js';

// Custom format to redact private keys (base58 strings ~88 chars)
const redactSecrets = winston.format((info) => {
  if (typeof info.message === 'string') {
    // Redact base58 strings that look like private keys (64-88 chars)
    info.message = info.message.replace(
      /[1-9A-HJ-NP-Za-km-z]{64,88}/g,
      '[REDACTED_KEY]'
    );
  }
  return info;
});

const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    redactSecrets(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'solana-ai-teacher' },
  transports: [
    // Console transport — colorized for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} [${service}] ${level}: ${message}${metaStr}`;
        })
      ),
    }),
  ],
});

// Add file transport in production
if (!config.isDev) {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5,
    })
  );
}

export default logger;
