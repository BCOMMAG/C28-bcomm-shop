import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const R2_ACCOUNT_ID = '47ce862c285bb81ad80e052f7ed16ae5';
const R2_ACCESS_KEY_ID = '8040d9c1208cae602f044cceb2abac1c';
const R2_SECRET_ACCESS_KEY = '9b2cd002c0f0988324c76ea9c8af05651bdf4c68e3580dfaaecf683c6ce7e82a';
const R2_BUCKET_NAME = 'bcomm-saas-media';
const R2_PUBLIC_URL = 'https://pub-e5c670efa04d4ef185aece8ed06532af.r2.dev';

export async function onRequestPost(context: any) {
  try {
    const request = context.request;
    const formData = await request.formData();
    const file = formData.get('file');
    const tenantSlug = (formData.get('tenantSlug') as string) || 'leidy-boutique';
    const folder = (formData.get('folder') as string) || 'produtos';

    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({ success: false, error: 'Nenhum arquivo enviado.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cleanFileName = file.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9.-]/g, '_')
      .replace(/_+/g, '_');

    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(cleanFileName);
    const targetFolder = isVideo ? 'videos' : folder;
    const key = `tenants/${tenantSlug}/${targetFolder}/${Date.now()}-${cleanFileName}`;

    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    });

    const buffer = await file.arrayBuffer();
    await client.send(new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: new Uint8Array(buffer),
      ContentType: file.type || 'application/octet-stream'
    }));

    const publicUrl = `${R2_PUBLIC_URL.replace(/\/$/, '')}/${key.replace(/^\//, '')}`;

    return new Response(JSON.stringify({
      success: true,
      url: publicUrl,
      key,
      name: file.name,
      size: file.size,
      type: isVideo ? 'video' : 'image'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err?.message || 'Erro no upload R2' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
