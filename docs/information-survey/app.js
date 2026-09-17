'use strict';
const form=document.getElementById('survey');
const fields=SURVEY.groups.flatMap(g=>g.fields.map(f=>({...f,group:g.id,section:g.section})));
const byId=new Map(fields.map(f=>[f.id,f]));
const refs=new Map();
const KEY='songwoo-information-survey-v1';
const sectionNames={G:'기업 기본정보',A:'정보화 추진의지 및 계획',B:'정보화 추진환경',C:'정보시스템 구축 및 활용 현황',D:'디지털 전환 수준',R:'응답자·면접원 정보'};
let dirty=false;
function el(tag,attrs={},text){const n=document.createElement(tag);for(const [k,v] of Object.entries(attrs)){if(k==='class')n.className=v;else n.setAttribute(k,v);}if(text!==undefined)n.textContent=text;return n;}
function filled(v){return Array.isArray(v)?v.length>0:v!==''&&v!==undefined;}
function value(id){const r=refs.get(id);if(!r)return '';if(r.field.type==='check')return r.inputs.filter(i=>i.checked).map(i=>i.value);if(r.field.type==='radio')return r.inputs.find(i=>i.checked)?.value||'';return r.inputs[0].value;}
function put(id,v){const r=refs.get(id);if(!r)return;if(['check','radio'].includes(r.field.type)){for(const i of r.inputs)i.checked=Array.isArray(v)?v.includes(i.value):v===i.value;}else r.inputs[0].value=v??'';}
function condition(c){if(!c)return true;const [id,op,expected]=c;const v=value(id);
 if(op==='eq')return v===expected;if(op==='ne')return v!==expected;if(op==='in')return expected.includes(v);
 if(op==='has')return (Array.isArray(v)?v:[v]).includes(expected)&&isActive(id);
 if(op==='some')return Array.isArray(v)&&v.some(x=>expected.includes(x));
 if(op==='maintenance')return [0,1,2].some(i=>['1','2'].includes(value('B9_'+i)));
 if(op==='rankhas')return [1,2,3].some(i=>value(id+'_'+i)===expected&&isActive(id+'_'+i));return false;}
function isActive(id){const f=byId.get(id);if(!f)return false;if(value('businessType')==='3'&&f.group!=='G1')return false;return condition(f.when);}
function display(f,v){if(!filled(v))return '미응답';if(f.options){const vals=Array.isArray(v)?v:[v];return vals.map(x=>{const o=f.options.find(o=>o[0]===x);return o?`${o[0]}. ${o[1]}`:x;}).join('\n');}return v;}
function renderField(field,shortLabel){const f=byId.get(field.id), choice=['radio','check'].includes(f.type);
 const wrap=el(choice?'fieldset':'div',{class:'field'+(choice||f.type==='textarea'?' full':''),id:'field-'+f.id});
 const label=el(choice?'legend':'label',choice?{}:{for:f.id},shortLabel||f.label);wrap.append(label);
 const ctrl=el('div',{class:'control'});const inputs=[];
 if(choice){for(const [v,t] of f.options){const opt=el('label',{class:'choice'});const i=el('input',{type:f.type==='check'?'checkbox':'radio',name:f.id,value:v,id:f.id+'-'+v});inputs.push(i);opt.append(i,el('span',{},`${v}. ${t}`));ctrl.append(opt);}
 const clear=el('button',{type:'button',class:'mini-clear'},'선택 해제');clear.addEventListener('click',()=>{put(f.id,f.type==='check'?[]:'');changed();});ctrl.append(clear);
 }else{let i;if(f.type==='select'){i=el('select',{id:f.id,name:f.id});i.append(el('option',{value:''},'선택해 주세요'));for(const [v,t]of f.options)i.append(el('option',{value:v},v+'. '+t));}else{i=el(f.type==='textarea'?'textarea':'input',{id:f.id,name:f.id,...(f.type==='textarea'?{}:{type:f.type})});if(f.type==='number'){i.min=f.min??0;i.step=f.step||'any';if(f.max!==undefined)i.max=f.max;}if(f.type==='text'||f.type==='textarea')i.maxLength=4000;}inputs.push(i);ctrl.append(i);}
 const chosen=el('p',{class:'chosen'});const pv=el('div',{class:'printvalue'});wrap.append(ctrl,chosen,pv);refs.set(f.id,{field:f,wrap,inputs,chosen,pv});if(f.default)put(f.id,f.default);return wrap;}
for(const [section,title] of Object.entries(sectionNames)){const sec=el('section',{id:'section-'+section});const head=el('div',{class:'sectionhead'});head.append(el('div',{class:'letter'},section==='G'?'01':section==='R'?'06':section),el('h2',{},title));sec.append(head);
 for(const g of SURVEY.groups.filter(g=>g.section===section)){const card=el('article',{class:'question',id:'question-'+g.id});const h=el('div',{class:'qhead'});h.append(el('b',{},g.id),el('h3',{},g.title),el('span',{class:'source'},'원본 '+g.page+'쪽'));card.append(h);if(g.note)card.append(el('p',{class:'note'},g.note));const grid=el('div',{class:'fields'});
 if(g.id==='C11'){for(const row of [...new Set(g.fields.map(f=>f.row))]){const group=el('div',{class:'matrix-row'});group.append(el('div',{class:'matrix-title'},row));for(const f of g.fields.filter(f=>f.row===row))group.append(renderField(f,f.label.split(' / ')[1]));if(g.fields.filter(f=>f.row===row).length===2)group.append(el('div',{class:'na'},'기업간 활용: 원본 응답 대상 아님'));grid.append(group);}}
 else for(const f of g.fields)grid.append(renderField(f));card.append(grid,el('p',{class:'skip',id:'skip-'+g.id},'앞 문항의 응답에 따라 작성하는 항목입니다. 현재는 응답 대상이 아닙니다.'));sec.append(card);}form.append(sec);}
function sync(){for(const f of fields){const r=refs.get(f.id),active=isActive(f.id);r.wrap.hidden=!active;r.inputs.forEach(i=>i.disabled=!active);const v=value(f.id);r.chosen.textContent=f.type==='select'&&filled(v)?display(f,v):'';r.chosen.hidden=!r.chosen.textContent;r.pv.textContent=display(f,v);}
 for(const g of SURVEY.groups){const applicable=g.fields.some(f=>isActive(f.id));document.getElementById('skip-'+g.id).hidden=applicable;}
 const stop=value('businessType')==='3';document.getElementById('termination').hidden=!stop;
 document.getElementById('question-G10').hidden=stop;for(const s of ['A','B','C','D','R'])document.getElementById('section-'+s).hidden=stop;
 const active=fields.filter(f=>isActive(f.id)&&!f.optional);const seen=new Set();let total=0,done=0;
 for(const f of active){if(seen.has(f.id))continue;seen.add(f.id);total++;let complete=filled(value(f.id));if(f.alternative){seen.add(f.alternative);complete=complete||filled(value(f.alternative));}if(complete)done++;}
 const pct=total?Math.round(done/total*100):0;document.getElementById('progressPercent').textContent=pct+'%';document.getElementById('progress').value=pct;document.getElementById('progressText').textContent=`${done} / ${total}개 적용 입력항목 작성`;
}
function status(t){document.getElementById('status').textContent=t;}
function changed(){dirty=true;document.getElementById('issues').hidden=true;for(const r of refs.values())r.wrap.classList.remove('invalid');sync();status('작성 내용이 변경되었습니다. 저장 버튼을 눌러 보관해 주세요.');}
form.addEventListener('input',e=>{const id=e.target.name;const f=byId.get(id);if(f?.type==='check'&&f.exclusive!==undefined&&e.target.checked){for(const input of refs.get(id).inputs){if(input!==e.target&&(e.target.value===f.exclusive||input.value===f.exclusive))input.checked=false;}}changed();});
form.addEventListener('change',()=>sync());form.addEventListener('submit',e=>e.preventDefault());
function getAnswers(personal=true){const result={};for(const f of fields){if(isActive(f.id)&&filled(value(f.id))&&(personal||f.section!=='R'))result[f.id]=value(f.id);}return result;}
function payload(personal=true){return {schema:SURVEY.schema,source:SURVEY.source,referenceYear:2025,exportedAt:new Date().toISOString(),includesPersonal:personal,answers:getAnswers(personal)};}
function download(name,text,type){const url=URL.createObjectURL(new Blob([text],{type}));const a=el('a',{href:url,download:name});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
function fileDate(){return new Date().toLocaleDateString('sv-SE');}
function personal(){return document.getElementById('includePersonal').checked;}
document.getElementById('save').onclick=()=>{try{localStorage.setItem(KEY,JSON.stringify(payload(true)));dirty=false;status('현재 브라우저에 저장했습니다. 이 저장본에는 입력한 인적사항도 포함됩니다. 다른 기기에서는 JSON 파일을 불러와 주세요.');}catch{status('브라우저 저장을 사용할 수 없습니다. JSON 파일 저장을 이용해 주세요.');}};
function validatePayload(p){if(!p||p.schema!==SURVEY.schema||!p.answers||typeof p.answers!=='object'||Array.isArray(p.answers))throw new Error('이 조사표의 JSON 형식이 아닙니다.');
 for(const [id,v] of Object.entries(p.answers)){const f=byId.get(id);if(!f)throw new Error('알 수 없는 응답항목: '+id);if(f.type==='check'){if(!Array.isArray(v)||v.length>f.options.length||new Set(v).size!==v.length||v.some(x=>!f.options.some(o=>o[0]===x)))throw new Error('선택값 오류: '+id);if(f.exclusive!==undefined&&v.includes(f.exclusive)&&v.length>1)throw new Error('단독응답 충돌: '+id);}else{if(typeof v!=='string'||v.length>4000)throw new Error('입력값 형식 오류: '+id);if(f.options&&v!==''&&!f.options.some(o=>o[0]===v))throw new Error('선택값 오류: '+id);if(f.type==='number'&&v!==''&&(!Number.isFinite(Number(v))||Number(v)<(f.min??0)||(f.max!==undefined&&Number(v)>f.max)||(f.step==='1'&&!Number.isInteger(Number(v)))))throw new Error('숫자 범위 오류: '+id);}}
 return p;}
function restore(p){validatePayload(p);if(dirty&&!confirm('현재 작성 내용을 불러온 응답으로 바꾸시겠습니까?'))return false;for(const f of fields)put(f.id,p.answers[f.id]??(f.type==='check'?[]:''));dirty=false;sync();document.getElementById('issues').hidden=true;for(const r of refs.values())r.wrap.classList.remove('invalid');return true;}
document.getElementById('load').onclick=()=>{try{const s=localStorage.getItem(KEY);if(!s){status('현재 브라우저에 저장한 응답이 없습니다.');return;}if(restore(JSON.parse(s)))status('브라우저 저장본을 불러왔습니다.');}catch(e){status('불러오지 못했습니다: '+e.message);}};
document.getElementById('download').onclick=()=>{download('송우산업_정보화수준조사_'+fileDate()+'.json',JSON.stringify(payload(personal()),null,2),'application/json;charset=utf-8');status('JSON 파일 다운로드를 시작했습니다. '+(personal()?'인적사항을 포함합니다.':'응답자·면접원 정보는 제외했습니다.'));};
document.getElementById('import').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>2*1024*1024)throw new Error('파일이 너무 큽니다 (최대 2MB).');if(restore(JSON.parse(await file.text())))status('JSON 응답을 불러왔습니다. 브라우저에 보관하려면 저장을 눌러 주세요.');}catch(err){status('불러오지 못했습니다: '+err.message);}finally{e.target.value='';}};
function csvCell(s){s=String(s??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
document.getElementById('csv').onclick=()=>{const rows=[['조사표','문항','항목','응답','원본 페이지']];for(const g of SURVEY.groups)for(const f of g.fields){if(isActive(f.id)&&(personal()||g.section!=='R'))rows.push([SURVEY.title,g.id,f.label,display(f,value(f.id)),g.page]);}download('송우산업_정보화수준_응답표_'+fileDate()+'.csv','\ufeff'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n'),'text/csv;charset=utf-8');status('CSV 응답표 다운로드를 시작했습니다. 미응답 항목도 포함합니다.');};
function preparePrint(){sync();document.body.classList.toggle('hide-personal',!personal());document.getElementById('printmeta').textContent='출력일: '+fileDate()+' / 조사 기준: 2025년 원조사 / '+(personal()?'인적사항 포함':'응답자·면접원 정보 제외');}
window.addEventListener('beforeprint',preparePrint);document.getElementById('print').onclick=()=>{preparePrint();window.print();};
document.getElementById('reset').onclick=()=>{if(!confirm('현재 입력 내용과 이 조사표의 브라우저 저장본을 지우고 새로 작성하시겠습니까? 다운로드한 파일은 남습니다.'))return;for(const f of fields)put(f.id,f.default??(f.type==='check'?[]:''));try{localStorage.removeItem(KEY);}catch{}dirty=false;sync();document.getElementById('issues').hidden=true;for(const r of refs.values())r.wrap.classList.remove('invalid');status('새 조사표를 준비했습니다.');};
function check(){const errors=[],missing=[],add=(id,message)=>errors.push({id,message});const seen=new Set();
 for(const f of fields){if(!isActive(f.id))continue;const v=value(f.id);if(!f.optional&&!filled(v)&&!seen.has(f.id)&&!(f.alternative&&filled(value(f.alternative)))){missing.push({id:f.id,message:f.label+' — 미응답'});if(f.alternative)seen.add(f.alternative);}
 for(const i of refs.get(f.id).inputs){if(filled(v)&&!i.checkValidity()){add(f.id,f.label+' — 입력 형식·범위를 확인해 주세요.');break;}}}
 for(const id of ['B3','D3','D8','D9']){const a=[1,2,3].filter(i=>isActive(id+'_'+i)).map(i=>({id:id+'_'+i,v:value(id+'_'+i)}));const chosen=a.filter(x=>x.v);if(new Set(chosen.map(x=>x.v)).size<chosen.length)add(a[0].id,id+' — 순위별로 서로 다른 항목을 선택해 주세요.');for(let i=1;i<a.length;i++)if(a[i].v&&!a[i-1].v)add(a[i-1].id,id+' — 앞 순위를 먼저 입력해 주세요.');}
 if(value('C10_work')==='1'&&isActive('C10_self')&&filled(value('C10_self'))&&filled(value('C10_out'))&&Math.abs(Number(value('C10_self'))+Number(value('C10_out'))-100)>0.00001)add('C10_self','C10 — 자체수행과 아웃소싱 비율 합계는 100%여야 합니다.');
 for(let base=0;base<12;base+=3){const ids=[base,base+1,base+2].map(i=>'staff_'+i);if(ids.every(i=>isActive(i)&&filled(value(i)))&&Number(value(ids[0]))+Number(value(ids[1]))!==Number(value(ids[2])))add(ids[2],'종사자 수 — 계가 남 + 여와 일치하지 않습니다.');}
 for(let s=0;s<2;s++)for(let sex=0;sex<3;sex++){const total='staff_'+(s*6+sex),production='staff_'+(s*6+3+sex);if(isActive(total)&&filled(value(total))&&filled(value(production))&&Number(value(production))>Number(value(total)))add(production,'생산관련직 인원이 상시종사자 수보다 많습니다.');}
 for(let i=0;i<6;i++){const all='staff_'+i,hq='staff_'+(i+6);if(isActive(all)&&filled(value(all))&&filled(value(hq))&&Number(value(hq))>Number(value(all)))add(hq,'본사 인원이 기업 전체 인원보다 많습니다.');}
 return {errors,missing};}
document.getElementById('validate').onclick=()=>{const {errors,missing}=check();const box=document.getElementById('issues');box.replaceChildren();box.append(el('h3',{},`응답 점검 · 오류 ${errors.length}건 / 미응답 ${missing.length}건`));box.append(el('p',{},errors.length===0&&missing.length===0?'적용 항목의 입력 점검을 마쳤습니다. 입력 내용의 사실 여부는 담당자 확인이 필요합니다.':'항목을 누르면 해당 입력 위치로 이동합니다. 미응답 상태로도 저장할 수 있습니다.'));const list=el('ul');for(const r of refs.values())r.wrap.classList.remove('invalid');for(const issue of [...errors,...missing]){const li=el('li');const link=el('a',{href:'#field-'+issue.id},issue.message);link.addEventListener('click',()=>refs.get(issue.id).inputs[0].focus());li.append(link);list.append(li);if(errors.includes(issue))refs.get(issue.id).wrap.classList.add('invalid');}box.append(list);box.hidden=false;box.focus();};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
sync();try{if(localStorage.getItem(KEY))status('이 브라우저에 이전 저장본이 있습니다. ‘저장본 불러오기’를 눌러 이어서 작성할 수 있습니다.');}catch{}
