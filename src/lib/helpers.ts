import dayjs from "dayjs";
import { ORDERED_TAG_GROUPS } from "./constants";
import type { Enums } from "./types/types";

export const getMaxCharacterHelpText = (input: string, maxLength: number) => {
  if (input.length === 0) {
    return `${maxLength} characters max`;
  }

  if (input.length > maxLength) {
    return `${input.length - maxLength} ${
      input.length - maxLength === 1 ? "character" : "characters"
    } over limit`;
  }

  return `${maxLength - input.length} ${
    maxLength - input.length === 1 ? "character" : "characters"
  } left`;
};

export const getReadableTitle = ({
  originalName,
  originalArtists,
  coverArtists,
}: {
  originalName: string;
  originalArtists: string[];
  coverArtists: string[];
}) => {
  return smartquotes(
    `${coverArtists[0]}'s cover of ${originalName} by ${originalArtists[0]}`,
  );
};

export const removeSongExtraText = (song: string) => {
  const songNoExtras = song
    // Remove parentheses from songs *if* they have a space beforehand
    // MATCH: "Crazy in Love (feat. Jay-Z)" -> "Crazy in Love"
    // DO NOT MATCH: "(I Can't Get No) Satisfaction"
    .replace(/\s\([^()]*\)/g, "")
    .trim()
    // Remove everything after a ' - ' in the song name
    // "Can't Get You out of My Head - Live at KEXP" -> "Can't Get You out of My Head"
    .split(" - ")[0]
    // Remove bracketed text
    // "What Was I Made For? [From The Motion Picture "Barbie"]" -> "What Was I Made For?"
    .replace(/\s\[[^\]]*\]/g, "");

  return songNoExtras;
};

export const slugify = (str: string) => {
  return (
    str
      .normalize("NFKD") // split accented characters into their base characters and diacritical marks
      .replace(/[\u0300-\u036f]/g, "") // remove all the accents, which happen to be all in the \u03xx UNICODE block.
      .trim() // trim leading or trailing whitespace
      .toLowerCase() // convert to lowercase
      // remove . , " ' “ ” ‘ ’ # ! $ %  & * ; : = _ ` ~ @ < > + | { } ( ) [ ] ^ *
      .replace(/[.,"'“”‘’#!?$%&%;:=_`~@<>+|{}()[\]^*]/g, "")
      .replace(/\/+/g, "-") // replace forward slashes with hyphens
      .replace(/\s+/g, "-") // replace spaces with hyphens
      .replace(/-+/g, "-") // remove consecutive hyphens
  );
};

export const slugifyCover = (name: string, artist: string) => {
  const slug = `${slugify(removeSongExtraText(name))}-${slugify(artist)}`;
  return slug;
};

export const smartquotes = (str: string) => {
  return str
    .replace(/(^|[-\u2014\s(["])'/g, "$1\u2018") // opening singles
    .replace(/'/g, "\u2019") // closing singles & apostrophes
    .replace(/(^|[-\u2014/[(\u2018\s])"/g, "$1\u201c") // opening doubles
    .replace(/"/g, "\u201d") // closing doubles
    .replace(/--/g, "\u2014") // em-dashes
    .replace(/\.\.\./g, "\u2026"); // ellipses
};

export const getYearsEarlierText = (
  selectedReleaseDate: string,
  earlierReleaseDate: string,
) => {
  const afterDate = dayjs(selectedReleaseDate);
  const beforeDate = dayjs(earlierReleaseDate);
  const yearsDiff = afterDate.diff(beforeDate, "year");

  return yearsDiff === 0
    ? "earlier that year"
    : `${yearsDiff} year${yearsDiff === 1 ? "" : "s"} earlier`;
};

export const getSortedTags = (tags: Enums<"tags">[]) => {
  return tags.sort(
    (a, b) =>
      ORDERED_TAG_GROUPS.flat().indexOf(a) -
      ORDERED_TAG_GROUPS.flat().indexOf(b),
  );
};

export const encodeSearchQuery = (query: string) => {
  return encodeURIComponent(
    query
      .replace(/\//g, "-") // Replace all forward slashes with dashes
      .replace(/\?/g, ""), // Remove question marks
  ).replace(/'/g, "%27"); // Replace all single quotes with %27;
};

export const getArtistLink = (artist: string) => {
  return `/?q=${encodeURIComponent(artist)}`;
};
