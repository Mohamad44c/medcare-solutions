import type { CollectionConfig } from 'payload';
import {
  checkRelatedRecords,
  createDeletionError,
} from '../lib/cascade-delete';

// List of countries
const countries = [
  { label: 'Canada', value: 'CA' },
  { label: 'China', value: 'CN' },
  { label: 'Egypt', value: 'EG' },
  { label: 'France', value: 'FR' },
  { label: 'Germany', value: 'DE' },
  { label: 'Italy', value: 'IT' },
  { label: 'Japan', value: 'JP' },
  { label: 'Lebanon', value: 'LB' },
  { label: 'Russia', value: 'RU' },
  { label: 'Saudi Arabia', value: 'SA' },
  { label: 'Singapore', value: 'SG' },
  { label: 'South Africa', value: 'ZA' },
  { label: 'Spain', value: 'ES' },
  { label: 'Sweden', value: 'SE' },
  { label: 'Switzerland', value: 'CH' },
  { label: 'United Arab Emirates', value: 'AE' },
  { label: 'United Kingdom', value: 'GB' },
  { label: 'United States', value: 'US' },
];

export const Manufacturers: CollectionConfig = {
  slug: 'manufacturers',
  admin: {
    useAsTitle: 'companyName',
    group: 'Inventory Management',
    description: 'Manage inventory items and track stock levels',
  },
  fields: [
    {
      name: 'companyName',
      type: 'text',
    },
    {
      name: 'companyEmail',
      type: 'text',
    },
    {
      name: 'companyPhone',
      type: 'text',
    },
    {
      name: 'country',
      type: 'select',
      options: countries,
      required: true,
      hasMany: false,
    },
    {
      name: 'companyWebsite',
      type: 'text',
    },
  ],
  hooks: {
    beforeDelete: [
      async ({ req, id }: { req: any; id: string | number }) => {
        try {
          // Check for related records before deletion
          const relationships = [
            { collection: 'scopes', field: 'manufacturer' },
            { collection: 'inventory', field: 'partManufacturer' },
          ];

          const relatedRecords = await checkRelatedRecords(
            req,
            'manufacturer',
            id,
            relationships
          );

          if (relatedRecords.length > 0) {
            throw new Error(
              createDeletionError('manufacturer', relatedRecords)
            );
          }
        } catch (error) {
          // Re-throw the error to prevent deletion
          throw error;
        }
      },
    ],
  },
};
