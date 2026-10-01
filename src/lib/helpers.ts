import dayjs from "dayjs";
import { ORDERED_TAGS, TAGS } from "./constants";
import { removeSongExtraText } from "./matching";
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
  const yearsDiff =
    dayjs(selectedReleaseDate).year() - dayjs(earlierReleaseDate).year();

  return yearsDiff === 0
    ? "earlier that year"
    : `${yearsDiff} year${yearsDiff === 1 ? "" : "s"} earlier`;
};

export const getSortedTags = (tags: Enums<"tags">[]) => {
  return tags
    .filter((tag) => ORDERED_TAGS.includes(tag))
    .sort((a, b) => ORDERED_TAGS.indexOf(a) - ORDERED_TAGS.indexOf(b));
};

export const createDebouncer = (delay = 250) => {
  let timer: ReturnType<typeof setTimeout>;
  const cancel = () => clearTimeout(timer);
  const debounce = (callback: () => void) => {
    cancel();
    timer = setTimeout(callback, delay);
  };
  return Object.assign(debounce, { cancel });
};

export const toTitleCase = (text: string) =>
  text.replace(/(^|\s)\p{Ll}/gu, (c) => c.toUpperCase());

export const tagTitle = (tag: Enums<"tags">) => toTitleCase(TAGS[tag].label);

export const getArtistLink = (artist: string) => {
  return `/?q=${encodeURIComponent(artist)}`;
};

export const getYouTubeLink = (name: string, artists: string[]) => {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${artists[0]} ${name}`)}`;
};

export const getPageHref = (
  url: Pick<URL, "pathname" | "search">,
  page: number,
) => {
  const params = new URLSearchParams(url.search);
  if (page === 1) params.delete("page");
  else params.set("page", String(page));
  return params.size ? `${url.pathname}?${params}` : url.pathname;
};
