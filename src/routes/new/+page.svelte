<script lang="ts">
import type { FormEventHandler } from "svelte/elements";
import autosize from "svelte-autosize";
import { superForm } from "sveltekit-superforms";
import { browser } from "$app/environment";
import { page } from "$app/state";
import { albumColorFromImage } from "$lib/albumColor";
import { itunesArtworkUrl } from "$lib/artwork";
import ColorSwirl from "$lib/components/ColorSwirl.svelte";
import ErrorMessage from "$lib/components/ErrorMessage.svelte";
import GenderSelect from "$lib/components/GenderSelect.svelte";
import NewCoverIcon from "$lib/components/NewCoverIcon.svelte";
import SongSelect from "$lib/components/SongSelect.svelte";
import Step from "$lib/components/Step.svelte";
import Steps from "$lib/components/Steps.svelte";
import {
  MAX_CONTRIBUTOR_CHARS,
  MAX_DESCRIPTION_CHARS,
  SITE_URL,
} from "$lib/constants";
import { getMaxCharacterHelpText } from "$lib/helpers";
import { setPageColor } from "$lib/pageColor";
import AlertIcon from "~icons/ri/alert-line";
import LoaderIcon from "~icons/ri/loader-4-line";

let { data } = $props();

// superForm takes a one-time snapshot; server round-trips sync via applyAction.
// svelte-ignore state_referenced_locally
const { form, errors, enhance, submitting, delayed } = superForm(data.form, {
  dataType: "json",
  scrollToError: "smooth",
});

$form.contributor = browser
  ? (window.localStorage.getItem("contributor") ?? "")
  : "";

let originalColor: string | null = $state(null);
let coverColor: string | null = $state(null);

const originalArtwork = $derived($form.original?.artwork);
const coverArtwork = $derived($form.cover?.artwork);

const watchColor = (
  artwork: string | undefined,
  set: (color: string | null) => void,
) => {
  set(null);
  if (!artwork) return;
  let current = true;
  albumColorFromImage(itunesArtworkUrl(artwork, 64, "jpg"))
    .then((color) => current && set(color))
    .catch(() => {});
  return () => {
    current = false;
  };
};

$effect(() => watchColor(originalArtwork, (color) => (originalColor = color)));
$effect(() => watchColor(coverArtwork, (color) => (coverColor = color)));
$effect(() => setPageColor(coverColor ?? originalColor));

const swirlColors = $derived.by((): [string, string] | null =>
  coverColor && originalColor && coverColor !== originalColor
    ? [coverColor, originalColor]
    : null,
);

const handleDescriptionInput: FormEventHandler<HTMLTextAreaElement> = (e) => {
  $form.description = e.currentTarget.value;
  // Replace any newlines with spaces and trim
  $form.description = $form.description.replace(/\r?\n|\r/g, " ").trimStart();
};

const handleContributorInput: FormEventHandler<HTMLInputElement> = (e) => {
  $form.contributor = e.currentTarget.value;
  // Trim spaces
  $form.contributor = $form.contributor.trimStart();
};

const handleSubmit = () => {
  // Save name to local storage for reuse
  if (browser) window.localStorage.setItem("contributor", $form.contributor);
};
</script>

<svelte:head>
  <title>Add a cover</title>
  <meta name="description" content="Upload a fresh gender-swapped cover to the catalogue." />
  <link rel="canonical" href={`${SITE_URL}${page.url.pathname}`} />
</svelte:head>

{#if swirlColors}
  {#key swirlColors.join()}
    <ColorSwirl colors={swirlColors} />
  {/key}
{/if}

<form class="submitForm" method="POST" use:enhance>
  <h1 class="header">Add a cover</h1>
  <Steps>
    <Step title="Select the cover">
      <SongSelect name="cover" bind:value={$form.cover} errors={$errors.cover as string[] | undefined} />
      <GenderSelect
        name="coverGenders"
        bind:value={$form.coverGenders}
        errors={$errors.coverGenders?._errors}
      />
    </Step>
    <Step title="Select the original">
      <SongSelect name="original" bind:value={$form.original} errors={$errors.original as string[] | undefined} />
      <GenderSelect
        name="originalGenders"
        bind:value={$form.originalGenders}
        errors={$errors.originalGenders?._errors}
      />
      {#if $form.originalGenders.length === 1 && $form.coverGenders.length === 1}
        {#if JSON.stringify($form.originalGenders) === JSON.stringify($form.coverGenders)}
          <div class="banner">
            <div class="icon">
              <AlertIcon />
            </div>
            <div class="text">
              <strong class="title">Genderswap.fm is for gender-swapped covers.</strong> Same-gender
              covers will be hidden by default.
            </div>
          </div>
        {/if}
      {/if}
    </Step>
    <Step title="Add thoughts">
      <label>
        <div class="label">
          Description <span class="optional">optional</span>
        </div>
        <textarea
          oninput={handleDescriptionInput}
          bind:value={$form.description}
          use:autosize
          name="description"
          class="input"
          placeholder="What's different about this cover?"
        ></textarea>
        <div
          class="helpText"
          class:warning={$form.description && $form.description.length > MAX_DESCRIPTION_CHARS}
        >
          {getMaxCharacterHelpText($form.description ?? '', MAX_DESCRIPTION_CHARS)}
        </div>
      </label>
      <label>
        <div class="label">
          Your first name <span class="optional">optional</span>
        </div>
        <input
          oninput={handleContributorInput}
          bind:value={$form.contributor}
          name="contributor"
          type="text"
          class="input"
          maxlength={MAX_CONTRIBUTOR_CHARS}
          placeholder="Agnetha"
        />
      </label>
      {#if $errors?._errors}
        {#each $errors._errors as error}
          <ErrorMessage {error} banner />
        {/each}
      {/if}
    </Step>
  </Steps>

  <button disabled={$submitting} class="button submitButton" type="submit" onclick={handleSubmit}>
    {#if $delayed}
      <div class="spinner">
        <LoaderIcon />
      </div>
    {:else}
      <NewCoverIcon />
    {/if}
    Submit
  </button>
</form>

<!-- Missing toasts error handling -->

<style>
  .submitForm :global(:is(input, textarea):focus-visible) {
    outline-offset: 0;
  }

  .submitForm {
    inline-size: 100%;
    max-inline-size: 50ch;
    padding-inline: var(--gutter-start) var(--gutter-end);
    padding-block-end: var(--space-2xl);
  }

  .header {
    font-size: var(--step-4);
    padding-block: var(--space-m) var(--space-xl);

    @media (min-width: 56rem) {
      padding-block-start: var(--space-xl);
    }
  }

  .submitButton {
    display: flex;
    padding-inline: var(--space-l) var(--space-xl);
    margin-inline: auto;

    &[disabled] {
      opacity: 0.7;
      cursor: default;
    }

    :global(svg) {
      width: var(--space-xl);
    }
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .spinner {
    animation: spin 0.7s linear infinite;
  }

  .label {
    display: block;
    padding-block-end: var(--space-xs);
  }

  .optional {
    font-size: var(--step--1);
    font-style: italic;
  }

  .input {
    border: none;
    display: block;
    background: var(--color-surface-hover);
    border-radius: var(--radius-m);
    padding-block: var(--space-s);
    padding-inline: var(--space-m);
    width: 100%;
    resize: none;

    &::placeholder {
      color: var(--color-text-subtle);
    }
  }

  .helpText {
    padding-block-start: var(--space-xs);
    font-size: var(--step--1);
    font-variant-numeric: tabular-nums;

    &.warning {
      color: var(--color-text);
      font-weight: var(--font-weight-bold);
    }
  }

  .banner {
    display: flex;
    gap: var(--space-s);
    align-items: flex-start;
    background: var(--color-surface);
    color: var(--color-text);
    padding: var(--space-s) var(--space-m);
    border-radius: var(--radius-s);

    .icon {
      flex-shrink: 0;
      height: 1.5em;
      display: flex;
      align-items: center;
    }
  }
</style>
