package com.bottomtoolbar

import com.facebook.react.bridge.ReactApplicationContext

class BottomToolbarModule(reactContext: ReactApplicationContext) :
  NativeBottomToolbarSpec(reactContext) {

  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }

  companion object {
    const val NAME = NativeBottomToolbarSpec.NAME
  }
}
