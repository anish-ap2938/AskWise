interface KeyFormProps {
  anthropicKey: string;
  openaiKey: string;
  onChange: (anthropicKey: string, openaiKey: string) => void;
}

export function KeyForm({ anthropicKey, openaiKey, onChange }: KeyFormProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Cloud API keys (optional BYOK)</h2>
      <p className="text-sm text-gray-500">
        Keys are stored locally in chrome.storage.local and never synced or logged.
      </p>
      <label className="block">
        <span className="text-sm text-gray-600">Anthropic API key</span>
        <input
          type="password"
          className="mt-1 block w-full rounded border px-3 py-2"
          value={anthropicKey}
          onChange={(e) => onChange(e.target.value, openaiKey)}
          placeholder="sk-ant-..."
        />
      </label>
      <label className="block">
        <span className="text-sm text-gray-600">OpenAI API key</span>
        <input
          type="password"
          className="mt-1 block w-full rounded border px-3 py-2"
          value={openaiKey}
          onChange={(e) => onChange(anthropicKey, e.target.value)}
          placeholder="sk-..."
        />
      </label>
    </section>
  );
}
