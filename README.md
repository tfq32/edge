# EdgeApp

基于 React Native 0.84.1 的内网微服务桌面 Android App。

## 当前实现
- 标准 WiFi 二维码内容解析（当前为模拟扫码输入）
- WiFi 连接主流程占位
- 自动发现网关 IP（当前开发版默认使用 `10.0.2.2`）
- 通过 `http://{gatewayIp}:80/api/app/list` 获取桌面数据
- 微服务桌面（兼容手机/平板布局）
- WebView 打开微服务页面
- 本地记录最近一次连接信息

## 技术栈
- React Native 0.84.1
- TypeScript
- Zustand
- TanStack React Query
- react-native-webview
- react-native-mmkv

## 开发说明
当前版本优先保证 RN 0.84.1 主工程可编译、可安装、可跑主流程。
由于部分扫码/WiFi 生态库与 RN 0.84.1 + Gradle 9 兼容性不足，首版先保留：
- 模拟扫码输入
- WiFi 自动连接占位

后续会补真机扫码与 WiFi 自动连接兼容实现。

## 接口
桌面接口：

`GET http://{gatewayIp}:80/api/app/list`

返回：

```json
[{ "icon": "", "name": "", "type": "system", "url": "" }]
```
