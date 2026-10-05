param(
    [Parameter(Mandatory = $true)]
    [string]$SourceLogo
)

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$source = [System.Drawing.Image]::FromFile((Resolve-Path -LiteralPath $SourceLogo))

function Save-TransparentLogo([string]$Path, [int]$Width, [int]$Height) {
    $bitmap = New-Object System.Drawing.Bitmap $Width, $Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $bitmap.SetResolution(72, 72)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $scale = [Math]::Min($Width / $source.Width, $Height / $source.Height)
    $drawWidth = [int][Math]::Round($source.Width * $scale)
    $drawHeight = [int][Math]::Round($source.Height * $scale)
    $graphics.DrawImage($source, [int](($Width - $drawWidth) / 2), [int](($Height - $drawHeight) / 2), $drawWidth, $drawHeight)
    $graphics.Dispose()
    $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bitmap.Dispose()
}

function Save-AppIcon([string]$Path, [int]$Size) {
    $bitmap = New-Object System.Drawing.Bitmap $Size, $Size, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $bitmap.SetResolution(72, 72)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#FFF9F0'))
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $maxWidth = $Size * 0.88
    $maxHeight = $Size * 0.44
    $scale = [Math]::Min($maxWidth / $source.Width, $maxHeight / $source.Height)
    $drawWidth = [int][Math]::Round($source.Width * $scale)
    $drawHeight = [int][Math]::Round($source.Height * $scale)
    $graphics.DrawImage($source, [int](($Size - $drawWidth) / 2), [int](($Size - $drawHeight) / 2), $drawWidth, $drawHeight)
    $graphics.Dispose()
    $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bitmap.Dispose()
}

$displayTargets = @(
    'src\assets\images\cedugames-logo.png',
    'android\app\src\main\res\drawable\cedugames_logo.png'
)
foreach ($target in $displayTargets) {
    Copy-Item -LiteralPath $SourceLogo -Destination (Join-Path $root $target) -Force
}

$launchTargets = @(
    @('ios\CeduGames\Images.xcassets\LaunchLogo.imageset\launch-logo.png', 661, 264),
    @('ios\CeduGames\Images.xcassets\LaunchLogo.imageset\launch-logo@2x.png', 1322, 529),
    @('ios\CeduGames\Images.xcassets\LaunchLogo.imageset\launch-logo@3x.png', 1983, 793)
)
foreach ($target in $launchTargets) {
    Save-TransparentLogo (Join-Path $root $target[0]) $target[1] $target[2]
}

$iosIcons = @{
    'icon-20@2x.png' = 40; 'icon-20@3x.png' = 60
    'icon-29@2x.png' = 58; 'icon-29@3x.png' = 87
    'icon-40@2x.png' = 80; 'icon-40@3x.png' = 120
    'icon-60@2x.png' = 120; 'icon-60@3x.png' = 180
    'icon-marketing.png' = 1024
}
$iosIconRoot = Join-Path $root 'ios\CeduGames\Images.xcassets\AppIcon.appiconset'
foreach ($entry in $iosIcons.GetEnumerator()) {
    Save-AppIcon (Join-Path $iosIconRoot $entry.Key) $entry.Value
}

$androidIcons = @{ 'mdpi' = 48; 'hdpi' = 72; 'xhdpi' = 96; 'xxhdpi' = 144; 'xxxhdpi' = 192 }
foreach ($entry in $androidIcons.GetEnumerator()) {
    $folder = Join-Path $root "android\app\src\main\res\mipmap-$($entry.Key)"
    Save-AppIcon (Join-Path $folder 'ic_launcher.png') $entry.Value
    Save-AppIcon (Join-Path $folder 'ic_launcher_round.png') $entry.Value
}

Save-AppIcon (Join-Path $root 'src\assets\images\app-icon-1024.png') 1024
$source.Dispose()
