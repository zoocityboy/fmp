
import 'dart:io';

import 'package:cli_util/cli_logging.dart';
import 'package:gmat/src/processor/init_processor.dart';
import 'package:gmat/src/workspace.dart';

import 'models/package.dart';

class GmaManager {
  GmaManager({required this.directory, required this.logger,this.filter = const []});
  final Logger logger;
  final List<Package> packages = [];
  List<Package> filtered = [];
  final Directory directory;
  final List<String> filter;

  Future<void> init() async {
    final workspace = GmaWorkspace.fromDirectory(directory);
    
    final  _packages = await InitProcessor(workspace: directory, logger: logger, filter: filter).execute();
    packages.addAll(_packages);
    filtered = _packages;
    print('filtered: $filtered');
  }

  void applyPackage({String? packageFolderName, String? filterPatter}) {
    if (packageFolderName == null && filterPatter == null) {
      filtered = packages;
    } else if (filterPatter != null) {
      filtered = packages
          .where((element) => element.name?.contains(filterPatter) ?? false)
          .toList();
    } else if (packageFolderName != null) {
      filtered = packages
          .where((element) => element.name == packageFolderName)
          .toList();
    } else {
      filtered = [];
    }
    applySort();
  }
  void applyDevDependencies({List<String> dependsOn = const <String>[]}){
    filtered = filtered.where((element) => dependsOn.toList().every((e) => element.devDependencies.keys.contains(e))).toList();
    applySort();
  }
  void applySort(){
    filtered.sort((a,b)=> a.directoryName.compareTo(b.directoryName));
  }
  void log(String messsage){
    logger.stdout(messsage);
  }
  void logErrror(String message){
    logger.stderr(message);
  }
  
}