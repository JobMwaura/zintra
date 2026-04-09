#!/usr/bin/env node

/**
 * Upload Zintra Logos to AWS S3
 * This script uploads all logo files to S3 in PNG/JPEG format and provides the CDN URLs
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// AWS S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'zintra-images-prod';
const PUBLIC_DIR = path.join(__dirname, 'public');

// Logo files to process and upload
const logoFiles = [
  {
    localPath: path.join(PUBLIC_DIR, 'logo.svg'),
    s3Key: 'logos/logo.png',
    outputFormat: 'png',
    width: 400, // High resolution for crisp display
    height: 160,
    contentType: 'image/png'
  },
  {
    localPath: path.join(PUBLIC_DIR, 'zintra-svg-logo.svg'),
    s3Key: 'logos/zintra-svg-logo.png',
    outputFormat: 'png',
    width: 400,
    height: 160,
    contentType: 'image/png'
  },
  {
    localPath: path.join(PUBLIC_DIR, 'favicon.svg'),
    s3Key: 'logos/favicon.png',
    outputFormat: 'png',
    width: 200, // Smaller for favicon
    height: 200,
    contentType: 'image/png'
  },
  {
    localPath: path.join(PUBLIC_DIR, 'zintrass-new-logo.png'),
    s3Key: 'logos/zintrass-new-logo.png',
    outputFormat: 'png',
    width: null, // Keep original size
    height: null,
    contentType: 'image/png'
  }
];

async function processAndUploadFile(file) {
  try {
    console.log(`📤 Processing and uploading ${file.s3Key}...`);
    
    let fileBuffer;
    
    // Check if file exists
    if (!fs.existsSync(file.localPath)) {
      throw new Error(`File not found: ${file.localPath}`);
    }
    
    // Process the file based on format
    if (file.outputFormat === 'png' && path.extname(file.localPath) === '.svg') {
      // Convert SVG to PNG using sharp
      console.log(`  🔄 Converting SVG to PNG (${file.width}x${file.height})`);
      
      const svgBuffer = fs.readFileSync(file.localPath);
      fileBuffer = await sharp(svgBuffer)
        .png({ quality: 90, compressionLevel: 6 })
        .resize(file.width, file.height, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
        })
        .toBuffer();
        
    } else if (file.outputFormat === 'png' && path.extname(file.localPath) === '.png') {
      // Optimize existing PNG
      console.log(`  🔧 Optimizing PNG`);
      
      let sharpInstance = sharp(file.localPath).png({ quality: 90, compressionLevel: 6 });
      
      // Resize if dimensions specified
      if (file.width && file.height) {
        sharpInstance = sharpInstance.resize(file.width, file.height, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        });
      }
      
      fileBuffer = await sharpInstance.toBuffer();
      
    } else {
      // Use file as-is
      fileBuffer = fs.readFileSync(file.localPath);
    }
    
    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: file.s3Key,
      Body: fileBuffer,
      ContentType: file.contentType,
      CacheControl: 'public, max-age=31536000', // 1 year cache
      // Note: ACL removed as bucket doesn't allow ACLs - using bucket policy instead
    });
    
    await s3Client.send(command);
    
    const s3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${file.s3Key}`;
    console.log(`✅ Uploaded: ${s3Url}`);
    
    return {
      localPath: file.localPath,
      s3Key: file.s3Key,
      s3Url: s3Url,
      fileSize: fileBuffer.length,
      success: true
    };
    
  } catch (error) {
    console.error(`❌ Failed to upload ${file.s3Key}:`, error.message);
    return {
      localPath: file.localPath,
      s3Key: file.s3Key,
      error: error.message,
      success: false
    };
  }
}

async function uploadAllLogos() {
  console.log('🚀 Starting Zintra logo upload to AWS S3...\n');
  
  // Check if all files exist
  console.log('📋 Checking local files...');
  for (const file of logoFiles) {
    if (fs.existsSync(file.localPath)) {
      console.log(`✅ Found: ${path.basename(file.localPath)}`);
    } else {
      console.log(`❌ Missing: ${path.basename(file.localPath)}`);
    }
  }
  console.log('');
  
  // Upload all files
  const results = [];
  for (const file of logoFiles) {
    if (fs.existsSync(file.localPath)) {
      const result = await processAndUploadFile(file);
      results.push(result);
    } else {
      console.log(`⏭️  Skipping missing file: ${file.s3Key}`);
      results.push({
        localPath: file.localPath,
        s3Key: file.s3Key,
        error: 'File not found',
        success: false
      });
    }
  }
  
  // Summary
  console.log('\n📊 Upload Summary:');
  console.log('==================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful uploads: ${successful.length}`);
  console.log(`❌ Failed uploads: ${failed.length}\n`);
  
  if (successful.length > 0) {
    console.log('🌐 S3 URLs for your PNG logos:');
    console.log('==============================');
    successful.forEach(result => {
      const sizeMB = (result.fileSize / 1024 / 1024).toFixed(2);
      console.log(`${path.basename(result.localPath)} → ${result.s3Url} (${sizeMB}MB)`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n🚨 Failed uploads:');
    console.log('==================');
    failed.forEach(result => {
      console.log(`${path.basename(result.localPath)} → ${result.error}`);
    });
  }
  
  console.log('\n🔄 Next Steps:');
  console.log('==============');
  console.log('1. Update your code to use the PNG S3 URLs above');
  console.log('2. Replace /logo.svg with S3 PNG URLs in:');
  console.log('   - /app/admin/dashboard/layout.js');
  console.log('   - /app/vendor-profile/[id]/page-refactored.js');
  console.log('3. Test that logos load correctly');
  console.log('4. Deploy the updated code');
  console.log('\n💡 Benefits of PNG over SVG:');
  console.log('   ✅ Better browser compatibility');
  console.log('   ✅ Faster loading (no XML parsing)');
  console.log('   ✅ No CORS issues with S3');
  console.log('   ✅ Consistent rendering across browsers');
}

// Check environment variables
if (!process.env.AWS_ACCESS_KEY_ID) {
  console.error('❌ AWS_ACCESS_KEY_ID environment variable is not set');
  process.exit(1);
}

if (!process.env.AWS_SECRET_ACCESS_KEY) {
  console.error('❌ AWS_SECRET_ACCESS_KEY environment variable is not set');
  process.exit(1);
}

// Run the upload
uploadAllLogos().catch(error => {
  console.error('💥 Upload script failed:', error);
  process.exit(1);
});