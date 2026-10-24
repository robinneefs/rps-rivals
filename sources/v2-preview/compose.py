import sys
from PIL import Image, ImageFilter
I='images/'
def key(im, thr=True):
    im=im.convert('RGBA'); p=im.load()
    for y in range(im.height):
        for x in range(im.width):
            r,g,b,a=p[x,y]
            if g>170 and r<150 and b<150 and g-max(r,b)>80: p[x,y]=(0,0,0,0)
            elif g>max(r,b)+20: p[x,y]=(r,max(r,b),b,a)  # despill
    return im
body=key(Image.open(I+'2.webp'))
bp=body.load()
for y in range(322,1089):
    for x in range(162,778):
        r,g,b,a=bp[x,y]
        if r>150 and b>150 and g<120: bp[x,y]=(0,0,0,0)
S=2
body=body.resize((body.width*S,body.height*S),Image.LANCZOS)
# marquee
m=Image.open(I+'3.webp').convert('RGB').crop((0,125,2000,542))
L,T,R,B=104*S,44*S,837*S,209*S; bw,bh=R-L,B-T
sc=max(bw/m.width,bh/m.height); m=m.resize((round(m.width*sc),round(m.height*sc)),Image.LANCZOS)
ox=(m.width-bw)//2; oy=(m.height-bh)//2; m=m.crop((ox,oy,ox+bw,oy+bh))
# stage cleaned
st=Image.open(I+'7.webp').convert('RGB').resize((288,360),Image.BOX).quantize(40,dither=Image.NONE).convert('RGB')
st=st.resize((616*S,767*S),Image.NEAREST)
cab=Image.new('RGBA',body.size,(0,0,0,0))
cab.paste(st,(162*S,322*S)); cab.alpha_composite(body); cab.paste(m,(L,T))
# buttons
bt=key(Image.open(I+'4.webp'))
btn=[bt.crop((c-180,120,c+180,390)) for c in (293,767,1245)]
lab=[bt.crop((c-210,810,c+210,910)) for c in (291,768,1247)]
BW=148
bwid=BW*S
for i,cx in enumerate((395,555,715)):
    b=btn[i]; b=b.resize((bwid,round(b.height*bwid/b.width)),Image.LANCZOS)
    cab.alpha_composite(b,(cx*S-bwid//2,1258*S-b.height))
    l=lab[i]; lw=round(l.width*bwid/360*0.62); l=l.resize((lw,round(l.height*lw/l.width)),Image.LANCZOS)
    cab.alpha_composite(l,(cx*S-lw//2,1258*S))
jy=key(Image.open(I+'5.webp')).crop((418+30,418+40,836-30,836-30))
jw=round(150/0.65)*S; jy=jy.resize((jw,round(jy.height*jw/jy.width)),Image.LANCZOS)
cab.alpha_composite(jy,(225*S-jw//2,1306*S-jy.height))
cab.save('scratchpad/cabinet-full.png')
room=Image.open(I+'6.webp').convert('RGB')
def phone(Wc,Hc,name):
    D=3; W,H=Wc*D,Hc*D
    out=room.copy(); s=max(W/out.width,H/out.height)
    out=out.resize((round(out.width*s),round(out.height*s)),Image.LANCZOS)
    out=out.crop(((out.width-W)//2,(out.height-H)//2,(out.width-W)//2+W,(out.height-H)//2+H)).filter(ImageFilter.GaussianBlur(6))
    out=Image.eval(out,lambda v:int(v*0.6)).convert('RGBA')
    # fit cabinet content width (x 20..921) to screen width
    cw=(921-20)*S; sc=W/cw
    c=cab.resize((round(cab.width*sc),round(cab.height*sc)),Image.LANCZOS)
    x=-round(20*S*sc); y=max(0,(H-round(1450*S*sc))//2)
    # extend base downward
    out.alpha_composite(c,(x,y))
    if y+c.height<H:
        strip=c.crop((0,c.height-4,c.width,c.height)).resize((c.width,H-(y+c.height)))
        out.alpha_composite(strip,(x,y+c.height))
    out.convert('RGB').save(name); print(name, 'screen css px', round(616*S*sc/D), round(767*S*sc/D))
phone(390,660,'scratchpad/phone-bars.png')
phone(390,844,'scratchpad/phone-full.png')
phone(412,790,'scratchpad/phone-android.png')
