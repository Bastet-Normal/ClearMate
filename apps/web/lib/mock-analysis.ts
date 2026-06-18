/**
 * 客户端 AI 分析引擎 v2
 *
 * 重构要点：
 * 1. 智能风险评分：上下文降权 + 组合识别 + 给出具体原因
 * 2. 个性化 key_facts：从用户描述抽取金额/时间/对方/平台
 * 3. 动态 suggested_actions：根据风险等级 + 任务类型 + 缺失信息组合
 * 4. 求助渠道库：根据任务类型附上具体号码和链接
 * 5. 维权材料模板：可一键复制
 * 6. 诈骗案例库：基于关键词匹配，附上相似案例
 */

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface AnalysisResult {
  summary: string;
  risk_level: RiskLevel;
  risk_points: string[];
  key_facts: string[];
  assumptions: string[];
  suggested_actions: string[];
  questions_to_verify: string[];
  evidence_checklist: string[];
  counter_scripts: string[];
  help_channels: Array<{ name: string; contact: string; desc: string; url?: string }>;
  templates: Array<{ title: string; content: string }>;
  scam_steps?: Array<{ step: string; explanation: string }>;
  similar_cases: Array<{ title: string; pattern: string; advice: string }>;
  disclaimer: string;
}

// ============ 风险关键词库 ============

interface RiskRule {
  keywords: string[];
  weight: number;
  reason: string;
  // 降权关键词：句子里出现这些词时降权（避免误判）
  degradeOn?: string[];
}

const RISK_RULES: RiskRule[] = [
  {
    keywords: ["验证码", "短信验证码", "动态码"],
    weight: 3,
    reason: "索要验证码是典型诈骗手法，任何机构都不会要求你提供验证码",
  },
  {
    keywords: ["保证金", "押金", "解冻金", "解冻费"],
    weight: 3,
    reason: "要求先交保证金/解冻费才能提现或领奖，是刷单诈骗、解冻诈骗的典型特征",
  },
  {
    keywords: ["刷单", "刷信誉", "做任务返现"],
    weight: 4,
    reason: "刷单本身违法，且 99% 是诈骗：先返小利让你投入，再以各种理由不退款",
  },
  {
    keywords: ["先转账", "先付款", "预付款"],
    weight: 2,
    reason: "要求先转账/付款再提供服务，资金风险高",
  },
  {
    keywords: ["高回报", "稳赚不赔", "零风险", "保本保息"],
    weight: 3,
    reason: "承诺高回报+零风险是投资诈骗的核心话术，正规投资都有风险提示",
  },
  {
    keywords: ["内部消息", "内幕", "老师带单", "导师指导"],
    weight: 3,
    reason: "声称有内幕消息/老师带单，是杀猪盘、投资诈骗的典型开场",
  },
  {
    keywords: ["客服QQ", "客服微信", "加我微信", "扫码加群"],
    weight: 3,
    reason: "要求脱离平台加微信/QQ/扫码进群，是为了规避平台监管，常见于购物诈骗",
  },
  {
    keywords: ["中奖", "免费领", "0元领", "送手机", "送红包"],
    weight: 2,
    reason: "中奖/免费领取是诈骗常见诱饵，后续通常要求付运费、交税或提供个人信息",
  },
  {
    keywords: ["点链接", "点击链接", "短链接", "陌生链接"],
    weight: 2,
    reason: "要求点击陌生链接，可能是钓鱼网站，会盗取你的账号密码或植入木马",
  },
  {
    keywords: ["身份证", "银行卡号", "密码", "CVV"],
    weight: 3,
    reason: "索要身份证号、银行卡号、密码、CVV 等敏感信息，是盗刷诈骗的前兆",
  },
  {
    keywords: ["代付", "帮付", "代下单", "代充值"],
    weight: 2,
    reason: "代付/代下单常见于虚假交易诈骗，付款后对方消失",
  },
  {
    keywords: ["花呗套现", "信用卡套现", "白条套现"],
    weight: 4,
    reason: "套现本身违法，且几乎所有'帮你套现'都是诈骗：收手续费后拉黑",
  },
  {
    keywords: ["网贷", "贷款", "下款", "放款"],
    weight: 2,
    reason: "网贷诈骗套路：声称无抵押秒下款，要求先交工本费/保证金/解冻费",
  },
  {
    keywords: ["冒充公检法", "安全账户", "涉嫌洗钱"],
    weight: 4,
    reason: "冒充公检法是高危诈骗：声称你涉嫌犯罪，要求转账到'安全账户'。公检法不会这样做",
  },
  {
    keywords: ["杀猪盘", "交友投资", "恋爱平台"],
    weight: 4,
    reason: "杀猪盘：通过恋爱交友建立信任，再诱导投资/赌博，最后血本无归",
  },
  {
    keywords: ["限时", "马上", "立即", "最后机会"],
    weight: 1,
    reason: "制造紧迫感是诈骗常用心理战术，让你来不及思考就行动",
    degradeOn: ["朋友", "家人", "同事"],
  },
  {
    keywords: ["转账", "汇款"],
    weight: 2,
    reason: "涉及转账/汇款需高度警惕：确认对方身份、核实事由、保留凭证",
    degradeOn: ["家人", "父母", "孩子", "配偶"],
  },
];

// ============ 上下文降权词 ============
// 这些词出现时，说明可能是正常场景，对相关关键词降权
const SAFE_CONTEXT_WORDS = ["朋友", "家人", "父母", "孩子", "配偶", "同事", "同学", "亲戚"];

// ============ 信息抽取 ============

function extractAmount(text: string): string | null {
  // 匹配"100元"、"1000块钱"、"5000元"、"1万"、"3.5万"
  const patterns = [
    /(\d+(?:\.\d+)?)\s*万/,
    /(\d+(?:\.\d+)?)\s*[块钱]/,
    /(\d+(?:\.\d+)?)\s*元/,
    /(\d+(?:,\d{3})*(?:\.\d+)?)\s*[块钱元]/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const num = parseFloat(m[1].replace(/,/g, ""));
      if (m[0].includes("万")) {
        return `${num}万`;
      }
      return `${num}元`;
    }
  }
  return null;
}

function extractPlatform(text: string): string | null {
  const platforms = [
    "淘宝", "天猫", "京东", "拼多多", "闲鱼", "抖音", "快手", "小红书",
    "微信", "QQ", "支付宝", "美团", "饿了么", "携程", "去哪儿",
    "58同城", "安居客", "链家", "贝壳", "转转",
  ];
  for (const p of platforms) {
    if (text.includes(p)) return p;
  }
  return null;
}

function extractTime(text: string): string | null {
  // 简单匹配"昨天""今天""上周""X月X日"
  const timeWords = ["昨天", "今天", "前天", "上周", "上个月", "去年", "刚才", "刚刚"];
  for (const t of timeWords) {
    if (text.includes(t)) return t;
  }
  const dateMatch = text.match(/(\d{1,2})月(\d{1,2})日?/);
  if (dateMatch) return `${dateMatch[1]}月${dateMatch[2]}日`;
  return null;
}

function extractContact(text: string): string | null {
  // 匹配"对方""卖家""客服""公司""商家"
  const contacts = [
    { kw: "卖家", label: "卖家" },
    { kw: "买家", label: "买家" },
    { kw: "客服", label: "客服" },
    { kw: "商家", label: "商家" },
    { kw: "对方", label: "对方" },
    { kw: "公司", label: "公司" },
    { kw: "平台", label: "平台" },
  ];
  for (const c of contacts) {
    if (text.includes(c.kw)) return c.label;
  }
  return null;
}

// ============ 风险评分 v2 ============

interface RiskAssessment {
  score: number;
  level: RiskLevel;
  hitRules: RiskRule[];
}

function assessRisk(text: string): RiskAssessment {
  let score = 0;
  const hitRules: RiskRule[] = [];

  // 检查是否有安全上下文词
  const hasSafeContext = SAFE_CONTEXT_WORDS.some((w) => text.includes(w));

  for (const rule of RISK_RULES) {
    const hit = rule.keywords.some((kw) => text.includes(kw));
    if (!hit) continue;

    // 降权逻辑：如果规则配置了 degradeOn 且文本里有降权词，降权
    let weight = rule.weight;
    if (rule.degradeOn && hasSafeContext) {
      weight = Math.max(1, rule.weight - 1);
    }

    score += weight;
    hitRules.push(rule);
  }

  // 组合识别：同时出现"加微信"+"平台外交易"权重 +2
  if (text.includes("加微信") || text.includes("加QQ")) {
    if (text.includes("私下") || text.includes("平台外") || text.includes("直接转账")) {
      score += 2;
    }
  }

  // 金额越大风险越高
  const amount = extractAmount(text);
  if (amount) {
    const num = parseFloat(amount);
    if (amount.includes("万")) {
      if (num >= 10) score += 2;
      else if (num >= 1) score += 1;
    } else if (num >= 5000) {
      score += 2;
    } else if (num >= 1000) {
      score += 1;
    }
  }

  // 评分转等级
  let level: RiskLevel = "low";
  if (score >= 7) level = "critical";
  else if (score >= 4) level = "high";
  else if (score >= 2) level = "medium";

  return { score, level, hitRules };
}

// ============ 诈骗案例库 ============

interface ScamCase {
  title: string;
  pattern: string;
  advice: string;
  matchKeywords: string[];
}

const SCAM_CASES: ScamCase[] = [
  {
    title: "刷单返利诈骗",
    pattern: "以'点赞赚钱''做任务返佣'为名，先返小额让你信任，再让你大额投入后失联",
    advice: "所有刷单都是诈骗，不要相信'先垫付后返现'的话术",
    matchKeywords: ["刷单", "做任务", "返现", "点赞赚钱"],
  },
  {
    title: "冒充客服退款诈骗",
    pattern: "冒充淘宝/京东客服，称商品质量问题要给你退款，引导你开通借呗/花呗并转账",
    advice: "平台退款不会要求你转账或开通贷款，直接挂断并在App内核实",
    matchKeywords: ["客服", "退款", "商品质量", "开通借呗", "花呗"],
  },
  {
    title: "杀猪盘诈骗",
    pattern: "通过交友软件建立恋爱关系，再诱导你到虚假投资平台'赚钱'，最后无法提现",
    advice: "网上认识的'高富帅''白富美'带你投资，99%是杀猪盘",
    matchKeywords: ["杀猪盘", "交友", "投资", "恋爱", "提现"],
  },
  {
    title: "冒充公检法诈骗",
    pattern: "自称警察/检察院，称你涉嫌洗钱/诈骗，要求你把钱转入'安全账户'配合调查",
    advice: "公检法不会通过电话办案，更没有所谓的'安全账户'，直接挂断并拨打110核实",
    matchKeywords: ["公检法", "安全账户", "涉嫌洗钱", "警察", "检察院"],
  },
  {
    title: "贷款解冻诈骗",
    pattern: "声称你贷款额度被冻结，需要交'解冻费'才能放款，交钱后对方消失",
    advice: "正规贷款不会要求先交费，所有'解冻费''工本费'都是诈骗",
    matchKeywords: ["贷款", "解冻", "解冻费", "放款", "额度"],
  },
  {
    title: "中奖诈骗",
    pattern: "通知你中奖（奖品丰厚），但需要先交'手续费''保证金'或提供银行卡信息才能领奖",
    advice: "没有参加过的抽奖都是诈骗，正规中奖不会要求先交费",
    matchKeywords: ["中奖", "免费领", "手续费", "保证金"],
  },
  {
    title: "虚假购物诈骗",
    pattern: "在二手平台或社交软件上低价售物，要求私下加微信转账，付款后不发货或拉黑",
    advice: "不要脱离平台交易，不要私下转账，价格远低于市场价的都是陷阱",
    matchKeywords: ["加微信", "私下", "低价", "转账", "不发货"],
  },
  {
    title: "冒充熟人诈骗",
    pattern: "冒充你的朋友/家人/领导，以'出事了''急需用钱'为由要求紧急转账",
    advice: "接到熟人借钱电话/信息，务必通过其他渠道核实身份，不要急于转账",
    matchKeywords: ["借钱", "急需", "转账", "出事"],
  },
];

// 诈骗套路拆解步骤（比 pattern 更详细）
const SCAM_STEPS: Record<string, string[]> = {
  "刷单返利诈骗": [
    "第1步：在群聊/朋友圈看到'点赞赚钱''做任务返佣'广告",
    "第2步：试做几单小额任务，确实收到几块钱返利",
    "第3步：对方要求下载APP、垫付大额资金做'连单任务'",
    "第4步：投入几千甚至几万后，对方以'操作失误''需要补单'为由不返款",
    "第5步：最终拉黑失联，血本无归",
  ],
  "冒充客服退款诈骗": [
    "第1步：接到自称淘宝/京东客服电话，说你买的商品有质量问题",
    "第2步：对方准确报出你的订单信息，让你信以为真",
    "第3步：说退款需要你'验证信用'，引导开通借呗/花呗",
    "第4步：以'退款通道异常'为由，让你转账到指定账户'激活'",
    "第5步：转完钱后对方消失，你不仅没退款还倒贴了转账",
  ],
  "杀猪盘诈骗": [
    "第1步：在交友软件认识'高富帅''白富美'，对方嘘寒问暖建立感情",
    "第2步：聊了一段时间后，对方'不经意'提到自己在某个平台赚钱",
    "第3步：引导你注册投资平台，先让你小额投入确实能提现",
    "第4步：你加大投入后，平台显示'盈利'但无法提现",
    "第5步：对方以'需要缴税''需要保证金'为由继续骗钱，最终失联",
  ],
  "冒充公检法诈骗": [
    "第1步：接到自称警察/检察院/法院电话，说你涉嫌洗钱/诈骗",
    "第2步：对方报出你的身份证号、姓名，让你恐慌",
    "第3步：要求你配合'资金清查'，把钱转入'安全账户'",
    "第4步：同时要求你不准告诉任何人（'案件保密'）",
    "第5步：你转完钱后才发现根本没这个案件，钱也追不回来",
  ],
  "贷款解冻诈骗": [
    "第1步：在网上搜索贷款，填写个人信息申请",
    "第2步：收到'贷款已批复'的短信/APP通知，但额度被'冻结'",
    "第3步：客服说需要交'解冻费'才能放款，几百到几千不等",
    "第4步：交完解冻费，又说需要'工本费''验证费'",
    "第5步：费用越交越多，贷款始终不放款，最终失联",
  ],
  "中奖诈骗": [
    "第1步：收到短信/邮件/电话通知你中奖（手机/电脑/大额现金）",
    "第2步：你从没参加过这个活动，但奖品很诱人",
    "第3步：对方要求先交'手续费''公证费''保证金'才能领奖",
    "第4步：或者要求提供银行卡号、身份证号'登记信息'",
    "第5步：交完费/提供信息后，要么失联，要么盗刷你的银行卡",
  ],
  "虚假购物诈骗": [
    "第1步：在闲鱼/转转/微信群看到低价商品（远低于市场价）",
    "第2步：卖家要求加微信/QQ私下沟通，'避开平台手续费'",
    "第3步：要求直接微信/支付宝转账，不支持平台担保交易",
    "第4步：付款后要么不发货，要么发假货/空包裹",
    "第5步：因为脱离平台交易，无法申请退款，对方拉黑",
  ],
  "冒充熟人诈骗": [
    "第1步：收到'朋友''家人''领导'的微信/QQ/短信",
    "第2步：对方说'出事了''急需用钱'，语气紧急",
    "第3步：可能借口：出车祸需要医药费、被拘留需要保释金",
    "第4步：要求你立刻转账，'来不及解释了'",
    "第5步：转完钱后联系真人发现根本没这回事",
  ],
};

function findSimilarCases(text: string): ScamCase[] {
  return SCAM_CASES.filter((c) =>
    c.matchKeywords.some((kw) => text.includes(kw))
  ).slice(0, 3); // 最多返回3个
}

// ============ 维权材料模板库 ============

interface Template {
  title: string;
  content: string;
}

function getTemplates(taskType: string, title: string, description: string): Template[] {
  const templates: Template[] = [];

  // 通用模板
  if (taskType === "refund_request" || taskType === "complaint") {
    templates.push({
      title: "投诉信模板",
      content: `投诉人：[你的姓名]
联系方式：[手机号]
被投诉方：[商家名称/平台名称]
投诉时间：${new Date().toLocaleDateString("zh-CN")}

投诉事由：
${description || "[详细描述事件经过，包括时间、地点、金额、对方承诺等]"}

投诉请求：
1. 要求被投诉方退还/赔偿 [金额] 元
2. 要求被投诉方书面道歉
3. 保留追究法律责任的权利

证据清单：
1. 订单截图/支付凭证
2. 商品照片/聊天记录
3. 商家承诺截图

本人保证以上所述属实，请贵部门依法处理。

投诉人签名：________
日期：${new Date().toLocaleDateString("zh-CN")}`,
    });

    templates.push({
      title: "退款申请话术",
      content: `客服你好，我在 [日期] 于 [平台/店铺] 购买了 [商品名称]，订单号 [订单号]。

现申请退款，原因如下：
${description || "[说明退款原因]"}

根据《消费者权益保护法》第二十五条，我有权自收到商品之日起七日内退货。

请贵方在 3 个工作日内处理，否则我将：
1. 向 12315 投诉
2. 向支付平台申请拒付
3. 通过法律途径维权

期待你的积极处理。`,
    });
  }

  if (taskType === "scam_check") {
    templates.push({
      title: "报警描述模板",
      content: `报警时间：${new Date().toLocaleString("zh-CN")}
报警人：[你的姓名]
联系电话：[手机号]

被骗经过：
${description || "[详细描述被骗经过]"}

损失金额：[金额] 元
对方账号：[对方银行卡/支付宝/微信账号]
对方联系方式：[对方手机号/QQ/微信]

证据材料：
1. 聊天记录截图
2. 转账凭证
3. 对方账号信息

请公安机关依法立案侦查，挽回损失。`,
    });
  }

  if (taskType === "subscription_cancel") {
    templates.push({
      title: "取消订阅申请",
      content: `致 [服务提供商名称]：

我是贵公司 [服务名称] 的用户，账号 [你的账号]。

现正式申请：
1. 立即取消我的订阅
2. 停止自动续费
3. 退还 [未使用期限] 的费用

根据《网络交易监督管理办法》第十八条，经营者采取自动展期方式提供服务的，应当以显著方式提请消费者注意。

若贵公司在 3 个工作日内未处理，我将向 12315 和工信部投诉。

申请人：[你的姓名]
联系方式：[手机号]
日期：${new Date().toLocaleDateString("zh-CN")}`,
    });
  }

  if (taskType === "document_review" || taskType === "bill_check") {
    templates.push({
      title: "质疑函模板",
      content: `致 [对方公司名称]：

关于 [合同编号/账单编号] 项下的 [合同/账单]，本人有以下疑问：

1. [条款X] 的具体含义？
2. [费用项] 的计算依据？
3. [条款Y] 是否属于不公平格式条款？

根据《民法典》第四百九十六条，提供格式条款的一方应当采取合理的方式提示对方注意免除或者减轻其责任等与对方有重大利害关系的条款。

请在 5 个工作日内书面回复，否则本人保留向市场监管部门投诉的权利。

质疑人：[你的姓名]
联系方式：[手机号]
日期：${new Date().toLocaleDateString("zh-CN")}`,
    });
  }

  // 通用：如果没匹配到，给一个通用模板
  if (templates.length === 0) {
    templates.push({
      title: "情况说明模板",
      content: `说明人：[你的姓名]
联系方式：[手机号]
日期：${new Date().toLocaleDateString("zh-CN")}

情况说明：
${description || "[详细描述你遇到的问题]"}

我的诉求：
1. [诉求1]
2. [诉求2]

希望相关部门/机构能协助处理。`,
    });
  }

  return templates;
}

// ============ 求助渠道 ============

function getHelpChannels(taskType: string, riskLevel: RiskLevel) {
  const channels: Array<{ name: string; contact: string; desc: string; url?: string }> = [];

  // 高风险场景附上紧急渠道
  if (riskLevel === "high" || riskLevel === "critical") {
    channels.push(
      { name: "反诈中心", contact: "96110", desc: "全国反诈预警专线，接到疑似诈骗电话/短信时拨打" },
      { name: "报警", contact: "110", desc: "已经被骗、有经济损失时立即报警" },
      { name: "网络违法犯罪举报", contact: "12377", desc: "举报网络诈骗、网络赌博等违法网站", url: "https://www.12377.cn" }
    );
  }

  // 根据任务类型追加专业渠道
  switch (taskType) {
    case "refund_request":
    case "complaint":
    case "shopping_risk":
      channels.push(
        { name: "消费者投诉热线", contact: "12315", desc: "消费纠纷、商品质量问题、虚假宣传投诉", url: "https://www.12315.cn" },
        { name: "黑猫投诉", contact: "tousu.sina.com.cn", desc: "第三方投诉平台，曝光商家不作为", url: "https://tousu.sina.com.cn" }
      );
      break;
    case "subscription_cancel":
      channels.push(
        { name: "工信部申诉", contact: "12300", desc: "运营商乱扣费、增值业务不明扣款投诉", url: "https://yhssglxt.miit.gov.cn" },
        { name: "消费者投诉热线", contact: "12315", desc: "消费纠纷投诉", url: "https://www.12315.cn" }
      );
      break;
    case "document_review":
      channels.push(
        { name: "12348 法律援助", contact: "12348", desc: "免费法律咨询，符合条件的可申请法律援助" },
        { name: "中国法律服务网", contact: "www.12348.gov.cn", desc: "在线法律咨询、律师查询", url: "https://www.12348.gov.cn" }
      );
      break;
    case "bill_check":
      channels.push(
        { name: "工信部申诉", contact: "12300", desc: "运营商乱扣费投诉", url: "https://yhssglxt.miit.gov.cn" },
        { name: "银行信用卡中心", contact: "卡片背面电话", desc: "信用卡盗刷、不明扣款可申请拒付" }
      );
      break;
    case "general_life_issue":
      channels.push(
        { name: "消费者投诉热线", contact: "12315", desc: "消费纠纷投诉", url: "https://www.12315.cn" },
        { name: "12348 法律援助", contact: "12348", desc: "免费法律咨询" }
      );
      break;
  }

  // 去重
  const seen = new Set<string>();
  return channels.filter((c) => {
    if (seen.has(c.name)) return false;
    seen.add(c.name);
    return true;
  });
}

// ============ 个性化 key_facts 抽取 ============

function extractKeyFacts(title: string, description: string, taskType: string): string[] {
  const text = `${title} ${description}`;
  const facts: string[] = [];

  const amount = extractAmount(text);
  if (amount) facts.push(`涉及金额：${amount}`);

  const platform = extractPlatform(text);
  if (platform) facts.push(`涉及平台：${platform}`);

  const time = extractTime(text);
  if (time) facts.push(`发生时间：${time}`);

  const contact = extractContact(text);
  if (contact) facts.push(`涉及对象：${contact}`);

  if (description && description.length > 10) {
    const snippet = description.trim().replace(/\n/g, " ").slice(0, 150);
    facts.push(`用户描述：${snippet}`);
  }

  return facts;
}

// ============ 动态生成待核实问题 ============

function generateQuestions(taskType: string, description: string): string[] {
  const questions: string[] = [];
  const text = description || "";

  // 通用问题
  if (!text.includes("订单号") && (taskType === "refund_request" || taskType === "complaint")) {
    questions.push("是否保留了订单号和支付凭证？");
  }
  if (!text.includes("聊天记录") && (taskType === "scam_check" || taskType === "refund_request")) {
    questions.push("是否保留了聊天记录截图？");
  }

  // 根据任务类型生成
  switch (taskType) {
    case "scam_check":
      questions.push("对方身份是否可核实？", "是否要求提前付款或提供敏感信息？");
      break;
    case "refund_request":
      questions.push("退款窗口是否还在有效期内？", "商家是否有7天无理由退货承诺？");
      break;
    case "subscription_cancel":
      questions.push("自动续费是如何开通的？", "取消后是否有违约金？");
      break;
    case "document_review":
      questions.push("合同对方是否可靠？", "是否有不公平条款需要协商？");
      break;
    case "bill_check":
      questions.push("是否有重复扣款？", "是否有自动续费项目？");
      break;
  }

  return questions;
}

// ============ 取证清单 ============

function generateEvidenceChecklist(taskType: string, description: string): string[] {
  const checklist: string[] = [];
  const text = description || "";

  // 通用
  checklist.push("截图保存所有相关页面和聊天记录");
  checklist.push("保留所有转账/支付凭证截图");

  switch (taskType) {
    case "scam_check":
      checklist.push("保存可疑短信/邮件原文截图（含发件人号码/地址）");
      checklist.push("截图对方提供的链接、二维码、APP下载页面");
      checklist.push("录音电话沟通内容（如已通话）");
      if (text.includes("转账") || text.includes("付款")) checklist.push("保留转账记录和对方收款账户信息");
      break;
    case "refund_request":
    case "complaint":
      checklist.push("截图订单详情页（含订单号、商品信息、金额）");
      checklist.push("保留商品实物照片（如收到货）");
      checklist.push("保存与商家的聊天记录（含承诺内容）");
      if (text.includes("假") || text.includes("不符")) checklist.push("对比截图：商品详情页 vs 收到实物");
      break;
    case "document_review":
      checklist.push("保留合同/文件原件（拍照或扫描）");
      checklist.push("标注不理解或认为不公平的条款位置");
      checklist.push("保存签署前的版本（如有修改）");
      break;
    case "subscription_cancel":
      checklist.push("截图订阅开通页面和扣费记录");
      checklist.push("保留取消操作的截图和确认信息");
      break;
    case "bill_check":
      checklist.push("逐月截图账单明细");
      checklist.push("标记不明扣款项并截图");
      break;
  }
  return checklist;
}

// ============ 反套路话术 ============

function generateCounterScripts(taskType: string, riskLevel: RiskLevel, description: string): string[] {
  const scripts: string[] = [];
  const text = description || "";

  switch (taskType) {
    case "scam_check":
      if (riskLevel === "high" || riskLevel === "critical") {
        scripts.push("我不会转账，请你通过官方渠道证明身份");
        scripts.push("我需要和家人确认后再决定，请不要催我");
        scripts.push("正规机构不会要求先交费，我不会付款");
      }
      scripts.push("请提供你的工号和公司名称，我会去官方渠道核实");
      scripts.push("我不会提供验证码、银行卡号或密码");
      break;
    case "refund_request":
    case "complaint":
      scripts.push("根据《消费者权益保护法》第25条，我有权7天无理由退货");
      scripts.push("如果3个工作日内不处理，我将向12315投诉");
      scripts.push("商品与描述严重不符，这属于虚假宣传，我要求全额退款");
      if (text.includes("不退") || text.includes("拒绝")) scripts.push("你的拒绝理由不成立，我已保留完整证据，包括聊天记录和商品照片");
      break;
    case "document_review":
      scripts.push("这个条款我无法理解，请用通俗语言解释");
      scripts.push("根据《民法典》第496条，格式条款应显著提示，否则可主张不成为合同内容");
      scripts.push("我要求删除/修改第X条，否则不予签署");
      break;
    case "subscription_cancel":
      scripts.push("根据《网络交易监督管理办法》第18条，自动续费应以显著方式提醒，我要求立即取消");
      scripts.push("我不知情的情况下被续费，要求退还扣款");
      break;
    default:
      scripts.push("我需要时间考虑，请不要催促");
      scripts.push("我已保留相关证据，如不妥善处理我将通过官方渠道维权");
  }
  return scripts;
}

// ============ 主分析函数 ============

export function analyzeTask(
  taskType: string,
  title: string,
  description: string
): AnalysisResult {
  const text = `${title} ${description}`;
  const assessment = assessRisk(text);
  const riskLevel = assessment.level;

  // 风险点：从命中的规则里生成
  const riskPoints = assessment.hitRules.map((r) => r.reason);
  if (riskPoints.length === 0) {
    riskPoints.push("未发现明显风险关键词，但请保持警惕");
  }

  // 关键事实：个性化抽取
  const keyFacts = extractKeyFacts(title, description, taskType);

  // 建议行动：根据风险等级 + 任务类型动态组合
  const actions: string[] = [];
  if (riskLevel === "critical") {
    actions.push("🚨 极高风险！立即停止任何转账、付款、提供敏感信息的操作");
    actions.push("📞 拨打 96110（反诈中心）或 110（报警）");
  } else if (riskLevel === "high") {
    actions.push("⚠️ 高风险！不要轻易转账或提供验证码");
    actions.push("🔍 通过官方渠道核实对方身份");
  } else if (riskLevel === "medium") {
    actions.push("⚡ 存在一定风险，建议谨慎处理");
  } else {
    actions.push("✅ 暂未发现明显风险，但仍建议保持警惕");
  }

  // 根据任务类型追加具体建议
  const taskSpecificActions: Record<string, string[]> = {
    scam_check: ["保留所有聊天记录、转账凭证作为证据", "将可疑信息转发给家人确认"],
    refund_request: ["先通过平台官方渠道申请退款", "若平台拒绝，向 12315 投诉"],
    complaint: ["整理事件经过和时间线", "收集相关证据（截图、录音、合同等）"],
    subscription_cancel: [
      "查看订阅服务的取消政策",
      "通过官方渠道申请取消",
      "检查是否还有其他关联的自动续费",
      "确认取消后是否还有违约金",
      "截图取消操作和确认信息",
    ],
    document_review: ["重点关注金额、日期、违约条款", "对模糊条款要求对方书面澄清"],
    bill_check: ["逐项核对账单明细", "标记不明扣款项并联系扣款方"],
    shopping_risk: ["查看商品评价是否真实", "对比其他平台价格"],
    general_life_issue: ["明确问题的核心诉求", "评估可行的解决渠道"],
  };
  actions.push(...(taskSpecificActions[taskType] || []));

  // 待核实问题
  const questionsToVerify = generateQuestions(taskType, description);

  // 取证清单
  const evidenceChecklist = generateEvidenceChecklist(taskType, description);

  // 反套路话术
  const counterScripts = generateCounterScripts(taskType, riskLevel, description);

  // 求助渠道
  const helpChannels = getHelpChannels(taskType, riskLevel);

  // 维权材料模板
  const templates = getTemplates(taskType, title, description);

  // 相似案例
  const similarCases = findSimilarCases(text);

  // 摘要
  const levelText = {
    low: "低风险",
    medium: "中风险",
    high: "高风险",
    critical: "极高风险",
  }[riskLevel];

  const summary = `${title} — 分析结果：${levelText}。${
    assessment.hitRules.length > 0
      ? `发现 ${assessment.hitRules.length} 个风险信号。`
      : "未发现明显风险信号。"
  }${
    similarCases.length > 0
      ? ` 匹配到 ${similarCases.length} 个相似案例。`
      : ""
  }`;

  return {
    summary,
    risk_level: riskLevel,
    risk_points: riskPoints,
    key_facts: keyFacts,
    assumptions: ["假设用户提交的内容真实完整", "假设未涉及未提及的关联交易"],
    suggested_actions: actions,
    questions_to_verify: questionsToVerify,
    evidence_checklist: evidenceChecklist,
    counter_scripts: counterScripts,
    help_channels: helpChannels,
    templates: templates,
    scam_steps: similarCases.length > 0 && SCAM_STEPS[similarCases[0].title]
      ? SCAM_STEPS[similarCases[0].title].map((s) => ({ step: s.split("：")[0] || s, explanation: s.split("：")[1] || s }))
      : undefined,
    similar_cases: similarCases.map((c) => ({
      title: c.title,
      pattern: c.pattern,
      advice: c.advice,
      steps: SCAM_STEPS[c.title] || [],
    })),
    disclaimer:
      "本分析由 AI 自动生成，仅供参考，不构成法律、金融或医疗建议。涉及重大决策请咨询专业人士。",
  };
}
