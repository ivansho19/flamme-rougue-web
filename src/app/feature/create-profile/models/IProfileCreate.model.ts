export interface IImageData {
  url: string;
  public_id: string;
}

/** Shape accepted by POST /profiles/createKYC (legacy: single object). */
export interface IKYCCreateRequest {
  userId: string;
  fullName: string;
  age?: number | null;
  nationality?: string;
  phone?: string;
  email?: string;
  documentType?: string;
  documentNumber?: string | null;
  documentImage: IImageData | IImageData[];
}

export interface IKYCRecord {
  _id: string;
  userId?: string;
  profileId?: string;
  fullName?: string;
  age?: number | null;
  nationality?: string;
  phone?: string;
  email?: string;
  documentType?: string;
  documentNumber?: string | null;
  documentImage?: IImageData | IImageData[];
  verify?: boolean;
  status?: 'pending' | 'verified' | 'rejected' | string;
  createdAt?: string;
  updatedAt?: string;
}

/** Body for PUT /profiles/updateKYC/:kycId — documentImage as array. */
export interface IKYCUpdateRequest {
  fullName?: string;
  age?: number | null;
  nationality?: string;
  phone?: string;
  email?: string;
  documentType?: string;
  documentNumber?: string | null;
  documentImage?: IImageData[];
}

export interface IProfileCreateRequest {
  objectId: string;
  displayName: string;
  bio?: string;
  email?: string;
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
  promoDurationDays?: number;
  promoSelectedPlanId?: string;
}
