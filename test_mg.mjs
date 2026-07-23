import { fetchEvListingBySlugREST } from "./app/lib/wordpress.js";

async function main() {
  const data = await fetchEvListingBySlugREST("mg-m9");
  console.log(JSON.stringify(data?.variantFeatures, null, 2));
}

main();
