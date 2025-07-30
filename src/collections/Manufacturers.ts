import type { CollectionConfig } from 'payload';

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
          const relatedRecords: { collection: string; count: number }[] = [];

          // Check if any scopes reference this manufacturer
          const scopesResult = await req.payload.find({
            collection: 'scopes',
            where: {
              manufacturer: {
                equals: id,
              },
            },
            limit: 1,
          });

          if (scopesResult.docs.length > 0) {
            relatedRecords.push({
              collection: 'scopes',
              count: scopesResult.totalDocs,
            });
          }

          // Check if any inventory items reference this manufacturer
          const inventoryResult = await req.payload.find({
            collection: 'inventory',
            where: {
              partManufacturer: {
                equals: id,
              },
            },
            limit: 1,
          });

          if (inventoryResult.docs.length > 0) {
            relatedRecords.push({
              collection: 'inventory',
              count: inventoryResult.totalDocs,
            });
          }

          if (relatedRecords.length > 0) {
            const collectionNames = relatedRecords
              .map(r => `${r.collection} (${r.count})`)
              .join(', ');

            throw new Error(
              `Cannot delete manufacturer because it has related records in: ${collectionNames}. Please delete the related records first.`
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
