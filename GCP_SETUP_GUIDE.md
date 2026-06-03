# GCP GitHub Actions Setup Guide

This document explains how to set up the GitHub Actions workflow to authenticate with GCP and push Docker images to Artifact Registry.

## Prerequisites

- GCP project with Artifact Registry API enabled
- GitHub repository with admin access
- `gcloud` CLI installed locally

## Step 1: Enable Required GCP APIs

```bash
gcloud services enable \
  artifactregistry.googleapis.com \
  cloudresourcemanager.googleapis.com \
  iamcredentials.googleapis.com \
  sts.googleapis.com
```

## Step 2: Create Artifact Registry Repository

Create a repository in Artifact Registry to store your Docker images:

```bash
gcloud artifacts repositories create core-service \
  --repository-format=docker \
  --location=us-central1 \
  --project=1015949672422
```

## Step 3: Set Up Workload Identity Federation (WIF)

Workload Identity Federation allows GitHub Actions to authenticate to GCP without storing long-lived credentials.

### 3a. Create a Workload Identity Provider

```bash
gcloud iam workload-identity-pools create github-pool \
  --project=1015949672422 \
  --location=global \
  --display-name="GitHub Actions Pool"
```

### 3b. Create a Workload Identity Provider (OIDC)

```bash
gcloud iam workload-identity-pools providers create-oidc github \
  --project=1015949672422 \
  --location=global \
  --workload-identity-pool=github-pool \
  --display-name="GitHub OIDC Provider" \
  --attribute-mapping="google.subject=assertion.sub,assertion.aud=assertion.aud,assertion.repository=assertion.repository" \
  --issuer-uri=https://token.actions.githubusercontent.com \
  --attribute-condition="assertion.repository == 'opening-drill/core-service'"
```

### 3c. Get the Workload Identity Provider Resource Name

```bash
gcloud iam workload-identity-pools providers describe github \
  --project=1015949672422 \
  --location=global \
  --workload-identity-pool=github-pool \
  --format="value(name)"
```

This will output something like:

```
projects/1015949672422/locations/global/workloadIdentityPools/github-pool/providers/github
```

## Step 4: Create a Service Account

```bash
gcloud iam service-accounts create github-actions \
  --project=1015949672422 \
  --display-name="GitHub Actions Service Account"
```

## Step 5: Grant Artifact Registry Permissions

```bash
gcloud projects add-iam-policy-binding 1015949672422 \
  --member=serviceAccount:github-actions@1015949672422.iam.gserviceaccount.com \
  --role=roles/artifactregistry.writer
```

## Step 6: Grant Workload Identity User Role

```bash
gcloud iam service-accounts add-iam-policy-binding \
  github-actions@1015949672422.iam.gserviceaccount.com \
  --project=1015949672422 \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/1015949672422/locations/global/workloadIdentityPools/github-pool/attribute.repository/opening-drill/core-service"
```

## Step 7: Add GitHub Secrets

Add the following secrets to your GitHub repository (Settings → Secrets and variables → Actions):

1. **`WIF_PROVIDER`**: The Workload Identity Provider resource name from Step 3c

   ```
   projects/1015949672422/locations/global/workloadIdentityPools/github-pool/providers/github
   ```

2. **`WIF_SERVICE_ACCOUNT`**: The service account email
   ```
   github-actions@1015949672422.iam.gserviceaccount.com
   ```

## Step 8: Test the Workflow

1. Create a pull request to trigger the workflow
2. Go to the **Actions** tab in your GitHub repository
3. Click on the **Build and Push Docker Image to GCP** workflow
4. Monitor the build progress

## Verifying the Image

Once the workflow succeeds, verify the image was pushed:

```bash
gcloud artifacts docker images list us-central1-docker.pkg.dev/1015949672422/core-service \
  --project=1015949672422
```

Or view it in the GCP Console:

- Go to [Artifact Registry](https://console.cloud.google.com/artifacts)
- Select `us-central1` region
- Click on `core-service` repository

## Troubleshooting

### Authentication Failed

- Verify the `WIF_PROVIDER` and `WIF_SERVICE_ACCOUNT` secrets are correctly set
- Ensure the service account has the `iam.workloadIdentityUser` role

### Image Push Failed

- Check that the Artifact Registry repository exists
- Verify the service account has `artifactregistry.writer` role

### Build Failed

- Check the Dockerfile is valid
- Ensure all build dependencies are available
