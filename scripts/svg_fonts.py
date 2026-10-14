import re,io,base64,html
from lxml import etree
from fontTools.ttLib import TTFont,newTable
from fontTools.ttLib.tables._c_m_a_p import CmapSubtable
from fontTools import subset

def recovered_fonts(doc):
    result=[];seen=set()
    for page in doc:
        for info in page.get_fonts():
            xref=info[0]
            if xref in seen:continue
            seen.add(xref)
            obj=doc.xref_object(xref)
            m=re.search(r'/ToUnicode (\d+) 0 R',obj)
            if not m:continue
            raw=doc.extract_font(xref)[3]
            if not raw:continue
            ft=TTFont(io.BytesIO(raw))
            code_map={}
            for table in ft['cmap'].tables:code_map.update(table.cmap)
            unimap={}
            cmap=doc.xref_stream(int(m[1])).decode()
            for body in re.findall(r'beginbfchar(.*?)endbfchar',cmap,re.S):
                for a,b in re.findall(r'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>',body):
                    code=int(a,16)
                    try:char=bytes.fromhex(b).decode('utf-16-be')
                    except Exception:continue
                    if code in code_map and len(char)==1:unimap[ord(char)]=code_map[code]
            if not unimap:continue
            newcmap=newTable('cmap');newcmap.tableVersion=0;newcmap.tables=[]
            for platform,encoding in [(0,4),(3,10)]:
                table=CmapSubtable.newSubtable(12);table.platformID=platform;table.platEncID=encoding;table.language=0;table.cmap=unimap;newcmap.tables.append(table)
            ft['cmap']=newcmap
            out=io.BytesIO();ft.save(out)
            family=info[3].split('+')[-1];weight='bold' if 'Bold' in family else 'normal'
            family=re.sub(r'[-,](Regular|Bold|Italic|BoldItalic)$','',family).replace(' ','')
            result.append((family,weight,set(unimap),out.getvalue()))
    return result

def embed_fonts(svg,fonts):
    root=etree.fromstring(svg.encode());ns={'s':'http://www.w3.org/2000/svg'}
    used={}
    for t in root.findall('.//s:text',ns):
        key=(t.get('font-family'),t.get('font-weight','normal'))
        used.setdefault(key,set()).update(ord(c) for c in ''.join(t.itertext()))
    css=[];covered={}
    for family,weight,chars,data in fonts:
        key=(family,weight)
        keep=(chars & used.get(key,set())) - covered.get(key,set())
        covered.setdefault(key,set()).update(keep)
        if not keep:continue
        ft=TTFont(io.BytesIO(data));opt=subset.Options();sub=subset.Subsetter(options=opt);sub.populate(unicodes=keep);sub.subset(ft);ft.flavor='woff';out=io.BytesIO();ft.save(out)
        uri=base64.b64encode(out.getvalue()).decode();ranges=','.join(f'U+{c:X}' for c in sorted(keep))
        css.append(f'@font-face{{font-family:"{family}";font-weight:{weight};src:url(data:font/woff;base64,{uri}) format("woff");unicode-range:{ranges}}}')
    for key,chars in used.items():
        missing={cp for cp in chars-covered.get(key,set()) if not chr(cp).isspace()}
        if missing:raise ValueError(f'Font mapping incomplete for {key}: {missing}')
    style='<style>'+''.join(css)+'</style>'
    return svg.replace('<defs>','<defs>'+style,1)
