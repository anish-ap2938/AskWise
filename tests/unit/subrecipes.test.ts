import { describe, expect, it } from "vitest";
import { allSubRecipes, findSubRecipe, renderSubRecipe } from "../../src/shared/subrecipes";
import { improveTier1 } from "../../src/shared/improve";

describe("sub-recipe registry", () => {
  it("has at least 200 sub-recipes across granular categories", () => {
    expect(allSubRecipes.length).toBeGreaterThanOrEqual(200);
  });

  it("registers every pack file in src/shared/subrecipes/packs", async () => {
    const packs = import.meta.glob<Record<string, unknown>>("../../src/shared/subrecipes/packs/*.ts");
    const registered = new Set(allSubRecipes.map((d) => d.id));
    for (const [path, load] of Object.entries(packs)) {
      const mod = await load();
      const pack = Object.values(mod).find(Array.isArray) as Array<{ id: string }> | undefined;
      expect(pack, `${path} must export a sub-recipe array`).toBeDefined();
      for (const def of pack!) {
        expect(registered.has(def.id), `${def.id} (${path}) is not spread into allSubRecipes`).toBe(true);
      }
    }
  });

  it("has unique ids in parent/slug form", () => {
    const ids = allSubRecipes.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const d of allSubRecipes) {
      expect(d.id.startsWith(`${d.parent}/`), `${d.id} must start with ${d.parent}/`).toBe(true);
    }
  });

  it("all triggers are valid regexes", () => {
    for (const d of allSubRecipes) {
      for (const t of d.triggers) {
        expect(() => new RegExp(t, "i"), `${d.id}: ${t}`).not.toThrow();
      }
    }
  });

  it("every sub-recipe renders 3 non-empty variants", () => {
    for (const d of allSubRecipes) {
      const v = renderSubRecipe(d, "sample request about the topic", {
        targetModel: "chatgpt",
      });
      expect(v.simple.length, `${d.id} simple`).toBeGreaterThan(20);
      expect(v.structured.length, `${d.id} structured`).toBeGreaterThan(50);
      expect(v.advanced.length, `${d.id} advanced`).toBeGreaterThan(50);
      expect(v.structured).not.toContain("{{");
      expect(v.advanced).not.toContain("{{");
      expect(v.simple).not.toContain("{{");
    }
  });
});

describe("sub-recipe routing", () => {
  const cases: Array<{ text: string; mode: Parameters<typeof findSubRecipe>[1]; id: string }> = [
    { text: "how do i make my resume pass ats screening", mode: "resume_job", id: "resume_job/ats" },
    { text: "write a cover letter for a data analyst position", mode: "resume_job", id: "resume_job/cover_letter" },
    { text: "salary negotiation after job offer", mode: "resume_job", id: "resume_job/salary" },
    { text: "my page is slow and takes 8 seconds to load", mode: "coding_debug", id: "coding_debug/performance" },
    { text: "explain machine learning like im five", mode: "learning", id: "learning/eli5" },
    { text: "help me decide between renting and buying", mode: "quick_improve", id: "quick_improve/decision" },
    { text: "write an email to my boss about a deadline", mode: "writing", id: "writing/professional_email" },
    { text: "draft a wedding toast for my best friend", mode: "writing", id: "writing/speech" },
    { text: "build me a website for my bakery", mode: "app_builder", id: "app_builder/business_site" },
    { text: "best laptops under $1000 for programming", mode: "research", id: "research/buying" },
    { text: "excel formula to sum values between dates", mode: "data_analysis", id: "data_analysis/spreadsheet" },
    { text: "explain how the immune system fights infection", mode: "learning", id: "learning/clinical_explain" },
    { text: "tips to sleep better at night", mode: "health", id: "health/wellness_plan" },
    { text: "is it legal to record a phone call in california", mode: "learning", id: "learning/legal_explain" },
    { text: "how do i start investing with very little money as a complete beginner please", mode: "finance", id: "finance/personal_finance" },
    { text: "explain the krebs cycle step by step", mode: "learning", id: "learning/science_explain" },
    { text: "literature review on intermittent fasting outcomes", mode: "research", id: "research/scientific_lit" },
    { text: "build an ecommerce store with checkout", mode: "app_builder", id: "app_builder/ecommerce" },
    { text: "brainstorm ideas for a newsletter", mode: "quick_improve", id: "quick_improve/brainstorm" },
    { text: "implement dark mode for the settings page", mode: "agent_task", id: "agent_task/feature" },
  ];

  for (const c of cases) {
    it(`routes "${c.text}" to ${c.id}`, () => {
      expect(findSubRecipe(c.text, c.mode)?.id).toBe(c.id);
    });
  }

  /**
   * One prompt per sub-recipe in the packs that were added with the 18-mode
   * expansion. Resolved by slug so a later re-parent does not silently drop the
   * coverage: the entry must still exist, and must still win inside its own mode.
   */
  const packCoverage: Array<[string, string]> = [
    ["plan a 5 day itinerary for a trip to lisbon", "trip"],
    ["help me plan my sister's wedding for 80 guests", "event"],
    ["meal plan for the week with a grocery list", "meal"],
    ["i'm moving to a new city next month, what do i need to do", "move"],
    ["build me a morning routine that i'll actually stick to", "routine"],
    ["break this project down into milestones, the deadline is march", "project_timeline"],
    ["plan my week", "plan_week"],
    ["cheap dinner ideas for the week on a tight budget", "cheap_meals"],
    ["apartment hunting checklist, what should i look for at a viewing", "apartment_hunt"],
    ["seo strategy and keyword research for my blog", "seo"],
    ["write ad copy for my facebook ads campaign", "ad_copy"],
    ["landing page copy that converts for my saas", "landing_page"],
    ["build me a content calendar, 3 posts a week", "social_calendar"],
    ["welcome series email sequence for new subscribers", "email_campaign"],
    ["product launch plan for product hunt", "launch"],
    ["help me with brand positioning and a tagline", "positioning"],
    ["handle the objection that we're too expensive", "sales_convo"],
    ["write a prd with user stories and acceptance criteria", "prd"],
    ["how much should i charge for my consulting work", "pricing"],
    ["write a business plan for my agency", "business_plan"],
    ["go to market strategy, how do we find our first customers", "gtm"],
    ["pitch deck for a seed round", "pitch_deck"],
    ["do our unit economics work, cac and ltv", "unit_economics"],
    ["scope creep, my client keeps asking for extra work", "client_work"],
    ["giving feedback to a direct report who is underperforming", "team_management"],
    ["improve the onboarding so new users get value faster", "onboarding"],
    ["help me prioritise the roadmap, everything is p0", "prioritization"],
    ["customer interviews, what questions should i ask", "customer_research"],
    ["solve this word problem, if a train leaves how long until", "word_problem"],
    ["find the derivative using the chain rule", "calculus"],
    ["compute a confidence interval and the p value", "statistics"],
    ["prove that the sum of two even numbers is even", "proof"],
    ["check my work, did i solve this right", "check_work"],
    ["projectile physics problem with a free body diagram", "physics"],
    ["work through my problem set, questions 1 to 5", "problem_set"],
    ["translate this email into german", "translate"],
    ["localize our copy for the brazilian market", "localize"],
    ["should i use tu or vous in this message", "formality"],
    ["what does sobremesa mean in spanish", "phrase_meaning"],
    ["explain the difference between ser and estar in spanish", "grammar_point"],
    ["midjourney prompt for a photoreal product shot", "photoreal"],
    ["watercolour illustration prompt for a storybook", "illustration"],
    ["logo design prompt, minimalist vector logo", "logo"],
    ["sora video prompt, 5 second clip with a dolly in", "video"],
    ["how do i keep the same character across multiple images", "character_consistency"],
    ["outline an argumentative essay about renewable energy", "essay_outline"],
    ["give me feedback on my essay draft before i submit it", "essay_feedback"],
    ["how should i structure my dissertation chapters", "dissertation"],
    ["write up my chemistry lab report on titration", "lab_report"],
    ["format these citations in apa style for my bibliography", "citations"],
    ["make me flashcards to memorise this material with active recall", "active_recall"],
    ["explain this research paper i cant get through the methods section", "paper_explain"],
    ["write my personal statement for college applications", "personal_statement"],
    ["statement of purpose for a masters in computer science", "statement_of_purpose"],
    ["turn my lecture notes into study notes i can revise from", "lecture_notes"],
    ["edit my thesis paragraph for clarity without changing my argument", "academic_clarity"],
    ["where should i go on holiday, comparing iceland and portugal", "travel_choice"],
    ["birthday gift ideas for my dad who likes fishing", "gift_ideas"],
    ["my kitchen tap is dripping, how do i fix it", "home_repair"],
    ["my car is making a grinding noise when i brake", "car_trouble"],
    ["my dog barks at every person who walks past the window", "pet_behavior"],
    ["my monstera has yellow leaves and brown spots", "plant_care"],
    ["how do i get red wine out of a cream carpet", "household_care"],
    ["my wifi keeps dropping every evening", "home_tech"],
    ["i need to renew my passport and cancel a subscription", "personal_admin"],
    ["write a complaint letter to an airline about a delayed bag", "complaint"],
    ["my roommate keeps leaving dishes and i dont know how to bring it up", "relationship_conflict"],
    ["help me get better at small talk at work events", "small_talk"],
    ["write my dating profile bio", "dating_profile"],
    ["conversation starters for a first date", "first_date"],
    ["my 4 year old melts down every bedtime", "parenting"],
    ["write a condolence note to a colleague whose father died", "condolence"],
    ["how do i ask someone for a referral without being awkward", "networking"],
    ["how do i pronounce the french r sound", "pronunciation"],
    ["practice a conversation with me in german at b1 level", "conversation_practice"],
    ["i want to get better at drawing hands", "deliberate_practice"],
    ["how do i get better at chess openings", "game_strategy"],
    ["critique my photograph, why does it look flat", "creative_critique"],
    ["practice routine for learning guitar as an adult beginner", "instrument"],
    ["my running form breaks down after 5k", "sport_technique"],
    ["tips for public speaking, i get nervous before presenting", "public_speaking"],
    ["turn this feature into user stories with acceptance criteria", "user_stories"],
    ["users drop off in my signup flow, critique the ux", "ux_critique"],
    ["audit my site for accessibility issues", "accessibility"],
    ["clean up our design system, the buttons are inconsistent", "design_system"],
    ["the site is down right now and im not sure why", "incident"],
    ["my github actions build fails at the docker step", "deploy_failure"],
    ["my docker image is 2gb and takes forever to build", "docker"],
    ["kubernetes deployment config with probes and resource limits", "kubernetes"],
    ["set up monitoring and alerting that isnt noisy", "monitoring"],
    ["write the postmortem for last weeks outage", "postmortem"],
    ["our aws bill doubled last month, how do i cut it", "cloud_cost"],
    ["harden security for my small team, i committed a secret to git", "security"],
    ["help me write a better system prompt for my assistant", "prompt_engineering"],
    ["build a rag pipeline to chat with my pdfs", "rag"],
    ["should i fine tune a model or just prompt it better", "fine_tune"],
    ["how do i build an eval set for my llm feature", "llm_eval"],
    ["my training loss goes to nan after a few steps", "training_run"],
    ["which llm should i use, gpt or claude or a local model", "model_choice"],
    ["write a labelling guideline for my annotators", "dataset_labeling"],
    ["design an ai agent with tool calling and retries", "ai_agent"],
  ];

  for (const [text, slug] of packCoverage) {
    it(`reaches ${slug} in its own mode`, () => {
      const def = allSubRecipes.find((d) => d.id.endsWith(`/${slug}`));
      expect(def, `no registered sub-recipe with slug ${slug}`).toBeDefined();
      expect(findSubRecipe(text, def!.parent)?.id).toBe(def!.id);
    });
  }

  it("falls back to the parent recipe when nothing matches", () => {
    expect(findSubRecipe("zzz completely unrelated gibberish", "writing")).toBeNull();
  });

  it("improveTier1 surfaces the sub-recipe label", () => {
    const r = improveTier1("how do i make my resume pass ats screening", "chatgpt");
    expect(r.subRecipe?.id).toBe("resume_job/ats");
    expect(r.variants.structured).toContain("applicant tracking");
  });
});
