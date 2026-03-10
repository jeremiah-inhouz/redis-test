docker build -t inhouz/app_builder_ms:latest -t inhouz/app_builder_ms:$SHA -f Dockerfile .

docker push inhouz/app_builder_ms:latest

docker push inhouz/app_builder_ms:$SHA

gcloud config set compute/region europe-central2
gcloud container clusters get-credentials inhouz-prod-region-europecentral2 
kubectl apply -f k8s
kubectl set image deployments/app-builder-ms-deployment app-builder-ms=inhouz/app_builder_ms:$SHA

gcloud config set compute/region us-central1
gcloud container clusters get-credentials inhouz-prod-region-uscentral
kubectl apply -f k8s
kubectl set image deployments/app-builder-ms-deployment app-builder-ms=inhouz/app_builder_ms:$SHA