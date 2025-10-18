export type JobKind = "generate_site" | "edit_section" | "generate_image";

export interface BaseJobPayload {
  userId: string;
  providerId: "openai" | "anthropic" | "google";
  model: string;
}

export interface GenerateSiteJob extends BaseJobPayload {
  kind: "generate_site";
  prompt: string;
  siteId: string;
}

export interface EditSectionJob extends BaseJobPayload {
  kind: "edit_section";
  siteId: string;
  pageRoute: string;
  sectionId: string;
  instruction: string;
}

export interface GenerateImageJob extends BaseJobPayload {
  kind: "generate_image";
  prompt: string;
  size: "256x256" | "512x512" | "1024x1024";
  siteId: string;
}

export type JobPayload = GenerateSiteJob | EditSectionJob | GenerateImageJob;

export interface QueueJob<T extends JobPayload = JobPayload> {
  id: string;
  payload: T;
  scheduledAt: number;
  attempts: number;
  maxAttempts: number;
  status: "pending" | "processing" | "completed" | "failed";
  lastError?: string;
  result?: unknown;
}
