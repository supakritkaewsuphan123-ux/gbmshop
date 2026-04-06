const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    try {
        const db = await getDb();
        // Get sales from paid invoices
        const dailySales = await db.all(`
            SELECT date(created_at) as date, SUM(total_price) as revenue
            FROM invoices
            WHERE status = 'paid'
            GROUP BY date(created_at)
            ORDER BY date(created_at) ASC
            LIMIT 30
        `);
        
        res.json({
            labels: dailySales.map(d => d.date),
            data: dailySales.map(d => d.revenue)
        });
    } catch (error) {
        console.error('Error fetching sales:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
