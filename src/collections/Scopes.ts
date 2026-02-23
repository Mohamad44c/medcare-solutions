import type { CollectionConfig } from 'payload';
import {
  checkRelatedRecords,
  createDeletionError,
} from '../lib/cascade-delete';

type Scope = {
  code?: string;
  type: 'rigid' | 'flexible';
  createdBy?: string;
};

interface ScopeDocument {
  code: string;
  [key: string]: any;
}

export const Scopes: CollectionConfig = {
  slug: 'scopes',
  admin: {
    useAsTitle: 'name',
    defaultColumns: [
      'code',
      'name',
      'type',
      'status',
      'company',
      'modelNumber',
      'serialNumber',
    ],
    group: 'Operations',
    description:
      'Core workflow stages involved in handling service requests, from initial scoping to final invoicing.',
  },
  fields: [
    {
      type: 'collapsible',
      label: 'Basic Information',
      admin: {
        initCollapsed: false,
      },
      fields: [
        {
          name: 'code',
          type: 'text',
          admin: {
            readOnly: true,
          },
          access: {
            update: () => false,
          },
        },
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'company',
          type: 'relationship',
          relationTo: 'companies',
          required: true,
          admin: {
            description: 'Select the company that owns this scope',
          },
        },
        {
          name: 'type',
          type: 'select',
          options: [
            { label: 'Rigid', value: 'rigid' },
            { label: 'Flexible', value: 'flexible' },
          ],
          required: true,
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Model Information',
      admin: {
        initCollapsed: false,
      },
      fields: [
        {
          name: 'modelNumber',
          type: 'text',
          required: true,
        },
        {
          name: 'serialNumber',
          type: 'text',
          required: true,
          unique: true,
        },
        {
          name: 'brand',
          type: 'relationship',
          relationTo: 'brands',
          required: true,
        },
        {
          name: 'manufacturer',
          type: 'relationship',
          relationTo: 'manufacturers',
          required: true,
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Additional Information',
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'status',
          type: 'select',
          options: [
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
            { label: 'Under Repair', value: 'under_repair' },
            { label: 'Retired', value: 'retired' },
          ],
          defaultValue: 'active',
        },
        {
          name: 'description',
          type: 'richText',
        },
        {
          name: 'receivedDate',
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
          name: 'createdBy',
          type: 'relationship',
          relationTo: 'users',
          admin: {
            readOnly: true,
            position: 'sidebar',
          },
          access: {
            update: () => false,
          },
        },
        {
          name: 'createEvaluation',
          type: 'text',
          admin: {
            position: 'sidebar',
            description:
              'Click the button below to create a new evaluation for this scope',
            components: {
              Field: '/components/CreateEvaluationField#default',
            },
          },
        },
      ],
    },
  ],
  access: {
    read: ({ req: { user } }) => {
      // All authenticated users can read scopes
      return user?.id ? true : false;
    },
    create: ({ req: { user } }) => {
      // All authenticated users can create scopes
      return user?.id ? true : false;
    },
    update: ({ req: { user } }) => {
      // Only admins can update scopes after creation
      return user?.role === 'admin';
    },
    delete: ({ req: { user } }) => {
      // Only admins can delete scopes
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
        data: Partial<Scope>;
      }) => {
        if (operation === 'create' && req.user) {
          data = {
            ...data,
            createdBy: req.user.id,
          };
        }

        if (operation === 'create') {
          const prefix = data.type === 'rigid' ? 'RG' : 'FL';

          const result = await req.payload.find({
            collection: 'scopes',
            where: {
              code: {
                exists: true,
              },
            },
            limit: 1000,
          });

          // Filter results to only include codes with the correct prefix
          const filteredDocs = result.docs.filter(
            (doc: ScopeDocument) =>
              doc.code && doc.code.startsWith(prefix + '-')
          );

          let nextNumber = 1;
          if (filteredDocs.length > 0) {
            const numbers = filteredDocs
              .map((doc: ScopeDocument) => {
                const match = doc.code.match(/^(?:RG|FL)-(\d+)$/);
                return match ? parseInt(match[1]) : 0;
              })
              .filter((num: number) => !isNaN(num) && num > 0);

            if (numbers.length > 0) {
              nextNumber = Math.max(...numbers) + 1;
            }
          }

          const formattedNumber = nextNumber.toString().padStart(4, '0');
          data.code = `${prefix}-${formattedNumber}`;
        }

        return data;
      },
    ],
    beforeDelete: [
      async ({ req, id }: { req: any; id: string | number }) => {
        try {
          // Check for related records before deletion
          const relationships = [
            { collection: 'evaluation', field: 'scope' },
            { collection: 'quotation', field: 'scope' },
            { collection: 'invoices', field: 'scope' },
            { collection: 'repairs', field: 'scope' },
          ];

          const relatedRecords = await checkRelatedRecords(
            req,
            'scope',
            id,
            relationships
          );

          if (relatedRecords.length > 0) {
            throw new Error(createDeletionError('scope', relatedRecords));
          }
        } catch (error) {
          // Re-throw the error to prevent deletion
          throw error;
        }
      },
    ],
  },
};
