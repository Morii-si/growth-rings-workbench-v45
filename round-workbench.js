import {SOURCE,DATA,versionNumber} from './engine.js';
import {latestGeneratedBoard} from './research-room-model.js';
import {focusDraft,focusModel} from './research-focus.js';
import {installResearchDialogue} from './research-dialogue.js';
import {researchReturns,savedReturn,saveResearchReturn} from './research-return.js';
import {pendingAnnotations,removePendingAnnotation} from './workbench.js';
import {referencesFor,sentRoundNotes,roundCount,prepareRoundDraft,saveRoundDraft,sendRound} from './round-model.js';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=x=>structuredClone(x),$=s=>document.querySelector(s);
let host,editorOrigin,returnPoint;
const allNotes=s=>[...pendingAnnotations(s),...sentRoundNotes(s)];
const displayNumber=(s,id)=>s.annotations.findIndex(n=>n.id===id)+1;
const time=x=>new Date(x).toLocaleString('zh-CN',{hour12:false});
function refHTML(ref,editable=false,noteId=''){
 return `<article class="rw-reference" data-kind="${esc(ref.kind)}"><header><span>${esc(ref.label)}</span>${editable?`<button type="button" data-rw="remove-ref" data-id="${esc(ref.id)}">移除 ×</button>`:''}</header><p>${esc(ref.excerpt||ref.text.slice(0,90))}</p><details><summary>查看完整引用与来源</summary><div class="rw-full">${esc(ref.text)}</div>${ref.source?`<a href="${esc(ref.source.url)}" target="_blank" rel="noopener noreferrer">${esc(ref.source.name)} ↗</a>`:''}</details>${noteId?`<button class="rw-link" data-rw="locate" data-note="${noteId}" data-id="${esc(ref.id)}">定位原文 ↗</button>`:''}</article>`;
}
function noteHTML(s,n){return `<article class="rw-note" id="rw-${n.id}"><header><span class="rw-number">${displayNumber(s,n.id)}</span><small>${n.sentAt?'已模拟发送':'待发送'} · ${esc(n.context.label)}</small><time>${esc(time(n.sentAt||n.createdAt))}</time></header>${n.parent?`<details class="rw-parent"><summary>接着上一问</summary><p>${esc(n.parent.text)}</p><button data-rw="show-note" data-id="${n.parent.id}">回看上一问</button></details>`:''}<h3>${esc(n.text)}</h3><details class="rw-note-refs"><summary>${n.sentAt?'已随问题发送':'将随问题发送'} · ${referencesFor(n).length} 份引用</summary>${referencesFor(n).map(ref=>refHTML(ref,false,n.id)).join('')||'<p>这条问题没有附带引用。</p>'}</details><div class="rw-note-actions">${n.sentAt?`<button data-rw="followup" data-id="${n.id}">接着问 →</button>`:`<button data-rw="edit" data-id="${n.id}">编辑</button><button data-rw="remove" data-id="${n.id}">移除</button>`}</div></article>`;}
export function roundPanel(s){const pending=pendingAnnotations(s),sent=sentRoundNotes(s);return `<section class="rw-panel"><div class="rw-toolbar"><strong>本轮讨论 · ${roundCount(s)}</strong><button data-rw="new">＋ 补充问题</button></div>${s.roundDraft?'<button class="rw-resume" data-rw="resume">有一条未完成的草稿 · 继续编辑 →</button>':''}<div class="rw-scroll"><h2>待发送 <small>${pending.length} 个问题</small></h2>${pending.map(n=>noteHTML(s,n)).join('')||'<p class="rw-empty">选中看板里的数字、判断或讨论原文，留下你的问题。</p>'}${pending.length?`<button class="rw-send" data-rw="send">一起发送 · ${pending.length} 个问题</button>`:''}<h2 class="rw-record-heading">本轮记录 <small>${sent.length} 个问题</small></h2><p class="rw-empty">${sent.length?'以下是前端模拟发送记录，未连接 AI，尚无新回复。':'发送后，问题和引用会保留在这里。'}</p>${sent.map(n=>noteHTML(s,n)).join('')}</div></section>`;}
function stageContext(versionId){return {key:'version:'+versionId+':'+(versionId===1?'original':'annual'),stage:'version',versionId,report:versionId===1?'original':'annual',label:'V'+versionNumber(versionId)+' · '+(versionId===1?'初始研究':'2025 年业绩研究')};}
function discussionRef(id){const m=host.state().discussions.find(x=>x.id===id);if(!m)return null;const context=stageContext(id.startsWith('origin-')?1:2);return {id:'discussion-'+id,kind:'discussion',discussionId:id,context,label:context.label+' · '+m.topic,excerpt:m.conclusion||m.question,text:'研究者：'+m.question+'\n\nAI 案例回复：'+m.answer+(m.conclusion?'\n\n当时留下的判断：'+m.conclusion:''),source:SOURCE[m.source]?clone(SOURCE[m.source]):null};}
function currentMollyRef(){const context={key:'update:2:interim',stage:'update',versionId:2,report:'interim',label:'V3 · 2026年半年报'},a=DATA.interim.molly;return {id:'board-molly-interim',kind:'board',context,anchor:'ip-row-MOLLY',label:context.label+' · MOLLY',excerpt:'MOLLY 收入同比下降 33.6%',text:'2026 上半年 MOLLY 收入 '+(a[1]/100000).toFixed(2)+' 亿元，上年同期 '+(a[0]/100000).toFixed(2)+' 亿元，同比下降 33.6%。比较口径：2025 上半年 → 2026 上半年。',source:clone(SOURCE.interim)};}
function cleanText(el){const copy=el.cloneNode(true);copy.querySelectorAll('button,.rw-markers').forEach(n=>n.remove());return copy.textContent.replace(/\s+/g,' ').trim();}
function boardRef(el,excerpt=''){
 const context=host.context(),table=el.closest('table'),unit=table?.closest('.ip-module')?(context.report==='interim'?'人民币 · 亿元；2025 上半年 → 2026 上半年。':'人民币 · 亿元；2024 全年 → 2025 全年。'):context.label+'；单位与口径见表头。';
 return {id:context.key+':'+el.dataset.annotationAnchor,kind:'board',context:clone(context),anchor:el.dataset.annotationAnchor,label:context.label,excerpt:excerpt||cleanText(el).slice(0,100),text:(table?unit+'\n'+cleanText(table.querySelector('thead'))+'\n':'')+cleanText(el),source:SOURCE[context.report]?clone(SOURCE[context.report]):null};
}
function suggestions(){const refs=[];if(host.ui().dataUpdate||host.state().roundDraft?.references.some(r=>r.context?.report==='interim')){refs.push(currentMollyRef());refs.push(discussionRef('demo-old-ip'));}return refs.filter(Boolean);}
function draftOptions(){const selected=host.state().roundDraft.references;return suggestions().filter(ref=>!selected.some(x=>x.id===ref.id));}
function persist(){host.persist();}
function editorRefs(){const draft=host.state().roundDraft;$('#rw-ref-list').innerHTML=draft.references.map(ref=>refHTML(ref,true)).join('')||'<p class="rw-empty">没有附带引用，将仅发送问题。</p>';$('#rw-ref-count').textContent=draft.references.length+' 份';$('#rw-ref-options').innerHTML=draftOptions().map(ref=>`<button type="button" data-rw="add-ref" data-id="${esc(ref.id)}">＋ ${esc(ref.label)}</button>`).join('');}
function openEditor(options={}){
 if(document.body.classList.contains('rail')&&host.ui().screen==='archive'&&!options.editing&&!options.parent){
  const reference=options.references?.[0];if(reference){document.dispatchEvent(new CustomEvent('research-board-quote',{detail:{reference}}));return;}
 }
 const s=host.state(),hadDraft=!!s.roundDraft;
 prepareRoundDraft(s,{context:host.context(),...options});persist();
 if(hadDraft&&options.editing!==s.roundDraft.editing)host.toast('已保留未完成的草稿，请先完成这条问题。');
 let dialog=$('#rw-editor');if(dialog?.open){$('#rw-question').focus();return;}
 const active=document.activeElement,selector=active?.dataset.rw?`[data-rw="${active.dataset.rw}"]${active.dataset.id?`[data-id="${CSS.escape(active.dataset.id)}"]`:''}`:null;
 editorOrigin={y:scrollY,focus:active,selector};
 if(!dialog){dialog=document.createElement('dialog');dialog.id='rw-editor';dialog.setAttribute('aria-labelledby','rw-editor-title');document.body.append(dialog);dialog.addEventListener('cancel',event=>{event.preventDefault();closeEditor();});}
 const draft=s.roundDraft;
 dialog.innerHTML=`<form id="rw-form"><header class="rw-editor-head"><div><small>${draft.editing?'编辑待发送问题':draft.parent?'接着上一问':'本轮讨论'}</small><h2 id="rw-editor-title">这次，想继续弄清什么？</h2></div><button type="button" data-rw="close" aria-label="收起并保留草稿">×</button></header><div class="rw-editor-body">${draft.parent?`<div class="rw-parent-preview"><small>接着上一问</small><p>${esc(draft.parent.text)}</p></div>`:''}<div class="rw-ref-heading"><strong>这次讨论参考 <span id="rw-ref-count"></span></strong><span>可展开、移除</span></div><div id="rw-ref-list"></div><div id="rw-ref-options"></div><label for="rw-question">我的问题</label><textarea id="rw-question" rows="4" placeholder="这次变化，还需要哪些证据才能理解？">${esc(draft.text)}</textarea><p class="rw-empty">只会带上这里列出的引用${draft.parent?'和上一问':''}，也可以直接提问。</p><div id="rw-discard-confirm" hidden>放弃未保存的草稿？ <button type="button" data-rw="discard-confirm">放弃</button><button type="button" data-rw="keep">继续编辑</button></div></div><footer class="rw-editor-foot"><button type="button" data-rw="discard">放弃草稿</button><div><button type="button" data-rw="close">收起，稍后继续</button><button type="submit" id="rw-save" ${draft.text.trim()?'':'disabled'}>${draft.editing?'保存修改':'加入待发送'}</button></div></footer></form>`;
 editorRefs();dialog.showModal();document.body.classList.add('rw-editing');$('#rw-question').focus({preventScroll:true});
 $('#rw-question').addEventListener('input',event=>{host.state().roundDraft.text=event.target.value;$('#rw-save').disabled=!event.target.value.trim();persist();});
 $('#rw-form').addEventListener('submit',event=>{event.preventDefault();const n=saveRoundDraft(host.state());persist();closeEditor();host.toast('已保存到本轮讨论');showSavedNotice(n.id);});
}
function closeEditor(){const dialog=$('#rw-editor');if(dialog?.open)dialog.close();document.body.classList.remove('rw-editing');host.render();if(editorOrigin){window.scrollTo({top:editorOrigin.y,behavior:'instant'});const target=editorOrigin.selector?$(editorOrigin.selector):editorOrigin.focus?.isConnected?editorOrigin.focus:null;target?.focus({preventScroll:true});}}
function showSavedNotice(id){let el=$('#rw-saved');if(!el){el=document.createElement('button');el.id='rw-saved';document.body.append(el);}el.textContent='问题已保存 · 查看本轮讨论 →';el.dataset.rw='show-note';el.dataset.id=id;clearTimeout(showSavedNotice.timer);showSavedNotice.timer=setTimeout(()=>el.remove(),6500);}
function showNote(id){const ui=host.ui();ui.panel='annotations';ui.assistant=true;host.render();requestAnimationFrame(()=>{const node=$('#rw-'+id);node?.scrollIntoView({block:'nearest'});node?.classList.add('rw-highlight');setTimeout(()=>node?.classList.remove('rw-highlight'),1800);});}
function locate(ref,noteId){
 const ui=host.ui();returnPoint={ui:{screen:ui.screen,roomChecksOpen:ui.roomChecksOpen,roomRecordsOpen:ui.roomRecordsOpen,roomRecord:ui.roomRecord,history:ui.history,dataUpdate:ui.dataUpdate,future:ui.future,report:ui.report,discussionId:ui.discussionId,focusTopic:ui.focusTopic},id:noteId,y:scrollY};
 if(ref.anchor?.startsWith('focus-'))ui.focusTopic=ref.anchor.split('-')[1];
 ui.screen=ref.context.stage==='update'&&!latestGeneratedBoard(host.state())?'work':'archive';ui.roomChecksOpen=false;ui.roomRecordsOpen=!!ref.anchor?.startsWith('room-record-');ui.roomRecord=ui.roomRecordsOpen?ref.anchor.slice('room-record-'.length):null;ui.future=ref.context.stage==='future';ui.dataUpdate=ref.context.stage==='update';ui.history=ref.context.versionId;ui.report=ref.context.report;ui.panel=ref.kind==='discussion'?'chat':'annotations';ui.assistant=ref.kind==='discussion'||(ui.screen!=='work'&&innerWidth>=1280);ui.discussionId=ref.discussionId||null;ui.memoryQuery='';host.render();
 const target=ref.kind==='discussion'?$('#memory-'+ref.discussionId):[...document.querySelectorAll('[data-annotation-anchor]')].find(el=>el.dataset.annotationAnchor===ref.anchor)||$('#main');
 let ancestor=target?.parentElement;while(ancestor){if(ancestor.tagName==='DETAILS')ancestor.open=true;ancestor=ancestor.parentElement;}
 target?.scrollIntoView({block:'center'});target?.classList.add('rw-highlight');setTimeout(()=>target?.classList.remove('rw-highlight'),1800);
 let back=$('#rw-back');if(!back){back=document.createElement('button');back.id='rw-back';document.body.append(back);}back.dataset.rw='return';back.textContent='正在查看引用 · 返回问题 →';
 if($('#assistant-dialog')?.open)$('#assistant-dialog').append(back);
}
export function refreshRoundWorkbench(){if(!host)return;const s=host.state();
 const dialogue=document.querySelector('.dialogue-scroll');if(dialogue?.querySelector('.dialogue-turn'))dialogue.scrollTop=dialogue.scrollHeight;
 document.querySelectorAll('.ip-module tbody tr').forEach(row=>row.dataset.annotationAnchor='ip-row-'+row.querySelector('th').textContent.trim());
 document.querySelectorAll('.rw-markers,.rw-history-ask,.rw-inline-ask,.rw-next-question,.rw-draft-banner').forEach(el=>el.remove());
 document.querySelectorAll('.research-questions article').forEach(el=>{const b=document.createElement('button');b.className='rw-inline-ask';b.dataset.rw='ask-block';b.textContent='就这条研究提问 ＋';el.append(b);});
 document.querySelectorAll('.discussion-entry').forEach(el=>{const b=document.createElement('button');b.className='rw-history-ask';b.dataset.rw='history';b.dataset.id=el.id.replace(/^memory-/,'');b.textContent=host.ui().dataUpdate&&b.dataset.id==='demo-old-ip'?'带着新旧材料，问这次变化 →':'带着这段讨论提问 →';el.querySelector('.discussion-transcript')?.append(b);});
 for(const [index,n] of allNotes(s).entries())for(const ref of referencesFor(n)){if(ref.kind!=='board'||ref.context.key!==host.context().key)continue;const target=[...document.querySelectorAll('[data-annotation-anchor]')].find(el=>el.dataset.annotationAnchor===ref.anchor);if(!target)continue;const container=target.matches('tr')?target.querySelector('th'):target;let marker=container.querySelector(':scope > .rw-markers');if(!marker){marker=document.createElement('span');marker.className='rw-markers';container.append(marker);}if(marker.querySelector(`[data-id="${n.id}"]`))continue;const button=document.createElement('button');button.dataset.rw='show-note';button.dataset.id=n.id;button.textContent=displayNumber(s,n.id);button.setAttribute('aria-label','查看问题 '+displayNumber(s,n.id));marker.append(button);}
 if(s.roundDraft&&host.ui().panel!=='annotations'){const banner=document.createElement('button');banner.className='rw-draft-banner';banner.dataset.rw='resume';banner.textContent='有未完成的提问 · 继续编辑 →';document.querySelector('.stage-tools')?.append(banner);}
 if(host.ui().dataUpdate&&host.ui().screen!=='work'&&!latestGeneratedBoard(s)){const node=document.createElement('div');node.className='rw-next-question';node.innerHTML='<strong>上次待验证：老 IP 的增长能否持续？</strong><span>这次收入回落，原因还需要产品与需求证据。</span><button data-rw="suggest">继续问：新品节奏变了，还是持续需求减弱？ →</button><small>本轮提问建议 · 等你确认</small>';document.querySelector('.research-thread')?.append(node);}
}
function selectedAnnotation(event){
 if(event?.target?.closest('#selection-annotation'))return;
 $('#selection-annotation')?.remove();if($('#rw-editor')?.open)return;const selection=getSelection();if(!selection||selection.isCollapsed||!selection.rangeCount)return;
 const range=selection.getRangeAt(0),node=range.commonAncestorContainer.nodeType===1?range.commonAncestorContainer:range.commonAncestorContainer.parentElement;
 if(node.closest('textarea,input,button,select'))return;
 const discussion=node.closest('.discussion-entry'),target=node.closest('[data-annotation-anchor]');if(!discussion&&!target?.closest('#main'))return;
 const text=selection.toString().trim();if(!text)return;let ref=discussion?discussionRef(discussion.id.replace(/^memory-/,'')):boardRef(target,text);if(!ref)return;ref.excerpt=text;
 const button=document.createElement('button'),box=range.getBoundingClientRect();button.id='selection-annotation';button.className='primary selection-annotation';button.textContent='就这段提问';button.style.left=Math.max(12,Math.min(box.left,innerWidth-150))+'px';button.style.top=Math.max(12,Math.min(box.bottom+8,innerHeight-70))+'px';button.addEventListener('pointerdown',event=>event.preventDefault());button.addEventListener('click',()=>{selection.removeAllRanges();button.remove();const category=node.closest('[data-board-category]');if(document.body.classList.contains('rail')&&host.ui().screen==='archive'){document.dispatchEvent(new CustomEvent('research-board-quote',{detail:category?{categoryId:category.dataset.boardCategory,quote:text}:{reference:ref}}));}else openEditor({references:[ref]});});(node.closest('dialog')||document.body).append(button);
}
export function installRoundWorkbench(adapter){host=adapter;
 installResearchDialogue(host,focusModel,focusDraft,openEditor);
 const s=host.state();if(s.discussionComposer&&!s.roundDraft){const c=s.discussionComposer;if(c.text?.trim()){const target=c.target||{context:host.context(),anchor:'board',quote:''};prepareRoundDraft(s,{context:target.context,text:c.text,editing:pendingAnnotations(s).some(n=>n.id===c.editing)?c.editing:null,references:target.quote?[{id:'legacy-draft',kind:'board',label:target.context.label,context:clone(target.context),anchor:target.anchor,text:target.quote,excerpt:target.quote}]:[]});}s.discussionComposer=null;host.ui().annotationText='';host.ui().annotationEditing=null;}
 document.addEventListener('click',event=>{
  const b=event.target.closest('button');if(!b)return;let action=b.dataset.rw;
  const old=b.dataset.action;
  if(old?.startsWith('ask-')||old==='note-question'){event.preventDefault();event.stopPropagation();openEditor({text:b.dataset.question||''});return;}
  if(!action)return;event.preventDefault();event.stopPropagation();const state=host.state();
  if(action==='focus-start')openEditor(focusDraft(state,host.ui(),host.current(),host.context()));
  if(action==='focus-current'){const d=focusDraft(state,host.ui(),host.current(),host.context());openEditor({references:d.references.filter(ref=>ref.kind==='board'),text:''});}
  if(action==='return-edit'){
   const f=focusModel(state,host.ui(),host.current()),key=f.topic.id+'-'+f.stage,entry=savedReturn(state,f.topic.id,f.stage),d=focusDraft(state,host.ui(),host.current(),host.context());
   state.returnComposers??={};state.returnComposers[key]??={topic:f.topic.id,stage:f.stage,title:f.topic.name,question:entry?.question||f.next,when:entry?.when||'下次业绩披露',context:structuredClone(entry?.context||d.references.find(r=>r.kind==='board')?.context||host.context()),references:structuredClone(entry?.references||d.references)};
   host.ui().returnEditor=true;persist();host.render();$('#return-question')?.focus();
  }
  if(action==='return-cancel'){host.ui().returnEditor=false;host.render();$('.focus-later,[data-rw="return-edit"]')?.focus({preventScroll:true});}
  if(action==='return-resume'){const entry=researchReturns(state).find(x=>x.id===b.dataset.id);if(entry)openEditor({context:entry.context,text:entry.question,references:entry.references});}
  if(action==='return-open'){
   const entry=researchReturns(state).find(x=>x.id===b.dataset.id);if(entry){const record=entry.references.find(ref=>ref.anchor?.startsWith('room-record-'));Object.assign(host.ui(),{screen:entry.stage===3?'work':'archive',roomChecksOpen:false,roomRecordsOpen:!!record,roomRecord:record?.anchor.slice('room-record-'.length)||null,future:false,dataUpdate:entry.stage===3,history:entry.stage===3?null:entry.stage,report:entry.context.report,focusTopic:entry.topic,returnEditor:false,assistant:false});host.render();(record?document.getElementById(record.anchor):$('.company-round-heading'))?.scrollIntoView({block:'start'});}
  }
  if(action==='new')openEditor();
  if(action==='resume')openEditor();
  if(action==='close')closeEditor();
  if(action==='discard'){$('#rw-discard-confirm').hidden=false;$('#rw-discard-confirm button').focus();}
  if(action==='keep'){$('#rw-discard-confirm').hidden=true;$('#rw-question').focus();}
  if(action==='discard-confirm'){state.roundDraft=null;persist();closeEditor();}
  if(action==='remove-ref'){state.roundDraft.references=state.roundDraft.references.filter(ref=>ref.id!==b.dataset.id);persist();editorRefs();$('#rw-question').focus({preventScroll:true});}
  if(action==='add-ref'){const ref=draftOptions().find(ref=>ref.id===b.dataset.id);if(ref)state.roundDraft.references.push(ref);persist();editorRefs();}
  if(action==='ask-block')openEditor({references:[boardRef(b.closest('[data-annotation-anchor]'))]});
  if(action==='history'||action==='suggest'){const ref=discussionRef(action==='suggest'?'demo-old-ip':b.dataset.id);if(ref){const references=host.ui().dataUpdate&&ref.discussionId==='demo-old-ip'?[currentMollyRef(),ref]:[ref];openEditor({references,text:action==='suggest'?'收入回落与新品推出节奏是否有关？还需要哪些证据来区分产品节奏变化与持续需求减弱？':''});}}
  if(action==='edit'){const n=pendingAnnotations(state).find(n=>n.id===b.dataset.id);if(n)openEditor({editing:n.id});}
  if(action==='remove'){if(state.roundDraft?.editing===b.dataset.id){host.toast('这条问题正在编辑，请先完成或放弃草稿。');openEditor();return;}removePendingAnnotation(state,b.dataset.id);persist();host.render();}
  if(action==='send'){try{sendRound(state);persist();host.render();host.toast('已模拟发送，问题与引用已保留在本轮记录。');}catch(error){host.toast(error.message);if(state.roundDraft)openEditor();}}
  if(action==='show-note'){showNote(b.dataset.id);$('#rw-saved')?.remove();}
  if(action==='followup'){const n=sentRoundNotes(state).find(n=>n.id===b.dataset.id);if(n)openEditor({references:referencesFor(n),parent:{id:n.id,text:n.text}});}
  if(action==='locate'){const n=allNotes(state).find(n=>n.id===b.dataset.note),ref=n&&referencesFor(n).find(ref=>ref.id===b.dataset.id);if(ref)locate(ref,n.id);}
  if(action==='return'&&returnPoint){const p=returnPoint;Object.assign(host.ui(),p.ui);returnPoint=null;$('#rw-back')?.remove();showNote(p.id);}
 },true);
 document.addEventListener('input',event=>{
  const form=event.target.closest('#focus-return-form');if(!form)return;
  const draft=host.state().returnComposers?.[form.dataset.returnKey];if(!draft)return;
  draft.question=form.elements.question.value;draft.when=form.elements.when.value;persist();
 });
 document.addEventListener('change',event=>{
  const id=event.target.dataset.rwReturnDone;if(!id)return;
  const entry=researchReturns(host.state()).find(x=>x.id===id);if(entry){entry.done=event.target.checked;persist();host.render();const checkbox=document.querySelector(`[data-rw-return-done="${CSS.escape(id)}"]`);if(checkbox?.closest('.return-completed'))checkbox.closest('.return-completed').open=true;checkbox?.focus({preventScroll:true});}
 });
 document.addEventListener('submit',event=>{
  if(event.target.id!=='focus-return-form')return;event.preventDefault();event.stopPropagation();
  const form=event.target,key=form.dataset.returnKey,draft=host.state().returnComposers?.[key];if(!draft)return;
  try{saveResearchReturn(host.state(),{...draft,question:form.elements.question.value,when:form.elements.when.value});delete host.state().returnComposers[key];host.ui().returnEditor=false;persist();host.render();host.toast('问题和材料已留到未来跟进，下次可以直接接着问。');$('.focus-kept [data-action="future"]')?.focus({preventScroll:true});}
  catch(error){const node=form.querySelector('.return-error');node.hidden=false;node.textContent=error.message;}
 },true);
 document.addEventListener('pointerup',selectedAnnotation);document.addEventListener('keyup',event=>{if(event.key==='Shift'||event.key.startsWith('Arrow'))selectedAnnotation();});
 window.addEventListener('scroll',()=>$('#selection-annotation')?.remove(),{passive:true});
 window.addEventListener('storage',event=>{
  if(event.key==='yanji-comparison-v1'&&$('#rw-editor')?.open){
   closeEditor();host.toast('另一窗口的记录已同步，请从本轮讨论重新打开草稿。');
  }
 });
}
