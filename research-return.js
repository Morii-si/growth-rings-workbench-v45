const clone=value=>structuredClone(value);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const returnTimings=['下次业绩披露','有新材料时','下次研究时'];
export function researchReturns(s){return Array.isArray(s.researchReturns)?s.researchReturns:[];}
export function savedReturn(s,topic,stage){return researchReturns(s).find(x=>x.topic===topic&&x.stage===stage);}
export function saveResearchReturn(s,{topic,stage,title,question,when,context,references}){
 if(!question.trim())throw Error('写下下次想查的问题，再保存。');
 if(!returnTimings.includes(when))throw Error('请选择回来研究的时机。');
 const entries=researchReturns(s),old=savedReturn(s,topic,stage),now=new Date().toISOString();
 const entry={id:old?.id||'return-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),topic,stage,title,question:question.trim(),when,context:clone(context),references:clone(references),createdAt:old?.createdAt||now,updatedAt:now,done:false};
 s.researchReturns=old?entries.map(x=>x.id===old.id?entry:x):[...entries,entry];return entry;
}
export function returnEditorHTML(f,entry,draft){return `<form class="focus-return-form" id="focus-return-form" data-return-key="${f.topic.id}-${f.stage}"><label for="return-question">下次回来，先查什么？</label><textarea id="return-question" name="question" rows="3" required>${esc(draft?.question??entry?.question??f.next)}</textarea><label for="return-when">什么时候回来</label><select id="return-when" name="when">${returnTimings.map(when=>`<option ${when===(draft?.when??entry?.when??returnTimings[0])?'selected':''}>${when}</option>`).join('')}</select><p>连同这次的材料一起保存，下次不用重新找。</p><div><button type="button" data-rw="return-cancel">收起，稍后再写</button><button type="submit">保存，留到下次</button></div><p class="return-error" role="alert" hidden></p></form>`;}
export function returnQueue(s){const items=researchReturns(s);if(!items.length)return '';
 const itemHTML=x=>`<article class="return-entry" data-return-id="${esc(x.id)}"><header><span>${esc(x.title)}</span><span>V${x.stage} 留下 · ${esc(x.when)}</span></header><h3>${esc(x.question)}</h3><details><summary>当时一起留下的 ${x.references.length} 份材料</summary>${x.references.map(ref=>`<div class="return-ref"><strong>${esc(ref.label)}</strong><p>${esc(ref.text)}</p></div>`).join('')}</details><footer><button data-rw="return-resume" data-id="${esc(x.id)}">带着这些材料，接着问 →</button><button data-rw="return-open" data-id="${esc(x.id)}">回到当时的研究</button><label><input type="checkbox" data-rw-return-done="${esc(x.id)}" ${x.done?'checked':''}>已跟进</label></footer></article>`;
 return `<section class="research-returns" aria-label="上次留给自己的问题"><header><h2>上次留给自己的问题</h2><p>问题和当时的材料，都在这里。</p></header>${items.filter(x=>!x.done).map(itemHTML).join('')||'<p class="return-empty">留下的问题已跟进，记录仍可在下方回看。</p>'}${items.some(x=>x.done)?`<details class="return-completed"><summary>已跟进 · ${items.filter(x=>x.done).length}</summary>${items.filter(x=>x.done).map(itemHTML).join('')}</details>`:''}</section>`;
}
