import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { render as renderHtml } from "svelte/server";
import { render } from "takumi-js";
import { getPagePalette } from "#lib/albumColor.js";
import { artworkUrl } from "#lib/artwork.js";
import OgImage from "#lib/components/OgImage.svelte";
import { OG_HEIGHT, OG_WIDTH, TAGS } from "#lib/constants.js";
import { getReadableTitle, getSortedTags } from "#lib/helpers.js";
import { getDb } from "#lib/server/db/index.js";
import { covers } from "#lib/server/db/schema.js";
import logoSvg from "#lib/server/og-logo.svg?raw";

const songColumns = { name: true, artists: true, artwork: true } as const;
const SHADOW_PATH = "/images/og-shadow.png";

const getLogo = (text: string, fill: string) =>
  `data:image/svg+xml;base64,${Buffer.from(
    logoSvg
      .replace("<svg ", `<svg color="${text}" `)
      .replaceAll('fill="white"', `fill="${fill}"`),
  ).toString("base64")}`;

let staticAssets: Promise<ArrayBuffer[]> | undefined;

const loadStaticAssets = (url: URL) => {
  const assets = env.ASSETS ?? globalThis;
  staticAssets ??= Promise.all(
    [
      "/fonts/labil-grotesk-400.ttf",
      "/fonts/labil-grotesk-700.ttf",
      SHADOW_PATH,
    ].map(async (path) => {
      const res = await assets.fetch(new URL(path, url));
      if (!res.ok) throw new Error(`${path}: ${res.status}`);
      return res.arrayBuffer();
    }),
  ).catch((error) => {
    staticAssets = undefined;
    throw error;
  });
  return staticAssets;
};

export async function GET({ params, url }) {
  const { slug } = params;

  const [data, [labil, labilBold, shadow]] = await Promise.all([
    getDb().query.covers.findFirst({
      columns: { tags: true },
      with: {
        original: { columns: songColumns },
        cover: { columns: { ...songColumns, album_color: true } },
      },
      where: eq(covers.slug, slug),
    }),
    loadStaticAssets(url),
  ]);

  if (!data) {
    return new Response(null, {
      status: 404,
      statusText: "Not found",
    });
  }

  const { original, cover } = data;
  const tags = data.tags ?? [];
  const palette = getPagePalette(cover.album_color);

  const displayTags = getSortedTags(tags)
    .slice(0, 4)
    .map((tag) => TAGS[tag].label);
  if (tags.length > 4) displayTags.push(`+${tags.length - 4}`);

  const { head, body } = renderHtml(OgImage, {
    props: {
      title: getReadableTitle({
        originalName: original.name,
        originalArtists: original.artists,
        coverArtists: cover.artists,
      }),
      tags: displayTags,
      artwork: artworkUrl(cover.artwork, 512),
      logo: getLogo(palette.text, palette.surfaceRaised),
      shadow: SHADOW_PATH,
      palette,
    },
  });

  const jpeg = await render(`${head}${body}`, {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    format: "jpeg",
    quality: 85,
    fonts: [
      { name: "Labil Grotesk", data: labil, weight: 400 },
      { name: "Labil Grotesk", data: labilBold, weight: 700 },
    ],
    images: [{ src: SHADOW_PATH, data: shadow }],
  });

  return new Response(jpeg, {
    status: 200,
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=0, s-maxage=86400",
    },
  });
}
