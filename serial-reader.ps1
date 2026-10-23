param([string]$PortName = 'COM5')
$ErrorActionPreference = 'Stop'
while ($true) {
  $serial = $null
  try {
    $serial = New-Object System.IO.Ports.SerialPort $PortName,9600,None,8,one
    $serial.ReadTimeout = 1000
    $serial.DtrEnable = $true
    $serial.Open()
    [Console]::WriteLine('STATUS,CONNECTED')
    while ($true) {
      try { [Console]::WriteLine($serial.ReadLine().Trim()) }
      catch [System.TimeoutException] { }
    }
  } catch { [Console]::WriteLine('STATUS,ERROR,' + $_.Exception.Message) }
  finally { if ($serial) { $serial.Dispose() } }
  Start-Sleep -Seconds 3
}
