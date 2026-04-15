const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const { supabase } = require('../services/supabaseService');

/**
 * ✅ HELPER: Create Notification with ID Mapping (SQLite -> Supabase UUID)
 */
async function createNotification({ user_id, title, message, type = 'info', link = '' }) {
    try {
        const db = await getDb();
        let targetUid = user_id;

        // If user_id is a number (SQLite ID), look up the Supabase UUID
        if (!isNaN(user_id)) {
            console.log(`[NOTIF] 🔍 Mapping SQLite ID ${user_id} to Supabase UUID...`);
            const user = await db.get('SELECT supabase_id, email FROM users WHERE id = ?', [user_id]);
            
            if (user && user.supabase_id) {
                targetUid = user.supabase_id;
                console.log(`[NOTIF] ✅ Found mapped ID: ${targetUid}`);
            } else if (user && user.email) {
                // FALLBACK: If no supabase_id mapped yet, try to find it in Supabase profiles by email
                console.log(`[NOTIF] ⚠️ No mapping found for ${user.email}. Attempting Supabase lookup...`);
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('username', user.username || user.email.split('@')[0]) // Try username or email prefix
                    .single();
                
                if (profile) {
                    targetUid = profile.id;
                    console.log(`[NOTIF] 🚀 Found UUID from Supabase profiles: ${targetUid}`);
                    // Save it to SQLite for next time
                    await db.run('UPDATE users SET supabase_id = ? WHERE id = ?', [targetUid, user_id]);
                } else {
                    console.error(`[NOTIF] ❌ Fallback failed. Cannot find UUID for ${user.email}`);
                    return null;
                }
            } else {
                console.error(`[NOTIF] ❌ User ${user_id} not found in SQLite.`);
                return null;
            }
        }

        console.log(`[NOTIF] 📤 Sending: "${title}" | Target: ${targetUid}`);
        
        const { data, error } = await supabase
            .from('notifications')
            .insert([
                { 
                    user_id: targetUid, 
                    title: title, 
                    message: message, 
                    type: type, 
                    link: link,
                    is_read: false 
                }
            ]);

        if (error) {
            console.error('[NOTIF] ❌ Supabase Insert Error:', error.message);
            throw error;
        }
        
        console.log(`[NOTIF] ✨ Notification sent successfully!`);
        return true;
    } catch (err) {
        console.error('[NOTIF] 🔥 CRITICAL ERROR:', err.message);
        return null;
    }
}

// ✅ [GET] Fetch notifications for user (including global)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const db = await getDb();
        const userId = req.user.id;
        
        // Advanced Query: User specific OR Global
        const notifications = await db.all(
            `SELECT * FROM notifications 
             WHERE (user_id = ? OR is_global = 1) 
             ORDER BY created_at DESC 
             LIMIT 20`,
            [userId]
        );

        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ✅ [GET] Unread Count
router.get('/unread-count', authMiddleware, async (req, res) => {
    try {
        const db = await getDb();
        const userId = req.user.id;
        
        const result = await db.get(
            `SELECT COUNT(*) as count FROM notifications 
             WHERE (user_id = ? OR is_global = 1) AND is_read = 0`,
            [userId]
        );

        res.json({ unreadCount: result.count });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ✅ [PATCH] Mark specific as read
router.patch('/:id/read', authMiddleware, async (req, res) => {
    try {
        const db = await getDb();
        const notificationId = req.params.id;
        const userId = req.user.id;

        // Check ownership (skip check if global? No, users should mark global as read individually in a real system, 
        // but for simplicity here we just check if it exists)
        const notif = await db.get('SELECT * FROM notifications WHERE id = ?', [notificationId]);
        if (!notif) return res.status(404).json({ error: 'Notification not found' });
        
        // If not global and not matching user_id, forbid
        if (notif.is_global === 0 && notif.user_id !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await db.run('UPDATE notifications SET is_read = 1 WHERE id = ?', [notificationId]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ✅ [PATCH] Mark all as read
router.patch('/read-all', authMiddleware, async (req, res) => {
    try {
        const db = await getDb();
        const userId = req.user.id;

        await db.run(
            `UPDATE notifications SET is_read = 1 
             WHERE (user_id = ? OR is_global = 1) AND is_read = 0`,
            [userId]
        );

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = {
    router,
    createNotification
};
