# Edge Link 接口文档

**版本**：v1.0.0
**基础路径**：`http://<node-ip>:80`
**协议**：HTTP/1.1 · WebSocket
**认证**：无（内网部署）
**编码**：UTF-8 · JSON

---

## 接口总览

| 方法 | 路径                        | 说明               |
|------|-----------------------------|--------------------|
| GET  | `/health`                   | 健康检查           |
| GET  | `/api/v1/system/info`       | 节点 & 系统信息    |
| GET  | `/api/v1/app/list`          | 应用列表           |

---

## 公共约定

### 响应格式

```json
{ "code": 0, "data": { ... } }
```

| 字段      | 类型    | 说明                          |
|-----------|---------|-------------------------------|
| `code`    | integer | `0` 成功，非 0 错误           |
| `data`    | any     | 业务数据，错误时不存在        |
| `message` | string  | 错误描述，仅错误响应时存在    |

### 时间戳

所有时间戳字段均为 **Unix 毫秒**（`int64`）。

---

## GET `/health`

健康检查接口，返回简单的成功状态。

### 响应

```json
{
  "code": 0
}
```

---

## GET `/api/v1/system/info`

返回节点系统信息。

### 响应

```json
{
  "code": 0,
  "data": {
    "name": "IEC2000",
    // ... 其他系统信息字段
  }
}
```

| 字段   | 类型   | 说明       |
|--------|--------|------------|
| `name` | string | 系统名称   |

---

## GET `/api/v1/app/list`

返回应用列表，包含应用的基本信息和状态。

### 响应

```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "icon": "/assets/icon.png",
        "name": "百度1",
        "type": "system",
        "url": "http://192.168.0.106:80",
        "status": "running"
      },
      {
        "icon": "/assets/icon.png",
        "name": "百度2",
        "type": "system",
        "url": "http://192.168.0.106:80",
        "status": "stopped"
      }
    ]
  }
}
```

| 字段     | 类型   | 说明                              |
|----------|--------|-----------------------------------|
| `icon`   | string | 应用图标路径                      |
| `name`   | string | 应用显示名称                      |
| `type`   | string | 应用类型：`system` 或 `user`      |
| `url`    | string | 应用访问地址                      |
| `status` | string | 应用状态：`running` 或 `stopped`  |

---