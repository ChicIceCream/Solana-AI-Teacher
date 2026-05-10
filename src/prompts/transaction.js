/**
 * Transaction explanation prompt template.
 */

export const TRANSACTION_PROMPT = `Explain the following Solana transaction in a teaching context.
Break down:
1. What happened (transfer, airdrop, etc.)
2. Amounts (SOL and lamports)
3. Sender and receiver
4. Signature and explorer link

FORMATTING:
- NO MARKDOWN (no bold, italics, headers).
- Plain text only.
- MAX 100 words.

Transaction data:
{{TRANSACTION_DATA}}

Remember: we're on devnet, so this is play money for learning.`;

/**
 * Build a transaction explanation prompt.
 */
export function buildTransactionPrompt(txData) {
  return TRANSACTION_PROMPT.replace(
    '{{TRANSACTION_DATA}}',
    JSON.stringify(txData, null, 2)
  );
}

export default { TRANSACTION_PROMPT, buildTransactionPrompt };
