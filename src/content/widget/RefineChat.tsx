import { useEffect, useRef, useState } from "react";

export interface RefineMessage {
  role: "user" | "assistant";
  content: string;
}

interface RefineChatProps {
  currentPrompt: string;
  onPromptUpdate: (prompt: string) => void;
}

const STARTERS = [
  "Ask me 2 clarifying questions",
  "Make it more specific",
  "Add success criteria",
  "Make it shorter",
];

export function RefineChat({ currentPrompt, onPromptUpdate }: RefineChatProps) {
  const [messages, setMessages] = useState<RefineMessage[]>([
    {
      role: "assistant",
      content:
        "Tell me what to change, or ask me to quiz you — I’ll update the prompt on-device.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages, busy]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    const history = messages.filter(
      (m, i) => !(i === 0 && m.role === "assistant")
    );
    const nextMessages: RefineMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(nextMessages);
    setInput("");
    setBusy(true);
    setError("");

    chrome.runtime.sendMessage(
      {
        kind: "REFINE_REQUEST",
        payload: {
          currentPrompt,
          history,
          userMessage: trimmed,
        },
      },
      (response) => {
        setBusy(false);
        if (chrome.runtime.lastError) {
          setError(chrome.runtime.lastError.message ?? "Refine failed");
          return;
        }
        if (response?.kind === "LLM_ERROR") {
          setError(response.payload?.message ?? "Refine failed");
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "I couldn’t reach the on-device model yet.",
            },
          ]);
          return;
        }
        if (response?.kind !== "REFINE_RESPONSE") {
          setError("Unexpected response");
          return;
        }

        const { reply, prompt } = response.payload as {
          reply: string;
          prompt: string | null;
        };
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
        if (prompt && prompt.trim() && prompt.trim() !== currentPrompt.trim()) {
          onPromptUpdate(prompt.trim());
        }
      }
    );
  };

  return (
    <div className="flex flex-col">
      <div className="max-h-40 space-y-2 overflow-y-auto px-3 py-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`rounded-lg px-2.5 py-1.5 text-xs leading-relaxed ${
              m.role === "user"
                ? "ml-6 bg-violet-600 text-white"
                : "mr-6 bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
            }`}
          >
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="mr-6 rounded-lg bg-zinc-100 px-2.5 py-1.5 text-xs aw-muted dark:bg-zinc-800">
            Thinking on-device…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex flex-wrap gap-1 border-t border-zinc-200 px-3 py-1.5 dark:border-zinc-700">
        {STARTERS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={busy}
            className="rounded-full border border-zinc-300 px-2 py-0.5 text-[10px] aw-muted hover:border-violet-500 hover:text-violet-600 disabled:opacity-50 dark:border-zinc-600"
            onClick={() => send(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1.5 border-t border-zinc-200 px-3 py-2 dark:border-zinc-700">
        <input
          className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-transparent px-2 py-1.5 text-xs outline-none focus:border-violet-500 dark:border-zinc-600"
          placeholder="Suggest a change…"
          value={input}
          disabled={busy}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send(input);
          }}
        />
        <button
          type="button"
          className="rounded-lg bg-violet-600 px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          disabled={busy || !input.trim()}
          onClick={() => send(input)}
        >
          Send
        </button>
      </div>
      {error && <p className="px-3 pb-2 text-[10px] text-amber-700">{error}</p>}
    </div>
  );
}
