import type { CollectionConfig } from 'payload'

export const Evaluation: CollectionConfig = {
    slug: 'evaluation',
    admin: {
        useAsTitle: 'name',
    },
    fields: [
        {
            name: 'code',
            type: 'text',
            required: true,
        },
        {
            name: 'type',
            type: 'select',
            options: [
                { label: 'Rigid', value: 'rigid' },
                { label: 'Flexible', value: 'flexible' },
            ],
            required: true,
        },
        {
            name: 'evaluation',
            type: 'text',
        }
    ]
}