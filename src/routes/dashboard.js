const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

// GET /api/dashboard - Returns summary statistics with strict "Paid" logic
router.get('/', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    try {
        const db = await getDb();
        
        // --- 1. Total Revenue (The Grand Source of Truth) ---
        const revenueTotal = await db.get(`SELECT COALESCE(SUM(total_price), 0) as val, COUNT(*) as count FROM invoices WHERE status='paid'`);

        // --- 2. Today's Revenue (Using exact same strftime logic) ---
        const revenueToday = await db.get(`
            SELECT COALESCE(SUM(total_price), 0) as val, COUNT(*) as count 
            FROM invoices 
            WHERE status='paid' 
            AND strftime('%Y-%m-%d', created_at) = strftime('%Y-%m-%d', 'now', 'localtime')
        `);

        // --- 3. Month's Revenue (Using exact same strftime logic) ---
        const revenueMonth = await db.get(`
            SELECT COALESCE(SUM(total_price), 0) as val, COUNT(*) as count 
            FROM invoices 
            WHERE status='paid' 
            AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', 'localtime')
        `);

        // --- 4. Pending Metrics ---
        const pending = await db.get(`SELECT COUNT(*) as val FROM invoices WHERE status IN ('pending_payment', 'waiting_approval')`);

        const result = {
            revenue: { today: revenueToday.val, month: revenueMonth.val, total: revenueTotal.val },
            orders: { today: revenueToday.count, month: revenueMonth.count, total: revenueTotal.count },
            success: { today: revenueToday.count, month: revenueMonth.count, total: revenueTotal.count },
            pending: pending.val
        };

        // DEBUG LOGS (Strict matching check)
        console.log('--- STRICT DASHBOARD DEBUG ---');
        console.log('Today:', revenueToday);
        console.log('Month:', revenueMonth);
        console.log('Total:', revenueTotal);

        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({ success: false, error: 'Database query failed' });
    }
});

// GET /api/dashboard/history - Returns segmented history with same logic
router.get('/history', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    try {
        const db = await getDb();
        
        // 1. Daily (All time but grouped)
        const daily = await db.all(`
            SELECT strftime('%Y-%m-%d', created_at) as date, SUM(total_price) as revenue, COUNT(*) as count 
            FROM invoices WHERE status='paid' 
            GROUP BY date ORDER BY date DESC
        `);

        // 2. Monthly (All time grouped)
        const monthly = await db.all(`
            SELECT strftime('%Y-%m', created_at) as month, SUM(total_price) as revenue, COUNT(*) as count 
            FROM invoices WHERE status='paid' 
            GROUP BY month ORDER BY month DESC
        `);

        // 3. Yearly (All time grouped)
        const yearly = await db.all(`
            SELECT strftime('%Y', created_at) as year, SUM(total_price) as revenue, COUNT(*) as count 
            FROM invoices WHERE status='paid' 
            GROUP BY year ORDER BY year DESC
        `);

        // DEBUG: Verify sum of history matches total revenue
        const totalHistoryDaily = daily.reduce((acc, curr) => acc + curr.revenue, 0);
        console.log('--- HISTORY CONSISTENCY CHECK ---');
        console.log('Sum of Daily History:', totalHistoryDaily);

        res.json({
            success: true,
            data: { daily, monthly, yearly }
        });
    } catch (error) {
        console.error('Dashboard History Error:', error);
        res.status(500).json({ success: false, error: 'History fetch failed' });
    }
});

// GET /api/dashboard/chart
router.get('/chart', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    try {
        const db = await getDb();
        const dailyData = await db.all(`
            SELECT strftime('%Y-%m-%d', created_at) AS date, COALESCE(SUM(total_price), 0) AS revenue
            FROM invoices WHERE status = 'paid'
            GROUP BY date ORDER BY date ASC LIMIT 30
        `);
        res.json({ success: true, data: dailyData });
    } catch (error) {
        console.error('Chart fetch failed:', error);
        res.status(500).json({ success: false });
    }
});

module.exports = router;
