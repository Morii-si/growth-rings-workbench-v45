import {versionNumber} from './engine.js';
import {SOURCE,visibleSources,latest} from './engine.js';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function boardHeading(s,ui,v){
 const title=ui.future?'未来待跟进':ui.dataUpdate?'V3 · 2026年半年报更新':v.id===1?'V1 · 初始研究':`V${versionNumber(v.id)} · ${v.id===2?'2025年业绩更新':v.label}`;
 const description=ui.future?'':ui.dataUpdate?'2026.08.20':v.id===1?'2026.02':v.date;
 const status=ui.future?'待办事项':ui.dataUpdate?'新材料':v.id===1?'建立假设':'判断快照';
 return `<header class="board-heading ${ui.future?'is-future':ui.dataUpdate?'is-update':''}"><div><h2>${esc(title)}</h2>${description?`<p>${esc(description)}</p>`:''}</div><span>${status}</span></header>`;
}
export function boardSources(s,ui){
 if(ui.future)return '';
 const available=visibleSources(s,ui.future||ui.dataUpdate?null:ui.history);
 const items=[{title:'IP 产业链研究',issuer:'研究参考材料',date:'2025.08',use:'IP 价值、生命周期、产业链框架；案例讨论为演示编排。',action:'source-original'}];
 items.push({title:'2023 中期业绩公告',issuer:'泡泡玛特 · 港交所',date:'2023.08.22',use:'p.25：艺术家 IP 与授权 IP 的分类定义。',url:'https://www1.hkexnews.hk/listedco/listconews/sehk/2023/0822/2023082200678.pdf#page=25'});
 if(available.includes('annual'))items.push({title:SOURCE.annual.name,issuer:'泡泡玛特 · 港交所',date:SOURCE.annual.date,use:'p.1、27、33–38：利润、IP、地区、品类与经营质量。',url:SOURCE.annual.url});
 if(available.includes('interim')){
  items.push({title:SOURCE.interim.name,issuer:'泡泡玛特 · 港交所',date:SOURCE.interim.date,use:'p.1、24、28、30–35：半年报及渠道、汇兑、现金流。',url:SOURCE.interim.url});
  items.push({title:'2025 中期业绩公告',issuer:'泡泡玛特 · 港交所',date:'2025.08.19',use:'p.4、32：上年同期库存与周转天数，用于同比核对。',url:'https://www1.hkexnews.hk/listedco/listconews/sehk/2025/0819/2025081900627_c.pdf'});
 }
 return `<section class="board-sources" aria-label="本页资料来源"><header><h2>${ui.future?'跟进事项的现有依据':'本页资料来源'}</h2></header><ol>${items.map(x=>`<li><div>${x.url?`<a href="${x.url}" target="_blank" rel="noopener noreferrer">${esc(x.title)} ↗</a>`:`<button class="text-button" data-action="${x.action}">${esc(x.title)} · 查看摘录</button>`}<small>${esc(x.issuer)} · ${x.date}</small></div><p>${esc(x.use)}</p></li>`).join('')}</ol><p class="sources-boundary">讨论原文与资料来源分别保留；看板中的推断和待验证问题不代表公告结论。</p></section>`;
}
