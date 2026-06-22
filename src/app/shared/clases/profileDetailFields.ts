import { IProfileResponse } from '../../feature/profiles/models/IProfile.model';

export interface ProfileDetailField {
  icon: string;
  labelKey: string;
  value: string;
}

export interface ProfileDetailUnits {
  years: string;
  cm: string;
  kg: string;
}

export class ProfileDetailFieldsHelper {
  static build(
    profile: IProfileResponse | null | undefined,
    units: ProfileDetailUnits
  ): ProfileDetailField[] {
    if (!profile) {
      return [];
    }

    const hairColor = ProfileDetailFieldsHelper.resolveHairColor(profile);
    const eyeColor = ProfileDetailFieldsHelper.resolveEyeColor(profile);
    const languages = ProfileDetailFieldsHelper.resolveLanguages(profile);

    const fields: Array<ProfileDetailField | null> = [
      profile.gender
        ? { icon: 'bi-person-standing', labelKey: 'PROFILE.GENDER', value: profile.gender }
        : null,
      profile.orientation
        ? { icon: 'bi-compass', labelKey: 'PROFILE.SEXUAL_ORIENTATION', value: profile.orientation }
        : null,
      hairColor
        ? { icon: 'bi-brush', labelKey: 'PROFILE.HAIR_COLOR', value: hairColor }
        : null,
      profile.age != null
        ? { icon: 'bi-calendar-heart', labelKey: 'PROFILE.AGE', value: `${profile.age} ${units.years}` }
        : null,
      eyeColor
        ? { icon: 'bi-eye', labelKey: 'PROFILE.EYE_COLOR', value: eyeColor }
        : null,
      profile.nationality
        ? { icon: 'bi-globe-americas', labelKey: 'PROFILE.NATIONALITY', value: profile.nationality }
        : null,
      languages
        ? { icon: 'bi-translate', labelKey: 'PROFILE.LANGUAGES', value: languages }
        : null,
      profile.height != null
        ? { icon: 'bi-arrows-vertical', labelKey: 'PROFILE.HEIGHT', value: `${profile.height}${units.cm}` }
        : null,
      profile.weight != null
        ? { icon: 'bi-activity', labelKey: 'PROFILE.WEIGHT', value: `${profile.weight}${units.kg}` }
        : null,
      profile.alcohol
        ? { icon: 'bi-cup-straw', labelKey: 'PROFILE_FORM.ALCOHOL_PLACEHOLDER', value: profile.alcohol }
        : null,
      profile.cigarette
        ? { icon: 'bi-cloud-haze2', labelKey: 'PROFILE_FORM.CIGARETTE_PLACEHOLDER', value: profile.cigarette }
        : null
    ];

    return fields.filter((field): field is ProfileDetailField => field !== null);
  }

  private static resolveHairColor(profile: IProfileResponse): string {
    return profile.hairColor || profile.haircolor || '';
  }

  private static resolveEyeColor(profile: IProfileResponse): string {
    return profile.eyeColor || profile.eyecolor || '';
  }

  private static resolveLanguages(profile: IProfileResponse): string {
    const languages = profile.languages ?? profile.language;
    if (Array.isArray(languages)) {
      return languages.join(', ');
    }
    return languages || '';
  }
}
