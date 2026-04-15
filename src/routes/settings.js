const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const generatePayload = require('promptpay-qr');
const qrcode = require('qrcode');


// Get all settings (Public - safely used for generating QR)
router.get('/public', async (req, res) => {
    try {
        const db = await getDb();
        const settings = await db.all('SELECT key, value FROM settings WHERE key IN ("promptpay_number", "wallet_number", "meetup_address", "meetup_contact", "contact_name", "contact_url", "promptpay_qr")');
        const config = {};
        settings.forEach(s => config[s.key] = s.value);
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Generate dynamic QR Code for payment
router.get('/qr', async (req, res) => {
    try {
        const amount = parseFloat(req.query.amount);
        if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount required' });

        const db = await getDb();
        const ppSetting = await db.get('SELECT value FROM settings WHERE key = "promptpay_number"');
        const promptpayNumber = ppSetting ? ppSetting.value : '';

        if (!promptpayNumber) {
            return res.status(400).json({ error: 'Admin has not configured PromptPay' });
        }

        const payload = generatePayload(promptpayNumber, { amount });
        
        // Generate QR code as data URL
        const qrSvg = await qrcode.toString(payload, { type: 'svg', width: 300 });
        res.type('svg').send(qrSvg);
    } catch (error) {
        console.error('Error generating QR:', error);
        res.status(500).json({ error: 'Failed to generate QR code' });
    }
});

// Admin ONLY: Get all settings
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const db = await getDb();
        const settings = await db.all('SELECT key, value FROM settings');
        const config = {};
        settings.forEach(s => config[s.key] = s.value);
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin ONLY: Update settings
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { promptpay_number, wallet_number, meetup_address, meetup_contact, contact_name, contact_url, delete_qr } = req.body;
        console.log(`[Settings] ATOMIC Update Request: ${JSON.stringify(req.body)}`);
        const db = await getDb();

        // 1. Build a series of UPDATE/DELETE commands
        // We use INSERT OR REPLACE to ensure the key exists or is updated
        const updates = [
            ['promptpay_number', promptpay_number],
            ['wallet_number', wallet_number],
            ['meetup_address', meetup_address],
            ['meetup_contact', meetup_contact],
            ['contact_name', contact_name],
            ['contact_url', contact_url]
        ];

        for (const [key, val] of updates) {
            if (val !== undefined && val !== null) {
                await db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, val]);
            }
        }

        // 2. Handle QR Deletion explicitly LAST
        if (delete_qr === true || delete_qr === 'true') {
            console.log('[Settings] 🗑️ PERFORMING CRITICAL DELETE of promptpay_qr...');
            const delResult = await db.run('DELETE FROM settings WHERE key LIKE ?', ['%promptpay_qr%']);
            console.log(`[Settings] DELETE rows affected: ${delResult.changes}`);
        }

        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const upload = require('../middleware/upload');
// Admin ONLY: Upload static QR Code
router.post('/qr', authMiddleware, adminMiddleware, upload.single('qr_image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image provided' });
        const db = await getDb();
        
        // 🚀 SYNC TO SUPABASE STORAGE: QR Image
        const { uploadFile } = require('../services/supabaseService');
        let qrPath = '';
        try {
            qrPath = await uploadFile(req.file.buffer, 'product-images', req.file.originalname);
            console.log(`[STORAGE] QR uploaded to Supabase: ${qrPath}`);
        } catch (err) {
            console.error('[STORAGE] QR upload failed:', err);
            return res.status(500).json({ error: 'Failed to upload QR image to cloud storage' });
        }

        const existing = await db.get('SELECT key FROM settings WHERE key = "promptpay_qr"');
        if (existing) {
            await db.run('UPDATE settings SET value = ? WHERE key = "promptpay_qr"', [qrPath]);
        } else {
            await db.run('INSERT INTO settings (key, value) VALUES ("promptpay_qr", ?)', [qrPath]);
        }

        res.json({ message: 'QR successfully uploaded', qr: qrPath });
    } catch (error) {
        console.error('Error uploading QR:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


module.exports = router;
