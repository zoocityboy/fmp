part of 'manager.dart';

mixin _ProcessorMixin on _GmaManager {
  void initPool() => pool = ProcessPool(
      numWorkers: concurrency,
      printReport: isVerbose
          ? null
          : (total, completed, inProgress, pending, failed) => log(
              ProcessPool.defaultReportToString(
                      total, completed, inProgress, pending, failed)
                  .spaceLeftCommand()));
  String get percent => pool.totalJobs == 0
      ? '100'
      : ((100 * (pool.completedJobs + pool.failedJobs)) ~/ pool.totalJobs)
          .toString()
          .padLeft(3);
  String get done => '${pool.completedJobs}/${pool.totalJobs}'.padLeft(7);
  List<GmaWorker> getWorkerJobs(
          {String? command, Set<String> arguments = const <String>{}}) =>
      selectedPackages
          .map((package) => package.getWorkerJob(
                command ?? package.command,
                arguments.toList(),
                logger: logger,
                isFastFail: isFastFail,
              ))
          .toList();
  Future<void> processSelectedPackages(
      List<GmaWorker> jobs, void Function(GmaWorker job)? cb) async {
    await for (final job in pool.startWorkers(jobs)) {
      final worker = job as GmaWorker;
      if (worker.result.exitCode > 0) {
        failures[worker.package as Package] =
            MapEntry(worker.result.exitCode, worker.result.stderr);
      }

      cb?.call(worker);
    }
  }
}
