import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SeoService } from './shared/services/seo/seo.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'flamme-rouge-web';

  constructor(private seo: SeoService) {}

  ngOnInit(): void {
    this.seo.init();
  }
}
