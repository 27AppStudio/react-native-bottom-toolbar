package com.bottomtoolbar

import android.app.Activity
import android.content.Context
import android.content.res.ColorStateList
import android.util.Log
import android.view.ContextThemeWrapper
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.LinearLayout
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.updateLayoutParams
import java.lang.ref.WeakReference
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.react.views.imagehelper.ResourceDrawableIdHelper
import com.google.android.material.button.MaterialButton
import com.google.android.material.floatingactionbutton.FloatingActionButton
import com.google.android.material.floatingtoolbar.FloatingToolbarLayout
import com.google.android.material.R as MaterialR

/**
 * The Android side of the native bottom toolbar: a Material 3 FAB at the bottom end
 * for one button (where iOS puts a lone item), a Material 3 floating toolbar at the
 * bottom center for more. Spacers are iOS-only and skipped. Both float over the
 * activity's content, above the navigation bar, until `hide`.
 */
class BottomToolbarModule(reactContext: ReactApplicationContext) :
  NativeBottomToolbarSpec(reactContext) {

  /** Weak, so a destroyed activity's view is not kept; the next show replaces it. */
  private var shown: WeakReference<View>? = null

  override fun show(items: ReadableArray, options: ReadableMap) {
    val buttons = (0 until items.size())
      .mapNotNull { items.getMap(it) }
      .filter { it.getString("type") == "button" }
    val tint = if (options.hasKey("tintColor")) options.getDouble("tintColor").toInt() else null

    UiThreadUtil.runOnUiThread {
      val activity = reactApplicationContext.currentActivity ?: return@runOnUiThread
      val content = activity.findViewById<ViewGroup>(android.R.id.content)
        ?: return@runOnUiThread
      removeShown(animated = false)
      if (buttons.isEmpty()) {
        return@runOnUiThread
      }
      val context = materialContext(activity)
      val view = if (buttons.size == 1) {
        fab(context, buttons[0], tint)
      } else {
        floatingToolbar(context, buttons, tint).apply {
          alpha = 0f
          translationY = ENTER_OFFSET_DP.dpToPx()
          animate().alpha(1f).translationY(0f).setDuration(ENTER_DURATION).start()
        }
      }
      content.addView(view)
      // The window's insets went out before the view was added: ask for them again, to
      // sit above the navigation bar.
      ViewCompat.requestApplyInsets(view)
      shown = WeakReference(view)
    }
  }

  override fun hide() {
    UiThreadUtil.runOnUiThread { removeShown(animated = true) }
  }

  private fun removeShown(animated: Boolean) {
    val view = shown?.get() ?: return
    shown = null
    val parent = view.parent as? ViewGroup ?: return
    if (!animated) {
      parent.removeView(view)
    } else if (view is FloatingActionButton) {
      view.hide(object : FloatingActionButton.OnVisibilityChangedListener() {
        override fun onHidden(fab: FloatingActionButton) {
          parent.removeView(fab)
        }
      })
    } else {
      view.animate()
        .alpha(0f)
        .translationY(view.height / 2f)
        .setDuration(EXIT_DURATION)
        .withEndAction { parent.removeView(view) }
        .start()
    }
  }

  /** The activity itself under a Material 3 theme, else wrapped in one (AppCompat apps). */
  private fun materialContext(activity: Activity): Context {
    val attributes = activity.obtainStyledAttributes(intArrayOf(MaterialR.attr.isMaterial3Theme))
    val isMaterial3 = attributes.getBoolean(0, false)
    attributes.recycle()
    return if (isMaterial3) {
      activity
    } else {
      ContextThemeWrapper(activity, MaterialR.style.Theme_Material3_DayNight_NoActionBar)
    }
  }

  private fun fab(context: Context, item: ReadableMap, tint: Int?): FloatingActionButton {
    val margin = MARGIN_DP.dpToPx().toInt()
    return FloatingActionButton(context).apply {
      icon(context, item)?.let { setImageResource(it) }
        ?: Log.w(TAG, "No androidIcon drawable for \"${item.getString("id")}\"")
      tint?.let { imageTintList = ColorStateList.valueOf(it) }
      describe(this, item)
      layoutParams = FrameLayout.LayoutParams(
        ViewGroup.LayoutParams.WRAP_CONTENT,
        ViewGroup.LayoutParams.WRAP_CONTENT,
        Gravity.BOTTOM or Gravity.END,
      ).apply { setMargins(margin, margin, margin, margin) }
      // Above the navigation bar, as the floating toolbar places itself.
      ViewCompat.setOnApplyWindowInsetsListener(this) { view, insets ->
        val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
        view.updateLayoutParams<ViewGroup.MarginLayoutParams> {
          bottomMargin = margin + bars.bottom
          marginEnd = margin + bars.right
        }
        insets
      }
      // FloatingActionButton.show() animates only once laid out, so start hidden.
      visibility = View.INVISIBLE
      post { show() }
    }
  }

  private fun floatingToolbar(
    context: Context,
    items: List<ReadableMap>,
    tint: Int?,
  ): FloatingToolbarLayout {
    val inflater = LayoutInflater.from(context)
    val row = LinearLayout(context).apply {
      orientation = LinearLayout.HORIZONTAL
      gravity = Gravity.CENTER_VERTICAL
    }
    for (item in items) {
      val iconRes = icon(context, item)
      val button: MaterialButton
      if (iconRes != null) {
        button = inflater.inflate(R.layout.bottom_toolbar_icon_button, row, false) as MaterialButton
        button.setIconResource(iconRes)
        tint?.let { button.iconTint = ColorStateList.valueOf(it) }
      } else {
        button = inflater.inflate(R.layout.bottom_toolbar_text_button, row, false) as MaterialButton
        button.text = item.getString("title") ?: item.getString("id")
        tint?.let { button.setTextColor(it) }
      }
      describe(button, item)
      row.addView(button)
    }
    return FloatingToolbarLayout(context).apply {
      addView(row)
      layoutParams = FrameLayout.LayoutParams(
        ViewGroup.LayoutParams.WRAP_CONTENT,
        ViewGroup.LayoutParams.WRAP_CONTENT,
        Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL,
      ).apply {
        bottomMargin = MARGIN_DP.dpToPx().toInt()
      }
    }
  }

  private fun describe(view: View, item: ReadableMap) {
    val id = item.getString("id") ?: ""
    view.contentDescription = item.getString("accessibilityLabel")
    view.isEnabled = !(item.hasKey("disabled") && item.getBoolean("disabled"))
    view.setOnClickListener { emitOnItemPress(id) }
  }

  /** The `androidIcon` drawable in the app's resources, or null. */
  private fun icon(context: Context, item: ReadableMap): Int? =
    ResourceDrawableIdHelper.getResourceDrawableId(context, item.getString("androidIcon"))
      .takeIf { it != 0 }

  companion object {
    const val NAME = NativeBottomToolbarSpec.NAME
    private const val TAG = "BottomToolbar"
    private const val ENTER_DURATION = 250L
    private const val EXIT_DURATION = 200L
    private const val ENTER_OFFSET_DP = 24f
    private const val MARGIN_DP = 16f
  }
}
