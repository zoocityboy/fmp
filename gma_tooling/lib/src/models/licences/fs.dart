import 'dart:io';
import 'package:path/path.dart' as path;
import 'package:csv/csv.dart';

import 'package_model.dart';

class FS {
  static const String fileName = 'dependencies.txt';
  static const String exportFileName = 'licences.csv';

  final String appFolderName;
  final Directory sourceDirectory;

  List<FileSystemEntity> directories = <FileSystemEntity>[];
  List<Directory> packageDirectories = <Directory>[];

  FS({required this.appFolderName}) : sourceDirectory = Directory.current;

  Directory get appFolder =>
      Directory(path.join(Directory.current.path, appFolderName));
  String get exportFilePath => path.join(appFolder.path, exportFileName);

  Future<String> export({required List<PackageModel> items}) async {
    var itemsx = <List<dynamic>>[];
    itemsx.add(['Package', 'Version', 'Licence', 'Repository']);
    itemsx.addAll(items.map((e) => e.asCsvRowItem));
    var csv = ListToCsvConverter().convert(itemsx);
    final input = File(exportFilePath);
    if (!await input.exists()) {
      await input.create();
    }
    await input.writeAsString(csv);
    return exportFilePath;
  }

  Future<void> _saveAsTempFile(Object? output) async {
    final temp = Directory.systemTemp.path;
    final lockFile = File(path.join(temp, fileName));
    final tempFile = lockFile.openWrite();
    tempFile.write(output);
    await tempFile.close();
  }

  Future<Map<String, String>> _readAndTransformFile() async {
    final temp = Directory.systemTemp.path;
    var items = <String, String>{};
    final lockFile = File(path.join(temp, fileName));
    var packagesLines = await lockFile.readAsLines();
    for (var i = 0; i < packagesLines.length; i++) {
      final line = packagesLines[i];
      var x = line.indexOf('[');
      if (line.startsWith('-')) {
        var sanitize = x > 2 ? line.substring(2, line.indexOf('[')) : line;
        var splited = sanitize.split(' ').map((e) => e.trim()).toList();
        var packageName = splited[0];
        var packageVersion = splited[1];
        if (!packageName.startsWith('capp_') &&
            !packageName.startsWith('mapp_') &&
            !packageName.startsWith('koyal_') &&
            packageVersion != '0.0.0') {
          items.addAll({packageName: packageVersion});
        }
      }
    }
    await _removeTempFile();
    return items;
  }

  Future<void> _removeTempFile() async {
    final lockFile = File(fileName);
    if (await lockFile.exists()) {
      await lockFile.delete();
    }
  }

  Future<List<MapEntry<String, String>>> process(Object? output) async {
    await _saveAsTempFile(output);
    final data = await _readAndTransformFile();
    return data.entries
        .map((e) => MapEntry<String, String>(e.key, e.value))
        .toList();
  }
}
