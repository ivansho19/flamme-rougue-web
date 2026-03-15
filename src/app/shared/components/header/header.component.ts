import { Component, ElementRef, HostListener, OnDestroy, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { LogoutConfirmDialogComponent } from "../logout-confirm-dialog/logout-confirm-dialog.component";
import { LoaderService } from "../../services/loader/loader.service";

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
})
export class HeaderComponent implements OnInit, OnDestroy {
  dropdownOpen = false;
  selectedFlagUrl = 'https://flagcdn.com/gb.svg';

  flagOptions = [
    { url: 'https://flagcdn.com/fr.svg', label: 'Francés' },
    { url: 'https://flagcdn.com/nl.svg', label: 'Holandés' },
    { url: 'https://flagcdn.com/gb.svg', label: 'Inglés' }
  ];

  constructor(private route: Router, private eRef: ElementRef, private dialog: MatDialog, private loaderService: LoaderService) { }

  ngOnInit(): void { }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  setFlag(flag: { url: string; label: string }) {
    this.selectedFlagUrl = flag.url;
    this.dropdownOpen = false;
    // Aquí puedes agregar lógica para cambiar el idioma real de la app
  }

  @HostListener('document:click', ['$event'])
  clickout(event: MouseEvent) {
    // Si el click fue fuera de este componente, cierra el dropdown
    if (this.dropdownOpen && !this.eRef.nativeElement.contains(event.target)) {
      this.dropdownOpen = false;
    }
  }

  getUserName(): string | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  navigateToProfile(){
    this.route.navigate(['/profiles']);
  }

  logout() {

    const dialogRef = this.dialog.open(LogoutConfirmDialogComponent, {
      width: '400px',
      panelClass: 'custom-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Aquí llamas a tu servicio de logout
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('adult-consent');
        this.route.navigate(['/auth/login']);
        console.log('Sesión cerrada');
      }
    });
  }

  ngOnDestroy(): void {
    // Limpieza opcional si añades listeners manuales (no necesario con HostListener)
  }
}