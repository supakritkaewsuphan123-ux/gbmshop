const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Create order
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { product_id, method } = req.body;
        if (!product_id) return res.status(400).json({ error: 'Product ID is required' });

        const buyerId = req.user.id;
        const db = await getDb();

        // Check if product exists and has stock
        const product = await db.get('SELECT * FROM products WHERE id = ?', [product_id]);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        if (product.user_id === buyerId) return res.status(400).json({ error: 'Cannot buy your own product' });
        if (product.stock <= 0) return res.status(400).json({ error: 'Product is out of stock' });

        if (method === 'wallet') {
            const user = await db.get('SELECT balance FROM users WHERE id = ?', [buyerId]);
            if (user.balance < product.price) return res.status(400).json({ error: 'Insufficient wallet balance' });

            // Deduct balance & insert completed order
            await db.run('UPDATE users SET balance = balance - ? WHERE id = ?', [product.price, buyerId]);
            const result = await db.run(
                'INSERT INTO orders (product_id, buyer_id, status, method, payment_ref) VALUES (?, ?, ?, ?, ?)',
                [product_id, buyerId, 'completed', 'wallet', null]
            );
            await db.run('UPDATE products SET stock = stock - 1 WHERE id = ?', [product_id]);
            return res.status(201).json({ message: 'Order created with Wallet successfully', orderId: result.lastID });
        }

        const result = await db.run(
            'INSERT INTO orders (product_id, buyer_id, status, method, payment_ref) VALUES (?, ?, ?, ?, ?)',
            [product_id, buyerId, 'pending', method || 'qr', req.body.payment_ref || null]
        );

        // Decrement stock
        await db.run('UPDATE products SET stock = stock - 1 WHERE id = ?', [product_id]);

        res.status(201).json({ message: 'Order placed successfully', orderId: result.lastID });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Bulk Create Orders (for Cart)
router.post('/bulk', authMiddleware, async (req, res) => {
    try {
        const { items, method } = req.body;
        if (!items || !items.length) return res.status(400).json({ error: 'Items required' });

        const buyerId = req.user.id;
        const db = await getDb();
        const deliveryMethod = method || 'qr';

        let processed = 0;
        let totalCost = 0;
        let productsToBuy = [];

        // Pre-check for bulk products
        for (let pid of items) {
            const product = await db.get('SELECT * FROM products WHERE id = ?', [pid]);
            if (product && product.stock > 0 && product.user_id !== buyerId) {
                productsToBuy.push(product);
                totalCost += product.price;
            }
        }

        if (productsToBuy.length === 0) return res.status(400).json({ error: 'No valid products to order' });

        if (deliveryMethod === 'wallet') {
            const user = await db.get('SELECT balance FROM users WHERE id = ?', [buyerId]);
            if (user.balance < totalCost) return res.status(400).json({ error: 'Insufficient wallet balance' });
            
            // Deduct once
            await db.run('UPDATE users SET balance = balance - ? WHERE id = ?', [totalCost, buyerId]);

            for (let prod of productsToBuy) {
                await db.run(
                    'INSERT INTO orders (product_id, buyer_id, status, method, payment_ref) VALUES (?, ?, ?, ?, ?)',
                    [prod.id, buyerId, 'completed', 'wallet', null]
                );
                await db.run('UPDATE products SET stock = stock - 1 WHERE id = ?', [prod.id]);
                processed++;
            }
            return res.status(201).json({ message: 'Bulk order paid with Wallet successfully', processed });
        }

        for (let prod of productsToBuy) {
            await db.run(
                'INSERT INTO orders (product_id, buyer_id, status, method, payment_ref) VALUES (?, ?, ?, ?, ?)',
                [prod.id, buyerId, 'pending', deliveryMethod, req.body.payment_ref || null]
            );
            await db.run('UPDATE products SET stock = stock - 1 WHERE id = ?', [prod.id]);
            processed++;
        }

        res.status(201).json({ message: 'Bulk order placed successfully', processed });
    } catch (error) {
        console.error('Error creating bulk orders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user's orders
router.get('/my-orders', authMiddleware, async (req, res) => {
    try {
        const db = await getDb();
        const orders = await db.all(`
            SELECT o.*, p.name as product_name, p.price, p.image 
            FROM orders o
            JOIN products p ON o.product_id = p.id
            WHERE o.buyer_id = ?
            ORDER BY o.created_at DESC
        `, [req.user.id]);
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin ONLY: Get all orders
router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const db = await getDb();
        const orders = await db.all(`
            SELECT o.*, p.name as product_name, p.price, u.username as buyer_name
            FROM orders o
            JOIN products p ON o.product_id = p.id
            JOIN users u ON o.buyer_id = u.id
            ORDER BY o.created_at DESC
        `);
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Upload Payment Slip
router.post('/:id/slip', authMiddleware, upload.single('slip_image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No slip image provided' });

        const db = await getDb();
        const order = await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
        
        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (order.buyer_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

        await db.run('UPDATE orders SET slip_image = ? WHERE id = ?', [req.file.filename, req.params.id]);
        res.json({ message: 'Slip uploaded successfully', slip: req.file.filename });
    } catch (error) {
        console.error('Error uploading slip:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin ONLY: Get order statistics
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const db = await getDb();
        
        const revResult = await db.get(`
            SELECT SUM(p.price) as total_revenue
            FROM orders o
            JOIN products p ON o.product_id = p.id
            WHERE o.status = 'completed'
        `);
        const totalRevenue = revResult.total_revenue || 0;

        const dailySales = await db.all(`
            SELECT date(o.created_at) as date, SUM(p.price) as revenue, COUNT(o.id) as count
            FROM orders o
            JOIN products p ON o.product_id = p.id
            WHERE o.status = 'completed'
            GROUP BY date(o.created_at)
            ORDER BY date(o.created_at) DESC
            LIMIT 7
        `);

        // Get overall stats
        const orderCounts = await db.get(`
            SELECT 
                COUNT(*) as total_orders,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_orders
            FROM orders
        `);
        
        res.json({
            total_revenue: totalRevenue,
            daily_sales: dailySales,
            total_orders: orderCounts.total_orders,
            completed_orders: orderCounts.completed_orders,
            pending_orders: orderCounts.pending_orders,
            rejected_orders: orderCounts.rejected_orders
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin ONLY: Update order status
router.put('/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) return res.status(400).json({ error: 'Status is required' });

        const db = await getDb();
        await db.run('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
        
        res.json({ message: 'Order status updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update order with meeting details
router.put('/:id/schedule-meeting', authMiddleware, async (req, res) => {
    try {
        const { meet_date, meet_time, meet_location, meet_note } = req.body;
        if (!meet_date || !meet_time || !meet_location) {
            return res.status(400).json({ error: 'Missing required meeting details' });
        }

        const db = await getDb();
        const order = await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
        
        if (!order) return res.status(404).json({ error: 'Order not found' });
        // Allow buyer to schedule meeting, or admin
        if (order.buyer_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

        await db.run(`
            UPDATE orders 
            SET meet_date = ?, meet_time = ?, meet_location = ?, meet_note = ?, status = 'meeting_scheduled'
            WHERE id = ?
        `, [meet_date, meet_time, meet_location, meet_note || null, req.params.id]);

        // IMPORTANT FIX: Admin dashboard reads from invoices, so we MUST sync meeting info to invoices
        if (order.invoice_id) {
            await db.run(`
                UPDATE invoices 
                SET meet_date = ?, meet_time = ?, meet_location = ?, meet_note = ?, status = 'meeting_scheduled'
                WHERE id = ?
            `, [meet_date, meet_time, meet_location, meet_note || null, order.invoice_id]);
        }

        res.json({ message: 'Meeting scheduled successfully' });
    } catch (error) {
        console.error('Error scheduling meeting:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
