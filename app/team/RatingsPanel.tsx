"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Pencil, Plus, Save, Star, Trash2, X } from "lucide-react";
import type { EvListingRow, EvVariantRow } from "../lib/supabase";
import MediaSourceLogo from "../components/MediaSourceLogo";
import { getSafeReviewUrl, normalizeVehicleMediaRatings, type VehicleMediaRating, type VehicleMediaSource } from "../lib/media-ratings";

type ListingOption = Pick<EvListingRow, "id" | "brand" | "title"> & {
  variants?: Pick<EvVariantRow, "id" | "variant_name">[];
};

type RatingDraft = {
  source_id: string;
  rating_value: string;
  rating_max: string;
  review_url: string;
};

type MediaSourceDraft = {
  name: string;
  website_url: string;
  logo_url: string;
};

type RatingsPanelTab = "ratings" | "outlets";

const EMPTY_DRAFT: RatingDraft = {
  source_id: "",
  rating_value: "",
  rating_max: "5",
  review_url: "",
};

const EMPTY_SOURCE_DRAFT: MediaSourceDraft = {
  name: "",
  website_url: "",
  logo_url: "",
};

export default function RatingsPanel({
  supabase,
  listings,
}: {
  supabase: SupabaseClient;
  listings: ListingOption[];
}) {
  const sortedListings = useMemo(
    () => [...listings].sort((a, b) => `${a.brand} ${a.title}`.localeCompare(`${b.brand} ${b.title}`)),
    [listings]
  );
  const [selectedListingId, setSelectedListingId] = useState("");
  const listingId = sortedListings.some((listing) => listing.id === selectedListingId)
    ? selectedListingId
    : sortedListings[0]?.id ?? "";
  const [variantId, setVariantId] = useState("");
  const selectedListing = sortedListings.find((listing) => listing.id === listingId);
  const variants = selectedListing?.variants ?? [];
  const [mediaSources, setMediaSources] = useState<VehicleMediaSource[]>([]);
  const [sourcesLoaded, setSourcesLoaded] = useState(false);
  const [sourceDraft, setSourceDraft] = useState<MediaSourceDraft>(EMPTY_SOURCE_DRAFT);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [sourceSaving, setSourceSaving] = useState(false);
  const [sourceError, setSourceError] = useState("");
  const [sourceNotice, setSourceNotice] = useState("");
  const [ratings, setRatings] = useState<VehicleMediaRating[]>([]);
  const [loadedListingId, setLoadedListingId] = useState("");
  const [draft, setDraft] = useState<RatingDraft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeTab, setActiveTab] = useState<RatingsPanelTab>("ratings");
  const ratingsTabRef = useRef<HTMLButtonElement>(null);
  const outletsTabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data, error: queryError } = await supabase
        .from("ev_media_sources")
        .select("id, name, website_url, logo_url, created_at")
        .order("name", { ascending: true });

      if (cancelled) return;
      if (queryError) {
        setSourceError(`Could not load media outlets: ${queryError.message}`);
      } else {
        setMediaSources((data ?? []) as VehicleMediaSource[]);
      }
      setSourcesLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    if (!listingId) return;

    let cancelled = false;
    void (async () => {
      const { data, error: queryError } = await supabase
        .from("ev_media_ratings")
        .select("id, listing_id, variant_id, source_id, source_name, rating_value, rating_max, review_url, created_at, media_source:ev_media_sources(id, name, website_url, logo_url)")
        .eq("listing_id", listingId)
        .order("source_name", { ascending: true });

      if (cancelled) return;
      if (queryError) {
        setError(`Could not load media ratings: ${queryError.message}`);
        setRatings([]);
      } else {
        setRatings(normalizeVehicleMediaRatings(data ?? []));
      }
      setLoadedListingId(listingId);
    })();

    return () => {
      cancelled = true;
    };
  }, [listingId, supabase]);

  const resetDraft = () => {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
  };
  const resetSourceDraft = () => {
    setSourceDraft(EMPTY_SOURCE_DRAFT);
    setEditingSourceId(null);
  };
  const visibleRatings = listingId ? ratings : [];
  const loading = !!listingId && loadedListingId !== listingId;
  const draftSource = mediaSources.find((source) => source.id === draft.source_id);
  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentTab: RatingsPanelTab) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const nextTab = event.key === "Home"
      ? "ratings"
      : event.key === "End"
        ? "outlets"
        : currentTab === "ratings"
          ? "outlets"
          : "ratings";
    setActiveTab(nextTab);
    (nextTab === "ratings" ? ratingsTabRef : outletsTabRef).current?.focus();
  };

  const handleSourceSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSourceError("");
    setSourceNotice("");

    const name = sourceDraft.name.trim();
    const websiteUrl = getSafeReviewUrl(sourceDraft.website_url);
    const logoUrl = getSafeReviewUrl(sourceDraft.logo_url);
    if (!name) {
      setSourceError("Enter the media outlet name.");
      return;
    }
    if (!websiteUrl) {
      setSourceError("Enter a valid HTTP or HTTPS website URL.");
      return;
    }
    if (sourceDraft.logo_url.trim() && !logoUrl) {
      setSourceError("Enter a valid HTTP or HTTPS logo URL.");
      return;
    }

    setSourceSaving(true);
    try {
      const payload = {
        name,
        website_url: websiteUrl,
        logo_url: logoUrl,
      };
      const result = editingSourceId
        ? await supabase.from("ev_media_sources").update(payload).eq("id", editingSourceId).select("*").maybeSingle()
        : await supabase.from("ev_media_sources").insert(payload).select("*").maybeSingle();

      if (result.error) {
        setSourceError(`Could not save media outlet: ${result.error.message}`);
        return;
      }
      if (!result.data) {
        setSourceError("No media outlet was saved. Confirm you're signed in and the catalogue policies allow authenticated writes.");
        return;
      }

      const savedSource = result.data as VehicleMediaSource;
      setMediaSources((current) =>
        [...current.filter((source) => source.id !== savedSource.id), savedSource]
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      setRatings((current) =>
        current.map((rating) => rating.source_id === savedSource.id
          ? { ...rating, source_name: savedSource.name, media_source: savedSource }
          : rating)
      );
      setSourceNotice(editingSourceId ? "Media outlet details updated." : "Media outlet added.");
      resetSourceDraft();
    } finally {
      setSourceSaving(false);
    }
  };

  const handleEditSource = (source: VehicleMediaSource) => {
    setSourceDraft({
      name: source.name,
      website_url: source.website_url ?? "",
      logo_url: source.logo_url ?? "",
    });
    setEditingSourceId(source.id);
    setSourceError("");
    setSourceNotice("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");

    const source = mediaSources.find((entry) => entry.id === draft.source_id);
    const ratingValue = Number(draft.rating_value);
    const ratingMax = Number(draft.rating_max);
    const reviewUrl = getSafeReviewUrl(draft.review_url);

    if (!source) {
      setError("Select a media outlet from the catalogue.");
      return;
    }
    if (!Number.isFinite(ratingValue) || !Number.isFinite(ratingMax) || ratingMax <= 0 || ratingValue < 0 || ratingValue > ratingMax) {
      setError("Enter a rating between 0 and its maximum score.");
      return;
    }
    if (draft.review_url.trim() && !reviewUrl) {
      setError("Enter a valid HTTP or HTTPS review URL.");
      return;
    }

    const payload = {
      listing_id: listingId,
      variant_id: variantId || null,
      source_id: source.id,
      source_name: source.name,
      rating_value: ratingValue,
      rating_max: ratingMax,
      review_url: reviewUrl,
    };

    setSaving(true);
    try {
      const result = editingId
        ? await supabase.from("ev_media_ratings").update(payload).eq("id", editingId).select("*").single()
        : await supabase.from("ev_media_ratings").insert(payload).select("*").single();

      if (result.error) {
        setError(`Could not save rating: ${result.error.message}`);
        return;
      }

      const savedRating = {
        ...result.data,
        media_source: source,
      } as VehicleMediaRating;
      setRatings((current) =>
        [...current.filter((rating) => rating.id !== savedRating.id), savedRating]
          .sort((a, b) => a.source_name.localeCompare(b.source_name))
      );
      setNotice(editingId ? "Rating updated." : "Rating added.");
      resetDraft();
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (rating: VehicleMediaRating) => {
    setDraft({
      source_id: rating.source_id,
      rating_value: String(rating.rating_value),
      rating_max: String(rating.rating_max),
      review_url: rating.review_url ?? "",
    });
    setVariantId(rating.variant_id ?? "");
    setEditingId(rating.id);
    setError("");
    setNotice("");
  };

  const handleDelete = async (rating: VehicleMediaRating) => {
    if (!window.confirm(`Delete the ${rating.source_name} rating?`)) return;
    setError("");
    setNotice("");

    const { error: deleteError } = await supabase
      .from("ev_media_ratings")
      .delete()
      .eq("id", rating.id)
      .select("id")
      .single();

    if (deleteError) {
      setError(`Could not delete rating: ${deleteError.message}`);
      return;
    }

    setRatings((current) => current.filter((entry) => entry.id !== rating.id));
    if (editingId === rating.id) resetDraft();
    setNotice("Rating deleted.");
  };

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-xl font-extrabold text-slate-900">Vehicle media ratings</h2>
        <p className="mt-1 text-sm text-slate-600">
          Add one rating per media outlet for the entire model or a specific variant. Averages normalize scores to five points.
        </p>
      </header>

      <div role="tablist" aria-label="Media ratings management" className="flex w-fit gap-1 rounded-xl bg-slate-100 p-1">
        <button
          ref={ratingsTabRef}
          id="vehicle-ratings-tab"
          type="button"
          role="tab"
          aria-selected={activeTab === "ratings"}
          aria-controls="vehicle-ratings-panel"
          tabIndex={activeTab === "ratings" ? 0 : -1}
          onClick={() => setActiveTab("ratings")}
          onKeyDown={(event) => handleTabKeyDown(event, "ratings")}
          className={`rounded-lg px-4 py-2.5 text-sm font-bold transition-colors ${activeTab === "ratings" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
        >
          Vehicle media ratings
        </button>
        <button
          ref={outletsTabRef}
          id="media-outlets-tab"
          type="button"
          role="tab"
          aria-selected={activeTab === "outlets"}
          aria-controls="media-outlets-panel"
          tabIndex={activeTab === "outlets" ? 0 : -1}
          onClick={() => setActiveTab("outlets")}
          onKeyDown={(event) => handleTabKeyDown(event, "outlets")}
          className={`rounded-lg px-4 py-2.5 text-sm font-bold transition-colors ${activeTab === "outlets" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
        >
          Media outlet catalogue
        </button>
      </div>

      <div
        id="media-outlets-panel"
        role="tabpanel"
        aria-labelledby="media-outlets-tab"
        tabIndex={0}
        hidden={activeTab !== "outlets"}
        className="space-y-6"
      >
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div>
          <h3 className="font-extrabold text-slate-900">Media outlet catalogue</h3>
          <p className="mt-1 text-sm text-slate-600">
            Reuse outlet names, websites, and logos across vehicles. Outlet names cannot be changed after creation.
          </p>
        </div>
        <form onSubmit={handleSourceSubmit} className="grid gap-3 md:grid-cols-3">
          <label className="text-sm font-bold text-slate-700">
            Outlet name
            <input
              required
              maxLength={120}
              disabled={!!editingSourceId}
              value={sourceDraft.name}
              onChange={(event) => setSourceDraft({ ...sourceDraft, name: event.target.value })}
              placeholder="e.g. Autocar India"
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-medium disabled:bg-slate-100"
            />
          </label>
          <label className="text-sm font-bold text-slate-700">
            Website URL
            <input
              required
              type="url"
              value={sourceDraft.website_url}
              onChange={(event) => setSourceDraft({ ...sourceDraft, website_url: event.target.value })}
              placeholder="https://..."
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-medium"
            />
          </label>
          <label className="text-sm font-bold text-slate-700">
            Logo URL (optional)
            <input
              type="url"
              value={sourceDraft.logo_url}
              onChange={(event) => setSourceDraft({ ...sourceDraft, logo_url: event.target.value })}
              placeholder="https://..."
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-medium"
            />
          </label>
          {(sourceError || sourceNotice) && (
            <p className={`text-sm md:col-span-3 ${sourceError ? "text-rose-700" : "text-emerald-700"}`} role={sourceError ? "alert" : "status"}>
              {sourceError || sourceNotice}
            </p>
          )}
          <div className="flex gap-2 md:col-span-3">
            <button
              type="submit"
              disabled={sourceSaving || !sourcesLoaded}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {editingSourceId ? <Save size={16} /> : <Plus size={16} />}
              {sourceSaving ? "Saving…" : editingSourceId ? "Save outlet details" : "Add media outlet"}
            </button>
            {editingSourceId && (
              <button
                type="button"
                onClick={resetSourceDraft}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"
              >
                <X size={16} /> Cancel
              </button>
            )}
          </div>
        </form>

        {!sourcesLoaded && <p className="text-sm text-slate-500">Loading media outlets…</p>}
        {sourcesLoaded && mediaSources.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {mediaSources.map((source) => {
              const websiteUrl = getSafeReviewUrl(source.website_url);
              return (
                <div key={source.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <MediaSourceLogo name={source.name} logoUrl={source.logo_url} />
                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-900">{source.name}</p>
                      {websiteUrl && (
                        <a href={websiteUrl} target="_blank" rel="noreferrer" className="block truncate text-xs text-emerald-700 underline">
                          {websiteUrl}
                        </a>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEditSource(source)}
                    aria-label={`Edit ${source.name} website and logo`}
                    className="shrink-0 rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
      </div>

      <div
        id="vehicle-ratings-panel"
        role="tabpanel"
        aria-labelledby="vehicle-ratings-tab"
        tabIndex={0}
        hidden={activeTab !== "ratings"}
        className="space-y-6"
      >
      <label className="block max-w-xl text-sm font-bold text-slate-700">
        Vehicle
        <select
          value={listingId}
          onChange={(event) => {
            setSelectedListingId(event.target.value);
            setVariantId("");
            setError("");
            resetDraft();
            setNotice("");
          }}
          className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-medium"
        >
          {sortedListings.map((listing) => (
            <option key={listing.id} value={listing.id}>
              {listing.brand} {listing.title}
            </option>
          ))}
        </select>
      </label>

      {!!listingId && (
        <label className="block max-w-xl text-sm font-bold text-slate-700">
          Rating scope
          <select
            value={variantId}
            onChange={(event) => setVariantId(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-medium"
          >
            <option value="">Entire model</option>
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id}>{variant.variant_name}</option>
            ))}
          </select>
        </label>
      )}

      {sortedListings.length === 0 && (
        <p className="rounded-xl bg-slate-100 p-4 text-sm text-slate-600">No vehicles are available to rate.</p>
      )}

      {!!listingId && (
        <form onSubmit={handleSubmit} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
          <label className="text-sm font-bold text-slate-700">
            Media outlet
            <select
              required
              value={draft.source_id}
              onChange={(event) => setDraft({ ...draft, source_id: event.target.value })}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-medium"
            >
              <option value="">{sourcesLoaded ? "Select an outlet" : "Loading outlets…"}</option>
              {mediaSources.map((source) => (
                <option key={source.id} value={source.id}>{source.name}</option>
              ))}
            </select>
          </label>
          {draftSource && (
            <div className="flex items-center gap-3">
              <MediaSourceLogo name={draftSource.name} logoUrl={draftSource.logo_url} />
              <div className="min-w-0">
                <p className="font-bold text-slate-900">{draftSource.name}</p>
                {getSafeReviewUrl(draftSource.website_url) && (
                  <a href={getSafeReviewUrl(draftSource.website_url)!} target="_blank" rel="noreferrer" className="text-xs text-emerald-700 underline">
                    Outlet website
                  </a>
                )}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-bold text-slate-700">
              Rating
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={draft.rating_value}
                onChange={(event) => setDraft({ ...draft, rating_value: event.target.value })}
                placeholder="4.5"
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-medium"
              />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Out of
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={draft.rating_max}
                onChange={(event) => setDraft({ ...draft, rating_max: event.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-medium"
              />
            </label>
          </div>
          <label className="text-sm font-bold text-slate-700 md:col-span-2">
            Review URL (optional)
            <input
              type="url"
              value={draft.review_url}
              onChange={(event) => setDraft({ ...draft, review_url: event.target.value })}
              placeholder="https://..."
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-medium"
            />
          </label>
          {(error || notice) && (
            <p className={`text-sm md:col-span-2 ${error ? "text-rose-700" : "text-emerald-700"}`} role="status">
              {error || notice}
            </p>
          )}
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {editingId ? <Save size={16} /> : <Plus size={16} />}
              {saving ? "Saving…" : editingId ? "Save rating" : "Add rating"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetDraft}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700"
              >
                <X size={16} /> Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {error && !listingId && <p className="text-sm text-rose-700" role="alert">{error}</p>}

      <div className="space-y-3">
        {loading && <p className="text-sm text-slate-500">Loading ratings…</p>}
        {!loading && listingId && ratings.length === 0 && !error && (
          <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
            No media ratings have been added for this vehicle yet.
          </p>
        )}
        {visibleRatings.map((rating) => (
          <article key={rating.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex min-w-0 items-center gap-3">
              <MediaSourceLogo
                name={rating.media_source?.name ?? rating.source_name}
                logoUrl={rating.media_source?.logo_url}
              />
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900">{rating.media_source?.name ?? rating.source_name}</h3>
                <p className="mt-0.5 text-xs font-medium text-slate-500">
                  {rating.variant_id
                    ? variants.find((variant) => variant.id === rating.variant_id)?.variant_name ?? "Vehicle variant"
                    : "Entire model"}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-amber-700">
                  <Star size={15} fill="currentColor" />
                  {rating.rating_value} / {rating.rating_max}
                  {getSafeReviewUrl(rating.review_url) && (
                    <a
                      href={getSafeReviewUrl(rating.review_url)!}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-2 font-semibold text-emerald-700 underline"
                    >
                      Review
                    </a>
                  )}
                  {getSafeReviewUrl(rating.media_source?.website_url) && (
                    <a
                      href={getSafeReviewUrl(rating.media_source?.website_url)!}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-2 font-semibold text-slate-600 underline"
                    >
                      Outlet
                    </a>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => handleEdit(rating)} aria-label={`Edit ${rating.source_name} rating`} className="rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-slate-50">
                <Pencil size={16} />
              </button>
              <button type="button" onClick={() => void handleDelete(rating)} aria-label={`Delete ${rating.source_name} rating`} className="rounded-lg border border-rose-200 p-2 text-rose-700 hover:bg-rose-50">
                <Trash2 size={16} />
              </button>
            </div>
          </article>
        ))}
      </div>
      </div>
    </section>
  );
}
