import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProfileService } from '../../shared/services/profile/profile.service';
import { IProfileResponse } from './models/IProfile.model';

@Component({
    selector: 'app-profiles',
    templateUrl: './profiles.component.html',
    styleUrls: ['./profiles.component.scss']
})
export class ProfilesComponent implements OnInit {

    profileId: string = '';
    profileData: IProfileResponse | null = null;
    fallbackImage = 'assets/images/model.webp';

    constructor(
      private route: ActivatedRoute,
      private router: Router,
      private profileService: ProfileService
    ) { }

    ngOnInit() {
      this.route.paramMap.subscribe(params => {
        this.profileId = params.get('id') || '';
        if (!this.profileId) {
          return;
        }
        this.getProfile();
      });
    }

    getProfile() {
      debugger;
      this.profileService.getProfileById(this.profileId).subscribe({
        next: (response) => {
          this.profileData = response?.profile ?? response ?? null;
          const resolvedId = this.profileData?._id || this.profileId;
          if (resolvedId) {
            localStorage.setItem('profileId', resolvedId);
          }
        },
        error: (error) => {
          console.error('Error cargando perfil:', error);
          this.profileData = null;
        }
      });
    }

    get availabilityText(): string {
      const availability = this.profileData?.availability ?? this.profileData?.availabity;
      if (Array.isArray(availability)) {
        return availability.join(', ');
      }
      return availability || '';
    }

    get languagesText(): string {
      const languages = this.profileData?.languages ?? this.profileData?.language;
      if (Array.isArray(languages)) {
        return languages.join(', ');
      }
      return languages || '';
    }

    get hairColorText(): string {
      return this.profileData?.hairColor || this.profileData?.haircolor || '';
    }

    get eyeColorText(): string {
      return this.profileData?.eyeColor || this.profileData?.eyecolor || '';
    }

    goToEditProfile() {
      if (this.profileData?._id) {
        localStorage.setItem('profileId', this.profileData._id);
      }
      this.router.navigate(['/my-profile']);
    }

    openWhatsApp() {
      const phone = this.profileData?.phone || '';
      if (!phone) {
        return;
      }

      const trimmedPhone = phone.trim();
      let cleanPhone = trimmedPhone.replace(/[^0-9]/g, '');
      if (trimmedPhone.startsWith('00')) {
        cleanPhone = cleanPhone.replace(/^00/, '');
      }
      if (!cleanPhone) {
        return;
      }

      const name = this.profileData?.displayName || 'perfil';
      const text = encodeURIComponent(`Hola ${name}, vi tu perfil y quisiera mas informacion.`);
      const url = `https://wa.me/${cleanPhone}?text=${text}`;
      window.open(url, '_blank');
    }

}