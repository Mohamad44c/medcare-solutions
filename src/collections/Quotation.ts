import type { CollectionConfig } from 'payload'

export const Quotation: CollectionConfig = {
  slug: 'quotation',
  admin: {
    useAsTitle: 'quotationNumber',
    defaultColumns: ['quotationNumber', 'scope', 'quotationStatus', 'price', 'createdAt'],
    group: 'Operations',
    description:
      'Core workflow stages involved in handling service requests, from initial scoping to final invoicing.',
  },

  fields: [
    {
      name: 'quotationNumber',
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
      name: 'evaluation',
      type: 'relationship',
      relationTo: 'evaluation',
      admin: {
        description:
          'Select an evaluation that belongs to the selected scope. The dropdown will show all evaluations, but only scope-related ones are valid.',
        condition: (data, siblingData) => {
          // Only show evaluation field if a scope is selected
          return !!siblingData?.scope
        },
      },
      hooks: {
        beforeValidate: [
          async ({ value, req, data }) => {
            // Validate that the evaluation belongs to the selected scope
            if (value && data?.scope) {
              const evaluation = await req.payload.findByID({
                collection: 'evaluation',
                id: value,
              })

              // Handle both populated object and ID string cases
              let evaluationScopeId = ''
              if (evaluation?.scope) {
                if (typeof evaluation.scope === 'object' && evaluation.scope.id) {
                  evaluationScopeId = String(evaluation.scope.id)
                } else {
                  evaluationScopeId = String(evaluation.scope)
                }
              }
              const selectedScopeId = String(data.scope || '')

              if (evaluation && evaluationScopeId !== selectedScopeId) {
                throw new Error(
                  `Selected evaluation (${evaluation.evaluationNumber}) does not belong to the selected scope. Please select an evaluation that belongs to this scope.`,
                )
              }
            }
            return value
          },
        ],
      },
    },
    {
      name: 'quotationDate',
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
      name: 'offerValidity',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'MMM d, yyyy',
        },
      },
    },
    {
      name: 'deliveryPeriod',
      type: 'number',
      admin: {
        description: 'Delivery period in days',
      },
    },
    {
      name: 'problems',
      type: 'textarea',
      required: true,
    },
    {
      name: 'serviceType',
      type: 'select',
      options: [
        { label: 'Repair', value: 'repair' },
        { label: 'Maintenance', value: 'maintenance' },
        { label: 'Calibration', value: 'calibration' },
        { label: 'Inspection', value: 'inspection' },
      ],
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'price',
          type: 'number',
          required: true,
          admin: {
            width: '50%',
            description: 'Total quotation price',
          },
        },
        {
          name: 'discount',
          type: 'number',
          defaultValue: 0,
          admin: {
            width: '50%',
          },
        },
      ],
    },
    {
      name: 'quotationStatus',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Denied', value: 'denied' },
      ],
      defaultValue: 'pending',
      required: true,
    },
    {
      name: 'notes',
      type: 'textarea',
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
      },
    },
  ],
  access: {
    read: ({ req: { user } }) => {
      // All authenticated users can read quotations
      return user?.id ? true : false
    },
    create: ({ req: { user } }) => {
      // All authenticated users can create quotations
      return user?.id ? true : false
    },
    update: ({ req: { user } }) => {
      // Only admins can update quotations after creation
      return user?.role === 'admin'
    },
    delete: ({ req: { user } }) => {
      // Only admins can delete quotations
      return user?.role === 'admin'
    },
  },
  hooks: {
    beforeChange: [
      async ({ req, operation, data }: { req: any; operation: string; data: any }) => {
        // Generate quotation number
        if (operation === 'create') {
          const result = await req.payload.find({
            collection: 'quotation',
            limit: 1,
            sort: '-quotationNumber',
          })

          let nextNumber = 1
          if (result.docs.length > 0) {
            const lastNumber = result.docs[0].quotationNumber
            const match = lastNumber.match(/^Q(\d+)$/)
            if (match) {
              nextNumber = parseInt(match[1]) + 1
            }
          }

          data.quotationNumber = `Q${nextNumber.toString().padStart(4, '0')}`
          data.createdBy = req.user?.id
        }

        return data
      },
    ],
  },
}
