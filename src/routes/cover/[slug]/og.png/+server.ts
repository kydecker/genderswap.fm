import { Resvg } from "@cf-wasm/resvg";
import { satori } from "@cf-wasm/satori";
import { eq } from "drizzle-orm";
import { getPagePalette } from "$lib/albumColor";
import { artworkOriginalUrl } from "$lib/artwork";
import { OG_HEIGHT, OG_WIDTH, TAGS } from "$lib/constants";
import { getReadableTitle, getSortedTags } from "$lib/helpers";
import { getDb } from "$lib/server/db";
import { covers } from "$lib/server/db/schema";
import logoSvg from "$lib/server/og-logo.svg?raw";

const songColumns = { name: true, artists: true, artwork: true } as const;
const ALBUM_SIZE = 400;

const getLogo = (text: string, fill: string) =>
  `data:image/svg+xml;base64,${Buffer.from(
    logoSvg
      .replace("<svg ", `<svg color="${text}" `)
      .replaceAll('fill="white"', `fill="${fill}"`),
  ).toString("base64")}`;

let staticAssets: Promise<ArrayBuffer[]> | undefined;

const loadStaticAssets = (url: URL, platform: App.Platform | undefined) => {
  const assets = platform?.env.ASSETS ?? globalThis;
  staticAssets ??= Promise.all(
    [
      "/fonts/LabilGrotesk-Regular.woff",
      "/fonts/LabilGrotesk-Bold.woff",
      "/images/og-shadow.png",
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

export async function GET({ params, url, platform }) {
  const { slug } = params;

  const [data, [labil, labilBold, shadowPng]] = await Promise.all([
    getDb(platform).query.covers.findFirst({
      columns: { tags: true },
      with: {
        original: { columns: songColumns },
        cover: { columns: { ...songColumns, album_color: true } },
      },
      where: eq(covers.slug, slug),
    }),
    loadStaticAssets(url, platform),
  ]);

  if (!data) {
    return new Response(null, {
      status: 404,
      statusText: "Not found",
    });
  }

  const { original, cover } = data;
  const shadow = `data:image/png;base64,${Buffer.from(shadowPng).toString("base64")}`;
  const tags = data.tags ?? [];
  const palette = getPagePalette(cover?.album_color);
  const logo = getLogo(palette.text, palette.surfaceRaised);

  const title =
    original && cover
      ? getReadableTitle({
          originalName: original.name,
          originalArtists: original.artists,
          coverArtists: cover.artists,
        })
      : "A cover on Genderswap.fm";

  const displayTags = getSortedTags(tags)
    .slice(0, 4)
    .map((tag) => TAGS[tag].label);
  tags.length > 4 ? displayTags.push(`+${tags.length - 4}`) : null;

  const shadowScale = ALBUM_SIZE / 340;
  const album = (src: string) => ({
    type: "div",
    props: {
      style: {
        display: "flex",
        position: "relative",
        width: ALBUM_SIZE,
        height: ALBUM_SIZE,
      },
      children: [
        {
          type: "img",
          props: {
            src: shadow,
            width: 660 * shadowScale,
            height: 660 * shadowScale,
            style: {
              position: "absolute",
              left: -160 * shadowScale,
              top: -160 * shadowScale,
            },
          },
        },
        {
          type: "img",
          props: {
            src,
            width: ALBUM_SIZE,
            height: ALBUM_SIZE,
            style: { borderRadius: "8px", objectFit: "cover" },
          },
        },
      ],
    },
  });

  const html = {
    type: "div",
    props: {
      style: {
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "space-between",
        backgroundColor: palette.bg,
        fontFamily: "Labil Grotesk",
        color: palette.text,
        fontSize: "32px",
        padding: "48px 60px",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "flex-start",
              width: "100%",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    width: "55%",
                    paddingRight: "24px",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize:
                            title.length > 70
                              ? "56px"
                              : title.length > 50
                                ? "64px"
                                : title.length > 30
                                  ? "72px"
                                  : "80px",
                          fontWeight: 700,
                          lineHeight: 1,
                        },
                        children: title,
                      },
                    },
                  ],
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    justifyContent: "flex-end",
                    width: "45%",
                  },
                  children: [album(artworkOriginalUrl(cover.artwork))],
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: "32px",
              width: "100%",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flex: 1,
                    minWidth: 0,
                    flexWrap: "wrap",
                    gap: "8px",
                  },
                  children: displayTags.map((tag) => ({
                    type: "div",
                    props: {
                      style: {
                        backgroundColor: "rgba(255, 255, 255, 0.25)",
                        padding: "6px 16px 9px 16px",
                        borderRadius: "12px",
                        fontSize: "28px",
                        lineHeight: 1.2,
                        color: palette.text,
                      },
                      children: tag,
                    },
                  })),
                },
              },
              {
                type: "img",
                props: {
                  src: logo,
                  width: ALBUM_SIZE,
                  height: (ALBUM_SIZE * 23) / 159,
                  style: { flexShrink: 0 },
                },
              },
            ],
          },
        },
      ],
    },
  };

  const svg = await satori(html, {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: [
      {
        name: "Labil Grotesk",
        data: labil,
        style: "normal",
        weight: 400,
      },
      {
        name: "Labil Grotesk",
        data: labilBold,
        style: "normal",
        weight: 700,
      },
    ],
  });

  const resvg = await Resvg.async(svg);
  const image = resvg.render();
  const png = image.asPng() as Uint8Array<ArrayBuffer>;
  image.free();
  resvg.free();

  return new Response(png, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=0, s-maxage=86400",
    },
  });
}
