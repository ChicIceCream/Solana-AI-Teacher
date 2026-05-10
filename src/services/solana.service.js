import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import bs58 from 'bs58';
import config from '../../config/index.js';
import logger from '../utils/logger.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import { SolanaError } from '../utils/errors.js';

/**
 * SolanaService — All Solana devnet operations.
 * Hardcoded to devnet. No mainnet access possible.
 */
class SolanaService {
  constructor() {
    this.currentNetwork = 'localnet'; // Default to localnet
    this.rpcUrl = config.solana.rpcUrl;
    this.localRpcUrl = config.solana.localRpcUrl;

    if (this.rpcUrl.includes('mainnet') || this.localRpcUrl.includes('mainnet')) {
      throw new SolanaError('Mainnet access is forbidden.', 'MAINNET_BLOCKED');
    }

    this.connection = new Connection(this.localRpcUrl, {
      commitment: config.solana.commitment,
      confirmTransactionInitialTimeout: 30000,
    });

    // In-memory transaction history (per-session, for teaching purposes)
    this.transactionHistory = new Map();

    logger.info(`Solana service initialized — connected to ${this.localRpcUrl} (${this.currentNetwork})`);
  }

  /**
   * Switch active network dynamically
   */
  switchNetwork(network) {
    if (network === this.currentNetwork) {
      return {
        success: true,
        data: { network: this.currentNetwork, message: `Already on ${this.currentNetwork}` }
      };
    }

    if (network === 'localnet') {
      this.currentNetwork = 'localnet';
      this.connection = new Connection(this.localRpcUrl, {
        commitment: config.solana.commitment,
        confirmTransactionInitialTimeout: 30000,
      });
      logger.info(`Switched network to localnet (${this.localRpcUrl})`);
    } else if (network === 'devnet') {
      this.currentNetwork = 'devnet';
      this.connection = new Connection(this.rpcUrl, {
        commitment: config.solana.commitment,
        confirmTransactionInitialTimeout: 30000,
      });
      logger.info(`Switched network to devnet (${this.rpcUrl})`);
    } else {
      throw new SolanaError(`Unknown network: ${network}`, 'INVALID_NETWORK');
    }
    return {
      success: true,
      data: { network: this.currentNetwork, message: `Switched to ${this.currentNetwork}` }
    };
  }

  /**
   * Create a new wallet (keypair).
   * Returns public key and encrypted private key.
   */
  async createWallet() {
    try {
      const keypair = Keypair.generate();
      const publicKey = keypair.publicKey.toBase58();
      const secretKeyBase58 = bs58.encode(keypair.secretKey);
      const encryptedSecret = encrypt(secretKeyBase58);

      logger.info(`Wallet created: ${publicKey}`);

      this._trackTransaction(publicKey, {
        type: 'WALLET_CREATED',
        timestamp: new Date().toISOString(),
        publicKey,
      });

      return {
        success: true,
        data: {
          publicKey,
          encryptedPrivateKey: encryptedSecret,
          message: 'New wallet created on Solana devnet',
        },
      };
    } catch (error) {
      logger.error(`Wallet creation failed: ${error.message}`);
      throw new SolanaError(`Failed to create wallet: ${error.message}`, 'WALLET_CREATE_FAILED');
    }
  }

  /**
   * Import a wallet from a base58 private key.
   */
  async importWallet(privateKeyBase58) {
    try {
      const secretKey = bs58.decode(privateKeyBase58);
      const keypair = Keypair.fromSecretKey(secretKey);
      const publicKey = keypair.publicKey.toBase58();
      const encryptedSecret = encrypt(privateKeyBase58);

      logger.info(`Wallet imported: ${publicKey}`);

      this._trackTransaction(publicKey, {
        type: 'WALLET_IMPORTED',
        timestamp: new Date().toISOString(),
        publicKey,
      });

      return {
        success: true,
        data: {
          publicKey,
          encryptedPrivateKey: encryptedSecret,
          message: 'Wallet imported successfully',
        },
      };
    } catch (error) {
      logger.error(`Wallet import failed: ${error.message}`);
      throw new SolanaError(`Failed to import wallet: ${error.message}`, 'WALLET_IMPORT_FAILED');
    }
  }

  /**
   * Get balance of a wallet in SOL.
   */
  async getBalance(publicKeyStr) {
    try {
      const publicKey = new PublicKey(publicKeyStr);
      const balanceLamports = await this._withRetry(() =>
        this.connection.getBalance(publicKey)
      );
      const balanceSOL = balanceLamports / LAMPORTS_PER_SOL;

      logger.info(`Balance for ${publicKeyStr}: ${balanceSOL} SOL`);

      return {
        success: true,
        data: {
          address: publicKeyStr,
          balanceLamports,
          balanceSOL,
          network: this.currentNetwork,
        },
      };
    } catch (error) {
      if (error instanceof SolanaError) throw error;
      logger.error(`Balance check failed for ${publicKeyStr}: ${error.message}`);
      throw new SolanaError(`Failed to get balance: ${error.message}`, 'BALANCE_FAILED');
    }
  }

  /**
   * Request an airdrop of SOL (devnet only, max 2 SOL).
   */
  async requestAirdrop(publicKeyStr, amountSOL = 1) {
    try {
      if (this.currentNetwork === 'devnet' && amountSOL > config.solana.airdropMax) {
        throw new SolanaError(
          `Airdrop max is ${config.solana.airdropMax} SOL per request on devnet.`,
          'AIRDROP_LIMIT'
        );
      }
      if (this.currentNetwork === 'localnet' && amountSOL > 1000) {
        throw new SolanaError('Airdrop max is 1000 SOL per request on localnet', 'AIRDROP_LIMIT');
      }
      if (amountSOL <= 0) {
        throw new SolanaError('Airdrop amount must be positive', 'INVALID_AMOUNT');
      }

      const publicKey = new PublicKey(publicKeyStr);
      const lamports = Math.round(amountSOL * LAMPORTS_PER_SOL);

      logger.info(`Requesting airdrop: ${amountSOL} SOL to ${publicKeyStr}`);

      const signature = await this._withRetry(() =>
        this.connection.requestAirdrop(publicKey, lamports)
      );

      // Wait for confirmation
      const confirmation = await this.connection.confirmTransaction(signature, 'confirmed');

      if (confirmation.value.err) {
        throw new SolanaError('Airdrop transaction failed on-chain', 'AIRDROP_ONCHAIN_FAIL');
      }

      logger.info(`Airdrop confirmed: ${signature}`);

      this._trackTransaction(publicKeyStr, {
        type: 'AIRDROP',
        timestamp: new Date().toISOString(),
        signature,
        amount: amountSOL,
        status: 'confirmed',
      });

      return {
        success: true,
        data: {
          signature,
          amount: amountSOL,
          recipient: publicKeyStr,
          network: this.currentNetwork,
          status: 'confirmed',
          explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
        },
      };
    } catch (error) {
      if (error instanceof SolanaError) throw error;
      logger.error(`Airdrop failed: ${error.message}`);
      throw new SolanaError(`Airdrop failed: ${error.message}`, 'AIRDROP_FAILED');
    }
  }

  /**
   * Transfer SOL from one wallet to another.
   */
  async transfer(encryptedPrivateKey, toPublicKeyStr, amountSOL) {
    try {
      if (amountSOL <= 0) {
        throw new SolanaError('Transfer amount must be positive', 'INVALID_AMOUNT');
      }

      // Decrypt sender's private key
      const secretKeyBase58 = decrypt(encryptedPrivateKey);
      const secretKey = bs58.decode(secretKeyBase58);
      const fromKeypair = Keypair.fromSecretKey(secretKey);
      const fromPublicKey = fromKeypair.publicKey;
      const toPublicKey = new PublicKey(toPublicKeyStr);

      const lamports = Math.round(amountSOL * LAMPORTS_PER_SOL);

      // Check balance first
      const balance = await this.connection.getBalance(fromPublicKey);
      if (balance < lamports) {
        throw new SolanaError(
          `Insufficient balance: ${balance / LAMPORTS_PER_SOL} SOL available, ${amountSOL} SOL needed`,
          'INSUFFICIENT_BALANCE'
        );
      }

      logger.info(`Transfer: ${amountSOL} SOL from ${fromPublicKey.toBase58()} to ${toPublicKeyStr}`);

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromPublicKey,
          toPubkey: toPublicKey,
          lamports,
        })
      );

      const signature = await this._withRetry(() =>
        sendAndConfirmTransaction(this.connection, transaction, [fromKeypair])
      );

      logger.info(`Transfer confirmed: ${signature}`);

      const fromAddress = fromPublicKey.toBase58();
      this._trackTransaction(fromAddress, {
        type: 'TRANSFER_SENT',
        timestamp: new Date().toISOString(),
        signature,
        amount: amountSOL,
        to: toPublicKeyStr,
        status: 'confirmed',
      });
      this._trackTransaction(toPublicKeyStr, {
        type: 'TRANSFER_RECEIVED',
        timestamp: new Date().toISOString(),
        signature,
        amount: amountSOL,
        from: fromAddress,
        status: 'confirmed',
      });

      return {
        success: true,
        data: {
          signature,
          amount: amountSOL,
          from: fromAddress,
          to: toPublicKeyStr,
          network: this.currentNetwork,
          status: 'confirmed',
          explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
        },
      };
    } catch (error) {
      if (error instanceof SolanaError) throw error;
      logger.error(`Transfer failed: ${error.message}`);
      throw new SolanaError(`Transfer failed: ${error.message}`, 'TRANSFER_FAILED');
    }
  }

  /**
   * Get detailed account info for an address.
   */
  async getAccountInfo(publicKeyStr) {
    try {
      const publicKey = new PublicKey(publicKeyStr);
      const accountInfo = await this._withRetry(() =>
        this.connection.getAccountInfo(publicKey)
      );
      const balance = await this.connection.getBalance(publicKey);

      const data = {
        address: publicKeyStr,
        exists: accountInfo !== null,
        balanceSOL: balance / LAMPORTS_PER_SOL,
        balanceLamports: balance,
        network: this.currentNetwork,
      };

      if (accountInfo) {
        data.executable = accountInfo.executable;
        data.owner = accountInfo.owner.toBase58();
        data.rentEpoch = accountInfo.rentEpoch;
        data.dataLength = accountInfo.data.length;
      }

      logger.info(`Account info retrieved: ${publicKeyStr}`);

      return { success: true, data };
    } catch (error) {
      if (error instanceof SolanaError) throw error;
      logger.error(`Account info failed for ${publicKeyStr}: ${error.message}`);
      throw new SolanaError(`Failed to get account info: ${error.message}`, 'ACCOUNT_INFO_FAILED');
    }
  }

  /**
   * Get transaction history for an address.
   * Combines on-chain signatures with local tracking.
   */
  async getTransactionHistory(publicKeyStr, limit = 10) {
    try {
      const publicKey = new PublicKey(publicKeyStr);

      // Fetch recent signatures from chain
      const signatures = await this._withRetry(() =>
        this.connection.getSignaturesForAddress(publicKey, { limit })
      );

      const onChainHistory = signatures.map((sig) => ({
        signature: sig.signature,
        slot: sig.slot,
        timestamp: sig.blockTime ? new Date(sig.blockTime * 1000).toISOString() : null,
        status: sig.err ? 'failed' : 'confirmed',
        memo: sig.memo || null,
      }));

      // Merge with local tracking
      const localHistory = this.transactionHistory.get(publicKeyStr) || [];

      return {
        success: true,
        data: {
          address: publicKeyStr,
          onChain: onChainHistory,
          local: localHistory,
          network: this.currentNetwork,
        },
      };
    } catch (error) {
      if (error instanceof SolanaError) throw error;
      logger.error(`Transaction history failed for ${publicKeyStr}: ${error.message}`);
      throw new SolanaError(`Failed to get transaction history: ${error.message}`, 'HISTORY_FAILED');
    }
  }

  /**
   * Track a transaction locally for teaching context.
   */
  _trackTransaction(address, txData) {
    if (!this.transactionHistory.has(address)) {
      this.transactionHistory.set(address, []);
    }
    const history = this.transactionHistory.get(address);
    history.unshift(txData); // newest first
    // Keep only last 50
    if (history.length > 50) {
      history.splice(50);
    }
  }

  /**
   * Forget a wallet and clear its transaction history.
   */
  async forgetWallet(publicKeyStr) {
    try {
      if (this.transactionHistory.has(publicKeyStr)) {
        this.transactionHistory.delete(publicKeyStr);
        logger.info(`Forgot wallet and cleared history for: ${publicKeyStr}`);
      }
      return {
        success: true,
        data: {
          message: 'Wallet history cleared successfully',
        },
      };
    } catch (error) {
      logger.error(`Forget wallet failed for ${publicKeyStr}: ${error.message}`);
      throw new SolanaError(`Failed to forget wallet: ${error.message}`, 'FORGET_FAILED');
    }
  }

  /**
   * Retry wrapper with exponential backoff for RPC calls.
   */
  async _withRetry(fn, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        const isRetryable =
          error.message?.includes('429') ||
          error.message?.includes('timeout') ||
          error.message?.includes('ECONNRESET') ||
          error.message?.includes('503');

        if (attempt === maxRetries || !isRetryable) {
          if ((error.message?.includes('fetch failed') || error.message?.includes('ECONNREFUSED')) && this.currentNetwork === 'localnet') {
            throw new SolanaError('Cannot connect to localnet. Please make sure "solana-test-validator" is running in your terminal.', 'LOCALNET_UNREACHABLE');
          }
          throw error;
        }

        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        logger.warn(`RPC retry ${attempt}/${maxRetries} after ${delay}ms: ${error.message}`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Check if the RPC connection is healthy.
   */
  async healthCheck() {
    try {
      const version = await this.connection.getVersion();
      const slot = await this.connection.getSlot();
      return {
        healthy: true,
        version: version['solana-core'],
        slot,
        network: this.currentNetwork,
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        network: this.currentNetwork,
      };
    }
  }
}

// Singleton
const solanaService = new SolanaService();
export default solanaService;
