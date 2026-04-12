import { Component, EventEmitter, Input, Output, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { CloudinaryService } from '../../../../shared/services/cloudinary/cloudinary.service';
import { ToastService } from '../../../../shared/services/toast/toast.service';
import { TOP_ROJO_PLANS } from '../../../../shared/models/top-rojo.model';
import { GetCountries } from '../../../../shared/clases/getCountries';
import { Country } from '../../../../shared/model/country.model';
import { TopRojoPlanOption } from '../plan-selection-modal-top-rojo/plan-selection-modal-top-rojo.component';

@Component({
  selector: 'app-create-top-rojo-form',
  templateUrl: './create-top-rojo-form.component.html',
  styleUrls: ['./create-top-rojo-form.component.scss'],
  animations: [
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class CreateTopRojoFormComponent implements OnInit {
  @Input() isOpen = false;
  @Input() profileName = '';
  @Input() profileId = '';
  @Input() defaultCountry = '';
  @Input() defaultCity = '';
  
  @Output() close = new EventEmitter<void>();
  @Output() formComplete = new EventEmitter<any>();
  @Output() planSelected = new EventEmitter<{ formData: any; plan: TopRojoPlanOption }>();

  @ViewChild('photoInput1') photoInput1!: ElementRef<HTMLInputElement>;
  @ViewChild('photoInput2') photoInput2!: ElementRef<HTMLInputElement>;

  topRojoForm!: FormGroup;
  
  // Photo handling
  photo1File: File | null = null;
  photo2File: File | null = null;
  photo1Preview: string | null = null;
  photo2Preview: string | null = null;

  // Step control
  currentStep: 'form' | 'plan' = 'form';
  showPlanModal = false;

  // Upload progress
  isUploading = false;
  uploadProgress = 0;

  // Plans
  plans = TOP_ROJO_PLANS;

  // Countries and cities
  countries: Country[] = [];
  cities: string[] = [];

  constructor(
    private fb: FormBuilder,
    private cloudinaryService: CloudinaryService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    console.log('[CreateTopRojoForm] ngOnInit iniciado');
    console.log('  - defaultCountry (input):', this.defaultCountry);
    console.log('  - defaultCity (input):', this.defaultCity);
    
    this.countries = GetCountries.getAllCountries();
    console.log('  - Total de países cargados:', this.countries.length);
    
    this.initForm();
    console.log('  - Formulario inicializado, valores:', this.topRojoForm.value);
    
    // Suscribirse a cambios del form para debuguear
    this.topRojoForm.valueChanges.subscribe((values) => {
      console.log('[CreateTopRojoForm] Form values changed:', values);
    });
    
    // Si hay un país por defecto, cargar sus ciudades
    if (this.defaultCountry) {
      console.log('  - Cargando ciudades para país:', this.defaultCountry);
      this.onCountryChange(this.defaultCountry);
      console.log('  - Ciudades cargadas:', this.cities.length);
    } else {
      console.log('  - NO hay defaultCountry, ciudades no cargadas');
    }
  }

  initForm(): void {
    this.topRojoForm = this.fb.group({
      country: [this.defaultCountry || '', Validators.required],
      city: [{value: this.defaultCity || '', disabled: !this.cities.length}, Validators.required],
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9\s\-\+\(\)]{7,}$/)]]
    });
  }

  /**
   * Manejar cambio de país para cargar ciudades
   */
  onCountryChange(countryValue: string): void {
    console.log('[CreateTopRojoForm] onCountryChange - Valor recibido:', countryValue);
    
    if (!countryValue) {
      console.log('  - Valor vacío, limpiando ciudades')
      this.cities = [];
      this.topRojoForm.get('city')?.disable();
      this.topRojoForm.patchValue({ city: '' });
      return;
    }

    const found = this.countries.find(country =>
      country.code === countryValue || country.name === countryValue
    );

    console.log('  - País encontrado:', found ? found.name + ' (' + found.code + ')' : 'NO ENCONTRADO');
    console.log('  - Ciudades disponibles:', found ? found.cities.length : 0);
    
    this.cities = found ? found.cities : [];
    
    if (this.cities.length > 0) {
      this.topRojoForm.get('city')?.enable();
    } else {
      this.topRojoForm.get('city')?.disable();
    }
    
    this.topRojoForm.patchValue({ city: '' });
    
    console.log('  - Array cities actualizado:', this.cities);
  }

  /**
   * Abrir selector de fotos
   */
  openPhotoSelector(photoNumber: 1 | 2): void {
    if (photoNumber === 1) {
      this.photoInput1.nativeElement.click();
    } else {
      this.photoInput2.nativeElement.click();
    }
  }

  /**
   * Manejar selección de foto
   */
  onPhotoSelected(event: any, photoNumber: 1 | 2): void {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      this.toastService.showToast('error', 'Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.toastService.showToast('error', 'La imagen no debe superar 5MB');
      return;
    }

    if (photoNumber === 1) {
      this.photo1File = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.photo1Preview = reader.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      this.photo2File = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.photo2Preview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Validar que el formulario esté completocon las fotos
   */
  isFormValid(): boolean {
    const isValid = !!(this.topRojoForm.valid && this.photo1File && this.photo2File);
    
    if (!isValid) {
      console.log('[CreateTopRojoForm] isFormValid = FALSE, detalles:');
      console.log('  - form.valid:', this.topRojoForm.valid);
      console.log('  - form.value:', this.topRojoForm.value);
      console.log('  - photo1File:', !!this.photo1File);
      console.log('  - photo2File:', !!this.photo2File);
      
      // Analizar cada control
      Object.keys(this.topRojoForm.controls).forEach(key => {
        const control = this.topRojoForm.get(key);
        if (control) {
          console.log(`    - ${key}: value="${control.value}" | valid=${control.valid} | errors=${JSON.stringify(control.errors)}`);
        }
      });
    }
    
    return isValid;
  }

  /**
   * Proceder a selección de plan
   */
  proceedToPlanSelection(): void {
    console.log('[CreateTopRojoForm] Validando formulario...');
    console.log('Formulario válido:', this.topRojoForm.valid);
    console.log('Valores del formulario:', this.topRojoForm.value);
    console.log('Errores del formulario:', this.topRojoForm.errors);
    console.log('Foto 1:', this.photo1File ? 'Cargada ✓' : 'NO cargada ✗');
    console.log('Foto 2:', this.photo2File ? 'Cargada ✓' : 'NO cargada ✗');
    console.log('isFormValid():', this.isFormValid());
    
    if (!this.isFormValid()) {
      this.toastService.showToast('error', 'Por favor completa todos los campos y carga las fotos');
      return;
    }
    
    this.showPlanModal = true;
  }

  /**
   * Manejar selección de plan
   */
  onPlanSelected(plan: TopRojoPlanOption): void {
    const formDataToEmit = {
      country: this.topRojoForm.value.country,
      city: this.topRojoForm.value.city,
      title: this.topRojoForm.value.title,
      description: this.topRojoForm.value.description,
      phone: this.topRojoForm.value.phone,
      photo1File: this.photo1File,
      photo2File: this.photo2File
    };

    console.log('[CreateTopRojoForm] onPlanSelected - Emitiendo datos:');
    console.log('FormData:', formDataToEmit);
    console.log('Plan:', plan);
    
    console.log('[CreateTopRojoForm] ESPERANDO respuesta del componente padre antes de resetear...');
    
    this.planSelected.emit({
      formData: formDataToEmit,
      plan: plan
    });
    
    // NO resetear aquí - dejar que el componente padre lo maneje después de la creación exitosa
    // this.resetForm();
  }

  /**
   * Cerrar modal y formulario
   */
  closeForm(): void {
    this.resetForm();
    this.close.emit();
  }

  /**
   * Resetear formulario
   */
  private resetForm(): void {
    this.topRojoForm.reset();
    this.photo1File = null;
    this.photo2File = null;
    this.photo1Preview = null;
    this.photo2Preview = null;
    this.currentStep = 'form';
    this.showPlanModal = false;
    this.uploadProgress = 0;
  }

  /**
   * Método público para que el padre pueda resetear el formulario
   */
  public resetFormFromParent(): void {
    console.log('[CreateTopRojoForm] resetFormFromParent - Reseteando desde componente padre');
    this.resetForm();
  }

  /**
   * Cerrar modal de plan
   */
  closePlanModal(): void {
    this.showPlanModal = false;
  }

  /**
   * Debug: Inspeccionar el estado del formulario (llamar desde la consola)
   */
  debugForm(): void {
    console.log('=== DEBUG FORM STATE ===');
    console.log('Form value:', this.topRojoForm.value);
    console.log('Form valid:', this.topRojoForm.valid);
    console.log('Form dirty:', this.topRojoForm.dirty);
    console.log('Form touched:', this.topRojoForm.touched);
    console.log('photo1File:', this.photo1File);
    console.log('photo2File:', this.photo2File);
    console.log('cities length:', this.cities.length);
    console.log('country value:', this.topRojoForm.get('country')?.value);
    console.log('city value:', this.topRojoForm.get('city')?.value);
    console.log('title value:', this.topRojoForm.get('title')?.value);
    console.log('description value:', this.topRojoForm.get('description')?.value);
    console.log('phone value:', this.topRojoForm.get('phone')?.value);
    console.log('=== END DEBUG ===');
  }

  /**
   * Remover foto
   */
  removePhoto(photoNumber: 1 | 2): void {
    if (photoNumber === 1) {
      this.photo1File = null;
      this.photo1Preview = null;
    } else {
      this.photo2File = null;
      this.photo2Preview = null;
    }
  }
}
