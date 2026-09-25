import { AndroidFile } from '../types';

export const ANDROID_PROJECT_FILES: AndroidFile[] = [
  {
    path: 'app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    language: 'xml',
    description: 'Android App Permissions for Camera, Mic, and Storage with hardware acceleration',
    descriptionHi: 'कैमरा, माइक्रोफोन, और वीडियो स्टोरेज परमिशन एवं हार्डवेयर एक्सेलेरेशन कॉन्फिगरेशन',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="com.teleprompter.camera">

    <!-- Camera & Audio Permissions -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    
    <!-- Storage Permissions for Saving Clean Video to Device Gallery -->
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" 
        android:maxSdkVersion="28" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" 
        android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />

    <!-- Hardware Feature Declaration -->
    <uses-feature
        android:name="android.hardware.camera"
        android:required="true" />
    <uses-feature
        android:name="android.hardware.camera.autofocus"
        android:required="false" />

    <application
        android:allowBackup="true"
        android:hardwareAccelerated="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.TeleprompterCamera"
        tools:targetApi="34">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize"
            android:screenOrientation="fullSensor">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

    </application>

</manifest>`
  },
  {
    path: 'app/src/main/res/layout/activity_main.xml',
    name: 'activity_main.xml',
    language: 'xml',
    description: 'Full-screen CameraX PreviewView with completely transparent scrolling Teleprompter overlay and HUD controls',
    descriptionHi: 'फुल-स्क्रीन लाइव कैमरा व्यू और बिना बैकग्राउंड वाला पारदर्शी टेलीप्रॉम्प्टर ओवरले लेआउट',
    content: `<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout 
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@android:color/black"
    android:keepScreenOn="true">

    <!-- 1. FULL-SCREEN ORIGINAL QUALITY CAMERAX PREVIEW -->
    <androidx.camera.view.PreviewView
        android:id="@+id/viewFinder"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        app:scaleType="fillCenter"
        app:layout_constraintTop_toTopOf="parent"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toEndOf="parent" />

    <!-- 2. EYE-CONTACT GUIDE LINE (Subtle indicator near camera lens) -->
    <View
        android:id="@+id/eyeContactGuide"
        android:layout_width="200dp"
        android:layout_height="2dp"
        android:layout_marginTop="90dp"
        android:background="#66FFFFFF"
        app:layout_constraintTop_toTopOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toEndOf="parent" />

    <!-- 3. TRANSPARENT TELEPROMPTER SCROLL CONTAINER (Zero background box, crystal-clear text) -->
    <androidx.core.widget.NestedScrollView
        android:id="@+id/prompterScrollView"
        android:layout_width="0dp"
        android:layout_height="0dp"
        android:background="@android:color/transparent"
        android:overScrollMode="never"
        android:scrollbars="none"
        android:fillViewport="true"
        android:paddingStart="24dp"
        android:paddingEnd="24dp"
        app:layout_constraintWidth_percent="0.9"
        app:layout_constraintTop_toBottomOf="@id/topHeaderBar"
        app:layout_constraintBottom_toTopOf="@id/bottomControlsCard"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toEndOf="parent">

        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="vertical"
            android:background="@android:color/transparent">

            <!-- Top spacer so first line starts aligned with camera level -->
            <Space
                android:layout_width="match_parent"
                android:layout_height="120dp" />

            <!-- Script Text: Pure transparent background, high-contrast readable text shadow -->
            <TextView
                android:id="@+id/tvPrompterScript"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:background="@android:color/transparent"
                android:textColor="#FFFFFF"
                android:textSize="26sp"
                android:lineSpacingMultiplier="1.5"
                android:gravity="center_horizontal"
                android:shadowColor="#000000"
                android:shadowDx="0"
                android:shadowDy="2"
                android:shadowRadius="8"
                android:text="यहाँ आपकी स्क्रिप्ट दिखेगी... जब आप रिकॉर्डिंग शुरू करेंगे, यह टेक्स्ट धीरे-धीरे ऊपर स्क्रॉल होगा।" />

            <!-- Bottom spacer allowing full script to scroll off top -->
            <Space
                android:layout_width="match_parent"
                android:layout_height="400dp" />

        </LinearLayout>
    </androidx.core.widget.NestedScrollView>

    <!-- 4. TOP HUD BAR: Timer, Switch Camera, Settings -->
    <LinearLayout
        android:id="@+id/topHeaderBar"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:gravity="center_vertical"
        android:padding="16dp"
        android:background="#33000000"
        app:layout_constraintTop_toTopOf="parent">

        <!-- Recording Indicator & Duration Timer -->
        <LinearLayout
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:orientation="horizontal"
            android:gravity="center_vertical">

            <View
                android:id="@+id/recDot"
                android:layout_width="12dp"
                android:layout_height="12dp"
                android:background="@drawable/shape_recording_dot"
                android:visibility="gone"
                android:layout_marginEnd="8dp" />

            <TextView
                android:id="@+id/tvTimer"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="00:00"
                android:textColor="#FFFFFF"
                android:textSize="16sp"
                android:textStyle="bold"
                android:fontFamily="monospace" />
        </LinearLayout>

        <View
            android:layout_width="0dp"
            android:layout_height="1dp"
            android:layout_weight="1" />

        <!-- Camera Switch (Front/Back) -->
        <ImageButton
            android:id="@+id/btnSwitchCamera"
            android:layout_width="44dp"
            android:layout_height="44dp"
            android:background="?attr/selectableItemBackgroundBorderless"
            android:src="@drawable/ic_flip_camera"
            android:contentDescription="Switch Camera"
            app:tint="#FFFFFF"
            android:layout_marginEnd="8dp" />

        <!-- Edit Script Button -->
        <ImageButton
            android:id="@+id/btnEditScript"
            android:layout_width="44dp"
            android:layout_height="44dp"
            android:background="?attr/selectableItemBackgroundBorderless"
            android:src="@drawable/ic_edit_note"
            android:contentDescription="Edit Script"
            app:tint="#FFFFFF" />
    </LinearLayout>

    <!-- 5. ZOOM & SPEED HUD SLIDERS (Vertical / Floating) -->
    <LinearLayout
        android:id="@+id/sideControlsLayout"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:gravity="center"
        android:padding="8dp"
        android:layout_marginEnd="12dp"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintTop_toTopOf="parent"
        app:layout_constraintBottom_toBottomOf="parent">

        <TextView
            android:id="@+id/tvZoomLevel"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="1.0x"
            android:textColor="#FFFFFF"
            android:textSize="12sp"
            android:textStyle="bold"
            android:background="#55000000"
            android:padding="4dp"
            android:layout_marginBottom="4dp" />

        <Button
            android:id="@+id/btnZoomQuick"
            android:layout_width="44dp"
            android:layout_height="44dp"
            android:text="2x"
            android:textSize="12sp"
            android:textColor="#FFFFFF"
            android:background="@drawable/shape_circle_btn"
            android:layout_marginBottom="8dp" />

        <Button
            android:id="@+id/btnResetScroll"
            android:layout_width="44dp"
            android:layout_height="44dp"
            android:text="TOP"
            android:textSize="10sp"
            android:textColor="#FFFFFF"
            android:background="@drawable/shape_circle_btn" />
    </LinearLayout>

    <!-- 6. BOTTOM CONTROL PANEL: Record, Pause/Resume, Speed Slider -->
    <com.google.android.material.card.MaterialCardView
        android:id="@+id/bottomControlsCard"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        app:cardBackgroundColor="#CC111827"
        app:cardCornerRadius="24dp"
        app:cardElevation="8dp"
        android:layout_margin="16dp"
        app:layout_constraintBottom_toBottomOf="parent">

        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="vertical"
            android:padding="16dp">

            <!-- Speed Controller Slider -->
            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="horizontal"
                android:gravity="center_vertical">

                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="गति (Speed):"
                    android:textColor="#D1D5DB"
                    android:textSize="12sp" />

                <com.google.android.material.slider.Slider
                    android:id="@+id/speedSlider"
                    android:layout_width="0dp"
                    android:layout_height="wrap_content"
                    android:layout_weight="1"
                    android:valueFrom="1.0"
                    android:valueTo="10.0"
                    android:value="4.0"
                    android:stepSize="0.5" />

                <TextView
                    android:id="@+id/tvSpeedValue"
                    android:layout_width="42dp"
                    android:layout_height="wrap_content"
                    android:text="4.0x"
                    android:textColor="#FFFFFF"
                    android:textSize="12sp"
                    android:gravity="end" />
            </LinearLayout>

            <!-- Action Buttons: Pause, Main Record, Stop -->
            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="horizontal"
                android:gravity="center"
                android:layout_marginTop="8dp">

                <!-- Pause / Resume Button -->
                <com.google.android.material.floatingactionbutton.FloatingActionButton
                    android:id="@+id/btnPauseResume"
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:layout_marginEnd="24dp"
                    android:visibility="gone"
                    app:backgroundTint="#F59E0B"
                    app:tint="#FFFFFF"
                    app:srcCompat="@drawable/ic_pause"
                    app:fabSize="mini"
                    android:contentDescription="Pause or Resume Recording" />

                <!-- Main Record / Stop Button -->
                <com.google.android.material.floatingactionbutton.FloatingActionButton
                    android:id="@+id/btnRecord"
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    app:backgroundTint="#EF4444"
                    app:tint="#FFFFFF"
                    app:srcCompat="@drawable/ic_videocam"
                    app:fabSize="normal"
                    android:contentDescription="Start or Stop Recording" />

                <!-- Rehearse / Preview Scroll Button -->
                <com.google.android.material.floatingactionbutton.FloatingActionButton
                    android:id="@+id/btnRehearse"
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:layout_marginStart="24dp"
                    app:backgroundTint="#374151"
                    app:tint="#FFFFFF"
                    app:srcCompat="@drawable/ic_play_arrow"
                    app:fabSize="mini"
                    android:contentDescription="Rehearse Script without Recording" />

            </LinearLayout>

        </LinearLayout>
    </com.google.android.material.card.MaterialCardView>

</androidx.constraintlayout.widget.ConstraintLayout>`
  },
  {
    path: 'app/src/main/java/com/teleprompter/camera/MainActivity.kt',
    name: 'MainActivity.kt',
    language: 'kotlin',
    description: 'Core logic: CameraX VideoCapture, Zoom controls, Recording Pause/Resume, Auto-scroll sync, and Clean Gallery Save',
    descriptionHi: 'कैमराएक्स वीडियो रिकॉर्डिंग, ज़ूम, पॉज़/रिज़्यूम, ऑटो-स्क्रॉलिंग और गैलरी में सेव करने का मुख्य कोड',
    content: `package com.teleprompter.camera

import android.Manifest
import android.animation.ValueAnimator
import android.content.ContentValues
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.SystemClock
import android.provider.MediaStore
import android.view.ScaleGestureDetector
import android.view.View
import android.view.animation.LinearInterpolator
import android.widget.Chronometer
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.Camera
import androidx.camera.core.CameraControl
import androidx.camera.core.CameraInfo
import androidx.camera.core.CameraSelector
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.video.MediaStoreOutputOptions
import androidx.camera.video.Quality
import androidx.camera.video.QualitySelector
import androidx.camera.video.Recorder
import androidx.camera.video.Recording
import androidx.camera.video.VideoCapture
import androidx.camera.video.VideoRecordEvent
import androidx.core.content.ContextCompat
import com.teleprompter.camera.databinding.ActivityMainBinding
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var cameraExecutor: ExecutorService

    // CameraX variables
    private var camera: Camera? = null
    private var videoCapture: VideoCapture<Recorder>? = null
    private var currentRecording: Recording? = null
    private var cameraSelector = CameraSelector.DEFAULT_FRONT_CAMERA

    // Teleprompter Auto-scroll Animator
    private var scrollAnimator: ValueAnimator? = null
    private var scrollSpeedPixelsPerSecond = 50f
    private var isRecording = false
    private var isPaused = false

    // Zoom Pinch detector
    private lateinit var scaleGestureDetector: ScaleGestureDetector

    // Permissions Request Launcher
    private val activityResultLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        var permissionGranted = true
        permissions.entries.forEach {
            if (it.key in REQUIRED_PERMISSIONS && !it.value) {
                permissionGranted = false
            }
        }
        if (!permissionGranted) {
            Toast.makeText(this, "कैमरा और ऑडियो अनुमति आवश्यक है।", Toast.LENGTH_SHORT).show()
        } else {
            startCamera()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        cameraExecutor = Executors.newSingleThreadExecutor()

        if (allPermissionsGranted()) {
            startCamera()
        } else {
            requestPermissions()
        }

        setupUIControls()
        setupZoomGestures()
    }

    private fun setupUIControls() {
        // Record / Stop Button
        binding.btnRecord.setOnClickListener {
            if (isRecording) {
                stopRecording()
            } else {
                startRecording()
            }
        }

        // Pause / Resume Button
        binding.btnPauseResume.setOnClickListener {
            togglePauseResume()
        }

        // Switch Camera (Front <-> Back)
        binding.btnSwitchCamera.setOnClickListener {
            cameraSelector = if (cameraSelector == CameraSelector.DEFAULT_FRONT_CAMERA) {
                CameraSelector.DEFAULT_BACK_CAMERA
            } else {
                CameraSelector.DEFAULT_FRONT_CAMERA
            }
            startCamera()
        }

        // Speed Slider (1x to 10x)
        binding.speedSlider.addOnChangeListener { _, value, _ ->
            scrollSpeedPixelsPerSecond = value * 20f
            binding.tvSpeedValue.text = String.format(Locale.US, "%.1fx", value)
            if (isRecording && !isPaused) {
                updateScrollAnimator()
            }
        }

        // Quick 2x Zoom button
        binding.btnZoomQuick.setOnClickListener {
            val currentZoom = camera?.cameraInfo?.zoomState?.value?.zoomRatio ?: 1.0f
            val targetZoom = if (currentZoom > 1.8f) 1.0f else 2.0f
            camera?.cameraControl?.setZoomRatio(targetZoom)
            binding.tvZoomLevel.text = String.format(Locale.US, "%.1fx", targetZoom)
            binding.btnZoomQuick.text = if (targetZoom > 1.5f) "1x" else "2x"
        }

        // Reset Scroll to Top
        binding.btnResetScroll.setOnClickListener {
            stopScrollAnimator()
            binding.prompterScrollView.smoothScrollTo(0, 0)
        }

        // Rehearsal Mode (Scroll without recording)
        binding.btnRehearse.setOnClickListener {
            if (scrollAnimator != null && scrollAnimator!!.isRunning) {
                pauseScrollAnimator()
                binding.btnRehearse.setImageResource(R.drawable.ic_play_arrow)
            } else {
                startScrollAnimator()
                binding.btnRehearse.setImageResource(R.drawable.ic_pause)
            }
        }

        // Edit Script Dialog
        binding.btnEditScript.setOnClickListener {
            showEditScriptDialog()
        }
    }

    private fun setupZoomGestures() {
        scaleGestureDetector = ScaleGestureDetector(this, object : ScaleGestureDetector.SimpleOnScaleGestureListener() {
            override fun onScale(detector: ScaleGestureDetector): Boolean {
                val cameraControl = camera?.cameraControl ?: return false
                val zoomState = camera?.cameraInfo?.zoomState?.value ?: return false
                val currentRatio = zoomState.zoomRatio
                val delta = detector.scaleFactor
                val targetRatio = (currentRatio * delta).coerceIn(zoomState.minZoomRatio, zoomState.maxZoomRatio)
                cameraControl.setZoomRatio(targetRatio)
                binding.tvZoomLevel.text = String.format(Locale.US, "%.1fx", targetRatio)
                return true
            }
        })

        binding.viewFinder.setOnTouchListener { _, event ->
            scaleGestureDetector.onTouchEvent(event)
            true
        }
    }

    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        cameraProviderFuture.addListener({
            val cameraProvider: ProcessCameraProvider = cameraProviderFuture.get()

            val preview = Preview.Builder().build().also {
                it.setSurfaceProvider(binding.viewFinder.surfaceProvider)
            }

            // High Quality Video Recorder (Clean raw feed without prompter overlay)
            val recorder = Recorder.Builder()
                .setQualitySelector(QualitySelector.from(Quality.HIGHEST))
                .build()
            videoCapture = VideoCapture.withOutput(recorder)

            try {
                cameraProvider.unbindAll()
                camera = cameraProvider.bindToLifecycle(
                    this,
                    cameraSelector,
                    preview,
                    videoCapture
                )
            } catch (exc: Exception) {
                Toast.makeText(this, "कैमरा लोड करने में त्रुटि: \${exc.message}", Toast.LENGTH_SHORT).show()
            }
        }, ContextCompat.getMainExecutor(this))
    }

    private fun startRecording() {
        val videoCapture = this.videoCapture ?: return

        // Setup Output to MediaStore (Local Gallery without watermark)
        val name = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(System.currentTimeMillis())
        val contentValues = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, "Teleprompter_$name.mp4")
            put(MediaStore.MediaColumns.MIME_TYPE, "video/mp4")
            if (Build.VERSION.SDK_INT > Build.VERSION_CODES.P) {
                put(MediaStore.Video.Media.RELATIVE_PATH, "Movies/TeleprompterCamera")
            }
        }

        val mediaStoreOutputOptions = MediaStoreOutputOptions
            .Builder(contentResolver, MediaStore.Video.Media.EXTERNAL_CONTENT_URI)
            .setContentValues(contentValues)
            .build()

        currentRecording = videoCapture.output
            .prepareRecording(this, mediaStoreOutputOptions)
            .apply {
                if (ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                    withAudioEnabled()
                }
            }
            .start(ContextCompat.getMainExecutor(this)) { recordEvent ->
                when (recordEvent) {
                    is VideoRecordEvent.Start -> {
                        isRecording = true
                        isPaused = false
                        binding.recDot.visibility = View.VISIBLE
                        binding.btnPauseResume.visibility = View.VISIBLE
                        binding.btnPauseResume.setImageResource(R.drawable.ic_pause)
                        binding.btnRecord.setImageResource(R.drawable.ic_stop)
                        startScrollAnimator()
                    }
                    is VideoRecordEvent.Pause -> {
                        isPaused = true
                        pauseScrollAnimator()
                        binding.btnPauseResume.setImageResource(R.drawable.ic_play_arrow)
                    }
                    is VideoRecordEvent.Resume -> {
                        isPaused = false
                        resumeScrollAnimator()
                        binding.btnPauseResume.setImageResource(R.drawable.ic_pause)
                    }
                    is VideoRecordEvent.Finalize -> {
                        isRecording = false
                        isPaused = false
                        binding.recDot.visibility = View.GONE
                        binding.btnPauseResume.visibility = View.GONE
                        binding.btnRecord.setImageResource(R.drawable.ic_videocam)
                        stopScrollAnimator()

                        if (!recordEvent.hasError()) {
                            val msg = "वीडियो बिना वाटरमार्क के गैलरी में सेव हो गया!\\nस्थान: \${recordEvent.outputResults.outputUri}"
                            Toast.makeText(baseContext, msg, Toast.LENGTH_LONG).show()
                        } else {
                            currentRecording?.close()
                            currentRecording = null
                            Toast.makeText(baseContext, "रिकॉर्डिंग में त्रुटि: \${recordEvent.error}", Toast.LENGTH_SHORT).show()
                        }
                    }
                }
            }
    }

    private fun togglePauseResume() {
        val recording = currentRecording ?: return
        if (isPaused) {
            recording.resume()
        } else {
            recording.pause()
        }
    }

    private fun stopRecording() {
        currentRecording?.stop()
        currentRecording = null
    }

    // TELEPROMPTER SMOOTH SCROLL ENGINE
    private fun startScrollAnimator() {
        val totalScrollDistance = binding.tvPrompterScript.height
        val currentScrollY = binding.prompterScrollView.scrollY
        val remainingDistance = totalScrollDistance - currentScrollY
        if (remainingDistance <= 0) return

        val durationMs = ((remainingDistance / scrollSpeedPixelsPerSecond) * 1000).toLong()

        scrollAnimator?.cancel()
        scrollAnimator = ValueAnimator.ofInt(currentScrollY, totalScrollDistance).apply {
            duration = durationMs
            interpolator = LinearInterpolator()
            addUpdateListener { animator ->
                val value = animator.animatedValue as Int
                binding.prompterScrollView.scrollTo(0, value)
            }
            start()
        }
    }

    private fun pauseScrollAnimator() {
        scrollAnimator?.pause()
    }

    private fun resumeScrollAnimator() {
        scrollAnimator?.resume()
    }

    private fun stopScrollAnimator() {
        scrollAnimator?.cancel()
        scrollAnimator = null
    }

    private fun updateScrollAnimator() {
        if (scrollAnimator != null && scrollAnimator!!.isRunning) {
            val currentScrollY = binding.prompterScrollView.scrollY
            startScrollAnimator()
        }
    }

    private fun showEditScriptDialog() {
        val editText = android.widget.EditText(this).apply {
            setText(binding.tvPrompterScript.text)
            setLines(8)
            gravity = android.view.Gravity.TOP or android.view.Gravity.START
        }

        AlertDialog.Builder(this)
            .setTitle("स्क्रिप्ट इनपुट करें (Edit Script)")
            .setView(editText)
            .setPositiveButton("सेव करें") { _, _ ->
                val newText = editText.text.toString().trim()
                if (newText.isNotEmpty()) {
                    binding.tvPrompterScript.text = newText
                    binding.prompterScrollView.scrollTo(0, 0)
                }
            }
            .setNegativeButton("रद्द करें", null)
            .show()
    }

    private fun allPermissionsGranted() = REQUIRED_PERMISSIONS.all {
        ContextCompat.checkSelfPermission(baseContext, it) == PackageManager.PERMISSION_GRANTED
    }

    private fun requestPermissions() {
        activityResultLauncher.launch(REQUIRED_PERMISSIONS)
    }

    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
        scrollAnimator?.cancel()
    }

    companion object {
        private val REQUIRED_PERMISSIONS = mutableListOf(
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO
        ).apply {
            if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P) {
                add(Manifest.permission.WRITE_EXTERNAL_STORAGE)
            }
        }.toTypedArray()
    }
}`
  },
  {
    path: 'app/build.gradle.kts',
    name: 'app/build.gradle.kts',
    language: 'groovy',
    description: 'App Module Gradle build script with CameraX 1.4, Material3, and ViewBinding',
    descriptionHi: 'ऐप मॉड्यूल ग्रैडल स्क्रिप्ट जिसमें कैमराएक्स 1.4 और मटेरियल 3 लाइब्रेरी शामिल हैं',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.teleprompter.camera"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.teleprompter.camera"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")

    // CameraX Core, Camera2, Lifecycle and Video Recording
    val cameraxVersion = "1.3.2"
    implementation("androidx.camera:camera-core:\${cameraxVersion}")
    implementation("androidx.camera:camera-camera2:\${cameraxVersion}")
    implementation("androidx.camera:camera-lifecycle:\${cameraxVersion}")
    implementation("androidx.camera:camera-video:\${cameraxVersion}")
    implementation("androidx.camera:camera-view:\${cameraxVersion}")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
}`
  },
  {
    path: 'build.gradle.kts',
    name: 'build.gradle.kts',
    language: 'groovy',
    description: 'Root Gradle configuration file',
    descriptionHi: 'रूट प्रोजेक्ट ग्रैडल कॉन्फ़िगरेशन फाइल',
    content: `// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
}`
  },
  {
    path: 'settings.gradle.kts',
    name: 'settings.gradle.kts',
    language: 'groovy',
    description: 'Gradle plugin repository settings and module tree',
    descriptionHi: 'प्रोजेक्ट प्लगइन रिपॉजिटरी सेटिंग्स',
    content: `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "TeleprompterCamera"
include(":app")`
  },
  {
    path: '.github/workflows/android-build.yml',
    name: 'android-build.yml (GitHub Actions)',
    language: 'yaml',
    description: 'Automated GitHub Actions CI/CD to build debug APK directly from your GitHub repository',
    descriptionHi: 'गिटहब एक्शन्स वर्कफ़्लो - इसके ज़रिए बिना एंड्रॉइड स्टूडियो इनस्टॉल किए सीधे गिटहब से APK बिल्ड करें',
    content: `name: Build Android Teleprompter APK

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]
  workflow_dispatch:

jobs:
  build:
    name: Build Debug APK
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: gradle

      - name: Grant Execute Permission to Gradlew
        run: chmod +x gradlew

      - name: Build Debug APK with Gradle
        run: ./gradlew assembleDebug --stacktrace

      - name: Upload APK as Workflow Artifact
        uses: actions/upload-artifact@v4
        with:
          name: Teleprompter-Camera-Debug-APK
          path: app/build/outputs/apk/debug/app-debug.apk
          retention-days: 14`
  },
  {
    path: 'app/src/main/res/values/strings.xml',
    name: 'strings.xml',
    language: 'xml',
    description: 'String resources for Hindi and English display',
    descriptionHi: 'स्ट्रिंग रिसोर्सेस (हिंदी एवं अंग्रेजी)',
    content: `<resources>
    <string name="app_name">Teleprompter Camera</string>
    <string name="start_recording">रिकॉर्डिंग शुरू करें</string>
    <string name="stop_recording">रोकें व सेव करें</string>
    <string name="pause">पॉज़ करें</string>
    <string name="resume">जारी रखें</string>
    <string name="speed">स्क्रॉल गति</string>
    <string name="edit_script">स्क्रिप्ट बदलें</string>
    <string name="saved_success">वीडियो सफलतापूर्वक सुरक्षित हो गया!</string>
</resources>`
  },
  {
    path: 'README.md',
    name: 'README.md (बिल्ड गाइड / Instructions)',
    language: 'markdown',
    description: 'Step-by-step instructions to compile APK via GitHub Actions or Android Studio',
    descriptionHi: 'GitHub Actions या Android Studio में APK बनाने की पूरी चरणबद्ध गाइड',
    content: `# Teleprompter Camera Android App

कस्टम टेलीप्रॉम्प्टर सह कैमरा एंड्रॉइड ऐप (Kotlin + CameraX + GitHub Actions)।

## मुख्य विशेषताएँ (Key Features)
1. **ओरिजिनल क्वालिटी कैमरा व्यू**: फुल-स्क्रीन लाइव कैमरा व्यू, 1.0x से 5.0x ज़ूम।
2. **पारदर्शी टेलीप्रॉम्प्टर (Zero Background Box)**: वीडियो के ऊपर केवल साफ़ टेक्स्ट तैरता है।
3. **सिंक्रनाइज़्ड ऑटो-स्क्रॉल**: रिकॉर्ड शुरू होने पर टेक्स्ट स्वतः स्क्रॉल होता है; पॉज़ होने पर रुक जाता है।
4. **क्लीन वीडियो सेव (No Watermark, No Text)**: अंतिम वीडियो फाइल में टेलीप्रॉम्प्टर का टेक्स्ट हाइड हो जाता है—केवल यूजर की शुद्ध वीडियो सेव होती है।

---

## विकल्प 1: GitHub Actions से सीधे APK बनाएँ (बिना Android Studio के)
1. GitHub पर एक नया रिपॉजिटरी बनाएँ।
2. इस प्रोजेक्ट की सभी फाइलों को रिपॉजिटरी में पुश (Push) करें।
3. GitHub रिपॉजिटरी के **Actions** टैब में जाएँ।
4. "Build Android Teleprompter APK" वर्कफ़्लो अपने आप चलना शुरू हो जाएगा।
5. 2-3 मिनट में बिल्ड पूरा होने के बाद **Artifacts** सेक्शन से सीधे \`Teleprompter-Camera-Debug-APK\` डाउनलोड कर अपने फोन में इनस्टॉल करें!

---

## विकल्प 2: Android Studio में बिल्ड करें
1. Android Studio Hedgehog (या नया) खोलें।
2. **File > Open** पर क्लिक करें और इस फोल्डर को सेलेक्ट करें।
3. Gradle Sync पूरा होने दें।
4. अपना Android फोन USB से कनेक्ट करें (USB Debugging चालू रखें)।
5. **Run > Run 'app'** (हरा प्ले बटन) दबाएँ। ऐप सीधे आपके फोन में इनस्टॉल हो जाएगी!`
  }
];
