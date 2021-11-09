import 'dart:convert';
import 'dart:io';

void main() async {
  print('Build:');
  var builder = Process.runSync(
    'vsce',
    ['package', '-o', 'gma.vsix', '--yarn'],
    runInShell: true,
  );
  if (builder.exitCode != 0) {
    print('Build failed');
    builder.stderr.transform(utf8.decoder).listen((data) => print(data));
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
    );
    if (uninstaller.exitCode != 0) {
      print('Uninstaller failed');
      uninstaller.stderr.transform(utf8.decoder).listen((data) => print(data));
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
  );
  if (installer.exitCode != 0) {
    print('Installer failed');
    installer.stderr.transform(utf8.decoder).listen((data) => print(data));
  } else {
    print(' installed');
  }
  print('done.');
}
