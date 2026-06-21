export const CITY_OTHER_VALUE = '__OTHER__';

export class CitySelectionHelper {
  static withOtherOption(cities: string[]): string[] {
    if (cities.includes(CITY_OTHER_VALUE)) {
      return cities;
    }
    return [...cities, CITY_OTHER_VALUE];
  }

  static isOtherSelected(city: string | null | undefined): boolean {
    return city === CITY_OTHER_VALUE;
  }

  static resolveSelectionFromStored(
    storedCity: string | null | undefined,
    predefinedCities: string[]
  ): { city: string; customCity: string } {
    const normalized = (storedCity || '').trim();
    if (!normalized) {
      return { city: '', customCity: '' };
    }
    if (predefinedCities.includes(normalized)) {
      return { city: normalized, customCity: '' };
    }
    return { city: CITY_OTHER_VALUE, customCity: normalized };
  }

  static resolveCityForPayload(
    city: string | null | undefined,
    customCity: string | null | undefined
  ): string {
    if (CitySelectionHelper.isOtherSelected(city)) {
      return (customCity || '').trim();
    }
    return (city || '').trim();
  }
}
