// Source values in RMB thousand. Comparisons always use the same reporting period.
export const reports = {
 annual: {
  title:'2025 全年',prior:'2024 全年',published:'2026-03-25',pages:{ip:33,region:27,product:34,quality:38},
  revenue:[13037749,37120052],gross:[8707765,26764916],profit:[3125473,12775689],adjusted:[3403162,13083646],
  ips:[['THE MONSTERS',3040664,14161064],['SKULLPANDA',1308262,3539542],['CRYBABY',1164885,2929006],['MOLLY',2093172,2897084],['DIMOO',909561,2776695],['Twinkle Twinkle',120788,2055580],['HIRONO',726525,1735235],['HACIPUPU',224288,848021],['其他艺术家 IP',1532703,2464023],['授权 IP',1600658,3381994],['外采及其他',316243,331808]],
  regions:[['中国',8886483,20851717],['亚太',3109700,8011027],['美洲',802219,6806189],['欧洲及其他',239347,1451119]],
  products:[['毛绒',2832078,18708074],['手办',6936087,12022569],['其他（含 MEGA）',3269584,6389409]],
  inventory:[1524521,5472839],inventoryDates:['2024 年末','2025 年末'],days:[102,123],daysLabels:['2024 全年','2025 全年'],
  insight:'收入快速增长，多 IP 商业化有进展；THE MONSTERS 占比也在上升。增长与集中度需要同时观察。',
  geography:'海外收入增长明显，但不同地区的起点差异很大。下一步要分辨开店扩张与原有门店的经营改善。',
  quality:'毛利率改善与库存增长同时出现。公司将毛利率提升归因于海外收入占比、采购与供应链优化；需继续核查增长质量。'
 },
 interim: {
  title:'2026 上半年',prior:'2025 上半年',published:'2026-08-20',pages:{ip:30,region:24,product:31,quality:35},
  revenue:[13876276,17172921],gross:[9761064,11965740],profit:[4574368,5038384],adjusted:[4709630,5155777],
  ips:[['THE MONSTERS',4814017,4454361],['Twinkle Twinkle',389363,2649969],['CRYBABY',1218170,1632570],['DIMOO',1105135,1619217],['SKULLPANDA',1220504,1551211],['HIRONO',728420,1008855],['MOLLY',1357248,900631],['Zsiga',211256,298341],['其他艺术家 IP',1184452,1174314],['授权 IP',1524840,1771199],['外采及其他',122871,112253]],
  regions:[['中国',8282812,12200509],['亚太',2850902,2575045],['美洲',2264882,1891637],['欧洲及其他',477680,505730]],
  products:[['毛绒',6139236,9824944],['手办',5175875,5192493],['其他（含 MEGA）',2561165,2155484]],
  inventory:[5472839,6101530],inventoryDates:['2025 年末','2026 年中'],days:[83,201],daysLabels:['2025 上半年','2026 上半年'],
  inventoryYoY:[2273691,6101530],priorInterimUrl:'https://www1.hkexnews.hk/listedco/listconews/sehk/2025/0819/2025081900627_c.pdf',
  operatingCash:3637300,groupProfit:5100310,fx:[120130,-720270],
  insight:'星星人放量与 MOLLY 回落同时发生。头部占比下降也包含 THE MONSTERS 收入下降；存量 IP 放量不能直接证明新孵化的成功率。',
  geography:'中国收入同比 +47.3%，海外合计同比 −11.1%。美洲零售店收入 +22.5%、线上 −45.6%；渠道表现分化，区域总额不能代替单店判断。',
  quality:'利润增速放缓需拆开经营与汇兑影响：汇兑由上年收益 1.20 亿元转为损失 7.20 亿元。库存周转也明显变慢，需继续核查备货、销售与渠道库存。'
 }
};
export const rate = a => (a[1]/a[0]-1)*100;
export const share = (n,total)=>n/total*100;
export const exHead = r => r.revenue.map((v,i)=>v-r.ips.find(x=>x[0]==='THE MONSTERS')[i+1]);
export const overseas = r => [0,1].map(i=>r.regions.slice(1).reduce((sum,row)=>sum+row[i+1],0));
