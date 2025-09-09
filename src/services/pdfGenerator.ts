import jsPDF from 'jspdf';
import path from 'path';
import fs from 'fs/promises';
// Add the polyfill for Node.js environment
import { JSDOM } from 'jsdom';
import { createCanvas, loadImage } from 'canvas';
import sharp from 'sharp';

// Polyfill for document and window in Node.js
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window as any;
global.document = dom.window.document;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
global.HTMLImageElement = dom.window.HTMLImageElement;
global.Image = dom.window.Image;

// Types (same as before)
interface QuotationData {
  quotationNumber: string;
  quotationDate: string;
  offerValidity: string;
  scope: {
    name: string;
    modelNumber: string;
    serialNumber: string;
    receivedDate: string;
    brand?: {
      title: string;
    };
    company: {
      name: string;
      phone?: string;
      address?: string;
    };
  };
  deliveryPeriod: number;
  problems: string;
  serviceType: string;
  price: number;
  discount: number;
  notes?: string;
}

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  mofNumber: string;
  scope: {
    name: string;
    modelNumber: string;
    serialNumber: string;
    company: {
      name: string;
      phone?: string;
      address?: string;
      mofNumber?: string;
    };
    manufacturer?: {
      title: string;
    };
  };
  quotation?: {
    serviceType: string;
  };
  unitPrice: number;
  totalPrice: number;
  tax: number;
  totalDue: number;
  dueDate: string;
  showTVAInLBP: boolean;
  dollarRate?: number;
}

// Constants
const DEFAULT_DOLLAR_RATE = 89500;
const DEFAULT_LOGO_PATH = path.join(
  process.cwd(),
  'public',
  'assets',
  'mcs-logo.png'
);

export class PDFGenerator {
  /**
   * Format date string to readable format
   */
  private static formatDate(dateString: string): string {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  }

  /**
   * Convert number to words (for currency amounts)
   */
  private static numberToWords(amount: number): string {
    const ones = [
      '',
      'one',
      'two',
      'three',
      'four',
      'five',
      'six',
      'seven',
      'eight',
      'nine',
    ];
    const teens = [
      'ten',
      'eleven',
      'twelve',
      'thirteen',
      'fourteen',
      'fifteen',
      'sixteen',
      'seventeen',
      'eighteen',
      'nineteen',
    ];
    const tens = [
      '',
      '',
      'twenty',
      'thirty',
      'forty',
      'fifty',
      'sixty',
      'seventy',
      'eighty',
      'ninety',
    ];

    const convertLessThanOneThousand = (num: number): string => {
      if (num === 0) return '';

      if (num < 10) return ones[num];
      if (num < 20) return teens[num - 10];
      if (num < 100) {
        return (
          tens[Math.floor(num / 10)] +
          (num % 10 !== 0 ? ' ' + ones[num % 10] : '')
        );
      }
      if (num < 1000) {
        return (
          ones[Math.floor(num / 100)] +
          ' hundred' +
          (num % 100 !== 0
            ? ' and ' + convertLessThanOneThousand(num % 100)
            : '')
        );
      }
      return '';
    };

    const convert = (num: number): string => {
      if (num === 0) return 'zero';
      if (num < 1000) return convertLessThanOneThousand(num);
      if (num < 1000000) {
        return (
          convertLessThanOneThousand(Math.floor(num / 1000)) +
          ' thousand' +
          (num % 1000 !== 0 ? ' ' + convertLessThanOneThousand(num % 1000) : '')
        );
      }
      if (num < 1000000000) {
        return (
          convertLessThanOneThousand(Math.floor(num / 1000000)) +
          ' million' +
          (num % 1000000 !== 0
            ? ' ' +
              convert(Math.floor(num / 1000) % 1000) +
              ' thousand' +
              (num % 1000 !== 0
                ? ' ' + convertLessThanOneThousand(num % 1000)
                : '')
            : '')
        );
      }
      return '';
    };

    const dollars = Math.floor(amount);
    const cents = Math.round((amount - dollars) * 100);

    let result = convert(dollars) + ' dollar' + (dollars !== 1 ? 's' : '');

    if (cents > 0) {
      result += ' and ' + convert(cents) + ' cent' + (cents !== 1 ? 's' : '');
    }

    return result;
  }

  /**
   * Load image file and convert to base64
   */
  private static async loadImageAsBase64(filePath: string): Promise<string> {
    try {
      // Read the image file
      const buffer = await fs.readFile(filePath);

      // Optimize the image using sharp
      const optimizedBuffer = await sharp(buffer)
        .resize(300, 300, {
          // Resize to reasonable dimensions
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({
          // Convert to JPEG with compression
          quality: 80,
          progressive: true,
        })
        .toBuffer();

      return optimizedBuffer.toString('base64');
    } catch (error) {
      console.warn(`Could not load image from ${filePath}:`, error);
      return '';
    }
  }

  /**
   * Add logo to PDF
   */
  private static async addLogo(
    doc: jsPDF,
    x: number,
    y: number
  ): Promise<void> {
    try {
      const logoBase64 = await this.loadImageAsBase64(DEFAULT_LOGO_PATH);
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', x, y, 30, 30);
      }
    } catch (error) {
      console.warn('Could not add logo to PDF:', error);
    }
  }

  /**
   * Add header with company info
   */
  private static async addHeader(doc: jsPDF, title: string): Promise<number> {
    // Add logo
    await this.addLogo(doc, 20, 15);

    // Company info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Beirut Lebanon', 55, 20);
    doc.text('Hazmieh, Mar Roukouz Center 4th Floor', 55, 25);
    doc.text('+961 03 788345', 55, 30);
    doc.text('+961 70 072401 (WhatsApp)', 55, 35);
    doc.text('info@medcare-solutions.com', 55, 40);

    // Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 139, 209); // #258bd1
    doc.text(title, 150, 25);

    return 50; // Return Y position for next content
  }

  /**
   * Add table to PDF
   */
  private static addTable(
    doc: jsPDF,
    startY: number,
    headers: string[],
    rows: string[][],
    options?: {
      headerColor?: [number, number, number];
      fontSize?: number;
      isDescriptionTable?: boolean;
    }
  ): number {
    const {
      headerColor = [37, 139, 209],
      fontSize = 9,
      isDescriptionTable = false,
    } = options || {};
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const tableWidth = pageWidth - 2 * margin;

    // If this is a table with description (like the price table), make the first column wider
    let colWidths: number[];
    if (
      isDescriptionTable &&
      headers.length === 3 &&
      headers[0] === 'Description'
    ) {
      // For price table: Description column gets 60% of the width, others split the rest
      colWidths = [
        tableWidth * 0.6, // Description column
        tableWidth * 0.2, // Unit Price
        tableWidth * 0.2, // Total Price
      ];
    } else {
      // Default: equal width for all columns
      colWidths = headers.map(() => tableWidth / headers.length);
    }

    let currentY = startY;

    // Header
    doc.setFillColor(...headerColor);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(fontSize);

    doc.rect(margin, currentY, tableWidth, 8, 'F');

    // Calculate x position for each column
    let xPos = margin;
    headers.forEach((header, i) => {
      doc.text(header, xPos + 2, currentY + 6);
      xPos += colWidths[i];
    });

    currentY += 8;

    // Rows
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    rows.forEach((row, rowIndex) => {
      // Calculate row height based on content
      let rowHeight = 8; // Minimum row height

      // First pass: determine the required height for this row
      row.forEach((cell, i) => {
        // For description column or any long text
        if (cell.length > 25) {
          const textLines = doc.splitTextToSize(cell, colWidths[i] - 4); // -4 for padding
          const cellHeight = textLines.length * 5; // 5 points per line
          rowHeight = Math.max(rowHeight, cellHeight);
        }
      });

      // Draw the background for the row with the calculated height
      if (rowIndex % 2 === 0) {
        doc.setFillColor(248, 249, 250);
        doc.rect(margin, currentY, tableWidth, rowHeight, 'F');
      }

      // Second pass: render the text
      let xPos = margin;
      row.forEach((cell, i) => {
        if (cell.length > 25) {
          const textLines = doc.splitTextToSize(cell, colWidths[i] - 4);
          doc.text(textLines, xPos + 2, currentY + 6);
        } else {
          doc.text(cell, xPos + 2, currentY + 6);
        }
        xPos += colWidths[i];
      });

      currentY += rowHeight;
    });

    // Table border
    doc.setDrawColor(255, 255, 255);
    doc.rect(margin, startY, tableWidth, currentY - startY);

    return currentY + 10;
  }

  /**
   * Generate quotation PDF
   */
  public static async generateQuotationPDF(
    data: QuotationData
  ): Promise<Buffer> {
    const doc = new jsPDF({
      compress: true,
      putOnlyUsedFonts: true,
      precision: 2,
    });

    try {
      // Header
      let currentY = await this.addHeader(doc, 'QUOTATION');

      // Quotation details
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      const detailsStartX = 150;
      doc.text(
        `Quotation#: ${data.quotationNumber}`,
        detailsStartX,
        currentY - 15
      );
      doc.text(`Sales Person: MCS Sales`, detailsStartX, currentY - 10);
      doc.text(
        `Offer Validity: ${this.formatDate(data.offerValidity)}`,
        detailsStartX,
        currentY - 5
      );
      doc.text(
        `Date: ${this.formatDate(data.quotationDate)}`,
        detailsStartX,
        currentY
      );

      currentY += 10;

      // Client info box
      doc.setFillColor(248, 249, 250);
      doc.rect(20, currentY, 170, 20, 'F');
      doc.setDrawColor(6, 57, 112);
      doc.setLineWidth(2);
      doc.line(20, currentY, 20, currentY + 20);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(6, 57, 112);
      doc.text('To:', 25, currentY + 8);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(`${data.scope.company.name}`, 35, currentY + 8);
      doc.text(
        `Phone: ${data.scope.company.phone || 'N/A'}`,
        25,
        currentY + 13
      );
      doc.text(
        `Location: ${data.scope.company.address || 'N/A'}`,
        25,
        currentY + 18
      );

      currentY += 30;

      // Equipment table
      const equipmentHeaders = [
        'Name',
        'Make',
        'Model #',
        'Serial #',
        'Date Received',
        'Delivery Period',
      ];
      const equipmentRows = [
        [
          data.scope.name,
          data.scope.brand?.title || 'N/A',
          data.scope.modelNumber,
          data.scope.serialNumber,
          this.formatDate(data.scope.receivedDate),
          `${data.deliveryPeriod || 0} days`,
        ],
      ];

      currentY = this.addTable(doc, currentY, equipmentHeaders, equipmentRows);

      // Price table
      const priceHeaders = ['Description', 'Unit Price', 'Total Price'];
      const priceRows = [
        [
          `${data.serviceType} - ${data.problems}`,
          `$${data.price.toFixed(2)}`,
          `$${data.price.toFixed(2)}`,
        ],
      ];

      if (data.discount > 0) {
        priceRows.push([
          'Discount',
          `-$${data.discount.toFixed(2)}`,
          `-$${data.discount.toFixed(2)}`,
        ]);
      }

      priceRows.push([
        'TOTAL',
        '',
        `$${(data.price - data.discount).toFixed(2)}`,
      ]);

      currentY = this.addTable(doc, currentY, priceHeaders, priceRows, {
        isDescriptionTable: true,
      });

      // Terms and conditions
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(37, 139, 209);
      doc.text('Payment Terms and Conditions', 20, currentY + 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const terms = [
        '- The payment is to 100% upon delivery',
        '- The payment is to be in Cash USD',
        `- Repair time frame: ${data.deliveryPeriod || 0} days after confirmation`,
        '- TVA will be added to the total amount',
        '- Above equipment is covered with 3 months limited warranty',
        "- Price terms at customer's site",
      ];

      if (data.notes) {
        terms.push(`- ${data.notes}`);
      }

      terms.forEach((term, index) => {
        doc.text(term, 20, currentY + 20 + index * 5);
      });

      return Buffer.from(doc.output('arraybuffer'));
    } catch (error) {
      console.error('Error generating quotation PDF:', error);
      throw error;
    }
  }

  /**
   * Generate invoice PDF
   */
  public static async generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
    const doc = new jsPDF({
      compress: true,
      putOnlyUsedFonts: true,
      precision: 2,
    });
    const dollarRate = data.dollarRate || DEFAULT_DOLLAR_RATE;

    try {
      // Header
      let currentY = await this.addHeader(doc, 'INVOICE');

      // Invoice details
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      const detailsStartX = 150;
      doc.text(`Invoice#: ${data.invoiceNumber}`, detailsStartX, currentY - 15);
      doc.text(`MOF#: ${data.mofNumber}`, detailsStartX, currentY - 10);
      doc.text(
        `Date: ${this.formatDate(data.invoiceDate)}`,
        detailsStartX,
        currentY - 5
      );

      currentY += 10;

      // Client info box
      doc.setFillColor(248, 249, 250);
      doc.rect(20, currentY, 170, 25, 'F');
      doc.setDrawColor(6, 57, 112);
      doc.setLineWidth(2);
      doc.line(20, currentY, 20, currentY + 25);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(6, 57, 112);
      doc.text('To:', 25, currentY + 8);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(`${data.scope.company.name}`, 35, currentY + 8);
      doc.text(
        `Phone: ${data.scope.company.phone || 'N/A'}`,
        25,
        currentY + 13
      );
      doc.text(
        `Location: ${data.scope.company.address || 'N/A'}`,
        25,
        currentY + 18
      );
      doc.text(
        `MOF#: ${data.scope.company.mofNumber || 'N/A'}`,
        25,
        currentY + 23
      );

      currentY += 35;

      // Service table
      const serviceHeaders = [
        'Service',
        'Sales Person',
        'Shipped Via',
        'Due Date',
        'Payment Type',
      ];
      const serviceRows = [
        [
          data.quotation?.serviceType || 'N/A',
          'MCS Sales',
          'MCS Endoscopy',
          this.formatDate(data.dueDate),
          'Pre-paid',
        ],
      ];

      currentY = this.addTable(doc, currentY, serviceHeaders, serviceRows);

      // Price table
      const priceHeaders = [
        'Manufacturer',
        'Scope Name',
        'Model #',
        'Serial #',
        'Unit Price',
        'Total Price',
      ];
      const priceRows = [
        [
          data.scope.manufacturer?.title || 'N/A',
          data.scope.name,
          data.scope.modelNumber,
          data.scope.serialNumber,
          `$${data.unitPrice.toFixed(2)}`,
          `$${data.totalPrice.toFixed(2)}`,
        ],
        ['', '', '', '', 'Subtotal', `$${data.totalPrice.toFixed(2)}`],
        [
          '',
          '',
          '',
          '',
          'TVA (11%)',
          `$${data.tax.toFixed(2)}${data.showTVAInLBP ? ` / ${(data.tax * dollarRate).toLocaleString()} LBP` : ''}`,
        ],
        ['', '', '', '', 'Total Due', `$${data.totalDue.toFixed(2)}`],
      ];

      currentY = this.addTable(doc, currentY, priceHeaders, priceRows, {
        isDescriptionTable: true,
      });

      // Terms and conditions
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(37, 139, 209);
      doc.text('Payment Terms and Conditions', 20, currentY + 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const terms = [
        '- Cash on Delivery',
        `- TVA Syrafa Rate: $1 = ${dollarRate.toLocaleString()} LBP`,
        `- Total Amount Due: ${this.numberToWords(data.totalDue)}`,
      ];

      terms.forEach((term, index) => {
        doc.text(term, 20, currentY + 20 + index * 5);
      });

      return Buffer.from(doc.output('arraybuffer'));
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      throw error;
    }
  }
}
