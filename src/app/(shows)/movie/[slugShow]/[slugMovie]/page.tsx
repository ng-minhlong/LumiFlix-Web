import Link from "next/link"
import { notFound } from "next/navigation"

import { prisma } from "@/server/db"

interface MovieDetailPageProps {
  params: {
    slugShow: string
    slugMovie: string
  }
}

export default async function MovieDetailPage({ params }: MovieDetailPageProps) {
  const show = await prisma.show.findUnique({
    where: { slug: params.slugShow },
    select: {
      id: true,
      slug: true,
      title: true,
      name: true,
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

  return (
    <section className="container w-full max-w-screen-2xl space-y-5 pb-16 pt-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{show.title ?? show.name}</h1>
        <p className="text-sm text-neutral-300">
          Video key: {movie ? movie.key : episode?.video_key}
        </p>
      </div>

      <div className="rounded border border-neutral-700 bg-neutral-900 p-5">
        <p className="text-sm text-neutral-200">
          {movie
            ? "Movie content"
            : `Season ${episode?.season.season_number} - Episode ${episode?.episode_number}`}
        </p>
        {!movie && episode?.title ? (
          <p className="mt-2 text-xs text-neutral-300">{episode.title}</p>
        ) : null}
        <p className="mt-2 text-xs text-neutral-400">
          Placeholder page for streaming content by movie key.
        </p>
      </div>

      <Link
        href={`/movie/${show.slug}`}
        className="inline-flex rounded border border-neutral-600 px-3 py-2 text-sm hover:border-neutral-400"
      >
        Back to show
      </Link>
    </section>
  )
}
