"""Reusable m6x11 ASCII bitmap font for future redesigned menus, native16px only."""
from pathlib import Path
from xml.etree.ElementTree import Element, SubElement, ElementTree
from PIL import Image, ImageDraw, ImageFont

root=Path(__file__).resolve().parents[2]
out=root/'art/menus/action-v2/native'
font=ImageFont.truetype(str(root/'art/fonts/m6x11/m6x11.ttf'),16)
atlas=Image.new('RGBA',(256,96))
doc=Element('font')
SubElement(doc,'info',face='m6x11',size='16',bold='0',italic='0',charset='',unicode='1',stretchH='100',smooth='0',aa='1',padding='0,0,0,0',spacing='0,0')
SubElement(doc,'common',lineHeight='16',base='11',scaleW='256',scaleH='96',pages='1',packed='0')
SubElement(SubElement(doc,'pages'),'page',id='0',file='menu-font.png')
chars=SubElement(doc,'chars',count='95')
for index,code in enumerate(range(32,127)):
    ch=chr(code)
    left,top,right,bottom=font.getbbox(ch,anchor='ls')
    width,height=right-left,bottom-top
    advance=font.getlength(ch)
    if advance!=round(advance) or width>16 or height>16:
        raise ValueError(f'Non-native metric for{ch!r}')
    x,y=index%16*16,index//16*16
    if width and height:
        mask=Image.new('L',(width,height))
        ImageDraw.Draw(mask).text((-left,-top),ch,font=font,anchor='ls',fill=255)
        if set(mask.tobytes())-{0,255}:
            raise ValueError(f'Unaligned source pixels for{ch!r}')
        glyph=Image.new('RGBA',mask.size,(255,255,255,255))
        glyph.putalpha(mask)
        atlas.paste(glyph,(x,y))
    SubElement(chars,'char',id=str(code),x=str(x),y=str(y),width=str(width),height=str(height),
               xoffset=str(left),yoffset=str(11+top),xadvance=str(round(advance)),page='0',chnl='15')
atlas.save(out/'menu-font.png')
ElementTree(doc).write(out/'menu-font.fnt',encoding='utf-8',xml_declaration=True)
