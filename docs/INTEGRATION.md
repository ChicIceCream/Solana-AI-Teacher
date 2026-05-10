# Frontend Integration Guide

This guide explains how to connect your React frontend to the Solana AI Teacher backend.

## Connection Setup

### REST API
Base URL: `http://localhost:3001`

```javascript
const API_BASE = 'http://localhost:3001';

async function apiCall(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  return response.json();
}
```

### WebSocket
URL: `ws://localhost:3001/ws`

```javascript
const ws = new WebSocket('ws://localhost:3001/ws');

ws.onopen = () => console.log('Connected');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'info':
      // Welcome message with session ID and available commands
      console.log('Session:', message.payload.sessionId);
      break;
    case 'stream':
      // Progress updates (e.g., "Processing: balance...")
      console.log(message.payload.text);
      break;
    case 'result':
      // Command result
      console.log('Result:', message.payload);
      break;
    case 'error':
      // Error occurred
      console.error(message.payload.code, message.payload.message);
      break;
  }
};
```

## WebSocket Protocol

### Sending Commands

```javascript
// Send a command
ws.send(JSON.stringify({
  type: 'command',
  payload: {
    command: 'create-wallet',
    args: {}
  }
}));

// Balance check
ws.send(JSON.stringify({
  type: 'command',
  payload: {
    command: 'balance',
    args: { address: '7xKX...' }
  }
}));

// Airdrop
ws.send(JSON.stringify({
  type: 'command',
  payload: {
    command: 'airdrop',
    args: { address: '7xKX...', amount: 1 }
  }
}));

// AI explain
ws.send(JSON.stringify({
  type: 'command',
  payload: {
    command: 'explain',
    args: { topic: 'wallets', mode: 'eli5' }
  }
}));

// Chat
ws.send(JSON.stringify({
  type: 'command',
  payload: {
    command: 'chat',
    args: { message: 'What is Solana?' }
  }
}));
```

### Available Commands

| Command | Required Args | Optional Args |
|---------|--------------|---------------|
| `create-wallet` | — | — |
| `import-wallet` | `privateKey` | — |
| `balance` | `address` | — |
| `airdrop` | `address` | `amount` (default: 1) |
| `transfer` | `encryptedPrivateKey`, `to`, `amount` | — |
| `account-info` | `address` | — |
| `history` | `address` | `limit` (default: 10) |
| `explain` | `topic` | `mode` ("normal"/"eli5") |
| `explain-transaction` | `transaction` | `mode` |
| `chat` | `message` | — |
| `suggest` | — | `context` |

### Message Flow

```
Client                          Server
  │                               │
  │──── connect ──────────────────│
  │                               │
  │◄─── info (welcome) ──────────│
  │                               │
  │──── command (balance) ────────│
  │                               │
  │◄─── stream (Processing...) ──│
  │◄─── result (balance data) ───│
  │                               │
  │──── command (explain) ────────│
  │                               │
  │◄─── stream (Processing...) ──│
  │◄─── result (explanation) ────│
```

## React Integration Example

```jsx
import { useState, useEffect, useCallback, useRef } from 'react';

function useSolanaTerminal() {
  const ws = useRef(null);
  const [connected, setConnected] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:3001/ws');

    ws.current.onopen = () => setConnected(true);
    ws.current.onclose = () => setConnected(false);
    
    ws.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      
      if (msg.type === 'info') {
        setSessionId(msg.payload.sessionId);
      }
      
      setMessages(prev => [...prev, msg]);
    };

    return () => ws.current?.close();
  }, []);

  const sendCommand = useCallback((command, args = {}) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'command',
        payload: { command, args }
      }));
    }
  }, []);

  return { connected, sessionId, messages, sendCommand };
}

// Usage in component
function Terminal() {
  const { connected, messages, sendCommand } = useSolanaTerminal();
  
  return (
    <div>
      <p>Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}</p>
      <button onClick={() => sendCommand('create-wallet')}>Create Wallet</button>
      <button onClick={() => sendCommand('explain', { topic: 'wallets', mode: 'eli5' })}>
        Explain Wallets
      </button>
    </div>
  );
}
```

## Wallet State Management

The backend returns `encryptedPrivateKey` when creating/importing wallets. Store this in your React state (never in localStorage for production):

```javascript
const [wallet, setWallet] = useState(null);

// On create-wallet result:
if (result.payload.data.publicKey) {
  setWallet({
    publicKey: result.payload.data.publicKey,
    encryptedPrivateKey: result.payload.data.encryptedPrivateKey,
  });
}

// For transfers, pass the encryptedPrivateKey back:
sendCommand('transfer', {
  encryptedPrivateKey: wallet.encryptedPrivateKey,
  to: recipientAddress,
  amount: 0.5,
});
```

## CORS

The backend allows requests from `http://localhost:3000` by default. Set `CORS_ORIGIN` in `.env` to match your frontend URL.

## Error Handling

Always check the `type` field of WebSocket messages:

```javascript
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  
  if (msg.type === 'error') {
    // Show error to user
    showToast(`Error: ${msg.payload.message}`);
    return;
  }
  
  if (msg.type === 'result' && msg.payload.data?.fallback) {
    // AI used fallback response (API was unavailable)
    showToast('Using offline explanation');
  }
};
```
