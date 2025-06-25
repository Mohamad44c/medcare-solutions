import type { CollectionConfig } from 'payload'

export const Invoices: CollectionConfig = {
  slug: 'invoices',
  admin: {
    useAsTitle: 'invoice_number',
    defaultColumns: ['invoice_number', 'scope', 'status', 'total_amount', 'createdAt'],
  },
  lockDocuments: {
    duration: 600, // 10 minutes
  },
  fields: [
    {
      name: 'invoice_number',
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
      name: 'repair',
      type: 'relationship',
      relationTo: 'repairs',
    },
    {
      name: 'quotation',
      type: 'relationship',
      relationTo: 'quotation',
    },
    {
      name: 'invoice_date',
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
      name: 'due_date',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'MMM d, yyyy',
        },
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Sent', value: 'sent' },
        { label: 'Paid', value: 'paid' },
        { label: 'Overdue', value: 'overdue' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      defaultValue: 'draft',
      required: true,
    },
    {
      name: 'parts_cost',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'labor_cost',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'subtotal',
      type: 'number',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'tax',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'total_amount',
      type: 'number',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'payment_terms',
      type: 'text',
      defaultValue: 'Net 30',
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
  ],
  access: {
    read: ({ req: { user } }) => {
      // All authenticated users can read invoices
      return user?.id ? true : false
    },
    create: ({ req: { user } }) => {
      // Only admins can create invoices
      return user?.role === 'admin'
    },
    update: ({ req: { user } }) => {
      // Only admins can update invoices
      return user?.role === 'admin'
    },
    delete: ({ req: { user } }) => {
      // Only admins can delete invoices
      return user?.role === 'admin'
    },
  },
  hooks: {
    beforeChange: [
      async ({ req, operation, data }: { req: any; operation: string; data: any }) => {
        // Generate invoice number
        if (operation === 'create') {
          const result = await req.payload.find({
            collection: 'invoices',
            limit: 1,
            sort: '-invoice_number',
          })

          let nextNumber = 1
          if (result.docs.length > 0) {
            const lastNumber = result.docs[0].invoice_number
            const match = lastNumber.match(/^INV(\d+)$/)
            if (match) {
              nextNumber = parseInt(match[1]) + 1
            }
          }

          data.invoice_number = `INV${nextNumber.toString().padStart(4, '0')}`
          data.created_by = req.user?.id
        }

        // Calculate totals
        const subtotal = (data.parts_cost || 0) + (data.labor_cost || 0)
        data.subtotal = subtotal

        const total = subtotal + (data.tax || 0)
        data.total_amount = total

        return data
      },
    ],
  },
}
