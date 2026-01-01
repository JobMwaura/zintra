# Integration Guide: Add Image Upload to Vendor Profile

## Overview

This guide shows how to integrate the `VendorImageUpload` component into your vendor profile pages.

---

## Example 1: Basic Integration (Edit Page)

### File: `pages/vendor/[id]/edit.js`

```javascript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import VendorImageUpload from '@/components/vendor/VendorImageUpload';

export default function EditVendorProfile() {
  const router = useRouter();
  const { id: vendorId } = router.query;
  const session = useSession();
  const supabase = useSupabaseClient();

  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch vendor profile
  useEffect(() => {
    if (!vendorId) return;

    const fetchVendor = async () => {
      const { data, error } = await supabase
        .from('VendorProfile')
        .select('*')
        .eq('id', vendorId)
        .single();

      if (error) {
        console.error('Error fetching vendor:', error);
      } else {
        setVendor(data);
      }
      setLoading(false);
    };

    fetchVendor();
  }, [vendorId, supabase]);

  // Handle successful image upload
  const handleImageUploadSuccess = async (fileData) => {
    console.log('Image uploaded:', fileData);

    try {
      setSaving(true);

      // Save image URL and key to database
      const { error } = await supabase
        .from('VendorProfile')
        .update({
          profile_image_url: fileData.fileUrl,
          profile_image_key: fileData.key, // Store for future deletion
          updated_at: new Date(),
        })
        .eq('id', vendorId);

      if (error) {
        console.error('Error saving image:', error);
        alert('Failed to save image URL to database');
      } else {
        setSuccessMessage('Image uploaded and saved successfully!');
        
        // Update local state
        setVendor({
          ...vendor,
          profile_image_url: fileData.fileUrl,
          profile_image_key: fileData.key,
        });

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error handling upload:', error);
      alert('An error occurred while saving the image');
    } finally {
      setSaving(false);
    }
  };

  // Handle upload error
  const handleImageUploadError = (error) => {
    console.error('Image upload failed:', error);
    alert('Image upload failed: ' + error.message);
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!vendor) {
    return <div className="p-8">Vendor not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Edit Vendor Profile</h1>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      {/* Image Upload Section */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Profile Image</h2>

        {vendor.profile_image_url && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Current Image:</p>
            <div className="w-32 h-32 relative rounded-lg overflow-hidden border border-gray-200">
              <img
                src={vendor.profile_image_url}
                alt={vendor.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        <VendorImageUpload
          vendorId={vendorId}
          onUploadSuccess={handleImageUploadSuccess}
          onUploadError={handleImageUploadError}
          options={{
            maxSize: 10 * 1024 * 1024, // 10MB
            allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
            label: 'Upload New Profile Image',
          }}
        />
      </div>

      {/* Other form fields */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Other Details</h2>

        {/* Add your other form fields here */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Name
          </label>
          <input
            type="text"
            defaultValue={vendor.company_name || ''}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Save button */}
        <button
          onClick={() => console.log('Save vendor')}
          disabled={saving}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
```

---

## Example 2: In a Modal/Dialog

### File: `components/vendor/EditProfileModal.js`

```javascript
'use client';

import { useState } from 'react';
import VendorImageUpload from '@/components/vendor/VendorImageUpload';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

export default function EditProfileModal({ vendorId, onClose, onSuccess }) {
  const supabase = useSupabaseClient();
  const [uploadedImage, setUploadedImage] = useState(null);

  const handleUploadSuccess = async (fileData) => {
    try {
      // Save to database
      const { error } = await supabase
        .from('VendorProfile')
        .update({
          profile_image_url: fileData.fileUrl,
          profile_image_key: fileData.key,
        })
        .eq('id', vendorId);

      if (error) throw error;

      setUploadedImage(fileData);
      onSuccess?.(fileData);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6">Update Profile Image</h2>

        <VendorImageUpload
          vendorId={vendorId}
          onUploadSuccess={handleUploadSuccess}
          options={{
            label: 'Choose Image',
          }}
        />

        <button
          onClick={onClose}
          className="mt-6 w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
        >
          Close
        </button>
      </div>
    </div>
  );
}
```

---

## Example 3: With Database Schema

### Supabase Table Structure

Your `VendorProfile` table should have these columns:

```sql
CREATE TABLE VendorProfile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  company_name TEXT,
  profile_image_url TEXT,           -- Stores S3 URL
  profile_image_key TEXT,           -- Stores S3 key for deletion
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Migration Query

If you need to add the columns to an existing table:

```sql
ALTER TABLE VendorProfile
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS profile_image_key TEXT;
```

---

## Example 4: With RLS Policy

If using Row-Level Security (RLS), add this policy:

```sql
-- Users can only update their own vendor profile
CREATE POLICY "Users can update own vendor profile" 
ON VendorProfile 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

---

## Display Uploaded Images

### In Vendor Profile View

```javascript
import Image from 'next/image';

export default function VendorProfile({ vendor }) {
  return (
    <div className="flex gap-6">
      {vendor.profile_image_url && (
        <div className="flex-shrink-0">
          <Image
            src={vendor.profile_image_url}
            alt={vendor.name}
            width={200}
            height={200}
            className="rounded-lg object-cover"
          />
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold">{vendor.name}</h1>
        <p className="text-gray-600">{vendor.company_name}</p>
      </div>
    </div>
  );
}
```

### In a Grid/List

```javascript
<div className="grid grid-cols-3 gap-4">
  {vendors.map((vendor) => (
    <div key={vendor.id} className="bg-white rounded-lg overflow-hidden shadow">
      {vendor.profile_image_url ? (
        <div className="w-full h-40 relative">
          <img
            src={vendor.profile_image_url}
            alt={vendor.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400">No image</span>
        </div>
      )}

      <div className="p-4">
        <h3 className="font-semibold">{vendor.name}</h3>
        <p className="text-sm text-gray-600">{vendor.company_name}</p>
      </div>
    </div>
  ))}
</div>
```

---

## Delete Image (Optional)

If you want to allow users to delete uploaded images:

```javascript
import { deleteFileFromS3 } from '@/lib/aws-s3';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

async function deleteVendorImage(vendorId, imageKey) {
  const supabase = useSupabaseClient();

  try {
    // Delete from S3
    await deleteFileFromS3(imageKey);

    // Clear from database
    const { error } = await supabase
      .from('VendorProfile')
      .update({
        profile_image_url: null,
        profile_image_key: null,
      })
      .eq('id', vendorId);

    if (error) throw error;

    console.log('Image deleted successfully');
  } catch (error) {
    console.error('Error deleting image:', error);
    alert('Failed to delete image');
  }
}
```

---

## Testing in Development

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Navigate to your vendor edit page

3. Test upload:
   - Select a JPEG/PNG/WebP image
   - Click Upload
   - Verify success message
   - Check S3 bucket for the file

4. Test display:
   - View vendor profile
   - Verify image displays

---

## Next Steps

1. ✅ Configure S3 CORS (if not done)
2. ✅ Add component to your vendor page
3. ✅ Test upload in development
4. ✅ Deploy to production
5. ✅ Monitor S3 usage and costs

---

## Troubleshooting

### Upload fails with "CORS" error
- Verify S3 CORS is configured (see AWS_S3_CORS_SETUP.md)
- Check browser console for detailed error

### Image not saving to database
- Verify user is authenticated
- Check RLS policies allow update
- Verify column names match your schema

### Image URL doesn't work
- Verify S3 presigned URL hasn't expired
- Check S3 bucket is not blocked from public access
- Verify CORS headers are returned

---

## More Help

- See `AWS_S3_SETUP_GUIDE.md` for complete documentation
- See `AWS_S3_QUICK_START.md` for troubleshooting
- See `lib/aws-s3.js` for all available functions

