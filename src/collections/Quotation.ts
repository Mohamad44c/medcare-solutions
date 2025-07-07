import type { CollectionConfig } from 'payload'

export const Quotation: CollectionConfig = {
  slug: 'quotation',
  admin: {
    useAsTitle: 'quotation_number',
    defaultColumns: ['quotation_number', 'scope', 'quotation_status', 'price', 'createdAt'],
  },
  lockDocuments: {
    duration: 600, // 10 minutes
  },
  fields: [
    {
      name: 'quotation_number',
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
    },
    {
      name: 'quotation_date',
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
      name: 'offer_validity',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'MMM d, yyyy',
        },
      },
    },
    {
      name: 'delivery_period',
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
      name: 'service_type',
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
      name: 'price',
      type: 'number',
      required: true,
      admin: {
        description: 'Total quotation price',
      },
    },
    {
      name: 'discount',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'quotation_status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Sent', value: 'sent' },
        { label: 'Accepted', value: 'accepted' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Expired', value: 'expired' },
      ],
      defaultValue: 'draft',
      required: true,
    },
    {
      name: 'notes',
      type: 'textarea',
    },
    {
      name: 'created_by',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'pdf',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Generated quotation PDF. Use the API endpoint /api/quotations/{id}/generate-pdf to generate and download the PDF.',
        readOnly: true,
      },
    },
    {
      name: 'pdf_url',
      type: 'text',
      admin: {
        description: 'S3 URL of the generated PDF',
        readOnly: true,
      },
    },
    {
      name: 'pdf_generated_at',
      type: 'date',
      admin: {
        description: 'Timestamp when PDF was last generated',
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
            sort: '-quotation_number',
          })

          let nextNumber = 1
          if (result.docs.length > 0) {
            const lastNumber = result.docs[0].quotation_number
            const match = lastNumber.match(/^Q(\d+)$/)
            if (match) {
              nextNumber = parseInt(match[1]) + 1
            }
          }

          data.quotation_number = `Q${nextNumber.toString().padStart(4, '0')}`
          data.created_by = req.user?.id
        }

        return data
      },
    ],
  },
}
