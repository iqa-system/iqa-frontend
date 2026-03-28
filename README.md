# IQA 图像质量评估系统前端 - 项目启动指南

## 项目概述

图像质量评估系统前端应用, 基于 React 19 + TypeScript + Material UI v7 + React Router v7 构建。

## 技术栈

- **框架**: React 19.2.0
- **语言**: TypeScript 5.9.3
- **UI 组件库**: Material UI 7.3.9
- **路由**: React Router 7.13.1 (数据模式路由)
- **状态管理**: Zustand 5.0.12
- **HTTP 客户端**: Axios 1.13.6
- **构建工具**: Vite 7.3.1
- **包管理器**: pnpm

## 项目结构

```
src/
├── components/          # 公共组件
│   ├── ErrorBoundary.tsx       # 错误边界组件
│   ├── GlobalSnackbar.tsx      # 全局消息提示组件
│   ├── ProtectedRoute.tsx      # 路由守卫组件
│   └── Layout/
│       └── Layout.tsx          # 应用布局组件
├── pages/              # 页面组件
│   ├── Auth/
│   │   ├── Login.tsx           # 登录页面
│   │   └── Register.tsx        # 注册页面
│   ├── Assessment/
│   │   └── Assessment.tsx      # 图像评估页面 (单张/批量)
│   ├── History/
│   │   └── History.tsx         # 历史记录页面
│   └── Profile/
│       └── Profile.tsx         # 用户信息页面
├── services/           # API 服务层
│   ├── auth.ts                 # 认证接口
│   ├── assessment.ts           # 评估接口
│   └── user.ts                 # 用户接口
├── stores/             # Zustand 状态管理
│   ├── authStore.ts            # 认证状态
│   └── snackbarStore.ts        # 消息提示状态
├── types/              # TypeScript 类型定义
│   └── api.ts                  # API 响应类型
├── routes/             # 路由配置
│   └── index.tsx               # 路由数组定义
├── utils/              # 工具函数
│   ├── api-request.ts          # Axios 封装
│   └── constants.ts            # 场景和失真类型映射
├── App.tsx             # 应用根组件
└── main.tsx            # 应用入口
```

## 核心功能

### 1. 用户认证
- ✅ 用户注册
- ✅ 用户登录
- ✅ Token 持久化到 localStorage
- ✅ 自动登录机制 (页面刷新时自动刷新 token)
- ✅ 401 错误自动跳转登录页

### 2. 图像评估
- ✅ 单张图片评估
  - 文件上传
  - 图片预览
  - 评估结果展示 (质量分数、场景分类、失真类型)
- ✅ 批量图片评估
  - 多文件上传
  - 图片列表预览
  - SSE 流式进度更新
  - 实时结果展示

### 3. 历史记录
- ✅ 分页表格展示评估历史
- ✅ 缩略图显示
- ✅ 点击缩略图查看大图
- ✅ 日期时间格式化

### 4. 用户信息管理
- ✅ 查看用户信息 (ID、用户名、注册时间)
- ✅ 编辑用户名
- ✅ 修改密码 (需验证旧密码)

### 5. 公共功能
- ✅ 全局错误边界捕获
- ✅ 全局消息提示 (成功、错误、警告、信息)
- ✅ 路由守卫保护页面
- ✅ 应用布局 (顶部导航栏 + 侧边导航栏)
- ✅ MUI 中文地域配置

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置后端地址

默认后端地址为 `http://localhost:8080`, 如需修改请编辑 `src/utils/api-request.ts`:

```typescript
export const baseURL: string = 'http://localhost:8080';
```

### 3. 启动开发服务器

```bash
pnpm dev
```

应用将在 `http://localhost:5173` 启动 (或其他可用端口)。

### 4. 构建生产版本

```bash
pnpm build
```

构建产物将生成到 `dist/` 目录。

### 5. 预览生产版本

```bash
pnpm preview
```

## 路由说明

| 路径 | 说明 | 权限 |
|------|------|------|
| `/login` | 登录页面 | 公开 |
| `/register` | 注册页面 | 公开 |
| `/` | 重定向到 `/assessment` | 需要登录 |
| `/assessment` | 图像评估页面 | 需要登录 |
| `/history` | 历史记录页面 | 需要登录 |
| `/profile` | 用户信息页面 | 需要登录 |

## API 接口说明

所有 API 接口基于 OpenAPI 规范 (`iqa-backend/openapi.yaml`), 包括:

- `POST /auth/sign-up` - 用户注册
- `POST /auth/login` - 用户登录
- `POST /auth/refresh` - 刷新 Token
- `POST /assess` - 单张图片评估
- `POST /assess/batch` - 批量图片评估 (SSE 流式响应)
- `GET /assess/history` - 查询评估历史
- `GET /user/info` - 获取用户信息
- `POST /user/update-info` - 更新用户信息

## 状态管理

### authStore (认证状态)

- `token`: 访问令牌
- `user`: 用户信息
- `isLoading`: 全局加载状态
- `login()`: 登录
- `logout()`: 登出
- `setToken()`: 设置 token
- `setUser()`: 设置用户信息
- `refreshToken()`: 刷新 token

### snackbarStore (消息提示状态)

- `showSuccess(message)`: 显示成功消息
- `showError(message)`: 显示错误消息
- `showWarning(message)`: 显示警告消息
- `showInfo(message)`: 显示信息消息

## 开发注意事项

1. **代码规范**: 所有代码包含详尽的中文注释, 使用英文标点符号
2. **类型安全**: 避免使用 `any` 类型, 所有 API 响应都有完整的类型定义
3. **错误处理**: API 错误由 `api-request.ts` 的拦截器统一处理
4. **Token 管理**: Token 自动添加到请求头, 401 错误自动清除并跳转登录
5. **SSE 处理**: 批量评估使用 fetch API 处理 SSE 流式响应
6. **表单验证**: 手动验证表单, 无需额外验证库
7. **日期格式化**: 手动格式化日期, 无需额外日期库

## 故障排除

### 问题: Token 过期导致 401 错误

**解决**: 应用会自动捕获 401 错误, 清除 token 并跳转登录页。用户重新登录即可。

### 问题: 批量评估进度不更新

**解决**: 检查后端是否正确返回 SSE 流。确保 Content-Type 为 `text/event-stream`。

### 问题: 图片上传失败

**解决**: 
1. 检查文件大小是否超过限制
2. 检查网络连接
3. 查看浏览器控制台错误信息

### 问题: 历史记录缩略图不显示

**解决**: 确保后端返回的 base64 字符串格式正确 (不包含 `data:image/jpeg;base64,` 前缀)。

## 许可证

本项目为私有项目, 版权所有。

## 联系方式

如有问题, 请联系开发团队。
