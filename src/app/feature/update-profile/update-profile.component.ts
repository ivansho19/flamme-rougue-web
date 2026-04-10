import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
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
import { GetLenguages } from '../../shared/clases/getLenguagesOptions';
import { GetWeekDays } from '../../shared/clases/getWeekDays';
import { GetPosibilities } from '../../shared/clases/getPosibilityOptions';
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
  showPlanSection = false;
  countries: Country[] = [];
  cities: string[] = [];
  languageOptions: any[] = [];
  posibilityOptions: any[] = [];
  weekDays: any[] = [];
  isDraggingMain = false;
  isDraggingGallery = false;
  @ViewChild('mainInput') mainInput!: ElementRef<HTMLInputElement>;
  @ViewChild('galleryInput') galleryInput!: ElementRef<HTMLInputElement>;

  constructor(
    private cloudinaryService: CloudinaryService,
    private fb: FormBuilder,
    private authService: AuthService,
    private profileService: ProfileService,
    private toastService: ToastService
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
        phone: ['', Validators.required],
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

  private getProfileByUser(userId: string) {
    this.profileService.getProfileByUser(userId).subscribe({
      next: (response) => {
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

    this.profileForm.patchValue({
      basicInfo: {
        publicName: currentBasicInfo.publicName || client.name || '',
        email: currentBasicInfo.email || client.email || '',
        country: currentBasicInfo.country || countryValue || '',
        city: currentBasicInfo.city || client.city || '',
        phone: currentBasicInfo.phone || client.phone || ''
      }
    });
  }

  private setCitiesForCountry(value?: string | null): string {
    if (!value) {
      this.cities = [];
      return '';
    }

    const found = this.countries.find(country =>
      country.code === value || country.name === value
    );

    this.cities = found ? found.cities : [];
    return found?.code ?? value;
  }

  onCountryChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.setCitiesForCountry(value);
    this.profileForm.get('basicInfo.city')?.setValue('');
  }

  private getProfile(id: string) {
    if (!id) {
      return;
    }

    this.profileService.getProfileById(id).subscribe({
      next: (response) => {
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

    this.profileForm.patchValue({
      basicInfo: {
        publicName: profile.displayName || '',
        description: profile.bio || '',
        country: countryValue || '',
        city: profile.city || '',
        phone: profile.phone || ''
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
  }

  private setSelectedPlan(profile: any): void {
    const rawPlan = profile?.plan ?? profile?.planId ?? profile?.plan?.id ?? null;
    if (rawPlan === null || rawPlan === undefined) {
      return;
    }

    const normalized = typeof rawPlan === 'string' ? Number(rawPlan) : Number(rawPlan);
    this.selectedPlanId = Number.isNaN(normalized) ? null : normalized;
  }

  planSelected(plan: PlanOption) {
    this.selectedPlanId = plan.id;
    this.selectedPlan = plan;
  }

  updatePlan() {
    if (!this.selectedPlanId) {
      this.toastService.showToast('Selecciona un plan', 'Debes elegir un plan para actualizar', 'error', 4);
      return;
    }

    this.updateProfile();
  }

  togglePlanSection() {
    this.showPlanSection = true;
  }

  get canSave(): boolean {
    return !!this.profileForm && this.profileForm.valid && !this.loading && this.hasAvailability;
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
      subtitleValue: basicInfo.city || '',
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

  async updateProfile() {
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

      const profilePayload: IProfileCreateRequest = {
        objectId,
        displayName: basicInfo.publicName || '',
        bio: basicInfo.description || '',
        phone: basicInfo.phone || '',
        country: basicInfo.country || '',
        city: basicInfo.city || '',
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
        plan: this.selectedPlanId ? [this.selectedPlanId.toString()] : [],
        imagesMain: mainImage,
        imagesGallery: galleryImages,
        orientation: personalData.orientation || '',

      };

      this.profileService.updateProfile(lookupId, profilePayload).subscribe({
        next: () => {
          this.loading = false;
          this.toastService.showToast('Perfil actualizado', 'Los cambios se guardaron', 'success', 5);
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
}
