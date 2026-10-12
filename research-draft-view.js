import {researchChatView,fitChatViewport,boardProposal} from './research-chat-view.js';
import {aiMessage,userMessage,researchAnswer,chatEscape as esc} from './conversation-ui.js';
import {latestGeneratedBoard} from './research-room-model.js';
import {roundState,roundPrompts,roundOpeningPrompts,sendRoundInput,generateConversationBoard,setBoardConversationReference,clearBoardConversationReference,sendBoardConversationInput,boardConversationPrompts} from './research-draft-model.js';
const arrow='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>';
const plus='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
const refsFor=messages=>[...new Map(messages.flatMap(m=>m.references||[]).map(r=>[r.id,r])).values()];
function sourceLinks(refs){return refs.length?`<details class="round-message-sources"><summary>来源</summary><ul>${refs.map(ref=>`<li>${ref.kind==='discussion'?`<button class="round-link" type="button" data-room="memory-origin" data-discussion-id="${esc(ref.discussionId)}">${esc(ref.label)}</button>`:ref.source?`<a href="${esc(ref.source.url)}" target="_blank" rel="noopener noreferrer">${esc(ref.label)}${ref.source.page?' · 第 '+esc(ref.source.page)+' 页':''}</a>`:esc(ref.label)}</li>`).join('')}</ul></details>`:'';}
function exchange(m,{sources=true,applied=true,superseded=false}={}){return `<div class="round-exchange" data-message-id="${esc(m.id)}">${m.boardReference?`<blockquote class="round-board-reference"><strong>${esc(m.boardReference.title||m.boardReference.label)}</strong><p>${esc(m.boardReference.quote||m.boardReference.description||m.boardReference.text)}</p></blockquote>`:''}${m.user?userMessage(m.user,{label:m.kind==='demo'?'研究者':'你'}):''}${m.answer?aiMessage(researchAnswer(m.answer)+boardProposal(m.boardChange,{applied,superseded})):m.user?'<p class="round-pending">已记录，待回复。</p>':''}${sources?sourceLinks(m.references||[]):''}</div>`;}
export function fitRoundConversation(){fitChatViewport();}
export function researchRoundWork(s,options={}){return researchChatView(s,options);}
const boardIcon=name=>`<img src="assets/chat-icons/${name}.svg" width="18" height="18" alt="" aria-hidden="true">`;
export function roundBoardSummary(s,{openCategoryId=null}={}){
 const b=latestGeneratedBoard(s);if(!b)return '';
 const categories=(b.categories||[]).filter(c=>c.id!=='uncategorized'||c.origin==='custom');
 const preview=text=>String(text||'').trim().match(/^[^。！？\n]+[。！？]?/)?.[0]||'';
 const bubble=c=>{const messages=(b.messages||[]).filter(m=>c.messageIds?.includes(m.id)),refs=refsFor(messages);return `<details class="round-summary-bubble" data-board-category="${esc(c.id)}" data-annotation-anchor="category-${esc(c.id)}" name="round-summary-${esc(b.id)}" ${openCategoryId===c.id?'open':''}><summary><span class="round-bubble-symbol">${boardIcon('list-search')}</span><span class="round-bubble-label"><span class="round-bubble-title">${esc(c.title)}</span>${c.description?`<span class="round-bubble-preview" aria-hidden="true">${esc(preview(c.description))}</span>`:''}</span><span class="round-bubble-toggle">${boardIcon('plus')}</span></summary><div class="round-bubble-content">${c.description?`<p class="round-bubble-description">${esc(c.description)}</p>`:''}<div class="board-note-actions"><button type="button" data-round="board-quote-category" data-category-id="${esc(c.id)}">引用并讨论 ${arrow}</button></div>${sourceLinks(refs)}</div></details>`;};
 return `<section class="generated-board-summary round-board-summary round-summary-cloud" id="room-record-${esc(b.id)}" data-annotation-anchor="room-record-${esc(b.id)}"><header><h2>本轮研究小结</h2></header><div class="round-summary-grid">${categories.map(bubble).join('')}${!categories.length&&b.summary?`<article class="board-legacy-summary"><p>${esc(b.summary)}</p></article>`:''}</div></section>`;
}
export function roundBoardDiscussion(s){const b=latestGeneratedBoard(s),latestChanges=new Map((b?.messages||[]).filter(m=>m.boardChange).map(m=>[m.boardChange.categoryId,m.id]));return `<div class="discussion-heading"><h2>本轮看板的讨论原文</h2></div><div class="discussion-transcript">${(b?.messages||[]).map(m=>exchange(m,{superseded:!!m.boardChange&&latestChanges.get(m.boardChange.categoryId)!==m.id})).join('')}</div>`;}
export function installResearchDraft(host){
 window.addEventListener('resize',fitRoundConversation);
 window.visualViewport?.addEventListener('resize',fitRoundConversation);
 document.fonts?.ready.then(fitRoundConversation);
 document.addEventListener('toggle',e=>{if(e.target.matches('.chat-more-prompts')&&e.target.open)fitRoundConversation();},true);
 document.addEventListener('click',e=>{document.querySelectorAll('.chat-more-prompts[open]').forEach(menu=>{if(!menu.contains(e.target))menu.open=false;});});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){const menu=document.querySelector('.chat-more-prompts[open]');if(menu){menu.open=false;menu.querySelector('summary').focus();}}});
 document.addEventListener('keydown',e=>{if(e.target.id==='round-input'&&e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();e.target.form?.requestSubmit();}});
 const persist=()=>host.persist(),render=()=>host.render();
 function showBoard(){roundState(host.state()).workspaceMode='conversation';Object.assign(host.ui(),{screen:'archive',future:false,history:null,dataUpdate:true,report:'interim',assistant:false,discussionId:null,roomRecord:null,boardEditingCategoryId:null,boardAddingCategory:false});persist();render();window.scrollTo(0,0);}
 function showConversation(options={}){setBoardConversationReference(host.state(),options);roundState(host.state()).workspaceMode='conversation';Object.assign(host.ui(),{screen:'work',assistant:false,boardOpenCategoryId:options.categoryId||null});persist();render();document.querySelector('#round-input')?.focus({preventScroll:true});const log=document.querySelector('.chat-scroll');if(log)log.scrollTop=log.scrollHeight;}
 document.addEventListener('research-board-quote',event=>showConversation(event.detail||{}));
 function append(text,options){const s=host.state(),r=roundState(s),m=options?.boardPromptId?sendBoardConversationInput(s,text,{promptId:options.boardPromptId}):sendRoundInput(s,text,options);r.conversationDraft='';host.ui().lastRoundMessage=m.id;persist();render();document.querySelector('#round-input')?.focus({preventScroll:true});const log=document.querySelector('.chat-scroll');if(log)log.scrollTop=log.scrollHeight;host.ui().lastRoundMessage=null;}
 document.addEventListener('click',e=>{const b=e.target.closest('[data-round]');if(!b)return;e.preventDefault();e.stopPropagation();const s=host.state(),ui=host.ui(),action=b.dataset.round;try{
 if(action==='generate-board'){const existed=!!latestGeneratedBoard(s);generateConversationBoard(s);showBoard();host.toast(existed?'研究看板已更新':'研究看板已生成');return;}
 if(action==='view-board'){if(latestGeneratedBoard(s))showBoard();return;}
 if(action==='conversation'){roundState(s).workspaceMode='conversation';Object.assign(ui,{screen:'work',assistant:false});persist();render();document.querySelector('#round-input')?.focus();return;}
 if(action==='board-quote-category'){showConversation({categoryId:b.dataset.categoryId});return;}
 if(action==='clear-board-reference'){clearBoardConversationReference(s);persist();render();document.querySelector('#round-input')?.focus({preventScroll:true});return;}
 if(action==='board-prompt'){const prompt=boardConversationPrompts(s).find(p=>p.id===b.dataset.promptId);if(!prompt)return;if(prompt.id==='board:add-category'){const r=roundState(s);if(!r.conversationDraft.trim())r.conversationDraft='新增类目：';persist();render();const input=document.querySelector('#round-input');input?.focus();input?.setSelectionRange(input.value.length,input.value.length);}else append(prompt.text,{boardPromptId:prompt.id});return;}
 if(action==='prompt'){const prompt=[...roundOpeningPrompts(),...roundPrompts()].find(p=>p.id===b.dataset.promptId);if(prompt)append(prompt.text,{directionId:prompt.directionId,promptIndex:prompt.promptIndex});return;}
 }catch(err){host.toast(err.message);}},true);
 document.addEventListener('input',e=>{if(e.target.id==='round-input'){const r=roundState(host.state());r.conversationDraft=e.target.value;const send=document.querySelector('.chat-send');if(send)send.disabled=!e.target.value.trim();persist();}},true);
 document.addEventListener('submit',e=>{if(e.target.id!=='round-chat-form')return;e.preventDefault();e.stopPropagation();try{const text=roundState(host.state()).conversationDraft.trim();if(text)append(text);}catch(err){host.toast(err.message);}},true);
}
