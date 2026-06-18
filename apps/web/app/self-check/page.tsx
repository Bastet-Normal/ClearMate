"use client";

import { useState } from "react";
import Link from "next/link";

interface Question {
  id: string;
  text: string;
  isDanger: boolean;
}

const CHECKLISTS = [
  {
    title: "🔍 诈骗风险自检",
    desc: "检查你是否正在遭遇诈骗",
    questions: [
      { id: "q1", text: "对方要求你转账或付款", isDanger: true },
      { id: "q2", text: "对方要求你提供验证码", isDanger: true },
      { id: "q3", text: "对方要求你加微信/QQ私下沟通", isDanger: true },
      { id: "q4", text: "对方承诺高回报、零风险", isDanger: true },
      { id: "q5", text: "对方制造紧迫感（限时、马上）", isDanger: true },
      { id: "q6", text: "你无法通过官方渠道核实对方身份", isDanger: true },
      { id: "q7", text: "对方声称你中奖或免费领取", isDanger: true },
      { id: "q8", text: "对方要求先交保证金/解冻费", isDanger: true },
    ],
  },
  {
    title: "💰 消费维权自检",
    desc: "检查你的消费权益是否受损",
    questions: [
      { id: "c1", text: "商品与描述严重不符", isDanger: true },
      { id: "c2", text: "商家拒绝退款/退货", isDanger: true },
      { id: "c3", text: "被自动续费扣款但不知情", isDanger: true },
      { id: "c4", text: "收到商品后发现有质量问题", isDanger: true },
      { id: "c5", text: "商家虚假宣传/误导消费", isDanger: true },
      { id: "c6", text: "订单超时未发货且联系不上商家", isDanger: true },
    ],
  },
  {
    title: "📄 合同风险自检",
    desc: "检查合同/协议是否有风险条款",
    questions: [
      { id: "d1", text: "有不公平的违约条款", isDanger: true },
      { id: "d2", text: "有自动续费/自动展期条款", isDanger: true },
      { id: "d3", text: "有单方变更权条款", isDanger: true },
      { id: "d4", text: "有过度授权个人信息条款", isDanger: true },
      { id: "d5", text: "金额/期限条款模糊不清", isDanger: true },
    ],
  },
];

export default function SelfCheckPage() {
  const [activeList, setActiveList] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const list = CHECKLISTS[activeList];
  const dangerCount = list.questions.filter((q) => answers[q.id]).length;
  const totalCount = list.questions.length;

  function toggleAnswer(id: string) {
    setAnswers((prev) => ({ ...prev, [id]: !prev[id] }));
    setSubmitted(false);
  }

  function handleSubmit() {
    setSubmitted(true);
  }

  function resetAll() {
    setAnswers({});
    setSubmitted(false);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/" className="text-sm text-gray-500 hover:text-brand-600 transition-colors">← 返回首页</Link>
      <div className="mt-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">风险自检</h1>
        <p className="mt-1 text-sm text-gray-500">回答几个问题，快速评估你的风险状况</p>
      </div>

      {/* 选择自检类型 */}
      <div className="mb-6 flex gap-2">
        {CHECKLISTS.map((cl, i) => (
          <button
            key={i}
            onClick={() => { setActiveList(i); resetAll(); }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeList === i ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {cl.title.split(" ")[0]}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-1 text-lg font-semibold text-gray-900">{list.title}</h2>
        <p className="mb-6 text-sm text-gray-500">{list.desc}</p>

        <div className="space-y-3">
          {list.questions.map((q) => (
            <label key={q.id} className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!!answers[q.id]}
                onChange={() => toggleAnswer(q.id)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <span className={`text-sm ${answers[q.id] ? "text-red-700 font-medium" : "text-gray-700"}`}>
                {q.text}
              </span>
            </label>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <span className="text-sm text-gray-500">已选 {dangerCount} / {totalCount} 项</span>
          <button
            onClick={handleSubmit}
            disabled={dangerCount === 0}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            查看结果
          </button>
        </div>
      </div>

      {submitted && (
        <div className="mt-6 rounded-xl border-2 p-6 ${
          dangerCount >= 4 ? 'border-red-200 bg-red-50' : dangerCount >= 2 ? 'border-orange-200 bg-orange-50' : 'border-yellow-200 bg-yellow-50'
        }">
          {dangerCount >= 4 ? (
            <>
              <h3 className="text-lg font-bold text-red-700">🚨 高度警惕！你可能正在遭遇风险</h3>
              <p className="mt-2 text-sm text-red-600">
                你勾选了 {dangerCount} 项风险信号，这表明你正在面临严重风险。请立即停止任何转账/付款操作。
              </p>
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-red-700">建议立即：</p>
                <p className="text-sm text-red-600">1. 拨打 <span className="font-mono font-bold">96110</span>（反诈中心）咨询</p>
                <p className="text-sm text-red-600">2. 如已转账，立即拨打 <span className="font-mono font-bold">110</span> 报警</p>
                <p className="text-sm text-red-600">3. 保留所有聊天记录、转账凭证</p>
              </div>
            </>
          ) : dangerCount >= 2 ? (
            <>
              <h3 className="text-lg font-bold text-orange-700">⚠️ 存在风险信号，需要警惕</h3>
              <p className="mt-2 text-sm text-orange-600">
                你勾选了 {dangerCount} 项风险信号，建议谨慎处理，通过官方渠道核实后再行动。
              </p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-bold text-yellow-700">⚡ 有少量风险信号</h3>
              <p className="mt-2 text-sm text-yellow-600">
                你勾选了 {dangerCount} 项风险信号，保持警惕即可，建议通过官方渠道核实。
              </p>
            </>
          )}

          <div className="mt-6">
            <Link
              href="/tasks/new"
              className="inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
            >
              创建任务让 AI 详细分析 →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
