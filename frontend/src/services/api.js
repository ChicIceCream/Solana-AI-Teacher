const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function request(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    return await res.json();
  } catch {
    return { success: false, error: { code: 'NETWORK_ERROR', message: 'Cannot reach backend' } };
  }
}

export const api = {
  health: () => request('/api/health'),
  createWallet: () => request('/api/wallet/create', { method: 'POST' }),
  importWallet: (privateKey) => request('/api/wallet/import', { method: 'POST', body: JSON.stringify({ privateKey }) }),
  getBalance: (address) => request(`/api/wallet/${address}/balance`),
  airdrop: (address, amount = 1) => request('/api/wallet/airdrop', { method: 'POST', body: JSON.stringify({ address, amount }) }),
  transfer: (encryptedPrivateKey, to, amount) => request('/api/wallet/transfer', { method: 'POST', body: JSON.stringify({ encryptedPrivateKey, to, amount }) }),
  getAccountInfo: (address) => request(`/api/wallet/${address}/account`),
  getHistory: (address) => request(`/api/wallet/${address}/history`),
  explain: (topic, mode = 'normal') => request('/api/ai/explain', { method: 'POST', body: JSON.stringify({ topic, mode }) }),
  chat: (message, sessionId) => request('/api/ai/chat', { method: 'POST', body: JSON.stringify({ message, sessionId }) }),
  suggest: (context) => request('/api/ai/suggest', { method: 'POST', body: JSON.stringify({ context }) }),
  forgetWallet: (address) => request(`/api/wallet/${address}`, { method: 'DELETE' }),
  switchNetwork: (network) => request('/api/wallet/network', { method: 'POST', body: JSON.stringify({ network }) }),
  learn: (topic) => request('/api/ai/learn', { method: 'POST', body: JSON.stringify({ topic }) }),
  lesson: (topic) => request('/api/ai/lesson', { method: 'POST', body: JSON.stringify({ topic }) }),
  practice: (scenario) => request('/api/ai/practice', { method: 'POST', body: JSON.stringify({ scenario }) }),
  why: (topic) => request('/api/ai/why', { method: 'POST', body: JSON.stringify({ topic }) }),
  compare: (a, b) => request('/api/ai/compare', { method: 'POST', body: JSON.stringify({ a, b }) }),
};

export default api;
