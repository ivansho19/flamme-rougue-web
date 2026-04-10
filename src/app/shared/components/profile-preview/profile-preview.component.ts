import { Component, Input } from "@angular/core";

export interface ProfilePreviewData {
  name: string;
  subtitleLabel?: string;
  subtitleValue?: string;
  phone?: string;
  availability?: string;
  bio?: string;
  gender?: string;
  orientation?: string;
  hairColor?: string;
  age?: number | string | null;
  eyeColor?: string;
  nationality?: string;
  languages?: string;
  height?: number | string | null;
  weight?: number | string | null;
  isGold?: boolean;
  isVerified?: boolean;
  profileImage?: string;
  galleryImages?: string[];
  posibilities?: string[];
}

@Component({
  selector: "app-profile-preview",
  templateUrl: "./profile-preview.component.html",
  styleUrls: ["./profile-preview.component.scss"],
})
export class ProfilePreviewComponent {
  @Input() profile: ProfilePreviewData | null = null;
  @Input() showContactAction = true;

  fallbackImage = "assets/images/model.webp";

  get galleryThumbs(): string[] {
    return (this.profile?.galleryImages ?? []).slice(0, 3);
  }

  formatValue(value: string | number | null | undefined, suffix?: string): string {
    if (value === null || value === undefined) {
      return "-";
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed ? `${trimmed}${suffix ?? ""}` : "-";
    }

    if (Number.isNaN(value)) {
      return "-";
    }

    return `${value}${suffix ?? ""}`;
  }
}
