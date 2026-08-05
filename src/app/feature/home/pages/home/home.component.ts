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
import { resolveProfileId } from '../../../../shared/clases/resolveProfileId';
import { buildProfileUrl, getProfileRouterCommands } from '../../../../shared/clases/profileSlug';

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
                autoFocus: false,
                maxWidth: 'calc(100vw - 1rem)',
                maxHeight: 'calc(100dvh - 1rem)',
                width: '420px'
            });
        }
    }

    goToProfile(card: any) {
        this.route.navigate(getProfileRouterCommands(card));
    }

    getProfileUrl(card: any): string {
        return buildProfileUrl(card);
    }

    /** Short name for the card heading (never the full SEO string). */
    getCardName(card: any): string {
        const explicit =
            card?.name ||
            card?.publicName ||
            (card?.title && card?.displayName && card.title !== card.displayName
                ? card.displayName
                : '');

        if (explicit) {
            return this.shortenName(String(explicit));
        }

        return this.shortenName(String(card?.displayName || card?.title || ''));
    }

    /** Advertiser headline; hidden when it would duplicate the name. */
    getCardAdTitle(card: any): string {
        const name = this.getCardName(card).trim().toLowerCase();
        const headline = String(
            card?.title ||
            card?.adTitle ||
            card?.displayName ||
            ''
        ).trim();

        if (!headline) {
            return '';
        }

        if (headline.toLowerCase() === name) {
            return '';
        }

        return headline;
    }

    private shortenName(raw: string): string {
        const value = (raw || '').trim();
        if (!value) {
            return '';
        }

        const beforeSep = value.split(/[,|–—]/)[0]?.trim() || value;
        const words = beforeSep.split(/\s+/).filter(Boolean);

        // SEO titles often start with the given name then role/location.
        if (words.length > 3) {
            return words[0];
        }

        return beforeSep;
    }

    private mapTopRojoToCarouselItems(tops: any[]): EmblaItem[] {
        if (!Array.isArray(tops)) {
            return [];
        }

        return tops.map((top) => {
            const profileId = resolveProfileId(top?.profileId);
            const profileRef = {
                displayName: top?.displayName || top?.title || top?.name,
                title: top?.title,
                _id: profileId
            };

            return {
                images: Array.isArray(top?.images)
                    ? top.images.map((img: any) => img?.url).filter(Boolean)
                    : [],
                title: top?.title || 'TOP ROJO',
                description: top?.description || '',
                phone: top?.contactPhone || '',
                buttonText: profileId ? 'Ver perfil' : undefined,
                buttonUrl: profileId ? buildProfileUrl(profileRef) : undefined
            };
        });
    }

}