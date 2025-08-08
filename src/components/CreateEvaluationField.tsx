'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CreateEvaluationFieldProps {
  path: string;
  value?: any;
  onChange?: (value: any) => void;
  data?: any; // This will contain the current scope data
  doc?: any; // This might contain the full document data
}

const CreateEvaluationField: React.FC<CreateEvaluationFieldProps> = ({
  data,
  doc,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [scopeData, setScopeData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const getScopeData = async () => {
      // First try to get from props
      const currentScopeData = data || doc;

      if (currentScopeData?.id) {
        setScopeData(currentScopeData);
        return;
      }

      // If not in props, try to get from URL
      const urlParts = window.location.pathname.split('/');
      const scopeId = urlParts[urlParts.length - 1];

      if (scopeId && scopeId !== 'create' && !isNaN(Number(scopeId))) {
        try {
          const response = await fetch(`/api/scopes/${scopeId}`);
          if (response.ok) {
            const result = await response.json();
            if (result.doc) {
              setScopeData(result.doc);
            }
          }
        } catch (error) {
          console.error('Error fetching scope data:', error);
        }
      }
    };

    getScopeData();
  }, [data, doc]);

  const createEvaluation = async () => {
    if (!scopeData?.id) {
      alert('Scope ID not found. Please make sure you are on a scope page.');
      return;
    }

    setIsCreating(true);
    try {
      // Create the evaluation with the scope data pre-filled
      const response = await fetch('/api/evaluations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scope: scopeData.id,
          scopeCode: scopeData.code || '',
          scopeName: scopeData.name || '',
          modelNumber: scopeData.modelNumber || '',
          serialNumber: scopeData.serialNumber || '',
          status: 'pending',
          evaluationDate: new Date().toISOString(),
          problemsIdentified: 'To be determined', // Required field
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        // Redirect to the newly created evaluation
        router.push(`/admin/collections/evaluation/${responseData.doc.id}`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || 'Failed to create evaluation'}`);
      }
    } catch (error) {
      console.error('Error creating evaluation:', error);
      alert('Failed to create evaluation. Please try again.');
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
        Create Evaluation
      </h3>
      <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: '14px' }}>
        Create a new evaluation for this scope. The scope information will be
        automatically populated.
      </p>
      <button
        onClick={createEvaluation}
        disabled={isCreating || !scopeData?.id}
        style={{
          backgroundColor: scopeData?.id ? '#258bd1' : '#ccc',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '4px',
          cursor: isCreating || !scopeData?.id ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          opacity: isCreating || !scopeData?.id ? 0.6 : 1,
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
            <span>📋</span>
            <span>Create Evaluation</span>
          </>
        )}
      </button>
      {isCreating && (
        <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#666' }}>
          Please wait while the evaluation is being created...
        </p>
      )}
      {!scopeData?.id && (
        <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#ff6b6b' }}>
          Loading scope data...
        </p>
      )}
    </div>
  );
};

export default CreateEvaluationField;
