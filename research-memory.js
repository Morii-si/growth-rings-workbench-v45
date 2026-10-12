import {originMemory} from './origin-discussions.js';
export {originMemory};
// Explicit fictional conversations for demonstration, separate from the user's real PPT.
export const seedMemory = [
 {id:'demo-old-ip',date:'2026-03-25',topic:'老 IP 经营',question:'MOLLY 这期增长，能证明老 IP 可以持续经营了吗？',answer:'2025 全年 MOLLY 收入从 20.93 亿元增至 28.97 亿元，同比增长 38.4%。它给长期运营增加了一期正向证据；但一年增长还不足以证明生命周期，需要接着看后续同口径表现与产品节奏。',conclusion:'MOLLY 本期增长支持继续观察；持续经营还需要多期证据。',status:'included',kind:'demo',source:'annual',contextIds:['origin-lifecycle']},
 {id:'demo-platform',date:'2026-03-25',topic:'平台能力',question:'我们说的平台能力，到底要验证什么？',answer:'把两件事分开：已有 IP 的持续经营，以及新 IP 能否接续。只有持续的多期证据，才能进一步讨论跨周期。',conclusion:'老 IP 经营与新 IP 接续分别验证；跨周期判断继续开放。',status:'included',kind:'demo',source:'annual'},
 {id:'demo-concentration',date:'2026-03-25',topic:'收入结构',question:'扣除 THE MONSTERS 之后，还能看到增长吗？',answer:'其余收入同比增长 129.7%；与此同时，THE MONSTERS 收入占比从 23.3% 升至 38.1%。收入增长和集中度上升可以同时发生。',conclusion:'每次更新都同时检查其余收入与头部占比。',status:'included',kind:'demo',source:'annual'},
 {id:'demo-shortcut',date:'2026-03-25',topic:'平台能力',question:'只要一个老 IP 下滑，就说明平台能力失效了？',answer:'这是一个待检验的猜想。单 IP 单期变化不足以判断整个平台，应同时看产品节奏、其他 IP 与后续表现。',conclusion:'单个老 IP 下滑就否定平台。',status:'excluded',kind:'demo',source:'annual',reason:'后续讨论已收窄判断条件，保留原话供回看。'}
];
export function ensureMemory(s){
 if(!s.discussions){s.discussions=structuredClone([...originMemory,...seedMemory]);for(let i=0;i<s.chat.length;i+=2){const q=s.chat[i],a=s.chat[i+1];if(q?.role==='user')s.discussions.push({id:'legacy-'+i,date:'时间未记录',topic:'全局背景',question:q.text,answer:a?.text||'',conclusion:q.text,status:'open',kind:'user',source:a?.source});}}
 for(const m of originMemory)if(!s.discussions.some(x=>x.id===m.id))s.discussions.unshift(structuredClone(m));
 if(!s.discussions.some(x=>x.id==='demo-old-ip'))s.discussions.push(structuredClone(seedMemory.find(x=>x.id==='demo-old-ip')));
 for(const [id,contextIds] of [['demo-platform',['origin-platform','origin-lifecycle']],['demo-concentration',['origin-operation']],['demo-shortcut',['origin-lifecycle']]]){const m=s.discussions.find(x=>x.id===id);if(m&&!m.contextIds)m.contextIds=contextIds;}
 s.discussions.forEach(m=>{if(m.topic==='旧版对话')m.topic='全局背景';if(m.kind==='demo'&&m.id.startsWith('origin-')&&m.date==='2025.08')m.date='2026.02';});return s.discussions;
}
export function contextFor(s,topic,version=null){return memoriesAt(s,version).filter(m=>m.status==='included'&&(m.topic==='全局背景'||(topic==='platform'?['IP 价值','平台能力','老 IP 经营'].includes(m.topic):topic==='excluding'?m.topic==='收入结构':['IP 价值','平台能力','老 IP 经营','跟踪要求'].includes(m.topic))));}
export function discussionContext(s,topic,carry=null){const all=ensureMemory(s),old=carry?contextFor(s,topic,carry).filter(m=>all.find(x=>x.id===m.id)?.status==='included'):[];return [...new Map([...old,...contextFor(s,topic)].map(m=>[m.id,m])).values()];}
export function recordDiscussion(s,{question,answer,topic,source,contextIds=[],kind='user'}){
 const m={id:'discussion-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),date:s.period==='interim'?'2026-08-20':'2026-03-25',createdAt:new Date().toISOString(),question,answer,conclusion:'',topic,source,contextIds,status:'open',kind};ensureMemory(s).push(m);return m;
}
export function memoriesAt(s,version){const all=ensureMemory(s);if(!version)return all;if(version.memorySnapshot)return structuredClone(version.memorySnapshot);const seeds=[...originMemory,...seedMemory];const ids=version.memoryIds||(version.id===1?originMemory.map(x=>x.id):seeds.map(x=>x.id));return all.filter(m=>ids.includes(m.id)).map(m=>{const seed=seeds.find(x=>x.id===m.id);return {...(seed?structuredClone(seed):m),contextIds:m.contextIds,status:version.memoryStatuses?.[m.id]||seed?.status||m.status};});}
export function snapshotMemories(s){const v=s.versions.at(-1);if(v.kind!=='seed'&&!v.memorySnapshot){v.memoryIds=ensureMemory(s).map(m=>m.id);v.memoryStatuses=Object.fromEntries(s.discussions.map(m=>[m.id,m.status]));v.memorySnapshot=structuredClone(s.discussions);}}
export function migrateMemorySnapshots(s){
 const all=ensureMemory(s),seeds=[...originMemory,...seedMemory];
 for(const v of s.versions){
  if(v.kind==='seed'||v.memorySnapshot)continue;
  const ids=Array.isArray(v.memoryIds)?v.memoryIds:[];
  v.memorySnapshot=ids.flatMap(id=>{const m=all.find(x=>x.id===id);if(!m)return [];const seed=seeds.find(x=>x.id===id);return [{...structuredClone(seed||m),status:v.memoryStatuses?.[id]||seed?.status||m.status}];});
  v.memoryRecovery={kind:'migration-baseline',frozenAt:new Date().toISOString(),missingIds:ids.filter(id=>!all.some(m=>m.id===id)),scopeRecorded:Array.isArray(v.memoryIds)};
 }
 return s;
}
export function memoryRecoveryNotice(v){return v?.memoryRecovery?'旧存档缺少完整讨论快照：以下内容于迁移时冻结，历史要点不完整，不能视作原时点完整记录。'+(v.memoryRecovery.scopeRecorded?'':'旧档未保存讨论范围，未推测补入当前交流。'):'';}
