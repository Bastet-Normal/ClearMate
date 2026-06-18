/**客户端 AI 分析引擎 — 移植自后端 mock_provider.py + prompts。

在浏览器端运行，不依赖后端。根据关键词匹配给出风险评分，
根据任务类型给出结构化分析结果。
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
  disclaimer: string;
}

// 风险关键词及权重
const RISK_KEYWORDS: Record<string, number> = {
  验证码: 2,
  保证金: 2,
  稳赚: 2,
  刷单: 3,
  先转账: 3,
  解冻费: 3,
  客服QQ: 2,
  内部消息: 2,
  高回报: 2,
  零风险: 2,
  限时: 1,
  马上: 1,
  中奖: 2,
  免费领: 2,
  点链接: 2,
  身份证: 2,
  银行卡: 2,
  转账: 3,
  代付: 2,
  花呗套现: 3,
  网贷: 2,
};

function guessRiskLevel(text: string): RiskLevel {
  const score = Object.entries(RISK_KEYWORDS).reduce(
    (sum, [kw, weight]) => sum + (text.includes(kw) ? weight : 0),
    0
  );
  if (score >= 5) return "critical";
  if (score >= 3) return "high";
  if (score >= 1) return "medium";
  return "low";
}

function getRiskPoints(text: string): string[] {
  const points: string[] = [];
  for (const kw of Object.keys(RISK_KEYWORDS)) {
    if (text.includes(kw)) {
      points.push(`命中关键词「${kw}」，常见于诈骗话术`);
    }
  }
  if (points.length === 0) points.push("未发现明显风险关键词");
  return points;
}

// 各任务类型的分析模板
const ANALYSIS_TEMPLATES: Record<
  string,
  {
    summaryPrefix: string;
    defaultActions: string[];
    defaultQuestions: string[];
  }
> = {
  scam_check: {
    summaryPrefix: "防诈骗分析",
    defaultActions: [
      "1. 不要轻易转账或提供验证码",
      "2. 通过官方渠道核实对方身份",
      "3. 如已损失，立即报警并保留证据",
      "4. 将可疑信息转发给家人确认",
    ],
    defaultQuestions: ["对方身份是否可核实？", "是否有官方渠道可验证此信息？", "是否要求提前付款或提供敏感信息？"],
  },
  refund_request: {
    summaryPrefix: "退款/投诉分析",
    defaultActions: [
      "1. 收集订单号、支付凭证、商品照片等证据",
      "2. 先通过平台官方渠道申请退款",
      "3. 若平台拒绝，向 12315 投诉",
      "4. 保留所有沟通记录作为证据",
    ],
    defaultQuestions: ["退款窗口是否还在有效期内？", "商家是否有 7 天无理由退货承诺？", "是否有支付平台的买家保护？"],
  },
  complaint: {
    summaryPrefix: "投诉分析",
    defaultActions: [
      "1. 整理事件经过和时间线",
      "2. 收集相关证据（截图、录音、合同等）",
      "3. 先向商家正式投诉并保留记录",
      "4. 若无回应，向监管部门投诉",
    ],
    defaultQuestions: ["被投诉方是否可联系？", "是否有明确的损失金额？", "是否在投诉时效内？"],
  },
  subscription_cancel: {
    summaryPrefix: "订阅取消分析",
    defaultActions: [
      "1. 查看订阅服务的取消政策",
      "2. 通过官方渠道申请取消",
      "3. 确认取消后是否还会扣费",
      "4. 保留取消确认截图",
    ],
    defaultQuestions: ["自动续费是如何开通的？", "取消后是否有违约金？", "是否有免费试用期可利用？"],
  },
  document_review: {
    summaryPrefix: "文件解读",
    defaultActions: [
      "1. 重点关注金额、日期、违约条款",
      "2. 对模糊条款要求对方书面澄清",
      "3. 涉及大额合同建议咨询律师",
      "4. 保留原件和沟通记录",
    ],
    defaultQuestions: ["合同对方是否可靠？", "是否有不公平条款需要协商？", "签字前是否充分理解所有条款？"],
  },
  bill_check: {
    summaryPrefix: "账单检查",
    defaultActions: [
      "1. 逐项核对账单明细",
      "2. 标记不明扣款项",
      "3. 联系扣款方确认",
      "4. 不明扣款可向银行申诉",
    ],
    defaultQuestions: ["是否有重复扣款？", "是否有自动续费项目？", "账单周期和金额是否正常？"],
  },
  shopping_risk: {
    summaryPrefix: "购物风险分析",
    defaultActions: [
      "1. 查看商品评价是否真实",
      "2. 对比其他平台价格",
      "3. 确认退货政策",
      "4. 使用平台担保支付",
    ],
    defaultQuestions: ["商品评价是否可信？", "价格是否远低于市场价？", "退货窗口是否充足？"],
  },
  general_life_issue: {
    summaryPrefix: "生活问题分析",
    defaultActions: [
      "1. 明确问题的核心诉求",
      "2. 评估可行的解决渠道",
      "3. 收集相关证据和信息",
      "4. 按优先级逐步处理",
    ],
    defaultQuestions: ["最希望达到什么结果？", "有哪些可用资源？", "是否有时间限制？"],
  },
};

export function analyzeTask(
  taskType: string,
  title: string,
  description: string
): AnalysisResult {
  const text = `${title} ${description}`;
  const riskLevel = guessRiskLevel(text);
  const riskPoints = getRiskPoints(text);

  const template = ANALYSIS_TEMPLATES[taskType] || ANALYSIS_TEMPLATES.general_life_issue;

  const keyFacts: string[] = [];
  if (text.trim()) {
    const snippet = text.trim().replace(/\n/g, " ").slice(0, 200);
    keyFacts.push(`用户描述：${snippet}`);
  }
  keyFacts.push("分析基于客户端 AI 引擎，未调用外部服务");

  // 根据风险等级调整建议
  let actions = [...template.defaultActions];
  if (riskLevel === "critical" || riskLevel === "high") {
    actions = ["⚠️ 强烈建议：不要进行任何转账或提供敏感信息！", ...actions];
  }

  return {
    summary: `${template.summaryPrefix}：${title}。整体风险等级为 ${riskLevel === "critical" ? "极高" : riskLevel === "high" ? "高" : riskLevel === "medium" ? "中" : "低"}。${
      riskPoints.length > 0 && riskPoints[0] !== "未发现明显风险关键词"
        ? `发现 ${riskPoints.length} 个风险信号。`
        : "未发现明显风险信号。"
    }`,
    risk_level: riskLevel,
    risk_points: riskPoints,
    key_facts: keyFacts,
    assumptions: ["假设用户提交的内容真实完整", "假设未涉及未提及的关联交易"],
    suggested_actions: actions,
    questions_to_verify: template.defaultQuestions,
    disclaimer: "本分析由 AI 自动生成，仅供参考，不构成法律、金融或医疗建议。涉及重大决策请咨询专业人士。",
  };
}
