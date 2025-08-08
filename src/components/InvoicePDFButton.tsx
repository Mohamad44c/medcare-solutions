import React, { useState } from 'react';

interface InvoicePDFButtonProps {
  invoiceId: string;
  invoiceNumber: string;
}

const InvoicePDFButton: React.FC<InvoicePDFButtonProps> = ({
  invoiceId,
  invoiceNumber,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    if (!invoiceId) {
      alert('Invoice ID is required');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();

        // Download the PDF
        if (data.pdfUrl) {
          const link = document.createElement('a');
          link.href = data.pdfUrl;
          link.download = `invoice-${data.invoiceNumber}.pdf`;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          alert('Invoice PDF generated and downloaded successfully!');
        } else {
          alert('Invoice PDF generated but no download URL provided');
        }
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || 'Failed to generate invoice PDF'}`);
      }
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      alert('Failed to generate invoice PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      style={{
        padding: '20px',
        border: '1px solid #e1e5e9',
        borderRadius: '8px',
        backgroundColor: '#f8f9fa',
        marginBottom: '20px',
      }}
    >
      <h3 style={{ margin: '0 0 15px 0', color: '#258bd1' }}>
        Invoice PDF Generation
      </h3>
      <p style={{ margin: '0 0 15px 0', color: '#666' }}>
        Generate and download a PDF version of this invoice.
      </p>
      <button
        onClick={generatePDF}
        disabled={isGenerating}
        style={{
          backgroundColor: '#258bd1',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          opacity: isGenerating ? 0.6 : 1,
        }}
      >
        {isGenerating ? '🔄 Generating PDF...' : '📄 Generate Invoice PDF'}
      </button>
      {isGenerating && (
        <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#666' }}>
          Please wait while the PDF is being generated...
        </p>
      )}
    </div>
  );
};

export default InvoicePDFButton;
