lint:
	cd backend && golangci-lint run

DOCKER_USERNAME := akazwz
IMAGE_NAME      := $(DOCKER_USERNAME)/dnsarc

gen: 
	buf generate

build:
	cd backend && docker buildx build --platform linux/amd64 -t $(IMAGE_NAME):latest --load .

push:
	cd backend && docker buildx build --platform linux/amd64 -t $(IMAGE_NAME):latest --push .

deploy:
	kubectl apply -f backend/k8s/base/
	kubectl apply -f backend/k8s/api/
	kubectl apply -f backend/k8s/dns/

update:
	kubectl rollout restart daemonset dnsarc-dns-daemonset
	kubectl rollout restart deployment dnsarc-api

secret:
	kubectl delete secret dnsarc-config --ignore-not-found=true
	kubectl create secret generic dnsarc-config --from-env-file=backend/.env
