const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase;
if (!supabaseUrl || !supabaseKey) {
  console.warn('[Supabase Backend] Missing credentials in .env. Initialization skipped.');
  supabase = {
    auth: { resetPasswordForEmail: async () => ({ error: { message: 'Supabase not configured' } }) },
    storage: { from: () => ({ upload: async () => ({ error: { message: 'Supabase not configured' } }) }) }
  };
} else {
  supabase = createClient(supabaseUrl, supabaseKey);
}

/**
 * Uploads a file buffer to a specified Supabase bucket.
 * @param {Buffer} buffer - File buffer from Multer
 * @param {string} bucket - Target bucket name (e.g., 'product_images')
 * @param {string} originalName - Original filename for extension extraction
 * @returns {string} - The path/name of the uploaded file
 */
async function uploadFile(buffer, bucket, originalName) {
    const fileExt = originalName.split('.').pop();
    const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000000)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, buffer, {
            contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
            upsert: true
        });

    if (error) throw error;
    return data.path;
}

module.exports = { supabase, uploadFile };
