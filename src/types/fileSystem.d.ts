interface FileSystemDirectoryHandle {
  name: string
  entries(): AsyncIterableIterator<[string, FileSystemDirectoryHandle | FileSystemFileHandle]>
}

interface FileSystemFileHandle {
  name: string
  getFile(): Promise<File>
}

interface Window {
  showDirectoryPicker(): Promise<FileSystemDirectoryHandle>
}
