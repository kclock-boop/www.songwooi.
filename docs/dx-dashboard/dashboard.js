'use strict';
const $ = id => document.getElementById(id);
const esc = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const allQuestions = [...contextQuestions,...planQuestions];
const textQuestions = allQuestions.filter(q=>q.type==='text');
const scoreQuestions = groups.flatMap(g=>g.items);
const insufficient = v => !String(v??'').trim() || /^(\d+|test|테스트|미정|모름|확인\s*필요|[-.?]+)$/i.test(String(v).trim());
// Reconstructed from the published preliminary report; no original response file or personal fields are hosted.
function publicAnswers(){
 const a={company:'송우산업(주)',date:'2026-09-17',M1:['불량·스크랩 비용'],M2:['생산1팀'],M4:['ERP'],P1:['압출·성형 품질예측'],P7:['기존 지원·수준 이력 확인 필요'],P8:['제품별 공정흐름도']};
 scoreQuestions.forEach(q=>a[q[0]]='0');
 textQuestions.forEach(q=>a[q.id]='1');
 return a;
}
let current=publicAnswers(), sourceName='2026-09-17 공개 예비분석 요약', publicMode=true, selected='A';
function validate(data){
 if(!data||data.schema!=='songwoo-dx-survey'||data.version!==1||!data.answers||typeof data.answers!=='object'||Array.isArray(data.answers))throw Error('송우산업 사전 설문 v1 JSON 파일을 선택해 주세요.');
 const raw=data.answers,a=Object.create(null);
 const textIds=['company','date','respondent','department','process','scope',...textQuestions.map(q=>q.id),...groups.map(g=>'note-'+g.id)];
 for(const id of textIds){if(!Object.hasOwn(raw,id))continue;if(typeof raw[id]!=='string'||raw[id].length>12000)throw Error(id+' 입력 형식 또는 길이를 확인해 주세요.');a[id]=raw[id];}
 for(const q of scoreQuestions){const id=q[0];if(!Object.hasOwn(raw,id))continue;if(!['0','1','2','3','4','unknown','na'].includes(raw[id]))throw Error(id+' 문항의 선택값이 올바르지 않습니다.');a[id]=raw[id];}
 for(const q of allQuestions.filter(q=>q.type==='multi')){if(!Object.hasOwn(raw,q.id))continue;const v=raw[q.id];if(!Array.isArray(v)||v.length>q.options.length||v.some(x=>!q.options.includes(x)))throw Error(q.id+' 문항의 선택값이 올바르지 않습니다.');a[q.id]=[...new Set(v)];}
 return a;
}
function assess(a){
 const weak=textQuestions.filter(q=>insufficient(a[q.id]));
 const blanks=textQuestions.filter(q=>!a[q.id]?.trim());
 const simple=weak.length-blanks.length;
 const scores=scoreQuestions.map(q=>a[q[0]]).filter(isScore);
 const uniform=scores.length>=2&&new Set(scores).size===1;
 const meta=[['department','담당 부서·직책'],['process','담당 제품·공정'],['scope','응답 범위']].filter(([id])=>insufficient(a[id]));
 const notes=groups.filter(g=>!insufficient(a['note-'+g.id]));
 return {weak,blanks,simple,uniform,meta,notes};
}
function list(a,id){return a[id]?.length?a[id].join(' · '):'선택 없음';}
function renderDetail(r){
 const g=groups.find(g=>g.id===selected),d=r.domains.find(d=>d.id===selected);
 $('detail').innerHTML=`<h3>${g.id}. ${g.title} <span class="muted">· 유효 ${d.valid}/4</span></h3>${g.items.map(([id,title,hint,options])=>{const v=current[id];const answer=isScore(v)?`${options[Number(v)]} (${v}/4점)`:v==='unknown'?'모름 · 확인 필요':v==='na'?'해당 없음':'미응답';return `<div class="question-row"><b>${id} ${title}</b><span>${esc(answer)}</span></div>`;}).join('')}<p class="tiny">확인 가이드: ${g.guide}</p><p class="tiny">근거 메모: ${esc(current['note-'+g.id]||'미입력')}</p>`;
}
function render(){
 const a=current,r=calculate(a),q=assess(a);
 $('context').textContent=`${a.company||'회사명 미입력'} · ${a.date||'작성일 미입력'} · ${publicMode?'공개 예비분석':'불러온 응답 · 현장 확인 전'}`;
 $('source').textContent=`표시 자료: ${sourceName}. ${publicMode?'공개 보고서의 응답 요약으로 구성했습니다.':'파일의 answers에서 점수를 다시 계산했습니다. 기존 result 값은 사용하지 않습니다.'}`;
 $('banner').innerHTML=publicMode?'<b>검증 전 예비결과 · 기업 단계 판정 보류</b>20개 모두 첫 번째 선택지이며 서술형 9개에 ‘1’만 입력되었습니다. 아래 0점은 계산값이며 실제 기업 수준을 확정하지 않습니다.':`<b>자가응답 분석 · 현장 확인 전</b>${r.total===null?'종합점수 산출 조건이 충족되지 않았습니다.':q.weak.length||q.uniform||q.meta.length||q.notes.length<5?'응답 패턴과 근거를 보완한 뒤 기업 현황을 판단하세요.':'입력값으로 계산한 참고 결과입니다. 증빙과 현장 인터뷰로 확인하세요.'}`;
 $('score').textContent=r.total===null?'—':displayScore(r.total);
 $('stage-title').textContent=r.total===null?'종합단계 보류':r.label;
 $('stage-desc').textContent=r.total===null?'20문항 응답과 영역별 유효 점수 2개 이상이 필요합니다.':levelFor(r.total).guide;
 $('answered').textContent=`${r.answered} / 20`;
 $('answered-note').textContent=`점수 유효 ${r.valid} · 모름 ${r.unknown.length} · 제외 ${r.na.length}`;
 $('needs').textContent=`${q.weak.length} / ${textQuestions.length}`;
 $('notes').textContent=`${q.notes.length} / 5`;
 $('stages').innerHTML=maturityLevels.map(l=>`<div class="stage ${r.stage===l.stage?'current':''}" ${r.stage===l.stage?'aria-current="step"':''}><b>${l.stage}단계${r.stage===l.stage?' ●':''}</b>${l.title}<small>${l.min}~${l.stage===5?'100 이하':l.min+20+' 미만'}</small></div>`).join('');
 $('bars').innerHTML=r.domains.map(d=>`<button class="domain-button" data-domain="${d.id}" aria-pressed="${selected===d.id}" aria-controls="detail"><span class="bar-label"><span>${d.id}. ${d.title}</span><strong>${d.score===null?'미산정':displayScore(d.score)+'점'}${d.valid>=2?' · '+levelFor(d.score).stage+'단계':' · 해석 보류'}</strong></span><span class="bar-track" aria-hidden="true"><span class="bar-fill" style="width:${d.score??0}%"></span>${d.score===0?'<span class="bar-zero"></span>':''}</span><span class="tiny">응답 ${d.answered}/4 · 유효 ${d.valid}/4${d.answered<4?' · 부분 응답':''}</span></button>`).join('');
 renderDetail(r);
 renderDiagnosis();
 $('quality-items').innerHTML=[
 ['미응답·미확인',`${r.missing.length+r.unknown.length}개`,`미응답: ${r.missing.join(', ')||'없음'} / 모름: ${r.unknown.join(', ')||'없음'} / 해당 없음: ${r.na.join(', ')||'없음'}`],
 ['동일 점수 선택',q.uniform?`${r.valid}개 동일`:'반복 패턴 없음',q.uniform?'실제 현황 또는 시험 입력인지 확인하세요. 동일 선택만으로 오류라고 단정하지 않습니다.':'동일 선택 여부는 간단한 참고 점검이며 응답 신뢰성을 보증하지 않습니다.'],
 ['서술형 내용',`${q.weak.length}개 보완`,`미입력 ${q.blanks.length}개 · 단순/미정 입력 ${q.simple}개. ${q.weak.map(x=>x.id).join(', ')||'자동 점검 대상 없음'}. 짧은 숫자·미정 등 단순 패턴 기준으로 확인합니다.`],
 ['진단 범위·근거',`${q.meta.length}개 범위 미정`,`${q.meta.map(x=>x[1]).join(', ')||'범위 입력됨'}. 영역별 근거 메모 ${q.notes.length}/5개 작성. 메모의 사실 여부는 별도 확인이 필요합니다.`]
 ].map(([t,n,desc])=>`<div class="quality-item"><h3>${t}<strong>${n}</strong></h3><p>${esc(desc)}</p></div>`).join('');
 $('interests').innerHTML=[['경영·현장 문제','M1'],['참여 부서','M2'],['운영 시스템','M4'],['희망 DX·AX 과제','P1']].map(([label,id])=>`<div class="interest"><small>${label}</small><b>${esc(list(a,id))}</b></div>`).join('');
 $('narratives').innerHTML=textQuestions.map(q=>`<div class="narrative"><b>${q.id}. ${q.label}${insufficient(a[q.id])?' · 보완 필요':''}</b><p>${esc(a[q.id]||'미입력')}</p></div>`).join('')+`<div class="narrative"><b>지원사업 준비사항</b><p>${esc(list(a,'P7'))}</p><b>준비 가능 자료</b><p>${esc(list(a,'P8'))}</p></div>`;
 const needs=q.weak.length||q.meta.length||q.uniform||r.missing.length||r.unknown.length;
 const project=a.P1?.length?a.P1.join(' · '):'대표 개선과제';
 const steps=[
 [needs?'응답·범위 보완':'응답·현장 근거 대조',needs?'실제 현황인지 확인하고 대상 공정·담당 부서·서술형 답변을 구체화합니다.':'기입한 답변과 현장 증빙을 대조하고 기업 검토를 받습니다.','산출물: 검토된 응답·공정 범위'],
 ['문제와 KPI 기준선','선택한 경영문제의 규모를 같은 기간·산식으로 측정하고 개선목표 근거를 정합니다.','산출물: 기준실적·KPI 정의서'],
 ['데이터 연결 점검','품번·LOT·설비·시간을 기준으로 생산·품질 자료가 연결되는지 샘플로 확인합니다.','산출물: 데이터맵·보완 목록'],
 [r.total!==null&&r.total>=60?'실증·고도화 범위 검토':'개선과제 실행조건 검토',`${project}의 적용 범위·검증 방법·담당자를 협의합니다. 데이터·보안·현장 대응 조건이 부족하면 먼저 보완합니다.`,'산출물: 과제정의서·실행계획']
 ];
 $('actions').innerHTML=steps.map(([title,desc,out],i)=>`<article class="action"><span class="num">STEP 0${i+1}</span><h3>${title}</h3><p>${esc(desc)}</p><small>${out}</small></article>`).join('');
 $('recommendations').innerHTML=r.recommendations.map(t=>`<li>${esc(t)}</li>`).join('');
}
$('bars').addEventListener('click',e=>{const button=e.target.closest('[data-domain]');if(!button)return;selected=button.dataset.domain;render();document.querySelector(`[data-domain="${selected}"]`).focus({preventScroll:true});});
$('import').addEventListener('click',()=>$('file').click());
let importSequence=0;
$('file').addEventListener('change',async e=>{
 const file=e.target.files[0];if(!file)return;const sequence=++importSequence;
 try{if(file.size>1024*1024)throw Error('1MB 이하의 응답 파일을 선택해 주세요.');const a=validate(JSON.parse(await file.text()));if(sequence!==importSequence)return;current=a;sourceName=file.name;publicMode=false;selected='A';render();$('status').textContent='응답 파일을 불러와 5단계 기준으로 다시 계산했습니다. 이 파일은 서버로 전송되지 않습니다.';}
 catch(err){if(sequence===importSequence)$('status').textContent='불러오기 실패: '+err.message+' 기존 결과를 유지합니다.';}
 finally{e.target.value='';}
});
$('reset').addEventListener('click',()=>{importSequence++;current=publicAnswers();publicMode=true;sourceName='2026-09-17 공개 예비분석 요약';selected='A';render();$('status').textContent='공개 예비분석 요약으로 돌아왔습니다.';});
let closed=[],printFilter='all',printOpen=[];
window.addEventListener('beforeprint',()=>{printFilter=$('diagnosis-filter').value;printOpen=[...document.querySelectorAll('.diagnosis-item[open]')].map(d=>d.id);$('diagnosis-filter').value='all';renderDiagnosis();closed=[...document.querySelectorAll('details')].filter(d=>!d.open);closed.forEach(d=>d.open=true);});
window.addEventListener('afterprint',()=>{closed.forEach(d=>d.open=false);closed=[];$('diagnosis-filter').value=printFilter;renderDiagnosis();printOpen.forEach(id=>{const d=$(id);if(d)d.open=true;});});
$('print').addEventListener('click',()=>window.print());
if(location.hash==='#current'){
 try{
  const raw=sessionStorage.getItem('songwoo.dx-dashboard.transfer');
  sessionStorage.removeItem('songwoo.dx-dashboard.transfer');
  if(raw){current=validate(JSON.parse(raw));publicMode=false;sourceName='설문 화면에서 전달된 현재 응답';$('status').textContent='현재 작성한 응답으로 분석했습니다. 새로고침 전에 필요하면 인쇄·PDF로 저장하세요.';}
  else $('status').textContent='전달된 응답이 없어 공개 예비분석을 표시합니다. 현재 응답 JSON을 불러올 수 있습니다.';
 }catch{$('status').textContent='현재 응답을 전달받지 못해 공개 예비분석을 표시합니다. 응답 JSON을 불러와 주세요.';}
 history.replaceState(null,'',location.pathname+location.search);
}
const projectQuestions={
 '압출·성형 품질예측':['C1','A2','D2','C2'], '호스 외관·내측·치수 검사':['C2','D2','D4'],
 '압출·성형 스케줄링':['B1','B4','B3'], '재공·재고·물류 최적화':['B3','B1','A1'],
 'LOT 추적·자연어 조회':['C3','A3','A4'], '설비 이상·예지보전':['D1','A2','D2'],
 '반복 업무 자동화':['A1','D3','E2'], '로봇·피지컬 AI':['D4','D2','E3']
};
function renderDiagnosis(){
 const rows=scoreQuestions.map(q=>diagnoseItem(q[0],current[q[0]]));
 const related=[...new Set((current.P1||[]).flatMap(p=>projectQuestions[p]||[]))];
 const candidates=rows.filter(d=>d.score!==null&&d.score<4).sort((a,b)=>a.score-b.score||(related.indexOf(a.id)<0?99:related.indexOf(a.id))-(related.indexOf(b.id)<0?99:related.indexOf(b.id)));
 const top=candidates.slice(0,3);
 $('diagnosis-summary').textContent=publicMode?'현재는 시험 입력 가능성이 있는 공개 예비응답입니다. 아래 내용은 실제 문제가 확인된 진단이 아니라, 해당 답변이 사실일 때 점검할 내용입니다.':`선택값 기준 개선·운영검증 후보 ${candidates.length}개 · 유지·검증 ${rows.filter(d=>d.score===4).length}개 · 현황/적용 확인 ${rows.filter(d=>d.score===null).length}개. 담당 공정에서 실제 사례와 근거를 확인해 주세요.`;
 $('priority-cards').innerHTML=top.length?top.map(d=>`<article class="priority-card"><span class="pill">${d.id} · ${d.score}/4점 · 확인 후보</span><h3>${esc(d.title)}</h3><p><b>현재 선택</b>${esc(d.asIs)}</p><p><b>확인할 문제</b>${esc(d.issue)}</p><p><b>다음 목표</b>${esc(d.toBe)}</p><button type="button" data-diagnosis-id="${d.id}">실행 방법·확인 자료 보기 ↓</button></article>`).join(''):'<p class="small">점수만으로 개선 후보를 고르지 않았습니다. 최고 선택값은 유지·검증 관점으로, 미응답·모름·해당 없음은 현황 확인 관점으로 아래에서 살펴보세요.</p>';
 const filter=$('diagnosis-filter').value;
 $('diagnosis-list').innerHTML=rows.filter(d=>filter==='all'||d.id.startsWith(filter)).map(d=>`<details class="diagnosis-item" id="diagnosis-${d.id}"><summary><span>${d.id} · ${esc(d.title)}</span><small>${esc(d.state)}${d.score!==null?' · '+d.score+'/4점':''}</small></summary>${diagnosisMarkup(d)}<p class="tiny">영역 근거 메모 (응답 원문): ${esc(current['note-'+d.id[0]]||'미입력')}</p></details>`).join('');
}
$('diagnosis-filter').addEventListener('change',renderDiagnosis);
$('priority-cards').addEventListener('click',e=>{const b=e.target.closest('[data-diagnosis-id]');if(!b)return;$('diagnosis-filter').value=b.dataset.diagnosisId[0];renderDiagnosis();const d=$('diagnosis-'+b.dataset.diagnosisId);d.open=true;d.querySelector('summary').focus();});
$('expand-diagnosis').addEventListener('click',()=>document.querySelectorAll('.diagnosis-item').forEach(d=>d.open=true));
$('download-diagnosis').addEventListener('click',()=>{
 const text=`AS-IS / TO-BE 개선 검토표\n자료: ${sourceName}\n회사: ${current.company||'미입력'} / 작성일: ${current.date||'미입력'}\n선택값 기반 가설과 제안이며 현장 검증 전입니다. 기준값·목표·담당은 협의가 필요합니다.\n`+diagnosisReport(current);
 const url=URL.createObjectURL(new Blob(['\uFEFF'+text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='송우산업_AS-IS_TO-BE_개선검토표.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);$('status').textContent='전체 20문항 개선 검토표 다운로드를 요청했습니다. 저장 파일을 확인해 주세요.';
});
render();

