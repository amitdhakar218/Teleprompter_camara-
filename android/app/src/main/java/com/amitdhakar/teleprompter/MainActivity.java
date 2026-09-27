package com.amitdhakar.teleprompter;

import android.content.ContentValues;
import android.content.Intent;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.core.content.FileProvider;
import com.getcapacitor.BridgeActivity;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            WebView webView = this.bridge.getWebView();
            if (webView != null) {
                webView.addJavascriptInterface(new AndroidNativeBridge(), "AndroidBridge");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public class AndroidNativeBridge {

        @JavascriptInterface
        public boolean isAndroidApp() {
            return true;
        }

        @JavascriptInterface
        public String saveVideoToStorage(String base64Data, String filename, String mimeType) {
            try {
                if (base64Data == null || base64Data.isEmpty()) {
                    return "ERROR: Empty data";
                }

                // Strip data url prefix if present (e.g. "data:video/...;base64,")
                if (base64Data.contains(",")) {
                    base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
                }

                byte[] videoBytes = Base64.decode(base64Data, Base64.DEFAULT);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentValues values = new ContentValues();
                    values.put(MediaStore.Video.Media.DISPLAY_NAME, filename);
                    values.put(MediaStore.Video.Media.MIME_TYPE, mimeType);
                    values.put(MediaStore.Video.Media.RELATIVE_PATH, Environment.DIRECTORY_MOVIES + "/Teleprompter");
                    values.put(MediaStore.Video.Media.IS_PENDING, 1);

                    Uri collection = MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
                    Uri itemUri = getContentResolver().insert(collection, values);

                    if (itemUri != null) {
                        try (OutputStream out = getContentResolver().openOutputStream(itemUri)) {
                            if (out != null) {
                                out.write(videoBytes);
                                out.flush();
                            }
                        }
                        values.clear();
                        values.put(MediaStore.Video.Media.IS_PENDING, 0);
                        getContentResolver().update(itemUri, values, null, null);

                        runOnUiThread(() -> Toast.makeText(MainActivity.this, "✓ वीडियो फ़ोन की Gallery / Movies में सेव हो गई!", Toast.LENGTH_LONG).show());
                        return "SUCCESS: " + itemUri.toString();
                    }
                } else {
                    File moviesDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MOVIES);
                    File appDir = new File(moviesDir, "Teleprompter");
                    if (!appDir.exists()) {
                        appDir.mkdirs();
                    }
                    File videoFile = new File(appDir, filename);
                    try (FileOutputStream fos = new FileOutputStream(videoFile)) {
                        fos.write(videoBytes);
                        fos.flush();
                    }
                    MediaScannerConnection.scanFile(MainActivity.this, new String[]{videoFile.getAbsolutePath()}, new String[]{mimeType}, null);
                    runOnUiThread(() -> Toast.makeText(MainActivity.this, "✓ वीडियो फ़ोन की Gallery में सेव हो गई!", Toast.LENGTH_LONG).show());
                    return "SUCCESS: " + videoFile.getAbsolutePath();
                }
            } catch (Exception e) {
                e.printStackTrace();
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "सेव करने में त्रुटि: " + e.getMessage(), Toast.LENGTH_SHORT).show());
                return "ERROR: " + e.getMessage();
            }
            return "ERROR: Unknown";
        }

        @JavascriptInterface
        public String shareVideo(String base64Data, String filename, String mimeType) {
            try {
                if (base64Data.contains(",")) {
                    base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
                }
                byte[] videoBytes = Base64.decode(base64Data, Base64.DEFAULT);

                File cachePath = new File(getCacheDir(), "shared_videos");
                if (!cachePath.exists()) cachePath.mkdirs();
                File newFile = new File(cachePath, filename);
                try (FileOutputStream stream = new FileOutputStream(newFile)) {
                    stream.write(videoBytes);
                    stream.flush();
                }

                Uri contentUri = FileProvider.getUriForFile(MainActivity.this, getPackageName() + ".fileprovider", newFile);

                Intent shareIntent = new Intent(Intent.ACTION_SEND);
                shareIntent.setType(mimeType);
                shareIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
                shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

                Intent chooser = Intent.createChooser(shareIntent, "वीडियो शेयर करें");
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(chooser);

                return "SUCCESS";
            } catch (Exception e) {
                e.printStackTrace();
                return "ERROR: " + e.getMessage();
            }
        }
    }
}
