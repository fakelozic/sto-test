export type FileKind = "design" | "image" | "document" | "video" | "archive";
export type CloudFile = { id: string; name: string; kind: FileKind; size: number; modified: number; folder: string | null; starred: boolean; shared: boolean; deleted: boolean; preview?: string; source?: string; uploaded?: boolean };
export type CloudFolder = { id: string; name: string; color: string; shared: boolean };
export type Library = { files: CloudFile[]; folders: CloudFolder[] };
const day = 86400000;
const base = new Date("2026-10-03T00:00:00+05:30").getTime();
export const initialLibrary: Library = {
  folders: [
    { id: "brand", name: "Brand studio", color: "peach", shared: true },
    { id: "photos", name: "Photography", color: "purple", shared: false },
    { id: "work", name: "Work projects", color: "mint", shared: true },
    { id: "personal", name: "Personal", color: "blue", shared: false },
  ],
  files: [
    { id: "brand-guide", name: "Brand direction.svg", kind: "design", size: 2400000, modified: base, folder: "brand", starred: true, shared: true, deleted: false, preview: "/previews/brand.svg", source: "/previews/brand.svg" },
    { id: "coast", name: "Coastal escape.jpg", kind: "image", size: 8400000, modified: base - day, folder: "photos", starred: true, shared: false, deleted: false, preview: "/previews/coast.jpg", source: "/previews/coast.jpg" },
    { id: "proposal", name: "Project proposal.pdf", kind: "document", size: 1200000, modified: base - day * 2, folder: "work", starred: false, shared: true, deleted: false, preview: "/previews/proposal.svg", source: "/previews/project-proposal.pdf" },
    { id: "website", name: "Website exploration.svg", kind: "design", size: 5600000, modified: base - day * 3, folder: "brand", starred: false, shared: true, deleted: false, preview: "/previews/website.svg", source: "/previews/website.svg" },
    { id: "mountains", name: "Somewhere quiet.jpg", kind: "image", size: 6100000, modified: base - day * 4, folder: "photos", starred: false, shared: false, deleted: false, preview: "/previews/mountains.jpg", source: "/previews/mountains.jpg" },
    { id: "roadmap", name: "A few good ideas.txt", kind: "document", size: 2400, modified: base - day * 5, folder: "personal", starred: false, shared: false, deleted: false, preview: "/previews/notes.svg", source: "/previews/ideas.txt" },
    { id: "assets", name: "Launch assets.zip", kind: "archive", size: 12400000, modified: base - day * 6, folder: "work", starred: false, shared: true, deleted: false, source: "/previews/launch-assets.zip" },
    { id: "old-notes", name: "Old meeting notes.txt", kind: "document", size: 1200, modified: base - day * 7, folder: "personal", starred: false, shared: false, deleted: true, source: "/previews/ideas.txt" },
  ],
};
export function formatSize(bytes: number) { if (bytes < 1024) return `${bytes} B`; if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`; return `${(bytes / 1048576).toFixed(1)} MB`; }
export function getKind(file: File): FileKind { if (file.type.startsWith("image/")) return "image"; if (file.type.startsWith("video/")) return "video"; if (/\.(zip|rar|7z)$/i.test(file.name)) return "archive"; if (/\.(fig|sketch|ai)$/i.test(file.name)) return "design"; return "document"; }
function openDB(): Promise<IDBDatabase> { return new Promise((resolve, reject) => { const req = indexedDB.open("nimbus-files", 1); req.onupgradeneeded = () => req.result.createObjectStore("files"); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); }); }
export async function saveBlob(id: string, blob: File) { const db = await openDB(); try { await new Promise<void>((resolve, reject) => { const tx = db.transaction("files", "readwrite"); tx.objectStore("files").put(blob, id); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); }); } finally { db.close(); } }
export async function getBlob(id: string): Promise<Blob | undefined> { const db = await openDB(); try { return await new Promise((resolve, reject) => { const req = db.transaction("files").objectStore("files").get(id); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); }); } finally { db.close(); } }
export async function removeBlob(id: string) { const db = await openDB(); try { await new Promise<void>((resolve, reject) => { const tx = db.transaction("files", "readwrite"); tx.objectStore("files").delete(id); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); }); } finally { db.close(); } }
