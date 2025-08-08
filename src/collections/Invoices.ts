import type { CollectionConfig } from 'payload';

export const Invoices: CollectionConfig = {
  slug: 'invoices',
  admin: {
    useAsTitle: 'invoiceNumber',
    defaultColumns: [
      'invoiceNumber',
      'scope',
      'status',
      'totalDue',
      'createdAt',
    ],
    group: 'Operations',
    description:
      'Core workflow stages involved in handling service requests, from initial scoping to final invoicing.',
  },

  fields: [
    {
      name: 'invoiceNumber',
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
      name: 'repair',
      type: 'relationship',
      relationTo: 'repairs',
    },
    {
      name: 'quotation',
      type: 'relationship',
      relationTo: 'quotation',
    },
    {
      name: 'invoiceDate',
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
      name: 'dueDate',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'MMM d, yyyy',
        },
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Sent', value: 'sent' },
        { label: 'Paid', value: 'paid' },
        { label: 'Overdue', value: 'overdue' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      defaultValue: 'draft',
      required: true,
    },
    {
      name: 'unitPrice',
      type: 'number',
      required: true,
      admin: {
        description: 'Price per unit',
      },
    },
    {
      name: 'totalPrice',
      type: 'number',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'subtotal',
      type: 'number',
      admin: {
        readOnly: true,
        description: 'Same as total price',
      },
    },
    {
      name: 'tax',
      type: 'number',
      admin: {
        readOnly: true,
        description: '11% of subtotal',
      },
    },
    {
      name: 'taxLebanese',
      type: 'number',
      admin: {
        readOnly: true,
        description: '11% of subtotal in LBP',
      },
    },
    {
      name: 'totalDue',
      type: 'number',
      admin: {
        readOnly: true,
        description: 'Subtotal + Tax',
      },
    },
    {
      name: 'paymentTerms',
      type: 'text',
      defaultValue: 'Net 30',
    },
    {
      name: 'showTVAInLBP',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Show TVA amount in Lebanese Pounds (LBP) in addition to USD',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'pdf',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Generated invoice PDF. Use the API endpoint /api/invoices/{id}/generate-pdf to generate and download the PDF.',
      },
    },
    {
      name: 'pdfUrl',
      type: 'text',
      admin: {
        description: 'S3 URL of the generated PDF',
      },
    },
    {
      name: 'pdfGeneratedAt',
      type: 'date',
      admin: {
        description: 'Timestamp when PDF was last generated',
      },
    },
  ],
  access: {
    read: ({ req: { user } }) => {
      // All authenticated users can read invoices
      return user?.id ? true : false;
    },
    create: ({ req: { user } }) => {
      // Only admins can create invoices
      return user?.role === 'admin';
    },
    update: ({ req: { user } }) => {
      // Only admins can update invoices
      return user?.role === 'admin';
    },
    delete: ({ req: { user } }) => {
      // Only admins can delete invoices
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
        // Generate invoice number
        if (operation === 'create') {
          const result = await req.payload.find({
            collection: 'invoices',
            limit: 1,
            sort: '-invoiceNumber',
          });

          let nextNumber = 1;
          if (result.docs.length > 0) {
            const lastNumber = result.docs[0].invoiceNumber;
            const match = lastNumber.match(/^SA1-(\d+)$/);
            if (match) {
              nextNumber = parseInt(match[1]) + 1;
            }
          }

          data.invoiceNumber = `SA1-${nextNumber.toString().padStart(4, '0')}`;
          data.createdBy = req.user?.id;
        }

        // Populate scope information from scope relationship
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

        // Calculate totals automatically
        if (data.unitPrice !== undefined) {
          const unitPrice = parseFloat(data.unitPrice) || 0;

          // Calculate total price (unit price × quantity)
          data.totalPrice = unitPrice;

          // Subtotal is the same as total price
          data.subtotal = data.totalPrice;

          // Calculate tax (11% of subtotal)
          data.tax = Math.round(data.subtotal * 0.11 * 100) / 100;

          // Calculate total due (subtotal + tax)
          data.totalDue = data.subtotal + data.tax;
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
