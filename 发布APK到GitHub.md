# 发布 APK 到 GitHub Release（给朋友下载）

> 前提：EAS 云端构建已完成，拿到 APK 文件（Expo 构建页可下载，或手机装好后从手机里导出也常见）。

---

## 一、获取 APK

1. 打开构建页：
   https://expo.dev/accounts/qingmae/projects/h-course-table/builds
2. 找到 **Finished** 的那条（preview），点击进入。
3. 右侧 `Install the app on your device`：手机扫码直接装；或点下载图标把 **.apk** 存到电脑。

---

## 二、发布到 GitHub Release（最简单：网页操作）

1. 打开仓库 Releases 页：
   https://github.com/qqing9271-hub/h-course-table/releases
2. 点 **Draft a new release**。
3. Choose a tag：选择已有的 **v1.0.0**（或新建，如 v1.0.1）。
4. 标题：比如 `H课程表 v1.0.0`；正文写更新说明（新增/修复）。
5. **上传 APK**：把刚下载的 `.apk` 拖到 `Attach binaries` 区域（注意 GitHub 单个文件 ≤2GB，APK 完全没问题）。
6. 点 **Publish release**。

---

## 三、分享给朋友

- 把 Release 页面链接发给朋友：https://github.com/qqing9271-hub/h-course-table/releases
- 朋友点 `Assets` 里的 **.apk** 下载 → 安装（允许“安装未知来源”）。

---

## 四、可选：用命令行发布（gh）

若想以后自动化，可安装 GitHub CLI 并登录一次：
```powershell
winget install --id GitHub.cli
gh auth login
```
然后（在项目目录，APK 放在项目里）:
```powershell
cd "E:\bbb\Univercity schoolwork\syllabus\h-course-table"
gh release create v1.0.0 --title "H课程表 v1.0.0" --notes "第一个可分享版本" app-release.apk
```
> 需要先在浏览器/终端完成一次 `gh auth login`（用你的 GitHub 账号），我这边不会索取任何密码/Token。

---

## 五、后续每次更新的大致流程

1. 改功能 → `npm test` + `npx tsc --noEmit` 全绿
2. `git add . && git commit -m "feat: ..." && git push origin main`
3. 改版本号（app.json/package.json）→ `npx eas-cli build --platform android --profile preview`
4. 下载新 APK → GitHub Releases 建 `v1.0.x` 并上传（照第二节）
5. 顺手更新 `CHANGELOG.md`。