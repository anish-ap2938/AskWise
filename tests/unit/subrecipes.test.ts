import { describe, expect, it } from "vitest";
import { allSubRecipes, findSubRecipe, renderSubRecipe } from "../../src/shared/subrecipes";
import { improveTier1 } from "../../src/shared/improve";

describe("sub-recipe registry", () => {
  it("has at least 70 sub-recipes across granular categories", () => {
    expect(allSubRecipes.length).toBeGreaterThanOrEqual(70);
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
    { text: "explain machine learning like im five", mode: "quick_improve", id: "quick_improve/eli5" },
    { text: "help me decide between renting and buying", mode: "quick_improve", id: "quick_improve/decision" },
    { text: "write an email to my boss about a deadline", mode: "writing", id: "writing/professional_email" },
    { text: "draft a wedding toast for my best friend", mode: "writing", id: "writing/speech" },
    { text: "build me a website for my bakery", mode: "app_builder", id: "app_builder/business_site" },
    { text: "best laptops under $1000 for programming", mode: "research", id: "research/buying" },
    { text: "excel formula to sum values between dates", mode: "data_analysis", id: "data_analysis/spreadsheet" },
    { text: "explain how the immune system fights infection", mode: "quick_improve", id: "quick_improve/clinical_explain" },
    { text: "tips to sleep better at night", mode: "quick_improve", id: "quick_improve/wellness_plan" },
    { text: "is it legal to record a phone call in california", mode: "quick_improve", id: "quick_improve/legal_explain" },
    { text: "how do i start investing with very little money as a complete beginner please", mode: "quick_improve", id: "quick_improve/personal_finance" },
    { text: "explain the krebs cycle step by step", mode: "quick_improve", id: "quick_improve/science_explain" },
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

  it("falls back to the parent recipe when nothing matches", () => {
    expect(findSubRecipe("zzz completely unrelated gibberish", "writing")).toBeNull();
  });

  it("improveTier1 surfaces the sub-recipe label", () => {
    const r = improveTier1("how do i make my resume pass ats screening", "chatgpt");
    expect(r.subRecipe?.id).toBe("resume_job/ats");
    expect(r.variants.structured).toContain("applicant tracking");
  });
});
