import {DATA,SITES,CLUE_ICONS,CLUE_NAMES,TARGETS} from '../data/game';
import type {State} from '../simulation/model';
import type {View} from './render';
import {btn,image} from './render-parts';
import {icon} from './icons';

// 생활 영역 그림: 집에서 쉬는 아이·빈자리가 생긴 모둠·바뀐 학급 일정
const IMPACT_ART=['impact-self-20261116','impact-others-20261116','impact-school-20261116'];
const siteNames:Record<string,string>={classroom:'교실',cafeteria:'급식실',gym:'체육관'};
// 그림 속 흔적이 숨은 자리(%). 돋보기를 이 근처로 옮기면 신호를 찾는다.
export const SIGNAL_SPOTS:Record<string,[number,number]>={classroom:[30,52],cafeteria:[50,80],gym:[46,72]};
// 신호를 찾으면 무엇이 보였는지 한 줄로 알려 준다. 다음 장(P02)의 단서를 고르는 실마리가 된다.
const signalCaptions:Record<string,string>={classroom:'창문이 닫힌 교실, 친구들 사이에 흔적이 떠 있어요',cafeteria:'함께 먹는 그릇 주변에 흔적이 보여요',gym:'함께 쓴 공과 손에 흔적이 남았어요'};
const focusTabs=(active:string,items:[string,string][])=>`<nav class="obs-focus-tabs" aria-label="활동 보기">${items.map(([id,label])=>btn(label,'focus',active===id?'small selected':'small',`data-id="${id}" aria-pressed="${active===id}"`)).join('')}</nav>`;

// 작은 화면은 활동의 초점만 전환한다. 단서 선택·정답 연결은 학습자가 직접 한다.
export function observationPages(s:State,v:View):string {
  switch(s.route){
    case 'P01':return `<section class="observation-page observation-p01">
      <p class="mission-question">어디에 <b>신호</b>가 있을까요?</p>
      <div class="obs-scan-toolbar"><nav class="obs-site-tabs" aria-label="살펴볼 장소">${SITES.map(x=>btn(`${icon(s.found.includes(x.id)?'check':x.icon,20)}<span>${siteNames[x.id]}</span>`,'site-preview',v.site===x.id?'small selected':'small',`data-id="${x.id}" aria-pressed="${v.site===x.id}"`)).join('')}</nav></div>
      <div class="site-scenes">${SITES.map(x=>{const found=s.found.includes(x.id);return `<button class="site-scene ${found?'discovered':''} ${v.site===x.id?'obs-current':''} ${!found?'obs-next':''}" data-action="discover" data-id="${x.id}" aria-label="${x.name} ${found?'현장 조사하기':'신호 찾기'}"><span class="obs-site-visual" data-scan="${x.id}" style="--hx:${SIGNAL_SPOTS[x.id][0]}%;--hy:${SIGNAL_SPOTS[x.id][1]}%">${image(x.image,'site-image')}<span class="signal-spot ${found?'found':''}" aria-hidden="true"></span><span class="scanner-orb scan-lens" style="${found?`left:${SIGNAL_SPOTS[x.id][0]}%;top:${SIGNAL_SPOTS[x.id][1]}%`:''}">${icon(found?'check':'search',38)}</span><span class="obs-viewfinder" aria-hidden="true"></span>${found?`<span class="signal-caption">${signalCaptions[x.id]}</span>`:''}</span><span class="site-bottom"><strong>${x.name}</strong><span>${icon(found?'check':'search',20)}${found?'발견':'신호 찾기'}</span></span></button>`;}).join('')}</div>
    </section>`;
    case 'P02':{
      const clues=DATA.clues.filter(c=>c.site===v.site),index=Math.min(v.index??0,clues.length-1),tray=v.focus==='tray';
      return `<section class="observation-page observation-p02 ${tray?'obs-mode-tray':'obs-mode-clues'}">
        <p class="mission-question">사건을 설명할 <b>단서 5개</b>를 골라요.</p>
        <div class="obs-toolbar">${focusTabs(tray?'tray':'clues',[['clues','단서'],['tray','단서함']])}<nav class="obs-site-tabs" aria-label="조사 장소">${SITES.map(x=>btn(siteNames[x.id],'site',v.site===x.id?'small selected':'small',`data-id="${x.id}" aria-pressed="${v.site===x.id}"`)).join('')}</nav><label class="obs-site-picker"><select data-select="observation-site" aria-label="조사 장소">${SITES.map(x=>`<option value="${x.id}" ${v.site===x.id?'selected':''}>${siteNames[x.id]}</option>`).join('')}</select></label><nav class="obs-clue-pager" aria-label="단서 넘겨 보기">${clues.map((_,i)=>btn(String(i+1),'focus-index',index===i?'small selected':'small',`data-id="${i}" aria-label="${i+1}번째 단서" aria-pressed="${index===i}"`)).join('')}</nav></div>
        <div class="evidence-layout"><div class="clue-board">${image(SITES.find(x=>x.id===v.site)!.image,'clue-backdrop')}<div class="clue-grid">${clues.map((c,i)=>{const selected=s.clues.includes(c.id);return `<button class="clue-card ${selected?'selected':''} ${i===index?'obs-current':''} ${!selected?'obs-next':''}" data-action="clue" data-id="${c.id}" aria-pressed="${selected}"><span class="obs-clue-heading"><span class="clue-icon">${icon(CLUE_ICONS[c.id],34)}</span><strong>${CLUE_NAMES[c.id]}</strong>${icon(selected?'check':'bag',22)}</span><span class="obs-clue-description">${c.text}</span></button>`;}).join('')}</div></div>
        <aside class="evidence-tray"><div class="panel-heading ${v.replacement?'obs-replacement':''}">${icon('bag',22)}<b>${v.replacement?'바꿀 단서 선택':'모은 단서'}</b></div><div class="obs-evidence-slots">${Array.from({length:5},(_,i)=>{const id=s.clues[i];return id?`<button class="evidence-slot filled ${v.replacement?'replace obs-next':''}" data-action="remove-clue" data-id="${id}" aria-label="${CLUE_NAMES[id]} ${v.replacement?'교체':'빼기'}"><span>${i+1}</span>${icon(CLUE_ICONS[id],20)}<b>${CLUE_NAMES[id]}</b>${icon(v.replacement?'undo':'close',17)}</button>`:`<div class="evidence-slot"><span>${i+1}</span><small>빈칸</small></div>`;}).join('')}</div></aside></div>
      </section>`;
    }
    case 'P03':{
      const targets=v.focus==='targets';
      return `<section class="observation-page observation-p03 ${targets?'obs-mode-targets':'obs-mode-sources'}"><p class="mission-question">단서를 <b>어떤 생활 상황</b>에 연결할까요?</p>${focusTabs(targets?'targets':'sources',[['sources','1 단서'],['targets','2 생활 상황']])}
      <div class="relationship-board"><div class="source-cards">${s.clues.map(id=>`<button class="source-card ${v.clue===id?'selected':''} ${s.relations[id]?'linked':''} ${!v.clue&&!s.relations[id]?'obs-next':''}" draggable="true" data-drag="relation" data-id="${id}" data-action="select-clue" aria-pressed="${v.clue===id}"><span class="clue-icon">${icon(CLUE_ICONS[id],30)}</span><span><strong>${CLUE_NAMES[id]}</strong>${s.relations[id]?`<small>${TARGETS.find(t=>t.id===s.relations[id])?.name}</small>`:''}</span>${icon(s.relations[id]?'check':v.clue===id?'arrow':'link',20)}</button>`).join('')}</div>
      <div class="obs-target-section"><div class="obs-active-selection ${v.clue?'ready':''}" role="status">${icon(v.clue?CLUE_ICONS[v.clue]:'link',22)}<b>${v.clue?CLUE_NAMES[v.clue]:'단서를 먼저 골라요'}</b>${v.clue?icon('arrow',22):''}</div><div class="target-cards">${TARGETS.map(t=>{const attached=Object.entries(s.relations).filter(([,target])=>target===t.id);return `<button class="target-card ${attached.length?'obs-linked-target':''} ${v.clue?'obs-next':''}" data-action="link-target" data-id="${t.id}" data-drop="relation" aria-label="${t.name}, 연결한 단서 ${attached.length}개"><span class="obs-target-title"><span class="target-icon">${icon(t.icon,30)}</span><strong>${t.name}</strong></span>${relationshipScene(t.id)}<span class="obs-link-count">${attached.length?`${icon('check',17)} ${attached.length}개 연결`:icon('arrow',19)}</span></button>`;}).join('')}</div></div></div>
      </section>`;
    }
    case 'P04':{
      // 빠른 분류: 아직 놓지 않은 카드가 차례로 위에 올라오고, 그림 하나만 누르면 된다.
      const placed=Object.values(s.impacts),current=v.effect||DATA.p04.links.find(x=>!placed.includes(x.id))?.id||'';
      const domains=v.focus==='domains',selected=DATA.p04.links.find(x=>x.id===current);
      return `<section class="observation-page observation-p04 ${domains?'obs-mode-domains':'obs-mode-effects'}"><p class="mission-question"><b>누구의 생활</b>에 영향을 줄까요?</p>${focusTabs(domains?'domains':'effects',[['effects','1 영향 카드'],['domains','2 생활 영역']])}
      <div class="impact-layout"><div class="impact-effects">${DATA.p04.links.map(x=>`<button class="impact-effect ${current===x.id?'selected current-card':''} ${Object.values(s.impacts).includes(x.id)?'linked':''} ${current===x.id?'obs-next':''}" data-action="select-effect" data-id="${x.id}" draggable="true" data-drag="impact" aria-pressed="${current===x.id}">${icon('file',30)}<span>${x.effect}</span>${icon(Object.values(s.impacts).includes(x.id)?'check':current===x.id?'arrow':'link',20)}</button>`).join('')}</div>
      <div class="obs-impact-targets"><div class="obs-active-selection ${selected?'ready':''}" role="status">${icon(selected?'file':'link',22)}<b>${selected?selected.effect:'영향 카드를 먼저 골라요'}</b></div><div class="impact-domains">${['self','others','school'].map((d,i)=>{const x=DATA.p04.links.find(x=>x.id===s.impacts[d]);return `<button class="impact-domain domain-${i} ${x?'obs-impact-linked':''} ${selected?'obs-next':''}" data-action="impact-domain" data-id="${d}" data-drop="impact"><span class="obs-impact-scene obs-impact-art" aria-hidden="true">${image(IMPACT_ART[i],'obs-impact-image')}</span><strong>${['나','친구·주변 사람','학급·학교생활'][i]}</strong>${x?`<small class="obs-domain-reason">${icon('check',18)}<span>${x.reason}</span></small>`:''}</button>`;}).join('')}</div></div></div>
      </section>`;
    }
    default:return '';
  }
}

// 생활 상황 그림(손·물건 / 함께 있는 환경 / 기침 / 음식·식기). CSS 아이콘 대신 장면 그림으로 보여 준다.
const RELATION_ART:Record<string,string>={contact:'rel-contact-20261116','shared-environment':'rel-environment-20261116',respiratory:'rel-respiratory-20261116',meal:'rel-meal-20261116'};
function relationshipScene(id:string):string {
  return `<span class="obs-relationship-scene obs-relationship-art" aria-hidden="true">${image(RELATION_ART[id],'obs-rel-image')}</span>`;
}
