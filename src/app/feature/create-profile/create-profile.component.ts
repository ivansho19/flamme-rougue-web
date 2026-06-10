import { Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { firstValueFrom, forkJoin, of } from 'rxjs';
import { IProfileCreateRequest, IKYCCreateRequest } from './models/IProfileCreate.model';
import { CloudinaryService } from '../../shared/services/cloudinary/cloudinary.service';
import { AuthService } from '../../auth/service/auth.service';
import { ProfileService } from '../../shared/services/profile/profile.service';
import { GetCountries } from '../../shared/clases/getCountries';
import { ProfilePreviewData } from '../../shared/components/profile-preview/profile-preview.component';
import { GetUserName } from '../../shared/clases/getUserName';
import { GetLenguages } from '../../shared/clases/getLenguagesOptions';
import { GetPosibilities } from '../../shared/clases/getPosibilityOptions';
import { GetWeekDays } from '../../shared/clases/getWeekDays';
import { Country } from '../../shared/model/country.model';
import { PlanOption } from '../../shared/model/planes.model';
import { ToastService } from '../../shared/services/toast/toast.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-create-profile',
    templateUrl: './create-profile.component.html',
    styleUrls: ['./create-profile.component.scss']
})
export class ProfileEditComponent implements OnInit {

    profile: any = {
        profileImage: '',
        galleryImages: []
    };

    uploadProgress = 0;

    mainImageFile!: File | null;
    galleryFiles: File[] = [];

    documentFrontFile: File | null = null;
    documentBackFile: File | null = null;
    passportFile: File | null = null;

    documentFrontPreview: string | null = null;
    documentBackPreview: string | null = null;
    passportPreview: string | null = null;

    imageUrl: string | null = null;
    loading = false;
    profileId: string = '';
    profileData: any;
    clientData: any;
    userId: string | null = null; // Reemplaza con el ID real del usuario
    profileForm!: FormGroup;

    selectedPlanId: number | null = null;
    selectedPlan: PlanOption | null = null;
    paymentCompleted = false;
    pendingWhatsAppPayment = false;
    
    showPlanModal = false;
    previousIsProfileComplete = false;

    countries: Country[] = [];
    cities: string[] = [];
    calculatedAge: number | null = null;
    languageOptions: any[] = [];

    posibilityOptions : any[] = [];

    weekDays : any[] = []

    isDraggingMain = false;
    isDraggingGallery = false;
    @ViewChild('mainInput') mainInput!: ElementRef<HTMLInputElement>;
    @ViewChild('galleryInput') galleryInput!: ElementRef<HTMLInputElement>;

    constructor(
        private cloudinaryService: CloudinaryService,
        private route: ActivatedRoute,
        private http: HttpClient,
        private fb: FormBuilder,
        private authService: AuthService,
        private profileService: ProfileService,
        private router: Router,
        private toastService: ToastService,
        private ngZone: NgZone,
        private translate: TranslateService
    ) { }

    ngOnInit() {
        this.initForm();
        this.countries = GetCountries.getAllCountries();
        this.languageOptions = GetLenguages.getLenguajesOptions();
        this.posibilityOptions = GetPosibilities.GetPosibilityOptions();
        this.weekDays = GetWeekDays.GetWeekDaysOptions();

        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) {
            this.userId = storedUserId;
        }

        this.route.paramMap.subscribe(params => {
            this.profileId = params.get('id') || '';

            if (this.profileId) {
                this.getProfile();
                return;
            }

            if (this.userId) {
                this.getProfileByUser(this.userId);
            }
            this.loadClientFromEmail();
        });
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
            this.checkFormStatus();
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
        this.galleryFiles.splice(index, 1);
        this.profile.galleryImages.splice(index, 1);
    }

    getProfile() {
        this.profileService.getProfileById(this.profileId).subscribe({
            next: (response) => {
                const profile = response?.profile ?? response ?? null;
                if (!profile) {
                    return;
                }
                this.profileData = profile;
                this.profileId = profile._id || this.profileId;
                if (profile.objectId) {
                    this.userId = profile.objectId;
                }
                if (profile.country) {
                    const countryValue = this.setCitiesForCountry(profile.country);
                    this.profileForm.patchValue({
                        basicInfo: {
                            country: countryValue || ''
                        }
                    });
                }
            },
            error: (error) => {
                console.error('Error cargando perfil:', error);
            }
        });
    }

    private getProfileByUser(userId: string) {
        this.profileService.getProfileByUser(userId).subscribe({
            next: (response) => {
                const profile = response?.profile ?? response ?? null;
                if (!profile?._id) {
                    return;
                }
                this.profileData = profile;
                this.profileId = profile._id;
                localStorage.setItem('profileId', this.profileId);
            },
            error: (error) => {
                console.error('Error cargando perfil:', error);
            }
        });
    }

    loadClientFromEmail() {
        const emailFromQuery = this.route.snapshot.queryParamMap.get('email');
        const emailFromStorage = localStorage.getItem('userEmail');
        const email = emailFromQuery || emailFromStorage;

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
            },
            error: (error) => {
                console.error('Error cargando cliente:', error);
            }
        });
    }

    initForm() {
        this.profileForm = this.fb.group({
            basicInfo: this.fb.group({
                publicName: ['', Validators.required],
                email: ['', [Validators.required, Validators.email]],
                description: ['', [Validators.required, Validators.maxLength(2500)]],
                country: ['', Validators.required],
                city: ['', Validators.required],
                zone: [''],
                phonePrefix: ['+', Validators.maxLength(4)],
                phone: ['', [Validators.required, Validators.maxLength(12), Validators.pattern(/^\d+$/)]],
                availabilitySlots: this.fb.array([], this.minArrayLengthValidator(1))
            }),

            personalData: this.fb.group({
                gender: ['', Validators.required],
                orientation: ['', Validators.required],
                alcohol: [''],
                cigarette: [''],
                birthDate: [null, [Validators.required, this.minAgeValidator(18)]],
                age: [null, Validators.required],
                nationality: ['', Validators.required],
                height: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
                hairColor: ['', Validators.required],
                eyeColor: ['', Validators.required],
                weight: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
                languages: [[], Validators.required]
            }),

            realData: this.fb.group({
                realName: ['', Validators.required],
                realBirthDate: [null, Validators.required],
                realAge: [null, Validators.required],
                email: ['', [Validators.required, Validators.email]],
                realNationality: ['', Validators.required],
                contactPhone: ['', [Validators.required, Validators.maxLength(12), Validators.pattern(/^\+?\d+$/)]],
                documentType: ['', Validators.required],
                documentFront: [null],
                documentBack: [null],
                documentSingle: [null]
            }),

            posibilities: [[]],
            isGold: [false]
        });

        this.profileForm
            .get('personalData.birthDate')
            ?.valueChanges.subscribe(value => this.updateAgeFromBirthDate(value));

        this.profileForm
            .get('realData.realBirthDate')
            ?.valueChanges.subscribe(value => this.updateRealAgeFromBirthDate(value));

        this.profileForm
            .get('realData.documentType')
            ?.valueChanges.subscribe(value => this.updateDocumentValidators(value));

        // Watch for form changes to auto-show modal when profile becomes complete
        this.profileForm.statusChanges.subscribe(() => {
            this.checkAndShowPlanModal();
        });

        this.addAvailabilitySlot();
    }

    onCountryChange(event: Event) {
        const value = (event.target as HTMLSelectElement).value;
        this.setCitiesForCountry(value);
        this.profileForm.get('basicInfo.city')?.setValue('');
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

    private applyClientToForm(client: any) {
        this.clientData = client;
        this.userId = client?._id || this.userId;
        const countryValue = this.setCitiesForCountry(client.country);

        this.profileForm.patchValue({
            basicInfo: {
                publicName: client.name || '',
                email: client.email || '',
                country: countryValue || '',
                city: client.city || '',
                phonePrefix: '',
                phone: client.phone || ''
            },
            personalData: {
                gender: client.gender || '',
                orientation: client.orientation || '',
                languages: Array.isArray(client.languages) ? client.languages : []
            },
            posibilities: Array.isArray(client.posibilities) ? client.posibilities : []
        });
    }

    get canShowRealDataSection(): boolean {
        const basicInfoValid = this.profileForm.get('basicInfo')?.valid ?? false;
        const personalDataValid = this.profileForm.get('personalData')?.valid ?? false;
        return basicInfoValid && personalDataValid;
    }

    /* ============ DRAG GENERICO ============ */
    onDragOver(event: DragEvent) {
        event.preventDefault();
    }

    /* ============ MAIN IMAGE ============ */
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

    /* ============ GALLERY ============ */
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

    /* ============ READER ============ */
    readFile(file: File, callback: (result: string) => void) {
        const reader = new FileReader();
        reader.onload = () => callback(reader.result as string);
        reader.readAsDataURL(file);
    }

    planSelected(plan: PlanOption) {
        this.selectedPlanId = plan.id;
        this.selectedPlan = plan;
        console.log('Plan seleccionado:', plan);
    }

    handlePlanSelectionFromModal(plan: PlanOption): void {
        this.selectedPlanId = plan.id;
        this.selectedPlan = plan;
        this.paymentCompleted = true;
        this.pendingWhatsAppPayment = false;
        this.showPlanModal = false;
        console.log('Plan seleccionado desde modal:', plan);
        // Auto-save profile after plan confirmation
        this.saveProfile();
    }

    handleWhatsAppConfirmFromModal(plan: PlanOption): void {
        this.selectedPlanId = plan.id;
        this.selectedPlan = plan;
        this.paymentCompleted = false;
        this.pendingWhatsAppPayment = true;
        this.showPlanModal = false;
        console.log('Plan seleccionado para WhatsApp:', plan);
        this.saveProfile();
    }

    closePlanModal(): void {
        // Permite cerrar el modal sin hacer nada (cuando hace clic en "Decidir después")
        this.showPlanModal = false;
    }

    publishProfile(): void {
        // Si no hay plan seleccionado, abre el modal para seleccionar uno
        if (!this.selectedPlanId) {
            this.showPlanModal = true;
            return;
        }
        // Si ya hay plan, procede a guardar el perfil
        this.saveProfile();
    }

    checkAndShowPlanModal(): void {
        // Auto-show modal when profile becomes complete for the first time
        if (this.isProfileComplete && !this.previousIsProfileComplete) {
            this.showPlanModal = true;
            this.previousIsProfileComplete = true;
        } else if (!this.isProfileComplete && this.previousIsProfileComplete) {
            this.previousIsProfileComplete = false;
        }
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
            phone: this.getPhoneWithPrefix(basicInfo),
            availability: availabilityText,
            bio: basicInfo.description || '',
            gender: personalData.gender || '',
            orientation: personalData.orientation || '',
            hairColor: personalData.hairColor || '',
            age: personalData.age,
            eyeColor: personalData.eyeColor || '',
            nationality: personalData.nationality || '',
            languages: languagesText || '',
            height: personalData.height,
            weight: personalData.weight,
            isGold: this.profileForm.get('isGold')?.value,
            isVerified: true,
            profileImage: this.profile.profileImage,
            galleryImages: this.profile.galleryImages,
            posibilities: posibilitiesList
        };
    }

    get isProfileComplete(): boolean {
        if (!this.profileForm) {
            return false;
        }

        // Check required fields individually to exclude optional FormArrays
        const hasImage = !!this.profile.profileImage;
        
        // BasicInfo validations (excluding optional availabilitySlots)
        const publicName = this.profileForm.get('basicInfo.publicName')?.valid ?? false;
        const email = this.profileForm.get('basicInfo.email')?.valid ?? false;
        const description = this.profileForm.get('basicInfo.description')?.valid ?? false;
        const country = this.profileForm.get('basicInfo.country')?.valid ?? false;
        const city = this.profileForm.get('basicInfo.city')?.valid ?? false;
        const phone = this.profileForm.get('basicInfo.phone')?.valid ?? false;
        
        const basicInfoComplete = publicName && email && description && country && city && phone;
        
        // PersonalData validations
        const gender = this.profileForm.get('personalData.gender')?.valid ?? false;
        const orientation = this.profileForm.get('personalData.orientation')?.valid ?? false;
        const birthDate = this.profileForm.get('personalData.birthDate')?.valid ?? false;
        const nationality = this.profileForm.get('personalData.nationality')?.valid ?? false;
        
        // Height and Weight - Check if value exists and is a valid number greater than 0
        const heightControl = this.profileForm.get('personalData.height');
        const heightValue = heightControl?.value ?? '';
        const heightValid = heightValue !== '' && !isNaN(Number(heightValue)) && Number(heightValue) > 0;
        
        const weightControl = this.profileForm.get('personalData.weight');
        const weightValue = weightControl?.value ?? '';
        const weightValid = weightValue !== '' && !isNaN(Number(weightValue)) && Number(weightValue) > 0;
        
        const hairColor = this.profileForm.get('personalData.hairColor')?.valid ?? false;
        const eyeColor = this.profileForm.get('personalData.eyeColor')?.valid ?? false;
        
        // Languages - check if at least one language is selected (value is array and not empty)
        const languagesControl = this.profileForm.get('personalData.languages');
        const languagesValue = languagesControl?.value ?? [];
        const hasLanguages = Array.isArray(languagesValue) && languagesValue.length > 0;
        
        const personalDataComplete = gender && orientation && birthDate && nationality &&
                                    heightValid && hairColor && eyeColor && weightValid && hasLanguages;

        // RealData validations
        const realName = this.profileForm.get('realData.realName')?.valid ?? false;
        const realBirthDate = this.profileForm.get('realData.realBirthDate')?.valid ?? false;
        const realAge = this.profileForm.get('realData.realAge')?.valid ?? false;
        const realEmail = this.profileForm.get('realData.email')?.valid ?? false;
        const realNationality = this.profileForm.get('realData.realNationality')?.valid ?? false;
        const contactPhone = this.profileForm.get('realData.contactPhone')?.valid ?? false;
        const documentType = this.profileForm.get('realData.documentType')?.value;
        const documentFrontValid = this.profileForm.get('realData.documentFront')?.valid ?? false;
        const documentBackValid = this.profileForm.get('realData.documentBack')?.valid ?? false;
        const documentSingleValid = this.profileForm.get('realData.documentSingle')?.valid ?? false;

        let documentsComplete = false;
        if (documentType === 'dni') {
            documentsComplete = documentFrontValid && documentBackValid;
        } else if (documentType === 'passport') {
            documentsComplete = documentSingleValid;
        }

        const realDataComplete = realName && realBirthDate && realAge && realEmail &&
            realNationality && contactPhone && documentsComplete;

        return basicInfoComplete && personalDataComplete && realDataComplete && hasImage;
    }

    get isImagesComplete(): boolean {
        return !!this.profile?.profileImage;
    }

    get isBasicInfoComplete(): boolean {
        const basicInfoGroup = this.profileForm?.get('basicInfo');
        return !!basicInfoGroup?.valid;
    }

    get isPersonalDataComplete(): boolean {
        const personalDataGroup = this.profileForm?.get('personalData');
        return !!personalDataGroup?.valid;
    }

    get isServicesComplete(): boolean {
        const value = this.profileForm?.get('posibilities')?.value ?? [];
        return Array.isArray(value) ? value.length > 0 : !!value;
    }

    get isRealDataComplete(): boolean {
        const realDataGroup = this.profileForm?.get('realData');
        return !!realDataGroup?.valid;
    }

    get canPublish(): boolean {
        return this.isProfileComplete && !!this.selectedPlanId;
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
        const control = this.profileForm.get('basicInfo.availabilitySlots');
        return !!(control && control.invalid && (control.touched || control.dirty));
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

    private updateRealAgeFromBirthDate(value: unknown): void {
        const age = this.calculateAge(value);
        this.profileForm.get('realData.realAge')?.setValue(age);
        this.profileForm.get('realData.realAge')?.markAsDirty();
    }

    openDocumentSelector(input: HTMLInputElement) {
        input.click();
    }

    onDocumentSelected(type: 'front' | 'back' | 'passport', event: Event) {
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
        };
        reader.readAsDataURL(file);
    }

    onDocumentTypeChange(event: Event) {
        const value = (event.target as HTMLSelectElement).value;
        this.updateDocumentValidators(value);
        this.clearDocumentUploads();
    }

    private clearDocumentUploads() {
        this.documentFrontFile = null;
        this.documentBackFile = null;
        this.passportFile = null;
        this.documentFrontPreview = null;
        this.documentBackPreview = null;
        this.passportPreview = null;
        this.profileForm.get('realData.documentFront')?.setValue(null);
        this.profileForm.get('realData.documentBack')?.setValue(null);
        this.profileForm.get('realData.documentSingle')?.setValue(null);
    }

    private updateDocumentValidators(type: string) {
        const front = this.profileForm.get('realData.documentFront');
        const back = this.profileForm.get('realData.documentBack');
        const single = this.profileForm.get('realData.documentSingle');

        front?.clearValidators();
        back?.clearValidators();
        single?.clearValidators();

        if (type === 'dni') {
            front?.setValidators([Validators.required]);
            back?.setValidators([Validators.required]);
        }

        if (type === 'passport') {
            single?.setValidators([Validators.required]);
        }

        front?.updateValueAndValidity();
        back?.updateValueAndValidity();
        single?.updateValueAndValidity();
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

    private getPhoneWithPrefix(basicInfo: { phonePrefix?: string; phone?: string }): string {
        const prefix = (basicInfo.phonePrefix || '').trim();
        const phone = (basicInfo.phone || '').trim();
        if (!phone && !prefix) {
            return '';
        }
        if (!prefix) {
            return phone;
        }
        if (prefix.startsWith('+') || prefix.startsWith('00')) {
            return `${prefix}${phone}`;
        }
        return `+${prefix}${phone}`;
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

    private isControlComplete(control: AbstractControl, controlName?: string): boolean {
        if (controlName === 'isGold') {
            return true;
        }

        if (control instanceof FormGroup) {
            return Object.keys(control.controls).every(key =>
                this.isControlComplete(control.controls[key], key)
            );
        }

        if (control instanceof FormArray) {
            return control.controls.every(item => this.isControlComplete(item));
        }

        return this.isValueFilled(control.value);
    }

    private isValueFilled(value: unknown): boolean {
        if (value === null || value === undefined) {
            return false;
        }

        if (typeof value === 'string') {
            return value.trim().length > 0;
        }

        if (typeof value === 'number') {
            return !Number.isNaN(value);
        }

        if (Array.isArray(value)) {
            return value.length > 0;
        }

        return true;
    }

    checkFormStatus(): void {
        console.log('=== 🔍 FORM DETAILED STATUS ===\n');
        
        // Overall form status
        console.log('📋 OVERALL');
        console.log('Form Status:', this.profileForm?.status);
        console.log('Form Valid:', this.profileForm?.valid);
        console.log('Has Main Image:', !!this.profile.profileImage);
        console.log('isProfileComplete:', this.isProfileComplete);
        
        console.log('\n--- 📝 BASICINFO FIELDS ---');
        const basicInfoGroup = this.profileForm?.get('basicInfo') as FormGroup;
        if (basicInfoGroup) {
            Object.keys(basicInfoGroup.controls).forEach(key => {
                const ctrl = basicInfoGroup.get(key);
                const hasError = !ctrl?.valid;
                console.log(`${hasError ? '❌' : '✅'} ${key}: valid=${ctrl?.valid}, errors=${JSON.stringify(ctrl?.errors)}, value="${ctrl?.value}"`);
            });
        }
        
        console.log('\n--- 💬 PERSONALDATA FIELDS ---');
        const personalDataGroup = this.profileForm?.get('personalData') as FormGroup;
        if (personalDataGroup) {
            Object.keys(personalDataGroup.controls).forEach(key => {
                const ctrl = personalDataGroup.get(key);
                const hasError = !ctrl?.valid;
                console.log(`${hasError ? '❌' : '✅'} ${key}: valid=${ctrl?.valid}, errors=${JSON.stringify(ctrl?.errors)}, value="${ctrl?.value}"`);
            });
        }
        
        console.log('\n--- 🎯 VALIDATION CHECK ---');
        console.log('publicName:', this.profileForm?.get('basicInfo.publicName')?.valid ?? false);
        console.log('email:', this.profileForm?.get('basicInfo.email')?.valid ?? false);
        console.log('description:', this.profileForm?.get('basicInfo.description')?.valid ?? false);
        console.log('country:', this.profileForm?.get('basicInfo.country')?.valid ?? false);
        console.log('city:', this.profileForm?.get('basicInfo.city')?.valid ?? false);
        console.log('phone:', this.profileForm?.get('basicInfo.phone')?.valid ?? false);
        console.log('gender:', this.profileForm?.get('personalData.gender')?.valid ?? false);
        console.log('orientation:', this.profileForm?.get('personalData.orientation')?.valid ?? false);
        console.log('birthDate VALID:', this.profileForm?.get('personalData.birthDate')?.valid ?? false);
        console.log('birthDate ERRORS:', this.profileForm?.get('personalData.birthDate')?.errors);
        console.log('birthDate VALUE:', this.profileForm?.get('personalData.birthDate')?.value);
        console.log('nationality:', this.profileForm?.get('personalData.nationality')?.valid ?? false);
        console.log('height:', this.profileForm?.get('personalData.height')?.valid ?? false);
        console.log('hairColor:', this.profileForm?.get('personalData.hairColor')?.valid ?? false);
        console.log('eyeColor:', this.profileForm?.get('personalData.eyeColor')?.valid ?? false);
        console.log('weight:', this.profileForm?.get('personalData.weight')?.valid ?? false);
        console.log('languages VALID:', this.profileForm?.get('personalData.languages')?.valid ?? false);
        console.log('languages VALUE:', this.profileForm?.get('personalData.languages')?.value);
        
        console.log('\n================================');
    }

    async saveProfile() {
                if (!this.paymentCompleted && !this.pendingWhatsAppPayment) {
                    this.toastService.showToast(
                        'error',
                        this.translate.instant('PROFILE_FORM.TOAST_PAYPAL_REQUIRED')
                    );
                    this.showPlanModal = true;
                    return;
                }
                if (this.pendingWhatsAppPayment) {
                    this.toastService.showToast(
                        'info',
                        this.translate.instant('PROFILE_FORM.TOAST_WHATSAPP_PENDING'),
                        'error',
                        10
                    );
                }
                // Validar que haya un plan seleccionado
                if (!this.selectedPlanId) {
                    this.toastService.showToast(
                        'error',
                        this.translate.instant('PROFILE_FORM.TOAST_PLAN_REQUIRED')
                    );
                    return;
                }

                if (this.profileForm.invalid) {
                  this.profileForm.markAllAsTouched();
                  return;
                }

                try {

                        this.loading = true;
                            const objectId = this.clientData?._id || this.userId;
                            const uploadFolder = this.getUploadFolder(objectId);

                            /* =========================
                                1️⃣ SUBIR FOTO PRINCIPAL
                            ========================== */

                        let mainImageUpload$: any = of(null);

                        if (this.mainImageFile) {
                            mainImageUpload$ = this.cloudinaryService
                                .uploadImage(this.mainImageFile, uploadFolder);
                        }

                        /* =========================
                             2️⃣ SUBIR GALERÍA EN PARALELO
                        ========================== */

                        let galleryUpload$: any = of([]);

                        if (this.galleryFiles.length > 0) {

                                const uploadsArray$ = this.galleryFiles.map(file =>
                                    this.cloudinaryService.uploadImage(file, uploadFolder)
                                );

                                galleryUpload$ = forkJoin(uploadsArray$);
                        }

                        /* =========================
                             3️⃣ EJECUTAR TODO EN PARALELO
                        ========================== */

                        const [mainResult, galleryResults]: any = await firstValueFrom(
                                forkJoin([mainImageUpload$, galleryUpload$])
                        );

                        /* =========================
                             4️⃣ EXTRAER URLS
                        ========================== */

                        const mainImage = mainResult?.secure_url && mainResult?.public_id
                            ? { url: mainResult.secure_url, public_id: mainResult.public_id }
                            : undefined;

                        const galleryImages = galleryResults.length
                            ? galleryResults
                                .filter((res: any) => res?.secure_url && res?.public_id)
                                .map((res: any) => ({ url: res.secure_url, public_id: res.public_id }))
                            : [];

                        /* =========================
                             5️⃣ CONSTRUIR PAYLOAD
                        ========================== */

                        const basicInfo = this.profileForm.get('basicInfo')?.value || {};
                        const personalData = this.profileForm.get('personalData')?.value || {};

                        const availabilityList = this.formatAvailabilityList(this.availabilitySlots.value || []);

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
                                phone: this.getPhoneWithPrefix(basicInfo),
                                country: basicInfo.country || '',
                                city: basicInfo.city || '',
                                zone: basicInfo.zone || '',
                                availability: availabilityList,
                                gender: personalData.gender || '',
                                orientation: personalData.orientation || '',
                                alcohol: personalData.alcohol || 'No',
                                cigarette: personalData.cigarette || 'No',
                                isActiveProfile: this.paymentCompleted && !this.pendingWhatsAppPayment,
                                isVerify: false,
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
                                imagesGallery: galleryImages
                        };

                        console.log('Payload a enviar:', profilePayload);

                        this.profileService.createProfile(profilePayload).subscribe({
                                next: (response) => {
                                        console.log('Perfil creado:', response);
                                const createdProfile = response?.profile ?? response;
                                const storedProfileId = createdProfile?._id || response?.profileId;
                                if (storedProfileId) {
                                    localStorage.setItem('profileId', storedProfileId);
                                }
                                
                                // 6️⃣ GUARDAR DATOS REALES (KYC) SI TIENEN DOCUMENTO
                                this.saveKYCData(objectId).catch((kycError) => {
                                    console.warn('KYC guardado parcialmente con error:', kycError);
                                });

                                this.loading = false;
                                this.pendingWhatsAppPayment = false;
                                this.ngZone.run(() => {
                                    this.router.navigate(['/home']);
                                });
                                },
                                error: (error) => {
                                        console.error('Error creando perfil:', error);
                                        this.loading = false;
                                }
                        });

                } catch (error) {

                        console.error('Error subiendo imágenes:', error);
                        this.loading = false;

                }
        }

    private async saveKYCData(userId: string): Promise<void> {
        const realData = this.profileForm.get('realData')?.value || {};
        const realName = realData.realName || '';
        
        // Si no hay documento seleccionado, no hacer nada
        const documentFile = this.documentFrontFile || this.documentBackFile || this.passportFile;
        if (!documentFile) {
            console.log('No hay documento KYC para guardar');
            return;
        }

        try {
            // 1️⃣ CREAR CARPETA KYC CON FORMATO JERÁRQUICO: kyc/[nombre-real-usuario]+[id]
            const slugifiedName = this.slugifyName(realName);
            const kycFolder = `kyc/${slugifiedName}+${userId}`;

            // 2️⃣ SUBIR IMAGEN A CLOUDINARY
            console.log('Subiendo documento KYC a carpeta:', kycFolder);
            const documentUpload: any = await firstValueFrom(
                this.cloudinaryService.uploadImage(documentFile, kycFolder)
            );

            if (!documentUpload?.secure_url || !documentUpload?.public_id) {
                throw new Error('Error al subir documento KYC a Cloudinary');
            }

            // 3️⃣ PREPARAR PAYLOAD PARA API KYC
            const kycPayload: IKYCCreateRequest = {
                userId: userId,
                fullName: realName,
                age: realData.realAge || null,
                nationality: realData.realNationality || '',
                phone: realData.contactPhone || '',
                email: realData.email || '',
                documentImage: {
                    url: documentUpload.secure_url,
                    public_id: documentUpload.public_id
                }
            };

            console.log('Payload KYC:', kycPayload);

            // 4️⃣ LLAMAR A LA API /api/profiles/createKYC
            const kycResponse = await firstValueFrom(
                this.profileService.createKYC(kycPayload)
            );

        } catch (error) {
            console.error('Error al guardar KYC:', error);
            this.toastService.showToast(
                'warning',
                this.translate.instant('PROFILE_FORM.TOAST_KYC_WARNING')
            );
            throw error;
        }
    }
}