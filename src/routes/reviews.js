const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { createNotification } = require('./notifications');

/**
 * ✅ [POST] Submit a Review
 * Restriction: Only verified buyers can review products.
 */
router.post('/', authMiddleware, upload.array('review_images', 5), async (req, res) => {
    try {
        const { product_id, rating, comment } = req.body;
        const userId = req.user.id;

        if (!product_id || !rating) {
            return res.status(400).json({ error: 'Product ID and rating are required' });
        }

        const db = await getDb();

        // 1. Verify if user is a buyer of this product
        const purchase = await db.get(`
            SELECT o.id 
            FROM orders o
            JOIN invoices i ON o.invoice_id = i.id
            WHERE o.product_id = ? AND o.buyer_id = ? AND i.status = 'paid'
            LIMIT 1
        `, [product_id, userId]);

        if (!purchase && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'เฉพาะผู้ที่ซื้อสินค้านี้เท่านั้นที่สามารถรีวิวได้ค่ะ' });
        }

        // 2. Handle images
        const images = req.files ? JSON.stringify(req.files.map(f => f.filename)) : '[]';

        // 3. Insert Review (UPSERT logic implied by UNIQUE constraint)
        try {
            await db.run(
                `INSERT INTO reviews (product_id, user_id, rating, comment, images) 
                 VALUES (?, ?, ?, ?, ?)`,
                [product_id, userId, rating, comment, images]
            );
        } catch (dbErr) {
            if (dbErr.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'คุณเคยรีวิวสินค้านี้ไปแล้วค่ะ' });
            }
            throw dbErr;
        }

        // 4. 🔔 Notify Seller (Owner of the product)
        const product = await db.get('SELECT user_id, name FROM products WHERE id = ?', [product_id]);
        if (product && product.user_id !== userId) {
            await createNotification(db, {
                user_id: product.user_id,
                title: '⭐ มีรีวิวใหม่!',
                message: `สินค้า "${product.name}" ได้รับ ${rating} ดาวจากลูกค้า`,
                type: 'success',
                link: `/products/${product_id}`
            });
        }

        res.status(201).json({ message: 'ขอบคุณสำหรับรีวิวของคุณค่ะ!' });
    } catch (error) {
        console.error('Review Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * ✅ [GET] Fetch Reviews for a Product
 */
router.get('/product/:id', async (req, res) => {
    try {
        const db = await getDb();
        const reviews = await db.all(`
            SELECT r.*, u.username, u.profile_image
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.product_id = ?
            ORDER BY r.created_at DESC
        `, [req.params.id]);

        // Calculate summary
        const summary = await db.get(`
            SELECT AVG(rating) as avgRating, COUNT(*) as count 
            FROM reviews 
            WHERE product_id = ?
        `, [req.params.id]);

        res.json({
            reviews,
            summary: {
                average: parseFloat(summary.avgRating || 0).toFixed(1),
                total: summary.count
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
