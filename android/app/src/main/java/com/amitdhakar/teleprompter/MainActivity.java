package com.amitdhakar.teleprompter;

import android.Manifest;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import com.getcapacitor.BridgeActivity;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {

    private static final int PERMISSION_REQ_CODE = 1001;
    private OutputStream activeChunkOutputStream = null;
    private Uri activeMediaStoreUri = null;
    private ContentValues activeContentValues = null;
    private File activeLegacyFile = null;
    private String activeMimeType = "video/mp4";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Check and request runtime permissions on startup
        checkAndRequestAppPermissions();

        try {
            WebView webView = this.bridge.getWebView();
            if (webView != null) {
                // Register Javascript Interface
                webView.addJavascriptInterface(new AndroidNativeBridge(), "AndroidBridge");

                // Ensure WebChromeClient automatically grants WebRTC camera and mic permissions
                webView.setWebChromeClient(new WebChromeClient() {
                    @Override
                    public void onPermissionRequest(final PermissionRequest request) {
                        runOnUiThread(() -> {
                            try {
                                request.grant(request.getResources());
                            } catch (Exception e) {
                                e.printStackTrace();
                            }
                        });
                    }
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void checkAndRequestAppPermissions() {
        List<String> permissionsNeeded = new ArrayList<>();

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            permissionsNeeded.add(Manifest.permission.CAMERA);
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            permissionsNeeded.add(Manifest.permission.RECORD_AUDIO);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            // Android 13+
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_VIDEO) != PackageManager.PERMISSION_GRANTED) {
                permissionsNeeded.add(Manifest.permission.READ_MEDIA_VIDEO);
            }
        } else if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P) {
            // Android 9 and below
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                permissionsNeeded.add(Manifest.permission.WRITE_EXTERNAL_STORAGE);
            }
        }

        if (!permissionsNeeded.isEmpty()) {
            ActivityCompat.requestPermissions(this, permissionsNeeded.toArray(new String[0]), PERMISSION_REQ_CODE);
        }
    }

    public class AndroidNativeBridge {

        @JavascriptInterface
        public boolean isAndroidApp() {
            return true;
        }

        /**
         * Initialize chunked video saving to eliminate string parameter buffer limits on long videos
         */
        @JavascriptInterface
        public String initSaveVideo(String filename, String mimeType) {
            try {
                activeMimeType = (mimeType != null && mimeType.contains("mp4")) ? "video/mp4" : mimeType;
                if (activeMimeType == null || activeMimeType.isEmpty()) {
                    activeMimeType = "video/mp4";
                }

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    // Android 10+ (API 29 to 35): Scoped Storage MediaStore
                    activeContentValues = new ContentValues();
                    activeContentValues.put(MediaStore.Video.Media.DISPLAY_NAME, filename);
                    activeContentValues.put(MediaStore.Video.Media.MIME_TYPE, activeMimeType);
                    activeContentValues.put(MediaStore.Video.Media.RELATIVE_PATH, Environment.DIRECTORY_MOVIES + "/Teleprompter");
                    activeContentValues.put(MediaStore.Video.Media.IS_PENDING, 1);

                    Uri collection = MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
                    activeMediaStoreUri = getContentResolver().insert(collection, activeContentValues);

                    if (activeMediaStoreUri != null) {
                        activeChunkOutputStream = getContentResolver().openOutputStream(activeMediaStoreUri);
                        return "INIT_OK";
                    } else {
                        return "ERROR: Could not insert MediaStore entry";
                    }
                } else {
                    // Android 9 and below: Direct public file storage
                    File moviesDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MOVIES);
                    File appDir = new File(moviesDir, "Teleprompter");
                    if (!appDir.exists()) {
                        appDir.mkdirs();
                    }
                    activeLegacyFile = new File(appDir, filename);
                    activeChunkOutputStream = new FileOutputStream(activeLegacyFile);
                    return "INIT_OK";
                }
            } catch (Exception e) {
                e.printStackTrace();
                cleanupActiveStream();
                return "ERROR: " + e.getMessage();
            }
        }

        /**
         * Append binary chunk (base64 encoded 512KB slice)
         */
        @JavascriptInterface
        public boolean writeVideoChunk(String base64Chunk) {
            try {
                if (activeChunkOutputStream == null || base64Chunk == null) return false;
                byte[] chunkBytes = Base64.decode(base64Chunk, Base64.DEFAULT);
                activeChunkOutputStream.write(chunkBytes);
                return true;
            } catch (Exception e) {
                e.printStackTrace();
                return false;
            }
        }

        /**
         * Finalize video save, flush streams, register in MediaStore / Gallery
         */
        @JavascriptInterface
        public String finishSaveVideo() {
            try {
                if (activeChunkOutputStream != null) {
                    activeChunkOutputStream.flush();
                    activeChunkOutputStream.close();
                    activeChunkOutputStream = null;
                }

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && activeMediaStoreUri != null && activeContentValues != null) {
                    activeContentValues.clear();
                    activeContentValues.put(MediaStore.Video.Media.IS_PENDING, 0);
                    getContentResolver().update(activeMediaStoreUri, activeContentValues, null, null);

                    final String uriString = activeMediaStoreUri.toString();
                    runOnUiThread(() -> Toast.makeText(MainActivity.this, "✓ वीडियो फ़ोन की Gallery / Movies में सेव हो गई!", Toast.LENGTH_LONG).show());
                    activeMediaStoreUri = null;
                    activeContentValues = null;
                    return "SUCCESS: " + uriString;
                } else if (activeLegacyFile != null) {
                    final String filePath = activeLegacyFile.getAbsolutePath();
                    MediaScannerConnection.scanFile(MainActivity.this, new String[]{filePath}, new String[]{activeMimeType}, null);
                    runOnUiThread(() -> Toast.makeText(MainActivity.this, "✓ वीडियो फ़ोन की Gallery में सेव हो गई!", Toast.LENGTH_LONG).show());
                    activeLegacyFile = null;
                    return "SUCCESS: " + filePath;
                }
            } catch (Exception e) {
                e.printStackTrace();
                cleanupActiveStream();
                return "ERROR: " + e.getMessage();
            }
            return "ERROR: Unknown state";
        }

        /**
         * Cancel and cleanup on failure
         */
        @JavascriptInterface
        public void cancelSaveVideo() {
            cleanupActiveStream();
        }

        /**
         * Single-call save fallback for small videos
         */
        @JavascriptInterface
        public String saveVideoToStorage(String base64Data, String filename, String mimeType) {
            String initRes = initSaveVideo(filename, mimeType);
            if (!initRes.equals("INIT_OK")) return initRes;

            if (base64Data.contains(",")) {
                base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
            }
            boolean writeOk = writeVideoChunk(base64Data);
            if (!writeOk) {
                cancelSaveVideo();
                return "ERROR: Write failed";
            }
            return finishSaveVideo();
        }

        /**
         * Native Share Intent with FileProvider
         */
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
                shareIntent.setType(mimeType != null && mimeType.contains("mp4") ? "video/mp4" : mimeType);
                shareIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
                shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

                Intent chooser = Intent.createChooser(shareIntent, "वीडियो शेयर करें");
                chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

                List<ResolveInfo> resInfoList = getPackageManager().queryIntentActivities(chooser, PackageManager.MATCH_DEFAULT_ONLY);
                for (ResolveInfo resolveInfo : resInfoList) {
                    String packageName = resolveInfo.activityInfo.packageName;
                    grantUriPermission(packageName, contentUri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
                }

                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(chooser);

                return "SUCCESS";
            } catch (Exception e) {
                e.printStackTrace();
                return "ERROR: " + e.getMessage();
            }
        }
    }

    private void cleanupActiveStream() {
        try {
            if (activeChunkOutputStream != null) {
                activeChunkOutputStream.close();
                activeChunkOutputStream = null;
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && activeMediaStoreUri != null) {
                getContentResolver().delete(activeMediaStoreUri, null, null);
                activeMediaStoreUri = null;
            }
            if (activeLegacyFile != null && activeLegacyFile.exists()) {
                activeLegacyFile.delete();
                activeLegacyFile = null;
            }
        } catch (Exception ignored) {}
    }
}
