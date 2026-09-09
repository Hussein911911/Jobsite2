import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

function base(props: P) {
  return {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    width: "1em",
    height: "1em",
    ...props,
  };
}

/* شعار المكتب: كبسولة داخل درع */
export function LogoMark(props: P) {
  return (
    <svg {...base(props)} strokeWidth={1.6}>
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" fill="currentColor" stroke="none" opacity="0.16" />
      <path d="M8.2 15.8 15.8 8.2a3.4 3.4 0 0 1 4.8 4.8l-7.6 7.6a3.4 3.4 0 0 1-4.8-4.8Z" transform="translate(-1.6 -1.6)" />
      <path d="M6.8 12.4 11.6 7.6" transform="translate(-1.6 -1.6)" />
      <path d="M12 5.2v2M5.2 12h2" opacity="0.7" transform="translate(-1.6 -1.6)" />
    </svg>
  );
}

export function PillIcon(props: P) {
  return (
    <svg {...base(props)}>
      <path d="M10.2 5.4 18.6 13.8a4.2 4.2 0 0 1-6 6L4.2 11.4a4.2 4.2 0 0 1 6-6Z" />
      <path d="M7.2 8.4l6 6" />
    </svg>
  );
}

export function CoinsIcon(props: P) {
  return (
    <svg {...base(props)}>
      <ellipse cx="9" cy="7" rx="6" ry="2.8" />
      <path d="M3 7v5c0 1.55 2.69 2.8 6 2.8 1.2 0 2.3-.16 3.2-.44" />
      <path d="M3 12v5c0 1.55 2.69 2.8 6 2.8.7 0 1.37-.05 2-.15" />
      <circle cx="16.5" cy="15.5" r="4.6" />
      <path d="M16.5 13.4v4.2M14.9 14.6c.4-.5 2.7-.7 2.9.4.2 1-2.7 1-2.6 2 .1.9 2.2.8 2.7.2" />
    </svg>
  );
}

export function AlertIcon(props: P) {
  return (
    <svg {...base(props)}>
      <path d="M12 4.2 2.9 19.4h18.2L12 4.2Z" />
      <path d="M12 10v4.4" />
      <circle cx="12" cy="17" r="0.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CalendarClockIcon(props: P) {
  return (
    <svg {...base(props)}>
      <path d="M8 3.5H5.5a2 2 0 0 0-2 2V16a2 2 0 0 0 2 2h1" />
      <path d="M16 3.5h2.5a2 2 0 0 1 2 2V9" />
      <path d="M3.5 8h17" />
      <path d="M8 2v3M16 2v3" />
      <circle cx="16.5" cy="15.5" r="4.8" />
      <path d="M16.5 13.2v2.3l1.7 1.3" />
    </svg>
  );
}

export function SearchIcon(props: P) {
  return (
    <svg {...base(props)}>
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="m20 20-4.8-4.8" />
    </svg>
  );
}

export function PlusIcon(props: P) {
  return (
    <svg {...base(props)} strokeWidth={2.2}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function PrinterIcon(props: P) {
  return (
    <svg {...base(props)}>
      <path d="M7 8V3.5h10V8" />
      <rect x="4" y="8" width="16" height="8.5" rx="2" />
      <path d="M7 13.5h10V21H7v-7.5Z" fill="white" fillOpacity="0" />
      <path d="M7 21v-7h10v7" />
      <path d="M16.6 10.8h.9" />
    </svg>
  );
}

export function DownloadIcon(props: P) {
  return (
    <svg {...base(props)}>
      <path d="M12 3.5V15m0 0 4-4m-4 4-4-4" />
      <path d="M4 15.5v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

export function PencilIcon(props: P) {
  return (
    <svg {...base(props)}>
      <path d="m14.5 5 4.5 4.5L8.5 20H4v-4.5L14.5 5Z" />
      <path d="m12.5 7 4.5 4.5" />
    </svg>
  );
}

export function TrashIcon(props: P) {
  return (
    <svg {...base(props)}>
      <path d="M4.5 6.5h15M9.5 6V4.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V6" />
      <path d="M6.5 6.5 7.4 19a1.6 1.6 0 0 0 1.6 1.5h6A1.6 1.6 0 0 0 16.6 19l.9-12.5" />
      <path d="M10 10.5v6M14 10.5v6" />
    </svg>
  );
}

export function XIcon(props: P) {
  return (
    <svg {...base(props)} strokeWidth={2.1}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function CheckIcon(props: P) {
  return (
    <svg {...base(props)} strokeWidth={2.2}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

export function InfoIcon(props: P) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5" />
      <circle cx="12" cy="8" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function BoxIcon(props: P) {
  return (
    <svg {...base(props)}>
      <path d="M12 3 3.5 7.5v9L12 21l8.5-4.5v-9L12 3Z" />
      <path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" />
    </svg>
  );
}

export function SortIcon({ dir, ...props }: P & { dir?: "asc" | "desc" | null }) {
  return (
    <svg {...base(props)} strokeWidth={2}>
      <path d="m8 9 4-4 4 4" opacity={dir === "desc" ? 0.25 : 1} />
      <path d="m8 15 4 4 4-4" opacity={dir === "asc" ? 0.25 : 1} />
    </svg>
  );
}

export function RestoreIcon(props: P) {
  return (
    <svg {...base(props)}>
      <path d="M4.5 8A8.5 8.5 0 1 1 3.5 13" />
      <path d="M4.5 3.5V8H9" />
    </svg>
  );
}

export function FlaskIcon(props: P) {
  return (
    <svg {...base(props)}>
      <path d="M9.5 3.5h5M10.5 3.5v5.2L4.8 18.6A1.8 1.8 0 0 0 6.4 21h11.2a1.8 1.8 0 0 0 1.6-2.4L13.5 8.7V3.5" />
      <path d="M7.2 15.5h9.6" />
    </svg>
  );
}

export function ChevronDownIcon(props: P) {
  return (
    <svg {...base(props)} strokeWidth={2}>
      <path d="m6 9.5 6 6 6-6" />
    </svg>
  );
}

export function DashboardIcon(props: P) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="3.5" width="7.2" height="7.2" rx="2" />
      <rect x="13.3" y="3.5" width="7.2" height="4.6" rx="2" />
      <rect x="13.3" y="10.7" width="7.2" height="9.8" rx="2" />
      <rect x="3.5" y="13.3" width="7.2" height="7.2" rx="2" />
    </svg>
  );
}

export function CartIcon(props: P) {
  return (
    <svg {...base(props)}>
      <path d="M3 4h2.2l2.1 11h11.2l2-8H6" />
      <circle cx="9" cy="19.5" r="1.4" />
      <circle cx="17" cy="19.5" r="1.4" />
    </svg>
  );
}

export function ChartIcon(props: P) {
  return (
    <svg {...base(props)}>
      <path d="M4 4v15.5a.5.5 0 0 0 .5.5H20" />
      <rect x="7" y="12" width="3" height="5.5" rx="1" />
      <rect x="12" y="8" width="3" height="9.5" rx="1" />
      <rect x="17" y="5" width="3" height="12.5" rx="1" />
    </svg>
  );
}

export function BellIcon(props: P) {
  return (
    <svg {...base(props)}>
      <path d="M12 4a5.5 5.5 0 0 0-5.5 5.5c0 4.2-1.5 5.7-1.5 5.7h14s-1.5-1.5-1.5-5.7A5.5 5.5 0 0 0 12 4Z" />
      <path d="M10 18.5a2 2 0 0 0 4 0" />
      <path d="M12 2.5V4" />
    </svg>
  );
}

export function GearIcon(props: P) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.8 13.2 5a7.4 7.4 0 0 1 2.4 1l2.5-.6 1.3 2.2-1.8 1.8c.2.8.2 1.6 0 2.4l1.8 1.8-1.3 2.2-2.5-.6a7.4 7.4 0 0 1-2.4 1L12 21.2 10.8 19a7.4 7.4 0 0 1-2.4-1l-2.5.6-1.3-2.2 1.8-1.8a7.4 7.4 0 0 1 0-2.4L4.6 10.4l1.3-2.2 2.5.6a7.4 7.4 0 0 1 2.4-1L12 2.8Z" />
    </svg>
  );
}

export function LogoutIcon(props: P) {
  return (
    <svg {...base(props)}>
      <path d="M14 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7" />
      <path d="M16 8.5 19.5 12 16 15.5M19.5 12H9.5" />
    </svg>
  );
}

export function UserIcon(props: P) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.8 20a7.3 7.3 0 0 1 14.4 0" />
    </svg>
  );
}

export function LockIcon(props: P) {
  return (
    <svg {...base(props)}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
      <circle cx="12" cy="15.3" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function EyeIcon(props: P) {
  return (
    <svg {...base(props)}>
      <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  );
}

export function EyeOffIcon(props: P) {
  return (
    <svg {...base(props)}>
      <path d="M4 4l16 16" />
      <path d="M9.9 5.2A9.8 9.8 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-2.8 3.6M6.1 7.4A16 16 0 0 0 2.5 12S6 19 12 19a9 9 0 0 0 3.9-.9" />
      <path d="M9.5 9.8a2.8 2.8 0 0 0 4 3.9" />
    </svg>
  );
}

export function ReceiptIcon(props: P) {
  return (
    <svg {...base(props)}>
      <path d="M6 3.5h12V21l-2.4-1.5L13.2 21l-2.4-1.5L8.4 21 6 19.5V3.5Z" />
      <path d="M9 8h6M9 11.5h6M9 15h3.5" />
    </svg>
  );
}

export function ArrowLeftIcon(props: P) {
  return (
    <svg {...base(props)} strokeWidth={2}>
      <path d="M19 12H5m0 0 6 6m-6-6 6-6" />
    </svg>
  );
}

export function ShieldIcon(props: P) {
  return (
    <svg {...base(props)}>
      <path d="M12 3 5 5.8v5.4c0 4.5 3 7.8 7 9.3 4-1.5 7-4.8 7-9.3V5.8L12 3Z" />
      <path d="m9 11.8 2.2 2.2L15.4 9.6" />
    </svg>
  );
}

export function SpinnerIcon(props: P) {
  return (
    <svg {...base(props)} strokeWidth={2.4}>
      <path d="M12 3.5A8.5 8.5 0 1 1 3.5 12" />
    </svg>
  );
}

export function TruckIcon(props: P) {
  return (
    <svg {...base(props)}>
      <path d="M2.5 5.5h11v10h-11z" />
      <path d="M13.5 9h4l3 3.5v3h-7" />
      <circle cx="6.5" cy="17.5" r="1.8" />
      <circle cx="16.5" cy="17.5" r="1.8" />
      <path d="M2.5 15.5v-2" />
    </svg>
  );
}

export function CashIcon(props: P) {
  return (
    <svg {...base(props)}>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.8" />
      <path d="M5.8 9.2h.01M18.2 14.8h.01" strokeWidth={2.4} />
    </svg>
  );
}
