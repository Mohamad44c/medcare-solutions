import type { CollectionConfig } from 'payload'

export const Part: CollectionConfig = {
  slug: 'part',
  admin: {
    useAsTitle: 'partName',
    group: 'Inventory Management',
    description: 'Manage inventory items and track stock levels',
  },
  fields: [
    {
      name: 'partName',
      type: 'text',
      required: true,
    },
    {
      name: 'partNumber',
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
