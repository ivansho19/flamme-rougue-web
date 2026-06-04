import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import EmblaCarousel, { EmblaCarouselType, EmblaOptionsType } from 'embla-carousel';
import { EmblaItem } from '../../components/banner-carousel/banner-carousel.component';
import { Router } from '@angular/router';
import { delay, Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { LoaderService } from '../../../../shared/services/loader/loader.service';
import { ProfileService } from '../../../../shared/services/profile/profile.service';
import { TopRojoService } from '../../../../shared/services/top-rojo/top-rojo.service';
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
    carouselItems: EmblaItem[] = [];
    cardsLoading = true;
    skeletonItems = Array.from({ length: 8 });

    constructor(
        private route: Router,
        private loaderService: LoaderService,
        private dialog: MatDialog,
        private profileService: ProfileService,
        private topRojoService: TopRojoService
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
        this.cardsLoading = true;
        this.profileService.getAllProfiles().subscribe({
            next: (response) => {
                this.anunciantes = response?.profiles ?? response ?? [];
                this.cardsLoading = false;
            },
            error: (error) => {
                console.error('Error cargando perfiles:', error);
                this.anunciantes = [];
                this.cardsLoading = false;
            }
        });

        this.topRojoService.getAllTopRojo().subscribe({
            next: (response) => {
                const tops = response?.tops ?? [];
                const mapped = this.mapTopRojoToCarouselItems(tops);
                if (mapped.length > 0) {
                    this.carouselItems = mapped;
                }
            },
            error: (error) => {
                console.error('Error cargando TOP ROJO para banner:', error);
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

    private mapTopRojoToCarouselItems(tops: any[]): EmblaItem[] {
        if (!Array.isArray(tops)) {
            return [];
        }

        return tops.map((top) => ({
            images: Array.isArray(top?.images)
                ? top.images.map((img: any) => img?.url).filter(Boolean)
                : [],
            title: top?.title || 'TOP ROJO',
            description: top?.description || '',
            phone: top?.contactPhone || '',
            buttonText: top?.profileId ? 'Ver perfil' : undefined,
            buttonUrl: top?.profileId ? `/profile/${top.profileId}` : undefined
        }));
    }

}