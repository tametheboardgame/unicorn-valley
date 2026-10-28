(()=>{
const A='/design-assets/crystalarium-c17/';
const get=(id)=>document.getElementById(id);
const piece=(family)=>{const im=document.createElement('img');im.src=A+'well-'+family+'.svg';im.alt='';return im};
const sample={1:'low',8:'low',16:'bright',31:'bell',37:'low'};
const board=get('board');
for(let i=0;i<42;i++){const c=document.createElement('button');c.className='cell';c.type='button';c.dataset.cell=String(i);c.setAttribute('aria-label','Socket '+(i+1)+(sample[i]?', '+sample[i]+' crystal':''));if(sample[i])c.append(piece(sample[i]));c.addEventListener('click',()=>{board.querySelectorAll('.selected').forEach(n=>n.classList.remove('selected'));c.classList.add('selected')});board.append(c)}
const orders=[['Double Echo','low',2,'First Notes'],['Bright River','bright',2,'River Nursery'],['Bell Chorus','bell',2,'Singing Pools'],['Prism Song','low',3,'Prism Workshop'],['Last Harmony','bell',3,'Great Harmonic Garden']];
const rail=get('orders');let ready=1;
function toast(s){const el=get('toast');el.textContent=s;el.hidden=false;clearTimeout(toast.handle);toast.handle=setTimeout(()=>el.hidden=true,2500)}
function displayOrders(){rail.replaceChildren();orders.forEach((o,i)=>{const card=document.createElement('button');card.type='button';card.className='order-card'+(i===ready?' ready':'');card.setAttribute('aria-label',o[0]+(i===ready?' ready to offer':''));const chapter=document.createElement('small');chapter.textContent=o[3]+' · '+(i+1)+'/50';const title=document.createElement('strong');title.textContent=o[0];const goal=document.createElement('span');goal.className='goal';for(let n=0;n<o[2];n++)goal.append(piece(o[1]));const count=document.createElement('b');count.textContent=i===ready?'✦ READY':'0 / '+o[2];const hint=document.createElement('em');hint.textContent=i===ready?'Tap to offer':'Tap to focus';card.append(chapter,title,goal,count,hint);card.addEventListener('click',()=>{if(i===ready){toast('Preview only: offering '+o[0]+' would consume its requirements.');ready=-1;}else{ready=i;toast('Simulated ready state for visual review.')}displayOrders()});rail.append(card)})}
displayOrders();
get('prev').addEventListener('click',()=>rail.scrollBy({left:-210,behavior:'smooth'}));
get('next').addEventListener('click',()=>rail.scrollBy({left:210,behavior:'smooth'}));
let drops=100;
get('low').addEventListener('click',()=>{const free=Array.from(board.children).find(c=>c.children.length===0);if(!free||drops===0){toast('No free socket or potion: real game must retain free recovery.');return}drops--;get('stock').textContent=drops+' / 100';get('fill').style.width=drops+'%';free.append(piece('low'));toast('Demonstration: Growth Potion drop creates a Low crystal (not saved).')});
for(const id of ['harmony','polish','wash','fresh','exit'])get(id).addEventListener('click',()=>toast('Concept only — no game action or save.'));
let sound=true;get('sound').addEventListener('click',()=>{sound=!sound;get('sound').textContent=sound?'♫ Sound':'♫ Muted'});
function grid(id,items){const target=get(id);target.replaceChildren();for(let i=0;i<12;i++){let c=document.createElement('button');c.className='cell';c.type='button';c.setAttribute('aria-label',id+' slot '+(i+1));if(items[i])c.append(piece(items[i]));c.addEventListener('click',()=>toast('Storage transfer is planned for C19; this is a layout study.'));target.append(c)}}
const dialog=get('storage-dialog');get('storage').addEventListener('click',()=>{grid('board-sample',['low','low','bright']);grid('stored-sample',['bell','low',null,'bright']);dialog.hidden=false;get('close').focus()});
const close=()=>{dialog.hidden=true;get('storage').focus()};get('close').addEventListener('click',close);dialog.addEventListener('click',(e)=>{if(e.target===dialog)close()});
const guide=get('guide'),target=get('low'),bubble=get('guide-bubble');
function position(){if(guide.hidden)return;const q=target.getBoundingClientRect();bubble.style.left=(q.right+245<innerWidth?q.right+12:Math.max(8,q.left-232))+'px';bubble.style.top=Math.max(8,Math.min(innerHeight-175,q.top))+'px'}
function stop(){guide.hidden=true;target.classList.remove('focus-target')}
get('help').addEventListener('click',()=>{guide.hidden=false;target.classList.add('focus-target');position();get('skip').focus()});get('skip').addEventListener('click',stop);addEventListener('resize',position);addEventListener('scroll',position,{passive:true});document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!guide.hidden)stop();else if(!dialog.hidden)close()}});
})();