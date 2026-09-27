import { render } from "@testing-library/svelte";
import { describe, it } from "vitest";
import type { Cover } from "../../routes/cover/[slug]/+page.server";
import CoverComparison from "./CoverComparison.svelte";

const mockCover: Cover = {
  original: {
    created_at: "2023-10-22 00:40:29.317184+00",
    id: "7rWgGyRK7RAqAAXy4bLft9",
    name: "Angeleyes",
    artists: ["ABBA"],
    album_name: "Voulez-Vous",
    album_year: 1979,
    album_img: [
      "https://i.scdn.co/image/ab67616d0000b273aa22899360d8ba6704732dec",
      "https://i.scdn.co/image/ab67616d00001e02aa22899360d8ba6704732dec",
      "https://i.scdn.co/image/ab67616d00004851aa22899360d8ba6704732dec",
    ],
    url: "https://open.spotify.com/track/7rWgGyRK7RAqAAXy4bLft9",
    gender: ["female"],
    acousticness: 0.523,
    danceability: 0.719,
    duration_ms: 260893,
    energy: 0.922,
    instrumentalness: 0.000163,
    key: 11,
    liveness: 0.0867,
    loudness: -6.091,
    mode: 1,
    speechiness: 0.0338,
    tempo: 133.113,
    time_signature: 4,
    valence: 0.964,
    isrc: "SEAYD7901040",
    album_upc: null,
    apple_music_url:
      "https://music.apple.com/us/album/angel-eyes/1440816296?i=1440816458",
    tidal_url: null,
  },
  cover: {
    created_at: "2023-10-22 00:40:29.530622+00",
    id: "7rWgGyRK7RAqAAXy4bLft9",
    name: "Angel Eyes",
    artists: ["The Czars"],
    album_name: "Best Of",
    album_year: 2014,
    album_img: [
      "https://i.scdn.co/image/ab67616d0000b27339fea69e3e036d36e1751279",
      "https://i.scdn.co/image/ab67616d00001e0239fea69e3e036d36e1751279",
      "https://i.scdn.co/image/ab67616d0000485139fea69e3e036d36e1751279",
    ],
    url: "https://open.spotify.com/track/4OeGiA4EexvQMwEbuHyFG7",
    gender: ["male"],
    acousticness: 0.84,
    danceability: 0.717,
    duration_ms: 286674,
    energy: 0.157,
    instrumentalness: 0.0000114,
    key: 11,
    liveness: 0.117,
    loudness: -14.328,
    mode: 1,
    speechiness: 0.029,
    tempo: 98.083,
    time_signature: 4,
    valence: 0.421,
    isrc: null,
    album_upc: null,
    apple_music_url: null,
    tidal_url: null,
  },
  created_at: "2023-10-22 00:40:29.659396+00",
  description: "Classic ABBA pop melts into acoustic-led gay heartbreak.",
  contributor: "Eva",
  tags: ["energy_down", "transition_ftm", "valence_down", "years_apart_30"],
};

describe("CoverComparison", async () => {
  it("should render the cover comparison", async ({ expect }) => {
    const { container } = render(CoverComparison, {
      props: { cover: mockCover },
    });
    const comparison = container.querySelector(".compare");
    expect(comparison).toBeDefined();
  });

  it("should render album art for original and cover", async ({ expect }) => {
    const { container } = render(CoverComparison, {
      props: { cover: mockCover },
    });
    const albumArt = container.querySelectorAll(".album-art");
    expect(albumArt.length).toBe(2);
  });

  it("should link to each service when available", async ({ expect }) => {
    const { container } = render(CoverComparison, {
      props: { cover: mockCover },
    });
    const [coverLinks, originalLinks] = [
      ...container.querySelectorAll(".song-links"),
    ].map((row) =>
      [...row.querySelectorAll("a")].map((a) => a.getAttribute("aria-label")),
    );
    expect(coverLinks).toEqual([
      "Listen to cover on Spotify",
      "Find cover on YouTube",
    ]);
    expect(originalLinks).toEqual([
      "Listen to original on Spotify",
      "Listen to original on Apple Music",
      "Find original on YouTube",
    ]);
  });

  it("should link artists to a filtered search", async ({ expect }) => {
    const { container } = render(CoverComparison, {
      props: { cover: mockCover },
    });
    const artists = container.querySelectorAll(".artist");
    const coverLink = artists[0].querySelector("a");
    expect(coverLink?.getAttribute("href")).toBe("/?q=The%20Czars");
    const originalLink = artists[1].querySelector("a");
    expect(originalLink?.getAttribute("href")).toBe("/?q=ABBA");
  });

  it('should render "covered as" when the titles differ', async ({
    expect,
  }) => {
    const { container } = render(CoverComparison, {
      props: { cover: mockCover },
    });
    const coveredAs = container.querySelector(".covered-as");
    expect(coveredAs).toBeDefined();
    expect(coveredAs?.textContent).toBe(`Covered as ${mockCover.cover.name}`);
  });
});
