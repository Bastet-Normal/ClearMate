import { getStoredProfile, getStoredUser } from "@/lib/local-store";

function extractAmount(text: string): string | null {
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
  const timeWords = ["昨天", "今天", "前天", "上周", "上个月", "刚才", "刚刚"];
  for (const t of timeWords) {
    if (text.includes(t)) return t;
  }
  const dateMatch = text.match(/(\d{1,2})月(\d{1,2})日?/);
  if (dateMatch) return `${dateMatch[1]}月${dateMatch[2]}日`;
  return null;
}

function extractContact(text: string): string | null {
  const contacts = ["卖家", "买家", "客服", "商家", "对方", "公司", "平台"];
  for (const c of contacts) {
    if (text.includes(c)) return c;
  }
  return null;
}

export function autoFillTemplate(content: string, description: string): string {
  const profile = getStoredProfile();
  const user = getStoredUser();
  const name = profile.real_name || user?.nickname || "";
  const phone = profile.phone || "";
  
  const amount = extractAmount(description);
  const platform = extractPlatform(description);
  const date = extractTime(description);
  const contact = extractContact(description);
  
  let res = content;
  if (name) {
    res = res.replace(/\[你的姓名\]/g, name);
  }
  if (phone) {
    res = res.replace(/\[手机号\]/g, phone);
  }
  if (platform || contact) {
    const bizName = platform || contact || "_____";
    res = res.replace(/\[商家名称\/平台名称\]/g, bizName);
    res = res.replace(/\[被投诉方\]/g, bizName);
    res = res.replace(/\[商家名称\]/g, bizName);
    res = res.replace(/\[平台名称\]/g, platform || "_____");
    res = res.replace(/\[服务提供商名称\]/g, bizName);
    res = res.replace(/\[对方公司名称\]/g, bizName);
  }
  if (amount) {
    res = res.replace(/\[金额\]/g, amount);
  }
  if (date) {
    res = res.replace(/\[日期\]/g, date);
  }
  if (platform) {
    res = res.replace(/\[平台\/店铺\]/g, platform);
  }
  
  return res
    .replace(/\[商品名称\]/g, "相关商品/服务")
    .replace(/\[订单号\]/g, "_____")
    .replace(/\[服务名称\]/g, "相关服务")
    .replace(/\[你的账号\]/g, "_____")
    .replace(/\[未使用期限\]/g, "_____")
    .replace(/\[合同编号\/账单编号\]/g, "_____")
    .replace(/\[合同\/账单\]/g, "相关合同/账单")
    .replace(/\[条款X\]/g, "争议条款")
    .replace(/\[费用项\]/g, "争议费用")
    .replace(/\[条款Y\]/g, "争议条款")
    .replace(/\[对方银行卡\/支付宝\/微信账号\]/g, "_____")
    .replace(/\[对方手机号\/QQ\/微信\]/g, "_____");
}
