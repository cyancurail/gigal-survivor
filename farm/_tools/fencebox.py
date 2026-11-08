# fence collision boxes from alpha: world coords relative to anchor (bottom-center), world = stored/2
import json,numpy as np
from PIL import Image
G='/home/claude/gigal-survivor/farm/'
names=['fence_long','fence_short','fence_corner','fence_t','vine_fence']+[f'maze_{i}' for i in range(9)]
out={}
CW=6  # column width in world px
for n in names:
  a=np.array(Image.open(G+n+'.png').convert('RGBA'))[...,3]>40
  H,W=a.shape;h,w=H/2,W/2
  runs=[]
  for c0 in range(0,W,CW*2):
    col=a[:,c0:c0+CW*2].any(1)
    ys=np.where(col)[0]
    if len(ys)==0: runs.append(None);continue
    runs.append((ys.min()/2,ys.max()/2))
  lens=[r[1]-r[0] for r in runs if r]
  postH=24 if n.startswith('maze') else (56 if n=='vine_fence' else 36)
  cols=[]
  for i,r in enumerate(runs):
    if not r: cols.append(None);continue
    top,bot=r;L=bot-top
    ftop=bot-(max(0,L-postH) if L>postH*1.5 else 0)-9
    cols.append((round(ftop),round(bot)))
  # merge consecutive columns with similar ranges
  boxes=[];cur=None
  for i,c in enumerate(cols):
    x0=i*CW-w/2;x1=x0+CW
    if c is None: 
      if cur: boxes.append(cur);cur=None
      continue
    u0,u1=(min(cur[2],c[0]),max(cur[3],c[1])) if cur else (0,0)
    if cur and c[0]<=cur[3] and c[1]>=cur[2] and (u1-u0)<=max(cur[3]-cur[2],c[1]-c[0])+7: cur[1]=x1;cur[2]=u0;cur[3]=u1
    else:
      if cur: boxes.append(cur)
      cur=[x0,x1,c[0],c[1]]
  if cur: boxes.append(cur)
  # convert y to anchor (bottom = H/2 -> 0)
  out[n]=[[round(b[0]),round(b[1]),round(b[2]-h),round(b[3]-h)] for b in boxes]
  print(n,round(postH),len(out[n]),out[n][:6])
json.dump(out,open('/home/claude/farm/w/fencebox.json','w'),separators=(',',':'))
