<template>
  <Layout>
    <h1>Table</h1>

    <h2>League Table - Season 1</h2>

    <div class="table-wrapper">
      <table class="league-table">
        <thead>
          <tr>
            <th class="sticky-col rank-col">#</th>
            <th class="sticky-col player-col">Player</th>
            <th>P</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>PS</th>
            <th>DO</th>
            <th>Loy</th>
            <th>Late</th>
            <th>Vs</th>
            <th>MoM</th>
            <th>MoMS</th>
            <th>Tot</th>
            <th>Ave</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(player, index) in sortedPlayers"
            :key="player.name"
            :class="{ 'top-row': index === 0 }"
          >
            <td class="sticky-col rank-col">{{ index + 1 }}</td>
            <td class="sticky-col player-col">
              <button class="player-btn" @click="openModal(player)">{{ player.name }}</button>
            </td>
            <td>{{ player.played }}</td>
            <td>{{ player.won }}</td>
            <td>{{ player.draw }}</td>
            <td>{{ player.lost }}</td>
            <td>{{ player.ps }}</td>
            <td>{{ player.doOut }}</td>
            <td>{{ player.loy }}</td>
            <td>{{ player.late }}</td>
            <td>{{ player.vs }}</td>
            <td>{{ player.mom }}</td>
            <td>{{ player.momSplit }}</td>
            <td>{{ player.total }}</td>
            <td>{{ player.ave }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2>MOM</h2>
    <p>Game 1: Jeremy 🏆</p>

    <h2>Score</h2>
    <p>REDs 🔴 9 - 6 BLACKs ⚫</p>

    <transition name="modal-fade">
      <div v-if="selectedPlayer" class="modal-overlay" @click.self="closeModal">
        <div class="modal" role="dialog" :aria-label="selectedPlayer.name + ' stats'">
          <button class="modal-close" @click="closeModal" aria-label="Close">×</button>

          <h2 class="modal-name">{{ selectedPlayer.name }}</h2>

          <div class="score-section">
            <div class="score-label">Rating</div>
            <div class="score-value">
              {{ scoreOutOf10(selectedPlayer) }}
              <span class="score-max">/ 10</span>
            </div>
            <div class="score-bar">
              <div class="score-fill" :style="{ width: scorePercent(selectedPlayer) + '%' }"></div>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat">
              <span class="stat-value">{{ selectedPlayer.played }}</span>
              <span class="stat-label">Played</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ selectedPlayer.won }}</span>
              <span class="stat-label">Won</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ selectedPlayer.draw }}</span>
              <span class="stat-label">Drawn</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ selectedPlayer.lost }}</span>
              <span class="stat-label">Lost</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ selectedPlayer.mom }}</span>
              <span class="stat-label">MoM</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ selectedPlayer.momSplit }}</span>
              <span class="stat-label">MoM Split</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ selectedPlayer.ps }}</span>
              <span class="stat-label">Pen. Saved</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ selectedPlayer.loy }}</span>
              <span class="stat-label">Loyalty</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ selectedPlayer.vs }}</span>
              <span class="stat-label">Vs</span>
            </div>
            <div class="stat" :class="{ negative: selectedPlayer.late > 0 }">
              <span class="stat-value">{{ selectedPlayer.late }}</span>
              <span class="stat-label">Late</span>
            </div>
            <div class="stat" :class="{ negative: selectedPlayer.doOut > 0 }">
              <span class="stat-value">{{ selectedPlayer.doOut }}</span>
              <span class="stat-label">Drop Out</span>
            </div>
          </div>

          <div class="totals-row">
            <div class="total-item">
              <span class="total-label">Total Pts</span>
              <span class="total-value">{{ selectedPlayer.total }}</span>
            </div>
            <div class="total-item">
              <span class="total-label">Average</span>
              <span class="total-value">{{ selectedPlayer.ave }}</span>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Layout>
</template>

<script>
import rawPlayers from '../../data/league-table.json'

function calcPlayer(p) {
  const total =
    p.played * 1 +
    p.won * 3 +
    p.draw * 1 +
    p.mom * 3 +
    p.momSplit * 1.5 +
    p.ps * 2 +
    (p.loy ? p.loy * 1 : 0) +
    p.late * -1 +
    p.doOut * -1

  const aveRaw = p.played > 0 ? total / p.played : 0
  const aveMatch = aveRaw.toString().match(/^\d+(?:\.\d{0,2})?/)
  const ave = aveMatch ? Number(aveMatch[0]) : 0

  return { ...p, total, ave }
}

export default {
  metaInfo: { title: 'Table' },

  data() {
    return {
      players: rawPlayers.map(calcPlayer),
      selectedPlayer: null,
    }
  },

  computed: {
    sortedPlayers() {
      return [...this.players].sort((a, b) => b.total - a.total || b.ave - a.ave)
    },
  },

  methods: {
    openModal(player) {
      this.selectedPlayer = player
    },
    closeModal() {
      this.selectedPlayer = null
    },
    scoreOutOf10(player) {
      return Math.max(0, Math.min(10, player.ave)).toFixed(1)
    },
    scorePercent(player) {
      return Math.max(0, Math.min(100, (player.ave / 10) * 100))
    },
  },
}
</script>

<style lang="scss" scoped>
.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin-bottom: 2rem;
  border: 1px solid #333;
  border-radius: 4px;
}

.league-table {
  width: auto;
  min-width: 100%;
  border-collapse: collapse;
  border: none;

  th,
  td {
    border: 1px solid #333;
    text-align: center;
    padding: 6px 10px;
    white-space: nowrap;
    font-size: 0.9rem;
  }

  .sticky-col {
    position: sticky;
    z-index: 1;

    .bright & {
      background: $backgroundBright;
    }

    .dark & {
      background: $backgroundDark;
    }
  }

  thead .sticky-col {
    z-index: 2;
  }

  .rank-col {
    left: 0;
    min-width: 32px;
  }

  .player-col {
    left: 32px;
    text-align: left;
    min-width: 90px;
  }

  tbody .top-row td {
    background-color: #10c186;
    color: #fff;
  }

  tbody .top-row .sticky-col {
    background-color: #10c186 !important;
    color: #fff;
  }

  tbody tr:not(.top-row):hover td {
    opacity: 0.8;
  }
}

.player-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: $brandPrimary;
  font-weight: 600;
  font-size: inherit;
  font-family: inherit;
  text-decoration: underline;

  &:hover {
    opacity: 0.75;
  }

  .top-row & {
    color: #fff;
  }
}

// Modal

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal {
  border-radius: 12px;
  padding: 28px 24px 24px;
  max-width: 420px;
  width: 100%;
  position: relative;
  max-height: 90vh;
  overflow-y: auto;

  .bright & {
    background: $backgroundBright;
    color: $textBright;
  }

  .dark & {
    background: $sidebarDark;
    color: $textDark;
  }
}

.modal-close {
  position: absolute;
  top: 10px;
  right: 14px;
  background: none;
  border: none;
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
  opacity: 0.5;
  color: inherit;

  &:hover {
    opacity: 1;
  }
}

.modal-name {
  margin: 0 0 20px;
  font-size: 1.8rem;
  padding-top: 0;
}

.score-section {
  margin-bottom: 24px;
}

.score-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  opacity: 0.55;
  margin-bottom: 2px;
}

.score-value {
  font-size: 2.8rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 10px;
  color: $brandPrimary;
}

.score-max {
  font-size: 1rem;
  font-weight: 400;
  opacity: 0.5;
  color: inherit;
}

.score-bar {
  height: 8px;
  background: rgba(128, 128, 128, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  background: $brandPrimary;
  border-radius: 4px;
  transition: width 0.4s ease;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 20px;
}

.stat {
  border-radius: 8px;
  padding: 10px 6px;
  text-align: center;

  .bright & {
    background: rgba(0, 0, 0, 0.05);
  }

  .dark & {
    background: rgba(255, 255, 255, 0.07);
  }

  &.negative .stat-value {
    color: #e74c3c;
  }
}

.stat-value {
  display: block;
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1;
  color: $brandPrimary;
  margin-bottom: 4px;
}

.stat-label {
  display: block;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.55;
}

.totals-row {
  display: flex;
  gap: 16px;
  border-top: 1px solid rgba(128, 128, 128, 0.2);
  padding-top: 16px;
}

.total-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.total-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.5;
}

.total-value {
  font-size: 1.3rem;
  font-weight: 700;
}

// Transition
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;

  .modal {
    transition: transform 0.2s ease;
  }
}

.modal-fade-enter,
.modal-fade-leave-to {
  opacity: 0;

  .modal {
    transform: scale(0.96);
  }
}
</style>
