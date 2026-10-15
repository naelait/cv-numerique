/** Scroll-scrubbed word reveal — preserves semantic text, splits words for CSS progress. */
export class ScrollWordReveal {
  private readonly words: HTMLElement[] = [];
  private readonly original: Node;
  private readonly host: HTMLElement;

  constructor(host: HTMLElement) {
    this.host = host;
    this.original = host.cloneNode(true);
    this.splitWords();
  }

  update(progress: number): void {
    const clamped = Math.min(1, Math.max(0, progress));
    const head = 2.4 + clamped * Math.max(this.words.length - 0.6, 1);
    this.words.forEach((word, index) => {
      const local = Math.min(1, Math.max(0, (head - index) / 2.2));
      word.style.setProperty('--word-progress', local.toFixed(3));
    });
  }

  showAll(): void {
    this.words.forEach((word) => word.style.setProperty('--word-progress', '1'));
  }

  dispose(): void {
    this.host.replaceWith(this.original);
  }

  private splitWords(): void {
    const walker = document.createTreeWalker(this.host, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) =>
        node.nodeValue?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
    });

    const textNodes: Text[] = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode as Text);
    }

    for (const node of textNodes) {
      const fragment = document.createDocumentFragment();
      for (const token of node.nodeValue!.split(/(\s+)/)) {
        if (/^\s+$/.test(token)) {
          fragment.append(token);
        } else if (token) {
          const span = document.createElement('span');
          span.dataset['word'] = '';
          span.setAttribute('aria-hidden', 'true');
          span.textContent = token;
          fragment.append(span);
        }
      }
      node.replaceWith(fragment);
    }

    this.words.push(...this.host.querySelectorAll<HTMLElement>('[data-word]'));
  }
}
