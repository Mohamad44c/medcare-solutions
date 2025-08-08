'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CreateEvaluationButtonProps {
  scopeId: string;
  scopeName?: string;
  scopeCode?: string;
  modelNumber?: string;
  serialNumber?: string;
}

const CreateEvaluationButton: React.FC<CreateEvaluationButtonProps> = ({
  scopeId,
  scopeName,
  scopeCode,
  modelNumber,
  serialNumber,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const createEvaluation = async () => {
    if (!scopeId) {
      alert('Scope ID not found');
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
          scope: scopeId,
          scopeCode,
          scopeName,
          modelNumber,
          serialNumber,
          status: 'pending',
          evaluationDate: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to the newly created evaluation
        router.push(`/admin/collections/evaluation/${data.doc.id}`);
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
    <button
      onClick={createEvaluation}
      disabled={isCreating}
      style={{
        backgroundColor: '#258bd1',
        color: 'white',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '4px',
        cursor: isCreating ? 'not-allowed' : 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        opacity: isCreating ? 0.6 : 1,
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
  );
};

export default CreateEvaluationButton;
