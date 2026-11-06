#!/usr/bin/env python3
"""성격분석 시즌2(2026.10.17~11.06 대화) — 위키 성격분석 화면에 「뒤집어서 시즌2」 추가.
usage: s2_patch.py S2_TEXT_JSON STATS_JSON WIKI_IN WIKI_OUT"""
import json, sys, re
s2p, stp, win, wout = sys.argv[1:5]
S2 = json.load(open(s2p, encoding='utf8'))
ST = json.load(open(stp, encoding='utf8'))
w = open(win, encoding='utf8').read()
assert 'const S2=' not in w, 'already patched'
for k, v in S2.items():
    v['hours'] = ST[k]['hours']; v['peak'] = ST[k]['peak']
assert len(S2) == 12

# 1) 데이터
w = w.replace('const ULT=', 'const S2=' + json.dumps(S2, ensure_ascii=False, separators=(',', ':')) + ';\nconst ULT=', 1)

# 2) openChar → 시즌 선택 + 뒤집기
old_start = w.index('let fxStop=null,curChar=0;\nfunction openChar(i){')
old_end = w.index('function closeChar(){', old_start)
new = r"""let fxStop=null,curChar=0,season=1;
function bodyHTML(c,s){
  const d=s===2?Object.assign({},c,S2[c.id]):c;const mx=Math.max(...d.hours);
  return `<button type="button" class="s2flip" id="cvFlip">${s===2?'↻ 뒤집어서 시즌1 성격분석 보기':'↻ 뒤집어서 시즌2 성격분석 보기'}</button>
    <header class="hero"><div class="hava">${c.ini}</div>${s===2?'<p class="s2badge">SEASON 2 · 기갈 이후의 우리</p>':''}<p class="epi">${esc(d.epi)}</p><h2 class="nick">${esc(c.nick||c.show)}</h2>${c.nick?`<p class="realname">${esc(c.show==='쁘니형'?'쁘니형 · 창환이형':c.show)}</p>`:''}<p class="ptag">${esc(d.tag)}</p></header>
    <section class="stats">${d.stats.map(x=>`<div class="st"><b>${esc(x[0])}</b><span>${esc(x[1])}</span></div>`).join('')}</section>
    <section class="box"><h3>${s===2?'시즌2 성격 분석':'성격 분석'}</h3><ul>${d.ana.map(a=>`<li>${esc(a)}</li>`).join('')}</ul></section>
    <section class="box"><h3>말버릇</h3><div class="chips">${d.habit.map(h=>`<span>${esc(h)}</span>`).join('')}</div></section>
    <section class="box"><h3>명대사</h3><div class="quotes">${d.quotes.map(q=>`<div class="row"><div class="ava sm">${c.ini}</div><div class="msgcol"><div class="bubwrap"><div class="bub">${esc(q)}</div></div></div></div>`).join('')}</div></section>
    <section class="box"><h3>하루 중 언제 떠드나</h3><div class="hours" role="img" aria-label="시간대별 메시지 수, 가장 많은 시간 ${d.peak}시">${d.hours.map((h,k)=>`<i class="${k===d.peak?'pk':''}" style="height:${Math.max(2,h/mx*100)}%" title="${k}시 · ${h}개"></i>`).join('')}</div><div class="haxis"><span>0시</span><span>6시</span><span>12시</span><span>18시</span><span>24시</span></div><p class="hnote">가장 활발한 시간은 <b>${d.peak}시</b>예요.</p></section>
    <p class="foot">${s===2?'노총각들 15 · 2026.10.17 – 11.06 대화 기준 · 성격분석 시즌2':'노총각들 15 · 2024.08 – 2026.10 대화 기준 · 원조 게임 「누가 말했노」'}</p>`;
}
function bindFlip(){$('#cvFlip').onclick=flip}
function flip(){
  const cv=$('#cv'),card=$('#cvCard');if(!card||card.classList.contains('turning'))return;
  const to=season===1?2:1,c=C[curChar];
  const swap=()=>{season=to;cv.classList.toggle('s2',season===2);card.innerHTML=bodyHTML(c,season);bindFlip();cv.querySelector('.scroll').scrollTop=0;$('#cvFlip').focus({preventScroll:true})};
  if(RM){swap();return}
  card.classList.add('turning','out');
  setTimeout(()=>{swap();card.classList.remove('out');card.classList.add('in');sparkle();setTimeout(()=>card.classList.remove('turning','in'),420)},360);
}
function sparkle(){
  const cv=$('#cv'),b=document.createElement('div');b.className='s2burst';
  b.innerHTML=Array.from({length:18},(_,k)=>`<i style="--a:${k*20}deg;--d:${60+Math.random()*90}px;--c:${['#fff','#ffd34d','#7af0ff','#ff7ac8','#c89bff'][k%5]}"></i>`).join('');
  cv.appendChild(b);setTimeout(()=>b.remove(),900);
}
function openChar(i){
  loadFonts();
  curChar=i;const c=C[i];const cv=$('#cv');
  if(fxStop){fxStop();fxStop=null}
  cv.className='cv th-'+c.theme+(season===2?' s2':'');
  const P=C[step(i,-1)],N=C[step(i,1)];
  cv.innerHTML=`<div class="bgl b1"></div><div class="bgl b2"></div><div class="bgl b3"></div>${DECOR[c.theme]}<canvas id="cvfx"></canvas>
  ${RM?'':`<div class="intro intro-${c.theme}">${INTRO[c.theme](c)}</div>`}
  <div class="scroll"><div class="inner">
    <div class="nav"><button type="button" id="cvPrev">‹ ${esc(P.nick||P.show)}</button><button type="button" class="x" id="cvClose" aria-label="닫기">✕</button><button type="button" id="cvNext">${esc(N.nick||N.show)} ›</button></div>
    <div class="s2card" id="cvCard">${bodyHTML(c,season)}</div>
  </div></div>`;
  cv.hidden=false;document.body.style.overflow='hidden';
  $('#cvClose').onclick=closeChar;
  $('#cvPrev').onclick=()=>openChar(step(i,-1));
  $('#cvNext').onclick=()=>openChar(step(i,1));
  bindFlip();
  $('#cvClose').focus({preventScroll:true});
  fxStop=runFX(c.theme,$('#cvfx'),c);
}
"""
w = w[:old_start] + new + w[old_end:]
# 시트에서 새로 열 때는 시즌1부터
w = w.replace("sh.querySelector('.pa').onclick=()=>openChar(c.i)", "sh.querySelector('.pa').onclick=()=>{season=1;openChar(c.i)}", 1)
assert "season=1;openChar(c.i)" in w

CSS = """
/* ---- 성격분석 시즌2 뒤집기 ---- */
.cv .scroll{perspective:1400px}
.cv .s2card{display:flex;flex-direction:column;gap:16px;position:relative;transform-style:preserve-3d;backface-visibility:hidden}
.cv .s2card.out{animation:s2out .36s cubic-bezier(.5,0,.9,.4) forwards}
.cv .s2card.in{animation:s2in .42s cubic-bezier(.1,.6,.4,1) both}
@keyframes s2out{to{transform:rotateY(90deg) scale(.94);opacity:.4}}
@keyframes s2in{from{transform:rotateY(-90deg) scale(.94);opacity:.4}}
.cv .s2flip{position:absolute;top:2px;right:0;z-index:2;border:0;border-radius:999px;padding:7px 13px;font:900 12.5px "Noto Sans KR",sans-serif;cursor:pointer;max-width:calc(100% - 8px);
  color:#fffbe6;background:rgba(12,6,24,.55);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);
  text-shadow:0 0 6px #ffe58a,0 0 14px #ff9ad5,0 0 22px #9af3ff;
  box-shadow:0 0 0 1.5px rgba(255,255,255,.8),0 0 18px rgba(255,230,140,.75),0 0 36px rgba(154,243,255,.45);animation:s2pulse 1.6s ease-in-out infinite}
.cv .s2flip::after{content:"";position:absolute;inset:-2px;border-radius:inherit;padding:2px;background:linear-gradient(90deg,#ff9ad5,#ffe58a,#9af3ff,#d59aff,#ff9ad5);background-size:220% 100%;animation:s2shine 2.2s linear infinite;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}
.cv .s2flip:focus-visible{outline:3px solid #fff;outline-offset:3px}
@keyframes s2shine{to{background-position:220% 0}}
@keyframes s2pulse{50%{box-shadow:0 0 0 1.5px #fff,0 0 28px rgba(255,230,140,1),0 0 56px rgba(154,243,255,.7);text-shadow:0 0 8px #fff,0 0 18px #ffe58a,0 0 30px #ff9ad5}}
.cv .s2card .hero{padding-top:44px}
.cv .s2badge{margin:0;font:900 12px "Noto Sans KR",sans-serif;letter-spacing:.18em;padding:5px 12px;border-radius:999px;color:#1a0b2e;background:linear-gradient(90deg,#ff9ad5,#ffe58a,#9af3ff,#d59aff);background-size:200% 100%;animation:s2shine 3s linear infinite}
.cv.s2 .bgl.b1{filter:hue-rotate(28deg) saturate(1.25)}
.cv.s2 .st,.cv.s2 .box{background-image:linear-gradient(115deg,transparent 35%,rgba(255,255,255,.22) 48%,transparent 60%);background-size:260% 100%;animation:s2foil 5s ease-in-out infinite}
@keyframes s2foil{0%{background-position:120% 0}100%{background-position:-60% 0}}
.cv .s2burst{position:absolute;left:50%;top:180px;z-index:6;pointer-events:none}
.cv .s2burst i{position:absolute;width:8px;height:8px;border-radius:2px;background:var(--c);box-shadow:0 0 10px var(--c);transform:rotate(var(--a)) translateX(0);animation:s2pop .85s ease-out forwards}
@keyframes s2pop{to{transform:rotate(var(--a)) translateX(var(--d)) scale(.2);opacity:0}}
@media (prefers-reduced-motion:reduce){.cv .s2flip,.cv.s2 .st,.cv.s2 .box,.cv .s2badge{animation:none}}
"""
w = w.replace('</style>', CSS + '</style>', 1)
open(wout, 'w', encoding='utf8').write(w)
print('ok', len(w))
