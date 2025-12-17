# VENDOR PROFILE IMPROVEMENTS - Implementation Guide

## Overview
This document outlines all the changes needed to fix vendor profile issues and improve functionality. The changes maintain the current beautiful design while adding critical functionality.

## Changes Required

### 1. Update vendor-profile/[id]/page.js

#### 1.1 Add Social Media Fields to Form State
**Location**: Line ~90 in the form state initialization

Add to the form state object:
```javascript
const [form, setForm] = useState({
  company_name: '',
  description: '',
  location: '',
  county: '',
  phone: '',
  email: '',
  website: '',
  whatsapp: '',
  instagram_url: '',      // NEW
  facebook_url: '',       // NEW
  category: '',
});
```

#### 1.2 Add State for Business Hours Change Detection
**Location**: After businessHours state (line ~60)

Add:
```javascript
const [originalBusinessHours, setOriginalBusinessHours] = useState([
  { day: 'Monday - Friday', hours: '7:00 AM - 6:00 PM' },
  { day: 'Saturday', hours: '8:00 AM - 5:00 PM' },
  { day: 'Sunday', hours: 'Closed' },
]);

const [businessHoursModified, setBusinessHoursModified] = useState(false);
```

#### 1.3 Add State for FAQ Management
**Location**: After services state (line ~60)

Add:
```javascript
const [faqs, setFaqs] = useState([]);
const [editingFaqId, setEditingFaqId] = useState(null);
const [showFaqModal, setShowFaqModal] = useState(false);
const [faqForm, setFaqForm] = useState({
  question: '',
  answer: '',
});
const [savingFaq, setSavingFaq] = useState(false);
```

#### 1.4 Update useEffect to Load Services from Database
**Location**: In the fetchVendor function (around line 180)

Replace the hardcoded services array:
```javascript
// OLD CODE (to replace):
setServices([
  { id: 1, name: 'Material Delivery', description: 'Same-day and scheduled delivery options available for all products' },
  { id: 2, name: 'Project Consultation', description: 'Expert advice on material selection and quantity estimation' },
  { id: 3, name: 'Custom Cutting & Fabrication', description: 'On-site cutting and fabrication services for lumber, steel, and other materials' },
  { id: 4, name: 'Equipment Rental', description: 'Rent specialized tools and equipment for your project needs' },
  { id: 5, name: 'Contractor Referrals', description: 'Connect with our network of trusted contractors for your project' },
]);

// NEW CODE:
const { data: servicesData } = await supabase
  .from('vendor_services')
  .select('*')
  .eq('vendor_id', vendorId)
  .order('display_order', { ascending: true });

if (servicesData) {
  setServices(servicesData);
}
```

#### 1.5 Add FAQ Loading to useEffect
**Location**: After services loading in fetchVendor function

Add:
```javascript
// Load FAQs from database
const { data: faqsData } = await supabase
  .from('vendor_faqs')
  .select('*')
  .eq('vendor_id', vendorId)
  .eq('is_active', true)
  .order('display_order', { ascending: true });

if (faqsData) {
  setFaqs(faqsData);
}
```

#### 1.6 Update Initial Form Data to Include Social Media
**Location**: In setForm call (~line 130)

Change to:
```javascript
setForm({
  company_name: data.company_name || '',
  description: data.description || '',
  location: data.location || '',
  county: data.county || '',
  phone: data.phone || '',
  email: data.email || '',
  website: data.website || '',
  whatsapp: data.whatsapp || '',
  instagram_url: data.instagram_url || '',    // NEW
  facebook_url: data.facebook_url || '',      // NEW
  category: data.category || '',
});
```

#### 1.7 Update handleSaveContact to Include Social Media
**Location**: handleSaveContact function (~line 240)

Change updatePayload to:
```javascript
const updatePayload = {
  location: locations[0] || form.location,
  county: form.county,
  phone: form.phone,
  email: form.email,
  website: form.website,
  whatsapp: form.whatsapp,
  instagram_url: form.instagram_url,    // NEW
  facebook_url: form.facebook_url,      // NEW
  category: form.category,
  user_id: vendor.user_id || (currentUser?.email === vendor.email ? currentUser?.id : vendor.user_id),
};
```

#### 1.8 Fix Business Hours Save Button Visibility
**Location**: handleFieldChange function, modify to track changes

Add before the existing handleFieldChange function:
```javascript
const handleBusinessHourChange = (index, field, value) => {
  const updatedHours = [...businessHours];
  updatedHours[index] = { ...updatedHours[index], [field]: value };
  setBusinessHours(updatedHours);
  setBusinessHoursModified(true);
};
```

Then find where hours are edited (~line 892) and update:
```javascript
// Change this:
// value={row.hours}
// onChange={(e) => {
//   const updated = [...businessHours];
//   updated[idx].hours = e.target.value;
//   setBusinessHours(updated);
// }}

// To this:
value={row.hours}
onChange={(e) => handleBusinessHourChange(idx, 'hours', e.target.value)}
```

#### 1.9 Add File Upload Validation Function
**Location**: Add before useEffect hook

```javascript
const validateAndUploadLogo = async (file) => {
  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    setError('File too large. Maximum size: 5MB');
    return null;
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    setError('Invalid file type. Allowed: JPEG, PNG, GIF, WebP');
    return null;
  }

  // Proceed with upload
  setUploadingLogo(true);
  try {
    const ext = file.name.split('.').pop();
    const fileName = `logos/${vendor.id}/logo-${Date.now()}.${ext}`;
    const { data, error: uploadError } = await supabase.storage
      .from('vendor-assets')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('vendor-assets').getPublicUrl(data.path);
    
    if (urlData?.publicUrl) {
      // Update vendor logo in database
      await supabase
        .from('vendors')
        .update({ logo_url: urlData.publicUrl })
        .eq('id', vendor.id);

      setVendor(prev => ({ ...prev, logo_url: urlData.publicUrl }));
      setError(null);
      return urlData.publicUrl;
    }
  } catch (err) {
    setError('Failed to upload logo: ' + err.message);
  } finally {
    setUploadingLogo(false);
  }
  return null;
};
```

#### 1.10 Add Service CRUD Functions
**Location**: Add before return statement

```javascript
const saveService = async () => {
  if (!serviceForm.name || !vendor?.id) return;
  
  setSaving(true);
  try {
    const { data: inserted, error } = await supabase
      .from('vendor_services')
      .insert([{
        vendor_id: vendor.id,
        name: serviceForm.name,
        description: serviceForm.description,
        display_order: services.length + 1,
      }])
      .select()
      .single();

    if (error) throw error;
    
    setServices([...services, inserted]);
    setServiceForm({ name: '', description: '' });
    setShowServiceModal(false);
  } catch (err) {
    setError('Failed to save service: ' + err.message);
  } finally {
    setSaving(false);
  }
};

const deleteService = async (id) => {
  if (!confirm('Delete this service?')) return;
  
  try {
    await supabase.from('vendor_services').delete().eq('id', id);
    setServices(services.filter(s => s.id !== id));
  } catch (err) {
    setError('Failed to delete service: ' + err.message);
  }
};
```

#### 1.11 Add FAQ CRUD Functions
**Location**: Add before return statement

```javascript
const saveFaq = async () => {
  if (!faqForm.question || !faqForm.answer || !vendor?.id) return;
  
  setSavingFaq(true);
  try {
    if (editingFaqId) {
      const { data: updated, error } = await supabase
        .from('vendor_faqs')
        .update({
          question: faqForm.question,
          answer: faqForm.answer,
        })
        .eq('id', editingFaqId)
        .select()
        .single();

      if (error) throw error;
      setFaqs(faqs.map(f => f.id === editingFaqId ? updated : f));
    } else {
      const { data: inserted, error } = await supabase
        .from('vendor_faqs')
        .insert([{
          vendor_id: vendor.id,
          question: faqForm.question,
          answer: faqForm.answer,
          display_order: faqs.length + 1,
          is_active: true,
        }])
        .select()
        .single();

      if (error) throw error;
      setFaqs([...faqs, inserted]);
    }

    setFaqForm({ question: '', answer: '' });
    setEditingFaqId(null);
    setShowFaqModal(false);
  } catch (err) {
    setError('Failed to save FAQ: ' + err.message);
  } finally {
    setSavingFaq(false);
  }
};

const deleteFaq = async (id) => {
  if (!confirm('Delete this FAQ?')) return;
  
  try {
    await supabase.from('vendor_faqs').delete().eq('id', id);
    setFaqs(faqs.filter(f => f.id !== id));
  } catch (err) {
    setError('Failed to delete FAQ: ' + err.message);
  }
};

const startEditFaq = (faq) => {
  setFaqForm({
    question: faq.question,
    answer: faq.answer,
  });
  setEditingFaqId(faq.id);
  setShowFaqModal(true);
};
```

#### 1.12 Update Contact Info Form to Include Social Media Fields
**Location**: Around line 980, in the editingContact div

Add these inputs after the whatsapp field:
```javascript
<input 
  name="instagram_url" 
  value={form.instagram_url} 
  onChange={handleFieldChange} 
  className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm" 
  placeholder="Instagram URL (e.g., https://instagram.com/your_profile)" 
/>
<input 
  name="facebook_url" 
  value={form.facebook_url} 
  onChange={handleFieldChange} 
  className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm" 
  placeholder="Facebook URL (e.g., https://facebook.com/your_page)" 
/>
```

#### 1.13 Update Contact Info Display Section
**Location**: Around line 1010, in the non-editing contact view

Add before the closing div:
```javascript
{vendor.instagram_url && (
  <div>
    <p className="text-slate-500 text-xs font-semibold mb-1">INSTAGRAM</p>
    <a href={vendor.instagram_url} target="_blank" rel="noreferrer" className="text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1">
      Visit Instagram <ExternalLink className="w-3 h-3" />
    </a>
  </div>
)}
{vendor.facebook_url && (
  <div>
    <p className="text-slate-500 text-xs font-semibold mb-1">FACEBOOK</p>
    <a href={vendor.facebook_url} target="_blank" rel="noreferrer" className="text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1">
      Visit Facebook <ExternalLink className="w-3 h-3" />
    </a>
  </div>
)}
```

#### 1.14 Fix Business Hours Save Button Visibility
**Location**: Around line 915, the save button div

Replace:
```javascript
{canEdit && (
  <div className="mt-3 flex justify-end">
    <button
      onClick={saveBusinessHours}
      disabled={savingHours}
      className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 disabled:opacity-60"
    >
      {savingHours ? 'Saving...' : 'Save hours'}
    </button>
  </div>
)}
```

With:
```javascript
{canEdit && businessHoursModified && (
  <div className="mt-3 flex justify-end gap-2">
    <button
      onClick={() => {
        setBusinessHours(originalBusinessHours);
        setBusinessHoursModified(false);
      }}
      className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50"
    >
      Cancel
    </button>
    <button
      onClick={saveBusinessHours}
      disabled={savingHours}
      className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 disabled:opacity-60"
    >
      {savingHours ? 'Saving...' : 'Save hours'}
    </button>
  </div>
)}
```

#### 1.15 Update FAQ Tab Section
**Location**: Replace the entire FAQ tab section (around line 1333)

Replace the hardcoded FAQ array with:
```javascript
{/* FAQ TAB */}
{activeTab === 'faq' && (
  <div className="max-w-3xl">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h2>
      {canEdit && (
        <button
          onClick={() => {
            setFaqForm({ question: '', answer: '' });
            setEditingFaqId(null);
            setShowFaqModal(true);
          }}
          className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-amber-700"
        >
          <Plus className="w-5 h-5" /> Add FAQ
        </button>
      )}
    </div>
    <div className="space-y-3">
      {faqs.length === 0 ? (
        <p className="text-sm text-slate-500">No FAQs yet.{canEdit ? ' Click "Add FAQ" to create one.' : ''}</p>
      ) : (
        faqs.map((faq) => (
          <div key={faq.id} className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-semibold text-slate-900 mb-2">{faq.question}</h4>
                <p className="text-slate-600 text-sm">{faq.answer}</p>
              </div>
              {canEdit && (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => startEditFaq(faq)}
                    className="text-sm px-2 py-1 border border-slate-300 rounded hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteFaq(faq.id)}
                    className="text-sm px-2 py-1 border border-red-200 text-red-600 rounded hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  </div>
)}
```

#### 1.16 Update Service Modal to Save to Database
**Location**: Replace the addService function call with saveService

In the modal:
```javascript
{showServiceModal && canEdit && (
  <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
    <div className="bg-white rounded-lg max-w-md w-full p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900">Add Service</h3>
        <button onClick={() => setShowServiceModal(false)} className="text-slate-400 hover:text-slate-600">
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="space-y-4 mb-6">
        <input
          value={serviceForm.name}
          onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
          className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
          placeholder="Service name"
        />
        <textarea 
          rows={3} 
          value={serviceForm.description} 
          onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} 
          className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500" 
          placeholder="Service description" 
        />
      </div>
      <div className="flex gap-2">
        <button 
          onClick={() => setShowServiceModal(false)} 
          className="flex-1 px-4 py-2 border border-slate-300 rounded font-semibold hover:bg-slate-50"
        >
          Cancel
        </button>
        <button 
          onClick={saveService}
          disabled={saving}
          className="flex-1 px-4 py-2 bg-amber-600 text-white rounded font-semibold hover:bg-amber-700 disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Add'}
        </button>
      </div>
    </div>
  </div>
)}
```

#### 1.17 Add FAQ Modal
**Location**: Add after the service modal

```javascript
{showFaqModal && canEdit && (
  <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
    <div className="bg-white rounded-lg max-w-md w-full p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900">{editingFaqId ? 'Edit' : 'Add'} FAQ</h3>
        <button onClick={() => setShowFaqModal(false)} className="text-slate-400 hover:text-slate-600">
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="space-y-4 mb-6">
        <input
          value={faqForm.question}
          onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
          className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
          placeholder="Question"
        />
        <textarea 
          rows={4} 
          value={faqForm.answer} 
          onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })} 
          className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500" 
          placeholder="Answer" 
        />
      </div>
      <div className="flex gap-2">
        <button 
          onClick={() => setShowFaqModal(false)} 
          className="flex-1 px-4 py-2 border border-slate-300 rounded font-semibold hover:bg-slate-50"
        >
          Cancel
        </button>
        <button 
          onClick={saveFaq}
          disabled={savingFaq}
          className="flex-1 px-4 py-2 bg-amber-600 text-white rounded font-semibold hover:bg-amber-700 disabled:opacity-60"
        >
          {savingFaq ? 'Saving...' : editingFaqId ? 'Update' : 'Add'}
        </button>
      </div>
    </div>
  </div>
)}
```

---

## Deployment Checklist

- [ ] Run SQL migration: `VENDOR_PROFILE_IMPROVEMENTS.sql`
- [ ] Update vendor-profile/[id]/page.js with all changes above
- [ ] Test adding/editing services (persists to database)
- [ ] Test adding/editing FAQs (persists to database)
- [ ] Test social media field display
- [ ] Test business hours save button visibility (only shows when modified)
- [ ] Test logo upload validation (5MB limit, image types only)
- [ ] Test API rate limiting: `/api/rfq-rate-limit`
- [ ] Verify all changes build without errors

---

## Testing Instructions

### Services
1. Go to vendor profile
2. Edit services tab
3. Add a service → refresh page → service should persist
4. Edit service → change and save → should update
5. Delete service → should be removed

### FAQs  
1. Go to vendor profile
2. Edit FAQ tab
3. Add FAQ → refresh page → FAQ should persist
4. Edit FAQ → change and save → should update
5. Delete FAQ → should be removed

### Social Media
1. Go to vendor profile edit
2. Add Instagram and Facebook URLs
3. Save → URLs should appear in contact section
4. Verify links work when clicked

### Business Hours
1. Go to vendor profile edit
2. Edit business hours → Save button should NOT appear
3. Change one hour → Save button should appear
4. Click Save → hours should persist
5. Reload page → changes should be there

### Logo Upload
1. Try uploading a file > 5MB → should show error
2. Try uploading non-image file → should show error
3. Upload valid image → should replace logo and persist

---

## Performance Notes

- Services and FAQs use database queries with indexes
- Pagination not needed yet (typical vendor has <50 services/FAQs)
- Consider lazy-loading in future if data grows

---

