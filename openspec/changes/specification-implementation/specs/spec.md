# Defender-MCP Specification Tests

## scan_file

### Scenario: Scan a clean file
GIVEN a valid absolute file path to an existing file
WHEN scan_file is called with that path
THEN the result has scanned=true and threats_found=0

### Scenario: Scan a file with threats
GIVEN a valid absolute file path that triggers a detection
WHEN scan_file is called with that path
THEN the result has scanned=true, threats_found>0, and threats array with name/severity/status/detected_at

### Scenario: File not found
GIVEN an absolute file path that does not exist
WHEN scan_file is called
THEN the result has scanned=false and error containing "File not found"

### Scenario: Relative path rejected
GIVEN a relative file path
WHEN scan_file is called
THEN the result has scanned=false and error "Path must be absolute"

### Scenario: Path traversal rejected
GIVEN a path containing ".."
WHEN scan_file is called
THEN the result has scanned=false and error "Path traversal not allowed"

### Scenario: UNC path rejected
GIVEN a path starting with "\\\\"
WHEN scan_file is called
THEN the result has scanned=false and error "UNC paths not allowed"

### Scenario: Null bytes rejected
GIVEN a path containing null bytes
WHEN scan_file is called
THEN the result has scanned=false and error "Null bytes not allowed"

### Scenario: Scan timeout
GIVEN a file scan that exceeds the timeout
WHEN scan_file is called
THEN the result has scanned=false and error "Scan timed out"

## quick_scan

### Scenario: Successful quick scan
GIVEN Windows Defender is operational
WHEN quick_scan is called
THEN the result has scan_type="QuickScan", completed=true

### Scenario: Quick scan timeout
GIVEN the quick scan exceeds 10 minutes
WHEN quick_scan is called
THEN the result has completed=false and error "Scan timed out"

### Scenario: Quick scan failure
GIVEN PowerShell returns an error
WHEN quick_scan is called
THEN the result has completed=false with error message

## get_status

### Scenario: Successful status retrieval
GIVEN Windows Defender is installed and running
WHEN get_status is called
THEN the result includes antivirus_enabled, realtime_protection, signature_version, computer_state, and all required fields

### Scenario: Status retrieval failure
GIVEN PowerShell fails to get status
WHEN get_status is called
THEN the result has error message and safe defaults for all boolean fields (false)

### Scenario: Computer state mapping
GIVEN Defender reports computer_state=0
WHEN get_status is called
THEN computer_state is mapped to "Clean"

## Validation

### Scenario: Empty path
GIVEN an empty string
WHEN validateFilePath is called
THEN the result is valid=false with error "File path is required"

### Scenario: Valid absolute path
GIVEN "C:\\Users\\test\\file.exe"
WHEN validateFilePath is called
THEN the result is valid=true

## PowerShell Execution

### Scenario: Script execution via temp file
GIVEN a PowerShell script string
WHEN runPowerShell is called
THEN the script is written to a temp .ps1 file, executed with -NoProfile -NonInteractive -ExecutionPolicy Bypass -File, and temp file is cleaned up

### Scenario: Execution error
GIVEN PowerShell returns stderr
WHEN runPowerShell is called
THEN the promise rejects with the stderr message

### Scenario: Execution timeout
GIVEN the process exceeds timeoutMs
WHEN runPowerShell is called
THEN the process is killed and promise rejects with "Scan timed out"
