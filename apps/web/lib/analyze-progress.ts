/**
 * 模拟 AI 分析延迟 + 分步进度提示
 * 
 * 让用户感觉 AI 在"思考"，而不是瞬间出结果。
 * 同时展示分析过程，建立信任感。
 */

export interface AnalysisStep {
  label: string;
  duration: number; // ms
}

export const ANALYSIS_STEPS: Record<string, AnalysisStep[]> = {
  scam_check: [
    { label: "正在提取关键信息...", duration: 600 },
    { label: "正在匹配风险规则库（16 条规则）...", duration: 500 },
    { label: "正在检索相似案例（8 类诈骗案例库）...", duration: 700 },
    { label: "正在生成风险评级和应对建议...", duration: 600 },
  ],
  refund_request: [
    { label: "正在分析消费场景...", duration: 500 },
    { label: "正在匹配维权法规...", duration: 600 },
    { label: "正在生成投诉材料和话术...", duration: 800 },
  ],
  document_review: [
    { label: "正在提取文件关键信息...", duration: 700 },
    { label: "正在识别风险条款...", duration: 600 },
    { label: "正在生成通俗解读和修改建议...", duration: 700 },
  ],
  subscription_cancel: [
    { label: "正在识别订阅类型...", duration: 500 },
    { label: "正在匹配取消路径...", duration: 600 },
    { label: "正在生成取消步骤和话术...", duration: 700 },
  ],
  default: [
    { label: "正在分析你的问题...", duration: 600 },
    { label: "正在生成建议...", duration: 700 },
  ],
};

export function getAnalysisSteps(taskType: string): AnalysisStep[] {
  return ANALYSIS_STEPS[taskType] || ANALYSIS_STEPS.default;
}

export function analyzeWithProgress<T>(
  fn: () => T | Promise<T>,
  taskType: string,
  onProgress: (step: string, progress: number) => void
): Promise<T> {
  const steps = getAnalysisSteps(taskType);
  const totalDuration = steps.reduce((sum, s) => sum + s.duration, 0);

  // 立即在后台触发实际的分析请求，并行执行
  const actualPromise = Promise.resolve().then(fn);

  return new Promise((resolve, reject) => {
    let elapsed = 0;

    function runStep(index: number) {
      if (index >= steps.length) {
        onProgress("分析完成", 1);
        // 等待实际的 AI 请求完成
        actualPromise
          .then((result) => {
            // 短暂停顿后返回结果，让用户看到“完成”状态，提升视觉体验
            setTimeout(() => resolve(result), 300);
          })
          .catch((err) => {
            reject(err);
          });
        return;
      }

      const step = steps[index];
      onProgress(step.label, elapsed / totalDuration);

      setTimeout(() => {
        elapsed += step.duration;
        runStep(index + 1);
      }, step.duration);
    }

    runStep(0);
  });
}
