export interface IImageData {
  url: string;
  public_id: string;
}

export interface IKYCCreateRequest {
  userId: string;
  fullName: string;
  age?: number | null;
  nationality?: string;
  phone?: string;
  email?: string;
  documentImage: IImageData;
}

export interface IProfileCreateRequest {
  objectId: string;
  displayName: string;
  bio?: string;
  phone?: string;
  country?: string;
  city?: string;
  zone?: string;
  availability?: string[];
  gender?: string;
  orientation?: string;
  birthDate?: Date | null;
  age?: number | null;
  nationality?: string;
  height?: number | null;
  weight?: number | null;
  hairColor?: string;
  eyeColor?: string;
  languages?: string[];
  plan?: any[];
  imagesMain?: IImageData;
  imagesGallery?: IImageData[];
  posibilities?: string[];
  alcohol?: string;
  cigarette?: string;
  isActiveProfile?: boolean;
  isVerify?: boolean;
  blockedCountries?: string[];
  promoCode?: string;
}
