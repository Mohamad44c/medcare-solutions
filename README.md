# MedCare Solutions - Medical Equipment Management System

A comprehensive medical equipment management system built with modern web technologies, designed to streamline the workflow of medical equipment maintenance, repair, and inventory management.

## Overview

MedCare Solutions is a full-stack web application that helps medical facilities and service providers manage their medical equipment maintenance operations. The system handles everything from initial equipment registration to repair workflows, quotations, and invoicing.

Key features include:

- Equipment scope management and tracking
- Repair workflow management
- Evaluation and quotation generation
- Inventory tracking with reorder alerts
- PDF generation for quotations and invoices
- Company and manufacturer management

## Technology Stack

### Frontend

- Next.js (App Router) - React framework
- TypeScript - Type safety
- TailwindCSS - Styling
- shadcn/ui - UI components
- Zustand - State management
- TanStack Query - Data fetching
- React Hook Form - Form handling

### Backend

- Payload CMS - Headless CMS and API
- MongoDB - Database
- Drizzle ORM - Database operations
- Zod - Schema validation
- Puppeteer - PDF generation
- AWS S3 - File storage

## Collections Overview

The system is built around the following core collections:

### Operations Management

- **Scopes**: Tracks medical equipment with details like serial numbers, model numbers, and equipment type (Rigid/Flexible)
- **Repairs**: Manages repair workflows including parts used, labor costs, and repair status
- **Evaluation**: Handles equipment evaluation process with problem identification and recommended actions
- **Quotation**: Manages repair quotations with pricing and PDF generation capabilities
- **Invoices**: Handles billing with detailed cost breakdown and PDF generation

### Inventory Management

- **Inventory**: Tracks stock levels, reorder points, and pricing for parts and equipment
- **Parts**: Manages individual parts with specifications and compatibility information
- **Brands**: Tracks equipment and part manufacturers' brands
- **Manufacturers**: Stores manufacturer details and contact information

### Business Entities

- **Companies**: Manages client company information including contact details and MOF numbers
- **Media**: Handles file uploads and media management

## Quick Start

### Local Development

1. Clone the repository:
   \`\`\`bash
   git clone <repository-url>
   cd medcare-solutions
   \`\`\`

2. Copy environment variables:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

3. Install dependencies and start the development server:
   \`\`\`bash
   pnpm install
   pnpm dev
   \`\`\`

4. Open `http://localhost:3000` in your browser

### Docker Setup (Optional)

For development with Docker:

1. Ensure Docker is installed on your system
2. Update the MongoDB URI in your `.env` file:
   \`\`\`
   MONGODB_URI=mongodb://127.0.0.1/medcare-solutions
   \`\`\`
3. Start the containers:
   \`\`\`bash
   docker-compose up -d
   \`\`\`

## Documentation

For detailed documentation on each collection and its fields, refer to the Payload CMS admin interface at `/admin`.

## Questions

If you have any questions or issues, please reach out to our support team or create an issue in the repository.
