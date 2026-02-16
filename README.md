# Defender-MCP

MCP server that enables AI agents to scan files using Windows Defender APIs.

## Features

- **File Scanning** — Scan specific files or run quick system scans
- **Threat Detection** — Query detected threats with severity, category, and remediation status
- **Status Monitoring** — Check Defender protection status and signature versions
- **Signature Updates** — Trigger definition updates
- **Async Scans** — Non-blocking scan operations with job polling

## Requirements

- Windows 10/11 or Windows Server with Microsoft Defender
- Node.js 18+
- Administrator privileges (for scan operations)
- PowerShell 5.1+ (included with Windows)

## Installation

```bash
npm install
npm run build
```

## Usage

### As MCP Server (stdio)

```json
{
  "mcpServers": {
    "defender": {
      "command": "node",
      "args": ["C:/path/to/Defender-MCP/dist/index.js"]
    }
  }
}
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DEFENDER_MAX_CONCURRENT_SCANS` | `4` | Max parallel scan jobs |
| `DEFENDER_SCAN_TIMEOUT_MS` | `300000` | Scan timeout (5 min) |
| `DEFENDER_ALLOWED_PATHS` | `*` | Comma-separated allowed directories |
| `DEFENDER_CACHE_TTL_MS` | `60000` | Result cache TTL |

## Tools Reference

| Tool | Description |
|------|-------------|
| `scan_file` | Scan a specific file or directory |
| `quick_scan` | Run a quick system-wide scan |
| `get_defender_status` | Get protection status and signature info |
| `get_threats` | List detected threats |
| `get_threat_detections` | Detailed detection history |
| `update_signatures` | Trigger signature update |
| `get_scan_status` | Poll async scan job status |

## Security

- All paths validated against traversal attacks
- Files are never read directly — only passed to Defender APIs
- Configuration is read-only (no exclusion modification)
- Concurrent scans are rate-limited

## License

MIT
