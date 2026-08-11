#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const dataPath = path.join(__dirname, '../data/league-table.json')
const mdPath = path.join(__dirname, '../docs/thursday-league-table.md')

const players = JSON.parse(fs.readFileSync(dataPath, 'utf8'))

players.forEach(p => {
  p.total = (p.played * 1) + (p.won * 3) + (p.draw * 1)
    + (p.mom * 3) + (p.momSplit * 1.5) + (p.ps * 2)
    + (p.loy ? p.loy * 1 : 0) + (p.late * -1) + (p.doOut * -1)

  p.ave = p.played > 0
    ? Number(((p.total / p.played) * 10 / 10).toString().match(/^\d+(?:\.\d{0,2})?/))
    : 0
})

players.sort((a, b) => b.total - a.total || b.ave - a.ave)

const header = '**Player**|**P**|**W**|**D**|**L**|**PS**|**DO**|**Loy**|**Late**|**Vs**|**MoM**|**MoMS**|**Tot**|**Ave**'
const align  = ':-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:'
const rows   = players.map(p =>
  `${p.name}|${p.played}|${p.won}|${p.draw}|${p.lost}|${p.ps}|${p.doOut}|${p.loy}|${p.late}|${p.vs}|${p.mom}|${p.momSplit}|${p.total}|${p.ave}`
)

const newTable = [header, align, ...rows].join('\n')

const md = fs.readFileSync(mdPath, 'utf8')
const updated = md.replace(
  /\*\*Player\*\*\|[^\n]*\n:-----:[^\n]*\n([^\n]*\|[^\n]*\n)*/,
  newTable + '\n'
)

fs.writeFileSync(mdPath, updated)
console.log(`Updated table for ${players.length} player(s).`)
players.forEach(p => console.log(`  ${p.name}: Tot=${p.total} Ave=${p.ave}`))
