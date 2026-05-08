import Link from "next/link"
import { notFound } from "next/navigation"

import { prisma } from "@/server/db"
import { Button } from "@/components/ui/button"

interface MovieShowPageProps {
  params: {
    slugShow: string
  }
}

export default async function MovieShowPage({ params }: MovieShowPageProps) {
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

  return (
    <section className="container w-full max-w-screen-2xl space-y-6 pb-16 pt-10">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">{show.title ?? show.name}</h1>
        <p className="text-sm text-neutral-300">
          {show.media_type.toUpperCase()} - {show.release_date || show.first_air_date || "Unknown year"}
        </p>
        <p className="max-w-3xl text-sm text-neutral-200">{show.overview || "-"}</p>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Movies / Episodes</h2>
        {show.media_type === "movie" ? (
          show.movies.length === 0 ? (
            <p className="text-sm text-neutral-400">No movie entries found for this show.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {show.movies.map((movie) => (
                <Link
                  key={movie.id}
                  href={`/movie/${show.slug}/${movie.key}`}
                  className="rounded border border-neutral-700 bg-neutral-900 p-4 hover:border-neutral-500"
                >
                  <div className="space-y-1">
                    <p className="font-medium">Movie</p>
                    <p className="text-xs text-neutral-400">Key: {movie.key}</p>
                    <Button className="mt-2 h-auto rounded px-3 py-1.5 text-xs">
                      Watch
                    </Button>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : show.seasons.length === 0 ? (
          <p className="text-sm text-neutral-400">No season entries found for this show.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {show.seasons.flatMap((season) =>
              season.episodes.map((episode) => (
                <Link
                  key={episode.id}
                  href={`/movie/${show.slug}/${episode.video_key}`}
                  className="rounded border border-neutral-700 bg-neutral-900 p-4 hover:border-neutral-500"
                >
                  <div className="space-y-1">
                    <p className="font-medium">
                      Season {season.season_number} - Episode {episode.episode_number}
                    </p>
                    <p className="text-xs text-neutral-300">{episode.title || "Untitled episode"}</p>
                    <p className="text-xs text-neutral-400">Key: {episode.video_key}</p>
                    <Button className="mt-2 h-auto rounded px-3 py-1.5 text-xs">
                      Watch
                    </Button>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  )
}
