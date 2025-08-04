lint:
	cd backend && golangci-lint run

DOCKER_USERNAME := akazwz
IMAGE_NAME      := $(DOCKER_USERNAME)/dnsarc
FRONTEND_IMAGE_NAME := $(DOCKER_USERNAME)/dnsarc-frontend

gen: 
	buf generate

build:
	cd backend && docker buildx build --platform linux/amd64 -t $(IMAGE_NAME):latest --load .

push:
	cd backend && docker buildx build --platform linux/amd64 -t $(IMAGE_NAME):latest --push .

push-frontend:
	cd frontend && docker buildx build --platform linux/amd64 -t $(FRONTEND_IMAGE_NAME):latest --push .

deploy:
	kubectl apply -f backend/k8s/base/
	kubectl apply -f backend/k8s/api/
	kubectl apply -f backend/k8s/dns/

deploy-frontend:
	kubectl apply -f frontend/k8s/

update:
	kubectl rollout restart deployment dnsarc-api dnsarc-dns-deployment

update-frontend:
	kubectl rollout restart deployment dnsarc-frontend

secret:
	kubectl delete secret dnsarc-config --ignore-not-found=true
	kubectl create secret generic dnsarc-config --from-env-file=backend/.env
