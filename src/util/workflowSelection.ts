import { WorkflowSettings } from "../config";
import { Area } from "../types";

/**
 * Why a workflow was chosen
 * - republish: The changes do not need the video to be processed again
 * - process: The video needs to be processed
 * - failed: The last workflow failed, so the video needs to be processed to be safe
 */
export type WorkflowReason = "republish" | "process" | "failed";

/**
 * Chooses the workflow that fits the changes best.
 * Only changes that a republish can handle get the republish workflow. If nothing changed, or if the last
 * workflow failed, the video is processed to be safe.
 */
export const chooseWorkflow = (
  changedAreas: readonly Area[],
  lastWorkflowFailed: boolean,
  settings: Pick<WorkflowSettings, "republishWorkflow" | "publishWorkflow" | "republishAreas">,
): { workflowId: string, reason: WorkflowReason } => {
  if (lastWorkflowFailed) {
    return { workflowId: settings.publishWorkflow, reason: "failed" };
  }
  const canRepublish = changedAreas.length > 0 && changedAreas.every(area => settings.republishAreas.includes(area));
  return canRepublish
    ? { workflowId: settings.republishWorkflow, reason: "republish" }
    : { workflowId: settings.publishWorkflow, reason: "process" };
};
