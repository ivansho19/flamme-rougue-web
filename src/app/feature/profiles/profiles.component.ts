import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProfileService } from '../../shared/services/profile/profile.service';
import { IProfileResponse } from './models/IProfile.model';
import EmblaCarousel, { EmblaCarouselType } from 'embla-carousel';

@Component({
    selector: 'app-profiles',
    templateUrl: './profiles.component.html',
    styleUrls: ['./profiles.component.scss']
})
export class ProfilesComponent implements OnInit {

    profileId: string = '';
    profileData: IProfileResponse | null = null;
    fallbackImage = 'assets/images/model.webp';
    showGallery = false;
    private embla: EmblaCarouselType | null = null;
    @ViewChild('emblaViewport') emblaViewport?: ElementRef<HTMLDivElement>;

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

    get galleryUrls(): string[] {
      const urls: string[] = [];
      const mainUrl = this.profileData?.imagesMain?.url;
      if (mainUrl) {
        urls.push(mainUrl);
      }

      if (this.profileData?.imagesGallery?.length) {
        this.profileData.imagesGallery
          .map(item => item?.url)
          .filter((url): url is string => !!url)
          .forEach(url => urls.push(url));
      }

      return urls;
    }

    openGallery(startIndex: number = 0) {
      if (!this.galleryUrls.length) {
        return;
      }
      this.showGallery = true;
      setTimeout(() => {
        this.initEmbla(startIndex);
      });
    }

    closeGallery() {
      this.showGallery = false;
      this.destroyEmbla();
    }

    scrollPrev() {
      this.embla?.scrollPrev();
    }

    scrollNext() {
      this.embla?.scrollNext();
    }

    private initEmbla(startIndex: number) {
      if (!this.emblaViewport?.nativeElement) {
        return;
      }

      this.destroyEmbla();
      this.embla = EmblaCarousel(this.emblaViewport.nativeElement, {
        loop: true,
        startIndex
      });
    }

    private destroyEmbla() {
      if (this.embla) {
        this.embla.destroy();
        this.embla = null;
      }
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

    get posibilitiesList(): string[] {
      const raw = this.profileData?.posibilities ?? (this.profileData as any)?.possibilities;
      if (Array.isArray(raw)) {
        return raw.filter((item: string) => !!item && item.trim().length > 0);
      }
      if (typeof raw === 'string') {
        return raw.split(',').map(item => item.trim()).filter(Boolean);
      }
      return [];
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
      const text = encodeURIComponent(`Hola ${name}, vi tu perfil en FlammeRouge y quisiera mas informacion.`);
      const url = `https://wa.me/${cleanPhone}?text=${text}`;
      window.open(url, '_blank');
    }

}