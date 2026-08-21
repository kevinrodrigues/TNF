<template>
  <Layout>
    <h1>Results</h1>

    <div v-if="loading" class="state-card">
      <p>Loading…</p>
    </div>

    <div v-else-if="notRevealed" class="state-card">
      <div class="icon">🔒</div>
      <h2>Results not yet available</h2>
      <p>Voting may still be open. Check back once voting has closed.</p>
    </div>

    <div v-else-if="error" class="state-card">
      <div class="icon">⚠️</div>
      <h2>Something went wrong</h2>
      <p>{{ error }}</p>
    </div>

    <div v-else>
      <p class="total-label">{{ total }} vote{{ total !== 1 ? 's' : '' }} cast</p>

      <div class="chart">
        <div
          v-for="(item, index) in results"
          :key="item.name"
          class="bar-row"
          :class="{ winner: index === 0 }"
        >
          <div class="bar-header">
            <span class="bar-name">
              <span v-if="index === 0" class="crown">👑</span>
              {{ item.name }}
            </span>
            <span class="bar-count">{{ item.votes }} vote{{ item.votes !== 1 ? 's' : '' }}</span>
          </div>

          <div class="bar-track">
            <div
              class="bar-fill"
              :style="{ width: barWidth(item.votes) + '%' }"
            ></div>
          </div>

          <div v-if="item.voters.length" class="voters">
            <span
              v-for="voter in item.voters"
              :key="voter"
              class="voter-chip"
            >{{ displayName(voter) }}</span>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script>
export default {
  metaInfo: { title: 'Results' },

  data() {
    return {
      loading: true,
      notRevealed: false,
      error: null,
      results: [],
      total: 0,
    }
  },

  computed: {
    maxVotes() {
      return this.results.length ? this.results[0].votes : 1
    },
  },

  async mounted() {
    try {
      const res = await fetch('/.netlify/functions/results')

      if (res.status === 403) {
        this.notRevealed = true
        return
      }

      if (!res.ok) {
        this.error = 'Failed to load results. Please try again later.'
        return
      }

      const data = await res.json()
      this.results = data.results
      this.total = data.total
    } catch (_) {
      this.error = 'Could not connect to the results service.'
    } finally {
      this.loading = false
    }
  },

  methods: {
    barWidth(votes) {
      if (!this.maxVotes) return 0
      return Math.round((votes / this.maxVotes) * 100)
    },
    displayName(email) {
      return email ? email.split('@')[0] : 'unknown'
    },
  },
}
</script>

<style lang="scss" scoped>
.state-card {
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

.total-label {
  font-size: .875rem;
  opacity: .55;
  margin-bottom: 28px;
  text-transform: uppercase;
  letter-spacing: .08em;
}

.chart {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 600px;
}

.bar-row {
  padding: 16px;
  border-radius: 10px;
  border: 2px solid transparent;
  transition: border-color .2s;

  .bright & { background: #f3f4f5; }
  .dark  & { background: $sidebarDark; }

  &.winner {
    border-color: $brandPrimary;
  }
}

.bar-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
}

.bar-name {
  font-size: 1.1rem;
  font-weight: 700;
}

.crown {
  margin-right: 4px;
}

.bar-count {
  font-size: .875rem;
  opacity: .6;
}

.bar-track {
  height: 10px;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 12px;

  .bright & { background: rgba(0,0,0,.1); }
  .dark  & { background: rgba(255,255,255,.1); }
}

.bar-fill {
  height: 100%;
  background: $brandPrimary;
  border-radius: 5px;
  transition: width .6s ease;
}

.voters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.voter-chip {
  font-size: .75rem;
  padding: 3px 10px;
  border-radius: 99px;
  font-weight: 600;

  .bright & { background: rgba(0,0,0,.08); color: $textBright; }
  .dark  & { background: rgba(255,255,255,.12); color: $textDark; }
}
</style>
