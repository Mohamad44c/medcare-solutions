import type { CollectionConfig } from 'payload'

export const Inventory: CollectionConfig = {
  slug: 'inventory',
  admin: {
    useAsTitle: 'name',
  },
  labels: {
    singular: 'Inventory',
    plural: 'Inventory',
  },
  lockDocuments: {
    duration: 600,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'scope type',
      type: 'select',
      options: [
        { label: 'Rigid', value: 'rigid' },
        { label: 'Flexible', value: 'flexible' },
      ],
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
      name: 'quantity',
      type: 'number',
    },
  ],
}
