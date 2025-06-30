import type { CollectionConfig } from 'payload'

export const Invoices: CollectionConfig = {
  slug: 'invoices',
  admin: {
    useAsTitle: 'invoice_number',
    defaultColumns: ['invoice_number', 'scope', 'status', 'total_due', 'createdAt'],
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
      name: 'unit_price',
      type: 'number',
      required: true,
      admin: {
        description: 'Price per unit',
      },
    },
    {
      name: 'quantity',
      type: 'number',
      required: true,
      defaultValue: 1,
      admin: {
        description: 'Quantity of units',
      },
    },
    {
      name: 'total_price',
      type: 'number',
      admin: {
        readOnly: true,
        description: 'Unit price × Quantity',
      },
    },
    {
      name: 'subtotal',
      type: 'number',
      admin: {
        readOnly: true,
        description: 'Same as total price',
      },
    },
    {
      name: 'tax',
      type: 'number',
      admin: {
        readOnly: true,
        description: '11% of subtotal',
      },
    },
    {
      name: 'total_due',
      type: 'number',
      admin: {
        readOnly: true,
        description: 'Subtotal + Tax',
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

        // Calculate totals automatically
        if (data.unit_price !== undefined && data.quantity !== undefined) {
          const unitPrice = parseFloat(data.unit_price) || 0
          const quantity = parseInt(data.quantity) || 0

          // Calculate total price (unit price × quantity)
          data.total_price = unitPrice * quantity

          // Subtotal is the same as total price
          data.subtotal = data.total_price

          // Calculate tax (11% of subtotal)
          data.tax = Math.round(data.subtotal * 0.11 * 100) / 100

          // Calculate total due (subtotal + tax)
          data.total_due = data.subtotal + data.tax
        }

        return data
      },
    ],
  },
}
