import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProfileService } from '../../shared/services/profile/profile.service';
import { CommentsService, CommentItem } from '../../shared/services/comments/comments.service';
import { TranslateService } from '@ngx-translate/core';
import { GetPosibilities } from '../../shared/clases/getPosibilityOptions';
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
    likeCount = 10;
    dislikeCount = 0;
    userReaction: 'like' | 'dislike' | null = null;
    comments: CommentItem[] = [];
    commentsLoading = false;
    commentSubmitting = false;
    commentError = '';
    newCommentText = '';
    private embla: EmblaCarouselType | null = null;
    private readonly serviceLabelMap = new Map<string, string>(
      GetPosibilities.GetPosibilityOptions().map((option: { value: string; label: string }) => [option.value, option.label])
    );
    @ViewChild('emblaViewport') emblaViewport?: ElementRef<HTMLDivElement>;

    constructor(
      private route: ActivatedRoute,
      private router: Router,
      private profileService: ProfileService,
      private commentsService: CommentsService,
      private translate: TranslateService
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
          this.loadComments();
        },
        error: (error) => {
          console.error('Error cargando perfil:', error);
          this.profileData = null;
        }
      });
    }

    private loadComments() {
      if (!this.profileId) {
        return;
      }

      this.commentsLoading = true;
      this.commentsService.getCommentsByProfile(this.profileId).subscribe({
        next: (comments) => {
          this.comments = Array.isArray(comments) ? comments : [];
          this.commentsLoading = false;
        },
        error: () => {
          this.comments = [];
          this.commentsLoading = false;
        }
      });
    }

    onCommentInput(value: string) {
      this.newCommentText = value;
      if (this.commentError) {
        this.commentError = '';
      }
    }

    submitComment() {
      const text = this.newCommentText.trim();
      if (!text) {
        this.commentError = 'Ingresa un comentario.';
        return;
      }

      const authorId = localStorage.getItem('userId');
      if (!authorId) {
        this.commentError = 'Debes iniciar sesión para comentar.';
        return;
      }

      this.commentSubmitting = true;
      this.commentsService.createComment({
        profileId: this.profileId,
        authorId,
        text
      }).subscribe({
        next: () => {
          this.newCommentText = '';
          this.commentSubmitting = false;
          this.loadComments();
        },
        error: (error) => {
          this.commentSubmitting = false;
          this.commentError = error?.error?.message || 'No se pudo enviar el comentario.';
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

    get planBadgeLabel(): string | null {
        if (this.profileData && this.profileData.plan?.[0] === '2') {
            return 'Pro';
        }
        if (this.profileData && this.profileData.plan?.[0] === '3') {
            return 'Premium';
        }
        if (this.profileData && (this.profileData.plan?.[0] === '0' || this.profileData.plan?.[0] === '1')) {
            return 'Basico';
        }
        return null;
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

    getServiceLabel(value: string): string {
      return this.serviceLabelMap.get(value) || value;
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
      const message = this.translate.instant('PROFILE.WHATSAPP_MESSAGE', { name });
      const text = encodeURIComponent(message);
      const url = `https://wa.me/${cleanPhone}?text=${text}`;
      window.open(url, '_blank');
    }

    toggleReaction(type: 'like' | 'dislike') {
      if (this.userReaction === type) {
        this.userReaction = null;
        if (type === 'like') {
          this.likeCount = Math.max(0, this.likeCount - 1);
        } else {
          this.dislikeCount = Math.max(0, this.dislikeCount - 1);
        }
        return;
      }

      if (this.userReaction === 'like') {
        this.likeCount = Math.max(0, this.likeCount - 1);
      }
      if (this.userReaction === 'dislike') {
        this.dislikeCount = Math.max(0, this.dislikeCount - 1);
      }

      this.userReaction = type;
      if (type === 'like') {
        this.likeCount += 1;
      } else {
        this.dislikeCount += 1;
      }
    }

}