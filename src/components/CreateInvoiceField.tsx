'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CreateInvoiceFieldProps {
  path: string;
  value?: any;
  onChange?: (value: any) => void;
  data?: any; // This will contain the current quotation data
  doc?: any; // This might contain the full document data
}

const CreateInvoiceField: React.FC<CreateInvoiceFieldProps> = ({
  data,
  doc,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [quotationData, setQuotationData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const getQuotationData = async () => {
      // First try to get from props
      const currentQuotationData = data || doc;

      if (currentQuotationData?.id) {
        setQuotationData(currentQuotationData);
        return;
      }

      // If not in props, try to get from URL
      const urlParts = window.location.pathname.split('/');
      const quotationId = urlParts[urlParts.length - 1];

      if (
        quotationId &&
        quotationId !== 'create' &&
        !isNaN(Number(quotationId))
      ) {
        try {
          const response = await fetch(`/api/quotations/${quotationId}`);
          if (response.ok) {
            const result = await response.json();
            if (result.doc) {
              setQuotationData(result.doc);
            }
          }
        } catch (error) {
          console.error('Error fetching quotation data:', error);
        }
      }
    };

    getQuotationData();
  }, [data, doc]);

  const createInvoice = async () => {
    if (!quotationData?.id) {
      alert(
        'Quotation ID not found. Please make sure you are on a quotation page.'
      );
      return;
    }

    setIsCreating(true);
    try {
      // Create the invoice with the quotation data pre-filled
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scope: quotationData.scope,
          quotation: quotationData.id,
          scopeCode: quotationData.scopeCode || '',
          scopeName: quotationData.scopeName || '',
          modelNumber: quotationData.modelNumber || '',
          serialNumber: quotationData.serialNumber || '',
          invoiceDate: new Date().toISOString(),
          status: 'draft',
          unitPrice: quotationData.price || 0,
          paymentTerms: 'Net 30',
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        // Redirect to the newly created invoice
        router.push(`/admin/collections/invoices/${responseData.doc.id}`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || 'Failed to create invoice'}`);
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div
      style={{
        padding: '16px',
        border: '1px solid #e1e5e9',
        borderRadius: '8px',
        backgroundColor: '#f8f9fa',
        marginBottom: '16px',
      }}
    >
      <h3 style={{ margin: '0 0 12px 0', color: '#258bd1', fontSize: '16px' }}>
        Create Invoice
      </h3>
      <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: '14px' }}>
        Create a new invoice for this quotation. The quotation and scope
        information will be automatically populated.
      </p>
      <button
        onClick={createInvoice}
        disabled={isCreating || !quotationData?.id}
        style={{
          backgroundColor: quotationData?.id ? '#258bd1' : '#ccc',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '4px',
          cursor: isCreating || !quotationData?.id ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          opacity: isCreating || !quotationData?.id ? 0.6 : 1,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {isCreating ? (
          <>
            <span>Creating...</span>
          </>
        ) : (
          <>
            <span>🧾</span>
            <span>Create Invoice</span>
          </>
        )}
      </button>
      {isCreating && (
        <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#666' }}>
          Please wait while the invoice is being created...
        </p>
      )}
      {!quotationData?.id && (
        <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#ff6b6b' }}>
          Loading quotation data...
        </p>
      )}
    </div>
  );
};

export default CreateInvoiceField;
