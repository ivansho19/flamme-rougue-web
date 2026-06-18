const urlBase = 'https://flamme-rouge-backend-production-913e.up.railway.app/api';


export const environment = {
  production: true,
  socket_url: 'https://flamme-rouge-backend-production.up.railway.app',
  api_login: `${urlBase}/auth/login`,
  api_register: `${urlBase}/auth/register`,
  api_register_client: `${urlBase}/auth/registerClient`,
  api_forgot_password: `${urlBase}/auth/forgot-password`,
  api_profile: `${urlBase}/profiles`,
  api_admin: `${urlBase}/admin`,
  api_topRojo: `${urlBase}/top-rojo`,
  api_client_by_email: `${urlBase}/auth/client`,
  api_notifications: `${urlBase}/notifications`,
  api_comments: `${urlBase}/comments`,
  api_ratings_toggle: `${urlBase}/ratings/toggle`,
  api_ratings_profile: `${urlBase}/ratings/profile`,
  api_comment_plans_activate: `${urlBase}/comment-plans/activate`,
  api_comment_plans_status: `${urlBase}/comment-plans/status`,
  api_comment_plans_cancel: `${urlBase}/comment-plans/cancel`,
  api_comment_plan: `${urlBase}/admin/comment-plan`,
  api_paypal_create_order: `${urlBase}/paypal/create-order`,
  api_paypal_capture_order: `${urlBase}/paypal/capture-order`,
  paypalClientId: 'AUmSQSyDGfoJmB_1i5mprH9IeM88tYcdFElXAya0AFbWAU1FCYb79utt50ChCZi1mpToQ0Gu-IzIRbN0',
  paypalCurrency: 'EUR',

};
