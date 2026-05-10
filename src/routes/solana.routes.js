import { Router } from 'express';
import solanaService from '../services/solana.service.js';
import { walletLimiter } from '../middleware/rateLimiter.js';
import {
  validateAddress,
  validateAirdrop,
  validateTransfer,
  validateImportWallet,
} from '../middleware/validator.js';

const router = Router();

/**
 * POST /api/wallet/create — Create a new wallet
 */
router.post('/create', walletLimiter, async (req, res, next) => {
  try {
    const result = await solanaService.createWallet();
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/wallet/import — Import wallet from private key
 */
router.post('/import', walletLimiter, validateImportWallet, async (req, res, next) => {
  try {
    const { privateKey } = req.body;
    const result = await solanaService.importWallet(privateKey);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/wallet/:address/balance — Get wallet balance
 */
router.get('/:address/balance', validateAddress, async (req, res, next) => {
  try {
    const result = await solanaService.getBalance(req.params.address);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/wallet/airdrop — Request devnet airdrop
 */
router.post('/airdrop', walletLimiter, validateAirdrop, async (req, res, next) => {
  try {
    const { address, amount = 1 } = req.body;
    const result = await solanaService.requestAirdrop(address, parseFloat(amount));
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/wallet/transfer — Transfer SOL
 */
router.post('/transfer', validateTransfer, async (req, res, next) => {
  try {
    const { encryptedPrivateKey, to, amount } = req.body;
    const result = await solanaService.transfer(encryptedPrivateKey, to, parseFloat(amount));
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/wallet/:address/account — Get account info
 */
router.get('/:address/account', validateAddress, async (req, res, next) => {
  try {
    const result = await solanaService.getAccountInfo(req.params.address);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/wallet/:address/history — Get transaction history
 */
router.get('/:address/history', validateAddress, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || '10', 10);
    const result = await solanaService.getTransactionHistory(req.params.address, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/wallet/:address — Forget a wallet and clear its history
 */
router.delete('/:address', validateAddress, async (req, res, next) => {
  try {
    const result = await solanaService.forgetWallet(req.params.address);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/wallet/network — Switch active network
 */
router.post('/network', async (req, res, next) => {
  try {
    const { network } = req.body;
    if (!network) {
      return res.status(400).json({ error: 'Network is required' });
    }
    const result = solanaService.switchNetwork(network);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
