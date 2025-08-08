import type { CollectionConfig } from 'payload';
import {
  checkRelatedRecords,
  createDeletionError,
} from '../lib/cascade-delete';

export const Brands: CollectionConfig = {
  slug: 'brands',
  admin: {
    useAsTitle: 'title',
    group: 'Inventory Management',
    description: 'Manage inventory items and track stock levels',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'description',
      type: 'text',
    },
  ],
  hooks: {
    beforeDelete: [
      async ({ req, id }: { req: any; id: string | number }) => {
        try {
          // Check for related records before deletion
          const relationships = [{ collection: 'scopes', field: 'brand' }];

          const relatedRecords = await checkRelatedRecords(
            req,
            'brand',
            id,
            relationships
          );

          if (relatedRecords.length > 0) {
            throw new Error(createDeletionError('brand', relatedRecords));
          }
        } catch (error) {
          // Re-throw the error to prevent deletion
          throw error;
        }
      },
    ],
  },
};
