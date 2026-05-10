import api from './api.js';
import {
  TOPICS_LIST,
  GLOSSARY,
  EXAMPLES,
  ROADMAP,
  PRACTICE_SCENARIOS,
  LEARN_FALLBACKS,
  LESSON_FALLBACKS,
  WHY_FALLBACKS,
  COMPARE_FALLBACKS,
} from './curriculum.js';

const WELCOME_ART = `
  ██████  ██████  ██      █████  ███    ██  █████
  ██      ██  ██  ██     ██   ██ ████   ██ ██   ██
  ███████ ██  ██  ██     ███████ ██ ██  ██ ███████
       ██ ██  ██  ██     ██   ██ ██  ██ ██ ██   ██
  ██████  ██████  ██████ ██   ██ ██   ████ ██   ██

  AI Teacher  ·  Localnet  ·  v2.0.0
  ─────────────────────────────────────
  Type 'topics' to start learning.
  Type 'help' for all commands.
`;

const HELP_TEXT = `
LEARNING COMMANDS:

  ◆ learn [topic]       Structured lesson on a Solana topic
  ◆ lesson [topic]      Detailed mini-lesson with examples
  ◆ practice [scenario] Guided hands-on practice task
  ◆ topics              List all available learning topics
  ◆ roadmap             Show the Solana learning path
  ◆ glossary [term]     Look up a blockchain term
  ◆ examples [cmd]      Show usage examples for a command
  ◆ why [topic]         Understand why a concept matters
  ◆ compare [a] [b]     Compare two concepts side-by-side
  ◆ sandbox             Enter safe localnet sandbox mode

WALLET COMMANDS:

  ◆ create-wallet       Create a new Solana wallet
  ◆ balance             Check your wallet balance
  ◆ airdrop [amount]    Request SOL (localnet/devnet)
  ◆ transfer [to] [amt] Transfer SOL to another wallet
  ◆ address             Show your wallet public key
  ◆ account-info        Show detailed account info
  ◆ history             View transaction history
  ◆ forget-wallet       Remove wallet (requires --confirm)

AI COMMANDS:

  ◆ explain [topic]     Ask AI to explain a Solana concept
  ◆ eli5 [topic]        Explain Like I'm 5
  ◆ chat [message]      Free-form chat with AI teacher
  ◆ suggest             Get learning suggestions

SYSTEM:

  ◆ whoami              Show current session info
  ◆ su [user]           Switch to another user
  ◆ network switch      Switch network (localnet|devnet)
  ◆ clear               Clear terminal output
  ◆ help                Show this help message

  Theme: Use the dropdown (🌑) in the top-right corner.
`;

const STORAGE_KEY = 'solana_vibeathon_users';
const ROADMAP_STORAGE_KEY = 'solana_vibeathon_roadmap';

let users = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
  solana: {
    publicKey: null,
    encryptedPrivateKey: null,
  }
};

let currentNetwork = 'localnet';

// Roadmap progress persisted in localStorage
let roadmapProgress = JSON.parse(localStorage.getItem(ROADMAP_STORAGE_KEY)) || {};

// Active practice session (per-session, not persisted)
let activePractice = null;

api.health().then(res => {
  if (res.success && res.data && res.data.network) {
    currentNetwork = res.data.network;
  }
});

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function saveRoadmapProgress() {
  localStorage.setItem(ROADMAP_STORAGE_KEY, JSON.stringify(roadmapProgress));
}

function getActiveWallet(terminalUser) {
  return users[terminalUser] || { publicKey: null, encryptedPrivateKey: null };
}

export function getPrompt(terminalUser = 'solana') {
  return `${terminalUser}@${currentNetwork}:~$ `;
}

export function getWelcome() {
  return WELCOME_ART.replace('Localnet', currentNetwork === 'localnet' ? 'Localnet' : 'Devnet');
}

export function getActivePractice() {
  return activePractice;
}

export async function executeCommand(input, terminalUser = 'solana') {
  const result = await _runCommand(input, terminalUser);
  if (!result) return null;

  // ────────────────────────────────────────────
  //  PRACTICE WATCHER
  //  Runs after every command. Checks if the user
  //  typed the expected step and advances the session.
  // ────────────────────────────────────────────
  if (activePractice) {
    const trimmed = input.trim();
    const stepIdx = activePractice.currentStep; // 0-based
    const expectedStep = activePractice.steps[stepIdx];

    // Don't watch practice/help meta-commands themselves
    const metaCmds = ['practice', 'help', 'clear', 'theme'];
    const isMetaCmd = metaCmds.some(m => trimmed.toLowerCase().startsWith(m));

    if (!isMetaCmd && expectedStep) {
      const expected = expectedStep.command;
      const matched = expected && trimmed.toLowerCase().startsWith(expected.split(' ')[0].toLowerCase());

      if (matched) {
        // Advance to next step
        activePractice.currentStep = stepIdx + 1;
        const nextIdx = activePractice.currentStep;
        const total = activePractice.steps.length;

        if (nextIdx >= total) {
          // Practice complete
          result.text += `\n\n  ◆ STEP ${stepIdx + 1} DONE. Practice complete! Well done.`;
          activePractice = null;
        } else {
          // Show next step
          const nextStep = activePractice.steps[nextIdx];
          const nextHint = nextStep.command
            ? `\n\n  ◆ STEP ${nextIdx + 1} OF ${total}: ${nextStep.label}\n  Type the command to proceed.`
            : `\n\n  ◆ STEP ${nextIdx + 1} OF ${total}: ${nextStep.label}\n  Figure this one out yourself.`;
          result.text += nextHint;
        }
      } else if (expected) {
        // Wrong command — let it execute but add a soft nudge
        result.text += `\n\n  [Practice] Step ${stepIdx + 1}: ${expectedStep.label}\n  Expected: ${expected}`;
      }
    }
  }

  return result;
}

async function _runCommand(input, terminalUser = 'solana') {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);
  const walletState = getActiveWallet(terminalUser);

  switch (cmd) {
    case 'help':
      return { text: HELP_TEXT, type: 'info' };

    case 'clear':
      return { text: '__CLEAR__', type: 'system' };

    case 'su':
    case 'login': {
      if (!args[0]) {
        return { text: '  Usage: su <username>', type: 'warning' };
      }
      const newUser = args[0].toLowerCase();
      if (!users[newUser]) {
        users[newUser] = { publicKey: null, encryptedPrivateKey: null };
      }
      saveState();
      return { text: `  Switched to user: ${newUser}`, type: 'success', newUser };
    }

    case 'forget-wallet': {
      if (!walletState.publicKey) {
        return { text: '  No wallet found for current user.', type: 'warning' };
      }
      if (args[0] !== '--confirm') {
        return { 
          text: '  [WARNING] This action is permanent and will destroy your keys and history!\n  Run "forget-wallet --confirm" to proceed.', 
          type: 'error' 
        };
      }
      
      const pubKey = walletState.publicKey;
      users[terminalUser] = { publicKey: null, encryptedPrivateKey: null };
      saveState();
      
      const res = await api.forgetWallet(pubKey);
      if (res.success) {
        return { text: `  ◆ Wallet ${pubKey} has been permanently forgotten.`, type: 'success' };
      }
      return { text: `  ✕ Removed locally, but backend returned: ${res.error?.message}`, type: 'warning' };
    }

    case 'whoami':
      return {
        text: walletState.publicKey
          ? `  User: ${terminalUser}\n  Wallet: ${walletState.publicKey}\n  Network: ${currentNetwork}\n  Session active`
          : `  User: ${terminalUser}\n  Network: ${currentNetwork}\n  No wallet loaded. Run "create-wallet" first.`,
        type: 'info',
      };

    case 'network': {
      if (args[0] === 'switch') {
        const network = args[1];
        if (network !== 'localnet' && network !== 'devnet') {
          return { text: '  Usage: network switch <localnet|devnet>', type: 'warning' };
        }
        const res = await api.switchNetwork(network);
        if (res.success) {
          currentNetwork = res.data.network;
          return { text: `  ◆ ${res.data.message}`, type: 'success' };
        }
        return { text: `  ✕ ${res.error?.message || 'Failed to switch network'}`, type: 'error' };
      }
      return { text: '  Usage: network switch <localnet|devnet>', type: 'warning' };
    }

    case 'address':
      return {
        text: walletState.publicKey
          ? `  ◆ ${walletState.publicKey}`
          : '  No wallet. Run "create-wallet" first.',
        type: walletState.publicKey ? 'success' : 'warning',
      };

    case 'create-wallet': {
      if (walletState.publicKey) {
        return { text: '  User already has a wallet. Use a different user to create another.', type: 'warning' };
      }
      const res = await api.createWallet();
      if (res.success) {
        users[terminalUser].publicKey = res.data.publicKey;
        users[terminalUser].encryptedPrivateKey = res.data.encryptedPrivateKey;
        saveState();
        return {
          text: `  ◆ Wallet created for ${terminalUser}!\n  Public key: ${res.data.publicKey}\n  ⚠ Private key encrypted and stored in session.`,
          type: 'success',
        };
      }
      return { text: `  ✕ ${res.error?.message || 'Failed to create wallet'}`, type: 'error' };
    }

    case 'balance': {
      if (!walletState.publicKey) {
        return { text: '  No wallet. Run "create-wallet" first.', type: 'warning' };
      }
      const res = await api.getBalance(walletState.publicKey);
      if (res.success) {
        return { text: `  ◆ Balance: ${res.data.balanceSOL} SOL`, type: 'success' };
      }
      return { text: `  ✕ ${res.error?.message || 'Failed to get balance'}`, type: 'error' };
    }

    case 'airdrop': {
      if (!walletState.publicKey) {
        return { text: '  No wallet. Run "create-wallet" first.', type: 'warning' };
      }
      const amount = parseFloat(args[0]) || 1;
      const res = await api.airdrop(walletState.publicKey, amount);
      if (res.success) {
        return {
          text: `  ◆ Airdrop successful! +${res.data.amount} SOL\n  Signature: ${res.data.signature}\n  Explorer: ${res.data.explorerUrl}`,
          type: 'success',
        };
      }
      return { text: `  ✕ ${res.error?.message || 'Airdrop failed'}`, type: 'error' };
    }

    case 'transfer': {
      if (!walletState.publicKey || !walletState.encryptedPrivateKey) {
        return { text: '  No wallet. Run "create-wallet" first.', type: 'warning' };
      }
      if (args.length < 2) {
        return { text: '  Usage: transfer <address> <amount>', type: 'warning' };
      }
      const res = await api.transfer(walletState.encryptedPrivateKey, args[0], parseFloat(args[1]));
      if (res.success) {
        return {
          text: `  ◆ Transfer complete!\n  Sent: ${res.data.amount} SOL to ${res.data.to}\n  Signature: ${res.data.signature}`,
          type: 'success',
        };
      }
      return { text: `  ✕ ${res.error?.message || 'Transfer failed'}`, type: 'error' };
    }

    case 'account-info': {
      if (!walletState.publicKey) {
        return { text: '  No wallet. Run "create-wallet" first.', type: 'warning' };
      }
      const res = await api.getAccountInfo(walletState.publicKey);
      if (res.success) {
        const d = res.data;
        return {
          text: `  Address:    ${d.address}\n  Exists:     ${d.exists}\n  Balance:    ${d.balanceSOL} SOL\n  Executable: ${d.executable ?? 'N/A'}\n  Owner:      ${d.owner ?? 'System Program'}`,
          type: 'info',
        };
      }
      return { text: `  ✕ ${res.error?.message || 'Failed'}`, type: 'error' };
    }

    case 'history': {
      if (!walletState.publicKey) {
        return { text: '  No wallet. Run "create-wallet" first.', type: 'warning' };
      }
      const res = await api.getHistory(walletState.publicKey);
      if (res.success) {
        const txs = res.data.local;
        if (!txs || txs.length === 0) {
          return { text: '  No transactions yet. Try "airdrop" first!', type: 'info' };
        }
        const lines = txs.slice(0, 5).map((t) => `  ${t.type} | ${t.amount ?? ''} SOL | ${t.timestamp}`);
        return { text: lines.join('\n'), type: 'info' };
      }
      return { text: `  ✕ ${res.error?.message || 'Failed'}`, type: 'error' };
    }

    case 'explain': {
      const topic = args.join(' ') || 'Solana';
      const res = await api.explain(topic, 'normal');
      if (res.success) {
        return { text: res.data.explanation, type: 'info' };
      }
      return { text: `  ✕ ${res.error?.message || 'AI unavailable'}`, type: 'error' };
    }

    case 'eli5': {
      const topic = args.join(' ') || 'Solana';
      const res = await api.explain(topic, 'eli5');
      if (res.success) {
        return { text: res.data.explanation, type: 'info' };
      }
      return { text: `  ✕ ${res.error?.message || 'AI unavailable'}`, type: 'error' };
    }

    case 'chat': {
      const message = args.join(' ');
      if (!message) return { text: '  Usage: chat <message>', type: 'warning' };
      const res = await api.chat(message);
      if (res.success) {
        return { text: res.data.response, type: 'info' };
      }
      return { text: `  ✕ ${res.error?.message || 'AI unavailable'}`, type: 'error' };
    }

    case 'suggest': {
      const res = await api.suggest({ wallet: !!walletState.publicKey });
      if (res.success) {
        return { text: res.data.suggestions, type: 'info' };
      }
      return { text: `  ✕ ${res.error?.message || 'AI unavailable'}`, type: 'error' };
    }

    case 'theme':
      return { text: '  Use the theme dropdown (top-right corner of the terminal) to switch themes.', type: 'info' };

    // ─────────────────────────────────────────────
    //  EDTECH COMMANDS — STATIC (no API needed)
    // ─────────────────────────────────────────────

    case 'topics': {
      const header = '  AVAILABLE TOPICS\n';
      const list = TOPICS_LIST.map(t => `  - ${t.id.padEnd(18)} ${t.description}`).join('\n');
      const footer = '\n\n  Use: learn <topic> or lesson <topic>';
      return { text: header + list + footer, type: 'info' };
    }

    case 'roadmap': {
      const header = '  SOLANA LEARNING PATH\n';
      const steps = ROADMAP.map(r => {
        const done = roadmapProgress[r.step] ? '✓' : ' ';
        return `  [${done}] ${r.step}. ${r.topic.padEnd(14)} ${r.description}\n      Commands: ${r.commands.join(', ')}`;
      }).join('\n');
      const footer = '\n\n  Progress is saved automatically.\n  Complete steps by running their commands.';
      return { text: header + steps + footer, type: 'info' };
    }

    case 'glossary': {
      if (!args[0]) {
        const terms = Object.keys(GLOSSARY).sort().join(', ');
        return { text: `  GLOSSARY\n\n  Available terms: ${terms}\n\n  Usage: glossary <term>`, type: 'info' };
      }
      const term = args[0].toLowerCase();
      const entry = GLOSSARY[term];
      if (!entry) {
        const available = Object.keys(GLOSSARY).sort().join(', ');
        return { text: `  Term "${term}" not found.\n\n  Available: ${available}`, type: 'warning' };
      }
      let text = `  ${entry.term}:\n  ${entry.definition.split('\n').join('\n  ')}`;
      if (entry.seeAlso && entry.seeAlso.length > 0) {
        text += `\n\n  See also: ${entry.seeAlso.join(', ')}`;
      }
      return { text, type: 'info' };
    }

    case 'examples': {
      if (!args[0]) {
        const cmds = Object.keys(EXAMPLES).sort().join(', ');
        return { text: `  EXAMPLES\n\n  Available: ${cmds}\n\n  Usage: examples <command>`, type: 'info' };
      }
      const cmdName = args[0].toLowerCase();
      const example = EXAMPLES[cmdName];
      if (!example) {
        const available = Object.keys(EXAMPLES).sort().join(', ');
        return { text: `  No examples for "${cmdName}".\n\n  Available: ${available}`, type: 'warning' };
      }
      const header = `  EXAMPLES: ${example.command}\n  ${example.description}\n`;
      const usages = example.usage.map(u => `  ${u}`).join('\n');
      return { text: header + '\n' + usages, type: 'info' };
    }

    case 'sandbox': {
      // Auto-switch to localnet if not already there
      if (currentNetwork !== 'localnet') {
        const res = await api.switchNetwork('localnet');
        if (res.success) {
          currentNetwork = 'localnet';
        }
      }
      return {
        text: `  SANDBOX MODE ACTIVE\n\n  Network: LOCALNET\n  Transactions are simulated locally.\n  Safe for experimentation.\n  You can't break anything here.\n\n  Airdrops are unlimited and instant.\n  Type "airdrop 100" to load up.`,
        type: 'success',
      };
    }

    // ─────────────────────────────────────────────
    //  EDTECH COMMANDS — AI-POWERED (with fallback)
    // ─────────────────────────────────────────────

    case 'learn': {
      const topic = args.join(' ');
      if (!topic) {
        const topicList = TOPICS_LIST.map(t => t.id).join(', ');
        return { text: `  Usage: learn <topic>\n\n  Topics: ${topicList}`, type: 'warning' };
      }
      const topicKey = topic.toLowerCase().replace(/\s+/g, '-');
      const res = await api.learn(topic);
      if (res.success && res.data.response) {
        _trackRoadmapTopic(topicKey);
        return { text: res.data.response, type: 'info' };
      }
      // Fallback to static content
      const fallback = LEARN_FALLBACKS[topicKey];
      if (fallback) {
        _trackRoadmapTopic(topicKey);
        return { text: fallback, type: 'info' };
      }
      return { text: `  No content found for "${topic}".\n  Try: topics`, type: 'warning' };
    }

    case 'lesson': {
      const topic = args.join(' ');
      if (!topic) {
        const topicList = TOPICS_LIST.map(t => t.id).join(', ');
        return { text: `  Usage: lesson <topic>\n\n  Topics: ${topicList}`, type: 'warning' };
      }
      const topicKey = topic.toLowerCase().replace(/\s+/g, '-');
      const res = await api.lesson(topic);
      if (res.success && res.data.response) {
        _trackRoadmapTopic(topicKey);
        return { text: res.data.response, type: 'info' };
      }
      // Fallback to static content
      const fallback = LESSON_FALLBACKS[topicKey];
      if (fallback) {
        _trackRoadmapTopic(topicKey);
        const tryCmds = fallback.tryCmds.map(c => `  ${c}`).join('\n');
        return { text: `  LESSON: ${fallback.title}\n\n  ${fallback.content.split('\n').join('\n  ')}\n\n  Try:\n${tryCmds}`, type: 'info' };
      }
      return { text: `  No lesson found for "${topic}".\n  Try: topics`, type: 'warning' };
    }

    case 'why': {
      const topic = args.join(' ');
      if (!topic) {
        return { text: '  Usage: why <topic>\n\n  Example: why accounts', type: 'warning' };
      }
      const topicKey = topic.toLowerCase().replace(/\s+/g, '-');
      const res = await api.why(topic);
      if (res.success && res.data.response) {
        return { text: res.data.response, type: 'info' };
      }
      // Fallback
      const fallback = WHY_FALLBACKS[topicKey];
      if (fallback) {
        return { text: `  ${fallback.split('\n').join('\n  ')}`, type: 'info' };
      }
      return { text: `  No "why" content for "${topic}".\n  Try: topics`, type: 'warning' };
    }

    case 'compare': {
      if (args.length < 2) {
        return { text: '  Usage: compare <a> <b>\n\n  Examples:\n  compare devnet localnet\n  compare ethereum solana', type: 'warning' };
      }
      const a = args[0].toLowerCase();
      const b = args[1].toLowerCase();
      const res = await api.compare(a, b);
      if (res.success && res.data.response) {
        return { text: res.data.response, type: 'info' };
      }
      // Fallback
      const fallbackKey = `${a}-${b}`;
      const fallback = COMPARE_FALLBACKS[fallbackKey];
      if (fallback) {
        return { text: `  ${fallback.split('\n').join('\n  ')}`, type: 'info' };
      }
      return { text: `  No comparison available for "${a}" vs "${b}".`, type: 'warning' };
    }

    case 'practice': {
      const scenario = args.join('-') || '';
      if (!scenario) {
        const available = Object.entries(PRACTICE_SCENARIOS)
          .map(([key, val]) => `  - ${key.padEnd(20)} ${val.title}`)
          .join('\n');
        return {
          text: `  PRACTICE SCENARIOS\n\n${available}\n\n  Usage: practice <scenario>`,
          type: 'info',
        };
      }
      const scenarioData = PRACTICE_SCENARIOS[scenario];
      if (!scenarioData) {
        const available = Object.keys(PRACTICE_SCENARIOS).join(', ');
        return { text: `  Unknown scenario: "${scenario}"\n\n  Available: ${available}`, type: 'warning' };
      }

      // Store active practice — user types commands themselves
      activePractice = { ...scenarioData, currentStep: 0, scenarioKey: scenario };

      // Build the task overview (all steps listed, but only step 1 is the active prompt)
      const header = `  PRACTICE: ${scenarioData.title}\n  ${scenarioData.objective}\n\n  Steps:`;
      const stepList = scenarioData.steps.map((s, i) => {
        return `  ${i + 1}. ${s.label}`;
      }).join('\n');

      const firstStep = scenarioData.steps[0];
      const firstHint = firstStep.command
        ? `\n\n  STEP 1 OF ${scenarioData.steps.length}: ${firstStep.label}\n  Type the command to proceed.`
        : `\n\n  STEP 1 OF ${scenarioData.steps.length}: ${firstStep.label}\n  This step requires your own input — no command hint.`;

      return { text: header + '\n' + stepList + firstHint, type: 'info' };
    }

    default:
      return { text: `  Command not found: "${cmd}". Try 'help'.`, type: 'error' };
  }
}

/**
 * Track roadmap progress when a topic is accessed.
 */
function _trackRoadmapTopic(topicKey) {
  const topicMap = {
    wallets: 1, transactions: 2, accounts: 3,
    pdas: 4, 'program-derived-addresses': 4,
    tokens: 5, programs: 6, 'smart-contracts': 6, anchor: 7,
  };
  const step = topicMap[topicKey];
  if (step && !roadmapProgress[step]) {
    roadmapProgress[step] = true;
    saveRoadmapProgress();
  }
}
