import { render } from "@testing-library/svelte";
import { describe, it } from "vitest";
import CoverCard from "./CoverCard.svelte";

describe("CoverCard", () => {
  it("should link to the slug", async ({ expect }) => {
    const album = { name: "Name", artists: ["Artist"], artwork: "a.jpg" };
    const { container } = render(CoverCard, {
      props: {
        original: album,
        cover: album,
        slug: "test-slug",
      },
    });

    const linkElement = container.querySelector("a");
    expect(linkElement).toBeDefined();
    expect(linkElement?.getAttribute("href")).toBe("/cover/test-slug");
  });

  it("should set `loading` to `lazy` when prop is set", async ({ expect }) => {
    const original = {
      name: "Original Name",
      artists: ["Original Artist"],
      artwork: "test.jpg",
    };
    const cover = {
      name: "Cover Name",
      artists: ["Cover Artist"],
      artwork: "test-cover.jpg",
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
      artwork: "test.jpg",
    };
    const cover = {
      name: "Cover Name",
      artists: ["Cover Artist"],
      artwork: "test-cover.jpg",
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
      artwork: "test.jpg",
    };
    const cover = {
      name: "Cover Name",
      artists: ["Cover Artist"],
      artwork: "test-cover.jpg",
    };

    const { container, getByText } = render(CoverCard, {
      props: { original, cover, slug: "test-slug" },
    });

    const originalNameElement = getByText("Original Name");
    expect(originalNameElement).toBeDefined();

    const originalArtistElement = container.querySelector(".covering .name");
    expect(originalArtistElement?.textContent).toBe("Original Artist");

    const coverArtistElement = getByText("Cover Artist");
    expect(coverArtistElement).toBeDefined();
  });

  it("should render multiple artist names correctly", async ({ expect }) => {
    const original = {
      name: "Original Name",
      artists: ["Original Artist", "Original Artist 2"],
      artwork: "test.jpg",
    };
    const cover = {
      name: "Cover Name",
      artists: ["Cover Artist", "Cover Artist 2"],
      artwork: "test-cover.jpg",
    };

    const { container, getByText } = render(CoverCard, {
      props: { original, cover, slug: "test-slug" },
    });

    const originalArtistElement = container.querySelector(".covering .name");
    expect(originalArtistElement?.textContent).toBe(
      "Original Artist, Original Artist 2",
    );

    const coverArtistElement = getByText("Cover Artist, Cover Artist 2");
    expect(coverArtistElement).toBeDefined();
  });
});
