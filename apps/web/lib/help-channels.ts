/**
 * 求助渠道库 — 根据任务类型提供具体可执行的求助渠道。
 *
 * 不再是"立即报警"这种笼统建议，而是具体的电话、网站、部门。
 */

export interface HelpChannel {
  name: string;
  contact: string;
  desc: string;
  url?: string;
}

// 通用紧急渠道（任何高风险场景都附上）
export const EMERGENCY_CHANNELS: HelpChannel[] = [
  {
    name: "反诈中心",
    contact: "96110",
    desc: "全国反诈预警专线，接到疑似诈骗电话/短信时拨打",
  },
  {
    name: "报警",
    contact: "110",
    desc: "已经被骗、有经济损失时立即报警",
  },
  {
    name: "网络违法犯罪举报",
    contact: "12377",
    desc: "举报网络诈骗、网络赌博、淫秽色情等违法网站",
    url: "https://www.12377.cn",
  },
];

// 消费维权渠道
export const CONSUMER_CHANNELS: HelpChannel[] = [
  {
    name: "消费者投诉热线",
    contact: "12315",
    desc: "消费纠纷、商品质量问题、虚假宣传投诉",
    url: "https://www.12315.cn",
  },
  {
    name: "全国12315平台",
    contact: "微信小程序",
    desc: "在线投诉、举报、查询进度",
  },
  {
    name: "黑猫投诉",
    contact: "tousu.sina.com.cn",
    desc: "第三方投诉平台，曝光商家不作为",
    url: "https://tousu.sina.com.cn",
  },
];

// 退款/取消订阅相关
export const REFUND_CHANNELS: HelpChannel[] = [
  {
    name: "支付平台客服",
    contact: "支付宝 95188 / 微信 95017",
    desc: "通过支付平台发起退款申诉，拦截未完成交易",
  },
  {
    name: "银行信用卡中心",
    contact: "卡片背面电话",
    desc: "信用卡盗刷、不明扣款可申请拒付",
  },
  {
    name: "工信部申诉",
    contact: "12300",
    desc: "运营商乱扣费、增值业务不明扣款投诉",
    url: "https://yhssglxt.miit.gov.cn",
  },
];

// 合同/法律咨询
export const LEGAL_CHANNELS: HelpChannel[] = [
  {
    name: "12348 法律援助",
    contact: "12348",
    desc: "免费法律咨询，符合条件的可申请法律援助",
  },
  {
    name: "中国法律服务网",
    contact: "12348-1",
    desc: "在线法律咨询、律师查询、案例查询",
    url: "https://www.12348.gov.cn",
  },
  {
    name: "当地法律援助中心",
    contact: "12348",
    desc: "面对面咨询，经济困难可免费指派律师",
  },
];

// 文件解读/合同纠纷
export const DOCUMENT_CHANNELS: HelpChannel[] = [
  ...LEGAL_CHANNELS,
  {
    name: "市场监督管理局",
    contact: "12315",
    desc: "合同格式条款违法、霸王条款投诉",
  },
];

// 根据任务类型返回对应的求助渠道
export function getHelpChannels(taskType: string, riskLevel: string): HelpChannel[] {
  const channels: HelpChannel[] = [];

  // 高风险场景附上紧急渠道
  if (riskLevel === "high" || riskLevel === "critical") {
    channels.push(...EMERGENCY_CHANNELS);
  }

  // 根据任务类型追加专业渠道
  switch (taskType) {
    case "scam_check":
    case "shopping_risk":
      // 已有 EMERGENCY，再追加消费渠道
      if (riskLevel !== "high" && riskLevel !== "critical") {
        channels.push(...EMERGENCY_CHANNELS);
      }
      break;
    case "refund_request":
    case "subscription_cancel":
      channels.push(...REFUND_CHANNELS);
      channels.push(...CONSUMER_CHANNELS);
      break;
    case "complaint":
      channels.push(...CONSUMER_CHANNELS);
      channels.push(...LEGAL_CHANNELS);
      break;
    case "document_review":
    case "bill_check":
      channels.push(...DOCUMENT_CHANNELS);
      break;
    case "general_life_issue":
    default:
      channels.push(...CONSUMER_CHANNELS);
      if (riskLevel === "high" || riskLevel === "critical") {
        // 已有 EMERGENCY
      } else {
        channels.push(...EMERGENCY_CHANNELS.slice(0, 1));
      }
      break;
  }

  // 去重（按 name）
  const seen = new Set<string>();
  return channels.filter((c) => {
    if (seen.has(c.name)) return false;
    seen.add(c.name);
    return true;
  });
}
