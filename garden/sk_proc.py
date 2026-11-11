import sys,numpy as np
STRONG=len(sys.argv)>3 and sys.argv[3]=='strong'
from PIL import Image
from scipy import ndimage
def key(im):
  a=np.asarray(im.convert('RGBA')).astype(np.float32)
  if im.mode=='RGBA' and a[...,3].min()<10: return a
  rgb=a[...,:3];h,w=rgb.shape[:2]
  border=np.concatenate([rgb[:4].reshape(-1,3),rgb[-4:].reshape(-1,3),rgb[:,:4].reshape(-1,3),rgb[:,-4:].reshape(-1,3)])
  bg=np.median(border,0)
  d=np.sqrt(((rgb-bg)**2).sum(-1))
  al=np.clip((d-38)/(85-38),0,1)
  m=al>0.02
  lab,n=ndimage.label(m);sz=ndimage.sum(m,lab,range(1,n+1))
  keep=np.isin(lab,np.where(sz>=40)[0]+1);al=al*keep
  aa=np.maximum(al,1e-3)[...,None]
  col=np.clip((rgb-(1-aa)*bg)/aa,0,255)
  col=np.where(al[...,None]>0.995,rgb,col)
  if bg[1]>bg[0]+40 and bg[1]>bg[2]+40:
    edge=ndimage.binary_dilation(al<0.98,iterations=3)
    mx=(col[...,0]+col[...,2])/2;gg=col[...,1]
    col[...,1]=np.where(edge&(gg>mx),mx,gg)
  if bg[0]>bg[1]+60 and bg[2]>bg[1]+60:
    # 마젠타 배경: 가장자리 밝은 부분(흰 옷·이펙트)에 남은 분홍기를 G 쪽으로 눌러 줌
    edge=ndimage.binary_dilation(al<0.98,iterations=3)
    R,G,B=col[...,0],col[...,1],col[...,2];m=np.minimum(R,B)-G
    fix=edge&(m>0)&((G>100)|((al<.9)&STRONG))
    col[...,0]=np.where(fix,R-.8*m,R);col[...,2]=np.where(fix,B-.8*m,B)
  out=np.dstack([col,al*255]);return out
def sheet(path,out,F=256):
  im=Image.open(path);a=key(im);H,W=a.shape[:2];cw,ch=W/4,H/2
  m=a[...,3]>20;lab,n=ndimage.label(m,structure=np.ones((3,3)))
  cms=ndimage.center_of_mass(m,lab,range(1,n+1));szs=ndimage.sum(m,lab,range(1,n+1))
  cellof=np.zeros(n+1,int)-1
  for i,(cy,cx) in enumerate(cms):
    cellof[i+1]=min(1,int(cy//ch))*4+min(3,int(cx//cw))
  frames=[];boxes=[]
  for k in range(8):
    ids=[i for i in range(1,n+1) if cellof[i]==k]
    big=max(ids,key=lambda i:szs[i-1])
    mk=np.isin(lab,ids);yy,xx=np.where(mk);by,bx=np.where(lab==big)
    frames.append((mk,yy.min(),yy.max(),xx.min(),xx.max(),bx.mean(),by.max()))
  hh=max(f[2]-f[1]+1 for f in frames);
  # horizontal extent relative to body center
  L=max(f[5]-f[3] for f in frames);R=max(f[4]-f[5] for f in frames)
  # vertical extent relative to body bottom
  T=max(f[6]-f[1] for f in frames);B=max(f[2]-f[6] for f in frames)
  s=min((F-8)/(T+B+1),(F-6)/(L+R+1),1.0)
  strip=Image.new('RGBA',(F*8,F),(0,0,0,0))
  for i,(mk,y0,y1,x0,x1,cx,fb) in enumerate(frames):
    c=a.copy();c[...,3]*=mk
    fr=Image.fromarray(c[y0:y1+1,x0:x1+1].astype(np.uint8),'RGBA')
    fr=fr.resize((max(1,round(fr.width*s)),max(1,round(fr.height*s))),Image.LANCZOS)
    ox=i*F+F/2+(L-R)/2*s-(cx-x0)*s; oy=F-4-B*s-(fb-y0)*s
    strip.alpha_composite(fr,(int(round(ox)),int(round(oy))))
  q=strip.quantize(255,method=Image.FASTOCTREE,dither=Image.NONE)
  q.save(out,optimize=True);return s
if __name__=='__main__':
  print(sheet(sys.argv[1],sys.argv[2]))
