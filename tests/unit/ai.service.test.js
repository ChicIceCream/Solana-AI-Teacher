import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @google/genai
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn().mockResolvedValue({
        text: 'A wallet is a pair of cryptographic keys.',
      }),
    },
  })),
}));

vi.mock('../../config/index.js', () => ({
  default: {
    gemini: { apiKey: 'mock-api-key', model: 'gemini-2.5-flash' },
    logLevel: 'error',
  },
}));

vi.mock('../../src/utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const { default: aiService } = await import('../../src/services/ai.service.js');

describe('AIService', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('explain', () => {
    it('should explain a topic in normal mode', async () => {
      const result = await aiService.explain('wallets', 'normal');
      expect(result.success).toBe(true);
      expect(result.data.topic).toBe('wallets');
      expect(result.data.mode).toBe('normal');
      expect(result.data.explanation).toBeTruthy();
    });

    it('should explain a topic in ELI5 mode', async () => {
      const result = await aiService.explain('transactions', 'eli5');
      expect(result.success).toBe(true);
      expect(result.data.mode).toBe('eli5');
    });

    it('should use fallback when AI fails', async () => {
      const origClient = aiService.client;
      aiService.client = { models: { generateContent: vi.fn().mockRejectedValue(new Error('fail')) } };
      const result = await aiService.explain('wallets', 'normal');
      expect(result.success).toBe(true);
      expect(result.data.fallback).toBe(true);
      aiService.client = origClient;
    });
  });

  describe('explainTransaction', () => {
    it('should explain a transaction', async () => {
      const txData = { type: 'TRANSFER', amount: 1, from: 'a', to: 'b', signature: 's' };
      const result = await aiService.explainTransaction(txData, 'normal');
      expect(result.success).toBe(true);
      expect(result.data.transaction).toEqual(txData);
    });

    it('should fallback gracefully', async () => {
      const origClient = aiService.client;
      aiService.client = { models: { generateContent: vi.fn().mockRejectedValue(new Error('fail')) } };
      const result = await aiService.explainTransaction({ type: 'AIRDROP', signature: 's' });
      expect(result.success).toBe(true);
      expect(result.data.fallback).toBe(true);
      aiService.client = origClient;
    });
  });

  describe('chat', () => {
    it('should handle chat messages', async () => {
      const result = await aiService.chat('What is Solana?', 'session-1');
      expect(result.success).toBe(true);
      expect(result.data.sessionId).toBe('session-1');
    });

    it('should fallback gracefully', async () => {
      const origClient = aiService.client;
      aiService.client = { models: { generateContent: vi.fn().mockRejectedValue(new Error('fail')) } };
      const result = await aiService.chat('hello');
      expect(result.success).toBe(true);
      expect(result.data.fallback).toBe(true);
      aiService.client = origClient;
    });
  });

  describe('suggestNextSteps', () => {
    it('should suggest next steps', async () => {
      const result = await aiService.suggestNextSteps({ completed: ['create-wallet'] });
      expect(result.success).toBe(true);
      expect(result.data.suggestions).toBeTruthy();
    });
  });

  describe('healthCheck', () => {
    it('should report healthy', async () => {
      const result = await aiService.healthCheck();
      expect(result.healthy).toBe(true);
      expect(result.model).toBe('gemini-2.5-flash');
    });
  });

  describe('conversation history', () => {
    it('should maintain history per session', async () => {
      await aiService.chat('msg1', 'hist-test');
      await aiService.chat('msg2', 'hist-test');
      const history = aiService._getHistory('hist-test');
      expect(history.length).toBeGreaterThanOrEqual(2);
    });

    it('should clear history', () => {
      aiService._addToHistory('clear-test', 'user', 'hello');
      aiService.clearHistory('clear-test');
      expect(aiService._getHistory('clear-test').length).toBe(0);
    });
  });
});
