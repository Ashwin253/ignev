export type SpecExtraItem = {
  label: string;
  value: string;
  kind?: "field" | "checkbox";
};

export function normalizeExtras(items: unknown[] | undefined): SpecExtraItem[] {
  return (items ?? []).map((raw) => {
    const r = raw as { label?: string; value?: string; kind?: string };
    return {
      label: String(r.label ?? ""),
      value: String(r.value ?? ""),
      kind: r.kind === "checkbox" ? "checkbox" : "field",
    };
  });
}

export function isCheckboxExtra(item: SpecExtraItem): boolean {
  return item.kind === "checkbox";
}

export function isExtraChecked(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function extraFieldRows(extras: SpecExtraItem[]): Array<{ label: string; value: string }> {
  return extras
    .filter((e) => e.label && !isCheckboxExtra(e) && e.value.trim())
    .map((e) => ({ label: e.label, value: e.value }));
}

export function extraCheckboxLabels(extras: SpecExtraItem[]): string[] {
  return extras
    .filter((e) => e.label && isCheckboxExtra(e) && isExtraChecked(e.value))
    .map((e) => e.label);
}

export function appendExtra(extras: SpecExtraItem[], kind: "field" | "checkbox"): SpecExtraItem[] {
  return [
    ...extras,
    { label: "", value: kind === "checkbox" ? "1" : "", kind },
  ];
}
