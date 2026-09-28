import { render } from "@testing-library/svelte";
import { describe, it } from "vitest";
import type { Cover } from "../../routes/cover/[slug]/+page.server";
import CoverComparison from "./CoverComparison.svelte";

const mockCover: Cover = {
  original: {
    id: 1,
    created_at: "2023-10-22 00:40:29.317184+00",
    name: "Angeleyes",
    artists: ["ABBA"],
    album_name: "Voulez-Vous",
    album_year: 1979,
    artwork: "abba-voulez-vous",
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
    valence: 0.964,
    isrc: "SEAYD7901040",
    album_upc: null,
    album_color: null,
    apple_id: "1440816458",
    apple_music_url:
      "https://music.apple.com/us/album/angel-eyes/1440816296?i=1440816458",
    spotify_url: "https://open.spotify.com/track/7rWgGyRK7RAqAAXy4bLft9",
    tidal_url: null,
  },
  cover: {
    id: 2,
    created_at: "2023-10-22 00:40:29.530622+00",
    name: "Angel Eyes",
    artists: ["The Czars"],
    album_name: "Best Of",
    album_year: 2014,
    artwork: "the-czars-best-of",
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
    valence: 0.421,
    isrc: null,
    album_upc: null,
    album_color: null,
    apple_id: null,
    apple_music_url: null,
    spotify_url: null,
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
    expect(coverLinks).toEqual(["Find cover on YouTube"]);
    expect(originalLinks).toEqual([
      "Listen to original on Spotify",
      "Listen to original on Apple Music",
      "Find original on YouTube",
    ]);
  });

  it("should serve album art from stored images", async ({ expect }) => {
    const { container } = render(CoverComparison, {
      props: { cover: mockCover },
    });
    const [coverArt, originalArt] = container.querySelectorAll(".album-art");
    expect(coverArt.getAttribute("src")).toBe(
      "https://img.genderswap.fm/384/the-czars-best-of.webp",
    );
    expect(originalArt.getAttribute("src")).toBe(
      "https://img.genderswap.fm/384/abba-voulez-vous.webp",
    );
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

  it("should title each track with its own name", async ({ expect }) => {
    const { container } = render(CoverComparison, {
      props: { cover: mockCover },
    });
    const names = [...container.querySelectorAll(".name")].map(
      (name) => name.textContent,
    );
    expect(names).toEqual([mockCover.cover.name, mockCover.original.name]);
  });
});
