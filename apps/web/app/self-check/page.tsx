"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Question {
  id: string;
  text: string;
  isDanger: boolean;
}

const STORAGE_KEY = "cm_self_check_results";

const CHECKLISTS = [
  {
    title: "🔍 诈骗风险自检",
    desc: "检查你是否正在遭遇诈骗",
    icon: "🔍",
    gradient: "from-red-500 to-orange-500",
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
    icon: "💰",
    gradient: "from-amber-500 to-yellow-500",
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
    icon: "📄",
    gradient: "from-blue-500 to-cyan-500",
    questions: [
      { id: "d1", text: "有不公平的违约条款", isDanger: true },
      { id: "d2", text: "有自动续费/自动展期条款", isDanger: true },
      { id: "d3", text: "有单方变更权条款", isDanger: true },
      { id: "d4", text: "有过度授权个人信息条款", isDanger: true },
      { id: "d5", text: "金额/期限条款模糊不清", isDanger: true },
    ],
  },
];

interface SavedResult {
  listIndex: number;
  answers: Record<string, boolean>;
  dangerCount: number;
  totalCount: number;
  timestamp: string;
}

function saveResult(listIndex: number, answers: Record<string, boolean>, dangerCount: number, totalCount: number) {
  const results: SavedResult[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  results[listIndex] = { listIndex, answers, dangerCount, totalCount, timestamp: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
}

function loadResults(): SavedResult[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

export default function SelfCheckPage() {
  const [activeList, setActiveList] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [hasSavedResult, setHasSavedResult] = useState(false);

  const list = CHECKLISTS[activeList];
  const dangerCount = list.questions.filter((q) => answers[q.id]).length;
  const totalCount = list.questions.length;

  // 加载已保存的结果
  useEffect(() => {
    const results = loadResults();
    const saved = results[activeList];
    if (saved) {
      setAnswers(saved.answers);
      setSubmitted(true);
      setHasSavedResult(true);
    } else {
      setAnswers({});
      setSubmitted(false);
      setHasSavedResult(false);
    }
  }, [activeList]);

  function toggleAnswer(id: string) {
    setAnswers((prev) => ({ ...prev, [id]: !prev[id] }));
    setSubmitted(false);
    setHasSavedResult(false);
  }

  function handleSubmit() {
    setSubmitted(true);
    setHasSavedResult(true);
    saveResult(activeList, answers, dangerCount, totalCount);
  }

  function resetAll() {
    setAnswers({});
    setSubmitted(false);
    setHasSavedResult(false);
    // 清除该类型的保存结果
    const results = loadResults();
    results[activeList] = undefined as any;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results.filter(Boolean)));
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/" className="text-sm text-slate-500 hover:text-brand-600 transition-colors">← 返回首页</Link>
      <div className="mt-6 mb-8">
        <h1 className="text-3xl font-bold text-slate-900">风险自检</h1>
        <p className="mt-2 text-sm text-slate-500">回答几个问题，快速评估你的风险状况</p>
      </div>

      {/* Checklist Type Tabs */}
      <div className="mb-6 flex gap-3">
        {CHECKLISTS.map((cl, i) => {
          const savedResults = loadResults();
          const hasSaved = !!savedResults[i];
          return (
            <button key={i} onClick={() => setActiveList(i)}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all relative ${
                activeList === i
                  ? "btn-primary shadow-lg shadow-brand-500/25"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600 shadow-sm"
              }`}>
              {cl.icon}
              {hasSaved && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500" />}
            </button>
          );
        })}
      </div>

      {/* Checklist Card */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${list.gradient} text-xl text-white shadow-lg`}>
            {list.icon}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{list.title}</h2>
            <p className="text-xs text-slate-500">{list.desc}</p>
          </div>
        </div>

        <div className="space-y-3">
          {list.questions.map((q) => (
            <label key={q.id} className={`flex items-start gap-3 cursor-pointer rounded-xl p-3 transition-all ${answers[q.id] ? "bg-red-50 border border-red-100" : "hover:bg-slate-50"}`}>
              <input
                type="checkbox"
                checked={!!answers[q.id]}
                onChange={() => toggleAnswer(q.id)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className={`text-sm leading-relaxed ${answers[q.id] ? "text-red-700 font-semibold" : "text-slate-700"}`}>
                {q.text}
              </span>
            </label>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">已选 <span className="font-bold text-slate-800">{dangerCount}</span> / {totalCount} 项</span>
            {hasSavedResult && submitted && <span className="text-xs text-green-600">✓ 已保存</span>}
          </div>
          <div className="flex gap-2">
            {submitted && (
              <button onClick={resetAll} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">
                重新自检
              </button>
            )}
            <button onClick={handleSubmit} disabled={dangerCount === 0}
              className="btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg shadow-brand-500/25 disabled:opacity-50">
              查看结果
            </button>
          </div>
        </div>
      </div>

      {/* Result */}
      {submitted && (
        <div className={`mt-6 rounded-2xl border-2 p-6 ${
          dangerCount >= 4 ? "border-red-200 bg-gradient-to-br from-red-50 to-rose-50" :
          dangerCount >= 2 ? "border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50" :
          "border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50"
        }`}>
          {dangerCount >= 4 ? (
            <>
              <h3 className="text-lg font-bold text-red-700">🚨 高度警惕！你可能正在遭遇风险</h3>
              <p className="mt-2 text-sm text-red-600 leading-relaxed">
                你勾选了 <span className="font-bold">{dangerCount}</span> 项风险信号，这表明你正在面临严重风险。请立即停止任何转账/付款操作。
              </p>
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold text-red-700">建议立即：</p>
                <div className="space-y-1.5">
                  <p className="text-sm text-red-600">1. 拨打 <a href="tel:96110" className="inline-flex rounded-lg bg-white px-2 py-0.5 font-mono font-bold text-red-700 border border-red-200 hover:bg-red-50 transition-colors">96110</a>（反诈中心）咨询</p>
                  <p className="text-sm text-red-600">2. 如已转账，立即拨打 <a href="tel:110" className="inline-flex rounded-lg bg-white px-2 py-0.5 font-mono font-bold text-red-700 border border-red-200 hover:bg-red-50 transition-colors">110</a> 报警</p>
                  <p className="text-sm text-red-600">3. 保留所有聊天记录、转账凭证</p>
                </div>
              </div>
            </>
          ) : dangerCount >= 2 ? (
            <>
              <h3 className="text-lg font-bold text-orange-700">⚠️ 存在风险信号，需要警惕</h3>
              <p className="mt-2 text-sm text-orange-600 leading-relaxed">
                你勾选了 <span className="font-bold">{dangerCount}</span> 项风险信号，建议谨慎处理，通过官方渠道核实后再行动。
              </p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-bold text-amber-700">⚡ 有少量风险信号</h3>
              <p className="mt-2 text-sm text-amber-600 leading-relaxed">
                你勾选了 <span className="font-bold">{dangerCount}</span> 项风险信号，保持警惕即可，建议通过官方渠道核实。
              </p>
            </>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/tasks/new"
              className="btn-primary inline-flex rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg shadow-brand-500/25">
              创建任务让 AI 详细分析 →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
