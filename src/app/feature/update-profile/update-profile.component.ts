import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, forkJoin, of } from 'rxjs';
import {
  IImageData,
  IKYCCreateRequest,
  IKYCRecord,
  IKYCUpdateRequest,
  IProfileCreateRequest
} from '../create-profile/models/IProfileCreate.model';
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
import { resolveProfileId } from '../../shared/clases/resolveProfileId';
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
  /** Owner user id of the profile being edited (needed for admin edits). */
  ownerObjectId: string = '';
  isAdminEditMode = false;
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

  existingKycId: string | null = null;
  existingKyc: IKYCRecord | null = null;
  existingDocumentImages: IImageData[] = [];
  documentFrontFile: File | null = null;
  documentBackFile: File | null = null;
  passportFile: File | null = null;
  documentFrontPreview: string | null = null;
  documentBackPreview: string | null = null;
  passportPreview: string | null = null;
  kycLoading = false;
  private readonly phonePrefixMaxLength = 4;
  private readonly phonePrefixHintTimers = new Map<string, ReturnType<typeof setTimeout>>();
  phonePrefixLimitHints: Record<string, boolean> = {};

  constructor(
    private cloudinaryService: CloudinaryService,
    private fb: FormBuilder,
    private authService: AuthService,
    private profileService: ProfileService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.initForm();
    this.countries = GetCountries.getAllCountries();
    this.languageOptions = GetLenguages.getLenguajesOptions();
    this.posibilityOptions = GetPosibilities.GetPosibilityOptions();
    this.weekDays = GetWeekDays.GetWeekDaysOptions();

    const adminProfileId = this.resolveAdminRouteProfileId();
    if (adminProfileId) {
      this.isAdminEditMode = true;
      this.profileId = adminProfileId;
      this.getProfile(adminProfileId, { persistLocalStorage: false });
      return;
    }

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

  private resolveAdminRouteProfileId(): string {
    let current: ActivatedRoute | null = this.route;
    while (current) {
      const id = current.snapshot.paramMap.get('id');
      if (id) {
        return id;
      }
      current = current.parent;
    }
    return '';
  }

  goBackToAdmin(): void {
    this.router.navigate(['/admin/dashboard']);
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
      realData: this.fb.group({
        realName: [''],
        realBirthDate: [null],
        realAge: [null],
        email: ['', Validators.email],
        realNationality: [''],
        contactPhonePrefix: ['+', Validators.maxLength(4)],
        contactPhone: ['', [Validators.maxLength(15), Validators.pattern(/^\d*$/)]],
        documentType: [''],
        documentFront: [null],
        documentBack: [null],
        documentSingle: [null]
      }),
      posibilities: [[]]
    });

    this.profileForm
      .get('personalData.birthDate')
      ?.valueChanges.subscribe(value => this.updateAgeFromBirthDate(value));

    this.profileForm
      .get('realData.realBirthDate')
      ?.valueChanges.subscribe(value => this.updateRealAgeFromBirthDate(value));

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
    if (this.isProfileInactive && !this.isAdminEditMode) {
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
        this.ownerObjectId =
          profile.objectId ||
          profile.userId ||
          userId ||
          '';
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

  private getProfile(id: string, options?: { persistLocalStorage?: boolean }) {
    const persistLocalStorage = options?.persistLocalStorage !== false;

    if (!id || id === 'null') {
      if (this.isAdminEditMode) {
        this.toastService.showToast(
          this.translate.instant('PROFILE_FORM.ADMIN_EDIT_ERROR_TITLE'),
          this.translate.instant('PROFILE_FORM.ADMIN_EDIT_NOT_FOUND'),
          'error',
          4
        );
        this.goBackToAdmin();
        return;
      }
      this.router.navigate(['/create-profile']);
      return;
    }

    this.profileService.getProfileById(id).subscribe({
      next: (response) => {
        this.updateInactiveState(response);
        const profile = response?.profile ?? response ?? null;
        if (!profile) {
          if (this.isAdminEditMode) {
            this.toastService.showToast(
              this.translate.instant('PROFILE_FORM.ADMIN_EDIT_ERROR_TITLE'),
              this.translate.instant('PROFILE_FORM.ADMIN_EDIT_NOT_FOUND'),
              'error',
              4
            );
            this.goBackToAdmin();
          }
          return;
        }

        this.profileId = resolveProfileId(profile) || profile._id || this.profileId;
        this.ownerObjectId =
          profile.objectId ||
          profile.userId ||
          profile.user?._id ||
          profile.user?.id ||
          '';

        if (persistLocalStorage && this.profileId && !this.isAdminEditMode) {
          localStorage.setItem('profileId', this.profileId);
        }
        this.applyProfileToForm(profile);
      },
      error: (error) => {
        console.error('Error cargando perfil:', error);
        if (this.isAdminEditMode) {
          this.toastService.showToast(
            this.translate.instant('PROFILE_FORM.ADMIN_EDIT_ERROR_TITLE'),
            this.translate.instant('PROFILE_FORM.ADMIN_EDIT_LOAD_ERROR'),
            'error',
            4
          );
          this.goBackToAdmin();
        }
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
        email: profile.email || this.clientData?.email || '',
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
        const group = this.fb.group({
          day: [slot.day, Validators.required],
          start: [slot.start, Validators.required],
          end: [slot.end, Validators.required]
        });
        this.updateAvailabilityTimeValidators(group, slot.day);
        group.get('day')?.valueChanges.subscribe(day => {
          this.updateAvailabilityTimeValidators(group, day);
        });
        this.availabilitySlots.push(group);
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
    this.loadKYC();
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
    group.get('day')?.valueChanges.subscribe(day => {
      this.updateAvailabilityTimeValidators(group, day);
    });
    this.availabilitySlots.push(group);
  }

  removeAvailabilitySlot(index: number) {
    this.availabilitySlots.removeAt(index);
  }

  isAllDayAvailability(index: number): boolean {
    return this.availabilitySlots.at(index)?.get('day')?.value === '24/7';
  }

  isAvailabilityInvalid(): boolean {
    if (this.hasAvailability) {
      return false;
    }
    const control = this.profileForm.get('basicInfo.availabilitySlots');
    return !!(control && (control.touched || control.dirty));
  }

  private updateAvailabilityTimeValidators(group: FormGroup, day: string | null): void {
    const start = group.get('start');
    const end = group.get('end');
    if (day === '24/7') {
      start?.clearValidators();
      end?.clearValidators();
      start?.setValue('', { emitEvent: false });
      end?.setValue('', { emitEvent: false });
    } else {
      start?.setValidators(Validators.required);
      end?.setValidators(Validators.required);
    }
    start?.updateValueAndValidity({ emitEvent: false });
    end?.updateValueAndValidity({ emitEvent: false });
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
      .filter(slot => {
        if (!slot?.day) {
          return false;
        }
        if (slot.day === '24/7') {
          return true;
        }
        return !!(slot.start && slot.end);
      })
      .map(slot => slot.day === '24/7' ? '24/7' : `${slot.day} ${slot.start}-${slot.end}`);
  }

  private parseAvailabilitySlots(value: string[] | string): Array<{ day: string; start: string; end: string }> {
    const items = Array.isArray(value)
      ? value
      : typeof value === 'string'
        ? value.split(',').map(item => item.trim()).filter(Boolean)
        : [];

    return items
      .map(item => {
        const trimmed = item.trim();
        if (trimmed === '24/7' || trimmed.startsWith('24/7 ')) {
          return { day: '24/7', start: '', end: '' };
        }
        const [dayPart, timePart] = trimmed.split(' ');
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

  private loadKYC(): void {
    const userId = this.ownerObjectId || this.userId || this.clientData?._id || '';
    const profileId = this.profileId || '';
    if (!userId && !profileId) {
      return;
    }

    this.kycLoading = true;
    const request$ = userId
      ? this.profileService.getKYCByUser(userId)
      : this.profileService.getKYCByProfile(profileId);

    request$.subscribe({
      next: (response) => {
        this.kycLoading = false;
        this.applyKycToForm(response?.kyc ?? null);
      },
      error: (error) => {
        this.kycLoading = false;
        console.error('Error cargando KYC:', error);
      }
    });
  }

  private applyKycToForm(kyc: IKYCRecord | null): void {
    this.existingKyc = kyc;
    this.existingKycId = kyc?._id || null;
    this.existingDocumentImages = this.normalizeDocumentImages(kyc?.documentImage);
    this.clearDocumentUploads(false);

    if (!kyc) {
      return;
    }

    const phoneParts = this.splitPhone(kyc.phone || '');
    const docType = (kyc.documentType || '').toLowerCase();
    const images = this.existingDocumentImages;

    this.profileForm.get('realData')?.patchValue({
      realName: kyc.fullName || '',
      realBirthDate: null,
      realAge: kyc.age ?? null,
      email: kyc.email || '',
      realNationality: kyc.nationality || '',
      contactPhonePrefix: phoneParts.prefix,
      contactPhone: phoneParts.number,
      documentType: docType === 'passport' ? 'passport' : docType === 'dni' ? 'dni' : docType || ''
    }, { emitEvent: false });

    if (docType === 'passport') {
      this.passportPreview = images[0]?.url || null;
    } else if (images.length) {
      this.documentFrontPreview = images[0]?.url || null;
      this.documentBackPreview = images[1]?.url || null;
    }

    this.profileForm.get('realData')?.markAsPristine();
  }

  private normalizeDocumentImages(raw: IImageData | IImageData[] | undefined | null): IImageData[] {
    if (!raw) {
      return [];
    }
    const list = Array.isArray(raw) ? raw : [raw];
    return list.filter((item): item is IImageData => !!item?.url && !!item?.public_id);
  }

  private splitPhone(phone: string): { prefix: string; number: string } {
    const raw = (phone || '').trim();
    if (!raw) {
      return { prefix: '+', number: '' };
    }
    const match = raw.match(/^(\+|00)(\d{1,4})\s*(.*)$/);
    if (match) {
      return {
        prefix: this.normalizePhonePrefix(`+${match[2]}`),
        number: (match[3] || '').replace(/\D/g, '')
      };
    }
    return { prefix: '+', number: raw.replace(/\D/g, '') };
  }

  private normalizePhonePrefix(raw: unknown): string {
    let value = String(raw ?? '').replace(/\s+/g, '');
    if (!value || value === '+') {
      return '+';
    }
    if (value.startsWith('00')) {
      value = `+${value.slice(2)}`;
    }
    value = value.replace(/^\++/, '+');
    if (!value.startsWith('+')) {
      value = `+${value}`;
    }
    return value.slice(0, this.phonePrefixMaxLength) || '+';
  }

  private setPhonePrefixValue(controlPath: string, value: string): void {
    const control = this.profileForm.get(controlPath);
    if (!control) {
      return;
    }
    const normalized = this.normalizePhonePrefix(value);
    if (control.value !== normalized) {
      control.setValue(normalized);
      control.markAsDirty();
    }
  }

  private getPhoneWithPrefix(basicInfo: { phonePrefix?: string; phone?: string }): string {
    const phone = (basicInfo.phone || '').trim().replace(/^\+/, '');
    if (!phone) {
      return '';
    }
    const prefix = this.normalizePhonePrefix(basicInfo.phonePrefix);
    if (prefix === '+') {
      return `+${phone}`;
    }
    return `${prefix}${phone}`;
  }

  isPhonePrefixLimitHint(controlPath: string): boolean {
    return !!this.phonePrefixLimitHints[controlPath];
  }

  onPhonePrefixBlur(controlPath: string): void {
    const control = this.profileForm.get(controlPath);
    if (!control) {
      return;
    }
    const normalized = this.normalizePhonePrefix(control.value);
    if (control.value !== normalized) {
      control.setValue(normalized);
    }
  }

  onPhonePrefixInput(controlPath: string): void {
    const control = this.profileForm.get(controlPath);
    if (!control) {
      return;
    }
    const current = String(control.value ?? '');
    if (!current || current === '+' || current.startsWith('+')) {
      return;
    }
    this.setPhonePrefixValue(controlPath, current);
  }

  onPhonePrefixKeydown(event: KeyboardEvent, controlPath: string): void {
    const input = event.target as HTMLInputElement;
    if (!input) {
      return;
    }

    const value = input.value || '';
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const selectionLength = end - start;

    if (event.key === 'Backspace' || event.key === 'Delete') {
      const clearsAll = selectionLength > 0 && start === 0 && end >= value.length;
      const removesPlusWithBackspace =
        event.key === 'Backspace' && value.startsWith('+') && selectionLength === 0 && start === 1;
      const removesPlusWithDelete =
        event.key === 'Delete' && value.startsWith('+') && selectionLength === 0 && start === 0;
      const selectionIncludesPlus = value.startsWith('+') && start === 0 && end >= 1;

      if (clearsAll || removesPlusWithBackspace || removesPlusWithDelete || selectionIncludesPlus) {
        event.preventDefault();
        const remainder = clearsAll || selectionIncludesPlus
          ? `+${value.slice(Math.max(end, 1))}`
          : value;
        this.setPhonePrefixValue(controlPath, remainder);
        queueMicrotask(() => {
          const el = event.target as HTMLInputElement;
          el.setSelectionRange(1, 1);
        });
        return;
      }
      return;
    }

    if (this.isPrefixNavigationKey(event)) {
      return;
    }

    const isPrintable = event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
    if (isPrintable && value.length >= this.phonePrefixMaxLength && selectionLength === 0) {
      event.preventDefault();
      this.showPhonePrefixLimitHint(controlPath);
    }
  }

  onPhonePrefixPaste(event: ClipboardEvent, controlPath: string): void {
    const input = event.target as HTMLInputElement;
    if (!input) {
      return;
    }

    const paste = event.clipboardData?.getData('text') ?? '';
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const nextValue = `${input.value.slice(0, start)}${paste}${input.value.slice(end)}`;
    const normalized = this.normalizePhonePrefix(nextValue);

    event.preventDefault();
    this.setPhonePrefixValue(controlPath, normalized);
    if (nextValue.replace(/\s+/g, '').length > this.phonePrefixMaxLength || normalized.length < nextValue.replace(/\s+/g, '').length) {
      this.showPhonePrefixLimitHint(controlPath);
    }
  }

  private isPrefixNavigationKey(event: KeyboardEvent): boolean {
    return [
      'Tab',
      'Escape',
      'Enter',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End'
    ].includes(event.key);
  }

  private showPhonePrefixLimitHint(controlPath: string): void {
    this.phonePrefixLimitHints = { ...this.phonePrefixLimitHints, [controlPath]: true };
    const existingTimer = this.phonePrefixHintTimers.get(controlPath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    const timer = setTimeout(() => {
      const { [controlPath]: _removed, ...rest } = this.phonePrefixLimitHints;
      this.phonePrefixLimitHints = rest;
      this.phonePrefixHintTimers.delete(controlPath);
    }, 2500);
    this.phonePrefixHintTimers.set(controlPath, timer);
  }

  private updateRealAgeFromBirthDate(value: unknown): void {
    const age = this.calculateAge(value);
    this.profileForm.get('realData.realAge')?.setValue(age);
    this.profileForm.get('realData.realAge')?.markAsDirty();
  }

  openDocumentSelector(input: HTMLInputElement): void {
    input.click();
  }

  onDocumentSelected(type: 'front' | 'back' | 'passport', event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (type === 'front') {
        this.documentFrontFile = file;
        this.documentFrontPreview = reader.result as string;
        this.profileForm.get('realData.documentFront')?.setValue(file);
      }
      if (type === 'back') {
        this.documentBackFile = file;
        this.documentBackPreview = reader.result as string;
        this.profileForm.get('realData.documentBack')?.setValue(file);
      }
      if (type === 'passport') {
        this.passportFile = file;
        this.passportPreview = reader.result as string;
        this.profileForm.get('realData.documentSingle')?.setValue(file);
      }
      this.profileForm.get('realData')?.markAsDirty();
    };
    reader.readAsDataURL(file);
  }

  onDocumentTypeChange(_event: Event): void {
    this.clearDocumentUploads(true);
    this.profileForm.get('realData')?.markAsDirty();
  }

  private clearDocumentUploads(clearExistingImages: boolean): void {
    this.documentFrontFile = null;
    this.documentBackFile = null;
    this.passportFile = null;
    this.documentFrontPreview = null;
    this.documentBackPreview = null;
    this.passportPreview = null;
    this.profileForm.get('realData.documentFront')?.setValue(null);
    this.profileForm.get('realData.documentBack')?.setValue(null);
    this.profileForm.get('realData.documentSingle')?.setValue(null);
    if (clearExistingImages) {
      this.existingDocumentImages = [];
    }
  }

  get kycStatusLabelKey(): string {
    const status = (this.existingKyc?.status || '').toLowerCase();
    if (this.existingKyc?.verify || status === 'verified') {
      return 'PROFILE_FORM.KYC_STATUS_VERIFIED';
    }
    if (status === 'rejected') {
      return 'PROFILE_FORM.KYC_STATUS_REJECTED';
    }
    if (this.existingKycId) {
      return 'PROFILE_FORM.KYC_STATUS_PENDING';
    }
    return 'PROFILE_FORM.KYC_STATUS_MISSING';
  }

  private hasNewDocumentFiles(): boolean {
    return !!(this.documentFrontFile || this.documentBackFile || this.passportFile);
  }

  private shouldPersistKyc(): boolean {
    const realData = this.profileForm.get('realData')?.value || {};
    if (this.existingKycId) {
      return !!this.profileForm.get('realData')?.dirty || this.hasNewDocumentFiles();
    }
    return !!(
      (realData.realName || '').trim() ||
      (realData.email || '').trim() ||
      this.hasNewDocumentFiles()
    );
  }

  private validateKycBeforeSave(): boolean {
    const realData = this.profileForm.get('realData')?.value || {};
    const missing =
      !(realData.realName || '').trim() ||
      realData.realAge == null ||
      !(realData.realNationality || '').trim() ||
      !(realData.email || '').trim() ||
      !(realData.contactPhone || '').trim() ||
      !(realData.documentType || '').trim();

    if (missing) {
      this.toastService.showToast(
        this.translate.instant('PROFILE_FORM.KYC_INCOMPLETE_TITLE'),
        this.translate.instant('PROFILE_FORM.KYC_INCOMPLETE_BODY'),
        'error',
        5
      );
      this.profileForm.get('realData')?.markAllAsTouched();
      return false;
    }

    const docType = realData.documentType;
    const hasExisting = this.existingDocumentImages.length > 0;

    if (docType === 'dni') {
      const creating = !this.existingKycId;
      const hasDocs = creating
        ? !!(this.documentFrontFile && this.documentBackFile)
        : !!(this.documentFrontFile || this.documentBackFile || this.documentFrontPreview || this.documentBackPreview || hasExisting);
      if (!hasDocs) {
        this.toastService.showToast(
          this.translate.instant('PROFILE_FORM.KYC_INCOMPLETE_TITLE'),
          this.translate.instant('PROFILE_FORM.KYC_DOCUMENT_REQUIRED'),
          'error',
          5
        );
        return false;
      }
    } else if (docType === 'passport') {
      if (!this.passportFile && !this.passportPreview && !hasExisting) {
        this.toastService.showToast(
          this.translate.instant('PROFILE_FORM.KYC_INCOMPLETE_TITLE'),
          this.translate.instant('PROFILE_FORM.KYC_DOCUMENT_REQUIRED'),
          'error',
          5
        );
        return false;
      }
    }

    return true;
  }

  private async resolveDocumentImagesForSave(userId: string): Promise<IImageData[]> {
    const realName = this.profileForm.get('realData.realName')?.value || 'user';
    const folder = `kyc/${this.slugifyName(realName)}+${userId}`;
    const docType = this.profileForm.get('realData.documentType')?.value;
    const existing = [...this.existingDocumentImages];

    const uploadOne = async (file: File): Promise<IImageData> => {
      const upload: any = await firstValueFrom(this.cloudinaryService.uploadImage(file, folder));
      if (!upload?.secure_url || !upload?.public_id) {
        throw new Error('Error al subir documento KYC');
      }
      return { url: upload.secure_url, public_id: upload.public_id };
    };

    if (docType === 'passport') {
      if (this.passportFile) {
        return [await uploadOne(this.passportFile)];
      }
      return existing.slice(0, 1);
    }

    let front = existing[0];
    let back = existing[1];
    if (this.documentFrontFile) {
      front = await uploadOne(this.documentFrontFile);
    }
    if (this.documentBackFile) {
      back = await uploadOne(this.documentBackFile);
    }
    return [front, back].filter((item): item is IImageData => !!item?.url && !!item?.public_id);
  }

  private async persistKyc(userId: string): Promise<void> {
    if (!this.shouldPersistKyc()) {
      return;
    }

    const realData = this.profileForm.get('realData')?.value || {};
    const documentImages = await this.resolveDocumentImagesForSave(userId);
    if (!documentImages.length) {
      throw new Error('KYC_NO_IMAGES');
    }

    const basePayload = {
      fullName: realData.realName || '',
      age: realData.realAge ?? null,
      nationality: realData.realNationality || '',
      phone: this.getPhoneWithPrefix({
        phonePrefix: realData.contactPhonePrefix,
        phone: realData.contactPhone
      }),
      email: realData.email || '',
      documentType: realData.documentType || '',
      documentNumber: this.existingKyc?.documentNumber ?? null,
      documentImage: documentImages
    };

    if (this.existingKycId) {
      const updatePayload: IKYCUpdateRequest = { ...basePayload };
      const response = await firstValueFrom(
        this.profileService.updateKYC(this.existingKycId, updatePayload)
      );
      this.applyKycToForm(response?.kyc ?? { ...this.existingKyc, ...updatePayload, _id: this.existingKycId });
      return;
    }

    const createPayload: IKYCCreateRequest = {
      userId,
      ...basePayload
    };
    const created = await firstValueFrom(this.profileService.createKYC(createPayload));
    this.applyKycToForm(created?.kyc ?? null);
  }

  async updateProfile(planUpdated: boolean = false) {
    if (!this.isAdminEditMode && this.isProfileInactive && !(planUpdated && this.isPlanExpired)) {
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

    const lookupId = this.profileId || (!this.isAdminEditMode ? this.userId : '');
    if (!lookupId) {
      this.toastService.showToast('Perfil no identificado', 'Inicia sesion nuevamente', 'error', 4);
      return;
    }

    if (this.shouldPersistKyc() && !this.validateKycBeforeSave()) {
      return;
    }

    try {
      this.loading = true;

      const uploadFolder = this.getUploadFolder(
        this.ownerObjectId || this.userId || lookupId
      );

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
      const objectId =
        this.ownerObjectId ||
        this.clientData?._id ||
        this.userId ||
        '';

      if (!objectId) {
        this.toastService.showToast(
          'Perfil incompleto',
          'No se pudo determinar el usuario dueño del anuncio',
          'error',
          4
        );
        this.loading = false;
        return;
      }

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
        email: basicInfo.email || '',
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

      await firstValueFrom(this.profileService.updateProfile(lookupId, profilePayload));

      try {
        await this.persistKyc(objectId);
      } catch (kycError: any) {
        if (kycError?.message === 'KYC_INVALID' || kycError?.message === 'KYC_NO_IMAGES') {
          this.loading = false;
          return;
        }
        console.error('Error guardando KYC:', kycError);
        this.toastService.showToast(
          this.translate.instant('PROFILE_FORM.KYC_UPDATE_ERROR_TITLE'),
          this.translate.instant('PROFILE_FORM.TOAST_KYC_UPDATE_WARNING'),
          'error',
          5
        );
      }

      this.loading = false;
      if (planUpdated) {
        this.toastService.showToast('Plan actualizado', '¡El plan se actualizo correctamente!', 'success', 8);
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else if (this.isAdminEditMode) {
        this.toastService.showToast(
          this.translate.instant('PROFILE_FORM.ADMIN_EDIT_SUCCESS_TITLE'),
          this.translate.instant('PROFILE_FORM.ADMIN_EDIT_SUCCESS'),
          'success',
          6
        );
      } else {
        this.toastService.showToast('Perfil actualizado', '¡Los cambios se guardaron con exito!', 'success', 8);
      }
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      this.loading = false;
      this.toastService.showToast(
        this.translate.instant('PROFILE_FORM.ADMIN_EDIT_ERROR_TITLE'),
        this.translate.instant('PROFILE_FORM.ADMIN_EDIT_SAVE_ERROR'),
        'error',
        5
      );
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
