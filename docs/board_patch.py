#!/usr/bin/env python3
"""V147 💬 기갈 게시판: wiki.html 게시판 탭 + index.html 로비 [게시판] 버튼·빨간 점.
usage: board_patch.py REPO_DIR"""
import json, sys, re, datetime
R = sys.argv[1]
K = '/home/claude/kt/'
new = json.load(open(K + 'board_new.json', encoding='utf8'))
old = json.load(open(K + 'board_old.json', encoding='utf8'))
seed = []
for i, x in enumerate(old):
    cat = {'팁': '공략'}.get(x[0], x[0])
    seed.append({'id': f'o{i+1}', 'seed': 1, 'old': 1, 'cat': cat, 'by': x[1], 't': x[2], 'b': x[3], 'at': x[4]})
kst = datetime.timezone(datetime.timedelta(hours=9))
for i, x in enumerate(new):
    at = int(datetime.datetime.strptime(x['d'], '%Y-%m-%d %H:%M').replace(tzinfo=kst).timestamp() * 1000) + i
    o = {'id': f'k{i+1}', 'seed': 1, 'cat': x['c'], 'by': x['n'], 't': x['t'], 'b': x['b'], 'at': at}
    if x.get('cm'): o['cm'] = x['cm']
    seed.append(o)
js = open(K + 'board_wiki.js', encoding='utf8').read().replace('__SEED__', json.dumps(seed, ensure_ascii=False, separators=(',', ':')))

CSS = """
/* ---- 💬 게시판 (V147) ---- */
section[data-p=board]{grid-template-columns:minmax(0,1fr)}
#bd{display:grid;gap:10px;min-width:0}
.bdtop{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.bdme{font-size:13px;color:var(--sub)}.bdme b{color:var(--ink)}
.bdw{border:0;border-radius:12px;padding:9px 14px;font:900 14px var(--f-ui);color:#2a0030;background:linear-gradient(90deg,var(--pink),var(--gold));cursor:pointer}
.bdw.big{width:100%;padding:12px;font-size:16px}.bdw:disabled{opacity:.6}
.bdchips{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none}
.bdc{flex:none;border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:999px;padding:6px 11px;font:700 12.5px var(--f-ui);cursor:pointer}
.bdc.on{background:var(--lav);color:#1a0b2e;border-color:var(--lav)}
.bdn{margin:0;font-size:12.5px;color:var(--sub)}
.bdl{display:grid;gap:6px}
.bdr{display:grid;gap:2px;text-align:left;border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:14px;padding:10px 12px;cursor:pointer;font-family:var(--f-ui)}
.bdr:hover{border-color:var(--lav)}.bdr b{font-size:14.5px;line-height:1.4}.bdr small{font-size:12px;color:var(--sub)}
.bdcat{font-size:11.5px;font-weight:800;color:var(--gold)}
.bdmore{border:1px dashed var(--line);background:none;color:var(--sub);border-radius:12px;padding:10px;font:700 13px var(--f-ui);cursor:pointer}
.bdsh{position:fixed;inset:0;z-index:70;display:flex;align-items:flex-end;justify-content:center;background:rgba(6,2,12,.62)}
.bdsh[hidden]{display:none}
.bdbox{width:100%;max-width:560px;max-height:90vh;overflow-y:auto;background:var(--panel);border:1px solid var(--line);border-bottom:0;border-radius:22px 22px 0 0;padding:16px 16px calc(18px + env(safe-area-inset-bottom,0px));display:grid;gap:10px;animation:shUp .25s ease}
.bdhd{display:flex;align-items:center;justify-content:space-between}
.bdx{border:0;background:var(--panel2);color:var(--ink);width:34px;height:34px;border-radius:50%;cursor:pointer}
.bdt{margin:0;font-size:19px;line-height:1.35}.bdmeta{margin:0;font-size:12.5px;color:var(--sub)}
.bdbody{white-space:pre-wrap;word-break:break-word;line-height:1.7;font-size:15px;background:var(--panel2);border-radius:14px;padding:12px 14px}
.bdact{display:flex;gap:8px}
.bdlk,.bddel{border:1px solid var(--line);background:var(--panel2);color:var(--ink);border-radius:999px;padding:7px 14px;font:800 14px var(--f-ui);cursor:pointer}
.bdlk.on{background:#ff4f8b;border-color:#ff4f8b;color:#fff}.bdlk:disabled{opacity:.6;cursor:default}
.bddel{color:var(--red)}
.bdch{margin:6px 0 0;font-size:14px}
.bdcm{display:grid;gap:6px}
.bdc1{display:grid;gap:1px;background:var(--panel2);border-radius:12px;padding:8px 11px}
.bdc1 b{font-size:12.5px;color:var(--lav)}.bdc1 span{white-space:pre-wrap;word-break:break-word;font-size:14px}.bdc1 small{font-size:11px;color:var(--sub)}
.bdcd{border:0;background:none;color:var(--red);font-size:11px;cursor:pointer;padding:0 4px}
.bdcw{display:grid;grid-template-columns:1fr auto auto;gap:6px;align-items:center}
.bdcw textarea,.bdlb input,.bdlb select,.bdlb textarea{width:100%;box-sizing:border-box;background:var(--bg);color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:8px 10px;font:14px var(--f-ui);resize:vertical}
.bdlb{display:grid;gap:4px;font-size:12.5px;color:var(--sub);font-weight:700}
.bdan{display:flex;align-items:center;gap:5px;font-size:12.5px;color:var(--sub);white-space:nowrap}
.bdan.big{font-size:15px;color:var(--ink);font-weight:800}.bdan input{width:18px;height:18px;accent-color:var(--pink)}
"""

# ---------- wiki ----------
wp = R + '/wiki.html'
w = open(wp, encoding='utf8').read()
assert 'id="bd"' not in w
tab = '<button class="tab" role="tab" data-t="tips">'
assert w.count(tab) == 1
w = w.replace(tab, '<button class="tab" role="tab" data-t="board">💬 게시판</button>' + tab, 1)
sec = '<section data-p="board" role="tabpanel" hidden>\n  <h2>기갈 게시판 <small>공략 · 잡담 · 질문</small></h2>\n  <div id="bd"></div>\n</section>\n\n'
m = re.search(r'<section data-p="tips"', w); assert m
w = w[:m.start()] + sec + w[m.start():]
w = w.replace('</style>', CSS + '</style>', 1)
w = w.replace('<div class="csh" id="csh" hidden></div>', '<div class="csh" id="csh" hidden></div>\n<div class="bdsh" id="bdsh" hidden></div>', 1)
assert 'id="bdsh"' in w
w = w.replace('</script></body></html>', js + '</script></body></html>', 1)
assert 'gs_board_seen' in w
open(wp, 'w', encoding='utf8').write(w)

# ---------- game ----------
gp = R + '/index.html'
g = open(gp, encoding='utf8').read()
a = '<button type="button" data-lb="wiki" aria-label="기갈 위키"><i>📖</i>위키</button>'
assert g.count(a) == 1
g = g.replace(a, '<button type="button" data-lb="board" aria-label="게시판"><i>💬</i>게시판</button>' + a, 1)
a = "else if(k==='wiki')wikiM();"
assert g.count(a) == 1
g = g.replace(a, "else if(k==='wiki')wikiM();else if(k==='board')wikiM('board');", 1)
a = "function wikiM(){let o=document.getElementById('lbWiki');if(o)o.remove();o=document.createElement('div');o.id='lbWiki';o.innerHTML='<iframe src=\"wiki.html?ingame=1\" title=\"기갈 서바이버 공략 위키\"></iframe>"
assert g.count(a) == 1, g.count(a)
g = g.replace(a, "function wikiM(h){let o=document.getElementById('lbWiki');if(o)o.remove();o=document.createElement('div');o.id='lbWiki';o.innerHTML='<iframe src=\"wiki.html?ingame=1'+(h?'#'+h:'')+'\" title=\"기갈 서바이버 공략 위키\"></iframe>", 1)
a = "const c=()=>{o.remove();removeEventListener('keydown',k)}"
assert g.count(a) == 1
g = g.replace(a, "const c=()=>{o.remove();removeEventListener('keydown',k);try{window.boardCheck&&boardCheck(true)}catch(e){}}", 1)
# badge
a = "try{dot('patch',localStorage.getItem('gs_patch')===PATCH[0][0]?0:'N')}catch(e){}}"
assert g.count(a) == 1
g = g.replace(a, "try{dot('patch',localStorage.getItem('gs_patch')===PATCH[0][0]?0:'N')}catch(e){}try{dot('board',window.__boardN||0)}catch(e){}}", 1)
# FB board count + check loop (login IIFE)
a = "  rankGet:async rid=>"
assert g.count(a) == 1
g = g.replace(a, "  boardNew:async since=>{const r=await fs.getDocs(fs.query(fs.collection(db,'board'),fs.where('at','>',since),fs.limit(60)));return r.docs.map(d=>d.data()).filter(d=>!d.seed)},\n" + a, 1)
a = "setInterval(()=>{const t=document.getElementById('lobby');if(t&&!t.hidden&&ACC.user)mailRefresh()},20000);"
assert g.count(a) == 1
g = g.replace(a, a + """
/* 💬 게시판 새 글 빨간 점 (V147): 안 본 새 글 수, 한 번도 안 열어 봤으면 N */
let bdAt=0;window.boardCheck=async function(force){let seen=0;try{seen=+(localStorage.getItem('gs_board_seen')||0)}catch(e){}
 if(!seen){window.__boardN='N';if(window.lbBadges)lbBadges();return}
 if(!ACC.user){window.__boardN=0;if(window.lbBadges)lbBadges();return}
 if(!force&&Date.now()-bdAt<60000)return;bdAt=Date.now();
 try{const fb=await load();const L=await fb.boardNew(seen);window.__boardN=L.filter(d=>d.uid!==ACC.user.uid).length}catch(e){}if(window.lbBadges)lbBadges()};
setInterval(()=>{const t=document.getElementById('lobby');if(t&&!t.hidden)boardCheck()},30000);""", 1)
a = "btn();mailAt=0;mailRefresh(true)})"
assert g.count(a) == 1
g = g.replace(a, "btn();mailAt=0;mailRefresh(true);try{boardCheck(true)}catch(e){}})", 1)
open(gp, 'w', encoding='utf8').write(g)
print('ok seeds', len(seed))
