import Link from "next/link"
import { notFound } from "next/navigation"
import { Play, Plus, Star } from "lucide-react"

import { prisma } from "@/server/db"
import { Button } from "@/components/ui/button"

interface MovieShowPageProps {
  params: {
    slugShow: string
  }
}

export default async function MovieShowPage({
  params,
}: MovieShowPageProps) {
  const show = await prisma.show.findUnique({
    where: { slug: params.slugShow },
    include: {
      movies: {
        orderBy: [{ createdAt: "asc" }],
      },
      seasons: {
        orderBy: [{ season_number: "asc" }],
        include: {
          episodes: {
            orderBy: [{ episode_number: "asc" }],
          },
        },
      },
    },
  })

  if (!show) {
    notFound()
  }

  const backdrop = show.backdrop_path
    ? `https://image.tmdb.org/t/p/original${show.backdrop_path}`
    : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop"

  // Fake metadata
  const fakeGenres = ["Action", "Sci-Fi", "Adventure", "Drama"]
  const fakeActors = [
    "Tom Hardy",
    "Zendaya",
    "Robert Pattinson",
    "Ana de Armas",
  ]
  const fakeCountries = ["United States", "Japan", "South Korea"]

  const firstSeason = show.seasons?.[0]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* HERO */}
      <section className="relative h-[92vh] w-full overflow-hidden">
        {/* BACKDROP */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${backdrop})`,
          }}
        />

        {/* OVERLAYS */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/40" />

        {/* CONTENT */}
        <div className="relative z-10 flex h-full items-end">
          <div className="container mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-20 md:px-8">
            <div className="max-w-3xl space-y-5">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="rounded bg-red-600 px-2 py-1 font-semibold">
                  {show.media_type === "movie" ? "MOVIE" : "TV SERIES"}
                </span>

                <span className="text-neutral-300">
                  {show.release_date ||
                    show.first_air_date ||
                    "Unknown year"}
                </span>

                <span className="flex items-center gap-1 text-yellow-400">
                  <Star className="size-4 fill-yellow-400" />
                  8.9/10
                </span>
              </div>

              <h1 className="text-4xl font-black tracking-tight md:text-6xl lg:text-7xl">
                {show.title ?? show.name}
              </h1>

              <p className="max-w-2xl text-sm leading-7 text-neutral-300 md:text-base">
                {show.overview || "-"}
              </p>

              {/* META */}
              <div className="space-y-2 text-sm text-neutral-300">
                <p>
                  <span className="font-semibold text-white">Genres:</span>{" "}
                  {fakeGenres.join(", ")}
                </p>

                <p>
                  <span className="font-semibold text-white">Cast:</span>{" "}
                  {fakeActors.join(", ")}
                </p>

                <p>
                  <span className="font-semibold text-white">Countries:</span>{" "}
                  {fakeCountries.join(", ")}
                </p>
              </div>

              {/* ACTIONS */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {show.media_type === "movie" ? (
                  show.movies[0] && (
                    <Link
                      href={`/movie/${show.slug}/${show.movies[0].key}`}
                    >
                      <Button className="h-12 rounded-full bg-white px-7 text-base font-semibold text-black hover:bg-neutral-200">
                        <Play className="mr-2 size-5 fill-black" />
                        Watch Now
                      </Button>
                    </Link>
                  )
                ) : (
                  firstSeason?.episodes?.[0] && (
                    <Link
                      href={`/movie/${show.slug}/${firstSeason.episodes[0].video_key}`}
                    >
                      <Button className="h-12 rounded-full bg-white px-7 text-base font-semibold text-black hover:bg-neutral-200">
                        <Play className="mr-2 size-5 fill-black" />
                        Watch Now
                      </Button>
                    </Link>
                  )
                )}

                <Button
                  variant="secondary"
                  className="h-12 rounded-full border border-white/10 bg-white/10 px-6 text-white backdrop-blur-md hover:bg-white/20"
                >
                  <Plus className="mr-2 size-5" />
                  Add to Favourite
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TV EPISODES */}
      {show.media_type !== "movie" && show.seasons.length > 0 && (
        <section className="container mx-auto max-w-7xl px-4 py-10 md:px-8">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">
                Episodes
              </h2>
              <p className="mt-1 text-sm text-neutral-400">
                Watch all episodes from every season
              </p>
            </div>

            {/* NETFLIX STYLE SELECT */}
            <div className="w-full md:w-[240px]">
              <select
                className="h-12 w-full rounded-xl border border-white/10 bg-neutral-900 px-4 text-sm outline-none transition focus:border-red-500"
                defaultValue={firstSeason?.season_number}
              >
                {show.seasons.map((season) => (
                  <option
                    key={season.id}
                    value={season.season_number}
                  >
                    Season {season.season_number}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SEASONS */}
          <div className="space-y-10">
            {show.seasons.map((season) => (
              <div key={season.id} className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">
                    Season {season.season_number}
                  </h3>

                  <p className="text-sm text-neutral-400">
                    {season.episodes.length} Episodes
                  </p>
                </div>

                {/* EPISODES */}
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {season.episodes.map((episode) => {
                    const still = episode.still_path
                      ? `https://image.tmdb.org/t/p/w780${episode.still_path}`
                      : backdrop

                    return (
                      <Link
                        key={episode.id}
                        href={`/movie/${show.slug}/${episode.video_key}`}
                        className="group overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 transition hover:border-white/20 hover:bg-neutral-800"
                      >
                        {/* THUMB */}
                        <div className="relative aspect-video overflow-hidden">
                          <div
                            className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                            style={{
                              backgroundImage: `url(${still})`,
                            }}
                          />

                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />

                          <div className="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1 text-xs font-medium backdrop-blur">
                            EP {episode.episode_number}
                          </div>

                          <div className="absolute bottom-4 left-4 right-4">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <h4 className="line-clamp-1 font-semibold">
                                  {episode.title ||
                                    `Episode ${episode.episode_number}`}
                                </h4>

                                <p className="mt-1 line-clamp-2 text-xs text-neutral-300">
                                  Dive deeper into the story with stunning visuals
                                  and cinematic storytelling.
                                </p>
                              </div>

                              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-black transition group-hover:scale-110">
                                <Play className="size-5 fill-black" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}