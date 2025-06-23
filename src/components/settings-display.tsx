import { getGlobalSettings } from '@/app/actions/settings'

export async function SettingsDisplay() {
  const settings = await getGlobalSettings()

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">Company Name</h3>
        <p>{settings.companyName}</p>
      </div>
      <div>
        <h3 className="font-semibold">Contact Information</h3>
        <p>Phone: {settings.companyPhone}</p>
        <p>Email: {settings.companyEmail}</p>
      </div>
      <div>
        <h3 className="font-semibold">MOF Number</h3>
        <p>{settings.mofNumber}</p>
      </div>
      <div>
        <h3 className="font-semibold">Dollar Rate</h3>
        <p>$1 = {settings.dollarRate} L.L.</p>
      </div>
    </div>
  )
}
