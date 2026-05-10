import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import WebSocket from 'ws';

// Mock Solana
vi.mock('@solana/web3.js', () => {
  const mockPK = { toBase58: () => 'WSTestPub1111111111111111111111111111111111', toString: () => 'WSTestPub1111111111111111111111111111111111' };
  return {
    Connection: vi.fn().mockImplementation(() => ({
      getBalance: vi.fn().mockResolvedValue(3000000000),
      requestAirdrop: vi.fn().mockResolvedValue('ws-airdrop-sig'),
      confirmTransaction: vi.fn().mockResolvedValue({ value: { err: null } }),
      getAccountInfo: vi.fn().mockResolvedValue(null),
      getSignaturesForAddress: vi.fn().mockResolvedValue([]),
      getVersion: vi.fn().mockResolvedValue({ 'solana-core': '1.17.0' }),
      getSlot: vi.fn().mockResolvedValue(11111),
    })),
    Keypair: { generate: vi.fn().mockReturnValue({ publicKey: mockPK, secretKey: new Uint8Array(64).fill(3) }), fromSecretKey: vi.fn().mockReturnValue({ publicKey: mockPK, secretKey: new Uint8Array(64).fill(3) }) },
    PublicKey: vi.fn().mockImplementation((k) => ({ toBase58: () => k, toString: () => k })),
    LAMPORTS_PER_SOL: 1000000000,
    SystemProgram: { transfer: vi.fn().mockReturnValue({}) },
    Transaction: vi.fn().mockImplementation(() => ({ add: vi.fn().mockReturnThis() })),
    sendAndConfirmTransaction: vi.fn().mockResolvedValue('ws-transfer-sig'),
  };
});

vi.mock('bs58', () => ({ default: { encode: vi.fn().mockReturnValue('EncodedKey'), decode: vi.fn().mockReturnValue(new Uint8Array(64).fill(3)) } }));
vi.mock('@google/genai', () => ({ GoogleGenAI: vi.fn().mockImplementation(() => ({ models: { generateContent: vi.fn().mockResolvedValue({ text: 'WS AI response' }) } })) }));

let server;
const TEST_PORT = 3099;

beforeAll(async () => {
  process.env.PORT = TEST_PORT.toString();
  const mod = await import('../../src/server.js');
  server = mod.server;
  await new Promise((resolve) => {
    if (server.listening) return resolve();
    server.on('listening', resolve);
  });
});

afterAll(() => { server.close(); });

/**
 * Connect to WS and wait for the welcome message before returning.
 * Returns { ws, welcome }.
 */
function connectAndWaitForWelcome() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${TEST_PORT}/ws`);
    ws.on('error', reject);
    ws.on('message', (data) => {
      const welcome = JSON.parse(data.toString());
      // Remove this listener so future messages go to test handlers
      ws.removeAllListeners('message');
      resolve({ ws, welcome });
    });
  });
}

/**
 * Send a command and collect responses until we get the expected type.
 */
function sendAndReceive(ws, message, expectedType = 'result', timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const responses = [];
    const timer = setTimeout(() => {
      ws.removeAllListeners('message');
      reject(new Error(`Timeout waiting for ${expectedType}. Got: ${JSON.stringify(responses)}`));
    }, timeoutMs);

    ws.on('message', (data) => {
      const parsed = JSON.parse(data.toString());
      responses.push(parsed);
      if (parsed.type === expectedType || parsed.type === 'error') {
        clearTimeout(timer);
        ws.removeAllListeners('message');
        resolve(responses);
      }
    });
    ws.send(JSON.stringify(message));
  });
}

describe('WebSocket Integration Tests', () => {
  it('should connect and receive welcome message', async () => {
    const { ws, welcome } = await connectAndWaitForWelcome();

    expect(welcome.type).toBe('info');
    expect(welcome.payload.message).toContain('Solana AI Teacher');
    expect(welcome.payload.commands).toBeInstanceOf(Array);
    expect(welcome.payload.sessionId).toBeTruthy();
    ws.close();
  });

  it('should handle create-wallet command', async () => {
    const { ws } = await connectAndWaitForWelcome();

    const responses = await sendAndReceive(ws, {
      type: 'command',
      payload: { command: 'create-wallet' },
    });

    const result = responses.find((r) => r.type === 'result');
    expect(result).toBeDefined();
    expect(result.payload.success).toBe(true);
    expect(result.payload.data).toHaveProperty('publicKey');
    ws.close();
  });

  it('should handle balance command', async () => {
    const { ws } = await connectAndWaitForWelcome();

    const responses = await sendAndReceive(ws, {
      type: 'command',
      payload: { command: 'balance', args: { address: 'WSTestPub1111111111111111111111111111111111' } },
    });

    const result = responses.find((r) => r.type === 'result');
    expect(result.payload.data.balanceSOL).toBe(3);
    ws.close();
  });

  it('should handle unknown command', async () => {
    const { ws } = await connectAndWaitForWelcome();

    const responses = await sendAndReceive(ws, {
      type: 'command',
      payload: { command: 'nonexistent' },
    }, 'error');

    const err = responses.find((r) => r.type === 'error');
    expect(err.payload.code).toBe('UNKNOWN_COMMAND');
    ws.close();
  });

  it('should handle invalid JSON', async () => {
    const { ws } = await connectAndWaitForWelcome();

    const response = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timeout')), 5000);
      ws.on('message', (data) => {
        clearTimeout(timer);
        ws.removeAllListeners('message');
        resolve(JSON.parse(data.toString()));
      });
      ws.send('not-json');
    });

    expect(response.type).toBe('error');
    expect(response.payload.code).toBe('INVALID_JSON');
    ws.close();
  });

  it('should handle missing args', async () => {
    const { ws } = await connectAndWaitForWelcome();

    const responses = await sendAndReceive(ws, {
      type: 'command',
      payload: { command: 'balance', args: {} },
    }, 'error');

    const err = responses.find((r) => r.type === 'error');
    expect(err.payload.code).toBe('MISSING_ARG');
    ws.close();
  });
});
