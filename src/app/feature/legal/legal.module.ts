import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LegalComponent } from './legal.component';

const routes: Routes = [
  {
    path: '',
    component: LegalComponent,
    data: {
      seo: {
        title: 'Aviso legal y términos | Flammes Rouges',
        description:
          'Consulta el aviso legal, términos de uso, privacidad, cookies y política de protección de menores de Flammes Rouges.'
      }
    }
  }
];

@NgModule({
  declarations: [LegalComponent],
  imports: [CommonModule, TranslateModule, RouterModule.forChild(routes)]
})
export class LegalModule {}
