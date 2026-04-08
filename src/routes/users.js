const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Get profile & user products
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const db = await getDb();
        const user = await db.get('SELECT id, username, profile_image, role, balance, created_at FROM users WHERE id = ?', [req.user.id]);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const products = await db.all('SELECT * FROM products WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
        
        res.json({
            user,
            products
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Request Top-up
router.post('/topup', authMiddleware, upload.single('slip_image'), async (req, res) => {
    try {
        const amount = parseFloat(req.body.amount);
        if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount required' });
        if (!req.file) return res.status(400).json({ error: 'Slip image required' });

        const db = await getDb();
        await db.run('INSERT INTO topups (user_id, amount, slip_image) VALUES (?, ?, ?)', [req.user.id, amount, req.file.filename]);
        
        res.status(201).json({ message: 'Top-up requested successfully' });
    } catch (error) {
        console.error('Error requesting topup:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin ONLY: Get all topups
router.get('/topups/all', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const db = await getDb();
        const topups = await db.all(`
            SELECT t.*, u.username 
            FROM topups t
            JOIN users u ON t.user_id = u.id
            ORDER BY t.created_at DESC
        `);
        res.json(topups);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin ONLY: Update topup status
router.put('/topups/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        if (!status || !['completed', 'rejected'].includes(status)) return res.status(400).json({ error: 'Valid status required' });

        const db = await getDb();
        const topup = await db.get('SELECT * FROM topups WHERE id = ?', [req.params.id]);
        if (!topup) return res.status(404).json({ error: 'Topup not found' });
        if (topup.status !== 'pending') return res.status(400).json({ error: 'Topup already processed' });

        await db.run('UPDATE topups SET status = ? WHERE id = ?', [status, req.params.id]);

        // If approved, increment user balance
        if (status === 'completed') {
            await db.run('UPDATE users SET balance = balance + ? WHERE id = ?', [topup.amount, topup.user_id]);
        }
        
        res.json({ message: 'Topup status updated successfully' });
    } catch (error) {
        console.error('Error updating topup status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin ONLY: Get ALL users
router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const db = await getDb();
        const users = await db.all(`
            SELECT id, username, role, balance, created_at, profile_image
            FROM users 
            ORDER BY created_at DESC
        `);
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user's topups
router.get('/my-topups', authMiddleware, async (req, res) => {
    try {
        const db = await getDb();
        const topups = await db.all('SELECT * FROM topups WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
        res.json(topups);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
