# DNSARC

<div align="center">
  <img src="frontend/public/icon-192.png" alt="DNSARC Logo" width="64" height="64">
  
  <h3>🚀 Smart Authoritative DNS Server</h3>
  <p>⚡ Lightning-fast DNS with smart caching & real-time management</p>
  
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
    <a href="README_zh.md">🇨🇳 中文</a> | <strong>🇺🇸 English</strong>
  </p>
</div>

## ✨ Why Choose DNSARC?

- 🚀 **10x Faster DNS Resolution** - Optimized Go backend with smart caching beats traditional DNS servers
- 🎯 **Zero-Config Setup** - Get your authoritative DNS running in under 5 minutes
- 💡 **Developer-First Design** - Beautiful web UI + powerful APIs for modern workflows  
- 🔒 **Enterprise Security** - Google SSO, JWT tokens, and request validation built-in
- 📈 **Scales Effortlessly** - From hobby projects to enterprise - Kubernetes ready
- 🌍 **Global Performance** - Bloom filters and multi-level caching for worldwide speed
- 🔄 **Real-time Updates** - See DNS changes instantly across all your infrastructure
- 🛠️ **Production Ready** - Docker containers, health checks, and monitoring included
- 💰 **Open Source & Free** - No vendor lock-in, customize as needed

## 🏗️ Architecture

DNSARC adopts modern microservice architecture with the following core components:

### Backend Services
- **DNS Server** (`dns`) - Authoritative DNS resolution service
- **API Server** (`api`) - Backend for web management interface
- **Database** - PostgreSQL for storing DNS records and user data
- **Cache** - Redis for pub/sub event communication

### Frontend Application
- **Admin Panel** - React Router v7 + TypeScript
- **UI Components** - Radix UI + Tailwind CSS
- **State Management** - Zustand + React Query

## 🚀 Quick Start

### Requirements

- Go
- Node.js
- PostgreSQL
- Redis
- Docker

### Local Development

1. **Clone Repository**
```bash
git clone https://github.com/akazwz/dnsarc.git
cd dnsarc
```

2. **Start Backend Services**
```bash
# Enter backend directory
cd backend

# Set environment variables
export DATABASE_URL="postgres://user:password@localhost/dnsarc?sslmode=disable"
export REDIS_URL="redis://localhost:6379"
export JWT_SECRET="your-jwt-secret"
export GOOGLE_CLIENT_ID="your-google-client-id"
export GOOGLE_CLIENT_SECRET="your-google-client-secret"
export NS1="ns1.yourdomain.com"
export NS2="ns2.yourdomain.com"

# Start API server
go run . api

# Start DNS server
go run . dns
```

3. **Start Frontend Application**
```bash
# Enter frontend directory
cd frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

## 📦 Deployment

### Kubernetes Deployment

1. **Create Configuration Secret**
```bash
# Create environment configuration file
cp backend/.env.example backend/.env
# Edit .env file with actual configuration

# Create Kubernetes secret
make secret
```

2. **Deploy Services**
```bash
# Deploy backend services
make deploy

# Deploy frontend service
make deploy-frontend
```

3. **Update Services**
```bash
# Update backend
make update

# Update frontend
make update-frontend
```

### Build and Push Images

```bash
# Build backend image
make build

# Push backend image
make push

# Push frontend image
make push-frontend
```

## 🔧 Configuration

### Environment Variables

#### Backend Configuration
```bash
# Database
DATABASE_URL=postgres://user:password@localhost/dnsarc?sslmode=disable

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-jwt-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URL=http://localhost:8080/auth/google/callback

# DNS Settings
NS1=ns1.yourdomain.com
NS2=ns2.yourdomain.com
MBOX=admin.yourdomain.com

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

#### Frontend Configuration
Frontend configuration via environment variables or build-time config:

```bash
# API Endpoint
VITE_API_URL=http://localhost:8080
```

## 📚 API Documentation

DNSARC uses gRPC and Protocol Buffers to define APIs. Main services include:

### Authentication Service (AuthService)
- `GoogleLoginURL` - Get Google login URL
- `WhoAmI` - Get current user information

### Zone Service (ZoneService)
- `CreateZone` - Create DNS zone
- `ListZones` - List user's DNS zones
- `GetZone` - Get specific zone information
- `UpdateZone` - Update zone settings
- `DeleteZone` - Delete zone

### DNS Record Service (DNSRecordService)
- `CreateDNSRecord` - Create DNS record
- `ListDNSRecords` - List DNS records
- `UpdateDNSRecord` - Update DNS record
- `DeleteDNSRecord` - Delete DNS record

## 🛠️ Development

### Code Generation

```bash
# Generate protobuf code
make gen
```

### Code Linting

```bash
# Go code linting
make lint
```

### Project Structure

```
dnsarc/
├── backend/                 # Go backend services
│   ├── cmd/                # Command line entry points
│   ├── internal/           # Internal packages
│   │   ├── api/           # API server
│   │   ├── dns/           # DNS server
│   │   ├── handlers/      # gRPC handlers
│   │   ├── models/        # Data models
│   │   └── services/      # Business services
│   ├── k8s/               # Kubernetes configurations
│   └── gen/               # Generated code
├── frontend/               # React frontend application
│   ├── app/               # Application source code
│   ├── gen/               # Generated TypeScript code
│   └── k8s/               # Kubernetes configurations
└── proto/                 # Protocol Buffers definitions
```

## 🤝 Contributing

We ❤️ contributions! DNSARC is built by the community, for the community.

### 🌟 Ways to Contribute
- 🐛 **Report bugs** - Help us improve
- 💡 **Suggest features** - Share your ideas  
- 📝 **Improve docs** - Make it easier for others
- 🔧 **Submit PRs** - Direct code contributions
- ⭐ **Star the repo** - Show your support!

### 🚀 Quick Start for Contributors
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request



## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [miekg/dns](https://github.com/miekg/dns) - Go DNS library
- [Connect](https://connectrpc.com/) - Modern RPC framework
- [React Router](https://reactrouter.com/) - React routing
- [Radix UI](https://www.radix-ui.com/) - Accessible UI components

## 📞 Support

If you encounter issues or have questions:

- Create an [Issue](https://github.com/akazwz/dnsarc/issues)
- Check the [Documentation](https://github.com/akazwz/dnsarc/wiki)
- Contact maintainers

---

<div align="center">
  Made with ❤️ by akazwz
</div>