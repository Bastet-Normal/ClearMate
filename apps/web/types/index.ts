export type RiskLevel = "low" | "medium" | "high" | "critical";
export type Theme = "light" | "dark" | "system";

export type TaskType =
  | "scam_check"
  | "refund_request"
  | "complaint"
  | "subscription_cancel"
  | "document_review"
  | "bill_check"
  | "shopping_risk"
  | "general_life_issue";

export type TaskStatus =
  | "draft"
  | "pending_info"
  | "analyzing"
  | "waiting_confirmation"
  | "ready_to_execute"
  | "in_progress"
  | "waiting_response"
  | "completed"
  | "failed"
  | "archived";

export type MemberMode = "normal" | "elder" | "child";

export type ImageOcrStatus = "idle" | "loading" | "done" | "error";

export interface ImageAttachment {
  id: string;
  fileName: string;
  base64: string;       // data:image/...;base64,...
  mimeType: string;
  ocrText: string;
  ocrStatus: ImageOcrStatus;
  sizeKb: number;
  width?: number;
  height?: number;
}

export interface Task {
  id: string;
  title: string;
  task_type: TaskType;
  status: TaskStatus;
  risk_level: RiskLevel | null;
  description: string;
  deadline_at: string | null;
  reminder_at: string | null;
  created_at: string;
  updated_at: string;
  images?: ImageAttachment[];
  analysis_result?: AnalysisResult;
}

export interface HelpChannel {
  name: string;
  contact: string;
  desc: string;
  url?: string;
}

export interface Template {
  title: string;
  content: string;
}

export interface ScamStep {
  step: string;
  explanation: string;
}

export interface SimilarCase {
  title: string;
  pattern: string;
  advice: string;
  steps?: string[];
}

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
  help_channels: HelpChannel[];
  templates: Template[];
  scam_steps?: ScamStep[];
  similar_cases: SimilarCase[];
  image_findings?: string[];   // 图片分析发现
  disclaimer: string;
  _provider?: string;
  _model?: string;
  _error?: string;
}

export interface User {
  id: string;
  email: string;
  nickname: string;
  password_hash: string;
  member_mode: MemberMode;
  created_at: string;
}

export interface UserProfile {
  full_name: string;
  phone: string;
  id_number: string;    // 脱敏展示
  address: string;
  email: string;
}

export interface ApiConfig {
  llm_mode: "local" | "api" | "custom";
  gemini_api_key: string;
  gemini_model: string;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
}
