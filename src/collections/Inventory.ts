import type { CollectionConfig } from 'payload'

export const Inventory: CollectionConfig = {
  slug: 'inventory',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'part', 'quantity', 'reorderPoint', 'status'],
    group: 'Inventory Management',
    description: 'Manage inventory items and track stock levels',
  },
  labels: {
    singular: 'Inventory Item',
    plural: 'Inventory Items',
  },

  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'part',
      type: 'relationship',
      relationTo: 'part',
      hasMany: true,
    },
    {
      name: 'scopeType',
      type: 'select',
      options: [
        { label: 'Rigid', value: 'rigid' },
        { label: 'Flexible', value: 'flexible' },
      ],
      required: true,
    },
    {
      name: 'quantity',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Current stock quantity',
      },
    },
    {
      name: 'reorderPoint',
      type: 'number',
      defaultValue: 5,
      admin: {
        description: 'Minimum quantity before reorder alert',
      },
    },
    {
      name: 'maxQuantity',
      type: 'number',
      admin: {
        description: 'Maximum stock level',
      },
    },
    {
      name: 'unitCost',
      type: 'number',
      admin: {
        description: 'Cost per unit',
      },
    },
    {
      name: 'unitPrice',
      type: 'number',
      admin: {
        description: 'Selling price per unit',
      },
    },
    {
      name: 'manufacturer',
      type: 'relationship',
      relationTo: 'manufacturers',
    },
    {
      name: 'location',
      type: 'text',
      admin: {
        description: 'Storage location',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'In Stock', value: 'inStock' },
        { label: 'Low Stock', value: 'lowStock' },
        { label: 'Out of Stock', value: 'outOfStock' },
        { label: 'Discontinued', value: 'discontinued' },
      ],
      defaultValue: 'inStock',
      admin: {
        readOnly: true,
        style: {
          backgroundColor: 'var(--theme-elevation-50)',
          padding: '4px 8px',
          borderRadius: '4px',
        },
      },
    },
    {
      name: 'lastUpdated',
      type: 'date',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
  access: {
    read: ({ req: { user } }) => {
      // All authenticated users can read inventory
      return user?.id ? true : false
    },
    create: ({ req: { user } }) => {
      // Only admins can create inventory items
      return user?.role === 'admin'
    },
    update: ({ req: { user } }) => {
      // Only admins can update inventory
      return user?.role === 'admin'
    },
    delete: ({ req: { user } }) => {
      // Only admins can delete inventory
      return user?.role === 'admin'
    },
  },
  hooks: {
    beforeChange: [
      async ({ operation, data }: { operation: string; data: any }) => {
        // Update status based on quantity
        if (data.quantity !== undefined) {
          if (data.quantity <= 0) {
            data.status = 'outOfStock'
          } else if (data.quantity <= (data.reorderPoint || 5)) {
            data.status = 'lowStock'
          } else {
            data.status = 'inStock'
          }
        }

        data.lastUpdated = new Date().toISOString()
        return data
      },
    ],
  },
}
