# WumiKay Ventures - Order Management System

A modern, secure order management system built with React, TypeScript, and Supabase for WumiKay Ventures beverage business.

## 🚀 Features

- **Product Management**: Add, edit, and manage beverage products
- **Order Processing**: Complete order management with receipt printing
- **Customer Management**: Track customer information and order history
- **Real-time Dashboard**: Live statistics and order monitoring
- **Secure Authentication**: User login and role-based access
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Receipt Printing**: Automatic receipt generation for orders

## 🛡️ Security Features

- **Environment Variables**: All sensitive data stored in environment variables
- **Row Level Security (RLS)**: Database-level security policies
- **Input Validation**: Comprehensive form validation
- **HTTPS Only**: Secure data transmission
- **No Hardcoded Secrets**: All API keys and credentials externalized

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, CSS3
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **State Management**: React Hooks
- **Styling**: Custom CSS with responsive design
- **Build Tool**: Create React App

## 📋 Prerequisites

- Node.js 16+ 
- npm or yarn
- Supabase account

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd wumikay-ventures
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🗄️ Database Setup

The application uses Supabase as the backend. The database schema includes:

- **Products**: Beverage inventory management
- **Orders**: Order tracking and management
- **Order Items**: Individual order line items
- **Users**: User authentication and management

Database setup is handled automatically through the application.

## 🔐 Security Considerations

- **API Keys**: Never commit API keys to version control
- **Environment Variables**: Use `.env.local` for local development
- **RLS Policies**: Database access is controlled by Row Level Security
- **Input Sanitization**: All user inputs are validated and sanitized
- **HTTPS**: Always use HTTPS in production

## 📱 Usage

1. **Login**: Use the demo credentials or create a new account
2. **Products**: Browse and manage beverage inventory
3. **Orders**: Process customer orders with receipt printing
4. **Dashboard**: Monitor business statistics and recent orders
5. **Settings**: Configure business information and preferences

## 🚀 Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to your hosting platform**
   - Vercel (recommended)
   - Netlify
   - AWS S3 + CloudFront
   - Any static hosting service

3. **Configure environment variables** in your hosting platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is proprietary software for WumiKay Ventures.

## 🆘 Support

For support and questions, contact the development team.

---

**⚠️ Security Notice**: This application handles sensitive business data. Always follow security best practices and keep your API keys secure.