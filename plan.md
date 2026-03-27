# IQA 图像质量评估系统前端实施计划

## 问题概述

需要为图像质量评估系统构建一个完整的前端应用，包含用户认证、图像评估、历史记录查询和个人信息管理四大功能模块。项目使用 React 19 + Material UI v7 + TypeScript + React Router 数据模式路由的技术栈。

## 核心要求

1. **国际化**: 所有组件和文本使用中文(zh_CN), MUI 使用内置的 zhCN locale
2. **代码规范**: 详尽的中文注释，英文标点符号
3. **技术选型**: React Router 数据模式路由(createBrowserRouter + RouterProvider), Material UI 组件库
4. **后端集成**: 基于 OpenAPI 规范的 SpringBoot 接口
5. **认证持久化**: Token 和用户信息持久化到 localStorage, 实现自动登录和 token 刷新
6. **表单验证**: 手动验证表单, 无需额外验证库
7. **日期格式化**: 手动格式化日期, 无需额外日期库
8. **适配范围**: 暂不考虑移动端响应式适配

## 技术架构

### 技术栈
- React 19.2.0 + TypeScript 5.9.3
- Material UI 7.3.9 + MUI Icons Material (图标库)
- React Router 7.13.1 (数据模式路由: createBrowserRouter + RouterProvider)
- Zustand 5.0.12 (状态管理 + localStorage 持久化)
- Axios 1.13.6 (HTTP 客户端)
- Vite 7.3.1 (构建工具)

### 目录结构规划
```
src/
├── components/        # 公共组件
│   ├── Layout/       # 布局组件
│   ├── ProtectedRoute.tsx  # 路由守卫
│   ├── GlobalSnackbar.tsx  # 全局消息提示
│   └── ErrorBoundary.tsx   # 错误边界组件
├── pages/            # 页面组件
│   ├── Auth/         # 认证相关页面
│   │   ├── Login.tsx
│   │   └── Register.tsx
│   ├── Assessment/   # 评估页面
│   │   └── Assessment.tsx
│   ├── History/      # 历史记录页面
│   │   └── History.tsx
│   └── Profile/      # 用户信息页面
│       └── Profile.tsx
├── services/         # API 服务层
│   ├── auth.ts       # 认证接口
│   ├── assessment.ts # 评估接口
│   └── user.ts       # 用户接口
├── stores/           # Zustand 状态管理
│   ├── authStore.ts  # 认证状态
│   └── snackbarStore.ts  # 消息提示状态
├── types/            # TypeScript 类型定义
│   └── api.ts        # API 响应类型
├── routes/           # 路由配置
│   └── index.tsx     # 路由数组定义
└── utils/            # 工具函数
    ├── api-request.ts # (已存在) Axios 封装
    └── constants.ts   # (已存在) 场景和失真类型映射
```

## 实施待办事项

### 阶段一: 基础设施搭建

**setup-types** - 创建 TypeScript 类型定义
- 定义 API 响应的所有类型接口
- 包括: 用户信息、认证响应、评估结果、历史记录、分页响应等
- 基于 OpenAPI 规范创建完整的类型系统

**setup-stores** - 创建状态管理
- authStore: 管理用户登录状态、token、用户信息、全局加载状态
  - 使用 persist 中间件持久化到 localStorage
  - 提供 login, logout, setToken, setUser, refreshToken 等方法
- snackbarStore: 管理全局消息提示的显示状态和内容
  - 提供 showSuccess, showError, showWarning, showInfo 等方法
- 使用 Zustand 实现轻量级状态管理

**setup-services** - 创建 API 服务层
- auth.ts: 登录、注册、刷新 token 接口
- assessment.ts: 单张/批量图片评估、历史记录查询接口
- user.ts: 获取和更新用户信息接口
- 完善 api-request.ts:
  - 添加请求拦截器: 自动从 authStore 读取 token 并添加到 Authorization 头
  - 添加响应拦截器: 401 错误时清除 authStore 并跳转登录页
  - 统一错误处理和消息提示

### 阶段二: 公共组件开发

**component-error-boundary** - 创建错误边界组件
- 使用 React Error Boundary 捕获运行时错误
- 显示友好的错误提示页面
- 提供重试或返回首页的操作按钮
- 记录错误日志到控制台

**component-layout** - 创建应用布局组件
- 顶部导航栏: 显示应用名称、用户信息、退出登录按钮
- 侧边导航栏: 包含图像评估、历史记录、个人信息等导航链接
- 使用 Material UI 的 AppBar、Drawer、List、ListItem 等组件
- 使用 @mui/icons-material 提供图标 (如 AssessmentIcon, HistoryIcon, PersonIcon)
- 点击退出登录时清除 authStore 并跳转到登录页

**component-snackbar** - 创建全局消息提示组件
- 基于 MUI Snackbar + Alert 组件
- 连接 snackbarStore 实现全局调用
- 支持成功(success)、错误(error)、警告(warning)、信息(info)四种类型
- 自动关闭时长 3-5 秒

**component-protected-route** - 创建路由守卫组件
- 检查 authStore 中的 token 是否存在
- 未登录时重定向到 /login 页面
- 保护需要认证的页面路由

### 阶段三: 认证页面开发

**page-login** - 登录页面
- 使用 MUI TextField 创建用户名和密码输入框
- 使用 MUI Button 创建登录按钮
- 表单验证: 用户名和密码不能为空
- 调用登录 API，成功后保存 token 和用户信息到 authStore (会自动持久化到 localStorage)
- 显示 Snackbar 提示登录结果
- 登录成功后跳转到 /assessment 图像评估页面
- 提供"前往注册"链接跳转到注册页面
- **页面初始化时自动登录逻辑**:
  - 尝试从 localStorage 读取持久化的用户信息和 token
  - 如果 token 存在，调用 /auth/refresh 接口刷新 token
  - 刷新成功: 更新 authStore，显示"自动登录成功"提示，跳转到 /assessment
  - 刷新失败: 清除 authStore，停留在登录页

**page-register** - 注册页面
- 使用 MUI TextField 创建用户名、密码、确认密码输入框
- 使用 MUI Button 创建注册按钮
- 表单验证: 
  - 用户名长度 3-50 字符
  - 密码长度至少 6 字符
  - 确认密码与密码一致
- 调用注册 API，成功后保存 token 和用户信息到 authStore
- 显示 Snackbar 提示注册结果
- 注册成功后跳转到 /assessment 图像评估页面
- 提供"前往登录"链接跳转到登录页面
- **页面初始化时同样执行自动登录逻辑**(与登录页相同)

### 阶段四: 图像评估页面开发

**page-assessment-ui** - 评估页面UI结构
- 使用 MUI Tabs 组件实现 Tab 切换: 单张评估 / 批量评估
- 单张评估 Tab: 文件上传区域 + 图片预览 + 评估按钮 + 结果显示卡片
- 批量评估 Tab: 多文件上传区域 + 图片列表预览 + 评估按钮 + 进度条 + 结果列表
- 使用 MUI Tabs、Button、Card、Box 等组件

**page-assessment-single** - 单张图片评估功能
- 使用 input type="file" accept="image/*" 选择单张图片
- **图片预览**: 选择图片后使用 FileReader 读取并显示预览 (img 标签显示 base64 或 blob URL)
- 点击评估按钮后禁用按钮并显示加载状态 (按钮显示 CircularProgress)
- 调用 /assess 接口提交图片 (使用 FormData)
- 显示评估结果卡片:
  - 文件名
  - 质量分数 (保留两位小数)
  - 场景分类 (使用 constants.ts 中的 sceneLabel 映射为中文)
  - 失真类型 (使用 constants.ts 中的 distLabel 映射为中文)
- 完成后显示 Snackbar 提示 "评估完成"

**page-assessment-batch** - 批量图片评估功能
- 使用 input type="file" accept="image/*" multiple 选择多张图片
- **图片列表预览**: 显示所有选中图片的缩略图列表 (使用 Grid 或 ImageList 组件)
- 点击评估按钮后禁用按钮
- 调用 /assess/batch 接口，使用 **EventSource 或 fetch API 处理 SSE 流式响应**
- 使用 MUI LinearProgress 显示总体进度百分比
- 实时解析 SSE 事件:
  - start 事件: 显示"批量评估开始"
  - progress 事件: 更新进度条
  - result 事件: 将单个结果添加到结果列表中显示
  - completed 事件: 显示"批量评估完成", 启用评估按钮
  - error 事件: 显示错误提示
- 结果列表使用 MUI List 或 Card 组件显示每张图片的评估结果
- 完成后显示 Snackbar 提示 "批量评估完成, 共评估 X 张图片"

### 阶段五: 历史记录页面开发

**page-history** - 历史记录表格页面
- 使用 MUI Table (TableContainer, Table, TableHead, TableBody, TableRow, TableCell) 显示评估历史
- 调用 /assess/history 接口获取分页数据
- 实现分页功能: 使用 MUI TablePagination 组件
  - 支持翻页 (上一页/下一页)
  - 支持设置每页显示数量 (可选项: 5, 10, 20, 50)
  - 显示总记录数和当前页码
- 表格列:
  - ID (序号)
  - 缩略图 (显示 base64 压缩图片, 使用 img 标签, 固定宽高如 60x60)
  - 文件名
  - 评估时间 (格式化为 YYYY-MM-DD HH:mm:ss)
  - 质量分数 (保留两位小数)
  - 场景分类 (使用 sceneLabel 映射)
  - 失真类型 (使用 distLabel 映射)
- **缩略图点击查看**: 点击缩略图时弹出 MUI Dialog 显示大图
- 页面初始化时加载第一页数据
- 数据为空时显示"暂无评估记录"提示

### 阶段六: 用户信息页面开发

**page-profile-view** - 用户信息展示
- 调用 /user/info 接口获取用户信息
- 使用 MUI Card 显示用户信息: ID、用户名、注册时间
- 提供编辑按钮进入编辑模式

**page-profile-edit** - 用户信息编辑
- 使用 TextField 提供用户名修改
- 密码修改: 旧密码、新密码、确认新密码三个输入框
- 表单验证: 用户名长度 3-50，密码长度至少 6，新密码二次确认一致
- 调用 /user/update-info 接口提交修改
- 修改成功后显示 Snackbar 提示并刷新用户信息

### 阶段七: 路由配置与集成

**setup-routes** - 配置 React Router 数据模式路由
- 创建 src/routes/index.tsx 路由配置文件
- **使用 createBrowserRouter 创建路由对象** (而非旧版的 BrowserRouter)
- 在 App.tsx 或 main.tsx 中使用 RouterProvider 渲染路由
- 定义路由结构:
  - `/login` - 登录页面 (公开路由)
  - `/register` - 注册页面 (公开路由)
  - `/` - 重定向到 `/assessment`
  - `/assessment` - 图像评估页面 (受保护路由)
  - `/history` - 历史记录页面 (受保护路由)
  - `/profile` - 用户信息页面 (受保护路由)
  - `*` (404) - 未找到页面，显示友好提示
- 受保护路由使用 ProtectedRoute 组件包装
- 为受保护路由添加 Layout 布局组件

**setup-mui-locale** - 配置 MUI 中文地域
- 在 App.tsx 或 main.tsx 中配置 ThemeProvider
- 从 @mui/material/locale 导入 zhCN
- 使用 createTheme 创建主题时传入 zhCN: `createTheme({}, zhCN)`
- 确保所有 MUI 组件的预设文本 (如分页器、表格等) 显示为中文

**setup-auto-refresh** - 实现非登录页面的 token 自动刷新
- 在受保护路由的根组件中添加初始化逻辑
- 页面加载时检查 localStorage 中是否有 token
- 如果有 token:
  - 调用 /auth/refresh 接口刷新 token
  - 刷新成功: 更新 authStore 的 token，并调用 /user/info 更新用户信息
  - 刷新失败: 清除 authStore，显示"登录已过期"提示，跳转到 /login
- 如果没有 token: 由 ProtectedRoute 自动跳转到 /login

**integration-testing** - 集成测试
- 测试登录/注册流程
- 测试单张和批量图片评估功能
- 测试历史记录查询和分页
- 测试用户信息查看和修改
- 测试路由导航和守卫功能
- 验证所有 Snackbar 提示显示正常

### 阶段八: 优化与完善

**code-review** - 代码审查与优化
- 确保所有代码包含详尽的中文注释
- 检查所有文件的注释标点符号使用英文
- 优化代码结构和命名规范
- 检查 TypeScript 类型定义完整性

**error-handling** - 错误处理完善
- 统一 API 错误处理
- 401 未授权时清除 token 并跳转登录
- 网络错误时显示友好提示
- 文件上传失败的错误处理

**ui-polish** - UI 细节优化
- 统一组件样式和间距
- 添加加载状态指示器
- 添加空状态提示(如历史记录为空)

## 依赖关系

- **无依赖 (可并行)**: `setup-types`, `setup-stores`, `setup-services`
- **阶段二公共组件**:
  - `component-error-boundary`: 无依赖
  - `component-snackbar`: 依赖 `setup-stores`, `setup-types`
  - `component-layout`: 依赖 `setup-stores`, `setup-types`
  - `component-protected-route`: 依赖 `setup-stores`
- **阶段三认证页面**:
  - `page-login`: 依赖 `setup-services`, `component-snackbar`
  - `page-register`: 依赖 `setup-services`, `component-snackbar`
- **阶段四评估页面**:
  - `page-assessment-ui`: 依赖 `setup-services`, `setup-types`
  - `page-assessment-single`: 依赖 `page-assessment-ui`, `component-snackbar`
  - `page-assessment-batch`: 依赖 `page-assessment-ui`, `component-snackbar`
- **阶段五历史页面**:
  - `page-history`: 依赖 `setup-services`, `component-layout`
- **阶段六个人信息页面**:
  - `page-profile-view`: 依赖 `setup-services`, `component-layout`
  - `page-profile-edit`: 依赖 `page-profile-view`, `component-snackbar`
- **阶段七路由与集成**:
  - `setup-routes`: 依赖所有页面组件和 `component-protected-route`
  - `setup-mui-locale`: 无依赖
  - `setup-auto-refresh`: 依赖 `setup-services`, `setup-stores`, `setup-routes`
  - `integration-testing`: 依赖所有功能完成
- **阶段八优化完善**: 依赖 `integration-testing`

## 技术注意事项

1. **SSE 流式处理**: 批量评估使用 EventSource 或 fetch API 处理 text/event-stream 响应
2. **Token 管理**: 
   - accessToken 和用户信息存储在 Zustand store 中
   - 使用 persist 中间件自动持久化到 localStorage
   - axios 请求拦截器自动从 store 读取 token 并添加到 Authorization 请求头
   - 响应拦截器捕获 401 错误，自动清除 store 并跳转登录页
3. **自动登录机制**:
   - 登录/注册页面初始化: 读取 localStorage → 调用 /auth/refresh → 成功则跳转
   - 非登录页面刷新: 读取 localStorage → 调用 /auth/refresh → 调用 /user/info → 失败则跳转登录
4. **表单数据格式**: 
   - 注册和登录使用 application/x-www-form-urlencoded 格式
   - 用户信息更新使用 application/x-www-form-urlencoded 格式
5. **文件上传**: 使用 multipart/form-data 格式，FormData 对象封装文件
6. **图片预览**: 使用 FileReader.readAsDataURL() 或 URL.createObjectURL() 实现本地预览
7. **场景和失真映射**: 使用 src/utils/constants.ts 中的 sceneLabel 和 distLabel 对象
8. **日期格式化**: 手动格式化 ISO 8601 日期字符串为 YYYY-MM-DD HH:mm:ss 格式
9. **Material UI v7**: 
   - 使用内置的 zhCN locale，无需额外安装语言包
   - 使用 createTheme 配置主题和地域
   - 注意最新版本的 API 可能与 v5/v6 不同
10. **React Router v7**: 使用数据模式路由 (createBrowserRouter + RouterProvider，而非 BrowserRouter)
11. **错误边界**: 使用 React 18+ 的 Error Boundary 捕获运行时错误
12. **图标库**: 使用 @mui/icons-material 提供导航和操作图标

## 开发顺序建议

1. **阶段一 (基础设施)**: setup-types, setup-stores, setup-services 可并行开发
2. **阶段二 (公共组件)**: component-error-boundary → component-snackbar → component-layout → component-protected-route
3. **阶段三 (认证页面)**: page-login 和 page-register 可并行开发，完成后可测试登录流程
4. **阶段四 (评估页面)**: page-assessment-ui → page-assessment-single → page-assessment-batch
5. **阶段五 (历史页面)**: page-history
6. **阶段六 (个人信息)**: page-profile-view → page-profile-edit
7. **阶段七 (路由集成)**: setup-mui-locale 和 setup-routes 并行 → setup-auto-refresh → integration-testing
8. **阶段八 (优化完善)**: code-review, error-handling, ui-polish 可并行进行

## 质量标准

- ✅ 所有代码包含详尽的中文注释，使用英文标点符号
- ✅ 所有用户可见文本 (按钮、提示、标签等) 使用中文
- ✅ Material UI 地域设置为 zh_CN (使用内置 locale)
- ✅ 完整的 TypeScript 类型定义，避免使用 any 类型
- ✅ 统一的错误处理和用户提示 (通过 Snackbar)
- ✅ Token 持久化和自动登录/刷新机制
- ✅ 错误边界捕获运行时错误
- ✅ 图片预览和缩略图显示功能
- ✅ SSE 流式处理批量评估进度
- ✅ 遵循 React 最佳实践和 Hooks 规范
- ✅ 使用 React Router v7 数据模式路由

## 前置准备

在开始开发前，请确保已完成以下准备工作:

1. **安装 MUI 图标库**:
   ```bash
   pnpm add @mui/icons-material
   ```

2. **确认现有文件**:
   - ✅ `src/utils/constants.ts` - 场景和失真类型映射已存在
   - ✅ `src/utils/api-request.ts` - Axios 实例已配置

3. **后端服务**: 确保后端服务运行在 `http://localhost:8080`

---

**项目版本**: 0.0.1  
**创建时间**: 2026-03-27  
**技术栈**: React 19 + TypeScript + Material UI v7 + React Router v7
