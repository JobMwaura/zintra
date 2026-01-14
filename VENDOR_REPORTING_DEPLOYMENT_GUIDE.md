# Vendor Reporting & Moderation System - Deployment Guide 🚀

## Quick Deployment Checklist

### ✅ Phase 1: Database Setup (5 minutes)

1. **Open Supabase SQL Editor**
   - Navigate to your Supabase project
   - Go to SQL Editor → New Query

2. **Run Database Migration**
   - Copy entire content from: `supabase/sql/VENDOR_REPORTING_MODERATION_SYSTEM.sql`
   - Paste into SQL Editor
   - Click "Run"
   - Expected: ✅ No errors

3. **Verify Tables Created**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE 'vendor_%'
   ORDER BY table_name;
   ```
   
   Should return:
   - vendor_appeal_history
   - vendor_image_violations
   - vendor_reports
   - vendor_suspensions
   - moderation_queue

---

### ✅ Phase 2: Application Integration (10 minutes)

1. **Add Moderation Link to Admin Dashboard**
   
   File: `app/admin/dashboard/layout.js`
   
   Add to navigation:
   ```javascript
   {
     name: 'Moderation',
     icon: AlertTriangle,
     href: '/admin/dashboard/moderation'
   }
   ```

2. **Add Report Button to Vendor Profile**
   
   File: `app/[vendor_slug]/page.js` or your vendor profile component
   
   ```jsx
   import ReportVendorModal from '@/app/components/ReportVendorModal';
   
   export default function VendorProfile() {
     const [showReportModal, setShowReportModal] = useState(false);

     return (
       <div>
         {/* ... vendor details ... */}
         
         <button
           onClick={() => setShowReportModal(true)}
           className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
         >
           Report Vendor
         </button>

         {showReportModal && (
           <ReportVendorModal
             vendorId={vendor.id}
             vendorName={vendor.business_name}
             onClose={() => setShowReportModal(false)}
           />
         )}
       </div>
     );
   }
   ```

3. **Add Suspension Check to Vendor Login**
   
   File: `app/vendor/login/page.js` or your login component
   
   ```jsx
   import { useEffect, useState } from 'react';

   export default function VendorLogin() {
     const [isSuspended, setIsSuspended] = useState(false);
     const [suspensionData, setSuspensionData] = useState(null);

     const checkSuspensionStatus = async () => {
       try {
         const response = await fetch('/api/vendor/check-suspension');
         const data = await response.json();
         
         if (data.isSuspended) {
           setIsSuspended(true);
           setSuspensionData(data);
         }
       } catch (err) {
         console.error('Failed to check suspension:', err);
       }
     };

     useEffect(() => {
       checkSuspensionStatus();
     }, []);

     if (isSuspended) {
       return (
         <div className="p-8 max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg">
           <h1 className="text-2xl font-bold text-red-800 mb-4">Account Suspended</h1>
           <p className="text-red-700 mb-4">{suspensionData?.reason}</p>
           
           {suspensionData?.type === 'temporary' && (
             <div className="mb-4">
               <p className="text-sm text-red-600">
                 Days remaining: <strong>{suspensionData?.daysRemaining}</strong>
               </p>
             </div>
           )}
           
           {suspensionData?.canAppeal && (
             <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
               Submit Appeal
             </button>
           )}
           
           <p className="text-sm text-red-600 mt-4">
             For more information, contact: support@platform.com
           </p>
         </div>
       );
     }

     return (
       <div>
         {/* ... your login form ... */}
       </div>
     );
   }
   ```

4. **Configure Email Service**
   
   File: `app/api/admin/send-suspension-email/route.js`
   
   Choose your email provider:
   
   **Option A: Using Resend (Recommended)**
   ```bash
   npm install resend
   ```
   
   Then update the function:
   ```javascript
   import { Resend } from 'resend';
   
   async function sendSuspensionEmail({ email, businessName, reason, vendorId }) {
     const resend = new Resend(process.env.RESEND_API_KEY);
     
     const response = await resend.emails.send({
       from: 'noreply@yourplatform.com',
       to: email,
       subject: 'Account Suspension Notice',
       html: emailContent
     });
     
     return { success: !response.error, error: response.error };
   }
   ```
   
   **Option B: Using SendGrid**
   ```bash
   npm install @sendgrid/mail
   ```
   
   **Option C: Using AWS SES**
   ```bash
   npm install aws-sdk
   ```

5. **Set Environment Variables**
   
   Add to `.env.local`:
   ```
   RESEND_API_KEY=your_api_key_here
   # or
   SENDGRID_API_KEY=your_api_key_here
   # or
   AWS_SES_REGION=us-east-1
   ```

---

### ✅ Phase 3: Testing (15 minutes)

#### Test 1: User Can Report Vendor
- [ ] Navigate to a vendor profile
- [ ] Click "Report Vendor" button
- [ ] Fill in report form
- [ ] Submit report
- [ ] See success message
- [ ] Verify in database: `SELECT * FROM vendor_reports WHERE status = 'pending';`

#### Test 2: Admin Can Access Moderation Dashboard
- [ ] Login as super admin
- [ ] Navigate to `/admin/dashboard/moderation`
- [ ] See Reports, Violations, Suspensions tabs
- [ ] View pending reports
- [ ] Click "Review & Take Action"

#### Test 3: Admin Can Take Action on Report
- [ ] Click review button on pending report
- [ ] Select action (disable image, suspend vendor, etc.)
- [ ] Add admin notes
- [ ] Submit action
- [ ] See success message
- [ ] Verify in database: `SELECT * FROM vendor_reports WHERE status = 'action_taken';`

#### Test 4: Vendor Receives Suspension
- [ ] Admin suspends vendor
- [ ] Check vendor's email (or console for test)
- [ ] Email contains: suspension reason, duration, appeal info
- [ ] Vendor tries to login
- [ ] See suspension notice instead of dashboard

#### Test 5: Vendor Can Appeal
- [ ] Vendor clicks "Submit Appeal" on suspension notice
- [ ] Fill in appeal form with explanation
- [ ] Submit appeal
- [ ] See pending message
- [ ] Verify in database: `SELECT * FROM vendor_appeal_history WHERE status = 'pending';`

#### Test 6: Admin Reviews Appeal
- [ ] Admin sees appeal in moderation panel
- [ ] Reviews vendor's explanation and evidence
- [ ] Clicks approve or deny
- [ ] Adds decision notes
- [ ] Vendor notified via email

---

### ✅ Phase 4: Monitoring (Ongoing)

#### Key Queries for Monitoring

**Active Suspensions**
```sql
SELECT 
  v.business_name,
  vs.suspension_reason,
  vs.suspension_end_date,
  CEIL(EXTRACT(DAY FROM vs.suspension_end_date - NOW())) as days_remaining
FROM vendor_suspensions vs
JOIN vendors v ON vs.vendor_id = v.id
WHERE vs.unsuspended_at IS NULL
AND (vs.suspension_end_date IS NULL OR vs.suspension_end_date > NOW())
ORDER BY days_remaining ASC;
```

**Pending Reports**
```sql
SELECT 
  v.business_name,
  vr.report_type,
  vr.severity,
  COUNT(*) as count
FROM vendor_reports vr
JOIN vendors v ON vr.reported_vendor_id = v.id
WHERE vr.status = 'pending'
GROUP BY v.id, vr.report_type, vr.severity
ORDER BY vr.severity DESC;
```

**Pending Appeals**
```sql
SELECT 
  v.business_name,
  vah.appeal_message,
  vah.created_at,
  CEIL(EXTRACT(DAY FROM NOW() - vah.created_at)) as days_pending
FROM vendor_appeal_history vah
JOIN vendors v ON vah.vendor_id = v.id
WHERE vah.status = 'pending'
ORDER BY vah.created_at ASC;
```

**Moderation Metrics**
```sql
SELECT 
  'Total Reports' as metric,
  COUNT(*) as value
FROM vendor_reports
UNION ALL
SELECT 'Pending Reports', COUNT(*) FROM vendor_reports WHERE status = 'pending'
UNION ALL
SELECT 'Active Suspensions', COUNT(*) FROM vendor_suspensions WHERE unsuspended_at IS NULL
UNION ALL
SELECT 'Pending Appeals', COUNT(*) FROM vendor_appeal_history WHERE status = 'pending';
```

---

## 📊 Post-Deployment Checklist

### Day 1 (Go Live)
- [ ] Database migration completed successfully
- [ ] Admin dashboard accessible
- [ ] Report button visible on vendor profiles
- [ ] Test reporting workflow
- [ ] Email notifications working
- [ ] Monitor error logs

### Day 2-3 (Monitor)
- [ ] Review first reports submitted
- [ ] Test admin actions
- [ ] Verify suspension notifications
- [ ] Check suspension blocking on login
- [ ] Monitor performance (page load times)

### Week 1 (Optimize)
- [ ] Review suspension effectiveness
- [ ] Adjust severity thresholds if needed
- [ ] Train admin team on moderation procedures
- [ ] Create moderation guidelines
- [ ] Set up monitoring dashboards

### Ongoing
- [ ] Review reports daily
- [ ] Process appeals within 5 business days
- [ ] Monitor appeal approval rates
- [ ] Track vendor reoffender rates
- [ ] Adjust policies based on data

---

## 🚀 Going Live

1. **Backup Current Database**
   ```bash
   # Via Supabase Console
   Database > Backups > Create backup
   ```

2. **Deploy Code**
   ```bash
   git push origin main
   # Deploy to your hosting platform
   ```

3. **Run SQL Migration**
   - Open Supabase SQL Editor
   - Paste migration script
   - Click "Run"

4. **Verify Integration**
   ```sql
   SELECT COUNT(*) FROM vendor_reports; -- Should be 0
   SELECT COUNT(*) FROM vendor_suspensions; -- Should be 0
   ```

5. **Enable Feature**
   - Activate report button in UI
   - Add moderation link to admin panel
   - Notify admin team

6. **Monitor**
   - Watch for first reports
   - Check logs for errors
   - Monitor performance

---

## 🎓 Admin Team Training

### Core Concepts
1. **Report Types**: Learn what each report type means
2. **Severity Levels**: Understand severity classification
3. **Actions Available**: Disable images, delete images, suspend accounts
4. **Appeal Process**: How vendors appeal suspensions
5. **SLAs**: Response time expectations

### Procedures
1. **Review Reports**: 24-hour review target
2. **Take Actions**: Consistent policy enforcement
3. **Document Decisions**: Add detailed notes
4. **Process Appeals**: 5 business day response
5. **Monitor Suspensions**: Check for auto-expiration

### Best Practices
1. **Be Consistent**: Similar violations get similar actions
2. **Be Fair**: Give vendors chance to appeal
3. **Document Well**: Explain decisions clearly
4. **Review Trends**: Look for patterns
5. **Communicate**: Notify vendors of decisions

---

## 📞 Troubleshooting

### Issue: "Cannot submit report"
**Solution**: 
- Verify user is logged in
- Check database RLS policies
- Ensure vendor_reports table exists
- Check browser console for errors

### Issue: "Email not sent to vendor"
**Solution**:
- Verify email service API key configured
- Check email template is valid
- Verify vendor email is correct
- Check logs for send failures

### Issue: "Suspension not blocking login"
**Solution**:
- Verify check-suspension endpoint called
- Check vendor suspension record created
- Verify suspension status is active
- Check suspension_end_date hasn't passed

### Issue: "Admin cannot access moderation panel"
**Solution**:
- Verify user has admin role
- Check RLS policies enabled
- Verify admin can query tables
- Check page permissions

---

## 📈 Success Metrics

Track these metrics to measure success:

1. **Response Time**: Avg days to review report (target: < 1 day)
2. **Appeal Rate**: % of vendors appealing (target: < 20%)
3. **Appeal Approval Rate**: % appeals approved (target: 10-30%)
4. **Reoffender Rate**: % suspended vendors offending again (target: < 10%)
5. **User Report Accuracy**: % reports resulting in action (target: > 80%)
6. **Vendor Satisfaction**: Appeal decision satisfaction (target: > 70%)

---

## 🎉 You're Live!

Congratulations! Your vendor reporting and moderation system is now live. 

**Key accomplishments:**
✅ Users can report inappropriate vendors  
✅ Admins have tools to moderate content  
✅ Vendors are suspended for violations  
✅ Vendors can appeal suspensions  
✅ Complete audit trail of all actions  
✅ Email notifications keep vendors informed  

**System is ready to keep your platform safe!** 🛡️
