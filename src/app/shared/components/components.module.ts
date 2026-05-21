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
import { ToastAlertComponent } from './toast-alert/toast-alert.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { TopRojoModalComponent } from './top-rojo-modal/top-rojo-modal.component';
import { PlanSelectionModalComponent } from './plan-selection-modal/plan-selection-modal.component';
import { FlagsComponent } from './flags/flags.component';
import { KycInfoModalComponent } from './kyc-info-modal/kyc-info-modal.component';
import { ConfirmActionModalComponent } from './confirm-action-modal/confirm-action-modal.component';

@NgModule({
  declarations: [
    LoaderComponent,
    HeaderComponent,
    WarningDialogComponent,
    LogoutConfirmDialogComponent,
    InputCustomComponent,
    LayoutComponent,
    PlanesComponent,
    ProfilePreviewComponent,
    ToastAlertComponent,
    TopRojoModalComponent,
    PlanSelectionModalComponent,
    FlagsComponent,
    KycInfoModalComponent,
    ConfirmActionModalComponent
  ],
  exports: [
    LoaderComponent,
    HeaderComponent,
    WarningDialogComponent,
    InputCustomComponent,
    LogoutConfirmDialogComponent,
    LayoutComponent,
    PlanesComponent,
    ProfilePreviewComponent,
    ToastAlertComponent,
    TranslateModule,
    TopRojoModalComponent,
    PlanSelectionModalComponent,
    FlagsComponent,
    KycInfoModalComponent,
    ConfirmActionModalComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatDialogModule,
    TranslateModule
],
  providers: []
})
export class ComponentsModule {}
