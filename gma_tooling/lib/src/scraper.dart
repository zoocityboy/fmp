import 'package:gmat/src/models/licences/package_model.dart';
import 'package:html/parser.dart';
import 'package:http/http.dart';
import 'package:collection/collection.dart';

class Scraper {
  final Client client = Client();

  Future<PackageModel> scrape(String packageName, {String? version}) async {
    var response = await _fetch(packageName);
    final currentVersion = _getVersion(response);
    final repository = _getRepository(response);
    final licence = _getLicense(response);
    var package = PackageModel(
        name: packageName,
        version: version ?? currentVersion,
        licence: licence,
        repo: repository);
    return package;
  }

  Future<String> _fetch(String packageName) async {
    final uri = Uri.https('pub.dev', '/packages/$packageName');

    final result = await client.get(uri);
    if (result.statusCode == 200) {
      return result.body;
    }
    return '';
  }

  String? _getVersion(String body) {
    var document = parse(body);
    var links = document.querySelectorAll(
        'h1.title > span.pkg-page-title-copy > img.pkg-page-title-copy-icon');
    if (links.isEmpty) return null;
    final _title = links.first.attributes['data-copy-content'];
    final _splited = _title?.split(':');
    return _splited?.last.trim();
  }

  String? _getLicense(String body) {
    var document = parse(body);
    var links = document.querySelectorAll('aside.detail-info-box > p > a');
    if (links.isEmpty) return null;
    var x = links.firstWhereOrNull(
      (element) => element.innerHtml.contains('LICENSE'),
    );
    var license =
        x?.parent?.innerHtml.replaceAll(' (' + x.outerHtml + ')', '').trim();
    return license;
  }

  String? _getRepository(String body) {
    var document = parse(body);
    var links =
        document.querySelectorAll('aside.detail-info-box > p > a[rel="ugc"]');

    if (links.isEmpty) return null;
    var item = links.firstWhereOrNull(
        (element) => element.innerHtml.contains('Repository'));
    return item?.attributes['href'];
  }
}
