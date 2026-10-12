export const chatEscape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Body HTML is authored by the caller; all user/source text must be escaped first.
export function aiMessage(body,{note='',className=''}={}){return `<article class="gr-message gr-ai conversation-turn speaker-assistant ${className}"><header class="gr-speaker speaker-label"><img class="gr-avatar" src="assets/growth-rings-favicon.svg" alt=""><span>助手</span>${note?`<small>${chatEscape(note)}</small>`:''}</header><div class="gr-message-body utterance-body">${body}</div></article>`;}
export function userMessage(text,{label='你',className=''}={}){return `<article class="gr-message gr-user conversation-turn speaker-user ${className}"><header class="gr-speaker speaker-label">${chatEscape(label)}</header><div class="gr-message-body utterance-body">${chatEscape(text)}</div></article>`;}
export function messageParagraphs(text){return String(text??'').split(/\n\n+/).map(p=>`<p>${chatEscape(p)}</p>`).join('');}
// Emphasis only decorates authored answers. Preserve the complete message snapshot.
export function researchAnswer(text){
 let html=messageParagraphs(text);
 for(const phrase of ['还不能证明老 IP 能长期经营','同比下降了 33.6%','产品推出节奏变化，还是需求走弱','上新、补货与持续销售','国内渠道','缺少','同口径']){
  const safe=chatEscape(phrase);html=html.split(safe).join(`<mark>${safe}</mark>`);
 }
 return html;
}
