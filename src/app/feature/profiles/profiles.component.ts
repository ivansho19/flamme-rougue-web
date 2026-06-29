import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ProfileService } from '../../shared/services/profile/profile.service';
import { CommentsService, CommentItem } from '../../shared/services/comments/comments.service';
import { RatingsService } from '../../shared/services/ratings/ratings.service';
import { TranslateService } from '@ngx-translate/core';
import { GetPosibilities } from '../../shared/clases/getPosibilityOptions';
import { ProfileDetailFieldsHelper } from '../../shared/clases/profileDetailFields';
import { ProfileContactFieldsHelper } from '../../shared/clases/profileContactFields';
import { IProfileResponse } from './models/IProfile.model';
import EmblaCarousel, { EmblaCarouselType } from 'embla-carousel';
import { CommentPlansService } from '../../shared/services/comment-plans/comment-plans.service';
import { CommentPlanStatus } from '../../shared/models/comment-plans.model';
import { CommentPlanBadgeHelper, CommentPlanBadgeType } from '../../shared/clases/commentPlanBadge';

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
    viewerCommentPlanBadge: CommentPlanBadgeType | null = null;
    loading = false;
    actionLoading = false;
    error = '';
    showPlanModal = false;
    showRulesModal = false;
    status = '' as 'pending' | 'active';
    private embla: EmblaCarouselType | null = null;
    private readonly authorCommentPlanBadges = new Map<string, CommentPlanBadgeType>();
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
        this.loadPublicProfilePage();
      });
      this.loadViewerCommentPlanBadge();
    }

    private loadPublicProfilePage(): void {
      this.getProfile();
      this.loadComments();
      this.loadLikes();
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
      const token = localStorage.getItem('token');
      if (!userId || !token) {
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
      this.authorCommentPlanBadges.clear();
      this.commentsService.getCommentsByProfile(this.profileId).subscribe({
        next: (comments) => {
          this.comments = Array.isArray(comments)
            ? comments.map((comment) => this.normalizeComment(comment))
            : [];
          this.enrichCommentAuthorBadges(this.comments);
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
          this.loadViewerCommentPlanBadge();
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

    get contactFields() {
      return ProfileContactFieldsHelper.build(this.profileData);
    }

    getCommentPlanBadge(comment: CommentItem): CommentPlanBadgeType | null {
      debugger;
      const fromPayload = CommentPlanBadgeHelper.resolve(comment.author ?? comment);
      if (fromPayload) {
        return fromPayload;
      }

      if (comment.authorId) {
        return this.authorCommentPlanBadges.get(comment.authorId) ?? null;
      }

      return null;
    }

    private normalizeComment(raw: any): CommentItem {
      const author = raw?.author ?? {};

      return {
        ...raw,
        author: {
          name: author.name ?? raw.authorName ?? 'Usuario',
          planType: author.planType ?? author.commentPlan?.planType ?? raw.authorPlanType ?? raw.planType,
          status: author.status ?? author.commentPlan?.status ?? raw.authorPlanStatus ?? raw.status,
          badge: author.badge ?? author.commentPlan?.badge ?? raw.authorBadge ?? raw.badge,
          commentPlan: author.commentPlan ?? raw.authorCommentPlan ?? raw.commentPlan ?? null
        }
      };
    }

    private enrichCommentAuthorBadges(comments: CommentItem[]): void {
      const authorIds = [...new Set(
        comments
          .map((comment) => comment.authorId)
          .filter((authorId): authorId is string => !!authorId)
      )];

      const idsToFetch = authorIds.filter((authorId) => {
        const comment = comments.find((item) => item.authorId === authorId);
        return !CommentPlanBadgeHelper.resolve(comment?.author ?? comment);
      });

      if (!idsToFetch.length) {
        return;
      }

      forkJoin(
        idsToFetch.map((authorId) =>
          this.commentPlansService.getStatusByUserId(authorId).pipe(
            catchError(() => of(null)),
            map((status) => ({
              authorId,
              badge: CommentPlanBadgeHelper.resolve(status)
            }))
          )
        )
      ).subscribe((results) => {
        results.forEach(({ authorId, badge }) => {
          if (badge) {
            this.authorCommentPlanBadges.set(authorId, badge);
          }
        });
      });
    }

    get viewerDisplayName(): string {
      const user = localStorage.getItem('user');
      if (!user) {
        return '';
      }
      try {
        const parsed = JSON.parse(user);
        if (typeof parsed === 'string') {
          return parsed;
        }
        return parsed?.name || parsed?.displayName || parsed?.username || '';
      } catch {
        return user;
      }
    }

    get viewerInitial(): string {
      return (this.viewerDisplayName.charAt(0) || 'U').toUpperCase();
    }

    private loadViewerCommentPlanBadge(): void {
      const token = localStorage.getItem('token');
      const client = localStorage.getItem('client');
      const isClient = client ? JSON.parse(client) : false;

      if (!token || isClient) {
        this.viewerCommentPlanBadge = null;
        return;
      }

      this.commentPlansService.getStatus().subscribe({
        next: (status) => {
          this.viewerCommentPlanBadge = CommentPlanBadgeHelper.resolve(status);
        },
        error: () => {
          this.viewerCommentPlanBadge = null;
        }
      });
    }

    get profileDetailFields() {
      return ProfileDetailFieldsHelper.build(this.profileData, {
        years: this.translate.instant('COMMON.YEARS'),
        cm: this.translate.instant('COMMON.CM'),
        kg: this.translate.instant('COMMON.KG')
      });
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

    getServiceIcon(value: string): string {
      return GetPosibilities.getServiceIcon(value);
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
        this.likeError = this.translate.instant('PROFILE.LIKE_ERROR_LOGIN');
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
    this.activatePlan(planType, 'active');
  }

  activatePlan(planType: 'monthly' | 'annual', status: 'pending' | 'active'): void {
    if (this.actionLoading) {
      return;
    }

    this.actionLoading = true;
    this.commentPlansService.activatePlan(planType, status).subscribe({
      next: () => {
        this.actionLoading = false;
        this.redirectDashboard();
        this.refreshPlanStatus();
      },
      error: () => {
        this.actionLoading = false;
        this.error = 'No se pudo activar el plan.';
      }
    });
  }

  redirectDashboard(): void {
    this.router.navigate(['/dashboard/comment-plans']);
  }

  onWhatsAppPayment(data:any): void {
    this.showPlanModal = false;
    const { plan, status } = data;
    this.status = status;
    this.closePlanModal();
    this.activatePlan(plan.id, status);
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