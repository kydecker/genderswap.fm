import { decode } from "jpeg-js";
import { extractAlbumColor } from "#lib/albumColor.js";

export const getAlbumColor = async (url: string): Promise<string | null> => {
  const response = await fetch(url);
  if (!response.ok) return null;
  const { data } = decode(new Uint8Array(await response.arrayBuffer()), {
    useTArray: true,
    formatAsRGBA: true,
  });
  return extractAlbumColor(data);
};
