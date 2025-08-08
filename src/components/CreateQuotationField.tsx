'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CreateQuotationFieldProps {
  path: string;
  value?: any;
  onChange?: (value: any) => void;
  data?: any; // This will contain the current evaluation data
  doc?: any; // This might contain the full document data
}

const CreateQuotationField: React.FC<CreateQuotationFieldProps> = ({
  data,
  doc,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [evaluationData, setEvaluationData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const getEvaluationData = async () => {
      // First try to get from props
      const currentEvaluationData = data || doc;

      if (currentEvaluationData?.id) {
        setEvaluationData(currentEvaluationData);
        return;
      }

      // If not in props, try to get from URL
      const urlParts = window.location.pathname.split('/');
      const evaluationId = urlParts[urlParts.length - 1];

      if (
        evaluationId &&
        evaluationId !== 'create' &&
        !isNaN(Number(evaluationId))
      ) {
        try {
          const response = await fetch(`/api/evaluations/${evaluationId}`);
          if (response.ok) {
            const result = await response.json();
            if (result.doc) {
              setEvaluationData(result.doc);
            }
          }
        } catch (error) {
          console.error('Error fetching evaluation data:', error);
        }
      }
    };

    getEvaluationData();
  }, [data, doc]);

  const createQuotation = async () => {
    if (!evaluationData?.id) {
      alert(
        'Evaluation ID not found. Please make sure you are on an evaluation page.'
      );
      return;
    }

    setIsCreating(true);
    try {
      // Create the quotation with the evaluation data pre-filled
      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scope: evaluationData.scope,
          evaluation: evaluationData.id,
          scopeCode: evaluationData.scopeCode || '',
          scopeName: evaluationData.scopeName || '',
          modelNumber: evaluationData.modelNumber || '',
          serialNumber: evaluationData.serialNumber || '',
          quotationDate: new Date().toISOString(),
          quotationStatus: 'pending',
          problems: evaluationData.problemsIdentified || 'To be determined',
          serviceType: 'repair', // Default value
          price: 0, // Required field, will be updated by user
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        // Redirect to the newly created quotation
        router.push(`/admin/collections/quotation/${responseData.doc.id}`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || 'Failed to create quotation'}`);
      }
    } catch (error) {
      console.error('Error creating quotation:', error);
      alert('Failed to create quotation. Please try again.');
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
        Create Quotation
      </h3>
      <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: '14px' }}>
        Create a new quotation for this evaluation. The evaluation and scope
        information will be automatically populated.
      </p>
      <button
        onClick={createQuotation}
        disabled={isCreating || !evaluationData?.id}
        style={{
          backgroundColor: evaluationData?.id ? '#258bd1' : '#ccc',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '4px',
          cursor: isCreating || !evaluationData?.id ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          opacity: isCreating || !evaluationData?.id ? 0.6 : 1,
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
            <span>📄</span>
            <span>Create Quotation</span>
          </>
        )}
      </button>
      {isCreating && (
        <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#666' }}>
          Please wait while the quotation is being created...
        </p>
      )}
      {!evaluationData?.id && (
        <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#ff6b6b' }}>
          Loading evaluation data...
        </p>
      )}
    </div>
  );
};

export default CreateQuotationField;
