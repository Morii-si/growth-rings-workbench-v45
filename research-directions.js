import {reports,rate,share,exHead,overseas} from './research-data.js';
const interim=reports.interim,annual=reports.annual;
const ip=name=>interim.ips.find(row=>row[0]===name).slice(1);
const money=value=>(value/100000).toFixed(2);
const growth=values=>(rate(values)>=0?'+':'')+rate(values).toFixed(1)+'%';
const pair=values=>values.map(money).join(' → ')+' 亿元';
const evidencePeriod='2025 上半年 → 2026 上半年';
const task=(id,title,origin,need,why,source)=>({id,title,origin,need,why,source});
const gap='';
const follow=(title,body)=>({title,body,gap});
// Facts come only from the existing case dataset. Prior discussion and prior
// financial evidence are separate provenance types, never invented chat turns.
export const roomDirections=[
 {
  id:'molly',title:'MOLLY 的持续经营',category:'carry',
  trigger:'半年报触发复核：MOLLY 同期收入回落。',
  previous:'V2 留下的问题：一年增长能否持续，还需核对后续同口径表现与产品节奏。',
  evidence:`MOLLY 收入 ${pair(ip('MOLLY'))}，同比 ${growth(ip('MOLLY'))}。`,
  question:'MOLLY 回落，会改变上次的看法吗？',
  prompts:['这会改变 V2 的判断吗？','先拆开产品节奏和需求变化','还缺哪些关键证据？'],
  memoryId:'demo-old-ip',memoryLabel:'V2 · MOLLY 持续经营讨论',anchor:'ip-row-MOLLY',page:interim.pages.ip,evidencePeriod,
  responses:[
   follow('V2 的结论边界仍需保留','V2 只把 MOLLY 全年增长视作一期正向证据，未确认长期增长。本期回落新增了一期反向表现，需要继续检查；单期收入变化仍不足以认定长期衰退。'),
   follow('供给节奏与持续需求分别核对','产品节奏变化要查上新、补货和可售时间；需求变化要查同渠道持续销售与复购。现有收入总额同时兼容两种解释，还不能选定原因。'),
   follow('先补两年同期的供给与销售记录','把 MOLLY 上新、补货与可售时间按两年同期排列，再补同渠道持续销售和复购。若只研究国内，应先拿到国内收入拆分，整体降幅不能替代国内结论。')
  ]
 },
 {
  id:'monster',title:'头部依赖与收入结构',category:'carry',
  trigger:'半年报触发复核：THE MONSTERS 收入下降，头部占比也下降。',
  previous:'V2 已要求同时跟踪头部占比和扣除头部后的收入，避免把两者混成一个判断。',
  evidence:`THE MONSTERS 收入 ${pair(ip('THE MONSTERS'))}，同比 ${growth(ip('THE MONSTERS'))}；收入占比 ${share(ip('THE MONSTERS')[0],interim.revenue[0]).toFixed(1)}% → ${share(ip('THE MONSTERS')[1],interim.revenue[1]).toFixed(1)}%。其余收入同比 ${growth(exHead(interim))}。`,
  question:'头部占比下降，能说明依赖变小了吗？',
  prompts:['占比下降具体由什么带来？','其余 IP 的增长集中在哪里？','这会改变 V2 的跟踪方式吗？'],
  memoryId:'demo-concentration',memoryLabel:'V2 · 收入结构讨论',anchor:'ip-row-THE MONSTERS',page:interim.pages.ip,evidencePeriod,
  summary:'头部占比下降同时包含 THE MONSTERS 回落与其余收入增长，增长分布和持续性仍待核对。',
  responses:[
   follow('同时看头部收入与其余收入','THE MONSTERS 收入下降会压低占比，其余收入增长也会压低占比。因此，占比下降不能单独证明头部风险已消退，需要同步看两组收入与后续持续性。'),
   follow('检查是否形成新的集中','现有 IP 表中，星星人明显放量，CRYBABY、DIMOO、SKULLPANDA 与 HIRONO 也有增长。下一步逐项计算对增量的贡献，检查增长是否主要由少数 IP 驱动。'),
   follow('延续双指标，再补增长贡献','继续同时保留头部占比和扣除头部后的收入；新增各 IP 的收入增量贡献与多期表现，区分结构变化与某一头部短期回落。')
  ],
  tasks:[task('contribution','拆解各 IP 的收入增量贡献','接续 V2：头部与其余收入同时观察','按现有同期 IP 表计算收入增量，再核对后续同口径表现。','区分多个 IP 共同增长与新的少数 IP 集中。','已有半年报 IP 收入表；后续期间待披露。'),task('head-demand','核对 THE MONSTERS 回落原因','半年报新增：头部收入回落','补上新、补货、渠道供给和持续需求记录。','收入与占比变化尚不能解释供给和需求的影响。','需要产品、渠道和用户记录；当前未接入。')]
 },
 {
  id:'stars',title:'星星人放量与新 IP 接续',category:'new',
  trigger:'半年报新线索：星星人收入显著放量，值得单独追问增长来源。',
  previous:'V2 留有新 IP 能否接续的框架；全年 IP 表已包含星星人，本期放量不等于首次孵化成功。',
  evidence:`Twinkle Twinkle（星星人）收入 ${pair(ip('Twinkle Twinkle'))}，同比 ${growth(ip('Twinkle Twinkle'))}。`,
  question:'星星人的增长，能证明新 IP 可重复接续吗？',
  prompts:['这能算新孵化成功吗？','如何区分放量与可重复接续？','先建什么样的观察表？'],
  memoryId:'demo-platform',memoryLabel:'V2 · 新 IP 接续与平台能力讨论',baseline:'2025 全年 IP 收入表已包含 Twinkle Twinkle（星星人）。',baselinePage:annual.pages.ip,anchor:'ip-row-星星人',page:interim.pages.ip,evidencePeriod,
  summary:'星星人放量补充已有 IP 商业化证据；可重复接续仍需固定批次、投入与失败项目。',
  responses:[
   follow('已有 IP 放量先记录为商业化进展','2025 全年 IP 表已经包含星星人。本期增长说明收入规模扩大，不能据此确定它是本期新孵化的 IP，也无法得出孵化成功率。'),
   follow('接续能力需要包含未成功的项目','应固定首次推出时间相近的一批 IP，记录投入、推出时间、收入与失败或退出项目。只观察成功 IP 会遗漏分母。'),
   follow('按首次推出批次保留完整样本','观察表至少包含 IP 名称、首次合作或推出时间、投入、分期收入、状态与失败项目。现有 IP 收入表提供部分收入证据，其余字段待补。')
  ],
  tasks:[task('ip-cohort','建立固定批次 IP 观察表','半年报新增：放量能否形成接续','补首次合作或推出时间、投入、后续收入与失败项目。','区分已有 IP 放量与新孵化，避免只看成功样本。','已有 IP 收入表；批次、投入和失败记录未提供。'),task('stars-sustain','追踪星星人后续同口径表现','半年报新增：检验放量持续性','继续跟踪同期间收入，并补渠道、品类和上新记录。','一期放量不足以确认长期需求或连续接续。','后续财报、产品和渠道记录待补。')]
 },
 {
  id:'overseas',title:'国内外增长与渠道分化',category:'new',
  trigger:'半年报新线索：中国增长与海外回落同时出现，美洲渠道表现分化。',
  previous:'V2 财务看板记录过海外扩张；现有保存讨论没有形成渠道专项结论。',
  evidence:`中国收入同比 ${growth(interim.regions[0].slice(1))}；海外合计同比 ${growth(overseas(interim))}。美洲零售店收入 +22.5%，线上 −45.6%。`,
  question:'海外回落，主要发生在哪些渠道？',
  prompts:['海外总额下降能说明门店变弱吗？','先拆地区还是先拆渠道？','国内增长能补上哪些证据？'],
  baseline:'V2 全年看板提示：海外增长仍需区分开店扩张与原有门店改善。',baselinePage:annual.pages.region,anchor:'module-地区表现',page:interim.pages.region,evidencePeriod,
  summary:'国内外和美洲渠道表现分化；区域总额尚不能回答单店经营或终端需求是否改善。',
  responses:[
   follow('区域总额无法替代单店判断','美洲零售店收入增长与线上收入下降同时出现。零售店增长还可能来自门店数增加，需补同店、店数与店龄，才能判断原有门店变化。'),
   follow('先定位地区，再在同地区拆渠道','先比较各地区的收入增量，再在变化明显的地区拆零售店和线上。对门店进一步补开关店与同店数据，避免把渠道迁移当成整体需求变化。'),
   follow('国内增长与海外问题分别留证据','国内增长补充经营表现，但不能解释海外回落原因。应分别保留地区增长驱动，再检查产品结构、渠道和店龄是否可比。')
  ],
  tasks:[task('channel','补地区与渠道的可比经营数据','半年报新增：地区和渠道表现分化','按地区补零售店、线上、门店数、开关店和同店收入。','区分开店扩张、渠道迁移与原有经营改善。','已有地区收入及美洲渠道变化；同店和店龄数据待补。'),task('region-mix','检查地区增长的产品与 IP 结构','接续 V2 看板：区分扩张与经营改善','补主要地区的品类、IP 和上新节奏，核对两年口径。','不同产品结构可能影响地区比较，当前不能直接归因。','需要地区与产品交叉拆分；当前未提供。')]
 },
 {
  id:'margin',title:'利润放缓与汇兑影响',category:'new',
  trigger:'半年报新线索：利润增长慢于收入，汇兑由收益转为损失。',
  previous:'V2 财务看板记录过毛利率改善；现有保存讨论没有拆解本期经营与汇兑影响。',
  evidence:`收入同比 ${growth(interim.revenue)}，归母净利润同比 ${growth(interim.profit)}；汇兑由收益 ${money(interim.fx[0])} 亿元转为损失 ${money(-interim.fx[1])} 亿元。`,
  question:'利润增速放缓，有多少来自经营变化？',
  prompts:['能把利润放缓都归因于汇兑吗？','先看哪几项经营变化？','如何避免净利润口径混淆？'],
  baseline:'V2 全年看板记录毛利率改善，并要求继续核查增长质量。',baselinePage:annual.pages.quality,anchor:'module-盈利与经营质量',page:interim.pages.quality,evidencePeriod,
  summary:'汇兑是利润变化的一条解释线索，经营毛利和费用贡献仍需进一步拆分。',
  responses:[
   follow('汇兑变化不足以解释完整利润桥','现有材料确认汇兑由收益转为损失，但利润还受毛利、费用、税项等影响。逐项搭建利润变动桥才能看各项贡献，当前不能全部归因于汇兑。'),
   follow('统一口径，再拆毛利和费用','从同期收入、毛利和归母净利润出发，补销售、管理等费用，再单列汇兑和税项。地区与品类结构只是可能的解释，不能直接当成原因。'),
   follow('归母利润与集团利润分别保留','当前案例同时有归母净利润和集团利润。拆利润变动应固定一个口径；现金转化使用集团利润时也须标清，避免直接混用。')
  ],
  tasks:[task('profit-bridge','建立同口径利润变动桥','半年报新增：利润增速落后于收入','拆收入、毛利、经营费用、汇兑、税项和归母净利润。','量化贡献后才可区分经营变化与汇兑影响。','已有收入、毛利、利润和汇兑；费用与税项拆分待补。'),task('margin-mix','核对毛利和费用的结构线索','接续 V2 看板：检查增长质量','补地区、品类毛利及经营费用变化，核对比较口径。','收入结构变化不等于已经确认毛利变化原因。','需要经营说明及补充分部数据；当前拆分不足。')]
 },
 {
  id:'cash',title:'利润如何转化为现金',category:'new',
  trigger:'半年报新线索：经营现金流低于本期集团利润。',
  previous:'V2 平台能力判断仍开放；现有保存讨论没有形成现金转化专项结论。',
  evidence:`本期经营现金流 ${money(interim.operatingCash)} 亿元，集团利润 ${money(interim.groupProfit)} 亿元，简单比值 ${(interim.operatingCash/interim.groupProfit*100).toFixed(1)}%。这是本期对照，未作同比。`,
  question:'利润增长后，现金回收跟上了吗？',
  prompts:['这说明利润质量已经恶化吗？','现金差额先检查哪里？','下期用什么口径继续跟踪？'],
  anchor:'module-盈利与经营质量',page:interim.pages.quality,evidencePeriod:'2026 上半年经营现金流与集团利润对照',
  summary:'经营现金流低于集团利润；差额原因和持续性需通过营运资金、非现金项目及多期数据核对。',
  responses:[
   follow('本期差额先作为查证线索','经营现金流与集团利润的确认时间和口径不同。本期简单比值低于 100% 还不能直接认定利润质量恶化，应补营运资金、非现金调整和多期比较。'),
   follow('核对利润到经营现金流的调节','检查存货、应收、应付等营运资金变动，再核对非现金损益与其他调整。库存增加可能占用现金，现有数据尚不足以确认其解释了多少差额。'),
   follow('固定集团利润口径，补多期比较','继续使用集团利润与经营现金流对照，标出期间和口径。补上年同期、全年和下一期数据，区分季节性和持续变化。')
  ],
  tasks:[task('cash-bridge','核对利润到经营现金流的调节','半年报新增：检查现金转化','补存货、应收、应付、非现金项目等调节明细。','解释利润与现金流差额，避免仅凭简单比值定性。','已有本期经营现金流与集团利润；调节明细待补。'),task('cash-periods','补经营现金流多期同口径比较','半年报新增：检验差额是否持续','补上年同期及后续期间现金流、集团利润与营运资金变化。','区分季节性备货、付款节奏和持续现金回收问题。','需要其他期间现金流量表；当前案例未齐备。')]
 },
 {
  id:'inventory',title:'库存与周转速度',category:'new',
  trigger:'半年报新线索：库存周转天数同比增加，库存余额也上升。',
  previous:'V2 全年看板已记录库存增长，未因此确认滞销；本轮增加同期周转变慢的证据。',
  evidence:`存货周转天数 ${interim.days[0]} → ${interim.days[1]} 天（两年上半年）；库存 ${pair(interim.inventoryYoY)}（2025 年中 → 2026 年中）。`,
  question:'库存增加，是备货还是销售消化变慢？',
  prompts:['周转变慢可以直接判定滞销吗？','如何把备货和消化变慢分开？','比较库存时要注意什么？'],
  baseline:'V2 全年看板记录库存增长与毛利率改善同时出现，要求继续核查增长质量。',baselinePage:annual.pages.quality,anchor:'module-盈利与经营质量',page:interim.pages.quality,evidencePeriod:'周转：2025 上半年 → 2026 上半年；余额：2025 年中 → 2026 年中',
  summary:'同期库存余额和周转天数均上升，备货、产品结构与销售消化的贡献仍需拆分。',
  responses:[
   follow('周转变慢需要进一步拆解','库存余额和周转天数变化提示需要核查，无法单独确定滞销。备货时点、在途库存、产品结构与销售消化都可能影响结果，当前材料缺少拆分。'),
   follow('按品类、地区和库龄核对进销存','补采购到货、销售、在途和渠道库存，检查是否集中在特定品类、IP 或地区，再看库龄和跌价准备。用上新和补货计划检验备货解释。'),
   follow('余额时点与周转期间分别标清','库存余额要区分年末到年中和两年年中的比较；周转天数使用两年同期。本方向保留两年年中余额，避免把半年环比余额与同比周转混为同一变化。')
  ],
  tasks:[task('stock-aging','拆分库存结构、库龄与在途','半年报新增：周转速度变慢','按品类、IP 和地区补库存、库龄、在途与跌价准备。','确认增加集中在哪里，再核对是否符合备货计划。','已有余额与周转天数；结构和库龄待补。'),task('sell-through','核对备货与销售消化节奏','接续 V2 看板：检查库存增长质量','补同期间进货、销售、渠道库存及上新和补货安排。','分别检查计划备货、渠道压货与终端消化。','需要产品、供应链和渠道记录；当前未接入。')]
 },
 {
  id:'platform',title:'平台能力能否跨周期',category:'carry',
  trigger:'V2 长期问题继续开放：半年报增加了方向不一的经营证据。',
  previous:'V2 明确将已有 IP 持续经营与新 IP 接续分别验证，尚未确认跨周期能力。',
  evidence:`本期同时出现 MOLLY 同比 ${growth(ip('MOLLY'))}、星星人同比 ${growth(ip('Twinkle Twinkle'))}；单个 IP 单期变化不构成平台整体结论。`,
  question:'这轮新证据，对平台能力判断意味着什么？',
  prompts:['哪条旧假设受到了新证据影响？','什么证据才足以改变平台判断？','这些证据合起来，怎样理解平台能力？'],
  memoryId:'demo-platform',memoryLabel:'V2 · 平台能力讨论',anchor:'module-IP 收入全景',page:interim.pages.ip,evidencePeriod,
  summary:'跨周期判断继续开放；分别补老 IP 生命周期、新 IP 固定批次与经营质量证据。',
  responses:[
   follow('分别回到两条原假设','MOLLY 回落给老 IP 持续经营增加一期待解释表现；星星人放量补充商业化证据，尚未证明新孵化可重复。两者不能抵消后直接得出平台结论。'),
   follow('需要跨 IP、批次与期间的证据','老 IP 需多期同口径表现与用户关系；新 IP 需固定批次的投入、成功和失败记录。再检查能否稳定转化为现金和回报，逐步收窄跨周期判断。'),
   follow('把经营表现与平台能力分开判断','老 IP 的持续需求、新 IP 的批次表现，以及库存和现金转化，分别回答持续经营、可重复接续与经营质量的问题。这些证据尚未共同指向稳定的跨周期能力；后续讨论应保留各自来源和判断边界。')
  ],
  tasks:[task('lifecycle','建立老 IP 多期生命周期记录','接续 V2：已有 IP 的持续经营','保留各老 IP 同期收入、产品节奏与持续购买证据。','单个 IP 单期起落不足以判断整个平台。','已有单期财报证据；生命周期与用户数据待积累。'),task('repeatability','建立新 IP 接续与经营质量记录','接续 V2：新 IP 接续与跨周期能力','连接固定批次投入和成败记录，与现金、库存等证据。','持续接续与持续回报需要分别验证。','批次、投入、失败及多期经营数据未齐备。')]
 }
];
export const directionById=id=>roomDirections.find(item=>item.id===id)||roomDirections[0];
