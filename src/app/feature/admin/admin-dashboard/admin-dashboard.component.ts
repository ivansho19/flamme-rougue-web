import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { finalize, forkJoin } from 'rxjs';
import { AdminService } from '../../../shared/services/admin/admin.service';
import { TopRojoService } from '../../../shared/services/top-rojo/top-rojo.service';
import { ToastService } from '../../../shared/services/toast/toast.service';

type TopRojoAdminStatusFilter = 'all' | 'pending' | 'active' | 'expired' | 'cancelled';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  activeAdminSection: 'top-rojo' | 'users' | 'announcer' = 'announcer';
  profiles: any[] = [];
  filteredProfiles: any[] = [];
  users: any[] = [];
  kycItems: any[] = [];
  pendingKycItems: any[] = [];
  pendingKycItemsAll: any[] = [];
  topRojoItems: any[] = [];
  topRojoStatusFilter: TopRojoAdminStatusFilter = 'all';
  currentKycTab: 'all' | 'pending' = 'pending';
  loading = false;
  topRojoLoading = false;
  usersLoading = false;
  searchTerm = '';

  confirmOpen = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmCta = '';
  confirmAction: 'delete' | 'verify' | 'activate-top' | 'cancel-top' | 'delete-user' | null = null;
  selectedProfile: any | null = null;
  selectedKyc: any | null = null;
  selectedTopRojo: any | null = null;
  selectedUser: any | null = null;

  totalProfiles = 0;
  activeProfiles = 0;
  pendingKyc = 0;
  popularPlanLabel = '';
  popularPlanPercent = 0;
  totalProfilesCount = 0;
  totalUsersCount = 0;
  pageIndex = 0;
  pageSize = 15;
  usersPageIndex = 0;
  usersPageSize = 10;
  topRojoPageIndex = 0;
  topRojoPageSize = 10;
  topRojoFilteredTotalCount = 0;
  topRojoTotalPages = 0;
  kycTotalCount = 0;
  kycPageIndex = 0;
  kycPageSize = 10;
  private readonly kycAllPageSize = 100;
  private pendingKycLoaded = false;
  private readonly togglingProfileIds = new Set<string>();
  private readonly topRojoUpdatingIds = new Set<string>();
  private topRojoLoaded = false;
  private usersLoaded = false;
  private topRojoSummaryLoaded = false;
  private topRojoSummary = {
    total: 0,
    pending: 0,
    active: 0,
    expired: 0,
    cancelled: 0
  };

  constructor(
    private adminService: AdminService,
    private topRojoService: TopRojoService,
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

  setAdminSection(section: 'top-rojo' | 'users' | 'announcer'): void {
    this.activeAdminSection = section;
    if (section === 'top-rojo' && !this.topRojoLoaded) {
      this.refreshTopRojoData();
    } else if (section === 'top-rojo' && !this.topRojoSummaryLoaded) {
      this.loadTopRojoSummary();
    } else if (section === 'users' && !this.usersLoaded) {
      this.loadUsers();
    }
  }

  refreshTopRojoData(): void {
    this.loadTopRojo();
    this.loadTopRojoSummary();
  }

  loadTopRojo(): void {
    this.topRojoLoading = true;
    const status = this.topRojoStatusFilter === 'all' ? undefined : this.topRojoStatusFilter;
    this.adminService.getAdminTopRojo(
      this.topRojoPageIndex + 1,
      this.topRojoPageSize,
      status,
      false
    ).subscribe({
      next: (response) => {
        const payload = response as any;
        const list = payload?.data ?? payload?.tops ?? payload ?? [];
        this.topRojoItems = Array.isArray(list)
          ? [...list].sort((left, right) => this.getTopRojoStatusOrder(left) - this.getTopRojoStatusOrder(right))
          : [];
        this.topRojoFilteredTotalCount = Number(payload?.total ?? this.topRojoItems.length);
        this.topRojoTotalPages = Number(payload?.totalPages ?? 1);
        this.topRojoLoaded = true;
        this.topRojoLoading = false;
      },
      error: () => {
        this.topRojoLoading = false;
        this.toastService.showToast(
          this.translate.instant('ADMIN_DASHBOARD.TOAST.TOP_ROJO_LOAD_ERROR_TITLE'),
          this.translate.instant('ADMIN_DASHBOARD.TOAST.TOP_ROJO_LOAD_ERROR_MESSAGE'),
          'error',
          4
        );
      }
    });
  }

  loadTopRojoSummary(): void {
    forkJoin({
      all: this.adminService.getAdminTopRojo(1, 1, undefined, false),
      pending: this.adminService.getAdminTopRojo(1, 1, 'pending', false),
      active: this.adminService.getAdminTopRojo(1, 1, 'active', false),
      expired: this.adminService.getAdminTopRojo(1, 1, 'expired', false),
      cancelled: this.adminService.getAdminTopRojo(1, 1, 'cancelled', false)
    }).subscribe({
      next: (response) => {
        this.topRojoSummary = {
          total: Number((response.all as any)?.total ?? 0),
          pending: Number((response.pending as any)?.total ?? 0),
          active: Number((response.active as any)?.total ?? 0),
          expired: Number((response.expired as any)?.total ?? 0),
          cancelled: Number((response.cancelled as any)?.total ?? 0)
        };
        this.topRojoSummaryLoaded = true;
      },
      error: () => {
        this.topRojoSummaryLoaded = false;
      }
    });
  }

  setTopRojoStatusFilter(status: TopRojoAdminStatusFilter): void {
    this.topRojoStatusFilter = status;
    this.topRojoPageIndex = 0;
    this.loadTopRojo();
  }

  onTopRojoPageChange(event: PageEvent): void {
    this.topRojoPageIndex = event.pageIndex;
    this.topRojoPageSize = event.pageSize;
    this.loadTopRojo();
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

  loadUsers(): void {
    this.usersLoading = true;
    this.adminService.getAllUsers(this.usersPageIndex + 1, this.usersPageSize, false).subscribe({
      next: (response) => {
        const list = response?.data ?? response?.users ?? response ?? [];
        this.users = Array.isArray(list) ? list.filter(user => !this.isAdminUser(user)) : [];
        this.totalUsersCount = Number(response?.total ?? this.users.length);
        this.usersLoaded = true;
        this.usersLoading = false;
      },
      error: () => {
        this.usersLoading = false;
        this.toastService.showToast(
          this.translate.instant('ADMIN_DASHBOARD.TOAST.USERS_LOAD_ERROR_TITLE'),
          this.translate.instant('ADMIN_DASHBOARD.TOAST.USERS_LOAD_ERROR_MESSAGE'),
          'error',
          4
        );
      }
    });
  }

  onUsersPageChange(event: PageEvent): void {
    this.usersPageIndex = event.pageIndex;
    this.usersPageSize = event.pageSize;
    this.loadUsers();
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

  openDeleteUserConfirm(user: any): void {
    if (this.isAdminUser(user)) {
      return;
    }

    this.selectedUser = user;
    this.confirmAction = 'delete-user';
    this.confirmTitle = this.translate.instant('ADMIN_DASHBOARD.CONFIRM.DELETE_USER_TITLE');
    this.confirmMessage = this.translate.instant('ADMIN_DASHBOARD.CONFIRM.DELETE_USER_MESSAGE');
    this.confirmCta = this.translate.instant('ADMIN_DASHBOARD.CONFIRM.DELETE_USER_CTA');
    this.confirmOpen = true;
  }

  closeConfirm(): void {
    this.confirmOpen = false;
    this.confirmAction = null;
    this.selectedProfile = null;
    this.selectedKyc = null;
    this.selectedTopRojo = null;
    this.selectedUser = null;
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

    if (this.confirmAction === 'activate-top' && this.selectedTopRojo) {
      this.activateTopRojo(this.selectedTopRojo);
    }

    if (this.confirmAction === 'cancel-top' && this.selectedTopRojo) {
      this.cancelManagedTopRojo(this.selectedTopRojo);
    }

    if (this.confirmAction === 'delete-user' && this.selectedUser) {
      this.deleteUser(this.selectedUser);
    }
  }

  openActivateTopConfirm(topRojo: any): void {
    this.selectedTopRojo = topRojo;
    this.confirmAction = 'activate-top';
    this.confirmTitle = this.translate.instant('ADMIN_DASHBOARD.CONFIRM.ACTIVATE_TOP_TITLE');
    this.confirmMessage = this.translate.instant('ADMIN_DASHBOARD.CONFIRM.ACTIVATE_TOP_MESSAGE');
    this.confirmCta = this.translate.instant('ADMIN_DASHBOARD.CONFIRM.ACTIVATE_TOP_CTA');
    this.confirmOpen = true;
  }

  openCancelTopConfirm(topRojo: any): void {
    this.selectedTopRojo = topRojo;
    this.confirmAction = 'cancel-top';
    this.confirmTitle = this.translate.instant('ADMIN_DASHBOARD.CONFIRM.CANCEL_TOP_TITLE');
    this.confirmMessage = this.translate.instant('ADMIN_DASHBOARD.CONFIRM.CANCEL_TOP_MESSAGE');
    this.confirmCta = this.translate.instant('ADMIN_DASHBOARD.CONFIRM.CANCEL_TOP_CTA');
    this.confirmOpen = true;
  }

  activateTopRojo(topRojo: any): void {
    const topRojoId = this.getTopRojoId(topRojo);
    if (!topRojoId || this.topRojoUpdatingIds.has(topRojoId)) {
      this.closeConfirm();
      return;
    }

    this.topRojoUpdatingIds.add(topRojoId);

    this.adminService.updateAdminTopRojoStatus(topRojoId, 'active')
      .pipe(finalize(() => this.topRojoUpdatingIds.delete(topRojoId)))
      .subscribe({
        next: () => {
          this.closeConfirm();
          this.refreshTopRojoData();
          this.topRojoStatusFilter = 'active';
          this.setTopRojoStatusFilter('active');
          this.toastService.showToast(
            this.translate.instant('ADMIN_DASHBOARD.TOAST.TOP_ROJO_ACTIVATE_SUCCESS_TITLE'),
            this.translate.instant('ADMIN_DASHBOARD.TOAST.TOP_ROJO_ACTIVATE_SUCCESS_MESSAGE'),
            'success',
            4
          );
        },
        error: () => {
          this.closeConfirm();
          this.toastService.showToast(
            this.translate.instant('ADMIN_DASHBOARD.TOAST.TOP_ROJO_ACTIVATE_ERROR_TITLE'),
            this.translate.instant('ADMIN_DASHBOARD.TOAST.TOP_ROJO_ACTIVATE_ERROR_MESSAGE'),
            'error',
            4
          );
        }
      });
  }

  cancelManagedTopRojo(topRojo: any): void {
    const topRojoId = this.getTopRojoId(topRojo);
    if (!topRojoId || this.topRojoUpdatingIds.has(topRojoId)) {
      this.closeConfirm();
      return;
    }

    this.topRojoUpdatingIds.add(topRojoId);

    this.topRojoService.cancelTopRojo(topRojoId)
      .pipe(finalize(() => this.topRojoUpdatingIds.delete(topRojoId)))
      .subscribe({
        next: () => {
          this.closeConfirm();
          this.refreshTopRojoData();
          this.toastService.showToast(
            this.translate.instant('ADMIN_DASHBOARD.TOAST.TOP_ROJO_CANCEL_SUCCESS_TITLE'),
            this.translate.instant('ADMIN_DASHBOARD.TOAST.TOP_ROJO_CANCEL_SUCCESS_MESSAGE'),
            'success',
            4
          );
        },
        error: () => {
          this.closeConfirm();
          this.toastService.showToast(
            this.translate.instant('ADMIN_DASHBOARD.TOAST.TOP_ROJO_CANCEL_ERROR_TITLE'),
            this.translate.instant('ADMIN_DASHBOARD.TOAST.TOP_ROJO_CANCEL_ERROR_MESSAGE'),
            'error',
            4
          );
        }
      });
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

  deleteUser(user: any): void {
    const userId = this.getUserId(user);
    if (!userId || this.isAdminUser(user)) {
      this.closeConfirm();
      return;
    }

    this.adminService.deleteUser(userId).subscribe({
      next: () => {
        this.users = this.users.filter(item => this.getUserId(item) !== userId);
        this.totalUsersCount = Math.max(0, this.totalUsersCount - 1);
        this.closeConfirm();
        this.toastService.showToast(
          this.translate.instant('ADMIN_DASHBOARD.TOAST.USERS_DELETE_SUCCESS_TITLE'),
          this.translate.instant('ADMIN_DASHBOARD.TOAST.USERS_DELETE_SUCCESS_MESSAGE'),
          'success',
          4
        );

        if (!this.users.length && this.totalUsersCount > 0 && this.usersPageIndex > 0) {
          this.usersPageIndex -= 1;
        }

        this.loadUsers();
      },
      error: () => {
        this.closeConfirm();
        this.toastService.showToast(
          this.translate.instant('ADMIN_DASHBOARD.TOAST.USERS_DELETE_ERROR_TITLE'),
          this.translate.instant('ADMIN_DASHBOARD.TOAST.USERS_DELETE_ERROR_MESSAGE'),
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

  goToTopRojoProfile(topRojo: any): void {
    const profileId = topRojo?.profileId || topRojo?.profile?._id || topRojo?.profile?.id;
    if (!profileId) {
      return;
    }

    this.router.navigate(['/profile', profileId]);
  }

  get topRojoTotalCount(): number {
    return this.topRojoSummaryLoaded ? this.topRojoSummary.total : this.topRojoItems.length;
  }

  get topRojoPendingCount(): number {
    return this.topRojoSummaryLoaded
      ? this.topRojoSummary.pending
      : this.topRojoItems.filter(top => this.getTopRojoStatus(top) === 'pending').length;
  }

  get topRojoActiveCount(): number {
    return this.topRojoSummaryLoaded
      ? this.topRojoSummary.active
      : this.topRojoItems.filter(top => this.getTopRojoStatus(top) === 'active').length;
  }

  get topRojoExpiredCount(): number {
    return this.topRojoSummaryLoaded
      ? this.topRojoSummary.expired
      : this.topRojoItems.filter(top => this.getTopRojoStatus(top) === 'expired').length;
  }

  getTopRojoId(topRojo: any): string {
    return topRojo?._id || topRojo?.id || '';
  }

  getTopRojoDisplayName(topRojo: any): string {
    return topRojo?.displayName || topRojo?.title || topRojo?.profile?.displayName || 'TOP ROJO';
  }

  getTopRojoImage(topRojo: any): string {
    return topRojo?.profileImage || topRojo?.images?.[0]?.url || 'assets/images/logo_mini.png';
  }

  getTopRojoLocation(topRojo: any): string {
    const city = topRojo?.city || '-';
    const country = topRojo?.country || '-';
    return `${city}, ${country}`;
  }

  getTopRojoPlanLabel(topRojo: any): string {
    switch (topRojo?.planType) {
      case 'top_7d':
        return 'TOP 7D';
      case 'top_3d':
        return 'TOP 3D';
      case 'top_24h':
        return 'TOP 24H';
      default:
        return '-';
    }
  }

  getTopRojoStatus(topRojo: any): 'active' | 'pending' | 'expired' | 'cancelled' {
    const rawStatus = typeof topRojo?.status === 'string' ? topRojo.status.toLowerCase() : '';

    if (rawStatus === 'pending' || rawStatus === 'active' || rawStatus === 'expired' || rawStatus === 'cancelled') {
      return rawStatus;
    }

    const endDate = topRojo?.endDate ? new Date(topRojo.endDate) : null;
    if (endDate && !Number.isNaN(endDate.getTime()) && endDate.getTime() < Date.now()) {
      return 'expired';
    }

    return 'active';
  }

  getTopRojoStatusLabel(topRojo: any): string {
    const status = this.getTopRojoStatus(topRojo).toUpperCase();
    return this.translate.instant(`ADMIN_DASHBOARD.TOP_ROJO.STATUS.${status}`);
  }

  getTopRojoStatusClass(topRojo: any): string {
    return `top-status-pill ${this.getTopRojoStatus(topRojo)}`;
  }

  getTopRojoViews(topRojo: any): number {
    return Number(topRojo?.views ?? topRojo?.viewCount ?? 0);
  }

  getTopRojoClicks(topRojo: any): number {
    return Number(topRojo?.clicks ?? topRojo?.clickCount ?? 0);
  }

  canActivateTopRojo(topRojo: any): boolean {
    return this.getTopRojoStatus(topRojo) === 'pending';
  }

  canCancelTopRojo(topRojo: any): boolean {
    const status = this.getTopRojoStatus(topRojo);
    return status === 'pending' || status === 'active';
  }

  isTopRojoUpdating(topRojo: any): boolean {
    const topRojoId = this.getTopRojoId(topRojo);
    return !!topRojoId && this.topRojoUpdatingIds.has(topRojoId);
  }

  private getTopRojoStatusOrder(topRojo: any): number {
    switch (this.getTopRojoStatus(topRojo)) {
      case 'pending':
        return 0;
      case 'active':
        return 1;
      case 'expired':
        return 2;
      case 'cancelled':
        return 3;
      default:
        return 4;
    }
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

  getUserId(user: any): string {
    return user?._id || user?.id || '';
  }

  isAdminUser(user: any): boolean {
    return user?.isAdmin === true;
  }

  getUserFullName(user: any): string {
    return [user?.name, user?.lastName].filter(Boolean).join(' ').trim() || '-';
  }

  getUserInitials(user: any): string {
    const fullName = this.getUserFullName(user);
    if (!fullName || fullName === '-') {
      return 'U';
    }

    return fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part.charAt(0).toUpperCase())
      .join('');
  }
}
