# Release/Profile must contain the pinned runtime, even for direct Flutter builds.
# Prepare it first with scripts/prepare-webview2.ps1. Missing files fail install.
# Remove the old copy so upgrading cannot leave mixed-version runtime files.
install(CODE "
  if(CMAKE_INSTALL_CONFIG_NAME MATCHES \"^(Release|Profile)$\")
    file(REMOVE_RECURSE \"${CMAKE_INSTALL_PREFIX}/WebView2\")
  endif()
  " COMPONENT Runtime)
install(DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/../.webview2/runtime/"
  DESTINATION "${CMAKE_INSTALL_PREFIX}/WebView2"
  CONFIGURATIONS Profile;Release COMPONENT Runtime)

# The plugin uses the dynamic WebView2 SDK loader but does not list it among
# PLUGIN_BUNDLED_LIBRARIES. Copy it explicitly beside the application.
set(WEBVIEW2_LOADER_ARCH "${CMAKE_VS_PLATFORM_NAME}")
if(WEBVIEW2_LOADER_ARCH STREQUAL "Win32")
  set(WEBVIEW2_LOADER_ARCH "x86")
endif()
install(FILES
  "${CMAKE_BINARY_DIR}/packages/Microsoft.Web.WebView2/build/native/${WEBVIEW2_LOADER_ARCH}/WebView2Loader.dll"
  DESTINATION "${INSTALL_BUNDLE_LIB_DIR}" COMPONENT Runtime)
