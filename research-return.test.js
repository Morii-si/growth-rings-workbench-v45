import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,restore} from './engine.js';
import {focusDraft} from './research-focus.js';
import {saveResearchReturn,researchReturns} from './research-return.js';
test('留到下次保存问题和引用副本，不开启提醒或改动历史，刷新可恢复',()=>{
 const s=initialState(),v=s.versions[1],d=focusDraft(s,{dataUpdate:true,focusTopic:'old'},v,{}),before=JSON.stringify(s.versions),rule=JSON.stringify(s.rule);
 const input={topic:'old',stage:3,title:'老 IP 的生命力',question:'下次核对新品节奏',when:'有新材料时',context:d.references[1].context,references:d.references};
 const x=saveResearchReturn(s,input);input.references[0].text='外部修改';
 assert.notEqual(x.references[0].text,'外部修改');assert.equal(JSON.stringify(s.versions),before);assert.equal(JSON.stringify(s.rule),rule);
 assert.equal(researchReturns(restore(JSON.stringify(s)))[0].question,input.question);
});
test('同一轮线索更新不重复，其他轮次独立；完成状态及草稿均持久化',()=>{
 const s=initialState(),input={topic:'new',stage:3,title:'新 IP',question:'核对批次',when:'下次业绩披露',context:{stage:'update'},references:[]};
 const first=saveResearchReturn(s,input);saveResearchReturn(s,{...input,question:'核对上市年份'});assert.equal(researchReturns(s).length,1);assert.equal(researchReturns(s)[0].id,first.id);
 saveResearchReturn(s,{...input,stage:2});assert.equal(researchReturns(s).length,2);
 s.researchReturns[0].done=true;s.returnComposers={'old-3':{question:'还没写完'}};
 const recovered=restore(JSON.stringify(s));assert.equal(recovered.researchReturns[0].done,true);assert.equal(recovered.returnComposers['old-3'].question,'还没写完');
 assert.throws(()=>saveResearchReturn(s,{...input,question:' '}));assert.throws(()=>saveResearchReturn(s,{...input,when:'每天自动监测'}));
});
