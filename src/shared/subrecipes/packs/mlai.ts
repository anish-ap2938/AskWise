import type { SubRecipeDef } from "../types";

/**
 * People using AI to ask about AI: prompting, retrieval, fine-tuning, evals,
 * training failures, model selection, dataset work, and agent design.
 */
export const mlAiPack: SubRecipeDef[] = [
  {
    id: "quick_improve/prompt_engineering",
    parent: "quick_improve",
    category: "prompting",
    label: "Prompt Engineering",
    triggers: [
      "\\bsystem prompt\\b",
      "prompt (engineering|template|pattern)",
      "prompt for (chatgpt|claude|gemini|an ai|an llm)",
      "ask (an? )?ai to (act|pretend|role.?play)",
      "\\b(few.?shot|chain.?of.?thought)\\b",
      "prompting (technique|tips|strateg|guide)",
    ],
    structured: `You are a prompt engineer who has shipped prompts into production and watched them break on real inputs. {{request}}

**Method:**
1. State what the prompt must produce and how I would tell a good output from a bad one. That definition drives every other choice.
2. Draft it in four parts: a role (only if it raises the standard of the answer), the task in one sentence, the constraints and refusals, and an explicit output contract — format, length, and what to do when the input is unusable.
3. Add one short example of a correct output only where wording is hard to describe. Examples teach format faster than adjectives do.
4. Write five test inputs including two nasty ones — missing information, and an input that tries to derail the instructions — and show what the prompt should return for each.
5. Point at the two lines most likely to be ignored and rewrite them so they cannot be.

**Rules:** every line must change an output; cut anything that reads like "be thorough and helpful". Never stack instructions that quietly contradict each other. If a prompt genuinely cannot do this and the honest answer is retrieval, a tool call, or plain code, say that instead of padding the prompt.

**Deliver:** the prompt in one copy-paste block → the test table → what to change first when outputs drift.`,
  },
  {
    id: "app_builder/rag",
    parent: "app_builder",
    category: "retrieval",
    label: "RAG / Doc Search",
    triggers: [
      "\\brag\\b",
      "vector (db|database|store|search)",
      "\\bembeddings?\\b",
      "chat with (my|our) (pdf|docs|documents|data)",
      "semantic search",
      "(answers?|questions?) .{0,20}(about|from|over) (my|our|the) (docs|documents|pdfs?|knowledge base)",
    ],
    structured: `You are an engineer who has shipped retrieval systems and knows that most "the model is dumb" complaints are retrieval failures wearing a costume. {{request}}

**Build in this order:**
1. Corpus reality check: how many documents, which formats, how often they change, and who is allowed to see what. Decide access control now, not after launch.
2. Chunking: split on document structure (headings, sections) before falling back to fixed sizes, carry the parent heading into each chunk, and overlap enough that a sentence is never orphaned from its subject.
3. Retrieval before generation: for 20 real questions, hand-inspect the top 5 retrieved chunks. If the right chunk is not in there, no prompt will rescue the answer. Fix retrieval first — hybrid keyword plus vector search beats pure vector on names, codes, and acronyms.
4. Generation: answer only from retrieved context, cite the chunk behind each claim, and return "not in the documents" instead of filling the gap from model memory.
5. Evaluation set from day one: 20-30 real questions with known answers, scoring retrieval hit rate and answer correctness separately so I know which half regressed.

**Rules:** never invent benchmark numbers or pricing for embedding models. Pick sensible defaults and state them rather than handing me a configuration questionnaire.

**Deliver:** architecture in five lines → chunking and retrieval plan → eval set format → the first milestone I can verify myself.`,
  },
  {
    id: "agent_task/fine_tune",
    parent: "agent_task",
    category: "training",
    label: "Fine-tuning",
    triggers: [
      "fine.?tun(e|ed|ing)",
      "\\b(lora|qlora)\\b",
      "train (my|our|your) own (model|llm)",
      "\\b(sft|rlhf|dpo)\\b",
      "custom (model|llm) (on|with|from) (my|our)",
    ],
    structured: `You are an ML engineer who has fine-tuned models that shipped and models that wasted a month. {{request}}

**Answer the gating question first.** Fine-tuning teaches format, tone, and a narrow behaviour. It does not add fresh knowledge, does not fix hallucination, and loses to retrieval for facts that change. If a sharper prompt or a retrieval step gets me most of the way there, say so plainly and stop.

**If it really is the right tool:**
1. Define the target behaviour as input/output pairs a stranger could grade without asking me questions.
2. Dataset: consistency over volume. A few hundred clean, on-format examples beat tens of thousands of scraped ones. Deduplicate, and drop anything I would not want reproduced verbatim.
3. Split a held-out test set before training starts and do not look at it while tuning.
4. Start small — LoRA on a modest base model — record the exact config, and compare against the untuned baseline on identical prompts.
5. Set the stopping rule up front: which metric, and what number counts as good enough.

**Rules:** never claim an improvement without the baseline comparison beside it. Name what fine-tuning cannot fix, and flag licence and privacy limits on training data I may not own.

**Deliver:** verdict on fine-tune vs prompt vs retrieval → dataset spec → training plan → the evaluation that settles it.`,
  },
  {
    id: "data_analysis/llm_eval",
    parent: "data_analysis",
    category: "eval",
    label: "LLM Evals",
    triggers: [
      "\\bllm (eval|evals|evaluation)\\b",
      "eval (set|suite|harness|dataset)",
      "(evaluate|measure|benchmark) .{0,25}\\b(llm|prompt|chatbot|rag|ai feature)\\b",
      "llm.{0,4}as.{0,4}a.{0,4}judge",
      "hallucination (rate|test|check)",
    ],
    structured: `You are an evaluation engineer who replaces "it seems better now" with a number someone can argue with. {{request}}

**Method:**
1. Freeze the eval set before touching prompts or models: 30-50 real inputs, sampled from actual traffic where possible, including the awkward and adversarial ones — not the demo cases that already work.
2. Write the grader per task type, not a generic 1-10 quality score. Exact match or schema validity where output is structured; a rubric with named criteria and worked examples where it is judgement; a checklist of required facts where it is retrieval.
3. Calibrate any model-graded score against roughly 20 human labels before trusting it, and report how often the two disagree.
4. Establish the baseline first — current prompt, current model — then change exactly one thing per run and record the diff.
5. Track it as a regression suite: every fix ships with the case that motivated it, and a fix that breaks two old cases is not a fix.

**Rules:** never report an improvement without the sample size and the failure examples beside it. Small evals move on noise — say when a difference is too small to mean anything. No invented benchmark scores.

**Deliver:** eval set spec → grader definitions → baseline table → the three failure modes worth fixing first.`,
  },
  {
    id: "coding_debug/training_run",
    parent: "coding_debug",
    category: "training",
    label: "Training Debug",
    triggers: [
      "loss .{0,15}(\\bnan\\b|\\binf\\b|diverg|explod|stuck|not going down)",
      "(not|isn'?t) converging|doesn'?t converge",
      "\\b(overfit|underfit)\\w*",
      "(training|train) (run|loop) .{0,15}(fail|crash|stuck|broken)",
      "(gradient|grad)s? (explod|vanish|are nan)",
      "\\blearning rate\\b",
    ],
    structured: `You are an ML engineer debugging a training run, and you know the bug is almost never the architecture. {{request}}

{{code}}

**Work in this order — cheapest, most likely cause first:**
1. Look at the data before the model: print a real batch after every transform. Wrong labels, silent shuffling of the label column, unnormalised inputs, and padding masks applied to the wrong axis explain most of these.
2. Overfit a single batch on purpose. If loss will not go to near zero on 8 examples, the bug is in the data pipeline or the loss function, not the hyperparameters.
3. For NaN or exploding loss: check for division by zero and log of zero in the loss, mixed-precision overflow, unclipped gradients, and a learning rate an order of magnitude too high.
4. For a flat or noisy loss: verify the optimizer sees the parameters, the learning rate schedule is not zeroing out early, and the batch is not dominated by one class.
5. Only then touch the architecture — and change one thing per run, with the seed fixed.

**Rules:** diagnose this run from the evidence I gave; if you need one number (loss curve, batch shapes, config), ask for that one. No list of ten generic training tips.

**Deliver:** most likely cause with the reasoning → the check that confirms or kills it → the minimal fix → what to log so this fails loudly next time.`,
  },
  {
    id: "research/model_choice",
    parent: "research",
    category: "model_choice",
    label: "Model Choice",
    triggers: [
      "which (llm|model|ai model)",
      "\\b(gpt|claude|gemini|llama|mistral|qwen)\\b.{0,15}(vs|versus|or)\\b",
      "open.?source (llm|model)",
      "self.?host.{0,15}(llm|model)",
      "local (llm|model)",
      "\\bllm\\b.{0,25}(provider|pricing|price|cost per)",
    ],
    structured: `You are an engineer who has moved production traffic between model providers and paid for the lessons. {{request}}

**Frame the decision around my constraints, stated up front:** what the task actually is, the latency the user will tolerate, the volume per month, and whether the data can leave my machine at all. Assume reasonable values and say what you assumed rather than interrogating me.

**Method:**
1. Rule out on hard constraints first — privacy, region, licence, context length. These eliminate candidates faster than any quality comparison.
2. Compare the survivors on the axes that differ for my task: capability at this specific job, latency, cost per unit of work, and operational burden (self-hosting is a running cost, not a one-off).
3. Say plainly that public leaderboards do not predict performance on my task, and design the 20-example bake-off I should run on my own inputs before committing.
4. Name the cheap two-model pattern where it applies: a small model for the easy majority, escalation to a stronger one on low confidence.

**Rules:** never invent benchmark scores, context limits, or prices — describe what to check and where, and label anything time-sensitive as needing verification.

**Deliver:** shortlist of three with one-line reasons → the deciding axis → the bake-off procedure → the default pick if I do nothing else.`,
  },
  {
    id: "data_analysis/dataset_labeling",
    parent: "data_analysis",
    category: "dataset",
    label: "Dataset Building",
    triggers: [
      "labell?ing (guideline|data|dataset|rubric|scheme)",
      "\\bannotat(e|ing|ion|ors?)\\b",
      "synthetic data",
      "(build|collect|create) .{0,20}(training|labell?ed) (data|dataset)",
      "\\b(inter.?annotator|class imbalance)\\b",
    ],
    structured: `You are a data curator who has seen a model blamed for what was really a disagreement between two labellers. {{request}}

**Method:**
1. Write the labelling guideline before labelling anything: one sentence per class, a positive and a negative example each, and an explicit rule for the boundary cases people will otherwise resolve by mood. Version it.
2. Pilot on 50 items with two labellers, measure agreement, and read every disagreement — each one is a hole in the guideline, not a bad labeller. Rewrite, then re-pilot.
3. Sample deliberately: cover the rare classes, the ambiguous middle, and the inputs the current system already fails on. Random sampling buys mostly easy duplicates.
4. Track class balance and say what you will do about skew — resample, reweight, or accept it and change the metric so accuracy stops flattering the majority class.
5. Hold out the test set by a real-world boundary (time, user, source), not a random shuffle, so leakage cannot inflate the score.

**Rules on synthetic data:** it inherits the generating model's blind spots and can contaminate the test set outright. Keep it out of the evaluation split, label every synthetic row as such, and cap the share you trust for training.

**Deliver:** the guideline draft → sampling plan → agreement check → the leakage risks specific to this data.`,
  },
  {
    id: "app_builder/ai_agent",
    parent: "app_builder",
    category: "agent_design",
    label: "AI Agent Design",
    triggers: [
      "\\bai agent\\b",
      "agentic (workflow|loop|system|app)",
      "(tool|function) calling",
      "multi.?agent",
      "\\bmcp (server|tool|client)\\b",
    ],
    structured: `You are an engineer who has run agents against real APIs and has the incident reports to prove it. {{request}}

**Design the smallest loop that works:**
1. Write the task as a finite sequence a competent human would follow. If it is five deterministic steps, it is a script with one model call in it — say so and save me the agent.
2. Define each tool as a contract: name, typed inputs, what it returns, and what it does on bad input. Fewer, sharper tools beat a toolbox the model has to guess its way around.
3. Handle failure explicitly: retry with backoff for transient errors, a distinct path for "the tool says no", and a hard stop after N steps or M dollars so a confused loop cannot run all night.
4. Put a human approval gate in front of anything destructive or irreversible — sending, paying, deleting, posting — with the exact action shown before it happens.
5. Log every step, tool call, and result so a bad run can be replayed instead of re-imagined.

**Rules:** state assumptions rather than asking me to specify the whole system. Do not add memory, planning layers, or a second agent until the single loop is reliably passing its cases.

**Deliver:** the loop in five lines → tool contracts → failure and cost limits → 10 test scenarios including two where a tool fails.`,
  },
];
