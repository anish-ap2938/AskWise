import { ExternalIcon, Section } from "./ui";

const STAYS = [
  "The prompt in the composer, which AskWise reads only when you open it.",
  "Files you attach for context — parsed in the page, never uploaded.",
  "Advanced and Refine, which run on the in-browser model.",
  "Your settings and saved prompts, in this browser's local storage.",
];

const LEAVES = [
  "The model file, downloaded once from Hugging Face. Your prompt is not part of that request.",
  "The finished prompt — once you send it, the chat site receives it like anything else you type.",
];

export function PrivacyExplainer() {
  return (
    <Section
      title="What leaves this device"
      description="AskWise has no server and no account, so there is no version of this that involves us receiving your prompts."
    >
      <div className="card divide-y divide-hairline">
        <div className="px-4 py-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-faint">
            Stays local
          </h3>
          <ul className="mt-2 space-y-1.5">
            {STAYS.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-ink-muted">
                <span aria-hidden className="mt-2 h-1 w-1 flex-none rounded-full bg-positive" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="px-4 py-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-faint">
            Goes over the network
          </h3>
          <ul className="mt-2 space-y-1.5">
            {LEAVES.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-ink-muted">
                <span
                  aria-hidden
                  className="mt-2 h-1 w-1 flex-none rounded-full bg-hairline-strong"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="px-4 py-4">
          <p className="text-sm text-ink-muted">
            AskWise strips things that look like API keys, tokens, and card numbers before
            the local model sees them. Pattern matching misses things, so read a rewrite
            before you send it.
          </p>
          <a
            className="mt-3 inline-flex items-center gap-1 text-sm text-ink-muted underline decoration-hairline-strong underline-offset-2 hover:text-ink hover:decoration-ink"
            href="https://askwise-privacy.vercel.app/privacy-policy"
            target="_blank"
            rel="noreferrer"
          >
            Full privacy policy
            <ExternalIcon />
          </a>
        </div>
      </div>
    </Section>
  );
}
