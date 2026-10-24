export type CatalogItem = {
  name: string;
  brand: string;
  type: string;
  types?: string[];
  body_type?: string;
  bodyType?: string;
  pricing: string;
  photo: string;
  slug?: string;
  topSpeed?: number | null;
  drivingRange?: string;
  commercial?: boolean;
  launchdate?: string | null;
  prices?: string[];
  baas?: boolean;
  usageType?: string;
  video_links?: Array<{ url: string; title?: string; variantId?: string | null; variantName?: string | null }>;
  batterySpecs?: Array<{
    variantName?: string;
    maxPower?: string;
    maxTorque?: string;
    batteryCapacity?: string;
    [key: string]: any;
  }>;
  batteryVariants?: Array<{
    capacity?: string;
    range?: string;
    [key: string]: any;
  }>;
  power?: string;
  torque?: string;
  battery?: string;
  batteryCapacity?: string;
  battery_capacity?: string;
  battery_capacity_kwh?: string;
  max_power_bhp?: string;
  max_torque_nm?: string;
  /** Precomputed on the server: true for future / unannounced releases */
  upcoming?: boolean;
  /** Launch date as epoch ms (0 when unknown) */
  launchTs?: number;
};
