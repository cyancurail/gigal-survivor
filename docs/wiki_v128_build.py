#!/usr/bin/env python3
"""V128: 위키 캐릭터 탭에 필살기 상세 시트 + 원조 「누가 말했노」 성격분석 화면 이식, 로비 문구 갱신.
usage: build.py OLD_GAME_HTML GAME_INDEX_HTML WIKI_IN WIKI_OUT
"""
import re, sys, json

old_p, game_p, wiki_in, wiki_out = sys.argv[1:5]
old = open(old_p, encoding='utf8').read()
game = open(game_p, encoding='utf8').read()
wiki = open(wiki_in, encoding='utf8').read()

# ---------------- 원조 게임에서 꺼내기 ----------------
# CSS: 캐릭터 화면 ~ 테마 12종 (팡파레 제외)
css_all = old[old.find('<style>\n/* Layout'):]
css_all = css_all[:css_all.find('</style>')]
c0 = css_all.find('/* ===== character view ===== */')
c1 = css_all.find('/* unlock fanfare */')
cv_css = css_all[c0:c1]
# 명대사 말풍선에 쓰는 기본 채팅 스타일
base = []
for sel in ['.ava{', '.ava.sm{', '.msgcol{', '.bubwrap{', '.bub{', '.row{']:
    m = re.search(re.escape(sel) + r'[^}]*\}', css_all)
    base.append(m.group(0))
cv_css = '\n'.join(base) + '\n' + cv_css
cv_css += '@media (prefers-reduced-motion:reduce){.cv *{animation-duration:.01ms!important;animation-iteration-count:1!important;transition:none!important}.cv .intro{display:none}}\n'

# 키프레임 이름 충돌 방지
kf = sorted(set(re.findall(r'@keyframes\s+([A-Za-z0-9_-]+)', cv_css)), key=len, reverse=True)
for k in kf:
    cv_css = re.sub(r'@keyframes\s+' + k + r'\b', '@keyframes cv_' + k, cv_css)
    cv_css = re.sub(r'(animation(?:-name)?\s*:[^;}]*?)\b' + k + r'\b', lambda m: m.group(1) + 'cv_' + k, cv_css)
    # 한 animation 선언에 여러 이름이 있는 경우 반복 적용
    for _ in range(3):
        cv_css = re.sub(r'(animation\s*:[^;}]*?,\s*)' + k + r'\b', lambda m: m.group(1) + 'cv_' + k, cv_css)
cv_css = cv_css.replace('.tag{', '.ptag{').replace(' .tag', ' .ptag').replace('.tag,', '.ptag,')

def scope(sel):
    sel = sel.strip()
    if not sel:
        return sel
    if sel.startswith('.cv'):
        return sel
    if sel.startswith('.th-'):
        return '.cv' + sel
    return '.cv ' + sel

def scope_css(css):
    out, i = [], 0
    while i < len(css):
        if css.startswith('/*', i):
            j = css.find('*/', i) + 2; i = j; continue
        if css[i].isspace():
            out.append(css[i]); i += 1; continue
        if css.startswith('@keyframes', i):
            depth, j = 0, css.find('{', i)
            k = j
            while True:
                if css[k] == '{': depth += 1
                elif css[k] == '}':
                    depth -= 1
                    if depth == 0: break
                k += 1
            out.append(css[i:k + 1]); i = k + 1; continue
        if css.startswith('@media', i):
            j = css.find('{', i)
            depth, k = 0, j
            while True:
                if css[k] == '{': depth += 1
                elif css[k] == '}':
                    depth -= 1
                    if depth == 0: break
                k += 1
            inner = css[j + 1:k]
            if '.cv' in inner:   # 이미 범위 지정됨
                out.append(css[i:k + 1])
            else:
                out.append(css[i:j + 1] + scope_css(inner) + '}')
            i = k + 1; continue
        j = css.find('{', i); k = css.find('}', j)
        sels = css[i:j]
        out.append(','.join(scope(s) for s in sels.split(',')) + css[j:k + 1])
        i = k + 1
    return ''.join(out)

cv_css = scope_css(cv_css)
# 위키 기본 스타일이 새어 들어오는 것 막기
cv_css += """
.cv header.hero{padding-block:28px 8px;display:flex}
.cv section.box{display:block}
.cv section.stats{display:grid}
.cv h2.nick{font-weight:400}
.cv .hero .ptag{font-family:var(--t-font2);font-size:clamp(18px,4.6vw,24px);margin:6px 0 0;line-height:1.35;text-wrap:balance;background:none;color:inherit;letter-spacing:0;padding:0;border-radius:0;display:block;font-weight:400}
.cv{line-height:1.45;z-index:60}
"""

js = old[old.find('<script>', old.find('id="fanfare"')) + 8:]
def cut(a, b):
    i = js.find(a); j = js.find(b, i)
    assert i >= 0 and j >= 0, (a, b)
    return js[i:j]

C = json.loads(cut('const C=[', '];\n')[len('const C='):] + ']')
NICK = {'김세진': '세나', '박민규': '앙헬', '송기호': '잔느'}
for c in C:
    if c['id'] in NICK:
        c['nick'] = NICK[c['id']]
    for k in ('hours',):
        pass
AVA = cut('const AVA=', '\nconst CARDBG')
intro_decor = cut('const INTRO={', 'let fxStop=null')
fx = cut('const R=(a,b)=>', '\nupdateGalBtn();')
intro_decor = intro_decor.replace('esc(c.nick)', 'esc(c.nick||c.show)')

# 게임 필살기
ult_src = game[game.find('const ULT={'):]
ult_src = ult_src[:ult_src.find('};') + 2]
ULT = {}
for m in re.finditer(r"'([^']+)':\{n:'([^']*)',type:'([^']*)',d:'([^']*)'\}", ult_src):
    ULT[m.group(1)] = dict(n=m.group(2), type=m.group(3), d=m.group(4))
for m in re.finditer(r"ULT\['([^']+)'\]=\{n:'([^']*)',type:'([^']*)',d:'([^']*)'\};", game):
    ULT[m.group(1)] = dict(n=m.group(2), type=m.group(3), d=m.group(4))
assert len(ULT) == 15, ULT.keys()

NICK2ID = {'태태영': '임재영', '영애': '영규형', 'K1': '박계원', '쁘니': '창환이형', '맘터': '진형우', '무룩': '조혁래',
           '세나': '김세진', '람쥐': '승태민', '마녀': '박준형', '앙헬': '박민규', '잔느': '송기호', '힐블': '박준영',
           '쥬은': '쥬은', '짱재': '재건', '하도': '하도'}
for v in NICK2ID.values():
    assert v in ULT, v

FONTS = re.search(r'<link rel="stylesheet" href="(https://fonts.googleapis.com/css2\?family=Noto\+Sans\+KR[^"]+)"', old).group(1)

# ---------------- 위키 고치기 ----------------
# 1) 로비 문구 (V126)
old_lobby = re.search(r'<div class="card"><h3>🏠 로비</h3><p>.*?</p></div>', wiki).group(0)
new_lobby = ('<div class="card"><h3>🏠 로비</h3><p>🎉 7일 출석 · 📅 미션(매일 오전 4시·매주 월요일 초기화) · 🎫 시즌 패스 · 📮 우편함 · 🏆 랭킹 · 📜 패치내역 · 📖 위키가 로비에 모여 있어요.</p>'
             '<ul class="tips"><li>오른쪽 위 아이콘은 「▲ 접기」로 접을 수 있어요. 「☰ 메뉴」를 누르면 다시 펼쳐지고, 접혀 있어도 새 소식은 빨간 숫자로 보여요.</li>'
             '<li>📖 위키는 게임 안에서 바로 열리고, 인터넷이 없어도 볼 수 있어요.</li>'
             '<li>아래쪽 👤 캐릭터에서 「✅ 로비 캐릭터로 정하기」를 누르면 로비에 서 있는 캐릭터가 바뀌어요.</li></ul></div>')
wiki = wiki.replace(old_lobby, new_lobby, 1)

# 2) 캐릭터 카드를 누를 수 있게
n = 0
parts = wiki.split('<article class="cc">')
for i in range(1, len(parts)):
    nick = re.search(r'<h3>(.*?)</h3>', parts[i]).group(1)
    parts[i] = f'<article class="cc" role="button" tabindex="0" data-cid="{NICK2ID[nick]}" aria-haspopup="dialog">' + parts[i]
    n += 1
wiki = ''.join(parts)
assert n == 15, n
wiki = wiki.replace('<h2>캐릭터 <small>15명</small></h2>',
                    '<h2>캐릭터 <small>15명</small></h2>\n  <p class="hint">캐릭터를 누르면 💥 필살기와 ✨ 성격분석을 볼 수 있어요.</p>', 1)

SHEET_CSS = """
.cc[role=button]{cursor:pointer;transition:transform .15s,border-color .15s;text-align:left}
.cc[role=button]:hover{border-color:var(--lav)}
.cc[role=button]:active{transform:scale(.98)}
.cc[role=button]:focus-visible{outline:3px solid var(--cyan);outline-offset:2px}
.csh{position:fixed;inset:0;z-index:50;display:flex;align-items:flex-end;justify-content:center;background:rgba(6,2,12,.6)}
.csh[hidden]{display:none}
.csh .sh{width:100%;max-width:520px;max-height:88vh;overflow-y:auto;background:var(--panel);border:1px solid var(--line);border-bottom:0;border-radius:22px 22px 0 0;padding:18px 18px calc(18px + env(safe-area-inset-bottom,0px));display:grid;gap:12px;animation:shUp .25s ease}
@keyframes shUp{from{transform:translateY(40px);opacity:0}}
.csh .shh{display:flex;gap:12px;align-items:center}
.csh .shh img{width:72px;height:72px;image-rendering:pixelated;background:var(--panel2);border-radius:14px;flex:none}
.csh .shh h3{font-family:var(--f-dis);font-weight:400;font-size:24px}
.csh .shh p{margin:0;font-size:13px;color:var(--sub)}
.csh .shx{margin-left:auto;align-self:flex-start;border:0;background:var(--panel2);color:var(--ink);width:36px;height:36px;border-radius:50%;font-size:16px;flex:none;cursor:pointer}
.csh .ult{background:var(--panel2);border:1px solid var(--line);border-radius:14px;padding:12px 14px;display:grid;gap:4px}
.csh .ult small{color:var(--gold);font-weight:700;font-size:12px;letter-spacing:.04em}
.csh .ult b{font-size:18px}
.csh .ult p{margin:0;font-size:14px}
.csh .ult .ut{color:var(--sub);font-size:12.5px}
.csh .pa{border:0;border-radius:14px;padding:14px;font:900 16px var(--f-ui);color:#2a0030;background:linear-gradient(90deg,#ff7ac8,#ffd34d,#7af0ff,#c89bff,#ff7ac8);background-size:200% 100%;animation:shine 2.4s linear infinite;cursor:pointer}
.csh .pa:focus-visible{outline:3px solid #fff;outline-offset:2px}
.cv[hidden]{display:none!important}
"""

js_data = ('const C=' + json.dumps(C, ensure_ascii=False, separators=(',', ':')) + ';\n'
           'const ULT=' + json.dumps(ULT, ensure_ascii=False, separators=(',', ':')) + ';\n'
           f'const FONTS={json.dumps(FONTS)};\n')

WJS = r"""
/* ---- V128 캐릭터 상세 · 성격분석 (원조 「누가 말했노」) ---- */
(()=>{
__DATA__
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const byId={};C.forEach((c,i)=>{c.i=i;byId[c.id]=c});
__AVA__
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const step=(i,d)=>(i+d+C.length)%C.length;
let fontsOn=false;
function loadFonts(){if(fontsOn)return;fontsOn=true;const l=document.createElement('link');l.rel='stylesheet';l.href=FONTS;document.head.appendChild(l)}
const sh=$('#csh');let lastFocus=null;
function openSheet(card){
  const id=card.dataset.cid,u=ULT[id],c=byId[id];lastFocus=card;
  const img=card.querySelector('img'),ps=[...card.querySelectorAll('.ct p')];
  sh.innerHTML=`<div class="sh" role="dialog" aria-modal="true" aria-label="${esc(card.querySelector('h3').textContent)} 상세">
    <div class="shh"><img src="${img.src}" alt="" width="72" height="72"><div><h3>${esc(card.querySelector('h3').textContent)}</h3>${ps.map(p=>`<p>${p.innerHTML}</p>`).join('')}</div><button type="button" class="shx" aria-label="닫기">✕</button></div>
    <div class="ult"><small>💥 필살기 · ${esc(u.type)}</small><b>${esc(u.n)}</b><p>${esc(u.d)}</p><p class="ut">화려한 모습에서만 사용 · 쿨타임 3분</p></div>
    ${c?`<button type="button" class="pa">✨ 성격분석 보기</button>`:''}
  </div>`;
  sh.hidden=false;document.body.style.overflow='hidden';
  sh.querySelector('.shx').onclick=closeSheet;
  if(c){loadFonts();sh.querySelector('.pa').onclick=()=>openChar(c.i)}
  (c?sh.querySelector('.pa'):sh.querySelector('.shx')).focus({preventScroll:true});
}
function closeSheet(){sh.hidden=true;sh.innerHTML='';document.body.style.overflow='';if(lastFocus)lastFocus.focus({preventScroll:true})}
sh.addEventListener('click',e=>{if(e.target===sh)closeSheet()});
document.querySelectorAll('.cc[data-cid]').forEach(a=>{a.onclick=()=>openSheet(a);a.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openSheet(a)}}});

__INTRO__
let fxStop=null,curChar=0;
function openChar(i){
  loadFonts();
  curChar=i;const c=C[i];const cv=$('#cv');
  if(fxStop){fxStop();fxStop=null}
  const mx=Math.max(...c.hours);
  cv.className='cv th-'+c.theme;
  const P=C[step(i,-1)],N=C[step(i,1)];
  cv.innerHTML=`<div class="bgl b1"></div><div class="bgl b2"></div><div class="bgl b3"></div>${DECOR[c.theme]}<canvas id="cvfx"></canvas>
  ${RM?'':`<div class="intro intro-${c.theme}">${INTRO[c.theme](c)}</div>`}
  <div class="scroll"><div class="inner">
    <div class="nav"><button type="button" id="cvPrev">‹ ${esc(P.nick||P.show)}</button><button type="button" class="x" id="cvClose" aria-label="닫기">✕</button><button type="button" id="cvNext">${esc(N.nick||N.show)} ›</button></div>
    <header class="hero"><div class="hava">${c.ini}</div><p class="epi">${esc(c.epi)}</p><h2 class="nick">${esc(c.nick||c.show)}</h2>${c.nick?`<p class="realname">${esc(c.show==='쁘니형'?'쁘니형 · 창환이형':c.show)}</p>`:''}<p class="ptag">${esc(c.tag)}</p></header>
    <section class="stats">${c.stats.map(s=>`<div class="st"><b>${esc(s[0])}</b><span>${esc(s[1])}</span></div>`).join('')}</section>
    <section class="box"><h3>성격 분석</h3><ul>${c.ana.map(a=>`<li>${esc(a)}</li>`).join('')}</ul></section>
    <section class="box"><h3>말버릇</h3><div class="chips">${c.habit.map(h=>`<span>${esc(h)}</span>`).join('')}</div></section>
    <section class="box"><h3>명대사</h3><div class="quotes">${c.quotes.map(q=>`<div class="row"><div class="ava sm">${c.ini}</div><div class="msgcol"><div class="bubwrap"><div class="bub">${esc(q)}</div></div></div></div>`).join('')}</div></section>
    <section class="box"><h3>하루 중 언제 떠드나</h3><div class="hours" role="img" aria-label="시간대별 메시지 수, 가장 많은 시간 ${c.peak}시">${c.hours.map((h,k)=>`<i class="${k===c.peak?'pk':''}" style="height:${Math.max(2,h/mx*100)}%" title="${k}시 · ${h}개"></i>`).join('')}</div><div class="haxis"><span>0시</span><span>6시</span><span>12시</span><span>18시</span><span>24시</span></div><p class="hnote">가장 활발한 시간은 <b>${c.peak}시</b>예요.</p></section>
    <p class="foot">노총각들 15 · 2024.08 – 2026.10 대화 기준 · 원조 게임 「누가 말했노」</p>
  </div></div>`;
  cv.hidden=false;document.body.style.overflow='hidden';
  $('#cvClose').onclick=closeChar;
  $('#cvPrev').onclick=()=>openChar(step(i,-1));
  $('#cvNext').onclick=()=>openChar(step(i,1));
  $('#cvClose').focus({preventScroll:true});
  fxStop=runFX(c.theme,$('#cvfx'),c);
}
function closeChar(){if(fxStop){fxStop();fxStop=null}const cv=$('#cv');cv.hidden=true;cv.innerHTML='';if(sh.hidden)document.body.style.overflow='';const pa=sh.querySelector('.pa');if(pa)pa.focus({preventScroll:true})}
addEventListener('keydown',e=>{
  if(!$('#cv').hidden){if(e.key==='Escape')closeChar();if(e.key==='ArrowRight')openChar(step(curChar,1));if(e.key==='ArrowLeft')openChar(step(curChar,-1));return}
  if(!sh.hidden&&e.key==='Escape')closeSheet();
});

/* ---------- particle FX ---------- */
__FX__
})();
"""
WJS = (WJS.replace('__DATA__', js_data).replace('__AVA__', AVA).replace('__INTRO__', intro_decor)
       .replace('__FX__', fx))
assert "updateGalBtn" not in WJS and "unList" not in WJS, 'leftover'

wiki = wiki.replace('</style>', SHEET_CSS + '\n/* ---- 성격분석 화면 (원조 「누가 말했노」 테마) ---- */\n' + cv_css + '\n</style>', 1)
wiki = wiki.replace('<script>\nif(/ingame/',
                    '<div class="csh" id="csh" hidden></div>\n<div class="cv" id="cv" hidden></div>\n<script>\nif(/ingame/', 1)
wiki = wiki.replace('</script></body></html>', WJS + '</script></body></html>', 1)
assert wiki.count('id="cv"') == 1 and "V128" in wiki
open(wiki_out, 'w', encoding='utf8').write(wiki)
print('ok', len(wiki), 'ULT', len(ULT), 'C', len(C))
