# SMB Enhanced Billing Application

A comprehensive Progressive Web Application (PWA) for Small and Medium Business billing management with advanced communication features.

## 🚀 Features

### ✅ **Complete Billing Management**
- **Invoice Management**: Create, edit, track invoices with professional templates
- **Payment Processing**: Record payments with multiple methods (Cash, Card, UPI, Bank Transfer, etc.)
- **Multi-Currency Support**: Handle different currencies with proper formatting
- **Recurring Invoices**: Automated recurring billing for subscription-based services
- **Tax Management**: Configurable tax rates and automatic calculations
- **Professional PDF Generation**: Download invoices as professional PDFs

### 📱 **Advanced Communication System**
- **Email Integration**: Send invoices via multiple email services (SendGrid, EmailJS, Nodemailer)
- **WhatsApp Integration**: 
  - **Manual Mode**: Opens WhatsApp with pre-filled professional messages
  - **Automatic Mode**: Direct sending via WhatsApp Business API
- **SMS Notifications**: Integration with Twilio, AWS SNS, MessageBird
- **Customizable Templates**: Professional, polite message templates with variable substitution

### 📊 **Analytics & Reporting**
- **Revenue Analytics**: Monthly revenue tracking and visualization
- **Payment Analytics**: Payment method breakdowns and trends
- **Customer Analytics**: Top customers by revenue
- **Overdue Management**: Track and manage overdue invoices

### 🎛️ **Professional Settings**
- **Company Configuration**: Company details, currency, tax rates
- **Communication Settings**: Configure email, WhatsApp, and SMS services
- **Invoice Templates**: Multiple professional invoice layouts
- **Tax Rate Management**: Create and manage different tax rates

### 🔧 **Technical Features**
- **Progressive Web App**: Installable, offline-capable
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Local Database**: Dexie.js for robust offline data storage
- **Modern UI**: Tailwind CSS with professional design
- **TypeScript**: Type-safe development with excellent IDE support

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Database**: Dexie.js (IndexedDB wrapper)
- **State Management**: Zustand
- **Icons**: Heroicons
- **Build Tool**: Vite
- **PWA**: Vite PWA Plugin with Workbox

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd smb-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 📚 Usage Guide

### 1. Initial Setup
- Open the application
- Go to Settings tab
- Configure your company information
- Set up communication preferences

### 2. Creating Invoices
- Navigate to the Billing tab
- Click "Create Invoice"
- Fill in customer details and invoice items
- Save or send the invoice

### 3. Recording Payments
- Find the invoice in the billing list
- Click "Record Payment"
- Enter payment details and method
- Confirm the payment

### 4. Communication Features
- **Email**: Configure SMTP settings in Settings
- **WhatsApp**: Choose manual or automatic mode
- **SMS**: Set up SMS service credentials

### 5. Viewing Analytics
- Navigate to the Analytics tab
- View revenue trends, payment breakdowns
- Monitor overdue invoices

## 🔧 Configuration

### Communication Settings

#### Email Configuration
```typescript
{
  email: {
    service: 'sendgrid' | 'emailjs' | 'nodemailer',
    enabled: boolean,
    config: {
      apiKey?: string,
      fromEmail?: string,
      // ... other service-specific configs
    }
  }
}
```

#### WhatsApp Configuration
```typescript
{
  whatsapp: {
    mode: 'manual' | 'automatic',
    enabled: boolean,
    config: {
      businessPhoneNumberId?: string,
      accessToken?: string,
      // ... for automatic mode
    }
  }
}
```

#### SMS Configuration
```typescript
{
  sms: {
    service: 'twilio' | 'aws-sns' | 'messagebird',
    enabled: boolean,
    config: {
      accountSid?: string,
      authToken?: string,
      // ... service-specific configs
    }
  }
}
```

## 📱 PWA Features

This application can be installed as a Progressive Web App:

1. **Desktop**: Click the install button in your browser's address bar
2. **Mobile**: Use "Add to Home Screen" option in your browser menu

### Offline Capabilities
- View existing invoices and data
- Create new invoices (synced when online)
- Access all core features without internet

## 🎨 Customization

### Themes
The application uses Tailwind CSS for styling. You can customize:
- Colors in `tailwind.config.js`
- Component styles in `src/components/ui/`

### Invoice Templates
Modify invoice layouts in `src/store/useEnhancedInvoiceStore.ts`

### Message Templates
Customize communication templates for different scenarios:
- Invoice delivery
- Payment reminders
- Overdue notifications

## 📂 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (Button, Card, Input)
│   ├── Sidebar.tsx     # Navigation sidebar
│   └── OfflineIndicator.tsx
├── pages/              # Main application pages
│   ├── EnhancedBillingPage.tsx  # Core billing interface
│   ├── AnalyticsPage.tsx        # Analytics dashboard
│   └── [other pages]
├── store/              # Zustand state management
│   ├── useEnhancedInvoiceStore.ts  # Main billing store
│   └── [other stores]
├── lib/                # Utilities and configurations
│   ├── database.ts     # Dexie database schema
│   └── mockDataPhase3.ts
└── assets/             # Static assets
```

## 🔒 Data Privacy

- **Local Storage**: All data is stored locally using IndexedDB
- **No Cloud Dependencies**: Works completely offline
- **User Control**: Users have full control over their data
- **Export/Backup**: Data can be exported for backup purposes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments for implementation details

## 🔄 Version History

- **v1.0.0**: Initial release with comprehensive billing features
- Enhanced communication system with WhatsApp, Email, SMS
- Professional UI with analytics and reporting
- PWA capabilities with offline support

---

Built with ❤️ for Small and Medium Businesses
      },
      // other options...
    },
  },
])
```
