import { Component, Input, OnChanges } from '@angular/core';
import { getCountryFlagAssetUrl } from '../../clases/countryFlag';

@Component({
  selector: 'app-country-flag',
  templateUrl: './country-flag.component.html',
  styleUrls: ['./country-flag.component.scss']
})
export class CountryFlagComponent implements OnChanges {
  @Input() code: string | null | undefined;
  /** Accessible country label; decorative when empty. */
  @Input() label: string = '';

  flagUrl: string | null = null;

  ngOnChanges(): void {
    this.flagUrl = getCountryFlagAssetUrl(this.code);
  }
}
