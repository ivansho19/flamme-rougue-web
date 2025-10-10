import { Routes } from '@angular/router';

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
    path: 'home',
    loadChildren: () =>
      import('./home/pages/home/home.module').then((m) => m.HomeModule),
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
