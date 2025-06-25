import type { CollectionConfig } from 'payload'

export const Evaluation: CollectionConfig = {
  slug: 'evaluation',
  admin: {
    useAsTitle: 'evaluation_number',
    defaultColumns: ['evaluation_number', 'scope', 'status', 'createdAt'],
  },
  fields: [
    {
      name: 'evaluation_number',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'scope',
      type: 'relationship',
      relationTo: 'scopes',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Completed', value: 'completed' },
      ],
      defaultValue: 'pending',
      required: true,
    },
    {
      name: 'evaluation_date',
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
      name: 'problems_identified',
      type: 'textarea',
      required: true,
    },
    {
      name: 'recommended_actions',
      type: 'textarea',
    },
    {
      name: 'estimated_cost',
      type: 'number',
    },
    {
      name: 'estimated_duration',
      type: 'number',
      admin: {
        description: 'Estimated repair duration in days',
      },
    },
    {
      name: 'evaluated_by',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
  hooks: {
    beforeChange: [
      async ({ req, operation, data }: { req: any; operation: string; data: any }) => {
        // Generate evaluation number
        if (operation === 'create') {
          const result = await req.payload.find({
            collection: 'evaluation',
            limit: 1,
            sort: '-evaluation_number',
          })

          let nextNumber = 1
          if (result.docs.length > 0) {
            const lastNumber = result.docs[0].evaluation_number
            const match = lastNumber.match(/^E(\d+)$/)
            if (match) {
              nextNumber = parseInt(match[1]) + 1
            }
          }

          data.evaluation_number = `E${nextNumber.toString().padStart(4, '0')}`
          data.evaluated_by = req.user?.id
        }

        return data
      },
    ],
  },
}
