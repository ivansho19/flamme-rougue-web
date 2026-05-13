export interface IProfileImage {
  url: string;
  public_id: string;
}

export interface IProfileResponse {
  _id: string;
  objectId?: string;
  displayName: string;
  bio?: string;
  phone?: string;
  city?: string;
  zone?: string;
  availability?: string[];
  availabity?: string[] | string;
  gender?: string;
  orientation?: string;
  plan?: any[] | null;
  age?: number;
  nationality?: string;
  height?: number;
  weight?: number;
  hairColor?: string;
  haircolor?: string;
  eyeColor?: string;
  eyecolor?: string;
  languages?: string[];
  language?: string[] | string;
  isPremium?: boolean;
  imagesGallery?: IProfileImage[];
  imagesMain?: IProfileImage;
  alcohol?: string;
  cigarette?: string;
  posibilities?: string[];
  isActiveProfile?: boolean;
  isVerify?: boolean;
}