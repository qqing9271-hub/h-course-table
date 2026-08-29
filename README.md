# H课程表

一个「个人课表 + 每日生活管理」的手机 App，自己能用，也能分享给别人用（各自数据独立）。

## 功能
- 首页：当天日期、当前学期/第几周、当天课程，支持 当日/一周 切换
- 课表：手动 / 导入 JSON / 分享别人课表；周次规则（全部/单/双/指定周）；一天节数与两小节一大节可改；可隐藏周六日
- 今日计划：计划 / 进行中 / 已完成 三板块，可移动、完成、复盘，按日期回看
- 随笔 / 日记：独立板块
- 数据安全：自动/手动备份（JSON），可导出/恢复
- 本地存储，无需账号；跨平台 iOS + Android（Expo / React Native）

## 技术栈
- Expo SDK 57 + React Native 0.86 + TypeScript
- zustand（状态）+ AsyncStorage（本地持久化）
- 领域逻辑单元测试（jest + ts-jest），类型检查 tsc

## 运行
```bash
npm install
npm start
```
用手机安装 **Expo Go** 扫码即可预览；或 `npx expo run:android` / 真机打包。

## 测试
```bash
npm test          # 领域逻辑单测
npx tsc --noEmit  # 类型检查
```

## 分享 / 导入
- 在「课表」页导出 JSON 发给别人；别人粘贴导入即成为自己的可编辑课表。
- 二维码分享：计划接入。

## GitHub / 发布
- 公开仓库，源码 + Release（Android 打包 APK 用 EAS Build）。
- CI：`.github/workflows/ci.yml` 自动跑单测与类型检查。

## License
MIT
