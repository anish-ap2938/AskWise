import type { TargetModel } from "./types";

export function getStyleRules(targetModel: TargetModel): string {
  switch (targetModel) {
    case "claude":
      return [
        "Use XML-style section tags (<role>, <task>, <context>, <constraints>, <output_format>, <self_check>).",
        "Use explicit action verbs (implement, not can you).",
        "Include a <self_check> section when appropriate.",
      ].join(" ");
    case "chatgpt":
      return [
        "Use bold section labels.",
        "Order: task → context → ideal output → constraints.",
        "Be explicit about audience, tone, and length.",
      ].join(" ");
    case "gemini":
      return [
        "Use clear markdown headers and numbered steps.",
        "State the persona/role first, then the task.",
        "Ask for grounded, source-backed answers where facts matter.",
      ].join(" ");
    default:
      return [
        "Use plain markdown sections.",
        "Use implementation-first phrasing.",
        "Include acceptance criteria; do not over-refactor.",
      ].join(" ");
  }
}
