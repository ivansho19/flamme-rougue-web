const urlBase = 'http://localhost:5000/api';


export const environment = {
  production: true,
  api_login: `${urlBase}/auth/login`,
  api_register: `${urlBase}/auth/register`,
  api_forgot_password: `${urlBase}/auth/forgot-password`,
  api_profile: `${urlBase}/auth/profile`,

};
