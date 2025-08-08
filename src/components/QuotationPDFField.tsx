'use client';

import React, { useState } from 'react';

const QuotationPDFField: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    // Get the quotation ID from the current document
    const urlParts = window.location.pathname.split('/');
    const quotationId = urlParts[urlParts.length - 1];

    if (!quotationId || quotationId === 'create') {
      alert('Please save the quotation first before generating PDF');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(
        `/api/quotations/${quotationId}/generate-pdf`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Download the PDF
        if (data.pdfUrl) {
          const link = document.createElement('a');
          link.href = data.pdfUrl;
          link.download = `quotation-${data.quotationNumber}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          alert('PDF generated successfully!');
        }
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ marginBottom: '10px' }}>
        <strong>PDF Generation</strong>
      </div>

      <button
        onClick={generatePDF}
        disabled={isGenerating}
        style={{
          backgroundColor: '#258bd1',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '4px',
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          opacity: isGenerating ? 0.6 : 1,
        }}
      >
        {isGenerating ? 'Generating PDF...' : '📄 Generate PDF'}
      </button>

      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        Click to generate and download the PDF
      </div>
    </div>
  );
};

export default QuotationPDFField;
