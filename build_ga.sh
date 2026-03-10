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

if [[ -z "${REGION:-}" && -z "${ZONE:-}" ]] || [[ -z "${CLUSTER:-}" ]] || [[ -z "${PROJECT_ID:-}" ]]; then
    echo "Error: --cluster, --project-id and either --region or --zone are required"
    exit 1
fi

REGISTRY="us-central1-docker.pkg.dev/inhouz-dev/inhouzio-dev-repo"
IMAGE="${REGISTRY}/redis_test_ms"

# Build & Push
docker build -t "${IMAGE}:latest" -t "${IMAGE}:${SHA}" -f Dockerfile .
docker push "${IMAGE}:latest"
docker push "${IMAGE}:${SHA}"

# Deploy
if [[ -n "${ZONE:-}" ]]; then
    gcloud container clusters get-credentials "${CLUSTER}" --zone "${ZONE}" --project "${PROJECT_ID}"
else
    gcloud container clusters get-credentials "${CLUSTER}" --region "${REGION}" --project "${PROJECT_ID}"
fi

kubectl apply -f k8s/secret-provider-class.yaml
kubectl apply -f k8s/deployment.yaml
kubectl set image deployment/redis-test-ms-deployment redis-test-ms="${IMAGE}:${SHA}" -n dev
