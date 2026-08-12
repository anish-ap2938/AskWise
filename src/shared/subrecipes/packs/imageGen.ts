import type { SubRecipeDef } from "../types";

/**
 * Image / video generation prompts. Structurally unlike every other pack: the
 * deliverable is a copyable prompt STRING, not prose about the request.
 */
export const imageGenPack: SubRecipeDef[] = [
  {
    id: "image_gen/photoreal",
    parent: "image_gen",
    category: "photo",
    label: "Photoreal Image Prompt",
    triggers: [
      "\\b(photoreal(istic)?|product shot|studio lighting|golden hour|shallow depth of field|bokeh)\\b",
      "\\b(midjourney|stable diffusion|dall.?e|flux|leonardo|ideogram)\\b",
      "prompt for (a|an|my) (photo|product|portrait|headshot|image)",
      "\\b(\\d{2}mm lens|f\\/[\\d.]+|dslr|softbox)\\b",
    ],
    structured: `You are a prompt engineer for photoreal image models. Turn this into a generation prompt: {{request}}

**Fill every slot, in this order — a slot left vague is a slot the model invents badly:**
1. Subject: who or what, age, wardrobe, expression, action. Concrete nouns beat adjectives.
2. Framing: shot size (close-up, medium, wide), camera angle, and where the subject sits in frame.
3. Lighting: source, direction and quality — softbox key, hard rim light, overcast window — plus time of day.
4. Environment and colour: location, background depth, and a 2-3 colour palette.
5. Camera: focal length and aperture. 85mm at f/1.4 reads nothing like 24mm at f/8.
6. Aspect ratio, then a negative prompt naming what ruins this specific shot (extra fingers, watermark, plastic skin, blown highlights).

**Deliver:** the final prompt as one copyable fenced code block, then 2 variations in their own blocks — one changing the lighting, one changing lens and framing — each with a one-line note on the mood it buys.`,
    advanced: `Act as a senior prompt engineer who ships production image prompts. Rewrite my brief into model-ready prompts: {{request}}

**Method:** assume Midjourney v6 unless I named a model, and match that model's syntax. Fill every slot with a concrete value — subject, framing, lighting, environment, colour palette, focal length, aperture, film or sensor look, aspect ratio. No slot may resolve to "detailed" or "high quality". Express the negative prompt in the target model's own syntax (--no for Midjourney, a separate negative field for Stable Diffusion).

**Output contract:** (1) the primary prompt in a fenced code block, single line, copy-paste ready; (2) a slot table showing the value you chose for each slot; (3) exactly 2 variations in their own code blocks — one lighting change, one lens and framing change; (4) one line on what to change first when the result is close but wrong.

**Acceptance checks:** every slot has a specific value; no filler tokens ("masterpiece", "8k", "ultra detailed"); aspect ratio stated explicitly; negative prompt present and model-correct; zero square-bracket placeholders left in any prompt.`,
  },
  {
    id: "image_gen/illustration",
    parent: "image_gen",
    category: "illustration",
    label: "Illustration Prompt",
    triggers: [
      "\\b(illustration|digital painting|concept art|line art|pixel art|vector art|watercolo(u)?r|gouache)\\b",
      "\\b(anime|manga|studio ghibli|cel.?shaded|comic panel|storybook) style\\b",
      "in the style of (a|an)? ?\\w+ (painting|illustration|artist|print)",
      "\\b(midjourney|niji|stable diffusion|dall.?e) .{0,20}(draw|illustrat|art)",
    ],
    structured: `You are a prompt engineer who art-directs illustration models. Turn this into a generation prompt: {{request}}

**Fill every slot, in this order:**
1. Subject and action: who, doing what, with what expression, and the story the single frame tells.
2. Composition and framing: shot size, camera angle, where the subject sits, and how much negative space.
3. Medium and technique: the actual material and mark-making — gouache on textured paper, thick ink linework with flat fills, cel shading with hard shadow edges. Name a movement or era rather than a living artist.
4. Lighting and colour: light direction and mood, plus a named 3-4 colour palette.
5. Detail level and line weight, so the model doesn't over-render a flat style.
6. Aspect ratio, then a negative prompt (photoreal skin, 3D render, muddy colours, text artifacts).

**Deliver:** the final prompt in one copyable fenced code block, then 2 variations — one shifting medium, one shifting palette and mood — each with a one-line note on when to use it.`,
    advanced: `Act as an art director writing prompts for an illustration model. Rewrite my brief into model-ready prompts: {{request}}

**Method:** assume Midjourney v6 with the niji style for anime work unless I named a model, and match its syntax. Give every slot a concrete value — subject and action, composition, medium and mark-making, lighting, a named 3-4 colour palette, line weight, detail level, aspect ratio. Reference movements, eras or techniques rather than living artists. Express the negative prompt in the target model's syntax and use it to hold the style flat where flatness is the point.

**Output contract:** (1) the primary prompt in a fenced code block, single line; (2) a slot table with the chosen value for each slot; (3) exactly 2 variations in their own code blocks — one alternate medium, one alternate palette and mood; (4) one line on the first parameter to adjust when the output is over-rendered.

**Acceptance checks:** medium and mark-making are physically describable; palette given as named or hex colours; no living-artist names; aspect ratio explicit; negative prompt present and model-correct; no placeholders remaining.`,
  },
  {
    id: "image_gen/logo",
    parent: "image_gen",
    category: "brand",
    label: "Logo / Icon Prompt",
    triggers: [
      "\\b(logo (design|concept|prompt|idea|for)|wordmark|brand mark|app icon|favicon)\\b",
      "\\b(minimalist|flat|geometric|vector) logo\\b",
      "\\b(mascot|emblem|monogram) (logo|design)\\b",
    ],
    structured: `You are a brand designer writing prompts for logo and icon generation. Turn this into a generation prompt: {{request}}

**Fill every slot:**
1. Mark type: wordmark, lettermark, abstract mark, pictorial mark, or emblem — pick one and say why it suits this brand.
2. Subject or concept: the single idea the mark encodes. One metaphor, not three stacked.
3. Style: geometric flat vector, thick-stroke line icon, negative-space mark — with construction notes (uniform stroke weight, 45-degree angles only, single continuous line).
4. Colour: 1-2 flat colours named as hex, plus confirmation it survives in pure black on white.
5. Background: solid white or transparent, centred, generous margin. Square aspect ratio.
6. Negative prompt: gradients, drop shadows, photorealism, mockups, busy detail, and text — image models still spell badly, so generate the mark and set the wordmark in real type afterwards.

**Deliver:** the final prompt in a copyable fenced code block, then 2 variations exploring different metaphors, plus a one-line note on which reads best at 16 pixels.`,
    advanced: `Act as a brand identity designer directing an image model. Produce logo prompts from: {{request}}

**Method:** choose one mark type and one metaphor, then specify construction constraints an illustrator would follow — stroke weight, grid, angle set, corner radius, symmetry. Colour as hex, maximum two, with a stated mono fallback. Square canvas, centred, flat background, generous margin. Explicitly exclude lettering from the generated mark: prompt the symbol only and note the typeface pairing to set the name in separately.

**Output contract:** (1) the primary prompt in a fenced code block; (2) a design rationale of no more than 3 lines covering mark type, metaphor and colour; (3) exactly 2 alternate prompts in their own code blocks, each using a different metaphor; (4) a typeface pairing suggestion for the wordmark.

**Acceptance checks:** every prompt is square-ratio and background-specified; no gradients, shadows, mockups or lettering requested; colours given as hex with a black-on-white fallback stated; each mark is describable in one sentence over the phone; nothing depends on the model rendering text.`,
  },
  {
    id: "image_gen/video",
    parent: "image_gen",
    category: "video",
    label: "Video / Motion Prompt",
    triggers: [
      "\\b(sora|veo|runway|kling|pika|luma dream|animatediff)\\b",
      "\\b(video prompt|b.?roll|storyboard|cinematic shot|shot list)\\b",
      "\\b(camera (pans?|dollys?|tilts?|zooms?)|tracking shot|dolly (in|out)|crane shot)\\b",
      "\\d+.?(second|sec) (clip|video|shot|animation)",
    ],
    structured: `You are a prompt engineer for video generation models, where motion is the hard part. Turn this into a generation prompt: {{request}}

**Fill every slot:**
1. Subject and action: one clear action with a beginning and end. Two simultaneous actions in a short clip produce mush.
2. Camera: shot size, angle, lens, and the move itself — slow dolly in, handheld follow, locked-off tripod. Name the speed of the move.
3. Environment, lighting and time of day, plus a 2-3 colour palette and film stock or grade.
4. Duration and pacing: seconds, and whether it's one continuous take or a cut.
5. Audio direction if the model supports it (ambience, no dialogue).
6. Aspect ratio and frame rate, then a negative prompt: morphing limbs, warping faces, jitter, text overlays, sudden style shifts.

**Deliver:** the final prompt in one copyable fenced code block, then 2 variations — one changing the camera move, one changing lighting and grade — plus one line on the failure most likely in this specific shot.`,
    advanced: `Act as a director of photography writing prompts for a video generation model. Produce shot prompts from: {{request}}

**Method:** assume a 5-second single take unless I said otherwise, and keep it to ONE subject action plus ONE camera move — the dominant failure mode of these models is asking for two things at once. Specify shot size, lens, camera move and its speed, lighting setup and direction, colour grade, environment, wardrobe, aspect ratio and frame rate. Keep the subject description identical across every prompt in the set so shots can be cut together.

**Output contract:** (1) the primary shot prompt in a fenced code block; (2) a slot table for subject, camera, lighting, grade, duration, ratio; (3) exactly 2 variations in code blocks — one alternate camera move, one alternate lighting and grade; (4) a one-line continuity note for stitching the shots into a sequence.

**Acceptance checks:** one action and one camera move per prompt; duration and aspect ratio explicit; negative prompt covers morphing, warping faces and text artifacts; subject wording byte-identical across variations; no placeholders left unfilled.`,
  },
  {
    id: "image_gen/character_consistency",
    parent: "image_gen",
    category: "consistency",
    label: "Consistent Character",
    triggers: [
      "\\b(consistent character|character (sheet|turnaround|consistency)|reference sheet)\\b",
      "same character (across|in|for) (multiple|every|all|different)",
      "\\b(same seed|--cref|character reference|lora training)\\b",
      "keep (the|my|this) character (the same|consistent|looking)",
    ],
    structured: `You are a prompt engineer solving character consistency across generations. Turn this into a reusable prompt system: {{request}}

**Build it in this order:**
1. Write a locked character block: age, ethnicity, face shape, eye and hair colour, hairstyle, build, distinguishing marks, and a fixed wardrobe. This text must be reused byte-for-byte in every prompt — paraphrasing it is what breaks consistency.
2. Generate a character reference sheet first: front, three-quarter and profile views, neutral lighting, plain background, full body.
3. Lock the technical controls: one seed, one style suffix, one model version, plus the character-reference parameter (--cref, an IP-adapter, or a trained LoRA) with the reference image.
4. Only then vary scene, pose, lighting and framing — one variable at a time so you can tell what broke the likeness.
5. Aspect ratio and a negative prompt: age drift, changed hair, extra accessories, style shift.

**Deliver:** the locked character block, the reference-sheet prompt, and 2 scene prompts reusing that block verbatim — all as copyable fenced code blocks.`,
    advanced: `Act as a prompt engineer building a reusable character bible for an image model. Produce it from: {{request}}

**Method:** write one immutable character block (20-40 words: age, face, hair, build, marks, fixed wardrobe) that is pasted verbatim into every prompt. Pin the technical controls — model version, seed, style suffix, and the consistency mechanism the model supports (--cref with a reference URL, IP-adapter, or LoRA trigger word). Generate the reference sheet before any scene shot. Vary exactly one of scene, pose, lighting or framing per prompt so drift is attributable.

**Output contract:** (1) the character block in its own fenced code block, marked do-not-edit; (2) the reference-sheet prompt; (3) exactly 2 scene prompts embedding the block verbatim; (4) a control table listing seed, model, style suffix and reference parameter; (5) a drift checklist of what to compare between outputs.

**Acceptance checks:** the character block is character-identical in every prompt; seed and model stated once and reused; only one variable changes per scene prompt; negative prompt covers age, hair and style drift; nothing left as a placeholder.`,
  },
];
