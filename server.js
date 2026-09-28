const http=require("http");
const fs=require("fs");
const path=require("path");
const crypto=require("crypto");
const {DatabaseSync}=require("node:sqlite");

const PORT=process.env.PORT||3000;
const DB_FILE=process.env.DB_FILE||path.join(__dirname,"data","superwin.sqlite");
fs.mkdirSync(path.dirname(DB_FILE),{recursive:true});
const db=new DatabaseSync(DB_FILE);

db.exec(`
PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS users(
 id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, xp INTEGER NOT NULL DEFAULT 0,
 vipLevel INTEGER NOT NULL DEFAULT 1, createdAt TEXT NOT NULL, lastLogin TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS wallets(
 userId TEXT PRIMARY KEY, virtualCoins INTEGER NOT NULL DEFAULT 1250,
 lifetimeEarned INTEGER NOT NULL DEFAULT 0, lifetimeSpent INTEGER NOT NULL DEFAULT 0,
 FOREIGN KEY(userId) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS rounds(
 id TEXT PRIMARY KEY, game TEXT NOT NULL, startsAt TEXT NOT NULL, endsAt TEXT NOT NULL,
 result INTEGER, color TEXT, status TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS plays(
 id TEXT PRIMARY KEY, userId TEXT NOT NULL, roundId TEXT NOT NULL, game TEXT NOT NULL,
 selection TEXT NOT NULL, virtualStake INTEGER NOT NULL, result TEXT NOT NULL,
 profit INTEGER NOT NULL, createdAt TEXT NOT NULL,
 FOREIGN KEY(userId) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS sessions(
 token TEXT PRIMARY KEY, userId TEXT NOT NULL, createdAt TEXT NOT NULL, expiresAt TEXT NOT NULL,
 FOREIGN KEY(userId) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS notifications(
 id TEXT PRIMARY KEY, userId TEXT, title TEXT NOT NULL, body TEXT NOT NULL,
 read INTEGER NOT NULL DEFAULT 0, createdAt TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS auditLogs(
 id TEXT PRIMARY KEY, actor TEXT NOT NULL, action TEXT NOT NULL, target TEXT NOT NULL, createdAt TEXT NOT NULL
);
`);

const nowISO=()=>new Date().toISOString();
const id=()=>crypto.randomUUID();
const colorFor=n=>n===0||n===5?"violet":n%2?"red":"green";
let roundNo=Number(process.env.START_ROUND||1000);
let roundEnds=Date.now()+30000;
const history=[];
const clients=new Set();

function broadcast(payload){
 const data=`data: ${JSON.stringify(payload)}\\n\\n`;
 for(const res of clients){try{res.write(data)}catch{clients.delete(res)}}
}
function createRound(){
 const now=Date.now(), start=new Date(now).toISOString(), end=new Date(now+30000).toISOString();
 const rid="SW"+roundNo;
 db.prepare("INSERT OR REPLACE INTO rounds(id,game,startsAt,endsAt,result,color,status) VALUES(?,?,?,?,?,?,?)")
   .run(rid,"Win Go",start,end,null,null,"open");
 roundEnds=now+30000;
 return rid;
}
function closeRound(){
 const result=Math.floor(Math.random()*10), color=colorFor(result), rid="SW"+roundNo;
 db.prepare("UPDATE rounds SET result=?,color=?,status='closed' WHERE id=?").run(result,color,rid);
 history.unshift({round:roundNo,result,color,time:nowISO()});
 if(history.length>30) history.pop();
 broadcast({type:"round_result",round:{id:rid,result,color}});
 roundNo++;
 createRound();
 broadcast({type:"round",id:"SW"+roundNo,secondsLeft:30});
}
function tick(){
 if(Date.now()>=roundEnds) closeRound();
 broadcast({type:"tick",id:"SW"+roundNo,secondsLeft:Math.max(0,Math.ceil((roundEnds-Date.now())/1000))});
}
createRound();
setInterval(tick,1000);

function json(res,data,status=200){
 res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"});
 res.end(JSON.stringify(data));
}
function serve(res,file,type){
 fs.readFile(path.join(__dirname,file),(e,b)=>{
  if(e){res.writeHead(404);return res.end("Not found")}
  res.writeHead(200,{"Content-Type":type});res.end(b);
 });
}
function body(req){
 return new Promise((resolve,reject)=>{
  let s="";req.on("data",c=>{s+=c;if(s.length>100000)req.destroy()});
  req.on("end",()=>{try{resolve(s?JSON.parse(s):{})}catch{reject(new Error("Invalid JSON"))}});
  req.on("error",reject);
 });
}
function cookies(req){
 const out={};for(const part of (req.headers.cookie||"").split(";")){
  const [k,...v]=part.trim().split("=");if(k)out[k]=decodeURIComponent(v.join("=")||"");
 }return out;
}
function sessionUser(req){
 const token=cookies(req).sw_session;if(!token)return null;
 const s=db.prepare("SELECT userId FROM sessions WHERE token=? AND expiresAt>?").get(token,nowISO());
 if(!s)return null;
 return db.prepare("SELECT id,username,xp,vipLevel FROM users WHERE id=?").get(s.userId)||null;
}
function ensureUser(req,res){
 let u=sessionUser(req);
 if(u)return u;
 const uid=id(), username="Guest"+String(Math.floor(1000+Math.random()*9000)), now=nowISO();
 db.prepare("INSERT INTO users(id,username,createdAt,lastLogin) VALUES(?,?,?,?)").run(uid,username,now,now);
 db.prepare("INSERT INTO wallets(userId) VALUES(?)").run(uid);
 const token=crypto.randomBytes(32).toString("hex");
 const expires=new Date(Date.now()+30*24*3600*1000).toISOString();
 db.prepare("INSERT INTO sessions(token,userId,createdAt,expiresAt) VALUES(?,?,?,?)").run(token,uid,now,expires);
 res.setHeader("Set-Cookie",`sw_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);
 return {id:uid,username,xp:0,vipLevel:1};
}

const leaderboard=()=>db.prepare(`
 SELECT u.username, w.virtualCoins AS score FROM users u JOIN wallets w ON w.userId=u.id
 ORDER BY w.virtualCoins DESC LIMIT 20
`).all();

const server=http.createServer(async(req,res)=>{
 try{
  const u=new URL(req.url,"http://localhost");
  if(u.pathname==="/api/health") return json(res,{online:true,mode:"free-play",cash:false,deposit:false,withdrawal:false,payout:false,upi:false,bankTransfer:false,database:true,realtime:true});
  if(u.pathname==="/api/session" && req.method==="GET"){
   const user=ensureUser(req,res);
   const wallet=db.prepare("SELECT virtualCoins,lifetimeEarned,lifetimeSpent FROM wallets WHERE userId=?").get(user.id);
   return json(res,{user,wallet,balanceType:"virtual",cashEnabled:false});
  }
  if(u.pathname==="/api/state"){
   return json(res,{server:"online",round:{id:"SW"+roundNo,secondsLeft:Math.max(0,Math.ceil((roundEnds-Date.now())/1000))},onlinePlayers:db.prepare("SELECT COUNT(*) c FROM users").get().c,balanceType:"virtual",cashEnabled:false,realtime:true});
  }
  if(u.pathname==="/api/results") return json(res,{results:history.length?history:db.prepare("SELECT id AS round,result,color,createdAt AS time FROM rounds WHERE status='closed' ORDER BY endsAt DESC LIMIT 30").all()});
  if(u.pathname==="/api/leaderboard") return json(res,{leaders:leaderboard()});
  if(u.pathname==="/api/missions") return json(res,{missions:[
   {id:"daily",title:"Daily Player",text:"Play 3 free rounds",reward:250,progress:0,target:3},
   {id:"streak",title:"Hot Streak",text:"Win 2 rounds",reward:300,progress:0,target:2},
   {id:"explorer",title:"Game Explorer",text:"Open 4 games",reward:400,progress:0,target:4}
  ]});
  if(u.pathname==="/api/live"){
   res.writeHead(200,{"Content-Type":"text/event-stream","Cache-Control":"no-cache","Connection":"keep-alive","Access-Control-Allow-Origin":"*"});
   res.write(`data: ${JSON.stringify({type:"connected",id:"SW"+roundNo,secondsLeft:Math.max(0,Math.ceil((roundEnds-Date.now())/1000))})}\\n\\n`);
   clients.add(res);req.on("close",()=>clients.delete(res));return;
  }
  if(u.pathname==="/api/play" && req.method==="POST"){
   const user=ensureUser(req,res);const p=await body(req);
   const stake=Number(p.virtualStake), selection=String(p.selection||"");
   if(!Number.isInteger(stake)||![10,50,100].includes(stake))return json(res,{error:"Invalid virtual stake"},400);
   if(!selection||selection.length>40)return json(res,{error:"Invalid selection"},400);
   const wallet=db.prepare("SELECT virtualCoins FROM wallets WHERE userId=?").get(user.id);
   if(!wallet||wallet.virtualCoins<stake)return json(res,{error:"Not enough virtual coins",balance:wallet?.virtualCoins||0},400);
   const win=crypto.randomInt(100)<48, profit=win?stake:-stake;
   const newBalance=wallet.virtualCoins+profit;
   const pid=id();
   db.exec("BEGIN");
   try{
    db.prepare("UPDATE wallets SET virtualCoins=?,lifetimeSpent=lifetimeSpent+?,lifetimeEarned=lifetimeEarned+? WHERE userId=?")
      .run(newBalance,stake,win?stake:0,user.id);
    db.prepare("INSERT INTO plays(id,userId,roundId,game,selection,virtualStake,result,profit,createdAt) VALUES(?,?,?,?,?,?,?,?,?)")
      .run(pid,user.id,"SW"+roundNo,"Win Go",selection,stake,win?"win":"loss",profit,nowISO());
    db.prepare("INSERT INTO auditLogs(id,actor,action,target,createdAt) VALUES(?,?,?,?,?)").run(id(),user.id,"virtual_play",pid,nowISO());
    db.exec("COMMIT");
   }catch(e){db.exec("ROLLBACK");throw e}
   return json(res,{ok:true,play:{id:pid,result:win?"win":"loss",profit},wallet:{virtualCoins:newBalance}});
  }
  if(u.pathname==="/api/history"){
   const user=sessionUser(req);if(!user)return json(res,{plays:[]});
   return json(res,{plays:db.prepare("SELECT game,selection,virtualStake,result,profit,createdAt FROM plays WHERE userId=? ORDER BY createdAt DESC LIMIT 50").all(user.id)});
  }
  if(u.pathname==="/api/notifications"){
   const user=sessionUser(req);if(!user)return json(res,{notifications:[]});
   return json(res,{notifications:db.prepare("SELECT title,body,read,createdAt FROM notifications WHERE userId=? OR userId IS NULL ORDER BY createdAt DESC LIMIT 30").all(user.id)});
  }
  if(u.pathname==="/admin") return serve(res,"admin.html","text/html; charset=utf-8");
  if(u.pathname==="/manifest.webmanifest") return serve(res,"manifest.webmanifest","application/manifest+json");
  if(u.pathname==="/sw.js") return serve(res,"sw.js","application/javascript");
  if(u.pathname==="/"||u.pathname==="/index.html") return serve(res,"index.html","text/html; charset=utf-8");
  return res.end("SUPER WIN 777");
 }catch(e){console.error(e);return json(res,{error:"Server error"},500)}
});
server.listen(PORT,()=>console.log("SUPER WIN 777 free-play server listening on "+PORT));