import type { CSSProperties } from "react";
const paths = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.7" />
      <rect x="14" y="3" width="7" height="7" rx="1.7" />
      <rect x="3" y="14" width="7" height="7" rx="1.7" />
      <rect x="14" y="14" width="7" height="7" rx="1.7" />
    </>
  ),
  folder: (
    <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  star: (
    <path d="m12 3 2.8 5.7 6.3.9-4.5 4.4 1 6.2-5.6-3-5.6 3 1-6.2-4.5-4.4 6.3-.9Z" />
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.9" />
      <circle cx="9" cy="7" r="4" />
      <path d="M16 3.1a4 4 0 0 1 0 7.8" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18M9 6V3h6v3m-10 0 1 14h12l1-14M10 10v6m4-6v6" />
    </>
  ),
  settings: (
    <>
      <path d="m9 3-1 3-3 1-2 3 2 2-1 3 2 3 3-1 2 3h3l1-3 3-1 2-3-2-2 1-3-2-3-3 1-2-3Z" />
      <circle cx="11.5" cy="11.5" r="3" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 0 1 5 .4c0 1.7-2.5 1.9-2.5 3.6M12 17h.01" />
    </>
  ),
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="7" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  bell: (
    <>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9m4 12a2 2 0 0 0 4 0" />
    </>
  ),
  chevron: <path d="m9 5 7 7-7 7" />,
  down: <path d="m6 9 6 6 6-6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  upload: (
    <>
      <path d="M12 16V3m-5 5 5-5 5 5M4 15v5h16v-5" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
  list: (
    <>
      <path d="M9 6h12M9 12h12M9 18h12M3 6h.01M3 12h.01M3 18h.01" />
    </>
  ),
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  file: (
    <>
      <path d="M14 3H5v18h14V8Zm0 0v5h5M8 13h8m-8 4h5" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8" cy="8" r="1.5" />
      <path d="m21 15-6-6-12 12" />
    </>
  ),
  design: (
    <>
      <path d="M12 3v18M7 3h10a5 5 0 0 1 0 10h-5m-5-10a5 5 0 0 0 0 10h5m-5 0a4 4 0 1 0 5 4" />
      <circle cx="17" cy="8" r=".1" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m10 9 5 3-5 3Z" />
    </>
  ),
  close: <path d="m6 6 12 12M6 18 18 6" />,
  check: <path d="m5 12 4 4 10-10" />,
  download: (
    <>
      <path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" />
    </>
  ),
  link: (
    <>
      <path
        d="m10 13 4-4m-7 6-2 2a4 4 0 0 0 6 6l4-4a4 4 0 0 0 0-6m2-4 2-2a4 4 0 0 0-6-6l-4 4a4 4 0 0 0 0 6"
        transform="translate(0 -2)"
      />
    </>
  ),
  shield: (
    <>
      <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  cloud: <path d="M6 18a5 5 0 0 1-1-9.9 7 7 0 0 1 13-1A5.5 5.5 0 1 1 19 18Z" />,
  back: <path d="M19 12H5m5-5-5 5 5 5" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  sparkle: (
    <>
      <path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4Z" />
      <path d="m20 2 .6 1.4L22 4l-1.4.6L20 6l-.6-1.4L18 4l1.4-.6Z" />
    </>
  ),
  archive: (
    <>
      <path d="M3 3h18v5H3Zm2 5v13h14V8M10 12h4" />
    </>
  ),
  rename: (
    <>
      <path d="m15 4 5 5M4 20l4-1L21 6l-5-5L3 14l-1 7Z" />
    </>
  ),
} satisfies Record<string, React.ReactNode>;
export type IconName = keyof typeof paths;
export function Icon({
  name,
  size = 20,
  className = "",
  style,
}: {
  name: IconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
export function Logo() {
  return (
    <svg
      width="35"
      height="35"
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="12" fill="#3154ef" />
      <path
        d="M10 26V17.5a5 5 0 0 1 10 0V26m0-8.5a5 5 0 0 1 10 0V26"
        stroke="white"
        strokeWidth="4.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
