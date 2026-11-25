export function makeEmojiAvatar(emoji: string, bg1: string, bg2: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bg1}"/>
        <stop offset="100%" stop-color="${bg2}"/>
      </linearGradient>
    </defs>
    <rect width="160" height="160" fill="url(#g)"/>
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-size="82" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif">${emoji}</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function makeInitialsAvatar(initials: string, bg: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <rect width="160" height="160" fill="${bg}"/>
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="60" font-weight="700" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif">${initials}</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function makeMemeCardImage(topText: string, emoji: string, bottomText: string, bg1: string, bg2: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="360" viewBox="0 0 520 360">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bg1}"/>
        <stop offset="100%" stop-color="${bg2}"/>
      </linearGradient>
    </defs>
    <rect width="520" height="360" fill="url(#bg)"/>
    <text x="260" y="62" text-anchor="middle" fill="#ffffff" font-size="28" font-weight="900" font-family="Impact, Arial Black, sans-serif" letter-spacing="1">${escapeXml(topText)}</text>
    <text x="260" y="205" text-anchor="middle" font-size="116" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif">${emoji}</text>
    <text x="260" y="318" text-anchor="middle" fill="#ffffff" font-size="26" font-weight="900" font-family="Impact, Arial Black, sans-serif" letter-spacing="1">${escapeXml(bottomText)}</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export const PRESET_AVATARS = [
  { label: 'Mom', url: makeEmojiAvatar('💐', '#f472b6', '#be185d') },
  { label: 'Boss', url: makeEmojiAvatar('💼', '#475569', '#1e293b') },
  { label: 'Bestie', url: makeEmojiAvatar('💅', '#c084fc', '#7e22ce') },
  { label: 'Landlord', url: makeEmojiAvatar('🔑', '#fbbf24', '#b45309') },
  { label: 'FBI Agent', url: makeEmojiAvatar('🕶️', '#334155', '#09090b') },
  { label: 'Clown', url: makeEmojiAvatar('🤡', '#fb7185', '#e11d48') },
  { label: 'Cat', url: makeEmojiAvatar('😼', '#fdba74', '#ea580c') },
  { label: 'Group', url: makeEmojiAvatar('🔥', '#34d399', '#059669') },
]

export function makeDoodlePatternDataUrl(strokeColor: string, opacity: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220">
    <g fill="none" stroke="${strokeColor}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}">
      <!-- Chat bubble -->
      <path d="M22 24h28a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6H34l-8 7v-7h-4a6 6 0 0 1-6-6V30a6 6 0 0 1 6-6z"/>
      <!-- Smiley -->
      <circle cx="110" cy="34" r="14"/>
      <circle cx="105" cy="31" r="1.4" fill="${strokeColor}"/>
      <circle cx="115" cy="31" r="1.4" fill="${strokeColor}"/>
      <path d="M104 38c2 3 10 3 12 0"/>
      <!-- Coffee cup -->
      <path d="M168 26h20v14a10 10 0 0 1-20 0V26z"/>
      <path d="M188 29h4a4 4 0 0 1 0 8h-4"/>
      <path d="M174 18c0-3 2-4 2-6M181 18c0-3 2-4 2-6"/>
      <!-- Lightning bolt -->
      <path d="M40 82l-8 14h9l-4 13 12-16h-9l5-11z"/>
      <!-- Star -->
      <path d="M105 84l3.5 7 7.5 1-5.5 5.3 1.3 7.7-6.8-3.6-6.8 3.6 1.3-7.7-5.5-5.3 7.5-1z"/>
      <!-- Heart -->
      <path d="M178 92c-3-5-10-4-10 2 0 5 10 11 10 11s10-6 10-11c0-6-7-7-10-2z"/>
      <!-- Music note -->
      <path d="M30 158v-18l16-4v18"/>
      <circle cx="26" cy="158" r="4"/>
      <circle cx="42" cy="154" r="4"/>
      <!-- Paper plane -->
      <path d="M90 150l26-10-8 24-6-9-12-5z"/>
      <path d="M116 140l-14 15"/>
      <!-- Camera -->
      <rect x="162" y="138" width="28" height="20" rx="4"/>
      <circle cx="176" cy="148" r="5"/>
      <path d="M170 138l2-4h8l2 4"/>
      <!-- Crescent moon -->
      <path d="M62 192a11 11 0 1 0 12 14 9 9 0 1 1-12-14z"/>
      <!-- Pizza slice -->
      <path d="M132 182l18 24-26-4z"/>
      <circle cx="135" cy="194" r="1.5" fill="${strokeColor}"/>
      <circle cx="141" cy="198" r="1.5" fill="${strokeColor}"/>
      <!-- Tiny dots/sparkles -->
      <circle cx="76" cy="56" r="1.5" fill="${strokeColor}"/>
      <circle cx="144" cy="64" r="1.5" fill="${strokeColor}"/>
      <circle cx="70" cy="120" r="1.5" fill="${strokeColor}"/>
      <circle cx="196" cy="112" r="1.5" fill="${strokeColor}"/>
      <circle cx="198" cy="190" r="1.5" fill="${strokeColor}"/>
    </g>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
