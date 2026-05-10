import { useDarkMode } from '../hooks/useDarkMode'

export function DarkModeRow() {
  const { isDark, toggle } = useDarkMode()

  return (
    <div
      onClick={toggle}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px',
        borderBottom: '1px solid var(--c-border)',
        cursor: 'pointer',
        transition: 'background 0.15s ease',
      }}
    >
      <span style={{ fontSize: 18, width: 24, textAlign: 'center', flexShrink: 0 }}>
        {isDark ? '☀️' : '🌙'}
      </span>
      <span style={{ flex: 1, fontSize: 15, color: 'var(--c-text)' }}>
        {isDark ? 'Light mode' : 'Dark mode'}
      </span>

      {/* Toggle switch */}
      <div style={{
        width: 44, height: 24, borderRadius: 12,
        background: isDark ? 'var(--c-primary)' : 'var(--c-border)',
        position: 'relative',
        transition: 'background 0.2s ease',
        flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute',
          top: 3, left: isDark ? 23 : 3,
          width: 18, height: 18, borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transition: 'left 0.2s ease',
        }} />
      </div>
    </div>
  )
}