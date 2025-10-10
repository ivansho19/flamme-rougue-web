export interface IAuthRequest {
  name: string;
  lastName: string;
  email: string;
  password: string;
  country: string;
  city: string;
  gender: string;
  phone: string;
}

export interface IAuthResponse {
    _id: string;
    name: string;
    email: string;
    token: string;
}
