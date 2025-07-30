import type { CollectionConfig } from 'payload';

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
          // Check if any scopes reference this brand
          const scopesResult = await req.payload.find({
            collection: 'scopes',
            where: {
              brand: {
                equals: id,
              },
            },
            limit: 1,
          });

          if (scopesResult.docs.length > 0) {
            throw new Error(
              `Cannot delete brand because it has ${scopesResult.totalDocs} related scope(s). Please delete the related scopes first.`
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
