// Coordenadas LAT LONG
var coords = [
    [-35.517487, -9.077232],
    [-35.517393, -9.07769],
    [-35.517271, -9.078304],
    [-35.51695, -9.079792],
    [-35.509967, -9.079189],
    [-35.510255, -9.076788],
    [-35.512123, -9.07688],
    [-35.514801, -9.077022],
    [-35.517487, -9.077232]
  ];
  
  // Adiciona cada ponto ao mapa
  for (var i = 0; i < coords.length; i++) {
    var point = ee.Geometry.Point(coords[i]);
    Map.addLayer(point, {color: '#f00'}, 'Ponto ' + (i+1));
  }
  
  // Define a região de visualização
  Map.centerObject(ee.Geometry.MultiPoint(coords), 15);
  
  // Adiciona o mapa ao Code Editor
  Map.style().set({cursor: 'crosshair'});
  
  // Cria uma linha que conecta o primeiro e o último ponto da lista de coordenadas
  var line = ee.Geometry.LineString([coords[0], coords[coords.length - 1]]);
  Map.addLayer(line, {color: 'red'}, 'Linha');