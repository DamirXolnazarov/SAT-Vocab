import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useUserStore } from '../stores/userStore'
import { BossBattle } from './BossBattle'

// ─── Constants ────────────────────────────────────────────────────────────────

const AVATARS = [
  '🦁','🐯','🦊','🐺','🐻','🦋',
  '🐉','🦅','🌟','⚡','🎯','🔥',
  '💎','🚀','🌊','🏔️','🌙','☀️','🎪','🎭',
]

const TABS = [
  { value: 'leaderboard', label: '🏆 Leaderboard' },
  { value: 'boss',        label: '👹 Boss Battle'  },
  { value: 'duels',       label: '⚔️ Duels'        },
]

// ─── Rank medal ───────────────────────────────────────────────────────────────

function RankMedal({ rank }) {
  if (rank === 1) return <span style={{ fontSize: 22 }}>🥇</span>
  if (rank === 2) return <span style={{ fontSize: 22 }}>🥈</span>
  if (rank === 3) return <span style={{ fontSize: 22 }}>🥉</span>
  return (
    <span style={{
      fontSize: 13, fontWeight: 700, color: 'var(--c-text-muted)',
      width: 28, textAlign: 'center', display: 'inline-block',
    }}>
      {rank}
    </span>
  )
}

// ─── Leaderboard row ──────────────────────────────────────────────────────────

function LeaderRow({ entry, rank, isMe }) {
  const topThree = rank <= 3

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.04 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
        background: isMe
          ? 'var(--c-primary-pale)'
          : topThree
          ? 'var(--c-gold-pale)'
          : 'var(--c-bg)',
        border: `1px solid ${isMe
          ? 'var(--c-primary)'
          : topThree
          ? 'var(--c-gold-light)'
          : 'var(--c-border)'}`,
        borderRadius: 'var(--r-sm)',
        transition: 'all 0.15s ease',
      }}
    >
      {/* Rank */}
      <div style={{ width: 32, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
        <RankMedal rank={rank} />
      </div>

      {/* Avatar */}
      <div style={{
        width: 38, height: 38, flexShrink: 0,
        background: isMe ? 'var(--c-primary-pale)' : 'var(--c-bg-subtle)',
        borderRadius: 10, fontSize: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1.5px solid ${isMe ? 'var(--c-primary)' : 'var(--c-border)'}`,
      }}>
        {AVATARS[entry.avatar_id || 0]}
      </div>

      {/* Name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: isMe ? 700 : 500,
          color: isMe ? 'var(--c-primary)' : 'var(--c-text)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {entry.username || 'Learner'}
          {isMe && (
            <span style={{
              marginLeft: 6, fontSize: 10, fontWeight: 600,
              background: 'var(--c-primary)', color: '#fff',
              padding: '1px 6px', borderRadius: 99,
            }}>
              You
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 1 }}>
          Level {entry.level || 'Beginner'}
        </div>
      </div>

      {/* XP */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontSize: 16, fontWeight: 800,
          color: topThree ? 'var(--c-gold)' : isMe ? 'var(--c-primary)' : 'var(--c-text)',
        }}>
          {(entry.xp_earned || entry.total_xp || 0).toLocaleString()}
        </div>
        <div style={{ fontSize: 10, color: 'var(--c-text-muted)' }}>XP</div>
      </div>
    </motion.div>
  )
}

// ─── Weekly leaderboard ───────────────────────────────────────────────────────

function WeeklyLeaderboard() {
  const { profile } = useAuthStore()
  const [entries,  setEntries]  = useState([])
  const [myRank,   setMyRank]   = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      // Get current week start (Monday 00:00 UTC)
      const now       = new Date()
      const day       = now.getUTCDay() || 7
      const weekStart = new Date(now)
      weekStart.setUTCDate(now.getUTCDate() - day + 1)
      weekStart.setUTCHours(0, 0, 0, 0)

      const { data: weekly } = await supabase
        .from('leaderboard_weekly')
        .select('*, users(username, avatar_id, level)')
        .gte('week_start_date', weekStart.toISOString())
        .order('xp_earned', { ascending: false })
        .limit(50)

      if (weekly?.length) {
        const enriched = weekly.map((e, i) => ({
          ...e,
          username:  e.users?.username,
          avatar_id: e.users?.avatar_id,
          level:     e.users?.level,
          rank:      i + 1,
        }))
        setEntries(enriched)
        const me = enriched.find(e => e.user_id === profile?.id)
        if (me) setMyRank(me.rank)
      } else {
        // Fall back to all-time XP from users table
        const { data: users } = await supabase
          .from('users')
          .select('id, username, avatar_id, level, total_xp')
          .order('total_xp', { ascending: false })
          .limit(50)

        if (users) {
          const enriched = users.map((u, i) => ({
            user_id:  u.id,
            username: u.username,
            avatar_id: u.avatar_id,
            level:    u.level,
            xp_earned: u.total_xp,
            rank:     i + 1,
          }))
          setEntries(enriched)
          const me = enriched.find(e => e.user_id === profile?.id)
          if (me) setMyRank(me.rank)
        }
      }
    } catch (err) {
      console.error('Leaderboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Days until Monday reset
  const daysUntilReset = (() => {
    const now = new Date()
    const day = now.getUTCDay() || 7
    return 8 - day
  })()

  return (
    <div>
      {/* Reset timer */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 14px',
        background: 'var(--c-primary-pale)',
        border: '1px solid var(--c-primary)',
        borderRadius: 'var(--r-sm)', marginBottom: 16,
      }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-primary)' }}>
            Weekly leaderboard
          </div>
          <div style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>
            Resets Monday · {daysUntilReset} day{daysUntilReset !== 1 ? 's' : ''} left
          </div>
        </div>
        {myRank && (
          <div style={{
            textAlign: 'right',
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--c-primary)' }}>
              #{myRank}
            </div>
            <div style={{ fontSize: 10, color: 'var(--c-text-muted)' }}>your rank</div>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div style={{
            width: 32, height: 32, margin: '0 auto 12px',
            border: '3px solid var(--c-border)',
            borderTopColor: 'var(--c-primary)',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite',
          }} />
          <div style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>Loading…</div>
        </div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--c-text)', marginBottom: 6 }}>
            No entries yet this week
          </div>
          <div style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>
            Complete sessions to appear on the leaderboard
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entries.map((entry, i) => (
            <LeaderRow
              key={entry.user_id}
              entry={entry}
              rank={i + 1}
              isMe={entry.user_id === profile?.id}
            />
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ─── Duel card ────────────────────────────────────────────────────────────────

function DuelCard({ duel, myId }) {
  const isChallenger = duel.challenger_id === myId
  const myScore      = isChallenger ? duel.challenger_score : duel.opponent_score
  const theirScore   = isChallenger ? duel.opponent_score  : duel.challenger_score
  const opponent     = isChallenger ? duel.opponent        : duel.challenger
  const won          = duel.winner_id === myId

  const statusColors = {
    pending:  { bg: 'var(--c-warning-pale)',  color: 'var(--c-warning)'  },
    active:   { bg: 'var(--c-primary-pale)',  color: 'var(--c-primary)'  },
    complete: { bg: won
      ? 'var(--c-success-pale)' : 'var(--c-danger-pale)',
      color: won ? 'var(--c-success)' : 'var(--c-danger)' },
  }
  const sc = statusColors[duel.status] || statusColors.pending

  return (
    <div style={{
      background: 'var(--c-bg)',
      border: '1px solid var(--c-border)',
      borderRadius: 'var(--r-card)',
      padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text)' }}>
          vs. {opponent?.username || 'Opponent'}
        </div>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '2px 8px',
          borderRadius: 99, textTransform: 'capitalize',
          background: sc.bg, color: sc.color,
        }}>
          {duel.status === 'complete' ? (won ? '🏆 Won' : '😔 Lost') : duel.status}
        </span>
      </div>

      {duel.status === 'complete' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--c-primary)' }}>{myScore ?? '—'}</div>
            <div style={{ fontSize: 10, color: 'var(--c-text-muted)' }}>You</div>
          </div>
          <div style={{ fontSize: 14, color: 'var(--c-text-muted)', fontWeight: 700 }}>VS</div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--c-text-muted)' }}>{theirScore ?? '—'}</div>
            <div style={{ fontSize: 10, color: 'var(--c-text-muted)' }}>{opponent?.username || 'Them'}</div>
          </div>
        </div>
      )}

      {duel.status === 'pending' && !isChallenger && (
        <button style={{
          width: '100%', minHeight: 40,
          background: 'var(--c-primary)', color: '#fff',
          border: 'none', borderRadius: 'var(--r-sm)',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          marginTop: 4,
        }}>
          Accept challenge →
        </button>
      )}

      {duel.status === 'active' && (
        <button style={{
          width: '100%', minHeight: 40,
          background: 'var(--c-primary)', color: '#fff',
          border: 'none', borderRadius: 'var(--r-sm)',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          marginTop: 4,
        }}>
          ⚔️ Play your turn →
        </button>
      )}
    </div>
  )
}

// ─── Duels tab ────────────────────────────────────────────────────────────────

function DuelsTab() {
  const { profile } = useAuthStore()
  const [duels,    setDuels]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [found,    setFound]    = useState(null)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!profile?.id) return
    fetchDuels()
  }, [profile?.id])

  const fetchDuels = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('duels')
      .select(`
        *,
        challenger:users!duels_challenger_id_fkey(username, avatar_id),
        opponent:users!duels_opponent_id_fkey(username, avatar_id)
      `)
      .or(`challenger_id.eq.${profile.id},opponent_id.eq.${profile.id}`)
      .order('created_at', { ascending: false })
      .limit(20)
    setDuels(data || [])
    setLoading(false)
  }

  const searchUser = async () => {
    if (!search.trim()) return
    setSearching(true)
    const { data } = await supabase
      .from('users')
      .select('id, username, avatar_id, level')
      .ilike('username', search.trim())
      .neq('id', profile.id)
      .single()
    setFound(data || null)
    setSearching(false)
  }

  const challengeUser = async (opponentId) => {
    const { words } = useUserStore.getState()
    const wordIds = words.slice(0, 10).map(w => w.id)
    await supabase.from('duels').insert({
      challenger_id: profile.id,
      opponent_id:   opponentId,
      word_ids:      wordIds,
      status:        'pending',
    })
    setFound(null)
    setSearch('')
    fetchDuels()
  }

  return (
    <div>
      {/* Challenge banner */}
      <div style={{
        background: 'var(--c-primary)',
        borderRadius: 'var(--r-card)',
        padding: '20px', marginBottom: 16,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -20, right: -20,
          width: 100, height: 100, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }} />
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
          Challenge a friend
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 14 }}>
          Same 10 words · 24hrs to complete · Most correct wins
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchUser()}
            placeholder="Search username…"
            style={{
              flex: 1, padding: '10px 14px', minHeight: 44,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 'var(--r-sm)',
              color: '#fff', fontSize: 14, outline: 'none',
            }}
          />
          <button
            onClick={searchUser}
            disabled={searching}
            style={{
              minHeight: 44, padding: '0 16px',
              background: '#fff', color: 'var(--c-primary)',
              border: 'none', borderRadius: 'var(--r-sm)',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {searching ? '…' : 'Find'}
          </button>
        </div>

        {/* Found user */}
        <AnimatePresence>
          {found && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                marginTop: 10, padding: '10px 14px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 'var(--r-sm)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}
            >
              <span style={{ fontSize: 20 }}>{AVATARS[found.avatar_id || 0]}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{found.username}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{found.level}</div>
              </div>
              <button
                onClick={() => challengeUser(found.id)}
                style={{
                  padding: '6px 14px', background: 'var(--c-gold)',
                  border: 'none', borderRadius: 99,
                  color: '#fff', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ⚔️ Challenge
              </button>
            </motion.div>
          )}
          {found === null && search && !searching && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}
            >
              No user found with that username
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Duel list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--c-text-muted)', fontSize: 14 }}>
          Loading duels…
        </div>
      ) : duels.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚔️</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--c-text)', marginBottom: 6 }}>
            No duels yet
          </div>
          <div style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>
            Challenge a friend above to get started
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginBottom: 2 }}>
            {duels.length} duel{duels.length !== 1 ? 's' : ''}
          </div>
          {duels.map(duel => (
            <DuelCard key={duel.id} duel={duel} myId={profile.id} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Compete page ─────────────────────────────────────────────────────────────

export function Compete() {
  const [tab,          setTab]          = useState('leaderboard')
  const [bossActive,   setBossActive]   = useState(false)

  if (bossActive) {
    return <BossBattle onExit={() => setBossActive(false)} />
  }

  return (
    <div style={{ paddingTop: 20, paddingBottom: 8 }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 20 }}
      >
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--c-text)' }}>
          Compete
        </div>
        <div style={{ fontSize: 13, color: 'var(--c-text-muted)', marginTop: 2 }}>
          Climb the ranks · defeat the boss · challenge friends
        </div>
      </motion.div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', background: 'var(--c-bg-subtle)',
        borderRadius: 'var(--r-sm)', padding: 4, marginBottom: 20,
      }}>
        {TABS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            style={{
              flex: 1, padding: '9px 4px',
              fontSize: 13, fontWeight: 600,
              borderRadius: 6, border: 'none', cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: tab === value ? 'var(--c-bg)' : 'transparent',
              color: tab === value ? 'var(--c-primary)' : 'var(--c-text-muted)',
              boxShadow: tab === value ? 'var(--shadow-sm)' : 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {tab === 'leaderboard' && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <WeeklyLeaderboard />
          </motion.div>
        )}

        {tab === 'boss' && (
          <motion.div
            key="boss"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Boss battle entry card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'linear-gradient(135deg, #5c111e 0%, #8b1a2e 100%)',
                borderRadius: 'var(--r-card)',
                padding: '32px 24px',
                textAlign: 'center',
                position: 'relative', overflow: 'hidden',
                marginBottom: 16,
              }}
            >
              <div style={{
                position: 'absolute', top: -30, right: -30,
                width: 150, height: 150, borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)',
              }} />
              <div style={{ fontSize: 64, marginBottom: 12 }}>👹</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 8 }}>
                Boss Battle
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 24, lineHeight: 1.6 }}>
                10 questions · 20 seconds each<br />
                Score 7+ to win · No hearts
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 24 }}>
                {[
                  { emoji: '🏆', label: 'Win', value: '+100 XP' },
                  { emoji: '🎯', label: 'Attempt', value: '+30 XP' },
                ].map(({ emoji, label, value }) => (
                  <div key={label} style={{
                    padding: '10px 20px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 'var(--r-sm)',
                  }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{emoji}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-gold)' }}>{value}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{label}</div>
                  </div>
                ))}
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setBossActive(true)}
                style={{
                  minWidth: 200, minHeight: 52,
                  background: 'var(--c-gold)', color: '#fff',
                  border: 'none', borderRadius: 'var(--r-sm)',
                  fontSize: 17, fontWeight: 800, cursor: 'pointer',
                  letterSpacing: '0.02em',
                }}
              >
                ⚔️ Enter battle
              </motion.button>
            </motion.div>

            {/* Tips */}
            <div style={{
              background: 'var(--c-bg)',
              border: '1px solid var(--c-border)',
              borderRadius: 'var(--r-card)',
              padding: '16px',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text)', marginBottom: 10 }}>
                Tips to win
              </div>
              {[
                '🧠 Review struggling words before entering',
                '⚡ Don\'t overthink — go with your first instinct',
                '⏱️ Watch the timer — timeout counts as wrong',
                '🔁 You can retry immediately after a loss',
              ].map(tip => (
                <div key={tip} style={{
                  fontSize: 13, color: 'var(--c-text-muted)',
                  marginBottom: 8, lineHeight: 1.5,
                }}>
                  {tip}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {tab === 'duels' && (
          <motion.div
            key="duels"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <DuelsTab />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}