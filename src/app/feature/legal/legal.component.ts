import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SeoService } from '../../shared/services/seo/seo.service';

@Component({
  selector: 'app-legal',
  templateUrl: './legal.component.html',
  styleUrls: ['./legal.component.scss']
})
export class LegalComponent implements OnInit {
  readonly updatedAt = '1 de agosto de 2026';

  constructor(
    private seo: SeoService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.seo.apply({
      title: 'Aviso legal y términos | Flammes Rouges',
      description:
        'Consulta el aviso legal, términos de uso, privacidad, cookies y política de protección de menores de Flammes Rouges.',
      path: '/legal'
    });

    this.route.fragment.subscribe((fragment) => {
      if (!fragment) {
        return;
      }
      setTimeout(() => this.scrollTo(fragment), 80);
    });
  }

  scrollTo(id: string): void {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
