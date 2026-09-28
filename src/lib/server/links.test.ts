import { afterEach, describe, expect, it, vi } from "vitest";

const query = {
  isrc: "USMV29900091",
  upc: "093624590163",
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

afterEach(() => {
  vi.unstubAllGlobals();
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
