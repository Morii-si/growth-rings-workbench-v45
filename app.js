import {renderBoardVersionMenu,installBoardVersionMenu} from './board-version-menu.js';
import {mountWelcomeTextType} from './research-text-type.js';
import {researchRoundWork,installResearchDraft,roundBoardSummary,roundBoardDiscussion,fitRoundConversation} from './research-draft-view.js';
import {roundState,roundConversation} from './research-draft-model.js';
import {latestGeneratedBoard} from './research-room-model.js';
import {roundPanel,installRoundWorkbench,refreshRoundWorkbench} from './round-workbench.js';
import {roundCount} from './round-model.js';
import {roomNav,researchHome,roomArchive,generatedBoardSummary,generatedBoardDiscussion,installResearchRoom} from './research-room.js';
import {returnQueue} from './research-return.js';
import {pendingAnnotations,editPendingAnnotation,removePendingAnnotation,sendDiscussionBatch,ensureAnnotations,addAnnotation,annotationPanel} from './workbench.js';
import {boardHeading,boardSources} from './board-frame.js';
import {discussionPanel,researchQuestions,revisionRecordPanel} from './discussion-view.js';
import {originalJudgments,originalSources,ensureFollowup,saveFollowupReminder,updateFollowup,followupBoard} from './research-continuity.js';
import {versionNumber,SOURCE,DATA,growth,excluding,questions,latest,initialState,evaluate,advance,saveRule,visibleSources,restore} from './engine.js';
import {boardPeriod,researchBoard,memoryArchive,contextPreview} from './board.js';
import {ensureMemory,contextFor,discussionContext,recordDiscussion} from './research-memory.js';
import {resolveResearchSession,researchSessionLink} from './research-session.js';
import {loadBundledResearchState} from './bundled-research-demo.js';
const session=resolveResearchSession(location.href);
if(session.url!==location.href)replaceAddress(new URL(session.url));
const KEY=session.key;
const STORAGE_ERROR='本地保存失败。请导出研究记录，避免关闭页面后丢失。';
const loadedResearch=loadBundledResearchState({key:KEY,isDemo:session.isDemo,entryStarted:session.entryStarted,read:key=>localStorage.getItem(key),write:(key,value)=>localStorage.setItem(key,value)});
let storageFailed=loadedResearch.persistBlocked;
let state=loadedResearch.state;
let variant=new URLSearchParams(location.search).get('view')==='review'?'review':'rail';
let ui={panel:'chat',history:null,future:false,dataUpdate:false,ruleEditor:false,memoriesOpen:false,annotationTarget:null,annotationText:'',annotationAll:false,annotationContext:null,annotationEditing:null,lastBatch:null,question:1,chart:'excluding',reviewing:false,manual:false,note:'',ask:'',reset:false,source:'annual',ruleDraft:null,editSummary:'',editReason:'',error:'',report:'latest',ipSort:'revenue',memoryFilter:'all',memoryQuery:'',discussionId:null,carry:null,stage:'board',showTimeline:false,assistant:false,focusTopic:new URLSearchParams(location.search).get('topic')||'old',snapshotOpen:false};
if(loadedResearch.error)ui.error=loadedResearch.error;
if(state.discussionComposer){ui.annotationText=state.discussionComposer.text||'';ui.annotationTarget=state.discussionComposer.target||null;ui.annotationEditing=state.discussionComposer.editing||null;}
ensureMemory(state);ensureFollowup(state);
const route=new URLSearchParams(location.search),requestedVersion=route.get('version');
ui.screen=route.get('screen')==='home'||(!route.has('screen')&&!requestedVersion)?'home':route.get('tab')==='boards'||['1','2'].includes(requestedVersion)?'archive':'work';
if(ui.screen==='work'){roundState(state).workspaceMode='conversation';if(route.get('mode')==='draft'&&latestGeneratedBoard(state)){ui.screen='archive';ui.dataUpdate=true;ui.report='interim';}}
ui.roomRecordsOpen=route.has('record');ui.roomRecord=route.get('record');
ui.followupsOpen=requestedVersion==='future';
if(ui.screen==='archive'){
 if((requestedVersion==='3'||ui.dataUpdate)&&latestGeneratedBoard(state)){advance(state);ui.dataUpdate=true;ui.report='interim';}
 else{ui.history=requestedVersion==='1'?1:2;ui.report='annual';}
}else if(ui.screen==='work'){advance(state);ui.history=null;ui.dataUpdate=true;ui.report='interim';}
const app=document.querySelector('#app');
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ico=(name)=>{const paths={book:'M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-2H4z M20 4h-4a3 3 0 0 0-3 3 M20 4v15h-3',arrow:'M5 12h14m-6-6 6 6-6 6',check:'m5 12 4 4L19 6',bell:'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',clock:'M12 7v5l3 2 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',file:'M14 3H5v18h14V8z M14 3v5h5 M8 12h8M8 16h6',chat:'M4 4h16v12H9l-5 4z',plus:'M12 5v14M5 12h14',back:'m14 6-6 6 6 6',edit:'m5 15-1 5 5-1L20 8l-4-4z M13 7l4 4',close:'m6 6 12 12M6 18 18 6',pause:'M8 5v14M16 5v14',play:'m8 5 11 7-11 7z',external:'M14 3h7v7m0-7L10 14M10 3H3v18h18v-7',layers:'m12 3 10 6-10 6L2 9z M2 14l10 6 10-6',repeat:'M4 7h13l-3-3m3 3-3 3M20 17H7l3 3m-3-3 3-3',save:'M4 3h14l3 3v15H3V3z M7 3v6h10V3M7 21v-8h10v8',search:'M20 20l-5-5 M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0'};return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${(paths[name]||paths.file).split(' M').map((d,i)=>`<path d="${i?'M':''}${d}"/>`).join('')}</svg>`;};
const btn=(label,action,cls='',attrs='')=>`<button class="${cls}" data-action="${action}" ${attrs}>${label}</button>`;
const badge=(text,type='')=>`<span class="badge ${type}">${text}</span>`;
const name=()=>variant==='review'?'研究修订台':'研究时间轨道';
const triggeringRule=()=>state.alertRule||state.rule;
const date=()=>state.period==='interim'?'2026-08-20':'2026-03-25';
function storageStatus(){return `${ico(storageFailed?'pause':'check')}${storageFailed?'未保存到本机':'本地保存'}`;}
function persist(){
 if(loadedResearch.persistBlocked){storageFailed=true;ui.error=loadedResearch.error;return;}
 ensureMemory(state);ensureFollowup(state);
 try{localStorage.setItem(KEY,JSON.stringify(state));storageFailed=false;if(ui.error===STORAGE_ERROR)ui.error='';}
 catch{storageFailed=true;ui.error=STORAGE_ERROR;}
 document.querySelectorAll('.local-status').forEach(el=>{el.innerHTML=storageStatus();el.title=storageFailed?STORAGE_ERROR:'';});
 const banner=document.querySelector('[data-storage-error]');
 if(!storageFailed)banner?.remove();
 else if(!banner&&document.querySelector('#main')){const el=document.createElement('div');el.className='error-banner';el.dataset.storageError='';el.setAttribute('role','alert');el.textContent=STORAGE_ERROR;document.querySelector('#main').before(el);}
}
function replaceAddress(address){try{history.replaceState(null,'',address);}catch(error){if(error.name!=='SecurityError')throw error;}}
let toastTimer;function toast(t){const el=document.querySelector('#toast');el.textContent=t;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3600);}
function current(){return ui.history?state.versions.find(v=>v.id===ui.history)||latest(state):ui.dataUpdate?state.versions.find(v=>v.id===2)||latest(state):latest(state);}
function sourceLink(key){if(key==='original')return btn('查看研究参考材料','source-original','text-button');const s=SOURCE[key];return `<a class="source-link" href="${s.url}" target="_blank" rel="noopener noreferrer">${ico('file')}${s.name} · p.${s.page}${ico('external')}</a>`;}
function brand(){return `<a class="wordmark growth-rings-brand" href="?screen=home&amp;view=${variant}${session.isDemo?'&amp;demo-session='+encodeURIComponent(session.sessionId):''}" aria-label="Growth Rings 首页"><span class="brand-symbol" aria-hidden="true"><img src="assets/growth-rings-logo-v1.png" alt=""></span><strong>Growth Rings</strong><span class="brand-tagline">沉淀每一轮研究，接续每一次判断</span></a>`;}
function pageTitle(){if(ui.screen==='home')return '研究首页 | Growth Rings';if(ui.screen==='work')return '泡泡玛特 · 半年报讨论 | Growth Rings';const v=current();const stage=ui.future?'未来待跟进':ui.dataUpdate?'2026年半年报更新':v.id===1?'初始讨论':v.id===2?'2025年业绩更新':v.label;return `泡泡玛特 · ${stage} | Growth Rings`;}
function topbar(){if(variant==='rail')return `<header class="topbar">${brand()}<div class="top-right"><span class="local-status" aria-live="polite" title="${storageFailed?STORAGE_ERROR:''}">${storageStatus()}</span>${btn(ico('save')+'导出','export','quiet')}</div></header>`;return `<header class="topbar">${brand()}<nav class="variant-switch" aria-label="对比界面"><button data-action="variant-review" aria-pressed="${variant==='review'}">修订台</button><button data-action="variant-rail" aria-pressed="${variant==='rail'}">时间轨道</button></nav><div class="top-right">${btn('讨论沉淀','archive','quiet')}<span class="local-status" aria-live="polite" title="${storageFailed?STORAGE_ERROR:''}">${storageStatus()}</span>${btn(ico('save')+'导出记录','export','quiet')}</div></header>`;}
function nav(){return `<nav class="research-nav" aria-label="研究导航"><div class="nav-label">我的研究</div><div class="project-label">${ico('layers')}消费与 IP</div>${btn('<span class="project-dot"></span>泡泡玛特','home','project-current')}<p class="nav-description">IP 平台与跨周期能力</p><div class="nav-section">${btn(ico('book')+'研究判断','home',ui.panel==='updates'?'selected':'')}${btn(ico('chat')+'研究助手','panel-chat',ui.panel==='chat'?'selected':'')}${btn(ico('bell')+'跟踪要求'+(state.rule.saved?'<i class="tiny-dot"></i>':''),'panel-rules',ui.panel==='rules'?'selected':'')}${btn(ico('file')+'证据资料','panel-sources',ui.panel==='sources'?'selected':'')}</div><div class="nav-bottom"><span class="nav-label">研究起点</span>${btn('2025.08 · IP 产业链研究'+ico('arrow'),'origin','origin-link')}<p>从你已有的研究出发，<br>把后续判断留下来。</p></div></nav>`;}
function head(){return `<div class="research-head"><div class="head-meta"><span>泡泡玛特</span><span>09992.HK</span>${badge(ui.future?'跟进计划':ui.history?'历史快照':'持续研究',ui.history?'':'blue')}</div><h1>IP 平台能力，能否跨越<br class="desktop-break">单一爆款周期？</h1><div class="research-meta"><span>材料更新 ${ui.history?(current().sources.includes('interim')?'2026.08.20':current().sources.includes('annual')?'2026.03.25':'2025.08'):date().replaceAll('-','.')}</span><span>判断复核 ${ui.history?current().date:state.lastReviewed}</span>${btn(ico(state.rule.saved&&state.rule.active?'bell':'pause')+(state.rule.saved?(state.rule.active?'跟踪中':'跟踪已暂停'):'尚未设置跟踪'),'panel-rules','status-link')}</div></div>`;}
function timeline(){let nodes=state.versions.map(v=>({id:'v'+v.id,date:v.date,title:v.id===1?'初始讨论':v.id===2?'2025年业绩更新':v.label,sub:'V'+versionNumber(v.id)+(v.kind==='seed'?'':' · 已确认'),action:'history-'+v.id,active:!ui.future&&!ui.dataUpdate&&(ui.history===v.id||(!ui.history&&v.id===latest(state).id&&!ui.reviewing))}));
 const afterV2=nodes.findIndex(n=>n.id==='v2')+1;nodes.splice(afterV2,0,{id:'interim',date:'2026-08-20',title:'2026 年半年报研究',sub:'V3 · 正在研究',action:'open-interim',active:ui.dataUpdate,event:true});
 return `<section class="time-section" aria-label="研究历史"><div class="timeline-title">${ico('clock')}研究沿革<span>${nodes.length} 轮研究</span></div><div class="timeline">${nodes.map(n=>`<button class="time-node ${n.active?'active':''} ${n.event?'event-node':''}" data-action="${n.action}"><span class="time-date">${n.date}</span><span class="time-line"><i></i></span><strong>${n.title}</strong><small>${n.sub}</small></button>`).join('')}<button class="time-node future ${ui.future?'active':''}" data-action="future"><span class="time-date">To be continued...</span><span class="time-line"><i></i></span><strong>未来待跟进</strong><small>持续补充</small></button></div></section>`;}
function alertBanner(){if(ui.future)return '';if(ui.history)return '';
 if(state.alert==='pending')return `<div class="alert-banner">${ico('bell')}<div><strong>你关注的“${triggeringRule().object==='molly'?'老 IP 持续经营':'头部 IP 经营'}”有新证据</strong><span>${triggeringRule().object==='molly'?'MOLLY':'THE MONSTERS'} 本期收入同比下降 ${(-growth(DATA.interim[triggeringRule().object])).toFixed(1)}%，关联你保存的跟踪要求。</span></div>${btn('回看此前讨论','recall','text-button','data-id="'+(triggeringRule().object==='molly'?'demo-old-ip':'demo-concentration')+'"')}${btn('讨论这次变化'+ico('arrow'),'annotations','primary')}</div>`;
 if(state.alert==='deferred')return `<div class="history-banner">${ico('clock')}<span>1 条更新已暂存，可在本轮讨论中继续。</span>${btn('继续讨论','annotations','text-button')}</div>`;
 return '';}
function thesis(){const v=current();return `<section class="thesis"><div class="section-heading"><h2>${ui.dataUpdate?'沿用判断':ui.history||v.id<=2?'当时判断':'当前判断'} ${badge('V'+versionNumber(v.id))}</h2></div><p class="thesis-statement">${esc(v.summary)}</p></section>`;}
function claimRows(){return `<section class="claims"><div class="section-heading"><h2>三个持续追踪的问题</h2><span class="muted">点击查看相关证据</span></div>${questions.map((q,i)=>{const pending=!ui.history&&state.alert==='pending'&&i<2;return `<button class="claim-row ${ui.question===i?'focused':''}" data-action="question-${i}"><span class="claim-index">${String(i+1).padStart(2,'0')}</span><div><div class="claim-title">${q}${pending?badge('待复核','amber'):badge(i===2?'待长期验证':'有证据','subtle')}</div><p>${esc(current().claims[i])}</p></div><span class="claim-out">${ico('arrow')}</span></button>`;}).join('')}</section>`;}
function chart(){const available=visibleSources(state,ui.history);if(!available.includes('annual'))return `<section class="evidence-chart original-excerpt"><h2>研究起点</h2><blockquote>“从创作初期开始筛选，进行全流程的 IP 孵化与运营，筛选与深耕耘并重。”</blockquote><p>你的《IP产业链研究》 · 2025.08 · 第 34 页</p><span class="muted">本时点尚未收录 2025 全年业绩。</span></section>`;
 const interim=available.includes('interim')&&['molly','twinkle'].includes(ui.chart);const values=interim?DATA.interim[ui.chart]:ui.chart==='total'?DATA.annual.total:excluding;
 const title=interim?(ui.chart==='molly'?'MOLLY：老 IP 的本期表现':'星星人：头部之外的增长证据'):ui.chart==='total'?'集团收入：观察整体增长':'扣除 THE MONSTERS，其他收入仍在增长';
 const max=Math.max(...values)*1.08,labels=interim?['2025 上半年','2026 上半年']:['2024 全年','2025 全年'];
 return `<section class="evidence-chart"><div class="section-heading"><h2>证据核查</h2>${badge(interim?'同口径 · 上半年':'同口径 · 全年')}</div><div class="chart-tabs" aria-label="选择收入指标">${btn('其余收入','chart-excluding',!interim&&ui.chart!=='total'?'active':'')}${btn('集团收入','chart-total',ui.chart==='total'?'active':'')}${available.includes('interim')?btn('MOLLY','chart-molly',ui.chart==='molly'?'active':'')+btn('星星人','chart-twinkle',ui.chart==='twinkle'?'active':''):''}</div><div class="chart-heading"><h3>${title}</h3><span class="chart-change ${growth(values)<0?'challenge':'support'}">${growth(values)>0?'+':''}${growth(values).toFixed(1)}% <small>同比</small></span></div><div class="bars" role="img" aria-label="${labels[0]}收入${(values[0]/100000).toFixed(2)}亿元，${labels[1]}收入${(values[1]/100000).toFixed(2)}亿元"><span class="chart-unit">人民币 · 亿元</span>${values.map((v,i)=>`<div class="bar-row"><span>${labels[i]}</span><div class="bar-track"><div class="bar-fill bar-${i}" style="width:${v/max*100}%"></div></div><strong>${(v/100000).toFixed(2)}</strong></div>`).join('')}</div><details class="calculation"><summary>来源与计算口径${ico('plus')}</summary><div>${sourceLink(interim?'interim':'annual')}<p>同比 =（本期收入 ÷ 同期收入 − 1）× 100%。公告原数单位为人民币千元；除以 100,000 换算为亿元。</p>${!interim&&ui.chart!=='total'?'<p>其余收入 = 集团收入 − THE MONSTERS 收入；包含授权 IP 与外采等收入。此拆分不构成剔除头部 IP 后的因果模拟。</p>':''}<p>单期增长或下降均不足以证明长期跨周期能力。</p></div></details></section>`;}
function rulesPanel(){const r=ui.ruleDraft||state.rule;return `<div class="panel-heading"><h2>跟踪要求</h2>${badge(state.rule.saved?(state.rule.active?'跟踪中':'已暂停'):'未保存',state.rule.saved?'blue':'')}</div><div class="context-copy"><h3>只提醒你关心的变化。</h3><p>下次披露时，对照同一 IP、同一期间的收入变化。</p><form id="rule-form"><label>关注对象<select name="object"><option value="molly" ${r.object==='molly'?'selected':''}>MOLLY · 老 IP 持续经营</option><option value="monsters" ${r.object==='monsters'?'selected':''}>THE MONSTERS · 头部 IP 经营</option></select></label><label>何时提醒<select name="threshold">${[0,10,30,50].map(n=>`<option value="${n}" ${Number(r.threshold)===n?'selected':''}>${n?'收入同比下降至少 '+n+'%':'收入出现同比下降'}</option>`).join('')}</select></label><label class="check-label"><input type="checkbox" name="active" ${r.active?'checked':''}><span>启用这条跟踪要求</span></label><div class="rule-preview">${ico('bell')}附上新证据、对应研究问题和原判断，让提醒能直接进入复核。</div><button class="primary wide" type="submit">${ico('check')}保存跟踪要求</button></form><p class="fineprint">演示可验证：设为下降至少 50%，或暂停跟踪，再推进日期，MOLLY 将不会触发提醒。</p>${state.rule.saved?btn(state.rule.active?'暂停跟踪':'恢复跟踪','toggle-rule','text-button wide'):''}</div>`;}
function chatPanel(){return ui.screen==='archive'&&ui.dataUpdate&&!ui.discussionId?(latestGeneratedBoard(state)?.categories?roundBoardDiscussion(state):generatedBoardDiscussion(state)):discussionPanel(state,ui,current());}
function sourceList(history=false){return visibleSources(state,history?ui.history:null).map(k=>k==='original'?`<button class="source-item" data-action="source-original">${ico('file')}<span><strong>IP 产业链研究</strong><small>2025.08 · 参考材料 · 第 24–35 页</small></span>${ico('arrow')}</button>`:`<button class="source-item" data-action="source-${k}">${ico('file')}<span><strong>${SOURCE[k].name}</strong><small>${SOURCE[k].date} · 官方披露 · p.${SOURCE[k].page}</small></span>${ico('arrow')}</button>`).join('');}
function sourcesPanel(){let key=ui.source;if(!visibleSources(state,ui.history).includes(key))key='original';return `<div class="panel-heading"><h2>证据资料</h2>${badge(visibleSources(state,ui.history).length+' 份')}</div><div class="context-copy">${sourceList(!!ui.history)}<div class="source-detail">${key==='original'?`<h3>IP 产业链研究 · 2025.08</h3><p>讨论使用的研究参考材料，按页保留摘录。</p>${originalSources()}${btn('回看 V1 初始研究','origin','text-button')}<p class="fineprint">摘录由已提供的原 PPT 提取，保留原页码。Demo 不包含 PPT 全文或上传解析。</p>`:`<h3>${SOURCE[key].name}</h3><p>发布于 ${SOURCE[key].date}。使用公告印刷第 ${SOURCE[key].page} 页的 IP 收入数据，按原数计算同比。</p>${sourceLink(key)}<p class="fineprint">单位：人民币千元。半年度与全年分别核查，不跨期间直接计算增速。</p>`}</div>${!ui.history&&state.notes.length?`<div class="notes"><h3>我的研究笔记 · ${state.notes.length}</h3>${state.notes.map(n=>`<article><small>${n.date}</small><p>${esc(n.text)}</p></article>`).join('')}</div>`:''}</div>`;}
function panel(){const mode=['annotations','sources','rules','revision-record'].includes(ui.panel)?ui.panel:'chat';return `<aside class="context-panel" id="context" aria-label="讨论与研究上下文">${!['chat','annotations'].includes(mode)?btn(ico('back')+'返回历史讨论','panel-chat','text-button panel-back'):''}<div id="panel-content">${({annotations:()=>roundPanel(state),chat:chatPanel,rules:rulesPanel,sources:sourcesPanel,'revision-record':()=>revisionRecordPanel(state,ui)})[mode]()}</div></aside>`;}

function demoBar(){return state.period==='annual'&&ui.screen==='archive'?`<footer class="demo-bar"><div class="demo-controls">${btn('模拟收到半年报'+ico('arrow'),'advance','demo-next')}</div></footer>`:'';}
function stageNav(){return `<div class="stage-nav"><strong>${ui.future?'持续跟进':'历史研究'}</strong><div class="stage-tools">${btn('历史讨论','open-history','assistant-toggle',`aria-expanded="${ui.assistant&&ui.panel==='chat'}"`)}${btn('本轮讨论'+(roundCount(state)?' · '+roundCount(state):''),'annotations','assistant-toggle')}</div></div>`;}
function chatHeader(){
 const opening=researchSessionLink(location.href,'opening'),normal=researchSessionLink(location.href,'normal');
 return topbar()+`<div class="chat-contextbar"><div class="chat-context-label"><button data-action="research-home">研究首页</button><i aria-hidden="true">/</i><span>泡泡玛特<span class="chat-context-detail">半年报讨论</span></span></div><nav aria-label="研究导航">${session.isDemo?`<a class="chat-nav-button chat-return-normal" href="${esc(normal)}">返回原讨论</a>`:''}<a class="chat-nav-button chat-replay" href="${esc(opening)}">从开场演示</a><button class="chat-nav-button" data-action="company-boards">研究看板 ${ico('arrow')}</button></nav></div>`;
}
function versionBar(){return renderBoardVersionMenu({selected:ui.dataUpdate?'3':String(current().id),hasGenerated:!!latestGeneratedBoard(state)});}
function openHistoryBoard(version){
 const useV3=String(version)==='3'&&!!latestGeneratedBoard(state);
 Object.assign(ui,{screen:'archive',history:useV3?null:String(version)==='1'?1:2,dataUpdate:useV3,report:useV3?'interim':'annual',future:false,assistant:false,discussionId:null,roomRecord:null});
}
function revealActiveVersion(){const rail=document.querySelector('.timeline'),active=rail?.querySelector('.time-node.active');if(!rail||!active)return;const r=rail.getBoundingClientRect(),a=active.getBoundingClientRect();if(a.left<r.left)rail.scrollLeft-=r.left-a.left;else if(a.right>r.right)rail.scrollLeft+=a.right-r.right;}

function railHead(){return `<header class="company-head"><div><h1>泡泡玛特 <span>09992.HK</span></h1><p><mark class="research-highlight">主要研究问题：IP 平台能力，能否跨越单一爆款周期？</mark></p></div></header>`;}
function companySpaceHeader(){
 const v=current(),working=ui.screen==='work',generated=latestGeneratedBoard(state);
 const title=working?(roundState(state).workspaceMode==='draft'&&roundState(state).roundDraft?'本次讨论':'本次讨论'):ui.dataUpdate?'V3 · 2026 年半年报研究':`V${versionNumber(v.id)} · ${v.id===1?'初始研究':v.id===2?'2025 年业绩研究':esc(v.label)}`;
 const detail=working?'':ui.dataUpdate?`生成于 ${new Date(generated.createdAt).toLocaleString('zh-CN',{hour12:false})}`:`${v.date.replaceAll('-','.')}`;
 return `<div class="company-space-head">${railHead()}<nav class="company-main-tabs" aria-label="公司研究空间"><button data-action="company-discussion" ${working?'aria-current="page"':''}>本次讨论</button>${versionBar()}</nav><header class="company-round-heading board-heading"><div><div class="company-round-title"><h2>${title}</h2></div>${detail?`<p>${detail}</p>`:''}</div><div class="stage-tools">${working?'':btn('继续讨论','company-discussion','assistant-toggle board-continue')+btn('讨论原文','open-history','assistant-toggle')+btn('材料批注','annotations','assistant-toggle')}</div></header></div>`;
}
function render(){document.querySelector('#selection-annotation')?.remove();const longterm=document.querySelector('.company-longterm');if(longterm)ui.followupsOpen=longterm.open;const remembered=document.querySelector('.future-memories');if(remembered)ui.memoriesOpen=remembered.open;if(ui.screen==='archive'&&ui.dataUpdate&&!latestGeneratedBoard(state))openHistoryBoard('2');
 const address=new URL(location.href);address.searchParams.set('revision','45');address.searchParams.set('screen',ui.screen==='home'?'home':'company');
 if(ui.screen==='home'){address.searchParams.delete('tab');address.searchParams.delete('version');}
 else{address.searchParams.set('tab',ui.screen==='work'?'discussion':'boards');if(ui.screen==='archive')address.searchParams.set('version',ui.dataUpdate?'3':String(versionNumber(current().id)));else address.searchParams.delete('version');}
 for(const key of ['pane','base','snapshot'])address.searchParams.delete(key);
 if(ui.screen==='work')address.searchParams.set('mode','conversation');else address.searchParams.delete('mode');
 if(ui.roomRecord&&ui.screen==='work')address.searchParams.set('record',ui.roomRecord);else address.searchParams.delete('record');
 address.searchParams.set('topic',ui.focusTopic);replaceAddress(address);document.body.className=variant;document.title=pageTitle();ensureMemory(state);ensureFollowup(state);
 const error=ui.error?`<div role="alert" class="error-banner" ${ui.error===STORAGE_ERROR?'data-storage-error':''}>${esc(ui.error)}${btn('关闭','clear-error','text-button')}</div>`:'';
 if(variant==='rail'&&ui.screen==='home'){document.body.classList.add('room-screen-home');app.innerHTML=topbar()+roomNav('home')+error+researchHome(state)+demoBar();mountWelcomeTextType();return;}
 if(variant==='rail'&&ui.screen==='work'){
  document.body.classList.add('room-screen-work','company-space');
  document.body.classList.add('round-conversation-screen');
  const drawer=ui.assistant?`<dialog id="assistant-dialog" class="company-context-dialog" aria-label="研究引用与批注"><div class="assistant-shell"><div class="assistant-head"><strong>研究引用与批注</strong>${btn(ico('close'),'assistant-close','quiet','aria-label="收起讨论"')}</div>${panel()}</div></dialog>`:'';
  app.innerHTML=researchRoundWork(state,{header:chatHeader(),demo:demoBar(),error,lastMessage:ui.lastRoundMessage,demoSession:session.isDemo,openingHref:researchSessionLink(location.href,'opening'),normalHref:researchSessionLink(location.href,'normal')})+drawer;
  const dialog=document.getElementById('assistant-dialog');if(dialog){dialog.showModal();dialog.addEventListener('cancel',e=>{e.preventDefault();ui.assistant=false;render();});revealDiscussion();}
  registerAnnotationTargets();refreshRoundWorkbench();revealActiveVersion();fitRoundConversation();mountWelcomeTextType();return;
 }
 if(variant==='rail'){
  const content=(ui.dataUpdate?roundBoardSummary(state,{openCategoryId:ui.boardOpenCategoryId}):'')+`<details class="research-snapshot" open><summary><span>本轮研究全貌</span><span class="snapshot-toggle" aria-hidden="true"></span></summary>${current().id===1?'':`<div class="judgment-summary">${thesis()}</div>`}${researchQuestions(state,ui,current())}</details><div id="full-research-board" tabindex="-1">${researchBoard(state,ui)}</div>`;

  const narrow=innerWidth<1280;
  const assistant=`<div class="assistant-head"><strong>${ico('chat')}和AI的讨论过程</strong>${btn(ico('close'),'assistant-close','quiet','aria-label="收起讨论"')}</div>${['chat','annotations','updates'].includes(ui.panel)?`<div class="discussion-mode" role="group" aria-label="讨论范围"><button data-action="open-history" aria-pressed="${ui.panel!=='annotations'}">历史讨论</button><button data-action="annotations" aria-pressed="${ui.panel==='annotations'}">本轮讨论${roundCount(state)?' · '+roundCount(state):''}</button></div>`:''}${panel()}`;
  app.innerHTML=topbar()+roomNav('archive')+companySpaceHeader()+`<div class="rail-workspace company-archive"><div class="rail-columns ${ui.assistant&&!narrow?'with-assistant':''}"><div class="canvas">${error}<main id="main" class="canvas-body stage-${ui.stage}" tabindex="-1">${content}${boardSources(state,ui)}</main></div>${ui.assistant&&!narrow?`<div class="assistant-shell">${assistant}</div>`:''}</div></div>`+demoBar()+(narrow&&ui.assistant?`<dialog id="assistant-dialog" aria-label="和AI的讨论过程"><div class="assistant-shell">${assistant}</div></dialog>`:'');
  const log=document.querySelector('.discussion-log'),opened=log?.querySelector('.discussion-entry[open]');if(log&&opened)log.scrollTop+=opened.getBoundingClientRect().top-log.getBoundingClientRect().top-8;
  const dialog=document.querySelector('#assistant-dialog');if(dialog){dialog.showModal();if(log&&opened)log.scrollTop+=opened.getBoundingClientRect().top-log.getBoundingClientRect().top-8;dialog.addEventListener('cancel',e=>{e.preventDefault();ui.assistant=false;render();document.querySelector('.assistant-toggle')?.focus();});}
  document.querySelector('.research-snapshot')?.addEventListener('toggle',event=>{ui.snapshotOpen=event.target.open;});
  registerAnnotationTargets();refreshRoundWorkbench();revealActiveVersion();mountWelcomeTextType();return;
 }
 let content=ui.future?followupBoard(state):thesis()+claimRows()+chart()+memoryArchive(state,ui,current());app.innerHTML=topbar()+`<div class="workspace">${nav()}<div class="research-shell">${head()}${alertBanner()}${error}<div class="work-grid"><main id="main" tabindex="-1">${boardHeading(state,ui,current())}${content}${boardSources(state,ui)}</main>${panel()}</div>${timeline()}</div></div>`+demoBar();registerAnnotationTargets();refreshRoundWorkbench();mountWelcomeTextType();}
function revealDiscussion(){const log=document.querySelector('.discussion-log'),entry=log?.querySelector('.discussion-entry[open]');if(!log||!entry)return;log.scrollTop+=entry.getBoundingClientRect().top-log.getBoundingClientRect().top-8;const answer=entry.querySelector('.speaker-assistant .utterance-body');if(answer){const needed=answer.getBoundingClientRect().top+100-log.getBoundingClientRect().bottom;if(needed>0)log.scrollTop+=needed;}}
function focusContext(){if(variant==='rail'){document.querySelector('#assistant-dialog textarea')?.focus();return;}if(innerWidth<1000)document.querySelector('#context')?.scrollIntoView({behavior:'auto',block:'start'});}
function ask(type,originalText){if(ui.annotationText.trim())saveComposerAnnotation();const prompts={excluding:'扣除 THE MONSTERS，其他业务的增长是否支持原判断？',platform:'本期材料会如何影响平台能力的判断？',track:'下一轮应关注哪些老 IP 经营变化？'};ui.annotationText=originalText||prompts[type]||'';ui.annotationTarget={context:annotationContext(),anchor:'board',quote:''};ui.annotationEditing=null;ui.panel='annotations';ui.assistant=true;saveRoundComposer();render();document.querySelector('#annotation-input')?.focus();}
app.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;const action=b.dataset.action;ui.error='';
 if(action.startsWith('history-')||['open-interim','future'].includes(action))ui.returnEditor=false;
 if(action==='research-home'){ui.screen='home';ui.assistant=false;render();window.scrollTo(0,0);return;}
 if(action==='company-discussion'){roundState(state).workspaceMode='conversation';Object.assign(ui,{screen:'work',history:null,future:false,dataUpdate:true,report:'interim',assistant:false,roomRecord:null});advance(state);persist();render();window.scrollTo(0,0);return;}
 if(action==='company-boards'){openHistoryBoard(latestGeneratedBoard(state)?'3':'2');render();window.scrollTo(0,0);return;}
 if(action.startsWith('history-')||action==='origin'){ui.screen='archive';ui.assistant=false;}
 if(variant==='rail'&&['home','continue-current'].includes(action)){roundState(state).workspaceMode='conversation';advance(state);Object.assign(ui,{screen:'work',roomChecksOpen:false,roomRecordsOpen:false,history:null,future:false,dataUpdate:true,report:'interim',assistant:false});persist();render();window.scrollTo(0,0);return;}
 if(action==='focus-board'){document.querySelector('#full-research-board')?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});document.querySelector('#full-research-board')?.focus({preventScroll:true});return;}
 if(['focus-old','focus-new','focus-platform'].includes(action)){ui.returnEditor=false;ui.focusTopic=action.slice(6);const url=new URL(location.href);url.searchParams.set('topic',ui.focusTopic);replaceAddress(url);render();document.querySelector(`[data-action="${action}"]`)?.focus({preventScroll:true});return;}
 if(action==='annotations'){ui.panel='annotations';ui.assistant=true;render();return;}
 if(action==='open-history'){ui.panel='chat';ui.assistant=true;render();return;}
 if(action==='clear-annotation-quote'){ui.annotationTarget=null;saveRoundComposer();render();return;}
 if(action==='edit-annotation'){if(ui.annotationText.trim()&&ui.annotationEditing!==b.dataset.id)saveComposerAnnotation();const a=pendingAnnotations(state).find(n=>n.id===b.dataset.id);if(a){ui.annotationText=a.text;ui.annotationTarget={context:a.context,anchor:a.anchor,quote:a.quote};ui.annotationEditing=a.id;saveRoundComposer();render();document.querySelector('#annotation-input')?.focus();}return;}
 if(action==='remove-annotation'){removePendingAnnotation(state,b.dataset.id);if(ui.annotationEditing===b.dataset.id)clearRoundComposer();persist();render();return;}
 if(action==='send-round'){try{if(ui.annotationText.trim())saveComposerAnnotation();const batch=sendDiscussionBatch(state);ui.lastBatch=batch.id;persist();render();toast('已模拟发送本轮批注');}catch(err){toast(err.message);}return;}
 if(action==='locate-annotation'){
  const a=ensureAnnotations(state).find(n=>n.id===b.dataset.id);if(!a)return;
  ui.future=a.context.stage==='future';ui.dataUpdate=a.context.stage==='update';ui.history=['version','update'].includes(a.context.stage)?a.context.versionId:null;ui.report=a.context.report;ui.reviewing=false;ui.manual=false;ui.panel='annotations';ui.annotationAll=true;if(innerWidth<1280)ui.assistant=false;render();
  const target=[...document.querySelectorAll('[data-annotation-anchor]')].find(n=>n.dataset.annotationAnchor===a.anchor)||document.querySelector('#main');if(target){const normalize=t=>String(t).replace(/\s+/g,'');if(!a.quote||normalize(target.textContent).includes(normalize(a.quote)))target.setAttribute('data-annotation-highlight','true');else toast('这处内容已变化；批注中保留了当时的引用原文。');target.scrollIntoView({block:'center'});}return;
 }
 if(action==='future'){Object.assign(ui,{screen:'work',assistant:false,future:false,dataUpdate:true,history:null,report:'interim',followupsOpen:true});advance(state);render();document.querySelector('.company-longterm')?.scrollIntoView({block:'start'});return;}
 if(action.startsWith('stage-')||action.startsWith('history-')||['home','origin','review','event','advance','revisit','manual','confirm-reset','panel-review','note-question'].includes(action))ui.future=false;
 if(action.startsWith('stage-')){ui.stage=action.slice(6);ui.manual=false;ui.reviewing=false;render();return;}
 if(action==='toggle-timeline'){ui.showTimeline=!ui.showTimeline;render();return;}
 if(action==='assistant-toggle'||action==='assistant-close'){ui.assistant=action==='assistant-toggle'?(ui.panel==='annotations'||!ui.assistant):false;if(action==='assistant-toggle')ui.panel='chat';render();document.querySelector('.assistant-toggle')?.focus();return;}
 if(action==='archive'||action==='recall'){ui.panel='chat';ui.assistant=true;ui.memoryQuery='';ui.discussionId=action==='recall'?b.dataset.id:null;render();revealDiscussion();return;}
 if(action==='revision-ref'){ui.panel='revision-record';ui.assistant=true;ui.revisionRef={kind:b.dataset.kind,id:b.dataset.id,question:Number(b.dataset.question)};render();focusContext();return;}
 if(action==='continue-current'){ui.carry=structuredClone(current());ui.history=null;ui.future=false;ui.panel='chat';ui.discussionId=null;render();return;}

 if(action==='open-interim'){if(latestGeneratedBoard(state))openHistoryBoard('3');else Object.assign(ui,{screen:'work',history:null,future:false,dataUpdate:true,report:'interim',assistant:false});advance(state);persist();render();window.scrollTo(0,0);return;}
 if(action.startsWith('report-')){ui.report=action.slice(7);render();return;}
 if(action==='memory-all'||action==='memory-included'){ui.memoryFilter=action.slice(7);render();document.getElementById('memory-archive')?.scrollIntoView({block:'start'});return;}
 if(action==='memory-toggle'){const m=state.discussions.find(x=>x.id===b.dataset.id);if(m){if(m.status!=='included'&&!m.conclusion?.trim()){toast('先写下需要沿用的要点，再纳入后续讨论');return;}m.status=m.status==='included'?'excluded':'included';ui.discussionId=m.id;persist();render();document.getElementById('memory-'+m.id)?.scrollIntoView({block:'center'});}return;}
 if(action==='note-question'){ask('question',b.dataset.question);return;}
 if(action.startsWith('variant-')){variant=action.slice(8);replaceAddress('?view='+variant);render();return;}
 if(variant==='rail'&&action==='panel-rules'){Object.assign(ui,{screen:'work',future:false,dataUpdate:true,history:null,report:'interim',followupsOpen:true,ruleEditor:true});render();document.querySelector('.task-reminder')?.scrollIntoView({block:'center'});return;}
 if(action.startsWith('panel-')){ui.assistant=true;const p=action.slice(6);ui.panel=p;render();focusContext();return;}
 if(action.startsWith('history-')){ui.dataUpdate=false;ui.report='latest';if(b.closest('.origin-next'))ui.stage='board';ui.history=Number(action.slice(8));ui.reviewing=false;ui.manual=false;ui.panel='chat';ui.discussionId=null;ui.carry=null;ui.chart='excluding';render();return;}
 if(action.startsWith('question-')){ui.assistant=true;ui.question=Number(action.slice(9));ui.panel='sources';ui.source=visibleSources(state,ui.history).includes('interim')?'interim':visibleSources(state,ui.history).includes('annual')?'annual':'original';if(ui.source==='interim')ui.chart=ui.question===1?'molly':'twinkle';render();focusContext();return;}
 if(action.startsWith('chart-')){ui.chart=action.slice(6);render();return;}
 if(action.startsWith('source-')){ui.assistant=true;ui.source=action.slice(7);ui.panel='sources';render();focusContext();return;}
 if(action.startsWith('ask-')){ask(action.slice(4));return;}
 switch(action){
 case 'home':ui.dataUpdate=state.period==='interim';ui.stage='board';ui.discussionId=null;ui.carry=null;ui.history=null;ui.reviewing=false;ui.manual=false;ui.panel='updates';break;
 case 'origin':ui.dataUpdate=false;ui.stage='board';ui.history=1;ui.reviewing=false;ui.manual=false;ui.panel='sources';ui.source='original';break;
 case 'event':ui.stage='board';ui.history=null;ui.manual=false;ui.reviewing=false;ui.panel='sources';ui.source='interim';ui.chart='molly';break;
 case 'interim-source':ui.panel='sources';ui.source='interim';ui.chart='molly';break;
 case 'advance':ui.screen='work';ui.roomChecksOpen=false;ui.roomRecordsOpen=false;advance(state);ui.dataUpdate=true;ui.stage='board';ui.report='latest';ui.history=null;ui.manual=false;ui.panel='updates';ui.chart='molly';toast(state.alert==='pending'?'已匹配你的跟踪要求，发现 1 条相关更新':'材料已收录；当前规则未触发提醒');break;
 case 'revisit':evaluate(state);ui.history=null;ui.reviewing=false;ui.manual=false;ui.panel='updates';toast(state.alert==='pending'?'欢迎回来，有 1 条待复核更新':state.alert==='deferred'?'欢迎回来，之前暂存的更新仍在':'已恢复研究记录，没有新增提醒');break;
 case 'defer':state.alert='deferred';ui.reviewing=false;toast('已暂存，之后可继续复核');break;
 case 'ignore':state.alert='ignored';ui.reviewing=false;state.reviews.push({date:date(),version:latest(state).id,reason:'用户忽略本次提醒',changed:false});toast('已忽略这次更新，材料仍保留');break;
 case 'toggle-rule':saveFollowupReminder(state,{...state.rule,active:!state.rule.active});ui.ruleDraft=null;evaluate(state);toast(state.rule.active?'已恢复跟踪':'已暂停主动提醒');break;
 case 'reset':ui.reset=true;break;
 case 'cancel-reset':ui.reset=false;break;
 case 'confirm-reset':state=initialState();ui.annotationTarget=null;ui.annotationText='';ui.annotationContext=null;ui.annotationEditing=null;ui.lastBatch=null;ui={...ui,screen:'home',roomChecksOpen:false,roomRecordsOpen:false,history:null,dataUpdate:false,panel:'updates',reviewing:false,manual:false,reset:false,chart:'excluding',ruleDraft:null,ask:''};toast('已重置为 v2 起始场景');break;
 case 'export':{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Growth-Rings-研究记录.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('研究记录已导出');break;}
 case 'clear-error':ui.error='';break;
 }persist();render();});
app.addEventListener('input',e=>{const el=e.target;if(el.id==='annotation-input'){ui.annotationText=el.value;saveRoundComposer();refreshRoundSend();return;}if(el.dataset.takeaway){const m=state.discussions.find(x=>x.id===el.dataset.takeaway);if(m){m.conclusion=el.value;if(!el.value.trim())m.status='open';persist();}return;}if(el.dataset.planId){updateFollowup(state,el.dataset.planId,el.dataset.planField,el.type==='checkbox'?el.checked:el.value);if(el.dataset.planField==='active'){el.closest('.followup-track').classList.toggle('paused',!el.checked);if(el.dataset.planId==='old-ip'){persist();render();return;}}document.querySelectorAll('[data-plan-preview]').forEach(node=>{if(node.dataset.planPreviewId===el.dataset.planId&&node.dataset.planPreview===el.dataset.planField)node.textContent=el.value.trim()||(el.dataset.planField==='note'?'还没有交接笔记，可记下下次研究的起点。':'尚未填写复核条件');});persist();return;}if(el.id==='version-select'){ui.future=el.value==='future';const id=Number(el.value);ui.history=ui.future||id===latest(state).id?null:id;if(ui.future)ui.stage='board';ui.reviewing=false;ui.manual=false;ui.panel='updates';ui.report='latest';render();return;}if(el.dataset.memoryTopic){const m=state.discussions.find(x=>x.id===el.dataset.memoryTopic);if(m){m.topic=el.value;persist();}return;}if(el.id==='ip-sort'){ui.ipSort=el.value;render();return;}if(el.id==='ask-input')ui.ask=el.value;if(el.closest('#rule-form')){const f=new FormData(el.closest('form'));ui.ruleDraft={object:f.get('object'),threshold:Number(f.get('threshold')),active:f.has('active')};}});
app.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.target);ui.error='';if(e.target.id==='annotation-form'){try{saveComposerAnnotation();persist();render();toast('已加入本轮讨论');}catch(err){toast(err.message);}return;}if(e.target.id==='memory-search'){ui.memoryQuery=String(f.get('query')).trim();render();return;}if(e.target.id==='rule-form'){saveFollowupReminder(state,{object:f.get('object'),threshold:Number(f.get('threshold')),active:f.has('active')});ui.ruleDraft=null;toast('提醒已保存到对应的待跟进事项');}persist();render();});

function saveRoundComposer(){state.discussionComposer={text:ui.annotationText,target:ui.annotationTarget,editing:ui.annotationEditing};persist();}
function clearRoundComposer(){ui.annotationText='';ui.annotationTarget=null;ui.annotationEditing=null;state.discussionComposer=null;}
function saveComposerAnnotation(){const target=ui.annotationTarget||{context:annotationContext(),anchor:'board',quote:''};if(ui.annotationEditing)editPendingAnnotation(state,ui.annotationEditing,ui.annotationText);else addAnnotation(state,{...target,text:ui.annotationText});clearRoundComposer();}
function refreshRoundSend(){const n=pendingAnnotations(state).length+(ui.annotationText.trim()&&!ui.annotationEditing?1:0),button=document.querySelector('[data-action="send-round"]');if(button){button.disabled=!n;button.textContent='一起发送'+(n?' · '+n+' 条':'');}}
function annotationContext(){const v=current(),stage=ui.future?'future':ui.dataUpdate?'update':'version',report=v.id===1?'original':boardPeriod(state,ui);return {key:stage+':'+v.id+':'+report,stage,versionId:v.id,report,label:ui.future?'未来待跟进':ui.dataUpdate?'V3 · '+(report==='interim'?'2026年半年报':'2025年全年数据'):'V'+versionNumber(v.id)+' · '+(v.id===1?'初始研究':v.label)};}
function registerAnnotationTargets(){const main=document.querySelector('#main');if(!main)return;main.dataset.annotationAnchor='board';
 const mark=(selector,key)=>main.querySelectorAll(selector).forEach((el,i)=>el.dataset.annotationAnchor=typeof key==='function'?key(el,i):key);
 mark('.thesis-statement','summary');mark('.research-questions article',(el,i)=>'question-'+i);mark('.board-reading','financial-reading');mark('.financial-strip>div',(el,i)=>'metric-'+i);
 mark('.board-module',el=>'module-'+(el.querySelector('h2')?.textContent||''));mark('.followup-track',el=>'followup-'+el.dataset.track);mark('.future-judgment','future-judgment');mark('.origin-thesis','origin-summary');
}
window.addEventListener('storage',e=>{if(e.key===KEY){state=restore(e.newValue);if(ui.screen==='work')roundState(state).workspaceMode='conversation';if(ui.history&&!state.versions.some(v=>v.id===ui.history))ui.history=null;render();toast('已同步另一窗口的演示进度');}});
matchMedia('(min-width:1280px)').addEventListener('change',()=>render());
installRoundWorkbench({state:()=>state,ui:()=>ui,context:annotationContext,current,render,persist,toast});
installResearchRoom({state:()=>state,ui:()=>ui,render,persist,toast,advance:()=>advance(state)});
installResearchDraft({state:()=>state,ui:()=>ui,render,persist,toast});
installBoardVersionMenu({onSelect(version){openHistoryBoard(version);render();}});
window.addEventListener('popstate',()=>location.reload());
evaluate(state);roundConversation(state);persist();render();
