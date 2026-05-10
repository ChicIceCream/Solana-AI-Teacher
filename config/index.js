import dotenv from 'dotenv';
dotenv.config();

const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  // Solana
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    localRpcUrl: process.env.SOLANA_LOCAL_RPC_URL || 'http://127.0.0.1:8899',
    wsUrl: process.env.SOLANA_WS_URL || 'wss://api.devnet.solana.com',
    commitment: 'confirmed',
    airdropMax: 2, // SOL for devnet
  },

  // Gemini AI
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: 'gemini-2.5-flash',
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '30', 10),
  },

  // Encryption
  encryptionKey: process.env.ENCRYPTION_KEY || '',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'debug',
};

// Validate critical config
const validate = () => {
  const warnings = [];
  if (!config.gemini.apiKey) {
    warnings.push('GEMINI_API_KEY is not set — AI features will use fallback responses');
  }
  if (!config.encryptionKey) {
    warnings.push('ENCRYPTION_KEY is not set — wallet encryption will use a default key (INSECURE)');
  }
  // Enforce no mainnet
  if (config.solana.rpcUrl.includes('mainnet') || config.solana.localRpcUrl.includes('mainnet')) {
    throw new Error('FATAL: Mainnet is not allowed. This application is for testing only.');
  }
  return warnings;
};

config.validate = validate;

export default config;
