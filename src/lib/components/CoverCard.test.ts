import { render } from "@testing-library/svelte";
import { describe, it } from "vitest";
import CoverCard from "./CoverCard.svelte";

describe("CoverCard", () => {
  it("should apply placeholder styles when data is undefined", async ({
    expect,
  }) => {
    const { container } = render(CoverCard, {
      props: { original: undefined, cover: undefined, slug: undefined },
    });

    const coverCardDiv = container.querySelector(".coverCard");
    expect(coverCardDiv).toBeDefined();
    expect(coverCardDiv?.classList.contains("placeholder")).toBe(true);
  });

  it("should link to the slug", async ({ expect }) => {
    const { container } = render(CoverCard, {
      props: { original: undefined, cover: undefined, slug: "test-slug" },
    });

    const linkElement = container.querySelector("a");
    expect(linkElement).toBeDefined();
    expect(linkElement?.getAttribute("href")).toBe("/cover/test-slug");
  });

  it("should set `loading` to `lazy` when prop is set", async ({ expect }) => {
    const original = {
      name: "Original Name",
      artists: ["Original Artist"],
      album_img: ["test.jpg"],
    };
    const cover = {
      name: "Cover Name",
      artists: ["Cover Artist"],
      album_img: ["test-cover.jpg"],
    };

    const { container } = render(CoverCard, {
      props: { original, cover, slug: "test-slug", lazy: true },
    });

    const coverImage = container.querySelector("img");
    expect(coverImage).toBeDefined();
    expect(coverImage?.getAttribute("loading")).toBe("lazy");
  });

  it("should set `loading` to `eager` when `lazy` is undefined", async ({
    expect,
  }) => {
    const original = {
      name: "Original Name",
      artists: ["Original Artist"],
      album_img: ["test.jpg"],
    };
    const cover = {
      name: "Cover Name",
      artists: ["Cover Artist"],
      album_img: ["test-cover.jpg"],
    };

    const { container } = render(CoverCard, {
      props: { original, cover, slug: "test-slug" },
    });

    const coverImage = container.querySelector("img");
    expect(coverImage).toBeDefined();
    expect(coverImage?.getAttribute("loading")).toBe("eager");
  });

  it("should render original name and artists correctly", async ({
    expect,
  }) => {
    const original = {
      name: "Original Name",
      artists: ["Original Artist"],
      album_img: ["test.jpg"],
    };
    const cover = {
      name: "Cover Name",
      artists: ["Cover Artist"],
      album_img: ["test-cover.jpg"],
    };

    const { getByText } = render(CoverCard, {
      props: { original, cover, slug: "test-slug" },
    });

    const originalNameElement = getByText("Original Name");
    expect(originalNameElement).toBeDefined();

    const originalArtistElement = getByText("Original Artist");
    expect(originalArtistElement).toBeDefined();

    const coverArtistElement = getByText("Cover Artist");
    expect(coverArtistElement).toBeDefined();
  });

  it("should render multiple artist names correctly", async ({ expect }) => {
    const original = {
      name: "Original Name",
      artists: ["Original Artist", "Original Artist 2"],
      album_img: ["test.jpg"],
    };
    const cover = {
      name: "Cover Name",
      artists: ["Cover Artist", "Cover Artist 2"],
      album_img: ["test-cover.jpg"],
    };

    const { getByText } = render(CoverCard, {
      props: { original, cover, slug: "test-slug" },
    });

    const originalArtistElement = getByText(
      "Original Artist, Original Artist 2",
    );
    expect(originalArtistElement).toBeDefined();

    const coverArtistElement = getByText("Cover Artist, Cover Artist 2");
    expect(coverArtistElement).toBeDefined();
  });
});
