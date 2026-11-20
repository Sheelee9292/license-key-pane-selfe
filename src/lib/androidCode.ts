/**
 * Complete MainActivity.java for Mr. Shakeel v2.5.8.
 * Drop-in: package com.mrshakeel.app  →  create the package folder in
 * app/src/main/java/com/mrshakeel/app/ and paste this file as MainActivity.java
 */
export const MAIN_ACTIVITY_JAVA = String.raw`package com.mrshakeel.app;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * ============================================================
 *  Mr. Shakeel v2.5.8 - License activation (panel integrated)
 * ============================================================
 *  1. Shows the customer's Device ID with a one-tap Copy button.
 *  2. WhatsApp (+966594534381) and Telegram (@Shakeel9292) buttons.
 *  3. "Activate License Key" dialog with:
 *        3 Days Plan / 1 Month Plan (30 Days) / 3 Months Plan (90 Days)
 *        + Enter License Key + ACTIVATE
 *  4. ACTIVATE calls your free web panel (/api/verify), checks the key,
 *     the selected plan, the Device ID binding and the expiry date,
 *     saves the result locally and flips the status label from
 *     "Expired or Inactive" to "Active".
 *
 *  SETUP: change PANEL_URL below to the address of your deployed panel.
 * ============================================================
 */
public class MainActivity extends AppCompatActivity {

    // >>> CHANGE THIS to your own panel address (no trailing slash) <<<
    // Examples:
    //   local PC   : http://192.168.1.10:3000
    //   free host  : https://your-panel.vercel.app
    private static final String PANEL_URL = "https://YOUR-PANEL-URL.vercel.app";

    private static final String VERIFY_ENDPOINT = "/api/verify";
    private static final String WHATSAPP_NUMBER = "966594534381";   // +966 59 453 4381
    private static final String TELEGRAM_USER   = "Shakeel9292";    // @Shakeel9292
    private static final String APP_VERSION     = "2.5.8";

    private static final String PREFS = "mr_shakeel_license";
    private static final String KEY_LICENSE   = "license_key";
    private static final String KEY_PLAN      = "license_plan";
    private static final String KEY_PLAN_DAYS = "license_plan_days";
    private static final String KEY_EXPIRES   = "license_expires_at";   // epoch millis
    private static final String KEY_STATUS    = "license_status";       // active | expired | revoked | none
    private static final String KEY_DEVICE    = "device_id";
    private static final String KEY_BOUND_AT  = "license_bound_at";

    private static final String[] PLAN_IDS   = {"3d", "1m", "3m"};
    private static final String[] PLAN_NAMES = {
            "3 Days Plan",
            "1 Month Plan (30 Days)",
            "3 Months Plan (90 Days)"
    };
    private static final int[] PLAN_DAYS = {3, 30, 90};

    private SharedPreferences prefs;
    private final ExecutorService io = Executors.newFixedThreadPool(2);

    private TextView txtDeviceId;
    private TextView txtLicenseStatus;
    private TextView txtLicenseDetail;
    private Button btnCopyDevice;
    private Button btnWhatsApp;
    private Button btnTelegram;
    private Button btnActivate;
    private Button btnCheck;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // If you already have a layout with these ids, use it:
        // setContentView(R.layout.activity_main);
        //
        // The layout is built in code below so this file runs even without
        // an XML layout. Remove buildContentView() and call setContentView(...)
        // with your own layout if you prefer.
        prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        setContentView(buildContentView());

        bindViews();
        restoreDeviceId();
        renderLicenseState();
        attachListeners();
    }

    // ------------------------------------------------------------------
    // UI (code-built so it works out of the box; see note above)
    // ------------------------------------------------------------------
    private View buildContentView() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(20), dp(28), dp(20), dp(20));
        root.setBackgroundColor(0xFFF4EFE4);

        TextView title = new TextView(this);
        title.setText("Mr. Shakeel");
        title.setTextSize(TypedValue.COMPLEX_UNIT_SP, 30);
        title.setTextColor(0xFF16130E);
        root.addView(title);

        TextView subtitle = new TextView(this);
        subtitle.setText("v" + APP_VERSION + "  ·  License & Device");
        subtitle.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        subtitle.setTextColor(0xFF8B8477);
        subtitle.setGravity(Gravity.START);
        root.addView(subtitle);

        // ---- device id card ----
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setPadding(dp(14), dp(14), dp(14), dp(14));
        card.setBackgroundColor(0xFFFFFFFF);
        LinearLayout.LayoutParams cardLp =
                new LinearLayout.LayoutParams(-1, -2);
        cardLp.topMargin = dp(18);
        root.addView(card, cardLp);

        TextView devLabel = new TextView(this);
        devLabel.setText("YOUR DEVICE ID");
        devLabel.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
        devLabel.setTextColor(0xFFC1361F);
        card.addView(devLabel);

        txtDeviceId = new TextView(this);
        txtDeviceId.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
        txtDeviceId.setTextColor(0xFF16130E);
        txtDeviceId.setTextIsSelectable(true);
        txtDeviceId.setPadding(0, dp(6), 0, dp(10));
        card.addView(txtDeviceId);

        btnCopyDevice = new Button(this);
        btnCopyDevice.setText("COPY DEVICE ID");
        card.addView(btnCopyDevice);

        TextView hint = new TextView(this);
        hint.setText("Copy it and send it on WhatsApp or Telegram. "
                + "You will receive your License Key back.");
        hint.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        hint.setTextColor(0xFF4A4438);
        hint.setPadding(0, dp(10), 0, 0);
        card.addView(hint);

        // ---- contact buttons ----
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout.LayoutParams rowLp = new LinearLayout.LayoutParams(-1, -2);
        rowLp.topMargin = dp(12);
        root.addView(row, rowLp);

        btnWhatsApp = makeButton("WHATSAPP", 0xFF2F6B4F);
        btnTelegram = makeButton("TELEGRAM", 0xFF1F3B57);
        LinearLayout.LayoutParams lpW = new LinearLayout.LayoutParams(0, -2, 1f);
        LinearLayout.LayoutParams lpT = new LinearLayout.LayoutParams(0, -2, 1f);
        lpW.setMargins(0, 0, dp(6), 0);
        lpT.setMargins(dp(6), 0, 0, 0);
        row.addView(btnWhatsApp, lpW);
        row.addView(btnTelegram, lpT);

        // ---- license status card ----
        LinearLayout licCard = new LinearLayout(this);
        licCard.setOrientation(LinearLayout.VERTICAL);
        licCard.setPadding(dp(14), dp(14), dp(14), dp(14));
        licCard.setBackgroundColor(0xFFFFFFFF);
        LinearLayout.LayoutParams licLp = new LinearLayout.LayoutParams(-1, -2);
        licLp.topMargin = dp(16);
        root.addView(licCard, licLp);

        TextView licLabel = new TextView(this);
        licLabel.setText("LICENSE STATUS");
        licLabel.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
        licLabel.setTextColor(0xFFC1361F);
        licCard.addView(licLabel);

        txtLicenseStatus = new TextView(this);
        txtLicenseStatus.setTextSize(TypedValue.COMPLEX_UNIT_SP, 24);
        txtLicenseStatus.setTextColor(0xFFC1361F);
        txtLicenseStatus.setPadding(0, dp(6), 0, 0);
        licCard.addView(txtLicenseStatus);

        txtLicenseDetail = new TextView(this);
        txtLicenseDetail.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        txtLicenseDetail.setTextColor(0xFF4A4438);
        txtLicenseDetail.setPadding(0, dp(4), 0, 0);
        licCard.addView(txtLicenseDetail);

        // ---- activate / check ----
        btnActivate = new Button(this);
        btnActivate.setText("ACTIVATE LICENSE KEY");
        LinearLayout.LayoutParams lpA = new LinearLayout.LayoutParams(-1, -2);
        lpA.topMargin = dp(16);
        root.addView(btnActivate, lpA);

        btnCheck = makeButton("CHECK LICENSE ONLINE", 0xFF16130E);
        LinearLayout.LayoutParams lpC = new LinearLayout.LayoutParams(-1, -2);
        lpC.topMargin = dp(8);
        root.addView(btnCheck, lpC);

        TextView foot = new TextView(this);
        foot.setText("Panel: " + PANEL_URL);
        foot.setTextSize(TypedValue.COMPLEX_UNIT_SP, 10);
        foot.setTextColor(0xFF8B8477);
        foot.setPadding(0, dp(24), 0, 0);
        root.addView(foot);

        return root;
    }

    private Button makeButton(String text, int color) {
        Button b = new Button(this);
        b.setText(text);
        b.setTextColor(0xFFFFFFFF);
        b.setBackgroundColor(color);
        b.setAllCaps(false);
        return b;
    }

    private void bindViews() {
        // no-op for code-built layout; kept so XML layouts can reuse this class
    }

    private void attachListeners() {
        btnCopyDevice.setOnClickListener(v -> copyDeviceId());
        btnWhatsApp.setOnClickListener(v -> openWhatsApp());
        btnTelegram.setOnClickListener(v -> openTelegram());
        btnActivate.setOnClickListener(v -> showActivationDialog());
        btnCheck.setOnClickListener(v -> verifyLicense("check"));
    }

    // ------------------------------------------------------------------
    // Device ID
    // ------------------------------------------------------------------
    private void restoreDeviceId() {
        String id = prefs.getString(KEY_DEVICE, "");
        if (TextUtils.isEmpty(id)) {
            id = Settings.Secure.getString(getContentResolver(),
                    Settings.Secure.ANDROID_ID);
            if (id == null || id.length() < 8) {
                // very old / restricted devices: make a stable random id
                id = "MSD-" + UUID.randomUUID().toString()
                        .replace("-", "").substring(0, 16).toUpperCase();
            }
            id = "MS258-" + Build.MANUFACTURER.toUpperCase() + "-"
                    + id.toUpperCase();
            prefs.edit().putString(KEY_DEVICE, id).apply();
        }
        txtDeviceId.setText(id);
    }

    private String getDeviceId() {
        return prefs.getString(KEY_DEVICE, "");
    }

    private void copyDeviceId() {
        ClipboardManager cm =
                (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
        if (cm != null) {
            cm.setPrimaryClip(ClipData.newPlainText(
                    "Mr. Shakeel Device ID", getDeviceId()));
            toast("Device ID copied — now send it to us");
        }
    }

    // ------------------------------------------------------------------
    // WhatsApp / Telegram
    // ------------------------------------------------------------------
    private void openWhatsApp() {
        String text = "Hello Mr. Shakeel, here is my Device ID:\n"
                + getDeviceId()
                + "\nApp: Mr. Shakeel v" + APP_VERSION
                + "\nPlease send me a license key.";
        try {
            Intent i = new Intent(Intent.ACTION_VIEW,
                    Uri.parse("https://wa.me/" + WHATSAPP_NUMBER
                            + "?text=" + Uri.encode(text)));
            startActivity(i);
        } catch (Exception e) {
            toast("WhatsApp is not installed on this device");
        }
    }

    private void openTelegram() {
        String text = "Hello, here is my Device ID:\n"
                + getDeviceId()
                + "\nApp: Mr. Shakeel v" + APP_VERSION
                + "\nPlease send me a license key.";
        // t.me/share opens Telegram with the message pre-filled and lets the
        // customer pick @Shakeel9292 as the recipient.
        String shareUrl = "https://t.me/share/url?url="
                + Uri.encode("https://t.me/" + TELEGRAM_USER)
                + "&text=" + Uri.encode(text);
        try {
            startActivity(new Intent(Intent.ACTION_VIEW,
                    Uri.parse(shareUrl)));
        } catch (Exception e) {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW,
                        Uri.parse("https://t.me/" + TELEGRAM_USER)));
            } catch (Exception e2) {
                toast("Telegram is not installed on this device");
            }
        }
    }

    // ------------------------------------------------------------------
    // Activation dialog: 3 Days / 1 Month / 3 Months + key + ACTIVATE
    // ------------------------------------------------------------------
    private void showActivationDialog() {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(dp(20), dp(8), dp(20), dp(8));

        TextView label = new TextView(this);
        label.setText("Choose your plan");
        label.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
        label.setTextColor(0xFF8B8477);
        box.addView(label);

        final RadioGroup group = new RadioGroup(this);
        group.setOrientation(RadioGroup.VERTICAL);
        for (int i = 0; i < PLAN_NAMES.length; i++) {
            RadioButton rb = new RadioButton(this);
            rb.setText(PLAN_NAMES[i] + "  (" + PLAN_DAYS[i] + " days)");
            rb.setId(1000 + i);
            rb.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
            if (i == 1) rb.setChecked(true);   // default: 1 Month
            group.addView(rb);
        }
        box.addView(group);

        TextView keyLabel = new TextView(this);
        keyLabel.setText("Enter License Key");
        keyLabel.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
        keyLabel.setTextColor(0xFF8B8477);
        keyLabel.setPadding(0, dp(14), 0, dp(4));
        box.addView(keyLabel);

        final EditText keyInput = new EditText(this);
        keyInput.setHint("MS258-XXXX-XXXX-XXXX");
        keyInput.setSingleLine(true);
        keyInput.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
        keyInput.setGravity(Gravity.CENTER);
        box.addView(keyInput);

        final TextView errorView = new TextView(this);
        errorView.setTextColor(0xFFC1361F);
        errorView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        errorView.setPadding(0, dp(8), 0, 0);
        errorView.setVisibility(View.GONE);
        box.addView(errorView);

        // If you ALREADY have an XML dialog (dialog_activate_license.xml),
        // replace the block above with:
        //   View v = getLayoutInflater().inflate(R.layout.dialog_activate_license, null);
        //   RadioGroup group = v.findViewById(R.id.planGroup);
        //   EditText keyInput = v.findViewById(R.id.editLicenseKey);
        //   TextView errorView = v.findViewById(R.id.textError);
        //   Button positive = ((AlertDialog) dialog).getButton(...);
        // and keep the logic below exactly as it is.

        final AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle("Activate License Key")
                .setView(box)
                .setPositiveButton("ACTIVATE", null)   // set below, so it does not auto-close
                .setNegativeButton("CANCEL", null)
                .create();

        dialog.setOnShowListener(d -> {
            Button pos = dialog.getButton(AlertDialog.BUTTON_POSITIVE);
            pos.setOnClickListener(v -> {
                int checkedId = group.getCheckedRadioButtonId();
                if (checkedId < 0) {
                    showError(errorView, "Select a plan first.");
                    return;
                }
                int idx = checkedId - 1000;
                String key = keyInput.getText().toString().trim().toUpperCase();
                if (key.isEmpty()) {
                    showError(errorView, "Enter License Key.");
                    return;
                }
                // remember the plan the customer picked
                prefs.edit()
                        .putString(KEY_PLAN, PLAN_IDS[idx])
                        .putInt(KEY_PLAN_DAYS, PLAN_DAYS[idx])
                        .apply();
                verifyLicense("activate", key, PLAN_IDS[idx], errorView, dialog);
            });
        });
        dialog.show();
    }

    private void showError(TextView target, String msg) {
        target.setText(msg);
        target.setVisibility(View.VISIBLE);
    }

    // ------------------------------------------------------------------
    // Verification against the panel
    // ------------------------------------------------------------------
    private void verifyLicense(String action) {
        String key = prefs.getString(KEY_LICENSE, "");
        if (TextUtils.isEmpty(key)) {
            showActivationDialog();
            return;
        }
        verifyLicense(action, key, prefs.getString(KEY_PLAN, ""),
                null, null);
    }

    private void verifyLicense(final String action, final String key,
                               final String plan,
                               final TextView errorView,
                               final AlertDialog dialog) {
        final String deviceId = getDeviceId();
        setBusy(true);

        io.execute(() -> {
            String raw = null;
            int code = 0;
            try {
                URL url = new URL(PANEL_URL + VERIFY_ENDPOINT);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setConnectTimeout(12000);
                conn.setReadTimeout(12000);
                conn.setDoOutput(true);
                conn.setRequestProperty("Content-Type", "application/json");

                JSONObject body = new JSONObject();
                body.put("key", key);
                body.put("deviceId", deviceId);
                body.put("plan", plan);
                body.put("action", action);
                body.put("app", "Mr. Shakeel");
                body.put("version", APP_VERSION);

                OutputStream os = conn.getOutputStream();
                os.write(body.toString().getBytes(StandardCharsets.UTF_8));
                os.flush();
                os.close();

                code = conn.getResponseCode();
                InputStream is = (code >= 400)
                        ? conn.getErrorStream() : conn.getInputStream();
                BufferedReader br = new BufferedReader(
                        new InputStreamReader(is, StandardCharsets.UTF_8));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) sb.append(line);
                br.close();
                raw = sb.toString();
                conn.disconnect();
            } catch (Exception e) {
                raw = null;
            }

            final String response = raw;
            final int status = code;
            runOnUiThread(() -> {
                setBusy(false);
                handleResponse(action, key, plan, status, response,
                        errorView, dialog);
            });
        });
    }

    private void handleResponse(String action, String key, String plan,
                                int status, String response,
                                TextView errorView, AlertDialog dialog) {
        if (response == null) {
            // OFFLINE FALLBACK: keep working from the locally saved license
            // as long as it has not expired yet.
            if (isLocalLicenseValid()) {
                renderLicenseState();
                toast("Panel unreachable — using saved license");
                return;
            }
            fail(errorView, dialog,
                    "Cannot reach the license server. Check your internet.");
            return;
        }

        try {
            JSONObject obj = new JSONObject(response);
            boolean ok = obj.optBoolean("ok", false);
            String message = obj.optString(
                    "message", "License verification failed.");

            if (ok) {
                JSONObject lic = obj.getJSONObject("license");
                long expiresAt = parseIsoToMillis(
                        lic.getString("expiresAt"));

                prefs.edit()
                        .putString(KEY_LICENSE, lic.getString("key"))
                        .putString(KEY_PLAN, lic.getString("plan"))
                        .putInt(KEY_PLAN_DAYS, lic.getInt("days"))
                        .putLong(KEY_EXPIRES, expiresAt)
                        .putLong(KEY_BOUND_AT,
                                parseIsoToMillis(lic.getString("boundAt")))
                        .putString(KEY_STATUS,
                                expiresAt > System.currentTimeMillis()
                                        ? "active" : "expired")
                        .apply();

                renderLicenseState();
                if (dialog != null) dialog.dismiss();
                toast("License activated — enjoy Mr. Shakeel!");
            } else {
                String code = obj.optString("code", "");
                if ("REVOKED".equals(code) || "EXPIRED".equals(code)
                        || "DEVICE_MISMATCH".equals(code)) {
                    // the panel is the source of truth: clear the local copy
                    prefs.edit().remove(KEY_LICENSE)
                            .putString(KEY_STATUS,
                                    "EXPIRED".equals(code)
                                            ? "expired" : "revoked")
                            .apply();
                    renderLicenseState();
                }
                fail(errorView, dialog, message);
            }
        } catch (Exception e) {
            fail(errorView, dialog, "Bad server response. Try again later.");
        }
    }

    private void fail(TextView errorView, AlertDialog dialog, String msg) {
        if (errorView != null) {
            showError(errorView, msg);
        } else if (dialog != null) {
            dialog.dismiss();
            toast(msg);
        } else {
            toast(msg);
        }
    }

    private void setBusy(final boolean busy) {
        runOnUiThread(() -> {
            btnActivate.setEnabled(!busy);
            btnCheck.setEnabled(!busy);
            btnActivate.setText(busy ? "CHECKING…" : "ACTIVATE LICENSE KEY");
        });
    }

    // ------------------------------------------------------------------
    // Local license state (what the status label shows)
    // ------------------------------------------------------------------
    private boolean isLocalLicenseValid() {
        String status = prefs.getString(KEY_STATUS, "none");
        long expires = prefs.getLong(KEY_EXPIRES, 0L);
        return "active".equals(status) && expires > System.currentTimeMillis();
    }

    private void renderLicenseState() {
        String status = prefs.getString(KEY_STATUS, "none");
        long expires = prefs.getLong(KEY_EXPIRES, 0L);
        String planName = prefs.getString(KEY_PLAN, "");
        int planDays = prefs.getInt(KEY_PLAN_DAYS, 0);
        String key = prefs.getString(KEY_LICENSE, "");

        boolean live = "active".equals(status)
                && expires > System.currentTimeMillis();

        if (live) {
            int daysLeft = (int) Math.ceil(
                    (expires - System.currentTimeMillis()) / 86400000.0);
            txtLicenseStatus.setText("ACTIVE");
            txtLicenseStatus.setTextColor(0xFF2F6B4F);
            txtLicenseDetail.setText(
                    planName + " (" + planDays + " days)\n"
                    + "Key: " + key + "\n"
                    + "Expires: " + formatDate(expires)
                    + "  ·  " + daysLeft + " day(s) left");
            btnActivate.setText("MANAGE / RENEW KEY");
        } else if ("revoked".equals(status)) {
            txtLicenseStatus.setText("REVOKED");
            txtLicenseStatus.setTextColor(0xFFC1361F);
            txtLicenseDetail.setText(
                    "This license was blocked. Contact us on WhatsApp "
                    + "+" + WHATSAPP_NUMBER + " or Telegram @"
                    + TELEGRAM_USER + ".");
            btnActivate.setText("ACTIVATE LICENSE KEY");
        } else if (expires > 0
                && expires <= System.currentTimeMillis()) {
            txtLicenseStatus.setText("EXPIRED");
            txtLicenseStatus.setTextColor(0xFFA6761D);
            txtLicenseDetail.setText(
                    "Expired on " + formatDate(expires)
                    + ". Buy a new plan to continue.");
            btnActivate.setText("ACTIVATE LICENSE KEY");
        } else {
            txtLicenseStatus.setText("EXPIRED OR INACTIVE");
            txtLicenseStatus.setTextColor(0xFFC1361F);
            txtLicenseDetail.setText(
                    "No active license on this device.\n"
                    + "Copy your Device ID, message us, then enter the "
                    + "key here.");
            btnActivate.setText("ACTIVATE LICENSE KEY");
        }
    }

    // ------------------------------------------------------------------
    // helpers
    // ------------------------------------------------------------------
    /**
     * Parses the panel's ISO-8601 timestamp (e.g. 2026-05-01T12:00:00.000Z or
     * 2026-05-01T12:00:00+00:00) into epoch milliseconds. Works on every
     * Android version because it normalises the string before SimpleDateFormat.
     */
    private long parseIsoToMillis(String iso) {
        if (iso == null || iso.isEmpty()) return 0L;
        try {
            String s = iso;
            int dot = s.indexOf('.');
            if (dot > 0) s = s.substring(0, dot);           // drop millis
            if (s.endsWith("Z")) {
                s = s.substring(0, s.length() - 1) + "+0000";
            } else if (s.length() > 5 && s.charAt(s.length() - 5) == ':') {
                // +00:00  ->  +0000
                s = s.substring(0, s.length() - 5)
                        + s.substring(s.length() - 2);
            }
            return new java.text.SimpleDateFormat(
                    "yyyy-MM-dd'T'HH:mm:ssZ", java.util.Locale.US)
                    .parse(s).getTime();
        } catch (Exception e) {
            return 0L;
        }
    }

    private String formatDate(long millis) {
        return new java.text.SimpleDateFormat("dd MMM yyyy, HH:mm",
                java.util.Locale.getDefault())
                .format(new java.util.Date(millis));
    }

    private void toast(String msg) {
        Toast.makeText(this, msg, Toast.LENGTH_LONG).show();
    }

    private int dp(float v) {
        return (int) (v * getResources().getDisplayMetrics().density + 0.5f);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        io.shutdown();
    }
}
`;

export const ANDROID_MANIFEST_SNIPPET = String.raw`<!-- AndroidManifest.xml -->
<uses-permission android:name="android.permission.INTERNET" />

<activity
    android:name=".MainActivity"
    android:exported="true"
    android:windowSoftInputMode="adjustResize">
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
</activity>`;
