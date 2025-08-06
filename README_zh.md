# DNSARC

<div align="center">
  <img src="frontend/public/icon-192.png" alt="DNSARC Logo" width="64" height="64">
  
  <h3>🚀 智能权威DNS服务器</h3>
  <p>⚡ 闪电般快速的DNS解析 + 智能缓存 + 实时管理</p>
  
  <p>
    <img src="https://img.shields.io/badge/Go-1.24.5-blue?logo=go" alt="Go Version">
    <img src="https://img.shields.io/badge/React-19.1.0-blue?logo=react" alt="React Version">
    <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
    <img src="https://img.shields.io/badge/Docker-Ready-blue?logo=docker" alt="Docker">
    <img src="https://img.shields.io/badge/Kubernetes-Ready-blue?logo=kubernetes" alt="Kubernetes">
    <img src="https://img.shields.io/badge/Performance-⚡%20Fast-brightgreen" alt="Performance">
    <img src="https://img.shields.io/github/stars/akazwz/dnsarc?style=social" alt="GitHub stars">
  </p>
  
  <p>
    <strong>🇨🇳 中文</strong> | <a href="README.md">🇺🇸 English</a>
  </p>
</div>

## ✨ 为什么选择 DNSARC？

- 🚀 **10倍更快的DNS解析** - Go优化后端 + 智能缓存，秒杀传统DNS服务器
- 🎯 **零配置启动** - 5分钟内让你的权威DNS服务器运行起来
- 💡 **开发者优先设计** - 美观的Web界面 + 强大的API，适配现代工作流
- 🔒 **企业级安全** - Google SSO、JWT令牌、请求验证，开箱即用
- 📈 **轻松扩展** - 从个人项目到企业级应用，Kubernetes就绪
- 🌍 **全球性能** - 布隆过滤器 + 多级缓存，全世界都能快速访问
- 🔄 **实时更新** - DNS变更瞬间同步到整个基础设施
- 🛠️ **生产就绪** - Docker容器、健康检查、监控，一应俱全
- 💰 **开源免费** - 无厂商锁定，按需定制

## 🏗️ 架构

DNSARC采用现代微服务架构，包含以下核心组件：

### 后端服务
- **DNS服务器** (`dns`) - 权威DNS解析服务
- **API服务器** (`api`) - Web管理界面后端
- **数据库** - PostgreSQL存储DNS记录和用户数据
- **缓存** - Redis提供发布订阅事件通信

### 前端应用
- **管理面板** - React Router v7 + TypeScript
- **UI组件** - Radix UI + Tailwind CSS
- **状态管理** - Zustand + React Query

## 🚀 快速开始

### 环境要求

- Go
- Node.js
- PostgreSQL
- Redis
- Docker

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

我们 ❤️ 欢迎贡献！DNSARC 由社区构建，为社区服务。

### 🌟 贡献方式
- 🐛 **报告bug** - 帮助我们改进
- 💡 **建议功能** - 分享你的想法  
- 📝 **改进文档** - 让其他人更容易使用
- 🔧 **提交PR** - 直接贡献代码
- ⭐ **给仓库点星** - 表达你的支持！

### 🚀 贡献者快速开始
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