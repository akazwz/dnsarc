# 多阶段构建，减少镜像体积
FROM golang:1.24-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装构建依赖
RUN apk add --no-cache git

# 复制go mod文件
COPY go.mod go.sum ./
# 下载依赖
RUN go mod download

# 复制源代码
COPY . .

# 构建应用（禁用CGO）
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o dnsarc .

# 运行阶段 - 使用 distroless 镜像
FROM gcr.io/distroless/static-debian12:nonroot

# 设置工作目录
WORKDIR /app

# 从构建阶段复制二进制文件
COPY --from=builder /app/dnsarc .
COPY --from=builder /app/data ./data

# distroless nonroot 镜像默认用户 65532:65532
# DNS 服务需要 CAP_NET_BIND_SERVICE 在 k8s securityContext 中设置
