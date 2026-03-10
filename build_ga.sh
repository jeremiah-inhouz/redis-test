#!/bin/bash
set -euo pipefail
SHA=$(git rev-parse --short HEAD)
while [[ $# -gt 0 ]]; do
    case $1 in
    --sha)
        SHA="$2"
        shift 2
        ;;
    --region)
        REGION="$2"
        shift 2
        ;;
    --zone)
        ZONE="$2"
        shift 2
        ;;
    --cluster)
        CLUSTER="$2"
        shift 2
        ;;
    --project-id)
        PROJECT_ID="$2"
        shift 2
        ;;
    --repo-region)
        REPO_REGION="$2"
        shift 2
        ;;
    --repo-name)
        REPO_NAME="$2"
        shift 2
        ;;
    *)
        echo "Unknown argument: $1"
        exit 1
        ;;
    esac
done
if [[ -n "${REGION:-}" && -n "${ZONE:-}" ]]; then
    echo "Error: --region and --zone are mutually exclusive"
    exit 1
fi
if [[ -z "${REGION:-}" && -z "${ZONE:-}" ]] || [[ -z "${CLUSTER:-}" ]] ||
    [[ -z "${PROJECT_ID:-}" ]] || [[ -z "${REPO_REGION:-}" ]] || [[ -z "${REPO_NAME:-}" ]]; then
    echo "Error: --cluster, --project-id, --repo-region, --repo-name and either --region or --zone are required"
    exit 1
fi
REGISTRY="${REPO_REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}"
IMAGE="${REGISTRY}/redis_test_ms"
# Build & Push
docker build -t "${IMAGE}:latest" -t "${IMAGE}:${SHA}" -f Dockerfile .
docker push "${IMAGE}:latest"
docker push "${IMAGE}:${SHA}"
# Deploy
if [[ -n "${ZONE:-}" ]]; then
    gcloud config set compute/zone "${ZONE}"
else
    gcloud config set compute/region "${REGION}"
fi
gcloud container clusters get-credentials "${CLUSTER}"
kubectl apply -f k8s/secret-provider-class.yaml
kubectl apply -f k8s/deployment.yaml
kubectl set image deployment/redis-test-ms-deployment redis-test-ms="${IMAGE}:${SHA}" -n dev
