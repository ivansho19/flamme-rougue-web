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
  @Input() multiple = false;
  @Output() countrySelected = new EventEmitter<string>();

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  isOpen = false;
  searchTerm = '';
  filteredCountries: Country[] = [];
  selectedCode = '';
  selectedCodes: string[] = [];
  disabled = false;

  private onChange: (value: string | string[]) => void = () => {};
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
    if (this.multiple) {
      return this.placeholder;
    }

    return this.selectedCountryName || this.placeholder;
  }

  get isPlaceholderVisible(): boolean {
    if (this.multiple) {
      return true;
    }
    return !this.selectedCountryName;
  }

  get selectedCountries(): Country[] {
    return this.selectedCodes
      .map(code => this.countries.find(country => country.code === code))
      .filter((country): country is Country => !!country);
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
    if (this.multiple) {
      this.toggleCountryCode(country.code);
      this.searchTerm = '';
      this.filterCountries();
      this.onChange([...this.selectedCodes]);
      this.onTouched();
      return;
    }

    this.selectedCode = country.code;
    this.isOpen = false;
    this.searchTerm = '';
    this.onChange(country.code);
    this.onTouched();
    this.countrySelected.emit(country.code);
  }

  removeCountry(code: string, event?: MouseEvent): void {
    event?.preventDefault();
    event?.stopPropagation();

    if (!this.multiple || this.disabled) {
      return;
    }

    this.selectedCodes = this.selectedCodes.filter(item => item !== code);
    this.onChange([...this.selectedCodes]);
    this.onTouched();
  }

  isCountrySelected(code: string): boolean {
    return this.multiple ? this.selectedCodes.includes(code) : this.selectedCode === code;
  }

  getCountryName(code: string): string {
    return this.countries.find(country => country.code === code)?.name ?? code;
  }

  writeValue(value: string | string[] | null): void {
    if (this.multiple) {
      this.selectedCodes = Array.isArray(value) ? [...value] : value ? [value] : [];
      return;
    }

    this.selectedCode = typeof value === 'string' ? value : '';
  }

  registerOnChange(fn: (value: string | string[]) => void): void {
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

  private toggleCountryCode(code: string): void {
    if (this.selectedCodes.includes(code)) {
      this.selectedCodes = this.selectedCodes.filter(item => item !== code);
      return;
    }

    this.selectedCodes = [...this.selectedCodes, code];
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
