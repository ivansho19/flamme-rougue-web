import { IProfileResponse } from '../../feature/profiles/models/IProfile.model';

export interface ProfileContactField {
  icon: string;
  labelKey: string;
  value: string;
}

export class ProfileContactFieldsHelper {
  static build(profile: IProfileResponse | null | undefined): ProfileContactField[] {
    if (!profile) {
      return [];
    }

    const availability = ProfileContactFieldsHelper.resolveAvailability(profile);

    const fields: Array<ProfileContactField | null> = [
      profile.phone
        ? { icon: 'bi-telephone-fill', labelKey: 'PROFILE.PHONE', value: profile.phone }
        : null,
      availability
        ? { icon: 'bi-calendar-check', labelKey: 'PROFILE.AVAILABILITY', value: availability }
        : null
    ];

    return fields.filter((field): field is ProfileContactField => field !== null);
  }

  private static resolveAvailability(profile: IProfileResponse): string {
    const availability = profile.availability ?? profile.availabity;
    if (Array.isArray(availability)) {
      return availability.join(', ');
    }
    return availability || '';
  }
}
