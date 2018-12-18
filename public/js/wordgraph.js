function buildWordGraph(resultData) {

    var nodes = resultData["nodes"];
    var links_data = resultData["linked_data"];

    // Compute the distinct nodes from the links.
    Object.keys(links_data).forEach(function(key) {
        var link = links_data[key];
    // links_data.forEach(function(link) {
        link.source = nodes[link.source] ||
            (nodes[link.source] = {name: link.source});
        link.target = nodes[link.target] ||
            (nodes[link.target] = {name: link.target});
        
        link.source.weight = link.source.weight + 1 || 1
        link.target.weight = link.target.weight + 1 || 1
        
        link.target.sentimentTotal = link.target.sentimentTotal + link.sentiment_score || link.sentiment_score

        // For filtering comments
        if (link.target.reviewIdList == undefined) {
            link.target.reviewIdList = new Set()
        }
        link.target.reviewIdList.add(link.review_id)

        if (link.source.reviewIdList == undefined) {
            link.source.reviewIdList = new Set()
        }
        link.source.reviewIdList.add(link.review_id)


        // For performance mode
        if (link.target.sourceIdList == undefined) {
            link.target.sourceIdList = new Set();
        }
        link.target.sourceIdList.add(link.source.name);
    });

    nodes_data = []

    for (var key in nodes) {
        currentNode = nodes[key];
        nodes_data.push(currentNode)
    }

    var svg = d3.select("#wordgraph svg"),
    width = +svg.node().getBoundingClientRect().width,
    height = +svg.node().getBoundingClientRect().height;
    var radius = 10; 
    

    //set up the simulation and add forces  
    var simulation = d3.forceSimulation()
                        .nodes(nodes_data);
                                
    var link_force =  d3.forceLink(links_data)
                            .id(function(d) { return d.name; })
                            .distance(function(d) {
                                var distance = 50;
                                if (d.target.sourceIdList != undefined && d.target.sourceIdList > 1) {
                                    return distance * d.target.sourceIdList.size
                                } else {
                                    var multiplier = ($("#filternodes").is(':checked') == false) ? 1.5 : 1
                                    return distance + d.source.weight * multiplier
                                }
                            });            
            
    var charge_force = d3.forceManyBody()
        .strength(-100); 
        
    var center_force = d3.forceCenter(width / 2, height / 2);  
                        
    simulation
        .force("charge_force", charge_force)
        .force("center_force", center_force)
        .force("links",link_force);

            
    //add tick instructions: 
    simulation.on("tick", tickActions);

    //add encompassing group for the zoom 
    var g = svg.append("g")
        .attr("class", "wordgraphgroup");


    
    //draw lines for the links 
    var link = g.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links_data)


    var line = link.enter().append("line")
        .filter(function(d){ 
            var sourceIdList = d.target.sourceIdList
            if ($("#filternodes").is(':checked') == false) return true;
            if (sourceIdList != undefined && sourceIdList.size > 1) {
                return true
            }
            return false
        })
        .attr("stroke-width", 2)
        .style("stroke", function(d) {
            return (d.source.stroke ? d.source.stroke : "black")
        });        

    //draw circles for the nodes 
    var node = g.append("g")
            .attr("class", "nodes") 
            .selectAll("circle")
            .data(nodes_data)
            .enter().append("g")
            .filter(function(d){ 
                if ($("#filternodes").is(':checked') == false) return true;
                if (d.sourceIdList != undefined && d.sourceIdList.size > 1 || d.rating) {
                    return true
                }
                return false
            })
            .on("click", function(d) {
                filterComments(d.name, function(data) {
                    var currentReviewId = data.review_id;
                    return d.reviewIdList != undefined ? d.reviewIdList.has(currentReviewId) : false;
                });
            });
        
            
    
    node.append("circle")
        .attr("r", function(d) {
            if (d.rating) {
                var multiplier = ($("#filternodes").is(':checked') == false) ? 0.5 : 0.2
                return d.weight * multiplier + radius
            } else {
                return radius
            }
            
        })
        .attr("fill", function(d) {
            if (d.rating) {
                return d.fill
            }
            var sentiment_rating_average = Math.round(d.sentimentTotal / d.weight * 100) / 100
            // https://www.color-hex.com/color-palette/35021
            if (sentiment_rating_average < 0.33) {
                return "#cc3232"
            } 
            // else if (sentiment_rating_average >= 0.2 && sentiment_rating_average < 0.4) {
            //     return "#db7b2b"
            // } 
            else if (sentiment_rating_average >= 0.33 && sentiment_rating_average < 0.6667) {
                return "#e7b416"
            } 
            // else if (sentiment_rating_average >= 0.6 && sentiment_rating_average < 0.8) {
            //     return "#99c140"
            // } 
            else {
                return "#2dc937"
            }
        })
        .attr("stroke", function(d) {
            return ( d.stroke ? d.stroke : "black" )
        });
    
    node.append("text")
        .text(function(d) {
            if (d.rating) {
                return d.name;
            }
            var sentiment_rating_average = Math.round(d.sentimentTotal / d.weight * 100) / 100
            return `${d.name} ${sentiment_rating_average}`
        })
        .attr("font-size", function(d) {
            if (d.rating) {
                return 12
            } else {
                return d.weight * 0.9 +  12
            }
        })
        .attr("x", function(d) {
            if (d.rating) {
                return 0
            }
            return 15
        })
        .attr("y", function(d) {
            return 0
        })
        .attr("text-anchor", function(d) {
            if (d.rating) {
                return "middle"
            }
        })
        .attr("alignment-baseline", function(d) {
                return "central"
        })

    node.call(
        d3.drag()
        .on("start", drag_start)
        .on("drag", drag_drag)
        .on("end", drag_end)
    )


    //add zoom capabilities 
    var zoom_handler = d3.zoom()
        .scaleExtent([0.2, 50])
        .on("zoom", zoom_actions);

    zoom_handler(svg);     

    /** Functions **/

    //Drag functions 
    //d is the node 
    function drag_start(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    //make sure you can't drag the circle outside the box
    function drag_drag(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function drag_end(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        if (!d.rating == true) {
            d.fx = null;
            d.fy = null;
        }
        
    }

    //Zoom functions 
    function zoom_actions(){
        var transform = d3.event.transform
        g.attr("transform", transform)
    }

    function tickActions() {
        //update circle positions each tick of the simulation 
        // node
        //     .attr("cx", function(d) { return d.x; })
        //     .attr("cy", function(d) { return d.y; });
            
        node.attr("transform", 
        function(d) { 
            return "translate("+ 
                d.x +","+ 
                d.y +")";
            }
        )

        //update link positions 
        line
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });
    }

}