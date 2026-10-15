import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cv } from '../src/app/cv.data.ts';
import { personaKnowledge } from '../src/app/persona.knowledge.ts';

export interface KnowledgeChunk {
  id: string;
  tags: string[];
  text: string;
}

const KNOWLEDGE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'knowledge');

/** CV + docs (PDF extraits) découpés pour le RAG — le LLM génère toujours la réponse. */
export function buildKnowledgeChunks(): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [];

  chunks.push({
    id: 'identite',
    tags: ['identite', 'nom', 'contact', 'dispo', 'disponibilite', 'email', 'telephone', 'linkedin', 'bruxelles'],
    text: `Identité: ${cv.nomComplet}, ${cv.poste}, ${cv.lieu}. ${cv.disponibilite}. Contact: ${cv.email}, ${cv.telephone}, LinkedIn ${cv.liens[0]?.href ?? ''}.`,
  });

  chunks.push({
    id: 'apropos',
    tags: ['apropos', 'profil', 'motivation', 'personnalite', 'qui'],
    text: `À propos: ${cv.aPropos.join(' ')} Accroche: ${cv.slogan}`,
  });

  chunks.push({
    id: 'glossaire-stack',
    tags: [
      'stack',
      'techno',
      'angular',
      'dotnet',
      '.net',
      'net',
      'flutter',
      'csharp',
      'c#',
      'vue',
      'typescript',
      'aspnet',
      'spotify',
      'stripe',
      'vibely',
      'sql',
    ],
    text: `Glossaire (ne pas confondre):
- .NET / C# / ASP.NET Core = back-end (Leroy & Partners en prod + API Vibely TFE en ASP.NET Core 10).
- Angular = front web principal en production (refonte site Leroy & Partners, Angular 20+).
- Flutter = mobile (app tablette huissiers Leroy + client Vibely TFE).
- Vue.js = Startups.be 2018–2019 uniquement.
- Vibely (TFE) = Flutter + ASP.NET Core 10 + SQL Server + Spotify + Stripe + SignalR + Riverpod.
Poste recherché: Analyste développeur .NET / Angular.`,
  });

  for (const e of cv.experiences) {
    chunks.push({
      id: e.id,
      tags: [
        'experience',
        'parcours',
        e.entreprise.toLowerCase(),
        e.poste.toLowerCase(),
        ...e.stack.map((s) => s.toLowerCase()),
        'leroy',
        'startups',
        'cite',
      ],
      text: `Expérience: ${e.poste} @ ${e.entreprise} (${e.periode}, ${e.lieu}). ${e.resume} Réalisations: ${e.faitsMarquants.join(' ; ')}. Stack: ${e.stack.join(', ')}.`,
    });
  }

  for (const f of cv.formations) {
    chunks.push({
      id: f.id,
      tags: ['formation', 'etudes', 'ecole', f.ecole.toLowerCase(), 'ephec', 'becode', 'tfe', 'diplome', 'vibely'],
      text: `Formation: ${f.titre} — ${f.ecole} (${f.periode}, ${f.lieu}${f.mention ? `, ${f.mention}` : ''}). ${f.details.join(' ')}`,
    });
  }

  for (const p of cv.projets) {
    chunks.push({
      id: p.id,
      tags: ['projet', 'realisation', p.tag.toLowerCase(), 'tfe', 'flutter', 'freeflow', 'huissier', 'vibely'],
      text: `Projet: ${p.titre} (${p.annee}, ${p.tag}). ${p.resume} ${p.readme.flatMap((s) => [...(s.paragraphs ?? []), ...(s.bullets ?? [])]).join(' ')}`,
    });
  }

  for (const s of cv.competences) {
    chunks.push({
      id: s.id,
      tags: ['competence', 'skill', 'techno', ...s.items.map((i) => i.nom.toLowerCase())],
      text: `Compétences — ${s.libelle}: ${s.items.map((i) => `${i.nom} (${i.detail})`).join(' ; ')}.`,
    });
  }

  personaKnowledge.faq.forEach((f, i) => {
    chunks.push({
      id: `note-${i}`,
      tags: tokenize(`${f.q} ${f.a}`),
      text: `Note recruteur — sujet: ${f.q}. Fait: ${f.a}`,
    });
  });

  chunks.push({
    id: 'personnalite',
    tags: ['smalltalk', 'salut', 'personality', 'humeur', 'hobby'],
    text: `Personnalité: ${personaKnowledge.personality.join(' ')} Indices small talk: ${personaKnowledge.smallTalkHints.join(' ')}`,
  });

  chunks.push(...loadDocumentChunks());

  return chunks;
}

function loadDocumentChunks(): KnowledgeChunk[] {
  if (!existsSync(KNOWLEDGE_DIR)) return [];

  const out: KnowledgeChunk[] = [];
  const files = readdirSync(KNOWLEDGE_DIR).filter((f) => /\.(md|txt)$/i.test(f));

  for (const file of files) {
    // Prefer curated summary over raw full dump when both exist for same stem
    if (file === 'tfe.txt') continue; // tfe-faits.md + selective pages from tfe below
    if (file === 'cv.txt') continue; // already covered by cv.data.ts

    const raw = readFileSync(join(KNOWLEDGE_DIR, file), 'utf8');
    const stem = file.replace(/\.(md|txt)$/i, '');
    const baseTags = tokenize(stem);

    if (file.endsWith('.md')) {
      for (const section of splitMarkdownSections(raw)) {
        if (section.body.length < 40) continue;
        out.push({
          id: `doc-${stem}-${slug(section.title)}`,
          tags: [...baseTags, 'document', 'tfe', 'vibely', ...tokenize(section.title), ...tokenize(section.body).slice(0, 30)],
          text: `Document ${stem} — ${section.title}: ${section.body.replace(/\s+/g, ' ').trim()}`,
        });
      }
      continue;
    }

    for (const [i, page] of splitPdfPages(raw).entries()) {
      const cleaned = cleanPage(page);
      if (cleaned.length < 120) continue;
      out.push({
        id: `doc-${stem}-p${i + 1}`,
        tags: [...baseTags, 'document', ...tokenize(cleaned).slice(0, 40)],
        text: `Extrait ${stem} (p.${i + 1}): ${cleaned}`,
      });
    }
  }

  // Key raw TFE pages (intro produit, stack, conclusion) — denser than TOC
  const tfePath = join(KNOWLEDGE_DIR, 'tfe.txt');
  if (existsSync(tfePath)) {
    const pages = splitPdfPages(readFileSync(tfePath, 'utf8'));
    const keep = new Set([7, 8, 9, 38, 39, 40, 57, 58, 65, 78, 80]);
    pages.forEach((page, idx) => {
      const n = idx + 1;
      if (!keep.has(n)) return;
      const cleaned = cleanPage(page);
      if (cleaned.length < 120) return;
      out.push({
        id: `tfe-raw-p${n}`,
        tags: ['tfe', 'vibely', 'flutter', 'dotnet', 'aspnet', 'spotify', 'stripe', ...tokenize(cleaned).slice(0, 35)],
        text: `TFE Vibely (p.${n}): ${cleaned}`,
      });
    });
  }

  return out;
}

function splitMarkdownSections(md: string): { title: string; body: string }[] {
  const parts = md.split(/\n(?=##\s+)/);
  return parts.map((part) => {
    const lines = part.trim().split('\n');
    const title = lines[0]?.replace(/^#+\s*/, '') ?? 'section';
    const body = lines.slice(1).join('\n').trim();
    return { title, body };
  });
}

function splitPdfPages(text: string): string[] {
  return text.split(/---\s*page\s+\d+\s*---/i).map((p) => p.trim()).filter(Boolean);
}

function cleanPage(page: string): string {
  return page
    .replace(/Vibely - Travail de Fin d'Études\s*\d+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'section';
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .split(/[^a-z0-9.+#]+/)
    .filter((t) => t.length > 1);
}
