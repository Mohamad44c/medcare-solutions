import type { CollectionConfig } from 'payload';
import {
  checkRelatedRecords,
  createDeletionError,
} from '../lib/cascade-delete';

export const Companies: CollectionConfig = {
  slug: 'companies',
  admin: {
    useAsTitle: 'name',
    group: 'Business Entities',
    description: 'Manage companies and their details',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'phoneNumber',
      type: 'number',
    },
    {
      name: 'email',
      type: 'email',
    },
    {
      name: 'address',
      type: 'text',
    },
    {
      name: 'mofNumber',
      label: 'MOF Number',
      type: 'text',
    },
  ],
  hooks: {
    beforeDelete: [
      async ({ req, id }: { req: any; id: string | number }) => {
        try {
          // Check for related records before deletion
          const relationships = [{ collection: 'scopes', field: 'company' }];

          const relatedRecords = await checkRelatedRecords(
            req,
            'company',
            id,
            relationships
          );

          if (relatedRecords.length > 0) {
            throw new Error(createDeletionError('company', relatedRecords));
          }
        } catch (error) {
          // Re-throw the error to prevent deletion
          throw error;
        }
      },
    ],
  },
};
