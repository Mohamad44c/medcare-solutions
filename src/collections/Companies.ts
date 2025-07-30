import type { CollectionConfig } from 'payload';

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
          // Check if any scopes reference this company
          const scopesResult = await req.payload.find({
            collection: 'scopes',
            where: {
              company: {
                equals: id,
              },
            },
            limit: 1,
          });

          if (scopesResult.docs.length > 0) {
            throw new Error(
              `Cannot delete company because it has ${scopesResult.totalDocs} related scope(s). Please delete the related scopes first.`
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
