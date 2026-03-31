import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MatChipListboxChange } from '@angular/material/chips';
import { firstValueFrom, forkJoin, of } from 'rxjs';

import { IProfileCreateRequest } from './models/IProfileCreate.model';
import { PlanOption } from '../../shared/components/planes/planes.component';
import { CloudinaryService } from '../../shared/services/cloudinary/cloudinary.service';
import { AuthService } from '../../auth/service/auth.service';
import { ProfileService } from '../../shared/services/profile/profile.service';
import { GetCountries } from '../../shared/clases/getCountries';
import { ProfilePreviewData } from '../../shared/components/profile-preview/profile-preview.component';
import { GetUserName } from '../../shared/clases/getUserName';

interface Country {
    code: string;
    name: string;
    cities: string[];
}

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

    imageUrl: string | null = null;
    loading = false;
    profileId: string = '';
    profileData: any;
    clientData: any;
    userId: string = '123'; // Reemplaza con el ID real del usuario

    profileForm!: FormGroup;

    selectedPlanId: number | null = null;
    selectedPlan: PlanOption | null = null;

    countries: Country[] = [];
    cities: string[] = [];
    calculatedAge: number | null = null;

    languageOptions = [
        { value: 'inglés', label: 'Inglés' },
        { value: 'belga', label: 'Belga' },
        { value: 'francés', label: 'Francés' },
        { value: 'español', label: 'Español' },
        { value: 'italiano', label: 'Italiano' },
        { value: 'ruso', label: 'Ruso' },
        { value: 'chino', label: 'Chino' },
        { value: 'japonés', label: 'Japonés' }
    ];

    weekDays = [
        { value: 'Lunes', label: 'Lunes' },
        { value: 'Martes', label: 'Martes' },
        { value: 'Miércoles', label: 'Miércoles' },
        { value: 'Jueves', label: 'Jueves' },
        { value: 'Viernes', label: 'Viernes' },
        { value: 'Sábado', label: 'Sábado' },
        { value: 'Domingo', label: 'Domingo' }
    ];

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
        private router: Router
    ) { }

    ngOnInit() {
        this.initForm();
        this.countries = GetCountries.getAllCountries();
        this.route.paramMap.subscribe(params => {
            this.profileId = params.get('id') || '';

            if (this.profileId) {
                this.getProfile();
                return;
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
        this.http.get(`http://localhost:5000/api/users/${this.profileId}`)
            .subscribe(res => {
                this.profileData = res;
                this.userId = this.profileData._id;
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
                description: ['', Validators.required],
                country: ['', Validators.required],
                city: ['', Validators.required],
                phonePrefix: ['+'],
                phone: ['', Validators.required],
                availabilitySlots: this.fb.array([], this.minArrayLengthValidator(1))
            }),

            personalData: this.fb.group({
                gender: ['', Validators.required],
                birthDate: [null, [Validators.required, this.minAgeValidator(18)]],
                age: [null, Validators.required],
                nationality: ['', Validators.required],
                height: [null, Validators.required],
                hairColor: ['', Validators.required],
                eyeColor: ['', Validators.required],
                weight: [null, Validators.required],
                languages: [[], Validators.required]
            }),

            isGold: [false]
        });

        this.profileForm
            .get('personalData.birthDate')
            ?.valueChanges.subscribe(value => this.updateAgeFromBirthDate(value));

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
                languages: Array.isArray(client.languages) ? client.languages : []
            }
        });
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

        return {
            name: basicInfo.publicName || 'Perfil',
            subtitleLabel: 'Ciudad',
            subtitleValue: basicInfo.city || '',
            phone: this.getPhoneWithPrefix(basicInfo),
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
            isGold: this.profileForm.get('isGold')?.value,
            isVerified: true,
            profileImage: this.profile.profileImage,
            galleryImages: this.profile.galleryImages
        };
    }

    get isProfileComplete(): boolean {
        if (!this.profileForm) {
            return false;
        }

        return this.isControlComplete(this.profileForm);
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

    async saveProfile() {
                if (this.profileForm.invalid) {
                  this.profileForm.markAllAsTouched();
                  return;
                }

                try {

                        this.loading = true;
                            const objectId = this.clientData?._id || this.profileId || this.userId;
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

                        const profilePayload: IProfileCreateRequest = {
                                objectId,
                                displayName: basicInfo.publicName || '',
                                bio: basicInfo.description || '',
                            phone: this.getPhoneWithPrefix(basicInfo),
                                city: basicInfo.city || '',
                                availability: availabilityList,
                                gender: personalData.gender || '',
                                age: personalData.age,
                                nationality: personalData.nationality || '',
                                height: personalData.height,
                                weight: personalData.weight,
                                hairColor: personalData.hairColor || '',
                                eyeColor: personalData.eyeColor || '',
                                languages: languagesList,
                                isPremium: this.profileForm.get('isGold')?.value || false,
                                plan: this.selectedPlanId,
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
                                        this.loading = false;
                                        this.router.navigate(['/home']);
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


}