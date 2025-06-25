import type { CollectionConfig } from 'payload'

export const Repairs: CollectionConfig = {
  slug: 'repairs',
  admin: {
    useAsTitle: 'repair_number',
    defaultColumns: ['repair_number', 'scope', 'status', 'total_cost', 'createdAt'],
  },
  fields: [
    {
      name: 'repair_number',
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
      name: 'quotation',
      type: 'relationship',
      relationTo: 'quotation',
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Completed', value: 'completed' },
        { label: 'Shipped', value: 'shipped' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      defaultValue: 'pending',
      required: true,
    },
    {
      name: 'parts_used',
      type: 'array',
      fields: [
        {
          name: 'part',
          type: 'relationship',
          relationTo: 'part',
          required: true,
        },
        {
          name: 'quantity_used',
          type: 'number',
          required: true,
          min: 1,
        },
        {
          name: 'unit_cost',
          type: 'number',
          required: true,
        },
        {
          name: 'total_cost',
          type: 'number',
          admin: {
            readOnly: true,
          },
        },
      ],
    },
    {
      name: 'labor_cost',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'total_cost',
      type: 'number',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'notes',
      type: 'textarea',
    },
    {
      name: 'start_date',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'MMM d, yyyy',
        },
      },
    },
    {
      name: 'completion_date',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'MMM d, yyyy',
        },
      },
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
  hooks: {
    beforeChange: [
      async ({ req, operation, data }: { req: any; operation: string; data: any }) => {
        // Generate repair number
        if (operation === 'create') {
          const result = await req.payload.find({
            collection: 'repairs',
            limit: 1,
            sort: '-repair_number',
          })

          let nextNumber = 1
          if (result.docs.length > 0) {
            const lastNumber = result.docs[0].repair_number
            const match = lastNumber.match(/^R(\d+)$/)
            if (match) {
              nextNumber = parseInt(match[1]) + 1
            }
          }

          data.repair_number = `R${nextNumber.toString().padStart(4, '0')}`
          data.created_by = req.user?.id
        }

        // Calculate total cost from parts and labor
        if (data.parts_used && Array.isArray(data.parts_used)) {
          const partsTotal = data.parts_used.reduce((sum: number, part: any) => {
            const partTotal = (part.quantity_used || 0) * (part.unit_cost || 0)
            part.total_cost = partTotal
            return sum + partTotal
          }, 0)

          data.total_cost = partsTotal + (data.labor_cost || 0)
        }

        return data
      },
    ],
    afterChange: [
      async ({ req, operation, doc }: { req: any; operation: string; doc: any }) => {
        // Deduct parts from inventory when repair is created or parts are updated
        if (operation === 'create' || operation === 'update') {
          if (doc.parts_used && Array.isArray(doc.parts_used)) {
            for (const partUsed of doc.parts_used) {
              if (partUsed.part && partUsed.quantity_used) {
                // Get current inventory for this part
                const inventoryResult = await req.payload.find({
                  collection: 'inventory',
                  where: {
                    part: {
                      equals: partUsed.part,
                    },
                  },
                })

                if (inventoryResult.docs.length > 0) {
                  const inventory = inventoryResult.docs[0]
                  const newQuantity = Math.max(
                    0,
                    (inventory.quantity || 0) - partUsed.quantity_used,
                  )

                  await req.payload.update({
                    collection: 'inventory',
                    id: inventory.id,
                    data: {
                      quantity: newQuantity,
                    },
                  })
                }
              }
            }
          }
        }
      },
    ],
  },
}
