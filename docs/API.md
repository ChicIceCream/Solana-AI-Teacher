# Solana AI Teacher — Complete Project Documentation

> **Built for the Colosseum Solana Vibeathon**
> An AI-powered, voice-enabled terminal that teaches Solana blockchain development through hands-on practice.

---

## Table of Contents

1. [Product Overview](#product-overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Backend API Reference](#backend-api-reference)
5. [Frontend Terminal Commands](#frontend-terminal-commands)
6. [AI Teaching Engine](#ai-teaching-engine)
7. [Curriculum System](#curriculum-system)
8. [Security & Safety](#security--safety)
9. [Environment Setup](#environment-setup)
10. [Key Features Summary](#key-features-summary)

---

## Product Overview

**Solana AI Teacher** is an interactive desktop-style terminal application that teaches users how to use the Solana blockchain. Instead of reading documentation, users learn by executing real Solana commands in a safe sandbox environment while an AI teacher (Google Gemini) explains every concept.

### What Makes It Unique

| Feature | Description |
|---------|-------------|
| **Learn-by-doing** | Real Solana transactions on localnet/devnet — not simulations |
| **AI Teacher** | Google Gemini explains every concept contextually |
| **Voice Control** | Speak commands using Web Speech API |
| **Voice Responses** | AI reads back explanations using Speech Synthesis |
| **Multi-user** | Switch between users (`su alice`), each with their own wallet |
| **Desktop UI** | macOS-style desktop with draggable, resizable terminal windows |
| **PDA Curriculum** | Deep educational content on Program Derived Addresses |
| **Practice Mode** | Guided step-by-step scenarios with command validation |
| **Dual Network** | Switch between localnet (instant, unlimited) and devnet |
| **Theme System** | 4 themes via dropdown — Dark, Matrix, Solana, Retro |
| **Offline Fallbacks** | Full curriculum works even without AI/internet |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Desktop  │  │ Terminal │  │  Voice   │  │ Curriculum│ │
│  │ Manager  │  │ (multi)  │  │  I/O     │  │ (static) │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────────┘ │
│       │              │             │                      │
│       └──────────────┼─────────────┘                      │
│                      │ HTTP REST                          │
├──────────────────────┼───────────────────────────────────┤
│                 BACKEND (Express.js)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  Solana  │  │  Gemini  │  │  WebSocket│ │  Health   │ │
│  │ Service  │  │  AI Svc  │  │  Handler │  │  Monitor  │ │
│  └────┬─────┘  └────┬─────┘  └──────────┘  └──────────┘ │
│       │              │                                    │
├───────┼──────────────┼───────────────────────────────────┤
│       ▼              ▼                                    │
│  Solana RPC     Google Gemini                             │
│  (localnet/     (gemini-2.5-flash)                        │
│   devnet)                                                 │
└──────────────────────────────────────────────────────────┘
```

### Directory Structure

```
solana-ai-teacher/
├── config/
│   └── index.js              # Centralized configuration
├── src/
│   ├── server.js             # Express + HTTP + WebSocket entry
│   ├── routes/
│   │   ├── health.routes.js  # Health check endpoints
│   │   ├── solana.routes.js  # Wallet & blockchain endpoints
│   │   └── ai.routes.js      # AI teaching endpoints
│   ├── services/
│   │   ├── solana.service.js # Solana RPC operations (singleton)
│   │   └── ai.service.js    # Gemini AI integration (singleton)
│   ├── middleware/
│   │   ├── errorHandler.js   # Global error handling
│   │   ├── rateLimiter.js    # Tiered rate limiting
│   │   └── validator.js      # Input validation chains
│   ├── prompts/
│   │   ├── system.js         # AI system prompt + modes
│   │   ├── eli5.js           # ELI5 fallback content
│   │   └── transaction.js    # Transaction explanation template
│   ├── websocket/
│   │   └── handler.js        # WebSocket command handler
│   └── utils/
│       ├── crypto.js         # AES-256-GCM encryption
│       ├── errors.js         # Custom error hierarchy
│       └── logger.js         # Winston logger (redacts keys)
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Desktop/      # Desktop, Taskbar, Background
│       │   └── Terminal/     # Terminal, TerminalWindow
│       ├── hooks/
│       │   ├── useVoice.js       # Speech recognition + TTS
│       │   ├── useWebSocket.js   # WebSocket client
│       │   └── useWindowManager.js # Zustand window state
│       ├── services/
│       │   ├── api.js            # REST API client
│       │   ├── commands.js       # Command router + practice watcher
│       │   └── curriculum.js     # Static educational content
│       └── styles/
│           ├── index.css         # Design tokens + global
│           ├── desktop.css       # Desktop + taskbar
│           └── terminal.css      # Terminal + themes + dropdown
├── .env.example
└── package.json
```

---

## Tech Stack

### Backend

| Technology | Purpose |
|-----------|---------|
| **Node.js ≥18** | Runtime |
| **Express 4** | REST API framework |
| **@solana/web3.js** | Solana blockchain interactions |
| **@google/genai** | Google Gemini AI (gemini-2.5-flash) |
| **ws** | WebSocket server for streaming |
| **helmet** | HTTP security headers |
| **express-rate-limit** | Tiered rate limiting |
| **express-validator** | Request validation |
| **winston** | Structured logging with key redaction |
| **AES-256-GCM** | Private key encryption at rest |
| **bs58** | Base58 encoding/decoding |
| **uuid** | WebSocket session IDs |

### Frontend

| Technology | Purpose |
|-----------|---------|
| **React 18** | UI framework |
| **Vite** | Build tool + dev server |
| **Zustand** | Window manager state |
| **Framer Motion** | Window animations |
| **react-rnd** | Draggable/resizable windows |
| **react-hot-toast** | Notifications |
| **Web Speech API** | Voice input (SpeechRecognition) |
| **Speech Synthesis** | Voice output (text-to-speech) |

---

## Backend API Reference

**Base URL:** `http://localhost:3001`

### Response Format

All endpoints return:
```json
{ "success": true, "data": { ... } }
```

Errors return:
```json
{ "success": false, "error": { "code": "ERROR_CODE", "message": "..." } }
```

---

### Health Endpoints

#### `GET /api/health`
Basic health check with uptime and current network.

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-05-09T08:00:00.000Z",
    "uptime": 123.45,
    "version": "1.0.0",
    "network": "localnet"
  }
}
```

#### `GET /api/health/detailed`
Full system health — Solana RPC + Gemini AI status + memory usage.

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "services": {
      "solana": { "healthy": true, "version": "1.17.0", "slot": 12345, "network": "localnet" },
      "ai": { "healthy": true, "model": "gemini-2.5-flash", "responsePreview": "OK" }
    },
    "memory": { "rss": "50MB", "heapUsed": "25MB" }
  }
}
```

---

### Wallet Endpoints

#### `POST /api/wallet/create`
Generate a new Solana keypair. Private key is encrypted with AES-256-GCM before returning.

**Rate limit:** 5 req/min

**Response (201):**
```json
{
  "success": true,
  "data": {
    "publicKey": "7xKXzLm...",
    "encryptedPrivateKey": "a1b2c3d4...",
    "message": "New wallet created on Solana devnet"
  }
}
```

#### `POST /api/wallet/import`
Import existing wallet from a base58 private key.

**Rate limit:** 5 req/min

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `privateKey` | string | Yes | Base58 private key |

#### `GET /api/wallet/:address/balance`
Get wallet balance in SOL and lamports.

**Validation:** Address must be valid base58 (32-44 chars)

```json
{
  "success": true,
  "data": {
    "address": "7xKX...",
    "balanceLamports": 5000000000,
    "balanceSOL": 5,
    "network": "localnet"
  }
}
```

#### `POST /api/wallet/airdrop`
Request SOL from faucet.

**Rate limit:** 5 req/min

| Field | Type | Required | Limits |
|-------|------|----------|--------|
| `address` | string | Yes | Valid Solana address |
| `amount` | number | No (default: 1) | 0.001–2 SOL (devnet), up to 1000 SOL (localnet) |

```json
{
  "success": true,
  "data": {
    "signature": "5abc...",
    "amount": 2,
    "recipient": "7xKX...",
    "network": "localnet",
    "status": "confirmed",
    "explorerUrl": "https://explorer.solana.com/tx/...?cluster=devnet"
  }
}
```

#### `POST /api/wallet/transfer`
Transfer SOL between wallets. Checks balance before sending.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `encryptedPrivateKey` | string | Yes | Sender's encrypted key |
| `to` | string | Yes | Recipient address |
| `amount` | number | Yes | SOL amount (> 0) |

```json
{
  "success": true,
  "data": {
    "signature": "5abc...",
    "amount": 0.5,
    "from": "Sender...",
    "to": "Recipient...",
    "network": "localnet",
    "status": "confirmed",
    "explorerUrl": "https://explorer.solana.com/tx/...?cluster=devnet"
  }
}
```

#### `GET /api/wallet/:address/account`
Detailed on-chain account info including owner, executable flag, rent epoch, and data length.

```json
{
  "success": true,
  "data": {
    "address": "7xKX...",
    "exists": true,
    "balanceSOL": 5,
    "balanceLamports": 5000000000,
    "executable": false,
    "owner": "11111111111111111111111111111111",
    "rentEpoch": 0,
    "dataLength": 0,
    "network": "localnet"
  }
}
```

#### `GET /api/wallet/:address/history?limit=10`
Transaction history — combines on-chain signatures with local session tracking.

```json
{
  "success": true,
  "data": {
    "address": "7xKX...",
    "onChain": [
      { "signature": "5abc...", "slot": 12345, "timestamp": "...", "status": "confirmed" }
    ],
    "local": [
      { "type": "AIRDROP", "timestamp": "...", "signature": "5abc...", "amount": 2, "status": "confirmed" }
    ],
    "network": "localnet"
  }
}
```

**Local tracking types:** `WALLET_CREATED`, `WALLET_IMPORTED`, `AIRDROP`, `TRANSFER_SENT`, `TRANSFER_RECEIVED`

#### `DELETE /api/wallet/:address`
Permanently forget a wallet and clear its transaction history from server memory.

#### `POST /api/wallet/network`
Switch active network between localnet and devnet.

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `network` | string | Yes | `localnet` or `devnet` |

---

### AI Teaching Endpoints

All AI endpoints use **Google Gemini (gemini-2.5-flash)** with graceful fallback to static content when the API is unavailable.

**Rate limit:** 15 req/min

#### `POST /api/ai/explain`
Explain a Solana concept in normal or ELI5 mode.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `topic` | string | Yes | Topic to explain (max 500 chars) |
| `mode` | string | No | `"normal"` or `"eli5"` |
| `sessionId` | string | No | For conversation context |

```json
{
  "success": true,
  "data": {
    "topic": "pdas",
    "mode": "normal",
    "explanation": "PDAs (Program Derived Addresses) are accounts owned by a program..."
  }
}
```

#### `POST /api/ai/learn`
Structured lesson on a topic — definition, how it works, key facts, and practice commands.

| Field | Type | Required |
|-------|------|----------|
| `topic` | string | Yes (max 200 chars) |

#### `POST /api/ai/lesson`
Mini-lesson with examples — what it is, why it matters, how it works, plus practice commands.

| Field | Type | Required |
|-------|------|----------|
| `topic` | string | Yes (max 200 chars) |

#### `POST /api/ai/why`
Conversational explanation of WHY a concept matters. Max 80 words.

| Field | Type | Required |
|-------|------|----------|
| `topic` | string | Yes (max 200 chars) |

#### `POST /api/ai/compare`
Side-by-side comparison of two concepts. Supports cross-chain (e.g., Solana vs Ethereum).

| Field | Type | Required |
|-------|------|----------|
| `a` | string | Yes | 
| `b` | string | Yes |

#### `POST /api/ai/chat`
Free-form Q&A with conversation history (last 20 messages per session).

| Field | Type | Required |
|-------|------|----------|
| `message` | string | Yes (max 2000 chars) |
| `sessionId` | string | No (default: `"default"`) |

#### `POST /api/ai/suggest`
Get personalized learning suggestions based on user context.

| Field | Type | Required |
|-------|------|----------|
| `context` | object | Yes (e.g., `{ "wallet": true }`) |

#### `POST /api/ai/explain-transaction`
Explain what a specific transaction did in teaching context.

| Field | Type | Required |
|-------|------|----------|
| `transaction` | object | Yes (type, amount, from, to, signature) |
| `mode` | string | No |

#### `POST /api/ai/practice`
Generate an AI-powered practice task for a scenario.

| Field | Type | Required |
|-------|------|----------|
| `scenario` | string | Yes (max 200 chars) |

---

### WebSocket API

**Endpoint:** `ws://localhost:3001/ws`

Real-time terminal streaming with session management and heartbeat.

**Client → Server:**
```json
{ "type": "command", "payload": { "command": "balance", "args": { "address": "7xKX..." } } }
```

**Server → Client:**
```json
{ "type": "result", "payload": { "success": true, "data": { ... } }, "timestamp": "..." }
{ "type": "stream", "payload": { "text": "Processing...", "done": false }, "timestamp": "..." }
{ "type": "error",  "payload": { "code": "MISSING_ARG", "message": "..." }, "timestamp": "..." }
{ "type": "info",   "payload": { "message": "Connected...", "sessionId": "uuid" }, "timestamp": "..." }
```

**Supported commands:** `create-wallet`, `import-wallet`, `balance`, `airdrop`, `transfer`, `account-info`, `history`, `explain`, `explain-transaction`, `chat`, `suggest`

**Features:**
- Auto-generated UUID session ID per connection
- Conversation history tied to session (auto-cleared on disconnect)
- 30-second heartbeat (ping/pong) to detect dead connections
- Private key redaction in logs

---

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `INVALID_JSON` | 400 | Malformed JSON body |
| `NOT_FOUND` | 404 | Route not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `SOLANA_ERROR` | 502 | Generic Solana RPC failure |
| `AI_ERROR` / `AI_UNAVAILABLE` | 502 | Gemini API failure |
| `GEMINI_API_ERROR` | 502 | Specific Gemini call failure |
| `MAINNET_BLOCKED` | 502 | Attempted mainnet access (hardcoded block) |
| `AIRDROP_LIMIT` | 502 | Airdrop exceeds per-request max |
| `AIRDROP_FAILED` | 502 | Airdrop transaction failed |
| `INSUFFICIENT_BALANCE` | 502 | Not enough SOL for transfer |
| `WALLET_CREATE_FAILED` | 502 | Keypair generation failed |
| `WALLET_IMPORT_FAILED` | 502 | Invalid private key import |
| `TRANSFER_FAILED` | 502 | Transfer transaction failed |
| `BALANCE_FAILED` | 502 | Balance lookup failed |
| `ACCOUNT_INFO_FAILED` | 502 | Account info lookup failed |
| `HISTORY_FAILED` | 502 | Transaction history lookup failed |
| `LOCALNET_UNREACHABLE` | 502 | solana-test-validator not running |
| `INVALID_NETWORK` | 502 | Unknown network name |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Frontend Terminal Commands

### Wallet Commands

| Command | Description | Requires Wallet |
|---------|-------------|:-:|
| `create-wallet` | Generate new Solana keypair | No |
| `address` | Show public key | Yes |
| `balance` | Show SOL balance | Yes |
| `airdrop [amount]` | Request SOL (default: 1) | Yes |
| `transfer [to] [amount]` | Send SOL to another address | Yes |
| `account-info` | Detailed account inspection | Yes |
| `history` | Transaction history | Yes |
| `forget-wallet --confirm` | Permanently delete wallet | Yes |

### Learning Commands (AI-powered with static fallbacks)

| Command | Description |
|---------|-------------|
| `learn [topic]` | Structured lesson on a topic |
| `lesson [topic]` | Mini-lesson with examples |
| `explain [topic]` | AI explanation of a concept |
| `eli5 [topic]` | Explain Like I'm 5 |
| `why [topic]` | Why a concept matters |
| `compare [a] [b]` | Side-by-side comparison |
| `chat [message]` | Free-form AI Q&A |
| `suggest` | Personalized next-step suggestions |

### Curriculum Commands (instant, no API)

| Command | Description |
|---------|-------------|
| `topics` | List all 10 learning topics |
| `roadmap` | 7-step learning path with progress tracking |
| `glossary [term]` | Look up any of 20+ blockchain terms |
| `examples [cmd]` | Usage examples for a command |
| `practice [scenario]` | Guided hands-on practice (7 scenarios) |
| `sandbox` | Enter localnet sandbox mode |

### System Commands

| Command | Description |
|---------|-------------|
| `whoami` | Current user, wallet, and network |
| `su [user]` | Switch user (multi-wallet support) |
| `network switch [net]` | Switch localnet/devnet |
| `clear` | Clear terminal |
| `help` | Show all commands |
| `theme` | Points to the dropdown (top-right) |

---

## AI Teaching Engine

### System Prompt Modes

The Gemini AI operates under a strict system prompt with 4 modes:

| Mode | Use Case | Max Words | Temperature |
|------|----------|-----------|-------------|
| `normal` | Standard explanations | 120 | 0.7 |
| `eli5` | Simple, analogy-based | 80 | 0.8 |
| `curriculum` | Structured lessons | 150 | 0.7 |
| `compare` | Side-by-side tables | 150 | 0.7 |

### Prompt Guardrails

- **No markdown** — plain text only (terminal-friendly)
- **Command whitelist** — AI only suggests valid terminal commands
- **Never suggests** Solana CLI, spl-token, anchor, cargo, or npm
- **No financial advice** — explicitly forbidden
- **Network awareness** — always notes devnet/localnet context

### Conversation Memory

- Per-session history (last 20 messages)
- Auto-cleared on WebSocket disconnect
- Supports context-aware follow-up questions

### Graceful Degradation

When Gemini is unavailable, every AI command falls back to curated static content:
- `explain` → topic-specific static explanations
- `eli5` → analogy-based ELI5 content (wallets = mailbox, airdrops = free samples)
- `learn/lesson/why` → full fallback curriculum
- `compare` → pre-built comparison tables
- `chat` → helpful redirect to available commands
- `suggest` → default next-step suggestions

---

## Curriculum System

### Topics (10)

`wallets`, `transactions`, `accounts`, `pdas`, `validators`, `rpc`, `smart-contracts`, `tokens`, `nfts`, `staking`

### Glossary (20+ terms)

`wallets`, `transactions`, `accounts`, `validators`, `staking`, `tokens`, `smart-contracts`, `rpc`, `lamport`, `keypair`, `blockhash`, `rent`, `epoch`, `pda`, `program-derived-address`, `bump`, `cpi`, `seeds`, `spl`, `devnet`, `localnet`, `bpf`, `signature`, `sol`, `anchor`

### Practice Scenarios (7)

| Scenario | Steps | Description |
|----------|:-----:|-------------|
| `wallet-basics` | 4 | Create wallet, get address, airdrop, check balance |
| `transfer` | 8 | Multi-user SOL transfer flow |
| `multi-wallet` | 8 | Manage alice/bob wallets |
| `inspect-account` | 6 | Deep dive into account model |
| `explore-network` | 6 | Network comparison and exploration |
| `pda-deep-dive` | 6 | Learn PDAs through glossary + lessons |
| `account-model` | 7 | Master accounts, PDAs, and rent |

### Practice Watcher System

The practice mode uses an active command-watching system:
1. User starts a scenario (`practice wallet-basics`)
2. System shows all steps and highlights Step 1
3. User types the expected command themselves
4. System validates the command and advances to the next step
5. Wrong commands still execute but show a nudge with the expected command
6. Completion is announced after all steps are done

This builds **muscle memory** — users actually type real commands, not just watch.

### Roadmap (7 steps, persisted)

Progress is saved to `localStorage` and tracked automatically:

1. **Wallets** → create-wallet, address, balance
2. **Transactions** → airdrop, transfer, history
3. **Accounts** → account-info, learn accounts
4. **PDAs** → learn pdas, glossary pda, glossary bump
5. **Tokens** → learn tokens, glossary spl
6. **Programs** → learn smart-contracts, glossary bpf
7. **Anchor** → learn anchor, glossary anchor

---

## Security & Safety

### Mainnet Protection
- **Hardcoded block** — server throws `MAINNET_BLOCKED` if any RPC URL contains "mainnet"
- Checked at boot in both config validation and SolanaService constructor
- Cannot be bypassed through environment variables

### Private Key Encryption
- **AES-256-GCM** encryption with random IV + auth tag
- Keys never stored in plaintext on server
- Encrypted keys are opaque hex strings sent to the client
- Client sends encrypted key back for signing operations
- Server decrypts only at the moment of transaction signing

### Key Redaction in Logs
- Winston logger automatically redacts base58 strings (64-88 chars)
- WebSocket handler sanitizes args before logging
- Private keys appear as `[REDACTED_KEY]` in all logs

### Rate Limiting (3 tiers)

| Tier | Limit | Applies To |
|------|-------|-----------|
| Global API | 30 req/min | All `/api/*` routes |
| Wallet ops | 5 req/min | create, import, airdrop |
| AI endpoints | 15 req/min | All `/api/ai/*` routes |

### Input Validation
- All inputs validated with `express-validator`
- Solana addresses checked against base58 regex (`/^[1-9A-HJ-NP-Za-km-z]{32,44}$/`)
- Transfer amounts must be positive
- Topic/message lengths capped (200-2000 chars)
- JSON body size limited to 1MB

### HTTP Security
- **Helmet** middleware for security headers
- **CORS** restricted to configured origins
- Credentials support enabled

---

## Environment Setup

### `.env` Configuration

```env
# Server
PORT=3001
NODE_ENV=development

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Solana (DO NOT change to mainnet)
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_LOCAL_RPC_URL=http://127.0.0.1:8899
SOLANA_WS_URL=wss://api.devnet.solana.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=30

# Encryption (generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug
```

### Running Locally

```bash
# Backend (port 3001)
npm install
npm run dev

# Frontend (port 5173)
cd frontend
npm install
npm run dev

# Optional: Local Solana validator (port 8899)
solana-test-validator
```

---

## Key Features Summary

### For Presentation / Demo

1. **Real Blockchain Transactions** — Not a simulator. Creates real wallets, sends real (devnet/localnet) SOL, and records real on-chain transactions.

2. **Google Gemini AI Teacher** — 9 AI-powered commands (explain, eli5, learn, lesson, why, compare, chat, suggest, practice) with 4 prompt modes and conversation memory.

3. **Voice Input & Output** — Speak commands via Web Speech API. AI reads back responses via Speech Synthesis. Full hands-free operation.

4. **Interactive Practice Mode** — 7 guided scenarios with command validation. Users type real commands while the system validates each step.

5. **PDA Deep-Dive Curriculum** — 5 PDA-specific glossary terms, 2 dedicated practice scenarios, comparison tables, and full learn/lesson/why content.

6. **Comprehensive Glossary** — 20+ blockchain terms with cross-references (`seeAlso`), covering wallets through PDAs to Anchor.

7. **Multi-User Terminal** — `su alice` switches to a new user context with its own wallet. Supports unlimited concurrent users.

8. **Dual Network** — Instant switching between localnet (zero latency, unlimited airdrops) and devnet (public network).

9. **Desktop UI** — macOS-style desktop with draggable/resizable terminal windows, taskbar with clock, animated particle background.

10. **4 Themes** — Dark, Matrix (green-on-black), Solana (purple), Retro (amber). Switched via glassmorphism dropdown.

11. **Offline Resilience** — Full curriculum works without internet. AI commands gracefully degrade to curated static content.

12. **Security-First** — AES-256-GCM key encryption, mainnet hardblock, 3-tier rate limiting, input validation, log redaction.

13. **7-Step Learning Roadmap** — Persistent progress tracking from Wallets → Transactions → Accounts → PDAs → Tokens → Programs → Anchor.

14. **WebSocket Streaming** — Real-time command execution with session management, heartbeat, and auto-cleanup.

15. **Character-by-Character Typing** — Terminal output types character-by-character for an authentic terminal feel.
