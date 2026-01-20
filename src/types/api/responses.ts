/**
 * API Response Types
 */

// ============================================================================
// Base Response Types
// ============================================================================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// Type Guards for Responses
// ============================================================================

export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> {
  return response.success === true;
}

export function isApiError<T>(response: ApiResponse<T>): response is ApiErrorResponse {
  return response.success === false;
}

// ============================================================================
// Award Rewards Response
// ============================================================================

export interface AwardRewardsResponseData {
  xp_awarded: number;
  coins_awarded: number;
  new_xp_total: number;
  new_coin_total: number;
  claim_id: string;
  badges_earned?: Array<{
    id: string;
    name: string;
    icon_url?: string;
  }>;
}

// ============================================================================
// Grade Assignment Response
// ============================================================================

export interface GradeAssignmentResponseData {
  score: number;
  total_points: number;
  percentage: number;
  passed: boolean;
  xp_earned: number;
  coins_earned: number;
  question_results: Array<{
    question_id: string;
    correct: boolean;
    points_earned: number;
    feedback?: string;
  }>;
}

// ============================================================================
// Study Plan Response
// ============================================================================

export interface StudyPlanResponseData {
  plan: string;
  topics: string[];
  recommendations: string[];
  estimated_time: string;
}

// ============================================================================
// Sync Responses
// ============================================================================

export interface SyncStudentResponseData {
  student_id: string;
  geoblox_response?: unknown;
  nycologic_response?: unknown;
  synced_at: string;
}

export interface ImportClassesResponseData {
  imported: number;
  skipped: number;
  classes: Array<{
    name: string;
    class_code: string;
  }>;
  students_enrolled: number;
  students_pending: number;
  synced_at: string;
}

// ============================================================================
// Invite Response
// ============================================================================

export interface InviteResponseData {
  id: string;
  token: string;
  invite_url: string;
  student_name?: string;
  student_email?: string;
  expires_at: string;
}

export interface BulkInviteResponseData {
  count: number;
  invites: InviteResponseData[];
}

// ============================================================================
// External API Response
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page?: number;
  pageSize?: number;
  hasMore?: boolean;
}
