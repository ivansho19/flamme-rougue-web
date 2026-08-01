import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

export type SeoConfig = {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
};

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly router = inject(Router);

  readonly siteUrl = 'https://flammesrouges.com';
  readonly defaultTitle = 'Flammes Rouges | Plataforma de citas #1 en Europa';
  readonly defaultDescription =
    'Flammes Rouges - La mejor plataforma de citas #1 en las mejores ciudades de Europa. Anuncios verificados para mayores de 18 años.';
  readonly defaultImage = `${this.siteUrl}/assets/images/new_logo.png`;

  private readonly routeDefaults: Record<string, SeoConfig> = {
    '/home': {
      title: this.defaultTitle,
      description: this.defaultDescription
    },
    '/legal': {
      title: 'Aviso legal y términos | Flammes Rouges',
      description:
        'Consulta el aviso legal, términos de uso, privacidad, cookies y política de protección de menores de Flammes Rouges.'
    },
    '/auth/login': {
      title: 'Iniciar sesión | Flammes Rouges',
      description: 'Accede a tu cuenta de Flammes Rouges.',
      noIndex: true
    },
    '/auth/register': {
      title: 'Crear cuenta | Flammes Rouges',
      description: 'Regístrate en Flammes Rouges para publicar o explorar anuncios.',
      noIndex: false
    },
    '/create-profile': {
      title: 'Crear anuncio | Flammes Rouges',
      noIndex: true
    },
    '/my-profile': {
      title: 'Mi anuncio | Flammes Rouges',
      noIndex: true
    },
    '/payments': {
      title: 'Pagos | Flammes Rouges',
      noIndex: true
    },
    '/admin/dashboard': {
      title: 'Admin | Flammes Rouges',
      noIndex: true
    },
    '/dashboard/my-top-rojo': {
      title: 'Mi Top Rojo | Flammes Rouges',
      noIndex: true
    },
    '/dashboard/comment-plans': {
      title: 'Planes de comentarios | Flammes Rouges',
      noIndex: true
    }
  };

  init(): void {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        const path = this.normalizePath(event.urlAfterRedirects);
        if (path.startsWith('/profile/')) {
          // Profiles set their own SEO after data loads.
          return;
        }

        const fromRoute = this.collectRouteSeo(this.router.routerState.snapshot.root);
        const fromMap = this.routeDefaults[path] || {};
        this.apply({
          ...fromMap,
          ...fromRoute,
          path
        });
      });
  }

  apply(config: SeoConfig): void {
    const title = config.title || this.defaultTitle;
    const description = config.description || this.defaultDescription;
    const path = config.path || '/';
    const url = `${this.siteUrl}${path === '/' ? '/' : path}`;
    const image = config.image || this.defaultImage;
    const robots = config.noIndex ? 'noindex, nofollow' : 'index, follow';

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'robots', content: robots });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: image });
    this.setCanonical(url);
  }

  applyProfile(name: string, slug: string, description?: string, image?: string): void {
    const safeName = (name || 'Perfil').trim();
    const path = `/profile/${slug}`;
    this.apply({
      title: `${safeName} | Flammes Rouges`,
      description:
        description?.trim() ||
        `Perfil de ${safeName} en Flammes Rouges. Plataforma de citas en las mejores ciudades de Europa.`,
      path,
      image: image || this.defaultImage,
      noIndex: false
    });
  }

  private setCanonical(url: string): void {
    let link = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private normalizePath(url: string): string {
    const bare = (url || '/').split('?')[0].split('#')[0];
    if (!bare || bare === '/') {
      return '/home';
    }
    return bare.endsWith('/') && bare.length > 1 ? bare.slice(0, -1) : bare;
  }

  private collectRouteSeo(route: ActivatedRouteSnapshot): SeoConfig {
    let current: ActivatedRouteSnapshot | null = route;
    let seo: SeoConfig = {};

    while (current) {
      if (current.data?.['seo']) {
        seo = { ...seo, ...(current.data['seo'] as SeoConfig) };
      }
      current = current.firstChild;
    }

    return seo;
  }
}
