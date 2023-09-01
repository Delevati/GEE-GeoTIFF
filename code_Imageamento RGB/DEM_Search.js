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

// Filtragem por data, intervalo de 3 meses e fotos com menor densidade de nuvens.
var imageCollection = ee.ImageCollection('COPERNICUS/S2')
    .filterDate('2023-01-01', '2023-03-31')
    .filterBounds(areaOfInterest)
    .filterMetadata('CLOUDY_PIXEL_PERCENTAGE', 'less_than', 20)
    .map(maskClouds);  // Aplicação da função para remover nuvens

// Se a coleção tiver mais de uma imagem, cria um mosaico. Caso contrário, pega a primeira imagem.
var image;
if (imageCollection.size().getInfo() > 1) {
    image = imageCollection.mosaic();
} else {
    image = imageCollection.first();
}

// Carregue o SRTM DEM.
var dem = ee.Image('USGS/SRTMGL1_003')
    .clip(areaOfInterest);

// Calcule estatísticas de elevação para o DEM na área de interesse.
var statsDEM = dem.reduceRegion({
    reducer: ee.Reducer.minMax(),
    geometry: areaOfInterest,
    scale: 30,  // A escala é 30m para o SRTM.
    maxPixels: 1e13
}).getInfo();

// Parâmetros de visualização para DEM usando estatísticas calculadas.
var elevationVis = {
  min: statsDEM['elevation_min'],
  max: statsDEM['elevation_max'],
  palette: ['blue', 'green', 'white']
};

// Adicione o DEM ao mapa.
Map.addLayer(dem, elevationVis, 'DEM Santiago');

// Exportação do DEM para o Google Drive.
Export.image.toDrive({
    image: dem,
    description: 'DEM_Santiago',
    folder: 'DEM_images',
    scale: 30,
    region: areaOfInterest,
    fileFormat: 'GeoTIFF',
    maxPixels: 1e13,
    crs: 'EPSG:4674'  // Exportar em SIRGAS 2000.
});

// Centralize o mapa na área de interesse.
Map.centerObject(areaOfInterest, 10);
