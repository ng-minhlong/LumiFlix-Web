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

  if (!movie) {
    notFound()
  }

  return (
    <section className="container w-full max-w-screen-2xl space-y-5 pb-16 pt-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{show.title ?? show.name}</h1>
        <p className="text-sm text-neutral-300">Movie key: {movie.key}</p>
      </div>

      <div className="rounded border border-neutral-700 bg-neutral-900 p-5">
        <p className="text-sm text-neutral-200">
          {movie.season === 0 && movie.episode === 0
            ? "Movie content"
            : `Season ${movie.season} - Episode ${movie.episode}`}
        </p>
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
