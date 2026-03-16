import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { delay, Subscription } from 'rxjs';
import { LoaderService } from '../../services/loader/loader.service';
import { Route, Router } from '@angular/router';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']})

export class LayoutComponent implements OnInit, OnDestroy {
  public subscription = new Subscription
  public loader: any = {}
  loaderSubscription: Subscription = new Subscription;
  isHomePage = false;


  @ViewChild('drawer') drawer!: any;
  @ViewChild('filterDrawer') filterDrawer!: any;
  
  
  showMenu = true;
  typeFilter: any;
  indexTabGeneral: any;


  constructor(private loaderService: LoaderService, private router: Router
  ) {}

  ngOnInit() {
    this.showLoader();    
  }

  showLoader() {
        this.loaderSubscription = this.loaderService.getLoaderState().pipe(delay(0)).subscribe(
            (response: any) => {
                this.loader = !!response?.state;
            }
        )
    }

  ngOnDestroy(): void {
    this.loader = false;
    this.subscription.unsubscribe();
    this.loaderSubscription.unsubscribe();
  }

}

