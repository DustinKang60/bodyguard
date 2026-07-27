package com.littleappstudio.seniorcare.app;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.IBinder;
import android.telephony.SmsManager;
import android.util.Log;

public class ScreenMonitorService extends Service {
    private static final String CHANNEL_ID = "SeniorCareChannel";
    private static final int NOTIF_ID = 1;
    private static final long TIMEOUT_MS = 12 * 60 * 60 * 1000L; // 12 hours
    // private static final long TIMEOUT_MS = 60 * 1000L; // 1 min for testing

    private BroadcastReceiver screenReceiver;
    private BroadcastReceiver batteryReceiver;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        Notification notification = buildNotification();
        startForeground(NOTIF_ID, notification);

        // Register screen on receiver
        screenReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (Intent.ACTION_SCREEN_ON.equals(intent.getAction()) || Intent.ACTION_USER_PRESENT.equals(intent.getAction())) {
                    Log.d("SeniorCare", "Screen turned on or user present. Resetting timer.");
                    resetSmsAlarm();
                }
            }
        };
        IntentFilter filter = new IntentFilter();
        filter.addAction(Intent.ACTION_SCREEN_ON);
        filter.addAction(Intent.ACTION_USER_PRESENT);
        registerReceiver(screenReceiver, filter);

        // Register battery low receiver
        batteryReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                SharedPreferences prefs = getSharedPreferences("SeniorCarePrefs", Context.MODE_PRIVATE);
                boolean batteryAlert = prefs.getBoolean("batteryAlert", true);
                boolean alreadySent = prefs.getBoolean("batteryAlertSent", false);
                if (!batteryAlert || alreadySent) return;

                String phone = prefs.getString("phone", "");
                String phone2 = prefs.getString("phone2", "");
                String name = prefs.getString("name", "어르신");
                String message = "🔋 " + name + " 어르신의 휴대폰 배터리가 부족합니다. 충전이 필요합니다.";

                try {
                    SmsManager smsManager = SmsManager.getDefault();
                    java.util.ArrayList<String> parts = smsManager.divideMessage(message);
                    if (!phone.isEmpty()) {
                        smsManager.sendMultipartTextMessage(phone, null, parts, null, null);
                    }
                    if (!phone2.isEmpty() && !phone2.equals(phone)) {
                        smsManager.sendMultipartTextMessage(phone2, null, parts, null, null);
                    }
                    // 충전 후 다시 보낼 수 있도록 플래그 저장
                    prefs.edit().putBoolean("batteryAlertSent", true).apply();
                    Log.d("SeniorCare", "Battery low SMS sent.");
                } catch (Exception e) {
                    Log.e("SeniorCare", "Failed to send battery low SMS: " + e.getMessage());
                }
            }
        };
        IntentFilter batteryFilter = new IntentFilter(Intent.ACTION_BATTERY_LOW);
        registerReceiver(batteryReceiver, batteryFilter);

        // Reset batteryAlertSent flag when charging (so it sends again next time battery is low)
        BroadcastReceiver chargingReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                getSharedPreferences("SeniorCarePrefs", Context.MODE_PRIVATE)
                    .edit().putBoolean("batteryAlertSent", false).apply();
            }
        };
        registerReceiver(chargingReceiver, new IntentFilter(Intent.ACTION_POWER_CONNECTED));

        // Start the timer initially
        resetSmsAlarm();
    }

    private void resetSmsAlarm() {
        rescheduleFrom(this);
    }

    // 서비스가 죽은 뒤에도 알람 리시버 쪽에서 타이머를 다시 걸 수 있도록
    // static으로 둔다. (거짓 경보를 건너뛴 다음 다시 12시간을 재는 데 쓴다)
    static void rescheduleFrom(Context context) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(context, SmsAlarmReceiver.class);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, 0, intent, flags);

        if (alarmManager != null) {
            // Cancel previous
            alarmManager.cancel(pendingIntent);
            // Set new alarm 12 hours from now
            long triggerAtMillis = System.currentTimeMillis() + TIMEOUT_MS;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
            }
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "보디가드 보호 서비스",
                    NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(serviceChannel);
            }
        }
    }

    private Notification buildNotification() {
        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(this, CHANNEL_ID);
        } else {
            builder = new Notification.Builder(this);
        }
        
        return builder.setContentTitle("보디가드 작동 중")
                .setContentText("안전을 위해 지켜보고 있습니다. 이 알림을 지우면 감시가 멈출 수 있어요.")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setOngoing(true)
                .build();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (screenReceiver != null) {
            unregisterReceiver(screenReceiver);
        }
        if (batteryReceiver != null) {
            unregisterReceiver(batteryReceiver);
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
