import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { finalize, forkJoin } from 'rxjs';
import { AdminService } from '../../../shared/services/admin/admin.service';
import { ToastService } from '../../../shared/services/toast/toast.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  profiles: any[] = [];
  filteredProfiles: any[] = [];
  kycItems: any[] = [];
  pendingKycItems: any[] = [];
  pendingKycItemsAll: any[] = [];
  currentKycTab: 'all' | 'pending' = 'pending';
  loading = false;
  searchTerm = '';

  confirmOpen = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmCta = '';
  confirmAction: 'delete' | 'verify' | null = null;
  selectedProfile: any | null = null;
  selectedKyc: any | null = null;

  totalProfiles = 0;
  activeProfiles = 0;
  pendingKyc = 0;
  popularPlanLabel = '';
  popularPlanPercent = 0;
  totalProfilesCount = 0;
  pageIndex = 0;
  pageSize = 15;
  kycTotalCount = 0;
  kycPageIndex = 0;
  kycPageSize = 10;
  private readonly kycAllPageSize = 100;
  private pendingKycLoaded = false;
  private readonly togglingProfileIds = new Set<string>();

  constructor(
    private adminService: AdminService,
    private toastService: ToastService,
    private translate: TranslateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initLanguage();
    this.loadProfiles();
    this.loadKyc();
    this.loadAllPendingKyc();
  }

  private initLanguage(): void {
    const storedLang = localStorage.getItem('app-lang');
    const lang = storedLang || 'es';
    this.translate.setDefaultLang('es');
    this.translate.use(lang);
  }

  loadProfiles(): void {
    this.loading = true;
    const name = this.searchTerm.trim();
    this.adminService.getAllProfiles(this.pageIndex + 1, this.pageSize, name || undefined).subscribe({
      next: (response) => {
        const list = response?.profiles ?? response?.data ?? response ?? [];
        this.profiles = Array.isArray(list) ? list : [];
        this.totalProfilesCount = response?.total ?? this.profiles.length;
        this.filteredProfiles = [...this.profiles];
        this.refreshStats();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastService.showToast(
          this.translate.instant('ADMIN_DASHBOARD.TOAST.LOAD_ERROR_TITLE'),
          this.translate.instant('ADMIN_DASHBOARD.TOAST.LOAD_ERROR_MESSAGE'),
          'error',
          4
        );
      }
    });
  }

  applyFilters(): void {
    this.pageIndex = 0;
    this.loadProfiles();
  }

  refreshStats(): void {
    this.totalProfiles = this.totalProfilesCount || this.profiles.length;
    this.activeProfiles = this.profiles.filter(profile => this.isActive(profile)).length;
    this.updateKycStats();
    this.setPopularPlan();
  }

  loadKyc(): void {
    this.adminService.getAllKyc(this.kycPageIndex + 1, this.kycPageSize).subscribe({
      next: (response) => {
        const list = response?.data ?? response?.kyc ?? response ?? [];
        this.kycItems = Array.isArray(list) ? list : [];
        this.kycTotalCount = response?.total ?? this.kycItems.length;
        this.updateKycStats();
      },
      error: () => {
        this.toastService.showToast(
          this.translate.instant('ADMIN_DASHBOARD.TOAST.LOAD_ERROR_TITLE'),
          this.translate.instant('ADMIN_DASHBOARD.TOAST.LOAD_ERROR_MESSAGE'),
          'error',
          4
        );
      }
    });
  }

  private loadAllPendingKyc(): void {
    if (this.pendingKycLoaded) {
      return;
    }

    this.adminService.getAllKyc(1, this.kycAllPageSize).subscribe({
      next: (response) => {
        const firstPageItems = this.normalizeKycItems(response);
        const total = response?.total ?? firstPageItems.length;
        const totalPages = Math.ceil(total / this.kycAllPageSize) || 1;

        if (totalPages <= 1) {
          this.pendingKycItemsAll = firstPageItems.filter(item => !this.isKycVerified(item));
          this.pendingKyc = this.pendingKycItemsAll.length;
          this.pendingKycLoaded = true;
          return;
        }

        const requests = [] as Array<ReturnType<AdminService['getAllKyc']>>;
        for (let page = 2; page <= totalPages; page += 1) {
          requests.push(this.adminService.getAllKyc(page, this.kycAllPageSize));
        }

        forkJoin(requests).subscribe({
          next: (responses) => {
            const allItems = [
              ...firstPageItems,
              ...responses.flatMap(resp => this.normalizeKycItems(resp))
            ];
            this.pendingKycItemsAll = allItems.filter(item => !this.isKycVerified(item));
            this.pendingKyc = this.pendingKycItemsAll.length;
            this.pendingKycLoaded = true;
          },
          error: () => {
            this.toastService.showToast(
              this.translate.instant('ADMIN_DASHBOARD.TOAST.LOAD_ERROR_TITLE'),
              this.translate.instant('ADMIN_DASHBOARD.TOAST.LOAD_ERROR_MESSAGE'),
              'error',
              4
            );
          }
        });
      },
      error: () => {
        this.toastService.showToast(
          this.translate.instant('ADMIN_DASHBOARD.TOAST.LOAD_ERROR_TITLE'),
          this.translate.instant('ADMIN_DASHBOARD.TOAST.LOAD_ERROR_MESSAGE'),
          'error',
          4
        );
      }
    });
  }

  private normalizeKycItems(response: any): any[] {
    const list = response?.data ?? response?.kyc ?? response ?? [];
    return Array.isArray(list) ? list : [];
  }

  private updateKycStats(): void {
    this.pendingKycItems = this.kycItems.filter(item => !this.isKycVerified(item));
    if (!this.pendingKycLoaded) {
      this.pendingKyc = this.pendingKycItems.length;
    }
  }

  setKycTab(tab: 'all' | 'pending'): void {
    this.currentKycTab = tab;
    if (tab === 'pending') {
      this.loadAllPendingKyc();
    }
  }

  get displayedKycItems(): any[] {
    if (this.currentKycTab === 'all') {
      return this.kycItems;
    }
    if (this.pendingKycLoaded) {
      return this.pendingKycItemsAll;
    }
    return this.pendingKycItems;
  }

  setPopularPlan(): void {
    const counts = new Map<number, number>();
    this.profiles.forEach(profile => {
      const level = this.getPlanLevel(profile);
      counts.set(level, (counts.get(level) || 0) + 1);
    });

    let topPlan = 0;
    let topCount = 0;
    counts.forEach((value, key) => {
      if (value > topCount) {
        topCount = value;
        topPlan = key;
      }
    });

    this.popularPlanLabel = this.getPlanLabel(topPlan);
    this.popularPlanPercent = this.totalProfiles
      ? Math.round((topCount / this.totalProfiles) * 100)
      : 0;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadProfiles();
  }

  onKycPageChange(event: PageEvent): void {
    this.kycPageIndex = event.pageIndex;
    this.kycPageSize = event.pageSize;
    this.loadKyc();
  }

  openDeleteConfirm(profile: any): void {
    this.selectedProfile = profile;
    this.confirmAction = 'delete';
    this.confirmTitle = this.translate.instant('ADMIN_DASHBOARD.CONFIRM.DELETE_TITLE');
    this.confirmMessage = this.translate.instant('ADMIN_DASHBOARD.CONFIRM.DELETE_MESSAGE');
    this.confirmCta = this.translate.instant('ADMIN_DASHBOARD.CONFIRM.DELETE_CTA');
    this.confirmOpen = true;
  }

  openVerifyConfirm(kycItem: any): void {
    this.selectedKyc = kycItem;
    this.confirmAction = 'verify';
    this.confirmTitle = this.translate.instant('ADMIN_DASHBOARD.CONFIRM.VERIFY_TITLE');
    this.confirmMessage = this.translate.instant('ADMIN_DASHBOARD.CONFIRM.VERIFY_MESSAGE');
    this.confirmCta = this.translate.instant('ADMIN_DASHBOARD.CONFIRM.VERIFY_CTA');
    this.confirmOpen = true;
  }

  closeConfirm(): void {
    this.confirmOpen = false;
    this.confirmAction = null;
    this.selectedProfile = null;
    this.selectedKyc = null;
  }

  confirmActionExecution(): void {
    if (this.confirmAction === 'delete' && !this.selectedProfile) {
      this.closeConfirm();
      return;
    }

    if (this.confirmAction === 'delete' && this.selectedProfile) {
      this.deleteProfile(this.selectedProfile);
    }

    if (this.confirmAction === 'verify' && this.selectedKyc) {
      this.verifyKyc(this.selectedKyc);
    }
  }

  activateProfile(profile: any): void {
    const profileId = this.getProfileId(profile);
    if (!profileId || this.togglingProfileIds.has(profileId)) {
      return;
    }

    const nextActive = !this.isActive(profile);

    this.togglingProfileIds.add(profileId);

    this.adminService.activateProfile(profileId, nextActive)
      .pipe(finalize(() => this.togglingProfileIds.delete(profileId)))
      .subscribe({
        next: () => {
          profile.isActiveProfile = nextActive;
          this.refreshStats();
          this.toastService.showToast(
            this.translate.instant(
              nextActive
                ? 'ADMIN_DASHBOARD.TOAST.ACTIVATE_SUCCESS_TITLE'
                : 'ADMIN_DASHBOARD.TOAST.DEACTIVATE_SUCCESS_TITLE'
            ),
            this.translate.instant(
              nextActive
                ? 'ADMIN_DASHBOARD.TOAST.ACTIVATE_SUCCESS_MESSAGE'
                : 'ADMIN_DASHBOARD.TOAST.DEACTIVATE_SUCCESS_MESSAGE'
            ),
            'success',
            4
          );
        },
        error: () => {
          this.toastService.showToast(
            this.translate.instant(
              nextActive
                ? 'ADMIN_DASHBOARD.TOAST.ACTIVATE_ERROR_TITLE'
                : 'ADMIN_DASHBOARD.TOAST.DEACTIVATE_ERROR_TITLE'
            ),
            this.translate.instant(
              nextActive
                ? 'ADMIN_DASHBOARD.TOAST.ACTIVATE_ERROR_MESSAGE'
                : 'ADMIN_DASHBOARD.TOAST.DEACTIVATE_ERROR_MESSAGE'
            ),
            'error',
            4
          );
        }
      });
  }

  isProfileToggling(profile: any): boolean {
    const profileId = this.getProfileId(profile);
    return !!profileId && this.togglingProfileIds.has(profileId);
  }

  deleteProfile(profile: any): void {
    const profileId = this.getProfileId(profile);
    if (!profileId) {
      this.closeConfirm();
      return;
    }

    this.adminService.deleteProfile(profileId).subscribe({
      next: () => {
        this.profiles = this.profiles.filter(item => this.getProfileId(item) !== profileId);
        this.applyFilters();
        this.refreshStats();
        this.closeConfirm();
        this.toastService.showToast(
          this.translate.instant('ADMIN_DASHBOARD.TOAST.DELETE_SUCCESS_TITLE'),
          this.translate.instant('ADMIN_DASHBOARD.TOAST.DELETE_SUCCESS_MESSAGE'),
          'success',
          4
        );
      },
      error: () => {
        this.closeConfirm();
        this.toastService.showToast(
          this.translate.instant('ADMIN_DASHBOARD.TOAST.DELETE_ERROR_TITLE'),
          this.translate.instant('ADMIN_DASHBOARD.TOAST.DELETE_ERROR_MESSAGE'),
          'error',
          4
        );
      }
    });
  }

  verifyKyc(kycItem: any): void {
    const kycId = this.getKycId(kycItem);
    if (!kycId) {
      this.closeConfirm();
      this.toastService.showToast(
        this.translate.instant('ADMIN_DASHBOARD.TOAST.VERIFY_MISSING_TITLE'),
        this.translate.instant('ADMIN_DASHBOARD.TOAST.VERIFY_MISSING_MESSAGE'),
        'error',
        4
      );
      return;
    }

    this.adminService.verifyKyc(kycId).subscribe({
      next: () => {
        kycItem.verify = true;
        this.updateKycStats();
        if (this.pendingKycLoaded) {
          this.pendingKycItemsAll = this.pendingKycItemsAll.filter(item => this.getKycId(item) !== kycId);
          this.pendingKyc = this.pendingKycItemsAll.length;
        }
        this.closeConfirm();
        this.toastService.showToast(
          this.translate.instant('ADMIN_DASHBOARD.TOAST.VERIFY_SUCCESS_TITLE'),
          this.translate.instant('ADMIN_DASHBOARD.TOAST.VERIFY_SUCCESS_MESSAGE'),
          'success',
          4
        );
      },
      error: () => {
        this.closeConfirm();
        this.toastService.showToast(
          this.translate.instant('ADMIN_DASHBOARD.TOAST.VERIFY_ERROR_TITLE'),
          this.translate.instant('ADMIN_DASHBOARD.TOAST.VERIFY_ERROR_MESSAGE'),
          'error',
          4
        );
      }
    });
  }

  goToProfile(profile: any): void {
    const profileId = this.getProfileId(profile);
    if (!profileId) {
      return;
    }
    this.router.navigate(['/profile', profileId]);
  }

  getProfileImage(profile: any): string {
    return profile?.imagesMain?.url || 'Perfil';
  }

  getProfileName(profile: any): string {
    return profile?.displayName || profile?.name || profile?.publicName || 'Perfil';
  }

  getProfileEmail(profile: any): string {
    return profile?.email || profile?.userEmail || profile?.contactEmail || '-';
  }

  getProfileId(profile: any): string {
    return profile?._id || profile?.id || profile?.profileId || '';
  }

  getProfileHandle(profile: any): string {
    const id = this.getProfileId(profile);
    return id ? `#${id.slice(-6)}` : '';
  }

  getPlanLevel(profile: any): number {
    const planRaw = profile?.plan ?? profile?.planId ?? profile?.plan?.id ?? profile?.planLevel ?? 0;
    if (Array.isArray(planRaw)) {
      const first = planRaw[0];
      return Number(first) || 0;
    }
    return Number(planRaw) || 0;
  }

  getPlanLabel(level: number): string {
    if (level === 3) {
      return this.translate.instant('PROFILE_FORM.PLAN_VIP');
    }
    if (level === 2) {
      return this.translate.instant('PROFILE_FORM.PLAN_PRO');
    }
    if (level === 1) {
      return this.translate.instant('PROFILE_FORM.PLAN_BASIC');
    }
    return this.translate.instant('ADMIN_DASHBOARD.TABLE.PLAN_NONE');
  }

  getPlanBadgeClass(level: number): string {
    if (level === 3) return 'plan-badge vip';
    if (level === 2) return 'plan-badge pro';
    if (level === 1) return 'plan-badge basic';
    return 'plan-badge';
  }

  isActive(profile: any): boolean {
    return !!profile?.isActiveProfile;
  }

  getStatusLabel(profile: any): string {
    return this.isActive(profile)
      ? this.translate.instant('ADMIN_DASHBOARD.STATUS.ACTIVE')
      : this.translate.instant('ADMIN_DASHBOARD.STATUS.INACTIVE');
  }

  getStatusClass(profile: any): string {
    return this.isActive(profile) ? 'status-pill active' : 'status-pill inactive';
  }

  getKycLabel(profile: any): string {
    const isVerified = !!profile?.isVerify || !!profile?.kyc?.verify || false;
    if (isVerified) {
      return this.translate.instant('ADMIN_DASHBOARD.KYC.VERIFIED');
    }
    const raw = profile?.kycStatus || profile?.kyc?.status || profile?.kyc_state || '';
    const normalized = typeof raw === 'string' ? raw.toLowerCase() : '';
    if (normalized.includes('reject')) {
      return this.translate.instant('ADMIN_DASHBOARD.KYC.REJECTED');
    }
    return this.translate.instant('ADMIN_DASHBOARD.KYC.PENDING');
  }

  getKycClass(profile: any): string {
    const isVerified = !!profile?.isVerify || !!profile?.kyc?.verify || false;
    if (isVerified) return 'kyc-pill verified';
    const raw = profile?.kycStatus || profile?.kyc?.status || profile?.kyc_state || '';
    const normalized = typeof raw === 'string' ? raw.toLowerCase() : '';
    if (normalized.includes('reject')) return 'kyc-pill rejected';
    return 'kyc-pill pending';
  }

  isKycVerified(kycItem: any): boolean {
    const raw = kycItem?.verify;
    if (typeof raw === 'string') {
      return raw.toLowerCase() === 'true';
    }
    return raw === true || raw === 1;
  }

  getKycLabelFromItem(kycItem: any): string {
    return this.isKycVerified(kycItem)
      ? this.translate.instant('ADMIN_DASHBOARD.KYC.VERIFIED')
      : this.translate.instant('ADMIN_DASHBOARD.KYC.PENDING');
  }

  getKycClassFromItem(kycItem: any): string {
    return this.isKycVerified(kycItem) ? 'kyc-pill verified' : 'kyc-pill pending';
  }

  getKycId(kycItem: any): string {
    return kycItem?._id || '';
  }

  getKycDocumentType(kycItem: any): string {
    return kycItem?.documentType || 'DNI';
  }

  getKycDocumentNumber(kycItem: any): string {
    return kycItem?.documentNumber || kycItem?.email || kycItem?.userId || '-';
  }

  getKycUploadedAt(kycItem: any): string {
    return kycItem?.createdAt || '';
  }

  getKycAvatar(kycItem: any): string {
    return kycItem?.documentImage?.[0]?.url || 'assets/images/gift/present.png';
  }
}
