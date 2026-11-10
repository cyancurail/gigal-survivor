/* ===== 🌷 마음의 정원(가제) — 로비 미니게임 · 1단계 시안 (2026-11-10) =====
   줄 방어(좀비플랜트풍). 5줄 × 9칸, 왼쪽(세로 화면은 아래) 끝이 「마음의 선」.
   세로 화면: 무수리가 위에서 아래로 / 가로 화면: 오른쪽에서 왼쪽으로.
   좌표는 전부 줄(l 0~4) · 위치(p 0~9, 0 = 마음의 선) 기준이고, 그릴 때만 화면으로 바꾼다.
   사용: GD.open({onClose}) / GD.close() / 테스트: GD.sim(초, 전략) */
(function(){
'use strict';
const GD=window.GD={};
const BASE=(window.GD_BASE!=null?window.GD_BASE:'');
/* ---------- 그림 ---------- */
const IM={},WH=new Map();
function img(p){if(IM[p])return IM[p];const i=new Image();i.decoding='async';i.src=(window.GD_ASSET&&window.GD_ASSET[p])||BASE+p;IM[p]=i;return i}
const ok=i=>i&&i.complete&&i.naturalWidth>0;
function white(i){let c=WH.get(i);if(c)return c;if(!ok(i))return null;c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;const g=c.getContext('2d');g.drawImage(i,0,0);g.globalCompositeOperation='source-in';g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);WH.set(i,c);return c}

/* ---------- 데이터 (1단계: 대원 3 · 무수리 2) ---------- */
/* 대원 그림 = 신화 스킨 카드 시리즈(msk2/cdNN.png, 256px 8칸: 0~1 대기 · 2~3 공격 · 4~7 걷기) */
const U={
  wood:{n:'쥬은',sk:'우드카드',img:'msk2/cd07.png',cost:50,cd:7.5,hp:300,role:'🌱 실타래 피우기',desc:'가만히 있어도 실타래를 피워 줘요.',prod:{first:5,every:20,amt:25}},
  yenis:{n:'태태영',sk:'예니스',img:'msk2/cd01.png',cost:100,cd:7.5,hp:300,role:'💗 하트 사격',desc:'같은 줄 무수리에게 하트를 쏴요.',shoot:{every:1.4,dmg:20}},
  shield:{n:'무룩',sk:'실드카드',img:'msk2/cd02.png',cost:50,cd:30,cd0:20,hp:4000,role:'🛡️ 방패',desc:'단단하게 길을 막아요. 무수리가 한참 갉아먹어요.'}
};
const DECK=['wood','yenis','shield'];
const E={
  mu:{n:'무수리',img:'td/m2_01.png',hp:200,spd:.21,bite:100,sz:.9},
  tank:{n:'단단한 무수리',img:'td/m2_03.png',hp:640,spd:.19,bite:100,sz:1.02}
};
const STAGE={id:'1-1',name:'축제의 밤 정원',bg:'fx/lobby_festa.jpg',th0:150};
function rng(s){return()=>(s=(s*16807)%2147483647)/2147483647}
function waves(seed){const r=rng(seed||7),W=[];let last=-1;
  const lane=()=>{let l;do{l=Math.floor(r()*5)}while(l===last&&r()<.7);last=l;return l};
  const add=(t,k,l)=>W.push({t,k,l:l==null?lane():l});
  /* 처음엔 가운데 줄부터 천천히 → 1분 뒤부터 모든 줄 */
  add(20,'mu',2);add(38,'mu',1);add(52,'mu',3);add(62,'mu',2);[72,80,86].forEach(t=>add(t,'mu'));
  W.push({t:95,flag:1});[95,96,97,98.5].forEach(t=>add(t,'mu'));add(99.5,'tank');
  [112,120,126,133,139,146,152].forEach((t,i)=>add(t,i%3===2?'tank':'mu'));add(126.8,'mu');add(146.8,'mu');
  W.push({t:168,flag:2,fin:1});for(let i=0;i<7;i++)add(168+i*.8,'mu');add(170,'tank');add(172.5,'tank');
  return W.sort((a,b)=>a.t-b.t)}
const LAST_T=175;

/* ---------- 상태 ---------- */
let T=null,cv=null,g=null,ov=null,raf=0,onClose=null,DPR=1;
function newGame(seed){T={t:0,th:STAGE.th0,units:[],ens:[],pr:[],thr:[],fx:[],
  lanes:[0,1,2,3,4].map(()=>({spool:1,sw:null})),wv:waves(seed),wi:0,sel:null,shovel:false,
  cards:DECK.map(k=>({k,cd:U[k].cd0||0})),st:'intro',speed:1,sky:6,say:null,said:{},banner:null,hover:null,flash:0,shake:0,kills:0,planted:0}}

/* ---------- 레이아웃 ---------- */
let W=0,H=0,vert=true,cs=60,bx=0,by=0,UI=[];
function layout(){W=window.innerWidth;H=window.innerHeight;vert=H>W*1.05;
  DPR=Math.min(2,window.devicePixelRatio||1,Math.max(.75,Math.sqrt(2.1e6/(W*H))));
  if(cv){cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);cv.style.width=W+'px';cv.style.height=H+'px'}
  if(vert){const top=64,bar=Math.min(120,Math.max(92,H*.13));cs=Math.min((W-14)/5,(H-top-bar-16)/10.25);bx=(W-5*cs)/2;by=H-bar-12-.5*cs-9*cs}
  else{const top=Math.min(104,Math.max(78,H*.16));const av=H-top-8;cs=Math.min((W-20)/10.4,av/5.05);bx=(W-9*cs)/2+.15*cs;by=top+(av-5*cs)/2}}
function S(l,p){return vert?[bx+(l+.5)*cs,by+(9-p)*cs]:[bx+p*cs,by+(l+.5)*cs]}
function cellAt(x,y){let l,p;if(vert){l=Math.floor((x-bx)/cs);p=9-(y-by)/cs}else{l=Math.floor((y-by)/cs);p=(x-bx)/cs}
  const c=Math.floor(p);return(l>=0&&l<5&&c>=0&&c<9)?{l,c}:null}

/* ---------- 소리 (아주 작게) ---------- */
let AC=null;function vol(){let v=1;try{const s=localStorage.getItem('gs_vol_s');if(s!=null)v=+s}catch(e){}return v}
function snd(k){if(T&&T.headless)return;try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();const v=vol()*.18;if(v<=0)return;const t=AC.currentTime,o=AC.createOscillator(),a=AC.createGain();o.connect(a);a.connect(AC.destination);
  const P={col:['sine',880,1320,.12,1],plant:['triangle',330,520,.1,.9],shoot:['sine',740,620,.05,.35],hit:['square',220,140,.04,.18],die:['triangle',300,90,.18,.6],flag:['sawtooth',300,600,.35,.5],sweep:['sine',500,1500,.6,.8],win:['sine',660,1320,.6,1],lose:['triangle',300,120,.7,.9],sel:['sine',600,700,.05,.5],no:['square',160,120,.08,.3]}[k];if(!P)return;
  o.type=P[0];o.frequency.setValueAtTime(P[1],t);o.frequency.exponentialRampToValueAtTime(P[2],t+P[3]);a.gain.setValueAtTime(v*P[4],t);a.gain.exponentialRampToValueAtTime(.0001,t+P[3]+.05);o.start(t);o.stop(t+P[3]+.08)}catch(e){}}

/* ---------- 아리아드네 ---------- */
const FACE={n:'td/ari/n.png',w:'td/ari/w.png',o:'td/ari/o.png',d:'td/ari/d.png',s:'td/ari/s.png'};
function say(f,tx,dur){if(T.headless)return;T.say={f,tx,t:0,dur:dur||4}}
function once(k,f,tx,dur){if(T.said[k])return;T.said[k]=1;say(f,tx,dur)}

/* ---------- 게임 로직 ---------- */
function plant(k,l,c){const d=U[k],cd=T.cards.find(x=>x.k===k);if(!cd||cd.cd>0||T.th<d.cost)return false;if(T.units.some(u=>u.l===l&&u.c===c))return false;
  T.th-=d.cost;cd.cd=d.cd;const u={k,l,c,hp:d.hp,max:d.hp,t:0,at:0,fl:0,pop:.25};if(d.prod)u.t=d.prod.first;if(d.shoot)u.t=.6;T.units.push(u);T.planted++;snd('plant');
  if(k==='wood')once('w1','w','쥬은 언니가 자리 잡았어요. 이제 실타래가 피어날 거예요.',3.5);return true}
function dropThread(lf,p,amt,from){T.thr.push({lf,p,amt,f:from?0:1,pop:from?.5:0,life:from?9:8,t:0,col:0})}
function collect(th){if(th.col)return;th.col=1;th.ct=0;T.th+=th.amt;snd('col');once('c1','w','그거예요. 실타래는 우리 재산이에요.',2.6)}
function spawn(k,l){const d=E[k];T.ens.push({k,l,p:9.6,hp:d.hp,max:d.hp,fl:0,bob:Math.random()*6,eat:null,die:0,sl:0})}
function hurtE(e,dmg){if(e.die)return;e.hp-=dmg;e.fl=.09;if(e.hp<=0){e.die=.001;T.kills++;snd('die');burst(e.l,e.p,'#ffd6f0',10)}else if(!T.headless&&Math.random()<.4)snd('hit')}
function burst(l,p,col,n){if(T.headless)return;for(let i=0;i<n;i++){const a=Math.random()*6.28,s=.6+Math.random()*1.6;T.fx.push({l,p,dx:Math.cos(a)*s,dy:Math.sin(a)*s,t:0,life:.45+Math.random()*.3,col,r:.04+Math.random()*.05})}}
function lose(){if(T.st!=='play')return;T.st='lose';T.end=0;snd('lose');say('d','어머....언니....제가 수준을 잘못 생각했나봐요.',99)}
function win(){if(T.st!=='play')return;T.st='win';T.end=0;snd('win');say('w','정원을 지켰어요. 역시 제가 사람 보는 눈은 있다니까요. 💅',99)}

function step(dt){const t0=T.t;T.t+=dt;
  // 카드 충전
  for(const c of T.cards)if(c.cd>0)c.cd=Math.max(0,c.cd-dt);
  // 웨이브
  while(T.wi<T.wv.length&&T.wv[T.wi].t<=T.t){const w=T.wv[T.wi++];
    if(w.flag){T.banner={tx:w.fin?'마지막 무수리 무리예요!':'대규모 무수리가 몰려와요!',t:0};snd('flag');say('o',w.fin?'마지막 무리예요. 실 끝 꽉 잡아요!':'대규모 무수리예요! 언니, 화장 고치고 집중해요.',3.5)}
    else{spawn(w.k,w.l);if(!T.said.e1){once('e1','o','어머, 왔어요! 태태영님을 그 줄에 심어서 하트를 쏘세요.',4)}}}
  // 하늘 실타래
  T.sky-=dt;if(T.sky<=0){T.sky=7+((T.t*7.3)%1)*2;dropThread(.4+((T.t*3.1)%1)*4.2,1.2+((T.t*5.7)%1)*7,25,false);if(T.t>4)once('s1','n','하늘색 실타래가 보이면 톡 눌러서 모아요.',3.5)}
  // 대원
  for(const u of T.units){const d=U[u.k];u.fl=Math.max(0,u.fl-dt);u.pop=Math.max(0,u.pop-dt);u.at=Math.max(0,u.at-dt);
    if(d.prod){u.t-=dt;if(u.t<=0){u.t=d.prod.every;u.at=.5;dropThread(u.l+.15,u.c+.75,d.prod.amt,true)}}
    if(d.shoot){u.t-=dt;if(u.t<=0){const tg=T.ens.some(e=>!e.die&&e.l===u.l&&e.p>u.c+.2&&e.p<9.75);if(tg){u.t=d.shoot.every;u.at=.35;T.pr.push({l:u.l,p:u.c+.75,dmg:d.shoot.dmg,sp:6.2,a:0});if(!T.headless&&Math.random()<.5)snd('shoot')}else u.t=.1}}}
  // 투사체
  for(const pr of T.pr){pr.p+=pr.sp*dt;pr.a+=dt;if(pr.p>10){pr.dead=1;continue}
    let best=null;for(const e of T.ens){if(e.die||e.l!==pr.l||e.p>9.8)continue;if(pr.p>=e.p-.3&&pr.p<=e.p+.4&&(!best||e.p<best.p))best=e}
    if(best){hurtE(best,pr.dmg);pr.dead=1;burst(pr.l,pr.p,'#ff7ab6',5)}}
  T.pr=T.pr.filter(p=>!p.dead);
  // 무수리
  for(const e of T.ens){const d=E[e.k];e.fl=Math.max(0,e.fl-dt);e.bob+=dt*(e.eat?11:6);
    if(e.die){e.die+=dt;continue}
    // 먹을 대원 찾기 (앞쪽이 칸 안에 들어오면)
    let tg=null;for(const u of T.units){if(u.l!==e.l||u.hp<=0)continue;if(e.p-.28<=u.c+.85&&e.p>u.c+.15&&(!tg||u.c>tg.c))tg=u}
    e.eat=tg;if(tg){tg.hp-=d.bite*dt;tg.fl=.06;if(tg.hp<=0){tg.dead=1;burst(tg.l,tg.c+.5,'#cfe8ff',12);snd('die')}}
    else e.p-=d.spd*dt;
    if(e.p<-.15){const ln=T.lanes[e.l];if(ln.spool&&!ln.sw){ln.sw={p:-.4};ln.spool=0;snd('sweep');once('sw1','w','실은 줄마다 한 번뿐이에요. 아껴 쓰는 여자가 아름다워요.',4)}else if(!ln.sw)lose()}}
  T.units=T.units.filter(u=>!u.dead);
  // 아리아드네의 실
  for(let l=0;l<5;l++){const ln=T.lanes[l];if(!ln.sw)continue;ln.sw.p+=7*dt;for(const e of T.ens)if(!e.die&&e.l===l&&e.p<=ln.sw.p+.3){hurtE(e,1e9);burst(l,e.p,'#9fe8ff',8)}if(ln.sw.p>10.3)ln.sw=null}
  T.ens=T.ens.filter(e=>!(e.die&&e.die>.6));
  // 실타래
  for(const th of T.thr){th.t+=dt;if(th.col){th.ct+=dt;if(th.ct>.5)th.dead=1;continue}
    if(th.f>0)th.f=Math.max(0,th.f-dt/4.2);if(th.pop>0)th.pop=Math.max(0,th.pop-dt);
    if(th.f<=0&&th.pop<=0){th.life-=dt;if(th.life<=0)th.dead=1}
    if(T.headless&&T.auto&&th.f<=.6&&th.t>T.auto)collect(th)}
  T.thr=T.thr.filter(t=>!t.dead);
  // 이펙트
  for(const f of T.fx)f.t+=dt;T.fx=T.fx.filter(f=>f.t<f.life);
  if(T.say){T.say.t+=dt;if(T.say.t>T.say.dur)T.say=null}
  if(T.banner){T.banner.t+=dt;if(T.banner.t>3)T.banner=null}
  // 튜토리얼 손짓
  if(t0<3&&T.t>=3&&!T.units.length)say('n','먼저 쥬은 언니를 심어요. 실타래를 피워 주거든요.',4.5);
  // 승리
  if(T.wi>=T.wv.length&&!T.ens.some(e=>!e.die)&&T.st==='play')win()}

/* ---------- 그리기 ---------- */
function rr(x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
function cover(im,a){if(!ok(im))return;const k=Math.max(W/im.naturalWidth,H/im.naturalHeight);const w=im.naturalWidth*k,h=im.naturalHeight*k;g.globalAlpha=a;g.drawImage(im,(W-w)/2,vert?0:(H-h)/2,w,h);g.globalAlpha=1}
function frame(im,fi,x,feet,D,a,fl){if(!ok(im))return;const fw=im.naturalHeight,n=Math.max(1,Math.round(im.naturalWidth/fw));fi=((fi%n)+n)%n;
  g.save();g.globalAlpha=a==null?1:a;g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(im,fi*fw,0,fw,fw,x-D/2,feet-D*.98,D,D);
  if(fl>0){const w=white(im);if(w){g.globalAlpha=Math.min(1,fl*8)*.55;g.drawImage(w,fi*fw,0,fw,fw,x-D/2,feet-D*.98,D,D)}}g.restore()}
function heart(x,y,s,col){g.save();g.translate(x,y);g.scale(s,s);g.beginPath();g.moveTo(0,.35);g.bezierCurveTo(-1,-.25,-.45,-.95,0,-.45);g.bezierCurveTo(.45,-.95,1,-.25,0,.35);g.fillStyle=col;g.fill();g.restore()}
function yarn(x,y,r,a,t){g.save();g.globalAlpha=a;const gl=g.createRadialGradient(x,y,r*.2,x,y,r*1.9);gl.addColorStop(0,'rgba(160,236,255,.55)');gl.addColorStop(1,'rgba(160,236,255,0)');g.fillStyle=gl;g.beginPath();g.arc(x,y,r*1.9*(1+.06*Math.sin(t*5)),0,6.29);g.fill();
  const b=g.createRadialGradient(x-r*.35,y-r*.35,r*.1,x,y,r);b.addColorStop(0,'#ffffff');b.addColorStop(.45,'#b9f0ff');b.addColorStop(1,'#4fb6e6');g.fillStyle=b;g.beginPath();g.arc(x,y,r,0,6.29);g.fill();
  g.strokeStyle='rgba(255,255,255,.75)';g.lineWidth=Math.max(1,r*.09);for(let i=0;i<4;i++){g.beginPath();g.ellipse(x,y,r*.92,r*(.25+i*.2),.6+i*.35,0,Math.PI);g.stroke()}
  g.strokeStyle='#bff3ff';g.lineWidth=Math.max(1,r*.1);g.beginPath();g.moveTo(x+r*.7,y+r*.6);g.quadraticCurveTo(x+r*1.4,y+r*1.1+Math.sin(t*3)*r*.2,x+r*1.9,y+r*.7);g.stroke();g.restore()}
function draw(){const t=T.t;g.setTransform(DPR,0,0,DPR,0,0);g.fillStyle='#120a1e';g.fillRect(0,0,W,H);
  cover(img(STAGE.bg),.55);
  // 판
  const sh=T.shake>0?(Math.random()-.5)*T.shake:0;g.save();g.translate(sh,0);
  for(let l=0;l<5;l++)for(let c=0;c<9;c++){const[x,y]=S(l,c+.5);const dark=(l+c)%2;g.fillStyle=dark?'rgba(46,92,60,.62)':'rgba(64,118,74,.62)';g.fillRect(x-cs/2,y-cs/2,cs+.5,cs+.5)}
  // 꽃 점
  for(let l=0;l<5;l++)for(let c=0;c<9;c++){const h=((l*31+c*17)%7);if(h>2)continue;const[x,y]=S(l,c+.5);g.fillStyle=['#ffd1e8','#fff3a8','#c9b8ff'][h];g.beginPath();g.arc(x+(h-1)*cs*.3,y+cs*.3,cs*.035,0,6.29);g.fill()}
  // 마음의 선
  const[ax,ay]=S(0,0),[bx2,by2]=S(4,0);const ext=cs*.5;g.strokeStyle='rgba(150,230,255,.85)';g.lineWidth=3;g.shadowColor='#8fe6ff';g.shadowBlur=12;g.beginPath();
  if(vert){g.moveTo(ax-ext,ay);g.lineTo(bx2+ext,by2)}else{g.moveTo(ax,ay-ext);g.lineTo(bx2,by2+ext)}g.stroke();g.shadowBlur=0;
  // 칸 강조(선택)
  if(T.hover&&(T.sel||T.shovel)){const[x,y]=S(T.hover.l,T.hover.c+.5);g.fillStyle=T.shovel?'rgba(255,120,120,.25)':'rgba(255,255,255,.18)';g.fillRect(x-cs/2,y-cs/2,cs,cs)}
  // 실패(실타래 감개)
  for(let l=0;l<5;l++){const ln=T.lanes[l];if(ln.spool){const[x,y]=S(l,-.33);yarn(x,y,cs*.17,.95,t+l)}
    if(ln.sw){const[x0,y0]=S(l,-.4),[x1,y1]=S(l,ln.sw.p);g.save();g.strokeStyle='#bff6ff';g.lineWidth=cs*.06;g.shadowColor='#7fe0ff';g.shadowBlur=18;g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.stroke();g.restore();yarn(x1,y1,cs*.24,1,t*3)}}
  // 그릴 것 모아 정렬
  const L=[];
  for(const u of T.units){const[x,y]=S(u.l,u.c+.5);L.push({y:y+cs*.4,k:0,o:u,x})}
  for(const e of T.ens){if(e.p>10.2)continue;const[x,y]=S(e.l,e.p);L.push({y:y+cs*.3,k:1,o:e,x})}
  if(T.hover&&T.sel&&!T.units.some(u=>u.l===T.hover.l&&u.c===T.hover.c)){const[x,y]=S(T.hover.l,T.hover.c+.5);L.push({y:y+cs*.4,k:2,x,o:T.sel})}
  L.sort((a,b)=>a.y-b.y);
  for(const it of L){if(it.k===0){const u=it.o,d=U[u.k],im=img(d.img);const fi=u.at>0?2+((u.at*8)|0)%2:((t*2.4+u.l+u.c)|0)%2;const D=cs*(vert?1.42:1.2)*(1+u.pop*.8);
      // 그림자
      g.fillStyle='rgba(0,0,0,.28)';g.beginPath();g.ellipse(it.x,it.y-cs*.02,cs*.3,cs*.09,0,0,6.29);g.fill();
      if(u.k==='shield'){const r=u.hp/u.max;g.save();g.globalAlpha=.35+.25*Math.sin(t*2);g.strokeStyle=r>.66?'#bfe9ff':r>.33?'#ffe39a':'#ff9a9a';g.lineWidth=cs*.05;g.beginPath();g.arc(it.x,it.y-cs*.45,cs*.48,Math.PI*1.1,Math.PI*1.9);g.stroke();g.restore()}
      frame(im,fi,it.x,it.y,D,1,u.fl);
      if(u.hp<u.max){const w=cs*.6,r=Math.max(0,u.hp/u.max);g.fillStyle='rgba(0,0,0,.5)';g.fillRect(it.x-w/2,it.y+cs*.04,w,4);g.fillStyle=r>.5?'#7dff9a':r>.25?'#ffd36b':'#ff6b6b';g.fillRect(it.x-w/2,it.y+cs*.04,w*r,4)}}
    else if(it.k===1){const e=it.o,d=E[e.k],im=img(d.img);if(!ok(im))continue;const a=e.die?Math.max(0,1-e.die/.6):1;const w=cs*d.sz,h=w*im.naturalHeight/im.naturalWidth;const by3=it.y-Math.abs(Math.sin(e.bob))*cs*(e.eat?.03:.06);
      g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(it.x,it.y,w*.36,cs*.08,0,0,6.29);g.fill();
      g.save();g.globalAlpha=a;const sq=e.eat?1+.06*Math.sin(e.bob*1.3):1;g.translate(it.x,by3);g.scale(1/sq,sq);g.drawImage(im,-w/2,-h,w,h);if(e.fl>0){const wi=white(im);if(wi){g.globalAlpha=a*.6;g.drawImage(wi,-w/2,-h,w,h)}}g.restore();
      if(e.hp<e.max&&!e.die){const bw=cs*.5,r=Math.max(0,e.hp/e.max);g.fillStyle='rgba(0,0,0,.5)';g.fillRect(it.x-bw/2,it.y-h-6,bw,3);g.fillStyle='#ff8ab8';g.fillRect(it.x-bw/2,it.y-h-6,bw*r,3)}}
    else{frame(img(U[it.o].img),0,it.x,it.y,cs*(vert?1.42:1.2),.45,0)}}
  // 하트
  for(const pr of T.pr){const[x,y]=S(pr.l,pr.p);const yy=y-(vert?0:cs*.32);const xx=x-(vert?0:0);g.save();g.shadowColor='#ff5fa8';g.shadowBlur=10;heart(xx,yy-(vert?cs*.3:0),cs*.17*(1+.12*Math.sin(pr.a*20)),'#ff6fb1');g.restore()}
  // 이펙트
  for(const f of T.fx){const k=f.t/f.life;const[x,y]=S(f.l,f.p);g.globalAlpha=1-k;g.fillStyle=f.col;g.beginPath();g.arc(x+f.dx*cs*.6*k,y-cs*.35+f.dy*cs*.6*k,cs*f.r*(1-k*.5),0,6.29);g.fill()}g.globalAlpha=1;
  // 실타래
  for(const th of T.thr){let[x,y]=S(th.lf,th.p);if(th.f>0)y-=th.f*cs*3.2;if(th.pop>0)y-=Math.sin((1-th.pop/.5)*Math.PI)*cs*.6;
    let a=1;if(!th.col&&th.f<=0&&th.life<2)a=.4+.6*Math.abs(Math.sin(th.t*6));
    if(th.col){const k=Math.min(1,th.ct/.45);const[tx,ty]=thPos();x+=(tx-x)*k;y+=(ty-y)*k;a=1-k*.3}
    th.sx=x;th.sy=y;yarn(x,y,cs*.21,a,th.t)}
  g.restore();
  hud();
  // 큰 글씨
  if(T.banner){const k=T.banner.t;const a=k<.3?k/.3:k>2.5?Math.max(0,(3-k)/.5):1;g.save();g.globalAlpha=a;g.fillStyle='rgba(30,0,30,.55)';g.fillRect(0,H*.42,W,H*.1);g.font=`900 ${Math.min(30,W*.065)}px 'Noto Sans KR',sans-serif`;g.textAlign='center';g.textBaseline='middle';g.lineWidth=5;g.strokeStyle='#5a0030';g.strokeText(T.banner.tx,W/2,H*.47);g.fillStyle='#ffd1ea';g.fillText(T.banner.tx,W/2,H*.47);g.restore()}
  ariBox();
  if(T.st==='intro')intro();if(T.st==='win'||T.st==='lose')endBox();if(T.st==='pause')pauseBox()}
function thPos(){return vert?[34,32]:[34,30]}
function btn(id,x,y,w,h,fn){UI.push({id,x,y,w,h,fn})}
function hud(){UI=[];g.textBaseline='middle';
  // 실타래 카운터
  const[tx,ty]=thPos();g.fillStyle='rgba(20,10,40,.78)';rr(tx-24,ty-19,vert?92:96,38,19);g.fill();g.strokeStyle='rgba(160,236,255,.6)';g.lineWidth=1.5;g.stroke();yarn(tx-4,ty,11,1,T.t);g.fillStyle='#fff';g.font="800 18px 'Noto Sans KR',sans-serif";g.textAlign='left';g.fillText(T.th,tx+14,ty+1);
  // 진행 막대
  const pw=vert?Math.min(150,W*.36):Math.min(220,W*.22),px=vert?W/2-pw/2+10:W-pw-112,py=vert?24:22;const k=Math.min(1,T.t/LAST_T);
  g.fillStyle='rgba(0,0,0,.5)';rr(px,py,pw,10,5);g.fill();g.fillStyle='#ff9fd0';rr(px,py,Math.max(10,pw*k),10,5);g.fill();
  for(const w of T.wv)if(w.flag){const fx=px+pw*Math.min(1,w.t/LAST_T);g.font='13px sans-serif';g.textAlign='center';g.fillText('🚩',fx,py-3)}
  g.font="700 11px 'Noto Sans KR',sans-serif";g.fillStyle='#ffe6f4';g.textAlign='center';g.fillText(`${STAGE.id} ${STAGE.name}`,px+pw/2,py+22);
  // 버튼
  const bs=36,rx=W-10-bs;const bb=(id,x,lab,fn,on)=>{g.fillStyle=on?'rgba(255,140,200,.9)':'rgba(20,10,40,.78)';rr(x,12,bs,bs,10);g.fill();g.strokeStyle='rgba(255,214,234,.6)';g.lineWidth=1.5;g.stroke();g.fillStyle='#fff';g.font=`800 ${lab.length>2?12:16}px 'Noto Sans KR',sans-serif`;g.textAlign='center';g.fillText(lab,x+bs/2,12+bs/2+1);btn(id,x,12,bs,bs,fn)};
  bb('pause',rx,'⏸',()=>{if(T.st==='play'){T.st='pause';snd('sel')}});bb('spd',rx-bs-6,'×2',()=>{T.speed=T.speed===1?2:1;snd('sel')},T.speed===2);
  // 카드
  const n=DECK.length+1;let cw,ch,cx,cy,gap=6;
  if(vert){ch=Math.min(104,Math.max(84,H*.12));cw=Math.min(78,(W-20-gap*(n-1))/n);cx=(W-(cw*n+gap*(n-1)))/2;cy=H-ch-8}
  else{ch=Math.min(88,Math.max(68,H*.14));cw=ch*.76;cx=140;cy=8}
  T.cards.forEach((c,i)=>{const d=U[c.k],x=cx+i*(cw+gap),y=cy,can=T.th>=d.cost&&c.cd<=0,sel=T.sel===c.k;
    g.save();g.fillStyle=sel?'#ffe1f1':'#2a1838';rr(x,y,cw,ch,10);g.fill();g.lineWidth=sel?3:1.5;g.strokeStyle=sel?'#ff6fb1':'rgba(255,214,234,.55)';g.stroke();
    g.save();rr(x+3,y+3,cw-6,ch-24,8);g.clip();g.fillStyle=sel?'#ffd0ea':'#3f2a55';g.fillRect(x,y,cw,ch);const im=img(d.img);if(ok(im)){const fw=im.naturalHeight;g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';const s=Math.max(cw-6,ch-24)*1.25;g.drawImage(im,fw*.12,0,fw*.76,fw*.76,x+cw/2-s/2,y+2,s,s)}g.restore();
    g.fillStyle=sel?'#5a1a40':'#fff';g.font="800 13px 'Noto Sans KR',sans-serif";g.textAlign='center';g.fillText('🧵'+d.cost,x+cw/2,y+ch-11);
    if(!can){g.fillStyle='rgba(10,0,20,.55)';rr(x,y,cw,ch,10);g.fill()}
    if(c.cd>0){const r=c.cd/d.cd;g.fillStyle='rgba(0,0,0,.45)';g.fillRect(x,y,cw,ch*r);g.fillStyle='#fff';g.font="700 12px sans-serif";g.fillText(Math.ceil(c.cd)+'s',x+cw/2,y+ch/2)}
    g.restore();btn('card'+i,x,y,cw,ch,()=>{if(T.st!=='play')return;if(!can){snd('no');return}T.shovel=false;T.sel=sel?null:c.k;snd('sel')})});
  // 삽
  const x=cx+DECK.length*(cw+gap),y=cy;g.fillStyle=T.shovel?'#ffe1f1':'#2a1838';rr(x,y,cw,ch,10);g.fill();g.strokeStyle=T.shovel?'#ff6fb1':'rgba(255,214,234,.55)';g.lineWidth=T.shovel?3:1.5;g.stroke();g.font=`${Math.min(30,cw*.4)}px sans-serif`;g.textAlign='center';g.fillText('✂️',x+cw/2,y+ch*.42);g.fillStyle=T.shovel?'#5a1a40':'#ffe6f4';g.font="700 11px 'Noto Sans KR',sans-serif";g.fillText('빼기',x+cw/2,y+ch-12);
  btn('shovel',x,y,cw,ch,()=>{if(T.st!=='play')return;T.sel=null;T.shovel=!T.shovel;snd('sel')})}
function wrap(tx,maxW){const out=[];let line='';for(const ch of tx){if(g.measureText(line+ch).width>maxW&&line){out.push(line);line=ch.trim()?ch:''}else line+=ch}if(line)out.push(line);return out}
function ariBox(){const s=T.say;if(!s||T.st==='intro')return;const a=Math.min(1,s.t/.25)*(s.dur<50?Math.min(1,(s.dur-s.t)/.4):1);if(a<=0)return;
  const w=Math.min(W-20,460),x=(W-w)/2,y=vert?62:(H-96);g.save();g.globalAlpha=a;g.font="600 13.5px 'Noto Sans KR',sans-serif";const lines=wrap(s.tx,w-86);const h=Math.max(66,lines.length*19+30);
  g.fillStyle='rgba(28,14,48,.9)';rr(x,y,w,h,14);g.fill();g.strokeStyle='rgba(160,236,255,.7)';g.lineWidth=1.5;g.stroke();
  const im=img(FACE[s.f]||FACE.n);if(ok(im)){g.save();rr(x+8,y+8,56,56,10);g.clip();g.drawImage(im,x+8,y+8,56,56);g.restore()}
  g.fillStyle='#9fe8ff';g.font="800 11px 'Noto Sans KR',sans-serif";g.textAlign='left';g.textBaseline='top';g.fillText('아리아드네',x+74,y+9);
  g.fillStyle='#fff';g.font="600 13.5px 'Noto Sans KR',sans-serif";lines.forEach((ln,i)=>g.fillText(ln,x+74,y+27+i*19));g.restore();g.textBaseline='middle'}
function panel(w,h){const x=(W-w)/2,y=(H-h)/2;g.fillStyle='rgba(8,0,16,.6)';g.fillRect(0,0,W,H);g.fillStyle='rgba(30,14,52,.96)';rr(x,y,w,h,18);g.fill();g.strokeStyle='rgba(255,190,230,.75)';g.lineWidth=2;g.stroke();return[x,y]}
function pbtn(id,x,y,w,h,lab,main,fn){g.fillStyle=main?'#ff6fb1':'rgba(255,255,255,.12)';rr(x,y,w,h,12);g.fill();g.fillStyle='#fff';g.font="800 15px 'Noto Sans KR',sans-serif";g.textAlign='center';g.textBaseline='middle';g.fillText(lab,x+w/2,y+h/2+1);UI.push({id,x,y,w,h,fn,top:1})}
function intro(){UI=UI.filter(b=>0);const w=Math.min(W-24,440),rowH=74,h=150+DECK.length*rowH+64;const[x,y]=panel(w,Math.min(h,H-20));
  g.textBaseline='middle';g.textAlign='center';g.fillStyle='#ffd1ea';g.font="900 20px 'Noto Sans KR',sans-serif";g.fillText('🌷 마음의 정원',x+w/2,y+28);
  g.fillStyle='#cfe8ff';g.font="600 12.5px 'Noto Sans KR',sans-serif";g.fillText(`${STAGE.id} ${STAGE.name}`,x+w/2,y+52);
  g.textAlign='left';g.fillStyle='#fff';g.font="600 12.5px 'Noto Sans KR',sans-serif";
  const rule=['무수리가 '+(vert?'위에서':'오른쪽에서')+' 걸어와요. '+(vert?'아래':'왼쪽')+' 끝 「마음의 선」을 넘기면 안 돼요.','실타래 🧵를 눌러 모으고, 카드를 고른 뒤 칸을 눌러 대원을 심어요.'];
  rule.forEach((r,i)=>wrap(r,w-36).forEach((ln,j)=>g.fillText(ln,x+18,y+76+i*30+j*15)));
  DECK.forEach((k,i)=>{const d=U[k],ry=y+140+i*rowH;g.fillStyle='rgba(255,255,255,.07)';rr(x+12,ry,w-24,rowH-8,12);g.fill();const im=img(d.img);
    if(ok(im)){const fw=im.naturalHeight;g.save();g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(im,0,0,fw,fw,x+14,ry-6,rowH,rowH);g.restore()}
    g.textBaseline='top';g.fillStyle='#ffd1ea';g.font="800 14px 'Noto Sans KR',sans-serif";g.fillText(`${d.n} · ${d.sk}`,x+18+rowH,ry+8);
    g.fillStyle='#9fe8ff';g.font="700 12px 'Noto Sans KR',sans-serif";g.fillText(`${d.role}   🧵${d.cost}`,x+18+rowH,ry+28);
    g.fillStyle='#ddd';g.font="500 11.5px 'Noto Sans KR',sans-serif";g.fillText(d.desc,x+18+rowH,ry+46);g.textBaseline='middle'});
  pbtn('go',x+w/2-80,y+Math.min(h,H-20)-56,160,42,'시작',true,()=>{T.st='play';snd('sel');say('w','어머, 언니. 무수리들이 정원으로 오고 있어요. 실타래를 모아서 대원들을 심어 주세요. ✨',4.5)})}
function endBox(){const w=Math.min(W-24,360),h=200;const[x,y]=panel(w,h);const win=T.st==='win';g.textAlign='center';g.textBaseline='middle';
  g.fillStyle=win?'#ffd1ea':'#ffb3b3';g.font="900 22px 'Noto Sans KR',sans-serif";g.fillText(win?'🌷 정원을 지켰어요!':'💔 마음의 선이 뚫렸어요',x+w/2,y+38);
  g.fillStyle='#ddd';g.font="600 13px 'Noto Sans KR',sans-serif";g.fillText(`버틴 시간 ${Math.floor(T.t/60)}:${String(Math.floor(T.t%60)).padStart(2,'0')} · 무수리 ${T.kills}마리`,x+w/2,y+76);
  pbtn('again',x+20,y+h-64,(w-50)/2,44,'다시 하기',true,()=>{newGame((Date.now()%997)+1);T.st='play'});pbtn('out',x+30+(w-50)/2,y+h-64,(w-50)/2,44,'나가기',false,()=>GD.close())}
function pauseBox(){const w=Math.min(W-24,300),h=220;const[x,y]=panel(w,h);g.textAlign='center';g.fillStyle='#fff';g.font="900 20px 'Noto Sans KR',sans-serif";g.fillText('일시정지',x+w/2,y+34);
  pbtn('resume',x+30,y+64,w-60,40,'계속하기',true,()=>{T.st='play'});pbtn('retry',x+30,y+112,w-60,40,'처음부터',false,()=>{newGame();T.st='play'});pbtn('quit',x+30,y+160,w-60,40,'나가기',false,()=>GD.close())}

/* ---------- 입력 ---------- */
function pt(e){const r=cv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]}
function down(e){e.preventDefault();const[x,y]=pt(e);
  const top=UI.filter(b=>b.top);const list=top.length?top:UI;
  for(const b of list)if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h){b.fn();return}
  if(T.st!=='play')return;
  // 실타래 먼저
  let best=null,bd=cs*.62;for(const th of T.thr){if(th.col||th.sx==null)continue;const d=Math.hypot(th.sx-x,th.sy-y);if(d<bd){bd=d;best=th}}
  if(best){collect(best);return}
  const c=cellAt(x,y);if(!c)return;
  if(T.shovel){const u=T.units.find(u=>u.l===c.l&&u.c===c.c);if(u){u.dead=1;T.units=T.units.filter(v=>v!==u);T.th+=Math.floor(U[u.k].cost/2);burst(u.l,u.c+.5,'#ffffff',8);snd('sel')}T.shovel=false;return}
  if(T.sel){if(plant(T.sel,c.l,c.c)){T.sel=null}else snd('no')}}
function move(e){const[x,y]=pt(e);T.hover=cellAt(x,y)}

/* ---------- 루프 ---------- */
let last=0;function loop(ts){raf=requestAnimationFrame(loop);const dt=Math.min(.05,last?(ts-last)/1000:0);last=ts;
  if(T.st==='play'){let left=dt*T.speed;while(left>0){const s=Math.min(1/60,left);step(s);left-=s}}
  else if(T.say)T.say.t+=0;
  if(T.shake>0)T.shake=Math.max(0,T.shake-dt*20);
  draw()}
GD.open=function(o){o=o||{};onClose=o.onClose||null;if(ov)GD.close(true);
  ov=document.createElement('div');ov.id='gdOv';ov.style.cssText='position:fixed;inset:0;z-index:99999;background:#120a1e;touch-action:none;user-select:none;-webkit-user-select:none';
  cv=document.createElement('canvas');cv.style.cssText='display:block;touch-action:none';ov.appendChild(cv);document.body.appendChild(ov);g=cv.getContext('2d');
  layout();newGame(o.seed);[STAGE.bg,...DECK.map(k=>U[k].img),...Object.values(E).map(e=>e.img),...Object.values(FACE)].forEach(img);
  cv.addEventListener('pointerdown',down);cv.addEventListener('pointermove',move);window.addEventListener('resize',layout);last=0;raf=requestAnimationFrame(loop)};
GD.close=function(quiet){cancelAnimationFrame(raf);raf=0;window.removeEventListener('resize',layout);if(ov)ov.remove();ov=null;cv=null;const f=onClose;onClose=null;if(!quiet&&f)try{f()}catch(e){}};

/* ---------- 테스트: 봇 시뮬레이션 ----------
   전략: 'pro' 정석 / 'newbie' 느리고 대충(방패 안 씀) / 'random' 완전 무작위 / 'spam' 사격수만 */
GD.sim=function(sec,strat,seed){const saveT=T;newGame(seed||7);T.st='play';T.headless=1;T.auto=strat==='newbie'?2.5:strat==='random'?3.5:.8;let think=0;const r=rng((seed||7)*13);
  const tryP=(k,l,c)=>plant(k,l,c);const free=(l,c)=>!T.units.some(u=>u.l===l&&u.c===c);
  const dt=1/30;for(let i=0;i<sec/dt&&T.st==='play';i++){step(dt);think-=dt;if(think>0)continue;think=strat==='newbie'?2:strat==='random'?2.5:.5;
    if(strat==='pro'){const cnt=k=>T.units.filter(u=>u.k===k).length;const thr=l=>T.ens.filter(e=>!e.die&&e.l===l).length;const ys=l=>T.units.filter(u=>u.k==='yenis'&&u.l===l).length;
      const lanes=[0,1,2,3,4].sort((a,b)=>(thr(b)-ys(b))-(thr(a)-ys(a)));
      // 1) 무수리 있는데 사격수가 모자란 줄
      let need=lanes.find(l=>thr(l)>0&&ys(l)<Math.min(3,1+Math.floor(thr(l)/2)));
      if(need!=null){for(const c of [1,2,3])if(free(need,c)){tryP('yenis',need,c);break}}
      // 2) 쥬은: 처음 2, 사격수 늘면 최대 5
      else if(cnt('wood')<Math.min(5,2+Math.floor(cnt('yenis')/2))){for(const l of [2,1,3,0,4])if(free(l,0)&&tryP('wood',l,0))break}
      // 3) 남는 실로 빈 줄에 사격수
      else{const l=[2,1,3,0,4].find(l=>ys(l)<2);if(l!=null)for(const c of [1,2,3])if(free(l,c)){tryP('yenis',l,c);break}}
      for(const l of lanes){if(T.ens.some(e=>!e.die&&e.l===l&&(e.k==='tank'||thr(l)>=2)&&e.p<8)&&free(l,5))tryP('shield',l,5)}}
    else if(strat==='newbie'){/* 느리고 대충: 무수리 보이는 줄에 아무 칸 사격수, 쥬은은 생각날 때, 방패 안 씀 */const thr=l=>T.ens.some(e=>!e.die&&e.l===l);const ys=l=>T.units.some(u=>u.k==='yenis'&&u.l===l);
      const l=[0,1,2,3,4].find(l=>thr(l)&&!ys(l));if(l!=null)tryP('yenis',l,Math.floor(r()*5));else if(r()<.5)tryP('wood',Math.floor(r()*5),Math.floor(r()*3));else tryP('yenis',Math.floor(r()*5),Math.floor(r()*6))}
    else if(strat==='random'){const k=DECK[Math.floor(r()*3)];tryP(k,Math.floor(r()*5),Math.floor(r()*9))}
    else if(strat==='spam'){for(let l=0;l<5;l++)for(let c=0;c<9;c++)if(free(l,c)&&tryP('yenis',l,c))break}}
  const res={st:T.st,t:+T.t.toFixed(1),kills:T.kills,planted:T.planted,spools:T.lanes.filter(l=>!l.spool).length,th:T.th,
    board:[0,1,2,3,4].map(l=>T.units.filter(u=>u.l===l).sort((a,b)=>a.c-b.c).map(u=>u.k[0]+u.c).join(' ')+' | '+T.ens.filter(e=>e.l===l&&!e.die).map(e=>e.k[0]+e.p.toFixed(1)).join(' '))};T=saveT;return res};
GD._T=()=>T;GD._dbg={plant,step,spawn,dropThread};
})();
