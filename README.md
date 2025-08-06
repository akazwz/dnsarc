# DNSARC

<div align="center">
  <img src="frontend/public/favicon-32.png" alt="DNSARC Logo" width="64" height="64">
  
  <h3>智能权威DNS服务器</h3>
  <p>现代化的权威DNS解决方案，专为开发者设计</p>
  
  <p>
    <img src="https://img.shields.io/badge/Go-1.24.5-blue?logo=go" alt="Go Version">
    <img src="https://img.shields.io/badge/React-19.1.0-blue?logo=react" alt="React Version">
    <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
    <img src="https://img.shields.io/badge/Docker-Ready-blue?logo=docker" alt="Docker">
    <img src="https://img.shields.io/badge/Kubernetes-Ready-blue?logo=kubernetes" alt="Kubernetes">
  </p>
</div>

## ✨ 特性

- 🚀 **高性能权威DNS服务器** - 基于Go语言开发，支持UDP/TCP协议
- 🌐 **现代化Web管理界面** - React + TypeScript构建的直观管理面板
- 🔐 **Google OAuth认证** - 安全的用户认证和授权系统
- ⚡ **智能缓存系统** - Redis + 内存多级缓存，极速响应
- 🎯 **布隆过滤器优化** - 高效的域名存在性检查
- 📡 **gRPC API** - 基于Protocol Buffers的现代化API设计
- 🐳 **容器化部署** - 完整的Docker和Kubernetes支持
- 📊 **实时事件系统** - Redis发布订阅的实时数据同步
- 🛡️ **安全防护** - JWT认证和请求拦截器

## 🏗️ 架构

DNSARC采用现代微服务架构，包含以下核心组件：

### 后端服务
- **DNS服务器** (`dns`) - 权威DNS解析服务
- **API服务器** (`api`) - Web管理界面后端
- **数据库** - PostgreSQL存储DNS记录和用户数据
- **缓存** - Redis提供高速缓存和事件通信

### 前端应用
- **管理面板** - React Router v7 + TypeScript
- **UI组件** - Radix UI + Tailwind CSS
- **状态管理** - Zustand + React Query

## 🚀 快速开始

### 环境要求

- Go 1.24.5+
- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- Docker & Docker Compose (可选)

### 本地开发

1. **克隆仓库**
```bash
git clone https://github.com/akazwz/dnsarc.git
cd dnsarc
```

2. **启动后端服务**
```bash
# 进入后端目录
cd backend

# 设置环境变量
export DATABASE_URL="postgres://user:password@localhost/dnsarc?sslmode=disable"
export REDIS_URL="redis://localhost:6379"
export JWT_SECRET="your-jwt-secret"
export GOOGLE_CLIENT_ID="your-google-client-id"
export GOOGLE_CLIENT_SECRET="your-google-client-secret"
export NS1="ns1.yourdomain.com"
export NS2="ns2.yourdomain.com"

# 启动API服务器
go run . api

# 启动DNS服务器
go run . dns
```

3. **启动前端应用**
```bash
# 进入前端目录
cd frontend

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

## 📦 部署

### Kubernetes部署

1. **创建配置密钥**
```bash
# 创建环境变量配置文件
cp backend/.env.example backend/.env
# 编辑 .env 文件，填入实际配置

# 创建Kubernetes密钥
make secret
```

2. **部署服务**
```bash
# 部署后端服务
make deploy

# 部署前端服务
make deploy-frontend
```

3. **更新服务**
```bash
# 更新后端
make update

# 更新前端
make update-frontend
```

### 构建和推送镜像

```bash
# 构建后端镜像
make build

# 推送后端镜像
make push

# 推送前端镜像
make push-frontend
```

## 🔧 配置

### 环境变量

#### 后端配置
```bash
# 数据库
DATABASE_URL=postgres://user:password@localhost/dnsarc?sslmode=disable

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-jwt-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URL=http://localhost:8080/auth/google/callback

# DNS设置
NS1=ns1.yourdomain.com
NS2=ns2.yourdomain.com
MBOX=admin.yourdomain.com

# 前端URL
FRONTEND_URL=http://localhost:5173
```

#### 前端配置
前端配置通过环境变量或构建时配置：

```bash
# API端点
VITE_API_URL=http://localhost:8080
```

## 📚 API文档

DNSARC使用gRPC和Protocol Buffers定义API，主要服务包括：

### 认证服务 (AuthService)
- `GoogleLoginURL` - 获取Google登录URL
- `WhoAmI` - 获取当前用户信息

### 域名区域服务 (ZoneService)
- `CreateZone` - 创建DNS区域
- `ListZones` - 列出用户的DNS区域
- `GetZone` - 获取指定区域信息
- `UpdateZone` - 更新区域设置
- `DeleteZone` - 删除区域

### DNS记录服务 (DNSRecordService)
- `CreateDNSRecord` - 创建DNS记录
- `ListDNSRecords` - 列出DNS记录
- `UpdateDNSRecord` - 更新DNS记录
- `DeleteDNSRecord` - 删除DNS记录

## 🛠️ 开发

### 生成代码

```bash
# 生成protobuf代码
make gen
```

### 代码检查

```bash
# Go代码检查
make lint
```

### 项目结构

```
dnsarc/
├── backend/                 # Go后端服务
│   ├── cmd/                # 命令行入口
│   ├── internal/           # 内部包
│   │   ├── api/           # API服务器
│   │   ├── dns/           # DNS服务器
│   │   ├── handlers/      # gRPC处理器
│   │   ├── models/        # 数据模型
│   │   └── services/      # 业务服务
│   ├── k8s/               # Kubernetes配置
│   └── gen/               # 生成的代码
├── frontend/               # React前端应用
│   ├── app/               # 应用源码
│   ├── gen/               # 生成的TS代码
│   └── k8s/               # K8s配置
└── proto/                 # Protocol Buffers定义
```

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 📄 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [miekg/dns](https://github.com/miekg/dns) - Go DNS库
- [Connect](https://connectrpc.com/) - 现代化RPC框架
- [React Router](https://reactrouter.com/) - React路由
- [Radix UI](https://www.radix-ui.com/) - 无障碍UI组件

## 📞 支持

如果你遇到问题或有疑问：

- 创建 [Issue](https://github.com/akazwz/dnsarc/issues)
- 查看 [文档](https://github.com/akazwz/dnsarc/wiki)
- 联系维护者

---

<div align="center">
  Made with ❤️ by akazwz
</div>