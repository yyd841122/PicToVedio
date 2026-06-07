param(
  [Parameter(Mandatory = $true)]
  [string]$Source,

  [string]$OutputDirectory = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

function New-ResizedPng {
  param(
    [System.Drawing.Image]$SourceImage,
    [int]$Size,
    [string]$Path
  )

  $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
  $bitmap.SetResolution(96, 96)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
    $graphics.Clear([System.Drawing.Color]::White)
    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.DrawImage($SourceImage, 0, 0, $Size, $Size)
    $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}

function Get-PngBytes {
  param(
    [System.Drawing.Image]$SourceImage,
    [int]$Size
  )

  $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $stream = New-Object System.IO.MemoryStream
  try {
    $graphics.Clear([System.Drawing.Color]::White)
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.DrawImage($SourceImage, 0, 0, $Size, $Size)
    $bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
    return ,$stream.ToArray()
  } finally {
    $stream.Dispose()
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}

function Write-MultiSizeIcon {
  param(
    [System.Drawing.Image]$SourceImage,
    [int[]]$Sizes,
    [string]$Path
  )

  $images = @($Sizes | ForEach-Object {
    [byte[]]$pngBytes = Get-PngBytes -SourceImage $SourceImage -Size $_
    [pscustomobject]@{
      Size = $_
      Bytes = $pngBytes
    }
  })

  $stream = New-Object System.IO.MemoryStream
  $writer = New-Object System.IO.BinaryWriter($stream)
  try {
    $writer.Write([uint16]0)
    $writer.Write([uint16]1)
    $writer.Write([uint16]$images.Count)

    $offset = 6 + (16 * $images.Count)
    foreach ($image in $images) {
      $writer.Write([byte]$(if ($image.Size -ge 256) { 0 } else { $image.Size }))
      $writer.Write([byte]$(if ($image.Size -ge 256) { 0 } else { $image.Size }))
      $writer.Write([byte]0)
      $writer.Write([byte]0)
      $writer.Write([uint16]1)
      $writer.Write([uint16]32)
      $writer.Write([uint32]$image.Bytes.Length)
      $writer.Write([uint32]$offset)
      $offset += $image.Bytes.Length
    }

    foreach ($image in $images) {
      $writer.Write([byte[]]$image.Bytes)
    }

    [System.IO.File]::WriteAllBytes($Path, $stream.ToArray())
  } finally {
    $writer.Dispose()
    $stream.Dispose()
  }
}

$sourcePath = (Resolve-Path -LiteralPath $Source).Path
$outputPath = (Resolve-Path -LiteralPath $OutputDirectory).Path
$sourceImage = [System.Drawing.Bitmap]::FromFile($sourcePath)

try {
  $scanLeft = [int]($sourceImage.Width * 0.12)
  $scanTop = [int]($sourceImage.Height * 0.12)
  $scanRight = [int]($sourceImage.Width * 0.88)
  $scanBottom = [int]($sourceImage.Height * 0.88)
  $minX = $sourceImage.Width
  $minY = $sourceImage.Height
  $maxX = 0
  $maxY = 0

  for ($y = $scanTop; $y -lt $scanBottom; $y += 2) {
    for ($x = $scanLeft; $x -lt $scanRight; $x += 2) {
      $pixel = $sourceImage.GetPixel($x, $y)
      $maxChannel = [Math]::Max($pixel.R, [Math]::Max($pixel.G, $pixel.B))
      $minChannel = [Math]::Min($pixel.R, [Math]::Min($pixel.G, $pixel.B))
      if (($maxChannel - $minChannel) -ge 24 -and $maxChannel -lt 250) {
        $minX = [Math]::Min($minX, $x)
        $minY = [Math]::Min($minY, $y)
        $maxX = [Math]::Max($maxX, $x)
        $maxY = [Math]::Max($maxY, $y)
      }
    }
  }

  if ($maxX -le $minX -or $maxY -le $minY) {
    throw "Could not detect the central colored logo."
  }

  $logoWidth = $maxX - $minX + 1
  $logoHeight = $maxY - $minY + 1
  $padding = [int]([Math]::Max($logoWidth, $logoHeight) * 0.06)
  $cropSize = [Math]::Min(
    [Math]::Max($logoWidth, $logoHeight) + ($padding * 2),
    [Math]::Min($sourceImage.Width, $sourceImage.Height)
  )
  $centerX = [int](($minX + $maxX) / 2)
  $centerY = [int](($minY + $maxY) / 2)
  $cropX = [Math]::Max(0, [Math]::Min($sourceImage.Width - $cropSize, $centerX - [int]($cropSize / 2)))
  $cropY = [Math]::Max(0, [Math]::Min($sourceImage.Height - $cropSize, $centerY - [int]($cropSize / 2)))

  $cropped = New-Object System.Drawing.Bitmap($cropSize, $cropSize)
  $cropGraphics = [System.Drawing.Graphics]::FromImage($cropped)
  try {
    $cropGraphics.Clear([System.Drawing.Color]::White)
    $sourceRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropSize, $cropSize)
    $targetRect = New-Object System.Drawing.Rectangle(0, 0, $cropSize, $cropSize)
    $cropGraphics.DrawImage($sourceImage, $targetRect, $sourceRect, [System.Drawing.GraphicsUnit]::Pixel)

    $outputs = [ordered]@{
      "motionpic-logo.png" = 1024
      "favicon-16.png" = 16
      "favicon-32.png" = 32
      "favicon-48.png" = 48
      "apple-touch-icon.png" = 180
      "icon-192.png" = 192
      "icon-512.png" = 512
    }

    foreach ($entry in $outputs.GetEnumerator()) {
      New-ResizedPng -SourceImage $cropped -Size $entry.Value -Path (Join-Path $outputPath $entry.Key)
    }

    Write-MultiSizeIcon -SourceImage $cropped -Sizes @(16, 32, 48) -Path (Join-Path $outputPath "favicon.ico")
  } finally {
    $cropGraphics.Dispose()
    $cropped.Dispose()
  }

  Write-Output "Created MotionPic icon assets from crop x=$cropX y=$cropY size=$cropSize."
} finally {
  $sourceImage.Dispose()
}
