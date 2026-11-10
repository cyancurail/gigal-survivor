/* ===== 🌷 마음의 정원(가제) — 로비 미니게임 · 1장 시안 (2026-11-10) =====
   줄 방어(좀비플랜트풍). 5줄 × 9칸, 끝은 「마음의 선」. 원작 식물의 동작 + 우리 대원 스킨.
   세로 화면: 무수리가 위에서 아래로 / 가로 화면: 오른쪽에서 왼쪽으로.
   좌표는 전부 줄(l 0~4) · 위치(p 0~9, 0 = 마음의 선) 기준이고, 그릴 때만 화면으로 바꾼다.
   사용: GD.open({onClose}) / GD.close() / 테스트: GD.sim(스테이지, 초, 전략, 시드) */
(function(){
'use strict';
const GD=window.GD={};
const BASE=(window.GD_BASE!=null?window.GD_BASE:'');
/* ---------- 그림 ---------- */
const IM={},WH=new Map();
function img(p){if(IM[p])return IM[p];const i=new Image();i.decoding='async';i.src=(window.GD_ASSET&&window.GD_ASSET[p])||BASE+p;IM[p]=i;return i}
const ok=i=>i&&i.complete&&i.naturalWidth>0;
function white(i,col){const key=i.src+(col||'');let c=WH.get(key);if(c)return c;if(!ok(i))return null;c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;const g=c.getContext('2d');g.drawImage(i,0,0);g.globalCompositeOperation='source-in';g.fillStyle=col||'#fff';g.fillRect(0,0,c.width,c.height);WH.set(key,c);return c}

/* ---------- 대원 (원작 식물 동작 · 스킨은 매칭표 기준) ---------- */
const U={
  sun:{n:'맘터',sk:'코지카드',img:'garden/sk/mt_cozy.png',cost:50,cd:7.5,hp:300,role:'🌻 실타래 짜기',desc:'20초마다 실타래를 짜요.',prod:{first:5,every:20,amt:25}},
  pea:{n:'태태영',sk:'체리건1',img:'garden/sk/tt_cherrygun1.png',cost:100,cd:7.5,hp:300,role:'💗 하트 사격',desc:'같은 줄에 하트를 한 발씩 쏴요.',shoot:{every:1.4,dmg:20,n:1,k:'heart'}},
  cherry:{n:'쁘니',sk:'플라워카드',img:'garden/sk/pn_flower.png',cost:150,cd:50,cd0:30,hp:300,role:'🍒 체리 폭탄',desc:'심으면 잠시 뒤 주변 3×3을 날려요. (1회용)',bomb:{t:1.1,dmg:1800}},
  wall:{n:'무룩',sk:'실드카드',img:'msk2/cd02.png',cost:50,cd:30,cd0:20,hp:4000,role:'🛡️ 방패',desc:'단단하게 길을 막아요.',wall:1},
  mine:{n:'세나',sk:'샌드카드',img:'msk2/cd03.png',cost:25,cd:30,cd0:20,hp:300,role:'⏳ 모래 지뢰',desc:'14초 동안 모래에 숨었다가, 밟으면 터져요. (1회용)',mine:{arm:14,dmg:1800}},
  snow:{n:'밍키',sk:'슬리피카드',img:'garden/sk/mk_sleepy.png',cost:175,cd:7.5,hp:300,role:'💤 졸음 구름',desc:'맞은 무수리가 10초 동안 졸려서 느려져요.',shoot:{every:1.4,dmg:20,n:1,k:'ice',slow:10}},
  chomp:{n:'쥬은',sk:'돼지 탈',img:'msk2/29.png',cost:150,cd:7.5,hp:300,role:'🐷 통째로 꿀꺽',desc:'바로 앞 무수리를 삼키고 한참 씹어요.',chomp:{range:1.4,chew:42}},
  rep:{n:'태태영',sk:'체리건2',img:'garden/sk/tt_cherrygun2.png',cost:200,cd:7.5,hp:300,role:'💗💗 두 발 사격',desc:'하트를 두 발씩 쏴요.',shoot:{every:1.4,dmg:20,n:2,k:'heart'}},
  puff:{n:'K1',sk:'쏭카드',img:'msk2/cd12.png',cost:0,cd:7.5,hp:300,role:'🎵 공짜 노래',desc:'공짜! 대신 3칸 앞까지만 닿아요.',shoot:{every:1.4,dmg:20,n:1,k:'note',range:3}},
  sshroom:{n:'맘터',sk:'스타카드',img:'garden/sk/mt_star.png',cost:25,cd:7.5,hp:300,role:'⭐ 별가루 실타래',desc:'싸요. 처음엔 조금, 2분 뒤 별이 자라면 보통만큼 짜요.',prod:{first:5,every:20,amt:15,grow:120,amt2:25}},
  squash:{n:'쥬은',sk:'돼지 레인저',img:'msk2/15.png',cost:50,cd:30,cd0:20,hp:300,role:'💥 짓누르기',desc:'가까이 온 무수리에게 뛰어올라 짓눌러요. (1회용)',squash:{range:1.15,dmg:1800}}
};
/* ---------- 무수리 (원작 좀비 동작 · 아스가르드 귀여운 무수리 그림) ---------- */
const E={
  mu:{n:'무수리',img:'td/m2_01.png',hp:200,spd:.21,sz:.9,intro:''},
  flag:{n:'깃발 무수리',img:'td/m2_02.png',hp:200,spd:.27,sz:.95,intro:'깃발 무수리가 보이면 대규모 무리가 따라와요.'},
  cone:{n:'고깔 무수리',img:'td/m2_03.png',hp:560,spd:.21,sz:1,intro:'고깔 무수리예요. 고깔 덕분에 세 배쯤 단단해요.'},
  pole:{n:'장대 무수리',img:'td/m2_06.png',hp:340,spd:.42,spd2:.21,sz:.95,pole:1,intro:'장대 무수리예요! 처음 만나는 대원을 훌쩍 뛰어넘어요.'},
  bucket:{n:'양동이 무수리',img:'td/m2_04.png',hp:1300,spd:.21,sz:1,intro:'양동이 무수리… 언니, 이건 진짜 단단해요. 체리랑 꿀꺽을 아껴 둬요.'}
};
/* ---------- 1장 · 기본 맵 「밤하늘 정원」 ---------- */
const CH1={name:'1장 · 밤하늘 정원',floor:['#141b38','#182142'],stages:[
  {name:'첫 만남',       pool:{mu:1},                 hand:1,                         gift:'cherry'},
  {name:'고깔 손님',     pool:{mu:3,cone:1},          gift:'wall'},
  {name:'깃발의 밤',     pool:{mu:3,cone:1},          gift:'mine'},
  {name:'숨은 모래',     pool:{mu:3,cone:2},          gift:'snow'},
  {name:'얼음 하트',     pool:{mu:3,cone:2,pole:1},   gift:'chomp'},
  {name:'장대 소동',     pool:{mu:3,cone:2,pole:2},   gift:'rep'},
  {name:'두 발의 리듬',  pool:{mu:3,cone:2,pole:1,bucket:1},gift:'puff'},
  {name:'공짜 노래',     pool:{mu:3,cone:3,pole:1,bucket:1},gift:'sshroom'},
  {name:'별가루',        pool:{mu:2,cone:3,pole:2,bucket:2},gift:'squash'},
  {name:'밤하늘의 끝',   pool:{mu:2,cone:3,pole:2,bucket:3},flags:3,gift:null}
]};
CH1.stages.forEach((S,i)=>{if(S.hand)return;S.n=10+Math.floor(i*.4);S.g0=20-i*.2;S.g1=14-i*.2;S.b0=1+.03*i;S.bg=.15+.01*i});
const START=['sun','pea'],DECK_MAX=6;
const ECOST={mu:1,flag:1,cone:2,pole:2,bucket:4};
function rng(s){s=s%2147483647;if(s<=0)s+=2147483646;return()=>(s=(s*16807)%2147483647)/2147483647}
function hand1(seed){const r=rng(seed||7),W=[];let last=-1;
  const lane=()=>{let l;do{l=Math.floor(r()*5)}while(l===last&&r()<.7);last=l;return l};
  const add=(t,k,l)=>W.push({t,k,l:l==null?lane():l});
  add(20,'mu',2);add(38,'mu',1);add(52,'mu',3);add(62,'mu',2);[72,80,86].forEach(t=>add(t,'mu'));
  W.push({t:95,flag:1});add(95,'flag');[96,97,98.5].forEach(t=>add(t,'mu'));add(99.5,'mu');
  [112,120,126,133,139,146,152].forEach(t=>add(t,'mu'));add(126.8,'mu');add(146.8,'mu');
  W.push({t:168,flag:2,fin:1});add(168,'flag');for(let i=0;i<7;i++)add(168.8+i*.8,'mu');add(170,'mu');add(172.5,'mu');
  return W.sort((a,b)=>a.t-b.t)}
function genWaves(si,seed){const S=CH1.stages[si];if(S.hand)return hand1(seed);const r=rng((seed||7)*31+si*977),W=[];
  const keys=Object.keys(S.pool),tot=keys.reduce((a,k)=>a+S.pool[k],0);
  const pick=(bud)=>{for(let k=0;k<20;k++){let x=r()*tot;for(const kk of keys){x-=S.pool[kk];if(x<=0){if(ECOST[kk]<=bud+.01)return kk;break}}}return 'mu'};
  const nf=S.flags||2,flagAt=new Set();for(let i=1;i<=nf;i++)flagAt.add(Math.round(S.n*i/nf)-1);
  let t=20,last=-1;const lane=()=>{let l;do{l=Math.floor(r()*5)}while(l===last&&r()<.6);last=l;return l};
  for(let i=0;i<S.n;i++){const k=i/(S.n-1);let bud=S.b0+S.bg*i;const fl=flagAt.has(i);
    if(fl){bud*=2.6;W.push({t,flag:1,fin:i===S.n-1?1:0});W.push({t,k:'flag',l:lane()})}
    let b=bud,dt=0;while(b>=.99){const e=pick(b);b-=ECOST[e];W.push({t:t+dt,k:e,l:lane()});dt+=fl?.55:(r()*.8)}
    t+=S.g0+(S.g1-S.g0)*k+(fl?6:0)}
  return W.sort((a,b)=>a.t-b.t)}

/* ---------- 진행 저장 (계정 저장은 3단계) ---------- */
const SKEY='gd_v1';let SV={cl:0,deck:null,seen:{}};
function load(){try{const s=JSON.parse(localStorage.getItem(SKEY)||'null');if(s)SV=Object.assign(SV,s)}catch(e){}}
function save(){try{localStorage.setItem(SKEY,JSON.stringify(SV))}catch(e){}}
function owned(cl){const L=START.slice();for(let i=0;i<Math.min(cl,CH1.stages.length);i++){const g=CH1.stages[i].gift;if(g)L.push(g)}return L}

/* ---------- 상태 ---------- */
let T=null,cv=null,g=null,ov=null,raf=0,onClose=null,DPR=1,SCR='map',PICK=[],RES=null;
function newGame(si,deck,seed){const S=CH1.stages[si];T={si,t:0,th:150,units:[],ens:[],pr:[],thr:[],fx:[],
  lanes:[0,1,2,3,4].map(()=>({spool:1,sw:null})),wv:genWaves(si,seed),wi:0,sel:null,shovel:false,
  deck:deck.slice(),cards:deck.map(k=>({k,cd:U[k].cd0||0})),st:'play',speed:1,sky:6,say:null,said:{},banner:null,hover:null,shake:0,flash:0,kills:0,planted:0};
  T.lastT=T.wv.length?T.wv[T.wv.length-1].t:60;return T}

/* ---------- 레이아웃 ---------- */
let W=0,H=0,vert=true,cs=60,bx=0,by=0,UI=[];
function layout(){W=window.innerWidth;H=window.innerHeight;vert=H>W*1.05;
  DPR=Math.min(2,window.devicePixelRatio||1,Math.max(.75,Math.sqrt(2.1e6/(W*H))));
  if(cv){cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);cv.style.width=W+'px';cv.style.height=H+'px'}
  if(vert){const top=64,bar=Math.min(112,Math.max(88,H*.12));cs=Math.min((W-14)/5,(H-top-bar-16)/10.25);bx=(W-5*cs)/2;by=H-bar-12-.5*cs-9*cs}
  else{const top=Math.min(104,Math.max(78,H*.16));const av=H-top-8;cs=Math.min((W-20)/10.4,av/5.05);bx=(W-9*cs)/2+.15*cs;by=top+(av-5*cs)/2}}
function S(l,p){return vert?[bx+(l+.5)*cs,by+(9-p)*cs]:[bx+p*cs,by+(l+.5)*cs]}
function cellAt(x,y){let l,p;if(vert){l=Math.floor((x-bx)/cs);p=9-(y-by)/cs}else{l=Math.floor((y-by)/cs);p=(x-bx)/cs}
  const c=Math.floor(p);return(l>=0&&l<5&&c>=0&&c<9)?{l,c}:null}

/* ---------- 소리 (아주 작게) ---------- */
let AC=null;function vol(){let v=1;try{const s=localStorage.getItem('gs_vol_s');if(s!=null)v=+s}catch(e){}return v}
function snd(k){if(T&&T.headless)return;try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();const v=vol()*.18;if(v<=0)return;const t=AC.currentTime,o=AC.createOscillator(),a=AC.createGain();o.connect(a);a.connect(AC.destination);
  const P={col:['sine',880,1320,.12,1],plant:['triangle',330,520,.1,.9],shoot:['sine',740,620,.05,.35],hit:['square',220,140,.04,.18],die:['triangle',300,90,.18,.6],flag:['sawtooth',300,600,.35,.5],sweep:['sine',500,1500,.6,.8],win:['sine',660,1320,.6,1],lose:['triangle',300,120,.7,.9],sel:['sine',600,700,.05,.5],no:['square',160,120,.08,.3],boom:['sawtooth',120,40,.5,1.2],gulp:['triangle',200,80,.25,.9],thud:['square',140,50,.2,1]}[k];if(!P)return;
  o.type=P[0];o.frequency.setValueAtTime(P[1],t);o.frequency.exponentialRampToValueAtTime(P[2],t+P[3]);a.gain.setValueAtTime(v*P[4],t);a.gain.exponentialRampToValueAtTime(.0001,t+P[3]+.05);o.start(t);o.stop(t+P[3]+.08)}catch(e){}}

/* ---------- 아리아드네 ---------- */
const FACE={n:'td/ari/n.png',w:'td/ari/w.png',o:'td/ari/o.png',d:'td/ari/d.png',s:'td/ari/s.png'};
function say(f,tx,dur){if(T.headless)return;T.say={f,tx,t:0,dur:dur||4}}
function once(k,f,tx,dur){if(T.said[k])return;T.said[k]=1;say(f,tx,dur)}

/* ---------- 게임 로직 ---------- */
function plant(k,l,c){const d=U[k],cd=T.cards.find(x=>x.k===k);if(!cd||cd.cd>0||T.th<d.cost)return false;if(T.units.some(u=>u.l===l&&u.c===c))return false;
  T.th-=d.cost;cd.cd=d.cd;const u={k,l,c,hp:d.hp,max:d.hp,t:0,at:0,fl:0,pop:.25,age:0};
  if(d.prod)u.t=d.prod.first;if(d.shoot)u.t=.6;if(d.bomb)u.t=d.bomb.t;if(d.mine)u.t=d.mine.arm;
  T.units.push(u);T.planted++;snd('plant');
  if(k==='sun')once('w1','w','맘터 언니가 자리 잡았어요. 이제 실타래가 짜일 거예요.',3.5);return true}
function dropThread(lf,p,amt,from){T.thr.push({lf,p,amt,f:from?0:1,pop:from?.5:0,life:from?9:8,t:0,col:0})}
function collect(th){if(th.col)return;th.col=1;th.ct=0;T.th+=th.amt;snd('col');once('c1','w','그거예요. 실타래는 우리 재산이에요.',2.6)}
function spawn(k,l){const d=E[k];T.ens.push({k,l,p:9.6,hp:d.hp,max:d.hp,fl:0,bob:Math.random()*6,eat:null,die:0,slow:0,jump:0,jumped:0});
  if(d.intro&&!T.headless&&!SV.seen[k]){SV.seen[k]=1;save();say(k==='bucket'?'o':'n',d.intro,4.5)}}
function hurtE(e,dmg,why){if(e.die)return;e.hp-=dmg;e.fl=.09;if(e.hp<=0){e.die=.001;e.why=why||'';T.kills++;snd('die');burst(e.l,e.p,'#ffd6f0',10)}else if(!T.headless&&Math.random()<.35)snd('hit')}
function burst(l,p,col,n,sp){if(T.headless)return;for(let i=0;i<n;i++){const a=Math.random()*6.28,s=(.6+Math.random()*1.6)*(sp||1);T.fx.push({l,p,dx:Math.cos(a)*s,dy:Math.sin(a)*s,t:0,life:.45+Math.random()*.3,col,r:.04+Math.random()*.05})}}
function ring(l,p,col,r,life){if(T.headless)return;T.fx.push({ring:1,l,p,col,r,t:0,life:life||.5})}
function lose(){if(T.st!=='play')return;T.st='lose';T.end=0;snd('lose');say('d','어머....언니....제가 수준을 잘못 생각했나봐요.',99)}
function win(){if(T.st!=='play')return;T.st='win';T.end=0;snd('win');
  if(!T.headless){const first=SV.cl<=T.si;if(first){SV.cl=T.si+1;save()}RES={si:T.si,first,gift:first?CH1.stages[T.si].gift:null}}
  say('w','정원을 지켰어요. 역시 제가 사람 보는 눈은 있다니까요. 💅',99)}
function ahead(l,from,to){let best=null;for(const e of T.ens){if(e.die||e.l!==l||e.p>9.75||e.jump>0)continue;if(e.p>=from&&e.p<=to&&(!best||e.p<best.p))best=e}return best}

function step(dt){const t0=T.t;T.t+=dt;
  for(const c of T.cards)if(c.cd>0)c.cd=Math.max(0,c.cd-dt);
  // 웨이브
  while(T.wi<T.wv.length&&T.wv[T.wi].t<=T.t){const w=T.wv[T.wi++];
    if(w.flag){T.banner={tx:w.fin?'마지막 무수리 무리예요!':'대규모 무수리가 몰려와요!',t:0};snd('flag');say('o',w.fin?'마지막 무리예요. 실 끝 꽉 잡아요!':'대규모 무수리예요! 언니, 화장 고치고 집중해요.',3.5)}
    else{spawn(w.k,w.l);if(T.si===0)once('e1','o','어머, 왔어요! 태태영님을 그 줄에 심어서 하트를 쏘세요.',4)}}
  // 하늘 실타래
  T.sky-=dt;if(T.sky<=0){T.sky=7+((T.t*7.3)%1)*2;dropThread(.4+((T.t*3.1)%1)*4.2,1.2+((T.t*5.7)%1)*7,25,false);if(T.t>4&&T.si===0)once('s1','n','하늘색 실타래가 보이면 톡 눌러서 모아요.',3.5)}
  // 대원
  for(const u of T.units){const d=U[u.k];u.fl=Math.max(0,u.fl-dt);u.pop=Math.max(0,u.pop-dt);u.at=Math.max(0,u.at-dt);u.age+=dt;
    if(d.prod){u.t-=dt;if(u.t<=0){u.t=d.prod.every;u.at=.5;const amt=d.prod.grow&&u.age<d.prod.grow?d.prod.amt:(d.prod.amt2||d.prod.amt);dropThread(u.l+.15,u.c+.75,amt,true)}}
    if(d.shoot){u.t-=dt;if(u.t<=0){const R=d.shoot.range||9;const tg=ahead(u.l,u.c+.2,Math.min(9.75,u.c+.5+R));
        if(tg){u.t=d.shoot.every;u.at=.35;for(let i=0;i<d.shoot.n;i++)T.pr.push({l:u.l,p:u.c+.75,p0:u.c+.75,dmg:d.shoot.dmg,sp:6.2,a:0,k:d.shoot.k,slow:d.shoot.slow||0,R:R+.1,wait:i*.18});if(!T.headless&&Math.random()<.5)snd('shoot')}else u.t=.1}}
    if(d.bomb){u.t-=dt;u.at=1;if(u.t<=0){u.dead=1;for(const e of T.ens)if(!e.die&&Math.abs(e.l-u.l)<=1&&e.p>=u.c-.6&&e.p<=u.c+1.6)hurtE(e,d.bomb.dmg,'boom');T.shake=10;T.flash=.25;snd('boom');ring(u.l,u.c+.5,'#ff8ac0',1.6,.6);burst(u.l,u.c+.5,'#ffb3d1',26,2.2)}}
    if(d.mine){if(u.t>0){u.t-=dt;if(u.t<=0){u.at=.6;burst(u.l,u.c+.5,'#f5deb3',10)}}
      else{const e=T.ens.find(e=>!e.die&&e.l===u.l&&e.jump<=0&&e.p-.28<=u.c+.9&&e.p>u.c-.1);if(e){u.dead=1;for(const z of T.ens)if(!z.die&&z.l===u.l&&Math.abs(z.p-(u.c+.5))<.85)hurtE(z,d.mine.dmg,'boom');T.shake=6;snd('boom');ring(u.l,u.c+.5,'#f2d29b',1,.5);burst(u.l,u.c+.5,'#e8c98a',20,1.6)}}}
    if(d.chomp){if(u.chew>0){u.chew-=dt;if(u.chew<=0)u.chew=0}
      else if(!u.bite){const e=ahead(u.l,u.c+.3,u.c+.5+d.chomp.range);if(e){u.bite=.45;u.btg=e;u.at=.45}}
      if(u.bite){u.bite-=dt;if(u.bite<=0){u.bite=0;const e=u.btg;if(e&&!e.die&&e.l===u.l&&Math.abs(e.p-(u.c+.5))<d.chomp.range+.6){hurtE(e,1e9,'gulp');snd('gulp');u.chew=d.chomp.chew}u.btg=null}}}
    if(d.squash){if(!u.jmp){const e=T.ens.find(e=>!e.die&&e.l===u.l&&e.jump<=0&&Math.abs(e.p-(u.c+.5))<d.squash.range);if(e){u.jmp=.6;u.jp=e.p;u.at=.6}}
      else{u.jmp-=dt;if(u.jmp<=0){u.dead=1;for(const z of T.ens)if(!z.die&&z.l===u.l&&Math.abs(z.p-u.jp)<.7)hurtE(z,d.squash.dmg,'squash');T.shake=7;snd('thud');ring(u.l,u.jp,'#ffd1a8',.9,.4);burst(u.l,u.jp,'#ffe0c0',14,1.4)}}}}
  // 투사체
  for(const pr of T.pr){if(pr.wait>0){pr.wait-=dt;continue}pr.p+=pr.sp*dt;pr.a+=dt;if(pr.p>10||pr.p-pr.p0>pr.R){pr.dead=1;continue}
    let best=null;for(const e of T.ens){if(e.die||e.l!==pr.l||e.p>9.8||e.jump>0)continue;if(pr.p>=e.p-.3&&pr.p<=e.p+.4&&(!best||e.p<best.p))best=e}
    if(best){hurtE(best,pr.dmg);if(pr.slow){best.slow=Math.max(best.slow,pr.slow)}pr.dead=1;burst(pr.l,pr.p,pr.k==='ice'?'#d6e6ff':pr.k==='note'?'#d6b8ff':'#ff7ab6',5)}}
  T.pr=T.pr.filter(p=>!p.dead);
  // 무수리
  for(const e of T.ens){const d=E[e.k];e.fl=Math.max(0,e.fl-dt);e.slow=Math.max(0,e.slow-dt);const sm=e.slow>0?.5:1;e.bob+=dt*(e.eat?11:6)*sm;
    if(e.die){e.die+=dt;continue}
    if(e.jump>0){e.jump-=dt;e.p=e.jp0+(e.jp1-e.jp0)*(1-e.jump/.75);if(e.jump<=0){e.jump=0;e.jumped=1;e.p=e.jp1}continue}
    let tg=null;for(const u of T.units){if(u.l!==e.l||u.hp<=0||u.dead)continue;if(U[u.k].mine&&u.t<=0)continue;if(e.p-.28<=u.c+.85&&e.p>u.c+.15&&(!tg||u.c>tg.c))tg=u}
    if(tg&&d.pole&&!e.jumped){e.jump=.75;e.jp0=e.p;e.jp1=tg.c-.05;e.eat=null;continue}
    e.eat=tg;if(tg){tg.hp-=100*sm*dt;tg.fl=.06;if(tg.hp<=0){tg.dead=1;burst(tg.l,tg.c+.5,'#cfe8ff',12);snd('die')}}
    else e.p-=(d.pole&&e.jumped?d.spd2:d.spd)*sm*dt;
    if(e.p<-.15){const ln=T.lanes[e.l];if(ln.spool&&!ln.sw){ln.sw={p:-.4};ln.spool=0;snd('sweep');once('sw1','w','실은 줄마다 한 번뿐이에요. 아껴 쓰는 여자가 아름다워요.',4)}else if(!ln.sw)lose()}}
  T.units=T.units.filter(u=>!u.dead);
  for(let l=0;l<5;l++){const ln=T.lanes[l];if(!ln.sw)continue;ln.sw.p+=7*dt;for(const e of T.ens)if(!e.die&&e.l===l&&e.p<=ln.sw.p+.3){hurtE(e,1e9);burst(l,e.p,'#9fe8ff',8)}if(ln.sw.p>10.3)ln.sw=null}
  T.ens=T.ens.filter(e=>!(e.die&&e.die>.6));
  for(const th of T.thr){th.t+=dt;if(th.col){th.ct+=dt;if(th.ct>.5)th.dead=1;continue}
    if(th.f>0)th.f=Math.max(0,th.f-dt/4.2);if(th.pop>0)th.pop=Math.max(0,th.pop-dt);
    if(th.f<=0&&th.pop<=0){th.life-=dt;if(th.life<=0)th.dead=1}
    if(T.headless&&T.auto&&th.f<=.6&&th.t>T.auto)collect(th)}
  T.thr=T.thr.filter(t=>!t.dead);
  for(const f of T.fx)f.t+=dt;T.fx=T.fx.filter(f=>f.t<f.life);
  if(T.say){T.say.t+=dt;if(T.say.t>T.say.dur)T.say=null}
  if(T.banner){T.banner.t+=dt;if(T.banner.t>3)T.banner=null}
  if(T.flash>0)T.flash=Math.max(0,T.flash-dt);
  if(T.si===0&&t0<3&&T.t>=3&&!T.units.length)say('n','먼저 맘터 언니를 심어요. 실타래를 짜 주거든요.',4.5);
  if(T.wi>=T.wv.length&&!T.ens.some(e=>!e.die)&&T.st==='play')win()}

/* ---------- 그리기 ---------- */
function rr(x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
function frame(im,fi,x,feet,D,a,fl,tint){if(!ok(im))return;const fw=im.naturalHeight,n=Math.max(1,Math.round(im.naturalWidth/fw));fi=((fi%n)+n)%n;
  g.save();g.globalAlpha=a==null?1:a;g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(im,fi*fw,0,fw,fw,x-D/2,feet-D*.98,D,D);
  if(fl>0||tint){const w=white(im,tint);if(w){g.globalAlpha=(a==null?1:a)*(tint?.35:Math.min(1,fl*8)*.55);g.drawImage(w,fi*fw,0,fw,fw,x-D/2,feet-D*.98,D,D)}}g.restore()}
function heart(x,y,s,col){g.save();g.translate(x,y);g.scale(s,s);g.beginPath();g.moveTo(0,.35);g.bezierCurveTo(-1,-.25,-.45,-.95,0,-.45);g.bezierCurveTo(.45,-.95,1,-.25,0,.35);g.fillStyle=col;g.fill();g.restore()}
function note(x,y,s,col){g.save();g.translate(x,y);g.fillStyle=col;g.beginPath();g.ellipse(-s*.3,s*.35,s*.42,s*.3,-.4,0,6.29);g.fill();g.fillRect(s*.05,-s*.75,s*.14,s*1.1);g.beginPath();g.moveTo(s*.19,-s*.75);g.quadraticCurveTo(s*.8,-s*.5,s*.55,-s*.05);g.lineWidth=s*.14;g.strokeStyle=col;g.stroke();g.restore()}
function yarn(x,y,r,a,t){g.save();g.globalAlpha=a;const gl=g.createRadialGradient(x,y,r*.2,x,y,r*1.9);gl.addColorStop(0,'rgba(160,236,255,.55)');gl.addColorStop(1,'rgba(160,236,255,0)');g.fillStyle=gl;g.beginPath();g.arc(x,y,r*1.9*(1+.06*Math.sin(t*5)),0,6.29);g.fill();
  const b=g.createRadialGradient(x-r*.35,y-r*.35,r*.1,x,y,r);b.addColorStop(0,'#ffffff');b.addColorStop(.45,'#b9f0ff');b.addColorStop(1,'#4fb6e6');g.fillStyle=b;g.beginPath();g.arc(x,y,r,0,6.29);g.fill();
  g.strokeStyle='rgba(255,255,255,.75)';g.lineWidth=Math.max(1,r*.09);for(let i=0;i<4;i++){g.beginPath();g.ellipse(x,y,r*.92,r*(.25+i*.2),.6+i*.35,0,Math.PI);g.stroke()}
  g.strokeStyle='#bff3ff';g.lineWidth=Math.max(1,r*.1);g.beginPath();g.moveTo(x+r*.7,y+r*.6);g.quadraticCurveTo(x+r*1.4,y+r*1.1+Math.sin(t*3)*r*.2,x+r*1.9,y+r*.7);g.stroke();g.restore()}
let STARS=null;function sky(){if(!STARS){STARS=[];const r=rng(99);for(let i=0;i<140;i++)STARS.push([r(),r(),r()*1.6+.4,r()*6])}
  const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#0b0820');gr.addColorStop(.6,'#151036');gr.addColorStop(1,'#1d1340');g.fillStyle=gr;g.fillRect(0,0,W,H);
  const t=performance.now()/1000;for(const s of STARS){g.globalAlpha=.35+.45*Math.abs(Math.sin(t*.8+s[3]));g.fillStyle=s[3]>3?'#ffd6f5':'#cfe0ff';g.fillRect(s[0]*W,s[1]*H,s[2],s[2])}g.globalAlpha=1}
function board(){const F=CH1.floor;for(let l=0;l<5;l++)for(let c=0;c<9;c++){const[x,y]=S(l,c+.5);g.fillStyle=F[(l+c)%2];g.fillRect(x-cs/2,y-cs/2,cs+.5,cs+.5)}
  const t=performance.now()/1000;for(let l=0;l<5;l++)for(let c=0;c<9;c++){const h=((l*73856093)^(c*19349663))>>>0;const[x,y]=S(l,c+.5);
    if(h%5===0){g.globalAlpha=.1;g.fillStyle='#9fb4ff';g.fillRect(x-cs*.2,y-cs*.1,cs*.2,cs*.14)}
    if(h%3===0){g.globalAlpha=.25+.35*Math.abs(Math.sin(t*1.5+h));g.fillStyle=h&1?'#cfe0ff':'#ffd6f5';g.fillRect(x+((h>>4)%30-15)/40*cs,y+((h>>9)%30-15)/40*cs,2,2)}}
  g.globalAlpha=1;g.strokeStyle='rgba(160,180,255,.12)';g.lineWidth=1;for(let l=0;l<=5;l++){const[a1,b1]=S(l-.5+.0,0);}
  const[ax,ay]=S(0,0),[bx2,by2]=S(4,0);const ext=cs*.5;g.strokeStyle='rgba(150,230,255,.85)';g.lineWidth=3;g.shadowColor='#8fe6ff';g.shadowBlur=12;g.beginPath();
  if(vert){g.moveTo(ax-ext,ay);g.lineTo(bx2+ext,by2)}else{g.moveTo(ax,ay-ext);g.lineTo(bx2,by2+ext)}g.stroke();g.shadowBlur=0}
function draw(){g.setTransform(DPR,0,0,DPR,0,0);UI=[];sky();
  if(SCR==='map'){mapScr();return}if(SCR==='deck'){deckScr();return}if(SCR==='gift'){giftScr();return}
  const t=T.t;const sh=T.shake>0?(Math.random()-.5)*T.shake:0;g.save();g.translate(sh,sh*.5);board();
  if(T.hover&&(T.sel||T.shovel)){const[x,y]=S(T.hover.l,T.hover.c+.5);g.fillStyle=T.shovel?'rgba(255,120,120,.25)':'rgba(255,255,255,.16)';g.fillRect(x-cs/2,y-cs/2,cs,cs)}
  for(let l=0;l<5;l++){const ln=T.lanes[l];if(ln.spool){const[x,y]=S(l,-.33);yarn(x,y,cs*.17,.95,t+l)}
    if(ln.sw){const[x0,y0]=S(l,-.4),[x1,y1]=S(l,ln.sw.p);g.save();g.strokeStyle='#bff6ff';g.lineWidth=cs*.06;g.shadowColor='#7fe0ff';g.shadowBlur=18;g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.stroke();g.restore();yarn(x1,y1,cs*.24,1,t*3)}}
  const L=[];
  for(const u of T.units){const[x,y]=S(u.l,u.c+.5);L.push({y:y+cs*.4,k:0,o:u,x})}
  for(const e of T.ens){if(e.p>10.2)continue;const[x,y]=S(e.l,e.p);L.push({y:y+cs*.3,k:1,o:e,x})}
  if(T.hover&&T.sel&&!T.units.some(u=>u.l===T.hover.l&&u.c===T.hover.c)){const[x,y]=S(T.hover.l,T.hover.c+.5);L.push({y:y+cs*.4,k:2,x,o:T.sel})}
  L.sort((a,b)=>a.y-b.y);const UD=vert?1.42:1.2;
  for(const it of L){if(it.k===0)drawUnit(it,UD,t);else if(it.k===1)drawEnemy(it,t);else frame(img(U[it.o].img),0,it.x,it.y,cs*UD,.45,0)}
  for(const pr of T.pr){if(pr.wait>0)continue;const[x,y]=S(pr.l,pr.p);const yy=y-(vert?cs*.3:cs*.32);g.save();
    if(pr.k==='note'){g.shadowColor='#b48cff';g.shadowBlur=10;note(x,yy,cs*.2,'#d9c2ff')}
    else if(pr.k==='ice'){g.shadowColor='#9fc8ff';g.shadowBlur=10;const r=cs*.1;g.fillStyle='#e3efff';for(const[a,b,c]of[[-1,0,1],[0,-.6,1.2],[1,0,1],[0,.2,1.1]]){g.beginPath();g.arc(x+a*r,yy+b*r,r*c,0,6.29);g.fill()}g.shadowBlur=0;g.fillStyle='#6f8fd8';g.font=`900 ${Math.round(r*1.3)}px sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillText('z',x,yy)}
    else{g.shadowColor='#ff5fa8';g.shadowBlur=10;heart(x,yy,cs*.17*(1+.12*Math.sin(pr.a*20)),'#ff6fb1')}g.restore()}
  for(const f of T.fx){const k=f.t/f.life;const[x,y]=S(f.l,f.p);g.globalAlpha=1-k;if(f.ring){g.strokeStyle=f.col;g.lineWidth=cs*.12*(1-k);g.beginPath();g.arc(x,y-cs*.3,cs*f.r*(.3+k),0,6.29);g.stroke()}else{g.fillStyle=f.col;g.beginPath();g.arc(x+f.dx*cs*.6*k,y-cs*.35+f.dy*cs*.6*k,cs*f.r*(1-k*.5),0,6.29);g.fill()}}g.globalAlpha=1;
  for(const th of T.thr){let[x,y]=S(th.lf,th.p);if(th.f>0)y-=th.f*cs*3.2;if(th.pop>0)y-=Math.sin((1-th.pop/.5)*Math.PI)*cs*.6;
    let a=1;if(!th.col&&th.f<=0&&th.life<2)a=.4+.6*Math.abs(Math.sin(th.t*6));
    if(th.col){const k=Math.min(1,th.ct/.45);const[tx,ty]=thPos();x+=(tx-x)*k;y+=(ty-y)*k;a=1-k*.3}
    th.sx=x;th.sy=y;yarn(x,y,cs*(th.amt<25?.16:.21),a,th.t)}
  g.restore();
  if(T.flash>0){g.fillStyle=`rgba(255,220,240,${T.flash*1.6})`;g.fillRect(0,0,W,H)}
  hud();
  if(T.banner){const k=T.banner.t;const a=k<.3?k/.3:k>2.5?Math.max(0,(3-k)/.5):1;g.save();g.globalAlpha=a;g.fillStyle='rgba(30,0,30,.55)';g.fillRect(0,H*.42,W,H*.1);g.font=`900 ${Math.min(30,W*.065)}px 'Noto Sans KR',sans-serif`;g.textAlign='center';g.textBaseline='middle';g.lineWidth=5;g.strokeStyle='#5a0030';g.strokeText(T.banner.tx,W/2,H*.47);g.fillStyle='#ffd1ea';g.fillText(T.banner.tx,W/2,H*.47);g.restore()}
  ariBox();if(T.st==='win'||T.st==='lose')endBox();if(T.st==='pause')pauseBox()}
function drawUnit(it,UD,t){const u=it.o,d=U[u.k],im=img(d.img);let fi=u.at>0?2+((u.at*8)|0)%2:((t*2.4+u.l+u.c)|0)%2;let D=cs*UD*(1+u.pop*.8),y=it.y,a=1,tint=null;
  if(d.mine&&u.t>0){D*=.62;a=.55;y+=cs*.05;tint='#e8c98a'}
  if(d.bomb){D*=1+.15*Math.sin(t*30);tint='#ff6fa0'}
  if(d.chomp&&u.chew>0){fi=((t*5)|0)%2}
  if(d.squash&&u.jmp){const k=1-u.jmp/.6;const[tx,ty]=S(u.l,u.jp);it.x+=(tx-it.x)*k;y=y+(ty+cs*.4-y)*k-Math.sin(k*Math.PI)*cs*1.2}
  g.fillStyle='rgba(0,0,0,.28)';g.beginPath();g.ellipse(it.x,it.y-cs*.02,cs*.3,cs*.09,0,0,6.29);g.fill();
  if(d.wall){const r=u.hp/u.max;g.save();g.globalAlpha=.35+.25*Math.sin(t*2);g.strokeStyle=r>.66?'#bfe9ff':r>.33?'#ffe39a':'#ff9a9a';g.lineWidth=cs*.05;g.beginPath();g.arc(it.x,it.y-cs*.45,cs*.48,Math.PI*1.1,Math.PI*1.9);g.stroke();g.restore()}
  frame(im,fi,it.x,y,D,a,u.fl,tint);
  if(d.chomp&&u.chew>0){g.fillStyle='#fff';g.font=`800 ${Math.round(cs*.18)}px 'Noto Sans KR',sans-serif`;g.textAlign='center';g.fillText('냠냠…',it.x,it.y-cs*1.15);const w=cs*.6;g.fillStyle='rgba(0,0,0,.5)';g.fillRect(it.x-w/2,it.y-cs*1.05,w,3);g.fillStyle='#ffd36b';g.fillRect(it.x-w/2,it.y-cs*1.05,w*(1-u.chew/d.chomp.chew),3)}
  if(d.mine&&u.t>0){const w=cs*.5;g.fillStyle='rgba(0,0,0,.5)';g.fillRect(it.x-w/2,it.y+cs*.04,w,3);g.fillStyle='#e8c98a';g.fillRect(it.x-w/2,it.y+cs*.04,w*(1-u.t/d.mine.arm),3)}
  else if(d.mine){g.globalAlpha=.6+.4*Math.sin(t*6);g.fillStyle='#ffe9a8';g.beginPath();g.arc(it.x,it.y-cs*.95,cs*.05,0,6.29);g.fill();g.globalAlpha=1}
  if(u.hp<u.max){const w=cs*.6,r=Math.max(0,u.hp/u.max);g.fillStyle='rgba(0,0,0,.5)';g.fillRect(it.x-w/2,it.y+cs*.04,w,4);g.fillStyle=r>.5?'#7dff9a':r>.25?'#ffd36b':'#ff6b6b';g.fillRect(it.x-w/2,it.y+cs*.04,w*r,4)}}
function drawEnemy(it,t){const e=it.o,d=E[e.k],im=img(d.img);if(!ok(im))return;const a=e.die?Math.max(0,1-e.die/.6):1;const w=cs*d.sz,h=w*im.naturalHeight/im.naturalWidth;
  let by3=it.y-Math.abs(Math.sin(e.bob))*cs*(e.eat?.03:.06);if(e.jump>0){by3-=Math.sin((1-e.jump/.75)*Math.PI)*cs*1.1}
  g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(it.x,it.y,w*.36,cs*.08,0,0,6.29);g.fill();
  g.save();g.globalAlpha=a;const sq=e.eat?1+.06*Math.sin(e.bob*1.3):1;g.translate(it.x,by3);g.scale(1/sq,sq);g.drawImage(im,-w/2,-h,w,h);
  if(e.slow>0){const wi=white(im,'#7fd4ff');if(wi){g.globalAlpha=a*.45;g.drawImage(wi,-w/2,-h,w,h)}}
  if(e.fl>0){const wi=white(im);if(wi){g.globalAlpha=a*.6;g.drawImage(wi,-w/2,-h,w,h)}}g.restore();
  if(e.k==='flag'){g.save();g.globalAlpha=a;g.strokeStyle='#ddd';g.lineWidth=2;g.beginPath();g.moveTo(it.x+w*.25,by3-h*.6);g.lineTo(it.x+w*.25,by3-h*1.25);g.stroke();g.fillStyle='#ff5fa8';g.beginPath();g.moveTo(it.x+w*.25,by3-h*1.25);g.lineTo(it.x+w*.62,by3-h*1.12);g.lineTo(it.x+w*.25,by3-h*.98);g.fill();g.restore()}
  if(d.pole&&!e.jumped){g.save();g.globalAlpha=a;g.strokeStyle='#e8d9b0';g.lineWidth=3;g.beginPath();g.moveTo(it.x-w*.55,by3-h*.3);g.lineTo(it.x+w*.45,by3-h*.75);g.stroke();g.restore()}
  if(e.hp<e.max&&!e.die){const bw=cs*.5,r=Math.max(0,e.hp/e.max);g.fillStyle='rgba(0,0,0,.5)';g.fillRect(it.x-bw/2,it.y-h-6,bw,3);g.fillStyle='#ff8ab8';g.fillRect(it.x-bw/2,it.y-h-6,bw*r,3)}}
function thPos(){return vert?[34,32]:[34,30]}
function btn(id,x,y,w,h,fn,top){UI.push({id,x,y,w,h,fn,top})}
function cardFace(k,x,y,cw,ch,sel){const d=U[k];g.save();rr(x+3,y+3,cw-6,ch-24,8);g.clip();g.fillStyle=sel?'#ffd0ea':'#3f2a55';g.fillRect(x,y,cw,ch);const im=img(d.img);if(ok(im)){const fw=im.naturalHeight;g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';const s=Math.max(cw-6,ch-24)*1.3;g.drawImage(im,fw*.12,0,fw*.76,fw*.76,x+cw/2-s/2,y+2,s,s)}g.restore()}
function hud(){g.textBaseline='middle';
  const[tx,ty]=thPos();g.fillStyle='rgba(20,10,40,.78)';rr(tx-24,ty-19,92,38,19);g.fill();g.strokeStyle='rgba(160,236,255,.6)';g.lineWidth=1.5;g.stroke();yarn(tx-4,ty,11,1,T.t);g.fillStyle='#fff';g.font="800 18px 'Noto Sans KR',sans-serif";g.textAlign='left';g.fillText(T.th,tx+14,ty+1);
  const pw=vert?Math.min(150,W*.36):Math.min(220,W*.22),px=vert?W/2-pw/2+10:W-pw-112,py=vert?24:22;const k=Math.min(1,T.t/T.lastT);
  g.fillStyle='rgba(0,0,0,.5)';rr(px,py,pw,10,5);g.fill();g.fillStyle='#ff9fd0';rr(px,py,Math.max(10,pw*k),10,5);g.fill();
  for(const w of T.wv)if(w.flag){const fx=px+pw*Math.min(1,w.t/T.lastT);g.font='13px sans-serif';g.textAlign='center';g.fillText('🚩',fx,py-3)}
  g.font="700 11px 'Noto Sans KR',sans-serif";g.fillStyle='#ffe6f4';g.textAlign='center';g.fillText(`1-${T.si+1} ${CH1.stages[T.si].name}`,px+pw/2,py+22);
  const bs=36,rx=W-10-bs;const bb=(id,x,lab,fn,on)=>{g.fillStyle=on?'rgba(255,140,200,.9)':'rgba(20,10,40,.78)';rr(x,12,bs,bs,10);g.fill();g.strokeStyle='rgba(255,214,234,.6)';g.lineWidth=1.5;g.stroke();g.fillStyle='#fff';g.font=`800 ${lab.length>2?12:16}px 'Noto Sans KR',sans-serif`;g.textAlign='center';g.fillText(lab,x+bs/2,12+bs/2+1);btn(id,x,12,bs,bs,fn)};
  bb('pause',rx,'⏸',()=>{if(T.st==='play'){T.st='pause';snd('sel')}});bb('spd',rx-bs-6,'×2',()=>{T.speed=T.speed===1?2:1;snd('sel')},T.speed===2);
  const n=T.deck.length+1;let cw,ch,cx,cy,gap=5;
  if(vert){ch=Math.min(100,Math.max(80,H*.11));cw=Math.min(72,(W-16-gap*(n-1))/n);cx=(W-(cw*n+gap*(n-1)))/2;cy=H-ch-8}
  else{ch=Math.min(88,Math.max(68,H*.14));cw=ch*.76;cx=140;cy=8}
  T.cards.forEach((c,i)=>{const d=U[c.k],x=cx+i*(cw+gap),y=cy,can=T.th>=d.cost&&c.cd<=0,sel=T.sel===c.k;
    g.save();g.fillStyle=sel?'#ffe1f1':'#2a1838';rr(x,y,cw,ch,10);g.fill();g.lineWidth=sel?3:1.5;g.strokeStyle=sel?'#ff6fb1':'rgba(255,214,234,.55)';g.stroke();
    cardFace(c.k,x,y,cw,ch,sel);g.fillStyle=sel?'#5a1a40':'#fff';g.font=`800 ${cw<60?11:13}px 'Noto Sans KR',sans-serif`;g.textAlign='center';g.fillText('🧵'+d.cost,x+cw/2,y+ch-11);
    if(!can){g.fillStyle='rgba(10,0,20,.55)';rr(x,y,cw,ch,10);g.fill()}
    if(c.cd>0){const r=c.cd/d.cd;g.fillStyle='rgba(0,0,0,.45)';g.fillRect(x,y,cw,ch*r);g.fillStyle='#fff';g.font="700 12px sans-serif";g.fillText(Math.ceil(c.cd)+'s',x+cw/2,y+ch/2)}
    g.restore();btn('card'+i,x,y,cw,ch,()=>{if(T.st!=='play')return;if(!can){snd('no');return}T.shovel=false;T.sel=sel?null:c.k;snd('sel')})});
  const x=cx+T.deck.length*(cw+gap),y=cy;g.fillStyle=T.shovel?'#ffe1f1':'#2a1838';rr(x,y,cw,ch,10);g.fill();g.strokeStyle=T.shovel?'#ff6fb1':'rgba(255,214,234,.55)';g.lineWidth=T.shovel?3:1.5;g.stroke();g.font=`${Math.min(28,cw*.4)}px sans-serif`;g.textAlign='center';g.fillText('✂️',x+cw/2,y+ch*.42);g.fillStyle=T.shovel?'#5a1a40':'#ffe6f4';g.font="700 11px 'Noto Sans KR',sans-serif";g.fillText('빼기',x+cw/2,y+ch-12);
  btn('shovel',x,y,cw,ch,()=>{if(T.st!=='play')return;T.sel=null;T.shovel=!T.shovel;snd('sel')})}
function wrap(tx,maxW){const out=[];let line='';for(const ch of tx){if(g.measureText(line+ch).width>maxW&&line){out.push(line);line=ch.trim()?ch:''}else line+=ch}if(line)out.push(line);return out}
function ariBox(){const s=T&&T.say;if(!s)return;const a=Math.min(1,s.t/.25)*(s.dur<50?Math.min(1,(s.dur-s.t)/.4):1);if(a<=0)return;
  const w=Math.min(W-20,460),x=(W-w)/2,y=vert?62:(H-96);g.save();g.globalAlpha=a;g.font="600 13.5px 'Noto Sans KR',sans-serif";const lines=wrap(s.tx,w-86);const h=Math.max(66,lines.length*19+30);
  g.fillStyle='rgba(28,14,48,.92)';rr(x,y,w,h,14);g.fill();g.strokeStyle='rgba(160,236,255,.7)';g.lineWidth=1.5;g.stroke();
  const im=img(FACE[s.f]||FACE.n);if(ok(im)){g.save();rr(x+8,y+8,56,56,10);g.clip();g.drawImage(im,x+8,y+8,56,56);g.restore()}
  g.fillStyle='#9fe8ff';g.font="800 11px 'Noto Sans KR',sans-serif";g.textAlign='left';g.textBaseline='top';g.fillText('아리아드네',x+74,y+9);
  g.fillStyle='#fff';g.font="600 13.5px 'Noto Sans KR',sans-serif";lines.forEach((ln,i)=>g.fillText(ln,x+74,y+27+i*19));g.restore();g.textBaseline='middle'}
function panel(w,h,dim){const x=(W-w)/2,y=(H-h)/2;if(dim!==false){g.fillStyle='rgba(8,0,16,.6)';g.fillRect(0,0,W,H)}g.fillStyle='rgba(30,14,52,.96)';rr(x,y,w,h,18);g.fill();g.strokeStyle='rgba(255,190,230,.75)';g.lineWidth=2;g.stroke();return[x,y]}
function pbtn(id,x,y,w,h,lab,main,fn,off){g.fillStyle=off?'rgba(255,255,255,.06)':main?'#ff6fb1':'rgba(255,255,255,.12)';rr(x,y,w,h,12);g.fill();g.fillStyle=off?'#888':'#fff';g.font="800 15px 'Noto Sans KR',sans-serif";g.textAlign='center';g.textBaseline='middle';g.fillText(lab,x+w/2,y+h/2+1);if(!off)UI.push({id,x,y,w,h,fn,top:1})}
/* --- 화면: 스테이지 지도 --- */
function mapScr(){const w=Math.min(W-20,460),x=(W-w)/2;let y=18;g.textAlign='center';g.textBaseline='middle';
  g.fillStyle='#ffd1ea';g.font="900 22px 'Noto Sans KR',sans-serif";g.fillText('🌷 마음의 정원',W/2,y+16);g.fillStyle='#cfe8ff';g.font="700 13px 'Noto Sans KR',sans-serif";g.fillText(CH1.name,W/2,y+42);
  pbtn('mx',W-52,10,42,36,'✕',false,()=>GD.close());
  if(SV.dev||window.GD_DEV)pbtn('dv',10,10,92,36,SV.cl>=10?'🧪 처음부터':'🧪 전부 열기',false,()=>{SV.cl=SV.cl>=10?0:10;save()});
  const own=owned(SV.cl);g.fillStyle='#ddd';g.font="600 12px 'Noto Sans KR',sans-serif";g.fillText(`합류한 대원 ${own.length}명 · 다음 대원은 스테이지를 깨면 와요`,W/2,y+64);
  const cols=vert?2:5,gap=10,bw=(w-gap*(cols-1))/cols,bh=vert?Math.min(72,(H-190)/5-gap):Math.min(96,(H-200)/2-gap);y+=86;
  CH1.stages.forEach((st,i)=>{const cx=x+(i%cols)*(bw+gap),cy=y+Math.floor(i/cols)*(bh+gap);const open=i<=SV.cl,clr=i<SV.cl;
    g.fillStyle=!open?'rgba(255,255,255,.05)':clr?'rgba(120,200,255,.18)':'rgba(255,120,190,.28)';rr(cx,cy,bw,bh,14);g.fill();g.strokeStyle=open&&!clr?'#ff8fc8':'rgba(255,214,234,.35)';g.lineWidth=open&&!clr?2.5:1.2;g.stroke();
    g.textAlign='left';g.fillStyle=open?'#fff':'#777';g.font="900 16px 'Noto Sans KR',sans-serif";g.fillText(`1-${i+1}`,cx+12,cy+bh*.34);g.font="600 12px 'Noto Sans KR',sans-serif";g.fillText(open?st.name:'???',cx+12,cy+bh*.68);
    g.textAlign='right';g.font='20px sans-serif';g.fillText(clr?'✅':open?'▶':'🔒',cx+bw-10,cy+bh/2);
    if(st.gift&&!clr&&open){const im=img(U[st.gift].img),sl=white(im,'#0a0614');if(sl){g.save();g.globalAlpha=.85;g.drawImage(sl,0,0,im.naturalHeight,im.naturalHeight,cx+bw-44-(bh-8),cy+4,bh-8,bh-8);g.restore()}}
    if(open)btn('st'+i,cx,cy,bw,bh,()=>goStage(i),1)});
  ariMini(SV.cl>=CH1.stages.length?'1장을 다 깼어요! 2장 상봉에서 기다릴게요. ✨':SV.cl===0?'어머, 언니. 정원에 무수리가 와요. 1-1부터 같이 막아 봐요.':'다음 스테이지에 새 대원이 기다리고 있어요. 💅')}
function ariMini(tx){const w=Math.min(W-20,460),x=(W-w)/2,y=H-84;g.fillStyle='rgba(28,14,48,.92)';rr(x,y,w,70,14);g.fill();g.strokeStyle='rgba(160,236,255,.6)';g.lineWidth=1.2;g.stroke();const im=img(FACE.w);if(ok(im)){g.save();rr(x+8,y+7,56,56,10);g.clip();g.drawImage(im,x+8,y+7,56,56);g.restore()}
  g.textAlign='left';g.textBaseline='top';g.fillStyle='#9fe8ff';g.font="800 11px 'Noto Sans KR',sans-serif";g.fillText('아리아드네',x+74,y+9);g.fillStyle='#fff';g.font="600 13px 'Noto Sans KR',sans-serif";wrap(tx,w-86).slice(0,2).forEach((l,i)=>g.fillText(l,x+74,y+27+i*18));g.textBaseline='middle'}
function goStage(i){snd('sel');const own=owned(SV.cl);let deck=(SV.deck||[]).filter(k=>own.includes(k));
  if(own.length<=DECK_MAX){start(i,own);return}
  if(!deck.length)deck=own.slice(0,DECK_MAX);PICK=deck.slice(0,DECK_MAX);T={si:i,pick:1};SCR='deck'}
function start(i,deck){SV.deck=deck.slice();save();newGame(i,deck,(Date.now()%9973)+1);SCR='play';last=0}
/* --- 화면: 덱 고르기 --- */
function deckScr(){const own=owned(SV.cl);const w=Math.min(W-16,520),x=(W-w)/2;let y=16;g.textAlign='center';g.textBaseline='middle';
  g.fillStyle='#ffd1ea';g.font="900 19px 'Noto Sans KR',sans-serif";g.fillText(`1-${T.si+1} 함께 갈 대원 ${PICK.length}/${DECK_MAX}`,W/2,y+16);
  g.fillStyle='#ddd';g.font="600 12px 'Noto Sans KR',sans-serif";g.fillText('카드를 눌러 넣고 빼요. 실타래 짜는 대원은 꼭 챙겨요.',W/2,y+40);
  const cols=vert?3:6,gap=8,cw=(w-gap*(cols-1))/cols,ch=vert?Math.min(128,(H-210)/Math.ceil(own.length/cols)-gap):Math.min(150,(H-170)/Math.ceil(own.length/cols)-gap);y+=58;
  own.forEach((k,i)=>{const d=U[k],cx=x+(i%cols)*(cw+gap),cy=y+Math.floor(i/cols)*(ch+gap),on=PICK.includes(k);
    g.fillStyle=on?'#ffe1f1':'#2a1838';rr(cx,cy,cw,ch,12);g.fill();g.strokeStyle=on?'#ff6fb1':'rgba(255,214,234,.4)';g.lineWidth=on?3:1.2;g.stroke();
    const im=img(d.img);if(ok(im)){const fw=im.naturalHeight;g.save();g.imageSmoothingEnabled=true;g.drawImage(im,0,0,fw,fw,cx+cw/2-(ch-40)/2,cy+2,ch-40,ch-40);g.restore()}
    g.fillStyle=on?'#5a1a40':'#fff';g.font="800 12px 'Noto Sans KR',sans-serif";g.fillText(d.role,cx+cw/2,cy+ch-28);g.font="600 11px 'Noto Sans KR',sans-serif";g.fillStyle=on?'#7a3a60':'#bbb';g.fillText(`${d.n} · 🧵${d.cost}`,cx+cw/2,cy+ch-12);
    btn('pk'+i,cx,cy,cw,ch,()=>{snd('sel');const j=PICK.indexOf(k);if(j>=0)PICK.splice(j,1);else if(PICK.length<DECK_MAX)PICK.push(k);else snd('no')},1)});
  pbtn('dgo',W/2+6,H-60,Math.min(160,w/2-10),44,'출발',true,()=>start(T.si,PICK),!PICK.length);pbtn('dbk',W/2-6-Math.min(160,w/2-10),H-60,Math.min(160,w/2-10),44,'뒤로',false,()=>{SCR='map';T=null})}
/* --- 화면: 새 대원 합류 --- */
function giftScr(){const k=RES.gift,d=U[k];const w=Math.min(W-24,380),h=Math.min(H-40,460);const[x,y]=panel(w,h,false);const t=performance.now()/1000;g.textAlign='center';g.textBaseline='middle';
  g.fillStyle='#ffd1ea';g.font="900 20px 'Noto Sans KR',sans-serif";g.fillText('✨ 새 대원 합류!',x+w/2,y+32);
  const im=img(d.img),D=Math.min(w-80,h-200);const gl=g.createRadialGradient(x+w/2,y+60+D/2,10,x+w/2,y+60+D/2,D*.6);gl.addColorStop(0,'rgba(255,190,230,.45)');gl.addColorStop(1,'rgba(255,190,230,0)');g.fillStyle=gl;g.fillRect(x,y+50,w,D+20);
  frame(im,((t*2.4)|0)%2,x+w/2,y+60+D,D,1,0);
  g.fillStyle='#fff';g.font="900 18px 'Noto Sans KR',sans-serif";g.fillText(`${d.n} · ${d.sk}`,x+w/2,y+h-112);g.fillStyle='#9fe8ff';g.font="800 14px 'Noto Sans KR',sans-serif";g.fillText(`${d.role}   🧵${d.cost}`,x+w/2,y+h-88);
  g.fillStyle='#ddd';g.font="600 12.5px 'Noto Sans KR',sans-serif";wrap(d.desc,w-40).forEach((l,i)=>g.fillText(l,x+w/2,y+h-64+i*17));
  pbtn('gok',x+w/2-80,y+h-34-8,160,38,'좋아요',true,()=>{SCR='map';T=null})}
function endBox(){const w=Math.min(W-24,360),h=200;const[x,y]=panel(w,h);const win=T.st==='win';g.textAlign='center';g.textBaseline='middle';
  g.fillStyle=win?'#ffd1ea':'#ffb3b3';g.font="900 22px 'Noto Sans KR',sans-serif";g.fillText(win?'🌷 정원을 지켰어요!':'💔 마음의 선이 뚫렸어요',x+w/2,y+38);
  g.fillStyle='#ddd';g.font="600 13px 'Noto Sans KR',sans-serif";g.fillText(`버틴 시간 ${Math.floor(T.t/60)}:${String(Math.floor(T.t%60)).padStart(2,'0')} · 무수리 ${T.kills}마리`,x+w/2,y+76);
  if(win)pbtn('next',x+20,y+h-64,w-40,44,RES&&RES.gift?'새 대원 만나기':'정원 지도로',true,()=>{if(RES&&RES.gift){SCR='gift'}else{SCR='map';T=null}});
  else{pbtn('again',x+20,y+h-64,(w-50)/2,44,'다시 하기',true,()=>start(T.si,T.deck));pbtn('out',x+30+(w-50)/2,y+h-64,(w-50)/2,44,'지도로',false,()=>{SCR='map';T=null})}}
function pauseBox(){const w=Math.min(W-24,300),h=220;const[x,y]=panel(w,h);g.textAlign='center';g.fillStyle='#fff';g.font="900 20px 'Noto Sans KR',sans-serif";g.fillText('일시정지',x+w/2,y+34);
  pbtn('resume',x+30,y+64,w-60,40,'계속하기',true,()=>{T.st='play'});pbtn('retry',x+30,y+112,w-60,40,'처음부터',false,()=>start(T.si,T.deck));pbtn('quit',x+30,y+160,w-60,40,'지도로',false,()=>{SCR='map';T=null})}

/* ---------- 입력 ---------- */
function pt(e){const r=cv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]}
function down(e){e.preventDefault();const[x,y]=pt(e);
  const top=UI.filter(b=>b.top);const list=top.length?top:UI;
  for(const b of list)if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h){b.fn();return}
  if(SCR!=='play'||!T||T.st!=='play')return;
  let best=null,bd=cs*.62;for(const th of T.thr){if(th.col||th.sx==null)continue;const d=Math.hypot(th.sx-x,th.sy-y);if(d<bd){bd=d;best=th}}
  if(best){collect(best);return}
  const c=cellAt(x,y);if(!c)return;
  if(T.shovel){const u=T.units.find(u=>u.l===c.l&&u.c===c.c);if(u){T.units=T.units.filter(v=>v!==u);T.th+=Math.floor(U[u.k].cost/2);burst(u.l,u.c+.5,'#ffffff',8);snd('sel')}T.shovel=false;return}
  if(T.sel){if(plant(T.sel,c.l,c.c)){T.sel=null}else snd('no')}}
function move(e){if(SCR!=='play'||!T)return;const[x,y]=pt(e);T.hover=cellAt(x,y)}

/* ---------- 루프 ---------- */
let last=0;function loop(ts){raf=requestAnimationFrame(loop);const dt=Math.min(.05,last?(ts-last)/1000:0);last=ts;
  if(SCR==='play'&&T&&T.st==='play'){let left=dt*T.speed;while(left>0){const s=Math.min(1/60,left);step(s);left-=s}}
  if(SCR==='play'&&T&&T.st!=='play'&&T.say)T.say.t+=0;
  if(T&&T.shake>0)T.shake=Math.max(0,T.shake-dt*20);
  draw()}
GD.open=function(o){o=o||{};onClose=o.onClose||null;if(ov)GD.close(true);load();
  try{if(/[?&]gddev=1/.test(location.search)||localStorage.getItem('gs_tddev')==='1')SV.dev=1}catch(e){}
  ov=document.createElement('div');ov.id='gdOv';ov.style.cssText='position:fixed;inset:0;z-index:99999;background:#120a1e;touch-action:none;user-select:none;-webkit-user-select:none';
  cv=document.createElement('canvas');cv.style.cssText='display:block;touch-action:none';ov.appendChild(cv);document.body.appendChild(ov);g=cv.getContext('2d');
  layout();SCR='map';T=null;[...Object.values(U).map(u=>u.img),...Object.values(E).map(e=>e.img),...Object.values(FACE)].forEach(img);
  cv.addEventListener('pointerdown',down);cv.addEventListener('pointermove',move);window.addEventListener('resize',layout);last=0;raf=requestAnimationFrame(loop)};
GD.close=function(quiet){cancelAnimationFrame(raf);raf=0;window.removeEventListener('resize',layout);if(ov)ov.remove();ov=null;cv=null;const f=onClose;onClose=null;if(!quiet&&f)try{f()}catch(e){}};

/* ---------- 테스트: 봇 ----------
   'pro' 정석 / 'newbie' 느리고 대충(방패·폭탄 안 씀) / 'spam' 사격수만 */
function botDeck(si,strat){const own=owned(si);if(strat==='spam')return own.includes('rep')?['rep','pea']:['pea'];
  const pref=['sun','pea','rep','snow','wall','cherry','chomp','squash','mine','sshroom','puff'];return pref.filter(k=>own.includes(k)).slice(0,DECK_MAX)}
GD.sim=function(si,sec,strat,seed){const saveT=T;const deck=botDeck(si,strat);newGame(si,deck,seed||7);T.headless=1;T.auto=strat==='newbie'?2.5:.8;let think=0;const r=rng((seed||7)*13+si);
  const has=k=>T.deck.includes(k),ready=k=>{const c=T.cards.find(c=>c.k===k);return c&&c.cd<=0&&T.th>=U[k].cost};
  const free=(l,c)=>!T.units.some(u=>u.l===l&&u.c===c);const P=(k,l,c)=>has(k)&&ready(k)&&free(l,c)&&plant(k,l,c);
  const thr=l=>T.ens.filter(e=>!e.die&&e.l===l&&e.p<9.7);const hp=l=>thr(l).reduce((a,e)=>a+e.hp,0);
  const dps=l=>T.units.filter(u=>u.l===l&&U[u.k].shoot).reduce((a,u)=>a+U[u.k].shoot.n*(U[u.k].shoot.range?.5:1),0);
  const dt=1/30;for(let i=0;i<sec/dt&&T.st==='play';i++){step(dt);think-=dt;if(think>0)continue;think=strat==='newbie'?2:.5;
    if(strat==='pro'){const prod=T.units.filter(u=>U[u.k].prod).length;const sh=T.units.filter(u=>U[u.k].shoot).length;
      // 위급: 앞까지 온 무수리
      for(let l=0;l<5;l++){const near=thr(l).filter(e=>e.p<3.2);if(!near.length)continue;const e=near[0];
        if(hp(l)>700||near.length>=3){const c=Math.max(0,Math.min(8,Math.round(e.p-.5)));if(P('cherry',l,c))break}
        const c=Math.max(0,Math.min(8,Math.floor(e.p-.3)));if(free(l,c)&&P('squash',l,c))break;if(P('chomp',l,Math.max(0,c-1)))break}
      // 양동이·고깔이 많은 줄엔 꿀꺽/체리
      for(let l=0;l<5;l++){const big=thr(l).find(e=>e.max>=1000&&e.p<6.5);if(big){if(P('chomp',l,3))break;if(hp(l)>1500&&P('cherry',l,Math.round(big.p-.5)))break}}
      // 사격수 부족한 줄
      const L=[0,1,2,3,4].sort((a,b)=>(hp(b)/40-dps(b))-(hp(a)/40-dps(a)));
      let need=L.find(l=>thr(l).length&&dps(l)<Math.min(4,1+hp(l)/350));const danger=need!=null&&thr(need).some(e=>e.p<6.2);if(need!=null&&!danger&&prod<Math.min(6,3+Math.floor(T.t/40))&&dps(need)>=1)need=null;
      if(need!=null){const k=has('rep')&&ready('rep')?'rep':has('snow')&&ready('snow')&&dps(need)>=1?'snow':'pea';for(const c of [1,2,3])if(P(k,need,c))break;
        if(has('puff'))for(const c of [5,6])if(P('puff',need,c))break}
      else if(prod<Math.min(9,3+Math.floor(sh*.9))){pp:for(const c of [0,1])for(const l of [2,1,3,0,4])if(free(l,c)&&(P('sun',l,c)||P('sshroom',l,c)))break pp}
      else{const l=[2,1,3,0,4].find(l=>dps(l)<2);if(l!=null){const k=has('rep')&&T.th>=300?'rep':'pea';for(const c of [1,2,3])if(P(k,l,c))break}}
      for(const l of L){if(thr(l).some(e=>e.p<8&&(e.max>=500||thr(l).length>=2))&&free(l,6))P('wall',l,6)}
      for(const l of L){const e=thr(l).find(e=>e.p>6&&e.p<8.5);if(e)P('mine',l,7)}}
    else if(strat==='newbie'){const th=l=>thr(l).length>0;const ys=l=>T.units.some(u=>u.l===l&&U[u.k].shoot);
      const l=[0,1,2,3,4].find(l=>th(l)&&!ys(l));if(l!=null)P(has('rep')&&r()<.4?'rep':'pea',l,Math.floor(r()*5));else if(r()<.45)P('sun',Math.floor(r()*5),Math.floor(r()*3));else P('pea',Math.floor(r()*5),Math.floor(r()*6))}
    else if(strat==='spam'){for(let l=0;l<5;l++)for(let c=0;c<9;c++)if(free(l,c)&&(P(T.deck[0],l,c)||P('pea',l,c)))break}}
  const res={si,st:T.st,t:+T.t.toFixed(1),kills:T.kills,planted:T.planted,spools:T.lanes.filter(l=>!l.spool).length,en:T.wv.filter(w=>w.k).length,th:T.th,
    board:[0,1,2,3,4].map(l=>T.units.filter(u=>u.l===l).sort((a,b)=>a.c-b.c).map(u=>u.k+u.c).join(' ')+' | '+T.ens.filter(e=>e.l===l&&!e.die).map(e=>e.k+e.p.toFixed(1)).join(' '))};T=saveT;return res};
GD._T=()=>T;GD._dbg={plant,step,spawn,dropThread,newGame,SV:()=>SV,set:(k,v)=>{if(k==='SCR')SCR=v;if(k==='T')T=v;if(k==='RES')RES=v}};
})();
