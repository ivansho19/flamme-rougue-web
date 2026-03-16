import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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

    constructor(private route: ActivatedRoute, private profileService: ProfileService) { }

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
      this.profileService.getProfileById(this.profileId).subscribe({
        next: (response) => {
          this.profileData = response?.profile ?? response ?? null;
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

}