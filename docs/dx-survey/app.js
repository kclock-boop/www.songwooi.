'use strict';
const $ = id => document.getElementById(id);
const form = $('survey');
const key = 'songwoo.dx-survey.v1';
const maturityLevels = [{"stage": 1, "min": 0, "range": "0점 이상 ~ 20점 미만", "title": "기초 정비", "guide": "공정·업무 범위를 정하고 기록 양식, 기준정보와 담당자를 정비합니다."}, {"stage": 2, "min": 20, "range": "20점 이상 ~ 40점 미만", "title": "데이터 수집·표준화", "guide": "생산·품질 데이터를 수집하고 품번·LOT·설비·시간 기준으로 정리합니다."}, {"stage": 3, "min": 40, "range": "40점 이상 ~ 60점 미만", "title": "시스템 연계·현장 활용", "guide": "ERP·MES와 현장 데이터를 연결하고 KPI로 공정·품질 문제를 개선합니다."}, {"stage": 4, "min": 60, "range": "60점 이상 ~ 80점 미만", "title": "예측·최적화 실증", "guide": "품질예측·계획 최적화 후보를 소규모로 검증하고 오판·안전·효과를 평가합니다."}, {"stage": 5, "min": 80, "range": "80점 이상 ~ 100점 이하", "title": "지속 개선·고도화", "guide": "검증된 기능의 운영성과와 성능 저하를 점검하고 적용 범위를 단계적으로 확대합니다."}];
const levelFor = score => maturityLevels.filter(level => score >= level.min).at(-1);
const displayScore = score => Number(score.toFixed(2)).toString();
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateToday = () => new Date().toLocaleDateString('sv-SE');
let dirty = false;
const meta = {company:'회사명',date:'작성일',respondent:'응답자명',department:'담당 부서·직책',process:'담당 제품·공정',scope:'응답 범위'};
const qualitative = [...contextQuestions,...planQuestions];
function renderQual(q){
 const content=q.type==='multi'?`<div class="choices multi">${q.options.map((t,i)=>`<label class="choice"><input type="checkbox" name="${q.id}" value="${esc(t)}"><span>${esc(t)}</span></label>`).join('')}</div>`:`<textarea name="${q.id}" aria-label="${esc(q.label)}" maxlength="12000" placeholder="${esc(q.hint)}"></textarea>`;
 return `<fieldset><legend><span class="code">${q.id}</span>${esc(q.label)}</legend><p class="hint">${esc(q.hint)}</p>${content}</fieldset>`;
}
$('context-fields').innerHTML=contextQuestions.map(renderQual).join('');
$('plan-fields').innerHTML=planQuestions.map(renderQual).join('');
$('score-fields').innerHTML=groups.map((g,i)=>`<section class="panel" id="group-${g.id}"><div class="section-head"><span>0${i+2}</span><div><h2>${g.title}</h2><p>${g.subtitle}</p></div></div>${g.items.map(([id,title,hint,opts])=>`<fieldset><legend><span class="code">${id}</span>${title}</legend><p class="hint">${hint}(하나 선택)</p><div class="choices">${opts.map((s,i)=>`<label class="choice"><input type="radio" name="${id}" value="${i}"><span>${s}</span></label>`).join('')}</div><div class="special"><label class="choice"><input type="radio" name="${id}" value="unknown"><span>모름 · 확인 필요</span></label><label class="choice"><input type="radio" name="${id}" value="na"><span>해당 없음</span></label></div></fieldset>`).join('')}<details class="evidence"><summary>${g.id} 영역 근거·확인 메모 <span>(선택)</span></summary><label for="note-${g.id}" class="hint">대상 공정, 실제 사례, 미확인·해당 없음 사유, 확인할 부서</label><textarea id="note-${g.id}" name="note-${g.id}" maxlength="12000" placeholder="예: MES에는 등록되지만 압출·성형 LOT 연결은 현장 확인 필요"></textarea></details></section>`).join('');
$('guide').innerHTML=groups.map(g=>`<div class="guide-item"><b>${g.id}. ${g.title}</b><p>${g.guide}</p></div>`).join('');
form.elements.date.value=dateToday();
function answers(){
 const out={};
 for(const [k,v] of new FormData(form)){
  if(qualitative.some(q=>q.id===k&&q.type==='multi')) (out[k]??=[]).push(v);
  else out[k]=v;
 }
 return out;
}
const isScore=v=>['0','1','2','3','4'].includes(v);
function calculate(a){
 const domains=groups.map(g=>{
  const entries=g.items.map(q=>a[q[0]]);
  const scored=entries.filter(isScore);
  return {id:g.id,title:g.title,answered:entries.filter(v=>v!==undefined).length,valid:scored.length,score:scored.length?scored.reduce((s,v)=>s+Number(v),0)/scored.length*25:null};
 });
 const answered=domains.reduce((s,d)=>s+d.answered,0), valid=domains.reduce((s,d)=>s+d.valid,0);
 const sufficient=answered===20&&domains.every(d=>d.valid>=2);
 const total=sufficient?domains.reduce((s,d)=>s+d.score,0)/5:null;
 const label=total===null?(answered===0?'진단 문항에 응답해 주세요':answered<20?'작성 중 · 종합점수 보류':'추가 확인 필요 · 종합점수 보류'):`${levelFor(total).stage}단계 · ${levelFor(total).title}`;
 const missing=groups.flatMap(g=>g.items).filter(q=>a[q[0]]===undefined).map(q=>q[0]);
 const unknown=groups.flatMap(g=>g.items).filter(q=>a[q[0]]==='unknown').map(q=>q[0]);
 const na=groups.flatMap(g=>g.items).filter(q=>a[q[0]]==='na').map(q=>q[0]);
 const recommendations=[];
 if(missing.length)recommendations.push(`미응답 ${missing.length}개: ${missing.join(', ')}. 해당 부서와 함께 응답을 보완하세요.`);
 if(unknown.length)recommendations.push(`확인 필요 ${unknown.length}개: ${unknown.join(', ')}. 인터뷰와 자료로 현재 상태를 확인하세요.`);
 if(na.length)recommendations.push(`해당 없음 ${na.length}개: ${na.join(', ')}. 영역 메모에 제외 사유와 대상 범위를 기록하세요.`);
 if(answered===20&&!sufficient)recommendations.push('영역마다 최소 2개의 유효 점수가 필요합니다. 확인할 수 있는 범위를 넓히거나 부서별 응답을 통합하세요.');
 for(const d of domains.filter(d=>d.valid>=2&&d.score<60).sort((a,b)=>a.score-b.score).slice(0,2))recommendations.push(`${d.title}: ${groups.find(g=>g.id===d.id).guide}`);
 for(const id of ['D2','D4','E3'])if(!isScore(a[id])||Number(a[id])<3)recommendations.push(({D2:'AI 데이터 준비: 기간·표본·판정 라벨·LOT 연결을 확인한 뒤 실증 범위를 정하세요.',D4:'AI 현장 검증: 오판 영향, 사람의 승인, 수동 대체·원복 기준을 먼저 정의하세요.',E3:'보안·업무 연속성: 접근권한, 백업 복구, 설비 접속, 외부 AI 입력 기준을 점검하세요.'})[id]);
 if(a.P1?.length)recommendations.push(`희망과제: ${a.P1.join(', ')}. 1순위 과제의 적용 공정·데이터·KPI·검증 담당자를 합의하세요.`);
 if(!a.P2?.trim())recommendations.push('구축 요구사항 P2에 1순위 과제와 현재·목표 업무를 작성하세요.');
 if(!a.P3?.trim())recommendations.push('구축 요구사항 P3에 KPI의 기준기간·산식·기준값·목표·측정원을 작성하세요.');
 if(total!==null&&total>=60)recommendations.push('준비도가 높은 영역은 소규모 실증 후보입니다. 낮은 개별 항목과 데이터·검증·보안 조건을 먼저 보완한 뒤 착수 여부를 판단하세요.');
 return {answered,valid,missing,unknown,na,domains,total,stage:total===null?null:levelFor(total).stage,scoringVersion:2,label,recommendations};
}
function update(){
 $('completion-panel').hidden=true;
 $('completion-validation').textContent='';
 const r=calculate(answers());
 $('count').textContent=`${r.answered} / 20`;$('progress').value=r.answered;
 $('total').innerHTML=`${r.total===null?'—':displayScore(r.total)}<small>/ 100</small>`;
 $('assessment').textContent=r.label;
 $('level-guide').innerHTML=maturityLevels.map(l=>`<div class="maturity-level ${r.total!==null&&levelFor(r.total).stage===l.stage?'current':''}"><b>${l.stage}단계 · ${l.title}${r.total!==null&&levelFor(r.total).stage===l.stage?' · 현재 계산 구간':''}</b><small>${l.range}</small><p>${l.guide}</p></div>`).join('');
 $('result-detail').textContent=`응답 ${r.answered}/20 · 유효 점수 ${r.valid}/20 · 모름 ${r.unknown.length} · 해당 없음 ${r.na.length}. ${r.total!==null?'선택한 응답 범위의 참고 결과입니다. 현장 근거 확인 후 개선과제를 확정하세요.':'미응답을 완료하고 각 영역에서 최소 2개 항목의 상태를 확인해야 합니다.'}`;
 $('domain-results').innerHTML=r.domains.map(d=>`<div class="domain"><div class="domain-label"><b>${d.id}. ${d.title}</b><span>${d.score===null?'미산정':displayScore(d.score)+'점'}${d.valid>=2?' · '+levelFor(d.score).stage+'단계':''} <small>· 유효 ${d.valid}/4${d.valid<2?' · 해석 보류':d.answered<4?' · 부분 응답':''}</small></span></div><div class="bar" role="img" aria-label="${d.title} ${d.score===null?'미산정':displayScore(d.score)+'점'}"><span style="width:${d.score??0}%"></span></div></div>`).join('');
 $('recommendations').innerHTML='<ul>'+r.recommendations.map(s=>`<li>${esc(s)}</li>`).join('')+'</ul>';
 return r;
}
const status=s=>{$('status').textContent=s;};
function payload(){const a=answers();return {schema:'songwoo-dx-survey',version:1,savedAt:new Date().toISOString(),answers:a,result:calculate(a)};}
function validate(data){
 if(!data||data.schema!=='songwoo-dx-survey'||data.version!==1||!data.answers||typeof data.answers!=='object'||Array.isArray(data.answers))throw new Error('송우산업 사전 설문 v1 응답 파일이 아닙니다.');
 const a=data.answers, cleaned={};
 for(const el of form.elements){
  const k=el.name;if(!k||cleaned[k]!==undefined||a[k]===undefined)continue;
  const v=a[k];
  if(el.type==='checkbox'){
   const q=qualitative.find(q=>q.id===k);
   if(!Array.isArray(v)||v.length>q.options.length||v.some(x=>!q.options.includes(x)))throw new Error(k+' 선택값이 올바르지 않습니다.');
   cleaned[k]=[...new Set(v)];
  }else{
   if(typeof v!=='string'||v.length>(el.maxLength>0?el.maxLength:12000))throw new Error(k+' 입력값이 올바르지 않습니다.');
   if(el.type==='radio'&&!['0','1','2','3','4','unknown','na'].includes(v))throw new Error(k+' 점수가 올바르지 않습니다.');
   if(el.tagName==='SELECT'&&![...el.options].some(o=>o.value===v))throw new Error(k+' 선택값이 올바르지 않습니다.');
   if(el.type==='date'&&v!==''&&!/^\d{4}-\d{2}-\d{2}$/.test(v))throw new Error('작성일 형식이 올바르지 않습니다.');
   cleaned[k]=v;
  }
 }
 return cleaned;
}
function apply(a){
 form.reset();
 for(const el of form.elements){if(!el.name)continue;const v=a[el.name];if(el.type==='radio')el.checked=v===el.value;else if(el.type==='checkbox')el.checked=Array.isArray(v)&&v.includes(el.value);else el.value=typeof v==='string'?v:'';}
 update();dirty=false;
}
function download(text,extension,mime){
 const blob=new Blob([text],{type:mime});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`송우산업_DX사전설문_${dateToday()}.${extension}`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);dirty=false;status('다운로드를 요청했습니다. 저장된 파일을 확인한 뒤 담당 컨설턴트에게 별도로 전달해 주세요. 서버로 전송하지 않았습니다.');
}
function report(){
 const a=answers(),r=calculate(a);const lines=['송우산업 DX 전환·스마트공장 구축 사전 설문','저장 시각: '+new Date().toLocaleString('ko-KR'),'자체 사전진단 / 공식 수준 판정 아님',''];
 Object.entries(meta).forEach(([id,label])=>lines.push(label+': '+(a[id]||'미입력')));
 const writeQ=q=>lines.push('\n'+q.id+'. '+q.label,Array.isArray(a[q.id])?a[q.id].join(', '):a[q.id]||'미입력');
 lines.push('\n[경영환경·적용 범위]');contextQuestions.forEach(writeQ);
 groups.forEach(g=>{lines.push('\n['+g.title+']');g.items.forEach(([id,title,hint,opts])=>{const v=a[id];lines.push(id+'. '+title, isScore(v)?opts[Number(v)]+` (${v}/4점)`:v==='unknown'?'모름 · 확인 필요':v==='na'?'해당 없음':'미응답');});lines.push('근거 메모: '+(a['note-'+g.id]||'미입력'));});
 lines.push('\n[구축 요구사항]');planQuestions.forEach(writeQ);
 lines.push('\n[자동 진단 결과]',r.total===null?'종합점수: 보류':'종합점수: '+displayScore(r.total)+'/100',r.label,`응답 ${r.answered}/20 · 유효 ${r.valid}/20 · 모름 ${r.unknown.length} · 해당 없음 ${r.na.length}`);
 r.domains.forEach(d=>lines.push(`${d.title}: ${d.score===null?'미산정':displayScore(d.score)+'점'} / 유효 ${d.valid}/4${d.valid<2?' / 해석 보류':''}`));
 lines.push('\n산식: 문항 0~4점 → 영역별 유효 응답 평균÷4×100 → 5개 영역 동일 가중 평균. 20문항 응답 및 영역별 유효 2개 이상일 때 종합점수 산출. 모름·해당 없음 제외.','5단계 구간 (반올림 전 점수 기준):',...maturityLevels.map(l=>`${l.stage}단계 · ${l.title}: ${l.range}. ${l.guide}`),'\n[현장 확인 과제]',...r.recommendations.map(s=>'• '+s),'\n[영역별 컨설팅 가이드]',...groups.map(g=>g.title+': '+g.guide),'\n본 응답은 서버로 제출되지 않았습니다. 파일을 담당 컨설턴트에게 별도로 전달하세요.');
 return lines.join('\n');
}
form.addEventListener('input',()=>{dirty=true;update();});
form.addEventListener('change',()=>{dirty=true;update();});
form.addEventListener('submit',e=>e.preventDefault());
$('save').addEventListener('click',()=>{try{localStorage.setItem(key,JSON.stringify(payload()));dirty=false;status('이 기기의 현재 브라우저에 임시저장했습니다. 담당 컨설턴트에게 제출된 상태가 아닙니다.');}catch{status('브라우저 저장공간을 사용할 수 없습니다. 응답 파일(JSON)로 저장해 주세요.');}});
$('load').addEventListener('click',()=>{try{const raw=localStorage.getItem(key);if(!raw){status('이 브라우저에 저장된 응답이 없습니다.');return;}const a=validate(JSON.parse(raw));if(dirty&&!confirm('현재 입력을 임시저장된 응답으로 바꾸시겠습니까?'))return;apply(a);status('이 브라우저의 임시저장 응답을 불러왔습니다.');}catch(e){status('불러오기 실패: '+e.message);}});
$('json').addEventListener('click',()=>download(JSON.stringify(payload(),null,2),'json','application/json;charset=utf-8'));
$('report').addEventListener('click',()=>download('\uFEFF'+report(),'txt','text/plain;charset=utf-8'));
$('import').addEventListener('click',()=>$('file').click());
$('file').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>1024*1024)throw new Error('파일은 1MB 이하만 불러올 수 있습니다.');const a=validate(JSON.parse(await file.text()));if(!confirm('현재 입력을 선택한 응답 파일로 바꾸시겠습니까?'))return;apply(a);dirty=true;status('응답 파일을 불러와 점수를 다시 계산했습니다. 이 기기에도 보관하려면 임시저장을 눌러 주세요.');}catch(err){status('응답 파일을 불러오지 못했습니다: '+err.message);}finally{e.target.value='';}});
$('reset').addEventListener('click',()=>{if(!confirm('현재 입력과 이 브라우저의 임시저장 응답을 모두 지울까요? 다운로드한 파일은 남습니다.'))return;form.reset();form.elements.date.value=dateToday();dirty=false;update();try{localStorage.removeItem(key);status('현재 입력과 이 브라우저의 임시저장을 초기화했습니다.');}catch{status('현재 입력은 초기화했지만 브라우저 저장공간을 지우지 못했습니다. 브라우저 사이트 데이터 설정을 확인하세요.');}});
let printDetails=[];
function beforePrint(){
 if(document.querySelector('.print-value'))return;
 printDetails=[...document.querySelectorAll('details')].filter(d=>!d.open);printDetails.forEach(d=>d.open=true);
 for(const el of form.querySelectorAll('textarea,input:not([type=radio]):not([type=checkbox]),select')){
  const p=document.createElement('div');p.className='print-value';p.textContent=el.value||'미입력';el.classList.add('print-replaced');el.after(p);
 }
}
function afterPrint(){document.querySelectorAll('.print-value').forEach(e=>e.remove());document.querySelectorAll('.print-replaced').forEach(e=>e.classList.remove('print-replaced'));printDetails.forEach(d=>d.open=false);printDetails=[];}
$('print').addEventListener('click',()=>{update();window.print();});
window.addEventListener('beforeprint',beforePrint);window.addEventListener('afterprint',afterPrint);
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
update();
try{if(localStorage.getItem(key))status('이 브라우저에 이전 임시저장 응답이 있습니다. 필요하면 임시저장 불러오기를 눌러 주세요.');}catch{status('브라우저 저장공간을 사용할 수 없습니다. 작성 후 응답 파일로 저장해 주세요.');}

function completeSurvey(){
 const r=update();
 if(r.missing.length){
  const message=`아직 응답하지 않은 진단 문항이 ${r.missing.length}개 있습니다 (${r.missing.join(', ')}). 모르는 항목은 ‘모름 · 확인 필요’를 선택해 주세요.`;
  $('completion-validation').textContent=message;
  status(message);
  alert(message);
  document.querySelector(`input[name="${r.missing[0]}"]`).focus();
  return;
 }
 let message;
 try{
  localStorage.setItem(key,JSON.stringify(payload()));
  dirty=false;
  message='응답과 진단 결과를 이 기기의 현재 브라우저에 저장했습니다.';
 }catch{
  message='이 브라우저에는 저장하지 못했습니다. 아래 ‘응답 파일 저장(JSON)’을 눌러 반드시 파일로 보관해 주세요.';
 }
 if(r.total===null)message+=' 모름·해당 없음이 많아 종합점수는 보류됩니다. 응답은 그대로 보관하며 현장 인터뷰에서 보완합니다.';
 $('completion-message').textContent=message;
 $('completion-panel').hidden=false;
 $('completion-panel').focus();
 status(message+' 담당 컨설턴트에게 파일을 별도로 전달해 주세요.');
}
$('complete').addEventListener('click',completeSurvey);
$('complete-bottom').addEventListener('click',completeSurvey);
$('complete-download').addEventListener('click',()=>$('json').click());
$('complete-print').addEventListener('click',()=>$('print').click());
