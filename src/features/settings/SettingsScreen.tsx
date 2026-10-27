import { BiometricSettings } from './BiometricSettings'
import { ExportBackup } from './ExportBackup'
import { ImportBackup } from './ImportBackup'

interface SettingsScreenProps {
  vaultKey: CryptoKey
  onClose: () => void
}

export function SettingsScreen({ vaultKey, onClose }: SettingsScreenProps) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col gap-8 px-4 pb-12">
      <header className="flex items-center justify-between py-4">
        <h1 className="text-xl font-semibold">Settings</h1>
        <button
          type="button"
          onClick={onClose}
          className="h-11 rounded-lg bg-teal-700 px-4 text-sm font-medium text-white hover:bg-teal-800"
        >
          Done
        </button>
      </header>

      <BiometricSettings />
      <hr className="border-slate-200 dark:border-slate-700" />
      <ExportBackup vaultKey={vaultKey} />
      <hr className="border-slate-200 dark:border-slate-700" />
      <ImportBackup vaultKey={vaultKey} />
      <hr className="border-slate-200 dark:border-slate-700" />

      <section aria-labelledby="about-heading" className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-400">
        <h2 id="about-heading" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          About
        </h2>
        <p>Version {__BUILD_STAMP__}</p>
        <p>Everything stays on this device. PocketVault never sends your accounts anywhere.</p>
      </section>
    </div>
  )
}
