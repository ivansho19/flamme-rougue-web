const urlBase = 'https://flamme-rouge-backend-production.up.railway.app/api';


export const environment = {
  production: true,
  api_login: `${urlBase}/auth/login`,
  api_register: `${urlBase}/auth/register`,
  api_register_client: `${urlBase}/auth/registerClient`,
  api_forgot_password: `${urlBase}/auth/forgot-password`,
  api_profile: `${urlBase}/profiles`,
  api_topRojo: `${urlBase}/top-rojo`,
  api_client_by_email: `${urlBase}/auth/client`,
  api_comments: `${urlBase}/comments`,
  paypalClientId: 'AVhZngsPo6biCfIKcqWQ6TK3f9Pl_nCnqopcE7IrbDLONt9gqu0LceWpIhAL28arCbWc0kA1rSODytHt',
  paypalCurrency: 'EUR',

};
