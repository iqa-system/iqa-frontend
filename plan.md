# IQA 前端多页面系统实施方案

## Summary
- 基于 React Router 数据模式实现 4 个核心路由: `/auth`, `/assess`, `/history`, `/profile`, 并增加根路由重定向, 受保护布局路由和路由懒加载.
- 登录后采用仅桌面端的左侧导航 + 顶部用户区应用框架. 左侧菜单包含 `图像评估`, `历史记录`, `个人信息`, 顶部提供当前用户名和退出登录入口.
- 直接打开前端任意页面时, 先检查 `localStorage` 中是否存在认证信息. 若存在, 则读取本地 token 调用 `/auth/refresh` 尝试自动登录, 成功后保存新的 token 并跳转主页 `/assess`; 失败则清空登录态并进入 `/auth`.
- 全局接入 MUI `zhCN` 地域设置. 所有页面文案, 提示文案, 表单校验文案和代码注释统一使用中文, 标点使用英文, TypeScript 代码保持无分号风格.
- 注册页与登录页合并为一个认证页面, 使用 Tab 切换. 注册页增加确认密码校验. 注册成功仅提示成功并切回登录表单, 不自动登录. 登录成功后跳转到图像质量评估页.
- 评估页同时支持单张评估和批量评估. 批量评估按后端 `POST multipart + text/event-stream` 约定, 用 `fetch + ReadableStream` 手动解析 SSE 事件. 进度优先使用服务端返回的 `progress`, 缺失时再用 `completed / total * 100` 回退.
- v1 历史记录页只做服务端分页, 不做关键词搜索和条件筛选. 页面统一覆盖 `loading`, `empty`, `error` 三类状态.

## Key Changes
### 路由与应用骨架
- 在 `src/route/index.tsx` 定义数据路由数组, 拆分为认证路由和受保护布局路由:
  - 未登录访问受保护页面时重定向到 `/auth`
  - 已登录访问 `/auth` 时重定向到 `/assess`
  - `/` 默认跳转到 `/assess`
- 应用启动阶段使用根路由 `loader` 或等效初始化逻辑完成自动登录判断:
  - 从 `localStorage` 读取 `accessToken`, `expiresIn`, `username`, `userId` 等认证信息
  - 无本地认证信息时, 未登录访问受保护页面则重定向 `/auth`
  - 有本地认证信息时, 先调用 `/auth/refresh`
  - 刷新成功后保存新的 token 数据, 再调用 `/user/info` 同步最新用户信息
  - 刷新失败后清空登录态并重定向 `/auth`
- 进入受保护页面时默认以“自动登录已完成”为前提, 不再把旧 token 直接视为有效登录态.
- 所有页面路由使用 React Router `lazy` 懒加载, 外层提供统一加载占位.
- 将 `src/App.tsx` 改为应用级 Provider 容器, 负责挂载 `ThemeProvider`, `CssBaseline`, 全局 Snackbar 容器和 `RouterProvider`.
- 将 `src/main.tsx` 保持为极简入口, 只渲染 `App`.
- 新增一个仅面向桌面端的通用应用布局组件, 左侧为固定导航, 主内容区承载子路由页面.
- 启用 `keepalive-for-react` 缓存 `/assess` 与 `/history` 页面, 保留评估结果, 上传状态和分页位置. `/auth` 与 `/profile` 不缓存, 避免保留认证和密码编辑输入.

### 状态管理与类型
- 新增 Zustand 登录态 store, 持久化保存 `accessToken`, `expiresIn`, `username`, `userId` 以及 token 校验状态.
- 新增全局消息 store 或轻量 UI store, 统一驱动 MUI Snackbar, 避免各页面重复管理提示状态.
- 新增统一类型定义:
  - `ApiResponse<T>`
  - `AuthTokenResponse`
  - `PredictResult`
  - `AssessRecord`
  - `PageAssessRecord`
  - `UserInfo`
  - `BatchAssessEvent` 及其 `start | progress | result | completed | error` 事件体
- 为场景和失真字典补充类型安全访问函数, 统一处理 `number`, `string`, 数字字符串三种编码输入.

### API 与基础设施
- 保留并扩展 `src/utils/api-request.ts`:
  - 请求拦截器自动注入 `Authorization: ${accessToken}`
  - 表单接口使用 `URLSearchParams`
  - 上传接口使用 `FormData`
  - 统一把后端错误或网络错误转换为中文提示
  - 遇到 401 时清理登录态并跳回 `/auth`
- 按职责拆分服务层:
  - `auth` 服务: 注册, 登录, 刷新 token
  - `assess` 服务: 单张评估, 批量评估流解析, 历史分页查询
  - `user` 服务: 获取用户信息, 更新用户信息
- 批量评估服务输出回调式或订阅式接口, 页面层只接收解析后的事件对象, 不直接处理底层流文本.
- 批量评估进度采用固定规则:
  - 优先使用服务端返回的 `progress`
  - 缺失时回退为 `Math.round(completed / total * 100)`
- 图片预览工具统一处理历史记录 `base64` 字段:
  - 如果后端返回原始 Base64, 前端补齐 `data:image/*;base64,`
  - 如果已经带前缀, 直接使用

### 页面实现
- 认证页:
  - 单页双 Tab, 登录表单和注册表单均包含必填校验
  - 注册表单增加 `确认密码`, 前端校验两次密码一致
  - 登录成功: 保存登录态, Snackbar 提示, 跳转 `/assess`
  - 注册成功: Snackbar 提示, 自动切回登录 Tab, 可保留用户名便于继续登录
  - 页面需覆盖提交中和错误提示状态
- 图像质量评估页:
  - 页面内用 Tab 或分段卡片区分 `单张评估` 和 `批量评估`
  - 单张评估展示上传区, 本地图预览, 结果卡片, 包含质量分数, 场景, 失真
  - 批量评估展示多文件选择, 线性进度条, 当前完成数, 流式追加结果列表
  - `completed` 事件触发最终成功提示, `error` 事件触发失败提示并终止当前任务状态
  - 页面需覆盖 `loading`, `empty`, `error` 状态. 其中空态用于首次未上传或暂无批量结果时的占位展示
- 历史记录页:
  - 使用 MUI `Table + TablePagination`, 不引入额外表格依赖
  - 列包含缩略图, 文件名, 分数, 场景, 失真, 评估时间
  - 仅支持服务端分页, 不提供关键词搜索和条件筛选 UI
  - 支持分页, 修改每页条数, 翻页
  - 点击缩略图打开 MUI `Dialog` 放大预览
  - 页面需覆盖 `loading`, `empty`, `error` 状态
- 个人信息页:
  - 首屏加载当前用户信息并展示 `ID`, `用户名`, `注册时间`
  - 编辑表单支持修改用户名和密码
  - 密码修改需填写 `旧密码`, `新密码`, `确认新密码`
  - 前端校验 `新密码 === 确认新密码`
  - 更新成功后刷新用户信息并同步顶部用户名
  - 修改密码成功后保持当前登录态, 仅清空密码输入框并提示成功
  - 页面需覆盖 `loading` 和 `error` 状态

## Public Interfaces
- 路由结构固定为:
  - `/auth`
  - `/assess`
  - `/history`
  - `/profile`
- 批量评估前端内部接口固定为“流事件驱动”模型, 页面只消费解析后的结构化事件, 不直接耦合原始 SSE 字符串.
- 新增统一格式化函数供评估页和历史页复用:
  - `formatSceneLabel`
  - `formatDistortionLabel`
  - `formatDateTime`
  - `normalizeImageSrc`

## Test Plan
- 认证流程:
  - 注册成功后显示中文提示并切回登录表单
  - 注册确认密码不一致时阻止提交
  - 登录成功后跳转 `/assess`
  - 直接打开任意前端路由时, 若本地存在认证信息, 先调用 `/auth/refresh` 尝试自动登录
  - `/auth/refresh` 成功后保存新 token 并跳转 `/assess`
  - `/auth/refresh` 失败后清空本地登录态, 未登录访问 `/assess`, `/history`, `/profile` 时被重定向到 `/auth`
  - 已登录访问 `/auth` 时被重定向到 `/assess`
- 路由与缓存:
  - 路由按懒加载加载页面
  - 从 `/history` 切到其他受保护页再返回时保留分页位置
  - 从 `/assess` 切到其他受保护页再返回时保留已展示的评估结果
  - `/profile` 不保留未提交的密码输入
- 单张评估:
  - 未选择文件时阻止提交并提示
  - 成功返回后正确展示分数, 场景, 失真
  - 失败时显示中文错误提示
- 批量评估:
  - 进度条优先展示服务端 `progress`, 缺失时按 `completed/total` 回退
  - `result` 事件逐条追加结果
  - `completed` 后展示完成提示并保留结果列表
  - `error` 后展示失败提示并停止 loading
- 历史记录:
  - 首次进入加载第 1 页
  - 列表为空时展示中文空状态占位
  - 切换每页条数后重置到第 1 页并重新请求
  - 翻页请求对应分页参数
  - 不显示搜索和筛选控件
  - 缩略图可打开预览弹窗
- 个人信息:
  - 用户信息初始展示正确
  - 仅改用户名可提交
  - 修改密码时必须填写旧密码和确认密码
  - 确认密码不一致时阻止提交
  - 更新成功后页面信息同步刷新
- 工程验证:
  - `pnpm lint`
  - `pnpm build`

## Assumptions
- 登录态默认持久化到 `localStorage`, 以支持刷新后保留会话.
- 应用启动时若本地存在认证信息, 则通过 `/auth/refresh` 尝试自动登录并刷新 token; 刷新失败时统一清理登录态并回到登录页.
- `Authorization` 请求头固定直接发送 `${accessToken}`, 不拼接 `tokenType`.
- 历史记录接口中的 `scene` 和 `distortion` 可能返回文本编码或数字字符串, 前端按“先映射, 后回退原值”的策略展示.
- 当前仓库没有现成测试框架和业务代码, 本期以类型检查, lint, build 和手工流程验证为主, 不额外引入 Vitest 或 E2E 依赖.
