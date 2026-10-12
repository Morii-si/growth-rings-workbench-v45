import {versionNumber} from './engine.js';
import {latest,visibleSources,claimReferences,suggestions,questions} from './engine.js';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const annotationLabel = context => context.stage==='update' ? context.label.replace(/^V2\.2/, 'V3') : context.stage==='version' ? context.label.replace(/^V\d+/, 'V'+versionNumber(context.versionId)) : context.label;
function recordId(){
 if(typeof crypto.randomUUID==='function')return crypto.randomUUID();
 // Local record identifiers also work on HTTP previews; they are not credentials.
 const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
 const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
 return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
export function ensureAnnotations(s){if(!Array.isArray(s.annotations))s.annotations=[];return s.annotations;}
export function addAnnotation(s,{context,anchor,quote,text}){
 if(!String(text||'').trim())throw Error('请填写批注。');
 if(!context?.key||!s.versions.some(v=>v.id===context.versionId))throw Error('批注看板不存在。');
 const a={id:'annotation-'+recordId(),createdAt:new Date().toISOString(),context:structuredClone(context),anchor:anchor||'board',quote:String(quote||''),text:String(text).trim()};
 ensureAnnotations(s).push(a);return a;
}
export function prepareJudgment(s){
 const base=latest(s);
 if(!s.judgmentDraft)s.judgmentDraft={baseId:base.id,summary:base.summary,texts:[...base.claims],reason:'',annotationIds:[],source:null};
 return s.judgmentDraft;
}
export function attachAnnotation(s,id){const a=ensureAnnotations(s).find(x=>x.id===id);if(!a)throw Error('找不到这条批注。');const d=prepareJudgment(s);if(!d.annotationIds.includes(id))d.annotationIds.push(id);return d;}
export function loadSuggestions(s){if(s.period!=='interim')throw Error('请先载入半年报。');const d=prepareJudgment(s);d.texts=[...suggestions];d.source='interim';return d;}
export function confirmJudgment(s){
 const d=s.judgmentDraft,old=latest(s);
 if(!d||d.baseId!==old.id)throw Error('当前判断已更新，请放弃旧草稿后重新编辑。');
 if(!d.summary.trim()||d.texts.some(x=>!x.trim()))throw Error('总判断和三个研究问题都需要填写。');
 if(!d.reason.trim())throw Error('请记录本轮判断的依据。');
 const claims=d.texts.map(x=>x.trim()),summary=d.summary.trim(),changed=summary!==old.summary||claims.some((x,i)=>x!==old.claims[i]);
 const annotationSnapshot=ensureAnnotations(s).filter(a=>d.annotationIds.includes(a.id)).map(a=>structuredClone(a));
 const id='review-'+recordId(),createdAt=new Date().toISOString(),date=s.period==='interim'?'2026-08-20':'2026-03-25',oldRefs=claimReferences(s,old);
 if(changed)s.versions.push({id:old.id+1,date,createdAt,label:'判断更新',summary,claims,claimRefs:claims.map((x,i)=>x===old.claims[i]?oldRefs[i]:{kind:'review',id}),sources:visibleSources(s,null),reason:d.reason.trim(),kind:'user',annotationSnapshot});
 s.reviews.push({id,date,createdAt,baseVersion:old.id,version:latest(s).id,reason:d.reason.trim(),changed,source:d.source,beforeClaims:[...old.claims],afterClaims:claims,beforeSummary:old.summary,afterSummary:summary,annotationSnapshot});
 if(d.source==='interim'){s.lastReviewed=date;s.alert='reviewed';}s.draft=null;s.judgmentDraft=null;return changed;
}
export function pendingAnnotations(s){return ensureAnnotations(s).filter(a=>!a.status||a.status==='draft');}
export function editPendingAnnotation(s,id,text){const a=pendingAnnotations(s).find(a=>a.id===id);if(!a)throw Error('这条批注已发送，不能修改。');if(!text.trim())throw Error('请填写批注。');a.text=text.trim();a.updatedAt=new Date().toISOString();return a;}
export function removePendingAnnotation(s,id){const a=pendingAnnotations(s).find(a=>a.id===id);if(!a)throw Error('只能移除待发送批注。');a.status='removed';}
export function sendDiscussionBatch(s){
 const notes=pendingAnnotations(s);if(!notes.length)throw Error('请先添加本轮要讨论的问题。');
 if(!Array.isArray(s.discussionBatches))s.discussionBatches=[];
 const batch={id:'batch-'+recordId(),createdAt:new Date().toISOString(),status:'simulated',annotations:structuredClone(notes)};
 s.discussionBatches.push(batch);for(const a of notes){a.status='sent';a.batchId=batch.id;}return batch;
}
export function annotationPanel(s,ui,context){
 const list=pendingAnnotations(s),batches=s.discussionBatches||[],target=ui.annotationTarget||{context,anchor:'board',quote:''};
 const count=list.length+(ui.annotationText?.trim()&&!ui.annotationEditing?1:0);
 const quote=a=>a.quote?`<blockquote><button class="quote-origin" data-action="locate-annotation" data-id="${a.id}" title="回看看板中的引用">${esc(a.quote)}</button></blockquote>`:'';
 return `<section class="annotation-panel round-panel"><header><h2>本轮讨论</h2><span class="round-count">${list.length} 条待发送</span></header>
 <div class="annotation-log round-log">${list.length?list.map((a,i)=>`<article id="${a.id}"><div class="round-item-meta"><strong>批注 ${i+1}</strong><small>${esc(annotationLabel(a.context))}</small></div>${quote(a)}<p>${esc(a.text)}</p><div class="annotation-actions"><button class="text-button" data-action="edit-annotation" data-id="${a.id}">修改</button><button class="text-button" data-action="remove-annotation" data-id="${a.id}">移除</button></div></article>`).join(''):!batches.length?'<p class="annotation-empty">在看板上选中文字留下批注，或在下方补充问题。收集好后一起发送。</p>':''}
 ${batches.slice().reverse().map(batch=>`<details class="sent-batch" ${batch.id===ui.lastBatch?'open':''}><summary><span>已模拟发送 · ${batch.annotations.length} 条批注</span><small>${esc(new Date(batch.createdAt).toLocaleString('zh-CN',{hour12:false}))}</small></summary>${batch.annotations.map(a=>`<article><small>${esc(annotationLabel(a.context))}</small>${quote(a)}<p>${esc(a.text)}</p></article>`).join('')}<p class="batch-receipt">待 AI 回复 · 当前为交互演示</p></details>`).join('')}</div>
 <form id="annotation-form"><small>${ui.annotationEditing?'修改待发送批注':target.quote?'引用原文 · '+esc(annotationLabel(target.context)):'补充问题'}</small>${target.quote?`<blockquote>${esc(target.quote)}</blockquote>${!ui.annotationEditing?'<button class="text-button" type="button" data-action="clear-annotation-quote">取消引用</button>':''}`:''}<label class="sr-only" for="annotation-input">本轮问题或批注</label><textarea id="annotation-input" name="annotation" rows="2" placeholder="写下这一轮想和 AI 讨论的问题…">${esc(ui.annotationText||'')}</textarea><button class="text-button add-to-round" type="submit">${ui.annotationEditing?'保存修改':'加入本轮讨论'} ＋</button></form>
 <div class="round-send"><button class="primary" data-action="send-round" ${count?'':'disabled'}>一起发送${count?' · '+count+' 条':''}</button><small>发送后将原文与批注一并交给 AI</small></div></section>`;
}
