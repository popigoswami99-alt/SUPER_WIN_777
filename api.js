export async function getState(){return fetch("/api/state").then(r=>r.json())}
export async function getResults(){return fetch("/api/results").then(r=>r.json())}
export async function getLeaderboard(){return fetch("/api/leaderboard").then(r=>r.json())}
export async function getMissions(){return fetch("/api/missions").then(r=>r.json())}
export function connectLive(onMessage){try{const p=location.protocol==="https:"?"wss":"ws";const ws=new WebSocket(p+"://"+location.host+"/live");ws.onmessage=e=>onMessage(JSON.parse(e.data));return ws}catch{return null}}