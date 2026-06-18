import { EntryCard } from "@/components/features/entry-card";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          遇到麻烦？先问 ClearMate
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600 leading-relaxed">
          上传截图、文件，或者描述你的问题。
          <br />
          AI 帮你分析风险、看懂文件、生成维权材料。
        </p>
      </div>

      {/* Three Core Entry Points */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <EntryCard
          href="/tasks/new?scam_check"
          icon="🔍"
          title="这是不是坑？"
          description="收到可疑短信、广告、兼职信息？帮你判断是不是诈骗或套路，告诉你下一步怎么做。"
          color="border-red-100 bg-red-50/50"
          hoverColor="hover:border-red-300 hover:bg-red-50"
        />
        <EntryCard
          href="/tasks/new?refund_request"
          icon="💰"
          title="帮我退款 / 投诉 / 取消"
          description="买了东西想退款、被坑了想投诉、订阅想取消？帮你生成投诉信、退款申请、客服话术。"
          color="border-amber-100 bg-amber-50/50"
          hoverColor="hover:border-amber-300 hover:bg-amber-50"
        />
        <EntryCard
          href="/tasks/new?document_review"
          icon="📄"
          title="帮我看懂这份文件"
          description="合同、账单、通知看不懂？帮你提取关键信息、标注风险条款、用大白话解释给你听。"
          color="border-blue-100 bg-blue-50/50"
          hoverColor="hover:border-blue-300 hover:bg-blue-50"
        />
      </div>

      {/* Trust Signals */}
      <div className="mt-16 rounded-2xl border border-gray-200 bg-gray-50 p-6">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="text-center">
            <div className="mb-2 text-2xl">🛡️</div>
            <h3 className="font-semibold text-gray-900">安全第一</h3>
            <p className="mt-1 text-sm text-gray-500">
              涉及转账、验证码等高风险操作时，我们会醒目提醒
            </p>
          </div>
          <div className="text-center">
            <div className="mb-2 text-2xl">🔒</div>
            <h3 className="font-semibold text-gray-900">隐私保护</h3>
            <p className="mt-1 text-sm text-gray-500">
              敏感信息自动脱敏，你的数据只属于你
            </p>
          </div>
          <div className="text-center">
            <div className="mb-2 text-2xl">⚖️</div>
            <h3 className="font-semibold text-gray-900">专业免责</h3>
            <p className="mt-1 text-sm text-gray-500">
              AI 分析仅供参考，重大决策请咨询专业人士
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
