# Localnet Architecture Plan (solana-test-validator)

This plan details the hybrid architecture approach, allowing the Solana AI Teacher to switch between a lightning-fast local sandbox and the public devnet.

---

## 1. What I Need From You (User Tasks)

You do **not** need to install Rust to run the local blockchain. You only need the pre-compiled Solana CLI tools.

### Step 1: Install Solana CLI
Since you are on Windows, you have two options. 

**Option A: Native Windows (Powershell/CMD)**
Open a command prompt as Administrator and run:
```cmd
cmd /c "curl https://release.solana.com/v1.18.18/solana-install-init-x86_64-pc-windows-msvc.exe --output C:\solana-install-tmp\solana-install-init.exe --create-dirs"
C:\solana-install-tmp\solana-install-init.exe v1.18.18
```
*(After it finishes, close and reopen your terminal and type `solana --version` to verify).*

**Option B: Windows Subsystem for Linux (WSL) - Recommended**
If you use WSL/Ubuntu for development, run this in your WSL terminal:
```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

### Step 2: Run the Local Validator
Open a completely new terminal window (keep it separate from your React frontend) and run:
```bash
solana-test-validator
```
Leave this terminal running. It will start producing blocks at `http://127.0.0.1:8899`.

### Step 3: Optional Configuration
By default, the CLI might look at mainnet. Tell it to look at your localnet so you can use CLI commands if needed:
```bash
solana config set --url localhost
```

---

## 2. What I Will Implement (AI Tasks)

I will handle all the backend code and the integration with your React terminal to support this architecture.

### A. Dynamic Network Configuration
- Set up the Node.js + Express backend.
- Create a configuration manager that allows the active RPC URL to switch dynamically between `http://127.0.0.1:8899` (Localnet) and `https://api.devnet.solana.com` (Devnet).

### B. New Terminal Commands
I will add network switching commands to the terminal logic:
- `network switch localnet`: Connects to the local validator.
- `network switch devnet`: Connects to public devnet.
- `network status`: Displays current active cluster and ping time.

### C. Solana Operations (@solana/web3.js)
I will implement the core teaching commands against the active network:
- **`airdrop <amount>`**: Calls `requestAirdrop`. On localnet, this will instantly grant 100+ SOL. On devnet, it will handle rate limits gracefully.
- **`balance`**: Fetches real-time SOL balance.
- **`transfer <amount> <address>`**: Signs and sends a real transaction. On localnet, this will confirm in <400ms.
- **`wallet create`**: Generates a new keypair in memory for the session.

### D. AI Integration (Gemini)
- Connect the Gemini API to explain the results of the transactions (e.g., explaining what a signature is, or why a transfer succeeded/failed).
- Stream responses over WebSockets to your `Terminal.jsx` component.

### E. Frontend Integration
- Connect your existing `Terminal.jsx` (and the `executeCommand` service) to the new Node.js backend.
- Ensure the `terminalUser` state and prompt formatting work seamlessly with the backend's user session state.
