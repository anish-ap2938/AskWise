import type { ModeId, Recipe } from "../types";
import { quickImproveRecipe } from "./quickImprove";
import { simpleAnswerRecipe } from "./simpleAnswer";
import { researchRecipe } from "./research";
import { appBuilderRecipe } from "./appBuilder";
import { codingDebugRecipe } from "./codingDebug";
import { resumeJobRecipe } from "./resumeJob";
import { writingRecipe } from "./writing";
import { dataAnalysisRecipe } from "./dataAnalysis";
import { agentTaskRecipe } from "./agentTask";

export const recipes: Recipe[] = [
  quickImproveRecipe,
  simpleAnswerRecipe,
  researchRecipe,
  appBuilderRecipe,
  codingDebugRecipe,
  resumeJobRecipe,
  writingRecipe,
  dataAnalysisRecipe,
  agentTaskRecipe,
];

const recipeMap = new Map<ModeId, Recipe>(
  recipes.map((r) => [r.id, r])
);

export function getRecipe(mode: ModeId): Recipe {
  return recipeMap.get(mode) ?? quickImproveRecipe;
}

export { quickImproveRecipe, simpleAnswerRecipe, researchRecipe, appBuilderRecipe };
export { codingDebugRecipe, resumeJobRecipe, writingRecipe, dataAnalysisRecipe, agentTaskRecipe };
