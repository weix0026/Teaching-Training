from pathlib import Path
import zipfile, xml.etree.ElementTree as ET, subprocess, re

root=Path(__file__).resolve().parents[1]
for path in (root/'materials').iterdir():
    out=root/'research'/(path.stem+'.txt')
    if path.suffix=='.pdf':
        subprocess.run(['pdftotext','-layout',str(path),str(out)],check=True)
    elif path.suffix in ('.pptx','.docx'):
        with zipfile.ZipFile(path) as z:
            names=([n for n in z.namelist() if re.fullmatch(r'ppt/slides/slide\d+.xml',n)] if path.suffix=='.pptx' else ['word/document.xml'])
            names.sort(key=lambda n:int(re.search(r'(\d+)\.xml',n)[1]) if path.suffix=='.pptx' else 0)
            chunks=[]
            for name in names:
                tree=ET.fromstring(z.read(name))
                lines=[' '.join(t.text or '' for t in p.iter() if t.tag.endswith('}t')) for p in tree.iter() if p.tag.endswith('}p')]
                chunks.append(name+'\n'+'\n'.join(lines))
            embedded=[n for n in z.namelist() if '/embeddings/' in n]
            chunks.append('EMBEDDED FILES: '+repr(embedded))
            out.write_text('\n\n'.join(chunks),encoding='utf-8')
            for name in embedded:
                if name.endswith(('.xlsx','.xls')):
                    (root/'materials'/Path(name).name).write_bytes(z.read(name))
    print(path.name)
