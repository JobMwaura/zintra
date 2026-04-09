# Admin Roles Quick Reference Guide

## 📊 Role Comparison Matrix

| Feature | Super Admin | Admin | Moderator |
|---------|:-----------:|:-----:|:---------:|
| **VENDOR MANAGEMENT** | | | |
| View Vendors | ✅ | ✅ | ✅ |
| Approve Vendors | ✅ | ✅ | ❌ |
| Reject Vendors | ✅ | ✅ | ❌ |
| Suspend Vendors | ✅ | ✅ | ❌ |
| Delete Vendors | ✅ | ❌ | ❌ |
| **RFQ MANAGEMENT** | | | |
| View RFQs | ✅ | ✅ | ✅ |
| Approve RFQs | ✅ | ✅ | ❌ |
| Reject RFQs | ✅ | ✅ | ❌ |
| Close RFQs | ✅ | ✅ | ❌ |
| Delete RFQs | ✅ | ❌ | ❌ |
| **USER MANAGEMENT** | | | |
| View Users | ✅ | ✅ | ✅ |
| Suspend Users | ✅ | ✅ | ❌ |
| Ban Users | ✅ | ❌ | ❌ |
| Delete Users | ✅ | ❌ | ❌ |
| **ADMIN MANAGEMENT** | | | |
| Add Admins | ✅ | ❌ | ❌ |
| Remove Admins | ✅ | ❌ | ❌ |
| Edit Admin Roles | ✅ | ❌ | ❌ |
| Suspend Admins | ✅ | ❌ | ❌ |
| **SUBSCRIPTIONS** | | | |
| Create Plans | ✅ | ❌ | ❌ |
| Edit Plans | ✅ | ❌ | ❌ |
| Delete Plans | ✅ | ❌ | ❌ |
| Manage Subscriptions | ✅ | ❌ | ❌ |
| **CATEGORIES** | | | |
| Create Categories | ✅ | ❌ | ❌ |
| Edit Categories | ✅ | ❌ | ❌ |
| Delete Categories | ✅ | ❌ | ❌ |
| **REPORTS** | | | |
| View Reports | ✅ | ✅ | ✅ |
| Export Reports | ✅ | ❌ | ❌ |
| **AUDIT & LOGS** | | | |
| View Audit Logs | ✅ | ❌ | ❌ |
| View Activity Logs | ✅ | ✅ | ✅ |

---

## 🎯 When to Assign Each Role

### **👑 Super Admin** (super_admin)
**Assign to:** Platform owner, technical lead, senior management

**Why:**
- Full control over platform
- Can manage other admins
- Can make critical decisions
- Needed for growth/scaling
- Oversees entire operation

**Example:** 1-2 super admins maximum

### **👤 Admin** (admin)
**Assign to:** Vendor relations team, RFQ team leads, operations managers

**Why:**
- Can approve vendors and RFQs
- Can handle user suspensions
- Cannot accidentally break admin system
- Limited permissions reduce risk
- Good for delegation

**Example:** 5-10 admins

### **👁️ Moderator** (moderator)
**Assign to:** Support staff, content reviewers, analysts

**Why:**
- Can review vendors/RFQs without approving
- Can report issues to admins
- Read-only access = safer
- Good for training new staff
- Good for auditing

**Example:** 3-20 moderators

---

## 🚀 Quick Actions

### **Adding an Admin**

1. Go to: `/admin/dashboard/admins`
2. Click: "Add Admin" button
3. Enter: Email address
4. Select: Admin or Moderator role
5. Add: Optional notes
6. Click: "Add Admin"

✅ New admin created and can login

### **Changing Admin Role**

1. Click: Edit button (pencil icon)
2. Update: Role dropdown
3. Click: "Update"

✅ Role changed immediately

### **Suspending Admin**

1. Click: Edit button
2. Change: Status → Suspended
3. Click: "Update"

✅ Admin account suspended (cannot login)

### **Removing Admin**

1. Click: Delete button (trash icon)
2. Confirm: "Are you sure?"
3. Click: "Delete"

✅ Admin removed permanently

### **Viewing Activity**

1. Click: Logs button (mail icon)
2. See: All actions taken by this admin
3. View: Timestamps and changes

✅ Full audit trail visible

---

## 🔐 Security Best Practices

### **DO:**
✅ Use strong passwords for all admins  
✅ Review audit logs regularly  
✅ Remove inactive admins  
✅ Use least privilege principle  
✅ Monitor suspicious activity  
✅ Keep 2-3 super admins only  
✅ Log all critical actions  

### **DON'T:**
❌ Share admin credentials  
❌ Give super admin to everyone  
❌ Leave admins with blank passwords  
❌ Grant unnecessary permissions  
❌ Forget to audit changes  
❌ Keep suspended admins around  
❌ Use same password everywhere  

---

## 📋 Admin Status Guide

| Status | Meaning | Behavior |
|--------|---------|----------|
| **Active** | Admin can work | ✅ Can login & perform actions |
| **Inactive** | Temporarily disabled | ⚠️ Cannot login |
| **Suspended** | Locked out | 🔒 Cannot login, marked problematic |

---

## 💡 Permission Architecture

### **Three Levels:**

```
🌍 Application Level
   ↓ (API routes check role)
🔒 Database Level
   ↓ (RLS policies enforce access)
📊 Audit Level
   ↓ (All changes logged)
```

**Example Flow:**
```
User tries to add admin
    ↓
API checks: Is user super_admin? 
    ✅ Yes → Continue
    ❌ No → Deny
    ↓
Database RLS checks same thing
    ↓
Change logged in admin_action_logs
    ↓
Audit trail updated
```

---

## 🎓 Training Checklist

For new super admins:

- [ ] Understand the 3 roles and their permissions
- [ ] Know how to add/remove admins
- [ ] Know how to edit roles and status
- [ ] Know how to view audit logs
- [ ] Know when to suspend vs remove
- [ ] Know security best practices
- [ ] Know how to escalate issues
- [ ] Know who to contact for help

---

## 📞 Troubleshooting

### **"Cannot add admin" error**
**Check:** Are you logged in as super admin?
**Fix:** Only super admins can add other admins

### **"Email already exists" error**
**Check:** Is that email already in system?
**Fix:** Use a different email or remove existing user first

### **"Access Denied" on /admin/dashboard/admins**
**Check:** Are you logged in?
**Fix:** Login with admin account first

### **Audit logs not showing**
**Check:** Is database connected?
**Fix:** Check Supabase connection and RLS policies

---

## 🎯 Admin Management Workflow

```
START
  ↓
Super Admin visits /admin/dashboard/admins
  ↓
Sees list of current admins
  ├─ View audit logs
  ├─ Add new admin
  ├─ Edit existing admin
  └─ Remove admin
  ↓
Makes changes
  ↓
Changes logged automatically
  ↓
Other admins see updates
  ↓
END
```

---

## 📊 Typical Admin Structure

```
Platform
├─ Super Admin #1 (Owner)
│  └─ Can do everything
│
├─ Super Admin #2 (Co-Owner)
│  └─ Can do everything
│
├─ Admin (Vendor Lead)
│  ├─ Approve vendors
│  ├─ Reject vendors
│  └─ Manage vendor issues
│
├─ Admin (RFQ Lead)
│  ├─ Approve RFQs
│  ├─ Reject RFQs
│  └─ Monitor responses
│
├─ Admin (User Support)
│  ├─ View users
│  ├─ Suspend users
│  └─ Handle complaints
│
└─ Moderator (Team 1-3)
   ├─ Review vendors
   ├─ Review RFQs
   └─ Flag issues for admins
```

---

## 🎉 You're All Set!

Your admin management system is ready to use:

✅ **Super Admin** - Full platform control  
✅ **Admin** - Operational management  
✅ **Moderator** - Review & reporting  
✅ **Audit Trail** - All changes logged  
✅ **Security** - RLS enforced at DB level  

**Next Steps:**
1. Run the SQL migration
2. Add super admin(s)
3. Add team admins
4. Grant appropriate roles
5. Monitor audit logs

Happy administrating! 🚀

