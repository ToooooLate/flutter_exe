"""Exercise the real CMake bundle install rules without Windows/Flutter."""
import os
from pathlib import Path
import subprocess
import tempfile

cmake = os.environ.get('CMAKE_COMMAND', 'cmake')
rules = Path(__file__).resolve().parents[2] / 'windows' / 'webview2.cmake'
with tempfile.TemporaryDirectory(prefix='qingzhi install ') as temp:
    root = Path(temp)
    source = root / 'windows'
    source.mkdir()
    build = root / 'build'
    output = root / 'app'
    runtime = root / '.webview2' / 'runtime'
    runtime.mkdir(parents=True)
    (runtime / 'msedgewebview2.exe').write_text('runtime fixture')
    (runtime / 'locales').mkdir()
    (runtime / 'locales' / 'zh-CN.pak').write_text('locale fixture')
    loader = build / 'packages/Microsoft.Web.WebView2/build/native/x64'
    loader.mkdir(parents=True)
    (loader / 'WebView2Loader.dll').write_text('loader fixture')
    (source / 'CMakeLists.txt').write_text(
        'cmake_minimum_required(VERSION 3.14)\nproject(bundle_test NONE)\n'
        'set(CMAKE_VS_PLATFORM_NAME x64)\n'
        'set(INSTALL_BUNDLE_LIB_DIR "${CMAKE_INSTALL_PREFIX}")\n'
        f'include("{rules.as_posix()}")\n')
    def run(*args, succeeds=True):
        result = subprocess.run([cmake, *map(str, args)], capture_output=True, text=True)
        if (result.returncode == 0) != succeeds:
            raise AssertionError(result.stdout + result.stderr)
    run('-S', source, '-B', build, f'-DCMAKE_INSTALL_PREFIX={output}')
    run('--install', build, '--config', 'Release')
    assert (output / 'WebView2/msedgewebview2.exe').read_text() == 'runtime fixture'
    assert (output / 'WebView2/locales/zh-CN.pak').read_text() == 'locale fixture'
    assert (output / 'WebView2Loader.dll').read_text() == 'loader fixture'
    (output / 'WebView2/stale.dll').write_text('old version')
    run('--install', build, '--config', 'Release')
    assert not (output / 'WebView2/stale.dll').exists(), 'Old runtime files must be removed'
    runtime.rename(root / 'unavailable-runtime')
    run('--install', build, '--config', 'Debug')
    assert (output / 'WebView2/msedgewebview2.exe').exists(), 'Debug must not delete existing runtime'
    run('--install', build, '--config', 'Release', succeeds=False)
    run('--install', build, '--config', 'Profile', succeeds=False)
    print('PASS: complete runtime/loader copy, stale cleanup, Debug, missing Release/Profile runtime')
