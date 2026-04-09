# AWS S3 Image Upload Setup Guide

## Overview
Images uploaded during messaging (user-to-vendor, vendor-to-user) are stored on AWS S3.

## Required Environment Variables

Add these to your Vercel project settings (Environment Variables):

```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_BUCKET_NAME=your_bucket_name_here
```

## How It Works

1. **User uploads image** in message form
2. **Frontend requests presigned URL** from `/api/aws/upload-url`
3. **Backend generates time-limited S3 upload URL** (15 minutes validity)
4. **Browser uploads directly to S3** using presigned URL
5. **Frontend gets public S3 URL** and includes in message
6. **Message saved with image attachment** to vendor_messages table

## Setup Instructions

### Step 1: Create AWS S3 Bucket

1. Go to AWS S3 Console: https://s3.console.aws.amazon.com/
2. Click "Create bucket"
3. Enter bucket name (must be globally unique, e.g., `zintra-messages-prod`)
4. Keep other settings default
5. Click "Create bucket"

### Step 2: Create IAM User with S3 Access

1. Go to IAM Console: https://console.aws.amazon.com/iam/
2. Click "Users" → "Create user"
3. Enter username: `zintra-message-uploader`
4. Click "Create user"

### Step 3: Add S3 Permission Policy

1. Click on the user you just created
2. Click "Add permissions" → "Attach policy directly"
3. Search for: `AmazonS3FullAccess`
4. Check the checkbox
5. Click "Add permissions"

### Step 4: Generate Access Keys

1. Still on the user page, click "Security credentials" tab
2. Scroll to "Access keys"
3. Click "Create access key"
4. Choose "Application running outside AWS" (or similar)
5. Copy and save:
   - Access Key ID
   - Secret Access Key

### Step 5: Configure CORS (Important!)

Your S3 bucket needs CORS enabled for direct uploads to work:

1. Go to your S3 bucket in AWS console
2. Click "Permissions" tab
3. Scroll to "Cross-origin resource sharing (CORS)"
4. Click "Edit"
5. Paste this configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["https://zintra-sandy.vercel.app", "http://localhost:3000"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

6. Click "Save changes"

### Step 6: Add to Vercel Environment Variables

1. Go to your Vercel project: https://vercel.com/dashboard
2. Click on your project
3. Go to "Settings" → "Environment Variables"
4. Add these four variables:

| Name | Value |
|------|-------|
| `AWS_REGION` | `us-east-1` (or your region) |
| `AWS_ACCESS_KEY_ID` | Paste your Access Key ID |
| `AWS_SECRET_ACCESS_KEY` | Paste your Secret Access Key |
| `AWS_BUCKET_NAME` | Your bucket name (e.g., `zintra-messages-prod`) |

5. Make sure to set them for all environments: Development, Preview, Production
6. Click "Save"

### Step 7: Redeploy on Vercel

1. Go to Vercel Deployments
2. Click "Redeploy" on the latest deployment
3. Wait for deployment to complete

## Testing

### Test in Development

```bash
# Get presigned URL
curl -X POST http://localhost:3000/api/aws/upload-url \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test_image.jpg",
    "fileType": "image/jpeg",
    "folder": "user-messages"
  }'

# Expected response:
# {
#   "uploadUrl": "https://your-bucket.s3.amazonaws.com/...",
#   "fileUrl": "https://your-bucket.s3.amazonaws.com/user-messages/test_image.jpg"
# }
```

### Test in App

1. Log in as a user
2. Go to Messages
3. Select a vendor conversation
4. Click the paperclip icon to upload an image
5. Select an image file
6. Image should upload and show as preview
7. Send message with image
8. Image should appear in message thread

## Troubleshooting

### Error: "AWS S3 not configured"

**Cause:** Environment variables not set on Vercel

**Solution:**
1. Check Vercel project settings → Environment Variables
2. Ensure all 4 AWS variables are present
3. Redeploy the project
4. Check the deployment logs for environment variable warnings

### Error: "Failed to get upload URL"

**Possible causes:**
1. AWS credentials expired
2. IAM user doesn't have S3 permissions
3. CORS not configured on bucket

**Solution:**
1. Verify IAM user has `AmazonS3FullAccess` policy
2. Check S3 bucket CORS settings
3. Check Vercel function logs for detailed error message

### Error: "Only image files are allowed"

**Cause:** File type not recognized

**Solution:**
- The endpoint only accepts: JPEG, PNG, GIF, WebP, SVG
- Ensure you're selecting a valid image file
- Check file MIME type

### Error: "Image size must be less than 5MB"

**Cause:** File exceeds 5MB limit

**Solution:**
- Compress image before uploading
- Maximum file size: 5MB per image

## Security Notes

1. **Access Keys**: Keep your AWS access keys secret. They're committed to GitHub in .env files (if using local).
2. **CORS**: Update the CORS configuration to include your production domain (not shown here)
3. **Presigned URLs**: Generated URLs expire after 15 minutes for security
4. **Bucket Policies**: Consider restricting bucket access to specific IPs if needed

## Image Access

Once uploaded, images are stored at:

```
https://[bucket-name].s3.[region].amazonaws.com/[folder]/[filename]
```

Example:
```
https://zintra-messages-prod.s3.us-east-1.amazonaws.com/user-messages/1234567890_abc123_photo.jpg
```

These URLs are public and can be accessed by anyone with the direct link.

## Next Steps

- [ ] Create AWS S3 bucket
- [ ] Create IAM user
- [ ] Generate access keys
- [ ] Configure CORS
- [ ] Add environment variables to Vercel
- [ ] Redeploy project
- [ ] Test image upload in app
- [ ] Verify images appear in message thread

## API Endpoint Reference

**POST** `/api/aws/upload-url`

Request:
```json
{
  "fileName": "1234567890_abc123_photo.jpg",
  "fileType": "image/jpeg",
  "folder": "user-messages"
}
```

Response (Success - 200):
```json
{
  "uploadUrl": "https://bucket.s3.amazonaws.com/...",
  "fileUrl": "https://bucket.s3.amazonaws.com/user-messages/1234567890_abc123_photo.jpg"
}
```

Response (Error - 500):
```json
{
  "error": "AWS S3 not configured. Please set AWS environment variables.",
  "missing": {
    "AWS_ACCESS_KEY_ID": true,
    "AWS_SECRET_ACCESS_KEY": true,
    "AWS_BUCKET_NAME": false
  }
}
```

## Support

If you encounter issues:

1. Check Vercel deployment logs: Vercel Dashboard → Project → Deployments → Click deployment → Logs
2. Check browser console: F12 → Console tab
3. Check network requests: F12 → Network tab → Look for `/api/aws/upload-url` request
4. Verify AWS credentials are correct and have S3 permissions
