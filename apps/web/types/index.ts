export type RiskLevel = "low" | "medium" | "high" | "critical";

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
  help_channels: HelpChannel[];
  templates: Template[];
  similar_cases: SimilarCase[];
  disclaimer: string;
}
