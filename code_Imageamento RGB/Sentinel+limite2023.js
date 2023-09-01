// Importação do polígono do SHP de Santiago.
var LimiteSantiago = ee.FeatureCollection('projects/luryand/assets/stgo');
var areaOfInterest = LimiteSantiago.geometry();

// Adicione o polígono ao mapa.
Map.addLayer(LimiteSantiago, {color: 'FF0000'}, 'Meu Polígono Santiago');

// Função para mask de nuvens
function maskClouds(image) {
    var QA60 = image.select(['QA60']);
    return image.updateMask(QA60.lt(1));
}

var imageCollection = ee.ImageCollection('COPERNICUS/S2')
    .filterDate('2023-01-01', '2023-03-31')
    .filterBounds(areaOfInterest)
    .filterMetadata('CLOUDY_PIXEL_PERCENTAGE', 'less_than', 20)
    .map(maskClouds);  // Aplicação da função para remover nuvens

var image;
if (imageCollection.size().getInfo() > 1) {
    image = imageCollection.mosaic();
} else {
    image = imageCollection.first();
}

// Obtém os valores dos percentis 5 e 95 da imagem para definir os parâmetros de visualização.
var stats = image.reduceRegion({
    reducer: ee.Reducer.percentile([5, 95]),
    geometry: areaOfInterest,
    scale: 10,
    maxPixels: 1e13
}).getInfo();

// Parâmetros de visualização otimizados para áreas vegetadas na visualização RGB.
var vizParams = {
    bands: ['B4', 'B3', 'B2'],
    min: [stats.B4_p5, stats.B3_p5, stats.B2_p5],
    max: [stats.B4_p95, stats.B3_p95, stats.B2_p95],
    gamma: [1.2, 1.2, 1.1]  // Ajuste sutil no gamma para realçar verdes.
};

// Adicione a imagem ao mapa.
Map.addLayer(image.clip(areaOfInterest), vizParams, 'Sentinel Vegetation Enhanced 2023');

// Exportação da imagem para o Google Drive.
Export.image.toDrive({
    image: image.clip(areaOfInterest).visualize(vizParams), 
    description: 'Sentinel_RGB_Jan-Mar_Santiago_2023',
    folder: 'Sentinel_images',
    scale: 10,
    region: areaOfInterest,
    fileFormat: 'GeoTIFF',
    maxPixels: 1e13,
    crs: 'EPSG:4674'  // Adicionar este argumento para exportar em SIRGAS 2000.
});

// Centralize o mapa na área de interesse.
Map.centerObject(areaOfInterest, 10);
