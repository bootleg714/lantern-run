// Original articulated warrior. Frames are drawn once at startup and reused in-game.
// Coordinates are in a 48x44 pixel canvas; feet rest at (22, 42).
export const WARRIOR_POSES = ['idle','idle2','run0','run1','run2','run3','jump','fall','hurt','roll0','roll1','dash','attack1','attack2','attack3','heavy','cast'];
export function renderWarrior(pose) {
  const w=48,h=44,ox=22,oy=42, canvas=document.createElement('canvas'); canvas.width=w; canvas.height=h;
  const g=canvas.getContext('2d'); g.imageSmoothingEnabled=false;
  const ink='#11121d', dark='#29303a', steel='#66747b', light='#a9b6b4', cloth='#492431', red='#9a3940', gold='#b58a55';
  const line=(a,b,width,color)=>{g.strokeStyle=color;g.lineWidth=width;g.lineCap='square';g.beginPath();g.moveTo(...a);g.lineTo(...b);g.stroke();};
  const limb=(a,b,width,color)=>{line(a,b,width+2,ink);line(a,b,width,color);};
  const rect=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
  let bob=pose==='idle2'?1:0, lean=0, legs=[[-4,0],[4,0]], arm=[7,-16], blade=[10,-12];
  if(pose.startsWith('run')) { const i=Number(pose.slice(3)); bob=i%2?-1:0; lean=2; legs=i===0?[[-7,-1],[6,-5]]:i===2?[[6,-1],[-7,-5]]:[[-2,-5],[3,0]]; arm=[5,-19];blade=[-2,-28]; }
  if(pose==='jump'){bob=-2;legs=[[-6,-6],[5,-3]];arm=[8,-23];blade=[12,-32];}
  if(pose==='fall'){bob=-1;legs=[[-5,-4],[7,-4]];arm=[10,-18];blade=[16,-24];}
  if(pose==='hurt'){lean=-4;arm=[-2,-25];blade=[-8,-32];}
  if(pose==='dash'){lean=5;legs=[[-9,-2],[3,-5]];arm=[9,-20];blade=[18,-21];}
  if(pose==='attack1'){lean=2;arm=[8,-22];blade=[13,-33];}
  if(pose==='attack2'){lean=3;arm=[10,-19];blade=[22,-18];}
  if(pose==='attack3'){lean=4;arm=[10,-14];blade=[20,-8];}
  if(pose==='heavy'){lean=-2;arm=[-2,-27];blade=[-10,-36];}
  if(pose==='cast'){arm=[10,-20];blade=[19,-21];}
  g.save(); g.translate(ox,oy+bob);
  if(pose.startsWith('roll')) { g.translate(0,-9); g.rotate(pose==='roll0'?1.0:2.5); g.translate(0,9); }
  // Articulated hips, shoulders and hand. Each limb has its own pose endpoints.
  const hip=[lean,-13], shoulder=[lean,-25], head=[lean,-30];
  // Torn cloak behind the body.
  g.fillStyle=ink;g.beginPath();g.moveTo(lean-4,-26);g.lineTo(lean-10,-23);g.lineTo(lean-13,-8);g.lineTo(lean-8,-11);g.lineTo(lean-5,-7);g.lineTo(lean+1,-17);g.fill();
  g.fillStyle=cloth;g.beginPath();g.moveTo(lean-4,-24);g.lineTo(lean-9,-21);g.lineTo(lean-11,-10);g.lineTo(lean-7,-13);g.lineTo(lean-5,-10);g.lineTo(lean-2,-18);g.fill();
  for(const [dx,dy] of legs){const foot=[lean+dx,dy-2], knee=[lean+Math.round(dx*.6),-8+Math.round(dy*.5)];limb(hip,knee,5,dark);limb(knee,foot,5,steel);rect(foot[0]-3,foot[1]-1,6,3,ink);rect(foot[0]-2,foot[1]-1,4,1,light);}
  limb([lean-4,-23],[lean-7,-16],5,dark); limb([lean-7,-16],[lean-3,-13],4,steel);
  rect(lean-6,-26,13,13,ink);rect(lean-5,-25,11,11,steel);rect(lean-4,-24,3,8,light);rect(lean+1,-23,4,6,dark);rect(lean-5,-16,11,2,gold);rect(lean-5,-13,10,4,dark);
  // Visored helm, crest and red cloth accent.
  rect(head[0]-6,head[1]-6,12,10,ink);rect(head[0]-5,head[1]-5,10,8,steel);rect(head[0]-4,head[1]-5,7,2,light);rect(head[0],head[1]-2,5,2,ink);rect(head[0]+1,head[1]-2,3,1,'#df9b5f');rect(head[0]-4,head[1]+3,8,2,dark);
  rect(head[0]-5,head[1]-8,6,2,red);rect(head[0]-8,head[1]-7,4,2,cloth);rect(lean-5,-25,4,3,red);
  const elbow=[lean+5,-21], hand=[lean+arm[0],arm[1]];limb(shoulder,elbow,6,steel);limb(elbow,hand,4,light);rect(hand[0]-2,hand[1]-2,4,4,dark);
  const tip=[lean+blade[0],blade[1]]; limb(hand,tip,2,light);line(hand,tip,1,'#e1e0c9');line([hand[0]-2,hand[1]-2],[hand[0]+2,hand[1]+2],2,gold);
  g.restore(); return {w,h,ox,oy,px:g.getImageData(0,0,w,h).data,gem:null};
}
