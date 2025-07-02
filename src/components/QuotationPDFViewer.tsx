'use client'

import React from 'react'

interface QuotationPDFViewerProps {
  pdfUrl?: string
  pdfGeneratedAt?: string
  quotationNumber?: string
}

const QuotationPDFViewer: React.FC<QuotationPDFViewerProps> = ({
  pdfUrl,
  pdfGeneratedAt,
  quotationNumber,
}) => {
  const generateNewPDF = async () => {
    // Get the quotation ID from the URL
    const urlParts = window.location.pathname.split('/')
    const quotationId = urlParts[urlParts.length - 1]

    if (!quotationId || quotationId === 'create') {
      alert('Please save the quotation first before generating PDF')
      return
    }

    try {
      const response = await fetch(`/api/quotations/${quotationId}/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        alert('PDF generated successfully!')
        // Reload the page to show the new PDF URL
        window.location.reload()
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to generate PDF')
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF')
    }
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ marginBottom: '10px' }}>
        <strong>PDF Document</strong>
      </div>

      {pdfUrl ? (
        <div style={{ marginBottom: '10px' }}>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#258bd1',
              textDecoration: 'none',
              marginRight: '10px',
            }}
          >
            📄 View PDF
          </a>
          <a
            href={pdfUrl}
            download={`quotation-${quotationNumber}.pdf`}
            style={{
              color: '#258bd1',
              textDecoration: 'none',
            }}
          >
            💾 Download PDF
          </a>
          {pdfGeneratedAt && (
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              Generated: {new Date(pdfGeneratedAt).toLocaleString()}
            </div>
          )}
        </div>
      ) : (
        <div style={{ marginBottom: '10px', color: '#666' }}>No PDF generated yet</div>
      )}

      <button
        onClick={generateNewPDF}
        style={{
          backgroundColor: '#258bd1',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        📄 Generate New PDF
      </button>

      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        Click to generate a new PDF with the latest quotation data
      </div>
    </div>
  )
}

export default QuotationPDFViewer
