import type { CollectionConfig } from 'payload'

export const Companys: CollectionConfig = {
    slug: 'companys',
    admin: {
        useAsTitle: 'name',
    },
    fields: [
        {
            name: 'ID',
            type: 'number',
            required: true,
            unique: true,
        },
        {
            name: 'name',
            type: 'text',
            required: true,
        },
        {
            name: 'phone number',
            type: 'number'
        },
        {
            name: 'email',
            type: 'email',
        },
        {
            name: 'address',
            type: 'text',
        },
        {
            name: 'mof number',
            type: 'text',
        }
    ]
}