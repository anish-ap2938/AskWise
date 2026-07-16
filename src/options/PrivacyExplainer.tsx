export function PrivacyExplainer() {
  return (
    <section className="space-y-3 border-t pt-6">
      <h2 className="text-lg font-semibold">Privacy</h2>
      <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
        <li>AskWise only reads text from the chat composer input — never chat history.</li>
        <li>Tier 1 rewrites run entirely offline in your browser.</li>
        <li>
          Advanced defaults to a built-in on-device model (downloaded once into your browser;
          inference stays on your PC). Optional Ollama / cloud BYOK if you enable them.
        </li>
        <li>Cloud API keys are optional, stored locally, and only used when you click Advanced.</li>
        <li>Secrets are redacted locally before any LLM call.</li>
        <li>No analytics, telemetry, or data sale. No backend server.</li>
      </ul>
      <p className="text-xs text-gray-400">
        See privacy-policy.html for Chrome Web Store Data Safety details.
      </p>
    </section>
  );
}
