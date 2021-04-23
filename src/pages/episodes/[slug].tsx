import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { GetStaticPaths, GetStaticProps } from "next";
import Image from "next/image";
import Link from "next/link";
import { api } from "../../services/api";
import { convertDurationToTimeString } from "../../utils/convertDurationToTimeString";
import styles from "./episode.module.scss";

import { useRouter } from "next/router";
import { usePlayer } from "../../contexts/PlayerContext";
import Head from "next/head";

type Episode = {
  id: string;
  title: string;
  thumbnail: string;
  description: string;
  members: string;
  duration: number;
  durationAsString: string;
  url: string;
  publishedAt: string;
  store: string;
};

type EpisodeProps = {
  episode: Episode;
};

export default function Episode({ episode }: EpisodeProps) {
  const { play } = usePlayer();
  const router = useRouter();

  if (router.isFallback) {
    return <p>Carregando...</p>;
  }

  return (
    <div className={styles.episode}>
      <Head>
        <title>{episode.title} | Audiobook</title>
      </Head>

      <div className={styles.thumbnailContainer}>
        <Link href="/">
          <button>
            <img src="/arrow-left.svg" alt="Voltar" width="30px" />
          </button>
        </Link>
        <Image
          width={700}
          height={160}
          src={episode.thumbnail}
          objectFit="cover"
        />
        <button onClick={() => play(episode)}>
          <img src="/play-blue.svg" alt="Tocar episódio" width="30px" />
        </button>
      </div>

      <header>
        <h1>{episode.title}</h1>
        <span>{episode.members}</span>
        <span>{episode.publishedAt}</span>
        <span>{episode.durationAsString}</span>
      </header>

      <div
        className={styles.description}
        dangerouslySetInnerHTML={{
          __html: episode.description,
        }}
      />

      <footer>
        <span>Para comprar o livro físico:</span>
        <div>
          <img src="/amazon-icon.svg" alt="Amazon" width="30px" />
          <a href={episode.store}>{episode.title}</a>
        </div>
      </footer>
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const { data } = await api.get("episodes", {
    params: {
      __limit: 2,
      __sort: "published_at",
      __order: "desc",
    },
  });

  const paths = data.map((episode) => ({
    params: {
      slug: episode.id,
    },
  }));

  return {
    paths,
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps = async (ctx) => {
  const { slug } = ctx.params;

  const { data } = await api.get(`/episodes/${slug}`);

  const episode = {
    id: data.id,
    title: data.title,
    thumbnail: data.thumbnail,
    members: data.members,
    publishedAt: format(parseISO(data.published_at), "d MMM yy", {
      locale: ptBR,
    }),
    duration: Number(data.file.duration),
    durationAsString: convertDurationToTimeString(Number(data.file.duration)),
    description: data.description,
    store: data.store,
    url: data.file.url,
  };

  return {
    props: {
      episode,
    },
    revalidate: 60 * 60 * 24,
  };
};
