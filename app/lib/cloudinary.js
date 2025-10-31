// lib/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a single file to Cloudinary
 * @param {File} file - The file to upload
 * @param {Object} options - Upload options
 * @returns {Promise<string>} - The secure URL of the uploaded image
 */
export async function uploadToCloudinary(file, options = {}) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  const defaultOptions = {
    resource_type: 'auto',
    folder: 'forms',
    public_id: `form_${uuidv4()}`,
    transformation: [
      { quality: 'auto' },
      { fetch_format: 'auto' },
      { width: 800, height: 600, crop: 'limit' } // Resize large images
    ],
    ...options
  };

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      defaultOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(new Error(`Upload failed: ${error.message}`));
        } else {
          resolve(result.secure_url);
        }
      }
    ).end(buffer);
  });
}

/**
 * Upload multiple files to Cloudinary
 * @param {File[]} files - Array of files to upload
 * @param {Object} options - Upload options
 * @returns {Promise<string[]>} - Array of secure URLs
 */
export async function uploadMultipleToCloudinary(files, options = {}) {
  const uploadPromises = files
    .filter(file => file instanceof File && file.size > 0)
    .map(file => uploadToCloudinary(file, options));
  
  try {
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Multiple upload error:', error);
    throw new Error('Failed to upload one or more files');
  }
}

/**
 * Delete a file from Cloudinary
 * @param {string} imageUrl - The Cloudinary URL of the image to delete
 * @returns {Promise<void>}
 */
export async function deleteFromCloudinary(imageUrl) {
  try {
    // Extract public_id from Cloudinary URL
    // Example URL: https://res.cloudinary.com/demo/image/upload/v1234567890/forms/form_abc123.jpg
    const urlParts = imageUrl.split('/');
    const versionIndex = urlParts.findIndex(part => part.startsWith('v'));
    
    if (versionIndex !== -1 && versionIndex < urlParts.length - 1) {
      // Get the path after version
      const pathAfterVersion = urlParts.slice(versionIndex + 1).join('/');
      // Remove file extension to get public_id
      const publicId = pathAfterVersion.split('.')[0];
      
      const result = await cloudinary.uploader.destroy(publicId);
      
      if (result.result !== 'ok' && result.result !== 'not found') {
        console.warn('Cloudinary delete warning:', result);
      }
    }
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    // Don't throw error as this shouldn't break the main operation
  }
}

/**
 * Delete multiple files from Cloudinary
 * @param {string[]} imageUrls - Array of Cloudinary URLs to delete
 * @returns {Promise<void>}
 */
export async function deleteMultipleFromCloudinary(imageUrls) {
  const deletePromises = imageUrls.map(url => deleteFromCloudinary(url));
  
  try {
    await Promise.allSettled(deletePromises);
  } catch (error) {
    console.error('Multiple delete error:', error);
    // Don't throw error as this shouldn't break the main operation
  }
}

/**
 * Get optimized image URL with transformations
 * @param {string} imageUrl - Original Cloudinary URL
 * @param {Object} transformations - Transformation options
 * @returns {string} - Transformed image URL
 */
export function getOptimizedImageUrl(imageUrl, transformations = {}) {
  try {
    // Extract public_id from URL
    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    
    if (uploadIndex !== -1) {
      const beforeUpload = urlParts.slice(0, uploadIndex + 1);
      const afterUpload = urlParts.slice(uploadIndex + 1);
      
      // Default transformations
      const defaultTransformations = {
        quality: 'auto',
        fetch_format: 'auto',
        ...transformations
      };
      
      // Convert transformations to string
      const transformString = Object.entries(defaultTransformations)
        .map(([key, value]) => `${key}_${value}`)
        .join(',');
      
      // Reconstruct URL with transformations
      return [...beforeUpload, transformString, ...afterUpload].join('/');
    }
    
    return imageUrl;
  } catch (error) {
    console.error('Error creating optimized URL:', error);
    return imageUrl;
  }
}

export default cloudinary;