/* ---- 💬 기갈 게시판 (V147) — Firestore board/boardc, 게임 계정(같은 주소면 자동 로그인) ---- */
(()=>{
const SEED=__SEED__;
const CFG={apiKey:"AIzaSyBuRp0Xw9WzMTOTHnvdruX9yC9zKe5kFwU",authDomain:"studiosilverbell.firebaseapp.com",projectId:"studiosilverbell",storageBucket:"studiosilverbell.firebasestorage.app"};
const DEV='조무룩',CATS=['공략','질문','자랑','잡담','건의','버그','도깨비'],ICON={공지:'📢',공략:'⚔️',질문:'❓',자랑:'✨',잡담:'💬',건의:'📮',버그:'🐞',도깨비:'👹',팁:'💡'};
const $=s=>document.querySelector(s),esc=s=>String(s==null?'':s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const root=$('#bd');if(!root)return;
const S={fb:null,ok:false,err:'',user:null,id:'',live:[],meta:{},filter:'전체',q:'',shown:30,open:null};
const dec=e=>{try{const h=(e||'').split('@')[0].slice(1);return new TextDecoder().decode(new Uint8Array(h.match(/../g).map(x=>parseInt(x,16))))}catch(x){return''}};
const fmtD=t=>{const d=new Date(t),n=new Date();const p=x=>String(x).padStart(2,'0');return (d.getFullYear()===n.getFullYear()?'':d.getFullYear()+'.')+(d.getMonth()+1)+'/'+d.getDate()+' '+p(d.getHours())+':'+p(d.getMinutes())};
const isDev=()=>S.id===DEV;
const who=p=>p.anon?'익명':p.seed?p.by:(p.by===DEV?'은방울꽃🌸':p.by||'???');
function all(){
  const L=S.live.map(p=>({...p,likes:p.likes||[],cc:p.cc||0}));
  const sd=SEED.map(p=>{const m=S.meta['seed_'+p.id]||{};return{...p,likes:m.likes||[],cc:(p.cm||[]).length+(m.cc||0)}});
  return L.concat(sd).sort((a,b)=>b.at-a.at);
}
function list(){
  const q=S.q.trim();let A=all();
  if(S.filter!=='전체')A=A.filter(p=>p.cat===S.filter);
  if(q)A=A.filter(p=>(p.t+' '+p.b+' '+who(p)).includes(q));
  return A;
}
function render(){
  const A=list(),me=S.user;
  const chips=['전체','공지',...CATS].map(c=>`<button type="button" class="bdc${S.filter===c?' on':''}" data-c="${c}">${c==='전체'?'🗂️':ICON[c]} ${c}</button>`).join('');
  const st=S.ok?(me?`<span class="bdme">☁️ <b>${esc(S.id||'계정')}</b>로 로그인됨</span><button type="button" class="bdw" id="bdWrite">✏️ 글쓰기</button>`:`<span class="bdme">🔑 게임에서 로그인하면 글·댓글·💗을 남길 수 있어요</span>`)
    :`<span class="bdme">${S.err?esc(S.err):'불러오는 중…'}</span>`;
  root.innerHTML=`<div class="bdtop">${st}</div>
  <div class="bdchips">${chips}</div>
  <input id="bdQ" class="search" type="search" placeholder="🔍 제목·내용·글쓴이 검색" value="${esc(S.q)}">
  <p class="bdn">${A.length}개의 글</p>
  <div class="bdl">${A.slice(0,S.shown).map(p=>`<button type="button" class="bdr" data-id="${esc(p.id)}"><span class="bdcat">${ICON[p.cat]||'💬'} ${esc(p.cat)}</span><b>${esc(p.t)}</b><small>${esc(who(p))} · ${fmtD(p.at)}${p.likes.length?` · 💗${p.likes.length}`:''}${p.cc?` · 💬${p.cc}`:''}</small></button>`).join('')||'<p class="bdn">글이 없어요.</p>'}</div>
  ${A.length>S.shown?'<button type="button" class="bdmore" id="bdMore">더 보기 ▾</button>':''}`;
  root.querySelectorAll('.bdc').forEach(b=>b.onclick=()=>{S.filter=b.dataset.c;S.shown=30;render()});
  const qi=$('#bdQ');qi.oninput=()=>{S.q=qi.value;S.shown=30;const pos=qi.selectionStart;render();const n=$('#bdQ');n.focus();try{n.setSelectionRange(pos,pos)}catch(e){}};
  root.querySelectorAll('.bdr').forEach(b=>b.onclick=()=>openPost(b.dataset.id));
  const m=$('#bdMore');if(m)m.onclick=()=>{S.shown+=30;render()};
  const w=$('#bdWrite');if(w)w.onclick=writeForm;
}
const sh=()=>$('#bdsh');
function closeSh(){const o=sh();o.hidden=true;o.innerHTML='';S.open=null;document.body.style.overflow=''}
function showSh(html){const o=sh();o.innerHTML=`<div class="bdbox" role="dialog" aria-modal="true">${html}</div>`;o.hidden=false;document.body.style.overflow='hidden';o.onclick=e=>{if(e.target===o)closeSh()};const x=o.querySelector('.bdx');if(x)x.onclick=closeSh}
async function openPost(id){
  const p=all().find(x=>x.id===id);if(!p)return;S.open=id;
  const mine=S.user&&p.uid===S.user.uid,liked=S.user&&p.likes.includes(S.user.uid);
  showSh(`<div class="bdhd"><span class="bdcat">${ICON[p.cat]||'💬'} ${esc(p.cat)}</span><button type="button" class="bdx" aria-label="닫기">✕</button></div>
   <h3 class="bdt">${esc(p.t)}</h3><p class="bdmeta">${esc(who(p))} · ${fmtD(p.at)}</p>
   <div class="bdbody">${esc(p.b)}</div>
   <div class="bdact"><button type="button" class="bdlk${liked?' on':''}" id="bdLike" ${S.user?'':'disabled'}>💗 ${p.likes.length}</button>${(mine||(isDev()&&!p.seed))?'<button type="button" class="bddel" id="bdDel">🗑️ 삭제</button>':''}</div>
   <h4 class="bdch">💬 댓글</h4><div class="bdcm" id="bdCm">${(p.cm||[]).map(c=>`<div class="bdc1"><b>${esc(c[0])}</b><span>${esc(c[1])}</span></div>`).join('')}<p class="bdn" id="bdCmL">${S.ok?'불러오는 중…':''}</p></div>
   ${S.user?`<div class="bdcw"><textarea id="bdCt" maxlength="300" rows="2" placeholder="댓글 (300자)"></textarea><label class="bdan"><input type="checkbox" id="bdCa"> 익명</label><button type="button" class="bdw" id="bdCs">등록</button></div>`:(S.ok?'<p class="bdn">🔑 게임에서 로그인하면 댓글을 쓸 수 있어요.</p>':'')}`);
  const lk=$('#bdLike');if(lk&&S.user)lk.onclick=()=>like(p);
  const dl=$('#bdDel');if(dl)dl.onclick=async()=>{if(dl.dataset.ok!=='1'){dl.dataset.ok='1';dl.textContent='정말 지울까요? 한 번 더';return}dl.disabled=true;try{await S.fb.del(p.id);S.live=S.live.filter(x=>x.id!==p.id);closeSh();render()}catch(e){dl.textContent='삭제 실패';}};
  const cs=$('#bdCs');if(cs)cs.onclick=()=>comment(p);
  if(S.ok)loadCm(p);
}
async function loadCm(p){
  const box=$('#bdCmL');try{const cs=(await S.fb.cms(p.id)).sort((a,b)=>a.at-b.at);if(S.open!==p.id)return;
    box.outerHTML=cs.map(c=>`<div class="bdc1"><b>${esc(c.anon?'익명':(c.by===DEV?'은방울꽃🌸':c.by))}</b><span>${esc(c.b)}</span><small>${fmtD(c.at)}${S.user&&(c.uid===S.user.uid||isDev())?` <button type="button" class="bdcd" data-cid="${esc(c.id)}">삭제</button>`:''}</small></div>`).join('')||(p.cm&&p.cm.length?'':'<p class="bdn">아직 댓글이 없어요.</p>');
    document.querySelectorAll('.bdcd').forEach(b=>b.onclick=async()=>{b.disabled=true;try{await S.fb.cmDel(b.dataset.cid,p);bump(p,-1);openPost(p.id)}catch(e){b.textContent='실패'}});
  }catch(e){if(box)box.textContent='댓글을 불러오지 못했어요.'}
}
function bump(p,n){if(p.seed){const m=S.meta['seed_'+p.id]=S.meta['seed_'+p.id]||{};m.cc=(m.cc||0)+n}else{const l=S.live.find(x=>x.id===p.id);if(l)l.cc=(l.cc||0)+n}}
async function comment(p){
  const t=$('#bdCt').value.trim();if(!t)return;const b=$('#bdCs');b.disabled=true;
  try{await S.fb.cmAdd(p,{b:t,anon:$('#bdCa').checked});bump(p,1);render();openPost(p.id)}catch(e){b.disabled=false;b.textContent='실패 · 다시'}
}
async function like(p){
  const u=S.user.uid,on=!p.likes.includes(u);
  try{await S.fb.like(p,on);const key=p.seed?'seed_'+p.id:null;
    if(key){const m=S.meta[key]=S.meta[key]||{};m.likes=on?[...(m.likes||[]),u]:(m.likes||[]).filter(x=>x!==u)}
    else{const l=S.live.find(x=>x.id===p.id);l.likes=on?[...(l.likes||[]),u]:(l.likes||[]).filter(x=>x!==u)}
    render();openPost(p.id)}catch(e){}
}
function writeForm(){
  const cats=(isDev()?['공지']:[]).concat(CATS);
  showSh(`<div class="bdhd"><b>✏️ 글쓰기</b><button type="button" class="bdx" aria-label="닫기">✕</button></div>
  <label class="bdlb">말머리<select id="bdWc">${cats.map(c=>`<option>${c}</option>`).join('')}</select></label>
  <label class="bdlb">제목<input id="bdWt" maxlength="60" placeholder="제목 (60자)"></label>
  <label class="bdlb">내용<textarea id="bdWb" maxlength="1000" rows="8" placeholder="내용 (1000자)"></textarea></label>
  <label class="bdan big"><input type="checkbox" id="bdWa"> 🎭 익명으로 올리기</label>
  <p class="bdn">익명으로 올리면 글쓴이가 「익명」으로만 보여요. 지우는 건 본인과 개발자만 할 수 있어요.</p>
  <p class="bdn" id="bdWe"></p><button type="button" class="bdw big" id="bdWs">올리기</button>`);
  $('#bdWs').onclick=async()=>{const t=$('#bdWt').value.trim(),b=$('#bdWb').value.trim(),e=$('#bdWe');if(!t||!b){e.textContent='제목과 내용을 써 주세요.';return}
    const s=$('#bdWs');s.disabled=true;e.textContent='올리는 중…';
    try{const p=await S.fb.add({cat:$('#bdWc').value,t,b,anon:$('#bdWa').checked});S.live.unshift(p);seen();closeSh();S.filter='전체';render();openPost(p.id)}catch(x){s.disabled=false;e.textContent='올리지 못했어요. ('+((x&&x.code)||'?')+')'}};
}
function seen(){try{localStorage.setItem('gs_board_seen',String(Date.now()))}catch(e){}}
async function boot(){
  render();
  if(window.__BDMOCK){const M=window.__BDMOCK;S.fb=M.fb;S.user=M.user;S.id=M.id;S.ok=true;const r=await S.fb.posts();r.forEach(d=>{if(d.seed)S.meta[d.id]=d;else S.live.push(d)});render();return}
  try{
    if(!/github\.io$/.test(location.hostname)&&!window.__BDTEST)throw{msg:'여기서는 글을 읽기만 할 수 있어요. 글쓰기·댓글·💗은 게임 안 📖 위키 → 💬 게시판에서!'};
    const b='https://www.gstatic.com/firebasejs/10.12.2/';
    const [a,au,fs]=await Promise.all([import(b+'firebase-app.js'),import(b+'firebase-auth.js'),import(b+'firebase-firestore.js')]);
    const app=a.initializeApp(CFG),auth=au.getAuth(app),db=fs.getFirestore(app);
    const me=()=>({uid:S.user.uid,by:S.id||''});
    S.fb={
      posts:async()=>{const C=fs.collection(db,'board');const[r,m]=await Promise.all([fs.getDocs(fs.query(C,fs.orderBy('at','desc'),fs.limit(400))),fs.getDocs(fs.query(C,fs.where('seed','==',true)))]);return r.docs.concat(m.docs).map(d=>({id:d.id,...d.data()}))},
      add:async o=>{const d={...me(),...o,at:Date.now(),likes:[],cc:0};if(o.anon)d.by='';const r=await fs.addDoc(fs.collection(db,'board'),d);return{id:r.id,...d}},
      del:id=>fs.deleteDoc(fs.doc(db,'board',id)),
      like:(p,on)=>{const v=on?fs.arrayUnion(S.user.uid):fs.arrayRemove(S.user.uid);return p.seed?fs.setDoc(fs.doc(db,'board','seed_'+p.id),{seed:true,likes:v},{merge:true}):fs.updateDoc(fs.doc(db,'board',p.id),{likes:v})},
      cms:async pid=>{const r=await fs.getDocs(fs.query(fs.collection(db,'boardc'),fs.where('pid','==',pid)));return r.docs.map(d=>({id:d.id,...d.data()}))},
      cmAdd:async(p,o)=>{const d={...me(),pid:p.id,b:o.b,anon:!!o.anon,at:Date.now()};if(o.anon)d.by='';await fs.addDoc(fs.collection(db,'boardc'),d);
        await (p.seed?fs.setDoc(fs.doc(db,'board','seed_'+p.id),{seed:true,cc:fs.increment(1)},{merge:true}):fs.updateDoc(fs.doc(db,'board',p.id),{cc:fs.increment(1)})).catch(()=>{})},
      cmDel:async(cid,p)=>{await fs.deleteDoc(fs.doc(db,'boardc',cid));await (p.seed?fs.setDoc(fs.doc(db,'board','seed_'+p.id),{seed:true,cc:fs.increment(-1)},{merge:true}):fs.updateDoc(fs.doc(db,'board',p.id),{cc:fs.increment(-1)})).catch(()=>{})}
    };
    au.onAuthStateChanged(auth,async u=>{
      S.user=u||null;S.id=u?(u.displayName||dec(u.email)):'';S.ok=true;
      if(u){try{const r=await S.fb.posts();S.meta={};S.live=[];r.forEach(d=>{if(d.seed)S.meta[d.id]=d;else S.live.push(d)})}catch(e){S.err='게시판을 불러오지 못했어요. ('+((e&&e.code)||'?')+')';S.ok=false}}
      else{S.live=[];S.meta={}}
      render();if(S.open)openPost(S.open);
    });
  }catch(e){S.ok=false;S.err=(e&&e.msg)||'지금은 읽기만 할 수 있어요. 글쓰기는 게임 안 📖 위키 → 💬 게시판에서.';render()}
}
let started=false;
const go=()=>{if(location.hash==='#board'){seen();if(!started){started=true;boot()}}};
addEventListener('hashchange',go);document.querySelectorAll('.tab[data-t="board"]').forEach(b=>b.addEventListener('click',()=>setTimeout(go,0)));go();
addEventListener('keydown',e=>{if(e.key==='Escape'&&sh()&&!sh().hidden)closeSh()});
})();
