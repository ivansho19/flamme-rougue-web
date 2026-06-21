export const PLAN_IMAGE_LIMITS: Record<number, number> = {
  1: 8,
  2: 15,
  3: 30
};

export interface PlanImageValidationResult {
  isValid: boolean;
  totalImages: number;
  selectedPlanLimit: number | null;
  requiredPlanId: number | null;
  requiredPlanKey: string | null;
  requiredPlanLimit: number | null;
}

export class PlanImageLimitsHelper {
  static countProfileImages(hasMainImage: boolean, galleryCount: number): number {
    return (hasMainImage ? 1 : 0) + galleryCount;
  }

  static getPlanLimit(planId: number | null | undefined): number | null {
    if (!planId) {
      return null;
    }
    return PLAN_IMAGE_LIMITS[planId] ?? null;
  }

  static getMinimumPlanIdForImageCount(imageCount: number): number | null {
    if (imageCount <= 0) {
      return 1;
    }
    if (imageCount <= PLAN_IMAGE_LIMITS[1]) {
      return 1;
    }
    if (imageCount <= PLAN_IMAGE_LIMITS[2]) {
      return 2;
    }
    if (imageCount <= PLAN_IMAGE_LIMITS[3]) {
      return 3;
    }
    return null;
  }

  static getPlanTranslationKey(planId: number): string {
    const keys: Record<number, string> = {
      1: 'PROFILE_FORM.PLAN_BASIC',
      2: 'PROFILE_FORM.PLAN_PRO',
      3: 'PROFILE_FORM.PLAN_VIP'
    };
    return keys[planId] || 'PROFILE_FORM.PLAN_BASIC';
  }

  static validate(
    selectedPlanId: number | null | undefined,
    totalImages: number
  ): PlanImageValidationResult {
    const requiredPlanId = this.getMinimumPlanIdForImageCount(totalImages);
    const selectedPlanLimit = this.getPlanLimit(selectedPlanId ?? null);
    const requiredPlanLimit = requiredPlanId ? this.getPlanLimit(requiredPlanId) : null;

    const isValid = totalImages === 0
      || (requiredPlanId !== null
        && selectedPlanId != null
        && selectedPlanId >= requiredPlanId);

    return {
      isValid,
      totalImages,
      selectedPlanLimit,
      requiredPlanId,
      requiredPlanKey: requiredPlanId ? this.getPlanTranslationKey(requiredPlanId) : null,
      requiredPlanLimit
    };
  }
}
