import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LoaderComponent } from './loader/loader.component';
import { HeaderComponent } from './header/header.component';
import { WarningDialogComponent } from './warning-dialog/warning-dialog.component';
import { LogoutConfirmDialogComponent } from './logout-confirm-dialog/logout-confirm-dialog.component';
import { InputCustomComponent } from './custom-input/custom-input.component';
@NgModule({
  declarations: [
    LoaderComponent,
    HeaderComponent,
    WarningDialogComponent,
    LogoutConfirmDialogComponent,
    InputCustomComponent
  ],
  exports: [
    LoaderComponent,
    HeaderComponent,
    WarningDialogComponent,
    InputCustomComponent,
    LogoutConfirmDialogComponent
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
