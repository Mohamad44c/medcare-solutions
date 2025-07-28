# MedCare Solutions - Production Ready

A comprehensive medical equipment management system built with Next.js, Payload CMS, and PostgreSQL.

## 🚀 Features

- **Inventory Management**: Track medical equipment, parts, and stock levels
- **Service Workflow**: Complete workflow from evaluation to invoicing
- **PDF Generation**: Automated quotation and invoice PDF generation
- **User Management**: Role-based access control
- **Data Integrity**: Robust validation and error handling
- **Production Ready**: Optimized for deployment and scalability

## 🛠 Tech Stack

- **Framework**: Next.js 15+ with App Router
- **CMS**: Payload CMS
- **Database**: PostgreSQL (Neon DB)
- **Authentication**: Payload Auth
- **PDF Generation**: Puppeteer
- **File Storage**: AWS S3
- **Styling**: Tailwind CSS + Shadcn UI
- **Language**: TypeScript

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database
- AWS S3 bucket (optional, for file storage)
- pnpm package manager

## 🔧 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL=your_postgresql_connection_string
DATABASE_URL_UNPOOLED=your_postgresql_unpooled_connection_string

# Payload CMS
PAYLOAD_SECRET=your_payload_secret_key

# S3 Storage (Optional)
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your_s3_access_key
S3_SECRET_ACCESS_KEY=your_s3_secret_key
S3_BUCKET=your_s3_bucket_name
S3_ENDPOINT=your_s3_endpoint

# Alternative AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=your_s3_bucket_name

# Application
NODE_ENV=production
NEXT_PUBLIC_SERVER_URL=your_domain_url
```

## 🚀 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd medcare-solutions
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Build the application**

   ```bash
   pnpm build
   ```

5. **Start the application**
   ```bash
   pnpm start
   ```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── (frontend)/        # Frontend pages
│   └── (payload)/         # Payload CMS admin
├── collections/           # Payload CMS collections
├── components/            # React components
├── globals/              # Global configurations
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and helpers
├── services/             # Business logic services
└── payload.config.ts     # Payload CMS configuration
```

## 🔐 Authentication & Authorization

The system uses Payload CMS's built-in authentication with role-based access:

- **Admin**: Full access to all features
- **User**: Limited access based on permissions

## 📊 Data Models

### Core Collections

- **Scopes**: Service requests and equipment details
- **Evaluations**: Equipment assessments and diagnostics
- **Quotations**: Service proposals and pricing
- **Invoices**: Billing and payment tracking
- **Inventory**: Parts and equipment stock management
- **Companies**: Client and manufacturer information
- **Users**: System users and administrators

### Relationships

- Scopes → Companies (Many-to-One)
- Evaluations → Scopes (Many-to-One)
- Quotations → Scopes, Evaluations (Many-to-One)
- Invoices → Scopes, Quotations (Many-to-One)
- Inventory → Manufacturers (Many-to-One)

## 🔄 Workflow

1. **Scope Creation**: Create service request with equipment details
2. **Evaluation**: Assess equipment and identify issues
3. **Quotation**: Generate service proposal with pricing
4. **Approval**: Client approves quotation
5. **Repair**: Perform service and track parts used
6. **Invoicing**: Generate invoice and track payment

## 📄 PDF Generation

The system automatically generates professional PDFs for:

- **Quotations**: Service proposals with pricing
- **Invoices**: Billing documents with tax calculations

### Features

- Dynamic content from database
- Professional styling and branding
- Multi-currency support (USD/LBP)
- Automatic file storage in S3
- Fallback to data URLs

## 🚀 Deployment

### Vercel Deployment

1. **Connect repository to Vercel**
2. **Set environment variables in Vercel dashboard**
3. **Deploy automatically on push to main branch**

### Docker Deployment

```bash
# Build Docker image
docker build -t medcare-solutions .

# Run container
docker run -p 3000:3000 --env-file .env.local medcare-solutions
```

### Environment-Specific Configurations

- **Development**: Full debugging, local database
- **Staging**: Production-like environment for testing
- **Production**: Optimized for performance and security

## 🔧 Development

### Available Scripts

```bash
# Development
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server

# Database
pnpm db:reset     # Reset database schema
pnpm db:migrate   # Run database migrations

# Linting & Formatting
pnpm lint         # Run ESLint
pnpm format       # Format code with Prettier
```

### Code Quality

- **TypeScript**: Strict type checking
- **ESLint**: Code linting and best practices
- **Prettier**: Code formatting
- **Error Handling**: Centralized error management
- **Validation**: Input validation and sanitization

## 🛡 Security

- **Input Validation**: All user inputs are validated
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Content sanitization
- **CSRF Protection**: Built-in Next.js protection
- **Authentication**: Secure session management
- **Authorization**: Role-based access control

## 📈 Performance

- **Code Splitting**: Automatic Next.js optimization
- **Image Optimization**: Next.js Image component
- **Database Indexing**: Optimized queries
- **Caching**: Strategic caching implementation
- **CDN**: Static asset delivery

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection**: Verify DATABASE_URL is correct
2. **S3 Upload Failures**: Check AWS credentials and permissions
3. **PDF Generation**: Ensure Puppeteer dependencies are installed
4. **Build Errors**: Clear .next folder and reinstall dependencies

### Logs

- **Application Logs**: Check console output
- **Database Logs**: Monitor PostgreSQL logs
- **S3 Logs**: Check AWS CloudWatch logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions:

- **Email**: support@mcs.com
- **Phone**: +961 03 788345
- **WhatsApp**: +961 70 072401

---

**MedCare Solutions** - Professional medical equipment management system
