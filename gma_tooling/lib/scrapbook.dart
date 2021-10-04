void main() {
  var stages = ['fake', 'prod'];
  var countries = ['in', 'id', 'vn', 'ph'];

  print(stages
      .map((e) => countries.map((e1) => '$e$e1'))
      .expand((element) => element));
}
