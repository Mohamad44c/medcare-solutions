import type { CollectionConfig } from 'payload'

export const Scopes: CollectionConfig = {
  slug: 'scopes',
  admin: {
    useAsTitle: 'model',
  },
  fields: [
    {
      name: 'model',
      type: 'text',
      required: true,
    },
    {
      name: 'serialNumber',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'brand',
      type: 'relationship',
      relationTo: 'brands',
      required: true,
    },
    {
      name: 'manufacturer',
      type: 'relationship',
      relationTo: 'manufacturer',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Evaluated', value: 'evaluated' },
        { label: 'Approved', value: 'approved' },
        { label: 'Denied', value: 'denied' },
        { label: 'Completed', value: 'completed' },
      ],
      defaultValue: 'pending',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'receivedDate',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
      },
      access: {
        update: () => false,
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ req, operation, data }) => {
        if (operation === 'create' && req.user) {
          return {
            ...data,
            createdBy: req.user.id,
          }
        }
        return data
      },
    ],
  },
}
