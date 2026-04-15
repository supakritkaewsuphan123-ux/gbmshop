const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

/**
 * ✅ [POST] Toggle Wishlist
 */
router.post('/:id', authMiddleware, async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.user.id;
        const db = await getDb();

        const existing = await db.get('SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?', [userId, productId]);

        if (existing) {
            await db.run('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?', [userId, productId]);
            res.json({ status: 'removed', message: 'ลบออกจากรายการโปรดแล้ว' });
        } else {
            await db.run('INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)', [userId, productId]);
            res.json({ status: 'added', message: 'เพิ่มในรายการโปรดแล้ว' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * ✅ [GET] Get My Wishlist
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const db = await getDb();

        const wishlist = await db.all(`
            SELECT p.*, u.username as seller_name
            FROM wishlist w
            JOIN products p ON w.product_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE w.user_id = ?
            ORDER BY w.created_at DESC
        `, [userId]);

        res.json(wishlist);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * ✅ [GET] Check if item is in wishlist
 */
router.get('/check/:id', authMiddleware, async (req, res) => {
    try {
        const db = await getDb();
        const existing = await db.get('SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?', [req.user.id, req.params.id]);
        res.json({ inWishlist: !!existing });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
