// Run after `node game/build.mjs`. Requires @napi-rs/canvas for headless Canvas2D.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const {createCanvas,Image}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..');
async function boot(hero='wizard'){
 const canvas=createCanvas(320,180);canvas.addEventListener=()=>{};canvas.focus=()=>{};
 const dummy=()=>({style:{},addEventListener(){},setAttribute(){}});
 const s={console,Image,URLSearchParams,performance,setTimeout:()=>0,clearTimeout(){},navigator:{},location:{search:'?stage=4&hero='+hero},addEventListener(){},matchMedia:()=>({matches:false}),document:{getElementById:id=>id==='game'?canvas:dummy(),createElement:()=>createCanvas(320,180),querySelectorAll:()=>[],hasFocus:()=>true},requestAnimationFrame:()=>{s.ready=true}};s.window=s;
 const scripts=[...fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
 scripts[1]=scripts[1].replace('function loop(now) {',`window.test={update,render,lockArena,resetArena,damageBoss,bossBox,cast,heroVsBosses,resetHero,die,buildLevel,
 get flags(){return flags},get hearts(){return hearts},get P(){return P},get grid(){return grid},get spec(){return SPEC},get stages(){return STAGES},get arenas(){return arenas},get shots(){return projectiles},get hazards(){return hazards},get chest(){return chest},get state(){return state},get spawnX(){return spawnX},
 get keys(){return keys},get surface(){return surfaceAt},get enemies(){return enemies},newGame,
 jump(){jumpPressed=true}, light(){castPressed=true}, heavy(){heavyPressed=true},
 safe(){enemies=[];P.inv=9999},clearShots(){projectiles=[];hazards=[]},setSpawn(x){spawnX=x},
 snap(x){P.x=x;P.y=surfaceAt(x+6)-P.h;P.vx=P.vy=0;cam=Math.max(0,x-150)},
 progress(){return {score,coinCount,stageI}},
}; function loop(now) {`);
 vm.createContext(s);scripts.forEach(t=>vm.runInContext(t,s));
 while(!s.ready)await new Promise(r=>setTimeout(r,5));
 return {t:s.test,api:s.__lantern,canvas};
}
function step(t,n=1){for(let i=0;i<n;i++)t.update(1/60)}
function enter(t,idx){const A=t.arenas[idx];t.snap(A.x0+35);t.P.inv=9999;step(t,145);return A}
(async()=>{
 const {t,canvas}=await boot();assert.equal(t.stages[3].segs.length,3);assert.deepEqual(Array.from(t.arenas,a=>a.kind),['veil','eye']);assert.equal(t.chest.hidden,true);
 // Traversal checks use normal movement/collision/gravity, with combat disabled.
 for(const [start,end] of [[40,1720],[2048+40,2720]]){
  t.newGame(3);t.snap(start);t.safe();let frames=0;
  while(t.P.x<end && frames++<2000){t.keys.clear();t.keys.add('ArrowRight');t.keys.add('Space');const feet=t.P.y+t.P.h,ahead=t.surface(t.P.x+36);
   if(t.P.onGround&&(ahead>feet+8||ahead<feet-4))t.jump();step(t);assert.equal(t.state,'play',`Traversal failed at x=${t.P.x}`);assert.ok(t.P.y<180,`Fell at ${t.P.x}`);
  }
  assert.ok(t.P.x>=end,`Traversal stuck at ${t.P.x}`);
 }
 console.log('PASS terrain traversal, including section boundary');
 t.newGame(3);let A=enter(t,0),B=A.boss;
 assert.equal(A.locked,true);assert.equal(B.state,'float');
 let hp=B.hp;t.damageBoss(A,1,'fire',B.x,B.cy);assert.equal(B.hp,hp-2);
 hp=B.hp;t.damageBoss(A,2,'stomp',B.x,B.cy);assert.equal(B.hp,hp);
 t.damageBoss(A,1,'ice',B.x,B.cy);assert.equal(B.stunT,.65);step(t,45);
 // Exercise full attack cycles in both phases; projectiles and roots must actually spawn.
 const states=new Set(),hazards=new Set();let maxShots=0;
 for(let i=0;i<1800;i++){t.P.inv=9999;step(t);states.add(B.state);t.hazards.forEach(h=>hazards.add(h.kind));maxShots=Math.max(maxShots,t.shots.length);if(i===600)B.hp=9;}
 assert.ok(states.has('blink')&&states.has('recover'));assert.ok(hazards.has('spikes'));assert.ok(maxShots>=3);assert.equal(B.phase,2);
 // Hazard and projectile collision do damage with invulnerability removed.
 t.clearShots();B.queue=[];B.stunT=0;B.state='float';B.seq=0;B.atk=0;t.P.hp=4;t.P.inv=0;t.P.status=null;t.P.x=B.x+75;t.P.y=A.floor-t.P.h;t.P.vx=t.P.vy=0;t.keys.clear();
 let hurt=false;for(let i=0;i<110;i++){step(t);if(t.P.hp<4){hurt=true;break;}}assert.ok(hurt,'Veil volley must damage hero');
 t.clearShots();t.P.status=null;t.P.hp=4;t.P.inv=0;B.queue=[];B.state='float';B.seq=0;B.atk=0;B.hp=9;t.P.x=B.x+55;t.P.y=A.floor-t.P.h;t.P.vx=t.P.vy=0;
 hurt=false;for(let i=0;i<90;i++){step(t);if(t.P.hp<4){hurt=true;break;}}assert.ok(hurt,'Root front must damage grounded hero');
 t.P.status=null;t.P.inv=0;t.P.hp=4;t.P.vy=0;t.P.x=B.x;t.P.y=B.cy;B.state='recover';t.heroVsBosses();assert.equal(t.P.hp,4,'Blink arrival must allow a safe recovery');
 B.state='float';t.heroVsBosses();assert.equal(t.P.hp,3,'Active boss contact must still hurt');
 console.log('PASS Veilkeeper phases, warnings, weaknesses, harmful attacks and safe blink recovery');
 // Death returns to the pre-fight checkpoint and resets this arena.
 t.newGame(3);const flag=t.flags.find(f=>f.x=== (64+43)*16+8);t.snap(flag.x);step(t,2);const checkpoint=t.spawnX;A=enter(t,0);t.P.inv=0;t.die('hit');step(t,260);
 assert.equal(t.state,'play');assert.equal(t.spawnX,checkpoint);assert.equal(A.locked,false);assert.equal(A.boss.hp,20);
 // Mid boss drops a heart but must not reveal the final chest.
 A=enter(t,0);t.damageBoss(A,99,'fire',A.boss.x,A.boss.cy);step(t,100);assert.equal(A.cleared,true);assert.equal(A.locked,false);assert.equal(t.chest.hidden,true);assert.equal(t.shots.filter(p=>p.kind==='shot').length,0);assert.equal(A.boss.queue.length,0);
 // End boss survives in the final segment and retains all three phases and completion.
 A=enter(t,1);B=A.boss;assert.equal(B.kind,'eye');assert.ok(A.x0>2048);t.P.inv=9999;
 for(const [hp,phase] of [[28,1],[14,2],[6,3]]){B.hp=hp;step(t,2);assert.equal(B.phase,phase);}
 t.damageBoss(A,99,'zap',B.x,B.cy);step(t,145);assert.equal(A.cleared,true);assert.equal(t.chest.hidden,false);t.snap(t.chest.x);step(t,2);assert.equal(t.state,'win');
 console.log('PASS checkpoint respawn, arena reset, mid-boss unlock, Hollow Eye phases and Stage 4 completion');
 // Hero-specific attacks still connect with the new boss.
 for(const hero of ['wizard','knight','warrior']){
  const e=await boot(hero),u=e.t,C=enter(u,0),D=C.boss;u.clearShots();D.queue=[];D.atk=100;D.state='recover';D.t=-100;u.keys.clear();u.P.status=null;u.P.mana=100;u.P.face=1;
  u.P.x=D.x-(hero==='warrior'?40:90);u.P.y=C.floor-u.P.h;u.P.vx=u.P.vy=0;const before=D.hp;
  if(hero==='warrior')u.heavy();else {u.P.spell=0;u.cast();}step(u,50);assert.ok(D.hp<before,hero+' must hit Veilkeeper');
  u.render();
 }
 console.log('PASS Biscuit, knight fire casts and warrior heavy attack');
 // All previous stages keep their layouts, two bosses and final chest.
 for(let i=0;i<3;i++){t.newGame(i);assert.equal(t.stages[i].segs.length,3);assert.equal(t.arenas.length,2);assert.ok(Number.isFinite(t.chest.x));step(t);t.render();}
 t.newGame(2);t.P.hp=5;const end=enter(t,1);t.damageBoss(end,99,'ice',end.boss.x,end.boss.cy);step(t,110);t.snap(t.chest.x);step(t,130);t.jump();step(t,2);assert.equal(t.progress().stageI,3);assert.equal(t.arenas[0].kind,'veil');
 console.log('PASS stages 1–3 and Stage 3 → Stage 4 transition');
 // Visual samples for review (not shipped assets).
 if(process.env.STAGE4_SHOTS){fs.mkdirSync(process.env.STAGE4_SHOTS,{recursive:true});
  for(const [name,x,boss] of [['grove',280],['crossing',1310],['veil',0,0],['sanctum',2370],['eye',0,1]]){
   t.newGame(3);if(boss!=null)enter(t,boss);else {t.snap(x);step(t,2);}t.render();fs.writeFileSync(path.join(process.env.STAGE4_SHOTS,name+'.png'),canvas.toBuffer('image/png'));
  }
 }
})().catch(e=>{console.error(e);process.exitCode=1});
