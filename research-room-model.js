import {DATA,SOURCE,growth} from './engine.js';
import {memoriesAt} from './research-memory.js';
import {saveResearchReturn} from './research-return.js';
import {roomDirections,directionById} from './research-directions.js';
import {reports} from './research-data.js';
export {roomDirections};
const clone=x=>structuredClone(x);
export const roomContext={key:'update:2:interim',stage:'update',versionId:2,report:'interim',label:'V3 · 2026年半年报'};
export function roomState(s){const r=s.researchRoom??={started:false,scope:'all',useMemory:true,messages:[],selection:{},draft:'',saveDrafts:{},records:[]};r.directionId??='molly';r.visitedDirections??=[...new Set(['molly',...r.messages.map(m=>m.directionId||'molly')])];r.memoryByDirection??={};return r;}
export function roomDirection(s){return directionById(roomState(s).directionId);}
const usesMemory=(s,id)=>id==='molly'?roomState(s).useMemory:roomState(s).memoryByDirection[id]!==false;
export function roomMemory(s,directionId=roomDirection(s).id){const id=directionById(directionId).memoryId;return id?memoriesAt(s,s.versions.find(v=>v.id===2)).find(m=>m.id===id&&m.status==='included')||null:null;}
function mollyResult(s){
 const r=roomState(s),memory=r.useMemory?roomMemory(s,'molly'):null,domestic=r.scope==='domestic',scope=domestic?'国内渠道':'整体业务';
 const method=memory?.answer.includes('产品节奏')?'product':null;
 const quote=memory?(memory.answer.includes('但')?memory.answer.slice(memory.answer.indexOf('但')+1):memory.conclusion):'';
 const values=DATA.interim.molly,change=growth(values).toFixed(1);
 const evidence=domestic?'现有材料为 MOLLY 整体收入，未提供国内渠道拆分。整体同比 '+change+'% 不能直接用于判断国内情况。':`MOLLY 上半年收入 ${ (values[0]/100000).toFixed(2)} → ${(values[1]/100000).toFixed(2)} 亿元，同比 ${change}%。`;
 const tasks=[...(domestic?[{id:'domestic-base',title:'先补国内同口径收入',origin:'由你限定的国内范围产生',need:'MOLLY 国内渠道 2025、2026 上半年收入；核对渠道划分是否一致。',why:'先确定国内是否也在回落。整体变化不能代替地区结论。',source:'需要国内渠道拆分披露或你的渠道数据库；当前未接入。'}]:[]),
 ...(method?[{id:'supply',title:domestic?'核对国内上新与补货节奏':'核对上新与补货节奏',origin:'接续 V2：产品节奏还没有核对',need:`${domestic?'国内渠道的 ':''}MOLLY 产品推出、补货与可售时间，按两年同一期间排列。`,why:'检查收入回落是否与供给时间错位有关。时间吻合只能形成线索，还需需求证据。',source:'需要产品发布、补货与渠道记录；当前材料未提供。'}]:[{id:'breakdown',title:domestic?'拆分国内收入变化':'先定位回落来自哪里',origin:'根据本轮材料新增',need:`${domestic?'国内渠道':'各渠道、地区'}的同期间收入拆分与变动说明。`,why:'当前收入总额没有解释原因，先定位主要变化，再决定深入哪条线索。',source:'需要收入拆分和经营说明；当前材料未提供。'}]),
 {id:'demand',title:domestic?'补国内持续需求证据':'补持续需求证据',origin:memory?'本轮新增：检验旧假设的另一种解释':'根据本轮材料新增',need:`${domestic?'国内同渠道的':'同渠道的'}复购、持续销售及后续同口径表现。`,why:'与供给变化一起核对，区分短期节奏变化和需求减弱；当前不能确定原因。',source:'需要用户或渠道经营数据；当前未接入。'}];
 const selected=tasks.filter(t=>r.selection[`${r.scope}:${t.id}`]!==false);
 const lead=domestic?'先看国内。现有的 33.6% 降幅是 MOLLY 整体收入的变化，还不能据此判断国内需求。我们需要先补国内两年同期收入，再看回落是否也发生在国内。':memory?'上次讨论 MOLLY 时，我们留下了一个疑问：一年的增长，还不能证明老 IP 能长期经营。\n\n这次半年报中，收入同比下降了 33.6%。但单凭收入下降，还分不清是产品推出节奏变化，还是需求走弱。':'先只看这份半年报：MOLLY 上半年收入从 13.57 亿元降到 9.01 亿元，同比下降 33.6%。这个数字说明收入回落，尚不能说明原因。';
 const impact=method?'上次明确还要看产品节奏。这轮可以把上新、补货与持续销售放在一起核对，看看哪一种解释更有依据。':memory?'旧讨论提醒我们要看多期表现。先找收入变化集中在哪些渠道，再判断要补哪类证据。':'可以先找回落集中在哪些渠道或地区，再核对需求变化。现有材料还缺少这部分拆分。';
 return {scope,domestic,memory,method,quote,evidence,tasks,selected,lead,impact,signature:r.scope+':'+(method||'none')+':'+selected.map(t=>t.id).join(','),summary:`${scope}：${domestic?'当前缺少国内同口径收入，暂不判断国内是否回落。':'已确认同期间收入回落，原因尚未确定。'}${method?'继续核对上次留下的产品节奏问题。':'先补收入拆分，再定位原因。'}`,next:selected.map(t=>t.title).join('；')};
}
export function roomTaskKey(s,t){const id=t.directionId||roomDirection(s).id;return id==='molly'?`${t.scope||roomState(s).scope}:${t.id}`:`${id}:${t.id}`;}
function directionResult(s,directionId){
 const r=roomState(s),direction=directionById(directionId),memory=usesMemory(s,direction.id)?roomMemory(s,direction.id):null;
 const result=direction.id==='molly'?mollyResult(s):{scope:'整体业务',domestic:false,memory,method:null,quote:memory?.conclusion||'',evidence:direction.evidence,tasks:clone(direction.tasks),lead:direction.evidence+'\n\n'+direction.summary,impact:memory?'接着 V2 留下的问题，本轮继续核对：'+direction.question:direction.question+' '+direction.responses[0].gap,summary:direction.summary};
 result.direction=direction;
 result.tasks=result.tasks.map(t=>{const item={...t,directionId:direction.id,directionTitle:direction.title,scope:direction.id==='molly'?r.scope:'all'};item.selectionKey=roomTaskKey(s,item);item.selected=direction.id==='molly'?r.selection[item.selectionKey]!==false:r.selection[item.selectionKey]===true;return item;});
 result.selected=result.tasks.filter(t=>t.selected);result.next=result.selected.map(t=>t.title).join('；');
 result.signature=direction.id+':'+r.scope+':'+(result.method||'none')+':'+Boolean(memory)+':'+result.selected.map(t=>t.id).join(',');return result;
}
export function roomResult(s){return directionResult(s,roomDirection(s).id);}
export function roomSelectedTasks(s){return roomState(s).visitedDirections.filter(id=>roomDirections.some(d=>d.id===id)).flatMap(id=>directionResult(s,id).selected);}
export function roomBoardDraft(s){
 const selected=roomSelectedTasks(s),ids=[...new Set(selected.map(t=>t.directionId))],results=ids.map(id=>directionResult(s,id));
 return {signature:results.map(x=>x.signature).join('|')||'none',summary:results.map(x=>ids.length>1?x.direction.title+'：'+x.summary:x.summary).join('\n'),next:selected.map(t=>t.title).join('；')};
}
const annualContext={key:'version:2:annual',stage:'version',versionId:2,report:'annual',label:'V2 · 2025年业绩研究'};
const sourceAt=(period,page)=>({...clone(SOURCE[period]),page:String(page),url:SOURCE[period].url+'#page='+page});
export function roomReferences(s,directionId=roomDirection(s).id){
 const x=directionResult(s,directionId),d=x.direction,refs=[];
 if(x.memory)refs.push({id:'discussion-'+x.memory.id,kind:'discussion',discussionId:x.memory.id,directionId:d.id,context:clone(annualContext),label:d.memoryLabel,excerpt:x.quote,text:'研究者：'+x.memory.question+'\nAI 案例回复：'+x.memory.answer+'\n留下的判断：'+x.memory.conclusion,provenance:{type:'prior-discussion',version:2,discussionId:x.memory.id}});
 if(d.baseline)refs.push({id:'room-'+d.id+'-baseline',kind:'board',directionId:d.id,context:clone(annualContext),anchor:d.anchor,label:'V2 看板 · 已有财报背景',excerpt:d.baseline,text:d.baseline,provenance:{type:'prior-board',version:2,report:'annual'},source:sourceAt('annual',d.baselinePage)});
 refs.push({id:'room-'+d.id+'-evidence',kind:'board',directionId:d.id,context:clone(roomContext),anchor:d.anchor,label:'2026 半年报 · '+(d.id==='molly'?'MOLLY 同期间收入':d.title),excerpt:x.evidence,text:x.evidence+'\n比较期间：'+d.evidencePeriod+'。'+(x.domestic?'用途：说明材料范围限制，不能据此判断国内收入。':''),provenance:{type:'new-disclosure',report:'interim',published:SOURCE.interim.date,period:d.evidencePeriod,page:d.page},source:sourceAt('interim',d.page)});
 if(d.id==='overseas')refs.push({id:'room-overseas-channel-evidence',kind:'board',directionId:d.id,context:clone(roomContext),anchor:d.anchor,label:'2026 半年报 · 美洲渠道表现',excerpt:'美洲零售店收入 +22.5%，线上 −45.6%。',text:'美洲零售店收入同比 +22.5%，线上收入同比 −45.6%。渠道总收入变化不能代替同店判断。',provenance:{type:'new-disclosure',report:'interim',published:SOURCE.interim.date,period:d.evidencePeriod,page:28},source:sourceAt('interim',28)});
 if(d.id==='inventory')refs.push({id:'room-inventory-prior-interim',kind:'board',directionId:d.id,context:{key:'source:2025:interim',stage:'source',report:'prior-interim',label:'2025 中期业绩公告'},label:'2025 半年报 · 同期库存基数',excerpt:'2025 上半年存货周转天数 83 天；2025 年中库存 22.74 亿元。',text:'用于同期间比较的上年基数：2025 上半年存货周转天数 83 天，2025 年中库存 22.74 亿元。该材料用于本轮对比，不作为新增的 V2 讨论。',provenance:{type:'comparison-disclosure',report:'prior-interim',period:'2025 上半年 / 2025 年中',page:32},source:{name:'2025 中期业绩公告',date:'2025-08-19',page:'32',url:reports.interim.priorInterimUrl+'#page=32'}});
 return refs;
}
export function changeRoom(s,action,value){
 const r=roomState(s);if(action==='direction'&&!roomDirections.some(d=>d.id===value))throw Error('无效研究方向');
 if(action==='prompt'){const prompts=roomDirection(s).prompts;const index=typeof value==='number'||/^\d+$/.test(String(value))?Number(value):prompts.indexOf(value);if(!Number.isInteger(index)||!prompts[index])throw Error('请选择当前方向的案例追问。');value=index;}
 if(action!=='start'&&!r.messages.length)changeRoom(s,'start');let user,answer;
 if(action==='start'){r.started=true;user=null;}
 else if(action==='direction'){r.directionId=value;r.started=true;if(!r.visitedDirections.includes(value))r.visitedDirections.push(value);if(r.messages.some(m=>(m.directionId||'molly')===value))return roomResult(s);user=null;}
 else if(action==='prompt'){const d=roomDirection(s),response=d.responses[value];user=d.prompts[value];answer=response.title+'\n\n'+response.body+'\n\n'+response.gap;}
 else if(action==='scope'){if(!['all','domestic'].includes(value))throw Error('无效研究范围');r.scope=value;r.started=true;user=value==='domestic'?'先只看国内渠道。':'把研究范围恢复到整体业务。';}
 else if(action==='memory'){if(roomDirection(s).id==='molly')r.useMemory=!!value;else r.memoryByDirection[roomDirection(s).id]=!!value;r.started=true;user=value?'重新带上上次的讨论。':'这次先不引用旧讨论。';}
 else throw Error('无效研究动作');
 const result=roomResult(s),d=result.direction;
 if(action==='prompt'&&d.id==='molly'&&result.domestic)answer='先保留国内口径的边界\n\n'+result.evidence+'\n\n'+answer;
 if(action==='prompt'&&value===0&&!result.memory&&d.memoryId)answer='当前先不引用旧讨论\n\n'+result.evidence+'\n\n'+result.summary+'\n\n需要恢复 V2 讨论后，才能逐句复核当时留下的判断。';
 r.messages.push({id:'message-'+Date.now()+'-'+Math.random().toString(36).slice(2),action,user,answer:answer||result.lead+'\n\n'+result.impact,directionId:d.id,...(action==='prompt'?{origin:'prompt',promptIndex:value}:{}),scope:r.scope,useMemory:!!result.memory,references:clone(roomReferences(s)),provenance:{directionId:d.id,category:d.category,trigger:d.trigger,previous:d.previous,evidence:result.evidence,evidencePeriod:d.evidencePeriod},at:new Date().toISOString()});
 r.notice=result.impact;return result;
}
export function interpretRoomInput(text,s){const clean=t=>t.trim().replace(/[。！!?？\s]/g,''),t=clean(text);if(s){const index=roomDirection(s).prompts.findIndex(p=>clean(p)===t);if(index>=0)return {action:'prompt',value:index};}if(!s||roomDirection(s).id==='molly'){if(['先只看国内渠道','只看国内','先看国内渠道','先只看国内'].includes(t))return {action:'scope',value:'domestic'};if(['看整体业务','恢复整体业务','恢复整体','看整体'].includes(t))return {action:'scope',value:'all'};}if(['移除旧讨论','先不引用旧讨论','这次先不引用旧讨论'].includes(t))return {action:'memory',value:false};if(['恢复旧讨论','重新带上上次的讨论','带上上次讨论'].includes(t))return {action:'memory',value:true};return null;}
export function saveRoomRecord(s,{summary,next}){
 const r=roomState(s),x=roomResult(s),tasks=roomSelectedTasks(s);if(!r.started)throw Error('先开始本轮复核。');if(!tasks.length)throw Error('至少保留一项待查任务。');if(!summary.trim()||!next.trim())throw Error('请写下小结和下次起点。');
 const directionIds=[...new Set(tasks.map(t=>t.directionId))],evidenceByDirection=directionIds.map(id=>({directionId:id,title:directionById(id).title,evidence:directionResult(s,id).evidence}));
 const references=[...new Map([...r.messages.flatMap(m=>m.references||[]),...directionIds.flatMap(id=>roomReferences(s,id))].map(ref=>[ref.id,ref])).values()];
 const evidence=evidenceByDirection.map(item=>evidenceByDirection.length>1?item.title+'：'+item.evidence:item.evidence).join('\n');
 const record={company:'popmart',context:clone(roomContext),id:'research-'+Date.now()+'-'+Math.random().toString(36).slice(2),createdAt:new Date().toISOString(),scope:r.scope,useMemory:!!x.memory,memoryByDirection:clone(r.memoryByDirection),directionIds,visitedDirectionIds:clone(r.visitedDirections),summary:summary.trim(),next:next.trim(),evidence,evidenceByDirection,tasks:clone(tasks),references:clone(references),messages:clone(r.messages)};
 r.records.push(record);r.savedId=record.id;r.savedSignature=roomBoardDraft(s).signature;r.savedMessageCount=r.messages.length;r.saving=false;
 saveResearchReturn(s,{topic:'old',stage:3,title:directionIds.map(id=>directionById(id).title).join(' / ')+'查证',question:record.next,when:'下次研究时',context:roomContext,references:[...record.references,{id:record.id,kind:'board',context:clone(roomContext),anchor:'room-record-'+record.id,label:'用户保存的本轮查证单',excerpt:record.summary,text:record.summary+'\n'+record.tasks.map(t=>t.title+'：'+t.need).join('\n')+'\n下次：'+record.next}]});
 return record;
}
export function latestGeneratedBoard(s){return roomState(s).generatedBoards?.at(-1)||null;}
export function generateRoomBoard(s,{summary,next}){
 const r=roomState(s);
 if(!roomSelectedTasks(s).length)throw Error('至少选择一项纳入 V3 的跟进事项。');
 if(!summary.trim()||!next.trim())throw Error('请写下本轮小结和下次起点。');
 if(!r.messages.length)changeRoom(s,'start');
 const record=saveRoomRecord(s,{summary,next});
 const board={...clone(record),kind:'generated-board',version:3,generation:(r.generatedBoards?.length||0)+1,baseline:clone(s.versions.find(v=>v.id===2)),financialData:clone(DATA.interim)};
 (r.generatedBoards??=[]).push(board);
 return board;
}
