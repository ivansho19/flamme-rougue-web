import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom, forkJoin, of } from 'rxjs';
import { IProfileCreateRequest } from '../create-profile/models/IProfileCreate.model';
import { CloudinaryService } from '../../shared/services/cloudinary/cloudinary.service';
import { AuthService } from '../../auth/service/auth.service';
import { ProfileService } from '../../shared/services/profile/profile.service';
import { GetCountries } from '../../shared/clases/getCountries';
import { GetUserName } from '../../shared/clases/getUserName';
import { ProfilePreviewData } from '../../shared/components/profile-preview/profile-preview.component';
import { ToastService } from '../../shared/services/toast/toast.service';
import { PlanOption } from '../../shared/model/planes.model';
import { Country } from '../../shared/model/country.model';
import { ProfileImage } from '../../shared/model/profile.model';
import { getProfileRouterCommands } from '../../shared/clases/profileSlug';
import { GetLenguages } from '../../shared/clases/getLenguagesOptions';
import { GetWeekDays } from '../../shared/clases/getWeekDays';
import { GetPosibilities } from '../../shared/clases/getPosibilityOptions';
import { TranslateService } from '@ngx-translate/core';
import { CitySelectionHelper } from '../../shared/clases/citySelection';
import { PlanImageLimitsHelper } from '../../shared/clases/planImageLimits';
@Component({
  selector: 'app-update-profile',
  templateUrl: './update-profile.component.html',
  styleUrls: ['./update-profile.component.scss']
})
export class UpdateProfileComponent implements OnInit {
  profile: { profileImage: string; galleryImages: string[] } = {
    profileImage: '',
    galleryImages: []
  };

  uploadProgress = 0;
  mainImageFile!: File | null;
  galleryFiles: File[] = [];
  existingMainImage: ProfileImage | null = null;
  existingGalleryImages: ProfileImage[] = [];
  loading = false;
  profileId: string = '';
  userId: string = '';
  clientData: any;
  profileForm!: FormGroup;
  calculatedAge: number | null = null;
  isPremium = false;
  existingAvailability: string[] = [];
  selectedPlanId: number | null = null;
  selectedPlan: PlanOption | null = null;
  showPlanModal = false;
  countries: Country[] = [];
  cities: string[] = [];
  languageOptions: any[] = [];
  posibilityOptions: any[] = [];
  weekDays: any[] = [];
  isDraggingMain = false;
  isDraggingGallery = false;
  isProfileInactive = false;
  isActiveProfile = true;
  paymentCompleted = false;
  pendingWhatsAppPayment = false;
  planExpiresAt: string | Date | null = null;
  @ViewChild('mainInput') mainInput!: ElementRef<HTMLInputElement>;
  @ViewChild('galleryInput') galleryInput!: ElementRef<HTMLInputElement>;

  constructor(
    private cloudinaryService: CloudinaryService,
    private fb: FormBuilder,
    private authService: AuthService,
    private profileService: ProfileService,
    private toastService: ToastService,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.initForm();
    this.countries = GetCountries.getAllCountries();
    this.languageOptions = GetLenguages.getLenguajesOptions();
    this.posibilityOptions = GetPosibilities.GetPosibilityOptions();
    this.weekDays = GetWeekDays.GetWeekDaysOptions();
    this.loadClientFromEmail();

    const storedProfileId = localStorage.getItem('profileId');
    if (storedProfileId) {
      this.profileId = storedProfileId;
      this.getProfile(storedProfileId);
      return;
    }

    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      this.userId = storedUserId;
      this.getProfileByUser(storedUserId);
    }
  }

  openMainFileSelector() {
    this.mainInput.nativeElement.click();
  }

  openGalleryFileSelector() {
    this.galleryInput.nativeElement.click();
  }

  onDragOverMain(event: DragEvent) {
    event.preventDefault();
    this.isDraggingMain = true;
  }

  onDragOverGallery(event: DragEvent) {
    event.preventDefault();
    this.isDraggingGallery = true;
  }

  onMainImageSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.mainImageFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.profile.profileImage = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  onGallerySelected(event: any) {
    const files: FileList = event.target.files;

    Array.from(files).forEach(file => {
      this.galleryFiles.push(file);

      const reader = new FileReader();
      reader.onload = () => {
        this.profile.galleryImages.push(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  }

  removeGalleryImage(index: number) {
    const existingCount = this.existingGalleryImages.length;

    if (index < existingCount) {
      this.existingGalleryImages.splice(index, 1);
    } else {
      const newIndex = index - existingCount;
      if (newIndex >= 0) {
        this.galleryFiles.splice(newIndex, 1);
      }
    }

    this.profile.galleryImages.splice(index, 1);
  }

  onDragLeaveMain() {
    this.isDraggingMain = false;
  }

  onDropMain(event: DragEvent) {
    event.preventDefault();
    this.isDraggingMain = false;

    if (event.dataTransfer?.files.length) {
      const file = event.dataTransfer.files[0];
      this.mainImageFile = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.profile.profileImage = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onDragLeaveGallery() {
    this.isDraggingGallery = false;
  }

  onDropGallery(event: DragEvent) {
    event.preventDefault();
    this.isDraggingGallery = false;

    if (event.dataTransfer?.files.length) {
      Array.from(event.dataTransfer.files).forEach(file => {
        this.galleryFiles.push(file);

        const reader = new FileReader();
        reader.onload = () => {
          this.profile.galleryImages.push(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  initForm() {
    this.profileForm = this.fb.group({
      basicInfo: this.fb.group({
        publicName: ['', Validators.required],
        email: ['', [Validators.email]],
        description: ['', Validators.required],
        country: ['', Validators.required],
        city: ['', Validators.required],
        customCity: [''],
        zone: ['', Validators.required],
        phone: ['', Validators.required],
        blockedCountries: [[]],
        availabilitySlots: this.fb.array([])
      }),

      personalData: this.fb.group({
        gender: ['', Validators.required],
        birthDate: [null, [this.minAgeValidator(18)]],
        age: [null, [Validators.required, Validators.min(18)]],
        nationality: ['', Validators.required],
        height: [null, Validators.required],
        hairColor: ['', Validators.required],
        eyeColor: ['', Validators.required],
        weight: [null, Validators.required],
        languages: [[], Validators.required]
      }),
      posibilities: [[]]
    });

    this.profileForm
      .get('personalData.birthDate')
      ?.valueChanges.subscribe(value => this.updateAgeFromBirthDate(value));

    this.profileForm
      .get('basicInfo.city')
      ?.valueChanges.subscribe(value => this.syncCustomCityValidators(value));

    this.addAvailabilitySlot();
  }

  loadClientFromEmail() {
    const email = localStorage.getItem('userEmail');
    if (!email) {
      return;
    }

    this.authService.getClientByEmail(email).subscribe({
      next: (response) => {
        const client = response?.client ?? response;
        if (!client) {
          return;
        }
        this.applyClientToForm(client);
        if (!this.userId) {
          this.userId = client._id;
        }
      },
      error: (error) => {
        console.error('Error cargando cliente:', error);
      }
    });
  }

  goToPublishedProfile(): void {
    if (this.isProfileInactive) {
      return;
    }
    const targetProfileId = this.profileId || localStorage.getItem('profileId') || '';
    if (!targetProfileId) {
      this.toastService.showToast('Error', 'Perfil no encontrado', 'error', 4);
      return;
    }

    const publicName = this.profileForm?.get('basicInfo.publicName')?.value || '';
    this.router.navigate(getProfileRouterCommands({
      displayName: publicName,
      _id: targetProfileId
    }));
  }

  private getProfileByUser(userId: string) {
    this.profileService.getProfileByUser(userId).subscribe({
      next: (response) => {
        this.updateInactiveState(response);
        const profile = response?.profile ?? response ?? null;
        if (!profile?._id) {
          this.toastService.showToast('Perfil no encontrado', 'Crea tu perfil primero', 'error', 4);
          return;
        }

        this.profileId = profile._id;
        localStorage.setItem('profileId', this.profileId);
        this.applyProfileToForm(profile);
      },
      error: (error) => {
        console.error('Error cargando perfil:', error);
      }
    });
  }

  private applyClientToForm(client: any) {
    this.clientData = client;
    const countryValue = this.setCitiesForCountry(client.country);
    const currentBasicInfo = this.profileForm.get('basicInfo')?.value || {};
    const predefinedCities = this.cities.filter(city => !CitySelectionHelper.isOtherSelected(city));
    const storedCity = currentBasicInfo.city || client.city || '';
    const cityFields = CitySelectionHelper.resolveSelectionFromStored(storedCity, predefinedCities);

    this.profileForm.patchValue({
      basicInfo: {
        publicName: currentBasicInfo.publicName || client.name || '',
        email: currentBasicInfo.email || client.email || '',
        country: currentBasicInfo.country || countryValue || '',
        city: cityFields.city,
        customCity: cityFields.customCity,
        zone: currentBasicInfo.zone || client.zone || '',
        phone: currentBasicInfo.phone || client.phone || '',
        blockedCountries: Array.isArray(currentBasicInfo.blockedCountries)
          ? currentBasicInfo.blockedCountries
          : Array.isArray(client.blockedCountries)
            ? client.blockedCountries
            : []
      }
    });
    this.syncCustomCityValidators(cityFields.city);
  }

  private setCitiesForCountry(value?: string | null): string {
    if (!value) {
      this.cities = [];
      return '';
    }

    const found = this.countries.find(country =>
      country.code === value || country.name === value
    );

    this.cities = CitySelectionHelper.withOtherOption(found ? found.cities : []);
    return found?.code ?? value;
  }

  onCountryChange(value: string) {
    this.setCitiesForCountry(value);
    this.profileForm.get('basicInfo.city')?.setValue('');
    this.profileForm.get('basicInfo.customCity')?.setValue('');
  }

  isCityOtherOption(city: string): boolean {
    return CitySelectionHelper.isOtherSelected(city);
  }

  get showCustomCityInput(): boolean {
    return CitySelectionHelper.isOtherSelected(
      this.profileForm?.get('basicInfo.city')?.value
    );
  }

  private syncCustomCityValidators(city: string | null | undefined): void {
    const customCityCtrl = this.profileForm.get('basicInfo.customCity');
    if (!customCityCtrl) {
      return;
    }

    if (CitySelectionHelper.isOtherSelected(city)) {
      customCityCtrl.setValidators([Validators.required]);
    } else {
      customCityCtrl.clearValidators();
      customCityCtrl.setValue('', { emitEvent: false });
    }
    customCityCtrl.updateValueAndValidity({ emitEvent: false });
  }

  private getResolvedCity(): string {
    const basicInfo = this.profileForm.get('basicInfo')?.value || {};
    return CitySelectionHelper.resolveCityForPayload(basicInfo.city, basicInfo.customCity);
  }

  private getProfile(id: string) {
    if (!id || id === 'null') {
      this.router.navigate(['/create-profile']);
      return;
    }

    this.profileService.getProfileById(id).subscribe({
      next: (response) => {
        this.updateInactiveState(response);
        const profile = response?.profile ?? response ?? null;
        if (!profile) {
          return;
        }

        this.profileId = profile._id || this.profileId;
        if (this.profileId) {
          localStorage.setItem('profileId', this.profileId);
        }
        this.applyProfileToForm(profile);
      },
      error: (error) => {
        console.error('Error cargando perfil:', error);
      }
    });
  }

  private applyProfileToForm(profile: any) {
    this.setSelectedPlan(profile);
    const availabilitySource = Array.isArray(profile.availability)
      ? profile.availability
      : profile.availability || profile.availabity || [];
    const availabilitySlots = this.parseAvailabilitySlots(availabilitySource);
    this.existingAvailability = Array.isArray(availabilitySource)
      ? availabilitySource
      : typeof availabilitySource === 'string'
        ? availabilitySource.split(',').map((item: string) => item.trim()).filter(Boolean)
        : [];

    const languagesValue = Array.isArray(profile.languages)
      ? profile.languages
      : profile.language || [];
    const posibilitiesValue = Array.isArray(profile.posibilities)
      ? profile.posibilities
      : (profile as any)?.possibilities || [];

    const resolvedCountry = profile.country || '';
    const countryValue = this.setCitiesForCountry(resolvedCountry || this.clientData?.country);
    const predefinedCities = this.cities.filter(city => !CitySelectionHelper.isOtherSelected(city));
    const cityFields = CitySelectionHelper.resolveSelectionFromStored(profile.city, predefinedCities);

    this.profileForm.patchValue({
      basicInfo: {
        publicName: profile.displayName || '',
        description: profile.bio || '',
        country: countryValue || '',
        city: cityFields.city,
        customCity: cityFields.customCity,
        zone: profile.zone || '',
        phone: profile.phone || '',
        blockedCountries: Array.isArray(profile.blockedCountries) ? profile.blockedCountries : []
      },
      personalData: {
        gender: profile.gender || '',
        birthDate: profile.birthDate || profile.birthday || null,
        age: profile.age ?? null,
        nationality: profile.nationality || '',
        height: profile.height ?? null,
        hairColor: profile.hairColor || profile.haircolor || '',
        eyeColor: profile.eyeColor || profile.eyecolor || '',
        weight: profile.weight ?? null,
        languages: languagesValue
      },
      posibilities: posibilitiesValue
    });
    this.syncCustomCityValidators(cityFields.city);

    this.availabilitySlots.clear();
    if (availabilitySlots.length) {
      availabilitySlots.forEach(slot => {
        this.availabilitySlots.push(this.fb.group({
          day: [slot.day, Validators.required],
          start: [slot.start, Validators.required],
          end: [slot.end, Validators.required]
        }));
      });
    } else {
      this.addAvailabilitySlot();
    }

    this.calculatedAge = profile.age ?? null;
    this.isPremium = !!profile.isPremium;

    this.existingMainImage = profile.imagesMain || null;
    this.existingGalleryImages = profile.imagesGallery || [];
    this.profile.profileImage = profile.imagesMain?.url || '';
    this.profile.galleryImages = (profile.imagesGallery || []).map((img: ProfileImage) => img.url);
    this.planExpiresAt = profile.planExpiresAt ?? null;
    this.isActiveProfile = profile.isActiveProfile !== undefined
      ? !!profile.isActiveProfile
      : !this.isProfileInactive;
    this.maybeShowPlanExpiryWarning();
  }

  private setSelectedPlan(profile: any): void {
    let rawPlan = profile?.plan ?? profile?.planId ?? profile?.plan?.id ?? null;
    if (Array.isArray(rawPlan)) {
      rawPlan = rawPlan[0] ?? null;
    }
    if (rawPlan === null || rawPlan === undefined) {
      return;
    }

    const normalized = typeof rawPlan === 'string' ? Number(rawPlan) : Number(rawPlan);
    this.selectedPlanId = Number.isNaN(normalized) ? null : normalized;
  }

  private updateInactiveState(response: any): void {
    const warning = response?.warning ?? response?.profile?.warning ?? '';
    const normalized = typeof warning === 'string' ? warning.toLowerCase() : '';
    this.isProfileInactive = normalized.includes('perfil inactivo');
  }

  private resolveIsActiveProfileForUpdate(): boolean {
    if (this.pendingWhatsAppPayment) {
      return false;
    }
    if (this.paymentCompleted) {
      return true;
    }
    return this.isActiveProfile;
  }

  planSelected(plan: PlanOption) {
    this.selectedPlanId = plan.id;
    this.selectedPlan = plan;
  }

  handlePlanSelectionFromModal(plan: PlanOption): void {
    this.selectedPlanId = plan.id;
    this.selectedPlan = plan;
    this.paymentCompleted = true;
    this.pendingWhatsAppPayment = false;
    this.showPlanModal = false;
    this.updatePlan();
  }

  updatePlan() {
    if (!this.canUpdateExpiredPlan) {
      return;
    }
    if (!this.enforcePlanImageLimit()) {
      return;
    }
    if (!this.selectedPlanId) {
      this.toastService.showToast('Selecciona un plan', 'Debes elegir un plan para actualizar', 'error', 4);
      return;
    }

    this.updateProfile(true);
  }

  openPlanModal(): void {
    if (!this.canUpdateExpiredPlan) {
      return;
    }
    this.showPlanModal = true;
  }

  closePlanModal(): void {
    this.showPlanModal = false;
  }

  get canSave(): boolean {
    return !!this.profileForm
      && this.profileForm.valid
      && !this.loading
      && this.hasAvailability
      && this.isPlanValidForImages;
  }

  get totalProfileImages(): number {
    const hasMain = !!(this.profile.profileImage || this.existingMainImage);
    return PlanImageLimitsHelper.countProfileImages(hasMain, this.profile.galleryImages.length);
  }

  get planImageValidation() {
    return PlanImageLimitsHelper.validate(this.selectedPlanId, this.totalProfileImages);
  }

  get isPlanValidForImages(): boolean {
    return this.planImageValidation.isValid;
  }

  get showPlanImageLimitWarning(): boolean {
    return PlanImageLimitsHelper.hasSelectedPlanImageConflict(
      this.selectedPlanId,
      this.totalProfileImages
    );
  }

  get exceedsMaxPlanImages(): boolean {
    return this.totalProfileImages > (PlanImageLimitsHelper.getPlanLimit(3) ?? 30);
  }

  get selectedPlanImageLimit(): number | null {
    return PlanImageLimitsHelper.getPlanLimit(this.selectedPlanId);
  }

  get planImageLimitMessage(): string {
    const validation = this.planImageValidation;
    if (validation.isValid || validation.totalImages === 0) {
      return '';
    }

    if (this.exceedsMaxPlanImages) {
      const max = PlanImageLimitsHelper.getPlanLimit(3) ?? 30;
      return this.translate.instant('PROFILE_FORM.PLAN_IMAGE_LIMIT_EXCEEDED_MAX', {
        count: validation.totalImages,
        max,
        extra: validation.totalImages - max
      });
    }

    return this.translate.instant('PROFILE_FORM.PLAN_IMAGE_LIMIT_WARNING', {
      count: validation.totalImages,
      limit: validation.selectedPlanLimit ?? 0,
      plan: this.translate.instant(validation.requiredPlanKey || 'PROFILE_FORM.PLAN_VIP'),
      requiredLimit: validation.requiredPlanLimit ?? 0
    });
  }

  private enforcePlanImageLimit(): boolean {
    if (!PlanImageLimitsHelper.hasSelectedPlanImageConflict(
      this.selectedPlanId,
      this.totalProfileImages
    )) {
      return true;
    }

    this.toastService.showToast(
      this.translate.instant('PROFILE_FORM.PLAN_IMAGE_LIMIT_TOAST_TITLE'),
      this.planImageLimitMessage,
      'error',
      7
    );
    this.showPlanModal = true;
    return false;
  }

  get hasAvailability(): boolean {
    return this.formatAvailabilityList(this.availabilitySlots.value || []).length > 0
      || this.existingAvailability.length > 0;
  }

  get previewProfile(): ProfilePreviewData | null {
    if (!this.profileForm) {
      return null;
    }

    const basicInfo = this.profileForm.get('basicInfo')?.value || {};
    const personalData = this.profileForm.get('personalData')?.value || {};
    const availabilityText = this.formatAvailability(this.availabilitySlots.value || []);
    const languageValues = personalData.languages ?? [];
    const languagesText = Array.isArray(languageValues)
      ? languageValues.join(', ')
      : languageValues;
    const posibilitiesValue = this.profileForm.get('posibilities')?.value ?? [];
    const posibilitiesList = Array.isArray(posibilitiesValue)
      ? posibilitiesValue
      : typeof posibilitiesValue === 'string'
        ? posibilitiesValue.split(',').map((item: string) => item.trim()).filter(Boolean)
        : [];

    return {
      name: basicInfo.publicName || 'Perfil',
      subtitleLabel: 'Ciudad',
      subtitleValue: this.getResolvedCity(),
      phone: basicInfo.phone || '',
      availability: availabilityText,
      bio: basicInfo.description || '',
      gender: personalData.gender || '',
      hairColor: personalData.hairColor || '',
      age: personalData.age,
      eyeColor: personalData.eyeColor || '',
      nationality: personalData.nationality || '',
      languages: languagesText || '',
      height: personalData.height,
      weight: personalData.weight,
      isGold: false,
      isVerified: true,
      profileImage: this.profile.profileImage,
      galleryImages: this.profile.galleryImages,
      posibilities: posibilitiesList
    };
  }

  get currentPlanKey(): string | null {
    if (this.selectedPlanId === 1) {
      return 'PROFILE_FORM.PLAN_BASIC';
    }
    if (this.selectedPlanId === 2) {
      return 'PROFILE_FORM.PLAN_PRO';
    }
    if (this.selectedPlanId === 3) {
      return 'PROFILE_FORM.PLAN_VIP';
    }
    return null;
  }

  get currentPlanBadgeImage(): string | null {
    if (this.selectedPlanId === 2) {
      return 'assets/images/icon_pro.png';
    }
    if (this.selectedPlanId === 3) {
      return 'assets/images/icon_vip.png';
    }
    return null;
  }

  get planDaysRemaining(): number | null {
    return this.getDaysUntilPlanExpiration(this.planExpiresAt);
  }

  get showPlanExpiration(): boolean {
    return this.planDaysRemaining !== null
      && this.selectedPlanId !== null
      && this.selectedPlanId !== 1;
  }

  get planExpirationTranslationKey(): string | null {
    const days = this.planDaysRemaining;
    if (days === null) {
      return null;
    }
    if (days < 0) {
      return 'PROFILE_FORM.PLAN_EXPIRED';
    }
    if (days === 0) {
      return 'PROFILE_FORM.PLAN_EXPIRES_TODAY';
    }
    if (days === 1) {
      return 'PROFILE_FORM.PLAN_EXPIRES_ONE_DAY';
    }
    return 'PROFILE_FORM.PLAN_EXPIRES_IN_DAYS';
  }

  get isPlanExpiryUrgent(): boolean {
    const days = this.planDaysRemaining;
    return days !== null && days >= 0 && days <= 3;
  }

  get isPlanExpired(): boolean {
    const days = this.planDaysRemaining;
    return days !== null && days < 0;
  }

  get canUpdateExpiredPlan(): boolean {
    return !this.isProfileInactive || this.isPlanExpired;
  }

  private getDaysUntilPlanExpiration(expiresAt: string | Date | null): number | null {
    if (!expiresAt) {
      return null;
    }

    const expiration = new Date(expiresAt);
    if (Number.isNaN(expiration.getTime())) {
      return null;
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfExpiry = new Date(
      expiration.getFullYear(),
      expiration.getMonth(),
      expiration.getDate()
    );
    const diffMs = startOfExpiry.getTime() - startOfToday.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  private maybeShowPlanExpiryWarning(): void {
    const days = this.planDaysRemaining;
    if (days === null || days > 3 || days < 0) {
      return;
    }

    if (!this.selectedPlanId || this.selectedPlanId === 1 || !this.planExpiresAt) {
      return;
    }

    const storageKey = `plan-expiry-warn-${this.profileId}-${new Date(this.planExpiresAt).toISOString()}`;
    if (sessionStorage.getItem(storageKey)) {
      return;
    }

    sessionStorage.setItem(storageKey, '1');

    let messageKey = 'PROFILE_FORM.PLAN_RENEW_TOAST_MESSAGE_DAYS';
    if (days === 0) {
      messageKey = 'PROFILE_FORM.PLAN_RENEW_TOAST_MESSAGE_TODAY';
    } else if (days === 1) {
      messageKey = 'PROFILE_FORM.PLAN_RENEW_TOAST_MESSAGE_ONE';
    }

    const title = this.translate.instant('PROFILE_FORM.PLAN_RENEW_TOAST_TITLE');
    const message = this.translate.instant(messageKey, { days });
    this.toastService.showToast(title, message, 'error', 6);
  }

  isInvalid(controlPath: string): boolean {
    const control = this.profileForm.get(controlPath);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  get availabilitySlots(): FormArray {
    return this.profileForm.get('basicInfo.availabilitySlots') as FormArray;
  }

  addAvailabilitySlot() {
    const group = this.fb.group({
      day: ['', Validators.required],
      start: ['', Validators.required],
      end: ['', Validators.required]
    });
    this.availabilitySlots.push(group);
  }

  removeAvailabilitySlot(index: number) {
    this.availabilitySlots.removeAt(index);
  }

  isAvailabilityInvalid(): boolean {
    if (this.hasAvailability) {
      return false;
    }
    const control = this.profileForm.get('basicInfo.availabilitySlots');
    return !!(control && (control.touched || control.dirty));
  }

  onLanguagesChange(event: any): void {
    const values = event.value ?? [];
    this.profileForm.get('personalData.languages')?.setValue(values);
    this.profileForm.get('personalData.languages')?.markAsDirty();
    this.profileForm.get('personalData.languages')?.markAsTouched();
  }

  onPosibilitiesChange(event: any): void {
    const values = event.value ?? [];
    this.profileForm.get('posibilities')?.setValue(values);
    this.profileForm.get('posibilities')?.markAsDirty();
    this.profileForm.get('posibilities')?.markAsTouched();
  }

  private updateAgeFromBirthDate(value: unknown): void {
    const age = this.calculateAge(value);
    this.calculatedAge = age;
    this.profileForm.get('personalData.age')?.setValue(age);
    this.profileForm.get('personalData.age')?.markAsDirty();
  }

  private calculateAge(value: unknown): number | null {
    if (!value) {
      return null;
    }

    const date = value instanceof Date ? value : new Date(value as string);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      age -= 1;
    }

    return age;
  }

  private minAgeValidator(minAge: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      const age = this.calculateAge(control.value);
      if (age === null) {
        return null;
      }

      return age < minAge ? { minAge: { requiredAge: minAge, actualAge: age } } : null;
    };
  }

  private minArrayLengthValidator(minLength: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control instanceof FormArray) {
        return control.length >= minLength ? null : { minLength: true };
      }
      return null;
    };
  }

  private formatAvailability(slots: Array<{ day: string; start: string; end: string }>): string {
    return this.formatAvailabilityList(slots).join(', ');
  }

  private formatAvailabilityList(slots: Array<{ day: string; start: string; end: string }>): string[] {
    return slots
      .filter(slot => slot?.day && slot?.start && slot?.end)
      .map(slot => `${slot.day} ${slot.start}-${slot.end}`);
  }

  private parseAvailabilitySlots(value: string[] | string): Array<{ day: string; start: string; end: string }> {
    const items = Array.isArray(value)
      ? value
      : typeof value === 'string'
        ? value.split(',').map(item => item.trim()).filter(Boolean)
        : [];

    return items
      .map(item => {
        const [dayPart, timePart] = item.split(' ');
        if (!dayPart || !timePart || !timePart.includes('-')) {
          return null;
        }
        const [start, end] = timePart.split('-');
        if (!start || !end) {
          return null;
        }
        return { day: dayPart, start, end };
      })
      .filter((slot): slot is { day: string; start: string; end: string } => !!slot);
  }

  private getUploadFolder(userId: string): string {
    const rawName = this.clientData?.name || new GetUserName().getUserName() || 'user';
    const safeName = this.slugifyName(rawName);
    const idPart = userId || 'unknown';
    return `users/${safeName}-${idPart}`;
  }

  private slugifyName(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'user';
  }

  async updateProfile(planUpdated: boolean = false) {
    if (this.isProfileInactive && !(planUpdated && this.isPlanExpired)) {
      return;
    }
    if (!this.enforcePlanImageLimit()) {
      return;
    }
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.toastService.showToast('Formulario incompleto', 'Completa los campos obligatorios', 'error', 4);
      return;
    }

    const lookupId = this.profileId || this.userId;
    if (!lookupId) {
      this.toastService.showToast('Perfil no identificado', 'Inicia sesion nuevamente', 'error', 4);
      return;
    }

    try {
      this.loading = true;

      const uploadFolder = this.getUploadFolder(this.userId || lookupId);

      let mainImageUpload$: any = of(null);
      if (this.mainImageFile) {
        mainImageUpload$ = this.cloudinaryService.uploadImage(this.mainImageFile, uploadFolder);
      }

      let galleryUpload$: any = of([]);
      if (this.galleryFiles.length > 0) {
        const uploadsArray$ = this.galleryFiles.map(file =>
          this.cloudinaryService.uploadImage(file, uploadFolder)
        );
        galleryUpload$ = forkJoin(uploadsArray$);
      }

      const [mainResult, galleryResults]: any = await firstValueFrom(
        forkJoin([mainImageUpload$, galleryUpload$])
      );

      const mainImage = mainResult?.secure_url && mainResult?.public_id
        ? { url: mainResult.secure_url, public_id: mainResult.public_id }
        : this.existingMainImage || undefined;

      const newGalleryImages = galleryResults.length
        ? galleryResults
          .filter((res: any) => res?.secure_url && res?.public_id)
          .map((res: any) => ({ url: res.secure_url, public_id: res.public_id }))
        : [];

      const galleryImages = [...this.existingGalleryImages, ...newGalleryImages];

      const basicInfo = this.profileForm.get('basicInfo')?.value || {};
      const personalData = this.profileForm.get('personalData')?.value || {};
      const objectId = this.clientData?._id || this.userId;

      const availabilityList = this.formatAvailabilityList(this.availabilitySlots.value || [])
        .filter(Boolean);
      const finalAvailability = availabilityList.length > 0
        ? availabilityList
        : this.existingAvailability;

      if (!finalAvailability.length) {
        this.toastService.showToast('Falta disponibilidad', 'Agrega al menos un horario', 'error', 4);
        this.loading = false;
        return;
      }

      const languagesValue = this.profileForm.get('personalData.languages')?.value ?? [];
      const languagesList = Array.isArray(languagesValue)
        ? languagesValue.map((item: string) => item.trim()).filter(Boolean)
        : typeof languagesValue === 'string'
          ? languagesValue.split(',').map((item: string) => item.trim()).filter(Boolean)
          : [];

      const posibilitiesValue = this.profileForm.get('posibilities')?.value ?? [];
      const posibilitiesList = Array.isArray(posibilitiesValue)
        ? posibilitiesValue.map((item: string) => item.trim()).filter(Boolean)
        : typeof posibilitiesValue === 'string'
          ? posibilitiesValue.split(',').map((item: string) => item.trim()).filter(Boolean)
          : [];

      const blockedCountriesValue = basicInfo.blockedCountries ?? [];
      const blockedCountriesList = Array.isArray(blockedCountriesValue)
        ? blockedCountriesValue.map((item: string) => item.trim()).filter(Boolean)
        : [];

      const profilePayload: IProfileCreateRequest = {
        objectId,
        displayName: basicInfo.publicName || '',
        bio: basicInfo.description || '',
        phone: basicInfo.phone || '',
        country: basicInfo.country || '',
        city: this.getResolvedCity(),
        zone: basicInfo.zone || '',
        availability: finalAvailability,
        gender: personalData.gender || '',
        birthDate: personalData.birthDate || null,
        age: personalData.age,
        nationality: personalData.nationality || '',
        height: personalData.height,
        weight: personalData.weight,
        hairColor: personalData.hairColor || '',
        eyeColor: personalData.eyeColor || '',
        languages: languagesList,
        posibilities: posibilitiesList,
        blockedCountries: blockedCountriesList || [],
        plan: this.selectedPlanId ? [this.selectedPlanId.toString()] : [],
        imagesMain: mainImage,
        imagesGallery: galleryImages,
        orientation: personalData.orientation || '',
        isActiveProfile: this.resolveIsActiveProfileForUpdate()
      };

      this.profileService.updateProfile(lookupId, profilePayload).subscribe({
        next: () => {
          this.loading = false;
          if (planUpdated) {
            this.toastService.showToast('Plan actualizado', '¡El plan se actualizo correctamente!', 'success', 8);
            setTimeout(() => {
              window.location.reload();
            }, 3000);
          } else {
            this.toastService.showToast('Perfil actualizado', '¡Los cambios se guardaron con exito!', 'success', 8);
          }
        },
        error: (error) => {
          console.error('Error actualizando perfil:', error);
          this.loading = false;
        }
      });
    } catch (error) {
      console.error('Error subiendo imágenes:', error);
      this.loading = false;
    }
  }

  handleWhatsAppConfirmFromModal(plan: PlanOption): void {
    this.selectedPlanId = plan.id;
    this.selectedPlan = plan;
    this.showPlanModal = false;
    this.paymentCompleted = false;
    this.pendingWhatsAppPayment = true;
    this.updateProfile(true);
}
}
