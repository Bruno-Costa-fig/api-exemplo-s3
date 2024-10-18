// index.js
const express = require('express');
const multer = require('multer');
const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
require('dotenv').config();

// Configurar as credenciais da AWS
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const app = express();
// const upload = multer({ dest: 'uploads/' });
const upload = multer({ storage: multer.memoryStorage() });

// Função para fazer upload do arquivo para o S3
const uploadToS3 = async (file) => {
    const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${Date.now()}-${file.originalname}`,
        Body: file.buffer,
    };

    try {
        const parallelUploads3 = new Upload({
            client: s3Client,
            params: uploadParams,
            leavePartsOnError: false,
        });

        const response = await parallelUploads3.done();
        return response;
    } catch (err) {
        console.error('Erro ao fazer upload para o S3:', err);
        throw err;
    }
};

// Rota para upload de imagens
app.post('/upload', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('Nenhum arquivo foi enviado.');
    }

    try {
        const result = await uploadToS3(req.file);
        res.send({
            status: 'success',
            message: 'Upload realizado com sucesso!',
            objectKey: result.Key,
            bucket: result.Bucket,
        });
    } catch (err) {
        console.error('Erro ao fazer upload da imagem:', err);
        res.status(500).send('Erro ao fazer upload da imagem.');
    }
});

// Iniciar o servidor
const port = 3000;
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});