import { Component, Input } from '@angular/core';

export type BreadcrumbItem = {
  /** Plain text label (e.g. profile name). Ignored when labelKey is set. */
  label?: string;
  /** i18n key (e.g. COMMON.HOME). Takes precedence over label. */
  labelKey?: string;
  /** Router link. Omit on the current (last) crumb. */
  link?: string | any[];
};

@Component({
  selector: 'app-breadcrumbs',
  templateUrl: './breadcrumbs.component.html',
  styleUrls: ['./breadcrumbs.component.scss']
})
export class BreadcrumbsComponent {
  @Input() items: BreadcrumbItem[] = [];
}
