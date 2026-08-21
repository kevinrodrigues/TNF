<template>
  <Layout>
    <h1>Vote</h1>

    <div v-if="step === 'loading'" class="card">
      <p>Loading…</p>
    </div>

    <!-- Voting closed -->
    <div v-else-if="step === 'closed'" class="card">
      <div class="icon">🔒</div>
      <h2>Voting is closed</h2>
      <p>All {{ maxVoters }} votes have been cast. Results will be revealed soon.</p>
    </div>

    <!-- Step 1: enter email -->
    <div v-else-if="step === 'email'" class="card">
      <h2>Sign in to vote</h2>
      <p>Enter your email and we'll send you a 6-digit code — no password needed.</p>
      <form @submit.prevent="sendCode">
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
          {{ sending ? 'Sending…' : 'Send code' }}
        </button>
      </form>
    </div>

    <!-- Step 2: enter code -->
    <div v-else-if="step === 'verify'" class="card">
      <div class="icon">📬</div>
      <h2>Enter your code</h2>
      <p>We sent a 6-digit code to <strong>{{ email }}</strong>.</p>
      <form @submit.prevent="checkCode">
        <label class="field-label" for="code">6-digit code</label>
        <input
          id="code"
          v-model="code"
          type="text"
          inputmode="numeric"
          pattern="[0-9]{6}"
          maxlength="6"
          class="field-input code-input"
          placeholder="000000"
          required
          autocomplete="one-time-code"
        />
        <p v-if="codeError" class="error-msg">{{ codeError }}</p>
        <button type="submit" class="btn-primary" :disabled="verifying || code.length !== 6">
          {{ verifying ? 'Verifying…' : 'Continue' }}
        </button>
        <button type="button" class="btn-ghost block" @click="reset">Use a different email</button>
      </form>
    </div>

    <!-- Already voted -->
    <div v-else-if="step === 'done'" class="card">
      <div class="icon">✅</div>
      <h2>Vote recorded</h2>
      <p>Your vote has been cast. Results will be revealed when voting closes.</p>
    </div>

    <!-- Step 3: pick a player -->
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
  sendOtp,
  verifyOtp,
  saveSession,
  loadSession,
  clearSession,
  getUserFromToken,
  getVoteCount,
  hasVoted,
  submitVote,
} from '../lib/supabase'
import players from '../../data/league-table.json'

const MAX_VOTERS = 14

export default {
  metaInfo: { title: 'Vote' },

  data() {
    return {
      step: 'loading',
      email: '',
      code: '',
      sending: false,
      verifying: false,
      authError: null,
      codeError: null,
      userEmail: null,
      userId: null,
      session: null,
      selected: null,
      submitting: false,
      voteError: null,
      players,
      maxVoters: MAX_VOTERS,
    }
  },

  async mounted() {
    const count = await getVoteCount()
    if (count >= MAX_VOTERS) {
      this.step = 'closed'
      return
    }

    this.session = loadSession()

    if (!this.session) {
      this.step = 'email'
      return
    }

    const user = await getUserFromToken(this.session.accessToken)
    if (!user) {
      clearSession()
      this.step = 'email'
      return
    }

    this.userId = user.id
    this.userEmail = user.email

    const voted = await hasVoted(this.session.accessToken, user.id)
    this.step = voted ? 'done' : 'vote'
  },

  methods: {
    async sendCode() {
      this.sending = true
      this.authError = null
      try {
        await sendOtp(this.email)
        this.step = 'verify'
      } catch (err) {
        this.authError = err.message
      } finally {
        this.sending = false
      }
    },

    async checkCode() {
      this.verifying = true
      this.codeError = null
      try {
        const session = await verifyOtp(this.email, this.code)
        saveSession(session)
        this.session = session
        this.userId = session.user.id
        this.userEmail = session.user.email

        const voted = await hasVoted(session.accessToken, session.user.id)
        this.step = voted ? 'done' : 'vote'
      } catch (err) {
        this.codeError = err.message || 'Invalid or expired code. Try requesting a new one.'
      } finally {
        this.verifying = false
      }
    },

    async castVote() {
      if (!this.selected) return
      this.submitting = true
      this.voteError = null
      try {
        const count = await getVoteCount()
        if (count >= MAX_VOTERS) {
          this.step = 'closed'
          return
        }

        const result = await submitVote(
          this.session.accessToken,
          this.userId,
          this.userEmail,
          this.selected
        )
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
      this.code = ''
      this.authError = null
      this.codeError = null
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

.code-input {
  font-size: 1.8rem;
  letter-spacing: .3em;
  text-align: center;
  font-weight: 700;
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
  &.block { display: block; margin-top: 14px; }
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
