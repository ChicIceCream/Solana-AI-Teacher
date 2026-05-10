import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @solana/web3.js before importing the service
vi.mock('@solana/web3.js', () => {
  const mockPublicKey = {
    toBase58: () => 'FakePubKey1111111111111111111111111111111111',
    toString: () => 'FakePubKey1111111111111111111111111111111111',
  };

  const mockKeypair = {
    publicKey: mockPublicKey,
    secretKey: new Uint8Array(64).fill(1),
  };

  return {
    Connection: vi.fn().mockImplementation(() => ({
      getBalance: vi.fn().mockResolvedValue(1000000000), // 1 SOL
      requestAirdrop: vi.fn().mockResolvedValue('mock-airdrop-signature-123'),
      confirmTransaction: vi.fn().mockResolvedValue({ value: { err: null } }),
      getAccountInfo: vi.fn().mockResolvedValue({
        executable: false,
        owner: { toBase58: () => '11111111111111111111111111111111' },
        rentEpoch: 0,
        data: Buffer.alloc(0),
      }),
      getSignaturesForAddress: vi.fn().mockResolvedValue([
        {
          signature: 'mock-sig-1',
          slot: 12345,
          blockTime: 1700000000,
          err: null,
          memo: null,
        },
      ]),
      getVersion: vi.fn().mockResolvedValue({ 'solana-core': '1.17.0' }),
      getSlot: vi.fn().mockResolvedValue(12345),
    })),
    Keypair: {
      generate: vi.fn().mockReturnValue(mockKeypair),
      fromSecretKey: vi.fn().mockReturnValue(mockKeypair),
    },
    PublicKey: vi.fn().mockImplementation((key) => ({
      toBase58: () => key,
      toString: () => key,
    })),
    LAMPORTS_PER_SOL: 1000000000,
    SystemProgram: {
      transfer: vi.fn().mockReturnValue({ keys: [], programId: {}, data: Buffer.alloc(0) }),
    },
    Transaction: vi.fn().mockImplementation(() => ({
      add: vi.fn().mockReturnThis(),
    })),
    sendAndConfirmTransaction: vi.fn().mockResolvedValue('mock-transfer-signature-456'),
  };
});

// Mock bs58
vi.mock('bs58', () => ({
  default: {
    encode: vi.fn().mockReturnValue('MockBase58EncodedString'),
    decode: vi.fn().mockReturnValue(new Uint8Array(64).fill(1)),
  },
}));

// Mock crypto utils
vi.mock('../../src/utils/crypto.js', () => ({
  encrypt: vi.fn().mockReturnValue('encrypted-mock-key'),
  decrypt: vi.fn().mockReturnValue('MockBase58EncodedString'),
}));

// Mock logger
vi.mock('../../src/utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock config
vi.mock('../../config/index.js', () => ({
  default: {
    solana: {
      rpcUrl: 'https://api.devnet.solana.com',
      wsUrl: 'wss://api.devnet.solana.com',
      commitment: 'confirmed',
      airdropMax: 2,
    },
    logLevel: 'error',
  },
}));

// Import service after mocks
const { default: SolanaServiceModule } = await import('../../src/services/solana.service.js');
const solanaService = SolanaServiceModule;

describe('SolanaService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createWallet', () => {
    it('should create a new wallet and return public key + encrypted key', async () => {
      const result = await solanaService.createWallet();

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('publicKey');
      expect(result.data).toHaveProperty('encryptedPrivateKey');
      expect(result.data.message).toContain('wallet created');
    });
  });

  describe('importWallet', () => {
    it('should import a wallet from private key', async () => {
      const result = await solanaService.importWallet('FakePrivateKeyBase58');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('publicKey');
      expect(result.data).toHaveProperty('encryptedPrivateKey');
      expect(result.data.message).toContain('imported');
    });
  });

  describe('getBalance', () => {
    it('should return balance in SOL', async () => {
      const result = await solanaService.getBalance('FakePubKey1111111111111111111111111111111111');

      expect(result.success).toBe(true);
      expect(result.data.balanceSOL).toBe(1); // 1 SOL
      expect(result.data.balanceLamports).toBe(1000000000);
      expect(result.data.network).toBe('devnet');
    });
  });

  describe('requestAirdrop', () => {
    it('should request an airdrop and return signature', async () => {
      const result = await solanaService.requestAirdrop(
        'FakePubKey1111111111111111111111111111111111',
        1
      );

      expect(result.success).toBe(true);
      expect(result.data.signature).toBe('mock-airdrop-signature-123');
      expect(result.data.amount).toBe(1);
      expect(result.data.network).toBe('devnet');
      expect(result.data.explorerUrl).toContain('explorer.solana.com');
    });

    it('should reject amounts over the max', async () => {
      await expect(
        solanaService.requestAirdrop('FakePubKey1111111111111111111111111111111111', 5)
      ).rejects.toThrow('Airdrop max');
    });

    it('should reject negative amounts', async () => {
      await expect(
        solanaService.requestAirdrop('FakePubKey1111111111111111111111111111111111', -1)
      ).rejects.toThrow('positive');
    });
  });

  describe('transfer', () => {
    it('should transfer SOL and return signature', async () => {
      const result = await solanaService.transfer(
        'encrypted-mock-key',
        'RecipientPubKey111111111111111111111111111',
        0.5
      );

      expect(result.success).toBe(true);
      expect(result.data.signature).toBe('mock-transfer-signature-456');
      expect(result.data.amount).toBe(0.5);
      expect(result.data.network).toBe('devnet');
    });

    it('should reject zero amounts', async () => {
      await expect(
        solanaService.transfer('encrypted-key', 'recipient', 0)
      ).rejects.toThrow('positive');
    });
  });

  describe('getAccountInfo', () => {
    it('should return account details', async () => {
      const result = await solanaService.getAccountInfo(
        'FakePubKey1111111111111111111111111111111111'
      );

      expect(result.success).toBe(true);
      expect(result.data.exists).toBe(true);
      expect(result.data.balanceSOL).toBe(1);
      expect(result.data).toHaveProperty('executable');
      expect(result.data).toHaveProperty('owner');
    });
  });

  describe('getTransactionHistory', () => {
    it('should return on-chain and local history', async () => {
      const result = await solanaService.getTransactionHistory(
        'FakePubKey1111111111111111111111111111111111'
      );

      expect(result.success).toBe(true);
      expect(result.data.onChain).toHaveLength(1);
      expect(result.data.onChain[0].signature).toBe('mock-sig-1');
      expect(result.data).toHaveProperty('local');
      expect(result.data.network).toBe('devnet');
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status', async () => {
      const result = await solanaService.healthCheck();

      expect(result.healthy).toBe(true);
      expect(result.network).toBe('devnet');
      expect(result.version).toBe('1.17.0');
    });
  });
});
