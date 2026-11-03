const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const app = express(); const server = http.createServer(app); const io = new Server(server);
app.use(express.static(path.join(__dirname, 'public')));
const W=1200,H=700,MAX=4, SPEED=270, BULLET_SPEED=650;
const rooms = new Map();
const cleanRoom = s => String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);
const cleanName = s => String(s||'Pilot').replace(/[^\w -]/g,'').trim().slice(0,16)||'Pilot';
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function roomOf(socket){return rooms.get(socket.data.room)}
function spawn(p){p.x=80+Math.random()*(W-160);p.y=80+Math.random()*(H-160);p.hp=100;p.alive=true;p.invulnerableUntil=Date.now()+1800;p.lastShot=0;}
function state(r){return {players:Object.values(r.players).map(p=>({id:p.id,name:p.name,x:p.x,y:p.y,angle:p.angle,hp:p.hp,score:p.score,kills:p.kills,alive:p.alive,invulnerable:p.invulnerableUntil>Date.now()})),bullets:r.bullets,room:r.code}}
io.on('connection',socket=>{
 socket.on('join',({name,room}={},reply=()=>{})=>{
  if(socket.data.room) return reply({error:'Already in a room. Refresh to join another.'});
  const code=cleanRoom(room)||Math.random().toString(36).slice(2,7).toUpperCase();
  let r=rooms.get(code); if(!r){r={code,players:{},bullets:[],last:Date.now()};rooms.set(code,r)}
  if(Object.keys(r.players).length>=MAX)return reply({error:'Room full (maximum 4 players).'});
  const p={id:socket.id,name:cleanName(name),x:0,y:0,angle:0,hp:100,score:0,kills:0,alive:true,keys:{},lastShot:0,invulnerableUntil:0};spawn(p);r.players[socket.id]=p;socket.data.room=code;socket.join(code);
  reply({ok:true,id:socket.id,room:code});io.to(code).emit('notice',p.name+' joined the arena');
 });
 socket.on('input',data=>{const r=roomOf(socket);if(!r)return;const p=r.players[socket.id];if(!p)return;p.keys={up:!!data?.up,down:!!data?.down,left:!!data?.left,right:!!data?.right,shoot:!!data?.shoot};if(Number.isFinite(data?.angle))p.angle=data.angle;});
 socket.on('disconnect',()=>{const r=roomOf(socket);if(!r)return;const p=r.players[socket.id];delete r.players[socket.id];if(p)io.to(r.code).emit('notice',p.name+' left');if(!Object.keys(r.players).length)rooms.delete(r.code)});
});
setInterval(()=>{const now=Date.now();for(const r of rooms.values()){
 const dt=Math.min((now-r.last)/1000,.05);r.last=now;
 for(const p of Object.values(r.players)){
  if(!p.alive)continue;
  let dx=Number(p.keys.right)-Number(p.keys.left),dy=Number(p.keys.down)-Number(p.keys.up),len=Math.hypot(dx,dy)||1;
  p.x=clamp(p.x+dx/len*SPEED*dt,20,W-20);p.y=clamp(p.y+dy/len*SPEED*dt,20,H-20);
  if(p.keys.shoot&&now-p.lastShot>260){p.lastShot=now;r.bullets.push({id:Math.random().toString(36).slice(2),owner:p.id,x:p.x+Math.cos(p.angle)*25,y:p.y+Math.sin(p.angle)*25,vx:Math.cos(p.angle)*BULLET_SPEED,vy:Math.sin(p.angle)*BULLET_SPEED,ttl:1.5});}
 }
 const next=[];for(const b of r.bullets){b.x+=b.vx*dt;b.y+=b.vy*dt;b.ttl-=dt;if(b.ttl<=0||b.x<0||b.x>W||b.y<0||b.y>H)continue;
 let hit=false;for(const p of Object.values(r.players)){if(!p.alive||p.id===b.owner||now<p.invulnerableUntil)continue;if(Math.hypot(p.x-b.x,p.y-b.y)<22){hit=true;p.hp=Math.max(0,p.hp-25);if(p.hp===0){p.alive=false;const killer=r.players[b.owner];if(killer){killer.kills++;killer.score+=100;}io.to(p.id).emit('eliminated',{killer:killer?.name||'Unknown'});setTimeout(()=>{if(r.players[p.id]){spawn(p);io.to(p.id).emit('respawned')}},2500);}break;}}
 if(!hit)next.push(b);
 }r.bullets=next;io.to(r.code).emit('state',state(r));
}},1000/30);
const PORT=process.env.PORT||3000;server.listen(PORT,()=>console.log(`Neon Space Battle running at http://localhost:${PORT}`));
