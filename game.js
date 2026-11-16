const socket=io();const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id);let myId=null,roomCode='',snapshot={players:[],bullets:[]};let angle=0;const keys={up:false,down:false,left:false,right:false,shoot:false};
const stars=Array.from({length:145},()=>({x:Math.random()*1200,y:Math.random()*700,r:Math.random()*1.8+.3,a:Math.random()*.6+.2}));
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),2300)}
$('join').onclick=()=>{if(!socket.connected){$('error').textContent='Connecting to game server. Please wait and try again.';return;}socket.emit('join',{name:$('name').value,room:$('room').value},res=>{if(res.error){$('error').textContent=res.error;return;}myId=res.id;roomCode=res.room;$('menu').style.display='none';$('roomLabel').textContent='ROOM: '+roomCode;$('copy').disabled=false;toast('Arena joined! Room: '+roomCode)})};
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText(roomCode);toast('Room code copied: '+roomCode)}catch{toast('Room code: '+roomCode)}};
socket.on('state',s=>{snapshot=s;const me=s.players.find(p=>p.id===myId);if(!me)return;$('healthText').textContent=me.hp+' / 100';$('healthFill').style.width=me.hp+'%';$('score').textContent=me.score;$('kills').textContent=me.kills;$('leaderboard').innerHTML=s.players.slice().sort((a,b)=>b.score-a.score).map((p,i)=>`<div class="leader"><span>${i+1}. ${escapeHtml(p.name)} ${p.id===myId?'(you)':''}</span><strong>${p.score}</strong></div>`).join('');$('dead').hidden=me.alive});
socket.on('disconnect',()=>{myId=null;snapshot={players:[],bullets:[]};$('menu').style.display='flex';$('roomLabel').textContent='DISCONNECTED';$('copy').disabled=true;$('error').textContent='Connection lost. Wait for reconnection, then launch again.';});socket.on('connect',()=>{if(!myId){$('roomLabel').textContent='CONNECTED';$('error').textContent='';}});socket.on('connect_error',()=>{$('roomLabel').textContent='CONNECTION ERROR';});socket.on('notice',toast);socket.on('eliminated',d=>{$('deadText').textContent='Eliminated by '+d.killer+' · Respawning in 2.5s'});socket.on('respawned',()=>toast('You respawned!'));
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
const bindings={KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right'};
window.addEventListener('keydown',e=>{if(document.activeElement.tagName==='INPUT')return;if(bindings[e.code]){keys[bindings[e.code]]=true;e.preventDefault()}});
window.addEventListener('keyup',e=>{if(bindings[e.code]){keys[bindings[e.code]]=false;e.preventDefault()}});
window.addEventListener('blur',()=>{for(const k in keys)keys[k]=false});
canvas.addEventListener('mousemove',e=>{const rect=canvas.getBoundingClientRect();const x=(e.clientX-rect.left)*1200/rect.width,y=(e.clientY-rect.top)*700/rect.height;const me=snapshot.players.find(p=>p.id===myId);if(me)angle=Math.atan2(y-me.y,x-me.x)});

setInterval(()=>{if(myId)socket.emit('input',{...keys,angle})},1000/30);
// Synthesized sound effects: no external sound files or network requests.
let audio=null,muted=false;const effects=[];
function audioReady(){if(muted)return null;try{audio ||= new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();return audio}catch{return null}}
function sound(kind,volume=1){const a=audioReady();if(!a)return;const now=a.currentTime;const osc=a.createOscillator(),gain=a.createGain();osc.connect(gain);gain.connect(a.destination);let duration=.3;
if(kind==='launch'){osc.type='sawtooth';osc.frequency.setValueAtTime(1050,now);osc.frequency.exponentialRampToValueAtTime(125,now+.38);duration=.39;gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.065*volume,now+.025)}
else {osc.type='triangle';osc.frequency.setValueAtTime(170,now);osc.frequency.exponentialRampToValueAtTime(38,now+.55);duration=.56;gain.gain.setValueAtTime(.15*volume,now)}
gain.gain.exponentialRampToValueAtTime(.0001,now+duration);osc.start(now);osc.stop(now+duration+.01)}
function burst(x,y){for(let i=0;i<24;i++){const a=Math.random()*Math.PI*2,v=70+Math.random()*210;effects.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.45+Math.random()*.35,max:.8,r:2+Math.random()*5})}}
socket.on('missileLaunch',d=>{if(d.owner===myId)sound('launch',.9);else sound('launch',.2)});
socket.on('missileImpact',d=>{burst(d.x,d.y);sound('impact',.7)});
const soundBtn=document.createElement('button');soundBtn.className='secondary';soundBtn.textContent='🔊 MISSILE SOUNDS: ON';soundBtn.type='button';soundBtn.onclick=()=>{muted=!muted;soundBtn.textContent=muted?'🔇 MISSILE SOUNDS: OFF':'🔊 MISSILE SOUNDS: ON';if(!muted)audioReady()};document.querySelector('aside').appendChild(soundBtn);
$('join').addEventListener('click',audioReady);
const fireBtn=document.createElement('button');fireBtn.id='fireSeven';fireBtn.type='button';fireBtn.textContent='🚀 FIRE 7 MISSILES';fireBtn.className='fire-seven';document.querySelector('aside').appendChild(fireBtn);
// Send a complete single trigger press to the server for each tap, click or space press.
let firing=false;
function fireOnce(){if(!myId||firing)return;audioReady();firing=true;socket.emit('fireBurst');setTimeout(()=>{firing=false},180)}
fireBtn.addEventListener('click',fireOnce);
canvas.addEventListener('click',fireOnce);
window.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.repeat&&document.activeElement.tagName!=='INPUT'){e.preventDefault();fireOnce()}});
function jet(p,mine){const color=mine?'#7de7fa':'#f8a5a5';ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle+Math.PI/2);
// Twin engine flames, swept wings, stabilizers and cockpit; nose points up.
if(p.moving){const flicker=14+Math.random()*18;
ctx.shadowColor='#ff641c';ctx.shadowBlur=20;ctx.fillStyle='#ff6a1c';ctx.beginPath();ctx.moveTo(-10,24);ctx.lineTo(-8,27+flicker);ctx.lineTo(-3,24);ctx.moveTo(3,24);ctx.lineTo(8,27+flicker);ctx.lineTo(10,24);ctx.fill();
ctx.fillStyle='#fff3aa';ctx.beginPath();ctx.moveTo(-9,24);ctx.lineTo(-8,26+flicker*.65);ctx.lineTo(-6,24);ctx.moveTo(6,24);ctx.lineTo(8,26+flicker*.65);ctx.lineTo(9,24);ctx.fill();ctx.shadowBlur=0;}
ctx.shadowColor=color;ctx.shadowBlur=13;ctx.fillStyle=color;ctx.strokeStyle='#20344b';ctx.lineWidth=1.6;
ctx.beginPath();ctx.moveTo(0,-32);ctx.lineTo(7,-14);ctx.lineTo(10,-5);ctx.lineTo(29,13);ctx.lineTo(29,19);ctx.lineTo(10,13);ctx.lineTo(9,25);ctx.lineTo(16,31);ctx.lineTo(16,34);ctx.lineTo(0,29);ctx.lineTo(-16,34);ctx.lineTo(-16,31);ctx.lineTo(-9,25);ctx.lineTo(-10,13);ctx.lineTo(-29,19);ctx.lineTo(-29,13);ctx.lineTo(-10,-5);ctx.lineTo(-7,-14);ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowBlur=0;
ctx.fillStyle='#253d55';ctx.beginPath();ctx.ellipse(0,-11,5,13,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#b7f5ff';ctx.beginPath();ctx.ellipse(0,-15,3,8,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#52748d';ctx.beginPath();ctx.moveTo(-9,9);ctx.lineTo(9,9);ctx.moveTo(-5,25);ctx.lineTo(-5,30);ctx.moveTo(5,25);ctx.lineTo(5,30);ctx.stroke();ctx.restore()}
let previous=performance.now();function draw(now=performance.now()){const dt=Math.min((now-previous)/1000,.05);previous=now;
ctx.fillStyle='#030a18';ctx.fillRect(0,0,1200,700);ctx.strokeStyle='#12304a55';ctx.lineWidth=1;for(let x=0;x<1200;x+=60){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,700);ctx.stroke()}for(let y=0;y<700;y+=60){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1200,y);ctx.stroke()}
for(const s of stars){ctx.globalAlpha=s.a;ctx.fillStyle='#b7faff';ctx.fillRect(s.x,s.y,s.r,s.r)}ctx.globalAlpha=1;
for(const b of snapshot.bullets){const a=Math.atan2(b.vy,b.vx);ctx.save();ctx.translate(b.x,b.y);ctx.rotate(a);ctx.shadowBlur=15;ctx.shadowColor='#ff9e30';const flame=12+Math.random()*9;ctx.fillStyle='#ff7b22';ctx.beginPath();ctx.moveTo(-13,-3);ctx.lineTo(-13-flame,0);ctx.lineTo(-13,3);ctx.fill();ctx.fillStyle='#ffe5a2';ctx.beginPath();ctx.moveTo(-13,-1.5);ctx.lineTo(-13-flame*.7,0);ctx.lineTo(-13,1.5);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#dbe5ef';ctx.fillRect(-10,-3,19,6);ctx.fillStyle='#ff5765';ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(8,-4);ctx.lineTo(8,4);ctx.closePath();ctx.fill();ctx.fillStyle='#7e9cb4';ctx.fillRect(-8,-7,5,14);ctx.restore()}
for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.life-=dt;if(e.life<=0){effects.splice(i,1);continue}e.x+=e.vx*dt;e.y+=e.vy*dt;e.vx*=.97;e.vy*=.97;ctx.globalAlpha=Math.min(1,e.life*2);ctx.fillStyle=e.life>.35?'#ffb53d':'#f44a34';ctx.beginPath();ctx.arc(e.x,e.y,e.r*e.life/.8,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
for(const p of snapshot.players){if(!p.alive||!Number.isFinite(p.x)||!Number.isFinite(p.y))continue;const mine=p.id===myId,color=mine?'#44f5ff':'#ff65bd';jet(p,mine);if(p.invulnerable){ctx.strokeStyle='#ffffff88';ctx.beginPath();ctx.arc(p.x,p.y,38,0,Math.PI*2);ctx.stroke()}ctx.textAlign='center';ctx.font='bold 14px Segoe UI';ctx.fillStyle=color;ctx.fillText(p.name+(mine?' ★':''),p.x,p.y-45);ctx.fillStyle='#223246';ctx.fillRect(p.x-25,p.y+39,50,5);ctx.fillStyle=p.hp>30?'#30f5b1':'#ff526e';ctx.fillRect(p.x-25,p.y+39,50*p.hp/100,5)}requestAnimationFrame(draw)}draw();
