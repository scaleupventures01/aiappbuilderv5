/**
 * Validates that the uploads table exists and has the correct structure
 */

import { query } from './connection.js';

export async function validateUploadsTable() {
  try {
    // Check if uploads table exists
    const tableCheck = await query(`
      SELECT to_regclass('uploads') as table_exists
    `);
    
    if (!tableCheck.rows[0].table_exists) {
      throw new Error('uploads table does not exist. Please run database migrations.');
    }
    
    // Check required columns exist
    const columnCheck = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'uploads' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    const requiredColumns = [
      'id', 'user_id', 'conversation_id', 'cloudinary_public_id',
      'original_filename', 'file_type', 'file_size', 'secure_url',
      'thumbnail_url', 'context', 'created_at', 'updated_at'
    ];
    
    const existingColumns = columnCheck.rows.map(row => row.column_name);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      throw new Error(`uploads table is missing required columns: ${missingColumns.join(', ')}`);
    }
    
    // Check for required indexes
    const indexCheck = await query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'uploads' 
      AND schemaname = 'public'
    `);
    
    const requiredIndexes = [
      'idx_uploads_user_id',
      'idx_uploads_conversation_id', 
      'idx_uploads_created_at',
      'idx_uploads_context'
    ];
    
    const existingIndexes = indexCheck.rows.map(row => row.indexname);
    const missingIndexes = requiredIndexes.filter(idx => !existingIndexes.includes(idx));
    
    if (missingIndexes.length > 0) {
      console.warn(`uploads table is missing recommended indexes: ${missingIndexes.join(', ')}`);
    }
    
    console.log('✅ uploads table validation passed');
    return true;
    
  } catch (error) {
    console.error('❌ uploads table validation failed:', error.message);
    throw error;
  }
}

export async function createUploadsTableIfNotExists() {
  try {
    // Read and execute the uploads table schema
    const fs = await import('fs/promises');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    const schemaPath = path.join(__dirname, 'schemas', 'uploads.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    console.log('Creating uploads table...');
    await query(schema);
    console.log('✅ uploads table created successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to create uploads table:', error.message);
    throw error;
  }
}