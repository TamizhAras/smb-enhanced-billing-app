# 🔧 UPI Payment Setup Guide

## ⚠️ **Why GPay Says "Cannot do payments":**

Your QR code is currently using **demo/placeholder UPI ID**: `yourbusiness@paytm`

This is not a real UPI ID, so payment apps reject it.

## ✅ **How to Fix This:**

### **Step 1: Get Your Real UPI ID**

#### **Option A: Use Your Existing UPI ID**
1. Open **GPay/PhonePe/Paytm**
2. Go to **Profile → Settings**
3. Find your **UPI ID** (looks like `yourname@paytm`)
4. Copy it exactly

#### **Option B: Create a Business UPI ID**
1. In your UPI app, go to **Settings**
2. Look for **"Create UPI ID"** or **"Add UPI ID"**
3. Create: `yourbusiness@paytm` or `shopname@ybl`

### **Step 2: Update Your App Configuration**

#### **Method 1: Via Settings Page (Easy)**
1. Go to **Enhanced Billing → Settings Tab**
2. Scroll to **"Payment Gateway Configuration"**
3. Update **"Your Business Payment Details"**:
   ```
   Business Name: Your Shop Name
   UPI ID: youractual@paytm  ← Replace with your real UPI ID
   ```

#### **Method 2: Quick Test (Advanced)**
Update the code file directly:
- File: `src/lib/paymentUtils.ts`
- Line 26: Change `businessUPI: 'yourbusiness@paytm'`
- To: `businessUPI: 'your-real-upi@paytm'`

### **Step 3: Test the QR Code**

1. **Update your UPI ID** (using method above)
2. **Create a test invoice**
3. **Click "💳 Pay Now"**
4. **Select "QR Code"**
5. **Scan with GPay** - it should now work!

## 📱 **Common UPI ID Formats:**

| Bank/App | UPI ID Format | Example |
|----------|---------------|---------|
| Paytm | `name@paytm` | `johnshop@paytm` |
| PhonePe | `name@ybl` | `johnshop@ybl` |
| GPay | `name@okicici` | `johnshop@okicici` |
| SBI | `name@oksbi` | `johnshop@oksbi` |
| HDFC | `name@okhdfc` | `johnshop@okhdfc` |

## 🎯 **Example Setup:**

If your business is "John's Bakery" and you use Paytm:

```
Business Name: John's Bakery
UPI ID: johnsbakery@paytm
```

## ✅ **Testing Checklist:**

- [ ] Got real UPI ID from your app
- [ ] Updated business name in settings
- [ ] Updated UPI ID in settings  
- [ ] Created test invoice
- [ ] Generated QR code
- [ ] Scanned with GPay/PhonePe
- [ ] ✅ Payment request appears!

## 🆘 **Still Not Working?**

1. **Double-check UPI ID format** - must be exactly like `name@bank`
2. **Test with different UPI app** - try PhonePe if GPay doesn't work
3. **Check UPI ID is active** - send yourself ₹1 first
4. **Verify amount** - some apps have minimum amounts

---

**🎯 Bottom Line:** Replace the placeholder UPI ID with your real one, and the QR codes will work perfectly!
