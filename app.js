const main=document.querySelector('#pages'),links=document.querySelector('#links'),contents=document.querySelector('#contents'),menu=document.querySelector('#menu'),viewer=document.querySelector('#viewer');
function setMenu(open){contents.hidden=!open;menu.setAttribute('aria-expanded',String(open))}menu.onclick=()=>setMenu(contents.hidden);document.querySelector('#close-menu').onclick=()=>setMenu(false);document.querySelector('#close-viewer').onclick=()=>viewer.close();viewer.addEventListener('click',e=>{if(e.target===viewer)viewer.close()});document.addEventListener('keydown',e=>{if(e.key==='Escape')setMenu(false)});
fetch('pages.json').then(r=>{if(!r.ok)throw Error('页面清单加载失败');return r.json()}).then(pages=>{pages.forEach((p,i)=>{const n=String(i+1).padStart(2,'0'),section=document.createElement('section');section.className='page';section.id=`page-${i+1}`;section.dataset.number=n;const label=document.createElement('div');label.className='page-label';const title=document.createElement('strong');title.textContent=`${n} / ${p.group} · ${p.title}`;const hint=document.createElement('span');hint.textContent='点击画板放大 ↗';label.append(title,hint);const button=document.createElement('button');button.className='artwork';button.setAttribute('aria-label',`放大查看：${p.group} · ${p.title}`);const img=document.createElement('img');img.src=p.src;img.alt=`${p.group}：${p.title}`;img.width=p.width;img.height=p.height;img.loading=i===0?'eager':'lazy';img.decoding='async';if(i===0)img.fetchPriority='high';button.append(img);button.onclick=()=>{const large=document.querySelector('#large-image');large.src=p.src;large.alt=img.alt;large.width=p.width;large.height=p.height;document.querySelector('#viewer-title').textContent=img.alt;viewer.showModal();document.querySelector('.image-scroll').scrollTo(0,0)};section.append(label,button);main.append(section);const link=document.createElement('a');link.href=`#page-${i+1}`;const num=document.createElement('small');num.textContent=n;link.append(num,document.createTextNode(`${p.group} · ${p.title}`));link.onclick=()=>setMenu(false);links.append(link)});setupDeck(pages);}).catch(()=>{main.textContent='页面暂时未能加载，请刷新重试。'});
function setupDeck(pages){
 const slides=[...main.children], progress=document.querySelector('#progress');let current=0;
 const reading=document.querySelector('.reading');reading.innerHTML='<button id="previous" aria-label="上一页">←</button><span id="deck-progress" aria-live="polite"></span><button id="next" aria-label="下一页">→</button>';
 const prev=document.querySelector('#previous'),next=document.querySelector('#next');
 const tip=document.createElement('div');tip.className='deck-tip';tip.textContent='向下滚动翻页 · 点击画板放大';document.body.append(tip);
 function go(index,write=true){
  current=Math.max(0,Math.min(slides.length-1,index));main.style.transform=`translate3d(${-current*100}%,0,0)`;
  slides.forEach((slide,i)=>{slide.inert=i!==current;slide.setAttribute('aria-hidden',String(i!==current));});
  document.querySelector('#deck-progress').textContent=`${String(current+1).padStart(2,'0')} / ${slides.length}`;
  prev.disabled=current===0;next.disabled=current===slides.length-1;
  if(write)history.replaceState(null,'',`#page-${current+1}`);
  for(let i=current;i<=Math.min(current+1,slides.length-1);i++)slides[i].querySelector('img').loading='eager';
 }
 function fromHash(){const match=location.hash.match(/^#page-(\d+)$/);go(match?Number(match[1])-1:0,false)}
 document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#page-"]');if(!a)return;e.preventDefault();go(Number(a.hash.slice(6))-1);setMenu(false)});
 prev.onclick=()=>go(current-1);next.onclick=()=>go(current+1);window.addEventListener('hashchange',fromHash);
 let lastWheel=0,total=0,consumed=false,lastFlip=0;
 window.addEventListener('wheel',e=>{
  if(viewer.open||!contents.hidden||e.ctrlKey)return;
  e.preventDefault();const now=performance.now();if(now-lastWheel>200){total=0;consumed=false}lastWheel=now;
  if(consumed||now-lastFlip<600)return;
  const delta=Math.abs(e.deltaY)>=Math.abs(e.deltaX)?e.deltaY:e.deltaX;
  total+=delta*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);
  if(Math.abs(total)>=35){go(current+(total>0?1:-1));consumed=true;lastFlip=now;total=0}
 },{passive:false});
 document.addEventListener('keydown',e=>{
  if(viewer.open||!contents.hidden||e.altKey||e.ctrlKey||e.metaKey)return;
  if(e.key===' '&&e.target.closest('button,a'))return;
  const forward=['ArrowDown','ArrowRight','PageDown',' '].includes(e.key),back=['ArrowUp','ArrowLeft','PageUp'].includes(e.key);
  if(forward||back){e.preventDefault();if(!e.repeat)go(current+(forward?1:-1))}
  if(e.key==='Home'){e.preventDefault();go(0)}if(e.key==='End'){e.preventDefault();go(slides.length-1)}
 });
 let touch=null,suppressClickUntil=0;
 main.addEventListener('touchstart',e=>{if(e.touches.length===1)touch={x:e.touches[0].clientX,y:e.touches[0].clientY};else touch=null},{passive:true});
 main.addEventListener('touchend',e=>{if(!touch)return;const dx=touch.x-e.changedTouches[0].clientX,dy=touch.y-e.changedTouches[0].clientY;touch=null;const delta=Math.abs(dx)>Math.abs(dy)?dx:dy;if(Math.abs(delta)>45){suppressClickUntil=performance.now()+500;go(current+(delta>0?1:-1))}},{passive:true});
 main.addEventListener('click',e=>{if(performance.now()<suppressClickUntil){e.preventDefault();e.stopImmediatePropagation()}},true);
 fromHash();
}
