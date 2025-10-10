import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../service/auth.service';
import { IAuthRequest } from '../../models/IAuth.model';

interface Country {
    code: string;
    name: string;
    cities: string[];
}

@Component({
    selector: 'app-advertisers-register-form',
    standalone: false,
    templateUrl: './advertisers-register-form.component.html',
    styleUrls: ['./advertisers-register-form.component.scss']
})
export class AdvertisersRegisterFormComponent implements OnInit {
    countries: Country[] = [];
    cities: string[] = [];
    anuncianteForm: FormGroup;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private authService: AuthService
    ) {
        this.anuncianteForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            lastName: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]],
            country: ['', [Validators.required]],
            city: ['', [Validators.required]],
            phone: ['', [Validators.required, Validators.minLength(7), Validators.pattern('^[0-9]+$')]],
            gender: ['', [Validators.required, Validators.minLength(2)]],
        }, {
            validators: this.passwordMatchValidator
        });
    }
    ngOnInit(): void {
        this.getCountries();
    }

    passwordMatchValidator(form: FormGroup) {
        const password = form.get('password');
        const confirmPassword = form.get('confirmPassword');

        if (password && confirmPassword && password.value !== confirmPassword.value) {
            confirmPassword.setErrors({ passwordMismatch: true });
        } else {
            confirmPassword?.setErrors(null);
        }

        return null;
    }

    onCountryChange(event: Event) {
        const code = (event.target as HTMLSelectElement).value;
        const found = this.countries.find(c => c.code === code);
        this.cities = found ? found.cities : [];
        this.anuncianteForm.get('city')?.setValue('');
    }

    onSubmitUser() {
        const { name, lastName, email, password, gender, city, country, phone } = this.anuncianteForm.value;
        if (this.anuncianteForm.valid) {
            // Aquí iría la lógica de registro
            const req: IAuthRequest = { 
                name,
                lastName,
                email,
                password,
                country,
                city,
                gender,
                phone
            }
            this.authService.registerClient(req).subscribe({
                next: (response) => {
                    console.log('Registro exitoso:', response);
                    localStorage.setItem('token', response.token);
                    localStorage.setItem('user', JSON.stringify(response.name));
                    this.router.navigate(['/home']); // Redirige a la página de inicio después del registro
                },
                error: (error) => {
                    console.error('Error en el registro:', error);
                }
            });
        }
    }

    get name() {
        return this.anuncianteForm.get('name');
    }

    get email() {
        return this.anuncianteForm.get('email');
    }

    get password(): FormControl {
        return this.anuncianteForm.get('password') as FormControl;
    }

    get confirmPassword(): FormControl {
        return this.anuncianteForm.get('confirmPassword') as FormControl;
    }

    getCountries() {
        this.countries = [
            { code: 'US', name: 'United States', cities: ['New York', 'Los Angeles', 'Chicago', 'Miami', 'Houston'] },
            { code: 'CA', name: 'Canada', cities: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'] },
            { code: 'MX', name: 'Mexico', cities: ['Ciudad de México', 'Guadalajara', 'Monterrey', 'Cancún', 'Tijuana'] },
            { code: 'AR', name: 'Argentina', cities: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata'] },
            { code: 'BR', name: 'Brazil', cities: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza'] },
            { code: 'GB', name: 'United Kingdom', cities: ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Edinburgh'] },
            { code: 'FR', name: 'France', cities: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice'] },
            { code: 'DE', name: 'Germany', cities: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne'] },
            { code: 'ES', name: 'Spain', cities: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Bilbao'] },
            { code: 'IT', name: 'Italy', cities: ['Rome', 'Milan', 'Naples', 'Turin', 'Florence'] },
            { code: 'RU', name: 'Russia', cities: ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Kazan'] },
            { code: 'CN', name: 'China', cities: ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu'] },
            { code: 'JP', name: 'Japan', cities: ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Sapporo'] },
            { code: 'KR', name: 'South Korea', cities: ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon'] },
            { code: 'IN', name: 'India', cities: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai'] },
            { code: 'AU', name: 'Australia', cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'] },
            { code: 'ZA', name: 'South Africa', cities: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth'] },
            { code: 'EG', name: 'Egypt', cities: ['Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said'] },
            { code: 'TR', name: 'Turkey', cities: ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Adana'] },
            { code: 'SA', name: 'Saudi Arabia', cities: ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam'] },
            { code: 'AE', name: 'United Arab Emirates', cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Al Ain', 'Ajman'] },
            { code: 'TH', name: 'Thailand', cities: ['Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya', 'Hat Yai'] },
            { code: 'ID', name: 'Indonesia', cities: ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Bekasi'] },
            { code: 'SG', name: 'Singapore', cities: ['Singapore'] },
            { code: 'MY', name: 'Malaysia', cities: ['Kuala Lumpur', 'George Town', 'Johor Bahru', 'Ipoh', 'Shah Alam'] },
            { code: 'PH', name: 'Philippines', cities: ['Manila', 'Quezon City', 'Cebu City', 'Davao City', 'Zamboanga City'] },
            { code: 'VN', name: 'Vietnam', cities: ['Hanoi', 'Ho Chi Minh City', 'Da Nang', 'Hai Phong', 'Can Tho'] },
            { code: 'PK', name: 'Pakistan', cities: ['Karachi', 'Lahore', 'Faisalabad', 'Rawalpindi', 'Multan'] },
            { code: 'BD', name: 'Bangladesh', cities: ['Dhaka', 'Chittagong', 'Khulna', 'Rajshahi', 'Comilla'] },
            { code: 'NG', name: 'Nigeria', cities: ['Lagos', 'Kano', 'Ibadan', 'Abuja', 'Port Harcourt'] },
            { code: 'KE', name: 'Kenya', cities: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'] },
            { code: 'CO', name: 'Colombia', cities: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena'] },
            { code: 'CL', name: 'Chile', cities: ['Santiago', 'Valparaíso', 'Concepción', 'La Serena', 'Antofagasta'] },
            { code: 'PE', name: 'Peru', cities: ['Lima', 'Arequipa', 'Trujillo', 'Chiclayo', 'Piura'] },
            { code: 'VE', name: 'Venezuela', cities: ['Caracas', 'Maracaibo', 'Maracay', 'Valencia', 'Barquisimeto'] },
            { code: 'UY', name: 'Uruguay', cities: ['Montevideo', 'Salto', 'Paysandú', 'Las Piedras', 'Rivera'] },
            { code: 'EC', name: 'Ecuador', cities: ['Quito', 'Guayaquil', 'Cuenca', 'Santo Domingo', 'Machala'] },
            { code: 'BO', name: 'Bolivia', cities: ['Santa Cruz', 'La Paz', 'Cochabamba', 'Sucre', 'Oruro'] },
            { code: 'PY', name: 'Paraguay', cities: ['Asunción', 'Ciudad del Este', 'San Lorenzo', 'Luque', 'Capiatá'] },
            { code: 'CR', name: 'Costa Rica', cities: ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Puntarenas'] },
            { code: 'PA', name: 'Panama', cities: ['Panama City', 'San Miguelito', 'Tocumen', 'David', 'Arraiján'] },
            { code: 'CU', name: 'Cuba', cities: ['Havana', 'Santiago de Cuba', 'Camagüey', 'Holguín', 'Santa Clara'] },
            { code: 'DO', name: 'Dominican Republic', cities: ['Santo Domingo', 'Santiago', 'La Romana', 'San Pedro', 'San Francisco'] },
            { code: 'PR', name: 'Puerto Rico', cities: ['San Juan', 'Bayamón', 'Carolina', 'Ponce', 'Caguas'] },
            { code: 'IL', name: 'Israel', cities: ['Tel Aviv', 'Jerusalem', 'Haifa', 'Rishon LeZion', 'Petah Tikva'] },
            { code: 'IR', name: 'Iran', cities: ['Tehran', 'Mashhad', 'Isfahan', 'Karaj', 'Shiraz'] },
            { code: 'IQ', name: 'Iraq', cities: ['Baghdad', 'Basra', 'Mosul', 'Erbil', 'Kirkuk'] },
            { code: 'UA', name: 'Ukraine', cities: ['Kyiv', 'Kharkiv', 'Odesa', 'Dnipro', 'Donetsk'] },
            { code: 'PL', name: 'Poland', cities: ['Warsaw', 'Kraków', 'Łódź', 'Wrocław', 'Poznań'] },
            { code: 'SE', name: 'Sweden', cities: ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Västerås'] },
            { code: 'NO', name: 'Norway', cities: ['Oslo', 'Bergen', 'Stavanger', 'Trondheim', 'Drammen'] }
        ];
    }

}
