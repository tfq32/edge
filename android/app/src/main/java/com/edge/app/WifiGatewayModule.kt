// android/app/src/main/java/com/edge/app/WifiGatewayModule.kt
package com.edge.link

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.wifi.WifiManager
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.net.Inet6Address

class WifiGatewayModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "WifiGateway"

    @ReactMethod
    fun getGatewayIpAddress(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                // API 31+：使用 ConnectivityManager + LinkProperties（非废弃路径）
                val cm = reactApplicationContext
                    .getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
                    ?: run {
                        promise.reject("CONNECTIVITY_UNAVAILABLE", "ConnectivityManager is not available")
                        return
                    }

                // ✅ 遍历所有网络，找到 TRANSPORT_WIFI 那条
                // 不用 activeNetwork，避免移动数据优先级更高时把蜂窝误认为活跃网络
                val wifiNetwork = cm.allNetworks.firstOrNull { network ->
                    val caps = cm.getNetworkCapabilities(network)
                    caps != null && caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)
                } ?: run {
                    promise.reject("NOT_WIFI", "No Wi-Fi network found (Wi-Fi may be disconnected)")
                    return
                }

                val linkProperties = cm.getLinkProperties(wifiNetwork)
                    ?: run {
                        promise.reject("NO_LINK_PROPERTIES", "Unable to get link properties")
                        return
                    }

                // 取第一个有效 IPv4 网关地址
                val gateway = linkProperties.routes
                    .firstOrNull { route ->
                        route.gateway != null &&
                        route.gateway !is Inet6Address &&
                        route.gateway?.hostAddress?.isNotEmpty() == true &&
                        route.gateway?.hostAddress != "0.0.0.0"
                    }
                    ?.gateway?.hostAddress

                if (gateway.isNullOrEmpty()) {
                    promise.reject("NO_GATEWAY", "No IPv4 gateway found in link properties")
                    return
                }

                promise.resolve(gateway)

            } else {
                // API 30 及以下：使用 WifiManager.dhcpInfo，手动修正字节序
                @Suppress("DEPRECATION")
                val wifiManager = reactApplicationContext
                    .getSystemService(Context.WIFI_SERVICE) as? WifiManager
                    ?: run {
                        promise.reject("WIFI_UNAVAILABLE", "WifiManager is not available")
                        return
                    }

                @Suppress("DEPRECATION")
                val dhcpInfo = wifiManager.dhcpInfo
                if (dhcpInfo.gateway == 0) {
                    promise.reject("NO_GATEWAY", "Not connected to Wi-Fi or no gateway info")
                    return
                }

                // 手动处理小端序，避免 Formatter.formatIpAddress 在部分机型上字节倒序
                val gw = dhcpInfo.gateway
                val gatewayIp = "%d.%d.%d.%d".format(
                    gw and 0xff,
                    (gw shr 8) and 0xff,
                    (gw shr 16) and 0xff,
                    (gw shr 24) and 0xff
                )

                promise.resolve(gatewayIp)
            }
        } catch (e: Exception) {
            promise.reject("EXCEPTION", "Failed to get gateway IP: ${e.message}", e)
        }
    }
}