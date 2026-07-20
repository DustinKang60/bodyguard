package com.littleappstudio.seniorcare.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.telephony.SmsManager;
import android.util.Log;

public class SmsAlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
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
}
