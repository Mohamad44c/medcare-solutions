import type { CollectionConfig } from 'payload';

type EvaluationStatus = 'pending' | 'done' | 'notDone';

export const Evaluation: CollectionConfig = {
  slug: 'evaluation',
  admin: {
    useAsTitle: 'evaluationNumber',
    defaultColumns: [
      'evaluationNumber',
      'scope',
      'scopeCode',
      'status',
      'createdAt',
    ],
    group: 'Operations',
    description:
      'Core workflow stages involved in handling service requests, from initial scoping to final invoicing.',
  },

  fields: [
    {
      name: 'evaluationNumber',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'scope',
      type: 'relationship',
      relationTo: 'scopes',
      required: true,
    },
    {
      name: 'scopeCode',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Scope code (auto-populated from scope relationship)',
        position: 'sidebar',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Done', value: 'done' },
        { label: 'Not Done', value: 'notDone' },
      ],
      defaultValue: 'pending',
      required: true,
      admin: {
        description: 'Current status of the evaluation',
      },
    },
    {
      name: 'evaluationDate',
      type: 'date',
      defaultValue: () => new Date().toISOString(),
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'MMM d, yyyy',
        },
      },
    },
    {
      name: 'problemsIdentified',
      type: 'textarea',
      required: true,
    },
    {
      name: 'recommendedActions',
      type: 'textarea',
    },
    {
      name: 'estimatedCost',
      type: 'number',
      admin: {
        description: 'Customer does not see this',
      },
    },
    {
      name: 'estimatedDuration',
      type: 'number',
      admin: {
        description: 'Estimated repair duration in days',
      },
    },
    {
      name: 'evaluatedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
  access: {
    read: ({ req: { user } }) => {
      // All authenticated users can read evaluations
      return user?.id ? true : false;
    },
    create: ({ req: { user } }) => {
      // All authenticated users can create evaluations
      return user?.id ? true : false;
    },
    update: ({ req: { user } }) => {
      // Only admins can update evaluations after creation
      return user?.role === 'admin';
    },
    delete: ({ req: { user } }) => {
      // Only admins can delete evaluations
      return user?.role === 'admin';
    },
  },
  hooks: {
    beforeChange: [
      async ({
        req,
        operation,
        data,
      }: {
        req: any;
        operation: string;
        data: any;
      }) => {
        // Generate evaluation number
        if (operation === 'create') {
          const result = await req.payload.find({
            collection: 'evaluation',
            limit: 1,
            sort: '-evaluationNumber',
          });

          let nextNumber = 1;
          if (result.docs.length > 0) {
            const lastNumber = result.docs[0].evaluationNumber;
            const match = lastNumber.match(/^E(\d+)$/);
            if (match) {
              nextNumber = parseInt(match[1]) + 1;
            }
          }

          data.evaluationNumber = `E${nextNumber.toString().padStart(4, '0')}`;
          data.evaluatedBy = req.user?.id;
        }

        // Populate scope code from scope relationship
        if (data.scope) {
          try {
            const scope = await req.payload.findByID({
              collection: 'scopes',
              id: data.scope,
            });
            if (scope && scope.code) {
              data.scopeCode = scope.code;
            }
          } catch (error) {
            console.warn('Could not fetch scope code:', error);
          }
        }

        return data;
      },
    ],

    afterChange: [
      async ({
        req,
        operation,
        doc,
        previousDoc,
      }: {
        req: any;
        operation: string;
        doc: any;
        previousDoc: any;
      }) => {
        // Create notification for status change
        if (
          operation === 'update' &&
          previousDoc &&
          doc.status !== previousDoc.status
        ) {
          const statusMessages: Record<EvaluationStatus, string> = {
            pending: 'Evaluation is pending completion',
            done: 'Evaluation has been completed',
            notDone: 'Evaluation could not be completed',
          };

          const statusTypes: Record<EvaluationStatus, string> = {
            pending: 'info',
            done: 'success',
            notDone: 'error',
          };

          // Create notification for the evaluator
          if (doc.evaluatedBy) {
            await req.payload.create({
              collection: 'notifications',
              data: {
                message: `${doc.evaluationNumber}: ${statusMessages[doc.status as EvaluationStatus]}`,
                type: statusTypes[doc.status as EvaluationStatus],
                user: doc.evaluatedBy,
                relatedCollection: 'evaluation',
                relatedDocument: doc.id,
                read: false,
              },
            });
          }
        }
      },
    ],
    afterRead: [
      async ({ doc, req }: { doc: any; req: any }) => {
        // Populate scope code for display
        if (doc.scope && !doc.scopeCode) {
          try {
            const scope = await req.payload.findByID({
              collection: 'scopes',
              id: doc.scope,
            });
            if (scope && scope.code) {
              doc.scopeCode = scope.code;
            }
          } catch (error) {
            console.warn('Could not fetch scope code for display:', error);
          }
        }
        return doc;
      },
    ],
  },
};
