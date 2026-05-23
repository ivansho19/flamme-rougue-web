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
    private translate: TranslateService
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
        // Aquí llamas a tu servicio de logout
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('adult-consent');
        localStorage.removeItem('profileId');
        this.route.navigate(['/auth/login']);
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