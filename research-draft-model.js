import {DATA,SOURCE} from './engine.js';
import {roomState,roomResult,roomReferences,roomDirections,roomContext,latestGeneratedBoard} from './research-room-model.js';
import {saveResearchReturn} from './research-return.js';

const clone=value=>structuredClone(value);
const now=()=>new Date().toISOString();
const uid=prefix=>prefix+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,9);
const knownDirection=id=>roomDirections.find(direction=>direction.id===id);
const clean=text=>String(text??'').trim().replace(/[。！!?？\s]/g,'');
const unique=values=>[...new Set(values)];
const openingAnswer='泡泡玛特发布了 2026 年半年报。MOLLY 回落、星星人增长，库存周转也出现了新变化。想先聊哪一项？';
const openingEvidence=()=>['molly','stars','inventory'].map(id=>knownDirection(id).evidence);
const legacyOpeningAnswer=()=>'泡泡玛特发布了 2026 年半年报。我先标出三处变化：\n\n'+openingEvidence().map(point=>'• '+point).join('\n');

export function roundState(s){
 const r=roomState(s);
 r.workspaceMode??='conversation';r.conversationDraft??=r.draft||'';
 r.roundDraft??=null;r.activeCategoryId??=null;
 const draft=r.roundDraft,legacy=draft?.categories.find(category=>category.id==='uncategorized'&&category.origin!=='custom');
 if(legacy){
  // Migrate only the editable draft. Keep the removed category's prior edits,
  // all original content and every saved historical snapshot intact.
  (draft.retiredCategories??=[]).push(clone(legacy));
  draft.categories=draft.categories.filter(category=>category!==legacy);
  draft.tasks.filter(task=>task.categoryId===legacy.id).forEach(task=>{task.categoryId=null;});
  if(r.activeCategoryId===legacy.id)r.activeCategoryId=draft.categories[0]?.id||null;
 }
 return r;
}
function directionSnapshot(s,directionId,message={}){
 const copy=clone(s),r=roomState(copy);r.directionId=directionId;
 if(message.scope)r.scope=message.scope;
 if(typeof message.useMemory==='boolean'){
  if(directionId==='molly')r.useMemory=message.useMemory;
  else r.memoryByDirection[directionId]=message.useMemory;
 }
 const result=roomResult(copy);
 return {result,references:roomReferences(copy,directionId)};
}
function openingMessage(){
 const points=openingEvidence();
 return {id:'round-opening-interim',kind:'opening',origin:'demo',action:'opening',user:null,answer:openingAnswer,
  references:[{id:'round-opening-report',kind:'board',context:clone(roomContext),label:SOURCE.interim.name,excerpt:points.join('\n'),text:points.join('\n'),provenance:{type:'new-disclosure',report:'interim',published:SOURCE.interim.date},source:clone(SOURCE.interim)}],
  provenance:{type:'disclosure-opening',report:'interim',published:SOURCE.interim.date},at:now()};
}
export function roundConversation(s){
 const r=roundState(s);r.roundSeedMessages??=[openingMessage()];
 const legacyIds=new Set(['molly','stars','inventory','cash'].map(id=>'round-demo-'+id));
 const bundledIds=new Set(r.bundledReplay?.seedMessageIds||[]);
 const legacy=r.roundSeedMessages.filter(message=>message.kind==='demo'&&legacyIds.has(message.id)&&!bundledIds.has(message.id));
 if(legacy.length){
  // Retire only known automatic examples. Real input and existing draft/board
  // snapshots remain exactly as saved, including their original demo references.
  const archived=r.legacySeedMessages??=[];
  for(const message of legacy)if(!archived.some(item=>JSON.stringify(item)===JSON.stringify(message)))archived.push(clone(message));
  r.roundSeedMessages=r.roundSeedMessages.filter(message=>!legacy.includes(message));
  if(!r.roundSeedMessages.some(message=>message.kind==='opening'))r.roundSeedMessages.unshift(openingMessage());
 }
 r.roundSeedMessages=r.roundSeedMessages.map(message=>message.id==='round-opening-interim'&&message.kind==='opening'&&message.origin==='demo'&&message.user===null&&message.answer===legacyOpeningAnswer()?{...message,answer:openingAnswer}:message);
 return [...r.roundSeedMessages,...r.messages];
}
export function roundOpeningPrompts(){
 return roomDirections.map(direction=>({id:direction.id+':-1',directionId:direction.id,promptIndex:-1,text:direction.question}));
}
export function roundPrompts(){
 return roomDirections.flatMap(direction=>direction.prompts.map((text,promptIndex)=>({id:direction.id+':'+promptIndex,directionId:direction.id,promptIndex,text})));
}
export function roundSuggestedPrompts(s){
 const messages=roundConversation(s).filter(message=>message.user&&knownDirection(message.directionId));
 const asked=new Set(messages.map(message=>message.promptId||(Number.isInteger(message.promptIndex)?message.directionId+':'+message.promptIndex:null)).filter(Boolean));
 const discussed=new Set(messages.map(message=>message.directionId));
 const latest=messages.at(-1)?.directionId;
 const firstIds=['molly','stars','inventory','cash','overseas','margin','monster','platform'];
 const openings=roundOpeningPrompts().sort((a,b)=>firstIds.indexOf(a.directionId)-firstIds.indexOf(b.directionId));
 const followups=roundPrompts();
 const candidates=[...followups.filter(prompt=>prompt.directionId===latest),...openings.filter(prompt=>!discussed.has(prompt.directionId)),...followups.filter(prompt=>discussed.has(prompt.directionId)&&prompt.directionId!==latest)];
 return candidates.filter(prompt=>!asked.has(prompt.id)).slice(0,4);
}
export function sendRoundInput(s,text,{directionId,promptIndex,promptId}={}){
 if(roundState(s).boardConversationReference||String(promptId||'').startsWith('board:'))return sendBoardConversationInput(s,text,{promptId});
 const user=String(text??'').trim();if(!user)throw Error('请先写下问题。');
 const prompts=[...roundOpeningPrompts(),...roundPrompts()];
 let prompt;
 if(promptIndex!==undefined){
  prompt=prompts.find(p=>p.directionId===directionId&&p.promptIndex===Number(promptIndex));
  if(!prompt||clean(prompt.text)!==clean(user))throw Error('请选择对应的案例追问。');
 }else prompt=prompts.find(p=>clean(p.text)===clean(user));
 const r=roundState(s);roundConversation(s);
 let message={id:uid('round-message'),kind:'pending',origin:'typed',action:'question',user,answer:null,references:[],at:now()};
 if(prompt){
  const direction=knownDirection(prompt.directionId),{result,references}=directionSnapshot(s,direction.id),response=direction.responses[prompt.promptIndex];
  let answer=prompt.promptIndex===-1?result.lead+'\n\n'+result.impact:response.title+'\n\n'+response.body+'\n\n'+response.gap;
  if(prompt.promptIndex!==-1&&direction.id==='molly'&&result.domestic)answer='先保留国内口径的边界\n\n'+result.evidence+'\n\n'+answer;
  if(prompt.promptIndex===0&&!result.memory&&direction.memoryId)answer='当前先不引用旧讨论\n\n'+result.evidence+'\n\n'+result.summary+'\n\n需要恢复 V2 讨论后，才能逐句复核当时留下的判断。';
  message={...message,kind:'preset',origin:'prompt',action:'prompt',answer,directionId:direction.id,promptId:prompt.id,promptIndex:prompt.promptIndex,scope:direction.id==='molly'?r.scope:'all',useMemory:!!result.memory,references:clone(references),suggestedTasks:clone(result.tasks),provenance:{type:'preset-reply',directionId:direction.id,evidence:result.evidence,evidencePeriod:direction.evidencePeriod}};
 }
 r.messages.push(message);r.started=true;r.conversationDraft='';
 return message;
}
function requiredDraft(s){const draft=roundState(s).roundDraft;if(!draft)throw Error('请先生成本轮研究草稿。');return draft;}
function categoryIn(draft,id){const category=draft.categories.find(item=>item.id===id);if(!category)throw Error('没有找到这个类目。');return category;}
function touch(draft){draft.updatedAt=now();return draft;}
function categoryForMessage(draft,message,s){
 if(message.kind==='opening')return null;
 if(message.boardReference?.kind==='category')return draft.categories.find(category=>category.id===message.boardReference.categoryId)||null;
 const direction=knownDirection(message.directionId);if(!direction)return null;
 let category=draft.categories.find(item=>item.origin==='discussion'&&item.directionIds.includes(direction.id));
 if(!category){
  const {result}=directionSnapshot(s,direction.id,message);
  category={id:'category-'+direction.id,title:direction.title,description:result.summary||'',origin:'discussion',directionIds:[direction.id],messageIds:[],taskIds:[]};
  draft.categories.push(category);
 }
 return category;
}
function referencesFrom(messages){
 // The same source ID may have different wording or scope in different turns.
 // Keep every distinct frozen reference; never replace an earlier turn's source.
 return [...new Map(messages.flatMap(message=>message.references||[]).map(ref=>[JSON.stringify(ref),clone(ref)])).values()];
}
function messageSuggestions(s,message){
 if(message.kind==='opening'||!message.answer||!knownDirection(message.directionId))return [];
 return message.suggestedTasks?clone(message.suggestedTasks):clone(directionSnapshot(s,message.directionId,message).result.tasks);
}
function appendMessages(s,draft,messages,{includeTasks=true}={}){
 const r=roundState(s);
 for(const original of messages){
  if(draft.messageIds.includes(original.id))continue;
  const message=clone(original),category=categoryForMessage(draft,message,s);
  draft.messageIds.push(message.id);draft.messages.push(message);category?.messageIds.push(message.id);
  for(const suggestion of includeTasks?messageSuggestions(s,message):[]){
   const taskId='round-task-'+message.directionId+'-'+(suggestion.scope||message.scope||'all')+'-'+suggestion.id;
   const existing=draft.tasks.find(task=>task.id===taskId);
   if(existing){existing.sourceMessageIds=unique([...existing.sourceMessageIds,message.id]);continue;}
   const selected=Object.hasOwn(r.selection,suggestion.selectionKey)?r.selection[suggestion.selectionKey]:true;
   const task={...suggestion,id:taskId,sourceTaskId:suggestion.id,selected,origin:'discussion',sourceOrigin:suggestion.origin,categoryId:category?.id||null,sourceMessageIds:[message.id]};
   draft.tasks.push(task);category?.taskIds.push(task.id);
  }
 }
 draft.references=referencesFrom(draft.messages);
 return touch(draft);
}
export function generateRoundDraft(s){
 const r=roundState(s);
 // Revisiting the draft preserves every user edit. New turns require explicit refresh.
 if(r.roundDraft){r.workspaceMode='draft';return r.roundDraft;}
 const messages=roundConversation(s);if(!messages.some(message=>message.kind!=='opening'&&String(message.user||'').trim()))throw Error('先讨论一个研究问题，再生成草稿。');
 const draft={id:uid('round-draft'),createdAt:now(),updatedAt:now(),messageIds:[],messages:[],references:[],categories:[],tasks:[],summary:'',next:''};
 appendMessages(s,draft,messages);draft.summary=draft.categories.map(category=>category.description).filter(Boolean).join('\n');
 draft.next=draft.tasks.filter(task=>task.selected).map(task=>task.title).join('；');
 r.roundDraft=draft;r.workspaceMode='draft';r.activeCategoryId=draft.categories[0]?.id||null;return draft;
}
export function roundPendingCount(s){
 const draft=roundState(s).roundDraft;if(!draft)return 0;
 return roundConversation(s).filter(message=>message.kind!=='opening'&&!draft.messageIds.includes(message.id)).length;
}
export function refreshRoundDraft(s){
 const draft=requiredDraft(s);appendMessages(s,draft,roundConversation(s));return draft;
}
export function roundUnassignedMessages(s){
 const draft=roundState(s).roundDraft;if(!draft)return [];
 const assigned=new Set(draft.categories.flatMap(category=>category.messageIds));
 return draft.messages.filter(message=>message.kind!=='opening'&&!assigned.has(message.id));
}
export function roundUnassignedTasks(s){
 const draft=roundState(s).roundDraft;if(!draft)return [];
 const categories=new Set(draft.categories.map(category=>category.id));
 return draft.tasks.filter(task=>!categories.has(task.categoryId));
}
export function addRoundCategory(s,{title,description=''}){
 if(!String(title??'').trim())throw Error('请填写类目名称。');
 const draft=requiredDraft(s),category={id:uid('category-custom'),title:String(title).trim(),description:String(description).trim(),origin:'custom',directionIds:[],messageIds:[],taskIds:[]};
 draft.categories.push(category);touch(draft);return category;
}
export function updateRoundCategory(s,id,changes){
 const draft=requiredDraft(s),category=categoryIn(draft,id);
 if(changes.title!==undefined&&!String(changes.title).trim())throw Error('请填写类目名称。');
 if(changes.title!==undefined)category.title=String(changes.title).trim();
 if(changes.description!==undefined)category.description=String(changes.description).trim();
 touch(draft);return category;
}
export function removeRoundCategory(s,id){
 const draft=requiredDraft(s);categoryIn(draft,id);
 draft.tasks.filter(task=>task.categoryId===id).forEach(task=>{task.categoryId=null;});
 draft.categories=draft.categories.filter(item=>item.id!==id);
 const r=roundState(s);if(r.activeCategoryId===id)r.activeCategoryId=draft.categories[0]?.id||null;return touch(draft);
}
export function assignRoundMessage(s,messageId,categoryId){
 const draft=requiredDraft(s),category=categoryId===null?null:categoryIn(draft,categoryId);
 if(!draft.messageIds.includes(messageId))throw Error('请先将这段讨论纳入草稿。');
 for(const item of draft.categories)item.messageIds=item.messageIds.filter(id=>id!==messageId);
 category?.messageIds.push(messageId);touch(draft);return category;
}
export function assignRoundTask(s,taskId,categoryId){
 const draft=requiredDraft(s),category=categoryId===null?null:categoryIn(draft,categoryId),task=draft.tasks.find(item=>item.id===taskId);
 if(!task)throw Error('没有找到这个待查事项。');
 for(const item of draft.categories)item.taskIds=item.taskIds.filter(id=>id!==taskId);
 category?.taskIds.push(taskId);task.categoryId=categoryId;touch(draft);return task;
}
export function addRoundTask(s,{categoryId,title,need=''}){
 const draft=requiredDraft(s),category=categoryIn(draft,categoryId);
 if(!String(title??'').trim())throw Error('请填写待查事项。');
 const task={id:uid('round-task-custom'),title:String(title).trim(),need:String(need).trim(),selected:true,origin:'custom',categoryId,sourceMessageIds:[],why:'',source:''};
 draft.tasks.push(task);category.taskIds.push(task.id);touch(draft);return task;
}
export function updateRoundTask(s,id,changes){
 const draft=requiredDraft(s),task=draft.tasks.find(item=>item.id===id);if(!task)throw Error('没有找到这个待查事项。');
 if(changes.title!==undefined&&!String(changes.title).trim())throw Error('请填写待查事项。');
 if(changes.title!==undefined)task.title=String(changes.title).trim();
 if(changes.need!==undefined)task.need=String(changes.need).trim();
 if(changes.selected!==undefined)task.selected=!!changes.selected;
 touch(draft);return task;
}
export function updateRoundDraft(s,changes){
 const draft=requiredDraft(s);for(const key of ['summary','next'])if(changes[key]!==undefined)draft[key]=String(changes[key]);return touch(draft);
}
export function saveRoundBoard(s,{summary,next}={}){
 const r=roundState(s),draft=requiredDraft(s),tasks=draft.tasks.filter(task=>task.selected);
 if(!tasks.length)throw Error('至少选择一项纳入 V3 的待查事项。');
 summary=String(summary??draft.summary).trim();next=String(next??draft.next).trim();
 if(!summary||!next)throw Error('请写下本轮小结和下次起点。');
 const directionIds=unique(draft.messages.map(message=>message.directionId).filter(id=>knownDirection(id)));
 const evidenceByDirection=directionIds.map(directionId=>({directionId,title:knownDirection(directionId).title,evidence:unique(draft.messages.filter(message=>message.directionId===directionId).map(message=>message.provenance?.evidence).filter(Boolean)).join('\n')}));
 const record={company:'popmart',context:clone(roomContext),id:uid('research'),createdAt:now(),scope:r.scope,useMemory:r.useMemory,memoryByDirection:clone(r.memoryByDirection),directionIds,visitedDirectionIds:clone(r.visitedDirections),summary,next,evidence:evidenceByDirection.map(item=>item.title+'：'+item.evidence).join('\n'),evidenceByDirection,tasks:clone(tasks),categories:clone(draft.categories.map(category=>({...category,taskIds:category.taskIds.filter(id=>tasks.some(task=>task.id===id))}))),references:clone(draft.references),messages:clone(draft.messages),roundDraft:clone({...draft,summary,next})};
 const board={...clone(record),kind:'generated-board',version:3,generation:(r.generatedBoards?.length||0)+1,baseline:clone(s.versions.find(version=>version.id===2)),financialData:clone(DATA.interim)};
 saveResearchReturn(s,{topic:'old',stage:3,title:record.categories.filter(category=>category.taskIds.length).map(category=>category.title).join(' / ')+'查证',question:next,when:'下次研究时',context:roomContext,references:[...record.references,{id:record.id,kind:'board',context:clone(roomContext),anchor:'room-record-'+record.id,label:'用户保存的本轮研究草稿',excerpt:summary,text:summary+'\n'+tasks.map(task=>task.title+(task.need?'：'+task.need:'')).join('\n')+'\n下次：'+next}]});
 r.records.push(record);(r.generatedBoards??=[]).push(board);r.savedId=record.id;r.savedMessageCount=r.messages.length;r.savedSignature=draft.id+':'+draft.updatedAt;r.started=true;
 return board;
}

/** Count discussion that has not reached the latest saved board, even if drafted. */
export function conversationBoardPendingCount(s){
 const saved=new Set((latestGeneratedBoard(s)?.messages||[]).map(message=>message.id));
 return roundConversation(s).filter(message=>message.kind!=='opening'&&String(message.user||'').trim()&&!saved.has(message.id)).length;
}

function conversationSnapshotSummary(categories,messages){
 if(categories.length)return categories.map(category=>String(category.title||'').trim()+(String(category.description||'').trim()?'：'+String(category.description).trim():'')).join('\n');
 return messages.filter(message=>message.kind!=='opening'&&String(message.user||'').trim()).map(message=>'讨论问题：'+String(message.user).trim()).join('\n');
}

function appendConversationSnapshot(s,source){
 const r=roundState(s),{kind,version,generation,...saved}=clone(source);
 const categories=(saved.categories||[]).map(category=>({...category,taskIds:[]}));
 const messages=saved.messages||[],messageIds=messages.map(message=>message.id),references=saved.references||[];
 const summary=conversationSnapshotSummary(categories,messages);
 const record={...saved,id:uid('research'),createdAt:now(),summary,next:'',tasks:[],categories,messages,messageIds,references,
  baseline:clone(saved.baseline??s.versions.find(item=>item.id===2)),financialData:clone(saved.financialData??DATA.interim),
  roundDraft:{...clone(saved.roundDraft||{}),categories:clone(categories),messages:clone(messages),messageIds:clone(messageIds),references:clone(references),tasks:[],summary,next:''}};
 const board={...clone(record),kind:'generated-board',version:3,generation:(r.generatedBoards?.length||0)+1};
 r.records.push(record);(r.generatedBoards??=[]).push(board);r.savedId=record.id;
 r.savedMessageCount=r.messages.filter(message=>messageIds.includes(message.id)).length;
 if(r.roundDraft)r.savedSignature=r.roundDraft.id+':'+r.roundDraft.updatedAt;
 r.started=true;return board;
}

function requiredConversationBoard(s){const board=latestGeneratedBoard(s);if(!board)throw Error('请先生成研究看板。');return board;}

const boardBoundaries={
 molly:'单期收入回落尚不能确定长期需求走弱，也不能区分产品节奏与需求变化。',
 stars:'本期放量可作为已有 IP 商业化进展的证据，尚不足以确认新 IP 孵化具备可重复性。',
 monster:'头部占比下降同时受到头部收入回落与其余收入增长影响，尚不能单凭占比确认头部依赖已经消退。',
 overseas:'区域及渠道总额的变化尚不能说明原有门店经营或终端需求改善，开店扩张与渠道迁移仍需分别理解。',
 margin:'汇兑变化是利润变化的一项线索；现有材料尚不能把利润增速放缓全部归因于汇兑。',
 cash:'本期经营现金流与集团利润的差额尚不能单独证明利润质量恶化，也不能说明差额具有持续性。',
 inventory:'库存余额和周转天数同时上升，尚不足以判定滞销；备货、在途及产品结构的影响尚未分清。',
 platform:'单个 IP 的单期变化尚不足以确认平台跨周期能力；老 IP 持续经营、新 IP 接续与经营质量应分别保留判断。'
};

/** The composer reference is a snapshot. Selecting or cancelling never sends a turn. */
export function setBoardConversationReference(s,{categoryId,quote,reference}={}){
 const r=roundState(s);
 if(!categoryId&&reference){
  const frozen=clone(reference),text=String(frozen.text??frozen.excerpt??'');
  return r.boardConversationReference={...frozen,kind:'selection',boardId:frozen.boardId||frozen.context?.key||null,
   version:frozen.context?.stage==='update'?3:frozen.context?.versionId??null,generation:null,categoryId:null,title:String(frozen.label||'看板选中内容'),description:text,
   quote:String(quote??frozen.excerpt??text),directionIds:[],references:[frozen],sourceMessageIds:[]};
 }
 const board=requiredConversationBoard(s),category=categoryId?(board.categories||[]).find(item=>item.id===categoryId):null;
 if(categoryId&&!category)throw Error('没有找到这个研究类目。');
 const messages=category?(board.messages||[]).filter(message=>(category.messageIds||[]).includes(message.id)):(board.messages||[]);
 const references=category?referencesFrom(messages):clone(board.references||[]),directionIds=clone(category?.directionIds||[]);
 const direction=directionIds.length===1?knownDirection(directionIds[0]):null;
 const evidence=unique(messages.map(message=>message.provenance?.evidence).filter(Boolean)).join('\n')||unique(references.filter(item=>item.provenance?.type==='new-disclosure').map(item=>item.excerpt).filter(Boolean)).join('\n');
 const domestic=direction?.id==='molly'&&messages.some(message=>message.scope==='domestic')&&!messages.some(message=>message.scope==='all');
 const interpretation=direction?(domestic?'现有材料未提供国内同口径收入，暂不能判断国内收入或需求是否回落。':boardBoundaries[direction.id]):'';
 return r.boardConversationReference={kind:category?'category':'board',boardId:board.id,version:board.version,generation:board.generation,categoryId:category?.id||null,
  title:category?.title||'本轮研究看板',description:category?.description??board.summary??'',quote:String(quote??category?.description??board.summary??''),
  directionIds,references:clone(references),sourceMessageIds:messages.map(message=>message.id),evidence,interpretation};
}

export function clearBoardConversationReference(s){roundState(s).boardConversationReference=null;}

function promptsForBoardReference(reference){
 if(reference?.kind==='board')return [{id:'board:add-category',text:'新增类目：'}];
 if(reference?.kind==='category'&&reference.evidence&&reference.interpretation)return [
  {id:'board:clarify',text:'澄清这段里的证据与判断'},
  {id:'board:cautious',text:'把这段表述写得更谨慎'}
 ];
 return [];
}
export function boardConversationPrompts(s){return promptsForBoardReference(roundState(s).boardConversationReference);}

/** Only an explicit reference or a board prompt may continue a quoted discussion. */
export function sendBoardConversationInput(s,text,{promptId}={}){
 const user=String(text??'').trim();if(!user)throw Error('请先写下问题。');
 const r=roundState(s);
 const reference=r.boardConversationReference||(String(promptId||'').startsWith('board:')?[...r.messages].reverse().find(message=>message.boardReference)?.boardReference:null);
 if(!reference)return sendRoundInput(s,user);
 const prompts=promptsForBoardReference(reference),prompt=promptId?prompts.find(item=>item.id===promptId):prompts.find(item=>clean(item.text)===clean(user));
 if(promptId&&(!prompt||prompt.id!=='board:add-category'&&clean(prompt.text)!==clean(user)))throw Error('请选择对应的引用追问。');
 const frozen=clone(reference);
 let boardChange=null,answer=null;
 if(frozen.kind==='category'&&(prompt?.id==='board:clarify'||prompt?.id==='board:cautious')){
  const description=prompt.id==='board:clarify'?'已知事实：'+frozen.evidence+'\n判断边界：'+frozen.interpretation:frozen.evidence+'\n'+frozen.interpretation;
  boardChange={type:'update-category',categoryId:frozen.categoryId,title:frozen.title,description,sourceBoardId:frozen.boardId,previous:{title:frozen.title,description:frozen.description}};
  answer='已按现有材料重新整理这段表述。';
 }
 const newCategory=frozen.kind!=='selection'&&user.match(/^新增类目[：:]\s*([^\n]+)$/);
 const replacement=frozen.kind==='category'&&user.match(/^小结改为[：:]\s*([\s\S]+)$/);
 const rename=frozen.kind==='category'&&user.match(/^类目改名[：:]\s*([^\n]+)$/);
 if(newCategory){
  const title=newCategory[1].trim();if(title){
   boardChange={type:'add-category',categoryId:uid('category-custom'),title,description:'',sourceBoardId:frozen.boardId,previous:null};
   answer='已准备「'+title+'」类目。';
  }
 }else if(replacement){
  boardChange={type:'update-category',categoryId:frozen.categoryId,title:frozen.title,description:replacement[1].trim(),sourceBoardId:frozen.boardId,previous:{title:frozen.title,description:frozen.description}};
  answer='已按你提供的文字准备修改。';
 }else if(rename&&rename[1].trim()){
  boardChange={type:'update-category',categoryId:frozen.categoryId,title:rename[1].trim(),description:frozen.description,sourceBoardId:frozen.boardId,previous:{title:frozen.title,description:frozen.description}};
  answer='已准备将类目改名为「'+rename[1].trim()+'」。';
 }
 const message={id:uid('round-message'),kind:answer?'board-proposal':'pending',origin:prompt?'prompt':'typed',action:'board-reference',user,answer,
  boardReference:frozen,...(boardChange?{boardChange}:{}),...(prompt?{promptId:prompt.id}:{}),references:clone(frozen.references||[]),at:now()};
 roundConversation(s);r.messages.push(message);r.started=true;r.conversationDraft='';r.boardConversationReference=null;
 return message;
}

function boardWorkingDraft(s,board){
 const r=roundState(s);if(r.roundDraft)return r.roundDraft;
 return r.roundDraft=workingDraftFromBoard(board);
}
function workingDraftFromBoard(board){
 const previous=board.roundDraft||{};
 return {...clone(previous),id:previous.id||uid('round-draft'),createdAt:previous.createdAt||board.createdAt,updatedAt:previous.updatedAt||board.createdAt,
  categories:clone(board.categories||[]),messages:clone(board.messages||[]),messageIds:(board.messages||[]).map(message=>message.id),references:clone(board.references||[]),tasks:clone(previous.tasks||board.tasks||[]),summary:previous.summary??board.summary??'',next:previous.next||board.next||''};
}

/** Edit only saved content. Pending conversation remains pending until an update. */
export function editConversationBoardCategory(s,categoryId,changes){
 const board=requiredConversationBoard(s),source=(board.categories||[]).find(category=>category.id===categoryId);
 if(!source)throw Error('没有找到这个研究类目。');
 const edits={};
 if(changes.title!==undefined){if(!String(changes.title).trim())throw Error('请填写类目名称。');edits.title=String(changes.title).trim();}
 if(changes.description!==undefined)edits.description=String(changes.description).trim();
 const categories=clone(board.categories);Object.assign(categories.find(category=>category.id===categoryId),edits);
 const draft=boardWorkingDraft(s,board);let working=draft.categories.find(category=>category.id===categoryId);
 if(!working){working={...clone(source),messageIds:(source.messageIds||[]).filter(id=>draft.messageIds.includes(id)),taskIds:[]};draft.categories.push(working);}
 Object.assign(working,edits);touch(draft);
 return appendConversationSnapshot(s,{...board,categories});
}

export function addConversationBoardCategory(s,{title,description=''}){
 const board=requiredConversationBoard(s);if(!String(title??'').trim())throw Error('请填写类目名称。');
 const category={id:uid('category-custom'),title:String(title).trim(),description:String(description).trim(),origin:'custom',directionIds:[],messageIds:[],taskIds:[]};
 const draft=boardWorkingDraft(s,board);draft.categories.push(clone(category));touch(draft);
 return appendConversationSnapshot(s,{...board,categories:[...(board.categories||[]),category]});
}

/** Accumulate research directly; the editable working copy stays internal. */
export function generateConversationBoard(s){
 const r=roundState(s),messages=roundConversation(s);
 if(!messages.some(message=>message.kind!=='opening'&&String(message.user||'').trim()))throw Error('先讨论一个研究问题，再生成研究看板。');
 const latest=latestGeneratedBoard(s),draft=r.roundDraft||(latest?workingDraftFromBoard(latest):{id:uid('round-draft'),createdAt:now(),updatedAt:now(),messageIds:[],messages:[],references:[],categories:[],tasks:[],summary:'',next:''});
 const savedIds=new Set((latest?.messages||[]).map(message=>message.id));
 // A later reply may refine or replace an earlier proposal for the same block.
 const proposals=[...new Map(messages.filter(message=>message.boardChange&&!savedIds.has(message.id)).map(message=>[message.boardChange.categoryId,message])).values()];
 // Validate every proposal before touching the working copy. An unrelated new
 // snapshot is safe; a changed or removed target must be quoted again.
 for(const message of proposals){
  const change=message.boardChange;
  if(change.type==='add-category'){
   if(!latest||!String(change.title||'').trim()||draft.categories.some(category=>category.id===change.categoryId))throw Error('这个类目已变化，请重新引用看板后讨论。');
  }else if(change.type==='update-category'){
   const saved=(latest?.categories||[]).find(category=>category.id===change.categoryId),working=draft.categories.find(category=>category.id===change.categoryId);
   if(!saved||!change.previous||saved.title!==change.previous.title||saved.description!==change.previous.description||working&&(working.title!==change.previous.title||working.description!==change.previous.description))throw Error('这块内容已更新，请重新引用后讨论。');
  }else throw Error('无法应用这项看板修改。');
 }
 // Existing category edits and message assignments survive; legacy tasks are
 // retained internally without being extended, selected, or copied to the board.
 appendMessages(s,draft,messages,{includeTasks:false});
 for(const message of proposals){
  const change=message.boardChange;
  let category=draft.categories.find(item=>item.id===change.categoryId);
  if(!category){
   category=change.type==='add-category'?{id:change.categoryId,title:change.title,description:change.description,origin:'custom',directionIds:[],messageIds:[],taskIds:[]}:clone(latest.categories.find(item=>item.id===change.categoryId));
   draft.categories.push(category);
  }
  category.title=change.title;category.description=change.description;category.messageIds=unique([...(category.messageIds||[]),message.id]);
 }
 const categories=clone(draft.categories.map(category=>({...category,taskIds:[]})));
 const directionIds=unique(draft.messages.map(message=>message.directionId).filter(id=>knownDirection(id)));
 const evidenceByDirection=directionIds.map(directionId=>({directionId,title:knownDirection(directionId).title,evidence:unique(draft.messages.filter(message=>message.directionId===directionId).map(message=>message.provenance?.evidence).filter(Boolean)).join('\n')}));
 const record={company:'popmart',context:clone(roomContext),id:uid('research'),createdAt:now(),scope:r.scope,useMemory:r.useMemory,memoryByDirection:clone(r.memoryByDirection),directionIds,visitedDirectionIds:clone(r.visitedDirections),next:'',evidence:evidenceByDirection.map(item=>item.title+'：'+item.evidence).join('\n'),evidenceByDirection,tasks:[],categories,references:clone(draft.references),messageIds:clone(draft.messageIds),messages:clone(draft.messages),roundDraft:clone({...draft,categories,tasks:[],next:''})};
 r.roundDraft=draft;r.activeCategoryId||=draft.categories[0]?.id||null;r.workspaceMode='conversation';
 return appendConversationSnapshot(s,record);
}
