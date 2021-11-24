import 'dart:convert';
import 'dart:io';

void main(List<String> args) async {
  print(Platform.environment);
  print('Build:');
  const fileName = 'gma.vsix';
  var builder = Process.runSync(
    'vsce',
    ['package', '-o', fileName, '--yarn'],
    runInShell: true,
    stderrEncoding: utf8,
    stdoutEncoding: utf8,
  );
  if (builder.exitCode != 0) {
    print('Build failed');
    print(builder.stderr);
  } else {
    print(' built');
  }
  print('Uninstaller:');
  try {
    var uninstaller = Process.runSync(
      'code',
      [
        '--uninstall-extension',
        'aol27cuew27wkrbzzq6djpcii6wqib6ejy3y56y2lfp2yspeiyyq.gma'
      ],
      runInShell: true,
      stderrEncoding: utf8,
      stdoutEncoding: utf8,
    );
    if (uninstaller.exitCode != 0) {
      print('Uninstaller failed');
      print(uninstaller.stderr);
    } else {
      print(' uninstalled');
    }
    var uninstaller1 = Process.runSync(
      'code',
      ['--uninstall-extension', 'hci.gma.studio'],
      runInShell: true,
      stderrEncoding: utf8,
      stdoutEncoding: utf8,
    );
    if (uninstaller1.exitCode != 0) {
      print('Uninstaller failed');
      print(uninstaller1.stderr);
    } else {
      print(' uninstalled');
    }
  } catch (e) {
    print(e);
  }
  print('end');
  var installer = Process.runSync(
    'code',
    ['--install-extension', 'gma.vsix'],
    runInShell: true,
    stderrEncoding: utf8,
    stdoutEncoding: utf8,
  );
  if (installer.exitCode != 0) {
    print('Installer failed');
    print(installer.stderr);
  } else {
    print(' installed');
  }

  final _file = File(fileName);
  if (_file.existsSync()) {
    print(args);
    if (args.isEmpty) {
      final _path =
          '${Platform.environment['SCM']}${Platform.pathSeparator}plugins${Platform.pathSeparator}gma_tooling${Platform.pathSeparator}extensions${Platform.pathSeparator}${fileName}';
      print(_path);
      _file.copySync(_path);
    } else {
      _file.copySync(args[0]);
    }
  }
  print('done.');
}
