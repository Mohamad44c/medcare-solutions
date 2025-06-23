import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@/payload.config'

export async function getGlobalSettings() {
  try {
    const payload = await getPayloadHMR({ config: configPromise })
    const settings = await payload.findGlobal({
      slug: 'settings',
    })
    return settings
  } catch (error) {
    console.error('Error fetching global settings:', error)
    throw error
  }
}
