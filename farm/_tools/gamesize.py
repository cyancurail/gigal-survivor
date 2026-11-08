from PIL import Image
import json,os
F='/home/claude/farm/final/';G='/home/claude/farm/game/'
# world width (game px); stored at 2x
WW={'m_ally':44,'m_angry':46,'m_beetle_red':50,'m_beetle_black':56,'m_eggplant':44,'m_ant':50,'m_caterpillar':50,'m_sprout':38,'m_melon':72,
'tomato_bush':72,'shovel':30,'watering_can':46,'mini_house':110,'crate_tomato':64,'scarecrow':66,'house_full':320,'house_empty':270,
'tallgrass':96,'hay':80,'crates':84,'vine_fence':96,'bush':84,'barrel':72,'barn':150,'trellis':160,'corn':150,'crate_pile':96,
'hut_thatch':150,'hide_grass':120,'scary_hut':210,'boss_bug':160,'boss_queen':140}
FS={'fence_long':.85,'fence_corner':.85,'fence_t':.85,'fence_short':.85}
for i in range(9): FS[f'maze_{i}']=.95
BS={'burst_tomato':46/176,'burst_eggplant':44/156,'burst_melon':72/217}
out={}
for f in sorted(os.listdir(F)):
  if not f.endswith('.png'):continue
  k=f[:-4];im=Image.open(F+f).convert('RGBA')
  if k=='floor': s=1.0
  elif k in WW: s=WW[k]*2/im.width
  elif k in FS: s=FS[k]
  elif k in BS: s=BS[k]*2
  else: print('??',k);continue
  if s<1: im=im.resize((max(1,round(im.width*s)),max(1,round(im.height*s))),Image.LANCZOS)
  if k!='floor': im=im.quantize(256,method=Image.Quantize.FASTOCTREE)
  im.save(G+f,optimize=True);out[k]=Image.open(G+f).size
json.dump(out,open(G+'sizes.json','w'))
