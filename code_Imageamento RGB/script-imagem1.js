// Coordenadas do polígono.
var coords = [
    [-54.9784, -28.7651],
    [-54.2944, -29.1142],
    [-54.6075, -29.5316],
    [-55.2777, -29.166]
];

// Criação da variável polígono.
var areaOfInterest = ee.Geometry.Polygon([coords]);

// Filtragem por data, intervalo de 3 meses e fotos com menor densidade de nuvens.
var imageCollection = ee.ImageCollection('LANDSAT/LC08/C01/T1_TOA')
    .filterDate('2019-01-01', '2019-03-31')
    .filterBounds(areaOfInterest)
    .sort('CLOUD_COVER', true);  // Ordena por cobertura de nuvens (menos nuvens primeiro).

// Verifica se a coleção pesquisada tem alguma imagem.
if (imageCollection.size().getInfo() > 0) {
    // Obtém a primeira imagem (com menor cobertura de nuvens).
    var image = imageCollection.first();

    // Calcula os valores mínimos e máximos para ajuste de visualização.
    var stats = image.reduceRegion({
        reducer: ee.Reducer.minMax(),
        geometry: areaOfInterest,
        scale: 30,
        maxPixels: 1e13
    });

          stats.getInfo(function(statsData) {
              // comprimento MIN e MAX das bandas R, G e B.
              var minRed = image.reduceRegion({
                  reducer: ee.Reducer.percentile([2]),
                  geometry: areaOfInterest,
                  scale: 30,
                  maxPixels: 1e13, // aumento de limite
                  bestEffort: true // se necessario, reduzirá a escala
              }).get('B4').getInfo();
          
              var maxRed = image.reduceRegion({
                  reducer: ee.Reducer.percentile([98]),
                  geometry: areaOfInterest,
                  scale: 30,
                  maxPixels: 1e13,
                  bestEffort: true
              }).get('B4').getInfo();
          
              var minGreen = image.reduceRegion({
                  reducer: ee.Reducer.percentile([2]),
                  geometry: areaOfInterest,
                  scale: 30,
                  maxPixels: 1e13,
                  bestEffort: true
              }).get('B3').getInfo();
          
              var maxGreen = image.reduceRegion({
                  reducer: ee.Reducer.percentile([98]),
                  geometry: areaOfInterest,
                  scale: 30,
                  maxPixels: 1e13,
                  bestEffort: true
              }).get('B3').getInfo();
          
              var minBlue = image.reduceRegion({
                  reducer: ee.Reducer.percentile([2]),
                  geometry: areaOfInterest,
                  scale: 30,
                  maxPixels: 1e13,
                  bestEffort: true
              }).get('B2').getInfo();
          
              var maxBlue = image.reduceRegion({
                  reducer: ee.Reducer.percentile([98]),
                  geometry: areaOfInterest,
                  scale: 30,
                  maxPixels: 1e13,
                  bestEffort: true
              }).get('B2').getInfo();
          
              // reajusta as variaveis de acordo com o percentual obtido
              var vizParams = {
                  bands: ['B4', 'B3', 'B2'],
                  min: [minRed, minGreen, minBlue],
                  max: [maxRed, maxGreen, maxBlue],
                  gamma: [1, 1, 1]
              };


        // para verificação  prévia do download
        Map.addLayer(image.clip(areaOfInterest), vizParams, 'Landsat Early 2019');

        // exportação da imagem é feita para o Google Drive do usuário logado, escala de 30m e .TIFF file
        Export.image.toDrive({
            image: image.clip(areaOfInterest).visualize(vizParams), // RGB
            description: 'Landsat_RGB_January_2019',
            scale: 30,
            region: areaOfInterest,
            fileFormat: 'GeoTIFF',
            maxPixels: 1e13
        });
    });
} else {
    print('Nenhuma imagem encontrada nesta escala!');
}

// Centraliza o mapa à área de interesse.
Map.centerObject(areaOfInterest, 10);
