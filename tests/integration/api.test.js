import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

// Mock Solana
vi.mock('@solana/web3.js', () => {
  const mockPK = { toBase58: () => 'TestPubKey11111111111111111111111111111111', toString: () => 'TestPubKey11111111111111111111111111111111' };
  return {
    Connection: vi.fn().mockImplementation(() => ({
      getBalance: vi.fn().mockResolvedValue(2000000000),
      requestAirdrop: vi.fn().mockResolvedValue('airdrop-sig-test'),
      confirmTransaction: vi.fn().mockResolvedValue({ value: { err: null } }),
      getAccountInfo: vi.fn().mockResolvedValue({ executable: false, owner: { toBase58: () => '11111111111111111111111111111111' }, rentEpoch: 0, data: Buffer.alloc(0) }),
      getSignaturesForAddress: vi.fn().mockResolvedValue([]),
      getVersion: vi.fn().mockResolvedValue({ 'solana-core': '1.17.0' }),
      getSlot: vi.fn().mockResolvedValue(99999),
    })),
    Keypair: { generate: vi.fn().mockReturnValue({ publicKey: mockPK, secretKey: new Uint8Array(64).fill(2) }), fromSecretKey: vi.fn().mockReturnValue({ publicKey: mockPK, secretKey: new Uint8Array(64).fill(2) }) },
    PublicKey: vi.fn().mockImplementation((k) => ({ toBase58: () => k, toString: () => k })),
    LAMPORTS_PER_SOL: 1000000000,
    SystemProgram: { transfer: vi.fn().mockReturnValue({}) },
    Transaction: vi.fn().mockImplementation(() => ({ add: vi.fn().mockReturnThis() })),
    sendAndConfirmTransaction: vi.fn().mockResolvedValue('transfer-sig-test'),
  };
});

vi.mock('bs58', () => ({ default: { encode: vi.fn().mockReturnValue('EncodedKey'), decode: vi.fn().mockReturnValue(new Uint8Array(64).fill(2)) } }));
vi.mock('@google/genai', () => ({ GoogleGenAI: vi.fn().mockImplementation(() => ({ models: { generateContent: vi.fn().mockResolvedValue({ text: 'Test AI response' }) } })) }));

const { app, server } = await import('../../src/server.js');

describe('API Integration Tests', () => {
  afterAll(() => { server.close(); });

  describe('GET /api/health', () => {
    it('should return healthy status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ok');
      expect(res.body.data.network).toBe('devnet');
    });
  });

  describe('GET /api/health/detailed', () => {
    it('should return detailed health info', async () => {
      const res = await request(app).get('/api/health/detailed');
      expect(res.status).toBe(200);
      expect(res.body.data.services).toHaveProperty('solana');
      expect(res.body.data.services).toHaveProperty('ai');
    });
  });

  describe('GET /', () => {
    it('should return API info', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Solana AI Teacher');
      expect(res.body.network).toBe('devnet');
    });
  });

  describe('POST /api/wallet/create', () => {
    it('should create a new wallet', async () => {
      const res = await request(app).post('/api/wallet/create');
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('publicKey');
      expect(res.body.data).toHaveProperty('encryptedPrivateKey');
    });
  });

  describe('POST /api/wallet/import', () => {
    it('should import a wallet', async () => {
      const res = await request(app).post('/api/wallet/import').send({ privateKey: 'TestKey123' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('publicKey');
    });

    it('should reject empty private key', async () => {
      const res = await request(app).post('/api/wallet/import').send({ privateKey: '' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/wallet/:address/balance', () => {
    it('should return balance', async () => {
      const res = await request(app).get('/api/wallet/TestPubKey11111111111111111111111111111111/balance');
      expect(res.status).toBe(200);
      expect(res.body.data.balanceSOL).toBe(2);
    });

    it('should reject invalid address', async () => {
      const res = await request(app).get('/api/wallet/invalid!/balance');
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/wallet/airdrop', () => {
    it('should request airdrop', async () => {
      const res = await request(app).post('/api/wallet/airdrop').send({ address: 'TestPubKey11111111111111111111111111111111', amount: 1 });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('signature');
    });

    it('should reject amount over 2 SOL', async () => {
      const res = await request(app).post('/api/wallet/airdrop').send({ address: 'TestPubKey11111111111111111111111111111111', amount: 5 });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/ai/explain', () => {
    it('should explain a topic', async () => {
      const res = await request(app).post('/api/ai/explain').send({ topic: 'wallets' });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('explanation');
    });

    it('should reject missing topic', async () => {
      const res = await request(app).post('/api/ai/explain').send({});
      expect(res.status).toBe(400);
    });

    it('should accept ELI5 mode', async () => {
      const res = await request(app).post('/api/ai/explain').send({ topic: 'wallets', mode: 'eli5' });
      expect(res.status).toBe(200);
      expect(res.body.data.mode).toBe('eli5');
    });
  });

  describe('POST /api/ai/chat', () => {
    it('should handle chat', async () => {
      const res = await request(app).post('/api/ai/chat').send({ message: 'What is Solana?' });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('response');
    });
  });

  describe('404 handling', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
