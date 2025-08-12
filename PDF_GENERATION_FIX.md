# PDF Generation Fix

## Issue

The PDF generation was failing with the error `[ReferenceError: document is not defined]` because jsPDF's HTML rendering functionality was trying to use browser-specific DOM APIs in a Node.js server environment.

## Solution

We've implemented a server-compatible approach for PDF generation:

1. **Added DOM Polyfills**:

   - Added JSDOM to provide DOM API polyfills in the Node.js environment
   - Added canvas to support canvas operations required by jsPDF

2. **Reverted to Direct PDF Generation**:

   - Instead of using HTML templates with jsPDF's html2canvas, we're now using jsPDF's direct drawing API
   - This approach is more reliable in a server environment

3. **Removed Unnecessary Files**:

   - Removed HTML templates that were intended for client-side rendering
   - Removed the serverPdfGenerator.ts file as its functionality is now integrated into the main pdfGenerator.ts

4. **Dependencies Added**:
   - jsdom: To provide DOM API polyfills
   - canvas: To support canvas operations
   - @types/jsdom: TypeScript type definitions for jsdom

## How It Works

1. The PDFGenerator class now uses jsPDF's direct drawing API to create PDFs
2. We set up a minimal JSDOM environment to provide the necessary global objects that jsPDF expects
3. The PDF generation process is now fully server-compatible and doesn't rely on browser APIs

## Testing

To test the PDF generation:

1. Navigate to a quotation or invoice in the application
2. Click the "Generate PDF" button
3. The PDF should be generated and either downloaded or displayed in the browser

## Future Improvements

1. Consider adding more styling options for the generated PDFs
2. Implement client-side PDF preview functionality
3. Add more customization options for the PDF layout and content
