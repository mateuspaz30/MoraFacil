export default function WhatsAppIcon({ size = 24 }) {
  return (
    <svg
      className="whatsapp-brand-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M20 11.5a8.5 8.5 0 0 1-12.58 7.45L4 20l1.08-3.23A8.5 8.5 0 1 1 20 11.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 8.5c.5 2.3 2.2 4 4.5 4.5l1-1.2 2 .8c-.1 1.5-1.2 2.3-2.6 2.2-3.8-.4-6.3-2.9-6.7-6.7-.1-1.4.7-2.5 2.2-2.6l.8 2L9 8.5Z"
        fill="currentColor"
      />
    </svg>
  )
}
