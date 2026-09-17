'use strict';
// Shared survey and dashboard scoring, version 2.
const maturityLevels = [{"stage": 1, "min": 0, "range": "0점 이상 ~ 20점 미만", "title": "기초 정비", "guide": "공정·업무 범위를 정하고 기록 양식, 기준정보와 담당자를 정비합니다."}, {"stage": 2, "min": 20, "range": "20점 이상 ~ 40점 미만", "title": "데이터 수집·표준화", "guide": "생산·품질 데이터를 수집하고 품번·LOT·설비·시간 기준으로 정리합니다."}, {"stage": 3, "min": 40, "range": "40점 이상 ~ 60점 미만", "title": "시스템 연계·현장 활용", "guide": "ERP·MES와 현장 데이터를 연결하고 KPI로 공정·품질 문제를 개선합니다."}, {"stage": 4, "min": 60, "range": "60점 이상 ~ 80점 미만", "title": "예측·최적화 실증", "guide": "품질예측·계획 최적화 후보를 소규모로 검증하고 오판·안전·효과를 평가합니다."}, {"stage": 5, "min": 80, "range": "80점 이상 ~ 100점 이하", "title": "지속 개선·고도화", "guide": "검증된 기능의 운영성과와 성능 저하를 점검하고 적용 범위를 단계적으로 확대합니다."}];
const levelFor = score => maturityLevels.filter(level => score >= level.min).at(-1);
const displayScore = score => Number(score.toFixed(2)).toString();
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
