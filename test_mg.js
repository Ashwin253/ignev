const fetch = require('node-fetch');

async function main() {
  const WP_REST_BASE = "https://evplse.online/wp-json/wp/v2";
  const slug = "mg-m9";
  const url = `${WP_REST_BASE}/evlisting?slug=${encodeURIComponent(slug)}&_embed&per_page=1`;
  const res = await fetch(url);
  const posts = await res.json();
  const meta = posts[0].meta;
  console.log(JSON.stringify(meta, null, 2));
}

main();
