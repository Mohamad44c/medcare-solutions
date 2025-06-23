import type { CollectionConfig } from 'payload'

export const Brands: CollectionConfig = {
  slug: 'brands',
  admin: {
    useAsTitle: 'title',
  },
  lockDocuments: {
    duration: 600,
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
}
