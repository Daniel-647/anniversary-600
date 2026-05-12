# Our 600th Day

一个电影感、数据驱动的恋爱 600 天纪念网站。页面保留 8 个章节，章节文案、照片信息和回忆节点仍然全部从 `data/*.json` 读取；发布版本新增 Supabase Storage + Database，用于在线上传和持久化照片。

## 本地运行

```bash
npm install
npm run dev
```

打开终端显示的本地地址，通常是 `http://localhost:5173`。

## 环境变量

复制 `.env.example` 为 `.env`：

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_EDITOR_PASSWORD=
VITE_BASE_PATH=/anniversary-600/
```

说明：

- `VITE_SUPABASE_URL`：Supabase Project URL
- `VITE_SUPABASE_ANON_KEY`：Supabase anon public key
- `VITE_EDITOR_PASSWORD`：网页上传入口的轻量编辑密码
- `VITE_BASE_PATH`：GitHub Pages 仓库子路径，例如 `/anniversary-600/`

不要提交 `.env`。前端只能使用 anon key，不能使用 service role key。

## Supabase 配置

1. 创建 Supabase 项目。
2. 打开 SQL Editor。
3. 运行 `supabase/init.sql`。
4. 确认生成 `photos` 表和 `love-photos` Storage bucket。

`photos` 表字段：

- `id`
- `chapter_id`
- `title`
- `caption`
- `date`
- `location`
- `image_url`
- `storage_path`
- `sort_order`
- `display_type`
- `animation`
- `mood`
- `color_tone`
- `created_at`

Storage bucket：`love-photos`

路径格式：

```text
love-photos/{chapter_id}/{timestamp}-{random}.{ext}
```

前端会校验上传文件：

- 只允许 `image/jpeg`、`image/png`、`image/webp`
- 单张图片最大 5MB
- 上传失败会以页面 toast / modal 状态提示，不使用 `alert`

## Row Level Security

SQL 默认策略：

- `photos`：允许 anon 公开读取
- `photos`：允许 anon 插入照片元数据
- `photos`：不开放 anon 更新/删除
- `storage.objects`：允许 anon 读取 `love-photos`
- `storage.objects`：允许 anon 上传到指定照片章节目录

编辑密码只是防误操作，不是真正后端安全。真实安全建议使用 Supabase Auth 或 Edge Function，在服务端校验权限后再上传/写表。

## 内容管理

本地内容仍然在三个 JSON 文件中：

- `data/chapters.json`：8 个章节文案与章节配置
- `data/photos.json`：本地静态照片配置
- `data/memories.json`：回忆节点与统计内容

照片展示逻辑：

1. 页面先读取本地 JSON。
2. 再读取 Supabase `photos` 表。
3. 本地 JSON 照片排在前面。
4. Supabase 远程照片按 `sort_order` / `created_at` 追加。
5. Supabase 加载失败时，本地章节仍然正常展示。

Ch1 `uncertain-beginning` 和 Ch6 `unexpected-challenge` 是纯文案章节，不显示上传栏。Ch2、Ch3、Ch4、Ch5、Ch7、Ch8 会显示对应的高级照片展厅与上传入口。

## GitHub Pages 部署

仓库已包含 `.github/workflows/deploy.yml`。

部署前，在 GitHub 仓库设置里添加 Secrets：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_EDITOR_PASSWORD`

然后：

1. 进入 GitHub 仓库 Settings。
2. 打开 Pages。
3. Source 选择 GitHub Actions。
4. 推送到 `main` 分支，或手动运行 Deploy workflow。

如果部署后资源 404，检查：

- `VITE_BASE_PATH` 是否等于仓库名路径，例如 `/anniversary-600/`
- GitHub Pages 是否启用了 GitHub Actions source
- workflow 是否成功生成 `dist`

## 构建

```bash
npm run build
npm run preview
```

`npm run build` 会先运行 TypeScript 检查，再执行 Vite build。

## 常见问题

**页面可以打开，但上传按钮提示 Supabase 未配置**

检查 `.env` 或 GitHub Secrets 中是否设置了 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`。

**密码一直不正确**

确认本地 `.env` 或 GitHub Secret 中的 `VITE_EDITOR_PASSWORD` 与输入一致。修改后需要重启 dev server 或重新部署。

**上传失败：bucket not found**

确认已经运行 `supabase/init.sql`，并且 Storage 中存在 `love-photos` bucket。

**上传失败：row-level security**

确认 `photos public insert` policy 和 `love photos public upload` policy 已创建。注意章节 ID 只能是照片章节：`growing-clear`、`nanjing`、`announcement`、`good-times-1`、`good-times-2`、`now`。

**图片太大或格式不支持**

前端和 Storage bucket 都限制为 JPG / PNG / WebP，最大 5MB。

**其他设备看不到照片**

确认照片元数据已经写入 `photos` 表，并且 `image_url` 指向 `love-photos` 的 public URL。刷新页面后会重新从 Supabase 合并远程照片。
