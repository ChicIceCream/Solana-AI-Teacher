/**
 * curriculum.js — Static educational content for the Solana Teaching Terminal.
 * Powers instant commands (topics, roadmap, glossary, examples, sandbox)
 * and offline fallbacks when AI is unavailable.
 */

export const TOPICS_LIST = [
  { id: 'wallets', name: 'Wallets', description: 'Keypairs, public/private keys, and wallet management' },
  { id: 'transactions', name: 'Transactions', description: 'Sending, signing, and confirming transactions' },
  { id: 'accounts', name: 'Accounts', description: 'Account model, rent, and data storage' },
  { id: 'pdas', name: 'PDAs', description: 'Program Derived Addresses — deterministic, keyless accounts' },
  { id: 'validators', name: 'Validators', description: 'Consensus, block production, and staking' },
  { id: 'rpc', name: 'RPC', description: 'Remote procedure calls and node communication' },
  { id: 'smart-contracts', name: 'Smart Contracts', description: 'Programs, BPF, and on-chain logic' },
  { id: 'tokens', name: 'Tokens', description: 'SPL tokens, minting, and token accounts' },
  { id: 'nfts', name: 'NFTs', description: 'Non-fungible tokens and metadata standards' },
  { id: 'staking', name: 'Staking', description: 'Delegation, rewards, and stake accounts' },
];

export const GLOSSARY = {
  // ── Core topics (also referenced in seeAlso across other entries) ──
  wallets: { term: 'Wallets', definition: 'A Solana wallet is a cryptographic keypair:\n- Public key = your address (share freely)\n- Private key = your signer (never share)\n\nWallets don\'t store tokens — token accounts do.\nGenerated offline. No registration required.', seeAlso: ['keypair', 'accounts'] },
  transactions: { term: 'Transactions', definition: 'A signed message containing one or more\ninstructions that execute atomically.\n\n- Needs a recent blockhash (expires ~60s)\n- Fees: ~0.000005 SOL\n- Confirms in ~400ms\n- Max size: 1232 bytes', seeAlso: ['blockhash', 'signature'] },
  accounts: { term: 'Accounts', definition: 'Everything on Solana is an account.\nAccounts store data, SOL, and program state.\n\nKey fields: address, lamport balance,\nowner program, data bytes, executable flag.\n\nMust be rent-exempt to persist.', seeAlso: ['rent', 'pda'] },
  validators: { term: 'Validators', definition: 'Nodes that process transactions and produce\nblocks on Solana.\n\nUse Proof of History (PoH) for timestamping\nand Proof of Stake (PoS) for security.\n\nLeader schedule rotates every 4 slots.', seeAlso: ['epoch', 'staking'] },
  staking: { term: 'Staking', definition: 'Delegating SOL to a validator to earn rewards\nand help secure the network.\n\n- Rewards distributed each epoch (~2-3 days)\n- Unstaking has a ~2-3 day cooldown\n- Current APY: ~6-8%', seeAlso: ['validators', 'epoch'] },
  tokens: { term: 'Tokens', definition: 'Fungible assets on Solana built with the\nSPL Token Program.\n\n- Mint account = defines the token\n- Token account = holds a user\'s balance\n- ATA = default token account per mint\n\nAll tokens share the same program.', seeAlso: ['spl', 'accounts'] },
  'smart-contracts': { term: 'Smart Contracts', definition: 'Called "programs" on Solana.\nStateless — all state lives in accounts.\n\nKey differences from Ethereum:\n- Programs don\'t store their own data\n- Compiled to BPF bytecode\n- Upgradeable by default\n\nFrameworks: Anchor, native Rust.', seeAlso: ['bpf', 'pda', 'anchor'] },

  // ── Technical terms ──
  rpc: { term: 'RPC', definition: 'Remote Procedure Call.\nRPC nodes allow apps to communicate\nwith the blockchain without running\na full node locally.', seeAlso: ['validators', 'accounts'] },
  lamport: { term: 'Lamport', definition: 'The smallest unit of SOL.\n1 SOL = 1,000,000,000 lamports.\nNamed after Leslie Lamport.', seeAlso: ['sol', 'transactions'] },
  keypair: { term: 'Keypair', definition: 'A pair of cryptographic keys:\n- Public key = your address (safe to share)\n- Private key = your secret signer (never share)', seeAlso: ['wallets'] },
  blockhash: { term: 'Blockhash', definition: 'A recent hash of the blockchain state.\nEvery transaction needs one to prove\nit was created recently. Expires after ~60s.', seeAlso: ['transactions'] },
  rent: { term: 'Rent', definition: 'A fee for storing data on-chain.\nAccounts must maintain a minimum balance\n(rent-exempt) or pay rent each epoch.', seeAlso: ['accounts', 'epoch'] },
  epoch: { term: 'Epoch', definition: 'A period of ~2-3 days on Solana.\nValidator rewards are distributed and\nstaking changes take effect at epoch boundaries.', seeAlso: ['validators', 'staking'] },
  pda: { term: 'PDA (Program Derived Address)', definition: 'A special Solana address derived deterministically\nfrom a program ID + seeds using PublicKey.findProgramAddress().\n\nKey properties:\n- No private key exists for a PDA\n- Only the owning program can "sign" for it\n- Derived off-curve (not on the Ed25519 curve)\n- Uses a "bump seed" to ensure off-curve\n- Deterministic: same seeds = same address\n\nUse cases:\n- Token vaults and escrows\n- User-specific data accounts\n- Config / state singletons\n- Associated Token Accounts (ATAs)\n\nDerivation: sha256(seeds + programId + bump)\nthen verified to be off the Ed25519 curve.', seeAlso: ['smart-contracts', 'accounts', 'anchor', 'spl'] },
  'program-derived-address': { term: 'Program Derived Address', definition: 'See: PDA. A keyless account address derived\nfrom a program ID and a set of seed bytes.\nThe program "owns" the address and can sign\nCPIs (Cross-Program Invocations) on its behalf.', seeAlso: ['pda', 'smart-contracts'] },
  bump: { term: 'Bump Seed', definition: 'A single byte (0-255) appended to PDA seeds\nto push the derived address off the Ed25519 curve.\nThe "canonical bump" is the highest valid value.\nfindProgramAddress() returns the canonical bump.', seeAlso: ['pda'] },
  cpi: { term: 'CPI (Cross-Program Invocation)', definition: 'When one Solana program calls another program.\nCPIs allow composability between programs.\nPDAs can sign CPIs via invoke_signed().\nMax depth: 4 levels of nesting.', seeAlso: ['pda', 'smart-contracts'] },
  seeds: { term: 'Seeds', definition: 'Byte arrays used to derive a PDA.\nCommon patterns:\n- ["user", user_pubkey] for per-user data\n- ["vault", mint_pubkey] for token vaults\n- ["config"] for singleton state\nSeeds make PDA addresses deterministic.', seeAlso: ['pda', 'bump'] },
  spl: { term: 'SPL', definition: 'Solana Program Library.\nA collection of on-chain programs including\nthe Token Program and Associated Token\nAccount Program.', seeAlso: ['tokens', 'smart-contracts'] },
  devnet: { term: 'Devnet', definition: 'Solana development network.\nFree SOL via airdrops. No real value.\nPerfect for learning and testing.', seeAlso: ['localnet', 'rpc'] },
  localnet: { term: 'Localnet', definition: 'A local Solana validator on your machine.\nZero latency, unlimited airdrops, no rate\nlimits. Best for development.', seeAlso: ['devnet', 'validators'] },
  bpf: { term: 'BPF', definition: 'Berkeley Packet Filter.\nSolana programs compile to BPF bytecode\nwhich runs inside the Solana runtime.', seeAlso: ['smart-contracts'] },
  signature: { term: 'Signature', definition: 'A cryptographic proof that a transaction\nwas authorized by the private key holder.\nAlso serves as a unique transaction ID.', seeAlso: ['transactions', 'keypair'] },
  sol: { term: 'SOL', definition: 'The native token of the Solana blockchain.\nUsed for transaction fees, staking,\nand rent. Divisible into lamports.', seeAlso: ['lamport', 'staking'] },
  anchor: { term: 'Anchor', definition: 'A framework for building Solana programs.\nProvides macros, IDL generation, and\nclient libraries. Most popular Solana\ndevelopment framework.', seeAlso: ['smart-contracts'] },
};

export const EXAMPLES = {
  'create-wallet': { command: 'create-wallet', description: 'Generate a new Solana keypair.', usage: ['create-wallet'] },
  balance: { command: 'balance', description: 'Check your wallet balance in SOL.', usage: ['balance'] },
  airdrop: { command: 'airdrop [amount]', description: 'Request free SOL.', usage: ['airdrop          Request 1 SOL (default)', 'airdrop 2        Request 2 SOL', 'airdrop 100      Request 100 SOL (localnet)'] },
  transfer: { command: 'transfer [address] [amount]', description: 'Send SOL to another wallet.', usage: ['transfer F3a8...abc 1      Send 1 SOL', 'transfer F3a8...abc 0.5    Send 0.5 SOL'] },
  'account-info': { command: 'account-info', description: 'Show detailed info about your account.', usage: ['account-info'] },
  history: { command: 'history', description: 'View recent transactions.', usage: ['history'] },
  explain: { command: 'explain [topic]', description: 'Ask AI to explain a concept.', usage: ['explain wallets', 'explain proof of history'] },
  learn: { command: 'learn [topic]', description: 'Structured lesson on a topic.', usage: ['learn wallets', 'learn transactions', 'learn accounts'] },
  compare: { command: 'compare [a] [b]', description: 'Compare two concepts.', usage: ['compare devnet localnet', 'compare ethereum solana'] },
  glossary: { command: 'glossary [term]', description: 'Look up a blockchain / Solana term.', usage: ['glossary pda', 'glossary bump', 'glossary cpi', 'glossary seeds', 'glossary rent'] },
};

export const ROADMAP = [
  { step: 1, topic: 'Wallets', description: 'Create and manage Solana keypairs', commands: ['create-wallet', 'address', 'balance'] },
  { step: 2, topic: 'Transactions', description: 'Send and receive SOL on the network', commands: ['airdrop', 'transfer', 'history'] },
  { step: 3, topic: 'Accounts', description: 'Understand the Solana account model', commands: ['account-info', 'learn accounts'] },
  { step: 4, topic: 'PDAs', description: 'Program Derived Addresses and keyless accounts', commands: ['learn pdas', 'glossary pda', 'glossary bump'] },
  { step: 5, topic: 'Tokens', description: 'SPL tokens, minting, and token accounts', commands: ['learn tokens', 'glossary spl'] },
  { step: 6, topic: 'Programs', description: 'Smart contracts and on-chain logic', commands: ['learn smart-contracts', 'glossary bpf'] },
  { step: 7, topic: 'Anchor', description: 'The Solana development framework', commands: ['learn anchor', 'glossary anchor'] },
];

export const PRACTICE_SCENARIOS = {
  'wallet-basics': {
    title: 'Wallet Basics',
    objective: 'Create a wallet and fund it with SOL.',
    steps: [
      { label: 'Create a new wallet', command: 'create-wallet' },
      { label: 'Check your address', command: 'address' },
      { label: 'Request 2 SOL from the faucet', command: 'airdrop 2' },
      { label: 'Verify your balance', command: 'balance' },
    ],
  },
  transfer: {
    title: 'SOL Transfer',
    objective: 'Transfer SOL between two wallets.',
    steps: [
      { label: 'Create wallet A (your current user)', command: 'create-wallet' },
      { label: 'Fund wallet A with 5 SOL', command: 'airdrop 5' },
      { label: 'Create wallet B (switch user)', command: 'su wallet-b' },
      { label: 'Create wallet B keypair', command: 'create-wallet' },
      { label: 'Copy wallet B address', command: 'address' },
      { label: 'Switch back to wallet A', command: 'su solana' },
      { label: 'Transfer 1 SOL to wallet B (use address from step 5)', command: null },
      { label: 'Check your remaining balance', command: 'balance' },
    ],
  },
  'multi-wallet': {
    title: 'Multi-Wallet Management',
    objective: 'Manage multiple wallets and check accounts.',
    steps: [
      { label: 'Create user "alice"', command: 'su alice' },
      { label: 'Create alice wallet', command: 'create-wallet' },
      { label: 'Fund alice with 10 SOL', command: 'airdrop 10' },
      { label: 'Check alice account details', command: 'account-info' },
      { label: 'Create user "bob"', command: 'su bob' },
      { label: 'Create bob wallet', command: 'create-wallet' },
      { label: 'Check bob balance (should be 0)', command: 'balance' },
      { label: 'Switch back to see alice info', command: 'su alice' },
    ],
  },
  'inspect-account': {
    title: 'Account Deep Dive',
    objective: 'Explore the Solana account model hands-on.',
    steps: [
      { label: 'Create a wallet if needed', command: 'create-wallet' },
      { label: 'Airdrop some SOL', command: 'airdrop 3' },
      { label: 'Inspect your account details', command: 'account-info' },
      { label: 'Learn about accounts', command: 'learn accounts' },
      { label: 'Look up what rent means', command: 'glossary rent' },
      { label: 'Check your transaction history', command: 'history' },
    ],
  },
  'explore-network': {
    title: 'Network Exploration',
    objective: 'Understand Solana networks and sandbox mode.',
    steps: [
      { label: 'Check your current network', command: 'sandbox' },
      { label: 'Learn about devnet', command: 'glossary devnet' },
      { label: 'Learn about localnet', command: 'glossary localnet' },
      { label: 'Compare devnet vs localnet', command: 'compare devnet localnet' },
      { label: 'Check who you are', command: 'whoami' },
      { label: 'See the full learning roadmap', command: 'roadmap' },
    ],
  },
  'pda-deep-dive': {
    title: 'PDA Deep Dive',
    objective: 'Understand Program Derived Addresses through exploration.',
    steps: [
      { label: 'Look up what a PDA is', command: 'glossary pda' },
      { label: 'Learn about seeds', command: 'glossary seeds' },
      { label: 'Understand bump seeds', command: 'glossary bump' },
      { label: 'Learn about Cross-Program Invocations', command: 'glossary cpi' },
      { label: 'Take the full PDA lesson', command: 'learn pdas' },
      { label: 'See how PDAs relate to programs', command: 'learn smart-contracts' },
    ],
  },
  'account-model': {
    title: 'Solana Account Model',
    objective: 'Master accounts, PDAs, and data storage on Solana.',
    steps: [
      { label: 'Create a wallet', command: 'create-wallet' },
      { label: 'Fund it with SOL', command: 'airdrop 5' },
      { label: 'Inspect your account', command: 'account-info' },
      { label: 'Learn about accounts', command: 'learn accounts' },
      { label: 'Learn about PDAs', command: 'learn pdas' },
      { label: 'Understand rent exemption', command: 'glossary rent' },
      { label: 'Compare accounts vs PDAs', command: 'compare accounts pdas' },
    ],
  },
};

export const LEARN_FALLBACKS = {
  wallets: 'LEARN: Wallets\n\nA Solana wallet is a cryptographic keypair:\n- Public key = your address (share freely)\n- Private key = your signer (never share)\n\nWallets hold SOL and sign transactions.\nKeys are base58-encoded. A keypair is 64 bytes.\n\nTry:\n  create-wallet\n  address\n  balance',
  transactions: 'LEARN: Transactions\n\nA transaction is a signed message with one or\nmore instructions. Each instruction tells a\nprogram what to do.\n\nKey facts:\n- Max size: 1232 bytes\n- Needs a recent blockhash (expires ~60s)\n- Fees: ~0.000005 SOL\n- Confirmed in ~400ms\n\nTry:\n  airdrop 2\n  transfer <address> 1\n  history',
  accounts: 'LEARN: Accounts\n\nEverything on Solana is an account.\nAccounts store data, SOL, and program state.\n\n- Address (public key)\n- Lamport balance\n- Owner (a program)\n- Data (arbitrary bytes)\n- Executable flag\n\nAccounts must be rent-exempt or pay rent.\n\nTry:\n  account-info\n  glossary rent\n  glossary pda',
  validators: 'LEARN: Validators\n\nValidators process transactions and produce\nblocks. Leader schedule rotates every 4 slots.\n\nProof of History timestamps everything.\nProof of Stake secures the network.\n\nRewards come from fees and inflation.\n\nTry:\n  glossary epoch\n  learn staking',
  rpc: 'LEARN: RPC\n\nRPC (Remote Procedure Call) is how apps talk\nto the Solana blockchain.\n\nCommon methods: getBalance, getAccountInfo,\nsendTransaction, getSignaturesForAddress.\n\nProviders: Helius, QuickNode, Alchemy.\n\nTry:\n  balance\n  account-info\n  glossary rpc',
  'smart-contracts': 'LEARN: Smart Contracts (Programs)\n\nSolana calls smart contracts "programs."\nThey are stateless — all state lives in accounts.\n\nDifferences from Ethereum:\n- Programs don\'t store data themselves\n- Compiled to BPF bytecode\n- Upgradeable by default\n\nPopular frameworks: Anchor, native Rust.\n\nTry:\n  glossary bpf\n  glossary anchor',
  tokens: 'LEARN: Tokens\n\nSolana uses the SPL Token Program.\n\n- Mint account = defines the token\n- Token account = holds user tokens\n- ATA = default token account per mint\n\nEvery token uses this standard.\n\nTry:\n  glossary spl\n  learn nfts',
  nfts: 'LEARN: NFTs\n\nNFTs on Solana are SPL tokens with supply=1\nand 0 decimals. Metadata via Metaplex.\n\nMetaplex provides Token Metadata Program,\nCandy Machine, and Compressed NFTs.\n\ncNFTs can mint millions for cents.\n\nTry:\n  glossary spl\n  learn tokens',
  staking: 'LEARN: Staking\n\nStaking earns rewards by delegating SOL to\nvalidators.\n\n- Create a stake account\n- Delegate to a validator\n- Earn rewards each epoch (~2-3 days)\n- Unstaking takes ~2-3 days\n\nCurrent APY: ~6-8%.\n\nTry:\n  glossary epoch\n  learn validators',
  pdas: 'LEARN: PDAs (Program Derived Addresses)\n\nA PDA is a special address on Solana that has\nno private key. It is derived deterministically\nfrom a program ID and a set of "seeds."\n\nKey concepts:\n- Derived via PublicKey.findProgramAddress(seeds, programId)\n- Off the Ed25519 curve (no one can sign for it)\n- Only the owning program can sign via CPI\n- A "bump seed" ensures the address is off-curve\n\nCommon uses:\n- Token vaults and escrows (hold SOL/tokens)\n- Per-user data (seeds = ["user", user_pubkey])\n- Config singletons (seeds = ["config"])\n- Associated Token Accounts (ATAs)\n\nPDAs are fundamental to Solana program\narchitecture. Every serious program uses them.\n\nTry:\n  glossary pda\n  glossary bump\n  glossary cpi\n  practice pda-deep-dive',
};

export const LESSON_FALLBACKS = {
  wallets: { title: 'Wallets', content: 'A wallet stores keypairs:\n- public key = address\n- private key = secret signer\n\nYour public key is like an email address.\nYour private key is the password.\nAnyone with the private key controls the wallet.\n\nOn Solana, wallets are generated offline.\nNo registration, no KYC, no servers. Just math.', tryCmds: ['create-wallet', 'address', 'balance'] },
  transactions: { title: 'Transactions', content: 'A transaction bundles instructions that execute\natomically — all succeed or all fail.\n\nAnatomy:\n1. Recent blockhash (proof of freshness)\n2. Fee payer\n3. Instructions (what to do)\n4. Signatures (authorization)\n\nFinalizes in ~400ms. Costs ~$0.00025.', tryCmds: ['airdrop 2', 'transfer', 'history'] },
  accounts: { title: 'Accounts', content: 'Accounts are Solana\'s storage primitive.\nEVERYTHING is an account:\n- Your wallet? Account.\n- A token balance? Account.\n- A smart contract? Account.\n\nEach has an owner program that controls\nwhat can modify its data.\nMust hold enough SOL to be rent-exempt.', tryCmds: ['account-info', 'glossary rent', 'glossary pda'] },
  validators: { title: 'Validators', content: 'Validators keep Solana running.\nThey process transactions and produce blocks.\n\nSolana uses Proof of History to timestamp\ntransactions before consensus. This is why\nSolana is fast — validators don\'t need to\nagree on time.\n\nAnyone can run one (~$1000/month hardware).', tryCmds: ['glossary epoch', 'learn staking'] },
  rpc: { title: 'RPC', content: 'RPC nodes are the gateway between your app\nand the blockchain. You send JSON-RPC requests\nand get responses.\n\nThis terminal uses RPC calls behind the scenes\nfor everything — balance, transfers, airdrops.\n\nPublic endpoints exist, but production apps\nneed a dedicated provider.', tryCmds: ['balance', 'account-info'] },
  pdas: { title: 'PDAs (Program Derived Addresses)', content: 'A PDA is a Solana address with no private key.\nOnly the program that derived it can sign for it.\n\nHow it works:\n1. Pick seeds: e.g. ["vault", user_pubkey]\n2. Call findProgramAddress(seeds, programId)\n3. Get back (address, bump)\n4. The bump ensures the address is off-curve\n\nWhy PDAs matter:\n- Programs need accounts they can control\n- Users can\'t sign for program-owned data\n- PDAs solve this: deterministic + program-controlled\n\nEvery DeFi protocol, NFT marketplace, and DAO\non Solana uses PDAs extensively.\n\nIn Anchor, you declare PDAs with #[account(seeds, bump)]\nand the framework handles derivation automatically.', tryCmds: ['glossary pda', 'glossary seeds', 'glossary bump', 'practice pda-deep-dive'] },
};

export const WHY_FALLBACKS = {
  wallets: 'Without wallets, there\'s no ownership on-chain.\nEvery transfer, mint, and program call requires\na wallet signature. It\'s your identity.',
  transactions: 'Transactions are how state changes on Solana.\nNothing happens without one. Even reading data\nuses RPC calls that query transaction results.',
  accounts: 'Accounts store ALL state on Solana.\nUnlike Ethereum, even smart contracts use\naccounts for storage. Understanding accounts\nis understanding Solana.',
  validators: 'Without validators, there\'s no blockchain.\nThey process every transaction, produce every\nblock, and secure the network through staking.',
  rpc: 'RPC is how every app talks to Solana.\nWithout it, no balances, no transactions,\nno interactions with programs.',
  'smart-contracts': 'Programs make Solana programmable. Without them\nit would just be a ledger. Programs enable\nDeFi, NFTs, DAOs, and everything else.',
  tokens: 'Tokens represent value and ownership.\nFrom stablecoins to governance tokens, they\npower the entire DeFi ecosystem.',
  staking: 'Staking secures the network and earns passive\nincome. More SOL staked = harder to attack.\nAligns incentives between users and validators.',
  pdas: 'PDAs let programs own accounts without private keys.\nWithout PDAs, programs couldn\'t hold tokens, manage\nescrows, or store per-user data. They\'re the foundation\nof every Solana DeFi protocol and smart contract.',
};

export const COMPARE_FALLBACKS = {
  'devnet-localnet': 'DEVNET vs LOCALNET\n\n  Devnet                    Localnet\n  -----                    --------\n  Public network            Your machine only\n  ~400ms latency            ~0ms latency\n  Rate-limited airdrops     Unlimited airdrops\n  Shared state              Fresh state each run\n  Resets periodically       You control resets\n\nUse localnet for development.\nUse devnet for integration testing.',
  'ethereum-solana': 'ETHEREUM vs SOLANA\n\n  Ethereum                  Solana\n  --------                  ------\n  EVM bytecode              BPF bytecode\n  ~12s block time           ~400ms block time\n  Gas fees (variable)       Fixed fees (~$0.00025)\n  Solidity/Vyper            Rust/Anchor\n  ~15 TPS                   ~65,000 TPS (theo.)\n  Proof of Stake            Proof of History + PoS\n\nSolana: faster and cheaper.\nEthereum: deeper ecosystem maturity.',
  'solana-ethereum': 'SOLANA vs ETHEREUM\n\n  Solana                    Ethereum\n  ------                    --------\n  BPF bytecode              EVM bytecode\n  ~400ms block time         ~12s block time\n  Fixed fees (~$0.00025)    Gas fees (variable)\n  Rust/Anchor               Solidity/Vyper\n  ~65,000 TPS (theo.)       ~15 TPS\n  Proof of History + PoS    Proof of Stake\n\nSolana optimizes for speed and cost.\nEthereum optimizes for decentralization.',
  'accounts-pdas': 'ACCOUNTS vs PDAs\n\n  Regular Account           PDA\n  ---------------           ---\n  Has a private key          No private key\n  User-created               Program-derived\n  User signs txns            Program signs CPIs\n  Random address             Deterministic address\n  Any program can own        Derived from one program\n\nPDAs are a special type of account.\nThey let programs control data without keys.',
  'pdas-accounts': 'PDAs vs REGULAR ACCOUNTS\n\n  PDA                       Regular Account\n  ---                       ---------------\n  No private key             Has a private key\n  Program-derived            User-created\n  Program signs CPIs         User signs txns\n  Deterministic address      Random address\n  Derived from one program   Any program can own\n\nPDAs are accounts that only programs can sign for.\nPerfect for vaults, escrows, and data storage.',
};
