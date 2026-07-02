export interface PromptContext {
  projectName: string;
  completionLikelihood?: number;
  plannedDays?: number | null;
  expectedTotal?: number;
  varianceTotal?: number;
  selectedStage?: string;
  userInput?: string;
  stageEstimate?: {
    optimistic: number;
    mostLikely: number;
    pessimistic: number;
  } | null;
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

export function buildStageImprovementPrompt(context: PromptContext) {
  const stageLabel = context.selectedStage && context.selectedStage !== "Overall plan"
    ? `for ${context.selectedStage}`
    : "for the overall plan";
  const estimateContext = context.stageEstimate
    ? `The current PERT estimates are O=${context.stageEstimate.optimistic}, M=${context.stageEstimate.mostLikely}, P=${context.stageEstimate.pessimistic}.`
    : "";

  return `You are supporting a PERT planning review for ${context.projectName}. ${estimateContext} For ${stageLabel}, describe exactly three concise, practical improvement points that could make the stage more reliable. Keep the response as a simple list with one point per line and no extra commentary.`;
}

export function buildStageSolutionPrompt(context: PromptContext, improvementPoint: string) {
  const stageLabel = context.selectedStage && context.selectedStage !== "Overall plan"
    ? `for ${context.selectedStage}`
    : "for the overall plan";

  return `You are supporting a PERT planning review for ${context.projectName}. ${stageLabel} has the following improvement idea: "${improvementPoint}". Give one clear, practical solution that the team could implement next, and keep it concise in UK English.`;
}

export function buildAssessmentPrompt(context: PromptContext, assessmentKind: "review" | "inspect" | "assess") {
  const stageLabel = context.selectedStage && context.selectedStage !== "Overall plan"
    ? `for ${context.selectedStage}`
    : "for the overall plan";

  const focusText = {
    review: "what is going well and what should be reviewed next",
    inspect: "what is going well and what should be inspected closely",
    assess: "what is going well and what should be assessed for risk",
  }[assessmentKind];

  return `You are supporting a PERT planning review for ${context.projectName}. ${stageLabel}. Briefly explain ${focusText} in a practical, encouraging way, using UK English and keeping it concise.`;
}
