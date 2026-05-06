import { cache } from "react";
import localProducts from "../../products.json";
import localComingSoon from "../../comingsoon.json";

type Product = {
  name: string;
  brand: string;
  type: string;
  pricing: string;
  photo: string;
};

type ComingSoonItem = {
  name: string;
  brand: string;
  type: string;
  pricing: string;
  launch: string;
  photo: string;
};

export type SiteContent = {
  products: {
    electric_cars: Product[];
    electric_two_wheelers: Product[];
    electric_autos: Product[];
  };
  comingSoon: {
    electric_cars: ComingSoonItem[];
    electric_two_wheelers: ComingSoonItem[];
    electric_autos: ComingSoonItem[];
  };
};

type WordPressGraphQLResponse = {
  data?: {
    products?: {
      electricCars?: Product[];
      electricTwoWheelers?: Product[];
      electricAutos?: Product[];
    };
    comingSoon?: {
      electricCars?: ComingSoonItem[];
      electricTwoWheelers?: ComingSoonItem[];
      electricAutos?: ComingSoonItem[];
    };
  };
};

function contentSource() {
  return (process.env.CONTENT_SOURCE || "local").toLowerCase();
}

function wpEndpoint() {
  return process.env.WP_GRAPHQL_ENDPOINT?.trim();
}

async function loadFromWordPress(): Promise<SiteContent> {
  const endpoint = wpEndpoint();

  if (!endpoint) {
    throw new Error("CONTENT_SOURCE is set to graphql but WP_GRAPHQL_ENDPOINT is missing.");
  }

  const query = `
    query SiteContent {
      products {
        electricCars {
          name
          brand
          type
          pricing
          photo
        }
        electricTwoWheelers {
          name
          brand
          type
          pricing
          photo
        }
        electricAutos {
          name
          brand
          type
          pricing
          photo
        }
      }
      comingSoon {
        electricCars {
          name
          brand
          type
          pricing
          launch
          photo
        }
        electricTwoWheelers {
          name
          brand
          type
          pricing
          launch
          photo
        }
        electricAutos {
          name
          brand
          type
          pricing
          launch
          photo
        }
      }
    }
  `;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed with status ${response.status}.`);
  }

  const json = (await response.json()) as WordPressGraphQLResponse;

  if (!json.data?.products || !json.data?.comingSoon) {
    throw new Error("GraphQL response did not include the expected content payload.");
  }

  return {
    products: {
      electric_cars: json.data.products.electricCars ?? [],
      electric_two_wheelers: json.data.products.electricTwoWheelers ?? [],
      electric_autos: json.data.products.electricAutos ?? [],
    },
    comingSoon: {
      electric_cars: json.data.comingSoon.electricCars ?? [],
      electric_two_wheelers: json.data.comingSoon.electricTwoWheelers ?? [],
      electric_autos: json.data.comingSoon.electricAutos ?? [],
    },
  };
}

function loadLocalContent(): SiteContent {
  return {
    products: localProducts,
    comingSoon: localComingSoon.coming_soon,
  };
}

export const getSiteContent = cache(async (): Promise<SiteContent> => {
  if (contentSource() === "graphql") {
    return loadFromWordPress();
  }

  return loadLocalContent();
});
