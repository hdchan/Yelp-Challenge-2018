// https://leafletjs.com/reference-0.7.7.html#control

var southWest = L.latLng(25.82, -124.39),
    northEast = L.latLng(49.38, -66.94)

var INITIAL_MAP_COORDINATE = [38.7614954,-97.1520365];
var INITIAL_MAP_ZOOM = 3;

var map = L.map('map').setView(INITIAL_MAP_COORDINATE, INITIAL_MAP_ZOOM);
    mapLink = 
        '<a href="http://openstreetmap.org">OpenStreetMap</a>';
    L.tileLayer(
        'http://b.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; ' + mapLink + ' Contributors',
        maxZoom: 18,
        minZoom: 3,
        }).addTo(map);
            
/* Initialize the SVG layer */
map._initPathRoot()    
map.setMaxBounds(L.latLngBounds(southWest, northEast))

$("#filternodes:checkbox").change(function(){  
    if ($(this).is(':checked')) {
        $("#performancetoggle .tooltiptext").html("When turned OFF, will produce all nodes for all key words and phrases on the node graph.")
    } else {
        $("#performancetoggle .tooltiptext").html("When turned ON, reduces the number of nodes shown on the graph to those only connected to multiple ratings.")
    }
});

function setLoading(isLoading, callback) {
    if (isLoading) {
        $('.loadercontainer').fadeIn(400, callback);
    } else {
        $('.loadercontainer').fadeOut(1000, callback);
    }
}

function dismissToolTip() {
    $("#starttooltip").css("display", "none");
    // $("#wordgraph").css("display", "inline");
}

function removeRestaurantDetail() {
    d3.select("g.wordgraphgroup").remove();
    d3.select("#restaurantdetail").remove();
}

function resetMap() {
    d3.select("#map").select("svg").select("g").remove();
    map.setView(INITIAL_MAP_COORDINATE, INITIAL_MAP_ZOOM);
}

function resetPage() {
    d3.select("#restaurantlist").remove();
    resetMap();
    removeRestaurantDetail();
}

$("#listfilter .dropdown-item").click(function() {
    $("#listfilter .dropdown-item").removeClass("active");
    $(this).addClass("active");
    retrieveRestaurantList($(this).attr("data"));
});

$("#filternodes").click(function() {
    if ($(this).is(':checked') == false) {
        $("#performancemodal").css("display", "block");
    }
});

$("#performancemodal .yes, #performancemodal .no, #performancemodal .close").click(function() {
    $("#performancemodal").css("display", "none");
});

$("#performancemodal .no, #performancemodal .close").click(function() {
    $("#filternodes").prop("checked", true);
    $("#filternodes:checkbox").trigger("change")
});

function retrieveRestaurantList(type) {
    resetPage();
    setLoading(true, function() {
        d3.json(`/api/restaurants?listtype=${type}`, function(restaurants) {
            setLoading(false, function() {
                if (restaurants == undefined) return;
                /* Add a LatLng object to each item in the dataset */
                restaurants.forEach(function(d) {
                    d.LatLng = new L.LatLng(d.latitude, d.longitude);
                });
                buildMap(restaurants);
                buildRestaurantList(restaurants);
            });
        });
    });
}

function buildMap(restaurants) {
    /* We simply pick up the SVG from the map object */
    var svg = d3.select("#map").select("svg"),
    g = svg.append("g");

    var feature = g.selectAll("circle")
        .data(restaurants)
        .enter().append("g")
    
    feature
        .append("circle")
        .style("stroke", "black")  
        .style("opacity", 1.) 
        .style("fill", "red")
        .attr("r", 10)
        .on("click", onLocationSelected);  
    
    var text = feature
        .append("text")
        .style("font-weight", "bold")
        .text(function(d) {
            return d.name
        })
        .attr("y", 5)
        .attr("x", 15)
    
    map.on("viewreset", update);
    update();

    function update() {
        feature.attr("transform", 
        function(d) { 
            return "translate("+ 
                map.latLngToLayerPoint(d.LatLng).x +","+ 
                map.latLngToLayerPoint(d.LatLng).y +")";
            }
        )

        if (map.getZoom() > 10) {
            text.style("display", "block")
        } else {
            text.style("display", "none")
        }
    }
}

function buildRestaurantList(restaurants) {
    $(".sidepanel.left").append("<div id='restaurantlist' class='sidepanel_container list-group'></div>");
    count = 1;
    restaurants.forEach(function(d) {
        businessDiv = $(`<a href="#" class="business list-group-item list-group-item-action flex-column align-items-start" data='${d.business_id}'>
            <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-1">${count}. ${d.name}</h5>
            </div>
        </a>`).data(d);
        $("#restaurantlist").append(businessDiv);
        count++;
    });
    $(".sidepanel.left .business").click(function() {
        var data = $(this).data();
        onLocationSelected(data);
    });
}

function onLocationSelected(d) {
    removeRestaurantDetail();
    dismissToolTip();
    
    map.setView(d.LatLng, 18);
    /* highlight sidebar */
    $("#restaurantlist .business").each(function(i, e) {
        if ($(e).attr("data") == d.business_id) {
            $(e).addClass("active");
            
            // https://stackoverflow.com/questions/18150090/jquery-scroll-element-to-the-middle-of-the-screen-instead-of-to-the-top-with-a
            // var el = $(e);
            // var elOffset = el.offset().top;
            // var elHeight = el.height();
            // var windowHeight = $(window).height();
            // var offset;

            // if (elHeight < windowHeight) {
            //     offset = elOffset - ((windowHeight / 2) - (elHeight / 2));
            // }
            // else {
            //     offset = elOffset;
            // }
            // var speed = 700;
            // $('#restaurantlist').animate({scrollTop:offset}, speed);
        } else {
            $(e).removeClass("active");
        }
    });
    
    /* Start loading the next restaurant */
    retreiveRestaurantData(d);
}

function retreiveRestaurantData(d) {
    setLoading(true, function() {
        d3.queue()
        .defer(d3.json, "/api/metadata?business_id=" + d.business_id)
        .defer(d3.json, "/api/comments?business_id=" + d.business_id)
        .defer(d3.json, "/api/wordgraph?business_id=" + d.business_id)
        .awaitAll(function(error, data) {
            setLoading(false, function() {
                if (error) throw error;
                var metadata = data[0];
                var comments = data[1];
                var wordgraph = data[2];

                buildRestaurantDetail(metadata, comments);
                buildWordGraph(wordgraph);
            });
        });
    });
}

function buildRestaurantDetail(metadata, comments) {
    $(".sidepanel.right").append("<div id='restaurantdetail' class='sidepanel_container'></div>");
    detail = $("#restaurantdetail")

    function wrapInCell(string, additional_classes) {
        return `<div class='list-group-item ${additional_classes ? additional_classes.join(" ") : ""}'><div class='d-flex w-100 justify-content-between'>${string}</div></div>`;
    }

    function wrapData(title, detail, classes, subtext) {
        return wrapInCell(`<strong>${title}: </strong>${detail ? detail : ''}${(subtext != undefined ? `<p><i>${subtext}</i></p>` : '')}`, classes)
    }

    function roundMetric(metric) {
        return Math.round(metric * 100) / 100
    }

    $(detail).append(wrapInCell("<h4 style='text-align:center;'>" + metadata.name + "</h4>"));

    var addressString = `${metadata.address ? `${metadata.address},` : ''}
    ${metadata.city ? `${metadata.city},` : ''} ${metadata.state} ${metadata.postal_code}`;
    var addressUrl = `<a target="_blank" href="https://www.google.com/maps?q=${metadata.latitude},${metadata.longitude}">${addressString}</a>`
    $(detail).append(wrapData("Address", addressUrl));

    var fullStars = parseInt(metadata.star_metric);
    var hasHalfStar = (metadata.star_metric - fullStars) == 0.5
    $(detail).append(wrapData("Yelp rating", `<span class="star_rating"><span class="stars">${"★ ".repeat(fullStars)}</span> ${(hasHalfStar ? '½' : '')}</span>`));

    if (metadata.variance_metric) {
        $(detail).append(wrapData("Controversial score", roundMetric(metadata.variance_metric), [], "A measurement of the rating distribution variance"));
    }
    if (metadata.checkin_metric) {
        $(detail).append(wrapData("Check-ins", roundMetric(metadata.checkin_metric), [], "normalized by total number of reviews"));
    }
    if (metadata.funny_metric) {
        $(detail).append(wrapData("Funny reviews", roundMetric(metadata.funny_metric), [], "normalized by total number of reviews"));
    }
    if (metadata.cool_metric) {
        $(detail).append(wrapData("Cool reviews", roundMetric(metadata.cool_metric), [], "normalized by total number of reviews"));
    }
    if (metadata.useful_metric) {
        $(detail).append(wrapData("Useful reviews", roundMetric(metadata.useful_metric), [], "normalized by total number of reviews"));
    }

    if (metadata["1_star"] != undefined &&
    metadata["2_star"] != undefined &&
    metadata["3_star"] != undefined &&
    metadata["4_star"] != undefined &&
    metadata["5_star"] != undefined) {
        var variance = [
            metadata["1_star"],
            metadata["2_star"],
            metadata["3_star"],
            metadata["4_star"],
            metadata["5_star"],
        ];

        $(detail).append(wrapData("Rating distribution", "<div id='variance_rating'><svg width='100%' height='250px'></svg></div>", [], "based on reviews of the past 6 months"));
        buildVarianceBarGraph(variance);
    }

    if (comments.length > 0) {
        // order by sum(# cool, # helpful, # funny)
        $(detail).append(wrapData(`Comments (top ${comments.length})`, "", ["commentlabel"], "top comments picked from the sum of cool, helpful, funny votes of all time"));

        comments.forEach(function(commentData) {
            var commentCell = `<div class="star_rating for_comments"><span class="stars">${"★ ".repeat(commentData.stars)}</span></div>
            <p>${commentData.text}</p>`
            var cell = $(wrapInCell(commentCell, ["comment"])).data(commentData);
            $(detail).append(cell);
        });
    }
}

function buildVarianceBarGraph(data) {
    var svg = d3.select("#variance_rating svg")
    var svgWidth = +svg.style("width").replace("px", "");
    var svgHeight = +svg.style("height").replace("px", "");
    var yMax = d3.max(data);

    
    // http://bl.ocks.org/hahastudio/68426ce79aabe771ebfeb04cf15b60a6
    // https://stackoverflow.com/questions/39695967/d3-js-ordinal-scale-version-3-to-version-4
    var xScale = d3.scaleBand()
        .domain(d3.range(0, data.length))
        .range([0, svgWidth])
        .padding(0.1);

    var yScale = d3.scaleLinear()
        .range([0, svgHeight - 40])
        .domain([0, yMax]);

    var group = svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "bar-group");

    group.append("rect")
        .attr("class", "bar")
        .attr("x", function(d, i) {
            return xScale(i);
        })
        .attr("y", function(d) {
            return svgHeight - yScale(d) - 20
        })
        .attr("width", function(d, i) {
            return xScale.bandwidth()
        })
        .attr("height", function(d) {
            return yScale(d);
        })
        .attr("fill", "lightblue")
        .on("click", function(d, i) {
            filterComments(`${i + 1} ★`, function(data) {
                var currentStars = data.stars;
                return (i + 1) == currentStars;
            });
        });
    
    group.append("text")
        .text(function(d) {
            return d ? d : 0
        })
        .attr("x", function(d, i) {
            // https://stackoverflow.com/a/36230228
            return xScale(i) + xScale.bandwidth()/2; 
        })
        .attr("text-anchor", "middle")
        .attr("y", function(d) {
            return svgHeight - yScale(d) - 5 - 20
        });

    // Add the x Axis
    svg.append("g")
        .attr("transform", "translate(0," + (svgHeight - 20) + ")")
        .call(d3.axisBottom(xScale).tickFormat(function(d, i) {
            return `${d + 1} star${(d == 0 ? '' : 's')}`;
        }));
}

function resetCommentFilter() {
    $('.filtertag').remove();
    $("#restaurantdetail .comment").css({
        display: "block"
    })
}

function filterComments(tagLabel, shouldDispayComment) {
    $('.filtertag').remove();
    $(".commentlabel").append(`<div class='filtertag label label-info' data='${tagLabel}'>filter: ${tagLabel}</div>`);
    $("#restaurantdetail .comment").css({
        display: function() {
            return shouldDispayComment($(this).data()) ? "block": "none";
        }
    })

    $('.filtertag').click(function() {
        resetCommentFilter();
    });
    $(".filtertag").mouseenter(function() {
        $(this).removeClass('label-info');
        $(this).addClass('label-danger');
        $(this).html(`Remove filter: ${$(this).attr("data")}`);
    });
    
    $(".filtertag").mouseleave(function() {
        $(this).removeClass('label-danger');
        $(this).addClass('label-info');
        $(this).html(`filter: ${$(this).attr("data")}`)
    });
}




