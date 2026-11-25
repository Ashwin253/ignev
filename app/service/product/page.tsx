import { redirect } from "next/navigation";

// Legacy accessory page — the shop now lives at /shop and is managed from the
// team dashboard, so send visitors there instead of rendering a stale catalog.
export default function ServiceProductPage() {
  redirect("/shop");
}
