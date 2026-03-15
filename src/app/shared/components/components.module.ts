import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LoaderComponent } from './loader/loader.component';
import { HeaderComponent } from './header/header.component';
import { WarningDialogComponent } from './warning-dialog/warning-dialog.component';
import { LogoutConfirmDialogComponent } from './logout-confirm-dialog/logout-confirm-dialog.component';
import { InputCustomComponent } from './custom-input/custom-input.component';
import { LayoutComponent } from './layout/layout.component';
import { PlanesComponent } from './planes/planes.component';
import { ProfilePreviewComponent } from './profile-preview/profile-preview.component';
@NgModule({
  declarations: [
    LoaderComponent,
    HeaderComponent,
    WarningDialogComponent,
    LogoutConfirmDialogComponent,
    InputCustomComponent,
    LayoutComponent,
    PlanesComponent,
    ProfilePreviewComponent
  ],
  exports: [
    LoaderComponent,
    HeaderComponent,
    WarningDialogComponent,
    InputCustomComponent,
    LogoutConfirmDialogComponent,
    LayoutComponent,
    PlanesComponent,
    ProfilePreviewComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule
],
  providers: []
})
export class ComponentsModule {}
