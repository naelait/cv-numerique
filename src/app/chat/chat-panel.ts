import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { cv } from '../cv.data';
import { suggestedQuestions } from '../persona.context';
import { ChatService } from './chat.service';

@Component({
  selector: 'app-chat-panel',
  templateUrl: './chat-panel.html',
  styleUrl: './chat-panel.css',
})
export class ChatPanel {
  private readonly destroyRef = inject(DestroyRef);
  private readonly chat = inject(ChatService);
  private readonly rootEl = viewChild<ElementRef<HTMLElement>>('rootEl');
  private readonly messagesEl = viewChild<ElementRef<HTMLElement>>('messagesEl');
  private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('inputEl');
  private readonly toggleEl = viewChild<ElementRef<HTMLButtonElement>>('toggleEl');

  private previousFocus: HTMLElement | null = null;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private wasOpen = false;

  protected readonly data = cv;
  protected readonly suggestions = suggestedQuestions;
  protected readonly panelOpen = this.chat.panelOpen;
  protected readonly loading = this.chat.loading;
  protected readonly messages = this.chat.history;
  protected readonly hasHistory = this.chat.hasHistory;
  protected readonly messageCount = this.chat.messageCount;
  protected readonly input = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly health = signal<{ ok: boolean; modelName: string } | null>(null);
  protected readonly resumed = signal(false);

  constructor() {
    afterNextRender(() => {
      this.resumed.set(this.hasHistory());
      void this.refreshHealth();
      const interval = window.setInterval(() => void this.refreshHealth(), 30_000);

      effect(() => {
        const open = this.panelOpen();
        untracked(() => {
          if (open && !this.wasOpen) {
            this.wasOpen = true;
            this.onPanelOpened();
          } else if (!open && this.wasOpen) {
            this.wasOpen = false;
            this.onPanelClosed();
          }
        });
      });

      this.destroyRef.onDestroy(() => {
        clearInterval(interval);
        this.teardownFocusTrap();
        this.setBackgroundInert(false);
      });
    });
  }

  protected togglePanel(event?: Event): void {
    event?.preventDefault();
    this.chat.togglePanel();
  }

  protected closePanel(event?: Event): void {
    event?.preventDefault();
    this.chat.closePanel();
  }

  protected onInput(event: Event): void {
    this.input.set((event.target as HTMLInputElement).value);
  }

  protected async send(event?: Event): Promise<void> {
    event?.preventDefault();
    const text = this.input().trim();
    if (!text || this.loading() || !this.health()?.ok) return;

    this.input.set('');
    this.error.set(null);
    this.resumed.set(false);
    this.focusComposer();

    try {
      await this.chat.send(text);
      this.scrollToBottom();
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Erreur inconnue');
      this.scrollToBottom();
    } finally {
      this.focusComposer();
    }
  }

  protected async askSuggestion(question: string, event?: Event): Promise<void> {
    event?.preventDefault();
    if (this.loading() || !this.health()?.ok) return;
    this.input.set('');
    this.error.set(null);
    this.resumed.set(false);
    this.focusComposer();

    try {
      await this.chat.send(question);
      this.scrollToBottom();
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Erreur inconnue');
      this.scrollToBottom();
    } finally {
      this.focusComposer();
    }
  }

  protected clearChat(event?: Event): void {
    event?.preventDefault();
    this.chat.clearHistory();
    this.error.set(null);
    this.resumed.set(false);
    window.setTimeout(() => this.inputEl()?.nativeElement.focus(), 0);
  }

  protected onComposerKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void this.send();
    }
  }

  protected statusLabel(): string {
    const h = this.health();
    if (!h) return 'checking';
    return h.ok ? 'live' : 'offline';
  }

  private onPanelOpened(): void {
    this.previousFocus = document.activeElement as HTMLElement | null;
    this.setBackgroundInert(true);
    this.attachFocusTrap();
    void this.refreshHealth();
    window.setTimeout(() => {
      this.inputEl()?.nativeElement.focus();
      this.scrollToBottom();
    }, 60);
  }

  private onPanelClosed(): void {
    this.teardownFocusTrap();
    this.setBackgroundInert(false);
    const restore = this.previousFocus;
    this.previousFocus = null;
    window.setTimeout(() => {
      (restore?.isConnected ? restore : this.toggleEl()?.nativeElement)?.focus();
    }, 0);
  }

  private attachFocusTrap(): void {
    this.teardownFocusTrap();
    this.keyHandler = (e: KeyboardEvent) => {
      if (!this.panelOpen()) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this.closePanel();
        return;
      }
      if (e.key !== 'Tab') return;
      const root = this.rootEl()?.nativeElement;
      if (!root) return;
      const focusables = this.focusableWithin(root);
      if (!focusables.length) return;
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', this.keyHandler, true);
  }

  private teardownFocusTrap(): void {
    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler, true);
      this.keyHandler = null;
    }
  }

  private focusableWithin(root: HTMLElement): HTMLElement[] {
    return Array.from(
      root.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.hasAttribute('disabled') && el.getClientRects().length > 0);
  }

  private setBackgroundInert(inert: boolean): void {
    document.getElementById('main-content')?.toggleAttribute('inert', inert);
    document.querySelector('.runtime')?.toggleAttribute('inert', inert);
    document.querySelector('.topbar')?.toggleAttribute('inert', inert);
  }

  private async refreshHealth(): Promise<void> {
    const h = await this.chat.checkHealth();
    this.health.set({ ok: h.ok, modelName: h.modelName });
  }

  private focusComposer(): void {
    window.setTimeout(() => this.inputEl()?.nativeElement.focus(), 0);
  }

  private scrollToBottom(): void {
    requestAnimationFrame(() => {
      const el = this.messagesEl()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
}
