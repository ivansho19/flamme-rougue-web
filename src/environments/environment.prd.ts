const urlBase = 'https://flamme-rouge-backend-production.up.railway.app/api';


export const environment = {
  production: false,
  api_login: `${urlBase}/auth/login`,
  api_register: `${urlBase}/auth/register`,
  api_register_client: `${urlBase}/auth/registerClient`,
  api_forgot_password: `${urlBase}/auth/forgot-password`,
  api_profile: `${urlBase}/profiles`,
  api_client_by_email: `${urlBase}/auth/client`,

};
