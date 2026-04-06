const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Get all products
router.get('/', async (req, res) => {
    try {
        const db = await getDb();
        const products = await db.all(`
            SELECT p.*, u.username as seller_name 
            FROM products p 
            JOIN users u ON p.user_id = u.id
            ORDER BY p.created_at DESC
        `);
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
        const { name, price, condition_percent, description } = req.body;
        const stock = req.body.stock !== undefined ? parseInt(req.body.stock) : 1;
        
        if (!name || !price || !condition_percent) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Handle images array (index 0 is main image)
        const imageFiles = req.files['images'] || [];
        const mainImage = imageFiles.length > 0 ? imageFiles[0].filename : 'default_product.png';
        const imagesJson = JSON.stringify(imageFiles.map(f => f.filename));

        // Handle videos array
        const videoFiles = req.files['videos'] || [];
        const videosJson = JSON.stringify(videoFiles.map(f => f.filename));

        const userId = req.user.id;
        const db = await getDb();
        const result = await db.run(
            'INSERT INTO products (name, price, image, images, videos, condition_percent, description, stock, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, price, mainImage, imagesJson, videosJson, condition_percent, description, stock, userId]
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
        const { name, price, condition_percent, description } = req.body;
        const stock = req.body.stock !== undefined ? parseInt(req.body.stock) : 1;

        if (!name || !price || !condition_percent) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const db = await getDb();
        const product = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
        
        if (!product) return res.status(404).json({ error: 'Product not found' });
        if (product.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Handle images update (stay if no new images)
        let mainImage = product.image;
        let imagesJson = product.images;
        if (req.files['images'] && req.files['images'].length > 0) {
            mainImage = req.files['images'][0].filename;
            imagesJson = JSON.stringify(req.files['images'].map(f => f.filename));
        }

        // Handle videos update (stay if no new videos)
        let videosJson = product.videos || '[]';
        if (req.files['videos'] && req.files['videos'].length > 0) {
            videosJson = JSON.stringify(req.files['videos'].map(f => f.filename));
        }

        await db.run(
            'UPDATE products SET name = ?, price = ?, image = ?, images = ?, videos = ?, condition_percent = ?, description = ?, stock = ? WHERE id = ?',
            [name, price, mainImage, imagesJson, videosJson, condition_percent, description, stock, req.params.id]
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
