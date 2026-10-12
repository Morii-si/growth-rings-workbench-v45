import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,restore} from './engine.js';
import {latestGeneratedBoard} from './research-room-model.js';
import {roundState,roundOpeningPrompts,sendRoundInput,generateConversationBoard,conversationBoardPendingCount,editConversationBoardCategory,addConversationBoardCategory,setBoardConversationReference,clearBoardConversationReference,boardConversationPrompts,sendBoardConversationInput,refreshRoundDraft} from './research-draft-model.js';

const ask=(s,id)=>sendRoundInput(s,roundOpeningPrompts().find(prompt=>prompt.directionId===id).text);
const seed=()=>{const s=initialState();ask(s,'molly');ask(s,'stars');return {s,board:generateConversationBoard(s)};};

test('引用与取消不发送消息或修改看板，未发送文字及引用可随刷新恢复',()=>{
 const {s,board}=seed(),r=roundState(s),beforeBoard=structuredClone(board),beforeDraft=structuredClone(r.roundDraft),messageCount=r.messages.length;
 r.conversationDraft='还没说完的话';
 const ref=setBoardConversationReference(s,{categoryId:board.categories[0].id,quote:'同期间收入回落'});
 assert.equal(ref.kind,'category');assert.equal(ref.boardId,board.id);assert.equal(ref.description,board.categories[0].description);assert.equal(ref.quote,'同期间收入回落');
 assert.equal(r.messages.length,messageCount);assert.equal(conversationBoardPendingCount(s),0);assert.equal(r.conversationDraft,'还没说完的话');
 assert.deepEqual(r.roundDraft,beforeDraft);assert.deepEqual(board,beforeBoard);
 const restored=restore(JSON.stringify(s));assert.deepEqual(restored.researchRoom.boardConversationReference,ref);assert.equal(restored.researchRoom.conversationDraft,'还没说完的话');
 clearBoardConversationReference(s);assert.equal(r.boardConversationReference,null);assert.equal(r.conversationDraft,'还没说完的话');assert.equal(r.messages.length,messageCount);
});

test('引用类目的建议只在显式更新后落板，来源与旧快照完整冻结',()=>{
 const {s,board}=seed(),r=roundState(s),category=board.categories[0],oldBoard=structuredClone(board),oldRecord=structuredClone(r.records[0]),oldDraft=structuredClone(r.roundDraft);
 const ref=setBoardConversationReference(s,{categoryId:category.id}),frozen=structuredClone(ref),prompt=boardConversationPrompts(s)[0];
 assert.equal(prompt.id,'board:clarify');const message=sendRoundInput(s,prompt.text,{promptId:prompt.id});
 assert.deepEqual(message.boardReference,frozen);assert.equal(message.boardChange.categoryId,category.id);assert.equal(message.boardChange.type,'update-category');
 assert.match(message.boardChange.description,/已知事实：/);assert.match(message.boardChange.description,/13\.57/);assert.match(message.boardChange.description,/判断边界：/);
 assert.equal(r.boardConversationReference,null);assert.equal(conversationBoardPendingCount(s),1);assert.deepEqual(board,oldBoard);assert.deepEqual(r.roundDraft,oldDraft);
 ref.title='外部错误改动';assert.deepEqual(message.boardReference,frozen);
 const updated=generateConversationBoard(s),updatedCategory=updated.categories.find(item=>item.id===category.id);
 assert.equal(updatedCategory.description,message.boardChange.description);assert.ok(updatedCategory.messageIds.includes(message.id));assert.equal(conversationBoardPendingCount(s),0);
 assert.deepEqual(r.generatedBoards[0],oldBoard);assert.deepEqual(r.records[0],oldRecord);assert.deepEqual(updated.messages.find(item=>item.id===message.id),message);
 assert.deepEqual(updated.tasks,[]);assert.equal(updated.next,'');assert.ok(updated.references.length>=oldBoard.references.length);
 const repeated=generateConversationBoard(s);assert.equal(repeated.categories.find(item=>item.id===category.id).description,updatedCategory.description);assert.equal(repeated.categories.length,updated.categories.length);
});

test('普通发送不会继承已清除引用，显式引用追问可以继续上下文',()=>{
 const {s,board}=seed();setBoardConversationReference(s,{categoryId:board.categories[0].id});
 const initial=sendBoardConversationInput(s,'澄清这段里的证据与判断'),ordinary=sendRoundInput(s,'普通的另一条问题');
 assert.equal(ordinary.answer,null);assert.equal(ordinary.boardReference,undefined);assert.equal(ordinary.boardChange,undefined);
 const continued=sendBoardConversationInput(s,'把这段表述写得更谨慎',{promptId:'board:cautious'});
 assert.deepEqual(continued.boardReference,initial.boardReference);assert.notEqual(continued.boardChange.description,initial.boardChange.description);
 const updated=generateConversationBoard(s);assert.equal(updated.categories[0].description,continued.boardChange.description);assert.ok(updated.messages.some(item=>item.id===ordinary.id));
});

test('未知自由问题完整保留引用，无预设回答或凭空修改，纳入后仍关联原类目',()=>{
 const {s,board}=seed(),category=board.categories[0],old=structuredClone(category);
 setBoardConversationReference(s,{categoryId:category.id});const user='2027 年欧洲新店的复购率是多少？ <script>原文</script>';
 const message=sendBoardConversationInput(s,user);assert.equal(message.answer,null);assert.equal(message.boardChange,undefined);assert.equal(message.user,user);assert.equal(message.boardReference.categoryId,category.id);
 const updated=generateConversationBoard(s),current=updated.categories.find(item=>item.id===category.id);
 assert.equal(current.title,old.title);assert.equal(current.description,old.description);assert.ok(current.messageIds.includes(message.id));assert.deepEqual(updated.messages.find(item=>item.id===message.id),message);
});

test('整板新增类目只使用用户名称，发送不落板，显式更新只新增一次且不造结论',()=>{
 const {s,board}=seed(),r=roundState(s),snapshot=structuredClone(board),draft=structuredClone(r.roundDraft);
 const ref=setBoardConversationReference(s);assert.equal(ref.kind,'board');assert.equal(ref.categoryId,null);assert.deepEqual(boardConversationPrompts(s),[{id:'board:add-category',text:'新增类目：'}]);
 const message=sendRoundInput(s,'新增类目：会员关系与长期复购');assert.equal(message.boardChange.title,'会员关系与长期复购');assert.equal(message.boardChange.description,'');assert.equal(message.boardChange.type,'add-category');
 assert.equal(message.answer,'已准备「会员关系与长期复购」类目。');assert.deepEqual(board,snapshot);assert.deepEqual(r.roundDraft,draft);
 const added=generateConversationBoard(s),category=added.categories.find(item=>item.id===message.boardChange.categoryId);
 assert.equal(category.title,'会员关系与长期复购');assert.equal(category.description,'');assert.equal(category.origin,'custom');assert.deepEqual(category.messageIds,[message.id]);assert.deepEqual(category.taskIds,[]);
 const again=generateConversationBoard(s);assert.equal(again.categories.filter(item=>item.id===category.id).length,1);assert.deepEqual(r.generatedBoards[0],snapshot);
});

test('引用新增的自定义类目可用明确原文修改，内容不被模型补写',()=>{
 const {s}=seed(),board=addConversationBoardCategory(s,{title:'我的分类'}),category=board.categories.at(-1);
 setBoardConversationReference(s,{categoryId:category.id});assert.deepEqual(boardConversationPrompts(s),[]);
 const original='这是我保留的判断。\n其中的 <文字> 需要原样保存。',message=sendRoundInput(s,'小结改为：'+original);
 assert.equal(message.boardChange.description,original);assert.equal(board.categories.at(-1).description,'');
 assert.equal(generateConversationBoard(s).categories.at(-1).description,original);
});

test('历史选中文字保留出处和口径，不误当整板新增或当前类目修改',()=>{
 const s=initialState(),r=roundState(s),reference={kind:'board',context:{key:'version:1:annual',versionId:1,report:'annual'},anchor:'module-IP',label:'V1 · 平台能力',excerpt:'历史小结原文',text:'历史小结原文\n来源说明',source:{url:'https://example.com/report',page:12}};
 const ref=setBoardConversationReference(s,{reference});assert.equal(ref.kind,'selection');assert.equal(ref.version,1);assert.equal(ref.title,reference.label);assert.equal(ref.quote,reference.excerpt);assert.deepEqual(ref.references,[reference]);assert.deepEqual(boardConversationPrompts(s),[]);
 const frozen=structuredClone(ref);reference.text='随后变化';const message=sendRoundInput(s,'新增类目：不能误触发');
 assert.deepEqual(message.boardReference,frozen);assert.equal(message.answer,null);assert.equal(message.boardChange,undefined);assert.deepEqual(message.references,frozen.references);
 const board=generateConversationBoard(s);assert.deepEqual(board.categories,[]);assert.deepEqual(board.messages.find(item=>item.id===message.id),message);assert.equal(r.boardConversationReference,null);
});

test('类目改名使用用户明确名称，发送保留原名，更新后保留原有小结',()=>{
 const {s,board}=seed(),category=board.categories[0];setBoardConversationReference(s,{categoryId:category.id});
 const message=sendRoundInput(s,'类目改名：老 IP 的收入与需求');assert.equal(message.boardChange.title,'老 IP 的收入与需求');assert.equal(message.boardChange.description,category.description);assert.equal(board.categories[0].title,category.title);
 const updated=generateConversationBoard(s);assert.equal(updated.categories[0].title,'老 IP 的收入与需求');assert.equal(updated.categories[0].description,category.description);
});

test('V3更新看板引用按展示版本标记，保留context内V2基线信息',()=>{
 const s=initialState(),reference={kind:'board',context:{key:'update:2:interim',stage:'update',versionId:2,report:'interim',label:'V3 · 2026年半年报'},label:'V3 · 平台能力',excerpt:'本轮新证据'};
 const ref=setBoardConversationReference(s,{reference});assert.equal(ref.version,3);assert.equal(ref.context.versionId,2);assert.deepEqual(ref.references[0],reference);
 const message=sendRoundInput(s,'这条新证据有什么影响？');assert.equal(message.boardReference.version,3);assert.deepEqual(message.boardReference.context,reference.context);
});

test('旧来源仍可引用；其他类目更新不阻塞目标未变化的提议',()=>{
 const {s,board}=seed(),first=board.categories[0],second=board.categories[1];
 setBoardConversationReference(s,{categoryId:first.id});const message=sendRoundInput(s,'把这段表述写得更谨慎');
 const intervening=editConversationBoardCategory(s,second.id,{description:'其他类目手工保存的内容'}),snapshot=structuredClone(intervening);
 assert.notEqual(latestGeneratedBoard(s).id,message.boardChange.sourceBoardId);
 const updated=generateConversationBoard(s);assert.equal(updated.categories.find(item=>item.id===first.id).description,message.boardChange.description);assert.equal(updated.categories.find(item=>item.id===second.id).description,'其他类目手工保存的内容');assert.deepEqual(roundState(s).generatedBoards[1],snapshot);
});

test('目标类目变化安全拒绝且不改任何工作数据，重新引用后可继续更新',()=>{
 const {s,board}=seed(),category=board.categories[0];setBoardConversationReference(s,{categoryId:category.id});sendRoundInput(s,'把这段表述写得更谨慎');
 editConversationBoardCategory(s,category.id,{description:'其他窗口已经保存的新判断'});
 const before=structuredClone(s);assert.throws(()=>generateConversationBoard(s),/这块内容已更新/);assert.deepEqual(s,before);assert.equal(conversationBoardPendingCount(s),1);
 setBoardConversationReference(s,{categoryId:category.id});const refreshed=sendRoundInput(s,'小结改为：基于新版本重新讨论后的原文');
 const updated=generateConversationBoard(s);assert.equal(updated.categories[0].description,refreshed.boardChange.description);assert.equal(conversationBoardPendingCount(s),0);
});

test('内部草稿吸收消息不提前应用修改，也不会让待纳入计数清零',()=>{
 const {s,board}=seed(),category=board.categories[0],old=category.description;setBoardConversationReference(s,{categoryId:category.id});const message=sendRoundInput(s,'澄清这段里的证据与判断');
 refreshRoundDraft(s);assert.equal(roundState(s).roundDraft.categories[0].description,old);assert.equal(conversationBoardPendingCount(s),1);
 const updated=generateConversationBoard(s);assert.equal(updated.categories[0].description,message.boardChange.description);assert.equal(conversationBoardPendingCount(s),0);
});

test('缺失内部工作副本时恢复完整已保存看板，引用更新保留自定义类目',()=>{
 const {s}=seed(),board=addConversationBoardCategory(s,{title:'已有自定义类目',description:'已保存的内容'}),r=roundState(s),category=board.categories[0];r.roundDraft=null;
 setBoardConversationReference(s,{categoryId:category.id});const message=sendRoundInput(s,'把这段表述写得更谨慎');
 const updated=generateConversationBoard(s);assert.equal(updated.categories.length,board.categories.length);assert.equal(updated.categories[0].description,message.boardChange.description);assert.equal(updated.categories.at(-1).description,'已保存的内容');
});

test('未提供国内拆分时，谨慎改写保留国内口径边界',()=>{
 const s=initialState(),r=roundState(s);r.scope='domestic';ask(s,'molly');const board=generateConversationBoard(s);
 setBoardConversationReference(s,{categoryId:board.categories[0].id});const message=sendRoundInput(s,'把这段表述写得更谨慎');
 assert.match(message.boardChange.description,/未提供国内渠道拆分/);assert.match(message.boardChange.description,/暂不能判断国内收入或需求是否回落/);
});

test('伪造建议 id 或不匹配文本不能触发修改，引用和未发送文字仍在',()=>{
 const {s,board}=seed(),r=roundState(s);setBoardConversationReference(s,{categoryId:board.categories[0].id});r.conversationDraft='用户未发送文字';
 const before=structuredClone(s);assert.throws(()=>sendBoardConversationInput(s,'把全部结论改成肯定',{promptId:'board:cautious'}),/对应的引用追问/);assert.deepEqual(s,before);
 assert.throws(()=>sendBoardConversationInput(s,'随意文字',{promptId:'board:missing'}),/对应的引用追问/);assert.deepEqual(s,before);
});
