import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:shelf/shelf.dart';
import 'package:shelf/shelf_io.dart' as io;
import 'package:shelf_static/shelf_static.dart';
import 'package:stack_trace/stack_trace.dart';

class LocalServer {
  final HttpServer _server;
  final String path;

  LocalServer._(this._server, this.path);

  String get host => _server.address.host;

  int get port => _server.port;

  String get urlBase => 'http://$host:$port/';

  /// [address] can either be a [String] or an
  /// [InternetAddress]. If [address] is a [String], [start] will
  /// perform a [InternetAddress.lookup] and use the first value in the
  /// list. To listen on the loopback adapter, which will allow only
  /// incoming connections from the local host, use the value
  /// [InternetAddress.loopbackIPv4] or
  /// [InternetAddress.loopbackIPv6]. To allow for incoming
  /// connection from the network use either one of the values
  /// [InternetAddress.anyIPv4] or [InternetAddress.anyIPv6] to
  /// bind to all interfaces or the IP address of a specific interface.
  static Future<LocalServer> start({
    String? path,
    int port = 9001,
    Object address = 'http://localhost',
  }) async {
    path ??= Directory.current.path;

    final pipeline = const Pipeline()
        .addMiddleware(logRequests())
        .addHandler(createStaticHandler(path, defaultDocument: 'index.html'));
    final server = await io.serve(pipeline, address, port);

    return LocalServer._(server, path);
  }

  Future destroy() => _server.close();
}

Middleware logRequests({void Function(String message, bool isError)? logger}) =>
    (innerHandler) {
      JsonEncoder encoder = JsonEncoder.withIndent('  ');

      final theLogger = logger ?? _defaultLogger;

      return (request) {
        var startTime = DateTime.now();
        var watch = Stopwatch()..start();
        request = request.change(headers: {
          'X-Frame-Options': 'SAMEORIGIN',
          'sec-fetch-mode': 'no-cors',
          'sec-fetch-site': 'none',
        });
        return Future.sync(() => innerHandler(request)).then((response) {
          var msg = _message(startTime, response.statusCode,
              request.requestedUri, request.method, watch.elapsed);
          theLogger(encoder.convert(request.headers), false);
          theLogger(encoder.convert(response.headers), false);

          theLogger(msg, false);

          return response;
        }, onError: (Object error, StackTrace stackTrace) {
          if (error is HijackException) throw error;

          var msg = _errorMessage(startTime, request.requestedUri,
              request.method, watch.elapsed, error, stackTrace);

          theLogger(msg, true);

          throw error;
        });
      };
    };

String _formatQuery(String query) {
  return query == '' ? '' : '?$query';
}

String _message(DateTime requestTime, int statusCode, Uri requestedUri,
    String method, Duration elapsedTime) {
  return '${requestTime.toIso8601String()} '
      '${elapsedTime.toString().padLeft(15)} '
      '${method.padRight(7)} [$statusCode] ' // 7 - longest standard HTTP method
      '${requestedUri.path}${_formatQuery(requestedUri.query)}';
}

String _errorMessage(DateTime requestTime, Uri requestedUri, String method,
    Duration elapsedTime, Object error, StackTrace? stack) {
  var chain = Chain.current();
  if (stack != null) {
    chain = Chain.forTrace(stack)
        .foldFrames((frame) => frame.isCore || frame.package == 'shelf')
        .terse;
  }

  var msg = '$requestTime\t$elapsedTime\t$method\t${requestedUri.path}'
      '${_formatQuery(requestedUri.query)}\n$error';

  return '$msg\n$chain';
}

void _defaultLogger(String msg, bool isError) {
  if (isError) {
    print('[ERROR] $msg');
  } else {
    print(msg);
  }
}
