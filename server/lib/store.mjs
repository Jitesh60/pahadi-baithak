import { readFile } from 'node:fs/promises';
import {
  S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/* ══════════════════════════════════════════════════════════════
   The library lives in one PRIVATE R2 bucket:
     songs/<id>.mp3   the audio
     library.json     { songs: [{ yt, title, artist, duration, addedAt }] }
   Nothing in it is public. The app gets short-lived signed links.
   ══════════════════════════════════════════════════════════════ */

const INDEX = 'library.json';
const songKey = (id) => `songs/${id}.mp3`;

export function r2Store({
  endpoint = process.env.R2_ENDPOINT,
  accessKeyId = process.env.R2_ACCESS_KEY_ID,
  secretAccessKey = process.env.R2_SECRET_ACCESS_KEY,
  bucket = process.env.R2_BUCKET,
  linkTtl = Number(process.env.LINK_TTL_SECONDS || 12 * 3600),
} = {}) {
  for (const [k, v] of Object.entries({ R2_ENDPOINT: endpoint, R2_ACCESS_KEY_ID: accessKeyId, R2_SECRET_ACCESS_KEY: secretAccessKey, R2_BUCKET: bucket })) {
    if (!v) throw new Error(`${k} is not set`);
  }
  const s3 = new S3Client({
    region: 'auto',
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });

  async function readIndex() {
    try {
      const r = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: INDEX }));
      const data = JSON.parse(await r.Body.transformToString());
      return Array.isArray(data.songs) ? data.songs : [];
    } catch (e) {
      if (e.name === 'NoSuchKey' || e.$metadata?.httpStatusCode === 404) return [];
      throw e;
    }
  }

  const writeIndex = (songs) => s3.send(new PutObjectCommand({
    Bucket: bucket, Key: INDEX,
    Body: JSON.stringify({ songs }, null, 1),
    ContentType: 'application/json',
  }));

  return {
    list: readIndex,
    async put(song, file) {
      await s3.send(new PutObjectCommand({
        Bucket: bucket, Key: songKey(song.yt),
        Body: await readFile(file),
        ContentType: 'audio/mpeg',
      }));
      const songs = (await readIndex()).filter((s) => s.yt !== song.yt);
      songs.push(song);
      await writeIndex(songs);
    },
    async remove(id) {
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: songKey(id) }));
      await writeIndex((await readIndex()).filter((s) => s.yt !== id));
    },
    link: (id) => getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: bucket, Key: songKey(id), ResponseContentType: 'audio/mpeg' }),
      { expiresIn: linkTtl },
    ),
  };
}
