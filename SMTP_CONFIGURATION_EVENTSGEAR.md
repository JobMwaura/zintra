## 🔐 SMTP Configuration for Forgot Password

Based on your EventsGear email account, here are the exact settings to configure in Supabase:

### **SMTP Settings for Supabase Dashboard**

**Path:** Supabase Dashboard → Settings → Authentication → Email → Custom SMTP

```
Enable Custom SMTP: ON
SMTP Host: mail.eventsgear.co.ke
SMTP Port: 587
SMTP Username: forgetpassword@eventsgear.co.ke
SMTP Password: [Chicago2026*]
Sender Email: forgetpassword@eventsgear.co.ke
Sender Name: Zintra
Enable TLS: YES
Enable STARTTLS: YES
```

### **Port Information (From Your Image)**
- **IMAP Port:** 993 (for receiving mail)
- **POP3 Port:** 995 (for receiving mail)
- **SMTP Port:** 465 (SSL) or 587 (TLS) - **Use 587 for Supabase**
- **Encryption:** SSL/TLS (Required)

### **Recommended Configuration**
Use **Port 587 with TLS** as it's more widely supported by Supabase and modern email services.

### **Email Client Settings (For Reference)**
```
Username: forgetpassword@eventsgear.co.ke
Password: [Use the email account's password]
Incoming Server: mail.eventsgear.co.ke
IMAP Port: 993, POP3 Port: 995
Outgoing Server: mail.eventsgear.co.ke
SMTP Port: 465 (SSL) or 587 (TLS)
Encryption: SSL/TLS
```

### **Expected Email Appearance**
When users receive password reset emails:
```
From: Zintra <forgetpassword@eventsgear.co.ke>
Subject: Reset Your Password
Reply-To: forgetpassword@eventsgear.co.ke
```

### **Next Steps:**
1. Configure SMTP in Supabase Dashboard using settings above
2. Test with "Send Test Email" button
3. Try password reset from your app
4. Check email delivery (inbox and spam)
5. Verify email shows proper sender information

### **Testing Checklist:**
- [ ] SMTP configuration saved in Supabase
- [ ] Test email sent successfully
- [ ] Password reset email received
- [ ] Email shows correct sender
- [ ] Reset link works properly
- [ ] No emails in spam folder