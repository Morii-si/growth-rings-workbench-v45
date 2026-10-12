import {migrateMemorySnapshots} from './research-memory.js';
export const SOURCE = {
 annual: {name:'2025 全年业绩公告',date:'2026-03-25',page:'33',url:'https://www.hkexnews.hk/listedco/listconews/sehk/2026/0325/2026032500285.pdf'},
 interim: {name:'2026 中期业绩公告',date:'2026-08-20',page:'30',url:'https://www.hkexnews.hk/listedco/listconews/sehk/2026/0820/2026082000353.pdf'}
};
export const DATA = {annual:{total:[13037749,37120052],monsters:[3040664,14161064],molly:[2093172,2897084]},interim:{molly:[1357248,900631],twinkle:[389363,2649969],monsters:[4814017,4454361]}};
export const growth = a => (a[1]/a[0]-1)*100;
export const excluding = DATA.annual.total.map((n,i)=>n-DATA.annual.monsters[i]);
export const questions = ['最大 IP 之外，能否持续成长？','老 IP，能否持续经营？','平台能力，能否跨越周期？'];
export const originals = ['IP 池的广度可能增强跨周期能力，仍需看商业化结果。','筛选与深耕并重，需要观察已有 IP 的长期运营。','多元 IP 池可能提升跨周期能力，需要长期验证。'];
export const annualClaims = ['扣除 THE MONSTERS 后，其余收入同比增长 129.7%，多 IP 商业化已有进展。','MOLLY 2025 全年收入同比增长 38.4%，持续经营值得跟踪。','跨周期能力仍待验证；单年增长不足以回答 IP 的长期生命力。'];
export const suggestions = ['星星人本期收入同比增长 580.6%，补充头部之外的增长证据；可重复孵化能力仍待固定 IP 批次、投入与失败项目验证。','MOLLY 本期收入同比下降 33.6%，需要观察后续经营与产品节奏，尚不能认定长期衰退。','保留跨周期能力待验证的判断，继续积累多期表现与 IP 生命周期证据。'];
export const summaryV2 = '多 IP 商业化已有进展；跨周期能力仍需持续验证。';
export function initialState(){return {schema:1,period:'annual',rule:{saved:false,active:true,object:'molly',threshold:0},alert:'none',versions:[
 {id:1,date:'2026.02',label:'原研究',summary:'筛选与深耕并重，IP 池可能增强跨周期能力。',claims:[...originals],sources:['original'],reason:'初始案例讨论形成研究假设。',kind:'seed'},
 {id:2,date:'2026-03-25',label:'全年业绩复核',summary:summaryV2,claims:[...annualClaims],sources:['original','annual'],reason:'2025 全年业绩补充多 IP 商业化证据。',kind:'seed'}
 ],notes:[],reviews:[],lastChecked:'2026-03-25',lastReviewed:'2026-03-25',chat:[],draft:null};}
// V3 is the interim research round; stored judgment IDs remain stable for old references.
export const versionNumber = id => Number(id) >= 3 ? Number(id) + 1 : Number(id);
export function latest(s){return s.versions.at(-1);}
export function canReviewDisclosure(s){return s.period==='interim';}
export function claimReferences(s,v){
 if(v.claimRefs)return structuredClone(v.claimRefs);
 if(v.id===1)return ['origin-operation','origin-lifecycle','origin-platform'].map(id=>({kind:'discussion',id}));
 if(v.kind==='seed')return ['demo-concentration','demo-old-ip','demo-platform'].map(id=>({kind:'discussion',id}));
 const previous=s.versions[s.versions.findIndex(x=>x.id===v.id)-1],oldRefs=previous?claimReferences(s,previous):[];
 return v.claims.map((claim,i)=>previous?.claims[i]===claim?oldRefs[i]:{kind:'version',id:v.id});
}
export function evaluate(s){
 if(s.period!=='interim')return s;
 s.lastChecked='2026-08-20';
 // A discovered event retains the rule that triggered it; pausing only stops future checks.
 if(['pending','ignored','reviewed','deferred'].includes(s.alert))return s;
 const eligible=s.rule.saved&&s.rule.active&&(-growth(DATA.interim[s.rule.object])>0)&&(-growth(DATA.interim[s.rule.object])>=s.rule.threshold);
 s.alert=eligible?'pending':'none';s.alertRule=eligible?{...s.rule}:null;return s;
}
export function advance(s){s.period='interim';return evaluate(s);}
export function saveRule(s,rule){s.rule={...rule,saved:true};return evaluate(s);}
export function prepareDraft(s){if(!canReviewDisclosure(s))throw Error('中期材料尚未收录，请先推进至下次披露。');if(!s.draft)s.draft={baseId:latest(s).id,selected:[true,true,false],texts:[...suggestions],summary:latest(s).summary,reason:'依据 2026 中期业绩，分别复核老 IP 经营与头部之外的增长。'};return s.draft;}
export function commitDraft(s){
 if(!canReviewDisclosure(s))throw Error('中期材料尚未收录，请先推进至下次披露。');
 const d=s.draft;if(!d)throw Error('请先打开修订建议。');
 if(d.baseId!==latest(s).id)throw Error('当前判断已更新，请重新打开修订建议。');
 if(!d.summary.trim()||d.selected.some((yes,i)=>yes&&!d.texts[i].trim()))throw Error('判断内容不能为空。');
 const old=latest(s);const claims=old.claims.map((text,i)=>d.selected[i]?d.texts[i].trim():text);
 const changed=claims.some((t,i)=>t!==old.claims[i])||d.summary.trim()!==old.summary;
 const reviewId='review-'+(s.reviews.length+1),oldRefs=claimReferences(s,old);
 if(changed)s.versions.push({id:old.id+1,date:'2026-08-20',label:'中期业绩复核',summary:d.summary.trim(),claims,claimRefs:claims.map((t,i)=>t!==old.claims[i]?{kind:'review',id:reviewId}:oldRefs[i]),sources:['original','annual','interim'],reason:d.reason.trim()||'复核中期业绩后确认修改。',kind:'user'});
 s.reviews.push({id:reviewId,date:'2026-08-20',version:latest(s).id,baseVersion:d.baseId,reason:d.reason.trim()||'已复核，维持原判断。',changed,source:'interim',beforeClaims:[...old.claims],afterClaims:[...claims],beforeSummary:old.summary,afterSummary:d.summary.trim()});
 s.lastReviewed='2026-08-20';s.alert='reviewed';s.draft=null;return changed;
}
export function addManualVersion(s,summary,reason){if(!summary.trim())throw Error('请填写判断。');const old=latest(s);if(summary.trim()===old.summary)throw Error('判断尚未修改。');s.versions.push({...structuredClone(old),claimRefs:claimReferences(s,old),memoryIds:undefined,memoryStatuses:undefined,memorySnapshot:undefined,memoryRecovery:undefined,id:old.id+1,date:s.period==='interim'?'2026-08-20':'2026-03-25',label:'手动修订',sources:visibleSources(s,null),summary:summary.trim(),reason:reason.trim()||'用户主动修订',kind:'user'});s.lastReviewed=latest(s).date;s.draft=null;}
export function visibleSources(s,versionId){if(versionId)return s.versions.find(v=>v.id===versionId)?.sources||[];return s.period==='interim'?['original','annual','interim']:['original','annual'];}
export function restore(raw){try{const s=JSON.parse(raw);if(s?.schema!==1||!Array.isArray(s.versions)||!s.versions.length||!s.rule||!['annual','interim'].includes(s.period)||!Array.isArray(s.notes)||!Array.isArray(s.chat)||!Array.isArray(s.reviews)||s.versions.some(v=>!Array.isArray(v.claims)||v.claims.length!==3||!Array.isArray(v.sources)||typeof v.summary!=='string'))return initialState();const origin=s.versions.find(v=>v.id===1&&v.kind==='seed');if(origin?.date==='2025.08')origin.date='2026.02';migrateMemorySnapshots(s);return s;}catch{return initialState();}}
