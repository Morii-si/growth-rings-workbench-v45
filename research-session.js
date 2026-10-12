export const RESEARCH_STORAGE_KEY='yanji-comparison-v1';
const DEMO_PREFIX=RESEARCH_STORAGE_KEY+':demo:';
const validSessionId=id=>typeof id==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(id);

function createSessionId(){
 const crypto=globalThis.crypto;
 if(typeof crypto?.randomUUID==='function')return crypto.randomUUID();
 // getRandomValues also works on HTTP origins where randomUUID is unavailable.
 if(typeof crypto?.getRandomValues==='function')return Array.from(crypto.getRandomValues(new Uint8Array(16)),byte=>byte.toString(16).padStart(2,'0')).join('');
 throw Error('当前浏览器无法创建独立演示，请换用支持安全随机数的浏览器。');
}

function conversationAddress(url){
 url.searchParams.set('screen','company');url.searchParams.set('tab','discussion');url.searchParams.set('mode','conversation');
 // Old board, record, or review links must not override an explicit opening.
 for(const key of ['version','record','pane','base','snapshot','topic','view'])url.searchParams.delete(key);
 url.hash='';return url;
}

/** Resolve storage before restoring state. The returned URL consumes entry once. */
export function resolveResearchSession(href,{createId=createSessionId}={}){
 const url=new URL(href),entryStarted=url.searchParams.get('entry')==='opening';
 let sessionId=url.searchParams.get('demo-session');
 if(entryStarted){
  sessionId=createId();
  if(!validSessionId(sessionId))throw Error('无效的演示存档编号。');
  conversationAddress(url);url.searchParams.delete('entry');url.searchParams.set('demo-session',sessionId);
 }else if(!validSessionId(sessionId)){
  sessionId=null;url.searchParams.delete('demo-session');
 }
 return {key:sessionId?DEMO_PREFIX+sessionId:RESEARCH_STORAGE_KEY,isDemo:!!sessionId,sessionId,entryStarted,url:url.href};
}

/** Real links preserve browser history and never move or overwrite saved state. */
export function researchSessionLink(href,action){
 if(!['opening','normal'].includes(action))throw Error('未知的研究入口。');
 const url=conversationAddress(new URL(href));
 url.searchParams.delete('demo-session');url.searchParams.delete('entry');
 if(action==='opening')url.searchParams.set('entry','opening');
 return url.href;
}

/** A discussion URL defaults to chat; only a valid explicit draft opens a draft. */
export function researchWorkspaceMode(params,hasDraft){
 return params.get('mode')==='draft'&&hasDraft?'draft':'conversation';
}
