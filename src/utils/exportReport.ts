import { downloadTextFile } from './downloadFile'

export interface ExportLine {
  type: 'added' | 'removed' | 'unchanged'
  leftLine: string
  rightLine: string
  leftLineNumber?: number
  rightLineNumber?: number
}

export function exportHtml(leftText: string, rightText: string, leftName: string, rightName: string, lines: ExportLine[]) {
  let body = ''
  for (const line of lines) {
    const cls = line.type === 'added' ? 'add' : line.type === 'removed' ? 'del' : 'unchanged'
    const left = escapeHtml(line.leftLine || '')
    const right = escapeHtml(line.rightLine || '')
    body += `      <tr class="${cls}"><td class="ln">${line.leftLineNumber ?? ''}</td><td>${left}</td><td class="ln">${line.rightLineNumber ?? ''}</td><td>${right}</td></tr>\n`
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Diff Report</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Consolas', 'Monaco', monospace; font-size: 13px; background: #fff; color: #333; }
.header { padding: 12px 16px; background: #f5f5f5; border-bottom: 1px solid #ddd; font-size: 14px; }
table { width: 100%; border-collapse: collapse; }
td { padding: 2px 8px; white-space: pre-wrap; vertical-align: top; }
.ln { color: #999; text-align: right; width: 50px; user-select: none; }
tr.add td { background: #e6ffed; }
tr.del td { background: #ffeef0; }
tr.unchanged td { background: #fff; }
tr.add td:last-child { background: #ccffd8; }
tr.del td:first-child { background: #ffd7d5; }
</style>
</head>
<body>
<div class="header">Diff: ${escapeHtml(leftName)} vs ${escapeHtml(rightName)}</div>
<table>
<tbody>
${body}
</tbody>
</table>
</body>
</html>`

  downloadTextFile(html, 'diff-report.html')
}

export function exportJson(leftText: string, rightText: string, leftName: string, rightName: string, lines: ExportLine[]) {
  const json = JSON.stringify({ leftName, rightName, lines }, null, 2)
  downloadTextFile(json, 'diff-report.json')
}

export function buildDiffLines(leftText: string, rightText: string): ExportLine[] {
  const leftLines = leftText.split('\n')
  const rightLines = rightText.split('\n')
  const maxLen = Math.max(leftLines.length, rightLines.length)
  const result: ExportLine[] = []
  for (let i = 0; i < maxLen; i++) {
    const left = leftLines[i] ?? ''
    const right = rightLines[i] ?? ''
    if (left !== right) {
      if (left === '' && right !== '') {
        result.push({ type: 'added', leftLine: '', rightLine: right, rightLineNumber: i + 1 })
      } else if (right === '' && left !== '') {
        result.push({ type: 'removed', leftLine: left, rightLine: '', leftLineNumber: i + 1 })
      } else {
        result.push({ type: 'added', leftLine: left, rightLine: right, leftLineNumber: i + 1, rightLineNumber: i + 1 })
      }
    } else {
      result.push({ type: 'unchanged', leftLine: left, rightLine: right, leftLineNumber: i + 1, rightLineNumber: i + 1 })
    }
  }
  return result
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
