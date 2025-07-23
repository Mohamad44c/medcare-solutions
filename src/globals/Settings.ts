import type { GlobalConfig } from 'payload'

export const Settings: GlobalConfig = {
  slug: 'settings',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'companyName',
      type: 'text',
      required: true,
    },
    {
      name: 'companyPhone',
      type: 'text',
      required: true,
    },
    {
      name: 'companyEmail',
      type: 'email',
      required: true,
    },
    {
      name: 'mofNumber',
      label: 'MOF Number',
      type: 'text',
      required: true,
    },
    {
      name: 'dollarRate',
      type: 'number',
      required: true,
      defaultValue: 89000,
      min: 1,
      admin: {
        description: 'Exchange rate: $1 = X L.L.',
      },
    },
  ],
}
