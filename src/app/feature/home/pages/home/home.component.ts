import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import EmblaCarousel, { EmblaCarouselType, EmblaOptionsType } from 'embla-carousel';
import { EmblaItem } from '../../components/banner-carousel/banner-carousel.component';
import { Router } from '@angular/router';
import { delay, Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { LoaderService } from '../../../../shared/services/loader/loader.service';
import { ProfileService } from '../../../../shared/services/profile/profile.service';
import { WarningDialogComponent } from '../../../../shared/components/warning-dialog/warning-dialog.component';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
    @ViewChild('emblaRef') emblaRef!: ElementRef<HTMLDivElement>;
    loaderSubscription: Subscription = new Subscription;
    public loader = true;
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

    constructor(
        private route: Router,
        private loaderService: LoaderService,
        private dialog: MatDialog,
        private profileService: ProfileService
    ) { }

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
        if (this.loaderSubscription) {
            this.loaderSubscription.unsubscribe();
        }
    }

    prevSlide(): void {
        if (this.embla) this.embla.scrollPrev();
    }

    nextSlide(): void {
        if (this.embla) this.embla.scrollNext();
    }

    ngOnInit(): void {
        this.profileService.getAllProfiles().subscribe({
            next: (response) => {
                this.anunciantes = response?.profiles ?? response ?? [];
            },
            error: (error) => {
                console.error('Error cargando perfiles:', error);
                this.anunciantes = [];
            }
        });
        this.showLoader();
        setTimeout(() => {
            this.showWarningDialog();
        }, 1000);
    }

    showLoader() {
        this.loaderSubscription = this.loaderService.getLoaderState().pipe(delay(0)).subscribe(
            (response: any) => {
                this.loader = !!response?.state;
            }
        )
    }

    showWarningDialog() {
        const consent = localStorage.getItem('adult-consent');
        if (!consent) {
            this.dialog.open(WarningDialogComponent, {
                disableClose: true,
                panelClass: 'adult-dialog-panel',
                autoFocus: false
            });
        }
    }

    goToProfile(id: string) {
        this.route.navigate(['/profile', id]);
    }

}