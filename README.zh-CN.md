# dochost MCP 服务（中文说明）

[English](./README.md) | 简体中文

让 AI 助手把写好的 **Markdown 或 HTML 直接发布成一个可分享的网页链接**，之后还能在同一个链接上原地更新。接入后，你可以在 Claude Code、Cursor、Codex 等客户端里直接说“把刚才的页面发布出去，给我链接”，不用再复制代码、打开网站、粘贴。

- 网站：**https://dochost.io**（中文页面：https://dochost.io/zh ）
- MCP 介绍与安装页：https://dochost.io/mcp
- MCP 地址：`https://dochost.io/api/mcp`（Streamable HTTP）
- 认证：交互式客户端走 **OAuth 浏览器授权，不需要 API Key**；无头 / 服务器上的 Agent 可以用 API Key

> 说明：本仓库由 dochost 团队维护。下文的限制和价格以 [dochost.io/zh/pricing](https://dochost.io/zh/pricing) 为准。

## 接入

所有客户端用的都是同一个地址 `https://dochost.io/api/mcp`。第一次调用 dochost 工具时，客户端会打开浏览器让你登录 dochost（支持 Google、GitHub 或邮箱）并授权，之后 AI 以**你的身份**发布，页面出现在你的 dochost 后台，额度和有效期按你的套餐计算。

### Claude Code

```bash
claude mcp add --transport http dochost https://dochost.io/api/mcp
```

然后在 Claude Code 里运行 `/mcp`，在浏览器里完成授权。加上 `--scope user` 可以在所有项目里使用。

### Codex CLI

```bash
codex mcp add dochost --url https://dochost.io/api/mcp
codex mcp login dochost
```

第二条命令会打开浏览器完成 OAuth 授权。之后 `codex mcp list` 能看到 dochost。

### Cursor

在 `~/.cursor/mcp.json`（全局）或项目里的 `.cursor/mcp.json` 中加入：

```json
{
  "mcpServers": {
    "dochost": { "url": "https://dochost.io/api/mcp" }
  }
}
```

打开 **Settings → MCP**，点击 dochost，在浏览器里授权，状态变绿后能看到工具列表。

### Claude Desktop / VS Code / Windsurf / Gemini CLI

- **Claude Desktop 等通用写法**（远程 HTTP 服务）：

  ```json
  {
    "mcpServers": {
      "dochost": { "type": "http", "url": "https://dochost.io/api/mcp" }
    }
  }
  ```

- **VS Code（Copilot Agent 模式）**：

  ```bash
  code --add-mcp '{"name":"dochost","url":"https://dochost.io/api/mcp"}'
  ```

- **Windsurf**：配置项叫 `serverUrl`，写在 `~/.codeium/windsurf/mcp_config.json`：

  ```json
  { "mcpServers": { "dochost": { "serverUrl": "https://dochost.io/api/mcp" } } }
  ```

- **Gemini CLI**：

  ```bash
  gemini extensions install https://github.com/zyli5313/dochost-mcp
  ```

### 只支持 stdio 的客户端

可以用 `mcp-remote` 桥接：

```bash
npx mcp-remote https://dochost.io/api/mcp
```

或者用本仓库自带的 stdio 桥（需要 Node.js 22+）：

```bash
npm ci --ignore-scripts
node server/index.js
```

桥只是把请求转发到同一个托管的 MCP 服务，不是 dochost 的自托管版本。无头环境执行工具需要通过环境变量提供 `DOCHOST_API_KEY`。

### 国内 MCP 客户端

Trae、Cherry Studio 等国内客户端我们**没有逐一测试**。支持“远程 MCP（Streamable HTTP）+ OAuth”的客户端理论上都能用；只支持 stdio 的，可以用上面的 `mcp-remote` 桥接。

### 无头 Agent：用 API Key

在服务器、定时任务或 CI 里没有浏览器可以授权时，在 [dochost.io](https://dochost.io) → **Settings → API keys** 创建一个 Key，设成环境变量 `DOCHOST_API_KEY`，以 Bearer 方式访问同一个地址。示例配置见 [`examples/mcporter.config.json`](./examples/mcporter.config.json)，OpenClaw / Hermes 见 [`clients/`](./clients/)。API Key 和密码一样对待：不要提交到仓库，泄露后在后台撤销或轮换。

## 工具一览

服务目前提供 8 个工具（以 `tools/list` 实际返回为准）：

| 工具 | 作用 |
| --- | --- |
| `publish` | 发布 HTML 或 Markdown，返回链接、到期时间等。参数：`body`（必填）、`format`、`public`，付费方案可用 `customSlug`、`password`、`noBranding` |
| `update_page` | **原地替换**页面内容，链接、浏览量 / 点赞数和到期时间都不变。支持 `ifVersion` / `ifSha` 防覆盖 |
| `get_page_content` | 读回页面当前的 Markdown / HTML 源码，以及 `version`、`sha256` |
| `set_page_options` | 不重新发布就修改可见性、搜索引擎索引、密码（链接不变） |
| `get_page` | 查看单个页面的标题、格式、状态、浏览量、到期时间、是否有密码（不返回正文和密码） |
| `list_my_pages` | 按时间倒序列出你发布过的页面，分页，不含正文 |
| `get_account` | 查看套餐、页面额度用量、各项权限和新链接使用的域名 |
| `delete_page` | 永久删除页面，链接立即失效 |

## 示例提示词

发布：

```text
写一个单文件 HTML 的团队周报页面，CSS 和 JS 都内联，不依赖本地文件。
写完用 dochost 发布，不在发现页展示，把链接和过期时间告诉我。
```

迭代（推荐写法）：

```text
先用 get_page_content 读回刚才那个 dochost 页面的当前版本，
在此基础上把图表改成柱状图，再用 update_page 带 ifVersion 更新，链接不要变。
```

改设置：

```text
把这个 dochost 页面设为不被搜索引擎收录，其他不变。
```

## 用 `ifVersion` 原地更新，避免覆盖别人的修改

`update_page` 会替换**整个**页面内容。如果页面在浏览器里被人改过，而 AI 凭对话里的记忆去改，就会把那次修改悄悄覆盖掉。

推荐流程：

1. 调用 `get_page_content`，拿到当前正文和 `version`（以及 `sha256`）。
2. 在当前正文的基础上修改。
3. 调用 `update_page`，带上 `ifVersion`（或 `ifSha`）。

如果这期间页面又被改过，写入会被拒绝（`UPDATE_CONFLICT`），并返回当前版本号。这时重新读取、重新应用修改，再提交，**不要原样重发**。内容完全相同的更新是空操作，版本号不变。

为什么要用 `update_page` 而不是再 `publish` 一次：再发布一次会生成第二个链接，对方手里的旧链接不会跟着变。

## 限制

| 项目 | 说明 |
| --- | --- |
| 格式 | 只支持**单个** HTML 或 Markdown 文件；CSS / JS 需写在文件内，图片用公网地址或内嵌。多文件项目请用 Netlify、Cloudflare Pages、EdgeOne Pages 等支持目录的服务 |
| 免费版 | 每页 1 MB，同时 10 个在线页面；公开链接 7 天、私密链接 3 天后过期 |
| 付费版 | 专业版 $7/月（年付 $59）：永久链接、10 MB、200 个页面、自定义短链、密码保护、去掉 dochost 标识；Max $16/月：50 MB、不限页面、自定义域名 |
| “私密” | 只表示不出现在发现页，拿到链接的人仍可访问；要限制访问请用密码 |
| 发布频率 | 每分钟 20 次、每小时 300 次 |
| HTML 审核 | Markdown 立即可见；HTML 可能先经过几秒钟的安全检查 |
| 链接域名 | 发布的页面在 `dochost.co/d/…`，不在 `dochost.io` 上 |
| 中国大陆访问 | dochost **没有 ICP 备案**，页面由 Cloudflare 海外节点提供。大陆各地的打开速度、微信内置浏览器里能否打开，我们**未核实**；面向大陆用户的重要场合请先实测 |

## 安全提示

- MCP 走 OAuth 授权，客户端不需要保存 dochost 的 API Key；页面归属和权限只看你登录的账号，不看工具参数。
- **网页内容本身是公开可读的**（拿到链接就能看源码），不要把任何密钥、隐私数据写进要发布的 HTML。

## 相关链接

- 中文教程：[豆包、DeepSeek、Kimi、元宝、通义生成的网页怎么发成链接](https://dochost.io/zh/blog/share-ai-web-page-link)
- 英文完整说明：[README.md](./README.md)
- MCP 安装页：https://dochost.io/mcp

## 许可证

MIT，见 [LICENSE](./LICENSE)。
