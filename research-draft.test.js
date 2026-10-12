import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,restore,SOURCE} from './engine.js';
import {roomState,changeRoom,roomBoardDraft,generateRoomBoard} from './research-room-model.js';
import {roundState,roundConversation,roundOpeningPrompts,roundPrompts,roundSuggestedPrompts,sendRoundInput,generateRoundDraft,roundPendingCount,refreshRoundDraft,roundUnassignedMessages,roundUnassignedTasks,addRoundCategory,updateRoundCategory,removeRoundCategory,assignRoundMessage,assignRoundTask,addRoundTask,updateRoundTask,updateRoundDraft,saveRoundBoard} from './research-draft-model.js';

function onlyTyped(){const s=initialState();roundState(s).roundSeedMessages=[];return s;}
const promptFor=id=>roundPrompts().find(prompt=>prompt.directionId===id);
function discussedState(ids=['molly','stars','inventory','cash']){
 const s=initialState();for(const id of ids){const prompt=roundOpeningPrompts().find(item=>item.directionId===id);sendRoundInput(s,prompt.text);}return s;
}

test('v37 默认只呈现简短半年报提醒，具体数据留在引用且不预填问答与任务',()=>{
 const s=initialState(),r=roundState(s);assert.equal(r.workspaceMode,'conversation');assert.equal(r.roundDraft,null);assert.equal(r.activeCategoryId,null);
 const messages=roundConversation(s),snapshot=structuredClone(messages);
 assert.equal(messages.length,1);assert.equal(messages[0].kind,'opening');assert.equal(messages[0].user,null);assert.equal(messages[0].directionId,undefined);assert.equal(messages[0].suggestedTasks,undefined);
 assert.equal(messages[0].answer,'泡泡玛特发布了 2026 年半年报。MOLLY 回落、星星人增长，库存周转也出现了新变化。想先聊哪一项？');assert.equal(messages[0].references[0].source.url,SOURCE.interim.url);
 assert.match(messages[0].references[0].text,/MOLLY.*同比/);assert.match(messages[0].references[0].text,/星星人.*同比/);assert.match(messages[0].references[0].text,/存货周转天数/);assert.equal(messages[0].references[0].text.split('\n').length,3);
 assert.deepEqual(r.messages,[]);assert.equal(r.roundDraft,null);
 r.scope='domestic';r.useMemory=false;assert.deepEqual(roundConversation(s),snapshot);
 assert.ok(messages[0].references.some(ref=>ref.provenance.type==='new-disclosure'));
 assert.throws(()=>generateRoundDraft(s),/先讨论一个研究问题/);assert.equal(r.roundDraft,null);assert.deepEqual(roundUnassignedMessages(s),[]);assert.deepEqual(roundConversation(s),snapshot);
});

test('只更新 v36 自动开场原文，保留已编辑开场、真实消息、草稿及历史快照',()=>{
 const s=discussedState(['molly']),draft=generateRoundDraft(s),r=roomState(s),seed=r.roundSeedMessages[0];
 const oldAnswer='泡泡玛特发布了 2026 年半年报。我先标出三处变化：\n\n'+seed.references[0].text.split('\n').map(point=>'• '+point).join('\n');
 seed.answer=oldAnswer;draft.messages[0].answer=oldAnswer;draft.summary='用户自己的判断';
 saveRoundBoard(s,{summary:draft.summary,next:'继续核对产品节奏'});
 const oldDraft=structuredClone(draft),oldBoards=structuredClone(r.generatedBoards),oldRecords=structuredClone(r.records),oldMessages=structuredClone(r.messages),oldReferences=structuredClone(seed.references);
 const current=roundConversation(s)[0];assert.notEqual(current,seed);assert.notEqual(current.answer,oldAnswer);assert.match(current.answer,/想先聊哪一项/);assert.equal(seed.answer,oldAnswer);assert.deepEqual(current.references,oldReferences);assert.deepEqual(r.messages,oldMessages);assert.deepEqual(r.roundDraft,oldDraft);assert.deepEqual(r.generatedBoards,oldBoards);assert.deepEqual(r.records,oldRecords);
 const edited=initialState(),editedSeed=roundConversation(edited)[0];editedSeed.answer='用户自行改过的开场';assert.equal(roundConversation(edited)[0],editedSeed);assert.equal(roundConversation(edited)[0].answer,'用户自行改过的开场');
 editedSeed.answer=oldAnswer;editedSeed.id='user-authored-opening';assert.equal(roundConversation(edited)[0].answer,oldAnswer);
 const restored=restore(JSON.stringify(s));assert.equal(roundConversation(restored)[0].answer,current.answer);assert.deepEqual(restored.researchRoom.generatedBoards,oldBoards);assert.deepEqual(restored.researchRoom.roundDraft,oldDraft);
});

test('建议从具体首问开始，点击只追加一组问答，再提供当前方向的未问追问',()=>{
 const s=initialState(),r=roundState(s),initial=roundSuggestedPrompts(s);
 assert.deepEqual(initial.map(prompt=>prompt.id),['molly:-1','stars:-1','inventory:-1','cash:-1']);assert.equal(r.messages.length,0);assert.equal(roundConversation(s).length,1);
 const first=sendRoundInput(s,initial[0].text,initial[0]);assert.equal(first.promptId,'molly:-1');assert.equal(first.promptIndex,-1);assert.equal(first.user,initial[0].text);assert.ok(first.answer);assert.equal(first.kind,'preset');assert.equal(r.messages.length,1);assert.equal(roundConversation(s).length,2);
 const next=roundSuggestedPrompts(s);assert.deepEqual(next.map(prompt=>prompt.id),['molly:0','molly:1','molly:2','stars:-1']);assert.equal(r.messages.length,1);
 sendRoundInput(s,next[0].text,next[0]);assert.ok(!roundSuggestedPrompts(s).some(prompt=>prompt.id==='molly:0'));assert.equal(r.messages.length,2);
 const draft=generateRoundDraft(s);assert.deepEqual(draft.categories.map(category=>category.directionIds),[['molly']]);assert.ok(draft.tasks.every(task=>task.directionId==='molly'));assert.equal(draft.messages.length,3);assert.deepEqual(roundUnassignedMessages(s),[]);
 assert.equal(roundOpeningPrompts().length,8);assert.equal(roundPrompts().length,24);
 for(const prompt of [...roundOpeningPrompts(),...roundPrompts()])sendRoundInput(s,prompt.text,prompt);
 assert.deepEqual(roundSuggestedPrompts(s),[]);
});

test('旧版四组默认问答移入备份，真实输入、已编辑草稿及已生成历史保持原样',()=>{
 const s=discussedState(),draft=generateRoundDraft(s),r=roomState(s);
 const oldIds=new Map(r.messages.map(message=>[message.id,'round-demo-'+message.directionId]));
 const seeds=r.messages.map(message=>({...structuredClone(message),id:oldIds.get(message.id),kind:'demo',origin:'demo',action:'demo'}));
 draft.messages=structuredClone(seeds);draft.messageIds=seeds.map(message=>message.id);
 draft.categories.forEach(category=>{category.messageIds=category.messageIds.map(id=>oldIds.get(id));});
 draft.tasks.forEach(task=>{task.sourceMessageIds=task.sourceMessageIds.map(id=>oldIds.get(id));});
 draft.categories[0].title='用户改过的旧类目';draft.summary='用户编辑过的旧草稿';
 const userMessage={id:'retained-real-input',kind:'pending',origin:'typed',action:'question',user:'保留这条真实输入',answer:null,references:[]};
 r.roundSeedMessages=structuredClone(seeds);r.messages=[userMessage];r.conversationDraft='还没发送的文字';
 saveRoundBoard(s,{summary:draft.summary,next:'继续核对旧问题'});
 const oldDraft=structuredClone(draft),oldBoards=structuredClone(r.generatedBoards),oldRecords=structuredClone(r.records);
 const visible=roundConversation(s);assert.equal(visible.length,2);assert.equal(visible[0].kind,'opening');assert.deepEqual(visible[1],userMessage);assert.deepEqual(r.messages,[userMessage]);assert.equal(r.conversationDraft,'还没发送的文字');assert.deepEqual(r.legacySeedMessages,seeds);
 assert.deepEqual(r.roundDraft,oldDraft);assert.deepEqual(r.generatedBoards,oldBoards);assert.deepEqual(r.records,oldRecords);assert.equal(roundPendingCount(s),1);
 roundConversation(s);assert.equal(r.legacySeedMessages.length,4);assert.deepEqual(r.roundDraft,oldDraft);
 const restored=restore(JSON.stringify(s));assert.deepEqual(roundConversation(restored),visible);assert.deepEqual(restored.researchRoom.legacySeedMessages,seeds);assert.deepEqual(restored.researchRoom.generatedBoards,oldBoards);
 const fresh=initialState();roundState(fresh).roundSeedMessages=structuredClone(seeds);
 assert.throws(()=>generateRoundDraft(fresh),/先讨论一个研究问题/);assert.equal(roundState(fresh).roundDraft,null);assert.equal(roundConversation(fresh).length,1);assert.equal(roundConversation(fresh)[0].kind,'opening');assert.deepEqual(roundState(fresh).legacySeedMessages,seeds);
});

test('草稿只从实际讨论过的方向归类，浏览过的八个方向不能凭空出现',()=>{
 const s=onlyTyped(),r=roundState(s);r.visitedDirections=['molly','stars','inventory','cash','margin','overseas','platform','monster'];
 sendRoundInput(s,promptFor('cash').text);
 const draft=generateRoundDraft(s);assert.deepEqual(draft.categories.map(category=>category.directionIds),[['cash']]);
 assert.ok(draft.tasks.every(task=>task.directionId==='cash'));assert.equal(draft.messages.length,1);assert.equal(r.workspaceMode,'draft');
 assert.equal(draft.references.length,1);assert.equal(draft.references[0].provenance.type,'new-disclosure');
});

test('自由输入原样待答，不伪造回复、证据或默认MOLLY类目',()=>{
 const s=onlyTyped(),text='请查一下会员复购率 <img src=x onerror=alert(1)>',message=sendRoundInput(s,text);
 assert.equal(message.user,text);assert.equal(message.answer,null);assert.equal(message.kind,'pending');assert.equal(message.directionId,undefined);assert.deepEqual(message.references,[]);
 const draft=generateRoundDraft(s);assert.deepEqual(draft.categories,[]);assert.deepEqual(draft.references,[]);assert.deepEqual(draft.tasks,[]);assert.deepEqual(draft.messages,[message]);assert.deepEqual(draft.messageIds,[message.id]);assert.deepEqual(roundUnassignedMessages(s),[message]);assert.deepEqual(roundUnassignedTasks(s),[]);assert.equal(roundState(s).activeCategoryId,null);
 const before=structuredClone(roundState(s).messages);assert.throws(()=>sendRoundInput(s,'不对',{directionId:'cash',promptIndex:0}));assert.deepEqual(roundState(s).messages,before);
});

test('精确案例追问保留领域与材料，否定或拼接不能误匹配',()=>{
 const s=onlyTyped(),preset=promptFor('stars'),message=sendRoundInput(s,preset.text,{directionId:preset.directionId,promptIndex:preset.promptIndex});
 assert.equal(message.kind,'preset');assert.equal(message.directionId,'stars');assert.ok(message.answer.includes('已有 IP'));assert.ok(message.references.length);
 const pending=sendRoundInput(s,'不要'+preset.text);assert.equal(pending.kind,'pending');assert.equal(pending.answer,null);
 assert.equal(roundPrompts().length,24);
});

test('自建类目和待查事项不附加金融事实，可把已有讨论与任务移入并改名',()=>{
 const s=discussedState(),draft=generateRoundDraft(s),category=addRoundCategory(s,{title:'用户增长'});
 assert.deepEqual(category.messageIds,[]);assert.deepEqual(category.directionIds,[]);assert.equal(category.description,'');assert.equal(category.origin,'custom');assert.equal(category.evidence,undefined);
 const customTask=addRoundTask(s,{categoryId:category.id,title:'了解会员复购率'});assert.equal(customTask.origin,'custom');assert.deepEqual(customTask.sourceMessageIds,[]);assert.equal(customTask.source,'');assert.equal(customTask.need,'');
 const message=draft.messages.find(item=>item.user),original=structuredClone(message),task=draft.tasks.find(item=>item.origin==='discussion');
 assignRoundMessage(s,message.id,category.id);assignRoundTask(s,task.id,category.id);updateRoundCategory(s,category.id,{title:'长期需求',description:'补充复购数据后再判断。'});
 assert.equal(draft.categories.filter(item=>item.messageIds.includes(message.id)).length,1);assert.ok(category.messageIds.includes(message.id));assert.ok(category.taskIds.includes(task.id));assert.equal(task.categoryId,category.id);assert.deepEqual(message,original);assert.equal(category.title,'长期需求');
 updateRoundTask(s,customTask.id,{title:'补充会员复购率',need:'两年同期',selected:false});assert.equal(customTask.selected,false);assert.equal(customTask.need,'两年同期');
});

test('新增聊天不会重算草稿，显式纳入后保留用户小结、类目、任务选择与移动',()=>{
 const s=discussedState(),draft=generateRoundDraft(s),cashCategory=draft.categories.find(category=>category.directionIds.includes('cash'));
 updateRoundCategory(s,cashCategory.id,{title:'现金回收',description:'用户自己的判断'});
 const custom=addRoundCategory(s,{title:'合并验证'}),task=draft.tasks.find(item=>item.directionId==='cash'),cashMessage=draft.messages.find(message=>message.directionId==='cash');
 assignRoundTask(s,task.id,custom.id);assignRoundMessage(s,cashMessage.id,custom.id);updateRoundTask(s,task.id,{title:'用户改过的任务',selected:false});
 const ownTask=addRoundTask(s,{categoryId:custom.id,title:'我的待查项'});updateRoundDraft(s,{summary:'手动小结',next:'先查复购'});
 const snapshot=structuredClone(draft);sendRoundInput(s,promptFor('cash').text);sendRoundInput(s,promptFor('overseas').text);
 assert.equal(roundPendingCount(s),2);assert.deepEqual(draft,snapshot);assert.equal(generateRoundDraft(s),draft);assert.deepEqual(draft,snapshot);
 refreshRoundDraft(s);assert.equal(roundPendingCount(s),0);assert.equal(cashCategory.title,'现金回收');assert.equal(cashCategory.description,'用户自己的判断');assert.equal(draft.summary,'手动小结');assert.equal(draft.next,'先查复购');assert.equal(task.title,'用户改过的任务');assert.equal(task.selected,false);assert.equal(task.categoryId,custom.id);assert.ok(custom.messageIds.includes(cashMessage.id));assert.ok(draft.tasks.includes(ownTask));assert.ok(draft.categories.some(category=>category.directionIds.includes('overseas')));
 assert.equal(draft.tasks.filter(item=>item.id===task.id).length,1);assert.equal(task.sourceMessageIds.length,2);
});

test('删除类目仅取消归属，不创建占位类目或删除讨论与待查事项',()=>{
 const s=discussedState(),draft=generateRoundDraft(s),category=draft.categories[0],messages=[...category.messageIds],tasks=[...category.taskIds];
 const originalMessages=structuredClone(draft.messages),originalTasks=structuredClone(draft.tasks);
 roundState(s).activeCategoryId=category.id;removeRoundCategory(s,category.id);
 assert.ok(!draft.categories.some(item=>item.id==='uncategorized'));assert.ok(!draft.categories.some(item=>item.id===category.id));assert.deepEqual(draft.messages,originalMessages);assert.equal(draft.tasks.length,originalTasks.length);
 assert.ok(messages.every(id=>roundUnassignedMessages(s).some(message=>message.id===id)));assert.ok(tasks.every(id=>roundUnassignedTasks(s).some(task=>task.id===id&&task.categoryId===null)));
 for(const task of draft.tasks)assert.deepEqual(task,{...originalTasks.find(item=>item.id===task.id),...(tasks.includes(task.id)?{categoryId:null}:{})});
 const custom=addRoundCategory(s,{title:'自行验证'});assignRoundMessage(s,messages[0],custom.id);assignRoundTask(s,tasks[0],custom.id);removeRoundCategory(s,custom.id);
 assert.ok(roundUnassignedMessages(s).some(message=>message.id===messages[0]));assert.ok(roundUnassignedTasks(s).some(task=>task.id===tasks[0]));assert.ok(!draft.categories.some(item=>item.id==='uncategorized'));
});

test('已有草稿纳入自由输入只追加原文，之后可直接归入用户类目并解除归属',()=>{
 const s=discussedState(),draft=generateRoundDraft(s),categoryIds=draft.categories.map(category=>category.id),message=sendRoundInput(s,'查一下会员复购率');
 assert.equal(roundPendingCount(s),1);assert.deepEqual(roundUnassignedMessages(s),[]);refreshRoundDraft(s);
 assert.equal(roundPendingCount(s),0);assert.deepEqual(draft.categories.map(category=>category.id),categoryIds);assert.deepEqual(roundUnassignedMessages(s),[message]);
 const custom=addRoundCategory(s,{title:'需求跟踪'});assignRoundMessage(s,message.id,custom.id);assert.deepEqual(roundUnassignedMessages(s),[]);
 const task=addRoundTask(s,{categoryId:custom.id,title:'补充复购记录'});assignRoundMessage(s,message.id,null);assignRoundTask(s,task.id,null);
 assert.deepEqual(roundUnassignedMessages(s),[message]);assert.deepEqual(roundUnassignedTasks(s),[task]);assert.equal(task.categoryId,null);assert.deepEqual(custom.messageIds,[]);assert.deepEqual(custom.taskIds,[]);
 assignRoundMessage(s,message.id,custom.id);assignRoundTask(s,task.id,custom.id);assert.deepEqual(roundUnassignedMessages(s),[]);assert.deepEqual(roundUnassignedTasks(s),[]);
});

test('v34 系统占位类目仅迁移当前草稿，旧编辑、原文、任务及历史快照全部保留',()=>{
 const s=onlyTyped(),message=sendRoundInput(s,'旧版本留下的问题'),draft=generateRoundDraft(s),r=roomState(s);
 const legacy={id:'uncategorized',title:'旧版本里用户改过的名称',description:'旧版本里用户补充的小结',origin:'discussion',directionIds:[],messageIds:[message.id],taskIds:['legacy-task']};
 const task={id:'legacy-task',title:'旧待查项',need:'保留用户补充的要求',selected:true,origin:'custom',categoryId:'uncategorized',sourceMessageIds:[]};
 draft.categories.push(structuredClone(legacy));draft.tasks.push(structuredClone(task));r.activeCategoryId='uncategorized';
 r.records=[{id:'old-record',messages:structuredClone(draft.messages),categories:structuredClone(draft.categories),tasks:structuredClone(draft.tasks),roundDraft:structuredClone(draft)}];
 r.generatedBoards=[{...structuredClone(r.records[0]),kind:'generated-board',version:3}];
 const oldRecords=structuredClone(r.records),oldBoards=structuredClone(r.generatedBoards),originalMessages=structuredClone(r.messages),originalReferences=structuredClone(draft.references);
 roundState(s);assert.deepEqual(draft.categories,[]);assert.deepEqual(draft.retiredCategories,[legacy]);assert.deepEqual(draft.tasks,[{...task,categoryId:null}]);assert.deepEqual(draft.messages,[message]);assert.deepEqual(draft.references,originalReferences);assert.deepEqual(r.messages,originalMessages);assert.deepEqual(r.records,oldRecords);assert.deepEqual(r.generatedBoards,oldBoards);assert.equal(r.activeCategoryId,null);
 roundState(s);assert.equal(draft.retiredCategories.length,1);assert.deepEqual(roundUnassignedMessages(s),[message]);assert.deepEqual(roundUnassignedTasks(s),[{...task,categoryId:null}]);
 const restored=restore(JSON.stringify(s));roundState(restored);assert.deepEqual(restored.researchRoom.roundDraft,draft);assert.deepEqual(restored.researchRoom.generatedBoards,oldBoards);
 const board=saveRoundBoard(s,{summary:'继续保留这段研究',next:'查旧待查项'});assert.deepEqual(board.categories,[]);assert.deepEqual(board.messages,[message]);assert.deepEqual(board.tasks,[{...task,categoryId:null}]);assert.deepEqual(board.roundDraft.retiredCategories,[legacy]);assert.deepEqual(r.generatedBoards[0],oldBoards[0]);
});

test('兼容迁移按系统ID识别，不删除用户自己命名的类目',()=>{
 const s=initialState(),category={id:'category-custom-retained',title:'未归类',description:'这是用户主动建立的分类',origin:'custom',directionIds:[],messageIds:[],taskIds:[]};
 // Restore a draft saved by an older version; no fabricated user turn is needed.
 const draft={id:'historical-custom-draft',createdAt:'2026-10-11T01:02:03.000Z',updatedAt:'2026-10-11T01:02:03.000Z',messageIds:[],messages:[],references:[],categories:[category],tasks:[],summary:'',next:''};
 roomState(s).roundDraft=draft;
 roundState(s);assert.ok(draft.categories.includes(category));assert.equal(category.description,'这是用户主动建立的分类');assert.equal(draft.retiredCategories,undefined);
 assert.deepEqual(roundUnassignedMessages(initialState()),[]);assert.deepEqual(roundUnassignedTasks(initialState()),[]);
});

test('兼容 v33：旧消息、草稿、选择、研究记录与生成快照逐项保留',()=>{
 const s=initialState();changeRoom(s,'start');roomState(s).draft='尚未发送的 v33 问题';roomState(s).selection['all:demand']=false;
 generateRoomBoard(s,roomBoardDraft(s));const before=structuredClone(roomState(s)),history=structuredClone(s.versions);
 const r=roundState(s);assert.equal(r.conversationDraft,before.draft);assert.equal(r.roundDraft,null);assert.equal(r.workspaceMode,'conversation');
 roundConversation(s);assert.throws(()=>generateRoundDraft(s),/先讨论一个研究问题/);assert.equal(r.roundDraft,null);assert.deepEqual(r.messages,before.messages);assert.deepEqual(r.selection,before.selection);assert.equal(r.draft,before.draft);assert.deepEqual(r.records,before.records);assert.deepEqual(r.generatedBoards,before.generatedBoards);assert.deepEqual(s.versions,history);
 assert.ok(r.records[0].messages.some(message=>message.id===before.messages[0].id));assert.equal(r.selection['all:demand'],false);assert.equal(r.conversationDraft,before.draft);
 const restored=restore(JSON.stringify(s));assert.deepEqual(restored.researchRoom,r);assert.deepEqual(restored.versions,history);
});

test('保存 V3 冻结类目、讨论、任务与材料，后续编辑或聊天不会改写历史',()=>{
 const s=discussedState(),draft=generateRoundDraft(s),custom=addRoundCategory(s,{title:'用户专属类目'}),ownTask=addRoundTask(s,{categoryId:custom.id,title:'补会员记录'});
 assignRoundMessage(s,draft.messages.find(message=>message.user).id,custom.id);sendRoundInput(s,'这条还没纳入草稿');assert.equal(roundPendingCount(s),1);
 const board=saveRoundBoard(s,{summary:'保留我的判断',next:'先补会员记录'}),snapshot=structuredClone(board);
 assert.equal(board.version,3);assert.equal(board.generation,1);assert.equal(board.messages.length,5);assert.ok(!board.messages.some(message=>message.user==='这条还没纳入草稿'));assert.ok(board.tasks.some(task=>task.id===ownTask.id));assert.ok(board.categories.some(category=>category.title==='用户专属类目'));
 assert.equal(s.researchReturns[0].question,'先补会员记录');assert.equal(s.researchRoom.records.length,1);assert.notEqual(s.researchRoom.records[0],board);
 updateRoundCategory(s,custom.id,{title:'后来改的类目'});updateRoundTask(s,ownTask.id,{title:'后来改的任务'});refreshRoundDraft(s);s.researchRoom.roundSeedMessages[0].answer='后来改动';
 assert.deepEqual(s.researchRoom.generatedBoards[0],snapshot);assert.equal(s.researchRoom.records[0].categories.find(category=>category.id===custom.id).title,'用户专属类目');
 assert.deepEqual(restore(JSON.stringify(s)).researchRoom.generatedBoards[0],snapshot);
});

test('有不同范围的同一来源保留各次引用，保存前校验不会产生部分记录',()=>{
 const s=onlyTyped();sendRoundInput(s,promptFor('molly').text);roundState(s).scope='domestic';sendRoundInput(s,promptFor('molly').text);
 const draft=generateRoundDraft(s),refs=draft.references.filter(ref=>ref.id==='room-molly-evidence');assert.equal(refs.length,2);assert.ok(refs.some(ref=>ref.text.includes('不能据此判断国内')));assert.ok(refs.some(ref=>!ref.text.includes('不能据此判断国内')));
 draft.tasks.forEach(task=>updateRoundTask(s,task.id,{selected:false}));assert.throws(()=>saveRoundBoard(s,{summary:'小结',next:'下次'}),/至少/);assert.equal(roundState(s).records.length,0);assert.equal(roundState(s).generatedBoards,undefined);
});
