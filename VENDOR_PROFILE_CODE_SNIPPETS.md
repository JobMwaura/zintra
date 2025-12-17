# Vendor Profile Code Snippets - Copy & Paste Ready

This document contains exact code snippets for each change needed in `app/vendor-profile/[id]/page.js`

---

## 📍 Section 1.1: Add Social Media to Form State

**Location**: Around line 85, the form state object  
**Action**: Update the existing form state

```javascript
// FIND THIS:
const [form, setForm] = useState({
  company_name: '',
  description: '',
  location: '',
  county: '',
  phone: '',
  email: '',
  website: '',
  whatsapp: '',
  category: '',
});

// CHANGE TO THIS:
const [form, setForm] = useState({
  company_name: '',
  description: '',
  location: '',
  county: '',
  phone: '',
  email: '',
  website: '',
  whatsapp: '',
  instagram_url: '',
  facebook_url: '',
  category: '',
});
```

---

## 📍 Section 1.2: Add Business Hours Change Detection

**Location**: After businessHours state (around line 70)  
**Action**: Add new state

```javascript
// ADD AFTER businessHours state:
const [originalBusinessHours, setOriginalBusinessHours] = useState([
  { day: 'Monday - Friday', hours: '7:00 AM - 6:00 PM' },
  { day: 'Saturday', hours: '8:00 AM - 5:00 PM' },
  { day: 'Sunday', hours: 'Closed' },
]);

const [businessHoursModified, setBusinessHoursModified] = useState(false);
```

---

## 📍 Section 1.3: Add FAQ State Variables

**Location**: After services state (around line 75)  
**Action**: Add new state

```javascript
// ADD AFTER services state:
const [faqs, setFaqs] = useState([]);
const [editingFaqId, setEditingFaqId] = useState(null);
const [showFaqModal, setShowFaqModal] = useState(false);
const [faqForm, setFaqForm] = useState({
  question: '',
  answer: '',
});
const [savingFaq, setSavingFaq] = useState(false);
```

---

## 📍 Section 1.4: Load Services from Database

**Location**: In fetchVendor function, replace hardcoded services (~line 170)  
**Action**: Replace entire services block

```javascript
// FIND AND REPLACE THIS ENTIRE BLOCK:
setServices([
  { id: 1, name: 'Material Delivery', description: 'Same-day and scheduled delivery options available for all products' },
  { id: 2, name: 'Project Consultation', description: 'Expert advice on material selection and quantity estimation' },
  { id: 3, name: 'Custom Cutting & Fabrication', description: 'On-site cutting and fabrication services for lumber, steel, and other materials' },
  { id: 4, name: 'Equipment Rental', description: 'Rent specialized tools and equipment for your project needs' },
  { id: 5, name: 'Contractor Referrals', description: 'Connect with our network of trusted contractors for your project' },
]);

// WITH THIS:
const { data: servicesData } = await supabase
  .from('vendor_services')
  .select('*')
  .eq('vendor_id', vendorId)
  .order('display_order', { ascending: true });

if (servicesData) {
  setServices(servicesData);
}
```

---

## 📍 Section 1.5: Load FAQs from Database

**Location**: In fetchVendor, right after services loading (~line 190)  
**Action**: Add new code block

```javascript
// ADD AFTER services loading:
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

---

## 📍 Section 1.6: Update Form with Social Media

**Location**: In setForm call, around line 125  
**Action**: Add social media fields to form state

```javascript
// FIND THIS:
setForm({
  company_name: data.company_name || '',
  description: data.description || '',
  location: data.location || '',
  county: data.county || '',
  phone: data.phone || '',
  email: data.email || '',
  website: data.website || '',
  whatsapp: data.whatsapp || '',
  category: data.category || '',
});

// CHANGE TO THIS:
setForm({
  company_name: data.company_name || '',
  description: data.description || '',
  location: data.location || '',
  county: data.county || '',
  phone: data.phone || '',
  email: data.email || '',
  website: data.website || '',
  whatsapp: data.whatsapp || '',
  instagram_url: data.instagram_url || '',
  facebook_url: data.facebook_url || '',
  category: data.category || '',
});
```

---

## 📍 Section 1.7: Update handleSaveContact for Social Media

**Location**: In handleSaveContact function, update updatePayload (~line 240)  
**Action**: Add social media URLs to payload

```javascript
// FIND:
const updatePayload = {
  location: locations[0] || form.location,
  county: form.county,
  phone: form.phone,
  email: form.email,
  website: form.website,
  whatsapp: form.whatsapp,
  category: form.category,
  user_id: vendor.user_id || (currentUser?.email === vendor.email ? currentUser?.id : vendor.user_id),
};

// CHANGE TO:
const updatePayload = {
  location: locations[0] || form.location,
  county: form.county,
  phone: form.phone,
  email: form.email,
  website: form.website,
  whatsapp: form.whatsapp,
  instagram_url: form.instagram_url,
  facebook_url: form.facebook_url,
  category: form.category,
  user_id: vendor.user_id || (currentUser?.email === vendor.email ? currentUser?.id : vendor.user_id),
};
```

---

## 📍 Section 1.8: Add Business Hours Change Handler

**Location**: Before useEffect hook (~line 105)  
**Action**: Add new handler function

```javascript
// ADD THIS FUNCTION:
const handleBusinessHourChange = (index, field, value) => {
  const updatedHours = [...businessHours];
  updatedHours[index] = { ...updatedHours[index], [field]: value };
  setBusinessHours(updatedHours);
  setBusinessHoursModified(true);
};
```

---

## 📍 Section 1.9: Add Logo Upload Validation

**Location**: Before useEffect hook (~line 110)  
**Action**: Add validation function

```javascript
// ADD THIS FUNCTION:
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

---

## 📍 Section 1.10: Add Service CRUD Functions

**Location**: Before return statement (~line 1400)  
**Action**: Add functions

```javascript
// ADD THESE FUNCTIONS:
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

---

## 📍 Section 1.11: Add FAQ CRUD Functions

**Location**: Before return statement (~line 1400)  
**Action**: Add functions

```javascript
// ADD THESE FUNCTIONS:
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

---

## 📍 Section 1.12: Add Social Media Form Fields

**Location**: In editingContact section, after whatsapp input (~line 980)  
**Action**: Add two new inputs

```javascript
// ADD AFTER the whatsapp input:
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

---

## 📍 Section 1.13: Add Social Media Display

**Location**: In contact info display section, before closing div (~line 1010)  
**Action**: Add social media links

```javascript
// ADD BEFORE THE CLOSING </div> OF CONTACT INFO:
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

---

## 📍 Section 1.14: Fix Business Hours Save Button

**Location**: Save hours button section (~line 915)  
**Action**: Replace button logic

```javascript
// FIND THIS:
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

// REPLACE WITH THIS:
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

---

## 📍 Section 1.15: Replace FAQ Tab

**Location**: FAQ tab section (~line 1333)  
**Action**: Replace entire tab content

```javascript
// FIND AND REPLACE THIS ENTIRE SECTION:
{/* FAQ TAB */}
{activeTab === 'faq' && (
  <div className="max-w-3xl">
    <h2 className="text-2xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h2>
    <div className="space-y-3">
      {[
        { q: 'What is your delivery timeframe?', a: 'We offer same-day and scheduled deliveries based on your location and availability.' },
        { q: 'Do you offer bulk discounts?', a: 'Yes! Contact our team for custom pricing on large orders.' },
        { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, bank transfers, and M-Pesa.' },
      ].map((item, idx) => (
        <div key={idx} className="bg-white rounded-lg border border-slate-200 p-6">
          <h4 className="font-semibold text-slate-900 mb-2">{item.q}</h4>
          <p className="text-slate-600">{item.a}</p>
        </div>
      ))}
    </div>
  </div>
)}

// WITH THIS:
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

---

## 📍 Section 1.16: Update Service Modal

**Location**: Service modal section (~line 1365)  
**Action**: Update the add button click handler

```javascript
// FIND:
<button onClick={addService} className="flex-1 px-4 py-2 bg-amber-600 text-white rounded font-semibold hover:bg-amber-700">
  Add
</button>

// REPLACE WITH:
<button 
  onClick={saveService}
  disabled={saving}
  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded font-semibold hover:bg-amber-700 disabled:opacity-60"
>
  {saving ? 'Saving...' : 'Add'}
</button>
```

---

## 📍 Section 1.17: Add FAQ Modal

**Location**: After service modal, before DirectRFQPopup (~line 1385)  
**Action**: Add new modal

```javascript
// ADD THIS NEW MODAL:
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

## ✅ Verification Checklist

After applying all snippets, verify:

- [ ] No TypeScript/build errors: `npm run build`
- [ ] All imports present at top of file
- [ ] Services load from database on page load
- [ ] FAQs load from database on page load
- [ ] Can add service → persists after reload
- [ ] Can edit service → changes persist
- [ ] Can delete service → removed from display
- [ ] Can add FAQ → persists after reload
- [ ] Can edit FAQ → changes persist
- [ ] Can delete FAQ → removed from display
- [ ] Social media fields show in edit mode
- [ ] Social media links display in view mode
- [ ] Save hours button only shows when modified
- [ ] Logo upload validates file size and type

---

