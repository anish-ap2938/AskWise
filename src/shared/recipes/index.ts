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
import { learningRecipe } from "./learning";
import { planningRecipe } from "./planning";
import { marketingRecipe } from "./marketing";
import { businessRecipe } from "./business";
import { financeRecipe } from "./finance";
import { healthRecipe } from "./health";
import { mathHelpRecipe } from "./mathHelp";
import { translationRecipe } from "./translation";
import { imageGenRecipe } from "./imageGen";

export const recipes: Recipe[] = [
  quickImproveRecipe,
  simpleAnswerRecipe,
  learningRecipe,
  researchRecipe,
  appBuilderRecipe,
  codingDebugRecipe,
  agentTaskRecipe,
  dataAnalysisRecipe,
  mathHelpRecipe,
  writingRecipe,
  translationRecipe,
  marketingRecipe,
  businessRecipe,
  resumeJobRecipe,
  financeRecipe,
  healthRecipe,
  planningRecipe,
  imageGenRecipe,
];

const recipeMap = new Map<ModeId, Recipe>(
  recipes.map((r) => [r.id, r])
);

export function getRecipe(mode: ModeId): Recipe {
  return recipeMap.get(mode) ?? quickImproveRecipe;
}

export { quickImproveRecipe, simpleAnswerRecipe, researchRecipe, appBuilderRecipe };
export { codingDebugRecipe, resumeJobRecipe, writingRecipe, dataAnalysisRecipe, agentTaskRecipe };
export { learningRecipe, planningRecipe, marketingRecipe, businessRecipe, financeRecipe };
export { healthRecipe, mathHelpRecipe, translationRecipe, imageGenRecipe };
