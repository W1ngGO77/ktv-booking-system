# Render 平台部署教程

本教程将指导你将 KTV 订房管理系统部署到 Render 平台，实现永久免费托管和远程访问。

## 方案说明

我们选择 **SQLite 数据库**方案，因为：
- ✅ Render 免费版的磁盘存储仅在付费计划中可用
- ✅ SQLite 是单文件数据库，可以持久化存储
- ✅ 免费版也能正常运行，数据不会丢失
- ✅ 无需额外配置数据库服务

## 部署步骤

### 第一步：准备 GitHub 仓库

1. **创建 GitHub 账号**（如果没有）
   - 访问 [GitHub](https://github.com)
   - 点击 "Sign up" 注册账号

2. **创建新仓库**
   - 点击右上角 "+" → "New repository"
   - Repository name: `ktv-booking-system`
   - 选择 "Public"（免费版需要公开仓库）
   - 点击 "Create repository"

3. **上传项目文件**
   - 在仓库页面点击 "uploading an existing file"
   - 将 `KTV订房系统` 目录下的所有文件拖入（**不要上传 node_modules**）
   - 需要上传的文件：
     ```
     server.js
     package.json
     .gitignore
     README.md
     public/
     data/ (仅保留目录结构，不要上传 .json 文件)
     ```
   - 点击 "Commit changes"

### 第二步：注册并登录 Render

1. **访问 Render**
   - 打开 [https://render.com](https://render.com)
   - 点击 "Get Started" 或 "Sign In"
   - 可以使用 Google 账号快速登录

2. **连接 GitHub**
   - 首次登录会提示连接 GitHub
   - 点击 "Connect GitHub"
   - 授权 Render 访问你的仓库

### 第三步：创建 Web Service

1. **新建 Web Service**
   - 在 Render Dashboard 点击 "New +"
   - 选择 "Web Service"

2. **配置构建设置**
   - "Build Command": `npm install`
   - "Start Command": `npm start`

3. **选择免费实例**
   - "Instance Type": 选择 **Free**
   - 注意：免费实例会在 15 分钟无活动后进入休眠，首次访问可能需要等待几秒启动

4. **配置环境变量**（可选）
   - 点击 "Environment" 部分
   - 添加以下变量（可选，有默认值）：
     | 变量名 | 值 | 说明 |
     |--------|-----|------|
     | `SESSION_SECRET` | `your-secret-key` | Session 加密密钥 |
     | `NODE_ENV` | `production` | 生产环境标识 |

5. **部署**
   - 点击 "Create Web Service"
   - Render 会自动开始构建和部署
   - 可以点击日志查看部署进度

### 第四步：等待部署完成

1. **构建过程**
   - Render 会执行 `npm install` 安装依赖
   - 然后执行 `npm start` 启动服务
   - 约需 1-3 分钟

2. **部署成功**
   - 日志显示 "Your service is live" 
   - 获得一个 URL，例如：`https://ktv-booking-system.onrender.com`

### 第五步：访问和使用

1. **访问系统**
   - 打开分配的 URL
   - 例如：`https://your-app-name.onrender.com`

2. **登录测试**
   - 管理员账号: `admin` / `admin123`
   - 经理账号: `manager1` / `ktv2024`

## 常见问题

### Q: 部署失败怎么办？

**检查以下几点：**
1. 查看 Render 日志中的错误信息
2. 确保 `package.json` 的 `start` 脚本正确
3. 确保 `engines` 字段的 Node 版本格式正确
4. 检查 GitHub 仓库中是否包含必要的文件

### Q: 首次访问很慢？

这是正常的！Render 免费版在无活动 15 分钟后会进入休眠，首次访问需要唤醒（约 10-30 秒）。

### Q: 数据会丢失吗？

不会！SQLite 数据库文件保存在 Render 提供的持久化存储中，重启后数据保留。

### Q: 如何更新代码？

1. 修改本地代码
2. 推送到 GitHub
3. Render 会自动检测并重新部署

### Q: 如何绑定自定义域名？

1. 进入 Web Service 设置
2. 点击 "Custom Domains"
3. 添加你的域名并按照提示配置 DNS

## 环境变量说明

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `PORT` | 3000 | 服务端口（Render 会自动设置） |
| `SESSION_SECRET` | longlin-mansion-secret-key-2024 | Session 加密密钥 |
| `NODE_ENV` | production | 运行环境 |

## 技术栈

- **后端**: Node.js + Express
- **数据库**: SQLite (better-sqlite3)
- **前端**: HTML5 + CSS3 + JavaScript
- **部署**: Render Free Tier

## 费用说明

| 方案 | 价格 | 说明 |
|------|------|------|
| Free | $0/月 | 适合测试和小型使用 |
| Starter | $7/月 | 永不休眠，更快响应 |
| Pro | $25/月 | 支持私有仓库 |

## 联系支持

如果部署过程中遇到问题，请提供：
1. Render 部署日志截图
2. 错误信息描述
3. 你尝试的解决方法

祝你部署成功！🎉
