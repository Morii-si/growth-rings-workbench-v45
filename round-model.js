import {addAnnotation,pendingAnnotations,sendDiscussionBatch} from './workbench.js';
const clone=value=>structuredClone(value);
export function referencesFor(note){
 if(Array.isArray(note.references))return clone(note.references);
 return note.quote?[{id:'legacy-'+note.id,kind:'board',label:note.context.label,context:clone(note.context),anchor:note.anchor,text:note.quote,excerpt:note.quote}]:[];
}
export function sentRoundNotes(state){return (state.discussionBatches||[]).flatMap(batch=>batch.annotations.map(note=>({...clone(note),sentAt:batch.createdAt,batchId:batch.id})));}
export function roundCount(state){return pendingAnnotations(state).length+sentRoundNotes(state).length;}
export function prepareRoundDraft(state,{context,references=[],text='',editing=null,parent=null}){
 if(state.roundDraft)return state.roundDraft;
 const note=editing?pendingAnnotations(state).find(item=>item.id===editing):null;
 if(editing&&!note)throw Error('已发送的问题不能修改。');
 state.roundDraft=note?{context:clone(note.context),references:referencesFor(note),text:note.text,editing:note.id,parent:clone(note.parent||null)}:{context:clone(context),references:clone(references),text,editing:null,parent:clone(parent)};
 return state.roundDraft;
}
export function saveRoundDraft(state){
 const draft=state.roundDraft;if(!draft?.text?.trim())throw Error('请填写这次想讨论的问题。');
 let note;
 if(draft.editing){note=pendingAnnotations(state).find(item=>item.id===draft.editing);if(!note)throw Error('这条问题已发送，不能修改。');note.text=draft.text.trim();note.updatedAt=new Date().toISOString();}
 else note=addAnnotation(state,{context:draft.context,text:draft.text,anchor:draft.references[0]?.anchor||'board',quote:draft.references[0]?.excerpt||draft.references[0]?.text||''});
 note.references=clone(draft.references);note.parent=clone(draft.parent||null);state.roundDraft=null;return note;
}
export function sendRound(state){if(state.roundDraft)throw Error('还有未完成的草稿，请先完成或放弃。');return sendDiscussionBatch(state);}
