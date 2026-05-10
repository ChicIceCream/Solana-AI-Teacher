import { GoogleGenAI } from '@google/genai';
import config from '../../config/index.js';
import logger from '../utils/logger.js';
import { AIError } from '../utils/errors.js';
import { buildSystemPrompt } from '../prompts/system.js';
import { buildTransactionPrompt } from '../prompts/transaction.js';
import { getELI5Fallback } from '../prompts/eli5.js';

/**
 * AIService — Google Gemini integration for teaching Solana concepts.
 * Supports "normal" and "eli5" modes with graceful fallback.
 */
class AIService {
  constructor() {
    this.available = false;
    this.client = null;

    if (config.gemini.apiKey) {
      try {
        this.client = new GoogleGenAI({ apiKey: config.gemini.apiKey });
        this.available = true;
        logger.info('AI service initialized with Gemini API');
      } catch (error) {
        logger.warn(`AI service initialization failed: ${error.message}`);
      }
    } else {
      logger.warn('AI service unavailable — no GEMINI_API_KEY set');
    }

    // Session-based conversation histories
    this.conversations = new Map();
  }

  /**
   * Explain a Solana topic.
   * @param {string} topic - The topic to explain
   * @param {string} mode - "normal" or "eli5"
   * @param {string} sessionId - Optional session ID for context
   */
  async explain(topic, mode = 'normal', sessionId = null) {
    const prompt = `Explain the following Solana concept: "${topic}"`;

    try {
      const response = await this._generate(prompt, mode, sessionId);
      return {
        success: true,
        data: {
          topic,
          mode,
          explanation: response,
        },
      };
    } catch (error) {
      // Graceful fallback
      logger.warn(`AI explain failed, using fallback: ${error.message}`);
      const fallback = mode === 'eli5'
        ? getELI5Fallback(topic)
        : this._getStaticFallback(topic);

      return {
        success: true,
        data: {
          topic,
          mode,
          explanation: fallback,
          fallback: true,
        },
      };
    }
  }

  /**
   * Explain a transaction in teaching context.
   */
  async explainTransaction(txData, mode = 'normal', sessionId = null) {
    const prompt = buildTransactionPrompt(txData);

    try {
      const response = await this._generate(prompt, mode, sessionId);
      return {
        success: true,
        data: {
          explanation: response,
          transaction: txData,
          mode,
        },
      };
    } catch (error) {
      logger.warn(`AI transaction explain failed: ${error.message}`);
      return {
        success: true,
        data: {
          explanation: this._buildTransactionFallback(txData),
          transaction: txData,
          mode,
          fallback: true,
        },
      };
    }
  }

  /**
   * Suggest next learning steps based on context.
   */
  async suggestNextSteps(context, sessionId = null) {
    const prompt = `Based on what the user has done so far in our Solana teaching terminal, suggest 3-5 next steps they could try.

What they've done:
${JSON.stringify(context, null, 2)}

Suggest practical commands they can run in the terminal, along with brief explanations of what they'll learn.`;

    try {
      const response = await this._generate(prompt, 'normal', sessionId);
      return {
        success: true,
        data: { suggestions: response },
      };
    } catch (error) {
      return {
        success: true,
        data: {
          suggestions: this._getDefaultSuggestions(context),
          fallback: true,
        },
      };
    }
  }

  /**
   * Free-form chat about Solana.
   */
  async chat(message, sessionId = 'default') {
    try {
      const response = await this._generate(message, 'normal', sessionId);
      return {
        success: true,
        data: {
          response,
          sessionId,
        },
      };
    } catch (error) {
      return {
        success: true,
        data: {
          response: "I'm having trouble connecting to the AI service right now. You can still use all the Solana commands — try `create wallet` or `airdrop` to keep learning!",
          sessionId,
          fallback: true,
        },
      };
    }
  }

  /**
   * Structured learning about a Solana topic.
   */
  async learn(topic, sessionId = null) {
    const prompt = `Teach the user about "${topic}" on Solana. Structure your response as:
LEARN: ${topic}

Definition of the concept, how it works on Solana, 3-4 key facts.
End with "Try:" followed by 2-3 terminal commands they can run.`;

    try {
      const response = await this._generate(prompt, 'curriculum', sessionId);
      return { success: true, data: { topic, response } };
    } catch (error) {
      logger.warn(`AI learn failed for "${topic}": ${error.message}`);
      return { success: true, data: { topic, response: null, fallback: true } };
    }
  }

  /**
   * Structured mini-lesson on a topic.
   */
  async lesson(topic, sessionId = null) {
    const prompt = `Create a structured mini-lesson about "${topic}" on Solana. Format:
LESSON: ${topic}

2-3 paragraph explanation covering what it is, why it matters, and how it works on Solana.
End with "Try:" followed by 2-3 terminal commands for hands-on practice.`;

    try {
      const response = await this._generate(prompt, 'curriculum', sessionId);
      return { success: true, data: { topic, response } };
    } catch (error) {
      logger.warn(`AI lesson failed for "${topic}": ${error.message}`);
      return { success: true, data: { topic, response: null, fallback: true } };
    }
  }

  /**
   * Generate a practice task for a scenario.
   */
  async practice(scenario, sessionId = null) {
    const prompt = `Generate a practice task for the scenario: "${scenario}". Format:
PRACTICE TASK: ${scenario}

Numbered steps (1. 2. 3. etc.) the user should follow.
End with "Commands you may need:" followed by relevant terminal commands.
Keep it practical and achievable within our terminal.`;

    try {
      const response = await this._generate(prompt, 'curriculum', sessionId);
      return { success: true, data: { scenario, response } };
    } catch (error) {
      logger.warn(`AI practice failed for "${scenario}": ${error.message}`);
      return { success: true, data: { scenario, response: null, fallback: true } };
    }
  }

  /**
   * Explain WHY a concept matters.
   */
  async why(topic, sessionId = null) {
    const prompt = `Explain WHY "${topic}" matters on Solana. Be conversational and concise.
Compare to traditional systems or other blockchains where helpful.
Maximum 80 words. No bullet points — write it like you're talking to a developer.`;

    try {
      const response = await this._generate(prompt, 'curriculum', sessionId);
      return { success: true, data: { topic, response } };
    } catch (error) {
      logger.warn(`AI why failed for "${topic}": ${error.message}`);
      return { success: true, data: { topic, response: null, fallback: true } };
    }
  }

  /**
   * Compare two concepts (supports cross-chain comparisons).
   */
  async compare(a, b, sessionId = null) {
    const prompt = `Compare "${a}" vs "${b}" in the context of blockchain/Solana.
Use a side-by-side plain text table. Cover key differences.
End with a 1-2 sentence summary. Keep it concise and terminal-friendly.`;

    try {
      const response = await this._generate(prompt, 'compare', sessionId);
      return { success: true, data: { a, b, response } };
    } catch (error) {
      logger.warn(`AI compare failed for "${a}" vs "${b}": ${error.message}`);
      return { success: true, data: { a, b, response: null, fallback: true } };
    }
  }

  /**
   * Core generation method with conversation history.
   */
  async _generate(prompt, mode = 'normal', sessionId = null) {
    if (!this.available || !this.client) {
      throw new AIError('AI service is not available', 'AI_UNAVAILABLE');
    }

    const systemPrompt = buildSystemPrompt(mode);

    // Build conversation context
    const history = sessionId ? this._getHistory(sessionId) : [];
    const contextMessages = history.map((h) => `${h.role}: ${h.content}`).join('\n');

    const fullPrompt = contextMessages
      ? `Previous conversation:\n${contextMessages}\n\nUser: ${prompt}`
      : prompt;

    try {
      const response = await this.client.models.generateContent({
        model: config.gemini.model,
        contents: fullPrompt,
        config: {
          systemInstruction: systemPrompt,
          maxOutputTokens: mode === 'eli5' ? 500 : 1500,
          temperature: mode === 'eli5' ? 0.8 : 0.7,
        },
      });

      const text = response.text || '';

      // Track conversation history
      if (sessionId) {
        this._addToHistory(sessionId, 'user', prompt);
        this._addToHistory(sessionId, 'assistant', text);
      }

      return text;
    } catch (error) {
      logger.error(`Gemini API error: ${error.message}`);
      throw new AIError(`Gemini API failed: ${error.message}`, 'GEMINI_API_ERROR');
    }
  }

  /**
   * Conversation history management.
   */
  _getHistory(sessionId) {
    return this.conversations.get(sessionId) || [];
  }

  _addToHistory(sessionId, role, content) {
    if (!this.conversations.has(sessionId)) {
      this.conversations.set(sessionId, []);
    }
    const history = this.conversations.get(sessionId);
    history.push({ role, content, timestamp: Date.now() });

    // Keep last 20 messages per session
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }
  }

  clearHistory(sessionId) {
    this.conversations.delete(sessionId);
  }

  /**
   * Static fallback explanations when AI is unavailable.
   */
  _getStaticFallback(topic) {
    const lower = topic.toLowerCase();
    const fallbacks = {
      wallet: 'A Solana wallet is a pair of cryptographic keys: a public key (your address, safe to share) and a private key (your secret, never share). The wallet lets you hold SOL, sign transactions, and interact with programs on the Solana blockchain.',
      transaction: 'A Solana transaction is a signed message that contains one or more instructions. Each instruction tells a program what to do (e.g., transfer SOL). Transactions require a recent blockhash and the sender\'s signature to be valid.',
      airdrop: 'An airdrop on devnet lets you request free SOL for testing. You can request up to 2 SOL at a time. This is only available on devnet and testnet — mainnet SOL must be purchased.',
      balance: 'Your balance shows how much SOL you have. SOL is measured in lamports internally (1 SOL = 1,000,000,000 lamports). Your balance is stored on-chain and updated with every transaction.',
      devnet: 'Devnet is Solana\'s development network. It works just like mainnet but SOL has no real value. It\'s perfect for learning and testing. You can get free SOL via airdrops.',
      solana: 'Solana is a high-performance blockchain that can process thousands of transactions per second. It uses a unique Proof of History (PoH) consensus mechanism combined with Proof of Stake (PoS).',
    };

    for (const [key, explanation] of Object.entries(fallbacks)) {
      if (lower.includes(key)) return explanation;
    }

    return `${topic} is a Solana concept. The AI service is currently unavailable for a detailed explanation, but you can learn more at https://solana.com/docs`;
  }

  _buildTransactionFallback(txData) {
    const parts = [`Transaction summary:`];
    if (txData.type) parts.push(`- Type: ${txData.type}`);
    if (txData.amount) parts.push(`- Amount: ${txData.amount} SOL`);
    if (txData.from) parts.push(`- From: ${txData.from}`);
    if (txData.to) parts.push(`- To: ${txData.to}`);
    if (txData.signature) {
      parts.push(`- Signature: ${txData.signature}`);
      parts.push(`- Explorer: https://explorer.solana.com/tx/${txData.signature}?cluster=devnet`);
    }
    parts.push('\nThis transaction was on devnet (play money for learning).');
    return parts.join('\n');
  }

  _getDefaultSuggestions(context) {
    return `Here are some things you can try next:

1. **Create a wallet** — Generate a new Solana keypair to get started
2. **Request an airdrop** — Get free devnet SOL to play with
3. **Check your balance** — See how much SOL you have
4. **Transfer SOL** — Send SOL to another wallet address
5. **View account info** — See detailed information about any account

All operations are on devnet, so feel free to experiment!`;
  }

  /**
   * Health check for the AI service.
   */
  async healthCheck() {
    if (!this.available) {
      return { healthy: false, error: 'API key not configured' };
    }

    try {
      const response = await this.client.models.generateContent({
        model: config.gemini.model,
        contents: 'Say OK',
        config: { maxOutputTokens: 10 },
      });

      return {
        healthy: true,
        model: config.gemini.model,
        responsePreview: (response.text || '').substring(0, 20),
      };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }
}

// Singleton
const aiService = new AIService();
export default aiService;
