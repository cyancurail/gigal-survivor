/* ===== 🌷 마음의 정원 — 기갈 서바이버즈 로비 미니게임 (2026-11-10~) =====
   줄 방어(좀비플랜트풍). 5줄 × 9칸, 끝은 「마음의 선」. 원작 식물의 동작 + 우리 대원 스킨.
   세로 화면: 무수리가 위에서 아래로 / 가로 화면: 오른쪽에서 왼쪽으로.
   좌표는 전부 줄(l 0~4) · 위치(p 0~9, 0 = 마음의 선) 기준이고, 그릴 때만 화면으로 바꾼다.
   사용: GD.open({onClose}) / GD.close() / 테스트: GD.sim(스테이지, 초, 전략, 시드)
   본편 연결: window.GD_HOST = {load()→저장 객체|null, save(o), gold(n), lobby(키), bgm(모드), vol()→0~1}
     bgm 모드: 'lobby'(지도·덱·장면) · 'none'(영상) · 'field'/'hell'(1장) · 'sbField'/'sbHell'(2장) · 'jangsu'/'jangsu_hell'(3장) */
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
  chomp:{n:'K1',sk:'허그카드',img:'garden/sk/k1_hug.png',cost:150,cd:7.5,hp:300,role:'🧸 꼬옥 껴안기',desc:'바로 앞 무수리를 꼭 껴안아 데려가고, 한참 토닥여요. (거대 수박은 너무 커서 못 안아요)',chomp:{range:1.4,chew:42}},
  rep:{n:'태태영',sk:'체리건2',img:'garden/sk/tt_cherrygun2.png',cost:200,cd:7.5,hp:300,role:'💗💗 두 발 사격',desc:'하트를 두 발씩 쏴요.',shoot:{every:1.4,dmg:20,n:2,k:'heart'}},
  puff:{n:'K1',sk:'쏭카드',img:'msk2/cd12.png',cost:0,cd:7.5,hp:300,life:30,max:4,role:'🎵 공짜 노래',desc:'공짜! 3칸 앞까지만 닿고, 노래는 30초면 끝나요. 한 번에 4명까지.',shoot:{every:1.4,dmg:20,n:1,k:'note',range:3}},
  sshroom:{n:'맘터',sk:'스타카드',img:'garden/sk/mt_star.png',cost:25,cd:7.5,hp:300,role:'⭐ 별가루 실타래',desc:'싸요. 처음엔 조금, 1분 뒤 별이 자라면 맘터 코지보다 많이(30) 짜요.',prod:{first:5,every:20,amt:15,grow:60,amt2:30}},
  squash:{n:'람쥐',sk:'점프카드',img:'garden/sk/rj_jump.png',cost:50,cd:30,cd0:20,hp:300,role:'💥 점프 착지',desc:'가까이 온 무수리에게 뛰어올라 짓눌러요. (1회용)',squash:{range:1.15,dmg:1800}},
  /* --- 2장 상봉 --- */
  fume:{n:'쁘니',sk:'네온카드',img:'garden/sk/pn_neon.png',cost:75,cd:7.5,hp:300,role:'💗 네온 찌르기',desc:'앞 4칸을 꿰뚫어요. 방충망도 그냥 통과해요.',fume:{every:1.4,dmg:20,range:4}},
  three:{n:'힐블',sk:'리턴카드',img:'msk2/cd08.png',cost:325,cd:7.5,hp:300,role:'🔮 세 줄 사격',desc:'자기 줄과 위아래 줄, 세 줄에 동시에 쏴요.',shoot:{every:1.4,dmg:20,n:1,k:'orb',lanes:1}},
  jala:{n:'마녀',sk:'파이어리 카드',img:'msk2/cc09.png',cost:125,cd:50,cd0:35,hp:300,role:'🔥 한 줄 불태우기',desc:'심으면 잠시 뒤 그 줄 전체를 태워요. (1회용)',jala:{t:1.1,dmg:1800}},
  spike:{n:'쥬은',sk:'우드카드',img:'msk2/cd07.png',cost:100,cd:7.5,hp:300,role:'🌿 바닥 가시',desc:'무수리가 못 먹어요. 밟고 지나가면 따끔해요.',spike:{dmg:20,every:1}},
  tall:{n:'무룩',sk:'가디언카드',img:'garden/sk/mr_guardian.png',cost:125,cd:30,cd0:20,hp:8000,role:'🛡️ 큰 방패',desc:'아주 단단하고, 장대 무수리도 못 넘어요.',wall:1,tall:1},
  cabb:{n:'잔느',sk:'로즈카드',img:'garden/sk/jn_rose.png',cost:100,cd:7.5,hp:300,role:'🌹 장미 던지기',desc:'포물선으로 던져서 방충망 뒤 무수리를 맞혀요.',lob:{every:2.8,dmg:40,k:'rose'}},
  cact:{n:'하도',sk:'드림카드',img:'msk2/cd15.png',cost:125,cd:7.5,hp:300,role:'✨ 꿈 가시',desc:'하늘을 나는 풍선 무수리도 맞혀요.',shoot:{every:1.4,dmg:20,n:1,k:'spike',air:1}},
  blover:{n:'짱재',sk:'스톰카드',img:'garden/sk/jj_storm.png',cost:100,cd:7.5,hp:300,role:'🌬️ 폭풍 날리기',desc:'날아다니는 무수리를 전부 날려 버려요. (1회용)',blow:{t:.5}},
  umb:{n:'잔느',sk:'클라우드카드',img:'garden/sk/jn_cloud.png',cost:100,cd:7.5,hp:300,role:'☂️ 양산 지붕',desc:'주변 3×3에 떨어지는 공을 막아 줘요.',umb:1},
  torch:{n:'영애',sk:'이그니션카드',img:'garden/sk/ya_ignition.png',cost:175,cd:7.5,hp:300,role:'🔥 불꽃 통과',desc:'지나가는 하트에 불을 붙여 두 배로 아프게 해요.',torch:1},
  /* --- 3장 장수 --- */
  gbust:{n:'K1',sk:'유령신부',img:'msk2/hx_soulwed.png',cost:75,cd:7.5,hp:300,role:'👻 덤불 치우기',desc:'토마토 덤불 위에만 심어요. 잠시 뒤 덤불을 치우고 같이 사라져요. (1회용)',gbust:{t:4.5}},
  split:{n:'영애',sk:'소드카드',img:'msk2/cd11.png',cost:125,cd:7.5,hp:300,role:'⚔️ 앞뒤 사격',desc:'앞으로 한 발, 뒤로 두 발 쏴요. 뒤에서 나타난 애벌레도 맞혀요.',split:{every:1.4,dmg:20}},
  corn:{n:'세나',sk:'포이즌카드',img:'garden/sk/sn_poison.png',cost:100,cd:7.5,hp:300,role:'💉 주사 던지기',desc:'포물선으로 던져요. 가끔 마비 주사가 맞으면 4초 동안 멈춰요.',lob:{every:3,dmg:20,k:'poison',stun:{p:.25,t:4,dmg:40}}},
  mag:{n:'밍키',sk:'메이즈카드',img:'msk2/cd05.png',cost:100,cd:7.5,hp:300,role:'🧲 쇠붙이 뺏기',desc:'근처 무수리의 양동이·투구·방충망·사다리·스프링·깜짝 상자를 빼앗아요. 15초마다.',mag:{every:15,rl:2,rp:3.5}},
  melon:{n:'하도',sk:'봄버카드',img:'garden/sk/hd_bomber.png',cost:300,cd:7.5,hp:300,role:'💣 폭탄 던지기',desc:'무거운 폭탄을 포물선으로 던져요. 주변 무수리도 같이 아파요.',lob:{every:3,dmg:80,k:'bomb',splash:26}},
  gat:{n:'영애',sk:'윈드카드',img:'garden/sk/ya_wind.png',cost:250,cd:50,cd0:35,hp:300,up:'rep',role:'🌀 네 발 사격',desc:'태태영 체리건2 위에 겹쳐 심어요. 하트를 네 발씩 쏴요.',shoot:{every:1.4,dmg:20,n:4,k:'heart'}},
  garl:{n:'람쥐',sk:'그래비티카드',img:'garden/sk/rj_gravity.png',cost:50,cd:7.5,hp:400,role:'🌀 줄 바꾸기',desc:'한 입 문 무수리를 옆 줄로 끌어당겨 보내요.',garl:1},
  ice:{n:'밍키',sk:'샷카드',img:'garden/sk/mk_shot.png',cost:75,cd:50,cd0:35,hp:300,role:'❄️ 전부 얼리기',desc:'심으면 잠시 뒤 화면의 무수리를 전부 4초 동안 얼리고, 그 뒤에도 느리게 해요. (1회용)',ice:{t:1,frz:4,slow:10,dmg:20}},
  rock:{n:'쥬은',sk:'스톤카드',img:'garden/sk/ju_stone.png',cost:125,cd:7.5,hp:300,up:'spike',role:'🪨 바위 가시',desc:'쥬은 우드카드 위에 겹쳐 심어요. 두 배로 아프고, 거대 수박에게 9번까지 버텨요.',spike:{dmg:40,every:1},lives:9},
  wmel:{n:'하도',sk:'레이저카드',img:'garden/sk/hd_laser.png',cost:200,cd:50,cd0:35,hp:300,up:'melon',role:'❄️ 얼음 폭탄',desc:'하도 봄버카드 위에 겹쳐 심어요. 폭탄에 맞은 무수리들이 느려져요.',lob:{every:3,dmg:80,k:'ice',splash:26,slow:10}}
};
/* ---------- 무수리 (원작 좀비 동작 · 아스가르드 귀여운 무수리 그림) ---------- */
const E={
  mu:{n:'무수리',img:'td/m2_01.png',hp:200,spd:.21,sz:.9,intro:''},
  flag:{n:'깃발 무수리',img:'td/m2_02.png',hp:200,spd:.27,sz:.95,intro:'깃발 무수리가 보이면 대규모 무리가 따라와요.'},
  cone:{n:'고깔 무수리',img:'td/m2_03.png',hp:560,spd:.21,sz:1,intro:'고깔 무수리예요. 고깔 덕분에 세 배쯤 단단해요.'},
  pole:{n:'장대 무수리',img:'td/m2_06.png',hp:340,spd:.42,spd2:.21,sz:.95,pole:1,intro:'장대 무수리예요! 처음 만나는 대원을 훌쩍 뛰어넘어요.'},
  bucket:{n:'양동이 무수리',img:'td/m2_04.png',hp:1300,metal:1100,spd:.21,sz:1,intro:'양동이 무수리… 언니, 이건 진짜 단단해요. 체리랑 허그를 아껴 둬요.'},
  paper:{n:'신문 무수리',img:'td/m2_07.png',hp:350,spd:.21,sz:.95,rage:{at:200,spd:.45,bite:2},intro:'신문 무수리예요. 신문이 찢어지면 화가 나서 막 달려와요.'},
  screen:{n:'방충망 무수리',img:'td/m2_10.png',hp:200,shield:1100,spd:.21,sz:.95,intro:'방충망 무수리예요. 앞에서 쏘는 건 다 막아요. 네온 찌르기나 포물선으로요.'},
  foot:{n:'미식축구 무수리',img:'td/m2_08.png',hp:1600,metal:1330,spd:.42,sz:1.05,intro:'미식축구 무수리! 빠르고 단단해요. 언니, 화장 고칠 시간 없어요.'},
  ball:{n:'풍선 무수리',img:'td/m2_09.png',hp:200,spd:.3,spd2:.21,sz:.95,fly:1,intro:'풍선 무수리가 날아와요! 꿈 가시나 바람으로만 떨어뜨릴 수 있어요.'},
  cata:{n:'투석 무수리',img:'td/m2_05.png',hp:850,spd:.25,sz:1.1,cata:{at:7.2,every:3,dmg:75,ammo:15},intro:'투석 무수리예요. 뒤에 있는 대원한테 공을 던져요. 양산으로 막아요.'},
  /* --- 3장 장수 (쁘니 토마토 농장 몹 그림) --- */
  tom:{n:'토마토 무수리',img:'farm/m_angry.png',hp:200,spd:.21,sz:.82,intro:'여긴 장수 토마토 밭이에요. 토마토들도 화가 났나 봐요.'},
  dig:{n:'땅굴 애벌레',img:'farm/m_caterpillar.png',hp:300,spd:.21,spd0:.62,sz:.95,flip:1,dig:1,metal:1,intro:'땅굴 애벌레예요! 땅속으로 기어서 맨 뒤에서 나타나요. 뒤를 쏘는 대원이 필요해요.'},
  pogo:{n:'통통 무당벌레',img:'farm/m_beetle_red.png',hp:500,spd:.24,sz:.85,pogo:1,metal:1,intro:'통통 무당벌레예요. 만나는 대원마다 계속 뛰어넘어요. 큰 방패나 자석으로요.'},
  jack:{n:'깜짝 가지',img:'farm/m_eggplant.png',hp:500,spd:.32,sz:.72,jack:{after:[3,10]},metal:1,intro:'깜짝 가지예요… 언제 터질지 몰라요. 터지면 주변 대원이 다 날아가요!'},
  ladder:{n:'사다리 개미',img:'farm/m_ant.png',hp:500,shield:400,spd:.27,spd2:.21,sz:.92,flip:1,ladder:1,metal:1,intro:'사다리 개미예요. 방패 대원에 사다리를 걸면 다른 무수리가 타고 넘어와요.'},
  beetle:{n:'쇠딱정벌레',img:'farm/m_beetle_black.png',hp:1300,spd:.21,sz:.98,metal:1100,intro:'쇠딱정벌레예요. 쇠 껍데기가 아주 단단해요. 밍키 자석으로 벗겨요.'},
  garg:{n:'거대 수박',img:'farm/m_melon.png',hp:3000,spd:.16,sz:1.35,garg:1,intro:'어머… 거대 수박이에요. 대원을 한 방에 짓눌러요. 반쯤 깎으면 새싹을 던져요!'},
  imp:{n:'새싹 꼬마',img:'farm/m_sprout.png',hp:200,spd:.42,sz:.62,intro:''}
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
const CH2={name:'2장 · 상봉 네온 정원',floorImg:'garden/bg/sb_floor.png',stages:[
  {name:'신문 배달',     pool:{mu:3,cone:2,paper:2},                 gift:'three'},
  {name:'세 줄의 빛',    pool:{mu:3,cone:2,paper:2,bucket:1},        gift:'fume'},
  {name:'방충망 골목',   pool:{mu:2,cone:2,paper:2,screen:2},        gift:'spike'},
  {name:'가시 보도',     pool:{mu:2,cone:2,screen:2,pole:1,bucket:1},gift:'tall'},
  {name:'터치다운',      pool:{mu:2,cone:2,paper:1,screen:1,foot:1}, gift:'cabb'},
  {name:'달콤한 포물선', pool:{mu:2,cone:2,screen:2,foot:1,pole:1},  gift:'cact'},
  {name:'풍선 축제',     pool:{mu:2,cone:2,paper:1,ball:2,bucket:1}, gift:'blover'},
  {name:'바람의 거리',   pool:{mu:2,cone:2,ball:2,screen:1,foot:1},  gift:'umb'},
  {name:'투석 소동',     pool:{mu:2,cone:2,cata:1,ball:1,screen:1,foot:1},gift:'torch'},
  {name:'네온의 끝',     pool:{mu:2,cone:3,paper:1,screen:1,foot:1,ball:1,cata:1},flags:3,gift:'jala'}
]};
CH2.stages.forEach((S,i)=>{S.n=11+Math.floor(i*.4);S.g0=20-i*.2;S.g1=14-i*.2;S.b0=1.1+.03*i;S.bg=.16+.01*i});
Object.assign(CH2.stages[9],{n:13,b0:1.15,bg:.2,g0:20,g1:13});
/* 11-12 맘터 피드백: 기본 빌드(맘터+태태영)만으로도 깨지던 것 → 무수리 예산 1장 1-3부터 ×1.15 · 2장 ×1.2 (3장은 아래), 각 장 끝 스테이지는 원래대로 */
[[1,1,1.15,1.15,1.15,1.15,1.15,1.15,1,1],[1.2,1.2,1.2,1.2,1.2,1.15,1.05,1,1.05,1],[1.45,1.25,1.4,1.35,1.3,1.1,1.15,1.1,1.05,1]].forEach((B,h)=>[CH1,CH2,null][h]&&[CH1,CH2][h].stages.forEach((S,i)=>S.bm=B[i]));
/* ---------- 3장 · 장수 토마토 밭 (흙 바닥 · 토마토 덤불 = 무덤) ---------- */
const CH3={name:'3장 · 장수 토마토 밭',floorImg:'farm/floor.jpg',tint:'rgba(0,0,0,.10)',line:'rgba(255,230,170,.10)',warm:1,stages:[
  {name:'토마토 덤불',   pool:{tom:3,cone:2},                     graves:3,gift:'gbust'},
  {name:'땅굴 애벌레',   pool:{tom:3,cone:2,dig:1},               graves:3,gift:'split'},
  {name:'뒤를 조심해',   pool:{tom:3,cone:2,dig:1,bucket:1},      graves:4,gift:'corn'},
  {name:'통통 무당벌레', pool:{tom:3,cone:2,pogo:2,dig:1},        graves:4,gift:'mag'},
  {name:'깜짝 가지',     pool:{tom:3,cone:2,jack:2,pogo:1},       graves:4,gift:'melon'},
  {name:'사다리 개미',   pool:{tom:2,cone:2,ladder:2,jack:1},     graves:5,gift:'gat'},
  {name:'쇠딱정벌레',    pool:{tom:2,cone:2,beetle:2,ladder:1,pogo:1},graves:5,gift:'garl'},
  {name:'밭고랑 소동',   pool:{tom:2,cone:2,beetle:1,dig:1,jack:1,pogo:1},graves:5,gift:'ice'},
  {name:'거대 수박',     pool:{tom:2,cone:2,beetle:1,ladder:1,garg:1},graves:5,gift:'rock'},
  {name:'장수의 끝',     pool:{tom:2,cone:2,beetle:1,pogo:1,jack:1,ladder:1,dig:1,garg:1},graves:6,flags:3,gift:'wmel'}
]};
CH3.stages.forEach((S,i)=>{S.bm=[1.45,1.25,1.4,1.35,1.3,1.1,1.15,1.1,1.05,1][i];S.n=11+Math.floor(i*.4);S.g0=20-i*.2;S.g1=14-i*.2;S.b0=1.15+.02*i;S.bg=.15+.006*i});
const CHS=[CH1,CH2,CH3],STG=CHS.reduce((a,c)=>a.concat(c.stages.map((st,i)=>Object.assign(st,{ch:c,ci:i}))),[]);
const sid=gi=>`${CHS.indexOf(STG[gi].ch)+1}-${STG[gi].ci+1}`;
const START=['sun','pea'];const deckMax=gi=>gi>=20?8:gi>=10?7:6;let DECK_MAX=6;
const WALK=3;
const ECOST={mu:1,flag:1,cone:2,pole:2,bucket:4,paper:2,screen:3,foot:4,ball:2,cata:4,tom:1,dig:3,pogo:3,jack:3,ladder:3,beetle:4,garg:8};
function rng(s){s=s%2147483647;if(s<=0)s+=2147483646;return()=>(s=(s*16807)%2147483647)/2147483647}
function hand1(seed){const r=rng(seed||7),W=[];let last=-1;
  const lane=()=>{let l;do{l=Math.floor(r()*5)}while(l===last&&r()<.7);last=l;return l};
  const add=(t,k,l)=>W.push({t,k,l:l==null?lane():l});
  add(20,'mu',2);add(38,'mu',1);add(52,'mu',3);add(62,'mu',2);[72,80,86].forEach(t=>add(t,'mu'));
  W.push({t:95,flag:1});add(95,'flag');[96,97,98.5].forEach(t=>add(t,'mu'));add(99.5,'mu');
  [112,120,126,133,139,146,152].forEach(t=>add(t,'mu'));add(126.8,'mu');add(146.8,'mu');
  W.push({t:168,flag:2,fin:1});add(168,'flag');for(let i=0;i<7;i++)add(168.8+i*.8,'mu');add(170,'mu');add(172.5,'mu');
  return W.sort((a,b)=>a.t-b.t)}
function genWaves(si,seed){const S=STG[si];if(S.hand)return hand1(seed);const r=rng((seed||7)*31+si*977),W=[];
  const keys=Object.keys(S.pool),tot=keys.reduce((a,k)=>a+S.pool[k],0);
  const pick=(bud)=>{for(let k=0;k<20;k++){let x=r()*tot;for(const kk of keys){x-=S.pool[kk];if(x<=0){if(ECOST[kk]<=bud+.01)return kk;break}}}return 'mu'};
  const nf=S.flags||2,flagAt=new Set();for(let i=1;i<=nf;i++)flagAt.add(Math.round(S.n*i/nf)-1);
  let t=20,last=-1;const lane=()=>{let l;do{l=Math.floor(r()*5)}while(l===last&&r()<.6);last=l;return l};
  for(let i=0;i<S.n;i++){const k=i/(S.n-1);let bud=(S.b0+S.bg*i)*(window.GD_BM?window.GD_BM(S):(S.bm||1));const fl=flagAt.has(i);
    if(fl){bud*=2.6;W.push({t,flag:1,fin:i===S.n-1?1:0});W.push({t,k:'flag',l:lane()})}
    let b=bud,dt=0;while(b>=.99){const e=pick(b);b-=ECOST[e];W.push({t:t+dt,k:e,l:lane()});dt+=fl?.55:(r()*.8)}
    t+=S.g0+(S.g1-S.g0)*k+(fl?6:0)}
  return W.sort((a,b)=>a.t-b.t)}

/* ---------- 진행 저장 (계정 저장은 3단계) ---------- */
const SKEY='gd_v1';let SV={cl:0,deck:null,seen:{},n:{}};
const HOST=()=>window.GD_HOST||null;
function load(){SV={cl:0,deck:null,seen:{},n:{}};let s=null;const h=HOST();
  try{if(h&&h.load)s=h.load()}catch(e){}
  if(!s)try{s=JSON.parse(localStorage.getItem(SKEY)||'null')}catch(e){}  /* 본편 저장이 없으면 이 기기 시안 기록을 이어받음 */
  if(s)SV=Object.assign(SV,JSON.parse(JSON.stringify(s)));SV.n=SV.n||{};SV.seen=SV.seen||{}}
function save(){const h=HOST();try{if(h&&h.save){const o=Object.assign({},SV);delete o.dev;h.save(o);return}}catch(e){}try{localStorage.setItem(SKEY,JSON.stringify(SV))}catch(e){}}
/* ---------- 🎁 보상 (사용자 11-12: 로비 꾸미기 5종 + 골드, 반복할수록 줄어듦) ---------- */
const LOB={wizard:'❄️ 마법사의 고향',adventure:'🌸 모험의 시작',carnival:'🎆 화려한 축제',cafe:'🌹 카페 드 점례',fairy:'🧚 요정의 고향'};
const LOBR={9:'wizard',14:'adventure',19:'carnival',24:'cafe',29:'fairy'};   /* 1-10 · 2-5 · 2-10 · 3-5 · 3-10 첫 클리어 */
const gBase=si=>(CHS.indexOf(STG[si].ch)+1)*100+STG[si].ci*10;             /* 1장 100~190 · 2장 200~290 · 3장 300~390 */
/* 첫 클리어 = 기본의 10배(1,000~3,900G, 로비 스테이지는 로비) · 2번째 = 기본 · 3번째 = 2/3 · 4번째부터 = 1/3 (최소 10G) */
function reward(si,nPrev){if(!nPrev)return LOBR[si]?{lb:LOBR[si]}:{g:gBase(si)*10};const b=gBase(si);return{g:Math.max(10,Math.round(nPrev===1?b:nPrev===2?b*2/3:b/3))}}
function bgm(m){const h=HOST();if(h&&h.bgm)try{h.bgm(m)}catch(e){}}
function stageBgm(si){const ch=CHS.indexOf(STG[si].ch),hell=STG[si].ci>=8;return[hell?'hell':'field',hell?'sbHell':'sbField',hell?'jangsu_hell':'jangsu'][ch]||'field'}
function owned(cl){const L=START.slice();for(let i=0;i<Math.min(cl,STG.length);i++){const g=STG[i].gift;if(g)L.push(g)}return L}

/* ---------- 상태 ---------- */
let T=null,cv=null,g=null,ov=null,raf=0,onClose=null,DPR=1,SCR='map',PICK=[],RES=null;
function newGame(si,deck,seed){const S=STG[si];T={si,t:0,th:150,units:[],ens:[],pr:[],thr:[],fx:[],
  sfx:[],lanes:[0,1,2,3,4].map(()=>({spool:1,sw:null})),wv:genWaves(si,seed),wi:0,sel:null,shovel:false,
  deck:deck.slice(),lob:[],balls:[],fire:[],wind:0,graves:graves(si,seed),r:rng((seed||7)*71+si*13),cards:deck.map(k=>({k,cd:U[k].cd0||0})),st:'play',speed:1,sky:6,say:null,said:{},banner:null,hover:null,shake:0,flash:0,kills:0,planted:0};
  T.lastT=T.wv.length?T.wv[T.wv.length-1].t:60;return T}

function graves(si,seed){const S=STG[si],gr=[];if(!S.graves)return gr;const r=rng((seed||7)*53+si*7);let n=0;
  while(gr.length<S.graves&&n++<300){const l=Math.floor(r()*5),c=4+Math.floor(r()*5);if(!gr.some(q=>q.l===l&&q.c===c)&&gr.filter(q=>q.l===l).length<2)gr.push({l,c})}return gr}
/* ---------- 레이아웃 ---------- */
let W=0,H=0,vert=true,cs=60,bx=0,by=0,UI=[];
/* 폰 세로로 들고 있어도 「가로로 보기」(SV.rot)면 캔버스를 90° 돌려 가로 화면으로 그린다 (화면 회전 잠금·카톡 브라우저용) */
let ROT=false;function layout(){const iw=window.innerWidth,ih=window.innerHeight;ROT=!!SV.rot&&ih>iw;W=ROT?ih:iw;H=ROT?iw:ih;vert=H>W*1.05;
  DPR=Math.min(2,window.devicePixelRatio||1,Math.max(.75,Math.sqrt(2.1e6/(W*H))));
  if(cv){cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);cv.style.width=W+'px';cv.style.height=H+'px';
    cv.style.position='absolute';cv.style.top='0';cv.style.left=ROT?iw+'px':'0';cv.style.transformOrigin='0 0';cv.style.transform=ROT?'rotate(90deg)':'none'}
  if(vert){const top=64,bar=Math.min(112,Math.max(88,H*.12));cs=Math.min((W-14)/5,(H-top-bar-16)/10.25);bx=(W-5*cs)/2;by=H-bar-12-.5*cs-9*cs}
  else{const top=Math.min(104,Math.max(78,H*.16));const av=H-top-8;cs=Math.min((W-8)/10.7,av/5.05);bx=.62*cs+4;by=top+(av-5*cs)/2}}
function S(l,p){return vert?[bx+(l+.5)*cs,by+(9-p)*cs]:[bx+p*cs,by+(l+.5)*cs]}
function cellAt(x,y){let l,p;if(vert){l=Math.floor((x-bx)/cs);p=9-(y-by)/cs}else{l=Math.floor((y-by)/cs);p=(x-bx)/cs}
  const c=Math.floor(p);return(l>=0&&l<5&&c>=0&&c<9)?{l,c}:null}

/* ---------- 소리 (아주 작게) ---------- */
let AC=null;function vol(){let v=1;try{const s=localStorage.getItem('gs_vol_s');if(s!=null)v=+s}catch(e){}return v}
function snd(k){if(T&&T.headless)return;try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();const v=vol()*.18;if(v<=0)return;const t=AC.currentTime,o=AC.createOscillator(),a=AC.createGain();o.connect(a);a.connect(AC.destination);
  const P={col:['sine',880,1320,.12,1],plant:['triangle',330,520,.1,.9],shoot:['sine',740,620,.05,.35],hit:['square',220,140,.04,.18],die:['triangle',300,90,.18,.6],flag:['sawtooth',300,600,.35,.5],sweep:['sine',500,1500,.6,.8],win:['sine',660,1320,.6,1],lose:['triangle',300,120,.7,.9],sel:['sine',600,700,.05,.5],no:['square',160,120,.08,.3],boom:['sawtooth',120,40,.5,1.2],freeze:['sine',1200,300,.5,.7],zap:['square',900,200,.12,.5],splash:['sine',500,180,.18,.5],dig:['triangle',90,160,.3,.8],pop:['sine',1000,400,.08,.5],gulp:['triangle',200,80,.25,.9],thud:['square',140,50,.2,1]}[k];if(!P)return;
  o.type=P[0];o.frequency.setValueAtTime(P[1],t);o.frequency.exponentialRampToValueAtTime(P[2],t+P[3]);a.gain.setValueAtTime(v*P[4],t);a.gain.exponentialRampToValueAtTime(.0001,t+P[3]+.05);o.start(t);o.stop(t+P[3]+.08)}catch(e){}}

/* ---------- 아리아드네 ---------- */
const GRAVE='farm/tomato_bush.png';
/* ---------- 스프라이트 이펙트 (본편 td/fx·fx2 시트, meta.json에서 옮김) ---------- */
const FXM={"nova":{"f":"td/fx/nova.png","fw":254,"fh":124,"n":52,"c":16,"fps":15.0,"px":125,"py":88,"loop":0},"warp":{"f":"td/fx/warp.png","fw":184,"fh":165,"n":46,"c":22,"fps":15.0,"px":92,"py":128,"loop":0},"stars":{"f":"td/fx/stars.png","fw":167,"fh":153,"n":38,"c":24,"fps":15.0,"px":94,"py":134,"loop":0},"smite":{"f":"td/fx/smite.png","fw":179,"fh":174,"n":43,"c":22,"fps":15.0,"px":90,"py":146,"loop":0},"ag_flake":{"f":"td/fx2/ag_flake.png","fw":98,"fh":102,"n":29,"c":6,"fps":10.0,"px":49,"py":97,"loop":0},"ag_shat":{"f":"td/fx2/ag_shat.png","fw":176,"fh":98,"n":24,"c":4,"fps":10.0,"px":48,"py":78,"loop":0},"cn_boom":{"f":"td/fx2/cn_boom.png","fw":195,"fh":184,"n":7,"c":3,"fps":10.0,"px":98,"py":92,"loop":0},"do_crit":{"f":"td/fx2/do_crit.png","fw":162,"fh":117,"n":10,"c":3,"fps":20,"px":66,"py":90,"loop":0},"k1_burst":{"f":"td/fx2/k1_burst.png","fw":164,"fh":132,"n":14,"c":4,"fps":10.0,"px":86,"py":109,"loop":0},"sn_splash":{"f":"td/fx2/sn_splash.png","fw":110,"fh":94,"n":27,"c":5,"fps":10.0,"px":54,"py":80,"loop":0},"sn_pud":{"f":"td/fx2/sn_pud.png","fw":100,"fh":52,"n":20,"c":4,"fps":5.0,"px":50,"py":41,"loop":1},"mt_pow":{"f":"td/fx2/mt_pow.png","fw":138,"fh":127,"n":17,"c":4,"fps":20,"px":69,"py":64,"loop":0},"st_burn":{"f":"td/fx2/st_burn.png","fw":41,"fh":65,"n":18,"c":6,"fps":15,"px":20,"py":62,"loop":1},"st_stun":{"f":"td/fx2/st_stun.png","fw":48,"fh":31,"n":24,"c":4,"fps":12,"px":23,"py":54,"loop":1},"mr_smite":{"f":"td/fx2/mr_smite.png","fw":179,"fh":173,"n":22,"c":5,"fps":10.0,"px":90,"py":146,"loop":0},"yg_torn":{"f":"td/fx2/yg_torn.png","fw":126,"fh":142,"n":12,"c":4,"fps":6.0,"px":76,"py":133,"loop":1},"mr_halo":{"f":"td/fx2/mr_halo.png","fw":35,"fh":36,"n":24,"c":5,"fps":12,"px":16,"py":61,"loop":1},"bs_dark":{"f":"td/fx2/bs_dark.png","fw":246,"fh":231,"n":37,"c":6,"fps":10.0,"px":123,"py":194,"loop":0},"rj_zap":{"f":"td/fx2/rj_zap.png","fw":114,"fh":80,"n":18,"c":4,"fps":20,"px":74,"py":40,"loop":0},"jg_hit":{"f":"td/fx2/jg_hit.png","fw":104,"fh":66,"n":8,"c":3,"fps":20,"px":25,"py":55,"loop":0},"tt_star":{"f":"td/fx2/tt_star.png","fw":160,"fh":148,"n":19,"c":5,"fps":10.0,"px":91,"py":129,"loop":0},"pillar":{"f":"td/fx/pillar.png","fw":192,"fh":225,"n":53,"c":21,"fps":15.0,"px":96,"py":204,"loop":0},"mana":{"f":"td/fx/mana.png","fw":158,"fh":141,"n":28,"c":25,"fps":15.0,"px":83,"py":118,"loop":0},"stars":{"f":"td/fx/stars.png","fw":167,"fh":153,"n":38,"c":24,"fps":15.0,"px":94,"py":134,"loop":0},"pn_elec":{"f":"td/fx2/pn_elec.png","fw":46,"fh":64,"n":30,"c":7,"fps":15,"px":23,"py":51,"loop":1},"st_slow":{"f":"td/fx2/st_slow.png","fw":57,"fh":66,"n":29,"c":6,"fps":12,"px":28,"py":64,"loop":1},"je_imp":{"f":"td/fx2/je_imp.png","fw":165,"fh":165,"n":15,"c":4,"fps":10.0,"px":86,"py":86,"loop":0},"bs_portal":{"f":"td/fx2/bs_portal.png","fw":191,"fh":126,"n":34,"c":5,"fps":10.0,"px":91,"py":101,"loop":0},"hb_burst":{"f":"td/fx2/hb_burst.png","fw":73,"fh":81,"n":19,"c":5,"fps":20,"px":34,"py":78,"loop":0},"hd_hit":{"f":"td/fx2/hd_hit.png","fw":107,"fh":60,"n":21,"c":4,"fps":20,"px":81,"py":54,"loop":0}};
/* w = 칸 단위 너비, dy = 발 기준 위로 띄우기(칸), rot = 세로 화면에서 돌리기 */
function sfx(l,p,k,o){if(T.headless)return;o=o||{};T.sfx.push({l,p,k,t:0,w:o.w||1.4,dy:o.dy||0,a:o.a==null?1:o.a,fl:o.fl||0,life:o.life||0,ox:o.ox||0})}
function drawSfx(){for(const f of T.sfx){const m=FXM[f.k],im=img(m.f);if(!ok(im))continue;const fi=Math.floor(f.t*m.fps);const idx=m.loop?fi%m.n:fi;if(idx>=m.n)continue;
    const[x,y]=S(f.l,f.p);const w=cs*f.w,h=w*m.fh/m.fw,sx=(idx%m.c)*m.fw,sy=Math.floor(idx/m.c)*m.fh;
    g.save();g.globalAlpha=f.a*(f.life?Math.min(1,(f.life-f.t)/.3):1);g.translate(x+f.ox*cs,y-f.dy*cs);if(f.fl)g.scale(-1,1);g.drawImage(im,sx,sy,m.fw,m.fh,-m.px/m.fw*w,-m.py/m.fh*h,w,h);g.restore()}}
function stepSfx(dt){for(const f of T.sfx)f.t+=dt;T.sfx=T.sfx.filter(f=>{const m=FXM[f.k];return f.life?f.t<f.life:(m.loop?f.t<3:f.t*m.fps<m.n)})}
const FACE={n:'td/ari/n.png',w:'td/ari/w.png',o:'td/ari/o.png',d:'td/ari/d.png',s:'td/ari/s.png'};
function say(f,tx,dur){if(T.headless)return;T.say={f,tx,t:0,dur:dur||4}}
function once(k,f,tx,dur){if(T.said[k])return;T.said[k]=1;say(f,tx,dur)}

/* ---------- 게임 로직 ---------- */
function plant(k,l,c){const d=U[k],cd=T.cards.find(x=>x.k===k);if(!cd||cd.cd>0||T.th<d.cost)return false;
  const gv=T.graves.find(q=>q.l===l&&q.c===c);if(d.gbust?(!gv||gv.bust):gv)return false;
  const old=T.units.find(u=>u.l===l&&u.c===c);if(d.up?(!old||old.k!==d.up):old)return false;
  if(d.max&&T.units.filter(u=>u.k===k).length>=d.max){if(!T.headless)once('mx'+k,'n',`${d.n} ${d.sk}는 한 번에 ${d.max}명까지예요. 노래가 끝나면 다시 불러요.`,3);return false}
  T.th-=d.cost;cd.cd=d.cd;if(old)T.units=T.units.filter(v=>v!==old);const u={k,l,c,hp:d.hp,max:d.hp,t:0,at:0,fl:0,pop:.25,age:0};
  if(d.gbust){u.t=d.gbust.t;gv.bust=1}if(d.mag)u.t=1;if(d.split)u.t=.6;if(d.ice)u.t=d.ice.t;if(d.lives)u.lives=d.lives;if(old&&old.ladder)u.ladder=1;
  if(d.prod)u.t=d.prod.first;if(d.shoot||d.fume)u.t=.6;if(d.lob)u.t=1;if(d.bomb)u.t=d.bomb.t;if(d.jala)u.t=d.jala.t;if(d.blow)u.t=d.blow.t;if(d.mine)u.t=d.mine.arm;if(d.spike)u.t=d.spike.every;
  T.units.push(u);T.planted++;snd('plant');
  if(k==='sun')once('w1','w','맘터 언니가 자리 잡았어요. 이제 실타래가 짜일 거예요.',3.5);return true}
function dropThread(lf,p,amt,from){T.thr.push({lf,p,amt,f:from?0:1,pop:from?.7:0,life:from?10:8,t:0,col:0,own:from?1:0});if(from&&!T.headless){sfx(Math.round(lf-.15),p-.25,'stars',{w:1.2,dy:.6});snd('pop')}}
function collect(th){if(th.col)return;th.col=1;th.ct=0;T.th+=th.amt;snd('col');once('c1','w','그거예요. 실타래는 우리 재산이에요.',2.6)}
function spawn(k,l,p){const d=E[k];T.ens.push({k,l,lv:l,p:p==null?9.6:p,dir:-1,hp:d.hp,max:d.hp,sh:d.shield||0,shMax:d.shield||0,fly:d.fly?1:0,ammo:d.cata?d.cata.ammo:0,ct:d.cata?1.5:0,fl:0,bob:Math.random()*6,eat:null,die:0,slow:0,jump:0,jumped:0,
    mh:d.metal>1?d.metal:0,under:d.dig?1:0,stick:d.pogo?1:0,box:d.jack?1:0,lad:d.ladder?1:0,frz:0,stun:0,jt:null,threw:0,smash:0,gb:0});
  if(d.intro&&!T.headless&&!SV.seen[k]){SV.seen[k]=1;save();say(k==='bucket'?'o':'n',d.intro,4.5)}}
function hurtE(e,dmg,why,front){if(e.die)return;if(front&&e.sh>0){e.sh-=dmg;e.fl=.09;if(e.sh<=0){e.sh=0;sfx(e.l,e.p,'jg_hit',{w:1.4,dy:.6});burst(e.l,e.p,'#cfd8e8',8);if(!T.headless)snd('thud')}return}e.hp-=dmg;const rg=E[e.k].rage;if(rg&&!e.rage&&e.hp<=rg.at&&e.hp>0){e.rage=1;burst(e.l,e.p,'#ff7a7a',8);once('rg','o','어머, 신문 찢어졌어요! 저 련 화났어요!',2.5)}e.fl=.09;if(e.hp<=0){e.die=.001;e.why=why||'';T.kills++;snd('die');burst(e.l,e.p,'#ffd6f0',10)}else if(!T.headless&&Math.random()<.35)snd('hit')}
function burst(l,p,col,n,sp){if(T.headless)return;for(let i=0;i<n;i++){const a=Math.random()*6.28,s=(.6+Math.random()*1.6)*(sp||1);T.fx.push({l,p,dx:Math.cos(a)*s,dy:Math.sin(a)*s,t:0,life:.45+Math.random()*.3,col,r:.04+Math.random()*.05})}}
function ring(l,p,col,r,life){if(T.headless)return;T.fx.push({ring:1,l,p,col,r,t:0,life:life||.5})}
function lose(){if(T.st!=='play')return;T.st='lose';T.end=0;snd('lose');say('d','어머....언니....제가 수준을 잘못 생각했나봐요.',99)}
function win(){if(T.st!=='play')return;T.st='win';T.end=0;snd('win');
  if(!T.headless){const first=SV.cl<=T.si;if(first)SV.cl=T.si+1;const np=SV.n[T.si]||0;SV.n[T.si]=np+1;const rw=reward(T.si,np),h=HOST();
    try{if(rw.g&&h&&h.gold)h.gold(rw.g);if(rw.lb&&h&&h.lobby)h.lobby(rw.lb)}catch(e){}
    const q=[];if(first&&T.si===29&&!SV.end){SV.end=1;q.push('end')}if(rw.lb)q.push('lobby');if(first&&STG[T.si].gift)q.push('gift');
    save();RES={si:T.si,first,gift:first?STG[T.si].gift:null,rw,np,q}}
  say('w','정원을 지켰어요. 역시 제가 사람 보는 눈은 있다니까요. 💅',99)}
function hasMetal(e){return(e.mh>0&&e.hp>e.max-e.mh)||e.sh>0||e.lad||e.stick||e.box||e.under}
function strip(e){if(e.mh>0&&e.hp>e.max-e.mh)e.hp=e.max-e.mh;e.mh=0;e.sh=0;e.lad=0;e.stick=0;e.box=0;if(e.under){e.under=0;e.stun=1}sfx(e.l,e.p,'rj_zap',{w:1.8,dy:.5});burst(e.l,e.p,'#c9d2e0',8);once('mg','w','쇠붙이는 밍키 언니가 가져갈게요. 🧲',2.5)}
function ahead(l,from,to,air){let best=null;for(const e of T.ens){if(e.die||e.l!==l||e.p>9.75||e.jump>0||e.under||(e.fly&&!air))continue;if(e.p>=from&&e.p<=to&&(!best||e.p<best.p))best=e}return best}

function step(dt){const t0=T.t;T.t+=dt;
  for(const c of T.cards)if(c.cd>0)c.cd=Math.max(0,c.cd-dt);
  // 웨이브
  /* 무수리는 오른쪽 길(배치 불가 구역)에서 미리 걸어 들어온다: 9.6칸 도착 시각은 그대로(밸런스 동일), WALK칸 앞에서 일찍 출발 */
  for(let i=T.wi;i<T.wv.length;i++){const w=T.wv[i];if(w.t-25>T.t)break;if(w.done)continue;
    if(w.k){const d=E[w.k],lead=WALK/(d.dig?d.spd0:d.spd);if(T.t>=w.t-lead){w.done=1;spawn(w.k,w.l,9.6+WALK);if(T.si===0)once('e1','o','어머, 무수리가 와요! 태태영님을 그 줄에 심어서 하트를 쏘세요.',4)}}}
  while(T.wi<T.wv.length&&(T.wv[T.wi].done||T.wv[T.wi].t<=T.t)){const w=T.wv[T.wi++];if(w.done)continue;w.done=1;
    if(w.flag){if(w.fin)for(const q of T.graves)if(!q.bust){spawn(T.r()<.3?'cone':'tom',q.l,q.c+.5);sfx(q.l,q.c+.5,'bs_portal',{w:1.6,dy:.1});burst(q.l,q.c+.5,'#8fd06a',10,1.3)}if(w.fin&&T.graves.some(q=>!q.bust))once('gv2','o','토마토 덤불에서 무수리가 기어 나와요! 덤불은 K1 언니가 치워 줘요.',3.5);
      T.banner={tx:w.fin?'마지막 무수리 무리예요!':'대규모 무수리가 몰려와요!',t:0};snd('flag');say('o',w.fin?'마지막 무리예요. 실 끝 꽉 잡아요!':'대규모 무수리예요! 언니, 화장 고치고 집중해요.',3.5)}
    else{spawn(w.k,w.l,9.6+WALK)}}
  // 하늘 실타래
  T.sky-=dt;if(T.sky<=0){T.sky=7+((T.t*7.3)%1)*2;dropThread(.4+((T.t*3.1)%1)*4.2,1.2+((T.t*5.7)%1)*7,25,false);if(T.t>4&&T.si===0)once('s1','n','하늘색 실타래가 보이면 톡 눌러서 모아요.',3.5)}
  // 대원
  for(const u of T.units){const d=U[u.k];u.fl=Math.max(0,u.fl-dt);u.pop=Math.max(0,u.pop-dt);u.at=Math.max(0,u.at-dt);u.age+=dt;
    if(d.life&&u.age>=d.life){u.dead=1;burst(u.l,u.c+.5,'#d9c2ff',8);sfx(u.l,u.c+.5,'mana',{w:1,dy:.45});continue}
    if(d.prod){u.t-=dt;if(u.t<=0){u.t=d.prod.every;u.at=.5;const amt=d.prod.grow&&u.age<d.prod.grow?d.prod.amt:(d.prod.amt2||d.prod.amt);dropThread(u.l+.15,u.c+.75,amt,true)}}
    if(d.shoot){u.t-=dt;if(u.t<=0){const R=d.shoot.range||9;const LS=d.shoot.lanes?[u.l-1,u.l,u.l+1].filter(x=>x>=0&&x<5):[u.l];const tg=LS.some(l=>ahead(l,u.c+.2,Math.min(9.75,u.c+.5+R),d.shoot.air));
        if(tg){u.t=d.shoot.every;u.at=.35;for(const l of LS)for(let i=0;i<d.shoot.n;i++)T.pr.push({l,l0:u.l,p:u.c+.75,p0:u.c+.75,dmg:d.shoot.dmg,sp:6.2,a:0,k:d.shoot.k,slow:d.shoot.slow||0,air:d.shoot.air||0,R:R+.1,wait:i*.18});if(!T.headless&&Math.random()<.5)snd('shoot')}else u.t=.1}}
    if(d.fume){u.t-=dt;if(u.t<=0){const tg=ahead(u.l,u.c+.2,u.c+.5+d.fume.range);if(tg){u.t=d.fume.every;u.at=.4;u.beam=.35;for(const e of T.ens)if(!e.die&&!e.fly&&e.l===u.l&&e.p>=u.c+.2&&e.p<=u.c+.5+d.fume.range){hurtE(e,d.fume.dmg,'fume');if(T.r()<.5)sfx(e.l,e.p,'pn_elec',{w:.7,dy:.45,life:.35,ox:(T.r()-.5)*.3})}if(!T.headless&&Math.random()<.5)snd('shoot')}else u.t=.1}if(u.beam>0)u.beam-=dt}
    if(d.lob){u.t-=dt;if(u.t<=0){const tg=ahead(u.l,u.c+.2,9.75);if(tg){u.t=d.lob.every;u.at=.4;T.lob.push({l:u.l,p0:u.c+.6,tg,p1:tg.p,t:0,T:.8,dmg:d.lob.dmg,k:d.lob.k,o:d.lob})}else u.t=.1}}
    if(d.jala){u.t-=dt;u.at=1;if(u.t<=0){u.dead=1;for(const e of T.ens)if(!e.die&&e.l===u.l&&!e.fly&&e.p<9.9)hurtE(e,d.jala.dmg,'fire');T.shake=8;T.flash=.15;snd('boom');T.fire.push({l:u.l,t:0});for(let p=0;p<10;p+=.5)burst(u.l,p,Math.random()<.5?'#ff9a3c':'#ffd36b',4,1.4);sfx(u.l,u.c+.5,'mr_smite',{w:2.4,dy:.3})}}
    if(d.spike){u.t-=dt;if(u.t<=0){u.t=d.spike.every;for(const e of T.ens)if(!e.die&&!e.fly&&!e.under&&e.l===u.l&&Math.abs(e.p-(u.c+.5))<.6){hurtE(e,d.spike.dmg,'spike');u.at=.3;if(T.r()<.6)burst(u.l,u.c+.5,d.lives?'#d8d0c0':'#9fe07a',3,.8)}}}
    if(d.blow){u.t-=dt;u.at=1;if(u.t<=0){u.dead=1;let n=0;for(const e of T.ens)if(!e.die&&e.fly&&e.p<9.9){e.die=.001;e.blown=1;T.kills++;n++}T.wind=1;snd('sweep');for(const e of T.ens)if(e.blown)sfx(e.l,e.p,'yg_torn',{w:2.2,dy:.9});sfx(u.l,u.c+.5,'yg_torn',{w:2.6,dy:.2});if(n)once('bl','w','후우— 풍선은 저 멀리 날아갔어요. 💨',2.5)}}
    if(d.split){u.t-=dt;if(u.t<=0){const f=ahead(u.l,u.c+.2,9.75);let b=null;for(const e of T.ens){if(e.die||e.l!==u.l||e.under||e.fly||e.jump>0||e.p>u.c+.3||e.p<-.3)continue;if(!b||e.p>b.p)b=e}
        if(f||b){u.t=d.split.every;u.at=.35;if(f)T.pr.push({l:u.l,p:u.c+.75,p0:u.c+.75,dmg:d.split.dmg,sp:6.2,a:0,k:'heart',dir:1,R:9.1,wait:0});if(b)for(let i=0;i<2;i++)T.pr.push({l:u.l,p:u.c+.25,p0:u.c+.25,dmg:d.split.dmg,sp:6.2,a:0,k:'heart',dir:-1,R:9.1,wait:i*.18});if(!T.headless&&Math.random()<.5)snd('shoot')}else u.t=.1}}
    if(d.mag){u.t-=dt;if(u.t<=0){let best=null,bd=1e9;for(const e of T.ens){if(e.die||!hasMetal(e)||e.p>9.7||Math.abs(e.l-u.l)>d.mag.rl)continue;const dd=Math.abs(e.p-(u.c+.5));if(dd>d.mag.rp)continue;const sc=dd+Math.abs(e.l-u.l)*.5;if(sc<bd){bd=sc;best=e}}
        const lu=best?null:T.units.find(v=>v.ladder&&Math.abs(v.l-u.l)<=d.mag.rl&&Math.abs(v.c-u.c)<=d.mag.rp);
        if(best||lu){u.t=d.mag.every;u.at=.6;if(best)strip(best);else{lu.ladder=0;snd('zap');sfx(lu.l,lu.c+.5,'rj_zap',{w:1.8,dy:.5})}if(!T.headless)snd('thud')}else u.t=.3}}
    if(d.gbust){u.t-=dt;u.at=1;if(u.t<=0){u.dead=1;T.graves=T.graves.filter(q=>!(q.l===u.l&&q.c===u.c));sfx(u.l,u.c+.5,'mr_halo',{w:2,dy:.4});burst(u.l,u.c+.5,'#d8ffd0',10,1.3);once('gb','w','덤불 정리 끝! K1 언니 손이 야무져요. 👻',2.5)}}
    if(d.ice){u.t-=dt;u.at=1;if(u.t<=0){u.dead=1;for(const e of T.ens)if(!e.die&&e.p<9.9){e.frz=d.ice.frz;e.slow=Math.max(e.slow,d.ice.frz+d.ice.slow);hurtE(e,d.ice.dmg,'ice')}T.flash=.2;snd('freeze');sfx(2,4.5,'cn_boom',{w:6,dy:.4,a:.9});for(const e of T.ens)if(!e.die&&e.p<9.9)sfx(e.l,e.p,'ag_flake',{w:1.5,dy:.05})}}
    if(d.bomb){u.t-=dt;u.at=1;if(u.t<=0){u.dead=1;for(const e of T.ens)if(!e.die&&Math.abs(e.l-u.l)<=1&&e.p>=u.c-.6&&e.p<=u.c+1.6)hurtE(e,d.bomb.dmg,'boom');T.shake=10;T.flash=.25;snd('boom');sfx(u.l,u.c+.5,'nova',{w:3.6,dy:.35});burst(u.l,u.c+.5,'#ffb3d1',14,2.2)}}
    if(d.mine){if(u.t>0){u.t-=dt;if(u.t<=0){u.at=.6;burst(u.l,u.c+.5,'#f5deb3',10)}}
      else{const e=T.ens.find(e=>!e.die&&!e.fly&&!e.under&&e.l===u.l&&e.jump<=0&&e.p-.28<=u.c+.9&&e.p>u.c-.1);if(e){u.dead=1;for(const z of T.ens)if(!z.die&&z.l===u.l&&Math.abs(z.p-(u.c+.5))<.85)hurtE(z,d.mine.dmg,'boom');T.shake=6;snd('boom');sfx(u.l,u.c+.5,'do_crit',{w:2.2,dy:.3});burst(u.l,u.c+.5,'#e8c98a',12,1.6)}}}
    if(d.chomp){if(u.chew>0){u.chew-=dt;if(u.chew<=0)u.chew=0}
      else if(!u.bite){const e=ahead(u.l,u.c+.3,u.c+.5+d.chomp.range);if(e&&!E[e.k].garg){u.bite=.45;u.btg=e;u.at=.45}}
      if(u.bite){u.bite-=dt;if(u.bite<=0){u.bite=0;const e=u.btg;if(e&&!e.die&&e.l===u.l&&Math.abs(e.p-(u.c+.5))<d.chomp.range+.6){hurtE(e,1e9,'gulp');snd('gulp');u.chew=d.chomp.chew;sfx(u.l,u.c+.5,'k1_burst',{w:2.2,dy:.4})}u.btg=null}}}
    if(d.squash){if(!u.jmp){const e=T.ens.find(e=>!e.die&&!e.fly&&!e.under&&e.l===u.l&&e.jump<=0&&Math.abs(e.p-(u.c+.5))<d.squash.range);if(e){u.jmp=.6;u.jp=e.p;u.at=.6}}
      else{u.jmp-=dt;if(u.jmp<=0){u.dead=1;for(const z of T.ens)if(!z.die&&z.l===u.l&&Math.abs(z.p-u.jp)<.7)hurtE(z,d.squash.dmg,'squash');T.shake=7;snd('thud');sfx(u.l,u.jp,'mt_pow',{w:2.2,dy:.3});burst(u.l,u.jp,'#ffe0c0',8,1.4)}}}}
  // 투사체
  for(const pr of T.pr){if(pr.wait>0){pr.wait-=dt;continue}const pp=pr.p,dir=pr.dir||1;pr.p+=pr.sp*dt*dir;pr.a+=dt;if(pr.p>10||pr.p<-.4||Math.abs(pr.p-pr.p0)>pr.R){pr.dead=1;continue}
    if(dir<0){let b=null;for(const e of T.ens){if(e.die||e.l!==pr.l||e.under||e.fly||e.jump>0)continue;if(pr.p<=e.p+.3&&pr.p>=e.p-.4&&(!b||e.p>b.p))b=e}if(b){hurtE(b,pr.dmg,'',0);pr.dead=1;burst(pr.l,pr.p,'#ff7ab6',5)}continue}
    if(!pr.fire&&pr.k!=='spike'&&pr.k!=='orb'){for(const u of T.units)if(U[u.k].torch&&u.l===pr.l&&pp<u.c+.5&&pr.p>=u.c+.5){pr.fire=1;pr.dmg*=2;pr.slow=0;u.at=.25;burst(u.l,u.c+.5,'#ffb347',5,1.2);break}}
    let best=null;for(const e of T.ens){if(e.die||e.l!==pr.l||e.p>9.8||e.jump>0||e.under)continue;if(e.fly&&!pr.air)continue;if(pr.p>=e.p-.3&&pr.p<=e.p+.4&&(!best||e.p<best.p))best=e}
    if(best){if(best.fly){best.fly=0;best.popped=1;snd('pop');sfx(pr.l,pr.p,'stars',{w:1.3,dy:1.1});burst(pr.l,pr.p,'#ffe0f0',10);once('pp','w','펑! 풍선이 터졌어요. 이제 걸어오는 수밖에 없죠. 💅',2.5)}else{hurtE(best,pr.dmg,'',1);if(pr.slow&&!best.sh){best.slow=Math.max(best.slow,pr.slow);sfx(pr.l,pr.p,'ag_flake',{w:1,dy:.4})}}pr.dead=1;if(pr.k==='orb')sfx(pr.l,pr.p,'mana',{w:1.1,dy:.45});else if(pr.k==='spike')sfx(pr.l,pr.p,'stars',{w:.9,dy:.5});else if(pr.fire)sfx(pr.l,pr.p,'hb_burst',{w:.8,dy:.4});burst(pr.l,pr.p,pr.fire?'#ffb347':pr.k==='ice'?'#d6e6ff':pr.k==='note'?'#d6b8ff':pr.k==='spike'?'#fff2a8':pr.k==='orb'?'#c9a8ff':'#ff7ab6',5)}}
  for(const lb of T.lob){lb.t+=dt;if(lb.tg&&!lb.tg.die)lb.p1=lb.tg.p;if(lb.t>=lb.T){lb.dead=1;const e=lb.tg&&!lb.tg.die&&!lb.tg.fly?lb.tg:ahead(lb.l,lb.p1-.6,lb.p1+.6);if(e){const o=lb.o||{};let dm=lb.dmg;if(o.stun&&T.r()<o.stun.p){dm=o.stun.dmg;e.stun=Math.max(e.stun,o.stun.t)}hurtE(e,dm,'lob');if(o.slow)e.slow=Math.max(e.slow,o.slow);
      if(o.splash)for(const z of T.ens)if(z!==e&&!z.die&&!z.fly&&!z.under&&Math.abs(z.l-lb.l)<=1&&Math.abs(z.p-e.p)<1.05){hurtE(z,o.splash,'lob');if(o.slow)z.slow=Math.max(z.slow,o.slow)}
      if(lb.k==='poison'){snd('splash');sfx(lb.l,e.p,'sn_splash',{w:1.5,dy:.5});if(dm!==lb.dmg)sfx(lb.l,e.p,'st_stun',{w:1,dy:1.3,life:o.stun.t})}
      else if(lb.k==='bomb')sfx(lb.l,e.p,'mr_smite',{w:2.8,dy:.35});else if(lb.k==='ice')sfx(lb.l,e.p,'ag_shat',{w:1.7,dy:.25});else if(lb.k==='rose')sfx(lb.l,e.p,'tt_star',{w:1.2,dy:.6});
      burst(lb.l,e.p,o.splash?'#ffc89a':'#ffd1ea',o.splash?8:4)}}}T.lob=T.lob.filter(b=>!b.dead);
  for(const b of T.balls){b.t+=dt;if(b.t>=b.T){b.dead=1;const u=b.u;const cover=T.units.some(v=>U[v.k].umb&&Math.abs(v.l-b.l)<=1&&Math.abs(v.c-b.c)<=1);if(cover){burst(b.l,b.c+.5,'#e8e0ff',8);once('um','w','양산 덕분에 무사해요. 잔느 언니 센스 봐요. ☂️',2.5)}else if(u&&!u.dead){u.hp-=b.dmg;u.fl=.1;sfx(b.l,b.c+.5,'hb_burst',{w:1,dy:.5});if(u.hp<=0){u.dead=1;burst(u.l,u.c+.5,'#cfe8ff',12)}}}}T.balls=T.balls.filter(b=>!b.dead);
  for(const f of T.fire)f.t+=dt;T.fire=T.fire.filter(f=>f.t<.9);if(T.wind>0)T.wind=Math.max(0,T.wind-dt*1.2);
  T.pr=T.pr.filter(p=>!p.dead);
  // 무수리
  for(const e of T.ens){const d=E[e.k];e.fl=Math.max(0,e.fl-dt);e.slow=Math.max(0,e.slow-dt);const sm=e.slow>0?.5:1;e.bob+=dt*(e.eat?11:6)*sm;
    if(e.die){e.die+=dt;continue}
    if(e.lv!==e.l){const dl=e.l-e.lv;e.lv=Math.abs(dl)<dt*2.2?e.l:e.lv+Math.sign(dl)*dt*2.2}
    if(e.frz>0){e.frz-=dt;e.eat=null;continue}
    if(e.stun>0){e.stun-=dt;e.eat=null;continue}
    if(e.under){e.p-=d.spd0*dt;if(e.p<=.15){e.p=.15;e.under=0;e.dir=1;e.stun=1.2;snd('dig');sfx(e.l,e.p,'je_imp',{w:1.6,dy:.2});burst(e.l,e.p,'#b08a5a',14,1.4);once('dg','o','어머, 애벌레가 뒤에서 튀어나왔어요! 뒤를 쏘는 영애 언니가 필요해요.',3.5)}continue}
    if(d.jack&&e.box){if(e.jt==null&&e.p<8.6)e.jt=d.jack.after[0]+T.r()*(d.jack.after[1]-d.jack.after[0]);
      if(e.jt!=null){e.jt-=dt;if(e.jt<=0){for(const u of T.units)if(Math.abs(u.l-e.l)<=1&&Math.abs(u.c+.5-e.p)<=1.5)u.dead=1;e.die=.001;e.why='jack';T.kills++;T.shake=10;T.flash=.2;snd('boom');sfx(e.l,e.p,'bs_dark',{w:3.6,dy:.4});burst(e.l,e.p,'#b88cff',10,2);once('jk','d','깜짝 가지가 터졌어요… 자석으로 상자를 뺏으면 안 터져요.',3.5);continue}}}
    if(d.garg&&!e.threw&&e.hp<e.max/2&&e.p>2.2){e.threw=1;spawn('imp',e.l,Math.max(.9,e.p-5));sfx(e.l,Math.max(.9,e.p-5),'do_crit',{w:1.2,dy:.3});once('im','o','새싹 꼬마가 날아왔어요! 뒤쪽 조심해요.',2.5)}
    if(e.jump>0){e.jump-=dt;e.p=e.jp0+(e.jp1-e.jp0)*(1-e.jump/.75);if(e.jump<=0){e.jump=0;e.jumped=1;e.p=e.jp1;burst(e.l,e.p,'#d9c8a8',6,.9)}continue}
    if(e.fly){e.p-=d.spd*sm*dt;e.eat=null}else{
    if(d.cata&&e.ammo>0&&e.p<=d.cata.at){const tgs=T.units.filter(u=>u.l===e.l&&!u.dead&&u.c<e.p-.5);if(tgs.length){e.ct-=dt;e.eat=null;if(e.ct<=0){e.ct=d.cata.every;e.ammo--;const u=tgs.reduce((a,b)=>a.c<b.c?a:b);T.balls.push({l:e.l,c:u.c,u,p0:e.p,t:0,T:1.1,dmg:d.cata.dmg})}if(e.p<-.15){}continue}}
    let tg=null;for(const u of T.units){if(u.l!==e.l||u.hp<=0||u.dead)continue;const ud=U[u.k];if(ud.mine&&u.t<=0)continue;if(ud.spike&&!d.garg)continue;
      if(e.dir>0){if(e.p+.28>=u.c+.15&&e.p<u.c+.85&&(!tg||u.c<tg.c))tg=u}else if(e.p-.28<=u.c+.85&&e.p>u.c+.15&&(!tg||u.c>tg.c))tg=u}
    if(tg&&d.garg){e.eat=null;e.smash+=dt*(e.slow>0?.5:1);if(e.smash>=1.1){e.smash=0;if(tg.lives!=null){tg.lives--;tg.fl=.15;burst(tg.l,tg.c+.5,'#cfc8b8',8);if(tg.lives<=0)tg.dead=1}else{tg.dead=1;burst(tg.l,tg.c+.5,'#cfe8ff',8)}sfx(tg.l,tg.c+.5,'hd_hit',{w:1.6,dy:.3});T.shake=6;snd('thud')}continue}
    if(tg&&d.ladder&&e.lad&&U[tg.k].wall){tg.ladder=1;e.lad=0;e.sh=0;burst(tg.l,tg.c+.5,'#e8d9b0',8);once('ld','o','사다리를 걸었어요! 이제 다른 무수리들이 타고 넘어와요.',3)}
    if(tg&&d.pogo&&e.stick){if(U[tg.k].tall){e.stick=0;burst(e.l,e.p,'#fff',6);tg=tg}else{e.jump=.75;e.jp0=e.p;e.jp1=tg.c-.05;e.eat=null;continue}}
    if(tg&&tg.ladder&&e.dir<0&&!d.pole){e.jump=.75;e.jp0=e.p;e.jp1=tg.c-.05;e.eat=null;continue}
    if(tg&&d.pole&&!e.jumped){if(U[tg.k].tall){e.jumped=1;burst(e.l,e.p,'#fff',6)}else{e.jump=.75;e.jp0=e.p;e.jp1=tg.c-.05;e.eat=null;continue}}
    if(tg&&d.cata){tg.dead=1;sfx(tg.l,tg.c+.5,'hd_hit',{w:1.6,dy:.3});snd('thud');tg=null}
    const bm=e.rage?d.rage.bite:1;
    e.eat=tg;if(tg){tg.hp-=100*sm*bm*dt;tg.fl=.06;if(tg.hp<=0){tg.dead=1;burst(tg.l,tg.c+.5,'#cfe8ff',12);snd('die')}
      else if(U[tg.k].garl){e.gb+=dt;if(e.gb>.6){e.gb=0;const c2=[e.l-1,e.l+1].filter(x=>x>=0&&x<5);e.l=c2.length>1?c2[T.r()<.5?0:1]:c2[0];e.eat=null;sfx(e.l,e.p,'warp',{w:1.8,dy:.5});once('gl','w','람쥐 언니가 옆 줄로 끌어당겼어요. 🌀',2.5)}}}
    else{const sp=e.rage?d.rage.spd:((d.pole||d.fly)&&(e.jumped||e.popped))||(d.ladder&&!e.lad)?d.spd2:d.spd;e.p+=e.dir*sp*sm*dt;if(e.dir>0&&e.p>9.4)e.dir=-1}}
    if(e.p<-.15&&e.dir<0){const ln=T.lanes[e.l];if(ln.spool&&!ln.sw){ln.sw={p:-.4};ln.spool=0;snd('sweep');once('sw1','w','실은 줄마다 한 번뿐이에요. 아껴 쓰는 여자가 아름다워요.',4)}else if(!ln.sw)lose()}}
  T.units=T.units.filter(u=>!u.dead);
  for(let l=0;l<5;l++){const ln=T.lanes[l];if(!ln.sw)continue;ln.sw.p+=7*dt;for(const e of T.ens)if(!e.die&&e.l===l&&e.p<=ln.sw.p+.3){hurtE(e,1e9);burst(l,e.p,'#9fe8ff',8)}if(ln.sw.p>10.3)ln.sw=null}
  T.ens=T.ens.filter(e=>!(e.die&&e.die>.6));
  for(const th of T.thr){th.t+=dt;if(th.col){th.ct+=dt;if(th.ct>.5)th.dead=1;continue}
    if(th.f>0)th.f=Math.max(0,th.f-dt/4.2);if(th.pop>0)th.pop=Math.max(0,th.pop-dt);
    if(th.f<=0&&th.pop<=0){th.life-=dt;if(th.life<=0)th.dead=1}
    if(T.headless&&T.auto&&th.f<=.6&&th.t>T.auto)collect(th)}
  T.thr=T.thr.filter(t=>!t.dead);
  for(const f of T.fx)f.t+=dt;T.fx=T.fx.filter(f=>f.t<f.life);stepSfx(dt);
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
let FPAT=null,FPK='';function board(){const ch=STG[T.si].ch;const F=ch.floor||['#141b38','#182142'];
  if(ch.floorImg){const im=img(ch.floorImg);if(ok(im)){const key=ch.floorImg+cs;if(FPK!==key){const c2=document.createElement('canvas');const k=cs*1.6/im.naturalHeight;c2.width=Math.round(im.naturalWidth*k);c2.height=Math.round(im.naturalHeight*k);const g2=c2.getContext('2d');g2.imageSmoothingEnabled=false;g2.drawImage(im,0,0,c2.width,c2.height);FPAT=g.createPattern(c2,'repeat');FPK=key}
    const[x0,y0]=S(0,vert?9:0);g.save();g.translate(bx,by);g.fillStyle=FPAT;g.fillRect(0,0,vert?5*cs:9*cs,vert?9*cs:5*cs);g.restore();if(ch.tint){g.fillStyle=ch.tint;g.fillRect(bx,by,vert?5*cs:9*cs,vert?9*cs:5*cs)}for(let l=0;l<5;l++)for(let c=0;c<9;c++){if((l+c)%2)continue;const[x,y]=S(l,c+.5);g.fillStyle=ch.warm?'rgba(255,220,150,.06)':'rgba(255,90,210,.07)';g.fillRect(x-cs/2,y-cs/2,cs,cs)}
    g.strokeStyle=ch.line||'rgba(120,240,255,.12)';g.lineWidth=1;for(let l=0;l<=5;l++){const[a1,b1]=S(l-.5,0),[a2,b2]=S(l-.5,9);g.beginPath();g.moveTo(a1+(vert?0:0),b1);g.lineTo(a2,b2);g.stroke()}}
    else{for(let l=0;l<5;l++)for(let c=0;c<9;c++){const[x,y]=S(l,c+.5);g.fillStyle=F[(l+c)%2];g.fillRect(x-cs/2,y-cs/2,cs+.5,cs+.5)}}}
  else for(let l=0;l<5;l++)for(let c=0;c<9;c++){const[x,y]=S(l,c+.5);g.fillStyle=F[(l+c)%2];g.fillRect(x-cs/2,y-cs/2,cs+.5,cs+.5)}
  const t=performance.now()/1000;for(let l=0;l<5;l++)for(let c=0;c<9;c++){const h=((l*73856093)^(c*19349663))>>>0;const[x,y]=S(l,c+.5);
    if(h%5===0&&!ch.warm){g.globalAlpha=.1;g.fillStyle='#9fb4ff';g.fillRect(x-cs*.2,y-cs*.1,cs*.2,cs*.14)}
    if(h%3===0){g.globalAlpha=.25+.35*Math.abs(Math.sin(t*1.5+h));g.fillStyle=ch.warm?(h&1?'#fff2b0':'#e0ffc0'):h&1?'#cfe0ff':'#ffd6f5';g.fillRect(x+((h>>4)%30-15)/40*cs,y+((h>>9)%30-15)/40*cs,2,2)}}
  g.globalAlpha=1;g.strokeStyle='rgba(160,180,255,.12)';g.lineWidth=1;for(let l=0;l<=5;l++){const[a1,b1]=S(l-.5+.0,0);}
  /* 오른쪽(세로 화면은 위쪽) 「무수리 길」: 대원은 못 심고, 걸어오는 무수리를 미리 보는 곳 */
  {const ex=vert?[bx,50,5*cs,by-50]:[bx+9*cs,by,W-bx-9*cs,5*cs];
   if(ex[2]>2&&ex[3]>2){g.save();g.translate(bx,by);g.fillStyle=ch.floorImg&&FPAT?FPAT:F[0];g.fillRect(ex[0]-bx,ex[1]-by,ex[2],ex[3]);g.restore();
    const gr=vert?g.createLinearGradient(0,by,0,ex[1]):g.createLinearGradient(ex[0],0,W,0);gr.addColorStop(0,'rgba(10,5,24,.38)');gr.addColorStop(1,'rgba(10,5,24,.72)');g.fillStyle=gr;g.fillRect(...ex);
    g.strokeStyle='rgba(255,255,255,.06)';g.lineWidth=1;for(let l=1;l<5;l++){g.beginPath();if(vert){g.moveTo(bx+l*cs,ex[1]);g.lineTo(bx+l*cs,by)}else{g.moveTo(ex[0],by+l*cs);g.lineTo(W,by+l*cs)}g.stroke()}
    g.save();g.setLineDash([7,6]);g.strokeStyle='rgba(255,190,230,.55)';g.lineWidth=2;g.beginPath();if(vert){g.moveTo(bx,by);g.lineTo(bx+5*cs,by)}else{g.moveTo(ex[0],by);g.lineTo(ex[0],by+5*cs)}g.stroke();g.restore()}}
  const[ax,ay]=S(0,0),[bx2,by2]=S(4,0);const ext=cs*.5;g.strokeStyle='rgba(150,230,255,.85)';g.lineWidth=3;g.shadowColor='#8fe6ff';g.shadowBlur=12;g.beginPath();
  if(vert){g.moveTo(ax-ext,ay);g.lineTo(bx2+ext,by2)}else{g.moveTo(ax,ay-ext);g.lineTo(bx2,by2+ext)}g.stroke();g.shadowBlur=0}
function draw(){g.setTransform(DPR,0,0,DPR,0,0);UI=[];sky();
  if(SCR==='map'){mapScr();return}if(SCR==='deck'){deckScr();return}if(SCR==='gift'){giftScr();return}if(SCR==='lobby'){lobbyScr();return}if(SCR==='scene'){sceneScr();return}
  const t=T.t;const sh=T.shake>0?(Math.random()-.5)*T.shake:0;g.save();g.translate(sh,sh*.5);board();
  if(T.hover&&(T.sel||T.shovel)){const[x,y]=S(T.hover.l,T.hover.c+.5);g.fillStyle=T.shovel?'rgba(255,120,120,.25)':'rgba(255,255,255,.16)';g.fillRect(x-cs/2,y-cs/2,cs,cs)}
  for(let l=0;l<5;l++){const ln=T.lanes[l];if(ln.spool){const[x,y]=S(l,-.33);yarn(x,y,cs*.17,.95,t+l)}
    if(ln.sw){const[x0,y0]=S(l,-.4),[x1,y1]=S(l,ln.sw.p);g.save();g.strokeStyle='#bff6ff';g.lineWidth=cs*.06;g.shadowColor='#7fe0ff';g.shadowBlur=18;g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.stroke();g.restore();yarn(x1,y1,cs*.24,1,t*3)}}
  const L=[];
  for(const u of T.units){const[x,y]=S(u.l,u.c+.5);L.push({y:y+cs*.4,k:0,o:u,x})}
  for(const e of T.ens){if(e.p>9.6+WALK+.5)continue;const[x,y]=S(e.lv,e.p);L.push({y:y+cs*.3,k:1,o:e,x})}
  for(const q of T.graves){const[x,y]=S(q.l,q.c+.5);L.push({y:y+cs*.38,k:3,o:q,x})}
  if(T.hover&&T.sel&&!T.units.some(u=>u.l===T.hover.l&&u.c===T.hover.c)){const[x,y]=S(T.hover.l,T.hover.c+.5);L.push({y:y+cs*.4,k:2,x,o:T.sel})}
  L.sort((a,b)=>a.y-b.y);const UD=vert?1.42:1.2;
  for(const it of L){if(it.k===0)drawUnit(it,UD,t);else if(it.k===1)drawEnemy(it,t);else if(it.k===3){const im=img(GRAVE);if(ok(im)){const D=cs*.92,h=D*im.naturalHeight/im.naturalWidth;g.drawImage(im,it.x-D/2,it.y-h*.98,D,h)}}else frame(img(U[it.o].img),0,it.x,it.y,cs*UD,.45,0)}
  for(const pr of T.pr){if(pr.wait>0)continue;const[x,y]=S(pr.l,pr.p);const yy=y-(vert?cs*.3:cs*.32);g.save();
    if(pr.fire){g.shadowColor='#ff8a00';g.shadowBlur=14;heart(x,yy,cs*.2,'#ffb347');g.fillStyle='rgba(255,120,0,.5)';g.beginPath();g.arc(x-(vert?0:cs*.12),yy+(vert?cs*.12:0),cs*.07,0,6.29);g.fill()}
    else if(pr.k==='orb'){g.shadowColor='#b48cff';g.shadowBlur=12;g.fillStyle='#e6d6ff';g.beginPath();g.arc(x,yy,cs*.09,0,6.29);g.fill();g.fillStyle='#9a6cff';g.beginPath();g.arc(x,yy,cs*.05,0,6.29);g.fill()}
    else if(pr.k==='spike'){g.shadowColor='#ffe86b';g.shadowBlur=10;g.fillStyle='#fff6b0';g.save();g.translate(x,yy);g.rotate(pr.a*12);const r=cs*.11;g.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,rr2=i%2?r*.4:r;g.lineTo(Math.cos(a)*rr2,Math.sin(a)*rr2)}g.fill();g.restore()}
    else if(pr.k==='note'){g.shadowColor='#b48cff';g.shadowBlur=10;note(x,yy,cs*.2,'#d9c2ff')}
    else if(pr.k==='ice'){g.shadowColor='#9fc8ff';g.shadowBlur=10;const r=cs*.1;g.fillStyle='#e3efff';for(const[a,b,c]of[[-1,0,1],[0,-.6,1.2],[1,0,1],[0,.2,1.1]]){g.beginPath();g.arc(x+a*r,yy+b*r,r*c,0,6.29);g.fill()}g.shadowBlur=0;g.fillStyle='#6f8fd8';g.font=`900 ${Math.round(r*1.3)}px sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillText('z',x,yy)}
    else{g.shadowColor='#ff5fa8';g.shadowBlur=10;heart(x,yy,cs*.17*(1+.12*Math.sin(pr.a*20)),'#ff6fb1')}g.restore()}
  for(const lb of T.lob){const k=Math.min(1,lb.t/lb.T);const p=lb.p0+(lb.p1-lb.p0)*k;let[x,y]=S(lb.l,p);const h=Math.sin(k*Math.PI)*cs*1.3;if(vert){x+=h*.35;y-=cs*.3}else y-=cs*.3+h;g.save();g.translate(x,y);const rot=(vert?-Math.PI/2:Math.PI)+k*(vert?-5:5)*(lb.k==='poison'?.3:1);
    if(lb.k==='poison'){g.rotate(vert?-Math.PI/2+Math.sin(k*Math.PI)*.4:Math.PI+Math.sin(k*Math.PI)*.4);g.shadowColor='#d08cff';g.shadowBlur=8;const L=cs*.34;g.fillStyle='#f3e6ff';g.fillRect(-L*.1,-cs*.05,L*.75,cs*.1);g.fillStyle='#b56cff';g.fillRect(-L*.1,-cs*.035,L*.5*(1-k*.4),cs*.07);g.fillStyle='#cfcfd8';g.fillRect(L*.65,-cs*.012,L*.4,cs*.024);g.fillRect(-L*.2,-cs*.09,cs*.04,cs*.18);g.fillRect(-L*.1,-cs*.06,cs*.025,cs*.12)}
    else if(lb.k==='bomb'||lb.k==='ice'){g.rotate(rot);const r=cs*.15;const gr=g.createRadialGradient(-r*.35,-r*.35,r*.1,0,0,r);if(lb.k==='ice'){gr.addColorStop(0,'#ffffff');gr.addColorStop(.5,'#bfe3ff');gr.addColorStop(1,'#5a9ad8');g.shadowColor='#9fd0ff'}else{gr.addColorStop(0,'#8a8a94');gr.addColorStop(.5,'#3a3a46');gr.addColorStop(1,'#16161e');g.shadowColor='#ffb347'}g.shadowBlur=10;g.fillStyle=gr;g.beginPath();g.arc(0,0,r,0,6.29);g.fill();
      if(lb.k==='bomb'){g.strokeStyle='#d9c08a';g.lineWidth=2;g.beginPath();g.moveTo(r*.5,-r*.7);g.quadraticCurveTo(r*1.1,-r*1.3,r*.9,-r*1.6);g.stroke();g.fillStyle='#ffd36b';g.beginPath();g.arc(r*.9,-r*1.6,r*.28*(1+.4*Math.sin(lb.t*40)),0,6.29);g.fill()}
      else{g.strokeStyle='rgba(255,255,255,.8)';g.lineWidth=1.5;for(let i=0;i<3;i++){const a=i*Math.PI/3;g.beginPath();g.moveTo(Math.cos(a)*r*.7,Math.sin(a)*r*.7);g.lineTo(-Math.cos(a)*r*.7,-Math.sin(a)*r*.7);g.stroke()}}}
    else if(lb.k==='rose'){g.rotate(rot);g.shadowColor='#ff5fa8';g.shadowBlur=8;g.fillStyle='#3f8a3f';g.fillRect(-cs*.02,0,cs*.04,cs*.22);g.fillStyle='#e0304f';for(let i=0;i<5;i++){const a=i*1.2566;g.beginPath();g.ellipse(Math.cos(a)*cs*.05,Math.sin(a)*cs*.05-cs*.02,cs*.07,cs*.045,a,0,6.29);g.fill()}g.fillStyle='#ff8fb0';g.beginPath();g.arc(0,-cs*.02,cs*.045,0,6.29);g.fill()}
    else{g.shadowColor='#ff9fd0';g.shadowBlur=8;g.fillStyle='#ffc2e3';g.beginPath();g.arc(0,0,cs*.1,0,6.29);g.fill();g.strokeStyle='#ff6fb1';g.lineWidth=2;g.beginPath();g.arc(0,0,cs*.06,k*9,k*9+3);g.stroke()}g.restore()}
  for(const b of T.balls){const k=Math.min(1,b.t/b.T);const p=b.p0+(b.c+.5-b.p0)*k;let[x,y]=S(b.l,p);const h=Math.sin(k*Math.PI)*cs*1.6;if(vert){x-=h*.35;y-=cs*.4}else y-=cs*.4+h;g.fillStyle='#ff8c42';g.beginPath();g.arc(x,y,cs*.12,0,6.29);g.fill();g.strokeStyle='#7a3a10';g.lineWidth=1.5;g.beginPath();g.moveTo(x-cs*.12,y);g.lineTo(x+cs*.12,y);g.moveTo(x,y-cs*.12);g.lineTo(x,y+cs*.12);g.stroke()}
  for(const u of T.units){if(!(u.beam>0))continue;const d=U[u.k];const[x0,y0]=S(u.l,u.c+.6),[x1,y1]=S(u.l,Math.min(9.6,u.c+.5+d.fume.range));const a=u.beam/.35;g.save();g.globalAlpha=a;g.strokeStyle='#ff6fd8';g.lineWidth=cs*.14*a;g.shadowColor='#ff3fd2';g.shadowBlur=20;g.lineCap='round';const oy=vert?0:-cs*.35,ox=0;g.beginPath();g.moveTo(x0+ox,y0+oy-(vert?cs*.3:0));g.lineTo(x1+ox,y1+oy-(vert?cs*.3:0));g.stroke();g.strokeStyle='#fff';g.lineWidth=cs*.04*a;g.stroke();g.restore()}
  for(const f of T.fire){const k=f.t/.9;const[x0,y0]=S(f.l,-.2),[x1,y1]=S(f.l,9.7);g.save();g.globalAlpha=(1-k)*.85;const gr=vert?g.createLinearGradient(x0-cs/2,0,x0+cs/2,0):g.createLinearGradient(0,y0-cs/2,0,y0+cs/2);gr.addColorStop(0,'rgba(255,80,0,0)');gr.addColorStop(.5,'#ffb347');gr.addColorStop(1,'rgba(255,80,0,0)');g.fillStyle=gr;if(vert)g.fillRect(x0-cs/2,y1,cs,y0-y1);else g.fillRect(x0,y0-cs/2,x1-x0,cs);
    for(let p=.3;p<9.7;p+=.45){const[fx,fy]=S(f.l,p);const hh=cs*(.9+.45*Math.sin(p*7+f.t*40))*(1-k*.7),ww=cs*.26;g.fillStyle=`rgba(255,${120+Math.floor(100*Math.sin(p*5+f.t*30)**2)},40,.9)`;g.beginPath();g.moveTo(fx-ww,fy);g.quadraticCurveTo(fx-ww*.3,fy-hh*.5,fx,fy-hh);g.quadraticCurveTo(fx+ww*.3,fy-hh*.5,fx+ww,fy);g.fill();g.fillStyle='rgba(255,240,180,.85)';g.beginPath();g.moveTo(fx-ww*.4,fy);g.quadraticCurveTo(fx,fy-hh*.5,fx,fy-hh*.55);g.quadraticCurveTo(fx,fy-hh*.5,fx+ww*.4,fy);g.fill()}g.restore()}
  if(T.wind>0){g.save();g.globalAlpha=T.wind*.5;g.strokeStyle='#fff';g.lineWidth=2;for(let i=0;i<14;i++){const yy=(i*97%H),xx=((1-T.wind)*W*1.5+i*53)%W;g.beginPath();g.moveTo(xx,yy);g.quadraticCurveTo(xx+40,yy-10,xx+90,yy);g.stroke()}g.restore()}
  for(const f of T.fx){const k=f.t/f.life;const[x,y]=S(f.l,f.p);g.globalAlpha=1-k;if(f.ring){g.strokeStyle=f.col;g.lineWidth=cs*.12*(1-k);g.beginPath();g.arc(x,y-cs*.3,cs*f.r*(.3+k),0,6.29);g.stroke()}else{g.fillStyle=f.col;g.beginPath();g.arc(x+f.dx*cs*.6*k,y-cs*.35+f.dy*cs*.6*k,cs*f.r*(1-k*.5),0,6.29);g.fill()}}g.globalAlpha=1;
  drawSfx();
  for(const th of T.thr){let[x,y]=S(th.lf,th.p);if(th.f>0)y-=th.f*cs*3.2;if(th.pop>0)y-=Math.sin((1-th.pop/.5)*Math.PI)*cs*.6;
    let a=1;if(!th.col&&th.f<=0&&th.life<2)a=.4+.6*Math.abs(Math.sin(th.t*6));
    if(th.col){const k=Math.min(1,th.ct/.45);const[tx,ty]=thPos();x+=(tx-x)*k;y+=(ty-y)*k;a=1-k*.3}
    th.sx=x;th.sy=y;
    if(th.own&&!th.col){g.save();const pr=(th.t*1.6)%1;g.globalAlpha=a*(1-pr)*.8;g.strokeStyle='#ffd86b';g.lineWidth=Math.max(2,cs*.05);g.beginPath();g.arc(x,y,cs*(.22+.3*pr),0,6.29);g.stroke();
      const gl=g.createRadialGradient(x,y,cs*.05,x,y,cs*.42);gl.addColorStop(0,'rgba(255,230,140,.55)');gl.addColorStop(1,'rgba(255,200,80,0)');g.globalAlpha=a;g.fillStyle=gl;g.beginPath();g.arc(x,y,cs*.42,0,6.29);g.fill();g.restore()}
    yarn(x,y,cs*(th.own?.26:th.amt<25?.16:.21),a,th.t);
    if(th.own&&!th.col&&th.t<1.6){g.save();g.globalAlpha=Math.min(1,(1.6-th.t)*1.5);g.font=`900 ${Math.round(cs*.24)}px 'Noto Sans KR',sans-serif`;g.textAlign='center';g.textBaseline='middle';g.lineWidth=4;g.strokeStyle='#5a3a00';const ty2=y-cs*.42-th.t*cs*.25;g.strokeText('+'+th.amt,x,ty2);g.fillStyle='#ffe08a';g.fillText('+'+th.amt,x,ty2);g.restore()}}
  g.restore();
  if(T.flash>0){g.fillStyle=`rgba(255,220,240,${T.flash*1.6})`;g.fillRect(0,0,W,H)}
  hud();
  if(T.banner){const k=T.banner.t;const a=k<.3?k/.3:k>2.5?Math.max(0,(3-k)/.5):1;g.save();g.globalAlpha=a;g.fillStyle='rgba(30,0,30,.55)';g.fillRect(0,H*.42,W,H*.1);g.font=`900 ${Math.min(30,W*.065)}px 'Noto Sans KR',sans-serif`;g.textAlign='center';g.textBaseline='middle';g.lineWidth=5;g.strokeStyle='#5a0030';g.strokeText(T.banner.tx,W/2,H*.47);g.fillStyle='#ffd1ea';g.fillText(T.banner.tx,W/2,H*.47);g.restore()}
  ariBox();if(T.st==='win'||T.st==='lose')endBox();if(T.st==='pause')pauseBox()}
function drawUnit(it,UD,t){const u=it.o,d=U[u.k],im=img(d.img);let fi=u.at>0?2+((u.at*8)|0)%2:((t*2.4+u.l+u.c)|0)%2;let D=cs*UD*(1+u.pop*.8),y=it.y,a=1,tint=null;
  if(d.mine&&u.t>0){D*=.62;a=.55;y+=cs*.05;tint='#e8c98a'}
  if(d.bomb||d.jala){D*=1+.15*Math.sin(t*30);tint=d.jala?'#ff8a00':'#ff6fa0'}
  if(d.tall)D*=1.12;if(d.spike){D*=.82;y+=cs*.02}if(d.blow){D*=1+.1*Math.sin(t*40)}
  if(d.umb){g.save();g.globalAlpha=.09+.04*Math.sin(t*2);g.fillStyle='#d8c8ff';g.beginPath();g.arc(it.x,it.y-cs*.35,cs*1.15,Math.PI,0);g.fill();g.restore()}
  if(d.chomp&&u.chew>0){fi=((t*5)|0)%2}
  if(d.squash&&u.jmp){const k=1-u.jmp/.6;const[tx,ty]=S(u.l,u.jp);it.x+=(tx-it.x)*k;y=y+(ty+cs*.4-y)*k-Math.sin(k*Math.PI)*cs*1.2}
  g.fillStyle='rgba(0,0,0,.28)';g.beginPath();g.ellipse(it.x,it.y-cs*.02,cs*.3,cs*.09,0,0,6.29);g.fill();
  if(d.wall){const r=u.hp/u.max;g.save();g.globalAlpha=.35+.25*Math.sin(t*2);g.strokeStyle=r>.66?'#bfe9ff':r>.33?'#ffe39a':'#ff9a9a';g.lineWidth=cs*.05;g.beginPath();g.arc(it.x,it.y-cs*.45,cs*.48,Math.PI*1.1,Math.PI*1.9);g.stroke();g.restore()}
  frame(im,fi,it.x,y,D,a,u.fl,tint);
  if(u.ladder)ladder(it.x+cs*.24,it.y-cs*.04,cs*.9,cs*.26,.18)
  if(d.chomp&&u.chew>0){g.fillStyle='#fff';g.font=`800 ${Math.round(cs*.18)}px 'Noto Sans KR',sans-serif`;g.textAlign='center';g.fillText('토닥토닥…',it.x,it.y-cs*1.15);const w=cs*.6;g.fillStyle='rgba(0,0,0,.5)';g.fillRect(it.x-w/2,it.y-cs*1.05,w,3);g.fillStyle='#ffd36b';g.fillRect(it.x-w/2,it.y-cs*1.05,w*(1-u.chew/d.chomp.chew),3)}
  if(d.mine&&u.t>0){const w=cs*.5;g.fillStyle='rgba(0,0,0,.5)';g.fillRect(it.x-w/2,it.y+cs*.04,w,3);g.fillStyle='#e8c98a';g.fillRect(it.x-w/2,it.y+cs*.04,w*(1-u.t/d.mine.arm),3)}
  else if(d.mine){g.globalAlpha=.6+.4*Math.sin(t*6);g.fillStyle='#ffe9a8';g.beginPath();g.arc(it.x,it.y-cs*.95,cs*.05,0,6.29);g.fill();g.globalAlpha=1}
  if(d.life){const w=cs*.5,r=Math.max(0,1-u.age/d.life);g.fillStyle='rgba(0,0,0,.45)';g.fillRect(it.x-w/2,it.y+cs*.1,w,3);g.fillStyle='#d9c2ff';g.fillRect(it.x-w/2,it.y+cs*.1,w*r,3)}
  if(u.hp<u.max){const w=cs*.6,r=Math.max(0,u.hp/u.max);g.fillStyle='rgba(0,0,0,.5)';g.fillRect(it.x-w/2,it.y+cs*.04,w,4);g.fillStyle=r>.5?'#7dff9a':r>.25?'#ffd36b':'#ff6b6b';g.fillRect(it.x-w/2,it.y+cs*.04,w*r,4)}}
function drawEnemy(it,t){const e=it.o,d=E[e.k],im=img(d.img);if(!ok(im))return;const a=(e.die?Math.max(0,1-e.die/.6):1)*Math.min(1,Math.max(0,(9.6+WALK-e.p)/.7));const w=cs*d.sz,h=w*im.naturalHeight/im.naturalWidth;
  if(e.under){g.save();g.translate(it.x,it.y);const mw=cs*.36,mh=cs*.2;const gr=g.createLinearGradient(0,-mh,0,0);gr.addColorStop(0,'#8a6238');gr.addColorStop(1,'#4e3419');g.fillStyle=gr;g.beginPath();g.moveTo(-mw,0);g.quadraticCurveTo(-mw*.5,-mh*1.2,0,-mh);g.quadraticCurveTo(mw*.5,-mh*1.2,mw,0);g.closePath();g.fill();
    g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(0,cs*.02,mw*1.05,cs*.06,0,0,6.29);g.fill();g.fillStyle='#a97d4f';for(let i=0;i<4;i++){const ph=e.bob*2.4+i*1.6,ox=Math.sin(ph)*mw*.6,oy=-mh*(.5+.6*Math.abs(Math.sin(ph*1.3)));g.beginPath();g.arc(ox,oy,cs*(.03+.015*(i%2)),0,6.29);g.fill()}
    g.fillStyle='#c5e07a';g.fillRect(mw*.5,-mh*.55,cs*.05,cs*.03);g.restore();return}
  let by3=it.y-Math.abs(Math.sin(e.bob))*cs*(e.eat?.03:.06);if(e.jump>0){by3-=Math.sin((1-e.jump/.75)*Math.PI)*cs*1.1}
  if(e.stick&&!e.eat&&!e.frz&&!e.stun)by3-=Math.abs(Math.sin(e.bob*.9))*cs*.3;
  let jx=0;if(e.box&&e.jt!=null&&e.jt<1.6&&!e.frz)jx=(Math.random()-.5)*cs*.08;it.x+=jx;
  if(e.fly||e.blown){by3-=cs*.55+Math.sin(e.bob*.6)*cs*.06;if(e.blown)by3-=e.die*cs*4;g.strokeStyle='rgba(255,255,255,.6)';g.lineWidth=1;g.beginPath();g.moveTo(it.x,by3-h*.9);g.lineTo(it.x,by3-h*1.25);g.stroke();g.fillStyle='#ff8fc8';g.beginPath();g.ellipse(it.x,by3-h*1.45,cs*.17,cs*.21,0,0,6.29);g.fill();g.fillStyle='rgba(255,255,255,.6)';g.beginPath();g.arc(it.x-cs*.06,by3-h*1.52,cs*.04,0,6.29);g.fill()}
  g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(it.x,it.y,w*.36,cs*.08,0,0,6.29);g.fill();
  g.save();g.globalAlpha=a;const sq=e.eat?1+.06*Math.sin(e.bob*1.3):1;g.translate(it.x,by3);g.scale(1/sq,sq);if(!vert&&(!!d.flip!==(e.dir>0)))g.scale(-1,1);g.drawImage(im,-w/2,-h,w,h);
  if(e.frz>0||e.stun>0){const wi=white(im,e.frz>0?'#bfe6ff':'#f5ff9a');if(wi){g.globalAlpha=a*.55;g.drawImage(wi,-w/2,-h,w,h)}}
  if(e.slow>0&&!e.frz&&!e.die){const m=FXM.st_slow,si=img(m.f);if(ok(si)){const idx=Math.floor(t*m.fps)%m.n;const sw=cs*.5,sh=sw*m.fh/m.fw;g.globalAlpha=a*.9;g.drawImage(si,(idx%m.c)*m.fw,Math.floor(idx/m.c)*m.fh,m.fw,m.fh,-sw/2,-h-sh*.9,sw,sh)}}
  if(e.slow>0){const wi=white(im,'#7fd4ff');if(wi){g.globalAlpha=a*.45;g.drawImage(wi,-w/2,-h,w,h)}}
  if(e.rage){const wi=white(im,'#ff3a3a');if(wi){g.globalAlpha=a*.35;g.drawImage(wi,-w/2,-h,w,h)}}
  if(e.fl>0){const wi=white(im);if(wi){g.globalAlpha=a*.6;g.drawImage(wi,-w/2,-h,w,h)}}g.restore();
  if(e.sh>0){const sw=w*.9,shh=h*.85;g.save();g.globalAlpha=a*(.35+.4*e.sh/e.shMax);const fx2=vert?it.x-sw/2:it.x-w*.55,fy2=vert?by3-shh*.2:by3-shh;if(vert){g.fillStyle='rgba(200,215,235,.55)';g.fillRect(it.x-sw/2,by3-cs*.1,sw,cs*.18);g.strokeStyle='#e8f0ff';g.lineWidth=1;for(let i=0;i<6;i++){g.beginPath();g.moveTo(it.x-sw/2+i*sw/5,by3-cs*.1);g.lineTo(it.x-sw/2+i*sw/5,by3+cs*.08);g.stroke()}}else{g.fillStyle='rgba(200,215,235,.55)';g.fillRect(fx2,fy2,cs*.16,shh);g.strokeStyle='#e8f0ff';g.lineWidth=1;for(let i=0;i<7;i++){g.beginPath();g.moveTo(fx2,fy2+i*shh/6);g.lineTo(fx2+cs*.16,fy2+i*shh/6);g.stroke()}}g.restore()}
  if(e.k==='flag'){g.save();g.globalAlpha=a;g.strokeStyle='#ddd';g.lineWidth=2;g.beginPath();g.moveTo(it.x+w*.25,by3-h*.6);g.lineTo(it.x+w*.25,by3-h*1.25);g.stroke();g.fillStyle='#ff5fa8';g.beginPath();g.moveTo(it.x+w*.25,by3-h*1.25);g.lineTo(it.x+w*.62,by3-h*1.12);g.lineTo(it.x+w*.25,by3-h*.98);g.fill();g.restore()}
  if(e.lad||e.box||e.stick||(e.mh>0&&e.hp>e.max-e.mh)){g.save();g.globalAlpha=a;
    if(e.lad)ladder(it.x-w*.42,by3,h*.95,cs*.24,-.12);
    if(e.box)giftBox(it.x+w*.3,by3-h*.4,cs*.24,e.jt!=null&&e.jt<1.6?Math.sin(e.bob*9)*.25:Math.sin(e.bob*.8)*.06);
    if(e.stick)spring(it.x,by3+cs*.02,cs*.32,cs*.18,e.eat||e.frz||e.stun?.6:.6+.5*Math.abs(Math.sin(e.bob*.9)));
    if(e.mh>0&&e.hp>e.max-e.mh&&E[e.k].metal>1&&d.img.startsWith('farm/')){const gr=g.createRadialGradient(it.x-w*.15,by3-h*.7,w*.05,it.x,by3-h*.55,w*.55);gr.addColorStop(0,'rgba(240,246,255,.55)');gr.addColorStop(.6,'rgba(170,190,215,.3)');gr.addColorStop(1,'rgba(120,140,170,0)');g.fillStyle=gr;g.beginPath();g.ellipse(it.x,by3-h*.55,w*.52,h*.44,0,0,6.29);g.fill()}
    g.restore()}
  if(d.pole&&!e.jumped){g.save();g.globalAlpha=a;g.strokeStyle='#e8d9b0';g.lineWidth=3;g.beginPath();g.moveTo(it.x-w*.55,by3-h*.3);g.lineTo(it.x+w*.45,by3-h*.75);g.stroke();g.restore()}
  if(e.hp<e.max&&!e.die){const bw=cs*.5,r=Math.max(0,e.hp/e.max);g.fillStyle='rgba(0,0,0,.5)';g.fillRect(it.x-bw/2,it.y-h-6,bw,3);g.fillStyle='#ff8ab8';g.fillRect(it.x-bw/2,it.y-h-6,bw*r,3)}}
function ladder(x,y,h,w,lean){g.save();g.translate(x,y);g.transform(1,0,lean||0,1,0,0);const rw=Math.max(2,w*.14);g.fillStyle='#6b4a22';g.fillRect(-w/2,-h,rw,h);g.fillRect(w/2-rw,-h,rw,h);g.fillStyle='#c9a062';g.fillRect(-w/2+rw*.3,-h,rw*.4,h);g.fillRect(w/2-rw*.7,-h,rw*.4,h);
  for(let i=1;i<=5;i++){const yy=-h*i/6;g.fillStyle='#8b5e2b';g.fillRect(-w/2+rw*.6,yy-rw*.4,w-rw*1.2,rw*.8);g.fillStyle='#e0b878';g.fillRect(-w/2+rw*.6,yy-rw*.4,w-rw*1.2,rw*.3)}g.restore()}
function spring(x,y,h,w,sq){g.save();g.translate(x,y);g.scale(1,sq);g.strokeStyle='#5f6b80';g.lineWidth=Math.max(2,w*.22);g.lineCap='round';g.beginPath();const n=5;for(let i=0;i<=n*2;i++){const yy=-h*i/(n*2),xx=(i%2?1:-1)*w/2*(i===0||i===n*2?0:1);if(i===0)g.moveTo(xx,yy);else g.lineTo(xx,yy)}g.stroke();g.strokeStyle='#c9d2e0';g.lineWidth=Math.max(1,w*.08);g.stroke();
  g.fillStyle='#3a4150';g.fillRect(-w*.7,-h-w*.15,w*1.4,w*.22);g.fillRect(-w*.7,-w*.08,w*1.4,w*.22);g.restore()}
function giftBox(x,y,s,wob){g.save();g.translate(x,y);g.rotate(wob||0);g.fillStyle='#7a3fc9';g.fillRect(-s/2,-s,s,s);g.fillStyle='#b48cff';g.fillRect(-s/2,-s,s,s*.18);g.fillStyle='#ffd36b';g.fillRect(-s*.09,-s,s*.18,s);g.fillRect(-s/2,-s*.62,s,s*.16);g.fillStyle='#ffe9a8';g.beginPath();g.arc(-s*.16,-s*1.06,s*.14,0,6.29);g.arc(s*.16,-s*1.06,s*.14,0,6.29);g.fill();
  g.fillStyle='#fff';g.font=`900 ${Math.round(s*.6)}px sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillText('?',0,-s*.32);g.restore()}
function thPos(){return vert?[34,32]:[34,30]}
function btn(id,x,y,w,h,fn,top){UI.push({id,x,y,w,h,fn,top})}
function cardFace(k,x,y,cw,ch,sel){const d=U[k];g.save();rr(x+3,y+3,cw-6,ch-24,8);g.clip();g.fillStyle=sel?'#ffd0ea':'#3f2a55';g.fillRect(x,y,cw,ch);const im=img(d.img);if(ok(im)){const fw=im.naturalHeight;g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';const s=Math.max(cw-6,ch-24)*1.3;g.drawImage(im,fw*.12,0,fw*.76,fw*.76,x+cw/2-s/2,y+2,s,s)}g.restore()}
function hud(){g.textBaseline='middle';
  const[tx,ty]=thPos();g.fillStyle='rgba(20,10,40,.78)';rr(tx-24,ty-19,92,38,19);g.fill();g.strokeStyle='rgba(160,236,255,.6)';g.lineWidth=1.5;g.stroke();yarn(tx-4,ty,11,1,T.t);g.fillStyle='#fff';g.font="800 18px 'Noto Sans KR',sans-serif";g.textAlign='left';g.fillText(T.th,tx+14,ty+1);
  const bs=36,rx=W-10-bs;/* 세로 화면: 빼기(✂️)는 위쪽 버튼 → 카드 칸이 넓어짐 */
  const vl=tx+72,vr=rx-2*(bs+6)-8,lch=Math.min(88,Math.max(68,H*.14)),hl=118+(T.deck.length+1)*(lch*.76+5)+8,hr=rx-bs-16,pw=vert?Math.min(150,vr-vl-8):Math.max(70,Math.min(220,hr-hl)),px=vert?(vl+vr)/2-pw/2:hr-pw,py=vert?24:22;const k=Math.min(1,T.t/T.lastT);
  g.fillStyle='rgba(0,0,0,.5)';rr(px,py,pw,10,5);g.fill();g.fillStyle='#ff9fd0';rr(px,py,Math.max(10,pw*k),10,5);g.fill();
  for(const w of T.wv)if(w.flag){const fx=px+pw*Math.min(1,w.t/T.lastT);g.font='13px sans-serif';g.textAlign='center';g.fillText('🚩',fx,py-3)}
  g.font="700 11px 'Noto Sans KR',sans-serif";g.fillStyle='#ffe6f4';g.textAlign='center';g.fillText(`${sid(T.si)} ${STG[T.si].name}`,px+pw/2,py+22);
  const bb=(id,x,lab,fn,on)=>{g.fillStyle=on?'rgba(255,140,200,.9)':'rgba(20,10,40,.78)';rr(x,12,bs,bs,10);g.fill();g.strokeStyle='rgba(255,214,234,.6)';g.lineWidth=1.5;g.stroke();g.fillStyle='#fff';g.font=`800 ${lab.length>2?12:16}px 'Noto Sans KR',sans-serif`;g.textAlign='center';g.fillText(lab,x+bs/2,12+bs/2+1);btn(id,x,12,bs,bs,fn)};
  bb('pause',rx,'⏸',()=>{if(T.st==='play'){T.st='pause';snd('sel')}});bb('spd',rx-bs-6,'×2',()=>{T.speed=T.speed===1?2:1;snd('sel')},T.speed===2);
  if(vert)bb('shovel',rx-2*(bs+6),'✂️',()=>{if(T.st!=='play')return;T.sel=null;T.shovel=!T.shovel;snd('sel')},T.shovel);
  const n=T.deck.length+(vert?0:1);let cw,ch,cx,cy,gap=5;
  if(vert){ch=Math.min(100,Math.max(80,H*.11));cw=Math.min(72,(W-16-gap*(n-1))/n);cx=(W-(cw*n+gap*(n-1)))/2;cy=H-ch-8}
  else{ch=Math.min(88,Math.max(68,H*.14));cw=ch*.76;cx=118;cy=8}
  T.cards.forEach((c,i)=>{const d=U[c.k],x=cx+i*(cw+gap),y=cy,can=T.th>=d.cost&&c.cd<=0,sel=T.sel===c.k;
    g.save();g.fillStyle=sel?'#ffe1f1':'#2a1838';rr(x,y,cw,ch,10);g.fill();g.lineWidth=sel?3:1.5;g.strokeStyle=sel?'#ff6fb1':'rgba(255,214,234,.55)';g.stroke();
    cardFace(c.k,x,y,cw,ch,sel);g.fillStyle=sel?'#5a1a40':'#fff';g.font=`800 ${cw<60?11:13}px 'Noto Sans KR',sans-serif`;g.textAlign='center';g.fillText(d.max?`🧵${d.cost} ${T.units.filter(u=>u.k===c.k).length}/${d.max}`:'🧵'+d.cost,x+cw/2,y+ch-11);
    if(!can){g.fillStyle='rgba(10,0,20,.55)';rr(x,y,cw,ch,10);g.fill()}
    if(c.cd>0){const r=c.cd/d.cd;g.fillStyle='rgba(0,0,0,.45)';g.fillRect(x,y,cw,ch*r);g.fillStyle='#fff';g.font="700 12px sans-serif";g.fillText(Math.ceil(c.cd)+'s',x+cw/2,y+ch/2)}
    g.restore();btn('card'+i,x,y,cw,ch,()=>{if(T.st!=='play')return;if(!can){snd('no');return}T.shovel=false;T.sel=sel?null:c.k;snd('sel')})});
  if(vert)return;const x=cx+T.deck.length*(cw+gap),y=cy;g.fillStyle=T.shovel?'#ffe1f1':'#2a1838';rr(x,y,cw,ch,10);g.fill();g.strokeStyle=T.shovel?'#ff6fb1':'rgba(255,214,234,.55)';g.lineWidth=T.shovel?3:1.5;g.stroke();g.font=`${Math.min(28,cw*.4)}px sans-serif`;g.textAlign='center';g.fillText('✂️',x+cw/2,y+ch*.42);g.fillStyle=T.shovel?'#5a1a40':'#ffe6f4';g.font="700 11px 'Noto Sans KR',sans-serif";g.fillText('빼기',x+cw/2,y+ch-12);
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
let MCH=-1;function mapScr(){const w=Math.min(W-20,460),x=(W-w)/2;let y=18;g.textAlign='center';g.textBaseline='middle';
  if(MCH<0)MCH=Math.min(CHS.length-1,Math.floor(Math.min(SV.cl,STG.length-1)/10));const ch=CHS[MCH],base=MCH*10;
  g.fillStyle='#ffd1ea';g.font="900 22px 'Noto Sans KR',sans-serif";g.fillText('🌷 마음의 정원',W/2,y+16);g.fillStyle='#cfe8ff';g.font="700 14px 'Noto Sans KR',sans-serif";g.fillText(ch.name,W/2,y+44);
  if(MCH>0)pbtn('chp',W/2-w/2,y+28,40,32,'◀',false,()=>{MCH--;snd('sel')});const nextOpen=MCH<CHS.length-1&&SV.cl>=base+10;
  if(MCH<CHS.length-1)pbtn('chn',W/2+w/2-40,y+28,40,32,'▶',false,()=>{MCH++;snd('sel')},!nextOpen);
  pbtn('mx',W-52,10,42,36,'✕',false,()=>GD.close());
  const lx0=(SV.dev||window.GD_DEV)?108:10;pbtn('opv',lx0,10,44,36,'🎬',false,()=>{snd('sel');opening()});
  if(canRot())pbtn('rot',W-52-52,10,44,36,'🔄',false,toggleRot);
  if(SV.dev||window.GD_DEV)pbtn('dv',10,10,92,36,SV.cl>=STG.length?'🧪 처음부터':'🧪 전부 열기',false,()=>{if(SV.cl>=STG.length){SV.cl=0;delete SV.dv}else{SV.cl=STG.length;SV.dv=1}save()});
  const own=owned(SV.cl);g.fillStyle='#ddd';g.font="600 12px 'Noto Sans KR',sans-serif";g.fillText(`합류한 대원 ${own.length}명 · 데려갈 수 있는 대원 ${deckMax(base)}명`,W/2,y+70);
  const cols=vert?2:5,gap=10,bw=(w-gap*(cols-1))/cols,bh=vert?Math.min(72,(H-200)/5-gap):Math.min(96,(H-210)/2-gap);y+=90;
  ch.stages.forEach((st,ii)=>{const i=base+ii,cx=x+(ii%cols)*(bw+gap),cy=y+Math.floor(ii/cols)*(bh+gap);const open=i<=SV.cl,clr=i<SV.cl;
    g.fillStyle=!open?'rgba(255,255,255,.05)':clr?'rgba(120,200,255,.18)':'rgba(255,120,190,.28)';rr(cx,cy,bw,bh,14);g.fill();g.strokeStyle=open&&!clr?'#ff8fc8':'rgba(255,214,234,.35)';g.lineWidth=open&&!clr?2.5:1.2;g.stroke();
    g.textAlign='left';g.fillStyle=open?'#fff':'#777';g.font="900 16px 'Noto Sans KR',sans-serif";const nar=bw<150;g.fillText(sid(i),cx+12,cy+bh*(nar?.24:.34));g.font="600 12px 'Noto Sans KR',sans-serif";g.fillText(open?st.name:'???',cx+12,cy+bh*(nar?.52:.68));
    g.textAlign='right';g.font=(bw<150?'16px':'20px')+' sans-serif';g.fillText(clr?'✅':open?'▶':'🔒',cx+bw-8,cy+(bw<150?bh*.26:bh/2));
    if(open){const rw=reward(i,SV.n[i]||0),nar=bw<150;g.textAlign='left';g.font="900 16px 'Noto Sans KR',sans-serif";const sw=g.measureText(sid(i)).width;g.font="800 10.5px 'Noto Sans KR',sans-serif";g.fillStyle=rw.lb?'#9fe8ff':'#ffe08a';g.fillText(rw.lb?'🖼️ 로비':`🪙${rw.g.toLocaleString()}`,nar?cx+12:cx+18+sw,nar?cy+bh*.8:cy+bh*.34+1)}
    if(st.gift&&!clr&&open){const im=img(U[st.gift].img),sl=white(im,'#0a0614');if(sl){g.save();g.globalAlpha=.85;{const nar=bw<150,sz=nar?Math.min(bh*.5,bw*.42):Math.min(bh-8,bw*.5);g.drawImage(sl,0,0,im.naturalHeight,im.naturalHeight,nar?cx+bw-sz-4:cx+bw-30-sz,nar?cy+bh-sz-4:cy+(bh-sz)/2,sz,sz)}g.restore()}}
    if(open)btn('st'+i,cx,cy,bw,bh,()=>goStage(i),1)});
  ariMini(SV.cl>=STG.length?'장수 토마토 밭까지 다 지켰어요! 다음 장은 준비 중이에요. ✨':SV.cl===20&&MCH===2?'장수 토마토 밭이에요. 토마토 덤불에서 무수리가 기어 나와요. 🍅':SV.cl===0?'어머, 언니. 정원에 무수리가 와요. 1-1부터 같이 막아 봐요.':SV.cl===10&&MCH===1?'상봉 네온 정원이에요. 여기 무수리들은 좀 더 영악해요. 💅':'다음 스테이지에 새 대원이 기다리고 있어요. 💅')}
function ariMini(tx){const w=Math.min(W-20,460),x=(W-w)/2,y=H-84;g.fillStyle='rgba(28,14,48,.92)';rr(x,y,w,70,14);g.fill();g.strokeStyle='rgba(160,236,255,.6)';g.lineWidth=1.2;g.stroke();const im=img(FACE.w);if(ok(im)){g.save();rr(x+8,y+7,56,56,10);g.clip();g.drawImage(im,x+8,y+7,56,56);g.restore()}
  g.textAlign='left';g.textBaseline='top';g.fillStyle='#9fe8ff';g.font="800 11px 'Noto Sans KR',sans-serif";g.fillText('아리아드네',x+74,y+9);g.fillStyle='#fff';g.font="600 13px 'Noto Sans KR',sans-serif";wrap(tx,w-86).slice(0,2).forEach((l,i)=>g.fillText(l,x+74,y+27+i*18));g.textBaseline='middle'}
function goStage(i){if(i>=20&&!SV.c3){SV.c3=1;save();scene('c3',()=>goStage(i));return}snd('sel');DECK_MAX=deckMax(i);const own=owned(SV.cl);let deck=(SV.deck||[]).filter(k=>own.includes(k));
  if(own.length<=DECK_MAX){start(i,own);return}
  if(!deck.length)deck=own.slice(0,DECK_MAX);PICK=deck.slice(0,DECK_MAX);PV=null;DSX=0;T={si:i,pick:1};SCR='deck'}
function start(i,deck){SV.deck=deck.slice();save();newGame(i,deck,(Date.now()%9973)+1);SCR='play';last=0;bgm(stageBgm(i))}
/* --- 화면: 덱 고르기 --- */
let PV=null,DSX=0,DRAG=null;
function deckScr(){const own=owned(SV.cl);const w=Math.min(W-16,560),x=(W-w)/2;g.textAlign='center';g.textBaseline='middle';
  if(!PV||!own.includes(PV))PV=PICK[PICK.length-1]||own[0];
  /* 위: 고른 대원 */
  const ps=Math.min(vert?64:H<500?46:76,(w-8*(DECK_MAX-1))/DECK_MAX),gap=8,px0=x+(w-(ps*DECK_MAX+gap*(DECK_MAX-1)))/2,py0=14;
  g.fillStyle='#ffd1ea';g.font="900 15px 'Noto Sans KR',sans-serif";g.textAlign='left';g.fillText(`${sid(T.si)} 함께 갈 대원 ${PICK.length}/${DECK_MAX}`,x+4,py0+8);g.textAlign='center';
  const ty=py0+26;for(let i=0;i<DECK_MAX;i++){const k=PICK[i],cx=px0+i*(ps+gap);g.fillStyle=k?'#3a2250':'rgba(255,255,255,.05)';rr(cx,ty,ps,ps,10);g.fill();g.strokeStyle=k?(k===PV?'#ff6fb1':'rgba(255,214,234,.5)'):'rgba(255,255,255,.12)';g.lineWidth=k===PV?3:1.2;g.setLineDash(k?[]:[4,4]);g.stroke();g.setLineDash([]);
    if(k){const im=img(U[k].img);if(ok(im)){const fw=im.naturalHeight;g.save();rr(cx+2,ty+2,ps-4,ps-4,8);g.clip();g.drawImage(im,fw*.12,0,fw*.76,fw*.76,cx-ps*.15,ty-ps*.05,ps*1.3,ps*1.3);g.restore()}
      btn('pd'+i,cx,ty,ps,ps,()=>{snd('sel');PV=k},1)}}
  /* 아래: 보유 대원 (옆으로 넘기기) */
  const lh=vert?Math.min(118,H*.17):Math.min(128,H*.24),ly=H-lh-60,lw=lh*.78,lg=8;const totalW=own.length*(lw+lg)-lg;const maxS=Math.max(0,totalW-w);DSX=Math.max(0,Math.min(maxS,DSX));
  g.fillStyle='rgba(255,255,255,.04)';rr(x,ly-6,w,lh+12,14);g.fill();
  g.save();g.beginPath();g.rect(x,ly-8,w,lh+16);g.clip();
  own.forEach((k,i)=>{const d=U[k],cx=x+i*(lw+lg)-DSX,cy=ly;if(cx>x+w||cx+lw<x)return;const on=PICK.includes(k);
    g.fillStyle=on?'#ffe1f1':'#2a1838';rr(cx,cy,lw,lh,12);g.fill();g.strokeStyle=k===PV?'#ff6fb1':on?'#ffb3d6':'rgba(255,214,234,.35)';g.lineWidth=k===PV?3:1.2;g.stroke();
    const im=img(d.img);if(ok(im)){const fw=im.naturalHeight;g.save();rr(cx+2,cy+2,lw-4,lh-30,10);g.clip();const D=lh-30;g.drawImage(im,fw*.1,0,fw*.8,fw*.8,cx+lw/2-D*.62,cy-D*.02,D*1.24,D*1.24);g.restore()}
    g.fillStyle=on?'#5a1a40':'#fff';g.font=`800 ${lw<70?10:11}px 'Noto Sans KR',sans-serif`;g.fillText(d.n,cx+lw/2,cy+lh-18);g.font="700 10px 'Noto Sans KR',sans-serif";g.fillStyle=on?'#7a3a60':'#9fe8ff';g.fillText('🧵'+d.cost,cx+lw/2,cy+lh-7);
    if(on){g.fillStyle='#ff6fb1';g.beginPath();g.arc(cx+lw-10,cy+10,8,0,6.29);g.fill();g.fillStyle='#fff';g.font="900 11px sans-serif";g.fillText('✓',cx+lw-10,cy+11)}
    btn('pk'+i,cx,cy,lw,lh,()=>{snd('sel');PV=k},1)});
  g.restore();
  if(maxS>0){g.fillStyle='rgba(255,255,255,.12)';rr(x+20,ly+lh+9,w-40,3,1.5);g.fill();g.fillStyle='#ff9fd0';const bw=(w-40)*w/totalW;rr(x+20+(w-40-bw)*DSX/maxS,ly+lh+9,bw,3,1.5);g.fill()}
  btn('strip',x,ly-8,w,lh+16,()=>{},1);
  /* 가운데: 지금 보는 대원 (세로 = 위아래, 납작한 가로 = 좌우) */
  const d=U[PV],my=ty+ps+8,mh=ly-12-my,on=PICK.includes(PV);const bw2=Math.min(170,(w-30)/2),bh=40;const im=img(d.img),t2=performance.now()/1000;
  const side=mh<270;const D=side?Math.min(mh-8,220):Math.min(mh-150,300,w*.6);const lines=wrap(d.desc,side?w*.58:w-40);const th=22+20+lines.length*16+(d.up?16:0)+8+bh;const off=side?0:Math.max(0,(mh-(D+12+th))/2);
  const cxI=side?x+w*.27:x+w/2,cxT=side?x+w*.68:x+w/2,tw=side?w*.58:w-40;
  const gl=g.createRadialGradient(cxI,my+(side?mh/2:off+D*.55),10,cxI,my+(side?mh/2:off+D*.55),D*.6);gl.addColorStop(0,'rgba(255,190,230,.35)');gl.addColorStop(1,'rgba(255,190,230,0)');g.fillStyle=gl;g.fillRect(x,my,w,mh);
  const fy=side?my+mh/2+D/2:my+off+D;frame(im,((t2*2.4)|0)%2,cxI,fy,D,1,0);
  let yy=side?my+(mh-th)/2+8:my+off+D+12;
  g.fillStyle='#fff';g.font="900 17px 'Noto Sans KR',sans-serif";g.fillText(`${d.n} · ${d.sk}`,cxT,yy);yy+=22;
  g.fillStyle='#9fe8ff';g.font="800 13.5px 'Noto Sans KR',sans-serif";g.fillText(`${d.role}   🧵${d.cost}`,cxT,yy);yy+=20;
  g.fillStyle='#ddd';g.font="600 12px 'Noto Sans KR',sans-serif";lines.forEach((l,i)=>g.fillText(l,cxT,yy+i*16));yy+=lines.length*16;
  if(d.up){g.fillStyle='#ffd36b';g.font="700 11px 'Noto Sans KR',sans-serif";g.fillText(`${U[d.up].n} ${U[d.up].sk} 위에 겹쳐 심어요.`,cxT,yy+2);yy+=16}
  const by0=Math.min(ly-12-bh,yy+6);
  pbtn('tog',cxT-bw2/2,by0,bw2,bh,on?'덱에서 빼기':(PICK.length>=DECK_MAX?'덱이 가득 찼어요':'덱에 넣기'),!on,()=>{snd('sel');const j=PICK.indexOf(PV);if(j>=0)PICK.splice(j,1);else if(PICK.length<DECK_MAX)PICK.push(PV);else snd('no')},!on&&PICK.length>=DECK_MAX);
  pbtn('dgo',W/2+6,H-52,Math.min(160,w/2-10),42,'출발',true,()=>start(T.si,PICK),!PICK.length);pbtn('dbk',W/2-6-Math.min(160,w/2-10),H-52,Math.min(160,w/2-10),42,'뒤로',false,()=>{SCR='map';T=null;MCH=-1;bgm('lobby')})}
/* --- 화면: 로비 꾸미기 보상 --- */
function lobbyScr(){const k=RES.rw.lb,w=Math.min(W-24,520),h=Math.min(H-30,(w-36)*572/1024+172);const[x,y]=panel(w,h,false);g.textAlign='center';g.textBaseline='middle';const t=performance.now()/1000;
  g.fillStyle='#ffd1ea';g.font="900 20px 'Noto Sans KR',sans-serif";g.fillText('✨ 로비 꾸미기 보상!',x+w/2,y+30);
  const im=img('fx/lobby_'+k+'.jpg'),iw=w-36,ih=Math.min(iw*572/1024,h-170);if(ok(im)){g.save();rr(x+18,y+54,iw,ih,12);g.clip();const s=Math.max(iw/im.naturalWidth,ih/im.naturalHeight);g.drawImage(im,x+18+(iw-im.naturalWidth*s)/2,y+54+(ih-im.naturalHeight*s)/2,im.naturalWidth*s,im.naturalHeight*s);
    g.globalAlpha=.25+.15*Math.sin(t*2);const gl=g.createLinearGradient(x,y,x+w,y+h);gl.addColorStop(0,'rgba(255,255,255,0)');gl.addColorStop(.5,'rgba(255,255,255,.5)');gl.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gl;g.fillRect(x+18,y+54,iw,ih);g.restore()}
  g.strokeStyle='rgba(255,190,230,.8)';g.lineWidth=2;rr(x+18,y+54,iw,ih,12);g.stroke();
  g.fillStyle='#fff';g.font="900 18px 'Noto Sans KR',sans-serif";g.fillText(LOB[k],x+w/2,y+54+ih+24);g.fillStyle='#ddd';g.font="600 12.5px 'Noto Sans KR',sans-serif";g.fillText('옷장 → 🏠 로비 꾸미기에서 로비 배경으로 고를 수 있어요.',x+w/2,y+54+ih+48);
  pbtn('lok',x+w/2-80,y+h-50,160,38,'좋아요',true,nextQ)}
/* --- 장면: 오프닝·3장 입장·3-10 엔딩 (그림 + 아리아드네 대사, 탭해서 넘김) --- */
const SCN={
  op:{img:'garden/op_ari.jpg',L:['어머, 언니. 와 줬네요.','여긴 대원들 마음이 자라는 「마음의 정원」이에요. 그런데 요즘 무수리들이 자꾸 선을 넘어와요.','제가 실로 방어벽을 짜 둘게요. 언니는 대원들을 심어서 마음의 선을 지켜 줘요. 💅']},
  c3:{img:'garden/ch3_tomato.jpg',L:['장수 토마토 밭이에요… 어머, 저기 봐요.','토마토들이 방어벽 앞까지 몰려왔어요. 밭 덤불 속에서도 기어 나오고요.','실은 제가 꽉 붙잡고 있을게요. 언니는 한 줄도 내주지 마요.']},
  end:{img:'garden/end_ari.jpg',L:['…끝났어요. 방어벽이 버텼어요.','언니 덕분에 정원이 다시 조용해졌네요. 역시 제가 사람 보는 눈은 있다니까요.','이건 선물이에요. 요정들이 사는 고향으로 가는 길, 언니 로비에 열어 둘게요. ✨']}};
let SC=null;function scene(k,then){SC={k,i:0,t:0,then};SCR='scene';bgm('lobby')}
function sceneScr(){const S=SCN[SC.k],im=img(S.img);SC.t+=1/60;g.fillStyle='#000';g.fillRect(0,0,W,H);
  if(ok(im)){const s=Math.max(W/im.naturalWidth,H/im.naturalHeight)*(1+.03*Math.min(1,SC.t/8));const iw=im.naturalWidth*s,ih=im.naturalHeight*s;g.globalAlpha=Math.min(1,SC.t*2);g.drawImage(im,(W-iw)/2,(H-ih)/2,iw,ih);g.globalAlpha=1}
  const gr=g.createLinearGradient(0,H*.55,0,H);gr.addColorStop(0,'rgba(10,4,24,0)');gr.addColorStop(1,'rgba(10,4,24,.85)');g.fillStyle=gr;g.fillRect(0,H*.55,W,H*.45);
  const w=Math.min(W-20,560),x=(W-w)/2,lines=(()=>{g.font="600 15px 'Noto Sans KR',sans-serif";return wrap(S.L[SC.i],w-100)})(),bh=Math.max(78,lines.length*22+34),y=H-bh-18;
  g.fillStyle='rgba(28,14,48,.9)';rr(x,y,w,bh,16);g.fill();g.strokeStyle='rgba(160,236,255,.7)';g.lineWidth=1.5;g.stroke();
  const f=img(FACE.w);if(ok(f)){g.save();rr(x+10,y+(bh-64)/2,64,64,12);g.clip();g.drawImage(f,x+10,y+(bh-64)/2,64,64);g.restore()}
  g.textAlign='left';g.textBaseline='top';g.fillStyle='#9fe8ff';g.font="800 12px 'Noto Sans KR',sans-serif";g.fillText('아리아드네',x+86,y+12);g.fillStyle='#fff';g.font="600 15px 'Noto Sans KR',sans-serif";lines.forEach((l,i)=>g.fillText(l,x+86,y+32+i*22));
  g.textAlign='right';g.fillStyle='rgba(255,255,255,'+(.4+.4*Math.abs(Math.sin(SC.t*3)))+')';g.font="700 11px 'Noto Sans KR',sans-serif";g.fillText(SC.i<S.L.length-1?'눌러서 계속 ▶':'눌러서 시작 ▶',x+w-14,y+bh-18);g.textBaseline='middle';
  pbtn('skip',W-78,12,66,32,'건너뛰기',false,()=>{const th=SC.then;SC=null;th&&th()});
  UI.push({id:'scn',top:1,x:0,y:0,w:W,h:H,fn:()=>{if(SC.t<.25)return;SC.i++;SC.t=.3;if(SC.i>=S.L.length){const th=SC.then;SC=null;th&&th()}}})}
/* --- 오프닝 영상 (첫 입장 · 지도의 🎬) --- */
let VID=null;function playOp(then){bgm('none');const box=document.createElement('div');box.style.cssText=cv.style.cssText+';background:#000;z-index:2;display:flex;align-items:center;justify-content:center';box.style.width=W+'px';box.style.height=H+'px';
  const v=document.createElement('video');v.src=(window.GD_ASSET&&window.GD_ASSET['garden/op.mp4'])||BASE+'garden/op.mp4';v.playsInline=true;v.setAttribute('playsinline','');v.preload='auto';v.style.cssText='width:100%;height:100%;object-fit:contain';
  let vl=.7;try{const h=HOST();if(h&&h.vol)vl=h.vol()}catch(e){}v.volume=Math.max(0,Math.min(1,vl));
  const sk=document.createElement('button');sk.type='button';sk.textContent='건너뛰기 ▶';sk.style.cssText="position:absolute;right:12px;top:12px;padding:8px 14px;border-radius:12px;border:1px solid rgba(255,214,234,.6);background:rgba(20,10,40,.7);color:#fff;font:800 13px 'Noto Sans KR',sans-serif;z-index:3";
  const done=()=>{if(!VID)return;VID=null;try{v.pause()}catch(e){}box.remove();then&&then()};v.onended=done;v.onerror=done;sk.onclick=e=>{e.stopPropagation();done()};box.onclick=()=>{if(v.paused)v.play().catch(()=>{})};
  box.appendChild(v);box.appendChild(sk);ov.appendChild(box);VID={box,v};v.play().catch(()=>{v.muted=true;v.play().catch(done)})}
function opening(back){playOp(()=>scene('op',()=>{if(!SV.op){SV.op=1;save()}SCR='map';MCH=-1;bgm('lobby');if(back)back()}))}
/* --- 화면: 새 대원 합류 --- */
function giftScr(){const k=RES.gift,d=U[k];const w=Math.min(W-24,380),h=Math.min(H-40,460);const[x,y]=panel(w,h,false);const t=performance.now()/1000;g.textAlign='center';g.textBaseline='middle';
  g.fillStyle='#ffd1ea';g.font="900 20px 'Noto Sans KR',sans-serif";g.fillText('✨ 새 대원 합류!',x+w/2,y+32);
  const im=img(d.img),D=Math.min(w-80,h-200);const gl=g.createRadialGradient(x+w/2,y+60+D/2,10,x+w/2,y+60+D/2,D*.6);gl.addColorStop(0,'rgba(255,190,230,.45)');gl.addColorStop(1,'rgba(255,190,230,0)');g.fillStyle=gl;g.fillRect(x,y+50,w,D+20);
  frame(im,((t*2.4)|0)%2,x+w/2,y+60+D,D,1,0);
  g.fillStyle='#fff';g.font="900 18px 'Noto Sans KR',sans-serif";g.fillText(`${d.n} · ${d.sk}`,x+w/2,y+h-112);g.fillStyle='#9fe8ff';g.font="800 14px 'Noto Sans KR',sans-serif";g.fillText(`${d.role}   🧵${d.cost}`,x+w/2,y+h-88);
  g.fillStyle='#ddd';g.font="600 12.5px 'Noto Sans KR',sans-serif";wrap(d.desc,w-40).forEach((l,i)=>g.fillText(l,x+w/2,y+h-64+i*17));
  pbtn('gok',x+w/2-80,y+h-34-8,160,38,'좋아요',true,nextQ)}
function nextQ(){const k=RES&&RES.q&&RES.q.shift();if(k==='end')scene('end',nextQ);else if(k==='lobby')SCR='lobby';else if(k==='gift')SCR='gift';else{SCR='map';T=null;MCH=-1;bgm('lobby')}}
function endBox(){const w=Math.min(W-24,360),h=T.st==='win'?236:200;const[x,y]=panel(w,h);const win=T.st==='win';g.textAlign='center';g.textBaseline='middle';
  g.fillStyle=win?'#ffd1ea':'#ffb3b3';g.font="900 22px 'Noto Sans KR',sans-serif";g.fillText(win?'🌷 정원을 지켰어요!':'💔 마음의 선이 뚫렸어요',x+w/2,y+38);
  g.fillStyle='#ddd';g.font="600 13px 'Noto Sans KR',sans-serif";g.fillText(`버틴 시간 ${Math.floor(T.t/60)}:${String(Math.floor(T.t%60)).padStart(2,'0')} · 무수리 ${T.kills}마리`,x+w/2,y+70);
  if(win&&RES&&RES.rw){const rw=RES.rw;g.fillStyle='rgba(255,214,234,.12)';rr(x+20,y+86,w-40,40,12);g.fill();g.fillStyle=rw.lb?'#9fe8ff':'#ffe08a';g.font="900 16px 'Noto Sans KR',sans-serif";
    g.fillText(rw.lb?`🖼️ 로비 꾸미기 · ${LOB[rw.lb]}`:`🪙 ${rw.g.toLocaleString()}G`,x+w/2,y+101);g.fillStyle='#cbb8d8';g.font="600 11px 'Noto Sans KR',sans-serif";g.fillText(RES.np?`${RES.np+1}번째 클리어 · 다시 깰수록 골드가 줄어요`:'첫 클리어 보상',x+w/2,y+119)}
  if(win)pbtn('next',x+20,y+h-64,w-40,44,RES&&RES.q&&RES.q.length?(RES.q[0]==='gift'?'새 대원 만나기':'보상 받기'):'정원 지도로',true,nextQ);
  else{pbtn('again',x+20,y+h-64,(w-50)/2,44,'다시 하기',true,()=>start(T.si,T.deck));pbtn('out',x+30+(w-50)/2,y+h-64,(w-50)/2,44,'지도로',false,()=>{SCR='map';T=null;MCH=-1;bgm('lobby')})}}
function pauseBox(){const cr=canRot(),w=Math.min(W-24,300),h=cr?268:220;const[x,y]=panel(w,h);if(cr)pbtn('prot',x+30,y+208,w-60,40,ROT?'📱 세로로 보기':'📱 가로로 보기',false,toggleRot);g.textAlign='center';g.fillStyle='#fff';g.font="900 20px 'Noto Sans KR',sans-serif";g.fillText('일시정지',x+w/2,y+34);
  pbtn('resume',x+30,y+64,w-60,40,'계속하기',true,()=>{T.st='play'});pbtn('retry',x+30,y+112,w-60,40,'처음부터',false,()=>start(T.si,T.deck));pbtn('quit',x+30,y+160,w-60,40,'지도로',false,()=>{SCR='map';T=null;MCH=-1;bgm('lobby')})}

/* ---------- 입력 ---------- */
function pt(e){if(ROT)return[e.clientY,window.innerWidth-e.clientX];const r=cv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]}
function canRot(){return window.innerHeight>window.innerWidth||ROT}
function toggleRot(){SV.rot=SV.rot?0:1;save();layout();snd('sel')}
function down(e){e.preventDefault();const[x,y]=pt(e);
  const top=UI.filter(b=>b.top);const list=top.length?top:UI;
  if(SCR==='deck'){const st=UI.find(b=>b.id==='strip');if(st&&x>=st.x&&x<=st.x+st.w&&y>=st.y&&y<=st.y+st.h){DRAG={x0:x,y0:y,s0:DSX,mv:0,pid:e.pointerId};try{cv.setPointerCapture(e.pointerId)}catch(_){}return}}
  for(const b of list)if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h){b.fn();return}
  if(SCR!=='play'||!T||T.st!=='play')return;
  let best=null,bd=cs*.8;for(const th of T.thr){if(th.col||th.sx==null)continue;const d=Math.hypot(th.sx-x,th.sy-y);if(d<bd){bd=d;best=th}}
  if(best){collect(best);return}
  const c=cellAt(x,y);if(!c)return;
  if(T.shovel){const u=T.units.find(u=>u.l===c.l&&u.c===c.c);if(u){T.units=T.units.filter(v=>v!==u);T.th+=Math.floor(U[u.k].cost/2);burst(u.l,u.c+.5,'#ffffff',8);snd('sel')}T.shovel=false;return}
  if(T.sel){if(plant(T.sel,c.l,c.c)){T.sel=null}else snd('no')}}
function move(e){const[x,y]=pt(e);if(DRAG){DSX=DRAG.s0+(DRAG.x0-x);if(Math.abs(x-DRAG.x0)>8)DRAG.mv=1;return}if(SCR!=='play'||!T)return;T.hover=cellAt(x,y)}
function up(e){if(!DRAG)return;const[x,y]=pt(e);const d=DRAG;DRAG=null;if(d.mv)return;for(const b of UI)if(b.id.startsWith('pk')&&x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h){b.fn();return}}

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
  layout();SCR='map';T=null;MCH=-1;[...Object.values(U).map(u=>u.img),...Object.values(E).map(e=>e.img),...Object.values(FACE),GRAVE,...Object.values(FXM).map(m=>m.f),...CHS.map(c=>c.floorImg).filter(Boolean)].forEach(img);
  cv.addEventListener('pointerdown',down);cv.addEventListener('pointermove',move);cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);window.addEventListener('resize',layout);last=0;raf=requestAnimationFrame(loop);
  ['garden/op_ari.jpg','garden/ch3_tomato.jpg','garden/end_ari.jpg',...Object.keys(LOB).map(k=>'fx/lobby_'+k+'.jpg')].forEach(img);bgm('lobby');if(!SV.op)opening()};
GD.close=function(quiet){if(VID){try{VID.v.pause()}catch(e){}VID=null}bgm('off');cancelAnimationFrame(raf);raf=0;window.removeEventListener('resize',layout);if(ov)ov.remove();ov=null;cv=null;const f=onClose;onClose=null;if(!quiet&&f)try{f()}catch(e){}};

/* ---------- 테스트: 봇 ----------
   'pro' 정석 / 'newbie' 느리고 대충(방패·폭탄 안 씀) / 'spam' 사격수만 */
function botDeck(si,strat){const own=owned(si),mx=deckMax(si);if(strat==='spam')return own.includes('rep')?['rep','pea']:['pea'];
  if(strat==='free')return['sun','pea','rep','puff','cherry'].filter(k=>own.includes(k));
  if(strat==='basic')return['sun','pea','rep','cherry'].filter(k=>own.includes(k));
  const P=STG[si].pool||{mu:1};const has=k=>!!P[k];
  const pref=['sun','pea'];if(own.includes('rep'))pref.push('rep');
  pref.push(own.includes('tall')?'tall':'wall','cherry');
  if(STG[si].graves)pref.push('gbust');if(has('dig'))pref.push('split');if(has('pogo')||has('jack')||has('ladder')||has('beetle'))pref.push('mag');if(has('garg'))pref.push('jala','ice');pref.push('chomp');if(own.includes('gat'))pref.push('gat');if(STG[si].ch===CH3)pref.push('melon');if(has('ball'))pref.push('cact');if(has('cata'))pref.push('umb');if(has('ball'))pref.push('blover');if(has('screen'))pref.push(own.includes('fume')?'fume':'cabb');
  pref.push('chomp','three','torch','snow','jala','squash','mine','fume','cabb','spike','sshroom','puff');
  const out=[];for(const k of pref)if(own.includes(k)&&!out.includes(k)&&out.length<mx)out.push(k);return out}
GD.sim=function(si,sec,strat,seed){const saveT=T;DECK_MAX=deckMax(si);const deck=botDeck(si,strat);newGame(si,deck,seed||7);T.headless=1;T.auto=strat==='newbie'?2.5:.8;let think=0;const r=rng((seed||7)*13+si);
  const has=k=>T.deck.includes(k),ready=k=>{const c=T.cards.find(c=>c.k===k);return c&&c.cd<=0&&T.th>=U[k].cost};
  const free=(l,c)=>l>=0&&l<5&&c>=0&&c<9&&!T.units.some(u=>u.l===l&&u.c===c)&&!T.graves.some(q=>q.l===l&&q.c===c);const P=(k,l,c)=>has(k)&&ready(k)&&free(l,c)&&plant(k,l,c);
  const UP=k=>{if(!has(k)||!ready(k))return false;const b=T.units.find(u=>u.k===U[k].up);return b?plant(k,b.l,b.c):false};
  const thr=l=>T.ens.filter(e=>!e.die&&e.l===l&&e.p<9.7);const hp=l=>thr(l).reduce((a,e)=>a+e.hp+(e.sh||0),0);
  const dps=l=>T.units.filter(u=>u.l===l&&(U[u.k].shoot||U[u.k].fume||U[u.k].lob||U[u.k].split)).reduce((a,u)=>{const d=U[u.k];return a+(d.shoot?d.shoot.n*(d.shoot.range?.5:1):d.fume?1.2:d.lob?d.lob.dmg/40*(d.lob.splash?1.3:1):1)},0)+T.units.filter(u=>U[u.k].shoot&&U[u.k].shoot.lanes&&Math.abs(u.l-l)===1).length;
  const dt=1/30;for(let i=0;i<sec/dt&&T.st==='play';i++){step(dt);think-=dt;if(think>0)continue;think=strat==='newbie'?2:.5;
    if(strat==='pro'){const prod=T.units.filter(u=>U[u.k].prod).length;const sh=T.units.filter(u=>U[u.k].shoot||U[u.k].fume||U[u.k].lob).length;
      // 풍선
      const balls=T.ens.filter(e=>!e.die&&e.fly);if(balls.length>=2&&balls.some(e=>e.p<5)||balls.some(e=>e.p<2.5))P('blover',2,8)||P('blover',1,8);
      for(const e of balls){if(!T.units.some(u=>u.l===e.l&&U[u.k].shoot&&U[u.k].shoot.air)){for(const c of [1,2,3])if(P('cact',e.l,c))break}}
      // 투석 → 양산
      for(const e of T.ens)if(!e.die&&E[e.k].cata&&e.p<9){const back=T.units.filter(u=>u.l===e.l).sort((a,b)=>a.c-b.c)[0];if(back&&!T.units.some(u=>U[u.k].umb&&Math.abs(u.l-e.l)<=1&&Math.abs(u.c-back.c)<=1)){const l2=e.l===0?1:e.l===4?3:e.l;for(const c of [1,2,0,3])if(P('umb',l2,c))break}}
      // 3장: 덤불·애벌레·쇠붙이·거대 수박
      if(prod>=4&&T.th>=150)for(const q of T.graves)if(!q.bust&&has('gbust')&&ready('gbust')){plant('gbust',q.l,q.c);break}
      for(const e of T.ens)if(!e.die&&E[e.k].dig&&!T.units.some(u=>u.l===e.l&&U[u.k].split)){for(const c of [2,1,3])if(P('split',e.l,c))break}
      if(T.ens.some(e=>!e.die&&e.p<9.5&&!e.under&&hasMetal(e))&&T.units.filter(u=>U[u.k].mag).length<(T.t>90?2:1)){for(const l of [1,3,2])if(P('mag',l,2)||P('mag',l,3))break}
      for(const e of T.ens)if(!e.die&&E[e.k].garg&&e.p<6.5){if(P('jala',e.l,8))break;if(e.p<4.5&&P('cherry',e.l,Math.max(0,Math.round(e.p-1))))break;if(e.p<3&&P('ice',2,8))break;const c=Math.max(0,Math.min(8,Math.floor(e.p-.3)));if(P('squash',e.l,c))break}
      if(T.th>=300)UP('gat');UP('rock');
      // 위급
      for(let l=0;l<5;l++){const near=thr(l).filter(e=>e.p<3.2&&!e.fly);if(!near.length)continue;const e=near[0];
        if(hp(l)>900&&P('jala',l,8))break;
        if(hp(l)>700||near.length>=3){const c=Math.max(0,Math.min(8,Math.round(e.p-.5)));if(P('cherry',l,c))break}
        const c=Math.max(0,Math.min(8,Math.floor(e.p-.3)));if(free(l,c)&&P('squash',l,c))break;if(P('chomp',l,Math.max(0,c-1)))break}
      for(let l=0;l<5;l++){const big=thr(l).find(e=>e.max>=1000&&e.p<6.5&&!e.fly);if(big){if(P('chomp',l,3))break;if(hp(l)>1500&&(P('cherry',l,Math.round(big.p-.5))||P('jala',l,8)))break}}
      const L=[0,1,2,3,4].sort((a,b)=>(hp(b)/40-dps(b))-(hp(a)/40-dps(a)));
      let need=L.find(l=>thr(l).some(e=>!e.fly)&&dps(l)<Math.min(4,1+hp(l)/350));const danger=need!=null&&thr(need).some(e=>e.p<6.2);if(need!=null&&!danger&&prod<Math.min(6,3+Math.floor(T.t/40))&&dps(need)>=1)need=null;
      if(need!=null){const scr=thr(need).some(e=>e.sh>0);let k=scr&&has('fume')&&ready('fume')?'fume':scr&&has('cabb')&&ready('cabb')?'cabb':has('melon')&&ready('melon')&&T.th>=300?'melon':has('three')&&ready('three')&&thr(need-1<0?need:need-1).length+thr(need+1>4?need:need+1).length>0?'three':has('rep')&&ready('rep')?'rep':has('snow')&&ready('snow')&&dps(need)>=1?'snow':'pea';
        const cs2=k==='fume'?[3,2,4]:[1,2,3];let okp=false;for(const c of cs2)if(P(k,need,c)){okp=true;break}if(!okp)for(const c of [1,2,3])if(P('pea',need,c))break;
        if(has('puff'))for(const c of [5,6])if(P('puff',need,c))break}
      else if(prod<Math.min(9,3+Math.floor(sh*.9))){pp:for(const c of [0,1])for(const l of [2,1,3,0,4])if(free(l,c)&&(P('sun',l,c)||P('sshroom',l,c)))break pp}
      else{const l=[2,1,3,0,4].find(l=>dps(l)<2);if(l!=null){const k=has('three')&&T.th>=400?'three':has('rep')&&T.th>=300?'rep':'pea';for(const c of [1,2,3])if(P(k,l,c))break}}
      for(const l of L){const sl=T.units.filter(u=>u.l===l&&U[u.k].shoot&&!U[u.k].shoot.lanes).length;if(sl>=2&&!T.units.some(u=>u.l===l&&U[u.k].torch)){for(const c of [4,5])if(P('torch',l,c))break}}
      for(const l of L){if(thr(l).some(e=>e.p<8&&!e.fly&&(e.max>=500||thr(l).length>=2))&&free(l,6))P(has('tall')?'tall':'wall',l,6)||P('wall',l,6)}
      for(const l of L){if(thr(l).some(e=>!e.fly&&e.p<8.5))P('spike',l,7)}
      for(const l of L){const e=thr(l).find(e=>e.p>6&&e.p<8.5&&!e.fly);if(e)P('mine',l,7)}}
    else if(strat==='newbie'){const th=l=>thr(l).length>0;const ys=l=>T.units.some(u=>u.l===l&&U[u.k].shoot);
      const l=[0,1,2,3,4].find(l=>th(l)&&!ys(l));if(l!=null)P(has('rep')&&r()<.4?'rep':'pea',l,Math.floor(r()*5));else if(r()<.45)P('sun',Math.floor(r()*5),Math.floor(r()*3));else P('pea',Math.floor(r()*5),Math.floor(r()*6))}
    else if(strat==='free'||strat==='basic'){/* 맘터 피드백(11-12): 맘터 한 줄 + 태태영 한 줄 + 나머지 쏭카드 도배 */
      for(let l=0;l<5;l++)if(free(l,0))P('sun',l,0);for(let l=0;l<5;l++)if(free(l,1))P(T.th>=300&&has('rep')?'rep':'pea',l,1);
      for(let l=0;l<5;l++){const near=thr(l).filter(e=>e.p<3&&!e.fly);if(near.length>=3||hp(l)>1200&&near.length)P('cherry',l,Math.max(0,Math.round(near[0].p-.5)))}
      pf:for(const l of [2,1,3,0,4])for(const c of [5,6,4,7,3,2,8])if(free(l,c)&&P('puff',l,c))break pf}
    else if(strat==='spam'){for(let l=0;l<5;l++)for(let c=0;c<9;c++)if(free(l,c)&&(P(T.deck[0],l,c)||P('pea',l,c)))break}}
  const res={si,st:T.st,t:+T.t.toFixed(1),kills:T.kills,planted:T.planted,spools:T.lanes.filter(l=>!l.spool).length,en:T.wv.filter(w=>w.k).length,th:T.th,deck:T.deck.join(','),
    board:[0,1,2,3,4].map(l=>T.units.filter(u=>u.l===l).sort((a,b)=>a.c-b.c).map(u=>u.k+u.c).join(' ')+' | '+T.ens.filter(e=>e.l===l&&!e.die).map(e=>e.k+e.p.toFixed(1)).join(' '))};T=saveT;return res};
GD._T=()=>T;GD.reward=reward;GD.LOB=LOB;GD.LOBR=LOBR;GD._dbg={plant,step,spawn,dropThread,newGame,SV:()=>SV,set:(k,v)=>{if(k==='SCR')SCR=v;if(k==='T')T=v;if(k==='RES')RES=v}};
})();
