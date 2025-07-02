'use client'

import React, { useState } from 'react'

interface QuotationPDFButtonProps {
  quotationId?: string
}

const QuotationPDFButton: React.FC<QuotationPDFButtonProps> = ({ quotationId }) => {
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePDF = async () => {
    if (!quotationId) {
      alert('Quotation ID not found')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch(`/api/quotations/${quotationId}/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()

        // Download the PDF
        if (data.pdfUrl) {
          const link = document.createElement('a')
          link.href = data.pdfUrl
          link.download = `quotation-${data.quotationNumber}.pdf`
          link.target = '_blank'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)

          alert('PDF generated successfully!')
        } else {
          alert('PDF generated but no download URL provided')
        }
      } else {
        const error = await response.json()
        alert(`Error: ${error.message || 'Failed to generate PDF'}`)
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div
      style={{
        marginTop: '20px',
        padding: '20px',
        border: '1px solid #e1e5e9',
        borderRadius: '4px',
        backgroundColor: '#f8f9fa',
      }}
    >
      <h3 style={{ margin: '0 0 15px 0', color: '#258bd1' }}>PDF Generation</h3>
      <p style={{ margin: '0 0 15px 0', color: '#666' }}>
        Generate and download a PDF version of this quotation.
      </p>
      <button
        onClick={generatePDF}
        disabled={isGenerating || !quotationId}
        style={{
          backgroundColor: '#258bd1',
          borderColor: '#258bd1',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '4px',
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          opacity: isGenerating ? 0.6 : 1,
          border: 'none',
          fontSize: '14px',
        }}
      >
        {isGenerating ? 'Generating PDF...' : '📄 Generate PDF'}
      </button>
      {isGenerating && (
        <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#666' }}>
          Please wait while the PDF is being generated...
        </p>
      )}
    </div>
  )
}

export default QuotationPDFButton
