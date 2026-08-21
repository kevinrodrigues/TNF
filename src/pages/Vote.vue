<template>
  <Layout>
    <h1>Vote</h1>

    <!-- Loading session -->
    <div v-if="step === 'loading'" class="card">
      <p>Loading…</p>
    </div>

    <!-- Magic link sent -->
    <div v-else-if="step === 'sent'" class="card">
      <div class="icon">📧</div>
      <h2>Check your email</h2>
      <p>A login link has been sent to <strong>{{ email }}</strong>. Click it to continue to the vote.</p>
      <button class="btn-ghost" @click="reset">Use a different email</button>
    </div>

    <!-- Email entry -->
    <div v-else-if="step === 'email'" class="card">
      <h2>Sign in to vote</h2>
      <p>Enter your email and we'll send you a one-time login link — no password needed.</p>
      <form @submit.prevent="sendLink">
        <label class="field-label" for="email">Email address</label>
        <input
          id="email"
          v-model="email"
          type="email"
          class="field-input"
          placeholder="you@example.com"
          required
          autocomplete="email"
        />
        <p v-if="authError" class="error-msg">{{ authError }}</p>
        <button type="submit" class="btn-primary" :disabled="sending">
          {{ sending ? 'Sending…' : 'Send login link' }}
        </button>
      </form>
    </div>

    <!-- Already voted -->
    <div v-else-if="step === 'done'" class="card">
      <div class="icon">✅</div>
      <h2>Vote recorded</h2>
      <p>Your vote has been cast. Results will be revealed when voting closes.</p>
    </div>

    <!-- Pick a player -->
    <div v-else-if="step === 'vote'">
      <p class="vote-meta">
        Signed in as <strong>{{ userEmail }}</strong>
        &nbsp;·&nbsp;
        <button class="btn-ghost inline" @click="signOut">Sign out</button>
      </p>
      <h2>Who gets your vote?</h2>
      <p class="vote-sub">Pick one player. You cannot change your vote once submitted.</p>

      <div class="player-grid">
        <button
          v-for="player in players"
          :key="player.name"
          class="player-card"
          :class="{ selected: selected === player.name }"
          @click="selected = player.name"
        >
          {{ player.name }}
          <span v-if="selected === player.name" class="tick">✓</span>
        </button>
      </div>

      <p v-if="voteError" class="error-msg">{{ voteError }}</p>

      <button
        class="btn-primary"
        :disabled="!selected || submitting"
        @click="castVote"
      >
        {{ submitting ? 'Submitting…' : 'Submit vote' }}
      </button>
    </div>

  </Layout>
</template>

<script>
import {
  sendMagicLink,
  getUserFromToken,
  parseSessionFromHash,
  saveSession,
  loadSession,
  clearSession,
  hasVoted,
  submitVote,
} from '../lib/supabase'
import players from '../../data/league-table.json'

export default {
  metaInfo: { title: 'Vote' },

  data() {
    return {
      step: 'loading',
      email: '',
      sending: false,
      authError: null,
      userEmail: null,
      userId: null,
      session: null,
      selected: null,
      submitting: false,
      voteError: null,
      players,
    }
  },

  async mounted() {
    // 1. Check for magic link hash in URL first
    const fromHash = parseSessionFromHash()
    if (fromHash) {
      saveSession(fromHash)
      this.session = fromHash
    } else {
      this.session = loadSession()
    }

    if (!this.session) {
      this.step = 'email'
      return
    }

    // 2. Get user details from the token
    const user = await getUserFromToken(this.session.accessToken)
    if (!user) {
      clearSession()
      this.step = 'email'
      return
    }

    this.userId = user.id
    this.userEmail = user.email

    // 3. Check if already voted
    const voted = await hasVoted(this.session.accessToken, user.id)
    this.step = voted ? 'done' : 'vote'
  },

  methods: {
    async sendLink() {
      this.sending = true
      this.authError = null
      try {
        await sendMagicLink(this.email, window.location.href)
        this.step = 'sent'
      } catch (err) {
        this.authError = err.message
      } finally {
        this.sending = false
      }
    },

    async castVote() {
      if (!this.selected) return
      this.submitting = true
      this.voteError = null
      try {
        const result = await submitVote(this.session.accessToken, this.userId, this.selected)
        if (result.alreadyVoted || result.success) {
          this.step = 'done'
        }
      } catch (err) {
        this.voteError = 'Something went wrong, please try again.'
      } finally {
        this.submitting = false
      }
    },

    signOut() {
      clearSession()
      this.reset()
    },

    reset() {
      this.step = 'email'
      this.email = ''
      this.authError = null
      this.selected = null
      this.session = null
    },
  },
}
</script>

<style lang="scss" scoped>
.card {
  max-width: 480px;
  padding: 36px 32px;
  border-radius: 12px;
  margin-bottom: 2rem;

  .bright & { background: #f3f4f5; }
  .dark  & { background: $sidebarDark; }
}

.icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
}

h2 {
  margin: 0 0 10px;
  padding-top: 0 !important;
  margin-top: 0 !important;
  font-size: 1.5rem;
}

p { opacity: .85; }

.vote-meta {
  font-size: .875rem;
  margin-bottom: 24px;
}

.vote-sub {
  font-size: .875rem;
  opacity: .6;
  margin-top: -8px;
  margin-bottom: 24px;
}

.field-label {
  display: block;
  font-size: .8rem;
  text-transform: uppercase;
  letter-spacing: .08em;
  opacity: .6;
  margin-bottom: 6px;
}

.field-input {
  display: block;
  width: 100%;
  padding: 10px 14px;
  font-size: 1rem;
  border-radius: 8px;
  border: 1px solid #555;
  background: transparent;
  color: inherit;
  margin-bottom: 16px;
  font-family: inherit;

  &:focus { outline: 2px solid $brandPrimary; border-color: transparent; }
}

.btn-primary {
  display: inline-block;
  padding: 12px 28px;
  background: $brandPrimary;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  margin-top: 8px;

  &:disabled { opacity: .5; cursor: not-allowed; }
  &:not(:disabled):hover { opacity: .88; }
}

.btn-ghost {
  background: none;
  border: none;
  color: $brandPrimary;
  cursor: pointer;
  font-size: .875rem;
  font-family: inherit;
  padding: 0;
  text-decoration: underline;

  &.inline { font-size: inherit; }
}

.player-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
  margin-bottom: 24px;
}

.player-card {
  position: relative;
  padding: 14px 12px;
  border-radius: 8px;
  border: 2px solid transparent;
  font-size: 1rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
  transition: border-color .15s, background .15s;

  .bright & { background: #f3f4f5; color: $textBright; }
  .dark  & { background: $sidebarDark; color: $textDark; }

  &.selected {
    border-color: $brandPrimary;
    background: rgba(16, 193, 134, .12);
  }

  &:not(.selected):hover { border-color: rgba(16, 193, 134, .4); }
}

.tick {
  position: absolute;
  top: 8px;
  right: 10px;
  color: $brandPrimary;
  font-weight: 700;
}

.error-msg {
  color: #e74c3c;
  font-size: .875rem;
  margin: 0 0 12px;
}
</style>
