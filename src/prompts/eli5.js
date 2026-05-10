/**
 * ELI5 prompt additions and topic-specific templates.
 */

export const ELI5_TOPICS = {
  wallet: `Imagine a wallet is like a special mailbox 📬 that only YOU have the key to. 
Your public key is like your mailbox address — anyone can see it and send you things. 
Your private key is like the key to open the mailbox — NEVER share it! 🔑`,

  transaction: `A transaction is like passing a note in class 📝 
You write down "give 1 SOL to my friend" and sign it (so everyone knows it's really from you). 
Then the teacher (validator) checks the note and makes it happen! ✅`,

  airdrop: `An airdrop is like free samples at a store 🎁 
On devnet (our practice playground), you can ask for free SOL to play with. 
It's not real money — it's like Monopoly money for learning! 🎮`,

  lamports: `SOL is like a dollar bill 💵 and lamports are like pennies — but WAY smaller! 
1 SOL = 1,000,000,000 lamports (that's a BILLION pennies in one dollar!) 
This lets you send tiny tiny amounts, like 0.000000001 SOL ✨`,

  devnet: `Devnet is like a practice field 🏟️ 
Everything works just like the real Solana, but the SOL isn't worth real money. 
It's perfect for learning — you can make mistakes and nothing bad happens! 🎯`,
};

/**
 * Get ELI5 fallback for a topic when AI is unavailable.
 */
export function getELI5Fallback(topic) {
  const key = topic.toLowerCase();
  for (const [k, v] of Object.entries(ELI5_TOPICS)) {
    if (key.includes(k)) return v;
  }
  return `Think of it like building blocks 🧱 — each piece of Solana fits together to make something cool! Let me explain ${topic} in simple terms...`;
}

export default { ELI5_TOPICS, getELI5Fallback };
