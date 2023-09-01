// Importação dos arquivos SHP de Santiago
var LimiteSantiago = ee.FeatureCollection('projects/luryand/assets/stgo');
var areaOfInterest = LimiteSantiago.geometry();

// Adicione Poligono de Limite ao mapa
Map.addLayer(LimiteSantiago, {color: 'FF0000'}, 'Meu Polígono Santiago');


// Função para mask de nuvems
function maskClouds(image) {
    var QA60 = image.select(['QA60']);
    return image.updateMask(QA60.lt(1));
}

// Filtragem por data, intervalo de 4 meses e fotos com densidadede menor de nuvens
var imageCollection = ee.ImageCollection('COPERNICUS/S2')
    .filterDate('2019-01-01', '2019-04-30') // AMBOS ALTERAVEIS 
    .filterBounds(areaOfInterest)
    .filterMetadata('CLOUDY_PIXEL_PERCENTAGE', 'less_than', 10) 
    .map(maskClouds);  // mapeio a mask cloud

// Se precisar de mais de uma imagem, cria um mosaico dentro do meu poligono
var image;
if (imageCollection.size().getInfo() > 1) {
    image = imageCollection.mosaic();
} else {
    image = imageCollection.first();
}

// Percents de padrão visual
var stats = image.reduceRegion({
    reducer: ee.Reducer.percentile([5, 95]),
    geometry: areaOfInterest,
    scale: 10,
    maxPixels: 1e13
}).getInfo();

// Parâmetros otimizados para melhor visualização de áreas vegetadas RGB (respectivamente)
var vizParams = {
    bands: ['B4', 'B3', 'B2'],
    min: [stats.B4_p5, stats.B3_p5, stats.B2_p5],
    max: [stats.B4_p95, stats.B3_p95, stats.B2_p95],
    gamma: [1.2, 1.1, 1]  
};

// Adicione imageamento remoto do Sentinel (A imagem em sí)
Map.addLayer(image.clip(areaOfInterest), vizParams, 'Sentinel Vegetation Enhanced 2019');

// Exportação da imagem através do Google Drive
Export.image.toDrive({
    image: image.clip(areaOfInterest).visualize(vizParams), 
    description: 'Sentinel_2019',
    folder: 'Sentinel_images',
    scale: 10,
    region: areaOfInterest,
    fileFormat: 'GeoTIFF',
    maxPixels: 1e13,
    crs: 'EPSG:4674'  // Adicionar este argumento para exportar em SIRGAS 2000.
});


// Centralize o mapa no limite de Santiago
Map.centerObject(areaOfInterest, 10);
