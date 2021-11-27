import 'dart:convert';
import 'dart:io';

void main(List<String> args) async {
  final scmPath = Platform.environment['SCM'];
  final isSetSCM = scmPath != null;

  if (!isSetSCM) {
    print('SCM is not set');
    exit(1);
  } else {
    print('SCM is set ${scmPath}');
  }
  print('Build:');

  final package = jsonDecode(File('package.json').readAsStringSync());
  final _fileName = '${package['name']}-${package['version']}.vsix';
  print(_fileName);

  var builder = Process.runSync(
    'vsce',
    ['package', '--no-yarn'],
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
      print('${uninstaller.stdout}');
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
      print('${uninstaller1.stdout}');
    }
  } catch (e) {
    print(e);
  }
  // var installer = Process.runSync(
  //   'code',
  //   ['--install-extension', _fileName, '--force'],
  //   runInShell: true,
  //   stderrEncoding: utf8,
  //   stdoutEncoding: utf8,
  // );
  // if (installer.exitCode != 0) {
  //   print('Installer failed');
  //   print(installer.stderr);
  // } else {
  //   print('${installer.stdout}');
  // }

  final _file = File(_fileName);
  if (_file.existsSync()) {
    print(args);
    if (args.isEmpty) {
      final _path =
          '$scmPath${Platform.pathSeparator}plugins${Platform.pathSeparator}gma_tooling${Platform.pathSeparator}extensions${Platform.pathSeparator}${_fileName}';
      print(_path);
      _file.copySync(_path);
    } else {
      _file.copySync(args[0]);
    }
  }
  print('done.');
}
