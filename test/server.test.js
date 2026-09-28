const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

test("free-play cash systems stay disabled",()=>{
 const schema=JSON.parse(fs.readFileSync(path.join(__dirname,"..","data","schema.json"),"utf8"));
 assert.equal(schema.cashFeatures.deposit,false);
 assert.equal(schema.cashFeatures.withdrawal,false);
 assert.equal(schema.cashFeatures.payout,false);
 assert.equal(schema.cashFeatures.upi,false);
 assert.equal(schema.cashFeatures.bankTransfer,false);
});

test("server exposes persistent realtime architecture",()=>{
 const source=fs.readFileSync(path.join(__dirname,"..","server.js"),"utf8");
 assert.match(source,/node:sqlite/);
 assert.match(source,/\/api\/live/);
 assert.match(source,/\/api\/play/);
 assert.match(source,/ADMIN_TOKEN/);
});