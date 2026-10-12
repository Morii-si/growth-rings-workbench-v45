import {aiMessage,userMessage} from './conversation-ui.js';
import {saveResearchReturn} from './research-return.js';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const dialogueKey=f=>`${f.topic.id}-${f.stage}`;
export function dialogueSession(s,f){return s.researchSessions?.[dialogueKey(f)]||{turns:[],draft:''};}
const angles={
 old:[['compare','这会改变上次的看法吗？'],['cause','先拆开可能的原因'],['evidence','还缺哪些证据？']],
 new:[['compare','这算接续能力的证据吗？'],['cause','拆开增长的来源'],['evidence','还需要跟踪什么？']],
 platform:[['compare','哪些假设需要重新检查？'],['cause','把两种能力分开看'],['evidence','下一轮优先查什么？']]
};
export function caseResponse(f,angle){
 const old=f.topic.id==='old',fresh=f.topic.id==='new';
 const established=f.stage===1?'当前仍在建立观察线索，还没有后续经营结果可以验证。':f.stage===2?'这轮补上了一期经营证据，持续性还需要后续同口径材料。':'这次材料需要放回上轮留下的问题里核对。';
 if(angle==='compare')return {title:f.stage===1?'先把假设留清楚':old?'先保留上次的判断边界':fresh?'增长证据，还要分清来源':'对应到原来的两条研究线索',body:old?(f.stage===3?'上次留下的是“持续观察”，并没有确认长期增长。此次 MOLLY 同比下降 33.6%，值得重新检查持续需求；仅凭收入变化，暂时分不清产品节奏与需求减弱。':established+' 需要继续观察产品、内容和用户关系。'):fresh?established+' 头部之外的增长可能来自已有 IP 放量，需要另查新 IP 批次，才能判断接续是否可重复。':established+' 老 IP 的持续经营、新 IP 的接续能力，需要分别验证。单个 IP 的起落不能代表整个平台。',gap:old?'还不能回答：购买需求变弱了，还是这一期的供给节奏变了？':fresh?'还不能回答：这一轮成功能否在后续批次重现？':'还不能回答：增长能否转化为持续的跨周期回报？'};
 if(angle==='cause')return {title:old?'把两种解释放在一起检查':fresh?'先区分已有 IP 放量与新孵化':'分别检查经营与接续',body:old?'产品节奏变化：检查同一 IP 的上新、补货和渠道供给。持续需求减弱：检查复购与后续多期表现。当前材料未给出这些拆分，不能据此选定原因。':fresh?'已有 IP 放量，说明商业化进展；新 IP 接续，还需要首次合作或上市年份、投入、失败项目与后续收入。把二者合在一个增长数字里，容易高估可重复性。':'老 IP 看多期同口径收入与用户关系；新 IP 看固定批次的投入、成败与后续表现。渠道、库存和现金流则帮助检查增长质量。',gap:'以上是待核对的解释与查证路径，当前材料尚不足以确认原因。'};
 return {title:'把下一轮需要补的材料列清楚',body:old?'优先补同一 IP 的上新和补货时间，再核对同口径多期收入；如有用户复购或持续购买的数据，也一起检查。':fresh?'先建立同批次 IP 的观察表，记录首次推出时间、投入、收入与失败项目，再区分单次放量与连续接续。':'分别补老 IP 的持续经营、新 IP 固定批次和渠道经营质量证据，再检查它们对原有假设的影响。',gap:'材料不够时，先把问题留到下次；不用为了结束讨论急着给结论。'};
}
export function addCaseTurn(s,f,angle,refs){
 const choice=angles[f.topic.id].find(x=>x[0]===angle);if(!choice)throw Error('请选择一个案例追问。');
 s.researchSessions??={};const session=s.researchSessions[dialogueKey(f)]??={turns:[],draft:''};
 const answer=caseResponse(f,angle);
 session.turns.push({id:globalThis.crypto?.randomUUID?.()||'case-'+Date.now()+'-'+Math.random().toString(36).slice(2),question:choice[1],angle,answer,references:structuredClone(refs),createdAt:new Date().toISOString()});
 return session;
}
export function dialogueHTML(s,f){
 const session=dialogueSession(s,f),last=session.turns.at(-1);
 return `<div class="research-dialogue"><header class="dialogue-heading"><h2>${esc(f.title.replace('\n',''))}</h2><span>AI 交互 · 预置案例</span></header>
 <div class="dialogue-scroll" aria-label="本轮案例对话" tabindex="0">${aiMessage(`<p>${esc(f.description)}</p><p>${esc(f.hint)}。</p>`,{className:'dialogue-opening'})}
 ${session.turns.map(t=>`<article class="dialogue-turn" id="case-${esc(t.id)}">${userMessage(t.question)}${aiMessage(`<h3>${esc(t.answer.title)}</h3><p>${esc(t.answer.body)}</p><p class="dialogue-gap">${esc(t.answer.gap)}</p><details><summary>这次使用的 ${t.references.length} 份材料</summary>${t.references.map(r=>`<div class="dialogue-citation"><small>${esc(r.label)}</small><blockquote>${esc(r.text)}</blockquote>${r.source?`<a href="${esc(r.source.url)}" target="_blank" rel="noopener noreferrer">核对来源 ↗</a>`:''}</div>`).join('')}</details>`,{className:'dialogue-answer',note:'案例回复'})}</article>`).join('')}</div>
 <div class="dialogue-choices" aria-label="选择案例追问">${angles[f.topic.id].map(([id,label])=>`<button data-dialogue="ask" data-angle="${id}" ${last?.angle===id?'disabled':''}>${esc(label)} <span aria-hidden="true">↗</span></button>`).join('')}</div>
 <form id="dialogue-question-form"><label for="dialogue-question">也可以留下自己的问题</label><div><textarea id="dialogue-question" rows="1" placeholder="例如：先只看国内渠道……">${esc(session.draft)}</textarea><button type="submit">加入本轮讨论 ↑</button></div><small>自由提问会保存到本轮讨论；上方选项可体验预置回复。</small></form>
 ${last?`<div class="dialogue-close"><span>这次聊到的内容会保留，下次可以继续。</span><button data-dialogue="wrap">${session.summary?'查看本轮小结':'整理本轮小结'} →</button></div>`:''}
 ${session.wrapping?`<form id="dialogue-summary-form"><h3>留给下次的研究起点</h3><label for="dialogue-summary">本轮小结 · 可修改</label><textarea id="dialogue-summary" rows="3" required>${esc(session.summaryDraft??last.answer.body)}</textarea><label for="dialogue-next">下次先查什么</label><textarea id="dialogue-next" rows="2" required>${esc(session.nextDraft??f.next)}</textarea><div><button type="button" data-dialogue="fold">收起</button><button type="submit">保存小结与跟进问题</button></div><small>保留案例对话和引用；不会覆盖历史判断。</small></form>`:session.summary?`<div class="dialogue-saved"><strong>本轮小结已留存</strong><p>${esc(session.summary)}</p><button data-action="future">查看下次跟进 →</button></div>`:''}</div>`;
}
export function installResearchDialogue(host,model,draft,openEditor){
 const info=()=>{const s=host.state(),f=model(s,host.ui(),host.current());return {s,f,d:draft(s,host.ui(),host.current(),host.context())};};
 const writable=(s,f)=>{s.researchSessions??={};return s.researchSessions[dialogueKey(f)]??={turns:[],draft:''};};
 document.addEventListener('click',e=>{const b=e.target.closest('[data-dialogue]');if(!b)return;e.preventDefault();e.stopPropagation();const {s,f,d}=info(),session=writable(s,f);
  if(b.dataset.dialogue==='ask')addCaseTurn(s,f,b.dataset.angle,d.references);
  if(b.dataset.dialogue==='wrap')session.wrapping=true;
  if(b.dataset.dialogue==='fold')session.wrapping=false;
  host.persist();host.render();
  if(b.dataset.dialogue==='ask'){const sc=document.querySelector('.dialogue-scroll');sc.scrollTop=sc.scrollHeight;document.querySelector('.research-dialogue')?.scrollIntoView({block:'start'});sc.focus({preventScroll:true});}
  if(b.dataset.dialogue==='wrap')document.querySelector('#dialogue-summary')?.focus();
 },true);
 document.addEventListener('input',e=>{if(!['dialogue-question','dialogue-summary','dialogue-next'].includes(e.target.id))return;const {s,f}=info(),session=writable(s,f);session[{'dialogue-question':'draft','dialogue-summary':'summaryDraft','dialogue-next':'nextDraft'}[e.target.id]]=e.target.value;host.persist();});
 document.addEventListener('submit',e=>{if(!['dialogue-question-form','dialogue-summary-form'].includes(e.target.id))return;e.preventDefault();e.stopPropagation();const {s,f,d}=info(),session=writable(s,f);
  const context=d.references.find(r=>r.kind==='board')?.context||host.context();
  const conversationRef=session.turns.length?{id:'case-session-'+dialogueKey(f),kind:'board',context:structuredClone(context),anchor:'focus-'+f.topic.id+'-'+f.stage,label:'本轮案例讨论 · '+f.topic.name,excerpt:session.turns.at(-1).answer.title,text:session.turns.map(t=>'你：'+t.question+'\n案例回复：'+t.answer.body+'\n'+t.answer.gap).join('\n\n')}:null;
  if(e.target.id==='dialogue-question-form'){const text=session.draft?.trim();if(!text){document.querySelector('#dialogue-question').focus();return;}openEditor({...d,references:[...d.references,...(conversationRef?[conversationRef]:[])],text});return;}
  const summary=document.querySelector('#dialogue-summary').value.trim(),next=document.querySelector('#dialogue-next').value.trim();if(!summary||!next)return;
  session.summary=summary;session.summaryDraft=summary;session.nextDraft=next;session.wrapping=false;
  const summaryRef={id:'case-summary-'+dialogueKey(f),kind:'board',context:structuredClone(context),anchor:'focus-'+f.topic.id+'-'+f.stage,label:'本轮小结 · 用户确认',excerpt:summary,text:summary};
  saveResearchReturn(s,{topic:f.topic.id,stage:f.stage,title:f.topic.name,question:next,when:'下次研究时',context,references:[...d.references,summaryRef,...(conversationRef?[conversationRef]:[])]});
  host.persist();host.render();host.toast('本轮小结与跟进问题已保存');
 },true);
}
