const baseIconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
}

export function BookIcon(props) {
  return (
    <svg width="17" height="17" strokeWidth="2" {...baseIconProps} {...props}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

export function BowlIcon(props) {
  return (
    <svg width="17" height="17" strokeWidth="2" {...baseIconProps} {...props}>
      <ellipse cx="12" cy="11" rx="9" ry="5" />
      <path d="M3 11c0 4.418 4.03 8 9 8s9-3.582 9-8" />
      <line x1="12" y1="3" x2="12" y2="6" />
    </svg>
  )
}

export function FireIcon(props) {
  return (
    <svg width="17" height="17" strokeWidth="2" {...baseIconProps} {...props}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  )
}

export function CameraIcon(props) {
  return (
    <svg width="17" height="17" strokeWidth="2" {...baseIconProps} {...props}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

export function ClipIcon(props) {
  return (
    <svg width="17" height="17" strokeWidth="2" {...baseIconProps} {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}

export function GraduationIcon(props) {
  return (
    <svg width="17" height="17" strokeWidth="2" {...baseIconProps} {...props}>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  )
}

export function GridIcon(props) {
  return (
    <svg width="17" height="17" strokeWidth="2" {...baseIconProps} {...props}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  )
}

export function WarnIcon(props) {
  return (
    <svg width="13" height="13" strokeWidth="2.5" {...baseIconProps} {...props}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

export function SearchIcon(props) {
  return (
    <svg width="15" height="15" strokeWidth="2" {...baseIconProps} {...props}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

export function CloseIcon(props) {
  return (
    <svg width="14" height="14" strokeWidth="2.5" {...baseIconProps} {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export function CheckIcon(props) {
  return (
    <svg width="13" height="13" strokeWidth="2.5" {...baseIconProps} {...props}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function FilterIcon(props) {
  return (
    <svg width="15" height="15" strokeWidth="2" {...baseIconProps} {...props}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}

export const Ico = {
  book: <BookIcon />,
  bowl: <BowlIcon />,
  fire: <FireIcon />,
  cam: <CameraIcon />,
  clip: <ClipIcon />,
  grad: <GraduationIcon />,
  grid: <GridIcon />,
  warn: <WarnIcon />,
  search: <SearchIcon />,
  close: <CloseIcon />,
  check: <CheckIcon />,
  filter: <FilterIcon />,
}
