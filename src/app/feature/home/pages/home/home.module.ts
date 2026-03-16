import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HomeComponent } from './home.component';
import { HomeRoutingModule } from './home-routing.component';
import { BannerCarouselComponent } from '../../components/banner-carousel/banner-carousel.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ComponentsModule } from '../../../../shared/components/components.module';
@NgModule({
  declarations: [HomeComponent, BannerCarouselComponent, CardComponent],
  exports: [ HomeComponent, HomeRoutingModule, BannerCarouselComponent, CardComponent],
  imports: [
    HomeRoutingModule,
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    ComponentsModule
],
})
export class HomeModule {}
