I'm building a voice-controlled Solana teaching terminal for a hackathon.

ARCHITECTURE:
- Backend: Node.js + Express + WebSockets
- Frontend: React terminal UI (I'm handling this separately)
- Your job: Complete backend implementation + testing

BACKEND REQUIREMENTS:

1. SOLANA INTEGRATION (@solana/web3.js):
   - Connect to devnet only
   - Wallet operations: create, import, balance
   - Commands: airdrop, transfer, account info
   - Transaction history tracking
   - Error handling for all RPC calls

2. AI INTEGRATION (Google Generative AI):
   - Gemini API for explanations
   - Prompt engineering for teaching
   - Two modes: "normal" and "ELI5"
   - Context-aware responses

3. API SERVER:
   - REST endpoints for each command
   - WebSocket for terminal streaming
   - CORS configured
   - Rate limiting
   - Request validation
   - Comprehensive logging

4. TESTING:
   - Unit tests for Solana operations
   - Integration tests for API
   - Mock tests for external APIs
   - All tests must pass

5. DEPLOYMENT READY:
   - Environment variable setup
   - Health check endpoint
   - Error monitoring
   - API documentation

PROJECT STRUCTURE:
Create organized folders: src/, tests/, config/
Use ES6 modules
Include package.json with all dependencies

DELIVERABLES:
1. Complete working backend
2. Test suite (all passing)
3. API documentation
4. README with setup instructions
5. Integration guide for frontend

CONSTRAINTS:
- Devnet only (hardcoded, no mainnet option)
- No private key exposure in logs
- Graceful degradation if APIs fail
- Idempotent operations where possible

Start by creating the project structure and package.json.
Then implement each service layer-by-layer.
Test as you go.

Let me know when you've completed each major milestone.