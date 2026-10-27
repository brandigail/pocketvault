interface AccountsToolbarProps {
  query: string
  onQueryChange: (query: string) => void
  folders: string[]
  /** The chosen folder, or null for all accounts. */
  folder: string | null
  onFolderChange: (folder: string | null) => void
}

const CHIP = 'min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium'
const CHIP_OFF = `${CHIP} border-slate-300 hover:border-teal-600 dark:border-slate-600`
const CHIP_ON = `${CHIP} border-teal-700 bg-teal-700 text-white`

/** A search box and, once any folders exist, a row of folder chips. */
export function AccountsToolbar({ query, onQueryChange, folders, folder, onFolderChange }: AccountsToolbarProps) {
  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        aria-label="Search accounts"
        placeholder="Search accounts"
        autoComplete="off"
        spellCheck={false}
        className="h-11 min-w-0 rounded-lg border border-slate-300 bg-white px-3 text-base focus:border-teal-600 focus:outline-2 focus:outline-teal-600 dark:border-slate-600 dark:bg-slate-800"
      />
      {folders.length > 0 && (
        <div role="group" aria-label="Folders" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <button type="button" aria-pressed={folder === null} onClick={() => onFolderChange(null)} className={folder === null ? CHIP_ON : CHIP_OFF}>
            All
          </button>
          {folders.map((name) => (
            <button key={name} type="button" aria-pressed={folder === name} onClick={() => onFolderChange(name)} className={folder === name ? CHIP_ON : CHIP_OFF}>
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
