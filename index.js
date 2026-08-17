import express from 'express';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

// Cloudflare R2 veya AWS S3 Bağlantısı
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

// Yükleme Linki Oluştur (Süresi 2 saat)
app.post('/api/get-upload-url', async (req, res) => {
  const { filename, filetype } = req.body;
  const fileKey = `${uuidv4()}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: 'dosya-deposu',
    Key: fileKey,
    ContentType: filetype,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 7200 });
  res.json({ uploadUrl, fileKey });
});

// İndirme Sayfası Yönlendirmesi
app.get('/download/:key', async (req, res) => {
  const command = new GetObjectCommand({
    Bucket: 'dosya-deposu',
    Key: req.params.key,
  });

  const downloadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
  res.redirect(downloadUrl);
});

app.listen(3000, () => console.log('Sunucu 3000 portunda çalışıyor.'));
