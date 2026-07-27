package com.littleappstudio.seniorcare.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.telephony.SmsManager;
import android.util.Log;

public class SmsAlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        // 예약된 알람은 앱이 죽어도 시스템에 남아 그대로 발동한다.
        // 절전 기능이 감시 서비스를 꺼버리면 화면을 켜도 타이머가 리셋되지
        // 않아서, 멀쩡히 쓰고 있는데도 "12시간 미사용" 문자가 나간다.
        // 그래서 보내기 직전에 지금 화면이 켜져 있는지 한 번 더 확인한다.
        // 쓰고 있는 중이라면 12시간 방치일 리 없으므로 발송을 건너뛴다.
        if (isScreenOn(context)) {
            Log.d("SeniorCare", "Alarm fired but screen is on — skipping false alert.");
            ScreenMonitorService.rescheduleFrom(context);
            return;
        }

        Log.d("SeniorCare", "12 hours passed without screen on. Sending SMS.");

        SharedPreferences prefs = context.getSharedPreferences("SeniorCarePrefs", Context.MODE_PRIVATE);
        String phone = prefs.getString("phone", "");
        String phone2 = prefs.getString("phone2", "");
        String name = prefs.getString("name", "어르신");

        String message = "📱 " + name + " 어르신의 휴대폰이 12시간 동안 사용되지 않았습니다. 안부를 확인해 보세요.";

        try {
            SmsManager smsManager = SmsManager.getDefault();
            java.util.ArrayList<String> parts = smsManager.divideMessage(message);
            if (!phone.isEmpty()) {
                smsManager.sendMultipartTextMessage(phone, null, parts, null, null);
                Log.d("SeniorCare", "SMS sent to phone 1");
            }
            if (!phone2.isEmpty() && !phone2.equals(phone)) {
                smsManager.sendMultipartTextMessage(phone2, null, parts, null, null);
                Log.d("SeniorCare", "SMS sent to phone 2");
            }
        } catch (Exception e) {
            Log.e("SeniorCare", "Failed to send SMS from alarm: " + e.getMessage());
        }
    }

    private boolean isScreenOn(Context context) {
        try {
            android.os.PowerManager pm =
                (android.os.PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (pm == null) return false;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT_WATCH) {
                return pm.isInteractive();
            }
            return pm.isScreenOn();
        } catch (Exception e) {
            // 확인에 실패하면 문자를 막지 않는다. 놓친 위급 상황보다
            // 한 번의 헛된 알림이 낫다.
            Log.e("SeniorCare", "Screen state check failed: " + e.getMessage());
            return false;
        }
    }
}
