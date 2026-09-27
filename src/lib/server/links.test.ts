import { afterEach, describe, expect, it, vi } from "vitest";
import { findAppleMusicUrlByUpc } from "./links";

const query = {
  isrc: "USMV29900091",
  upc: "093624590163",
  name: "You Oughta Know",
  artists: ["Alanis Morissette"],
  duration_ms: 249000,
  disc_number: 1,
  track_number: 2,
};

const mockFetch = (...bodies: unknown[]) => {
  const fetch = vi.fn();
  for (const body of bodies) {
    fetch.mockResolvedValueOnce(Response.json(body));
  }
  vi.stubGlobal("fetch", fetch);
  return fetch;
};

const appleTrack = (overrides: Record<string, unknown>) => ({
  wrapperType: "track",
  discNumber: 1,
  trackNumber: 2,
  trackName: "You Oughta Know",
  trackTimeMillis: 249000,
  trackViewUrl: "https://music.apple.com/us/album/you-oughta-know/1?i=2&uo=4",
  ...overrides,
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("findAppleMusicUrlByUpc", () => {
  it("should match the track by disc and track number", async () => {
    const fetch = mockFetch({
      results: [
        { wrapperType: "collection" },
        appleTrack({ trackNumber: 1, trackName: "All I Really Want" }),
        appleTrack({}),
      ],
    });

    expect(await findAppleMusicUrlByUpc(query)).toBe(
      "https://music.apple.com/us/album/you-oughta-know/1?i=2",
    );
    expect(fetch.mock.calls[0][0]).toContain("upc=093624590163");
  });

  it("should accept a censored title when the length matches", async () => {
    mockFetch({ results: [appleTrack({ trackName: "You O***ta Know" })] });

    expect(await findAppleMusicUrlByUpc(query)).not.toBeNull();
  });

  it("should reject a different title and length at the same position", async () => {
    mockFetch({
      results: [appleTrack({ trackName: "Perfect", trackTimeMillis: 188000 })],
    });

    expect(await findAppleMusicUrlByUpc(query)).toBeNull();
  });

  it("should skip the lookup without a UPC", async () => {
    const fetch = mockFetch();

    expect(await findAppleMusicUrlByUpc({ ...query, upc: null })).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("findTidalUrlByUpc", () => {
  const credentials = { clientId: "id", clientSecret: "secret" };
  const token = { access_token: "token", expires_in: 3600 };
  const album = (tracks: { id: string; trackNumber: number }[]) => ({
    data: [
      {
        relationships: {
          items: {
            data: tracks.map(({ id, trackNumber }) => ({
              id,
              meta: { volumeNumber: 1, trackNumber },
            })),
          },
        },
      },
    ],
  });

  const loadFindTidalUrlByUpc = async () => {
    vi.resetModules();
    return (await import("./links")).findTidalUrlByUpc;
  };

  it("should match the track by ISRC", async () => {
    const findTidalUrlByUpc = await loadFindTidalUrlByUpc();
    mockFetch(token, {
      ...album([{ id: "1", trackNumber: 2 }]),
      included: [
        { id: "1", type: "tracks", attributes: { isrc: "USMV29900090" } },
        { id: "9", type: "tracks", attributes: { isrc: "USMV29900091" } },
      ],
    });

    expect(await findTidalUrlByUpc(query, credentials)).toBe(
      "https://tidal.com/track/9",
    );
  });

  it("should fall back to disc and track number", async () => {
    const findTidalUrlByUpc = await loadFindTidalUrlByUpc();
    mockFetch(
      token,
      album([
        { id: "1", trackNumber: 1 },
        { id: "2", trackNumber: 2 },
      ]),
    );

    expect(await findTidalUrlByUpc({ ...query, isrc: null }, credentials)).toBe(
      "https://tidal.com/track/2",
    );
  });
});
