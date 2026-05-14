param(
    [string]$ServiceName = $(Split-Path -Leaf (Get-Location)),
    [string]$Region = "us-central1"
)

Write-Output "Project: $(gcloud.cmd config get-value project --quiet)"

# Detect project type
if (Test-Path package.json) {
    $type = "node"
} elseif (Test-Path requirements.txt) {
    $type = "python"
} else {
    Write-Error "Could not detect project type (no package.json or requirements.txt)."
    exit 1
}

if ($type -eq "node") {
    Write-Output "Detected Node project. Installing dependencies and building..."
    & npm.cmd ci
    & npm.cmd run build
} else {
    Write-Output "Detected Python project. Installing dependencies..."
    python -m pip install -r requirements.txt
}

# Prepare secret-based environment variable if GEMINI_API_KEY is present in local environment
$secretFlag = ""
if ($env:GEMINI_API_KEY) {
    $project = & gcloud.cmd config get-value project --quiet
    $secretName = "$($ServiceName)-gemini-key"

    Write-Output "Creating/updating Secret Manager secret: $secretName"
    # Check if secret exists
    & gcloud.cmd secrets describe $secretName --project $project --quiet > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
        # create secret and add value from env
        $env:GEMINI_API_KEY | & gcloud.cmd secrets create $secretName --data-file=- --project $project --quiet
    } else {
        $env:GEMINI_API_KEY | & gcloud.cmd secrets versions add $secretName --data-file=- --project $project --quiet
    }

    $secretFlag = "--set-secrets GEMINI_API_KEY=${secretName}:latest"
    Write-Output "Will deploy using Secret Manager secret: $secretName"
} else {
    Write-Output "No GEMINI_API_KEY found in environment. You can either set it locally or create a secret manually."
}

Write-Output "Deploying service '$ServiceName' to region '$Region'..."

$deployArgs = @("run", "deploy", $ServiceName, "--source", ".", "--region", $Region, "--allow-unauthenticated", "--port", "8080", "--quiet")
if ($secretFlag -ne "") { $deployArgs += $secretFlag }

& gcloud.cmd @deployArgs

Write-Output "If deployment succeeded, fetch service URL:"
& gcloud.cmd run services describe $ServiceName --region $Region --format="value(status.url)"
