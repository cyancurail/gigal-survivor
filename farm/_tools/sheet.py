import glob,sys
from PIL import Image,ImageDraw
fs=sorted(glob.glob('/home/claude/farm/out/*.png'))
if len(sys.argv)>2: fs=[f for f in fs if f.split('/')[-1][:2] in sys.argv[2].split(',')]
W=1600;cell=200;cols=W//cell
rows=(len(fs)+cols-1)//cols
img=Image.new('RGBA',(W,rows*(cell+16)),(40,36,48,255))
d=ImageDraw.Draw(img)
for i,f in enumerate(fs):
  im=Image.open(f);s=min((cell-8)/im.width,(cell-8)/im.height,1)
  im=im.resize((max(1,int(im.width*s)),max(1,int(im.height*s))),Image.NEAREST)
  x=(i%cols)*cell;y=(i//cols)*(cell+16)
  # checker half: right half lighter to judge edges
  d.rectangle([x,y,x+cell-1,y+cell-1],fill=(40,36,48) if (i%2==0) else (110,90,70))
  img.alpha_composite(im,(x+(cell-im.width)//2,y+(cell-im.height)//2))
  d.text((x+4,y+cell+2),f.split('/')[-1],fill=(255,255,255))
img.save(sys.argv[1])
