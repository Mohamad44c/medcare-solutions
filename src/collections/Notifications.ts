import type { CollectionConfig } from 'payload';

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  admin: {
    useAsTitle: 'message',
    defaultColumns: ['message', 'type', 'read', 'createdAt'],
    group: 'System',
  },
  fields: [
    {
      name: 'message',
      type: 'text',
      required: true,
    },
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'Info', value: 'info' },
        { label: 'Success', value: 'success' },
        { label: 'Warning', value: 'warning' },
        { label: 'Error', value: 'error' },
      ],
      required: true,
      defaultValue: 'info',
    },
    {
      name: 'read',
      type: 'checkbox',
      defaultValue: false,
      required: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'relatedCollection',
      type: 'text',
      admin: {
        description: 'The collection this notification is related to',
      },
    },
    {
      name: 'relatedDocument',
      type: 'text',
      admin: {
        description: 'The ID of the document this notification is related to',
      },
    },
  ],
  access: {
    read: ({ req: { user } }) => {
      // Users can only read their own notifications
      if (!user) return false;
      return {
        user: {
          equals: user.id,
        },
      };
    },
    create: ({ req: { user } }) => {
      return Boolean(user?.id);
    },
    update: ({ req: { user } }) => {
      // Users can only update their own notifications
      if (!user) return false;
      return {
        user: {
          equals: user.id,
        },
      };
    },
    delete: ({ req: { user } }) => {
      // Users can only delete their own notifications
      if (!user) return false;
      return {
        user: {
          equals: user.id,
        },
      };
    },
  },
  timestamps: true,
};
