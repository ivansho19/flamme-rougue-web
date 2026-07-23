export interface IAuthRequest {
  name: string;
  lastName: string;
  email: string;
  password: string;
  cfTurnstileToken?: string;
  country?: string;
  city?: string;
  gender?: string;
  phone?: string;
}

export interface IAuthResponse {
    _id: string;
    name: string;
    email: string;
    profileId?: any;
    client?: boolean;
    token: string;
    isAdmin?: boolean;
}
