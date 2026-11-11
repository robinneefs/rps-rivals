"""1x bitmap font shortlist: read BDF pixels verbatim; m6x11 at author-specified16px."""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[2]
out = root / 'art/menus/action-v2/native'
labels = ['PLAY VERSUS CPU', 'PLAY ONLINE', 'OPTIONS']

def bdf(path):
    glyphs = {}
    for block in path.read_text().split('STARTCHAR ')[1:]:
        fields = block.splitlines()
        encoding = int(next(s.split()[1] for s in fields if s.startswith('ENCODING ')))
        width, height, xo, yo = map(int, next(s[4:] for s in fields if s.startswith('BBX ')).split())
        advance = int(next(s.split()[1] for s in fields if s.startswith('DWIDTH ')))
        bitmap = fields[fields.index('BITMAP')+1:][:height]
        points = []
        for row, hexrow in enumerate(bitmap):
            bits = bin(int(hexrow, 16))[2:].zfill(((width+7)//8)*8)
            points.extend((x+xo,height-1-row+yo) for x in range(width) if bits[x]=='1')
        glyphs[encoding] = (advance, points)
    return glyphs

def bdf_line(glyphs,label):
    cursor, points = 0, []
    for ch in label:
        advance, glyph = glyphs[ord(ch)]
        if ch == ' ':
            cursor += advance//2 # Display word spacing only; glyph pixels and inter-letter metrics unchanged.
        else:
            points.extend((cursor+x,y) for x,y in glyph)
            cursor += advance
    top=max(y for x,y in points)
    left=min(x for x,y in points)
    return [(x-left,top-y) for x,y in points]

report=[]
fonts=[('tamzen-bold','Tamzen Bold · native 10×20','tamzen/Tamzen10x20b.bdf'),
       ('tamzen','Tamzen Regular · native 10×20','tamzen/Tamzen10x20r.bdf'),
       ('spleen','Spleen · native 12×24','spleen/spleen-12x24.bdf'),
       ('spleen16','Spleen · native 8×16','spleen/spleen-8x16.bdf'),
       ('m6x11','m6x11 · native 16px',None)]
for key,name,file in fonts:
    data=bdf(root/'art/fonts'/file) if file else None
    font=ImageFont.truetype(str(root/'art/fonts/m6x11/m6x11.ttf'),16) if file is None else None
    sheet=Image.new('RGBA',(176,120))
    metrics=[]
    for i,label in enumerate(labels):
        if data:
            points=bdf_line(data,label)
        else:
            bounds=font.getbbox(label)
            mask=Image.new('L',(176,bounds[3]-bounds[1]))
            ImageDraw.Draw(mask).text((-bounds[0],-bounds[1]),label,font=font,fill=255)
            if set(mask.tobytes())-{0,255}:
                raise ValueError('m6x11 is not aligned at its documented native size')
            points=[(x,y) for y in range(mask.height) for x in range(mask.width) if mask.getpixel((x,y))]
        width=max(x for x,y in points)+1
        height=max(y for x,y in points)+1
        if width+1>176 or height+1>20:
            raise ValueError(f'{name}/{label}: native glyphs do not fit: {width}×{height}')
        offset=(18-height)//2
        offset_x=(176-width)//2
        for selected in [False,True]:
            image=Image.new('RGBA',(176,20))
            for x,y in points:image.putpixel((x+offset_x+1,y+offset+1),(6,2,16,255))
            for x,y in points:
                t=y/max(1,height-1)
                color=(255,round(243-119*t),round(73-51*t),255) if selected else (255,249,218,255)
                image.putpixel((x+offset_x,y+offset),color)
            sheet.paste(image,(0,(i*2+int(selected))*20))
            if key=='m6x11':
                image.save(out/f'{["cpu","online","options"][i]}-{"selected" if selected else "normal"}.png')
        metrics.append({'label':label,'inkWidth':width,'inkHeight':height,'sourceScale':1,'partialAlpha':0})
    sheet.save(out/f'labels-{key}.png')
    report.append({'id':key,'name':name,'method':'BDF pixels verbatim' if data else 'author-specified16px;verified binary source mask','metrics':metrics})
(out/'native-font-study.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
