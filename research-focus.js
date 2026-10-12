import {DATA, SOURCE, growth, excluding} from './engine.js';
import {memoriesAt} from './research-memory.js';
import {savedReturn,returnEditorHTML} from './research-return.js';
import {dialogueHTML} from './research-dialogue.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arrow='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>';
const topics=[{id:'old',name:'老 IP 的生命力',origin:'origin-lifecycle',annual:'demo-old-ip'}, {id:'new',name:'新 IP 的接续',origin:'origin-operation',annual:'demo-concentration'}, {id:'platform',name:'平台的跨周期能力',origin:'origin-platform',annual:'demo-platform'}];
const content={
 old:{
  1:{title:'热度退去以后，\n一个 IP 还能留下什么？',description:'从产品、内容和用户关系出发，留下一个需要持续回答的问题。',evidence:'需要观察已有 IP 的长期运营，积累多期经营证据。',next:'接下来，哪些产品和用户证据能帮助我们判断老 IP 的生命力？',hint:'先留下要验证的问题',status:'建立观察线索'},
  2:{title:'MOLLY 又增长了，\n这就能说明长久吗？',description:'初始讨论提醒过：热度与长期价值要分开看。现在，经营数据补上了一期证据。',evidence:'MOLLY 2025 全年收入同比增长 38.4%。一期增长支持继续观察，尚不足以证明生命周期。',next:'这次增长来自哪些产品与渠道？下次披露，应该继续检查什么？',hint:'把增长放回原来的问题里',status:'补上一期增长证据'},
  3:{title:'上次还在增长，\n这次为什么回落？',description:'MOLLY 的新变化，接上了我们上次没聊完的问题：老 IP 的持续需求，到底有多强？',evidence:'MOLLY 2026 上半年收入同比下降 33.6%；需要区分产品节奏变化与持续需求减弱。',next:'收入回落与新品推出节奏是否有关？还需要哪些证据来区分产品节奏变化与持续需求减弱？',hint:'先查产品节奏，再看持续需求',status:'出现需要追问的变化'}
 },
 new:{
  1:{title:'一个爆款之后，\n下一个从哪里来？',description:'把目光从单个热门角色移开，研究平台能否持续发现和经营更多 IP。',evidence:'持续接续需要同时观察头部之外的商业化、投入，以及失败项目。',next:'要验证新 IP 的接续能力，我们应该跟踪哪些 IP 批次、投入与失败项目？',hint:'先定义怎么验证接续能力',status:'建立观察线索'},
  2:{title:'拿掉最大爆款，\n还看得到增长吗？',description:'沿着初始研究的问题，拆开总收入，看头部之外的商业化进展。',evidence:'扣除 THE MONSTERS，其余收入同比增长 129.7%；收入增长与集中度上升可以同时发生。',next:'其余收入的增长由谁贡献？哪些是老 IP 放量，哪些能支持新 IP 接续？',hint:'把总量增长拆开看',status:'头部之外也有增长'},
  3:{title:'星星人放量了，\n能说明接续能力吗？',description:'上次已经看到头部之外的增长。这次再往前一步：区分已有 IP 放量与可重复的新 IP 孵化。',evidence:'星星人本期收入同比增长 580.6%；存量 IP 放量不能直接证明新 IP 孵化成功。',next:'星星人的增长属于存量放量还是新孵化成果？还需要哪些固定批次、投入与失败项目的数据？',hint:'分清放量与孵化',status:'追查增长从哪里来'}
 },
 platform:{
  1:{title:'做成一个爆款，\n离一个平台还有多远？',description:'先把两种能力分开：新 IP 能接上，老 IP 能经营得久。',evidence:'多元 IP 池可能增强跨周期能力，目前仍作为研究假设保留。',next:'应该分别用哪些长期证据，检验新 IP 接续与老 IP 经营能力？',hint:'把平台假设拆成可验证的问题',status:'保留研究假设'},
  2:{title:'增长已经发生，\n跨周期仍要继续看。',description:'这轮材料带来了商业化证据，也让原来的验证边界更清楚。',evidence:'多 IP 商业化已有进展；单年增长不足以回答 IP 的长期生命力。',next:'下一轮需要补充哪些多期经营证据，才能推进跨周期能力的判断？',hint:'明确还缺哪一块证据',status:'假设继续开放'},
  3:{title:'有增长，也有回落。\n平台能力该怎么看？',description:'把新 IP 接续、老 IP 经营和渠道质量放在一起核对，继续保留判断的边界。',evidence:'海外渠道表现分化、库存周转变慢；跨周期回报仍待验证。',next:'收入结构与经营质量的变化，分别影响哪条原有假设？下一轮最该补什么证据？',hint:'一起核对增长与经营质量',status:'多条证据需要一起看'}
 }
};

export function focusModel(s,ui,v){
 const topic=topics.find(t=>t.id===ui.focusTopic)||topics[0];
 const stage=ui.dataUpdate?3:v.id===1?1:2;
 const m=memoriesAt(s,v).find(m=>m.id===(stage===3?topic.annual:topic.origin));
 const data=content[topic.id][stage];
 const values=topic.id==='old'?(stage===3?DATA.interim.molly:stage===2?DATA.annual.molly:null):topic.id==='new'?(stage===3?DATA.interim.twinkle:stage===2?excluding:null):null;
 return {...data,topic,stage,m,values,source:stage===1?null:SOURCE[stage===3?'interim':'annual'],period:stage===3?'2025 上半年 → 2026 上半年':'2024 全年 → 2025 全年',subject:topic.id==='old'?'MOLLY':stage===3?'星星人':'扣除 THE MONSTERS 的其余收入'};
}

function memoryTakeaway(f){
 const phrases={'demo-old-ip':'但一年增长还不足以证明生命周期，需要接着看后续同口径表现与产品节奏。','demo-platform':'只有持续的多期证据，才能进一步讨论跨周期。','origin-lifecycle':'需要看后续产品、内容和社群能否留下持续购买的用户。'};
 const phrase=phrases[f.m?.id];return phrase&&f.m.answer.includes(phrase)?phrase:f.m?.conclusion||'请从历史讨论核对原文。';
}
function relevance(f){
 if(f.stage===1)return '这是这条研究线索的起点。继续提问时带上原话，保留当时的问题与判断边界。';
 if(f.topic.id==='old')return f.stage===3?'上次明确还要看后续表现与产品节奏。这次收入回落，正好需要继续检查这些证据，暂时还不足以认定长期衰退。':'初始讨论提醒过，热度与长期价值要分开看。这一期收入增长，需要放回这个观察范围里理解。';
 if(f.topic.id==='new')return '此前讨论一直在区分单个爆款与持续接续。这次带上它，是为了继续检查头部之外的增长到底由谁贡献。';
 return '此前把老 IP 经营与新 IP 接续分开验证。这次的新材料，需要对应到各自的假设，避免用单个变化概括整个平台。';
}
export function researchFocus(s,ui,v){
 if(ui.future||(!ui.dataUpdate&&v.id>2))return '';
 const f=focusModel(s,ui,v),saved=savedReturn(s,f.topic.id,f.stage);
 const composer=s.returnComposers?.[f.topic.id+'-'+f.stage];
 const actions=ui.returnEditor&&composer?returnEditorHTML(f,saved,composer):`<div class="focus-action-row"><button class="focus-start" data-rw="focus-start">${s.roundDraft?'继续未完成的提问':f.stage===1?'带着原讨论，接着问':'带上这两份材料提问'}${arrow}</button>${saved?'':`<button class="focus-later" data-rw="return-edit" title="保存问题与材料，选择什么时候回来">${composer?'继续填写跟进问题':'留到下次研究'} ${arrow}</button>`}</div><small>${f.stage===1?'引用原讨论，可查看或移除':'只带这一段旧讨论与本期证据，可查看或移除'}</small>${saved?`<div class="focus-kept"><span>${saved.done?'已跟进':'已留到下次'} · ${esc(saved.when)}</span><p>${esc(saved.question)}</p><button data-action="future">查看跟进</button><button data-rw="return-edit">修改</button></div>`:''}`;
 return `<section class="research-focus" aria-label="接着上次研究" id="research-focus">
 <div class="focus-topics" role="group" aria-label="选择研究线索">${topics.map(t=>`<button type="button" data-action="focus-${t.id}" aria-pressed="${t.id===f.topic.id}"><span>${esc(t.name)}</span><small>${esc(content[t.id][f.stage].status)}</small></button>`).join('')}</div>
 <div class="focus-spread"><div class="focus-lead">${dialogueHTML(s,f)}<details class="dialogue-tools" ${ui.returnEditor||saved?'open':''}><summary>整理提问与安排下次研究</summary><div class="focus-next">${actions}</div></details></div>
 <div class="focus-context"><div class="focus-memory"><header><strong>${f.stage===1?'从这段讨论出发':'上次，问题停在这里'}</strong><span>${f.stage===3?'V2 · 2026.03.25':'V1 · 2026.02'}</span></header><blockquote>${esc(f.m?.question||'原讨论暂未找到')}</blockquote><p class="focus-memory-takeaway">${esc(memoryTakeaway(f))}</p><div class="focus-memory-actions">${f.m?`<button data-action="recall" data-id="${esc(f.m.id)}">回到这段讨论 ${arrow}</button>`:''}<details class="focus-relevance"><summary>为什么带上这段？</summary><p>${esc(relevance(f))}</p></details></div></div>
 <div class="focus-evidence" data-annotation-anchor="focus-${f.topic.id}-${f.stage}"><header><strong>${f.stage===1?'留到后续验证':'这次，新的变化是'}</strong><span>${f.stage===1?'研究线索':f.stage===2?'2025 全年':'2026 上半年'}</span></header>${f.values?`<div class="focus-amounts"><span>${esc(f.subject)}</span><div><strong>${(f.values[0]/100000).toFixed(2)}</strong>${arrow}<strong>${(f.values[1]/100000).toFixed(2)}</strong><small>亿元</small><b>${growth(f.values)>0?'+':''}${growth(f.values).toFixed(1)}% 同比</b></div><small>${esc(f.period)} · 同期比较</small></div>`:''}<p>${esc(f.evidence)}</p>${f.source?`<div class="focus-evidence-actions"><a href="${f.source.url}" target="_blank" rel="noopener noreferrer">核对公告原文 ↗</a><button data-rw="focus-current">只问这份材料 →</button></div>`:''}</div></div></div>
 <div class="focus-foot"><p>对话会按研究线索保存在本机，切换轮次后仍可回来接着聊。</p><button data-action="focus-board">${f.stage===1?'查看完整初始研究':'查看完整证据看板'}${arrow}</button></div></section>`;
}

export function focusDraft(s,ui,v,context){
 const f=focusModel(s,ui,v),refs=[];
 if(f.stage===3)context={key:'update:2:interim',stage:'update',versionId:2,report:'interim',label:'V3 · 2026年半年报'};
 else if(f.stage===2)context={key:'version:2:annual',stage:'version',versionId:2,report:'annual',label:'V2 · 2025年业绩研究'};
 if(f.m){const c={key:'version:1:original',stage:'version',versionId:1,report:'original',label:'V1 · 初始研究'};if(f.stage===3)Object.assign(c,{key:'version:2:annual',versionId:2,report:'annual',label:'V2 · 2025 年业绩研究'});
  refs.push({id:'discussion-'+f.m.id,kind:'discussion',discussionId:f.m.id,context:c,label:c.label+' · '+f.m.topic,excerpt:f.m.conclusion,text:'研究者：'+f.m.question+'\n\nAI 案例回复：'+f.m.answer+'\n\n当时留下的判断：'+f.m.conclusion,...(SOURCE[f.m.source]?{source:structuredClone(SOURCE[f.m.source])}:{})});
 }
 if(f.stage>1)refs.push({id:'focus-'+f.topic.id+'-'+f.stage,kind:'board',context:structuredClone(context),anchor:'focus-'+f.topic.id+'-'+f.stage,label:context.label+' · '+f.topic.name,excerpt:f.evidence,text:(f.values?f.subject+'；人民币 · 亿元；'+f.period+'；'+(f.values[0]/100000).toFixed(2)+' → '+(f.values[1]/100000).toFixed(2)+'；同比 '+growth(f.values).toFixed(1)+'%。\n':'')+f.evidence,source:structuredClone(f.source)});
 return {references:refs,text:f.next};
}
