function sparqlQuery(query, callback) {
    let url = "http://localhost:8890/sparql";
    let queryUrl = encodeURI(url + "?query="+query+"&format=json");

    $.ajax({
        dataType: 'jsonp',
        url: queryUrl,
        method: 'GET',
        success: callback,
        error: function(err) {
            console.log(err);
        }
    })
}

function wikidataQuery(query, callback) {
    let url = "https://query.wikidata.org/sparql";
    let queryUrl = encodeURI(`${url}?origin=*&query=${query}&format=json`);

    $.ajax({
        accepts: 'application/sparql-results+json',
        dataType: 'jsonp',
        jsonp: "callback",
        url: queryUrl,
        method: 'GET',
        success: callback,
        error: function(err) {
            console.log("Errore: " + err);
        }
    });
}

var WineController = function($scope, $location) {
    $scope.message = $location.search().param1;
};

var WineShopsController = function($scope, $http) {
    let query = "SELECT DISTINCT ?wineshop ?location " +
                "WHERE { ?wineshop a wineries-and-wine-shops:WineShop . " +
                "        {?wineshop wine:locatedIn ?location} UNION " +
                "        {?wineshop wineries:basedIn ?location} } ";
    
    sparqlQuery(query, data => {
        console.log(data);
        $scope.wineshops = data.results.bindings.map(wineshop => {
            return {
                'iri': btoa(wineshop.wineshop.value),
                'name': wineshop.wineshop.value.split('#')[1],
                'location': wineshop.location.value.split('#')[1]
            }
        }).sort((item1, item2) => {
            return item1.name.localeCompare(item2.name);
        }).filter((item, pos, arr) => {
            return !pos || item.name.localeCompare(arr[pos-1].name) != 0;
        });
        
        $scope.$apply();
    });
}

var WineriesController = function($scope, $http) {
    let query = "SELECT DISTINCT ?winery ?location " +
                "WHERE { ?winery a wine:Winery . " +
                "        ?winery wineries:basedIn ?location }";
    
    sparqlQuery(query, data => {
        console.log(data);
        $scope.wineries = data.results.bindings.map(winery => {
            return {
                'iri': btoa(winery.winery.value),
                'name': winery.winery.value.split('#')[1],
                'location': winery.location.value.split('#')[1]
            }
        }).sort((item1, item2) => {
            return item1.name.localeCompare(item2.name);
        }).filter((item, pos, arr) => {
            return !pos || item.name.localeCompare(arr[pos-1].name) != 0;
        });
        
        $scope.$apply();
    });
}

var iriToName = function(iri) {
    if (iri.includes('#'))
        return iri.split('#')[1];
    return iri;
}

var WinesController = function($scope, $http) {
    let query = "SELECT DISTINCT ?wine ?color ?body ?flavor ?sugar ?maker ?location " +
                "WHERE { " +
                "?wine rdf:type wine:Wine . " +
                "?wine wine:hasColor ?color. "+
                "?wine wine:hasBody ?body. "+
                "?wine wine:hasFlavor ?flavor. "+
                "?wine wine:hasSugar ?sugar. "+
                "?wine wine:hasMaker ?maker. "+
                "?wine wine:locatedIn ?location } ";

    sparqlQuery(query, data => {
        $scope.wines = data.results.bindings.map(item => {
            obj = {
                'name': item.wine.value,
                'color': item.color.value,
                'body': item.body.value,
                'flavor': item.flavor.value,
                'sugar': item.sugar.value,
                'maker': item.maker.value,
                'location': item.location.value
            }
            Object.keys(obj).map(key => {
                obj[key] = iriToName(obj[key]);
            })
            obj.iri = btoa(item.wine.value);
            obj.makerIri = btoa(item.maker.value);

            return obj;
        }).sort((item1, item2) => {
            return item1.name.localeCompare(item2.name);
        }).filter((item, pos, arr) => {
            return !pos || item.name.localeCompare(arr[pos-1].name) != 0;
        });

        

        $scope.$apply();
    });
}

var ItemController = function($scope) {
    console.log(window.location.href);
    
    let iri = atob(window.location.href.split('#')[1]);
    let namespace = iri.split('#')[0].split('/').slice(-1)[0]; 
    let individualName = iri.split('#')[1];

    $scope.individualName = individualName;
    $scope.IRI = iri;

    let query = "SELECT ?x ?prop ?val " +
                "WHERE { ?x ?prop ?val . " +
                "       {?prop rdf:type owl:ObjectProperty} UNION " +
                "       {?prop rdf:type owl:DatatypeProperty } . " +
                `       FILTER(?x = ${namespace}:${individualName})}`;
    console.log(query);

    sparqlQuery(query, data => {
        console.log(data);
        
        
        $scope.properties= data.results.bindings.map((element, idx) => {
            let iri = element.prop.value;
            let name = iri.split('#')[1];

            if (!iri.includes('#'))
                name = iri.split('/').slice(-1)[0];
            
            let valueIri = element.val.value;
            let value = element.val.value;
            if (!element.val.datatype)
                value = value.split('#')[1];
            
        
            console.log(element.val.value);

            return {
                'id': idx,
                'iri': btoa(iri),
                'name': name,
                'valueIri': btoa(valueIri),
                'value': value
            }
        }).sort((item1, item2) => {
            diff = item1.name.localeCompare(item2.name);
            if (diff == 0)
                   diff += item1.value.localeCompare(item2.value);
            return diff;
        }).filter((item, pos, arr) => {
            return !pos || item.name.localeCompare(arr[pos-1].name) != 0 ||
                    item.value.localeCompare(arr[pos-1].value) != 0;
        }).map((item, idx) => {
            item.id = idx;
            return item;
        }).filter((item, pos, arr) => {
            return !pos || item.name.localeCompare(arr[pos-1].name) != 0;
        });

        $scope.$apply();
    });
}

var WineDetailsController = function($scope) {
    console.log(window.location.href);
    
    let iri = atob(window.location.href.split('#')[1]);
    let namespace = iri.split('#')[0].split('/').slice(-1)[0]; 
    let individualName = iri.split('#')[1];

    $scope.individualName = individualName;
    $scope.IRI = iri;

    let query = "SELECT DISTINCT ?color ?body ?flavor ?sugar ?maker ?location " +
                "WHERE { " +
                `${namespace}:${individualName} rdf:type wine:Wine . ` +
                `${namespace}:${individualName}  wine:hasColor ?color. ` +
                `${namespace}:${individualName} wine:hasBody ?body. ` +
                `${namespace}:${individualName} wine:hasFlavor ?flavor. ` +
                `${namespace}:${individualName} wine:hasSugar ?sugar. ` +
                `${namespace}:${individualName} wine:hasMaker ?maker. ` +
                `${namespace}:${individualName} wine:locatedIn ?location } `;

    console.log(query);
    
    sparqlQuery(query, data => {
        console.log(data);
        item = data.results.bindings[0];
        obj = {
            'name': individualName,
            'color': item.color.value,
            'body': item.body.value,
            'flavor': item.flavor.value,
            'sugar': item.sugar.value,
            'maker': item.maker.value,
            'location': item.location.value
        }
        Object.keys(obj).map(key => {
            obj[key] = iriToName(obj[key]);
        })
       
        $scope.wine = obj;
        $scope.$apply();
    });


    let subtypeQuery = "SELECT DISTINCT ?type WHERE { " +
                       `${namespace}:${individualName} a ?type . ` +
                       "filter not exists {  " +
                       ` ?subtype ^a  ${namespace}:${individualName}; `+
                       "         rdfs:subClassOf ?type . "+
                       " filter ( ?subtype != ?type ) "+
                       " } " +
                       "}";

    sparqlQuery(subtypeQuery, data => {
        let subtype = data.results.bindings[1].type.value;
        let subtypeName = iriToName(subtype);
        subtypeName = subtypeName.split(/(?=[A-Z])/).join(" ").toLowerCase();
        console.log(subtypeName);

        let wikiQueryDescr = "SELECT ?item ?itemLabel ?itemDescription " +
                            "WHERE " +
                            "{ " +
                            "  {  " +
                            "   ?item wdt:P31 wd:Q282 . "+
                            "   ?item rdfs:label ?label . "+
                            `   FILTER(CONTAINS(LCASE(?label), "${subtypeName}")). ` +
                            "   } "+
                            "   SERVICE wikibase:label { bd:serviceParam wikibase:language \"en\" } "+
                            " } ";
        console.log(wikiQueryDescr);

        wikidataQuery(wikiQueryDescr, data => {
            $scope.description = data.results.bindings[0].itemDescription.value;
            item = data.results.bindings[0].item.value;

            let imgQuery = "SELECT ?img " +
                            "WHERE " +
                            "{ " +
                            `   ${item} wdt:P18 ?img. ` +
                            "}";
            wikidataQuery(imgQuery, data => {
                $scope.description = data.results.bindings[0].img.value;
                $scope.$apply();
            })
        }); 
    });    
}

var B2BController = function($scope) {
    let collectionsQuery = "SELECT ?subject ?wine ?amount ?price ?winery "+
                            " WHERE { "+
                            "        ?subject rdf:type cp:Collection . "+
                            "        ?subject winecoredistributor:contains ?wine . " +
                            "        ?subject winecoredistributor:amount ?amount . "+
                            "        ?subject winecoredistributor:hasPrice ?object .  "+
                            "        ?object winecoredistributor:price ?price .  "+
                            "        ?subject winecoredistributor:soldBy ?winery.  "+
                            "}";

    sparqlQuery(collectionsQuery, data => {
        console.log(data);
        $scope.items = data.results.bindings.map(item => {
            let obj = {
                'name': item.subject.value,
                'wine': item.wine.value,
                'amount': item.amount.value,
                'price': item.price.value,
                'soldBy': item.winery.value
            };
            Object.keys(obj).map(key => {
                obj[key] = iriToName(obj[key]);
            })
            
            obj.wineIRI = btoa(item.wine.value);
            obj.makerIRI = btoa(item.winery.value);
            

            return obj
        }).sort((item1, item2) => item1.wine.localeCompare(item2.wine))
        .map((item, idx) => { item.id = idx; return item; });

        $scope.$apply();
    });
}

var B2CController = function($scope) {
    let bottlesQuery = "SELECT ?subject ?wine ?price ?seller "+
                            " WHERE { "+
                            "        ?subject rdf:type winecoredistributor:Bottle . "+
                            "        ?subject winecoredistributor:contains ?wine . " +
                            "        ?subject winecoredistributor:hasPrice ?object .  "+
                            "        ?object winecoredistributor:price ?price .  "+
                            "        ?subject winecoredistributor:soldBy ?seller.  "+
                            "}";

    sparqlQuery(bottlesQuery, data => {
        console.log(data);
        $scope.items = data.results.bindings.map(item => {
            let obj = {
                'name': item.subject.value,
                'wine': item.wine.value,
                'price': item.price.value,
                'soldBy': item.seller.value
            };
            Object.keys(obj).map(key => {
                obj[key] = iriToName(obj[key]);
            })
            
            obj.wineIRI = btoa(item.wine.value);
            obj.sellerIRI = btoa(item.seller.value);
            

            return obj
        }).sort((item1, item2) => item1.wine.localeCompare(item2.wine))
        .map((item, idx) => { item.id = idx; return item; });

        $scope.$apply();
    });
}


angular.module('WineApp.controllers', [])
    .controller('WineController', WineController)
    .controller('WineShopsController', WineShopsController)
    .controller('WineriesController', WineriesController)
    .controller('ItemController', ItemController)
    .controller('WinesController', WinesController)
    .controller('WineDetailsController', WineDetailsController)
    .controller('B2BController', B2BController)
    .controller('B2CController', B2CController);

angular.module('WineApp', ['WineApp.controllers']);


var API_KEY='AIzaSyAF_Zx69Hu2LYxrtIa258CsQbaxvi14uhs';
var googleSearch = function(query) {
    $.ajax({
        method: 'GET',
        url: `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&q=${query}`,
        success: function(data) {
            console.log(data);
        },
        error: function(data) {
            console.log(data);
        }
    });
}