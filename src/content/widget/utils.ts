export function highlightPlaceholders(text: string): string {
  return text.replace(/\[([^\]]+)\]/g, '<span class="aw-placeholder">[$1]</span>');
}
