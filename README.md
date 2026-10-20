# 生物实验 · Biology Lab

Windows 10/11 离线高中生物虚拟实验。首版开放“探究生长素类调节剂促进插条生根的最适浓度”，另外两个实验仅登记待扩展。

- [业务流程与架构](docs/业务流程与架构.md)
- [全部实验的操作手册与视频数据](docs/实验手册.md)
- [项目开发约束](AGENT.md)

## 本地运行

要求 Node.js 22.12 以上的 22.x、npm，桌面构建还需要 Rust MSVC、Visual Studio C++ Build Tools 和 WebView2。沿用系统环境，不自动安装全局工具。

```powershell
npm ci
npm run dev
```

打开 http://127.0.0.1:1420 。原理、目的和材料可直接切换；开始实验后逐组点击枝条，全部移入后会自动压缩计时，时间滑块可拖动。完成每步后点击左侧下一步，培养结束后可切换曲线和数据表。

```powershell
npm test
npm run build
npm run tauri dev
npm run tauri build
```

GitHub 的“Windows 构建与发布”工作流可手动触发，或由推送 `v*` 标签触发。手动触发只构建并保存 Actions artifacts；推送标签会在测试、两个安装包都构建成功后自动发布正式 Release，标题为“生物实验 v版本号”。程序 EXE 和两个安装包同时保留在 Actions artifacts。只需内置 `GITHUB_TOKEN`，无需个人 Token。

以 `0.1.0` 为例，Release 提供：

- `biology-lab_0.1.0_x64_with-webview2-setup.exe`：包含 WebView2 离线运行时，适合离线电脑。
- `biology-lab_0.1.0_x64-setup.exe`：不包含或下载 WebView2，适合已经安装该运行时的电脑。

两种安装包仅下载文件名为英文，安装界面、开始菜单、卸载列表和程序窗口均显示“生物实验”。第二种通过 `src-tauri/tauri.no-webview.conf.json` 覆盖 WebView2 安装选项，复用第一次构建的程序；收集脚本只更改输出文件名，不更改产品名。

发布前同步 `package.json`、`package-lock.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 和 `src-tauri/tauri.conf.json` 中的项目版本并提交；标签必须等于 `v` 加项目版本，且前端版本与 Tauri 版本一致，否则工作流提前失败。例如版本为 `0.1.0` 且尚无此标签时，在包含发布工作流的提交上执行：

```powershell
git push origin main
git tag v0.1.0
git push origin v0.1.0
```

仅本地创建 tag 不会触发发布，须推送至 GitHub。到仓库 Actions 查看“Windows 构建与发布”结果，成功后在 Releases 下载安装包。本次配置调整未创建标签或实际发布，云端打包与安装仍需以实际运行为准。

当前验证：前端构建和 8 项测试通过，浏览器中已走通两阶段操作，以及滤纸接触、晾干、回拨、暂停与重置。首个 `v0.1.0` 已在云端生成过含运行时的安装包；本次双包配置已通过 YAML、配置覆盖、英文名称和收集脚本正反例检查，实际双包产物以重新发布结果为准。本机桌面编译因构建进程找不到 `link.exe` 未通过，`cargo fmt` 因缺少 rustfmt 组件未运行成功。没有自动安装工具或修改系统环境。

若本机 npm 全局缓存不可写，可临时使用 `npm ci --cache .npm-cache`，不需要修改系统 npm 配置。

## 素材

`public/assets/` 的月季枝条、玻璃烧杯与滤纸由内置 imagegen 生成，使用透明背景。生成提示要求单独物体、无文字和标签、接近参考视频的教学模拟风格；枝条直立无根，烧杯无刻度，滤纸为白色圆片。完整提示记录在业务文档中。实验中的根、文字、图表与表格由代码绘制，不是截图。

改进后的共用烧杯使用 `glass-beaker-filled.png`，包含自然半杯液面；`filter-paper-wet.png` 用于枝条接触后的湿润纹理，随晾干进度消退。原始空烧杯和干滤纸保留作为编辑来源，完整新增提示词及验证记录见业务文档第 10 节。

## 参考与边界

视频参考：张艳娟实验教学工作室的用户提供演示视频，第一实验供稿杨素芹。参考来源用于流程与数据核对；未直接使用原软件的图片、标识或视频作运行素材。

第二个生根讨论题的答案是教学补充，参考视频没有展开。其依据为 [NC State Extension 植物繁殖手册](https://content.ces.ncsu.edu/extension-gardener-handbook/13-propagation) 对材料成熟度、物种和环境影响生根的说明；适宜浓度应在具体条件下通过实验确定。

本项目中的统计结果是该视频实验的演示数据，不是对任意植物、季节或实际生产条件的普适结论。
