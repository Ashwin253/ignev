import type { BatterySpec, ChargingSpec, EvListing } from "./wordpress";
import {
  extraCheckboxLabels,
  extraFieldRows,
  isCheckboxExtra,
  isExtraChecked,
  normalizeExtras,
  type SpecExtraItem,
} from "./spec-extras";

export type SpecPair = { label: string; value: string };

export function collectVariantNames(item: EvListing): string[] {
  const names = new Set<string>();
  for (const v of item.batteryVariants) {
    if (v.modelName?.trim()) names.add(v.modelName.trim());
  }
  for (const v of item.baasVariants) {
    if (v.modelName?.trim()) names.add(v.modelName.trim());
  }
  for (const s of item.batterySpecs) {
    if (s.variantName?.trim()) names.add(s.variantName.trim());
  }
  for (const s of item.chargingSpecs) {
    if (s.variantName?.trim()) names.add(s.variantName.trim());
  }
  for (const d of item.variantDimensions ?? []) {
    if (d.variantName?.trim()) names.add(d.variantName.trim());
  }
  for (const f of item.variantFeatures ?? []) {
    if (f.variantName?.trim()) names.add(f.variantName.trim());
  }
  for (const x of item.variantExtraSections ?? []) {
    if (x.variantName?.trim()) names.add(x.variantName.trim());
  }
  for (const c of item.variantCustomFields ?? []) {
    if (c.variantName?.trim()) names.add(c.variantName.trim());
  }
  return Array.from(names);
}

function rowsFromExtras(extras: SpecExtraItem[]): SpecPair[] {
  return extraFieldRows(extras);
}

export function motorSpecRows(spec: BatterySpec): SpecPair[] {
  const extras = normalizeExtras(spec.extraSpecs);
  return [
    spec.electricMotor ? { label: "Electric Motor", value: spec.electricMotor } : null,
    spec.maxPower ? { label: "Max Power (bhp@rpm)", value: `${spec.maxPower} bhp` } : null,
    spec.maxTorque ? { label: "Max Torque (Nm@rpm)", value: `${spec.maxTorque} Nm` } : null,
    spec.engine ? { label: "Engine", value: spec.engine } : null,
    spec.emissionStandard ? { label: "Emission", value: spec.emissionStandard } : null,
    spec.turboSupercharger && spec.turboSupercharger !== "0"
      ? { label: "Turbo/Supercharger", value: "Yes" }
      : null,
    spec.idleStartStop && spec.idleStartStop !== "0"
      ? { label: "Idle Start/Stop", value: "Yes" }
      : null,
    ...rowsFromExtras(extras),
  ].filter((r): r is SpecPair => r !== null);
}

export function motorSpecCheckboxes(spec: BatterySpec): string[] {
  return extraCheckboxLabels(normalizeExtras(spec.extraSpecs));
}

export function chargingSpecRows(spec: ChargingSpec): SpecPair[] {
  const extras = normalizeExtras(spec.extraSpecs);
  return [
    spec.drivingRange ? { label: "Driving Range", value: spec.drivingRange } : null,
    spec.acRegularCharging ? { label: "AC Regular", value: spec.acRegularCharging } : null,
    spec.dcFastCharging ? { label: "DC Fast", value: spec.dcFastCharging } : null,
    spec.acFastCharging ? { label: "AC Fast", value: spec.acFastCharging } : null,
    spec.chargingOptions ? { label: "Options", value: spec.chargingOptions } : null,
    spec.chargerIncluded ? { label: "Charger Included", value: spec.chargerIncluded } : null,
    spec.chargerConnectionType ? { label: "Connection Type", value: spec.chargerConnectionType } : null,
    ...rowsFromExtras(extras),
  ].filter((r): r is SpecPair => r !== null);
}

export function chargingSpecCheckboxes(spec: ChargingSpec): string[] {
  return extraCheckboxLabels(normalizeExtras(spec.extraSpecs));
}

export function dimensionSpecRows(dim: NonNullable<EvListing["variantDimensions"]>[number]): SpecPair[] {
  const extras = normalizeExtras(dim.extraSpecs);
  return [
    dim.length_mm || dim.width_mm || dim.height_mm
      ? { label: "L × W × H", value: `${dim.length_mm || "-"} × ${dim.width_mm || "-"} × ${dim.height_mm || "-"} mm` }
      : null,
    dim.wheelbase_mm ? { label: "Wheelbase", value: `${dim.wheelbase_mm} mm` } : null,
    dim.ground_clearance_mm ? { label: "Ground Clearance", value: `${dim.ground_clearance_mm} mm` } : null,
    dim.boot_space_litres ? { label: "Boot Space", value: `${dim.boot_space_litres} L` } : null,
    dim.turning_radius_m ? { label: "Min Turning Radius", value: `${dim.turning_radius_m} m` } : null,
    dim.kerb_weight_kg ? { label: "Kerb Weight", value: `${dim.kerb_weight_kg} kg` } : null,
    dim.seat_length_mm ? { label: "Seat Length", value: `${dim.seat_length_mm} mm` } : null,
    dim.seat_height_mm ? { label: "Seat Height", value: `${dim.seat_height_mm} mm` } : null,
    ...rowsFromExtras(extras),
  ].filter((r): r is SpecPair => r !== null);
}

export function dimensionSpecCheckboxes(dim: NonNullable<EvListing["variantDimensions"]>[number]): string[] {
  return extraCheckboxLabels(normalizeExtras(dim.extraSpecs));
}

export function sectionFieldRows(
  fields: Array<{ label: string; value: string; kind?: string }> | undefined
): SpecPair[] {
  return extraFieldRows(normalizeExtras(fields));
}

export function sectionCheckboxLabels(
  fields: Array<{ label: string; value: string; kind?: string }> | undefined
): string[] {
  return extraCheckboxLabels(normalizeExtras(fields));
}

export function hasFeatureContent(feat: Record<string, unknown>): boolean {
  const boolKeys = [
    "has_sunroof", "has_climate_control", "has_cruise_control", "has_wireless_charger",
    "has_keyless_entry", "has_wireless_carplay_android_auto", "has_connected_car_app",
    "has_ota_updates", "has_abs_ebd", "has_esp", "has_tpms", "has_360_camera",
  ];
  if (boolKeys.some((k) => feat[k])) return true;
  if (feat.drivetrain || feat.front_brakes || feat.rear_brakes) return true;
  if (feat.front_suspension || feat.rear_suspension) return true;
  if (feat.seating_capacity && Number(feat.seating_capacity) > 0) return true;
  if (feat.headlight_type) return true;
  if (feat.screen_size_inches) return true;
  if (feat.speaker_count && Number(feat.speaker_count) > 0) return true;
  if (feat.airbag_count && Number(feat.airbag_count) > 0) return true;
  if (feat.adas_level && Number(feat.adas_level) > 0) return true;
  if (feat.ncap_safety_rating) return true;
  const extra = normalizeExtras(feat.extra_features as unknown[]);
  if (extra.some((e) => e.label && (!isCheckboxExtra(e) ? e.value.trim() : isExtraChecked(e.value)))) return true;
  return false;
}

export function listingHasSpecifications(item: EvListing): boolean {
  if (item.pros.length > 0 || item.cons.length > 0) return true;
  if (item.batterySpecs.some((s) => motorSpecRows(s).length > 0 || motorSpecCheckboxes(s).length > 0)) return true;
  if (item.chargingSpecs.some((s) => chargingSpecRows(s).length > 0 || chargingSpecCheckboxes(s).length > 0)) return true;
  if (item.variantDimensions?.some((d) => dimensionSpecRows(d).length > 0 || dimensionSpecCheckboxes(d).length > 0)) return true;
  if (item.variantExtraSections?.some((v) =>
    v.sections?.some((s) =>
      s.title && s.fields?.some((f) => f.label && (!isCheckboxExtra(f as SpecExtraItem) ? f.value : isExtraChecked(f.value)))
    )
  )) return true;
  if (item.variantCustomFields?.some((v) =>
    v.fields?.some((f) => f.label && (!isCheckboxExtra(f as SpecExtraItem) ? f.value : isExtraChecked(f.value)))
  )) return true;
  if (item.variantFeatures?.some((f) => hasFeatureContent(f))) return true;
  return false;
}
