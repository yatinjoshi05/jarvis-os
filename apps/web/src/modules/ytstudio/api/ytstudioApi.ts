const API_BASE = 'http://localhost:3001/api/ytstudio';

export async function fetchChannels() {
  const res = await fetch(`${API_BASE}/channels`);
  if (!res.ok) throw new Error('Failed to fetch channels');
  return res.json();
}

export async function syncChannel(channelId: string) {
  const res = await fetch(`${API_BASE}/channels/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channelId })
  });
  if (!res.ok) throw new Error('Failed to sync channel');
  return res.json();
}

export async function connectChannel(channelData: any) {
  const res = await fetch(`${API_BASE}/channels/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(channelData)
  });
  if (!res.ok) throw new Error('Failed to connect channel');
  return res.json();
}

export async function disconnectChannel(channelId: string) {
  const res = await fetch(`${API_BASE}/channels/disconnect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channelId })
  });
  if (!res.ok) throw new Error('Failed to disconnect channel');
  return res.json();
}

export async function fetchApiStatus() {
  const res = await fetch(`${API_BASE}/api-center/status`);
  if (!res.ok) throw new Error('Failed to fetch API status');
  return res.json();
}

export async function testApiBridge(apiId: string) {
  const res = await fetch(`${API_BASE}/api-center/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiId })
  });
  if (!res.ok) throw new Error('Failed to test API bridge');
  return res.json();
}

export async function saveApiKey(serviceId: string, apiKey: string) {
  const res = await fetch(`${API_BASE}/api-center/save-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ serviceId, apiKey })
  });
  if (!res.ok) throw new Error('Failed to save API key');
  return res.json();
}

export async function fetchStories() {
  const res = await fetch(`${API_BASE}/stories`);
  if (!res.ok) throw new Error('Failed to fetch stories');
  return res.json();
}

export async function generateStory(payload: any) {
  const res = await fetch(`${API_BASE}/stories/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to generate story');
  return res.json();
}

export async function triggerPipeline(payload: any) {
  const res = await fetch(`${API_BASE}/pipeline/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to trigger production pipeline');
  return res.json();
}

export async function fetchCharacters() {
  const res = await fetch(`${API_BASE}/characters`);
  if (!res.ok) throw new Error('Failed to fetch characters');
  return res.json();
}

export async function fetchCharacterVault() {
  const res = await fetch(`${API_BASE}/character-memory/vault`);
  if (!res.ok) throw new Error('Failed to fetch character vault');
  return res.json();
}

export async function lockCharacterProfile(id: string, isLocked: boolean) {
  const res = await fetch(`${API_BASE}/character-memory/lock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, isLocked })
  });
  if (!res.ok) throw new Error('Failed to lock character profile');
  return res.json();
}

export async function previewCharacterVoice(id: string) {
  const res = await fetch(`${API_BASE}/character-memory/preview-voice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  if (!res.ok) throw new Error('Failed to preview character voice');
  return res.json();
}

export async function verifyCharacterConsistency(payload: any) {
  const res = await fetch(`${API_BASE}/character-memory/verify-consistency`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to verify character consistency');
  return res.json();
}

export async function sendDirectorCommand(command: string) {
  const res = await fetch(`${API_BASE}/director/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command })
  });
  if (!res.ok) throw new Error('Failed to execute director command');
  return res.json();
}

export async function fetchDirectorStatus() {
  const res = await fetch(`${API_BASE}/director/status`);
  if (!res.ok) throw new Error('Failed to fetch director status');
  return res.json();
}

export async function fetchAgentHub() {
  const res = await fetch(`${API_BASE}/agents/hub`);
  if (!res.ok) throw new Error('Failed to fetch agent hub data');
  return res.json();
}

export async function dispatchMultiAgentTask(command: string) {
  const res = await fetch(`${API_BASE}/agents/dispatch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command })
  });
  if (!res.ok) throw new Error('Failed to dispatch multi-agent task');
  return res.json();
}

export async function fetchStrategyBrain() {
  const res = await fetch(`${API_BASE}/strategy/recommendations`);
  if (!res.ok) throw new Error('Failed to fetch strategy recommendations');
  return res.json();
}

export async function fetchLearningDashboard() {
  const res = await fetch(`${API_BASE}/learning/dashboard`);
  if (!res.ok) throw new Error('Failed to fetch learning dashboard');
  return res.json();
}

export async function runLearningCycle() {
  const res = await fetch(`${API_BASE}/learning/run-cycle`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to trigger self-improvement cycle');
  return res.json();
}

export async function predictPerformance(payload: any) {
  const res = await fetch(`${API_BASE}/learning/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to predict performance');
  return res.json();
}

export async function toggleAutonomousMode(enabled: boolean) {
  const res = await fetch(`${API_BASE}/learning/autonomous-mode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled })
  });
  if (!res.ok) throw new Error('Failed to toggle autonomous mode');
  return res.json();
}

export async function startChannelOAuth() {
  const res = await fetch(`${API_BASE}/channels/oauth/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to initiate OAuth authorization flow');
  return res.json();
}

export async function callbackChannelOAuth(payload: any) {
  const res = await fetch(`${API_BASE}/channels/oauth/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to complete OAuth token authorization');
  return res.json();
}
