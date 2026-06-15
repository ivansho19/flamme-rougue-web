import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProfileService } from '../../shared/services/profile/profile.service';
import { CommentsService, CommentItem } from '../../shared/services/comments/comments.service';
import { RatingsService } from '../../shared/services/ratings/ratings.service';
import { TranslateService } from '@ngx-translate/core';
import { GetPosibilities } from '../../shared/clases/getPosibilityOptions';
import { IProfileResponse } from './models/IProfile.model';
import EmblaCarousel, { EmblaCarouselType } from 'embla-carousel';
import { CommentPlansService } from '../../shared/services/comment-plans/comment-plans.service';
import { CommentPlanStatus } from '../../shared/models/comment-plans.model';

@Component({
    selector: 'app-profiles',
    templateUrl: './profiles.component.html',
    styleUrls: ['./profiles.component.scss']
})
export class ProfilesComponent implements OnInit {

  private readonly commentRulesAcceptedStorageKey = 'commentRulesAccepted';

    profileId: string = '';
    profileData: IProfileResponse | null = null;
    fallbackImage = 'assets/images/model.webp';
    showGallery = false;
    likeCount = 0;
    userReaction: 'like' | null = null;
    likeError = '';
    comments: CommentItem[] = [];
    commentsLoading = false;
    commentSubmitting = false;
    commentError = '';
    newCommentText = '';
    replySubmitting: Record<string, boolean> = {};
    replyError: Record<string, string> = {};
    replyText: Record<string, string> = {};
    planStatus: CommentPlanStatus | null = null;
    loading = false;
    actionLoading = false;
    error = '';
    showPlanModal = false;
    showRulesModal = false;
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
      private ratingsService: RatingsService,
      private translate: TranslateService,
      private commentPlansService: CommentPlansService
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
          this.loadLikes();
          this.loadComments();
        },
        error: (error) => {
          console.error('Error cargando perfil:', error);
          this.profileData = null;
        }
      });
    }

    private loadLikes() {
      if (!this.profileId) {
        return;
      }

      this.ratingsService.getLikesCount(this.profileId).subscribe({
        next: (response) => {
          this.likeCount = response?.likesCount ?? 0;
        },
        error: () => {
          this.likeCount = 0;
        }
      });

      const userId = localStorage.getItem('userId');
      if (!userId) {
        this.userReaction = null;
        return;
      }

      this.ratingsService.getUserLikeStatus(this.profileId, userId).subscribe({
        next: (response) => {
          this.userReaction = response?.isLiked ? 'like' : null;
        },
        error: () => {
          this.userReaction = null;
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

    onCommentFocus() {
      if (this.hasAcceptedCommentRules()) {
        return;
      }

      this.showRulesModal = true;
    }

    submitComment() {
      const text = this.newCommentText.trim();
      if (!text) {
        this.commentError = this.translate.instant('PROFILE.COMMENT_ERROR_REQUIRED');
        return;
      }

      const authorId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');
      if (!authorId || !token) {
        this.commentError = this.translate.instant('PROFILE.COMMENT_ERROR_LOGIN');
        return;
      }

      const user = localStorage.getItem('user');
      if (!user) {
        this.commentError = this.translate.instant('PROFILE.COMMENT_ERROR_CLIENT');
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
          const client = localStorage.getItem('client');
          this.commentSubmitting = false;
          this.commentError = error?.error?.message || this.translate.instant('PROFILE.COMMENT_ERROR_GENERIC');
          if (!client) {
            this.showPlanModal = true;
          }
        }
      });
    }

    confirmSubmitComment() {
      localStorage.setItem(this.commentRulesAcceptedStorageKey, 'true');
      this.showRulesModal = false;
    }

    private hasAcceptedCommentRules(): boolean {
      return localStorage.getItem(this.commentRulesAcceptedStorageKey) === 'true';
    }

    isProfileOwner(): boolean {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        return false;
      }
      return this.profileData?.objectId === userId;
    }

    onReplyInput(commentId: string, value: string) {
      this.replyText[commentId] = value;
      if (this.replyError[commentId]) {
        this.replyError[commentId] = '';
      }
    }

    submitReply(comment: CommentItem) {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');
      if (!userId || !token) {
        this.replyError[comment._id] = this.translate.instant('PROFILE.COMMENT_REPLY_ERROR_LOGIN');
        return;
      }

      const text = (this.replyText[comment._id] || '').trim();
      if (!text) {
        this.replyError[comment._id] = this.translate.instant('PROFILE.COMMENT_REPLY_ERROR_REQUIRED');
        return;
      }

      this.replySubmitting[comment._id] = true;
      this.commentsService.addProviderReply(comment._id, {
        replyText: text,
        userId
      }).subscribe({
        next: () => {
          this.replySubmitting[comment._id] = false;
          this.replyText[comment._id] = '';
          this.loadComments();
        },
        error: (error) => {
          this.replySubmitting[comment._id] = false;
          this.replyError[comment._id] = error?.error?.message || this.translate.instant('PROFILE.COMMENT_REPLY_ERROR_GENERIC');
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

    get planBadgeImage(): string | null {
      if (this.profileData && this.profileData.plan?.[0] === '2') {
        return 'assets/images/icon_pro.png';
      }
      if (this.profileData && this.profileData.plan?.[0] === '3') {
        return 'assets/images/icon_vip.png';
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

    getStatusPlanService(){
      this.commentPlansService.getStatus().subscribe({
      next: (status) => {
        this.planStatus = status;
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el estado del plan.';
        this.loading = false;
      }
    });
    }

    toggleLike() {
      const userId = localStorage.getItem('userId');
      if (!userId || !this.profileId) {
        this.likeError = 'Debes iniciar sesion para dar like.';
        return;
      }

      this.likeError = '';

      const wasLiked = this.userReaction === 'like';
      this.ratingsService.toggleLike(this.profileId, userId).subscribe({
        next: (response) => {
          this.userReaction = response?.isLiked ? 'like' : null;
          if (response?.isLiked && !wasLiked) {
            this.likeCount += 1;
          }
          if (!response?.isLiked && wasLiked) {
            this.likeCount = Math.max(0, this.likeCount - 1);
          }
        },
        error: () => {
          // No UI error specified for likes.
        }
      });
    }

    get currentPlanType(): 'free' | 'monthly' | 'annual' {
    const planType = this.planStatus?.planType;
    if (planType === 'monthly' || planType === 'annual') {
      return planType;
    }
    return 'free';
  }

  closePlanModal(): void {
    this.showPlanModal = false;
  }

  onPlanSelected(planType: 'monthly' | 'annual'): void {
    this.showPlanModal = false;
    this.activatePlan(planType);
  }

  activatePlan(planType: 'monthly' | 'annual'): void {
    if (this.actionLoading) {
      return;
    }

    this.actionLoading = true;
    this.commentPlansService.activatePlan(planType).subscribe({
      next: () => {
        this.actionLoading = false;
        this.refreshPlanStatus();
      },
      error: () => {
        this.actionLoading = false;
        this.error = 'No se pudo activar el plan.';
      }
    });
  }

  private refreshPlanStatus(): void {
    this.loadStatus();
    setTimeout(() => this.loadStatus(), 1500);
  }

  loadStatus(): void {
    this.loading = true;
    this.commentPlansService.getStatus().subscribe({
      next: (status) => {
        this.planStatus = status;
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el estado del plan.';
        this.loading = false;
      }
    });
  }

}