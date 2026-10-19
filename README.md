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

GitHub 的“Windows 构建”工作流可手动触发，或由 `v*` 标签触发；生成 Windows 程序和 NSIS 离线安装包，保存在 Actions artifacts，不自动发布 Release。

当前验证：前端构建和 8 项测试通过，浏览器中已走通两阶段操作，以及滤纸接触、晾干、回拨、暂停与重置。工作流尚未实际运行；本机桌面编译因构建进程找不到 `link.exe` 未通过，`cargo fmt` 因缺少 rustfmt 组件未运行成功。没有自动安装工具或修改系统环境。

若本机 npm 全局缓存不可写，可临时使用 `npm ci --cache .npm-cache`，不需要修改系统 npm 配置。

## 素材

`public/assets/` 的月季枝条、玻璃烧杯与滤纸由内置 imagegen 生成，使用透明背景。生成提示要求单独物体、无文字和标签、接近参考视频的教学模拟风格；枝条直立无根，烧杯无刻度，滤纸为白色圆片。完整提示记录在业务文档中。实验中的根、文字、图表与表格由代码绘制，不是截图。

改进后的共用烧杯使用 `glass-beaker-filled.png`，包含自然半杯液面；`filter-paper-wet.png` 用于枝条接触后的湿润纹理，随晾干进度消退。原始空烧杯和干滤纸保留作为编辑来源，完整新增提示词及验证记录见业务文档第 10 节。

## 参考与边界

视频参考：张艳娟实验教学工作室的用户提供演示视频，第一实验供稿杨素芹。参考来源用于流程与数据核对；未直接使用原软件的图片、标识或视频作运行素材。

第二个生根讨论题的答案是教学补充，参考视频没有展开。其依据为 [NC State Extension 植物繁殖手册](https://content.ces.ncsu.edu/extension-gardener-handbook/13-propagation) 对材料成熟度、物种和环境影响生根的说明；适宜浓度应在具体条件下通过实验确定。

本项目中的统计结果是该视频实验的演示数据，不是对任意植物、季节或实际生产条件的普适结论。
