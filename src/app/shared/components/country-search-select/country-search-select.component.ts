import {
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Country } from '../../model/country.model';

@Component({
  selector: 'app-country-search-select',
  templateUrl: './country-search-select.component.html',
  styleUrls: ['./country-search-select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CountrySearchSelectComponent),
      multi: true
    }
  ]
})
export class CountrySearchSelectComponent implements ControlValueAccessor, OnInit, OnChanges {
  @Input() countries: Country[] = [];
  @Input() hasError = false;
  @Input() placeholder = '';
  @Output() countrySelected = new EventEmitter<string>();

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  isOpen = false;
  searchTerm = '';
  filteredCountries: Country[] = [];
  selectedCode = '';
  disabled = false;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    this.filterCountries();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['countries']) {
      this.filterCountries();
    }
  }

  get selectedCountryName(): string {
    return this.countries.find(country => country.code === this.selectedCode)?.name ?? '';
  }

  get closedLabel(): string {
    return this.selectedCountryName || this.placeholder;
  }

  get isPlaceholderVisible(): boolean {
    return !this.selectedCountryName;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen) {
      return;
    }

    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.closeDropdown();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeDropdown();
  }

  toggleDropdown(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.disabled) {
      return;
    }

    if (this.isOpen) {
      this.closeDropdown();
      return;
    }

    this.openDropdown();
  }

  openDropdown(): void {
    this.isOpen = true;
    this.searchTerm = '';
    this.filterCountries();

    setTimeout(() => {
      this.searchInput?.nativeElement.focus();
    });
  }

  closeDropdown(): void {
    if (!this.isOpen) {
      return;
    }

    this.isOpen = false;
    this.searchTerm = '';
    this.onTouched();
  }

  onSearchInput(value: string): void {
    this.searchTerm = value;
    this.filterCountries();
  }

  selectCountry(country: Country): void {
    this.selectedCode = country.code;
    this.isOpen = false;
    this.searchTerm = '';
    this.onChange(country.code);
    this.onTouched();
    this.countrySelected.emit(country.code);
  }

  writeValue(value: string | null): void {
    this.selectedCode = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.closeDropdown();
    }
  }

  private filterCountries(): void {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      this.filteredCountries = [...this.countries];
      return;
    }

    this.filteredCountries = this.countries.filter(country =>
      country.name.toLowerCase().includes(term) ||
      country.code.toLowerCase().includes(term)
    );
  }
}
