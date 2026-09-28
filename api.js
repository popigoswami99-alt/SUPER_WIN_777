export async function getState(){return fetch("/api/state",{credentials:"same-origin"}).then(r=>r.json())}
export async function getResults(){return fetch("/api/results",{credentials:"same-origin"}).then(r=>r.json())}
export async function getLeaderboard(){return fetch("/api/leaderboard",{credentials:"same-origin"}).then(r=>r.json())}
export async function getMissions(){return fetch("/api/missions",{credentials:"same-origin"}).then(r=>r.json())}
export async function getSession(){return fetch("/api/session",{credentials:"same-origin"}).then(r=>r.json())}
export async function placeVirtualPlay(selection,virtualStake){
 return fetch("/api/play",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({selection,virtualStake})}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||"Play failed");return d});
}
export async function getHistory(){return fetch("/api/history",{credentials:"same-origin"}).then(r=>r.json())}
export async function getNotifications(){return fetch("/api/notifications",{credentials:"same-origin"}).then(r=>r.json())}
export function connectLive(onMessage){
 try{
  const es=new EventSource("/api/live");
  es.onmessage=e=>{try{onMessage(JSON.parse(e.data))}catch{}};
  return es;
 }catch{return null}
}