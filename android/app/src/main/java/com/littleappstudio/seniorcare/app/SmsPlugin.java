package com.littleappstudio.seniorcare.app;

import android.Manifest;
import android.telephony.SmsManager;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.getcapacitor.PermissionState;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

@CapacitorPlugin(
    name = "SmsPlugin",
    permissions = {
        @Permission(
            alias = "sms",
            strings = { Manifest.permission.SEND_SMS }
        )
    }
)
public class SmsPlugin extends Plugin {

    @PluginMethod
    public void sendSms(PluginCall call) {
        String phone = call.getString("phone");
        String message = call.getString("message");

        if (phone == null || message == null || phone.isEmpty()) {
            call.reject("Must provide valid phone and message");
            return;
        }

        if (getPermissionState("sms") != PermissionState.GRANTED) {
            requestPermissionForAlias("sms", call, "smsPermCallback");
            return;
        }

        try {
            SmsManager smsManager = SmsManager.getDefault();
            java.util.ArrayList<String> parts = smsManager.divideMessage(message);
            smsManager.sendMultipartTextMessage(phone, null, parts, null, null);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to send SMS: " + e.getMessage());
        }
    }

    @PluginMethod
    public void startMonitor(PluginCall call) {
        String phone = call.getString("phone", "");
        String phone2 = call.getString("phone2", "");
        String name = call.getString("name", "어르신");
        boolean batteryAlert = call.getBoolean("batteryAlert", true);

        SharedPreferences prefs = getContext().getSharedPreferences("SeniorCarePrefs", Context.MODE_PRIVATE);
        prefs.edit()
             .putString("phone", phone)
             .putString("phone2", phone2)
             .putString("name", name)
             .putBoolean("batteryAlert", batteryAlert)
             .apply();

        Intent serviceIntent = new Intent(getContext(), ScreenMonitorService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(serviceIntent);
        } else {
            getContext().startService(serviceIntent);
        }
        call.resolve();
    }

    @PluginMethod
    public void checkBatteryOptimization(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            String packageName = getContext().getPackageName();
            android.os.PowerManager pm = (android.os.PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
            boolean isIgnoring = pm.isIgnoringBatteryOptimizations(packageName);
            com.getcapacitor.JSObject ret = new com.getcapacitor.JSObject();
            ret.put("isIgnoring", isIgnoring);
            call.resolve(ret);
        } else {
            com.getcapacitor.JSObject ret = new com.getcapacitor.JSObject();
            ret.put("isIgnoring", true);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void requestBatteryOptimization(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                Intent intent = new Intent();
                String packageName = getContext().getPackageName();
                intent.setAction(android.provider.Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                intent.setData(android.net.Uri.parse("package:" + packageName));
                getContext().startActivity(intent);
                call.resolve();
            } catch (Exception e) {
                // Fallback to settings page if direct request fails
                Intent intent = new Intent(android.provider.Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                getContext().startActivity(intent);
                call.resolve();
            }
        } else {
            call.resolve();
        }
    }

    @PermissionCallback
    public void smsPermCallback(PluginCall call) {
        if (getPermissionState("sms") == PermissionState.GRANTED) {
            sendSms(call);
        } else {
            call.reject("SMS permission denied");
        }
    }

    // 현재 SMS 권한 상태만 확인 (팝업 없음)
    @PluginMethod
    public void checkSmsPermission(PluginCall call) {
        com.getcapacitor.JSObject ret = new com.getcapacitor.JSObject();
        ret.put("granted", getPermissionState("sms") == PermissionState.GRANTED);
        call.resolve(ret);
    }

    // 설치하는 보호자가 설정 단계에서 SMS 권한을 미리 받도록 한다.
    // 이렇게 하면 나중에 부모가 응급 버튼을 누를 때 권한 팝업이 뜨지 않는다.
    @PluginMethod
    public void requestSmsPermission(PluginCall call) {
        if (getPermissionState("sms") == PermissionState.GRANTED) {
            com.getcapacitor.JSObject ret = new com.getcapacitor.JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        } else {
            requestPermissionForAlias("sms", call, "smsRequestCallback");
        }
    }

    @PermissionCallback
    public void smsRequestCallback(PluginCall call) {
        com.getcapacitor.JSObject ret = new com.getcapacitor.JSObject();
        ret.put("granted", getPermissionState("sms") == PermissionState.GRANTED);
        call.resolve(ret);
    }
}
