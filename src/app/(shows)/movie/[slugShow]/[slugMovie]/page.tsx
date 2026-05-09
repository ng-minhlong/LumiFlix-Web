import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  ChevronRight,
  Film,
  Play,
  Sparkles,
  Tv2,
} from "lucide-react"

import { prisma } from "@/server/db"

interface MovieDetailPageProps {
  params: {
    slugShow: string
    slugMovie: string
  }
  searchParams?: {
    source?: string
    season?: string
    episode?: string
  }
}

const SOURCE_OPTIONS = [
  {
    id: "1",
    label: "Source 1",
    movieUrl: (tmdbId: string | number) =>
      `https://moviesapi.club/movie/${tmdbId}`,
    tvUrl: (
      tmdbId: string | number,
      seasonNumber: number,
      episodeNumber: number
    ) => `https://moviesapi.club/tv/${tmdbId}-${seasonNumber}-${episodeNumber}`,
  },
  {
    id: "2",
    label: "Source 2",
    movieUrl: (tmdbId: string | number) =>
      `https://vidsrc-embed.ru/embed/movie/${tmdbId}`,
    tvUrl: (
      tmdbId: string | number,
      seasonNumber: number,
      episodeNumber: number
    ) => `https://vidsrc-embed.ru/embed/tv/${tmdbId}/${seasonNumber}/${episodeNumber}`,
  },
] as const

function buildHref({
  showSlug,
  videoKey,
  source,
}: {
  showSlug: string
  videoKey: string
  source: string
}) {
  const params = new URLSearchParams()
  params.set("source", source)
  // Không cần set season/episode vào query nữa vì thông tin đã nằm trong video_key và logic server-side
  return `/movie/${showSlug}/${videoKey}`
}

export default async function MovieDetailPage({
  params,
  searchParams,
}: MovieDetailPageProps) {
  const show = await prisma.show.findUnique({
    where: { slug: params.slugShow },
    include: {
      seasons: {
        orderBy: { season_number: "asc" },
        include: {
          episodes: {
            orderBy: { episode_number: "asc" },
          },
        },
      },
    },
  })

  if (!show) {
    notFound()
  }

  const movie = await prisma.movie.findFirst({
    where: {
      key: params.slugMovie,
      showId: show.id,
    },
  })

  const episode = movie
    ? null
    : await prisma.episode.findFirst({
      where: {
        video_key: params.slugMovie,
        showId: show.id,
      },
      include: {
        season: true,
      },
    })

  if (!movie && !episode) {
    notFound()
  }

  const isMovie = show.media_type === "movie"
  const basePath = `/movie/${show.slug}/${params.slugMovie}`

  const currentSourceId = searchParams?.source === "2" ? "2" : "1"
  const currentSource =
    SOURCE_OPTIONS.find((s) => s.id === currentSourceId) ?? SOURCE_OPTIONS[0]

  const selectedSeasonNumber = (() => {
    if (isMovie) return null
    const requested = Number(searchParams?.season)
    if (Number.isFinite(requested) && requested > 0) return requested
    return show.seasons[0]?.season_number ?? null
  })()

  const selectedSeason =
    !isMovie && selectedSeasonNumber
      ? show.seasons.find((s) => s.season_number === selectedSeasonNumber) ??
      show.seasons[0] ??
      null
      : null

  const selectedEpisodeNumber = (() => {
    if (isMovie || !selectedSeason) return null
    const requested = Number(searchParams?.episode)
    if (Number.isFinite(requested) && requested > 0) return requested
    return selectedSeason.episodes[0]?.episode_number ?? null
  })()

  const selectedEpisode =
    !isMovie && selectedSeason && selectedEpisodeNumber
      ? selectedSeason.episodes.find(
        (e) => e.episode_number === selectedEpisodeNumber
      ) ?? selectedSeason.episodes[0] ?? null
      : null

  const allEpisodes = show.seasons.flatMap((s) => s.episodes)
  const currentEpisodeIndex = episode
    ? allEpisodes.findIndex((e) => e.id === episode.id)
    : -1

  const prevEpisode =
    !isMovie && currentEpisodeIndex > 0
      ? allEpisodes[currentEpisodeIndex - 1]
      : null

  const nextEpisode =
    !isMovie && currentEpisodeIndex < allEpisodes.length - 1
      ? allEpisodes[currentEpisodeIndex + 1]
      : null

  const resolvedVideoUrl = isMovie
    ? currentSource.movieUrl(show.tmdbId)
    : selectedSeason && selectedEpisode
      ? currentSource.tvUrl(
        show.tmdbId,
        selectedSeason.season_number,
        selectedEpisode.episode_number
      )
      : currentSource.movieUrl(show.tmdbId)

  const showTitle = show.title ?? show.name ?? "Untitled"
  const pageTitle = isMovie
    ? showTitle
    : `${showTitle} - S${String(selectedSeason?.season_number ?? 1).padStart(
      2,
      "0"
    )} - E${String(selectedEpisode?.episode_number ?? 1).padStart(2, "0")}`

  const fakeGenres = ["Drama", "Thriller", "Action", "Adventure"]
  const fakeActors = [
    "Tom Hardy",
    "Zendaya",
    "Robert Pattinson",
    "Anya Taylor-Joy",
  ]
  const fakeCountries = ["United States", "United Kingdom", "Japan"]

  const heroBackdrop = show.backdrop_path
    ? `https://image.tmdb.org/t/p/original${show.backdrop_path}`
    : ""

  const posterUrl = show.poster_path
    ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
    : ""

  return (
    <div className="min-h-screen bg-black text-white">


      <main>
        {/* Player section */}
        <section className="relative overflow-hidden border-b border-white/5">
          {/* Top bar */}
          <header className="sticky top-0 z-50 border-b border-white/5 bg-black/70 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
              <Link
                href={`/movie/${show.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10"
              >
                <ArrowLeft className="size-4" />
              </Link>

              <div className="hidden items-center gap-2 text-sm text-white/60 md:flex">
                <span>{showTitle}</span>
                {!isMovie && (
                  <>
                    <ChevronRight className="size-4" />
                    <span>
                      S{String(selectedSeason?.season_number ?? 1).padStart(2, "0")}
                    </span>
                    <ChevronRight className="size-4" />
                    <span>
                      E{String(selectedEpisode?.episode_number ?? 1).padStart(2, "0")}
                    </span>
                  </>
                )}
              </div>
            </div>
          </header>
          <div className="absolute inset-0">
            {heroBackdrop && (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${heroBackdrop})` }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/65" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
            <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/60">
              <Sparkles className="size-4 text-red-500" />
              <span>Now playing</span>
            </div>

            <div className="mb-5 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                {pageTitle}
              </h1>

              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                {show.media_type === "movie" ? "Movie" : "TV Series"}
              </span>
            </div>

            <p className="max-w-3xl text-sm leading-7 text-white/75 md:text-base">
              {show.overview || "No overview available."}
            </p>

            <div className="mt-6 overflow-hidden rounded-[28px] border border-white/10 bg-neutral-950 shadow-2xl shadow-black/60">
              <div className="relative w-full">
                <div className="aspect-video w-full md:h-[70vh] md:aspect-auto">
                  <iframe
                    key={resolvedVideoUrl}
                    src={resolvedVideoUrl}
                    className="h-full w-full"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    referrerPolicy="no-referrer"
                    title={`${showTitle} player`}
                  />
                </div>
              </div>

              {/* Source buttons */}
              <div className="border-t border-white/5 bg-white/5 px-4 py-4 md:px-6">
                <div className="mb-3 text-xs uppercase tracking-[0.18em] text-white/45">
                  Source
                </div>
                <div className="flex flex-wrap gap-2">
                  {SOURCE_OPTIONS.map((source) => (
                    <Link
                      key={source.id}
                      href={buildHref({
                        showSlug: show.slug,
                        videoKey: params.slugMovie, // Giữ nguyên key hiện tại
                        source: source.id,
                      })}
                      className={[
                        "inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition",
                        currentSourceId === source.id
                          ? "border-red-500 bg-red-500 text-white"
                          : "border-white/10 bg-black/20 text-white/80 hover:border-white/20 hover:bg-white/10",
                      ].join(" ")}
                    >
                      <Play className="size-4" />
                      {source.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Previous / Next for TV */}
            {!isMovie && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {prevEpisode ? (
                  <Link
                    href={buildHref({
                      showSlug: show.slug,
                      videoKey: prevEpisode.video_key, // Dùng video_key của tập trước
                      source: currentSourceId,
                    })}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-white/20 hover:bg-white/10"
                  >
                    <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                      Previous Episode
                    </div>
                    <div className="mt-2 line-clamp-2 text-sm font-medium text-white/90">
                      S{prevEpisode.season?.season_number} · E
                      {prevEpisode.episode_number}
                      {prevEpisode.title ? ` — ${prevEpisode.title}` : ""}
                    </div>
                  </Link>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/45">
                    No previous episode
                  </div>
                )}

                {nextEpisode ? (
                  <Link
                    href={buildHref({
                      showSlug: show.slug,
                      videoKey: nextEpisode.video_key, // Dùng video_key của tập tiếp theo
                      source: currentSourceId,
                    })}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-white/20 hover:bg-white/10"
                  >
                    <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                      Next Episode
                    </div>
                    <div className="mt-2 line-clamp-2 text-sm font-medium text-white/90">
                      S{nextEpisode.season?.season_number} · E
                      {nextEpisode.episode_number}
                      {nextEpisode.title ? ` — ${nextEpisode.title}` : ""}
                    </div>
                  </Link>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/45">
                    No next episode
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Info + Episodes */}
        <section className="mx-auto max-w-7xl px-4 py-10 md:px-8">
          <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
            {/* Left: information */}
            <aside className="space-y-6">
              <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5">
                <div className="relative aspect-[2/3] w-full bg-neutral-900">
                  {posterUrl ? (
                    <img
                      src={posterUrl}
                      alt={showTitle}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-white/40">
                      No poster
                    </div>
                  )}
                </div>

                <div className="space-y-4 p-5">
                  <div className="flex items-center gap-2">
                    <Film className="size-4 text-red-500" />
                    <h2 className="text-lg font-bold">Information</h2>
                  </div>

                  <div className="grid gap-4 text-sm">
                    <div>
                      <p className="text-white/45">Type</p>
                      <p className="font-medium">
                        {show.media_type === "movie" ? "Movie" : "TV Series"}
                      </p>
                    </div>

                    <div>
                      <p className="text-white/45">Year</p>
                      <p className="font-medium">
                        {show.release_date || show.first_air_date || "Unknown"}
                      </p>
                    </div>

                    <div>
                      <p className="text-white/45">TMDB ID</p>
                      <p className="font-medium">{show.tmdbId}</p>
                    </div>

                    <div>
                      <p className="text-white/45">Genres</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {fakeGenres.map((genre) => (
                          <span
                            key={genre}
                            className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-white/45">Cast</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {fakeActors.map((actor) => (
                          <span
                            key={actor}
                            className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs"
                          >
                            {actor}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-white/45">Countries</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {fakeCountries.map((country) => (
                          <span
                            key={country}
                            className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs"
                          >
                            {country}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-white/45">Overview</p>
                      <p className="mt-2 text-sm leading-7 text-white/80">
                        {show.overview || "No overview available."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Right: episodes */}
            <section className="space-y-6">
              {isMovie ? (
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                  <div className="flex items-center gap-2">
                    <Tv2 className="size-4 text-red-500" />
                    <h2 className="text-lg font-bold">Movie playback</h2>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-white/70">
                    This title is a movie, so there are no seasons or episodes.
                    Use the source buttons above to switch providers.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold md:text-3xl">
                        Episodes
                      </h2>
                      <p className="mt-1 text-sm text-white/45">
                        Browse episodes by season
                      </p>
                    </div>

                    <div className="text-sm text-white/45">
                      {show.seasons.length} seasons
                    </div>
                  </div>

                  <div className="space-y-8">
                    {show.seasons.map((season) => {
                      const isActiveSeason =
                        season.season_number === selectedSeason?.season_number

                      return (
                        <section
                          key={season.id}
                          className={[
                            "rounded-[28px] border p-5",
                            isActiveSeason
                              ? "border-red-500/40 bg-red-500/5"
                              : "border-white/10 bg-white/5",
                          ].join(" ")}
                        >
                          <div className="mb-5 flex items-center justify-between gap-4">
                            <div>
                              <h3 className="text-xl font-semibold">
                                Season {season.season_number}
                              </h3>
                              <p className="mt-1 text-sm text-white/45">
                                {season.episodes.length} episodes
                              </p>
                            </div>

                            <Link
                              href={buildHref({
                                showSlug: show.slug,
                                videoKey: season.episodes[0]?.video_key ?? params.slugMovie,
                                source: currentSourceId,
                              })}
                              className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10"
                            >
                              Open season
                            </Link>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {season.episodes.map((ep) => {
                              const isActive = ep.id === selectedEpisode?.id
                              const still = ep.still_path
                                ? `https://image.tmdb.org/t/p/w780${ep.still_path}`
                                : heroBackdrop

                              return (
                                <Link
                                  key={ep.id}
                                  href={buildHref({
                                    showSlug: show.slug,
                                    videoKey: ep.video_key, // Trỏ thẳng đến video_key của tập này
                                    source: currentSourceId,
                                  })}
                                  className={[
                                    "group overflow-hidden rounded-2xl border transition",
                                    isActive
                                      ? "border-red-500 bg-red-500/10"
                                      : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/10",
                                  ].join(" ")}
                                >
                                  <div className="relative aspect-video">
                                    {still ? (
                                      <div
                                        className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                                        style={{ backgroundImage: `url(${still})` }}
                                      />
                                    ) : (
                                      <div className="absolute inset-0 bg-neutral-900" />
                                    )}

                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                                    <div className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/85 backdrop-blur">
                                      E{ep.episode_number}
                                    </div>

                                    <div className="absolute bottom-3 left-3 right-3">
                                      <div className="flex items-end justify-between gap-3">
                                        <div className="min-w-0">
                                          <div className="truncate text-sm font-semibold">
                                            {ep.title ||
                                              `Episode ${ep.episode_number}`}
                                          </div>
                                          <div className="text-xs text-white/65">
                                            Season {season.season_number}
                                          </div>
                                        </div>

                                        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-black transition group-hover:scale-105">
                                          <Play className="size-4 fill-black" />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </Link>
                              )
                            })}
                          </div>
                        </section>
                      )
                    })}
                  </div>
                </div>
              )}
            </section>
          </div>
        </section>
      </main>
    </div>
  )
}