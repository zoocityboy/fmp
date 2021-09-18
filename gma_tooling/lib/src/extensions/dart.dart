import 'dart:convert';
import 'dart:io';

extension Let<T> on T? {
  R? let<R>(R Function(T value) cb) {
    if (this == null) return null;

    return cb(this as T);
  }
}

extension ProcessFilter on Process {
  Future<String> get outReducer async => utf8.decoder.convert(
        await this
            .stdout
            .reduce((previous, element) => [...previous, ...element]),
      );

  Future<String> get errReducer async => utf8.decoder.convert(
        await this
            .stderr
            .reduce((previous, element) => [...previous, ...element]),
      );
}
