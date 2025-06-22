import type { CollectionConfig } from 'payload'

export const Manufacturer: CollectionConfig = {
  slug: 'manufacturer',
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
      type: 'text',
    },
    {
      name: 'companyWebsite',
      type: 'text',
    },
  ],
}
