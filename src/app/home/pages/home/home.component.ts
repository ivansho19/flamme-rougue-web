import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import EmblaCarousel, { EmblaCarouselType, EmblaOptionsType } from 'embla-carousel';
import { EmblaItem } from '../../components/banner-carousel/banner-carousel.component';
import { Router } from '@angular/router';
import { delay, Subscription } from 'rxjs';
import { LoaderService } from '../../../shared/services/loader/loader.service';
import { WarningDialogComponent } from '../../../shared/components/warning-dialog/warning-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
    @ViewChild('emblaRef') emblaRef!: ElementRef<HTMLDivElement>;
    loaderSubscription: Subscription = new Subscription;
    public loader: any = true;
    embla!: EmblaCarouselType;
    autoplayInterval: any;
    anunciantes: any[] = [];
    destacados: any[] = [];
    carouselItems: EmblaItem[] = [
        {
            images: [
                'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
                'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=400&q=80'
            ],
            title: 'Room for rent in KNOKKE - beach',
            description: 'Beautiful luxury apartment. For ladies with good remuneration for services, because the apartment is in Zoute, businessmen',
            phone: '00471966107',
            buttonText: 'LEES MEER',
            buttonUrl: '/detalle'
        },
        {
            images: [
                'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
                'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80'
            ],
            title: 'Modern apartment with sea view',
            description: 'Enjoy a stunning view and modern amenities. Perfect for relaxing stays.',
            phone: '003212345678',
            buttonText: 'LEES MEER',
            buttonUrl: '/detalle'
        },
        {
            images: [
                'https://images.unsplash.com/photo-1464790719320-516ecd75af6c?auto=format&fit=crop&w=400&q=80',
                'https://images.unsplash.com/photo-1464790719320-516ecd75af6c?auto=format&fit=crop&w=400&q=80'
            ],
            title: 'Luxury Suite in Downtown',
            description: 'Top location, exclusive design and comfort for executives and couples.',
            phone: '003298765432',
            buttonText: 'LEES MEER',
            buttonUrl: '/detalle'
        },
        {
            images: [
                'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=400&q=80',
                'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=400&q=80'
            ],
            title: 'Beachfront Cozy Studio',
            description: 'Cozy, small and full of light. Steps away from the sand!',
            phone: '003234567890',
            buttonText: 'LEES MEER',
            buttonUrl: '/detalle'
        }
        // ...puedes agregar más con otros links de Unsplash o tu preferencia
    ];

    constructor(private route: Router, private loaderService: LoaderService, private dialog: MatDialog) { }

    ngAfterViewInit(): void {
        const options: EmblaOptionsType = { loop: true, align: 'center' };
        this.embla = EmblaCarousel(this.emblaRef?.nativeElement, options);

        // Autoplay cada 4s
        this.autoplayInterval = setInterval(() => {
            if (this.embla) this.embla.scrollNext();
        }, 4000);
    }

    ngOnDestroy(): void {
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
        }
    }

    prevSlide(): void {
        if (this.embla) this.embla.scrollPrev();
    }

    nextSlide(): void {
        if (this.embla) this.embla.scrollNext();
    }

    ngOnInit(): void {
        // Mocks de anunciantes
        this.anunciantes = [
            {
                nombre: 'Ana López',
                descripcion: 'Modelo profesional con experiencia en pasarela.',
                age: 28,
                img: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&w=400&h=400&fit=crop'
            },
            {
                nombre: 'María García',
                descripcion: 'Modelo independiente para campañas digitales.',
                age: 30,
                img: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&w=400&h=400&fit=crop'
            },
            {
                nombre: 'Lucía Fernández',
                descripcion: 'Anunciante de moda y belleza.',
                age: 25,
                img: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&w=400&h=400&fit=crop'
            },
            {
                nombre: 'Gabriela Torres',
                descripcion: 'Fotógrafa con experiencia internacional.',
                age: 32,
                img: 'https://images.pexels.com/photos/247322/pexels-photo-247322.jpeg?auto=compress&w=400&h=400&fit=crop'
            },
            {
                nombre: 'Paula Martínez',
                descripcion: 'Modelo profesional de eventos.',
                age: 27,
                img: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&w=400&h=400&fit=crop'
            },
            {
                nombre: 'Carla Suárez',
                descripcion: 'Influencer y modelo digital.',
                age: 29,
                img: 'https://images.pexels.com/photos/2100063/pexels-photo-2100063.jpeg?auto=compress&w=400&h=400&fit=crop'
            },
            {
                nombre: 'Natalia Vega',
                descripcion: 'Actriz y modelo de comerciales.',
                age: 35,
                img: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&w=400&h=400&fit=crop'
            },
            {
                nombre: 'Sofía Castro',
                descripcion: 'Modelo y presentadora de TV.',
                age: 33,
                img: 'https://images.pexels.com/photos/1130624/pexels-photo-1130624.jpeg?auto=compress&w=400&h=400&fit=crop'
            },
            {
                nombre: 'Julia Morales',
                descripcion: 'Modelo fitness y entrenadora personal.',
                age: 26,
                img: 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&w=400&h=400&fit=crop'
            },
            {
                nombre: 'Camila Ríos',
                descripcion: 'Modelo y actriz de teatro.',
                age: 31,
                img: 'https://images.pexels.com/photos/2100060/pexels-photo-2100060.jpeg?auto=compress&w=400&h=400&fit=crop'
            },
            {
                nombre: 'Valentina Cruz',
                descripcion: 'Modelo internacional de pasarela.',
                age: 29,
                img: 'https://images.pexels.com/photos/247295/pexels-photo-247295.jpeg?auto=compress&w=400&h=400&fit=crop'
            },
            {
                nombre: 'Elena Ramírez',
                descripcion: 'Especialista en publicidad y modelo digital.',
                age: 34,
                img: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&w=400&h=400&fit=crop'
            }
        ];
        this.showLoader();
        setTimeout(() => {
            this.loader = false;
            this.showWarningDialog();
        }, 1000);

    }

    showLoader() {
        this.loaderSubscription = this.loaderService.getLoaderState().pipe(delay(0)).subscribe(
            (response: any) => {
                this.loader = response
            }
        )
    }

    showWarningDialog() {
        const consent = localStorage.getItem('adult-consent');
        if (!consent) {
            this.dialog.open(WarningDialogComponent, {
                disableClose: true,
                panelClass: 'adult-dialog-panel'
            });
        }
    }

}