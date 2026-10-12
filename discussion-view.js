import {aiMessage,userMessage} from './conversation-ui.js';
import {versionNumber} from './engine.js';
import {memoriesAt,memoryRecoveryNotice} from './research-memory.js';
import {claimReferences,questions,SOURCE} from './engine.js';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=(id,label)=>`<button class="text-button" data-action="recall" data-id="${id}">${label}</button>`;
const emphasis={
 'origin-framework':['情感连接','接触机会','持续延展','不能直接代入一个公司估值公式'],
 'origin-operation':['持续发现和经营多个 IP','也要补充投入和失败项目'],
 'origin-lifecycle':['不必然意味着用户关系消失','多期经营证据'],
 'origin-platform':['新 IP 接续','老 IP 的生命力','跨周期能力目前保留为假设'],
 'demo-old-ip':['38.4%','一年增长还不足以证明生命周期'],
 'demo-platform':['已有 IP 的持续经营','新 IP 能否接续','持续的多期证据'],
 'demo-concentration':['129.7%','23.3% 升至 38.1%','可以同时发生'],
 'demo-shortcut':['待检验的猜想','单 IP 单期变化不足以判断整个平台']
};
export function answerMarkup(m){const phrases=m.kind==='demo'?emphasis[m.id]||[]:[];let rest=String(m.answer??''),out='';while(rest){let at=-1,phrase='';for(const p of phrases){const i=rest.indexOf(p);if(i>=0&&(at<0||i<at)){at=i;phrase=p;}}if(at<0){out+=esc(rest);break;}out+=esc(rest.slice(0,at))+`<mark>${esc(phrase)}</mark>`;rest=rest.slice(at+phrase.length);}return out;}
function exchange(m){return userMessage(m.question,{label:m.kind==='demo'?'研究者':'你'})+aiMessage(answerMarkup(m),{note:m.kind==='demo'?'历史案例':'历史回复'});}
export function discussionPanel(s,ui,v){
 const historical=!!ui.history;let list=[...memoriesAt(s,historical?v:null)];list.sort((a,b)=>(b.createdAt||b.date).replaceAll('.','-').localeCompare((a.createdAt||a.date).replaceAll('.','-')));const count=list.length;if(ui.memoryQuery)list=list.filter(m=>[m.question,m.answer,m.conclusion].join(' ').includes(ui.memoryQuery));
 return `<div class="discussion-heading"><h2>历史讨论</h2><span>${count} 段 · V${versionNumber(v.id)}</span></div>${historical&&memoryRecoveryNotice(v)?`<p class="archive-note" role="note">${esc(memoryRecoveryNotice(v))}</p>`:''}<form id="memory-search" class="discussion-search"><input name="query" aria-label="搜索历史讨论" placeholder="搜索历史问题与结论" value="${esc(ui.memoryQuery)}"><button type="submit" class="text-button">搜索</button></form><div class="discussion-log history-log">${list.length?list.map(m=>`<details class="discussion-entry" id="memory-${m.id}" ${m.id===ui.discussionId?'open':''}><summary><span class="discussion-subject">${esc(m.question)}</span><span class="conversation-open-label">讨论原文</span><small>${m.kind==='user'?(m.createdAt?m.createdAt.slice(0,10):'本机记录'):m.date}</small>${m.conclusion?`<p class="history-conclusion">${esc(m.conclusion)}</p>`:''}</summary><div class="discussion-transcript">${exchange(m)}${m.contextIds?.length?`<div class="discussion-links"><span>引用的历史讨论</span>${m.contextIds.map(id=>link(id,esc(s.discussions.find(x=>x.id===id)?.question||id))).join('')}</div>`:''}${m.conclusion?`<div class="discussion-takeaway"><strong>当时留下的判断</strong><p>${esc(m.conclusion)}</p></div>`:''}${m.source?`<button class="text-button" data-action="source-${m.source}">查看参考资料</button>`:''}</div></details>`).join(''):'<p class="discussion-empty">没有匹配的历史讨论。</p>'}</div>`;
}
export function researchQuestions(s,ui,v){
 const historical=!!ui.history,refs=claimReferences(s,v),base=s.versions.find(x=>x.id===(v.id===2?1:v.id-1));
 const titles=['新 IP 能否接续？','老 IP 能否长久经营？','平台能否跨越周期？'];
 const updates=['星星人收入同比 +580.6%；存量放量补充头部之外的增长证据。','MOLLY 收入同比 −33.6%；需要重查产品节奏与持续需求。','海外渠道表现分化、库存周转变慢；跨周期回报仍待验证。'];
 return `<section class="research-thread" aria-label="贯穿研究的三个问题"><header><h2><mark class="research-highlight">贯穿研究的三个问题</mark></h2><p>${ui.dataUpdate?'V'+versionNumber(v.id)+' 已有判断 → V3 新材料':v.id===1?'从这三个问题出发，之后每次更新都回来核对':v.id===2?'沿用 V1 的问题，看 V2 增加了什么证据':'沿用同一组问题，对照前后判断'}</p></header><div class="research-questions">${titles.map((q,i)=>{const ref=refs[i];return `<article><h2>${q}</h2>${base&&!ui.dataUpdate?`<div class="claim-before"><span>V${versionNumber(base.id)} · 原判断</span><p>${esc(base.claims[i])}</p></div>`:''}<div class="claim-now"><span>${ui.dataUpdate?'已确认判断 · V'+versionNumber(v.id):v.id===1?'V1 · 初始假设':'V'+versionNumber(v.id)+' · '+(i===2?'继续保留边界':'补充经营证据')}</span><p>${esc(v.claims[i])}</p></div>${ui.dataUpdate?`<div class="claim-update"><span>V3 · 新增证据</span><p>${updates[i]}</p></div>`:''}${ref.kind==='discussion'?link(ref.id,'回看当时如何讨论'):`<button class="text-button" data-action="revision-ref" data-kind="${ref.kind}" data-id="${esc(ref.id)}" data-question="${i}">查看判断修订依据</button>`}</article>`;}).join('')}</div></section>`;
}
export function revisionRecordPanel(s,ui){
 const ref=ui.revisionRef||{},review=ref.kind==='review'?s.reviews.find(r=>r.id===ref.id):null;
 const v=s.versions.find(x=>x.id===(review?review.version:Number(ref.id))),base=s.versions.find(x=>x.id===(review?.baseVersion??v?.id-1));
 if(!v)return '<p>未找到这次修订记录。</p>';
 const i=Number(ref.question),before=review?.beforeClaims||base?.claims,after=review?.afterClaims||v.claims;
 return `<section class="revision-record"><div class="panel-heading"><h2>${review?'已保存的复核记录':'已保存的版本记录'}</h2></div><p>${esc(review?.date||v.date)} · ${base?'V'+versionNumber(base.id)+' → ':''}V${versionNumber(v.id)}</p><h3>${esc(questions[i]||'研究判断')}</h3>${before?`<div class="discussion-takeaway"><strong>复核前</strong><p>${esc(before[i])}</p></div>`:''}<div class="discussion-takeaway"><strong>确认后</strong><p>${esc(after[i])}</p></div><h3>修订理由</h3><p>${esc(review?.reason||v.reason)}</p>${review?.source?`<a class="source-link" href="${SOURCE[review.source].url}" target="_blank" rel="noopener noreferrer">${esc(SOURCE[review.source].name)} · p.${SOURCE[review.source].page}</a>`:''}${base?`<button class="text-button" data-action="history-${base.id}">回看 V${versionNumber(base.id)} 判断与讨论</button>`:''}<p class="fineprint">这是实际保存的审阅记录，讨论原文保留在该版本的讨论中。</p></section>`;
}
