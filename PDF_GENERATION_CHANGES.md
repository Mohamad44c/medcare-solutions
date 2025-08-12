# PDF Generation Changes

## Migration from Puppeteer to jsPDF + html2canvas

This document outlines the changes made to migrate the PDF generation system from Puppeteer to jsPDF with html2canvas.

### Changes Made

1. **Dependencies**

   - Removed: `puppeteer`, `puppeteer-core`, and `chrome-aws-lambda`
   - Using existing: `jspdf` and `html2canvas`

2. **HTML Templates**

   - Added HTML templates for both quotations and invoices:
     - `public/templates/quotation-template.html`
     - `public/templates/invoice-template.html`

3. **PDF Generation Service**

   - Updated `src/services/pdfGenerator.ts` to use jsPDF's HTML rendering capabilities
   - Added template loading and placeholder replacement functionality
   - Maintained the same API interface for backward compatibility

4. **New Server-Side PDF Generator**

   - Created `src/services/serverPdfGenerator.ts` with utilities for server-side PDF generation
   - Added template rendering and HTML-to-PDF conversion functions

5. **API Routes**

   - Updated PDF generation routes to use the new PDF generator:
     - `src/app/api/quotations/[id]/generate-pdf/route.ts`
     - `src/app/api/invoices/[id]/generate-pdf/route.ts`

6. **Setup Scripts**
   - Removed Chrome setup script (`scripts/setup-chrome.sh`)
   - Updated package.json scripts

### Benefits of the Change

1. **Reduced Dependencies**

   - Eliminated the need for Chrome/Chromium installation
   - Smaller deployment size
   - Fewer system dependencies

2. **Improved Performance**

   - Faster PDF generation
   - Lower memory usage
   - No browser process overhead

3. **Better Maintainability**

   - HTML templates are separate and easier to modify
   - More straightforward rendering process
   - Cleaner code structure

4. **Consistent Output**
   - More consistent rendering across environments
   - No browser version differences

### Usage Notes

The PDF generation API remains the same, so no changes are needed in the frontend code that calls these endpoints. The PDFs are still generated server-side and either:

1. Uploaded to S3 (if configured)
2. Returned as a base64-encoded data URL (fallback)

### Future Improvements

1. Add more customization options to the HTML templates
2. Implement client-side PDF preview functionality
3. Add more styling options for the generated PDFs
4. Create a template management system for easier customization
