import { Injectable, computed, signal } from '@angular/core';
import type { ChatMessage } from '../persona.context';

export interface ChatHealth {
  ok: boolean;
  ollama: boolean;
  model: boolean;
  modelName: string;
}

const STORAGE_KEY = 'nael.ask.history.v1';
const MAX_STORED = 40;

@Injectable({ providedIn: 'root' })
export class ChatService {
  readonly panelOpen = signal(false);
  readonly loading = signal(false);
  readonly history = signal<ChatMessage[]>(this.loadHistory());
  readonly messageCount = computed(() => this.history().length);
  readonly hasHistory = computed(() => this.history().length > 0);

  openPanel(): void {
    this.panelOpen.set(true);
  }

  closePanel(): void {
    this.panelOpen.set(false);
  }

  togglePanel(): void {
    this.panelOpen.update((open) => !open);
  }

  clearHistory(): void {
    this.history.set([]);
    this.persist();
  }

  async checkHealth(): Promise<ChatHealth> {
    try {
      const res = await fetch('/api/health', { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error('health failed');
      return (await res.json()) as ChatHealth;
    } catch {
      return { ok: false, ollama: false, model: false, modelName: 'qwen2.5:14b' };
    }
  }

  async send(message: string): Promise<string> {
    const trimmed = message.trim();
    if (!trimmed) return '';

    this.history.update((h) => [...h, { role: 'user', content: trimmed }]);
    this.persist();
    this.loading.set(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: this.history() }),
      });

      const data = (await res.json()) as { reply?: string; error?: string };

      if (!res.ok) {
        this.history.update((h) => h.slice(0, -1));
        this.persist();
        throw new Error(data.error ?? 'Erreur serveur');
      }

      const reply = data.reply ?? '';
      this.history.update((h) => [...h, { role: 'assistant', content: reply }]);
      this.persist();
      return reply;
    } finally {
      this.loading.set(false);
    }
  }

  private loadHistory(): ChatMessage[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem('naiel.ask.history.v1');
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(
          (m): m is ChatMessage =>
            !!m &&
            typeof m === 'object' &&
            (m.role === 'user' || m.role === 'assistant') &&
            typeof m.content === 'string' &&
            m.content.trim().length > 0,
        )
        .slice(-MAX_STORED);
    } catch {
      return [];
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history().slice(-MAX_STORED)));
    } catch {
      // quota / private mode
    }
  }
}
