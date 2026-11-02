/**
 * Resets the main viewport (and layout content) to the top.
 * Use when navigating into a route that must always open at the header
 * (e.g. public profile), because Angular scroll restoration / a scrolled
 * home page can leave the new view mid-page.
 */
export class ScrollToTop {
  static readonly LAYOUT_CONTENT_SELECTOR = '.layout-content';

  static reset(options?: { behavior?: ScrollBehavior }): void {
    const behavior = options?.behavior ?? 'auto';

    try {
      window.scrollTo({ top: 0, left: 0, behavior });
    } catch {
      window.scrollTo(0, 0);
    }

    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }
    if (document.scrollingElement) {
      document.scrollingElement.scrollTop = 0;
    }

    const layoutContent = document.querySelector(
      ScrollToTop.LAYOUT_CONTENT_SELECTOR
    ) as HTMLElement | null;
    if (layoutContent) {
      layoutContent.scrollTop = 0;
    }
  }

  /**
   * Immediate reset plus two animation frames, so async profile paint
   * (images / cached data) does not leave the user scrolled down.
   */
  static resetAfterNavigation(): void {
    ScrollToTop.reset({ behavior: 'auto' });
    requestAnimationFrame(() => {
      ScrollToTop.reset({ behavior: 'auto' });
      requestAnimationFrame(() => ScrollToTop.reset({ behavior: 'auto' }));
    });
  }
}
