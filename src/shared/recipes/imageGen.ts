import type { Recipe } from "../types";
import { getStyleRules } from "../styleRules";
import { cleanRequest } from "../extract";

export const imageGenRecipe: Recipe = {
  id: "image_gen",
  label: "Image & Video Prompts",
  description: "Prompts for Midjourney, Sora, and other generative models",
  slots: ["task", "context", "constraints", "output_format", "examples"],
  localRewrite(raw, ctx) {
    const request = cleanRequest(raw);

    const simple = `${request}

Turn this into an actual generation prompt: subject and action, setting, lighting, style and medium, colour, and framing. Give me the prompt as one copyable block, plus a negative prompt.`;

    const structured = `Write me a generation prompt for: ${request}

**Build it from these layers, most important first:**
- **Subject** — who or what, doing what, with the details that matter
- **Setting** — where, when, weather or time of day
- **Composition** — shot type and angle (close-up, wide, low angle), what's in focus
- **Light** — source, direction, quality (soft window light, harsh noon sun, neon rim)
- **Style** — medium and reference (35mm photo, oil painting, 3D render, specific art movement)
- **Colour** — palette or mood
- **Technical** — aspect ratio, and lens or film stock if photographic

**Deliver:** the final prompt as one copyable block → a negative prompt of what to exclude → 2 variations that change one meaningful thing each (not synonyms). Describe what IS there; models handle positive description better than negation.`;

    const advanced = `**Role:** A prompt engineer for generative image and video models who knows that specific nouns and real photographic language beat adjective stacking.

**Concept:** ${request}

**Method:**
1. Ask which model this is for if it matters (Midjourney, Stable Diffusion, Flux, DALL·E, Sora, Veo) — parameter syntax and prompt length differ. Otherwise write model-agnostic and note the syntax differences at the end.
2. Resolve the concept into concrete visual decisions. Replace every abstract word ("beautiful", "epic", "vibe") with something a camera could actually record.
3. Order the prompt by importance — most models weight earlier tokens more heavily.
4. Cover: subject and action, setting, composition and camera angle, lighting, style and medium, colour palette, mood, technical parameters.
5. For video, add camera movement, shot duration, and what changes across the shot.

**Output contract:** the primary prompt in a code block, a negative prompt, suggested aspect ratio and parameters, then 2 variations that each change exactly one axis (lighting, or style, or framing) with the axis labeled. No named living artists; describe the style instead.

**Acceptance checks:** every element is visually concrete; no contradictions (a wide shot that's also a macro); state the one element most likely to be rendered wrong and how to phrase around it.

${getStyleRules(ctx.targetModel)}`;

    return { simple, structured, advanced };
  },
  llmSystemPrompt: (target) =>
    `You rewrite user prompts. You do NOT answer them. Mode: Image & Video Prompts. ${getStyleRules(target)} Demand: concrete visual detail over adjectives, layered subject/setting/composition/lighting/style/colour/technical structure, a copyable prompt block, a negative prompt, aspect ratio, and 2 single-axis variations.`,
};
