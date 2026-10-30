const http = require('http');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '47ce862c285bb81ad80e052f7ed16ae5';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '8040d9c1208cae602f044cceb2abac1c';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '9b2cd002c0f0988324c76ea9c8af05651bdf4c68e3580dfaaecf683c6ce7e82a';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'bcomm-saas-media';
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_URL || 'https://pub-e5c670efa04d4ef185aece8ed06532af.r2.dev';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url.startsWith('/api/upload') && req.method === 'POST') {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const bodyBuffer = Buffer.concat(chunks);
        const webReq = new Request('http://localhost:3005/api/upload', {
          method: 'POST',
          headers: req.headers,
          body: bodyBuffer
        });

        const formData = await webReq.formData();
        const file = formData.get('file');

        if (!file || typeof file === 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Nenhum arquivo enviado no FormData.' }));
          return;
        }

        const tenantSlug = (formData.get('tenantSlug') || 'leidy-boutique').toString().trim();
        const folder = (formData.get('folder') || 'produtos').toString().trim();

        const cleanFileName = file.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9.-]/g, '_')
          .replace(/_+/g, '_');

        const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(cleanFileName);
        const targetFolder = isVideo ? 'videos' : folder;
        const key = `tenants/${tenantSlug}/${targetFolder}/${Date.now()}-${cleanFileName}`;

        const fileArrayBuf = await file.arrayBuffer();

        await s3Client.send(new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
          Body: Buffer.from(fileArrayBuf),
          ContentType: file.type || 'application/octet-stream',
        }));

        const publicUrl = `${R2_PUBLIC_URL.replace(/\/$/, '')}/${key.replace(/^\//, '')}`;
        console.log(`✅ [Dev Upload Server] Arquivo salvo no Cloudflare R2: ${publicUrl}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          url: publicUrl,
          key,
          name: file.name,
          size: file.size,
          type: isVideo ? 'video' : 'image'
        }));
      } catch (err) {
        console.error('❌ [Dev Upload Server] Erro no processamento:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Rota não encontrada' }));
});

function parseMultipart(buffer, boundary) {
  const parts = [];
  const boundaryBuf = Buffer.from('--' + boundary);
  const endBoundaryBuf = Buffer.from('--' + boundary + '--');
  let currentPos = 0;

  while (currentPos < buffer.length) {
    const boundaryIndex = buffer.indexOf(boundaryBuf, currentPos);
    if (boundaryIndex === -1) break;

    const nextBoundaryIndex = buffer.indexOf(boundaryBuf, boundaryIndex + boundaryBuf.length);
    if (nextBoundaryIndex === -1) break;

    const partBuffer = buffer.subarray(boundaryIndex + boundaryBuf.length, nextBoundaryIndex);
    const headerEndIndex = partBuffer.indexOf('\r\n\r\n');
    if (headerEndIndex !== -1) {
      const headerStr = partBuffer.subarray(0, headerEndIndex).toString();
      let data = partBuffer.subarray(headerEndIndex + 4);
      // Remove trailing \r\n before next boundary
      if (data.length >= 2 && data[data.length - 2] === 13 && data[data.length - 1] === 10) {
        data = data.subarray(0, data.length - 2);
      }

      const nameMatch = headerStr.match(/name="([^"]+)"/);
      const filenameMatch = headerStr.match(/filename="([^"]+)"/);
      const contentTypeMatch = headerStr.match(/Content-Type:\s*([^\r\n]+)/i);

      parts.push({
        name: nameMatch ? nameMatch[1] : '',
        filename: filenameMatch ? filenameMatch[1] : undefined,
        contentType: contentTypeMatch ? contentTypeMatch[1] : 'application/octet-stream',
        data
      });
    }

    currentPos = nextBoundaryIndex;
  }

  return parts;
}

const PORT = 3005;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 [Dev Upload Server] Rodando em http://127.0.0.1:${PORT}`);
});
