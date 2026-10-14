from pathlib import Path
import json, re, base64, io, shutil
import fitz
from PIL import Image
from svg_fonts import recovered_fonts,embed_fonts

import argparse
parser=argparse.ArgumentParser(description='Import original PPTX-derived PDFs as self-contained SVG textbook pages')
parser.add_argument('--source',type=Path,required=True,help='Folder with textbooks_text.json and rendered/*.pdf')
parser.add_argument('--public',type=Path,default=Path(__file__).resolve().parents[1]/'public')
args=parser.parse_args()
ROOT=args.source
PUBLIC=args.public
DATA=PUBLIC/'data'
DATA.mkdir(parents=True,exist_ok=True)
manifest=json.loads((ROOT/'textbooks_text.json').read_text())
result={}
def compress_image(match):
    encoded=match.group(2)
    try:
        raw=base64.b64decode(encoded)
        im=Image.open(io.BytesIO(raw))
        out=io.BytesIO();im.save(out,format='WEBP',lossless=True,method=6)
        data=out.getvalue()
        if len(data)<len(raw):
            return 'data:image/webp;base64,'+base64.b64encode(data).decode()
    except Exception: pass
    return match.group(0)

for original_id,book in manifest.items():
    id='bass' if original_id=='double-bass' else original_id
    src=ROOT/'rendered'/f'{original_id}.pdf'
    if not src.exists():
        raise FileNotFoundError(src)
    doc=fitz.open(src)
    assert len(doc)==len(book['pages']), f'{id}: page count mismatch'
    fonts=recovered_fonts(doc)
    folder=PUBLIC/'textbooks'/id
    folder.mkdir(parents=True,exist_ok=True)
    for index,page in enumerate(doc):
        try:
            svg=embed_fonts(page.get_svg_image(text_as_path=False),fonts)
        except ValueError:
            svg=page.get_svg_image(text_as_path=True)
        svg=re.sub(r'data:image/(png|jpeg);base64,([A-Za-z0-9+/=\s]+)',compress_image,svg)
        svg=re.sub(r'(?<![\w#])(-?\d+\.\d{4,})(?![\w])',lambda m: str(round(float(m[1]),3)),svg)
        target=folder/f'page-{index+1:03}.svg'
        target.write_text(svg)
        book['pages'][index]['image']=f'/textbooks/{id}/{target.name}'
        book['pages'][index].pop('pptxPart',None)
    cover=doc[0].get_pixmap(matrix=fitz.Matrix(0.9,0.9),alpha=False)
    Image.frombytes('RGB',(cover.width,cover.height),cover.samples).save(folder/'cover.webp',quality=85,method=6)
    shutil.copyfile(src,folder/'textbook.pdf')
    toc_text=book['pages'][1]['text']
    toc=[]
    for m in re.finditer(r'([^\n]+?)\s*[·\n]\s*(\d+)쪽',toc_text):
        title=m[1].strip();number=int(m[2])
        if title and title!='차례':toc.append({'title':title,'page':number})
    book.update(id=id,toc=toc,pdf=f'/textbooks/{id}/textbook.pdf',cover=f'/textbooks/{id}/cover.webp',sourceType='imported-pptx',importedAt='2026-10-14')
    result[id]=book
    size=sum(p.stat().st_size for p in folder.iterdir())
    print(id,len(doc),len(toc),f'{size/1024/1024:.1f}MB',flush=True)
temporary=DATA/'textbooks.json.tmp'
temporary.write_text(json.dumps(result,ensure_ascii=False))
temporary.replace(DATA/'textbooks.json')
print('COMPLETE',len(result),sum(x['pageCount'] for x in result.values()),flush=True)
