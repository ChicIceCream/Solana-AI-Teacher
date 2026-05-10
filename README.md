# Solana AI Teacher — Backend

A voice-controlled Solana teaching terminal backend built with Node.js, Express, and WebSockets. Integrates with Solana devnet and Google Gemini AI to provide an interactive blockchain learning experience.

## Features

- **Solana Integration** — Create wallets, check balances, request airdrops, transfer SOL, view transaction history (devnet only)
- **AI Teaching** — Gemini-powered explanations with "normal" and "ELI5" modes
- **REST API** — Full CRUD endpoints for all operations
- **WebSocket** — Real-time terminal streaming with JSON message protocol
- **Security** — Private key encryption (AES-256-GCM), key redaction in logs, rate limiting, input validation
- **Graceful Degradation** — Static fallback responses when AI or Solana RPC is unavailable

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express |
| WebSocket | ws |
| Solana SDK | @solana/web3.js v1 |
| AI | @google/genai (Gemini 2.5 Flash) |
| Testing | Vitest + Supertest |
| Logging | Winston |

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/ChicIceCream/Solana-AI-Teacher.git
cd Solana-AI-Teacher
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and set your GEMINI_API_KEY
```

### 3. Start the server

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

The server starts on `http://localhost:3001` with WebSocket on `ws://localhost:3001/ws`.

### 4. Verify

```bash
# Health check
curl http://localhost:3001/api/health

# Create a wallet
curl -X POST http://localhost:3001/api/wallet/create

# Explain a concept
curl -X POST http://localhost:3001/api/ai/explain \
  -H "Content-Type: application/json" \
  -d '{"topic": "wallets", "mode": "eli5"}'
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | Server port |
| `GEMINI_API_KEY` | Yes | — | Google Gemini API key |
| `SOLANA_RPC_URL` | No | `https://api.devnet.solana.com` | Solana RPC endpoint |
| `CORS_ORIGIN` | No | `http://localhost:3000` | Allowed CORS origin |
| `ENCRYPTION_KEY` | Recommended | — | 64-char hex key for wallet encryption |
| `RATE_LIMIT_MAX_REQUESTS` | No | `30` | Max requests per window |
| `LOG_LEVEL` | No | `debug` | Winston log level |

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

## Project Structure

```
├── config/index.js              # Centralized configuration
├── src/
│   ├── server.js                # Entry point
│   ├── middleware/
│   │   ├── errorHandler.js      # Global error handling
│   │   ├── rateLimiter.js       # Rate limiting
│   │   └── validator.js         # Request validation
│   ├── prompts/                 # AI prompt templates
│   ├── routes/
│   │   ├── ai.routes.js         # AI endpoints
│   │   ├── health.routes.js     # Health checks
│   │   └── solana.routes.js     # Solana endpoints
│   ├── services/
│   │   ├── ai.service.js        # Gemini AI integration
│   │   └── solana.service.js    # Solana devnet operations
│   ├── utils/
│   │   ├── crypto.js            # AES-256-GCM encryption
│   │   ├── errors.js            # Custom error classes
│   │   └── logger.js            # Winston logger
│   └── websocket/handler.js     # WebSocket message handler
├── tests/
│   ├── unit/                    # Unit tests (mocked)
│   └── integration/             # API + WebSocket tests
└── docs/
    ├── API.md                   # Full API documentation
    └── INTEGRATION.md           # Frontend integration guide
```

## Security

- **Devnet only** — Mainnet URLs are rejected at startup
- **Private key encryption** — Keys encrypted with AES-256-GCM at rest
- **Log redaction** — Base58 strings matching key patterns are auto-redacted
- **Rate limiting** — Different thresholds for general API, wallet ops, and AI
- **Input validation** — All endpoints validated with express-validator
- **Helmet** — Security headers enabled

## License

MIT
