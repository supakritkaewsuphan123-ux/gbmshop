const express = require('express');
const bcrypt = require('bcryptjs');
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
        const sqliteUser = await db.get('SELECT supabase_id, username FROM users WHERE id = ?', [req.user.id]);
        
        // 🚀 SYNC TO SUPABASE STORAGE: Upload slip image
        const { uploadFile } = require('../services/supabaseService');
        let slipPath = 'default_slip.png';
        try {
            slipPath = await uploadFile(req.file.buffer, 'payment-slips', req.file.originalname);
            console.log(`[STORAGE] Slip uploaded to Supabase: ${slipPath}`);
        } catch (err) {
            console.error('[STORAGE] Slip upload failed:', err);
            return res.status(500).json({ error: 'Failed to upload slip to cloud storage' });
        }

        const result = await db.run('INSERT INTO topups (user_id, amount, slip_image) VALUES (?, ?, ?)', [req.user.id, amount, slipPath]);
        const topupId = result.lastID;

        // 🚀 SYNC TO SUPABASE: So the Admin dashboard "pops up"
        const { supabase } = require('../services/supabaseService');
        if (sqliteUser && sqliteUser.supabase_id) {
            console.log(`[REALTIME] Syncing topup #${topupId} to Supabase for instant update...`);
            await supabase.from('topups').insert([{
                id: topupId, // Keep IDs synced if possible, or omit for auto-gen
                user_id: sqliteUser.supabase_id,
                amount: amount,
                slip_image: req.file.filename,
                status: 'pending'
            }]);
        }

        // 🔔 NOTIFY ADMIN: New Topup Request
        const { createNotification } = require('./notifications');
        const admin = await db.get("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
        if (admin) {
            await createNotification({
                user_id: admin.id,
                title: '💰 มีรายการเติมเงินใหม่!',
                message: `ผู้ใช้ ${sqliteUser.username || req.user.username} แจ้งเติมเงิน ฿${amount.toLocaleString()} รอยืนยัน`,
                type: 'warning',
                link: `/admin?tab=topups&id=${topupId}`
            });
        }
        
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
        const { status, reason } = req.body;
        if (!status || !['completed', 'rejected'].includes(status)) return res.status(400).json({ error: 'Valid status required' });

        const db = await getDb();
        const topup = await db.get('SELECT * FROM topups WHERE id = ?', [req.params.id]);
        if (!topup) return res.status(404).json({ error: 'Topup not found' });
        if (topup.status !== 'pending') return res.status(400).json({ error: 'Topup already processed' });

        await db.run('UPDATE topups SET status = ?, rejection_reason = ? WHERE id = ?', [status, reason || null, req.params.id]);

        // If approved, increment user balance
        if (status === 'completed') {
            await db.run('UPDATE users SET balance = balance + ? WHERE id = ?', [topup.amount, topup.user_id]);
            
            // 🚀 CRITICAL: Sync balance to Supabase Profiles (so user sees it on frontend)
            const updatedUser = await db.get('SELECT balance, supabase_id FROM users WHERE id = ?', [topup.user_id]);
            if (updatedUser && updatedUser.supabase_id) {
                const { supabase } = require('../services/supabaseService');
                console.log(`[SYNC] Updating Supabase balance for user ${updatedUser.supabase_id} to ${updatedUser.balance}`);
                const { error: syncError } = await supabase
                    .from('profiles')
                    .update({ balance: updatedUser.balance })
                    .eq('id', updatedUser.supabase_id);
                
                if (syncError) {
                    console.error('[SYNC] Failed to update balance in Supabase:', syncError);
                } else {
                    console.log('[SYNC] Supabase balance updated successfully ✅');
                }
            }
        }
        
        // 🔔 NOTIFY USER: Topup Status
        const { createNotification } = require('./notifications');
        const notifTitle = status === 'completed' ? '✅ ยินดีด้วย! เติมเงินสำเร็จ' : '❌ ขออภัย! การเติมเงินถูกปฏิเสธ';
        const reasonText = (status === 'rejected' && reason) ? ` เนื่องจาก: ${reason}` : '';
        
        await createNotification({
            user_id: topup.user_id,
            title: notifTitle,
            message: status === 'completed' 
                ? `เงินจำนวน ฿${topup.amount.toLocaleString()} ถูกเพิ่มเข้ากระเป๋าเงินของคุณแล้ว` 
                : `การเติมเงิน ฿${topup.amount.toLocaleString()} ไม่สำเร็จ${reasonText}`,
            type: status === 'completed' ? 'success' : 'error',
            link: '/dashboard'
        });

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

// ✅ Sync Supabase ID (Public endpoint for initial mapping, matches by email)
router.post('/sync-supabase', async (req, res) => {
    try {
        const { email, supabase_id } = req.body;
        if (!email || !supabase_id) {
            return res.status(400).json({ error: 'email and supabase_id are required' });
        }

        const db = await getDb();
        // Match user by email (case-insensitive)
        const user = await db.get('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email]);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found in local database' });
        }

        await db.run('UPDATE users SET supabase_id = ? WHERE id = ?', [supabase_id, user.id]);
        
        console.log(`[AUTH] Synced User ${user.id} (${email}) with Supabase ID: ${supabase_id}`);
        res.json({ success: true, message: 'Sync successful' });
    } catch (error) {
        console.error('Error syncing ID:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
