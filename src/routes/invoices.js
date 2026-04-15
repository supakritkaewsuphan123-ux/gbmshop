const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { createNotification } = require('./notifications');

// Create a new invoice from cart items
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { items, method, payment_ref, meet_date, meet_time, meet_location, meet_note, shipping_name, shipping_phone, shipping_address } = req.body;
        if (!items || !items.length) return res.status(400).json({ error: 'Items required' });

        // Phone validation (10 digits) if COD
        if (method === 'cod') {
            const cleanPhone = shipping_phone ? shipping_phone.replace(/[^0-9]/g, '') : '';
            if (cleanPhone.length !== 10) {
                return res.status(400).json({ error: 'เบอร์โทรศัพท์ต้องครบ 10 หลัก (Phone number must be 10 digits)' });
            }
        }

        const buyerId = req.user.id;
        const db = await getDb();
        const deliveryMethod = method || 'qr';

        let totalCost = 0;
        let productsToBuy = [];

        // Pre-check for bulk products
        for (let pid of items) {
            const product = await db.get('SELECT * FROM products WHERE id = ?', [pid]);
            if (product && product.stock > 0) {
                productsToBuy.push(product);
                totalCost += product.price;
            }
        }

        if (productsToBuy.length === 0) return res.status(400).json({ error: 'No valid products to order' });

        // Determine initial status based on method
        let status = 'pending_payment';
        if (deliveryMethod === 'wallet') {
            const user = await db.get('SELECT balance FROM users WHERE id = ?', [buyerId]);
            if (user.balance < totalCost) return res.status(400).json({ error: 'Insufficient wallet balance' });
            
            // Deduct balance
            await db.run('UPDATE users SET balance = balance - ? WHERE id = ?', [totalCost, buyerId]);
            status = 'paid';
        } else if (deliveryMethod === 'angpao') {
            status = 'waiting_approval'; // Admin will check angpao link
        } else if (deliveryMethod === 'meetup') {
            status = 'meeting_scheduled';
        } else if (deliveryMethod === 'cod') {
            status = 'pending_delivery';
        } else {
            status = 'pending_payment'; // For QR
        }

        // Create Invoice
        const invResult = await db.run(
            `INSERT INTO invoices (user_id, total_price, method, status, meet_date, meet_time, meet_location, meet_note, shipping_name, shipping_phone, shipping_address) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [buyerId, totalCost, deliveryMethod, status, meet_date || null, meet_time || null, meet_location || null, meet_note || null, shipping_name || null, shipping_phone || null, shipping_address || null]
        );
        const invoiceId = invResult.lastID;

        // Insert Order Items
        for (let prod of productsToBuy) {
            await db.run(
                'INSERT INTO orders (product_id, buyer_id, status, method, payment_ref, invoice_id) VALUES (?, ?, ?, ?, ?, ?)',
                [prod.id, buyerId, status === 'paid' ? 'completed' : 'pending', deliveryMethod, payment_ref || null, invoiceId]
            );
            await db.run('UPDATE products SET stock = stock - 1 WHERE id = ?', [prod.id]);
        }

        // 🔔 NOTIFY ADMIN: New Order
        const admin = await db.get("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
        if (admin) {
            await createNotification({
                user_id: admin.id,
                title: '🛒 มีออเดอร์ใหม่!',
                message: `ออเดอร์ #${invoiceId} ยอด ฿${totalCost.toLocaleString()} (${deliveryMethod})`,
                type: 'info',
                link: `/admin?tab=orders&id=${invoiceId}`
            });
        }

        res.status(201).json({ message: 'Order placed successfully', invoiceId, status });
    } catch (error) {
        console.error('Error creating invoice:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Upload Payment Slip to Invoice
router.post('/:id/slip', authMiddleware, upload.single('slip_image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No slip image provided or file invalid' });

        const db = await getDb();
        const invoice = await db.get('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
        
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
        if (invoice.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

        await db.run('UPDATE invoices SET slip_image = ?, status = ? WHERE id = ?', [req.file.filename, 'waiting_approval', req.params.id]);
        
        // Also update sub-orders for dashboard sync if needed
        await db.run("UPDATE orders SET slip_image = ?, status = 'pending' WHERE invoice_id = ?", [req.file.filename, req.params.id]);

        // 🔔 NOTIFY ADMIN: New Slip
        const admin = await db.get("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
        if (admin) {
            await createNotification({
                user_id: admin.id,
                title: '📸 สลิปใหม่เข้าแล้ว!',
                message: `ออเดอร์ #${req.params.id} อัปโหลดสลิปแล้ว ตรวจสอบด่วน`,
                type: 'warning',
                link: `/admin?tab=orders&id=${req.params.id}`
            });
        }

        res.json({ message: 'Slip uploaded successfully', slip: req.file.filename });
    } catch (error) {
        console.error('Error uploading slip:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get User's Invoices (My Orders)
router.get('/my', authMiddleware, async (req, res) => {
    try {
        const db = await getDb();
        const invoices = await db.all(`
            SELECT * FROM invoices WHERE user_id = ? ORDER BY created_at DESC
        `, [req.user.id]);

        for (let inv of invoices) {
            inv.items = await db.all(`
                SELECT o.id, p.name, p.price, p.image 
                FROM orders o 
                JOIN products p ON o.product_id = p.id 
                WHERE o.invoice_id = ?
            `, [inv.id]);
        }

        res.json(invoices);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Get all invoices
router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const db = await getDb();
        const invoices = await db.all(`
            SELECT i.*, u.username as buyer_name
            FROM invoices i
            JOIN users u ON i.user_id = u.id
            ORDER BY i.created_at DESC
        `);

        for (let inv of invoices) {
            inv.items = await db.all(`
                SELECT o.id, p.name, p.price, p.image 
                FROM orders o 
                JOIN products p ON o.product_id = p.id 
                WHERE o.invoice_id = ?
            `, [inv.id]);
        }

        res.json(invoices);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Approve Invoice
router.post('/:id/approve', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const db = await getDb();
        await db.run(`UPDATE invoices SET status = 'paid' WHERE id = ?`, [req.params.id]);
        await db.run(`UPDATE orders SET status = 'completed' WHERE invoice_id = ?`, [req.params.id]);

        // 🔔 NOTIFY USER: Order Approved
        const invoice = await db.get('SELECT user_id, total_price FROM invoices WHERE id = ?', [req.params.id]);
        if (invoice) {
            await createNotification({
                user_id: invoice.user_id,
                title: '✅ ชำระเงินสำเร็จ!',
                message: `ออเดอร์ #${req.params.id} ยอด ฿${invoice.total_price.toLocaleString()} ได้รับการยืนยันแล้ว`,
                type: 'success',
                link: '/my-orders'
            });
        }

        res.json({ message: 'Approved successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Reject Invoice
router.post('/:id/reject', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { reason } = req.body;
        const db = await getDb();
        await db.run(`UPDATE invoices SET status = 'rejected', rejection_reason = ? WHERE id = ?`, [reason, req.params.id]);
        await db.run(`UPDATE orders SET status = 'rejected' WHERE invoice_id = ?`, [req.params.id]);

        // 🔔 NOTIFY USER: Order Rejected
        const invoice = await db.get('SELECT user_id FROM invoices WHERE id = ?', [req.params.id]);
        if (invoice) {
            const reasonText = reason ? `: ${reason}` : ' (ตรวจสอบสลิปหรือติดต่อแอดมิน)';
            await createNotification({
                user_id: invoice.user_id,
                title: '❌ ออเดอร์ไม่สำเร็จ',
                message: `ออเดอร์ #${req.params.id} ถูกปฏิเสธ${reasonText}`,
                type: 'error',
                link: '/my-orders'
            });
        }

        res.json({ message: 'Rejected successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
