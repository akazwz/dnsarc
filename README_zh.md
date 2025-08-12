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
- ⚖️ **智能负载均衡** - 基于权重的流量分配与自动故障转移
- 🔗 **CNAME拉平** - 支持APEX域名CNAME记录的自动解析

## 🎯 核心特性

### 🌐 高级DNS功能
- **基于权重的负载均衡**: 根据可配置权重在多个服务器间分配流量
- **CNAME拉平**: 支持APEX域名的CNAME记录并自动解析为A记录
- **多种记录类型**: 支持A、AAAA、CNAME、MX、TXT、NS、SOA和CAA记录
- **实时更新**: 通过Redis发布订阅实现DNS变更的即时传播

### ⚡ 性能与可靠性
- **智能缓存**: Redis和内存存储的多级缓存系统
- **布隆过滤器**: 超快速的域名区域存在性检查
- **加权选择**: 基于自定义权重的智能流量分配
- **自动故障转移**: 具备健康感知的DNS响应

### 🔧 管理与监控
- **现代化Web界面**: 直观的React管理界面
- **RESTful API**: 基于gRPC的完整自动化API
- **实时监控**: 实时DNS查询跟踪和分析
- **用户管理**: Google SSO集成和基于角色的访问控制

## 🏗️ 架构

DNSARC采用现代微服务架构，包含以下核心组件：

### 后端服务
- **DNS服务器** (`dns`) - 具备负载均衡和CNAME拉平功能的权威DNS解析服务
- **API服务器** (`api`) - Web管理界面后端
- **数据库** - PostgreSQL存储DNS记录和用户数据
- **缓存** - Redis提供发布订阅事件通信和缓存

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

## 📦 DNS功能特性

### 🔗 CNAME拉平
DNSARC通过自动拉平技术支持APEX域名的CNAME记录：

```bash
# 传统DNS限制
example.com.     CNAME   cdn.example.com.  # ❌ 不被允许

# DNSARC的CNAME拉平
example.com.     CNAME   cdn.example.com.  # ✅ 完全支持！
# 自动为客户端解析为A记录
```

**工作原理：**
1. 客户端查询 `example.com A`
2. DNSARC发现指向 `cdn.example.com` 的CNAME记录
3. 服务器自动解析 `cdn.example.com` 的IP地址
4. 返回A记录响应：`example.com A 1.2.3.4`

### ⚖️ 基于权重的负载均衡
智能地在多个端点间分配流量：

```bash
# 具有不同权重的多个A记录
api.example.com.  A  10.0.1.1  (权重: 70)  # 70%流量
api.example.com.  A  10.0.1.2  (权重: 30)  # 30%流量

# CNAME记录同样支持权重
www.example.com.  CNAME  server1.example.com.  (权重: 80)
www.example.com.  CNAME  server2.example.com.  (权重: 20)
```

**功能特性：**
- 每条记录可配置权重（0-100）
- 自动权重计算和分配
- 权重为0时回退到随机选择
- 同时支持A记录和CNAME记录

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
- `CreateDNSRecord` - 创建支持权重的DNS记录
- `ListDNSRecords` - 列出DNS记录
- `UpdateDNSRecord` - 更新DNS记录和权重
- `DeleteDNSRecord` - 删除DNS记录

**DNS记录属性：**
- `name` - 记录名称（如www、api、@）
- `type` - 记录类型（A、CNAME、MX、TXT等）
- `content` - 记录值（IP地址、域名等）
- `weight` - 负载均衡权重（0-100）
- `ttl` - 生存时间（秒）

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
│   │   ├── dns/           # 具备负载均衡的DNS服务器
│   │   ├── handlers/      # gRPC处理器
│   │   ├── models/        # 支持权重的数据模型
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