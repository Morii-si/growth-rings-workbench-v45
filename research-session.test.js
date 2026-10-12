import test from 'node:test';
import assert from 'node:assert/strict';
import {RESEARCH_STORAGE_KEY,resolveResearchSession,researchSessionLink,researchWorkspaceMode} from './research-session.js';

const base='http://127.0.0.1:5087/';

test('normal visits retain the existing storage key',()=>{
 const href=base+'?screen=company&tab=discussion&revision=38';
 assert.deepEqual(resolveResearchSession(href),{key:RESEARCH_STORAGE_KEY,isDemo:false,sessionId:null,entryStarted:false,url:href});
});

test('opening creates isolated storage and consumes the entry only once',()=>{
 const entry=resolveResearchSession(base+'?entry=opening&demo-session=older',{createId:()=> 'demo-123'});
 assert.equal(entry.key,RESEARCH_STORAGE_KEY+':demo:demo-123');
 assert.equal(entry.isDemo,true);assert.equal(entry.entryStarted,true);assert.equal(entry.sessionId,'demo-123');
 const url=new URL(entry.url);
 assert.equal(url.searchParams.has('entry'),false);assert.equal(url.searchParams.get('demo-session'),'demo-123');
 assert.equal(url.searchParams.get('mode'),'conversation');
 const reload=resolveResearchSession(entry.url,{createId:()=>{throw Error('refresh must not create another session');}});
 assert.equal(reload.key,entry.key);assert.equal(reload.url,entry.url);assert.equal(reload.entryStarted,false);
});

test('opening from old board, draft, and review routes reaches the centered chat scene',()=>{
 const entry=resolveResearchSession(base+'?entry=opening&screen=home&tab=boards&version=2&mode=draft&record=old&view=review&pane=old&base=1&snapshot=x&topic=cash&revision=38#old',{createId:()=> 'fresh'});
 const url=new URL(entry.url);
 assert.equal(url.searchParams.get('screen'),'company');assert.equal(url.searchParams.get('tab'),'discussion');
 assert.equal(url.searchParams.get('mode'),'conversation');assert.equal(url.searchParams.get('revision'),'38');
 for(const key of ['entry','version','record','view','pane','base','snapshot','topic'])assert.equal(url.searchParams.has(key),false,key);
 assert.equal(url.hash,'');
});

test('links enter another opening or return to the original discussion without copying demo routing',()=>{
 const href=base+'?demo-session=old-demo&screen=company&tab=boards&version=3&mode=draft&record=old';
 const normal=new URL(researchSessionLink(href,'normal'));
 assert.equal(normal.searchParams.has('demo-session'),false);assert.equal(normal.searchParams.has('entry'),false);
 assert.equal(normal.searchParams.get('tab'),'discussion');assert.equal(normal.searchParams.get('mode'),'conversation');
 assert.equal(normal.searchParams.has('version'),false);assert.equal(normal.searchParams.has('record'),false);
 assert.equal(resolveResearchSession(normal.href).key,RESEARCH_STORAGE_KEY);
 const opening=new URL(researchSessionLink(href,'opening'));
 assert.equal(opening.searchParams.get('entry'),'opening');assert.equal(opening.searchParams.has('demo-session'),false);
 assert.notEqual(resolveResearchSession(opening.href,{createId:()=> 'next'}).key,RESEARCH_STORAGE_KEY+':demo:old-demo');
});

test('stored demo draft routes resume within the same session',()=>{
 const href=base+'?screen=company&tab=discussion&demo-session=retained&mode=draft';
 const session=resolveResearchSession(href);
 assert.equal(session.url,href);assert.equal(session.key,RESEARCH_STORAGE_KEY+':demo:retained');
 assert.equal(researchWorkspaceMode(new URL(session.url).searchParams,true),'draft');
});

test('discussion routes default to chat and cannot show a missing draft',()=>{
 assert.equal(researchWorkspaceMode(new URLSearchParams(),true),'conversation');
 assert.equal(researchWorkspaceMode(new URLSearchParams('mode=conversation'),true),'conversation');
 assert.equal(researchWorkspaceMode(new URLSearchParams('mode=draft'),true),'draft');
 assert.equal(researchWorkspaceMode(new URLSearchParams('mode=draft'),false),'conversation');
 assert.equal(researchWorkspaceMode(new URLSearchParams('mode=unknown'),true),'conversation');
});

test('invalid session identifiers cannot escape the demo namespace',()=>{
 for(const id of ['',':normal','../normal','a'.repeat(81),'中文']){
  const session=resolveResearchSession(base+'?demo-session='+encodeURIComponent(id));
  assert.equal(session.key,RESEARCH_STORAGE_KEY);assert.equal(session.sessionId,null);
  assert.equal(new URL(session.url).searchParams.has('demo-session'),false);
  assert.throws(()=>resolveResearchSession(base+'?entry=opening',{createId:()=>id}),/无效/);
 }
 assert.throws(()=>researchSessionLink(base,'reset'),/未知/);
});
