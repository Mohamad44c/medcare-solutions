import type { CollectionConfig } from 'payload'

export const Inventory: CollectionConfig = {
  slug: 'inventory',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'part', 'quantity', 'reorder_point', 'status'],
    group: 'Inventory Management',
    description: 'Manage inventory items and track stock levels',
  },
  labels: {
    singular: 'Inventory Item',
    plural: 'Inventory Items',
  },
  lockDocuments: {
    duration: 600,
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
      name: 'scope_type',
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
      name: 'reorder_point',
      type: 'number',
      defaultValue: 5,
      admin: {
        description: 'Minimum quantity before reorder alert',
      },
    },
    {
      name: 'max_quantity',
      type: 'number',
      admin: {
        description: 'Maximum stock level',
      },
    },
    {
      name: 'unit_cost',
      type: 'number',
      admin: {
        description: 'Cost per unit',
      },
    },
    {
      name: 'unit_price',
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
        { label: 'In Stock', value: 'in_stock' },
        { label: 'Low Stock', value: 'low_stock' },
        { label: 'Out of Stock', value: 'out_of_stock' },
        { label: 'Discontinued', value: 'discontinued' },
      ],
      defaultValue: 'in_stock',
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
      name: 'last_updated',
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
            data.status = 'out_of_stock'
          } else if (data.quantity <= (data.reorder_point || 5)) {
            data.status = 'low_stock'
          } else {
            data.status = 'in_stock'
          }
        }

        data.last_updated = new Date().toISOString()
        return data
      },
    ],
  },
}
