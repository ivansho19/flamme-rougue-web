export interface IProfileCreateRequest {
  objectId: string;
  displayName: string;
  bio: string;
  phone: string;
  city: string;
  availability: string[];
  gender: string;
  age: number | null;
  nationality: string;
  height: number | null;
  weight: number | null;
  hairColor: string;
  eyeColor: string;
  languages: string[];
  isPremium: boolean;
  imagesMain?: {
    url: string;
    public_id: string;
  };
  imagesGallery: Array<{
    url: string;
    public_id: string;
  }>;
  planId?: string | null;
}
