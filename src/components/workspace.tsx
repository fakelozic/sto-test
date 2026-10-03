"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { Icon, Logo, type IconName } from "./icons";
import {
  initialLibrary,
  formatSize,
  getKind,
  saveBlob,
  getBlob,
  removeBlob,
  type CloudFile,
  type Library,
} from "@/lib/library";

type View = "My files" | "Recent" | "Starred" | "Shared with me" | "Trash";
type ModalState =
  | { type: "folder" }
  | { type: "preview"; file: CloudFile }
  | { type: "share"; file: CloudFile }
  | { type: "rename"; file: CloudFile }
  | { type: "storage" }
  | { type: "help" }
  | null;
const nav: { name: View; icon: IconName }[] = [
  { name: "My files", icon: "grid" },
  { name: "Recent", icon: "clock" },
  { name: "Starred", icon: "star" },
  { name: "Shared with me", icon: "users" },
  { name: "Trash", icon: "trash" },
];
const kindLabel = {
  design: "Design",
  image: "Image",
  document: "Document",
  video: "Video",
  archive: "Archive",
};
const kindIcon: Record<CloudFile["kind"], IconName> = {
  design: "design",
  image: "image",
  document: "file",
  video: "video",
  archive: "archive",
};
const STORAGE_KEY = "nimbus-library-v1";

function Avatar({
  small = false,
  index = 0,
}: {
  small?: boolean;
  index?: number;
}) {
  return (
    <span
      className={`avatar ${small ? "avatar-small" : ""} avatar-${index}`}
      aria-label={["Alex Morgan", "Jamie Lee", "Sam Chen"][index]}
    >
      {["AM", "JL", "SC"][index]}
    </span>
  );
}
function Collaborators() {
  return (
    <span className="collaborators">
      <Avatar small index={1} />
      <Avatar small index={2} />
    </span>
  );
}

function Modal({
  title,
  children,
  close,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () =>
      Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          'button, input, select, textarea, a[href], [tabindex="0"]',
        ) ?? [],
      );
    (
      ref.current?.querySelector<HTMLElement>("[data-autofocus]") ??
      focusable()[0]
    )?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const items = focusable();
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = bodyOverflow;
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [close]);
  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={ref}
        className={`modal ${wide ? "modal-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-head">
          <h2 id="modal-title">{title}</h2>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={close}
          >
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Thumbnail({
  file,
  large = false,
}: {
  file: CloudFile;
  large?: boolean;
}) {
  const [uploadedSrc, setUploadedSrc] = useState<string>();
  useEffect(() => {
    if (!file.uploaded || (file.kind !== "image" && file.kind !== "video"))
      return;
    let url: string | undefined;
    let cancelled = false;
    getBlob(file.id)
      .then((blob) => {
        if (blob && !cancelled) {
          url = URL.createObjectURL(blob);
          setUploadedSrc(url);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [file.id, file.kind, file.uploaded]);
  const src = uploadedSrc ?? file.preview;
  if (src && file.kind !== "video")
    return (
      <Image
        src={src}
        alt={large ? `Preview of ${file.name}` : ""}
        fill
        sizes={
          large
            ? "(max-width: 800px) 90vw, 760px"
            : "(max-width: 600px) 90vw, (max-width: 1000px) 40vw, 25vw"
        }
        className="preview-image"
        loading={large || file.id === "brand-guide" ? "eager" : "lazy"}
        unoptimized={!!uploadedSrc}
      />
    );
  if (uploadedSrc && file.kind === "video" && large)
    return <video src={uploadedSrc} controls className="video-preview" />;
  return (
    <div className={`generic-preview generic-${file.kind}`}>
      <div className="generic-file">
        <Icon name={kindIcon[file.kind]} size={large ? 64 : 42} />
      </div>
      <span>{file.name.split(".").pop()?.toUpperCase()}</span>
    </div>
  );
}

function CloudArt() {
  return (
    <svg
      className="cloud-art"
      width="350"
      height="230"
      viewBox="0 0 350 230"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="cloud-fill"
          x1="120"
          y1="40"
          x2="235"
          y2="180"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" />
          <stop offset=".5" stopColor="#eef4ff" />
          <stop offset="1" stopColor="#8ca8ef" />
        </linearGradient>
        <linearGradient id="tile-fill" x1="105" y1="110" x2="260" y2="220">
          <stop stopColor="#6385ff" />
          <stop offset="1" stopColor="#3256c7" />
        </linearGradient>
        <filter id="shadow">
          <feGaussianBlur stdDeviation="12" />
        </filter>
      </defs>
      <ellipse
        cx="195"
        cy="197"
        rx="90"
        ry="14"
        fill="#102974"
        opacity=".5"
        filter="url(#shadow)"
      />
      <circle cx="188" cy="111" r="91" stroke="#93b5ff" strokeOpacity=".17" />
      <circle cx="188" cy="111" r="115" stroke="#93b5ff" strokeOpacity=".1" />
      <path d="m110 158 78-40 90 45-78 39Z" fill="#799bf9" opacity=".3" />
      <path d="m106 144 80-42 93 48-80 43Z" fill="url(#tile-fill)" />
      <path d="m106 144 93 49v11l-93-48Z" fill="#365ccb" />
      <path d="m199 193 80-43v11l-80 43Z" fill="#244393" />
      <path
        d="M125 140c-22 0-38-15-38-34 0-18 13-32 30-35 3-30 27-52 55-52 25 0 46 17 53 40 24-2 46 17 46 40 0 23-19 41-43 41Z"
        transform="translate(12 18)"
        fill="#7d9ce6"
      />
      <path
        d="M125 140c-22 0-38-15-38-34 0-18 13-32 30-35 3-30 27-52 55-52 25 0 46 17 53 40 24-2 46 17 46 40 0 23-19 41-43 41Z"
        fill="url(#cloud-fill)"
      />
      <path
        d="M174 108V68m-14 14 14-14 14 14"
        stroke="#3e63d1"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g transform="translate(278 44) rotate(13)">
        <rect width="36" height="44" rx="8" fill="#d9f4bc" />
        <path
          d="m11 23 6 6 10-13"
          stroke="#425e32"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <circle cx="76" cy="147" r="6" fill="#bfcefa" />
      <path
        d="M76 58v12m-6-6h12"
        stroke="#d5e0ff"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="281" cy="184" r="3" fill="#b5c9f9" />
    </svg>
  );
}

export default function Workspace() {
  const [library, setLibrary] = useState<Library>(initialLibrary);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<View>("My files");
  const [folder, setFolder] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All files");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState("modified");
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState("");
  const [menu, setMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("blue");
  const [uploading, setUploading] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const dragCount = useRef(0);
  const closeModal = useCallback(() => setModal(null), []);
  useEffect(() => {
    Promise.resolve().then(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Library;
          if (Array.isArray(parsed.files) && Array.isArray(parsed.folders))
            setLibrary(parsed);
        }
      } catch {
        /* A fresh library is available if storage is disabled. */
      }
      setLoaded(true);
    });
  }, []);
  useEffect(() => {
    if (loaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
      } catch {
        /* Browsing remains usable without persistence. */
      }
    }
  }, [library, loaded]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        setMenu(null);
        setNotifications(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (!menu) return;
    const outside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".file-actions")) setMenu(null);
    };
    document.addEventListener("click", outside);
    return () => document.removeEventListener("click", outside);
  }, [menu]);

  const activeFolder = library.folders.find((f) => f.id === folder);
  const count = library.files.filter((f) => !f.deleted).length;
  const folderCounts = new Map(
    library.folders.map((f) => [
      f.id,
      library.files.filter((file) => file.folder === f.id && !file.deleted)
        .length,
    ]),
  );
  const files = useMemo(
    () =>
      library.files
        .filter((f) => {
          if ((view === "Trash") !== f.deleted) return false;
          if (view === "Starred" && !f.starred) return false;
          if (view === "Shared with me" && !f.shared) return false;
          if (folder && f.folder !== folder) return false;
          if (query && !f.name.toLowerCase().includes(query.toLowerCase()))
            return false;
          if (category === "Documents" && f.kind !== "document") return false;
          if (category === "Images" && f.kind !== "image") return false;
          if (category === "Design" && f.kind !== "design") return false;
          return true;
        })
        .sort((a, b) =>
          sort === "name"
            ? a.name.localeCompare(b.name)
            : sort === "size"
              ? b.size - a.size
              : b.modified - a.modified,
        ),
    [library.files, view, folder, query, category, sort],
  );

  function navigate(next: View, folderId: string | null = null) {
    setView(next);
    setFolder(folderId);
    setQuery("");
    setCategory("All files");
    setMobileOpen(false);
    setMenu(null);
  }
  function updateFile(id: string, updates: Partial<CloudFile>) {
    setLibrary((prev) => ({
      ...prev,
      files: prev.files.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    }));
  }
  function openFolderModal() {
    setNewName("");
    setNewColor("blue");
    setModal({ type: "folder" });
  }
  function createFolder(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const created = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      color: newColor,
      shared: false,
    };
    setLibrary((prev) => ({ ...prev, folders: [...prev.folders, created] }));
    setModal(null);
    setToast(`“${created.name}” is ready`);
  }
  async function uploadFiles(incoming: FileList | File[]) {
    const selected = Array.from(incoming);
    if (!selected.length) return;
    setUploading(true);
    const added: CloudFile[] = [];
    try {
      for (const item of selected) {
        const id = crypto.randomUUID();
        await saveBlob(id, item);
        added.push({
          id,
          name: item.name,
          kind: getKind(item),
          size: item.size,
          modified: Date.now(),
          folder,
          starred: false,
          shared: false,
          deleted: false,
          uploaded: true,
        });
      }
    } catch {
      setToast("Your browser couldn’t save that file. Please try again.");
    }
    if (added.length) {
      setLibrary((prev) => ({ ...prev, files: [...added, ...prev.files] }));
      setView("My files");
      setCategory("All files");
      setQuery("");
      setToast(
        `${added.length === 1 ? added[0].name : `${added.length} files`} added to your space`,
      );
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }
  function onDrop(e: DragEvent) {
    e.preventDefault();
    dragCount.current = 0;
    setDragging(false);
    void uploadFiles(e.dataTransfer.files);
  }
  async function download(file: CloudFile) {
    try {
      const blob = file.uploaded
        ? await getBlob(file.id)
        : await fetch(file.source!).then((r) => {
            if (!r.ok) throw new Error("Unavailable");
            return r.blob();
          });
      if (!blob) throw new Error("Unavailable");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setToast("Download started");
    } catch {
      setToast("This file isn’t available to download.");
    }
    setMenu(null);
  }
  async function permanentlyDelete(file: CloudFile) {
    if (file.uploaded) {
      try {
        await removeBlob(file.id);
      } catch {
        setToast("Couldn’t delete this file. Try again.");
        return;
      }
    }
    setLibrary((prev) => ({
      ...prev,
      files: prev.files.filter((f) => f.id !== file.id),
    }));
    setMenu(null);
    setToast("File deleted");
  }
  function fileMenu(file: CloudFile) {
    return (
      <div className="dropdown file-dropdown" role="menu">
        {file.deleted ? (
          <>
            <button
              role="menuitem"
              onClick={() => {
                updateFile(file.id, { deleted: false });
                setMenu(null);
                setToast("File restored to your space");
              }}
            >
              <Icon name="back" size={17} />
              Restore file
            </button>
            <button
              role="menuitem"
              className="danger"
              onClick={() => void permanentlyDelete(file)}
            >
              <Icon name="trash" size={17} />
              Delete permanently
            </button>
          </>
        ) : (
          <>
            <button
              role="menuitem"
              onClick={() => {
                setModal({ type: "preview", file });
                setMenu(null);
              }}
            >
              <Icon name="file" size={17} />
              Open preview
            </button>
            <button
              role="menuitem"
              onClick={() => {
                updateFile(file.id, { starred: !file.starred });
                setMenu(null);
                setToast(
                  file.starred ? "Removed from starred" : "Added to starred",
                );
              }}
            >
              <Icon name="star" size={17} />
              {file.starred ? "Remove star" : "Add to starred"}
            </button>
            <button
              role="menuitem"
              onClick={() => {
                setModal({ type: "share", file });
                setMenu(null);
              }}
            >
              <Icon name="link" size={17} />
              Share preview
            </button>
            <button role="menuitem" onClick={() => void download(file)}>
              <Icon name="download" size={17} />
              Download
            </button>
            <button
              role="menuitem"
              onClick={() => {
                setNewName(file.name);
                setModal({ type: "rename", file });
                setMenu(null);
              }}
            >
              <Icon name="rename" size={17} />
              Rename
            </button>
            <div className="menu-divider" />
            <button
              role="menuitem"
              className="danger"
              onClick={() => {
                updateFile(file.id, { deleted: true });
                setMenu(null);
                setToast("Moved to trash");
              }}
            >
              <Icon name="trash" size={17} />
              Move to trash
            </button>
          </>
        )}
      </div>
    );
  }
  function actionButton(file: CloudFile) {
    return (
      <div className="file-actions">
        <button
          className="icon-button more-button"
          aria-label={`Actions for ${file.name}`}
          aria-expanded={menu === file.id}
          aria-haspopup="menu"
          onClick={(e) => {
            e.stopPropagation();
            setMenu(menu === file.id ? null : file.id);
          }}
        >
          <Icon name="more" size={20} />
        </button>
        {menu === file.id && fileMenu(file)}
      </div>
    );
  }

  return (
    <div
      className="app-shell"
      onDragEnter={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          dragCount.current++;
          setDragging(true);
        }
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        dragCount.current--;
        if (dragCount.current <= 0) setDragging(false);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <a className="skip-link" href="#main-content">
        Skip to files
      </a>
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}
        aria-label="Main navigation"
        inert={!!modal}
      >
        <button
          className="icon-button sidebar-close"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        >
          <Icon name="close" />
        </button>
        <button
          className="brand"
          onClick={() => navigate("My files")}
          aria-label="Nimbus home"
        >
          <Logo />
          <span>
            nimbus<span className="brand-dot">.</span>
          </span>
        </button>
        <div className="workspace-switch">
          <div className="workspace-monogram">
            A<span />
          </div>
          <div>
            <strong>Alex’s workspace</strong>
            <span>Personal account</span>
          </div>
          <Icon name="down" size={15} />
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav className="main-nav">
          {nav.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${view === item.name && !folder ? "active" : ""}`}
              onClick={() => navigate(item.name)}
              aria-current={view === item.name && !folder ? "page" : undefined}
            >
              <Icon name={item.icon} size={21} />
              <span>{item.name}</span>
              {item.name === "My files" && (
                <span className="nav-count">{count}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="nav-caption folder-caption">
          <span>YOUR FOLDERS</span>
          <button
            className="small-icon-button"
            aria-label="Create folder"
            onClick={openFolderModal}
          >
            <Icon name="plus" size={17} />
          </button>
        </div>
        <nav className="folder-nav" aria-label="Folders">
          {library.folders.slice(0, 6).map((item) => (
            <button
              key={item.id}
              className={`nav-item ${folder === item.id ? "folder-active" : ""}`}
              onClick={() => navigate("My files", item.id)}
            >
              <span className={`folder-dot ${item.color}`} />
              <span>{item.name}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-storage">
            <div className="storage-top">
              <Icon name="cloud" size={18} />
              <span>Your storage</span>
              <span className="plan-badge">FREE</span>
            </div>
            <div className="storage-track">
              <span />
            </div>
            <p>
              <strong>42.8 GB</strong> of 100 GB used
            </p>
            <button onClick={() => setModal({ type: "storage" })}>
              Manage storage
              <Icon name="arrow" size={16} />
            </button>
          </div>
          <button
            className="help-button"
            onClick={() => setModal({ type: "help" })}
          >
            <Icon name="help" size={19} />
            Help & feedback
            <Icon name="chevron" size={15} />
          </button>
          <div className="sidebar-user">
            <Avatar />
            <div>
              <strong>Alex Morgan</strong>
              <span>Personal workspace</span>
            </div>
            <span className="online-dot" title="Local demo is ready" />
          </div>
        </div>
      </aside>

      <div className="main-shell" inert={!!modal || mobileOpen}>
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Icon name="menu" />
            </button>
            <span className="breadcrumb-icon">
              <Icon name="cloud" size={20} />
            </span>
            <span>Personal workspace</span>
            <Icon name="chevron" size={14} />
            <strong>{activeFolder?.name ?? view}</strong>
          </div>
          <div className="topbar-right">
            <label className="search">
              <Icon name="search" size={19} />
              <input
                ref={searchRef}
                aria-label="Search files"
                placeholder="Search your files"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <kbd>⌘ K</kbd>
              {query && (
                <button aria-label="Clear search" onClick={() => setQuery("")}>
                  <Icon name="close" size={16} />
                </button>
              )}
            </label>
            <div className="notification-wrap">
              <button
                className={`icon-button notification-button ${notifications ? "selected" : ""}`}
                aria-label="Notifications"
                aria-expanded={notifications}
                onClick={() => setNotifications(!notifications)}
              >
                <Icon name="bell" />
                <span />
              </button>
              {notifications && (
                <div className="dropdown notifications">
                  <strong>You’re all caught up</strong>
                  <p>A little calm. No new notifications.</p>
                  <span className="notification-check">
                    <Icon name="check" size={24} />
                  </span>
                </div>
              )}
            </div>
            <div className="top-avatar">
              <Avatar />
            </div>
          </div>
        </header>

        <main id="main-content" className="main-content">
          <div className="page-heading">
            <div>
              {activeFolder && (
                <button
                  className="back-link"
                  onClick={() => navigate("My files")}
                >
                  <Icon name="back" size={17} />
                  My files
                </button>
              )}
              <div className="heading-eyebrow">
                A LITTLE SPACE FOR EVERYTHING
              </div>
              <h1>
                {activeFolder?.name ?? view}
                <span className="heading-period">.</span>
              </h1>
              <p>
                {folder
                  ? "Good things, all in one place."
                  : view === "My files"
                    ? "Your ideas. Your memories. All right here."
                    : view === "Starred"
                      ? "The good stuff, always within reach."
                      : view === "Trash"
                        ? "A second chance for the things you let go."
                        : view === "Shared with me"
                          ? "Better things happen together."
                          : "Pick up right where you left off."}
              </p>
            </div>
            <div className="heading-actions">
              <button
                className="button button-secondary"
                onClick={openFolderModal}
              >
                <Icon name="plus" size={19} />
                New folder
              </button>
              <button
                className="button button-primary"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                <Icon name="upload" size={19} />
                {uploading ? "Adding files…" : "Upload files"}
              </button>
            </div>
          </div>
          <input
            type="file"
            ref={inputRef}
            multiple
            hidden
            aria-label="Choose files to upload"
            onChange={(e) => {
              if (e.target.files) void uploadFiles(e.target.files);
            }}
          />

          {view === "My files" && !folder && !query && (
            <>
              <section className="overview" aria-label="Workspace overview">
                <div className="welcome-card">
                  <div className="welcome-copy">
                    <span className="welcome-tag">
                      <span />A little less clutter
                    </span>
                    <h2>
                      Room for your
                      <br />
                      next big idea.
                    </h2>
                    <button onClick={openFolderModal}>
                      Make yourself at home
                      <Icon name="arrow" size={19} />
                    </button>
                  </div>
                  <CloudArt />
                </div>
                <button
                  className="storage-card"
                  onClick={() => setModal({ type: "storage" })}
                >
                  <div className="storage-card-top">
                    <span>Space to grow</span>
                    <span className="storage-card-icon">
                      <Icon name="cloud" size={21} />
                    </span>
                  </div>
                  <div className="storage-amount">
                    42.8<span>GB</span>
                  </div>
                  <p>of 100 GB used</p>
                  <div className="segmented-track">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="storage-card-bottom">
                    <span>
                      <i />
                      57.2 GB free
                    </span>
                    <Icon name="arrow" size={18} />
                  </div>
                </button>
              </section>
              <section
                className="folder-section"
                aria-labelledby="folder-title"
              >
                <div className="section-heading">
                  <h2 id="folder-title">
                    Your folders<span>{library.folders.length}</span>
                  </h2>
                  <button className="text-button" onClick={openFolderModal}>
                    New folder
                    <Icon name="plus" size={16} />
                  </button>
                </div>
                <div className="folder-grid">
                  {library.folders.map((item) => (
                    <button
                      key={item.id}
                      className={`folder-card ${item.color}`}
                      onClick={() => navigate("My files", item.id)}
                    >
                      <div className="folder-card-top">
                        <span className={`big-folder ${item.color}`}>
                          <span />
                        </span>
                        <span className="folder-open">
                          <Icon name="arrow" size={18} />
                        </span>
                      </div>
                      <h3>{item.name}</h3>
                      <div className="folder-card-bottom">
                        <span>{`${folderCounts.get(item.id)} ${folderCounts.get(item.id) === 1 ? "file" : "files"}`}</span>
                        {item.shared ? (
                          <Collaborators />
                        ) : (
                          <span className="private-label">
                            <Icon name="shield" size={13} />
                            Only you
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}

          <section className="files-section" aria-labelledby="files-title">
            <div className="section-heading files-heading">
              <h2 id="files-title">
                {query
                  ? "Search results"
                  : folder
                    ? "Files in this folder"
                    : view === "My files"
                      ? "All files"
                      : view === "Trash"
                        ? "Deleted files"
                        : `${view === "Recent" ? "Recent" : view === "Starred" ? "Starred" : "Shared"} files`}
                <span>{files.length}</span>
              </h2>
              <div className="files-heading-right">
                <label className="sort-control">
                  <span className="sr-only">Sort files</span>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option value="modified">Last modified</option>
                    <option value="name">Name A–Z</option>
                    <option value="size">Largest first</option>
                  </select>
                  <Icon name="down" size={15} />
                </label>
                <div className="view-toggle" aria-label="File display">
                  <button
                    aria-label="Grid view"
                    aria-pressed={layout === "grid"}
                    className={layout === "grid" ? "selected" : ""}
                    onClick={() => setLayout("grid")}
                  >
                    <Icon name="grid" size={18} />
                  </button>
                  <button
                    aria-label="List view"
                    aria-pressed={layout === "list"}
                    className={layout === "list" ? "selected" : ""}
                    onClick={() => setLayout("list")}
                  >
                    <Icon name="list" size={20} />
                  </button>
                </div>
              </div>
            </div>
            <div className="file-toolbar">
              <div
                className="category-tabs"
                role="tablist"
                aria-label="File types"
              >
                {["All files", "Documents", "Images", "Design"].map((item) => (
                  <button
                    key={item}
                    role="tab"
                    aria-selected={category === item}
                    className={category === item ? "active" : ""}
                    id={`tab-${item.replaceAll(" ", "-").toLowerCase()}`}
                    aria-controls="files-panel"
                    tabIndex={category === item ? 0 : -1}
                    onKeyDown={(e) => {
                      const tabs = [
                        "All files",
                        "Documents",
                        "Images",
                        "Design",
                      ];
                      const index = tabs.indexOf(item);
                      if (
                        ["ArrowRight", "ArrowLeft", "Home", "End"].includes(
                          e.key,
                        )
                      ) {
                        e.preventDefault();
                        const next =
                          e.key === "Home"
                            ? tabs[0]
                            : e.key === "End"
                              ? tabs[3]
                              : tabs[
                                  (index + (e.key === "ArrowRight" ? 1 : 3)) % 4
                                ];
                        setCategory(next);
                        document
                          .getElementById(
                            `tab-${next.replaceAll(" ", "-").toLowerCase()}`,
                          )
                          ?.focus();
                      }
                    }}
                    onClick={() => setCategory(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <span className="file-hint">
                <Icon name="shield" size={15} />
                Just for you. Safe with us.
              </span>
            </div>

            <div
              id="files-panel"
              role="tabpanel"
              aria-labelledby={`tab-${category.replaceAll(" ", "-").toLowerCase()}`}
              tabIndex={0}
            >
              {files.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <Icon
                      name={
                        query ? "search" : view === "Trash" ? "trash" : "folder"
                      }
                      size={34}
                    />
                  </div>
                  <h3>
                    {query
                      ? "Nothing by that name"
                      : view === "Trash"
                        ? "A clean slate"
                        : "A little room for something good"}
                  </h3>
                  <p>
                    {query
                      ? "Try a different name or file type."
                      : view === "Starred"
                        ? "Star a file to keep it close."
                        : view === "Trash"
                          ? "Your deleted files will appear here."
                          : "Add a file and make this space yours."}
                  </p>
                  {query ? (
                    <button
                      className="button button-secondary"
                      onClick={() => {
                        setQuery("");
                        setCategory("All files");
                      }}
                    >
                      Clear search
                    </button>
                  ) : (
                    view !== "Starred" &&
                    view !== "Trash" && (
                      <button
                        className="button button-primary"
                        onClick={() => inputRef.current?.click()}
                      >
                        <Icon name="upload" size={18} />
                        Upload files
                      </button>
                    )
                  )}
                </div>
              ) : layout === "grid" ? (
                <div className="file-grid">
                  {files.map((file) => (
                    <article className="file-card" key={file.id}>
                      <button
                        className="file-cover"
                        aria-label={`Preview ${file.name}`}
                        onClick={() => setModal({ type: "preview", file })}
                      >
                        <Thumbnail file={file} />
                        <span className={`file-type-tag type-${file.kind}`}>
                          {file.name.split(".").pop()?.toUpperCase()}
                        </span>
                        <span className="cover-open">
                          <Icon name="arrow" size={20} />
                        </span>
                      </button>
                      <div className="file-info">
                        <span className={`file-kind-icon type-${file.kind}`}>
                          <Icon name={kindIcon[file.kind]} size={20} />
                        </span>
                        <div className="file-details">
                          <button
                            onClick={() => setModal({ type: "preview", file })}
                          >
                            {file.name}
                          </button>
                          <span>
                            {formatSize(file.size)}
                            <i /> {kindLabel[file.kind]}
                          </span>
                        </div>
                        {actionButton(file)}
                      </div>
                      <div className="file-card-footer">
                        <span>
                          {file.modified >=
                          new Date("2026-10-03T00:00:00+05:30").getTime()
                            ? "Today"
                            : new Date(file.modified).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  timeZone: "Asia/Kolkata",
                                },
                              )}
                        </span>
                        <div>
                          {file.shared && <Icon name="users" size={15} />}
                          <button
                            aria-label={`${file.starred ? "Unstar" : "Star"} ${file.name}`}
                            className={`star-button ${file.starred ? "is-starred" : ""}`}
                            onClick={() =>
                              updateFile(file.id, { starred: !file.starred })
                            }
                          >
                            <Icon name="star" size={17} />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="list-wrapper">
                  <table className="file-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Last modified</th>
                        <th>Size</th>
                        <th>Sharing</th>
                        <th>
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map((file) => (
                        <tr key={file.id}>
                          <td>
                            <button
                              className="list-name"
                              onClick={() =>
                                setModal({ type: "preview", file })
                              }
                            >
                              <span
                                className={`file-kind-icon type-${file.kind}`}
                              >
                                <Icon name={kindIcon[file.kind]} size={23} />
                              </span>
                              <span>{file.name}</span>
                              {file.starred && (
                                <Icon
                                  name="star"
                                  size={15}
                                  className="starred-icon"
                                />
                              )}
                            </button>
                          </td>
                          <td>
                            {new Date(file.modified).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                timeZone: "Asia/Kolkata",
                              },
                            )}
                          </td>
                          <td>{formatSize(file.size)}</td>
                          <td>
                            {file.shared ? (
                              <Collaborators />
                            ) : (
                              <span className="table-private">Only you</span>
                            )}
                          </td>
                          <td>{actionButton(file)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="workspace-footer">
              <span>
                <span className="status-dot" />
                All in a good place
              </span>
              <span>
                {files.length} {files.length === 1 ? "file" : "files"}
                <span className="footer-separator">·</span>Made for a clearer
                mind
              </span>
            </div>
          </section>
        </main>
      </div>

      {dragging && (
        <div className="drop-overlay">
          <div>
            <span className="drop-cloud">
              <Icon name="upload" size={45} />
            </span>
            <h2>A soft landing for your files.</h2>
            <p>Drop them here to add to your space.</p>
          </div>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <span>
            <Icon name="check" size={16} />
          </span>
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}

      {modal && (
        <Modal
          title={
            modal.type === "folder"
              ? "A new place for good things"
              : modal.type === "preview"
                ? modal.file.name
                : modal.type === "share"
                  ? "Better together"
                  : modal.type === "rename"
                    ? "Give it a new name"
                    : modal.type === "storage"
                      ? "Space for what matters"
                      : "Make yourself at home"
          }
          close={closeModal}
          wide={modal.type === "preview"}
        >
          {modal.type === "folder" && (
            <form onSubmit={createFolder} className="modal-body">
              <p className="modal-description">
                Start with a name. Fill it with ideas.
              </p>
              <label className="field-label" htmlFor="folder-name">
                Folder name
              </label>
              <input
                id="folder-name"
                className="text-input"
                data-autofocus
                placeholder="Something wonderful"
                value={newName}
                maxLength={48}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
              <label className="field-label">A little color</label>
              <div className="color-picker">
                {["blue", "peach", "purple", "mint"].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`color-option ${color} ${newColor === color ? "chosen" : ""}`}
                    aria-label={`${color} folder`}
                    aria-pressed={newColor === color}
                    onClick={() => setNewColor(color)}
                  >
                    {newColor === color && <Icon name="check" size={20} />}
                  </button>
                ))}
              </div>
              <div className="modal-buttons">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  className="button button-primary"
                  disabled={!newName.trim()}
                  type="submit"
                >
                  <Icon name="plus" size={18} />
                  Create folder
                </button>
              </div>
            </form>
          )}
          {modal.type === "rename" && (
            <form
              className="modal-body"
              onSubmit={(e) => {
                e.preventDefault();
                if (newName.trim()) {
                  updateFile(modal.file.id, { name: newName.trim() });
                  closeModal();
                  setToast("File renamed");
                }
              }}
            >
              <label className="field-label" htmlFor="file-name">
                File name
              </label>
              <input
                id="file-name"
                data-autofocus
                className="text-input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={150}
                required
              />
              <div className="modal-buttons">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={!newName.trim()}
                >
                  Save name
                </button>
              </div>
            </form>
          )}
          {modal.type === "preview" && (
            <>
              <div
                className={`large-preview ${modal.file.kind === "document" ? "document-preview" : ""}`}
              >
                <Thumbnail file={modal.file} large />
              </div>
              <div className="preview-footer">
                <span>
                  <span className={`file-kind-icon type-${modal.file.kind}`}>
                    <Icon name={kindIcon[modal.file.kind]} size={19} />
                  </span>
                  {kindLabel[modal.file.kind]}
                  <i />
                  {formatSize(modal.file.size)}
                </span>
                <button
                  className="button button-primary"
                  onClick={() => void download(modal.file)}
                >
                  <Icon name="download" size={18} />
                  Download
                </button>
              </div>
            </>
          )}
          {modal.type === "share" && (
            <div className="modal-body">
              <div className="share-file">
                <span className={`file-kind-icon type-${modal.file.kind}`}>
                  <Icon name={kindIcon[modal.file.kind]} size={24} />
                </span>
                <div>
                  <strong>{modal.file.name}</strong>
                  <span>{formatSize(modal.file.size)}</span>
                </div>
              </div>
              <div className="share-note">
                <Icon name="shield" size={20} />
                <div>
                  <strong>Private by default</strong>
                  <p>
                    This frontend demo keeps files in your browser. Cloud
                    sharing can be connected later.
                  </p>
                </div>
              </div>
              <button
                className="button button-primary full-width"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(modal.file.name);
                    setToast("File name copied");
                    closeModal();
                  } catch {
                    setToast("Clipboard unavailable in this browser");
                  }
                }}
              >
                <Icon name="link" size={18} />
                Copy file name
              </button>
            </div>
          )}
          {modal.type === "storage" && (
            <div className="modal-body">
              <div className="storage-modal-number">
                42.8 <span>GB of 100 GB</span>
              </div>
              <div className="segmented-track storage-modal-track">
                <span />
                <span />
                <span />
              </div>
              <div className="storage-breakdown">
                {[
                  { name: "Images", size: "24.6 GB", color: "#3154ef" },
                  { name: "Documents", size: "12.4 GB", color: "#92a3f4" },
                  { name: "Other files", size: "5.8 GB", color: "#c6d0fc" },
                ].map((item) => (
                  <div key={item.name}>
                    <span>
                      <i style={{ background: item.color }} />
                      {item.name}
                    </span>
                    <strong>{item.size}</strong>
                  </div>
                ))}
              </div>
              <div className="storage-soft-note">
                <Icon name="sparkle" size={20} />
                <p>
                  Plenty of room for your next big idea.
                  <span>Illustrative storage usage for this demo.</span>
                </p>
              </div>
              <button
                className="button button-primary full-width"
                onClick={closeModal}
              >
                Sounds good
                <Icon name="check" size={18} />
              </button>
            </div>
          )}
          {modal.type === "help" && (
            <div className="modal-body">
              <div className="help-illustration">
                <Logo />
                <span>A calmer place for your files.</span>
              </div>
              <p className="modal-description">
                Search, organize, and preview your files. Drag a file anywhere
                to add it, or press <kbd>⌘ K</kbd> to find something.
              </p>
              <div className="share-note">
                <Icon name="cloud" size={22} />
                <div>
                  <strong>Your own little corner</strong>
                  <p>
                    This is a frontend demo. Files and folders stay in this
                    browser—no account or server needed.
                  </p>
                </div>
              </div>
              <button
                className="button button-primary full-width"
                onClick={closeModal}
              >
                Got it
                <Icon name="arrow" size={18} />
              </button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
