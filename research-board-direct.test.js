import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,restore,DATA} from './engine.js';
import {roundState,roundConversation,roundOpeningPrompts,sendRoundInput,generateRoundDraft,refreshRoundDraft,roundPendingCount,addRoundCategory,updateRoundCategory,assignRoundMessage,updateRoundTask,updateRoundDraft,saveRoundBoard,generateConversationBoard,conversationBoardPendingCount,editConversationBoardCategory,addConversationBoardCategory} from './research-draft-model.js';

const ask=(s,id)=>sendRoundInput(s,roundOpeningPrompts().find(prompt=>prompt.directionId===id).text);

test('仅开场或未发送文字不能生成研究看板，也不留下半成品',()=>{
 const s=initialState(),r=roundState(s);roundConversation(s);r.conversationDraft='还没发送的问题';
 const before=structuredClone(s);
 assert.equal(conversationBoardPendingCount(s),0);
 assert.throws(()=>generateConversationBoard(s),/先讨论一个研究问题/);
 assert.deepEqual(s,before);assert.equal(r.roundDraft,null);assert.deepEqual(r.records,[]);assert.equal(r.generatedBoards,undefined);
});

test('直接生成保留所有研究类目，不要求选择任务或填写下次起点',()=>{
 const s=initialState();ask(s,'molly');ask(s,'stars');
 const draft=generateRoundDraft(s);draft.tasks.forEach(task=>updateRoundTask(s,task.id,{selected:false}));
 const custom=addRoundCategory(s,{title:'长期商业模式',description:'用户记录的判断'}),tasks=structuredClone(draft.tasks),versions=structuredClone(s.versions),returns=structuredClone(s.researchReturns);
 updateRoundDraft(s,{next:''});
 const board=generateConversationBoard(s),r=roundState(s);
 assert.deepEqual(board.categories.map(category=>category.id),draft.categories.map(category=>category.id));
 assert.ok(board.categories.some(category=>category.id===custom.id&&category.messageIds.length===0));
 assert.ok(board.categories.every(category=>category.taskIds.length===0));assert.deepEqual(board.tasks,[]);assert.equal(board.next,'');
 assert.deepEqual(board.roundDraft.tasks,[]);assert.equal(board.roundDraft.next,'');assert.ok(board.roundDraft.categories.every(category=>category.taskIds.length===0));
 assert.deepEqual(draft.tasks,tasks);assert.deepEqual(s.researchReturns,returns);assert.deepEqual(s.versions,versions);
 assert.deepEqual(board.baseline,versions.find(version=>version.id===2));assert.deepEqual(board.financialData,DATA.interim);
 assert.deepEqual(board.messages,roundConversation(s));assert.deepEqual(board.references,draft.references);assert.equal(r.workspaceMode,'conversation');assert.equal(conversationBoardPendingCount(s),0);
 assert.notEqual(r.records[0],board);assert.notEqual(r.records[0].categories,board.categories);
});

test('新流程不生成任务或跟进计划，自由问题完整保留为未归类原文',()=>{
 const s=initialState(),text='自由问题 <img src=x onerror=alert(1)>',message=sendRoundInput(s,text),returns=structuredClone(s.researchReturns);
 const board=generateConversationBoard(s),r=roundState(s);
 assert.deepEqual(board.categories,[]);assert.deepEqual(board.tasks,[]);assert.equal(board.next,'');assert.deepEqual(r.roundDraft.tasks,[]);
 assert.deepEqual(board.messages.find(item=>item.id===message.id),message);assert.equal(message.answer,null);assert.equal(message.user,text);
 assert.deepEqual(s.researchReturns,returns);assert.equal(conversationBoardPendingCount(s),0);
 const original=structuredClone(board);ask(s,'cash');generateConversationBoard(s);
 assert.deepEqual(r.roundDraft.tasks,[]);assert.deepEqual(r.generatedBoards[0],original);assert.deepEqual(s.researchReturns,returns);
});

test('持续纳入新讨论保留人工类目、小结、移动与未归类内容，旧看板保持快照',()=>{
 const s=initialState(),molly=ask(s,'molly');ask(s,'cash');const first=generateConversationBoard(s),r=roundState(s),draft=r.roundDraft;
 const originalBoard=structuredClone(first),originalRecord=structuredClone(r.records[0]),category=draft.categories.find(item=>item.directionIds.includes('molly'));
 updateRoundCategory(s,category.id,{title:'我的老 IP 判断',description:'保留用户自己的分类与判断。'});
 const custom=addRoundCategory(s,{title:'综合研究',description:'跨类目归纳'});assignRoundMessage(s,molly.id,custom.id);updateRoundDraft(s,{summary:'用户手动研究小结',next:'旧版本留下的待查文字'});
 const free=sendRoundInput(s,'补充一句没有自动分类的想法');ask(s,'inventory');
 assert.equal(conversationBoardPendingCount(s),2);const board=generateConversationBoard(s);
 assert.match(board.summary,/我的老 IP 判断：保留用户自己的分类与判断。/);assert.match(board.summary,/综合研究：跨类目归纳/);assert.equal(draft.summary,'用户手动研究小结');assert.equal(board.next,'');assert.equal(draft.next,'旧版本留下的待查文字');
 assert.equal(board.categories.find(item=>item.id===category.id).title,'我的老 IP 判断');assert.equal(board.categories.find(item=>item.id===category.id).description,'保留用户自己的分类与判断。');
 assert.ok(board.categories.find(item=>item.id===custom.id).messageIds.includes(molly.id));assert.ok(!board.categories.find(item=>item.id===category.id).messageIds.includes(molly.id));
 assert.ok(board.messages.some(item=>item.id===free.id));assert.ok(board.categories.every(item=>!item.messageIds.includes(free.id)));assert.ok(board.categories.some(item=>item.directionIds.includes('inventory')));
 assert.deepEqual(r.generatedBoards[0],originalBoard);assert.deepEqual(r.records[0],originalRecord);assert.equal(board.generation,2);
 updateRoundCategory(s,custom.id,{description:'保存后的修改'});assert.equal(board.categories.find(item=>item.id===custom.id).description,'跨类目归纳');
 assert.deepEqual(restore(JSON.stringify(s)).researchRoom.generatedBoards,r.generatedBoards);
});

test('待纳入计数对照最新已保存看板，内部草稿预先吸收消息不会清零',()=>{
 const s=initialState();assert.equal(conversationBoardPendingCount(s),0);ask(s,'molly');assert.equal(conversationBoardPendingCount(s),1);
 generateConversationBoard(s);assert.equal(conversationBoardPendingCount(s),0);
 sendRoundInput(s,'尚未进入看板的新讨论');ask(s,'stars');assert.equal(conversationBoardPendingCount(s),2);
 refreshRoundDraft(s);assert.equal(roundPendingCount(s),0);assert.equal(conversationBoardPendingCount(s),2);
 updateRoundCategory(s,roundState(s).roundDraft.categories[0].id,{description:'只有编辑，不增加消息数'});assert.equal(conversationBoardPendingCount(s),2);
 generateConversationBoard(s);assert.equal(conversationBoardPendingCount(s),0);
});

test('旧任务、已有跟进记录与旧版看板不受新研究生成影响',()=>{
 const s=initialState();ask(s,'molly');const draft=generateRoundDraft(s);saveRoundBoard(s,{summary:'旧版小结',next:'旧版下次起点'});
 const r=roundState(s),tasks=structuredClone(draft.tasks),records=structuredClone(r.records),boards=structuredClone(r.generatedBoards),returns=structuredClone(s.researchReturns);
 ask(s,'molly');ask(s,'stars');const board=generateConversationBoard(s);
 assert.deepEqual(draft.tasks,tasks);assert.deepEqual(r.records.slice(0,records.length),records);assert.deepEqual(r.generatedBoards.slice(0,boards.length),boards);assert.deepEqual(s.researchReturns,returns);
 assert.deepEqual(board.tasks,[]);assert.equal(board.next,'');assert.ok(board.categories.every(category=>category.taskIds.length===0));
});

test('内联编辑和新增类目只改已保存看板，不吸收已在工作副本中的新聊天',()=>{
 const s=initialState();ask(s,'molly');const first=generateConversationBoard(s),snapshot=structuredClone(first),r=roundState(s),category=first.categories[0];
 const newMessage=ask(s,'cash');refreshRoundDraft(s);const internalCash=r.roundDraft.categories.find(item=>item.directionIds.includes('cash'));
 updateRoundCategory(s,internalCash.id,{description:'尚未纳入看板的手动编辑'});const cashBefore=structuredClone(internalCash),tasksBefore=structuredClone(r.roundDraft.tasks);
 const edited=editConversationBoardCategory(s,category.id,{title:'保留的老 IP 研究',description:'直接在看板修改的小结'});
 assert.equal(edited.categories.find(item=>item.id===category.id).title,'保留的老 IP 研究');assert.equal(edited.categories.length,1);
 assert.deepEqual(edited.messages,first.messages);assert.deepEqual(edited.roundDraft.messages,first.messages);assert.ok(!edited.messageIds.includes(newMessage.id));assert.equal(conversationBoardPendingCount(s),1);
 assert.deepEqual(internalCash,cashBefore);assert.deepEqual(r.roundDraft.tasks,tasksBefore);assert.equal(r.roundDraft.categories.find(item=>item.id===category.id).description,'直接在看板修改的小结');
 const added=addConversationBoardCategory(s,{title:'我的长期研究',description:'空类目也保留'}),newCategory=added.categories.at(-1);
 assert.deepEqual(newCategory.messageIds,[]);assert.deepEqual(newCategory.taskIds,[]);assert.equal(newCategory.origin,'custom');assert.equal(conversationBoardPendingCount(s),1);
 assert.deepEqual(added.messages,first.messages);assert.deepEqual(added.roundDraft.messages,first.messages);assert.deepEqual(r.generatedBoards[0],snapshot);
 const accumulated=generateConversationBoard(s);assert.ok(accumulated.messageIds.includes(newMessage.id));assert.equal(accumulated.categories.find(item=>item.id===category.id).title,'保留的老 IP 研究');assert.equal(accumulated.categories.find(item=>item.id===newCategory.id).description,'空类目也保留');assert.equal(accumulated.categories.find(item=>item.id===internalCash.id).description,cashBefore.description);assert.equal(conversationBoardPendingCount(s),0);
});

test('编辑旧版看板保留历史任务与跟进，只在缺少工作副本时恢复副本',()=>{
 const s=initialState();ask(s,'molly');generateRoundDraft(s);const old=saveRoundBoard(s,{summary:'旧研究结论',next:'旧待查计划'}),r=roundState(s);
 const snapshot=structuredClone(old),returns=structuredClone(s.researchReturns);r.roundDraft=null;
 const edited=editConversationBoardCategory(s,old.categories[0].id,{description:'修订的研究小结'});
 assert.deepEqual(r.generatedBoards[0],snapshot);assert.deepEqual(s.researchReturns,returns);assert.deepEqual(r.roundDraft.tasks,old.roundDraft.tasks);
 assert.deepEqual(edited.tasks,[]);assert.deepEqual(edited.roundDraft.tasks,[]);assert.equal(edited.next,'');assert.equal(edited.roundDraft.next,'');
 assert.ok(edited.categories.every(category=>category.taskIds.length===0));assert.deepEqual(edited.messages,old.messages);assert.deepEqual(edited.baseline,old.baseline);assert.deepEqual(edited.financialData,old.financialData);
});

test('旧看板类目缺失于当前工作副本时，仅补目标类目，不覆盖其他编辑',()=>{
 const s=initialState();ask(s,'molly');const board=generateConversationBoard(s),r=roundState(s),source=board.categories[0];
 r.roundDraft.categories=[];const custom=addRoundCategory(s,{title:'当前工作副本的分类',description:'必须原样保留'}),before=structuredClone(custom);
 editConversationBoardCategory(s,source.id,{title:'从旧看板改名'});
 assert.deepEqual(r.roundDraft.categories.find(category=>category.id===custom.id),before);assert.equal(r.roundDraft.categories.find(category=>category.id===source.id).title,'从旧看板改名');
 const current=structuredClone(s);assert.throws(()=>editConversationBoardCategory(s,source.id,{title:'  '}),/填写类目/);assert.throws(()=>addConversationBoardCategory(s,{title:''}),/填写类目/);assert.deepEqual(s,current);
});

test('新快照摘要随类目编辑、新增与显式更新同步，内部旧摘要和既有快照保持原样',()=>{
 const s=initialState();ask(s,'molly');const draft=generateRoundDraft(s),category=draft.categories[0];
 updateRoundDraft(s,{summary:'旧版手工总括，不能删除'});updateRoundCategory(s,category.id,{title:'经营判断',description:'原有内容'});
 const first=generateConversationBoard(s),snapshot=structuredClone(first);assert.equal(first.summary,'经营判断：原有内容');
 const edited=editConversationBoardCategory(s,category.id,{title:'经营变化',description:'这次核对后的内容'});assert.equal(edited.summary,'经营变化：这次核对后的内容');
 const added=addConversationBoardCategory(s,{title:'跨周期研究',description:'新增的研究归纳'});assert.equal(added.summary,'经营变化：这次核对后的内容\n跨周期研究：新增的研究归纳');
 const free=sendRoundInput(s,'一条还未分类的新提问'),updated=generateConversationBoard(s);
 assert.equal(updated.summary,added.summary);assert.equal(updated.roundDraft.summary,updated.summary);assert.equal(roundState(s).records.at(-1).summary,updated.summary);assert.equal(draft.summary,'旧版手工总括，不能删除');
 assert.deepEqual(roundState(s).generatedBoards[0],snapshot);assert.ok(updated.messages.some(message=>message.id===free.id));assert.ok(updated.categories.every(item=>!item.messageIds.includes(free.id)));
 assert.deepEqual(updated.tasks,[]);assert.equal(updated.next,'');
});

test('没有类目的看板摘要仅列出实际用户问题，并明确标注讨论问题',()=>{
 const s=initialState(),first=sendRoundInput(s,'会员复购率发生了什么变化？'),second=sendRoundInput(s,'请保留这段原话 <tag>');
 const r=roundState(s);r.conversationDraft='尚未发送的问题不可进入摘要';
 const board=generateConversationBoard(s);
 assert.equal(board.summary,'讨论问题：会员复购率发生了什么变化？\n讨论问题：请保留这段原话 <tag>');assert.equal(board.roundDraft.summary,board.summary);
 assert.deepEqual(board.categories,[]);assert.deepEqual(board.messages.filter(message=>message.user),[first,second]);assert.equal(board.messages[0].kind,'opening');
 assert.deepEqual(board.tasks,[]);assert.deepEqual(r.roundDraft.tasks,[]);assert.equal(r.conversationDraft,'尚未发送的问题不可进入摘要');assert.equal(s.researchReturns,undefined);
});
