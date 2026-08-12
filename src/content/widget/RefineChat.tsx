import { useEffect, useRef, useState } from "react";
import { humanizeOnDeviceError } from "../../shared/ondeviceProgress";
import { SendIcon } from "./Icons";

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
        "Tell me what to change, or ask me to quiz you. I rewrite the prompt on your device.",
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
          setError(
            humanizeOnDeviceError(
              chrome.runtime.lastError.message ?? "Refine failed."
            )
          );
          return;
        }
        if (response?.kind === "LLM_ERROR") {
          setError(response.payload?.message ?? "Refine failed.");
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "I couldn't reach the on-device model yet.",
            },
          ]);
          return;
        }
        if (response?.kind !== "REFINE_RESPONSE") {
          setError("The on-device model sent something I couldn't read.");
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
    <div>
      <div className="aw-chat" role="log" aria-label="Refine conversation">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`aw-msg ${m.role === "user" ? "aw-msg-user" : "aw-msg-assistant"}`}
          >
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="aw-msg aw-msg-assistant aw-msg-pending">
            <span className="aw-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            Thinking on your device
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="aw-starters">
        {STARTERS.map((s) => (
          <button
            key={s}
            type="button"
            className="aw-starter"
            disabled={busy}
            onClick={() => send(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="aw-composer">
        <input
          className="aw-input"
          aria-label="Ask for a change"
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
          className="aw-btn aw-btn-primary aw-btn-sm"
          style={{ flex: "none" }}
          disabled={busy || !input.trim()}
          onClick={() => send(input)}
          aria-label="Send"
        >
          <SendIcon />
        </button>
      </div>

      {error && (
        <p className="aw-note" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
