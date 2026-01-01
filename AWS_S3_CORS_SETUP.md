# AWS S3 CORS Configuration Instructions

## Step-by-Step: Configure S3 Bucket CORS

Your bucket name: **zintra-images-prod**

### Option 1: Using AWS Console (Easiest)

1. **Open AWS S3 Console**
   - Go to: https://console.aws.amazon.com/s3/
   - Click "Buckets" in the left sidebar
   - Find and click on `zintra-images-prod`

2. **Navigate to Permissions**
   - Click the "Permissions" tab
   - Scroll down to "Cross-origin resource sharing (CORS)"
   - Click "Edit"

3. **Paste CORS Configuration**
   
   Replace any existing content with this JSON:

   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
       "AllowedOrigins": [
         "http://localhost:3000",
         "http://localhost:3001",
         "https://yourdomain.com"
       ],
       "ExposeHeaders": ["ETag", "x-amz-version-id"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

   **Note:** Replace `https://yourdomain.com` with your actual production domain

4. **Click "Save changes"**

### Option 2: Using AWS CLI

Run this command:

```bash
aws s3api put-bucket-cors \
  --bucket zintra-images-prod \
  --cors-configuration '{
    "CORSRules": [
      {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
      }
    ]
  }'
```

### Option 3: Create CORS File and Upload

1. **Create a file: `cors-config.json`**

```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

2. **Run command:**

```bash
aws s3api put-bucket-cors \
  --bucket zintra-images-prod \
  --cors-configuration file://cors-config.json
```

---

## Verify CORS is Configured

Check if CORS is configured correctly:

```bash
aws s3api get-bucket-cors --bucket zintra-images-prod
```

Expected output:
```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
      "ExposeHeaders": ["ETag", "x-amz-version-id"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

---

## What This Allows

With CORS configured, your React component can:
- ✅ Upload files directly to S3 from the browser
- ✅ Download/view files from S3
- ✅ Delete files from S3
- ✅ No CORS errors in browser console

---

## Next Steps

1. ✅ Choose Option 1, 2, or 3 above
2. ✅ Configure CORS for your bucket
3. ✅ Verify it worked (run the verification command)
4. ✅ Come back and let me know it's done
5. ✅ We'll test the upload feature

---

## Important Notes

- **AllowedOrigins**: Add your production domain before deploying
  - Development: `http://localhost:3000`
  - Production: `https://yourdomain.com`

- **AllowedMethods**: 
  - GET - download files
  - PUT - upload files (presigned)
  - DELETE - delete files (presigned)
  - POST - multipart uploads
  - HEAD - check if file exists

- **MaxAgeSeconds**: How long browser caches this policy (3000 = 50 minutes)

---

## Troubleshooting

### "CORS policy: No 'Access-Control-Allow-Origin' header"

This means CORS is not configured. Follow the steps above.

### "CORS policy: Response to preflight request doesn't pass access control"

Usually means:
- AllowedOrigins doesn't match your domain
- AllowedMethods doesn't include what you're trying to do
- AllowedHeaders is restricted

Try using `"AllowedHeaders": ["*"]` for testing.

### Getting "403 Forbidden" on PUT

Could be:
- IAM permissions issue (not CORS)
- Presigned URL expired
- Bucket policy blocking uploads

---

## When Done

Let me know once CORS is configured and I'll help you:
1. Test the upload component
2. Fix any remaining issues
3. Deploy to production

