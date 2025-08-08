import type { CollectionConfig } from 'payload';

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
      name: 'scopeName',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Scope name (auto-populated from scope relationship)',
        position: 'sidebar',
      },
    },
    {
      name: 'modelNumber',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Model number (auto-populated from scope relationship)',
        position: 'sidebar',
      },
    },
    {
      name: 'serialNumber',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Serial number (auto-populated from scope relationship)',
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
    {
      name: 'createQuotation',
      type: 'text',
      admin: {
        position: 'sidebar',
        description:
          'Click the button below to create a new quotation for this evaluation',
        components: {
          Field: 'CreateQuotationField#default',
        },
      },
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
            // Handle both populated object and ID cases
            let scopeId = data.scope;
            if (typeof data.scope === 'object' && data.scope.id) {
              scopeId = data.scope.id;
            }

            const scope = await req.payload.findByID({
              collection: 'scopes',
              id: scopeId,
            });
            if (scope) {
              data.scopeCode = scope.code || '';
              data.scopeName = scope.name || '';
              data.modelNumber = scope.modelNumber || '';
              data.serialNumber = scope.serialNumber || '';
            }
          } catch (error) {
            console.warn('Could not fetch scope details:', error);
          }
        }

        return data;
      },
    ],

    afterRead: [
      async ({ doc, req }: { doc: any; req: any }) => {
        // Populate scope details for display
        if (
          doc.scope &&
          (!doc.scopeCode ||
            !doc.scopeName ||
            !doc.modelNumber ||
            !doc.serialNumber)
        ) {
          try {
            // Handle both populated object and ID cases
            let scopeId = doc.scope;
            if (typeof doc.scope === 'object' && doc.scope.id) {
              scopeId = doc.scope.id;
            }

            const scope = await req.payload.findByID({
              collection: 'scopes',
              id: scopeId,
            });
            if (scope) {
              doc.scopeCode = scope.code || '';
              doc.scopeName = scope.name || '';
              doc.modelNumber = scope.modelNumber || '';
              doc.serialNumber = scope.serialNumber || '';
            }
          } catch (error) {
            console.warn('Could not fetch scope details for display:', error);
          }
        }
        return doc;
      },
    ],
  },
};
