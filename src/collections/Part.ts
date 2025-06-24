import type { CollectionConfig } from 'payload'

export const Part: CollectionConfig = {
  slug: 'part',
  admin: {
    useAsTitle: 'part_name',
  },
  fields: [
    {
      name: 'part_name',
      type: 'text',
      required: true,
    },
    {
      name: 'part_number',
      type: 'text',
      required: true,
    },
    {
      name: 'length',
      type: 'number',
    },
    {
      name: 'diameter',
      type: 'number',
    },
    {
      name: 'cost',
      type: 'number',
    },
    {
      name: 'price',
      type: 'number',
    },
    {
      name: 'manufacturer',
      type: 'relationship',
      relationTo: 'manufacturers',
    },
    {
      name: 'country',
      type: 'text',
    },
  ],
}
