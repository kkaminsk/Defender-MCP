# Defender-MCP

A lightweight Model Context Protocol (MCP) server that uses **PowerShell only** to scan files and report Windows Defender antivirus state. No MpCmdRun.exe, no WMI, no AMSI.

## Tools

| Tool | Description |
|------|-------------|
| `scan_file` | Scan a single file path using Windows Defender |
| `quick_scan` | Trigger a system-wide quick scan |
| `get_status` | Report current antivirus state |

## Setup

```bash
npm install
npm run build
```

## Usage

```json
{
  "mcpServers": {
    "defender": {
      "command": "node",
      "args": ["C:/Temp/GitHub/Defender-MCP/dist/index.js"]
    }
  }
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DEFENDER_FILE_SCAN_TIMEOUT_MS` | `60000` | File scan timeout |
| `DEFENDER_QUICK_SCAN_TIMEOUT_MS` | `600000` | Quick scan timeout |
| `DEFENDER_POWERSHELL_PATH` | `powershell.exe` | PowerShell executable |

## Requirements

- Windows with Windows Defender
- Node.js >= 18
- No admin privileges required

## Testing

```bash
npm test
```
