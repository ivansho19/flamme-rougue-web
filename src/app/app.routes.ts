import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { LayoutComponent } from './shared/components/layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadChildren: () =>
          import('./auth/login/login.module').then((m) => m.LoginModule),
      },
      {
        path: 'register',
        loadChildren: () =>
          import('./auth/register/register.module').then((m) => m.RegisterModule),
      },
    ],
  },
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'home',
        loadChildren: () =>
          import('./feature/home/pages/home/home.module').then((m) => m.HomeModule),
      },
      {
        path: 'profile/:id',
        loadChildren: () =>
          import('./feature/profiles/profiles.module').then((m) => m.ProfilesModule),
      },
      {
        canActivate:[],
        path: 'create-profile',
        loadChildren: () =>
          import('./feature/create-profile/create-profile.module').then((m) => m.ProfileEditModule),
      },
      {
        path: 'my-profile',
        loadChildren: () =>
          import('./feature/update-profile/update-profile.module').then((m) => m.UpdateProfileModule),
      },
      {
        path: 'payments',
        loadChildren: () =>
          import('./feature/payments/payment.module').then((m) => m.PaymentModule),
      },
      {
        path: 'dashboard/my-top-rojo',
        loadChildren: () =>
          import('./feature/dashboard/my-top-rojo/my-top-rojo.module').then((m) => m.MyTopRojoModule),
      }]
  },
  {
    path: '**',
    redirectTo: '/auth/login'
  }
];
