import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ComponentsModule } from '../../../shared/components/components.module';
import { AdminDashboardRoutingModule } from './admin-dashboard-routing.component';
import { AdminDashboardComponent } from './admin-dashboard.component';


@NgModule({
  declarations: [AdminDashboardComponent],
  exports: [ AdminDashboardComponent, AdminDashboardRoutingModule],
  imports: [
    AdminDashboardRoutingModule,
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule,
    MatPaginatorModule,
    MatSlideToggleModule,
    MatTooltipModule,
    ComponentsModule
  ]
})
export class AdminDashboardModule {}
