/// <reference types="vite/client" />

interface FileSystemHandle {
  readonly kind: 'file' | 'directory';
  readonly name: string;
  isSameEntry(other: FileSystemHandle): Promise<boolean>;
  queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
  requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
}

interface FileSystemFileHandle extends FileSystemHandle {
  readonly kind: 'file';
  getFile(): Promise<File>;
  createWritable(options?: FileSystemCreateWritableOptions): Promise<FileSystemWritableFileStream>;
}

interface FileSystemDirectoryHandle extends FileSystemHandle {
  readonly kind: 'directory';
  getDirectoryHandle(name: string, options?: FileSystemGetDirectoryOptions): Promise<FileSystemDirectoryHandle>;
  getFileHandle(name: string, options?: FileSystemGetFileOptions): Promise<FileSystemFileHandle>;
  removeEntry(name: string, options?: FileSystemRemoveEntryOptions): Promise<void>;
  resolve(possibleDescendant: FileSystemHandle): Promise<string[] | null>;
  [Symbol.asyncIterator](): AsyncIterableIterator<FileSystemHandle>;
}

interface FileSystemHandlePermissionDescriptor extends PermissionDescriptor {
  query?: boolean;
  mode?: 'read' | 'readwrite';
}

interface FileSystemCreateWritableOptions {
  keepExistingData?: boolean;
}

interface FileSystemGetFileOptions {
  create?: boolean;
}

interface FileSystemGetDirectoryOptions {
  create?: boolean;
}

interface FileSystemRemoveEntryOptions {
  recursive?: boolean;
}

interface AcceptableTypes {
  description?: string;
  accept: {
    [key: string]: string[]
  };
}

interface FilePickerOptions {
  id?: string;
  excludeAcceptAllOption?: boolean;
  multiple?: boolean;
  startIn?: FileSystemHandle;
  types?: AcceptableTypes[];
}

declare function showOpenFilePicker(options?: FilePickerOptions): Promise<FileSystemFileHandle[]>;
declare function showSaveFilePicker(options?: FilePickerOptions): Promise<FileSystemFileHandle>;
declare function showDirectoryPicker(options?: FilePickerOptions): Promise<FileSystemDirectoryHandle>;

declare module '*.scss?raw' {
  const content: string
  export default content
}

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.jpeg' {
  const src: string
  export default src
}

declare module '*.svg' {
  const src: string
  export default src
}

declare module '*.ico' {
  const src: string
  export default src
}

declare module '*.mp4' {
  const src: string
  export default src
}
