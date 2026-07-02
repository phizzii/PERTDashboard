export interface PromptContext {
  projectName: string;
  completionLikelihood?: number;
  plannedDays?: number | null;
  expectedTotal?: number;
  varianceTotal?: number;
  selectedStage?: string;
  userInput?: string;
}

export function buildForecastReasoningPrompt(context: PromptContext) {
  const stageLabel = context.selectedStage && context.selectedStage !== "Overall plan"
    ? `for ${context.selectedStage}`
    : "for the overall delivery plan";

  const likelihood = context.completionLikelihood ?? 72;
  const expected = context.expectedTotal ?? 0;
  const variance = context.varianceTotal ?? 0;
  const buffer = context.plannedDays ? `with ${context.plannedDays} planned days in the window` : "with the current project dates";

  return `This forecast is ${likelihood}% likely to succeed because the plan currently has ${expected} days of expected effort and ${variance} variance ${buffer}. The reasoning is to protect the critical path ${stageLabel} and keep contingency time in place before the next milestone.`;
}

export function buildChatPrompt(context: PromptContext) {
  const stageLabel = context.selectedStage && context.selectedStage !== "Overall plan"
    ? ` for ${context.selectedStage}`
    : "";

  return `You are a PERT project planning assistant helping with ${context.projectName}${stageLabel}. The user asked: "${context.userInput ?? "Please help me improve this plan"}". Answer in clear UK English, keep it practical, and focus on the next best improvement to the plan.`;
}

export function buildSuggestionPrompt(context: PromptContext, suggestionLabel: string) {
  const stageLabel = context.selectedStage && context.selectedStage !== "Overall plan"
    ? ` for ${context.selectedStage}`
    : "";

  return `Create a concise practical recommendation labelled ${suggestionLabel}${stageLabel} for ${context.projectName}.`;
}
