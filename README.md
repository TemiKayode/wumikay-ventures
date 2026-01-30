# WumiKay Ventures - Order Management System

A modern desktop application for beverage order management, built with Electron, React, and PostgreSQL.

**Author / Copyright:** WumiKay Ventures © 2025. All rights reserved. WumiKay Ventures is a trademark of WumiKay Ventures.

## Features

- **Product Management**: Add, edit, and manage your product inventory
- **Order Processing**: Create and track customer orders
- **Receipt Printing**: Generate and print professional receipts
- **Reports & Analytics**: View sales reports and business analytics
- **Customer Management**: Track customer information and order history
- **Data Backup**: Export and import your business data
- **Offline Support**: Works without internet connection (local database)

## Installation

### Windows
1. Download `WumiKay Ventures Setup 1.0.0.exe` from the releases
2. Run the installer and follow the prompts
3. Launch from Desktop or Start Menu

### Portable Version
1. Download `WumiKay Ventures 1.0.0.exe`
2. Run directly - no installation needed

## First Time Setup

1. Launch the application
2. Register a new account or contact administrator for credentials
3. Configure your business settings in Settings > Business Information
4. Add your products in Product Management
5. Start processing orders!

## Database Setup

The application requires PostgreSQL database:

1. Install PostgreSQL
2. Create database: `wumikay_ventures`
3. Run the schema from `database/schema.sql`
4. Configure connection in `server/.env`

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run electron:dev

# Build for Windows
npm run electron:build:win
```

## Support

For support or issues, contact WumiKay Ventures.

## Pushing to GitHub

Before pushing, ensure:

- No `.env` or `server/.env` files are committed (use `server/.env.example` as a template)
- No `build/`, `dist/`, or `dist-live/` folders are committed
- Secrets (DB passwords, API keys) are only in local `.env` files

## License

See [LICENSE](LICENSE). MIT License. WumiKay Ventures © 2025.
