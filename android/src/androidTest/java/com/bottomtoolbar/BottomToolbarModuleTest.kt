package com.bottomtoolbar

import android.content.res.Configuration
import android.graphics.Color
import android.view.View
import android.view.ViewGroup
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.ViewActions.click
import androidx.test.espresso.matcher.ViewMatchers.withContentDescription
import androidx.test.espresso.matcher.ViewMatchers.withText
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.google.android.material.button.MaterialButton
import com.google.android.material.floatingactionbutton.FloatingActionButton
import com.google.android.material.floatingtoolbar.FloatingToolbarLayout
import java.util.Collections
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

/**
 * The module against the real Material 3 FAB and floating toolbar: a test activity
 * stands in for the React Native host, and Espresso taps what a user would.
 */
@RunWith(AndroidJUnit4::class)
class BottomToolbarModuleTest {
  private lateinit var scenario: ActivityScenario<TestActivity>
  private lateinit var reactContext: BridgeReactContext
  private lateinit var module: BottomToolbarModule
  private val pressed: MutableList<String> = Collections.synchronizedList(mutableListOf())

  @Before
  fun setUp() {
    scenario = ActivityScenario.launch(TestActivity::class.java)
    scenario.onActivity { activity ->
      // Set up by the React host in an app; the module's dp sizes read it.
      DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(activity)
      reactContext = BridgeReactContext(activity.applicationContext)
      module = BottomToolbarModule(reactContext)
      module.onItemPressed = { pressed += it }
      reactContext.onHostResume(activity)
    }
  }

  @After
  fun tearDown() {
    scenario.onActivity { module.invalidate() }
    idle()
    scenario.close()
  }

  // Which view

  @Test
  fun oneButtonShowsAFab() {
    module.show(items(button("delete", icon = ICON, label = "Delete")), JavaOnlyMap())
    val fab = settled<FloatingActionButton>()
    onMain {
      assertEquals("Delete", fab.contentDescription)
      assertNotNull(fab.drawable)
    }
  }

  @Test
  fun spacersAreSkipped() {
    module.show(
      items(space("flexibleSpace"), button("delete", icon = ICON), space("fixedSpace")),
      JavaOnlyMap(),
    )
    settled<FloatingActionButton>()
    assertEquals(1, shown().size)
  }

  @Test
  fun twoButtonsShowAFloatingToolbar() {
    module.show(
      items(
        button("delete", icon = ICON, label = "Delete"),
        button("edit", title = "Edit"),
        button("share"),
      ),
      JavaOnlyMap(),
    )
    val toolbar = settled<FloatingToolbarLayout>()
    onMain {
      val buttons = buttons(toolbar)
      assertEquals(3, buttons.size)
      // An icon button when the drawable exists, else the title, else the id.
      assertNotNull(buttons[0].icon)
      assertEquals("Delete", buttons[0].contentDescription)
      assertEquals("Edit", buttons[1].text.toString())
      assertNull(buttons[1].icon)
      assertEquals("share", buttons[2].text.toString())
    }
  }

  @Test
  fun aMissingIconLeavesTheFabEmpty() {
    module.show(items(button("delete", icon = "ic_not_there")), JavaOnlyMap())
    val fab = settled<FloatingActionButton>()
    onMain { assertNull(fab.drawable) }
  }

  @Test
  fun nothingToShowRemovesTheShownView() {
    module.show(items(button("delete", icon = ICON)), JavaOnlyMap())
    settled<FloatingActionButton>()
    module.show(items(space("flexibleSpace")), JavaOnlyMap())
    eventually { assertTrue(shown().isEmpty()) }
  }

  @Test
  fun nextShowReplacesTheShownView() {
    module.show(items(button("delete", icon = ICON)), JavaOnlyMap())
    settled<FloatingActionButton>()
    module.show(items(button("edit", title = "Edit"), button("delete", icon = ICON)), JavaOnlyMap())
    eventually {
      val views = shown()
      assertEquals(1, views.size)
      assertTrue(views[0] is FloatingToolbarLayout)
    }
  }

  // Taps

  @Test
  fun tappingTheFabReportsItsId() {
    module.show(items(button("delete", icon = ICON, label = "Delete")), JavaOnlyMap())
    settled<FloatingActionButton>()
    onView(withContentDescription("Delete")).perform(click())
    assertEquals(listOf("delete"), pressed.toList())
  }

  @Test
  fun tappingAToolbarButtonReportsItsId() {
    module.show(
      items(button("delete", icon = ICON, label = "Delete"), button("edit", title = "Edit")),
      JavaOnlyMap(),
    )
    settled<FloatingToolbarLayout>()
    onView(withText("Edit")).perform(click())
    onView(withContentDescription("Delete")).perform(click())
    assertEquals(listOf("edit", "delete"), pressed.toList())
  }

  @Test
  fun disabledItemsAreNotEnabled() {
    module.show(
      items(button("delete", icon = ICON, disabled = true), button("edit", title = "Edit")),
      JavaOnlyMap(),
    )
    val toolbar = settled<FloatingToolbarLayout>()
    onMain {
      val buttons = buttons(toolbar)
      assertFalse(buttons[0].isEnabled)
      assertTrue(buttons[1].isEnabled)
    }
    onView(withText("Edit")).perform(click())
    assertEquals(listOf("edit"), pressed.toList())
  }

  // Tint

  @Test
  fun tintColorsTheFabIconOnANeutralContainer() {
    module.show(items(button("delete", icon = ICON)), tint(TINT))
    val fab = settled<FloatingActionButton>()
    onMain {
      assertColor(TINT, fab.imageTintList!!.defaultColor)
      assertColor(neutral(), fab.backgroundTintList!!.defaultColor)
    }
  }

  @Test
  fun tintColorsTheToolbarButtonsOnANeutralContainer() {
    module.show(items(button("delete", icon = ICON), button("edit", title = "Edit")), tint(TINT))
    val toolbar = settled<FloatingToolbarLayout>()
    onMain {
      val buttons = buttons(toolbar)
      assertColor(TINT, buttons[0].iconTint.defaultColor)
      assertColor(TINT, buttons[1].currentTextColor)
      buttons.forEach { assertColor(Color.TRANSPARENT, it.backgroundTintList!!.defaultColor) }
      assertColor(neutral(), toolbar.backgroundTintList!!.defaultColor)
    }
  }

  // Hide

  @Test
  fun hideRemovesTheFab() {
    module.show(items(button("delete", icon = ICON)), JavaOnlyMap())
    settled<FloatingActionButton>()
    module.hide()
    eventually { assertTrue(shown().isEmpty()) }
  }

  @Test
  fun hideRemovesTheToolbar() {
    module.show(items(button("delete", icon = ICON), button("edit", title = "Edit")), JavaOnlyMap())
    settled<FloatingToolbarLayout>()
    module.hide()
    eventually { assertTrue(shown().isEmpty()) }
  }

  @Test
  fun hideWithNothingShownDoesNothing() {
    module.hide()
    idle()
    assertTrue(shown().isEmpty())
  }

  // Height

  @Test
  fun heightIsAFabsBeforeAnyShow() {
    val promise = TestPromise()
    module.getHeight(promise)
    assertEquals(FAB_SIZE + MARGIN, promise.await() as Double, 0.01)
  }

  @Test
  fun heightIsTheShownToolbarsPlusItsMargin() {
    module.show(items(button("delete", icon = ICON), button("edit", title = "Edit")), JavaOnlyMap())
    val toolbar = settled<FloatingToolbarLayout>()
    var expected = 0.0
    onMain { expected = toolbar.height / toolbar.resources.displayMetrics.density + MARGIN }
    val promise = TestPromise()
    module.getHeight(promise)
    assertEquals(expected, promise.await() as Double, 0.01)
  }

  // No activity

  @Test
  fun withoutAnActivityShowDoesNothingAndHeightStillResolves() {
    val detached = BottomToolbarModule(BridgeReactContext(ApplicationProvider.getApplicationContext()))
    detached.show(items(button("delete", icon = ICON)), JavaOnlyMap())
    detached.hide()
    idle()
    assertTrue(shown().isEmpty())
    val promise = TestPromise()
    detached.getHeight(promise)
    assertEquals(FAB_SIZE + MARGIN, promise.await() as Double, 0.01)
  }

  // Helpers

  /** What the module added over the activity's (empty) content. */
  private fun shown(): List<View> {
    val views = mutableListOf<View>()
    onMain { activity ->
      val content = activity.findViewById<ViewGroup>(android.R.id.content)
      for (i in 0 until content.childCount) views += content.getChildAt(i)
    }
    return views
  }

  /**
   * The one shown view, once it has animated in and stopped moving: Material views
   * ignore taps until then.
   */
  private inline fun <reified T : View> settled(): T {
    var last: IntArray? = null
    var view: T? = null
    eventually {
      val views = shown()
      assertEquals(1, views.size)
      val found = views[0] as T
      onMain {
        assertEquals(View.VISIBLE, found.visibility)
        assertTrue("still fading in", found.alpha == 1f)
        assertTrue("not laid out", found.isLaidOut)
        assertTrue("still scaling in", found.scaleX == 1f && found.scaleY == 1f)
        val position = IntArray(2).also(found::getLocationOnScreen)
        val previous = last
        last = position
        assertTrue("still moving", previous != null && previous.contentEquals(position))
      }
      view = found
    }
    return view!!
  }

  private fun buttons(toolbar: FloatingToolbarLayout): List<MaterialButton> {
    val row = toolbar.getChildAt(0) as ViewGroup
    return (0 until row.childCount).map { row.getChildAt(it) as MaterialButton }
  }

  /** The container color the module puts under a tint in an AppCompat app. */
  private fun neutral(): Int {
    var night = false
    onMain { activity ->
      night = activity.resources.configuration.uiMode and
        Configuration.UI_MODE_NIGHT_MASK == Configuration.UI_MODE_NIGHT_YES
    }
    return if (night) 0xFF2C2C2E.toInt() else Color.WHITE
  }

  private fun assertColor(expected: Int, actual: Int) =
    assertEquals(Integer.toHexString(expected), Integer.toHexString(actual))

  private fun onMain(block: (TestActivity) -> Unit) = scenario.onActivity(block)

  /** Retries [check] until it passes or 5 s go by. */
  private fun eventually(check: () -> Unit) {
    val deadline = System.currentTimeMillis() + 5_000
    while (true) {
      try {
        check()
        return
      } catch (error: Throwable) {
        if (System.currentTimeMillis() > deadline) throw error
        Thread.sleep(100)
      }
    }
  }

  private fun idle() = InstrumentationRegistry.getInstrumentation().waitForIdleSync()

  private fun items(vararg items: JavaOnlyMap) = JavaOnlyArray().apply { items.forEach { pushMap(it) } }

  private fun button(
    id: String,
    icon: String? = null,
    title: String? = null,
    label: String? = null,
    disabled: Boolean = false,
  ) = JavaOnlyMap().apply {
    putString("type", "button")
    putString("id", id)
    icon?.let { putString("androidIcon", it) }
    title?.let { putString("title", it) }
    label?.let { putString("accessibilityLabel", it) }
    if (disabled) putBoolean("disabled", true)
  }

  private fun space(type: String) = JavaOnlyMap.of("type", type)

  private fun tint(color: Int) = JavaOnlyMap.of("tintColor", color.toDouble())

  /** Settled from the UI thread; the test thread waits for it. */
  private class TestPromise : Promise {
    private val latch = CountDownLatch(1)
    @Volatile private var value: Any? = null
    @Volatile var rejectCode: String? = null
      private set

    fun await(): Any? {
      assertTrue("promise not settled in time", latch.await(5, TimeUnit.SECONDS))
      assertNull("promise rejected", rejectCode)
      return value
    }

    override fun resolve(value: Any?) {
      this.value = value
      latch.countDown()
    }

    private fun settleRejected(code: String?) {
      rejectCode = code ?: "unknown"
      latch.countDown()
    }

    override fun reject(code: String?, message: String?) = settleRejected(code)
    override fun reject(code: String?, throwable: Throwable?) = settleRejected(code)
    override fun reject(code: String?, message: String?, throwable: Throwable?) = settleRejected(code)
    override fun reject(throwable: Throwable) = settleRejected(null)
    override fun reject(throwable: Throwable, userInfo: WritableMap) = settleRejected(null)
    override fun reject(code: String?, userInfo: WritableMap) = settleRejected(code)
    override fun reject(code: String?, throwable: Throwable?, userInfo: WritableMap) = settleRejected(code)
    override fun reject(code: String?, message: String?, userInfo: WritableMap) = settleRejected(code)
    override fun reject(code: String?, message: String?, throwable: Throwable?, userInfo: WritableMap?) =
      settleRejected(code)
    override fun reject(message: String) = settleRejected(null)
  }

  private companion object {
    const val ICON = "ic_test"
    val TINT = Color.parseColor("#1E88E5")
    const val FAB_SIZE = 56.0
    const val MARGIN = 16.0
  }
}
