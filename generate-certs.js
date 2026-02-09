import forge from 'node-forge';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

const CERT_PATH = path.join(process.cwd(), '.cert');

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) return iface.address;
        }
    }
    return '127.0.0.1';
}

async function generate() {
    try {
        await fs.ensureDir(CERT_PATH);
        const localIp = getLocalIp();
        console.log(`Generating SSL Certificate (No OpenSSL required)...`);

        const pki = forge.pki;
        const keys = pki.rsa.generateKeyPair(2048);
        const cert = pki.createCertificate();

        cert.publicKey = keys.publicKey;
        cert.serialNumber = '01' + forge.util.bytesToHex(forge.random.getBytesSync(8));
        cert.validity.notBefore = new Date();
        cert.validity.notAfter = new Date();
        cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

        const attrs = [
            { name: 'commonName', value: localIp },
            { name: 'countryName', value: 'ID' },
            { shortName: 'ST', value: 'Jakarta' },
            { name: 'localityName', value: 'Jakarta' },
            { name: 'organizationName', value: 'YT-Studio' },
            { shortName: 'OU', value: 'Dev' }
        ];

        cert.setSubject(attrs);
        cert.setIssuer(attrs);

        cert.setExtensions([
            {
                name: 'basicConstraints',
                cA: true
            },
            {
                name: 'keyUsage',
                keyCertSign: true,
                digitalSignature: true,
                nonRepudiation: true,
                keyEncipherment: true,
                dataEncipherment: true
            },
            {
                name: 'subjectAltName',
                altNames: [
                    { type: 2, value: 'localhost' },
                    { type: 7, ip: '127.0.0.1' },
                    { type: 7, ip: localIp }
                ]
            }
        ]);

        cert.sign(keys.privateKey, forge.md.sha256.create());

        const pemKey = pki.privateKeyToPem(keys.privateKey);
        const pemCert = pki.certificateToPem(cert);

        await fs.writeFile(path.join(CERT_PATH, 'key.pem'), pemKey);
        await fs.writeFile(path.join(CERT_PATH, 'cert.pem'), pemCert);

        console.log('✅ Sertifikat berhasil dibuat tanpa OpenSSL!');
        console.log(`- Local:   https://localhost:8000`);
        console.log(`- Network: https://${localIp}:8000`);
    } catch (err) {
        console.error('❌ Error:', err);
    }
}

generate();
