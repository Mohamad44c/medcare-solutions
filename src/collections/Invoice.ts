import type { CollectionConfig } from 'payload'

export const Invoice: CollectionConfig = {
  slug: 'invoice',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'invoice_number',
      type: 'text',
      required: true,
    },
    {
      name: 'invoice_date',
      type: 'date',
      required: true,
    },
    {
      name: 'service_type',
      type: 'text',
    },
    {
      name: 'company',
      type: 'relationship',
      relationTo: 'companies',
      required: true,
    },
    {
      name: 'scope',
      type: 'relationship',
      relationTo: 'scopes',
      required: true,
    },
    {
      name: 'parts',
      type: 'relationship',
      relationTo: 'part',
      hasMany: true,
    },
    {
      name: 'quantity',
      type: 'number',
    },
    {
      name: 'price',
      type: 'number',
    },
    {
      name: 'due_date',
      type: 'date',
    },
    {
      name: 'description',
      type: 'text',
    },
  ],
}
