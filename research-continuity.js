import {latest,evaluate,saveRule} from './engine.js';
import {contextFor} from './research-memory.js';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const head=(title,sub)=>`<header class="module-head"><div><h2>${title}</h2>${sub?`<p>${sub}</p>`:''}</div></header>`;
const discussion=(id)=>`<button class="text-button discussion-ref" data-action="recall" data-id="${id}">回看这段讨论</button>`;
const page=n=>`<span class="original-page">原研究 p.${n}</span>`;
export const originalExcerpts=[
 {page:26,title:'IP 价值的三个维度',text:'IP的预期价值=情感链接深度 * 跨媒介触点数量（好符号是基础）* 世界观承载力',note:'原稿的定性分析框架；本 Demo 不将其转换为估值公式或评分。'},
 {page:27,title:'生命周期依赖运营与耐心',text:'跨媒介触点数量与世界观的不断扩充能加长IP生命周期，考验的是IP公司的运营能力+耐心',note:'原稿将生命周期分为诞生、突破、沉淀、稳定四个阶段。'},
 {page:30,title:'传播优势与持续经营的张力',text:'形象IP传播阻力小、易二创，天然适配社交媒体传播方式，但维持生命周期的难度更大',note:'这是原稿提出的行业判断；具体 IP 的生命周期仍需后续证据。'},
 {page:33,title:'产业链上的激励差异',text:'平台型公司与IP创作公司的价值最大化实现路径不同',note:'原稿区分长期经营单一 IP 的价值，与平台筛选、放大多个 IP 的价值。'},
 {page:34,title:'泡泡玛特：筛选与深耕并重',text:'从创作初期开始筛选，进行全流程的IP孵化与运营，筛选与深耕耘并重',note:'原稿提出 IP 池、渠道与运营可能提高孵化胜率和跨周期的可能性，尚未证明跨周期能力。'}
];
export function originalSources(){return originalExcerpts.map(x=>`<details class="original-excerpt-item"><summary>${x.title} ${page(x.page)}</summary><blockquote>${esc(x.text)}</blockquote><p>${x.note}</p></details>`).join('');}
const hypotheses=[
 ['IP 池 → 商业化接续','储备艺术家与 IP，可能提高孵化胜率。','分别跟踪新 IP 与既有 IP 的收入；补充投入、失败项目与孵化周期。','出现新爆款只能证明一次接续，无法单独证明筛选成功率。','34'],
 ['深耕 → 老 IP 生命力','长期运营可以延展单个 IP 的价值。','同一 IP 的多期同口径收入、上新节奏、复购与内容运营。','一个财报期下滑不能直接判定 IP 衰退；持续走弱才值得进一步追因。','27 / 34'],
 ['渠道与运营 → 平台能力','渠道触点与经营能力可能增强平台对艺术家的吸引力。','不同地区与渠道的收入、单店表现、库存、毛利和投入。','开店带来规模增长，不足以证明单店质量或 IP 情感连接变强。','26 / 34'],
 ['多个 IP 接续 → 跨周期','丰富 IP 池可能缓冲单一爆款的波动。','头部占比、扣除头部后的收入、多批次 IP 在不同周期的表现。','平台总量增长可以与单一 IP 退潮同时发生，需要分开验证。','33 / 34']
];
export function originalJudgments(){return `<section class="board-module origin-hypotheses">${head('从原研究走向可验证的问题','以下验证方式为本次整理；左列假设来自原稿。')}<div class="table-scroll"><table><thead><tr><th>原研究假设</th><th>后续需要的证据</th><th>判断边界</th></tr></thead><tbody>${hypotheses.map(([name,claim,evidence,boundary,p])=>`<tr><th scope="row"><strong>${name}</strong><p>${claim}</p>${page(p)}</th><td>${evidence}</td><td>${boundary}</td></tr>`).join('')}</tbody></table></div></section>`;}
export function originBoard(){return `<div class="origin-intro"><div><h2>从 IP 产业链到公司研究</h2><p>四次初始讨论，留下同一组验证问题</p></div>${discussion('origin-platform')}</div>
 <div class="origin-thesis"><strong>初始立场</strong><p>泡泡玛特值得作为“筛选与深耕并重”的 IP 平台持续研究。艺术家储备、产品化与渠道运营形成了可能的接续机制；能否延长老 IP 的生命力、跨过单一爆款周期，仍需要公司层面的长期证据。</p><span>这次留下的判断：把新 IP 接续和老 IP 深耕分开验证。</span></div>
 <div class="evidence-grid origin-grid">
 <section class="board-module">${head('如何理解一个 IP 的长期价值','')}<dl class="origin-dimensions"><div><dt>情感链接深度</dt><dd>用户为什么喜欢、愿不愿意持续购买？角色、情感内核与反复接触共同影响关系深度。</dd></div><div><dt>跨媒介触点</dt><dd>产品形态、线上传播与线下场景，让用户发现、接触和消费 IP。</dd></div><div><dt>世界观承载力</dt><dd>新角色、故事与场景能否持续扩展，为后续内容和产品提供空间。</dd></div></dl><p class="module-takeaway">这些是观察维度，触点增加不保证情感连接变强，缺少完整世界观也不等于没有长期价值。</p>${discussion('origin-framework')}</section>
 <section class="board-module">${head('泡泡玛特的运营闭环','')}<ol class="origin-loop"><li><strong>艺术家与 IP 储备</strong><span>从创作早期发现、筛选与孵化</span></li><li><strong>IP 产品化</strong><span>把形象转化为商品，以产品销售变现</span></li><li><strong>渠道触达</strong><span>自营店销售、线上曝光与用户传播</span></li><li><strong>市场反馈</strong><span>机制假设：反馈改善筛选，渠道吸引合作；仍需批次与续约证据</span></li></ol><p class="module-takeaway">待验证：这个闭环能否反复产生商业化成果，并延续已有 IP 的生命力？IP 合作还受版权、授权期限与分成约束；渠道与运营能力不等同于拥有全部 IP 版权。</p>${discussion('origin-operation')}</section>
 <section class="board-module origin-wide">${head('沿着生命周期，观察运营做了什么','热度回落后，用户关系能否继续？')}<ol class="origin-lifecycle">${[
 ['诞生期','角色与内容成形','关注：创作基础、情感内核与辨识度'],['突破期','从核心圈层走向大众','关注：破圈后的产品化与触点扩展'],['沉淀期','热度回落，留下核心用户','关注：内容接续、社群与复购'],['稳定期','商业模式与用户关系稳定','关注：运营节奏与品牌资产维护']
 ].map(([a,b,c])=>`<li><h3>${a}</h3><strong>${b}</strong><p>${c}</p></li>`).join('')}</ol><footer>四阶段用于提出问题；IP 也可能跳跃、复兴或终止，具体阶段仍待验证。</footer>${discussion('origin-lifecycle')}</section>
 <section class="board-module">${head('放回产业链，区分两类能力','筛选与深耕，各自解决什么问题？')}<div class="origin-chain"><span>创作与版权</span><span>授权运营 / 产品化</span><span>零售与消费者</span></div><dl class="origin-dimensions"><div><dt>快速筛选与放大</dt><dd>依靠渠道、供应链与市场反馈，让更多 IP 进入商业化试验。讨论中以规模与高频迭代的运营方式作对照。</dd></div><div><dt>长期孵化与深耕</dt><dd>通过长期产品与内容运营提升生命周期价值。泡泡玛特能否兼顾孵化与长期运营，需要持续验证。</dd></div></dl><p class="module-takeaway">平台能不断推出新 IP，与每一个老 IP 都能长青，是两个不同的验证问题。</p>${discussion('origin-platform')}</section>
 </div><div class="origin-next"><span>下一轮：带着这些问题，讨论财报提供的新证据。</span><button class="primary" data-action="history-2">接着看 V2 的讨论与变化</button><button class="text-button" data-action="future">查看未来跟进计划</button></div>`;}
export const followupTracks=[
 {id:'old-ip',title:'老 IP：经营能否延续？',origin:'接着 V1：热度回落后，用户留下了吗？',evidence:'同一 IP 的多期同期收入，结合上新、补货、用户复购与内容运营。',trigger:'MOLLY 收入同比下降时复核；结合产品节奏判断，单期下降不直接认定衰退。',cadence:'每次业绩披露',mode:'披露时检查收入阈值'},
 {id:'succession',title:'新 IP：接续能否重复？',origin:'接着 V1：一个爆款与一个平台的区别',evidence:'固定首次合作／上市年份的 IP 批次，区分新孵化与存量放量；跟踪投入、失败、收入及授权期限与分成。',trigger:'固定批次老 IP 持续走弱、接续收入又不足以维持现金创造时，下调跨周期假设；先排查产品节奏与授权变化。',cadence:'每次业绩披露',mode:'手动资料复核'},
 {id:'connection',title:'从爆红到沉淀：用户留下了吗？',origin:'接着 V1：什么构成 IP 的长期价值',evidence:'后续系列与内容更新、社群讨论、复购证据；记录渠道、日期与样本限制。',trigger:'热度回落后，对照持续购买和参与证据；二手价格或单个平台热度只作线索。',cadence:'每月研究回访',mode:'手动资料复核'},
 {id:'channel',title:'渠道扩张：增长质量如何？',origin:'接着 V1：渠道触达如何转为长期经营',evidence:'分地区和线上线下收入、同店与店龄；毛利、库存周转、经营现金流及汇兑影响。',trigger:'门店扩张同时收入走弱，或库存、毛利变化与增长不匹配时，补充经营解释。',cadence:'每次业绩披露',mode:'手动资料复核'}
];
export function ensureFollowup(s){
 if(!s.followupPlan||typeof s.followupPlan!=='object')s.followupPlan={};
 const p=s.followupPlan;if(typeof p.note!=='string')p.note='下次复核先回看原研究和已纳入的讨论，再判断新证据支持或挑战了哪条假设。';
 if(!p.items||typeof p.items!=='object')p.items={};
 for(const t of followupTracks){const x=p.items[t.id];if(!x||typeof x.trigger!=='string'||typeof x.active!=='boolean')p.items[t.id]={active:true,trigger:t.trigger,cadence:t.cadence};}
 return p;
}
export function updateFollowup(s,id,field,value){const p=ensureFollowup(s);if(id==='note'){p.note=String(value);return;}
 if(!followupTracks.some(x=>x.id===id))throw Error('未知跟进项目');
 if(field==='active'){p.items[id].active=Boolean(value);if(id==='old-ip'&&!value&&s.rule.saved){s.rule.active=false;evaluate(s);}}
 else if(field==='trigger'||field==='cadence')p.items[id][field]=String(value);
 else throw Error('未知跟进字段');
}
export function saveFollowupReminder(s,rule){if(rule.active)ensureFollowup(s).items['old-ip'].active=true;return saveRule(s,rule);}
function taskReminder(s,open,fields){const r=s.rule,legacy=r.saved&&r.object==='monsters';return `<details class="task-reminder" ${open?'open':''}><summary><strong>复核安排</strong><span>${r.saved?(r.active?'已启用 · ':'已暂停 · ')+(r.object==='molly'?'MOLLY':'THE MONSTERS')+' 同比下降'+(r.threshold?'至少 '+r.threshold+'%':''):'尚未启用 · 可检查 MOLLY 收入下降'}</span><span>编辑安排</span></summary><div class="arrangement-body"><form class="followup-arrangement-form" aria-label="老 IP 复核安排"><header class="arrangement-section-head"><h4>研究复核</h4><span>自动保存</span></header>${fields}</form><form id="rule-form"><header class="arrangement-section-head"><h4>披露提醒</h4><span>保存后生效</span></header><div class="task-rule-fields"><label>检查对象${legacy?'<select name="object"><option value="monsters">THE MONSTERS · 保留的旧配置</option><option value="molly">MOLLY · 老 IP 经营</option></select>':'<input type="hidden" name="object" value="molly"><strong>MOLLY · 同期收入</strong>'}</label><label>触发条件<select name="threshold">${[0,10,30,50].map(n=>`<option value="${n}" ${Number(r.threshold)===n?'selected':''}>${n?'同比下降至少 '+n+'%':'出现同比下降'}</option>`).join('')}</select></label></div><label class="check-label"><input type="checkbox" name="active" ${r.active?'checked':''}><span>启用披露提醒，并纳入这项跟进</span></label><div class="arrangement-actions"><button class="primary" type="submit">保存这项提醒</button></div></form></div></details>`;}
const planChevron=`<svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m7 4 6 6-6 6"/></svg>`;
const planText=(value,empty)=>esc(String(value??'').trim()?value:empty);
function followupTrack(t,x,s,ruleOpen){
 const cadences=[...new Set([t.cadence,'每次业绩披露','每月研究回访','有新材料时',x.cadence].filter(Boolean))];
 const fields=`<div class="followup-fields"><label>复核条件<textarea rows="3" data-plan-id="${t.id}" data-plan-field="trigger" aria-label="${esc(t.title)}复核条件">${esc(x.trigger)}</textarea></label><label>复核节奏<select data-plan-id="${t.id}" data-plan-field="cadence" aria-label="${esc(t.title)}复核节奏">${cadences.map(c=>`<option ${x.cadence===c?'selected':''}>${esc(c)}</option>`).join('')}</select></label></div>`;
 const manual=`<details class="task-reminder manual-arrangement"><summary><strong>复核安排</strong><span>手动复核</span><span data-plan-preview-id="${t.id}" data-plan-preview="cadence">${esc(x.cadence||t.cadence)}</span><span>编辑安排</span></summary><div class="arrangement-body"><form class="followup-arrangement-form" aria-label="${esc(t.title)}复核安排"><header class="arrangement-section-head"><h4>研究复核</h4><span>自动保存</span></header>${fields}</form></div></details>`;
 return `<article class="followup-track ${x.active?'':'paused'}" data-track="${t.id}">
 <header class="future-question"><h3>${esc(t.title)}</h3><p>${esc(t.origin)}</p><label class="check-label"><input type="checkbox" data-plan-id="${t.id}" data-plan-field="active" ${x.active?'checked':''}><span class="future-active-label">纳入计划</span><span class="future-paused-label">暂不跟进</span></label></header>
 <div class="future-evidence"><h4>要补什么证据</h4><p>${esc(t.evidence)}</p></div>
 <div class="future-trigger"><h4>何时回来复核</h4><p data-plan-preview-id="${t.id}" data-plan-preview="trigger">${planText(x.trigger,'尚未填写复核条件')}</p><div class="future-trigger-meta"><span data-plan-preview-id="${t.id}" data-plan-preview="cadence">${esc(x.cadence||t.cadence)}</span><span>${t.id==='old-ip'?'可设披露提醒':'手动复核'}</span></div></div>
 ${t.id==='old-ip'?taskReminder(s,ruleOpen,fields):manual}</article>`;
}
export function followupBoard(s,{ruleOpen=false,memoriesOpen=false}={}){
 const p=ensureFollowup(s),v=latest(s),memories=[...new Map(['platform','excluding','track'].flatMap(t=>contextFor(s,t)).map(m=>[m.id,m])).values()];
 return `<section class="followup-plan" aria-label="未来持续跟进">
 <section class="future-inheritance" aria-labelledby="future-inheritance-title"><div class="future-inheritance-heading"><h3 id="future-inheritance-title">继续沿用的判断</h3><button class="text-button" data-action="home">返回当前研究</button></div><p class="future-judgment">${esc(v.summary)}</p><details class="future-memories" ${memoriesOpen?'open':''}><summary>${planChevron}<span>判断背后的讨论</span><span class="future-memory-count">${memories.length} 段已纳入上下文</span></summary>${memories.length?`<ul>${memories.map(m=>`<li><button data-action="recall" data-id="${esc(m.id)}" class="text-button"><span class="future-memory-topic">${esc((m.kind==='demo'?'案例 · ':'')+(m.topic||'研究讨论'))}</span><span>${planText(m.conclusion,m.question||'回看讨论原文')}</span><span class="future-memory-open">回看原文</span></button></li>`).join('')}</ul>`:'<p class="future-empty">暂无已纳入的相关讨论。可在讨论中确认需要沿用的要点。</p>'}</details></section>
 <section class="future-agenda" aria-labelledby="future-agenda-title"><div class="followup-section-title"><div><h3 id="future-agenda-title">待跟进事项</h3></div><span>修改自动保存到本机</span></div><div class="future-column-head" aria-hidden="true"><span>待验证的问题</span><span>要补什么证据</span><span>何时回来复核</span></div><div class="followup-tracks">${followupTracks.map(t=>followupTrack(t,p.items[t.id],s,ruleOpen)).join('')}</div></section>
 <section class="future-handoff" aria-labelledby="future-handoff-title"><div class="future-handoff-heading"><h3 id="future-handoff-title">留给下次的研究交接</h3></div><p class="future-note-preview" data-plan-preview-id="note" data-plan-preview="note">${planText(p.note,'还没有交接笔记，可记下下次研究的起点。')}</p><details class="future-editor plan-note"><summary>${planChevron}<span>编辑交接笔记</span></summary><label for="plan-note" class="sr-only">留给下次自己的研究交接</label><textarea id="plan-note" rows="3" data-plan-id="note" data-plan-field="note">${esc(p.note)}</textarea></details></section>
 </section>`;
}
