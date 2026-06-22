
  export class GetPosibilities {
     static GetPosibilityOptions(): any  {
      return [
        { value: 'Masaje_relajante', label: 'SERVICES.RELAXING_MASSAGE', icon: 'bi-hand-index-thumb' },
        { value: 'Masaje_sensual', label: 'SERVICES.SENSUAL_MASSAGE', icon: 'bi-flower1' },
        { value: 'Masaje_tantrico', label: 'SERVICES.TANTRIC_MASSAGE', icon: 'bi-moon-stars' },
        { value: 'Trato_presencial', label: 'SERVICES.IN_PERSON_SERVICE', icon: 'bi-person-hearts' },
        { value: 'Experiencia_afectiva', label: 'SERVICES.AFFECTIONATE_EXPERIENCE', icon: 'bi-heart' },
        { value: 'Ducha_disponible', label: 'SERVICES.SHOWER_AVAILABLE', icon: 'bi-droplet-half' },
        { value: 'Cena_acompanamiento', label: 'SERVICES.DINNER_COMPANIONSHIP', icon: 'bi-cup-hot' },
        { value: 'Acompanamiento_tipo_cita', label: 'SERVICES.DATE_LIKE_COMPANIONSHIP', icon: 'bi-calendar-heart' },
        { value: 'Visitas_clubs_saunas', label: 'SERVICES.CLUB_SAUNA_VISITS', icon: 'bi-building' },
        { value: 'Striptease', label: 'SERVICES.STRIPTEASE', icon: 'bi-music-note-beamed' },
        { value: 'Acompanamiento_nocturno', label: 'SERVICES.NIGHT_COMPANIONSHIP', icon: 'bi-moon' },
        { value: 'Experiencias_personalizadas', label: 'SERVICES.CUSTOM_EXPERIENCES', icon: 'bi-gem' },
        { value: 'Parejas', label: 'SERVICES.COUPLES', icon: 'bi-people' },
        { value: 'Viajes_acompanamiento_social', label: 'SERVICES.TRAVEL_SOCIAL_COMPANIONSHIP', icon: 'bi-airplane' }
    ];
    }

    static getServiceIcon(value: string): string {
      const option = GetPosibilities.GetPosibilityOptions().find((item: { value: string }) => item.value === value);
      return option?.icon || 'bi-star-fill';
    }
  }