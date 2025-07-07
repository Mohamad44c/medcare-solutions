import puppeteer from 'puppeteer'
import path from 'path'

interface QuotationData {
  quotationNumber: string
  quotationDate: string
  offerValidity: string
  scope: {
    name: string
    modelNumber: string
    serialNumber: string
    receivedDate: string
    brand?: {
      title: string
    }
    company: {
      name: string
      phone?: string
      address?: string
    }
  }
  deliveryPeriod: number
  problems: string
  serviceType: string
  price: number
  discount: number
  notes?: string
}

export class PDFGenerator {
  private static formatDate(dateString: string): string {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return 'N/A'
    }
  }

  private static async generateQuotationHTML(data: QuotationData): Promise<string> {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quotation ${data.quotationNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
          }
          .company-info {
            display: flex;
            align-items: center;
          }
          .logo {
            width: 100px;
            height: 100px;
            margin-right: 20px;
            object-fit: contain;
          }
          .contact-info {
            line-height: 1.4;
          }
          .quotation-title {
            text-align: right;
          }
          .quotation-title h1 {
            font-size: 32px;
            font-weight: bold;
            margin: 0 0 10px 0;
            color: #258bd1 !important;
          }
          .quotation-details {
            font-size: 14px;
            line-height: 1.6;
          }
          .client-info {
            margin-bottom: 30px;
            padding: 15px;
            background-color: #f8f9fa;
            border-left: 4px solid #063970;
          }
          .client-info strong {
            color: #063970;
          }
          .heading {
            color: #258bd1 !important;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          th {
            background-color: #258bd1;
            font-weight: bold;
            color: white;
          }
          .price-table th:last-child,
          .price-table td:last-child {
            text-align: right;
          }
          .total-row {
            background-color: #f8f9fa;
            font-weight: bold;
          }
          .terms-section {
            margin-top: 30px;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 5px;
          }
          .terms-section h3 {
            margin-top: 0;
            color: #258bd1 !important;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <img src="data:image/png;base64,${await this.getLogoBase64()}" alt="MCS Logo" class="logo">
            <div class="contact-info">
              <div>Beirut Lebanon</div>
              <div>+961 01 555133 | +961 03 788345</div>
              <div>info@mcs.com</div>
            </div>
          </div>
          <div class="quotation-title">
            <h1 class="heading">QUOTATION</h1>
            <div class="quotation-details">
              <div><strong>Quotation#:</strong> ${data.quotationNumber}</div>
              <div><strong>Sales Person:</strong> MCS Sales</div>
              <div><strong>Offer Validity:</strong> ${this.formatDate(data.offerValidity)}</div>
              <div><strong>Date:</strong> ${this.formatDate(data.quotationDate)}</div>
            </div>
          </div>
        </div>

        <div class="client-info">
          <strong>To:</strong> ${data.scope.company.name}<br>
          <strong>Phone:</strong> ${data.scope.company.phone || 'N/A'}<br>
          <strong>Location:</strong> ${data.scope.company.address || 'N/A'}
        </div>

        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Make</th>
              <th>Model #</th>
              <th>Serial #</th>
              <th>Date Received</th>
              <th>Delivery Period</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${data.scope.name}</td>
              <td>${data.scope.brand?.title || 'N/A'}</td>
              <td>${data.scope.modelNumber}</td>
              <td>${data.scope.serialNumber}</td>
              <td>${this.formatDate(data.scope.receivedDate)}</td>
              <td>${data.deliveryPeriod || 0} days</td>
            </tr>
          </tbody>
        </table>

        <table class="price-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Unit Price</th>
              <th>Quantity</th>
              <th>Total Price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${data.serviceType} - ${data.problems}</td>
              <td>$${data.price.toFixed(2)}</td>
              <td>1</td>
              <td>$${data.price.toFixed(2)}</td>
            </tr>
            ${
              data.discount > 0
                ? `
            <tr>
              <td>Discount</td>
              <td>-$${data.discount.toFixed(2)}</td>
              <td>1</td>
              <td>-$${data.discount.toFixed(2)}</td>
            </tr>
            `
                : ''
            }
            <tr class="total-row">
              <td colspan="3"><strong>Total</strong></td>
              <td><strong>$${(data.price - data.discount).toFixed(2)}</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="terms-section">
          <h3 class="heading">Payment Terms and Conditions</h3>
          <p>- The payment is to 100% upon delivery</p>
          <p>- The payment is to be in Cash USD </p>
          <p>- Repair time frame: ${data.deliveryPeriod || 0} days after confirmation</p>
          <p>- TVA will be added to the total amount</p>
          <p>- Above equipment is covered with 3 months limited warranty</p>
          <p>- Price terms at customer's site</p>
        </div>
      </body>
      </html>
    `
    return html
  }

  private static async getLogoBase64(): Promise<string> {
    try {
      const fs = await import('fs/promises')
      const logoPath = path.join(process.cwd(), 'public', 'assets', 'mcs-logo.png')
      const logoBuffer = await fs.readFile(logoPath)
      return logoBuffer.toString('base64')
    } catch (error) {
      console.warn('Could not load logo:', error)
      return ''
    }
  }

  public static async generateQuotationPDF(data: QuotationData): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    try {
      const page = await browser.newPage()
      const html = await this.generateQuotationHTML(data)

      await page.setContent(html, { waitUntil: 'networkidle0' })

      const pdf = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm',
        },
        printBackground: true,
      })

      return Buffer.from(pdf)
    } finally {
      await browser.close()
    }
  }
}
