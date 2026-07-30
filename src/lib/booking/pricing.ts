export type PriceUnit = "per_person" | "per_package";

export type PromotionForPricing = {
  id: string;
  name: string;
  code?: string | null;
  discountType: "percentage" | "fixed";
  discountValue: string | number;
  startsAt: string;
  endsAt: string | null;
  isActive: boolean;
  updatedAt?: string;
};

export type PriceSnapshot = {
  unitPrice: string;
  subtotalAmount: string;
  discountAmount: string;
  totalAmount: string;
  promotion: PromotionForPricing | null;
};

const DECIMAL_PATTERN = /^\d+(?:\.\d{1,2})?$/;
const ZERO = BigInt(0);
const HUNDRED = BigInt(100);
const FIVE_THOUSAND = BigInt(5_000);
const TEN_THOUSAND = BigInt(10_000);

function decimalParts(value: string | number) {
  const normalized = typeof value === "number" ? value.toFixed(2) : value.trim();

  if (!DECIMAL_PATTERN.test(normalized)) {
    throw new Error("Nilai uang harus berupa angka positif dengan maksimal dua desimal.");
  }

  const [whole, fraction = ""] = normalized.split(".");
  return { whole, fraction: fraction.padEnd(2, "0") };
}

function toHundredths(value: string | number) {
  const { whole, fraction } = decimalParts(value);
  return BigInt(whole) * HUNDRED + BigInt(fraction);
}

function toMoney(cents: bigint) {
  const whole = cents / HUNDRED;
  const fraction = (cents % HUNDRED).toString().padStart(2, "0");
  return `${whole}.${fraction}`;
}

function isPromotionValid(promotion: PromotionForPricing, now: Date) {
  if (!promotion.isActive) return false;

  const startsAt = new Date(promotion.startsAt);
  const endsAt = promotion.endsAt ? new Date(promotion.endsAt) : null;

  return (
    !Number.isNaN(startsAt.getTime()) &&
    startsAt.getTime() <= now.getTime() &&
    (!endsAt ||
      (!Number.isNaN(endsAt.getTime()) && endsAt.getTime() > now.getTime()))
  );
}

function promotionDiscount(subtotal: bigint, promotion: PromotionForPricing) {
  if (promotion.discountType === "fixed") {
    const fixedDiscount = toHundredths(promotion.discountValue);
    return fixedDiscount > subtotal ? subtotal : fixedDiscount;
  }

  const percentageHundredths = toHundredths(promotion.discountValue);
  if (percentageHundredths > TEN_THOUSAND) {
    throw new Error("Diskon persentase tidak boleh melebihi 100%.");
  }

  // Pembulatan half-up ke satuan sen terdekat.
  const calculated =
    (subtotal * percentageHundredths + FIVE_THOUSAND) / TEN_THOUSAND;
  return calculated > subtotal ? subtotal : calculated;
}

export function calculatePriceSnapshot(input: {
  basePrice: string | number;
  salePrice: string | number | null;
  priceUnit: PriceUnit;
  travelerCount: number;
  promotions: PromotionForPricing[];
  promotionCode?: string | null;
  now?: Date;
}): PriceSnapshot {
  if (!Number.isInteger(input.travelerCount) || input.travelerCount < 1) {
    throw new Error("Jumlah traveler harus berupa bilangan bulat positif.");
  }

  const basePrice = toHundredths(input.basePrice);
  const salePrice =
    input.salePrice === null ? null : toHundredths(input.salePrice);

  if (salePrice !== null && salePrice > basePrice) {
    throw new Error("Harga sale tidak boleh melebihi harga dasar.");
  }

  const unitPrice = salePrice ?? basePrice;
  const subtotal =
    input.priceUnit === "per_person"
      ? unitPrice * BigInt(input.travelerCount)
      : unitPrice;
  const now = input.now ?? new Date();
  const promotionCode = input.promotionCode?.trim().toUpperCase() || null;

  const candidates = input.promotions
    .filter((promotion) => {
      if (!isPromotionValid(promotion, now)) return false;

      const candidateCode = promotion.code ?? null;
      return promotionCode
        ? candidateCode === promotionCode
        : candidateCode === null;
    })
    .map((promotion) => ({
      promotion,
      discount: promotionDiscount(subtotal, promotion),
    }))
    .sort((left, right) => {
      if (left.discount !== right.discount) {
        return left.discount > right.discount ? -1 : 1;
      }

      const startsDifference =
        new Date(left.promotion.startsAt).getTime() -
        new Date(right.promotion.startsAt).getTime();
      if (startsDifference !== 0) return startsDifference;

      return left.promotion.id.localeCompare(right.promotion.id);
    });

  const selected = candidates[0] ?? null;
  const discount = selected?.discount ?? ZERO;

  return {
    unitPrice: toMoney(unitPrice),
    subtotalAmount: toMoney(subtotal),
    discountAmount: toMoney(discount),
    totalAmount: toMoney(subtotal - discount),
    promotion: selected?.promotion ?? null,
  };
}
