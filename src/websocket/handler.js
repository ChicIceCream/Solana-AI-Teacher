import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import solanaService from '../services/solana.service.js';
import aiService from '../services/ai.service.js';

/**
 * WebSocket handler for terminal streaming.
 *
 * Message protocol:
 *
 * Client → Server:
 * { "type": "command", "payload": { "command": "...", "args": {...} } }
 *
 * Server → Client:
 * { "type": "result", "payload": { "success": true, "data": {...} } }
 * { "type": "stream", "payload": { "text": "...", "done": false } }
 * { "type": "error", "payload": { "code": "...", "message": "..." } }
 * { "type": "info", "payload": { "message": "..." } }
 */

/**
 * Setup WebSocket server handlers.
 * @param {import('ws').WebSocketServer} wss
 */
export function setupWebSocketHandlers(wss) {
  wss.on('connection', (ws, req) => {
    const sessionId = uuidv4();
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    logger.info(`WebSocket connected: ${sessionId} from ${clientIp}`);

    // Send welcome message
    send(ws, 'info', {
      message: 'Connected to Solana AI Teacher terminal',
      sessionId,
      network: 'devnet',
      commands: [
        'create-wallet',
        'import-wallet',
        'balance',
        'airdrop',
        'transfer',
        'account-info',
        'history',
        'explain',
        'chat',
        'suggest',
      ],
    });

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type !== 'command' || !message.payload?.command) {
          return send(ws, 'error', {
            code: 'INVALID_MESSAGE',
            message: 'Expected { type: "command", payload: { command: "...", args: {...} } }',
          });
        }

        const { command, args = {} } = message.payload;
        logger.info(`WS command: ${command}`, { sessionId, args: sanitizeArgs(args) });

        await handleCommand(ws, command, args, sessionId);
      } catch (error) {
        if (error instanceof SyntaxError) {
          send(ws, 'error', { code: 'INVALID_JSON', message: 'Message must be valid JSON' });
        } else {
          logger.error(`WS error: ${error.message}`, { sessionId });
          send(ws, 'error', { code: 'INTERNAL_ERROR', message: error.message });
        }
      }
    });

    ws.on('close', () => {
      logger.info(`WebSocket disconnected: ${sessionId}`);
      aiService.clearHistory(sessionId);
    });

    ws.on('error', (error) => {
      logger.error(`WebSocket error: ${error.message}`, { sessionId });
    });

    // Heartbeat
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });
  });

  // Heartbeat interval — close dead connections
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        logger.info('Terminating dead WebSocket connection');
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => clearInterval(heartbeatInterval));
}

/**
 * Route a command to the appropriate handler.
 */
async function handleCommand(ws, command, args, sessionId) {
  send(ws, 'stream', { text: `Processing: ${command}...`, done: false });

  try {
    let result;

    switch (command) {
      case 'create-wallet':
        result = await solanaService.createWallet();
        break;

      case 'import-wallet':
        if (!args.privateKey) {
          return send(ws, 'error', { code: 'MISSING_ARG', message: 'privateKey is required' });
        }
        result = await solanaService.importWallet(args.privateKey);
        break;

      case 'balance':
        if (!args.address) {
          return send(ws, 'error', { code: 'MISSING_ARG', message: 'address is required' });
        }
        result = await solanaService.getBalance(args.address);
        break;

      case 'airdrop':
        if (!args.address) {
          return send(ws, 'error', { code: 'MISSING_ARG', message: 'address is required' });
        }
        result = await solanaService.requestAirdrop(args.address, args.amount || 1);
        break;

      case 'transfer':
        if (!args.encryptedPrivateKey || !args.to || !args.amount) {
          return send(ws, 'error', {
            code: 'MISSING_ARG',
            message: 'encryptedPrivateKey, to, and amount are required',
          });
        }
        result = await solanaService.transfer(args.encryptedPrivateKey, args.to, args.amount);
        break;

      case 'account-info':
        if (!args.address) {
          return send(ws, 'error', { code: 'MISSING_ARG', message: 'address is required' });
        }
        result = await solanaService.getAccountInfo(args.address);
        break;

      case 'history':
        if (!args.address) {
          return send(ws, 'error', { code: 'MISSING_ARG', message: 'address is required' });
        }
        result = await solanaService.getTransactionHistory(args.address, args.limit || 10);
        break;

      case 'explain':
        if (!args.topic) {
          return send(ws, 'error', { code: 'MISSING_ARG', message: 'topic is required' });
        }
        result = await aiService.explain(args.topic, args.mode || 'normal', sessionId);
        break;

      case 'explain-transaction':
        if (!args.transaction) {
          return send(ws, 'error', { code: 'MISSING_ARG', message: 'transaction object is required' });
        }
        result = await aiService.explainTransaction(args.transaction, args.mode || 'normal', sessionId);
        break;

      case 'chat':
        if (!args.message) {
          return send(ws, 'error', { code: 'MISSING_ARG', message: 'message is required' });
        }
        result = await aiService.chat(args.message, sessionId);
        break;

      case 'suggest':
        result = await aiService.suggestNextSteps(args.context || {}, sessionId);
        break;

      default:
        return send(ws, 'error', {
          code: 'UNKNOWN_COMMAND',
          message: `Unknown command: ${command}. Use one of: create-wallet, import-wallet, balance, airdrop, transfer, account-info, history, explain, chat, suggest`,
        });
    }

    send(ws, 'result', result);
  } catch (error) {
    logger.error(`Command ${command} failed: ${error.message}`, { sessionId });
    send(ws, 'error', {
      code: error.code || 'COMMAND_FAILED',
      message: error.message,
    });
  }
}

/**
 * Send a typed message to a WebSocket client.
 */
function send(ws, type, payload) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({ type, payload, timestamp: new Date().toISOString() }));
  }
}

/**
 * Sanitize args for logging (remove private keys).
 */
function sanitizeArgs(args) {
  const sanitized = { ...args };
  if (sanitized.privateKey) sanitized.privateKey = '[REDACTED]';
  if (sanitized.encryptedPrivateKey) sanitized.encryptedPrivateKey = '[REDACTED]';
  return sanitized;
}

export default { setupWebSocketHandlers };
