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
      admin: {
        description: 'Only scopes with approved quotations are shown',
      },
      hooks: {
        beforeValidate: [
          async ({ value, req }) => {
            // Validate that the scope has an approved quotation
            if (value && typeof value === 'string' && value.trim() !== '') {
              const quotationResult = await req.payload.find({
                collection: 'quotation',
                where: {
                  and: [
                    {
                      scope: {
                        equals: value,
                      },
                    },
                    {
                      quotationStatus: {
                        equals: 'approved',
                      },
                    },
                  ],
                },
              })

              if (quotationResult.docs.length === 0) {
                throw new Error('Selected scope does not have an approved quotation')
              }
            }
            return value
          },
        ],
      },
    },
    {
      name: 'evaluation',
      type: 'relationship',
      relationTo: 'evaluation',
      admin: {
        description: 'Only evaluations with scopes that have approved quotations are shown',
      },
      hooks: {
        beforeValidate: [
          async ({ value, req }) => {
            // Validate that the evaluation's scope has an approved quotation
            if (value && typeof value === 'string' && value.trim() !== '') {
              const evaluation = await req.payload.findByID({
                collection: 'evaluation',
                id: value,
              })

              if (evaluation && evaluation.scope) {
                // Handle both populated object and ID string cases
                let scopeId = evaluation.scope
                if (typeof evaluation.scope === 'object' && evaluation.scope.id) {
                  scopeId = evaluation.scope.id
                }

                const quotationResult = await req.payload.find({
                  collection: 'quotation',
                  where: {
                    and: [
                      {
                        scope: {
                          equals: scopeId,
                        },
                      },
                      {
                        quotationStatus: {
                          equals: 'approved',
                        },
                      },
                    ],
                  },
                })

                if (quotationResult.docs.length === 0) {
                  throw new Error('Selected evaluation does not have an approved quotation')
                }
              }
            }
            return value
          },
        ],
      },
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
          relationTo: 'inventory',
          required: true,
          admin: {
            description: 'Select a part from inventory. Unit cost will be automatically populated.',
          },
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
          admin: {
            readOnly: true,
            description: 'Unit cost is automatically populated from the selected part',
          },
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

        // Populate unit cost from selected parts and calculate totals
        if (data.partsUsed && Array.isArray(data.partsUsed)) {
          for (const partUsed of data.partsUsed) {
            // Skip if no part is selected or part is empty
            if (
              !partUsed.part ||
              partUsed.part === '' ||
              partUsed.part === null ||
              partUsed.part === undefined
            ) {
              partUsed.unitCost = 0
              partUsed.totalCost = 0
              continue
            }

            try {
              // Fetch the part to get its unit cost
              const partId = typeof partUsed.part === 'string' ? partUsed.part : partUsed.part.id

              // Validate part ID
              if (!partId || typeof partId !== 'string' || partId.trim() === '') {
                console.warn('Invalid part ID:', partId)
                partUsed.unitCost = 0
              } else {
                const part = await req.payload.findByID({
                  collection: 'inventory',
                  id: partId,
                })

                if (part) {
                  partUsed.unitCost = (part as any).unitCost || 0
                } else {
                  console.warn('Part not found with ID:', partId)
                  partUsed.unitCost = 0
                }
              }
            } catch (error) {
              console.warn('Could not fetch part for unit cost:', error)
              partUsed.unitCost = 0
            }

            // Calculate total cost for this part
            const partTotal = (partUsed.quantityUsed || 0) * (partUsed.unitCost || 0)
            partUsed.totalCost = partTotal
          }
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
                try {
                  // Get current inventory for this part
                  const partId =
                    typeof partUsed.part === 'string' ? partUsed.part : partUsed.part.id

                  // Validate part ID
                  if (!partId || typeof partId !== 'string' || partId.trim() === '') {
                    console.warn('Invalid part ID for inventory update:', partId)
                    continue
                  }

                  const inventoryResult = await req.payload.findByID({
                    collection: 'inventory',
                    id: partId,
                  })

                  if (inventoryResult) {
                    const newQuantity = Math.max(
                      0,
                      (inventoryResult.quantity || 0) - partUsed.quantityUsed,
                    )

                    await req.payload.update({
                      collection: 'inventory',
                      id: partId,
                      data: {
                        quantity: newQuantity,
                      },
                    })
                  } else {
                    console.warn('Inventory item not found for ID:', partId)
                  }
                } catch (error) {
                  console.warn('Error updating inventory for part:', error)
                }
              }
            }
          }
        }
      },
    ],
  },
}
