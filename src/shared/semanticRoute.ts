import type { ModeId } from "./types";

/**
 * Reference phrases per mode for the embedding classifier. These cover the
 * paraphrase space that the regex rules can't reach (no keywords). Each phrase
 * is embedded once; user input is routed by max cosine similarity.
 */
export const REFERENCE_PHRASES: Partial<Record<ModeId, string[]>> = {
  simple_answer: [
    "what is photosynthesis",
    "who invented the lightbulb",
    "quick factual question about science",
    "define this term for me",
    "is this true or false",
    "how does this everyday thing work",
  ],
  research: [
    "compare these two products and tell me which is better",
    "research the market for this industry",
    "what are the pros and cons of these options",
    "is it worth switching from one tool to another",
    "find studies and evidence about this topic",
    "which framework should i choose for my project",
  ],
  app_builder: [
    "build me an app that does this",
    "create a website for my business",
    "make something that lets my customers book appointments",
    "i want to launch a web platform for users",
    "develop a tool people can sign up for and use",
    "create an online system to manage bookings and payments",
  ],
  coding_debug: [
    "my code throws an error and i don't know why",
    "the page is slow and takes seconds to load",
    "something is eating all the memory when i run this",
    "my function returns the wrong value",
    "the build fails and the logs are confusing",
    "it works on my machine but breaks in production",
  ],
  resume_job: [
    "help me improve my resume so i get interviews",
    "i keep getting rejected by automated job application screeners",
    "prepare me for interview questions",
    "write a cover letter for this job",
    "negotiate a higher salary or promotion",
    "make my job application stand out to recruiters",
  ],
  writing: [
    "write an email for me",
    "help me find the right words for a speech",
    "draft a social media post",
    "make this text sound better",
    "write something creative like a story or poem",
    "turn my rough notes into polished writing",
  ],
  data_analysis: [
    "analyze this data and tell me what it means",
    "the numbers from my business look strange, check them",
    "help me calculate metrics from my records",
    "make sense of this spreadsheet of results",
    "query the database for insights",
    "find patterns or anomalies in these figures",
  ],
  agent_task: [
    "implement this feature in my codebase",
    "refactor the code to be cleaner",
    "add tests and set up the pipeline",
    "wire up this integration in my project",
    "migrate the project to a new framework",
    "make this change across the whole repo",
  ],
  learning: [
    "explain this topic to me properly",
    "teach me how something works from the ground up",
    "i heard a term at work and want to actually understand it",
    "give me the full process, not the short version",
    "i sat through the class and still don't get the concept",
    "build me a plan to study this subject",
  ],
  planning: [
    "plan out my days somewhere with a schedule",
    "i have a few free days and no idea how to use them",
    "help me organize an event for a group of people",
    "what should i feed people coming over this weekend",
    "map out my day hour by hour so it isn't wasted",
    "give me a timeline for a move with everything in order",
  ],
  marketing: [
    "nobody knows we exist and i need customers through the door",
    "write copy that makes people click and buy",
    "our page gets traffic but almost nobody converts",
    "we send updates and barely anyone opens them",
    "how do we get found when people search for this",
    "plan the announcement for our launch",
  ],
  business: [
    "how much should we charge for this",
    "is this idea actually a viable business",
    "we're profitable per order but the bank balance keeps shrinking",
    "another company wants to partner, how should we structure it",
    "write the spec for what we're building and why",
    "what should the next two quarters look like",
  ],
  finance: [
    "i get paid and by the end of the month there's nothing left",
    "should i pay down the loan or put it into retirement",
    "i have cash sitting in checking doing nothing",
    "can i afford this house on my salary",
    "how much should i put aside for tax",
    "where do i start with saving and investing",
  ],
  health: [
    "i'm exhausted every afternoon no matter what i do",
    "build me a training program to get from nothing to a goal",
    "something starts hurting partway through every run",
    "what should i eat to hit my body composition goal",
    "i wake in the middle of the night and can't get back down",
    "how do i handle the stress without medication",
  ],
  math_help: [
    "work this problem out step by step",
    "i got this answer, did i do it right",
    "show me the method not just the result",
    "split this bill fairly between people",
    "how do i convert between these units",
    "prove this statement is always true",
  ],
  translation: [
    "say this in another language naturally",
    "i wrote this in english but it should read like a local wrote it",
    "someone sent me a phrase and i don't know what it means",
    "we need the same message for customers who speak another language",
    "is this too casual for a formal reader in that culture",
    "adapt our product text for another country",
  ],
  image_gen: [
    "write me a prompt to generate this picture",
    "i want an image of my pet styled like a classical painting",
    "my generations keep coming out distorted, how should i word it",
    "describe the shot for a video model",
    "what settings and framing should i ask for",
    "design a visual concept for a cover",
  ],
};

export interface SemanticVerdict {
  mode: ModeId;
  confidence: number;
}

/** Route on max similarity with threshold + margin checks (both required). */
export function pickMode(
  similarities: Array<{ mode: ModeId; score: number }>,
  threshold = 0.45,
  margin = 0.04
): SemanticVerdict | null {
  if (similarities.length === 0) return null;
  const sorted = [...similarities].sort((a, b) => b.score - a.score);
  const top = sorted[0]!;
  const second = sorted[1];

  if (top.score < threshold) return null;
  if (second && top.score - second.score < margin) return null;

  return { mode: top.mode, confidence: top.score };
}

export function cosineSimilarity(a: Float32Array | number[], b: Float32Array | number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}
