


          
**项目概览**
- 目标：构建一个 Windows 桌面应用，内嵌 WebView 打开 H5 业务（发动机性能参数展示），通过 Flutter 解决跨平台与打包；前端采用 Vue Vben Admin 搭建业务页面。
- 桌面端职责：启动前检测网络与目标服务可达性；可达则打开指定 IP 的网页，不通则提示检查网络并可重试。
- 前端职责：基于 Vben Admin 构建参数展示系统（列表、详情、图表、告警），支持国际化、权限与主题。
- 技术选型：`Flutter (Windows Desktop)` + `webview_flutter` + `connectivity_plus` + `http`；`Vue 3` + `Vite` + `TypeScript` + `Vben Admin v5` + `echarts`。
- 开发环境：macos

**仓库结构**
- `qingzhi/desktop/`：Flutter Windows 桌面应用（WebView 容器、网络检测、配置管理）。
- `qingzhi/web/`：基于 Vben Admin 的前端项目（H5 页面、Mock/接口、图表展示）。
- `qingzhi/docs/`：技术文档与接口约定（当前文档）。
- 配置文件：`desktop/config/app.json`（或 `lib/app_config.dart`），包含目标网页地址与健康检查路径。

**Flutter 桌面应用**
- 核心依赖
  - `webview_flutter`：Windows 使用 Edge WebView2 运行时。
  - `connectivity_plus`：基础网络类型与连通性检测。
  - `http`：健康检查与目标主机可达验证。
- 启动流程
  - 读取 `config/app.json`：`webBaseUrl`、`healthCheckPath`、`timeoutMs`。
  - 进行健康检查：HTTP GET `webBaseUrl + healthCheckPath`，设置超时和错误重试。
  - 健康检查通过：加载 `webBaseUrl` 到 `WebView`。
  - 健康检查失败：展示错误页（提示“网络不可用或服务不可达”）+ “重试”按钮。
- 关键逻辑（伪代码）
  - `loadConfig()`：读取配置，校验 URL 与路径。
  - `checkReachable()`：`http.get(healthUrl, timeout)`；失败则回退 `Connectivity().checkConnectivity()`。
  - `openWebView(url)`：创建 `WebViewController`，设置导航策略仅允许特定域名。
  - `showError(retryFn)`：错误提示页，按钮点击触发 `checkReachable()` → 成功后进入 `openWebView(url)`。
- 配置示例
  - `desktop/config/app.json`：
    - `{ "webBaseUrl": "http://10.0.0.12:8080/", "healthCheckPath": "health", "timeoutMs": 3000 }`
- Windows 打包与运行
  - 环境：Windows 10/11，安装 Visual Studio（含 C++ 桌面开发），安装 Edge WebView2 Runtime。
  - 构建：`flutter build windows`
  - 成品目录：`build/windows/runner/Release/`（可分发）。

**前端（Vben Admin）**
- 框架特性
  - 使用 `Vue 3`、`Vite`、`TypeScript`，内置多主题、国际化、权限、动态路由等能力。
  - 项目地址 `https://github.com/vbenjs/vue-vben-admin`（最新版 v5，和旧版不兼容）。
- 初始化
  - 克隆：`git clone https://github.com/vbenjs/vue-vben-admin.git`
  - 安装：`cd vue-vben-admin && npm i -g corepack && pnpm install`
  - 开发：`pnpm dev`
  - 构建：`pnpm build`
- 二次开发
  - 新建业务模块：`engine`（仪表盘、列表、详情、图表、告警）。
  - 图表库：`echarts`（`echarts` + `vue-echarts`），用于曲线/柱状/散点/仪表盘。
  - 接口服务：`/api/engines`、`/api/engines/:id/metrics`、`/api/metrics/:id/timeseries?from=&to=`；开发期可先用 Vben 内置 Mock。
- 部署与访问
  - 生产构建输出：`dist/`
  - 部署到内网服务器：配置为 `http://<ip>:<port>/`，提供 `/health` 健康检查。
  - Flutter 桌面端配置为上述 `webBaseUrl`。

**业务模块设计**
- 页面与功能
  - 引擎仪表盘：关键指标总览（转速、扭矩、功率、温度、压力等）。
  - 参数列表：分页、筛选、排序，支持导出。
  - 指标详情：指标曲线（时序）、区间统计、告警记录。
  - 告警中心：规则配置（阈值、区间）、当前/历史告警、处理记录。
- 数据模型（示例）
  - `Engine`：`id`、`name`、`model`、`status`、`createdAt`
  - `Metric`：`id`、`engineId`、`name`、`unit`、`category`
  - `TimeseriesPoint`：`metricId`、`timestamp`、`value`
  - `Alarm`：`id`、`metricId`、`level`、`message`、`triggerAt`、`resolvedAt`
- 权限与国际化
  - 路由基于角色动态生成（Vben Admin 内置权限方案）。
  - 多语言：中文为默认，关键页面与菜单支持 i18n。

**接口约定**
- 健康检查
  - `GET /health` → `{ "status": "ok", "version": "x.y.z", "time": "..." }`
- 引擎列表
  - `GET /api/engines?keyword=&page=&pageSize=` → `{ "items": [...], "total": 123 }`
- 指标列表（按引擎）
  - `GET /api/engines/:id/metrics` → `Metric[]`
- 指标时序
  - `GET /api/metrics/:id/timeseries?from=&to=&interval=` → `{ "points": TimeseriesPoint[] }`
- 告警
  - `GET /api/alarms?engineId=&level=&from=&to=` → `{ "items": [...], "total": 456 }`
- 后续可按需扩展写入类接口（如告警处理记录提交）。

**开发流程（Trae 视角）**
- 准备
  - 创建双项目目录：`qingzhi/desktop` 与 `qingzhi/web`。
  - 为桌面项目新增配置文件与依赖；为前端基于 Vben Admin 初始化业务模块。
- 桌面端实现
  - 引入依赖：`flutter pub add webview_flutter connectivity_plus http`
  - 编写启动页与错误页，接入配置与健康检查逻辑。
  - 封装 `NavigationDelegate` 限制导航域名（仅允许 `webBaseUrl`）。
- 前端实现
  - 建立 `engine` 模块路由、菜单与页面骨架。
  - 接入 `echarts` 图表与接口服务层，先用 Mock 数据联调。
  - 配置 `/health` 与基本静态资源，确保 Flutter 端可达。
- 联调与验收
  - 在同网段设备上部署前端，Flutter 端指向其 `IP:PORT`。
  - 验证健康检查、网络异常提示与重试、页面加载与图表渲染。

**配置与环境**
- 桌面端配置项
  - `webBaseUrl`：目标网页基础地址（含协议与结尾 `/`）。
  - `healthCheckPath`：健康检查路径（默认 `health`）。
  - `timeoutMs`：健康检查超时（建议 `3000`）。
- 环境要求
  - Flutter 3.x（Stable），Windows 开发环境（VS + WebView2 Runtime）。
  - 前端 Node.js `>= 18`，`pnpm` 与 `corepack`。
- 注意
  - macOS 上可开发 Flutter 代码，但无法生成 Windows 可执行文件；打包需在 Windows 环境进行。

**构建与部署**
- 前端
  - 构建：`pnpm build`，部署 `dist/` 至 `http://<ip>:<port>/`，确保 `GET /health` 返回 200。
- 桌面端
  - 构建：`flutter build windows`，分发 `build/windows/runner/Release/` 目录。
  - 运行时依赖：确保目标机器安装 Microsoft Edge WebView2 Runtime。
- 升级与配置
  - 通过修改 `desktop/config/app.json` 更新目标前端地址，无需重新编译。

**测试计划**
- 桌面端
  - 正常网络：`/health` 200 → WebView 成功加载首页。
  - 服务不可达：`/health` 超时/非 200 → 展示错误页，重试按钮恢复后进入 WebView。
  - 非预期跳转：拦截外链，仅允许配置域名导航。
- 前端
  - 列表/筛选/分页正确渲染与交互。
  - 图表随时间窗口、指标切换正确更新。
  - `/health` 与接口返回格式满足约定，错误路径返回清晰提示。
  - 权限与国际化：不同角色菜单与页面可见性正确，中文为默认。

**里程碑与交付**
- M1：Flutter 桌面端骨架与网络检测页；Vben Admin 初始化与健康检查接口。
- M2：前端 `engine` 模块页面骨架与图表联调；桌面端导航限制与错误页完善。
- M3：接口联通与性能优化；打包与分发流程固化；验收测试通过。

**系统角色权限与数据同步方案**
- 角色权限设计
  - `admin`：管理员角色，可填写修改实验数据，负责数据同步操作。
  - `guest`：访客角色，只读权限，接收WebSocket推送实时更新页面。
  - `normal`：普通用户角色，只读权限，接收WebSocket推送实时更新页面。
  - 权限控制：admin显示编辑功能和"数据同步"按钮；guest/normal所有组件只读状态。
- WebSocket消息分类机制
  - 可修改数据消息：`experiment_data_update`、`appearance_data_update`、`environment_data_update`、`performance_data_update`（仅guest/normal处理）。
  - 只读消息：`system_notification`、`experiment_status_change`、`user_online_status`、`heartbeat`（所有角色处理）。
  - 消息处理策略：admin只处理只读消息避免数据冲突；guest/normal处理所有消息实时更新。
- 数据收集器模式
  - 核心思想：使用观察者模式统一管理分散在各组件中的可修改数据。
  - 数据收集器接口：`name`（收集器名称）、`type`（数据类型）、`collect()`（收集方法）、`hasChanges()`（变更检测）。
  - 组件注册机制：mounted时注册收集器，销毁时注销，同步时遍历收集。
- 数据同步流程
  - 数据修改：admin在各组件修改数据，暂存组件本地状态。
  - 数据收集：点击"数据同步"按钮，遍历所有注册的数据收集器。
  - 本地同步：将收集数据同步到本地store。
  - 后端提交：通过`POST /api/experiment/sync`提交数据。
  - WebSocket推送：后端向guest/normal推送更新消息。
  - 页面更新：guest/normal接收消息更新页面显示。
- 技术实现
  - Store设计：``（同步管理）、`useWebSocketStore`（消息处理）、`useAuthStore`（权限管理）。
  - 组件改造：角色权限判断、数据收集器注册、区分本地变更和WebSocket更新。
  - 接口设计：数据同步接口`POST /api/experiment/sync`，WebSocket推送`/ws/experiment/updates`。

**参考与备注**
- Vben Admin v5 特性与用法、初始化命令与分支说明见项目主页（Vue 3、Vite、TypeScript、主题、国际化、权限、动态路由等），项目地址 `https://github.com/vbenjs/vue-vben-admin`。
- 前端部署建议使用内网服务器并开放 `/health`，以提升桌面端可达性判断的准确性。
        