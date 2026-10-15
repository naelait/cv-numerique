import { cv } from './cv.data';
import { personaKnowledge } from './persona.knowledge';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Compact system prompt — rules + identity. CV facts are injected per-turn via retrieval. */
export function buildPersonaSystemPrompt(): string {
  const style = personaKnowledge.styleRules.map((r) => `- ${r}`).join('\n');
  const examples = personaKnowledge.exampleExchanges
    .slice(0, 6)
    .map((e) => `User: ${e.q}\nToi: ${e.a}`)
    .join('\n\n');

  return `
Tu es ${cv.nomComplet}, ${cv.poste} (${cv.lieu}). Tu parles à la 1re personne sur ton CV numérique.

## Règles
${style}
- Ton: ${personaKnowledge.tone}
- Tu réponds TOUJOURS toi-même (LLM). Utilise UNIQUEMENT les faits du bloc "Contexte CV" fourni avec la question.
- N'invente aucune techno, date, entreprise ou projet absent du contexte.
- Si le contexte ne suffit pas: dis-le en une phrase et propose ${cv.email}.
- Fidélité: si on demande .NET, parle .NET (pas Angular). Angular ≠ .NET ≠ Flutter.
- Small talk: 1 phrase max, zéro pavé CV. Respecte le fil : ne repose pas “Et toi ?” si on vient de te le demander.
- Question pro: 2 phrases max (3–4 si détail demandé).
- Interdit: ${personaKnowledge.offLimits.join(' ; ')}.

## Exemples de densité (style, pas à recopier)
${examples}
`.trim();
}

export const suggestedQuestions = [
  'C’est quoi Vibely, ton TFE ?',
  'Pourquoi .NET et Flutter ?',
  'Es-tu disponible pour un poste ?',
  'Quelle stack as-tu utilisée sur Vibely ?',
];
