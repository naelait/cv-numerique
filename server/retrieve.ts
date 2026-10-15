import type { KnowledgeChunk } from './knowledge.ts';

const STOP = new Set([
  'le',
  'la',
  'les',
  'un',
  'une',
  'des',
  'de',
  'du',
  'et',
  'ou',
  'a',
  'à',
  'en',
  'dans',
  'pour',
  'par',
  'sur',
  'avec',
  'sans',
  'que',
  'qui',
  'quoi',
  'est',
  'es',
  'suis',
  'ton',
  'ta',
  'tes',
  'mon',
  'ma',
  'mes',
  'tu',
  'je',
  'il',
  'elle',
  'on',
  'nous',
  'vous',
  'ce',
  'cet',
  'cette',
  'ces',
  'the',
  'and',
  'or',
  'of',
  'to',
  'in',
  'is',
  'are',
  'you',
  'your',
  'me',
  'my',
]);

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\.net/g, 'dotnet')
    .replace(/c#/g, 'csharp');
}

function tokens(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9.+#]+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

/** Always pull identity + glossary; then top scored CV chunks for this question. */
export function retrieveChunks(
  question: string,
  corpus: KnowledgeChunk[],
  topK = 5,
): KnowledgeChunk[] {
  const qTokens = tokens(question);
  const qSet = new Set(qTokens);

  const scored = corpus
    .filter((c) => c.id !== 'identite' && c.id !== 'glossaire-stack')
    .map((chunk) => {
      const hay = normalize(`${chunk.text} ${chunk.tags.join(' ')}`);
      let score = 0;
      for (const t of qTokens) {
        if (hay.includes(t)) score += t.length > 4 ? 2 : 1;
        if (chunk.tags.some((tag) => normalize(tag).includes(t) || t.includes(normalize(tag)))) {
          score += 2;
        }
      }
      // Prefer experience / TFE chunks when relevant
      if (chunk.id.startsWith('exp-') && score > 0) score += 1;
      if ((chunk.id.includes('tfe') || chunk.id.includes('vibely') || chunk.text.toLowerCase().includes('vibely')) && score > 0) {
        score += 2;
      }
      return { chunk, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const pinned = corpus.filter((c) => c.id === 'identite' || c.id === 'glossaire-stack');
  const picked = scored.slice(0, topK).map((x) => x.chunk);

  // Small talk / vague openers: give personality + apropos instead of random exp dump
  const isOpen =
    qTokens.length <= 3 &&
    [...qSet].every((t) =>
      ['salut', 'hey', 'hello', 'hi', 'bonjour', 'bonsoir', 'coucou', 'merci', 'bye', 'ciao', 'ca', 'va', 'comment'].includes(
        t,
      ),
    );

  if (isOpen || scored.length === 0) {
    const soft = corpus.filter((c) => c.id === 'personnalite' || c.id === 'apropos');
    return [...pinned, ...soft];
  }

  return [...pinned, ...picked];
}

export function formatRetrievedContext(chunks: KnowledgeChunk[]): string {
  return chunks.map((c) => `- [${c.id}] ${c.text}`).join('\n');
}
