param(
  [ValidateSet('static','fullstack','all')]
  [string]$Mode = 'static',

  [string]$SftpHost,
  [string]$SftpUser,
  [int]$Port = 22,

  # Optional remote overrides
  [string]$StaticRemoteDir,
  [string]$FullstackRemoteDir,

  # Optional FTP/FTPS behavior when -Port 21 is used.
  # - explicit: use FTPS (explicit TLS)
  # - false:    force plain FTP
  [ValidateSet('explicit','false')]
  [string]$FtpSecure,

  # Optional: upload only these static files (relative to deploy/siteground/static/public_html)
  # Example: -StaticFiles index.html,robots.txt
  [string[]]$StaticFiles
)

$ErrorActionPreference = 'Stop'

function Read-Required([string]$Prompt) {
  while ($true) {
    $value = Read-Host $Prompt
    if ($null -ne $value -and $value.Trim().Length -gt 0) { return $value.Trim() }
  }
}

function Read-HostOrIp([string]$Prompt) {
  while ($true) {
    $value = (Read-Host $Prompt)
    if ($null -eq $value) { continue }
    $value = $value.Trim()
    if ($value.Length -eq 0) { continue }

    # Avoid accidental pastes (commands/paths/markdown links)
    if ($value -match '\s' -or $value -match '[\\/\[\]\(\)"\'']') {
      Write-Host 'Please enter only the SFTP host name (e.g. serverXX.siteground.biz) or an IP address.' -ForegroundColor Yellow
      continue
    }

    $isIpv4 = $value -match '^(?:\d{1,3}\.){3}\d{1,3}$'
    $isHost = $value -match '^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*$'
    if (-not ($isIpv4 -or $isHost)) {
      Write-Host 'Host format looks wrong. Example: serverXX.siteground.biz' -ForegroundColor Yellow
      continue
    }

    return $value
  }
}

if (-not $SftpHost) { $SftpHost = Read-HostOrIp 'Host (e.g. serverXX.siteground.biz or ftp.yourdomain.com)' }
if (-not $SftpUser) { $SftpUser = Read-Required 'Username' }

$securePass = Read-Host 'Password' -AsSecureString
$plainPass = $null
try {
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass)
  $plainPass = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
} finally {
  if ($bstr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
}

$env:SG_HOST = $SftpHost
$env:SG_USER = $SftpUser
$env:SG_PASS = $plainPass
$env:SG_PORT = "$Port"
$env:SG_MODE = $Mode

# If the user passes port 21, assume FTP credentials (not SFTP).
# Default behavior remains SFTP on port 22.
if ($Port -eq 21) {
  $env:SG_PROTOCOL = 'ftp'
} else {
  $env:SG_PROTOCOL = 'sftp'
}

if ($FtpSecure) {
  $env:SG_FTP_SECURE = $FtpSecure
}

if ($StaticRemoteDir) { $env:SG_STATIC_REMOTE_DIR = $StaticRemoteDir }
if ($FullstackRemoteDir) { $env:SG_FULLSTACK_REMOTE_DIR = $FullstackRemoteDir }
if ($StaticFiles -and $StaticFiles.Count -gt 0) { $env:SG_STATIC_FILES = ($StaticFiles -join ',') }

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

$npmCmd = Join-Path $env:ProgramFiles 'nodejs\npm.cmd'
if (-not (Test-Path $npmCmd)) {
  throw "npm.cmd not found at: $npmCmd"
}

Write-Host ("Uploading via {0} (mode={1}) to {2}:{3} as {4} ..." -f $env:SG_PROTOCOL.ToUpper(), $Mode, $SftpHost, $Port, $SftpUser) -ForegroundColor Cyan
& $npmCmd run upload:siteground

# Best-effort cleanup
$env:SG_PASS = $null
$env:SG_FTP_SECURE = $null
