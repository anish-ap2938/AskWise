export function PrivacyExplainer() {
  return (
    <section className="space-y-3 border-t pt-6">
      <h2 className="text-lg font-semibold">Privacy</h2>
      <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
        <li>AskWise only reads text from the chat composer input — never chat history.</li>
        <li>Tier 1 rewrites run entirely offline in your browser.</li>
        <li>
          Advanced defaults to a built-in on-device model. Model weights may download once;
          the inference runtime is packaged in the extension. Prompt inference stays on
          your device.
        </li>
        <li>
          AskWise attempts pattern-based redaction before local inference. It may not catch
          every secret, so review generated prompts before using them.
        </li>
        <li>No analytics, telemetry, or data sale. No AskWise backend server.</li>
      </ul>
      <p className="text-xs text-gray-400">
        Full policy:{" "}
        <a
          className="underline"
          href="https://askwise-privacy.vercel.app/privacy-policy"
          target="_blank"
          rel="noreferrer"
        >
          askwise-privacy.vercel.app/privacy-policy
        </a>
      </p>
    </section>
  );
}
