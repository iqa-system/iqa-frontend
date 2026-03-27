# IQA Frontend - 图像质量评估系统前端

## 项目概述

这是一个**图像质量评估系统（IQA - Image Quality Assessment）**的前端项目，用于提供用户界面来进行图像质量的评估和分析。

- **项目名称**: iqa-frontend
- **版本**: 0.0.1
- **描述**: 图像质量评估系统前端
- **项目类型**: 单页应用（SPA）

## 技术栈

### 核心框架
- **React 19.2.0** - 前端UI框架（最新版本）
- **TypeScript 5.9.3** - 类型安全的JavaScript超集
- **Vite 7.3.1** - 现代化的前端构建工具

### UI组件库
- **Material-UI (@mui/material) 7.3.9** - Google Material Design 组件库
- **@emotion/react & @emotion/styled** - CSS-in-JS 样式解决方案
- **Sass 1.97.3** - CSS预处理器

### 路由与状态管理
- **React Router 7.13.1** - 客户端路由管理
- **Zustand 5.0.12** - 轻量级状态管理库
- **keepalive-for-react** - React组件的KeepAlive功能

### HTTP客户端
- **Axios 1.13.6** - Promise基于的HTTP客户端

### 开发工具
- **ESLint 9.39.1** - 代码质量和风格检查
- **TypeScript ESLint** - TypeScript的ESLint插件
- **Vite Plugin React SWC** - 使用SWC的React插件，提供更快的编译速度

## 项目结构

```
iqa-frontend/
├── public/                 # 静态资源文件
├── src/                    # 源代码目录
│   ├── utils/             # 工具函数
│   │   └── api-request.ts # Axios API请求封装
│   ├── App.tsx            # 根组件
│   ├── App.module.scss    # App组件样式
│   ├── main.tsx           # 应用入口文件
│   └── index.module.scss  # 全局样式
├── index.html             # HTML模板
├── vite.config.ts         # Vite配置文件
├── tsconfig.json          # TypeScript配置
├── tsconfig.app.json      # 应用级TypeScript配置
├── tsconfig.node.json     # Node.js环境TypeScript配置
├── eslint.config.js       # ESLint配置
├── package.json           # 项目依赖和脚本
└── pnpm-workspace.yaml    # pnpm工作空间配置
```

## 开发配置

### 路径别名
项目配置了路径别名 `@` 指向 `./src` 目录，可以使用以下方式导入模块：
```typescript
import Component from '@/components/Component'
```

### API配置
- **API基础地址**: `http://localhost:8080`
- **请求超时**: 10秒
- 配置了请求和响应拦截器，用于：
  - 请求拦截：可添加认证token、日志记录等
  - 响应拦截：统一错误处理

### TypeScript配置
- **目标**: ES2022
- **模块系统**: ESNext (bundler模式)
- **JSX**: react-jsx
- **严格模式**: 启用
- 启用了严格的类型检查和未使用变量检测

## 可用脚本

```bash
# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 代码检查
pnpm lint

# 预览生产构建
pnpm preview
```

## 包管理器

项目使用 **pnpm** 作为包管理器，这是一个快速、节省磁盘空间的包管理工具。

## 当前开发状态

项目处于初始化阶段（v0.0.1），目前包含：
- ✅ 基础项目架构搭建完成
- ✅ 开发工具链配置完成（Vite、TypeScript、ESLint）
- ✅ UI框架集成（React + Material-UI）
- ✅ HTTP客户端封装（Axios）
- ✅ 路由和状态管理工具就绪
- ⚠️  业务功能开发中（App.tsx中仅有占位内容）

## 特性亮点

1. **现代化技术栈**: 使用最新版本的React 19、Vite 7等前沿技术
2. **类型安全**: 全面采用TypeScript，提供更好的开发体验
3. **快速构建**: Vite + SWC提供极速的开发和构建体验
4. **优秀的UI**: Material-UI提供美观且符合标准的UI组件
5. **轻量级状态管理**: Zustand相比Redux更简单易用
6. **组件缓存**: 使用keepalive实现组件状态保持

## 开发建议

### 推荐的开发流程
1. 使用 `pnpm dev` 启动开发服务器
2. 在 `src/` 目录下进行开发
3. 使用 `@/` 别名导入模块
4. 运行 `pnpm lint` 检查代码质量
5. 运行 `pnpm build` 构建生产版本

### 目录组织建议
建议按功能模块组织代码：
```
src/
├── components/     # 公共组件
├── pages/         # 页面组件
├── hooks/         # 自定义Hooks
├── stores/        # Zustand状态管理
├── services/      # API服务
├── types/         # TypeScript类型定义
├── utils/         # 工具函数
└── assets/        # 静态资源
```

## 后端集成

项目配置与后端API服务集成，默认后端地址为 `http://localhost:8080`。确保：
- 后端服务已启动
- CORS配置正确
- API接口符合约定

## 注意事项

1. 项目使用 **pnpm** 而非 npm 或 yarn
2. 确保Node.js版本支持ES2022特性
3. 开发时注意TypeScript类型检查错误
4. Material-UI v7是最新版本，API可能与v5/v6有所不同

## 维护与贡献

- 遵循现有的代码风格和ESLint规则
- 提交代码前运行lint检查
- 保持TypeScript类型定义的完整性
- 适当添加注释，特别是复杂的业务逻辑

---

**最后更新**: 2026-03-27
