/*

    +1. Сделать раскрывающийся ховер-сайдбар
        1.1 Раскрытый сайдбар - нав меню с табами скрыто, видна только маленька закладка со стрелочкой (<), ховер = раскрытие меню. При закрытом сайдбаре = всё таб меню видно
        1.2 Придерживаться стиля изображения до краёв контейнера, текст 40пикс. по бокам
     2. Модальное окно для каждого объектра (POI)
        2.1 Галерея \ карусель изображений
        2.2 Изменить карточку в списке объектов (минимизировать до вида слева картинка - справа название + что-то ещё хз, снизу краткое описание)
     3. Наполнение данными + форматирование изображений в webp
     4. Гибкая высота контейнера sidebar
    +5. Реализовать функцию отображения\зумма по клику
     6. Баг - при закрытии лист айтема чек консоль 
     7. Подправить в ГИС маршрут по актуальной подложке ArcGIS:Imagery
     8. Создать собственную WFS подложку (нарисовать) на весть район Трахтемирова - Бурчак
     9. Add colision detect lib + test
     10. Настроить "Урочища"
     11. Добавить анимированые "флажки" (points) в точках старта и остановок = это всё в категорию "Маршрут"

*/

const config = {
    apikey : 'AAPK635bb11113274d178e965eed8f6c4cfaHJFQ_TpKbTkls-5IQV19gn3CYsZxtvEMnHnrswUgs2cgOvG1OAeLek-cQCdgGYP9'
}

const styles = {
    route : {
        'color' : '#04ff00',
        'opacity' : 0.5
    },
    nature : {
        'stroke' : false,
        'fillOpacity' : 0,
        // 'interactive' : false
    },
    poi_arch : {
        'interactive' : false
    },
    poi_tursm : {
        'stroke' : false,
        'fillOpacity' : 0,
    }
}

const basemaps = {
    OSM : L.esri.Vector.vectorBasemapLayer('OSM:StandardRelief', {apikey: config.apikey}),
    Imagery : L.esri.Vector.vectorBasemapLayer('ArcGIS:Imagery', {apikey: config.apikey}),
}


let iconPoi =  L.Icon.extend({
    options : {
        iconSize: [14, 34],
        // shadowUrl: './data/icons/shadow.svg',
        shadowSize: [25, 28],
        className: 'icon-shadow'
    }
})


let map = L.map('map', {
    layers : basemaps.Imagery,
    maxZoom: 17
}).setView([49.901910, 31.429081], 13);

let control = L.control.layers(basemaps, null, {collapsed : true, position : 'topleft'}).addTo(map)

let dataFeatures = {}

let predataPoiArch = await fetch("./data/desc/poi_arch.geojson")
let poiArch = await predataPoiArch.json()

//fix poiArch to valid structure
poiArch.features.forEach(function (item, index){
    poiArch.features[index].feature = item
})

//add poi_arch to feature list
dataFeatures.poi_arch = poiArch.features

//load Description 
let predataPoiDescription = await fetch("./data/desc/poi_description.json")
let poiDescription = await predataPoiDescription.json()

let predataOtherDescription = await fetch("./data/desc/other_descriptions.json")
let otherDescription = await predataOtherDescription.json()

let predataTursmDescription = await fetch("./data/desc/tursm_description.json")
let tursmDescription = await predataTursmDescription.json()

let predatanatureDescription = await fetch("./data/desc/nature_description.json")
let natureDescription = await predatanatureDescription.json()


//feature group for markers
let dataMarkers = new L.FeatureGroup()

//load data - Route
let predataRoute = await fetch("./data/layers/route.geojson");
let dataRoute = await predataRoute.json()

L.geoJSON(dataRoute, {
    style : styles.route,
    onEachFeature : function (feature, layer){
        if(!dataFeatures[dataRoute.name]){
            dataFeatures[dataRoute.name] = []
        }
        dataFeatures[dataRoute.name].push(layer)
        
        //fix geometry.reverse
        feature.geometry.coordinates.map((item) => {
            return item.map((item) => {
                return item.reverse()
            })
        })

        L.polyline.antPath(feature.geometry.coordinates, {
            "paused": false,
            "reverse": false,
            "delay": 3000,
            "dashArray": [20, 15],
            "weight": 4,
            "opacity": 0.6,
            "color": "#194201",
            "pulseColor": "#ffff",
            "className" : "antpath"
        }).addTo(map)
    }
})

//load data - Route branch

let predataRouteBranch = await fetch("./data/layers/route_branch.geojson");
let dataRouteBranch = await predataRouteBranch.json()

L.geoJSON(dataRouteBranch, {
    style : styles.route,
    onEachFeature : function (feature, layer){        
        //fix geometry.reverse
        feature.geometry.coordinates.map((item) => {
            return item.map((item) => {
                return item.reverse()
            })
        })

        L.polyline.antPath(feature.geometry.coordinates, {
            "paused": false,
            "reverse": true,
            "delay": 3000,
            "dashArray": [20, 15],
            "offset" : -4,
            "weight": 4,
            "opacity": 0.6,
            "color": "#194201",
            "pulseColor": '#bfbfbf',
            "className" : "antpath-branch antpath"
        }).addTo(map)
    }
})




//load data - Nature       
let predataNature = await fetch("./data/layers/nature.geojson");
let dataNature = await predataNature.json()

L.geoJSON(dataNature, {
            style : styles.nature,
            pointToLayer : function(feature, latlng){
                return L.marker(latlng, {
                    icon : new iconPoi({
                        iconUrl: `./data/icons/${feature.properties.type}.svg`,
                        shadowUrl: './data/icons/shadow-green.svg'
                    })
                })
            },
            onEachFeature : function (feature, layer){
                if(!dataFeatures[dataNature.name]){
                    dataFeatures[dataNature.name] = []
                }
                dataFeatures[dataNature.name].push(layer)

                layer.bindTooltip(feature.properties.name, {
                    direction : 'top',
                    className :  'nature-tooltip',
                    offset : [0, -15]
                    })

                    layer.on('click', function(e){

                        sidebar.open('list');
    
                        let featureTarget = e.target.feature.properties
                        let listTarget = listPane.querySelector(`[data-category=${featureTarget.category}] > [data-feature-id="${String(featureTarget.id)}"]`)
    
                        listTarget.classList.toggle("item-open");
                        if(listTarget.classList.contains("item-open")){
                            createCard(listTarget)   
                            listTarget.parentNode.style.maxHeight = 'max-content'         
                        }else{
                            let desc = listTarget.lastChild;
                            desc.addEventListener('transitionend', () => {
                                desc.remove()
                            })
                            desc.style.maxHeight = null;
                            listTarget.parentNode.style.maxHeight = listTarget.parentNode.scrollHeight + 'px'
                        }
                        
                    })
                    dataMarkers.addLayer(layer)

                }


}).addTo(map);

//load data - POI_tursm 
let predataPOItursm = await fetch("./data/layers/poi_tursm.geojson");
let dataPOItursm = await predataPOItursm.json();



L.geoJSON(dataPOItursm, {
            style : styles.poi_tursm,
            pointToLayer : function(feature, latlng){
                return L.marker(latlng, {
                    icon : new iconPoi({
                        iconUrl: `./data/icons/${feature.properties.type}.svg`,
                        shadowUrl: './data/icons/shadow.svg',
                    })
                })
            },
            onEachFeature : function(feature, layer){
                if(!dataFeatures[dataPOItursm.name]){
                    dataFeatures[dataPOItursm.name] = []
                }
                dataFeatures[dataPOItursm.name].push(layer)

                layer.bindTooltip(feature.properties.name, {
                    direction : 'top',
                    offset : [0, -15]
                })

                layer.on('click', function(e){

                    sidebar.open('list');

                    let featureTarget = e.target.feature.properties
                    let listTarget = listPane.querySelector(`[data-category=${featureTarget.category}] > [data-feature-id="${String(featureTarget.id)}"]`)

                    listTarget.classList.toggle("item-open");
                    if(listTarget.classList.contains("item-open")){
                        createCard(listTarget)   
                        listTarget.parentNode.style.maxHeight = 'max-content'         
                    }else{
                        let desc = listTarget.lastChild;
                        desc.addEventListener('transitionend', () => {
                            desc.remove()
                        })
                        desc.style.maxHeight = null;
                        listTarget.parentNode.style.maxHeight = listTarget.parentNode.scrollHeight + 'px'
                    }
                    

                  
                })
                dataMarkers.addLayer(layer)
            }
    })

// Add Custom Markers

const flagStartIcon = new iconPoi({
    iconUrl: './data/icons/flag-solid.svg',
    iconSize : [24, 44],
    iconAnchor : [0, 35],
    shadowUrl : null
});

const flagFinishIcon = new iconPoi({
    iconUrl: './data/icons/flag-checkered-solid.svg',
    iconSize : [28, 48],
    iconAnchor : [0, 35],
    shadowUrl : null
});

let flagStartMarker = L.marker([49.933196449499469, 31.416253602411228], {icon : flagStartIcon})
let flagFinishMarker = L.marker([49.861296053984418, 31.436793858039255], {icon : flagFinishIcon})

flagStartMarker.feature = {
    properties : {
        category: "route",
        id: 1,
        name: "Старт маршруту",
        type: "route"
    },
    geometry : {
        type : "Point"
    }
}

flagFinishMarker.feature = {
    properties : {
        category: "route",
        id: 2,
        name: "Кінець маршруту",
        type: "route"
    },
    geometry : {
        type : "Point"
    }
}

flagStartMarker.bindTooltip((layer) => {return layer.feature.properties.name} , {
    direction : 'top',
    offset : [10, -25]
})

flagFinishMarker.bindTooltip((layer) => {return layer.feature.properties.name}, {
    direction : 'top',
    offset : [10, -25]
})


flagStartMarker.addTo(map)
flagFinishMarker.addTo(map)

dataFeatures.route.push(flagStartMarker, flagFinishMarker)


//add markers
dataMarkers.addTo(map)

const tamplates = {
    tampl_main_pane : `
    <div class="home-main-wrapper">
        <div class="home-main-title">
            <div class="home-main-title-grad"></div>
        </div>
        <img class="home-main-title-img" src="/data/img/other/main_img.webp" width="0">
        <div class="pane-wrapper">
            <p><b>Довжина маршруту</b> - 11 км</p>
            <p><b>Перепад висот</b> – не більше 150м</p>
            <p><b>Середня тривалість пересування</b> – 4-6 год в залежності від підготованості та вікової категорії туристів.</p>
            <p><b>Опис маршруту</b>${otherDescription[0]}</p>
        </div>
    <div>`,
}

//init sideber
const sidebar = L.control.sidebar({
    autopan: true,    
    container: 'sidebar', 
    position: 'left',    
}).addTo(map);   


sidebar.addPanel({
    id: 'home',              
    tab: '<i class="fas fa-home"></i>',  
    pane : tamplates.tampl_main_pane,
    title: 'ТРАХТЕМИРІВСЬКА ЛУКА - СЕРЦЕ КАНІВСЬКИХ ГІР',             
    position: 'top'                  
});

sidebar.addPanel({
    id: 'list',                   
    tab: '<i class="fas fa-list-ul"></i>',  
    pane : generateList(dataFeatures),
    title: 'Перелік об\'єктів',             
    position: 'top'                    
});

sidebar.addPanel({
    id : 'info',
    tab : '<i class="fas fa-info"></i>',
    pane : 'TEST',
    title : 'Контакти',
    position : 'top'
})
sidebar.open('home');


function generateList(data){
    const categories = {
        route : "Маршрут",
        nature : "Природні урочища",
        poi_tursm : "Туристичні локації",
        poi_arch : "Археологічні локації"
    }
    let result = document.createElement('div')
        result.id = 'wrapper';

    let comp = `<ul class="obj-list" id="obj-list">`
    for(let item in data){
        comp += `<li class="category" data-category=${item}>
        <span class="obj-list-category">${categories[item]}</span>`
        if(item != 'poi_arch') comp +=  `<div class="item-feature"><i class="far fa-eye item-feature-i"></i></div>`
        comp += `<ul class="obj-list-items" data-category="${item}">`;

        for(let item2 in data[item]){
            comp += `<li class="item" data-feature-id="${data[item][item2].feature.properties.id}">
                <div class="item-wrapper">
                    <p>${data[item][item2].feature.properties.name}</p>`;
                    if(item != 'poi_arch') comp += `<div class="item-feature"><i data-vis-state="hide" class="far fa-eye item-feature-i"></i><i class="fab fa-sistrix item-feature-i"></i></div>
                </div>`
            comp += '</li>'
        }
        comp += `</ul>
        </li><hr>
        `
    }
    return comp
}

function zoomToFeature(object){        
        
        switch(object.feature.geometry.type){
            case 'MultiPolygon' : {
                map.flyToBounds(object.getBounds(), 16); 
                object.openTooltip();

                break;
            }
            case 'Point' : {
                map.flyTo(object.getLatLng(), 16); 
                object.openTooltip();
                
                break;
            }
            case 'MultiLineString' : {
                map.flyToBounds(object.getBounds(), 16); 
                object.openTooltip();

                break;
            } 
            case 'Text' : console.log('TEST_Text'); break; 
        }
}

function toggleMarkerVisibility(marker){
    //kostul
    if(marker.feature.properties.id == '0' & marker.feature.properties.category == 'route'){
        let antNode = document.querySelector('.leaflet-ant-path')
        if(antNode.style.visibility == 'hidden') antNode.style.visibility = 'visible'
        else antNode.style.visibility = 'hidden'
    }else{
        if(map.hasLayer(marker)) marker.remove()
        else marker.addTo(map)
    }
    
}

function createCard(listItem){
    let type = listItem.parentNode.parentNode.getAttribute('data-category')
    let object = listItem.getAttribute('data-feature-id')
    let description = (() => {
        switch(type){
            case 'poi_tursm' : return tursmDescription
            case 'nature' : return natureDescription
            case 'poi_arch' : return poiDescription
            case 'route' : return 'Добавить файл описания'
        }
    })()

    let div = document.createElement("div");
        div.classList.add('obj-list-item-desc');
        (async () => {
            let response = await fetch(`./data/img/pois/${type}/${object}.jpg`);
            if(response.ok){
                const blob = await response.blob()
                let img = new Image(650)
                img.src = URL.createObjectURL(blob)
                img.onload = () => {
                    div.append(img)
                    div.innerHTML += `<p>${description[object]}</p>`;
                    listItem.append(div)
                    div.style.maxHeight = div.scrollHeight + "px";
                }
            } else {
                response = await fetch(`./data/img/404.png`)
                const blob = await response.blob()
                let img = new Image(650)
                img.src = URL.createObjectURL(blob)
                img.onload = () => {
                    div.append(img)
                    div.innerHTML += `<p>${description[object]}</p>`;
                    listItem.append(div)
                    div.style.maxHeight = div.scrollHeight + "px";
                }
            }
        })()        
}

let listPane = document.querySelector("#obj-list");
let listItems = listPane.querySelectorAll('.obj-list-items > li')

//add listeners
//list-pane-l1
for(let itemList of listPane.childNodes){
        itemList.addEventListener('mouseenter', (e) => {
            if(e.target.tagName == 'LI') {
                if(itemList.querySelector('.item-feature-i')) itemList.querySelector('.item-feature-i').classList.add('item-feature-vis')}
        })

        itemList.addEventListener('mouseleave', (e) => {
            if(e.target.tagName == 'LI') {
                if(itemList.querySelector('.item-feature-i')) itemList.querySelector('.item-feature-i').classList.remove('item-feature-vis')}

        })
    

    if(itemList.tagName == 'LI'){
        if(itemList.querySelector('.item-feature-i')){
        itemList.querySelector('.item-feature-i').addEventListener('click', () => {
            let targetNode = itemList.querySelector('.item-feature > i')
            let trueVis = targetNode.classList.contains('fa-eye')
            itemList.querySelectorAll('ul > li').forEach((item) => {
                let target = dataFeatures[item.parentNode.parentNode.getAttribute('data-category')][item.getAttribute('data-feature-id')]
                let node = item.querySelector('.item-feature > i')
                if(trueVis){
                    if(node.classList.contains('fa-eye')){
                        node.classList.remove('fa-eye')
                        node.classList.add('fa-eye-slash')
                        toggleMarkerVisibility(target)
                    }
                    else{
                    }
                    
                }
                else {
                    if(node.classList.contains('fa-eye-slash')){
                        node.classList.add('fa-eye')
                        node.classList.remove('fa-eye-slash')
                        toggleMarkerVisibility(target)
                    }
                    else{
                    }
                    
                }
                
            })
            targetNode.classList.toggle('fa-eye')
            targetNode.classList.toggle('fa-eye-slash')
        })}
    }
}

//list-pane-l2
for(let itemList of listItems){
    itemList.addEventListener('mouseenter', () => {
        itemList.querySelectorAll('.item-feature > i').forEach((item) => {
            item.classList.add('item-feature-vis')
        })
    })

    itemList.addEventListener('mouseleave', () => {
        itemList.querySelectorAll('.item-feature > i').forEach((item) => {
            item.classList.remove('item-feature-vis')
        })
    })
    
    itemList.addEventListener('click', (e) => {

        if(e.target.tagName !== 'P') return
        if(itemList.parentNode.getAttribute('data-category') == 'route'){
            switch(e.target.parentNode.parentNode.getAttribute('data-feature-id')){
                case '0' : {
                    sidebar.open('home')
                }break;
                case '1' : {
                    console.log('Start')
                }break;
                case '2' : {
                    console.log('Finish')
                }break;
            }
            return
        }

        if(!itemList.classList.contains("item-open")){
            itemList.classList.toggle("item-open");
            createCard(itemList)   
            itemList.parentNode.style.maxHeight = 'max-content'         
        }else{
            let desc = itemList.lastChild;
            desc.addEventListener('transitionend', () => {
                desc.remove()
                itemList.classList.toggle("item-open");
            })
            desc.style.maxHeight = null;
            itemList.parentNode.style.maxHeight = itemList.parentNode.scrollHeight + 'px'
        }
    })


    //list-item-i
    itemList.querySelectorAll('.item-feature > i').forEach((item) => {
        switch(item.classList[1]){
            case 'fa-sistrix' : {
                item.addEventListener('click', () => {
                    let target = dataFeatures[itemList.parentNode.parentNode.getAttribute('data-category')][itemList.getAttribute('data-feature-id')]
                    zoomToFeature(target)
                    console.log('HOW??? Zoom')
                })
            }break;
            case 'fa-eye' : {
                item.addEventListener('click', () => {
                    let target = dataFeatures[itemList.parentNode.parentNode.getAttribute('data-category')][itemList.getAttribute('data-feature-id')]
                    toggleMarkerVisibility(target)
                    item.classList.toggle('fa-eye')
                    item.classList.toggle('fa-eye-slash')
                    console.log('HOW???? visible')
                })
            }break;
            case 'fa-eye-slash' : {
                item.addEventListener('click', () => {

                })
            }break;
        }
    })
}


// for (let li of listNode){
//     let span = document.createElement("span");
//     span.classList.add("obj-list-category");
//     li.prepend(span);
//     span.append(span.nextSibling);
// }
  
listPane.onclick = function (event) {
    if (event.target.tagName != "SPAN") return;
    let childrenList = event.target.parentNode.querySelector("ul");
    if (!childrenList) return;
    childrenList.classList.toggle('obj-list-items-show');
    if(childrenList.classList.contains('obj-list-items-show')) childrenList.style.maxHeight = childrenList.scrollHeight + "px";
    else childrenList.style.maxHeight = null
};

map.on('baselayerchange', function(e){
    let pathNode = document.querySelector('.leaflet-ant-path')
    if(e.name == 'OSM') pathNode.setAttribute('stroke', '#000000')
    else pathNode.setAttribute('stroke', '#ffff')
        
    
})

map.on('zoomend', function(){
    switch(map.getZoom()){
        case 15:
            if(!map.hasLayer(dataFeatures)){
                map.addLayer(dataMarkers)
            }

            dataMarkers.eachLayer((layer) => {
                layer.setIcon(new iconPoi({
                    iconSize : [20, 50],
                    iconUrl : layer.getIcon().options.iconUrl,
                    shadowUrl : layer.getIcon().options.shadowUrl,
                    shadowSize: [35, 40],
                }))
           })
           break;

        case 14:
            if(!map.hasLayer(dataFeatures)){
                map.addLayer(dataMarkers)
            }

            dataMarkers.eachLayer((layer) => {
                layer.setIcon(new iconPoi({
                    iconSize : [18, 43],
                    iconUrl : layer.getIcon().options.iconUrl,
                    shadowUrl : layer.getIcon().options.shadowUrl,
                    shadowSize: [28, 33],
                }))

           })
           break;

        case 13:
            if(!map.hasLayer(dataFeatures)){
                map.addLayer(dataMarkers)
            }

            dataMarkers.eachLayer((layer) => {
                layer.setIcon(new iconPoi({
                    iconSize : [14, 34],
                    iconUrl : layer.getIcon().options.iconUrl,
                    shadowUrl : layer.getIcon().options.shadowUrl,
                    shadowSize: [25, 28],
                })) 
            })
           break;

        case 12:
            if(!map.hasLayer(dataFeatures)){
                map.addLayer(dataMarkers)
            }

            if(map.hasLayer(dataMarkers)){
                dataMarkers.eachLayer((layer) => {
                    layer.setIcon(new iconPoi({
                        iconSize : [10, 25],
                        iconUrl : layer.getIcon().options.iconUrl,
                        shadowUrl : layer.getIcon().options.shadowUrl,
                        shadowSize: [18, 23],
                    }))
                })
            }
            
           break;

        case 11:
            if(map.hasLayer(dataMarkers)){
                map.removeLayer(dataMarkers)
            }
           break;

        case 10:
            console.log('End of zoomed events')
    }
});



// <i class="far fa-eye"></i> - eye open
// <i class="fas fa-eye-slash"></i> - eye close
// <i class="fab fa-sistrix"></i> - search

const leafletSidebar = document.querySelector('.leaflet-sidebar')
const leafletSidebarTab = document.querySelector('.leaflet-sidebar-tabs')
const leafletSidebarContent = document.querySelector('.leaflet-sidebar-content')

const leafletSidebarHover = document.createElement('div')
leafletSidebarHover.classList.add('leaflet-sidebar-hover-tabs')

leafletSidebar.prepend(leafletSidebarHover)

//css hover
leafletSidebarTab.addEventListener('mouseenter', () => {
    leafletSidebarContent.style.left = '40px'
})

leafletSidebarTab.addEventListener('mouseleave', () => {
    leafletSidebarContent.style.left = null
})

leafletSidebar.addEventListener('click', () => {
    if(leafletSidebar.classList.contains('collapsed')) leafletSidebarTab.style.width = '40px'
    else leafletSidebarTab.style.width = null
})

//css add control panel style
document.querySelector('.leaflet-control-layers-toggle').setAttribute('id', 'leaflet-control-custom')


