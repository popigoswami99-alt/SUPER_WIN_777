const http=require("http");
const fs=require("fs");
const path=require("path");
const PORT=process.env.PORT||3000;
let roundNo=1000;
let roundEnds=Date.now()+30000;
const history=[];
const leaderboard=[
  {name:"Shadow777",score:9850},{name:"LuckyPlayer",score:9119},
  {name:"ProGamer",score:8388},{name:"KingStar",score:7657},{name:"NovaX",score:6926}
];
const missions=[
  {id:"daily",title:"Daily Player",text:"Play 3 free rounds",reward:250,progress:0,target:3},
  {id:"streak",title:"Hot Streak",text:"Win 2 rounds",reward:300,progress:0,target:2},
  {id:"explorer",title:"Game Explorer",text:"Open 4 games",reward:400,progress:0,target:4}
];
function nextRound(){
  const now=Date.now();
  if(now>=roundEnds){
    const result=Math.floor(Math.random()*10);
    history.unshift({round:roundNo,result,time:new Date().toISOString(),color:result===0||result===5?"violet":result%2?"red":"green"});
    if(history.length>30) history.pop();
    roundNo++;
    roundEnds=now+30000;
  }
}
setInterval(nextRound,250);
function json(res,data,status=200){res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"});res.end(JSON.stringify(data))}
function serve(res,file,type){
  fs.readFile(path.join(__dirname,file),(e,b)=>{if(e){res.writeHead(404);return res.end("Not found")}res.writeHead(200,{"Content-Type":type});res.end(b)})
}
const server=http.createServer((req,res)=>{
  nextRound();
  const u=new URL(req.url,"http://localhost");
  if(u.pathname==="/api/health") return json(res,{online:true,mode:"free-play",cash:false,deposit:false,withdrawal:false});
  if(u.pathname==="/api/state") return json(res,{server:"online",round:{id:"SW"+roundNo,secondsLeft:Math.max(0,Math.ceil((roundEnds-Date.now())/1000))},onlinePlayers:1284+Math.floor(Math.random()*35),balanceType:"virtual",cashEnabled:false});
  if(u.pathname==="/api/results") return json(res,{results:history});
  if(u.pathname==="/api/leaderboard") return json(res,{leaders:leaderboard});
  if(u.pathname==="/api/missions") return json(res,{missions});
  if(u.pathname==="/admin") return serve(res,"admin.html","text/html; charset=utf-8");
  if(u.pathname==="/manifest.webmanifest") return serve(res,"manifest.webmanifest","application/manifest+json");
  if(u.pathname==="/sw.js") return serve(res,"sw.js","application/javascript");
  if(u.pathname==="/"||u.pathname==="/index.html") return serve(res,"index.html","text/html; charset=utf-8");
  return res.end("SUPER WIN 777");
});
server.listen(PORT,()=>console.log("SUPER WIN 777 free-play server listening on "+PORT));