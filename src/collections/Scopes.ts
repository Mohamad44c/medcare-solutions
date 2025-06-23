import type { CollectionConfig } from 'payload'

type Scope = {
  code?: string
  type: 'rigid' | 'flexible'
  createdBy?: string
}

interface ScopeDocument {
  code: string
  [key: string]: any
}

export const Scopes: CollectionConfig = {
  slug: 'scopes',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['code', 'name', 'type', 'status'],
  },
  fields: [
    {
      type: 'collapsible',
      label: 'Basic Information',
      admin: {
        initCollapsed: false,
      },
      fields: [
        {
          name: 'code',
          type: 'text',
          admin: {
            readOnly: true,
          },
          access: {
            update: () => false,
          },
        },
        {
          name: 'name',
          type: 'text',
          required: true,
          unique: true,
        },
        {
          name: 'Company',
          type: 'text',
        },
        {
          name: 'type',
          type: 'select',
          options: [
            { label: 'Rigid', value: 'rigid' },
            { label: 'Flexible', value: 'flexible' },
          ],
          required: true,
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Model Information',
      admin: {
        initCollapsed: false,
      },
      fields: [
        {
          name: 'modelNumber',
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
      ],
    },
    {
      type: 'collapsible',
      label: 'Status Information',
      admin: {
        initCollapsed: false,
      },
      fields: [
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
          type: 'richText',
        },
        {
          name: 'receivedDate',
          type: 'date',
          defaultValue: () => new Date().toISOString(),
          admin: {
            date: {
              pickerAppearance: 'dayOnly',
              displayFormat: 'MMM d, yyyy',
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
    },
  ],
  hooks: {
    beforeChange: [
      async ({ req, operation, data }: { req: any; operation: string; data: Partial<Scope> }) => {
        if (operation === 'create' && req.user) {
          data = {
            ...data,
            createdBy: req.user.id,
          }
        }

        if (operation === 'create') {
          const prefix = data.type === 'rigid' ? 'rg' : 'fl'

          const result = await req.payload.find({
            collection: 'scopes',
            where: {
              code: {
                exists: true,
              },
            },
            limit: 1000,
          })

          // Filter results to only include codes with the correct prefix
          const filteredDocs = result.docs.filter(
            (doc: ScopeDocument) => doc.code && doc.code.startsWith(prefix + '-'),
          )

          let nextNumber = 1
          if (filteredDocs.length > 0) {
            const numbers = filteredDocs
              .map((doc: ScopeDocument) => {
                const match = doc.code.match(/^(?:rg|fl)-(\d+)$/)
                return match ? parseInt(match[1]) : 0
              })
              .filter((num: number) => !isNaN(num) && num > 0)

            if (numbers.length > 0) {
              nextNumber = Math.max(...numbers) + 1
            }
          }

          const formattedNumber = nextNumber.toString().padStart(4, '0')
          data.code = `${prefix}-${formattedNumber}`
        }

        return data
      },
    ],
  },
}
