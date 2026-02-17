# Defender-MCP

A lightweight Model Context Protocol (MCP) server that uses **PowerShell only** to scan files and report Windows Defender antivirus state.

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
| `DEFENDER_FILE_SCAN_TIMEOUT_MS` | `60000` | File scan timeout in ms (clamped to `1000..3600000`) |
| `DEFENDER_QUICK_SCAN_TIMEOUT_MS` | `600000` | Quick scan timeout in ms (clamped to `1000..3600000`) |
| `DEFENDER_STATUS_TIMEOUT_MS` | `30000` | Status query timeout in ms (clamped to `1000..3600000`) |
| `DEFENDER_ALLOWED_PATHS` | current working directory | Comma-separated absolute allowlist for `scan_file`; use `*` to disable restriction |
| `DEFENDER_EXECUTION_POLICY` | `RemoteSigned` | PowerShell execution policy (`Bypass` is opt-in if explicitly set) |
| `DEFENDER_POWERSHELL_PATH` | `powershell.exe` | PowerShell executable |

## Requirements

- Windows with Windows Defender
- Node.js >= 18
- Elevated privileges are not required for basic status queries; scan behavior can vary by local policy.

## Testing

```bash
npm test
```
