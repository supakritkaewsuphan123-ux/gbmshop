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
        const { promptpay_number, wallet_number, meetup_address, meetup_contact, contact_name, contact_url } = req.body;
        const db = await getDb();
        
        const updateSetting = async (key, val) => {
            if (val !== undefined) {
                const existing = await db.get('SELECT key FROM settings WHERE key = ?', [key]);
                if (existing) {
                    await db.run('UPDATE settings SET value = ? WHERE key = ?', [val, key]);
                } else {
                    await db.run('INSERT INTO settings (key, value) VALUES (?, ?)', [key, val]);
                }
            }
        };

        await updateSetting('promptpay_number', promptpay_number);
        await updateSetting('wallet_number', wallet_number);
        await updateSetting('meetup_address', meetup_address);
        await updateSetting('meetup_contact', meetup_contact);
        await updateSetting('contact_name', contact_name);
        await updateSetting('contact_url', contact_url);

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
        
        const existing = await db.get('SELECT key FROM settings WHERE key = "promptpay_qr"');
        if (existing) {
            await db.run('UPDATE settings SET value = ? WHERE key = "promptpay_qr"', [req.file.filename]);
        } else {
            await db.run('INSERT INTO settings (key, value) VALUES ("promptpay_qr", ?)', [req.file.filename]);
        }

        res.json({ message: 'QR successfully uploaded', qr: req.file.filename });
    } catch (error) {
        console.error('Error uploading QR:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
