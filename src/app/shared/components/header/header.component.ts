import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { Subject, of } from "rxjs";
import { catchError, debounceTime, distinctUntilChanged, map, switchMap, takeUntil, tap } from "rxjs/operators";
import { LogoutConfirmDialogComponent } from "../logout-confirm-dialog/logout-confirm-dialog.component";
import { LoaderService } from "../../services/loader/loader.service";
import { ProfileService } from "../../services/profile/profile.service";
import { TranslateService } from "@ngx-translate/core";
import { MatDialog } from "@angular/material/dialog";
import { GetCountries } from "../../clases/getCountries";
import { GetFlags } from "../../clases/getFlagsOptions";
import { NotificationsService } from "../../services/notifications/notifications.service";
import { AuthSessionService } from "../../services/auth-session/auth-session.service";


@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
})
export class HeaderComponent implements OnInit, OnDestroy {
  dropdownOpen = false;
  mobileMenuOpen = false;
  selectedFlagUrl = 'https://flagcdn.com/gb.svg';
  searchOpen = false;
  searchQuery = '';
  searchResults: Array<{ id: string; name: string; city?: string; imageUrl?: string }> = [];
  searchLoading = false;
  currentLang = 'es';
  adminNotificationCount = 0;
  notificationsOpen = false;
  notificationsLoading = false;
  latestAdminNotification: { title?: string; message?: string; createdAt?: string } | null = null;
  adminNotifications: Array<{ _id?: string; title?: string; message?: string; createdAt?: string; status?: string; type?: string }> = [];
  adminReadHistory: Array<{ _id?: string; title?: string; message?: string; createdAt?: string; status?: string }> = [];
  profileNotificationCount = 0;
  profileNotificationsOpen = false;
  profileNotificationsLoading = false;
  profileNotifications: Array<{ _id?: string; title?: string; message?: string; createdAt?: string; status?: string }> = [];
  profileReadHistory: Array<{ _id?: string; title?: string; message?: string; createdAt?: string; status?: string }> = [];
  private readonly adminNotificationsStatus: 'unread' | 'read' | undefined = undefined;
  private profileNotificationsStatus: 'unread' | 'read' | undefined = 'unread';
  private adminClearedAt: number | null = null;
  private profileClearedAt: number | null = null;
  private search$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  flagOptions = GetFlags.getFlagsOptions();
  constructor(
    private route: Router,
    private eRef: ElementRef,
    private dialog: MatDialog,
    private loaderService: LoaderService,
    private profileService: ProfileService,
    private translate: TranslateService,
    private notificationsService: NotificationsService,
    private authSessionService: AuthSessionService
  ) { }

  ngOnInit(): void {
    const storedLang = localStorage.getItem('app-lang');
    this.currentLang = storedLang || 'es';
    this.translate.setDefaultLang('es');
    this.translate.use(this.currentLang);
    const activeFlag = this.flagOptions.find((flag: { url: string; label: string; lang: string }) => flag.lang === this.currentLang);
    if (activeFlag) {
      this.selectedFlagUrl = activeFlag.url;
    }

    this.search$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => {
          this.searchLoading = true;
        }),
        switchMap((query) => {
          if (query.trim().length < 3) {
            return of([] as Array<{ id: string; name: string; city?: string; imageUrl?: string }>);
          }

          return this.profileService.searchProfiles(query).pipe(
            map((response) => {
              const profiles = response?.profiles ?? response ?? [];
              return profiles.map((profile: any) => ({
                id: profile._id,
                name: profile.displayName,
                city: profile.city,
                imageUrl: profile?.imagesMain?.url
              }));
            }),
            catchError(() => of([]))
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((results) => {
        this.searchResults = results;
        this.searchLoading = false;
      });

    this.notificationsService.connectSocket();
    this.notificationsService
      .onSocketAuthError()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.authSessionService.logout(true));

    if (this.isAdmin()) {
      this.notificationsLoading = true;
      this.notificationsService
        .watchAdminNotifications(this.adminNotificationsStatus)
        .pipe(takeUntil(this.destroy$))
        .subscribe((items) => {
          this.applyAdminNotifications(items);
          this.notificationsLoading = false;
        });
    }

    if (this.isClient()) {
      const profileId = this.getStoredProfileId();
      if (profileId) {
        this.profileNotificationsLoading = true;
        this.notificationsService
          .watchProfileNotifications(profileId, this.profileNotificationsStatus)
          .pipe(takeUntil(this.destroy$))
          .subscribe((items) => {
            this.applyProfileNotifications(items);
            this.profileNotificationsLoading = false;
          });
      }
    }

    this.refreshAdminNotifications();
    this.refreshProfileNotifications();
  }

  private refreshAdminNotifications(): void {
    if (!this.isAdmin()) {
      this.adminNotificationCount = 0;
      this.latestAdminNotification = null;
      return;
    }

    this.notificationsLoading = true;
    this.notificationsService.requestAdminRefresh();
  }

  private refreshProfileNotifications(): void {
    if (!this.isClient()) {
      this.profileNotificationCount = 0;
      this.profileNotifications = [];
      return;
    }

    const profileId = this.getStoredProfileId();
    if (!profileId) {
      this.profileNotificationCount = 0;
      this.profileNotifications = [];
      return;
    }

    this.profileNotificationsLoading = true;
    this.notificationsService.requestProfileRefresh(profileId);
  }

  private applyAdminNotifications(items: Array<{ _id?: string; title?: string; message?: string; createdAt?: string; status?: string; type?: string }>): void {
    const filtered = items.filter((item: any) =>
      item?.type === 'profile_created' || item?.type === 'payment_processed'
    );
    const visible = filtered.filter((item: any) =>
      this.isAfterCleared(item?.createdAt, this.adminClearedAt)
    );
    this.adminNotifications = visible;
    this.adminNotificationCount = visible.length;
    this.latestAdminNotification = visible[0] ?? null;
  }

  private applyProfileNotifications(items: Array<{ _id?: string; title?: string; message?: string; createdAt?: string; status?: string }>): void {
    const visible = items.filter((item: any) =>
      this.isAfterCleared(item?.createdAt, this.profileClearedAt)
    );
    this.profileNotifications = visible;
    if (this.profileNotificationsStatus === 'unread') {
      this.profileNotificationCount = this.profileNotifications.length;
    } else {
      this.profileNotificationCount = visible.length;
    }
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  toggleSearch() {
    this.searchOpen = !this.searchOpen;
    this.mobileMenuOpen = false;
    if (this.searchOpen) {
      setTimeout(() => this.searchInput?.nativeElement?.focus(), 0);
    }
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    this.searchOpen = false;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  onSearchInput(value: any) {
    this.searchQuery = value;
    this.search$.next(value);
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchResults = [];
    this.search$.next('');
    this.searchInput?.nativeElement?.focus();
  }

  selectProfile(profileId: string) {
    this.searchOpen = false;
    this.searchQuery = '';
    this.searchResults = [];
    this.route.navigate(['/profile', profileId]);
  }

  setFlag(flag: { url: string; label: string; lang: string }) {
    this.selectedFlagUrl = flag.url;
    this.dropdownOpen = false;
    this.currentLang = flag.lang;
    localStorage.setItem('app-lang', flag.lang);
    this.translate.use(flag.lang);
  }

  @HostListener('document:click', ['$event'])
  clickout(event: MouseEvent) {
    // Si el click fue fuera de este componente, cierra el dropdown
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.dropdownOpen = false;
      this.searchOpen = false;
      this.mobileMenuOpen = false;
      this.notificationsOpen = false;
      this.profileNotificationsOpen = false;
    }
  }

  getUserName(): string | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  isClient(): boolean {
    const client = localStorage.getItem('client');
    return client ? JSON.parse(client) : false;
  }

  navigateToProfile(){
    const user = localStorage.getItem('user');
    if(user){
      this.route.navigate(['/my-profile']);
    } else {
      this.route.navigate(['/auth/login']);
    }
  }

  navigateToDashboard(){
    return this.route.navigate(['/admin/dashboard']);
  }

  onNotificationsClick(): void {
    if (!this.isAdmin()) {
      return;
    }
    this.notificationsOpen = !this.notificationsOpen;
    if (this.notificationsOpen) {
      this.refreshAdminNotifications();
    }
  }

  onProfileNotificationsClick(): void {
    if (!this.isClient()) {
      return;
    }
    this.profileNotificationsOpen = !this.profileNotificationsOpen;
    if (this.profileNotificationsOpen) {
      this.refreshProfileNotifications();
    }
  }

  goToNotificationsPanel(): void {
    this.notificationsOpen = false;
    this.navigateToDashboard();
  }

  goToProfileNotificationsPanel(): void {
    this.profileNotificationsOpen = false;
    const profileId = this.getStoredProfileId();
    if (profileId) {
      this.route.navigate(['/profile', profileId]);
      return;
    }
    this.navigateToProfile();
  }

  clearNotifications(): void {
    this.adminReadHistory = this.buildReadHistory(this.adminNotifications, this.adminReadHistory);
    this.adminNotifications = [];
    this.latestAdminNotification = null;
    this.adminNotificationCount = 0;
    this.adminClearedAt = Date.now();
  }

  clearProfileNotifications(): void {
    this.profileReadHistory = this.buildReadHistory(this.profileNotifications, this.profileReadHistory);
    this.profileNotifications = [];
    this.profileNotificationCount = 0;
    this.profileClearedAt = Date.now();
    const profileId = this.getStoredProfileId();
    if (!profileId) {
      return;
    }
    this.notificationsService
      .markAllNotificationsRead()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  handleProfileNotificationClick(notification: { _id?: string; status?: string }): void {
    if (this.isNotificationUnread(notification) && notification?._id) {
      this.notificationsService
        .markNotificationsRead([notification._id])
        .pipe(takeUntil(this.destroy$))
        .subscribe();
      notification.status = 'read';
      this.profileNotificationCount = Math.max(0, this.profileNotificationCount - 1);
    }
    this.profileReadHistory = this.buildReadHistory([notification], this.profileReadHistory);
    this.goToProfileNotificationsPanel();
  }

  isNotificationUnread(notification: { status?: string } | null): boolean {
    if (!notification?.status) {
      return true;
    }
    return (notification?.status || '').toLowerCase() === 'unread';
  }

  getRelativeTime(value?: string): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) {
      return this.translate.instant('HEADER.TIME_NOW');
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${this.translate.instant('HEADER.TIME_AGO')} ${minutes}${this.translate.instant('HEADER.TIME_MIN')}`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${this.translate.instant('HEADER.TIME_AGO')} ${hours}${this.translate.instant('HEADER.TIME_HOUR')}`;
    }

    const days = Math.floor(hours / 24);
    return `${this.translate.instant('HEADER.TIME_AGO')} ${days}${this.translate.instant('HEADER.TIME_DAY')}`;
  }

  private isAfterCleared(value?: string, clearedAt?: number | null): boolean {
    if (!clearedAt) {
      return true;
    }
    if (!value) {
      return false;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return false;
    }
    return date.getTime() > clearedAt;
  }

  private getStoredProfileId(): string {
    return localStorage.getItem('profileId') || '';
  }

  get showAdminHistory(): boolean {
    return this.adminNotifications.length > 0 && this.adminReadHistory.length > 0;
  }

  get showProfileHistory(): boolean {
    return this.profileNotifications.length > 0 && this.profileReadHistory.length > 0;
  }

  private buildReadHistory(
    items: Array<{ _id?: string; title?: string; message?: string; createdAt?: string; status?: string }>,
    currentHistory: Array<{ _id?: string; title?: string; message?: string; createdAt?: string; status?: string }>
  ): Array<{ _id?: string; title?: string; message?: string; createdAt?: string; status?: string }> {
    const normalized = items.map(item => ({
      ...item,
      status: 'read'
    }));
    const merged = [...normalized, ...currentHistory];
    const unique = new Map<string, { _id?: string; title?: string; message?: string; createdAt?: string; status?: string }>();
    merged.forEach(item => {
      const key = item?._id || `${item?.title || ''}-${item?.createdAt || ''}`;
      if (!unique.has(key)) {
        unique.set(key, item);
      }
    });
    return Array.from(unique.values())
      .sort((a, b) => {
        const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 4);
  }

  isAdmin(): boolean {
    const isAdmin = localStorage.getItem('isAdmin');
    return isAdmin ? JSON.parse(isAdmin) : false;
  }

  logout() {

    const dialogRef = this.dialog.open(LogoutConfirmDialogComponent, {
      width: '400px',
      panelClass: 'custom-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.authSessionService.logout();
      }
    });
  }

  navigateToHome(){
    this.route.navigate(['/home']);
  }

  openTopRojoModal() {
    // Navigate to dashboard y luego abrir el modal
    this.route.navigate(['/dashboard/my-top-rojo']);
  }

  navigateToCommentPlans() {
    this.route.navigate(['/dashboard/comment-plans']);
  }

  ngOnDestroy(): void {
    // Limpieza opcional si añades listeners manuales (no necesario con HostListener)
    this.destroy$.next();
    this.destroy$.complete();
  }
}