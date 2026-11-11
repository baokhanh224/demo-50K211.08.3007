from pathlib import Path
import json,re
p=Path(__file__).resolve().parents[1]; records=[]; uc='UC1'; ref='Business rules'; row=0
for line in (p/'docs/dac-ta-nghiep-vu-trich-xuat.txt').read_text().splitlines():
 row+=1
 m=re.search(r'Use case ID \| (UC_\d+\.\d+)',line)
 if m: uc=m[1].replace('_','')
 if ' | ' in line: ref=line.split(' | ')[0]
 step=re.match(r'^(\d+[a-z]?(?:\.\d+)*\.)',line)
 if step: ref=step[1]
 if line.startswith('BR-UC'): uc=line.split('-')[1];ref=line.split(' | ')[0]
 for text in re.findall('“([^”]+)”',line): records.append({'UC':uc,'buoc_ngoai_le':ref,'dong_nguon':row,'chu':text})
 if line.startswith('Use case name | '): records.append({'UC':uc,'buoc_ngoai_le':ref,'dong_nguon':row,'chu':line.split(' | ',1)[1]})
(p/'docs/nguon-chu-word.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
print('Word:',len(records))
