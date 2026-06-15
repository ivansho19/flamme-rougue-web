import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { delay, Subscription } from 'rxjs';
import { LoaderService } from '../../shared/services/loader/loader.service';
import { TranslateService } from '@ngx-translate/core';
import { GetFlags } from '../../shared/clases/getFlagsOptions';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, OnDestroy {

  loader: boolean = false;
  loaderSubscription: Subscription | undefined;
  activeSection: 'choose' | 'usuario' | 'anunciante' = 'choose';
  currentLang = 'es';
  selectedFlagUrl = 'https://flagcdn.com/es.svg';
  flagOptions = GetFlags.getFlagsOptions();
  constructor(private loaderService: LoaderService, private translate: TranslateService) { }


  ngOnInit(): void {
    const storedLang = localStorage.getItem('app-lang');
    this.currentLang = storedLang || 'es';
    this.translate.setDefaultLang('es');
    this.translate.use(this.currentLang);
    const activeFlag = this.flagOptions.find((flag: any) => flag.lang === this.currentLang);
    if (activeFlag) {
      this.selectedFlagUrl = activeFlag.url;
    }
    this.showLoader();
  }


  handleActivateSection(section: 'choose' | 'usuario' | 'anunciante') {
    this.activeSection = section;
  }

  showLoader() {
    this.loaderSubscription = this.loaderService.getLoaderState().pipe(delay(0)).subscribe(
      (response: any) => {
        this.loader = response
      }
    )
  }

  setFlag(flag: { url: string; label: string; lang: string }) {
    this.selectedFlagUrl = flag.url;
    this.currentLang = flag.lang;
    localStorage.setItem('app-lang', flag.lang);
    this.translate.use(flag.lang);
  }

  ngOnDestroy(): void {
    this.loaderSubscription?.unsubscribe();
  }


}
