export function getReadTimeMinutes(text: string): number {
  const wordsPerMinute = 200;
  const noHtml = text.replace(/<[^>]*>?/gm, ''); // Remove HTML tags
  const words = noHtml.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

export function calculateReadTime(text: string): string {
  const minutes = getReadTimeMinutes(text);
  return `${minutes} min read`;
}
