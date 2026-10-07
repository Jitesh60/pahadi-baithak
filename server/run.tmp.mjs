import { S3Client, CreateBucketCommand } from '@aws-sdk/client-s3';
import { createApp } from './lib/app.mjs';
import { r2Store } from './lib/store.mjs';
import { fetchAudio } from './lib/youtube.mjs';
const cfg = { endpoint: 'http://127.0.0.1:5005', accessKeyId: 'a', secretAccessKey: 'b', bucket: 'e2e' };
await new S3Client({ region: 'us-east-1', endpoint: cfg.endpoint, forcePathStyle: true, credentials: { accessKeyId: 'a', secretAccessKey: 'b' } }).send(new CreateBucketCommand({ Bucket: cfg.bucket })).catch(()=>{});
createApp({ token: 'k'.repeat(32), origins: ['http://localhost:4173'], store: r2Store(cfg), fetchAudio: (id, d) => fetchAudio(id, d, { bin: '/tmp/claude-0/-home-user-sajha/70c70877-02eb-5da6-8541-e48ebf8418ab/scratchpad/fake-ytdlp.sh' }), log: {} }).listen(8799);
