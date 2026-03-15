import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CloudinaryService } from '../shared/services/cloudinary/cloudinary.service';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { firstValueFrom, forkJoin, of } from 'rxjs';
import { PlanOption } from '../shared/components/planes/planes.component';
import { ProfilePreviewData } from '../shared/components/profile-preview/profile-preview.component';

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
    userId: string = '123'; // Reemplaza con el ID real del usuario

    profileForm!: FormGroup;

    selectedPlanId: string | null = null;
    selectedPlan: PlanOption | null = null;

    isDraggingMain = false;
    isDraggingGallery = false;
    @ViewChild('mainInput') mainInput!: ElementRef<HTMLInputElement>;
    @ViewChild('galleryInput') galleryInput!: ElementRef<HTMLInputElement>;

    constructor(private cloudinaryService: CloudinaryService, private route: ActivatedRoute, private http: HttpClient, private fb: FormBuilder) { }

    ngOnInit() {
        this.initForm();
        this.route.paramMap.subscribe(params => {
            this.profileId = params.get('id')!;
            this.getProfile();
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
            });
    }

    initForm() {
        this.profileForm = this.fb.group({
            basicInfo: this.fb.group({
                publicName: ['', Validators.required],
                description: [''],
                city: [''],
                phone: [''],
                availability: ['']
            }),

            personalData: this.fb.group({
                gender: [''],
                age: [null],
                nationality: [''],
                height: [null],
                hairColor: [''],
                eyeColor: [''],
                weight: [null]
            }),

            languages: [''],

            isGold: [false]
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

        return {
            name: basicInfo.publicName || 'Perfil',
            subtitleLabel: 'Ciudad',
            subtitleValue: basicInfo.city || '',
            phone: basicInfo.phone || '',
            availability: basicInfo.availability || '',
            bio: basicInfo.description || '',
            gender: personalData.gender || '',
            hairColor: personalData.hairColor || '',
            age: personalData.age,
            eyeColor: personalData.eyeColor || '',
            nationality: personalData.nationality || '',
            languages: this.profileForm.get('languages')?.value || '',
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
        debugger;
//   if (this.profileForm.invalid) {
//     this.profileForm.markAllAsTouched();
//     return;
//   }

  try {

    this.loading = true;

    /* =========================
       1️⃣ SUBIR FOTO PRINCIPAL
    ========================== */

    let mainImageUpload$: any = of(null);

    if (this.mainImageFile) {
      mainImageUpload$ = this.cloudinaryService
        .uploadImage(this.mainImageFile, this.userId);
    }

    /* =========================
       2️⃣ SUBIR GALERÍA EN PARALELO
    ========================== */

    let galleryUpload$: any = of([]);

    if (this.galleryFiles.length > 0) {

      const uploadsArray$ = this.galleryFiles.map(file =>
        this.cloudinaryService.uploadImage(file, this.userId)
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

    const mainImageUrl = mainResult?.secure_url || this.profile.profileImage;

    const galleryUrls = galleryResults.length
      ? galleryResults.map((res: any) => res.secure_url)
      : [];

    /* =========================
       5️⃣ CONSTRUIR OBJETO FINAL
    ========================== */

        const finalProfile = {
            ...this.profileForm.value,
            profileImage: mainImageUrl,
            galleryImages: galleryUrls,
            planId: this.selectedPlanId
        };

    console.log('Perfil final:', finalProfile);

    // 👉 Aquí haces tu POST o PUT real

    this.loading = false;

  } catch (error) {

    console.error('Error subiendo imágenes:', error);
    this.loading = false;

  }
}


}