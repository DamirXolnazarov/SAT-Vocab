import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

// ─── Notification types ───────────────────────────────────────────────────────

const TYPE_CONFIG = {
  streak_reminder: { icon: '🔥', color: 'var(--c-gold)',    bg: 'var(--c-gold-pale)'    },
  streak_danger:   { icon: '⚠️', color: 'var(--c-danger)',  bg: 'var(--c-danger-pale)'  },
  duel_received:   { icon: '⚔️', color: 'var(--c-primary)', bg: 'var(--c-primary-pale)' },
  duel_result:     { icon: '🏆', color: 'var(--c-gold)',    bg: 'var(--c-gold-pale)'    },
  friend_request:  { icon: '👋', color: 'var(--c-success)', bg: 'var(--c-success-pale)' },
  badge_earned:    { icon: '🎖️', color: 'var(--c-gold)',    bg: 'var(--c-gold-pale)'    },
  word_of_day:     { icon: '📖', color: 'var(--c-primary)', bg: 'var(--c-primary-pale)' },
  leaderboard:     { icon: '📊', color: 'var(--c-primary)', bg: 'var(--c-primary-pale)' },
  xp_milestone:    { icon: '⚡', color: 'var(--c-gold)',    bg: 'var(--c-gold-pale)'    },
}

const DEMO_NOTIFICATIONS = [
  {
    id: '1', type: 'streak_danger', read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    payload: { title: 'Streak at risk!', body: 'You haven\'t practiced today. Your 7-day streak ends at midnight.' },
  },
  {
    id: '2', type: 'duel_received', read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    payload: { title: 'New duel challenge', body: 'alex_uz challenged you to a vocab duel. You have 24 hours to respond.' },
  },
  {
    id: '3', type: 'badge_earned', read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    payload: { title: 'Badge unlocked: 🔥 Week Warrior', body: 'You maintained a 7-day streak. Keep it going!' },
  },
  {
    id: '4', type: 'leaderboard', read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    payload: { title: 'Weekly results are in', body: 'You finished #4 on the leaderboard this week with 340 XP.' },
  },
  {
    id: '5', type: 'word_of_day', read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    payload: { title: 'Word of the Day: Perspicacious', body: 'Having a ready insight; shrewd and discerning. Tap to study it.' },
  },
]

// ─── Time ago ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

// ─── Notification card ────────────────────────────────────────────────────────

function NotifCard({ notif, onRead, onAction }) {
  const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.word_of_day

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40 }}
      onClick={() => onRead(notif.id)}
      style={{
        display: 'flex', gap: 14, padding: '14px 16px',
        background: notif.read ? 'var(--c-bg)' : 'var(--c-primary-pale)',
        border: `1px solid ${notif.read ? 'var(--c-border)' : 'rgba(139,26,46,0.15)'}`,
        borderRadius: 'var(--r-card)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
    >
      {/* Unread dot */}
      {!notif.read && (
        <div style={{
          position: 'absolute', top: 14, right: 14,
          width: 8, height: 8, borderRadius: '50%',
          background: 'var(--c-primary)',
        }} />
      )}

      {/* Icon */}
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: cfg.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22,
      }}>
        {cfg.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
        <div style={{
          fontSize: 14, fontWeight: notif.read ? 500 : 700,
          color: 'var(--c-text)', marginBottom: 3, lineHeight: 1.3,
        }}>
          {notif.payload?.title}
        </div>
        <div style={{
          fontSize: 13, color: 'var(--c-text-muted)',
          lineHeight: 1.5, marginBottom: 6,
        }}>
          {notif.payload?.body}
        </div>
        <div style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>
          {timeAgo(notif.created_at)}
        </div>

        {/* Action buttons */}
        {notif.type === 'duel_received' && !notif.read && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              onClick={e => { e.stopPropagation(); onAction(notif, 'accept') }}
              style={{
                padding: '6px 16px', background: 'var(--c-primary)',
                color: '#fff', border: 'none', borderRadius: 99,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              ⚔️ Accept
            </button>
            <button
              onClick={e => { e.stopPropagation(); onAction(notif, 'decline') }}
              style={{
                padding: '6px 14px', background: 'transparent',
                color: 'var(--c-text-muted)',
                border: '1px solid var(--c-border)', borderRadius: 99,
                fontSize: 12, fontWeight: 500, cursor: 'pointer',
              }}
            >
              Decline
            </button>
          </div>
        )}

        {notif.type === 'friend_request' && !notif.read && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              onClick={e => { e.stopPropagation(); onAction(notif, 'accept_friend') }}
              style={{
                padding: '6px 16px', background: 'var(--c-success)',
                color: '#fff', border: 'none', borderRadius: 99,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              👋 Accept
            </button>
            <button
              onClick={e => { e.stopPropagation(); onAction(notif, 'decline_friend') }}
              style={{
                padding: '6px 14px', background: 'transparent',
                color: 'var(--c-text-muted)',
                border: '1px solid var(--c-border)', borderRadius: 99,
                fontSize: 12, fontWeight: 500, cursor: 'pointer',
              }}
            >
              Ignore
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Notifications page ───────────────────────────────────────────────────────

export function Notifications() {
  const navigate            = useNavigate()
  const { profile }         = useAuthStore()
  const [notifs,   setNotifs]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all') // all | unread

  useEffect(() => { fetchNotifications() }, [profile?.id])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      if (!profile?.id) { setNotifs(DEMO_NOTIFICATIONS); setLoading(false); return }
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(40)
      setNotifs(data?.length ? data : DEMO_NOTIFICATIONS)
    } catch {
      setNotifs(DEMO_NOTIFICATIONS)
    } finally {
      setLoading(false)
    }
  }

  const markRead = async (id) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    try {
      await supabase.from('notifications').update({ read: true }).eq('id', id)
    } catch {}
  }

  const markAllRead = async () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
    try {
      await supabase.from('notifications').update({ read: true }).eq('user_id', profile?.id)
    } catch {}
  }

  const handleAction = async (notif, action) => {
    markRead(notif.id)
    if (action === 'accept') navigate('/compete?tab=duels')
    if (action === 'accept_friend') navigate('/compete')
  }

  const unreadCount = notifs.filter(n => !n.read).length
  const filtered    = filter === 'unread' ? notifs.filter(n => !n.read) : notifs

  return (
    <div style={{ paddingTop: 20, paddingBottom: 8 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 20 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--c-text)' }}>
              Notifications
              {unreadCount > 0 && (
                <span style={{
                  marginLeft: 10, fontSize: 13, fontWeight: 700,
                  background: 'var(--c-primary)', color: '#fff',
                  padding: '2px 8px', borderRadius: 99,
                  verticalAlign: 'middle',
                }}>
                  {unreadCount}
                </span>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              style={{
                background: 'none', border: 'none',
                color: 'var(--c-primary)', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', padding: 0,
              }}
            >
              Mark all read
            </button>
          )}
        </div>
      </motion.div>

      {/* Filter tabs */}
      <div style={{
        display: 'flex', background: 'var(--c-bg-subtle)',
        borderRadius: 'var(--r-sm)', padding: 4, marginBottom: 20,
      }}>
        {['all', 'unread'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              flex: 1, padding: '8px 0',
              fontSize: 14, fontWeight: 600,
              borderRadius: 6, border: 'none', cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: filter === f ? 'var(--c-bg)' : 'transparent',
              color: filter === f ? 'var(--c-primary)' : 'var(--c-text-muted)',
              boxShadow: filter === f ? 'var(--shadow-sm)' : 'none',
              textTransform: 'capitalize',
            }}
          >
            {f === 'unread' && unreadCount > 0 ? `Unread (${unreadCount})` : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--c-text-muted)' }}>
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: '48px 20px' }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>
            {filter === 'unread' ? '✅' : '🔔'}
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--c-text)', marginBottom: 6 }}>
            {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>
            {filter === 'unread' ? 'No unread notifications' : 'Notifications will appear here'}
          </div>
        </motion.div>
      ) : (
        <motion.div layout style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <AnimatePresence>
            {filtered.map(notif => (
              <NotifCard
                key={notif.id}
                notif={notif}
                onRead={markRead}
                onAction={handleAction}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}