import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { delay, Subscription } from 'rxjs';
import { LoaderService } from '../../shared/services/loader/loader.service';

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

  constructor(private loaderService: LoaderService) { }


  ngOnInit(): void {
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
  ngOnDestroy(): void {
    this.loaderSubscription?.unsubscribe();
  }


}
