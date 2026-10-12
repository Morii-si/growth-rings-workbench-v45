import {chatEscape as esc,researchAnswer} from './conversation-ui.js';
import {SOURCE} from './engine.js';
import {latestGeneratedBoard} from './research-room-model.js';
import {roundState,conversationBoardPendingCount,roundConversation,roundSuggestedPrompts,roundOpeningPrompts,roundPrompts,boardConversationPrompts} from './research-draft-model.js';

// Self-hosted Tabler icons. The chat reference, rather than the board, owns this surface.
const icon=name=>`<img class="chat-icon" src="assets/chat-icons/${name}.svg" alt="" aria-hidden="true">`;
const arrow=icon('arrow-right'),chevron=icon('chevron-right');
const avatar='<span class="chat-avatar" aria-hidden="true"><img class="chat-brand-avatar" src="assets/growth-rings-favicon.svg" alt=""></span>';

function reportAttachment(){return `<a class="chat-report-attachment" href="${esc(SOURCE.interim.url)}" target="_blank" rel="noopener noreferrer"><span class="chat-file-icon chat-report-book" aria-hidden="true">📖</span><span><strong>2026 半年报</strong><small>泡泡玛特 · 中期业绩公告</small></span>${icon('arrow-up-right')}</a>`;}
function citations(refs){if(!refs.length)return '';return `<details class="chat-citations"><summary>查看来源</summary><ul>${refs.map(ref=>`<li>${ref.kind==='discussion'?`<button type="button" data-room="memory-origin" data-discussion-id="${esc(ref.discussionId)}">${esc(ref.label)}</button>`:ref.source?`<a href="${esc(ref.source.url)}" target="_blank" rel="noopener noreferrer">${esc(ref.label)}${ref.source.page?' · 第 '+esc(ref.source.page)+' 页':''}</a>`:esc(ref.label)}</li>`).join('')}</ul></details>`;}
function welcome(m){return `<div class="chat-exchange chat-opening chat-welcome" data-message-id="${esc(m.id)}"><h1 class="chat-welcome-title text-type" data-welcome-text-type="泡泡玛特发布了半年报" aria-label="泡泡玛特发布了半年报"><span class="text-type__reserve" aria-hidden="true">泡泡玛特发布了半年报<span class="text-type__cursor-space">|</span></span><span class="text-type__visual" aria-hidden="true"><span class="text-type__content">泡泡玛特发布了半年报</span><span class="text-type__cursor">|</span></span></h1><p>MOLLY 回落，星星人增长，库存也有新变化。</p>${reportAttachment()}</div>`;}
function boardReference(reference,{active=false}={}){
 const title=reference.kind==='board'?'新增研究类目':reference.title||reference.label||'引用的看板内容';
 const quote=reference.quote||reference.description||reference.excerpt||reference.text||'';
 const version=reference.version?'V'+reference.version:'研究看板';
 return `<div class="${active?'chat-active-reference':'chat-message-reference'}"><details class="chat-board-reference"><summary><span class="chat-reference-mark" aria-hidden="true">${icon('file-text')}</span><span class="chat-reference-copy"><span class="chat-reference-heading"><small>引用 ${esc(version)}</small><strong>${esc(title)}</strong></span>${quote?`<span class="chat-reference-excerpt">${esc(quote)}</span>`:''}</span>${chevron}</summary>${quote?`<blockquote class="chat-reference-full">${esc(quote)}</blockquote>`:''}</details>${active?'<button class="chat-reference-remove" type="button" data-round="clear-board-reference" aria-label="取消引用" title="取消引用">×</button>':''}</div>`;
}
export function boardProposal(change,{applied=false,superseded=false}={}){
 if(!change)return '';
 const label=superseded?'已由后续讨论调整':applied?'已纳入看板':change.type==='add-category'?'建议新增':'建议更新';
 return `<section class="chat-board-proposal" aria-label="${label}"><div class="chat-proposal-label">${icon('file-text')}<span>${label}</span></div><strong>${esc(change.title)}</strong>${change.description?`<p>${esc(change.description)}</p>`:''}${applied||superseded?'':'<small>点击「更新研究看板」后纳入</small>'}</section>`;
}
function message(m,{animate=false,applied=false,superseded=false}={}){
 const opening=m.kind==='opening';
 // Keep the saved transcript intact; the shared demo notice belongs in the footer.
 const answer=m.answer?.replace(/\n\n当前案例尚未接入补充材料，以上保留为待查问题。$/,'');
 return `<div class="chat-exchange ${opening?'chat-opening':''} ${animate?'chat-new-exchange':''}" data-message-id="${esc(m.id)}">${m.user?`<article class="chat-user" aria-label="你"><div class="chat-user-content">${m.boardReference?boardReference(m.boardReference):''}<div class="chat-user-bubble">${esc(m.user)}</div></div></article>`:''}${m.answer?`<article class="chat-assistant" aria-label="助手">${avatar}<div class="chat-assistant-content"><span class="chat-role">助手</span><div class="chat-assistant-bubble"><div class="chat-answer">${researchAnswer(answer)}</div>${boardProposal(m.boardChange,{applied,superseded})}${opening?reportAttachment():citations(m.references||[])}</div></div></article>`:m.user?`<article class="chat-assistant chat-awaiting" aria-label="助手">${avatar}<div class="chat-assistant-content"><span class="chat-role">助手</span><div class="chat-assistant-bubble"><p>问题已记下，待回复。</p></div></div></article>`:''}</div>`;
}
function promptButton(p,{featured=false,reference=false}={}){return `<button type="button" class="chat-suggestion ${featured?'is-featured':''}" data-round="${reference?'board-prompt':'prompt'}" data-prompt-id="${esc(p.id)}"><span>${esc(p.text)}</span>${arrow}</button>`;}

export function researchChatView(s,{demo='',error='',lastMessage=null,demoSession=false,openingHref='',normalHref='',header=''}={}){
 const r=roundState(s),messages=roundConversation(s),reference=r.boardConversationReference,hasMessages=messages.some(m=>m.user),started=hasMessages||!!reference;
 const lastUserMessage=messages.filter(m=>m.user).at(-1),quotedTurn=!reference&&!!lastUserMessage?.boardReference;
 const suggested=reference?boardConversationPrompts(s):quotedTurn?[]:roundSuggestedPrompts(s);
 const board=latestGeneratedBoard(s),pending=conversationBoardPendingCount(s),boardAction=board&&!pending?'view-board':'generate-board',boardLabel=board?(pending?'更新研究看板':'查看研究看板'):'生成研究看板';
 const incorporated=new Set((board?.messages||[]).map(m=>m.id));
 const latestSavedProposal=new Map((board?.messages||[]).filter(m=>m.boardChange).map(m=>[m.boardChange.categoryId,m.id]));
 const placeholder=reference?(reference.kind==='board'?'例如：新增类目：渠道与增长质量':'围绕这段内容，聊聊你的想法…'):started?'继续追问，或聊聊你的想法…':'想先了解什么？';
 const boardButton=`<button type="button" class="chat-draft-button" data-round="${boardAction}" ${hasMessages||board?'':'disabled title="先聊一个问题，再生成研究看板"'}>${icon('file-text')}<span>${boardLabel}</span></button>`;
 const shown=suggested.slice(0,started?2:3),shownIds=new Set(shown.map(p=>p.id));
 const asked=new Set(messages.filter(m=>m.directionId&&m.promptIndex!==undefined).map(m=>m.directionId+':'+m.promptIndex));
 const discussed=new Set(messages.filter(m=>m.user).map(m=>m.directionId));
 const more=reference?suggested.slice(shown.length):quotedTurn?[]:[...roundOpeningPrompts(),...roundPrompts().filter(p=>discussed.has(p.directionId))].filter(p=>!asked.has(p.id)&&!shownIds.has(p.id));
 return `<div class="research-chat-page ${started?'has-conversation':'is-opening'} ${reference?'has-board-reference':''}">${header}${error}<main id="main" class="chat-stage" tabindex="-1"><div class="chat-scroll" role="log" aria-label="本次完整讨论" tabindex="0"><div class="chat-message-column">${messages.map(m=>!started&&m.kind==='opening'?welcome(m):message(m,{animate:m.id===lastMessage,applied:incorporated.has(m.id),superseded:incorporated.has(m.id)&&!!m.boardChange&&latestSavedProposal.get(m.boardChange.categoryId)!==m.id})).join('')}</div></div><div class="chat-input-dock"><div class="chat-input-card">${reference?boardReference(reference,{active:true}):''}${shown.length?`<div class="chat-suggestion-bar"><div class="chat-suggestions">${shown.map((p,i)=>promptButton(p,{featured:!started&&i===1,reference:!!reference})).join('')}</div>${more.length?`<details class="chat-more-prompts"><summary aria-label="更多问题" title="更多问题">${icon('dots')}</summary><div class="chat-question-menu"><header>继续聊什么</header>${more.map(p=>promptButton(p,{reference:!!reference})).join('')}</div></details>`:''}</div>`:''}<form id="round-chat-form" class="chat-composer"><label for="round-input" class="visually-hidden">继续讨论</label><textarea id="round-input" rows="${started?'2':'1'}" placeholder="${esc(placeholder)}">${esc(r.conversationDraft)}</textarea><div class="chat-composer-actions">${boardButton}<button class="chat-send" type="submit" aria-label="发送问题" ${r.conversationDraft.trim()?'':'disabled'}>${arrow}</button></div></form></div></div></main><div class="chat-footnote">${demo}</div></div>`;
}

export function fitChatViewport(){
 const page=document.querySelector('.research-chat-page');if(!page)return;
 page.style.setProperty('--chat-viewport-height',`${Math.round(window.visualViewport?.height||window.innerHeight)}px`);
 const card=page.querySelector('.chat-input-card');
 page.style.setProperty('--chat-input-top',`${Math.round(card.getBoundingClientRect().top)}px`);
 page.style.setProperty('--chat-menu-height',`${Math.max(130,Math.min(380,card.getBoundingClientRect().top-80))}px`);
}
