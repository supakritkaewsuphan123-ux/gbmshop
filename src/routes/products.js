const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Get all products
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;
        const db = await getDb();
        
        let sql = `
            SELECT p.*, u.username as seller_name 
            FROM products p 
            JOIN users u ON p.user_id = u.id
        `;
        const params = [];
        
        if (category && ['มือ1', 'มือสอง'].includes(category)) {
            sql += ` WHERE p.category = ?`;
            params.push(category);
        }
        
        sql += ` ORDER BY p.created_at DESC`;
        
        const products = await db.all(sql, params);
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single product
router.get('/:id', async (req, res) => {
    try {
        const db = await getDb();
        const product = await db.get(`
            SELECT p.*, u.username as seller_name, u.profile_image as seller_image
            FROM products p 
            JOIN users u ON p.user_id = u.id
            WHERE p.id = ?
        `, [req.params.id]);
        
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create product (requires auth)
router.post('/', authMiddleware, upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'videos', maxCount: 5 }
]), async (req, res) => {
    try {
        const { name, price, condition_percent, description, category } = req.body;
        const stock = req.body.stock !== undefined ? parseInt(req.body.stock) : 1;
        
        if (!name || !price || !condition_percent) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (category && !['มือ1', 'มือสอง'].includes(category)) {
            return res.status(400).json({ error: 'Invalid category' });
        }
        const finalCategory = category || 'มือ1';

        // 🚀 SYNC TO SUPABASE STORAGE: Multi-file Upload
        const { uploadFile } = require('../services/supabaseService');
        
        const imageFiles = req.files['images'] || [];
        const videoFiles = req.files['videos'] || [];
        
        let uploadedImages = [];
        let uploadedVideos = [];

        try {
            // Upload images
            uploadedImages = await Promise.all(
                imageFiles.map(f => uploadFile(f.buffer, 'product-images', f.originalname))
            );
            
            // Upload videos
            uploadedVideos = await Promise.all(
                videoFiles.map(f => uploadFile(f.buffer, 'product-images', f.originalname))
            );
            
            console.log(`[STORAGE] Uploaded ${uploadedImages.length} images and ${uploadedVideos.length} videos`);
        } catch (err) {
            console.error('[STORAGE] Product files upload failed:', err);
            return res.status(500).json({ error: 'Failed to upload product files to cloud storage' });
        }

        const mainImage = uploadedImages.length > 0 ? uploadedImages[0] : 'default_product.png';
        const imagesJson = JSON.stringify(uploadedImages);
        const videosJson = JSON.stringify(uploadedVideos);

        const userId = req.user.id;
        const db = await getDb();
        const result = await db.run(
            'INSERT INTO products (name, price, image, images, videos, condition_percent, description, stock, category, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, price, mainImage, imagesJson, videosJson, condition_percent, description, stock, finalCategory, userId]
        );

        res.status(201).json({ message: 'Product created successfully', productId: result.lastID });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Edit product (requires auth)
router.put('/:id', authMiddleware, upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'videos', maxCount: 5 }
]), async (req, res) => {
    try {
        const { name, price, condition_percent, description, category } = req.body;
        const stock = req.body.stock !== undefined ? parseInt(req.body.stock) : 1;

        if (!name || !price || !condition_percent) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (category && !['มือ1', 'มือสอง'].includes(category)) {
            return res.status(400).json({ error: 'Invalid category' });
        }

        const db = await getDb();
        const product = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
        
        if (!product) return res.status(404).json({ error: 'Product not found' });
        if (product.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Handle images & videos update
        const { uploadFile } = require('../services/supabaseService');
        let mainImage = product.image;
        let imagesJson = product.images;
        let videosJson = product.videos || '[]';

        try {
            if (req.files['images'] && req.files['images'].length > 0) {
                const uploadedImages = await Promise.all(
                    req.files['images'].map(f => uploadFile(f.buffer, 'product-images', f.originalname))
                );
                mainImage = uploadedImages[0];
                imagesJson = JSON.stringify(uploadedImages);
            }

            if (req.files['videos'] && req.files['videos'].length > 0) {
                const uploadedVideos = await Promise.all(
                    req.files['videos'].map(f => uploadFile(f.buffer, 'product-images', f.originalname))
                );
                videosJson = JSON.stringify(uploadedVideos);
            }
        } catch (err) {
            console.error('[STORAGE] Product files update failed:', err);
            return res.status(500).json({ error: 'Failed to update product files on cloud storage' });
        }

        const finalCategory = category || product.category;

        await db.run(
            'UPDATE products SET name = ?, price = ?, image = ?, images = ?, videos = ?, condition_percent = ?, description = ?, stock = ?, category = ? WHERE id = ?',
            [name, price, mainImage, imagesJson, videosJson, condition_percent, description, stock, finalCategory, req.params.id]
        );

        res.json({ message: 'Product updated successfully' });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete product
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const db = await getDb();
        const product = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
        
        if (!product) return res.status(404).json({ error: 'Product not found' });
        if (product.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
