import type { CollectionConfig } from 'payload'

export const Repairs: CollectionConfig = {
  slug: 'repairs',
  admin: {
    useAsTitle: 'repairNumber',
    defaultColumns: ['repairNumber', 'scope', 'status', 'totalCost', 'createdAt'],
    group: 'Operations',
    description:
      'Core workflow stages involved in handling service requests, from initial scoping to final invoicing.',
  },
  lockDocuments: {
    duration: 600, // 10 minutes
  },
  fields: [
    {
      name: 'repairNumber',
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
        { label: 'Done', value: 'done' },
        { label: 'Not Done', value: 'notDone' },
      ],
      defaultValue: 'pending',
      required: true,
    },
    {
      name: 'partsUsed',
      type: 'array',
      fields: [
        {
          name: 'part',
          type: 'relationship',
          relationTo: 'part',
          required: true,
        },
        {
          name: 'quantityUsed',
          type: 'number',
          required: true,
          min: 1,
        },
        {
          name: 'unitCost',
          type: 'number',
          required: true,
        },
        {
          name: 'totalCost',
          type: 'number',
          admin: {
            readOnly: true,
          },
        },
      ],
    },
    {
      name: 'laborCost',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'totalCost',
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
      name: 'startDate',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'MMM d, yyyy',
        },
      },
    },
    {
      name: 'completionDate',
      type: 'date',
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
    },
  ],
  access: {
    read: ({ req: { user } }) => {
      // All authenticated users can read repairs
      return user?.id ? true : false
    },
    create: ({ req: { user } }) => {
      // Only admins can create repairs
      return user?.role === 'admin'
    },
    update: ({ req: { user } }) => {
      // Only admins can update repairs
      return user?.role === 'admin'
    },
    delete: ({ req: { user } }) => {
      // Only admins can delete repairs
      return user?.role === 'admin'
    },
  },
  hooks: {
    beforeChange: [
      async ({ req, operation, data }: { req: any; operation: string; data: any }) => {
        // Generate repair number
        if (operation === 'create') {
          const result = await req.payload.find({
            collection: 'repairs',
            limit: 1,
            sort: '-repairNumber',
          })

          let nextNumber = 1
          if (result.docs.length > 0) {
            const lastNumber = result.docs[0].repairNumber
            const match = lastNumber.match(/^R(\d+)$/)
            if (match) {
              nextNumber = parseInt(match[1]) + 1
            }
          }

          data.repairNumber = `R${nextNumber.toString().padStart(4, '0')}`
          data.createdBy = req.user?.id
        }

        // Calculate total cost from parts and labor
        if (data.partsUsed && Array.isArray(data.partsUsed)) {
          const partsTotal = data.partsUsed.reduce((sum: number, part: any) => {
            const partTotal = (part.quantityUsed || 0) * (part.unitCost || 0)
            part.totalCost = partTotal
            return sum + partTotal
          }, 0)

          data.totalCost = partsTotal + (data.laborCost || 0)
        }

        return data
      },
    ],
    afterChange: [
      async ({ req, operation, doc }: { req: any; operation: string; doc: any }) => {
        // Deduct parts from inventory when repair is created or parts are updated
        if (operation === 'create' || operation === 'update') {
          if (doc.partsUsed && Array.isArray(doc.partsUsed)) {
            for (const partUsed of doc.partsUsed) {
              if (partUsed.part && partUsed.quantityUsed) {
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
                  const newQuantity = Math.max(0, (inventory.quantity || 0) - partUsed.quantityUsed)

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
