export interface ScannedFile {
  name: string
  relativePath: string
  size: number
}

export interface CompareResult {
  relativePath: string
  name: string
  status: 'left-only' | 'right-only' | 'modified' | 'identical'
  leftSize?: number
  rightSize?: number
}

export interface FolderTreeItem {
  relativePath: string
  name: string
  status: 'left-only' | 'right-only' | 'modified' | 'identical' | 'directory'
  isDirectory: boolean
  children?: FolderTreeItem[]
  leftSize?: number
  rightSize?: number
}

export interface DirSnapshot {
  name: string
  handle?: FileSystemDirectoryHandle
  entry?: FileSystemDirectoryEntry
  files: ScannedFile[]
}

export async function pickDirectory(): Promise<DirSnapshot> {
  if (!('showDirectoryPicker' in window)) {
    throw new Error('Folder comparison requires Chrome/Edge browser with File System Access API.')
  }
  const handle = await window.showDirectoryPicker()
  const files: ScannedFile[] = []
  await scanDirRecursive(handle, files)
  return { name: handle.name, handle, files }
}

export async function pickDirectoryFromDrop(item: DataTransferItem): Promise<DirSnapshot> {
  const entry = item.webkitGetAsEntry()
  if (!entry || !entry.isDirectory) {
    throw new Error('Dropped item is not a directory.')
  }
  const files: ScannedFile[] = []
  await scanDirRecursiveLegacy(entry as FileSystemDirectoryEntry, files)
  return { name: entry.name, entry: entry as FileSystemDirectoryEntry, files }
}

async function scanDirRecursive(
  handle: FileSystemDirectoryHandle,
  files: ScannedFile[],
  basePath = ''
): Promise<void> {
  for await (const [name, entry] of handle.entries()) {
    const relativePath = basePath ? `${basePath}/${name}` : name
    if ('getFile' in entry) {
      const fileHandle = entry as FileSystemFileHandle
      const file = await fileHandle.getFile()
      files.push({ name, relativePath, size: file.size })
    } else {
      const dirHandle = entry as FileSystemDirectoryHandle
      await scanDirRecursive(dirHandle, files, relativePath)
    }
  }
  files.sort((a, b) => a.relativePath.localeCompare(b.relativePath))
}

async function scanDirRecursiveLegacy(
  entry: FileSystemDirectoryEntry,
  files: ScannedFile[],
  basePath = ''
): Promise<void> {
  const readAllEntries = (reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> => {
    return new Promise((resolve, reject) => {
      reader.readEntries((entries) => {
        resolve(entries)
      }, reject)
    })
  }

  const readFileEntry = (fe: FileSystemFileEntry): Promise<File> => {
    return new Promise((resolve, reject) => {
      fe.file(resolve, reject)
    })
  }

  const reader = entry.createReader()
  let batch = await readAllEntries(reader)
  while (batch.length > 0) {
    const promises: Promise<void>[] = []
    for (const e of batch) {
      const relativePath = basePath ? `${basePath}/${e.name}` : e.name
      if (e.isFile) {
        const fe = e as FileSystemFileEntry
        promises.push(
          readFileEntry(fe).then((file) => {
            files.push({ name: e.name, relativePath, size: file.size })
          })
        )
      } else if (e.isDirectory) {
        promises.push(scanDirRecursiveLegacy(e as FileSystemDirectoryEntry, files, relativePath))
      }
    }
    await Promise.all(promises)
    batch = await readAllEntries(reader)
  }
  files.sort((a, b) => a.relativePath.localeCompare(b.relativePath))
}

export function compareDirs(
  left: DirSnapshot,
  right: DirSnapshot
): CompareResult[] {
  const leftMap = new Map(left.files.map((f) => [f.relativePath, f]))
  const rightMap = new Map(right.files.map((f) => [f.relativePath, f]))
  const allPaths = new Set([...leftMap.keys(), ...rightMap.keys()])
  const results: CompareResult[] = []

  for (const path of allPaths) {
    const lf = leftMap.get(path)
    const rf = rightMap.get(path)
    if (lf && !rf) {
      results.push({ relativePath: path, name: path.split('/').pop() || path, status: 'left-only', leftSize: lf.size })
    } else if (!lf && rf) {
      results.push({ relativePath: path, name: path.split('/').pop() || path, status: 'right-only', rightSize: rf.size })
    } else if (lf && rf) {
      results.push({
        relativePath: path,
        name: path.split('/').pop() || path,
        status: lf.size === rf.size ? 'identical' : 'modified',
        leftSize: lf.size,
        rightSize: rf.size
      })
    }
  }
  return results
}

export function buildFileTree(results: CompareResult[]): FolderTreeItem[] {
  const root: FolderTreeItem = { relativePath: '', name: '', status: 'directory', isDirectory: true, children: [] }

  for (const r of results) {
    const parts = r.relativePath.split('/')
    let current = root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isFile = i === parts.length - 1
      const itemPath = parts.slice(0, i + 1).join('/')

      if (!current.children) current.children = []
      let existing = current.children.find((c) => c.name === part)

      if (!existing) {
        if (isFile) {
          existing = { relativePath: itemPath, name: part, status: r.status, isDirectory: false, leftSize: r.leftSize, rightSize: r.rightSize }
        } else {
          existing = { relativePath: itemPath, name: part, status: 'directory', isDirectory: true, children: [] }
        }
        current.children.push(existing)
      } else if (isFile) {
        existing.status = r.status
        existing.leftSize = r.leftSize
        existing.rightSize = r.rightSize
      }
      current = existing
    }
  }
  return root.children || []
}

export async function readFileFromDir(
  handle: FileSystemDirectoryHandle,
  relativePath: string
): Promise<string> {
  const parts = relativePath.split('/')

  async function find(handle: FileSystemDirectoryHandle, idx: number): Promise<string> {
    const isLast = idx === parts.length - 1
    const targetName = parts[idx]

    for await (const [name, entry] of handle.entries()) {
      if (name !== targetName) continue
      if (isLast) {
        const fileHandle = entry as FileSystemFileHandle
        const file = await fileHandle.getFile()
        return file.text()
      }
      return find(entry as FileSystemDirectoryHandle, idx + 1)
    }
    throw new Error(`Not found: ${relativePath}`)
  }

  return find(handle, 0)
}

function readAllEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    reader.readEntries((entries) => resolve(entries), reject)
  })
}

export async function readFileFromDirEntry(
  entry: FileSystemDirectoryEntry,
  relativePath: string
): Promise<string> {
  const parts = relativePath.split('/')

  async function find(entry: FileSystemDirectoryEntry, idx: number): Promise<string> {
    const isLast = idx === parts.length - 1
    const targetName = parts[idx]

    const reader = entry.createReader()
    let allEntries: FileSystemEntry[] = []
    let batch = await readAllEntries(reader)
    while (batch.length > 0) {
      allEntries = allEntries.concat(batch)
      batch = await readAllEntries(reader)
    }

    for (const e of allEntries) {
      if (e.name !== targetName) continue
      if (isLast) {
        const fe = e as FileSystemFileEntry
        const file = await new Promise<File>((resolve, reject) => fe.file(resolve, reject))
        return file.text()
      }
      return find(e as FileSystemDirectoryEntry, idx + 1)
    }
    throw new Error(`Not found: ${relativePath}`)
  }

  return find(entry, 0)
}

export function getStatusText(status: string): string {
  switch (status) {
    case 'left-only': return 'Only in Left'
    case 'right-only': return 'Only in Right'
    case 'modified': return 'Modified'
    case 'identical': return 'Identical'
    default: return status
  }
}

// --- 3-way comparison ---

export interface Compare3Result {
  relativePath: string
  name: string
  leftSize: number | null
  middleSize: number | null
  rightSize: number | null
}

export function compareDirs3(
  left: DirSnapshot,
  middle: DirSnapshot,
  right: DirSnapshot
): Compare3Result[] {
  const leftMap = new Map(left.files.map(f => [f.relativePath, f]))
  const middleMap = new Map(middle.files.map(f => [f.relativePath, f]))
  const rightMap = new Map(right.files.map(f => [f.relativePath, f]))
  const allPaths = new Set([...leftMap.keys(), ...middleMap.keys(), ...rightMap.keys()])
  const results: Compare3Result[] = []

  for (const path of allPaths) {
    const lf = leftMap.get(path)
    const mf = middleMap.get(path)
    const rf = rightMap.get(path)
    results.push({
      relativePath: path,
      name: path.split('/').pop() || path,
      leftSize: lf?.size ?? null,
      middleSize: mf?.size ?? null,
      rightSize: rf?.size ?? null,
    })
  }

  results.sort((a, b) => a.relativePath.localeCompare(b.relativePath))
  return results
}

export function readFileFromDir3(
  handle: FileSystemDirectoryHandle,
  relativePath: string
): Promise<string> {
  return readFileFromDir(handle, relativePath)
}

export function readFileFromDirEntry3(
  entry: FileSystemDirectoryEntry,
  relativePath: string
): Promise<string> {
  return readFileFromDirEntry(entry, relativePath)
}
