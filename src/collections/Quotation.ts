import type { CollectionConfig } from 'payload'

export const Quotation: CollectionConfig = {
    slug: 'quotation',
    admin: {
        useAsTitle: 'name',
    },
    fields: [
        {
            name: 'quotation_number',
            type: 'text',
            required: true,
        },
        {
            name: 'delivery_period',
            type: 'number'
        },
        {
            name: 'scope',
            type: 'relationship',
            relationTo: 'scopes',
        },
        {
            name: 'offer_validity',
            type: 'date',
        },
        {
            name: 'quotation_date',
            type: 'date',
        },
        {
            name: 'problems',
            type: 'text',
        },
        {
            name: 'service_type',
            type: 'text',
        },
        {
            name: 'price',
            type: 'number',
        },
        {
            name: 'discount',
            type: 'number',
        },
        {
            name: 'quantity',
            type: 'number',
        },
        {
            name: 'quotation_status',
            type: 'select',
            options: [
                { label: 'Pending', value: 'pending' },
                { label: 'Accepted', value: 'accepted' },
                { label: 'Rejected', value: 'rejected' },
            ],
            defaultValue: 'pending',
            required: true,
        }
    ]
}