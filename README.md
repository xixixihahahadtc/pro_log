# AI Blog Pro

基于 Spring Boot + Next.js 的 AI 博客平台，集成 DeepSeek 大模型实现智能写作辅助、AI 聊天助手和评论自动审核。

## 技术栈

| 层 | 技术 |
|----|------|
| 后端框架 | Spring Boot 3.4.3 |
| ORM | MyBatis-Plus 3.5.9 |
| 数据库 | MySQL 8.0 |
| 安全 | Spring Security + JWT + RBAC |
| API 文档 | SpringDoc OpenAPI (Swagger) |
| 前端框架 | Next.js 15 + TypeScript |
| UI 组件 | Ant Design 5 |
| AI | DeepSeek API (聊天 + 写作 + 审核) |
| 图片处理 | Thumbnailator (上传压缩) |

## 项目结构

```
├── src/main/java/com/blogpro/
│   ├── config/          # Spring 配置（Security, JWT, CORS, 数据初始化）
│   ├── controller/      # REST API 控制器
│   ├── entity/          # 数据库实体
│   ├── exception/       # 全局异常处理
│   ├── interceptor/     # JWT 过滤器 + 角色拦截器
│   ├── mapper/          # MyBatis-Plus Mapper
│   ├── model/
│   │   ├── dto/request/  # 请求体 DTO
│   │   ├── dto/response/ # 响应体 DTO
│   │   └── enums/        # 状态码枚举
│   ├── service/         # 业务接口
│   │   ├── impl/         # 业务实现
│   │   └── ai/           # AI 服务（DeepSeek 客户端 + 聊天 + 写作 + 审核）
│   └── utils/           # 工具类（JWT）
├── src/main/resources/
│   ├── application.yml       # 主配置
│   ├── application-dev.yml   # 开发环境配置
│   └── sql/schema.sql        # 数据库建表脚本
├── blog-pro-frontend/
│   └── src/
│       ├── app/              # Next.js 页面路由
│       │   ├── admin/        # 管理后台（文章管理、分类、标签、评论）
│       │   ├── articles/     # 文章详情页
│       │   ├── login/        # 登录
│       │   ├── register/     # 注册
│       │   └── search/       # 搜索
│       ├── components/       # 共享组件
│       ├── lib/              # API 客户端 + 工具函数
│       └── stores/           # Zustand 状态管理
├── docker-compose.yml   # MySQL + Redis + PostgreSQL
└── .env.example         # 环境变量模板
```

## 功能列表

### 博客前台
- 文章列表（分类筛选 + 分页）
- 文章详情（Markdown 渲染）
- 全文搜索（关键词高亮）
- 点赞 / 取消点赞（toggle）
- 评论（匿名 / 登录，AI 自动审核）

### 管理后台
- 仪表盘（文章 / 评论 / 用户统计）
- 文章编辑器（TipTap 富文本 + 自动保存草稿 + 图片上传）
- 文章管理（编辑 / 归档 / 删除 + 状态筛选）
- 分类管理（树形结构 CRUD）
- 标签管理（CRUD）
- 评论审核（通过 / 驳回 / 删除）

### AI 功能
- AI 聊天助手（SSE 流式输出 + Markdown 渲染 + 多轮对话）
- AI 写作辅助（生成 / 续写 / 改写）
- AI 评论审核（自动审核 + 管理员复审）

### 用户系统
- JWT 双 Token 认证（Access + Refresh 自动刷新）
- RBAC 角色控制（USER / ADMIN）
- .env 配置初始管理员

## 快速启动

### 1. 环境准备

- JDK 17+
- Node.js 18+
- MySQL 8.0
- （可选）Docker Compose 一键启动 MySQL + Redis

### 2. 配置

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env，填入真实值：
#   DB_PASSWORD     - 数据库密码
#   JWT_SECRET      - JWT 密钥（至少 32 字符）
#   DEEPSEEK_API_KEY - DeepSeek API Key
#   ADMIN_USERNAME  - 初始管理员用户名
#   ADMIN_PASSWORD  - 初始管理员密码
```

### 3. 启动数据库

```bash
docker-compose up -d mysql
# 或者用你已有的 MySQL，确保 blog_pro 数据库已创建
```

### 4. 启动后端

```bash
./mvnw spring-boot:run
# 启动后访问 http://localhost:8080
# Swagger 文档: http://localhost:8080/swagger-ui/index.html
```

### 5. 启动前端

```bash
cd blog-pro-frontend
npm install
npm run dev
# 访问 http://localhost:3000
```

### 6. 登录管理后台

用 `.env` 中配置的管理员账号登录，或注册新用户（默认 USER 角色，拥有写作权限）。

管理后台地址：`http://localhost:3000/admin`

## 角色权限

| 操作 | USER | ADMIN |
|------|------|-------|
| 查看文章、评论 | ✅ | ✅ |
| 写文章、管理草稿 | ✅ | ✅ |
| 文章管理列表 | ✅ | ✅ |
| 分类 / 标签管理 | ❌ | ✅ |
| 评论审核 | ❌ | ✅ |

## 数据库表

| 表 | 说明 |
|----|------|
| user | 用户（含角色和 JWT Token） |
| article | 文章（支持草稿 / 已发布 / 已归档） |
| category | 分类（树形结构） |
| tag | 标签 |
| article_tag | 文章 - 标签关联 |
| comment | 评论（支持父评论回复） |
| user_likes | 点赞记录（toggle 用） |

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| DB_URL | 数据库连接 | jdbc:mysql://localhost:3306/blog_pro |
| DB_USERNAME | 数据库用户 | root |
| DB_PASSWORD | 数据库密码 | — |
| JWT_SECRET | JWT 密钥 | — |
| DEEPSEEK_API_KEY | DeepSeek API Key | — |
| ADMIN_USERNAME | 初始管理员用户名 | — |
| ADMIN_PASSWORD | 初始管理员密码 | — |
| REDIS_HOST | Redis 地址 | localhost |
| REDIS_PORT | Redis 端口 | 6379 |
