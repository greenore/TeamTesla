var add_data,
    nested_data_tree;

// Size variables
var margin_tree = {
        top: 0,
        right: 20,
        bottom: 0,
        left: 20
    },
    width_tree = 500 - margin_tree.left - margin_tree.right,
    height_tree = 550 - margin_tree.top - margin_tree.bottom;


//Define default colorbrewer scheme
var quantiles = 9
var colorScheme = colorbrewer["Blues"];
var color_tree = d3.scale.quantile()
    .range(colorScheme[quantiles]);

// Path
treemap = d3.layout.treemap()
    .size([width_tree, height_tree])
    .sticky(false)
    .sort(function (a, b) {
        return a.fuel_economy_city - b.fuel_economy_city;
    })
    .round(true)
    .value(function (d) {
        return d.fuel_economy_city;
    });

// Select SVG

function clickFunction(element) {
        console.log(element);
        
        // HTML Txt
        //---------
        var htmlTxt = "<div class='col-sm-4' id='building_picture'>";
        htmlTxt += "<img src='img/" + element.image + "' alt='Image' class='image'></div>"
        htmlTxt += "<div class='col-sm-4' id='building_info'>"
        
                  
        htmlTxt += "<h4 id='building-title'>" + element.building + "</h4>"

        htmlTxt += "<table class='mytable'>"

        htmlTxt += "<tr><td>Height</td>"
        htmlTxt += "<td>" + element.height_m + "m" + "</td></tr>"

        htmlTxt += "<tr><td>City</td>"
        htmlTxt += "<td>" + element.city + "</td></tr>"

        htmlTxt += "<tr><td>Country</td>"
        htmlTxt += "<td>" + element.country + "</td></tr>"

        htmlTxt += "<tr><td>Floors</td>"
        htmlTxt += "<td>" +  element.floors + "</td></tr>"

        htmlTxt += "<tr><td>Completed</td>"
        htmlTxt += "<td>" +  element.completed + "</td></tr>"

        htmlTxt += "</tr></table></div></div>"
        document.getElementById("svg_right").innerHTML = htmlTxt
    }

chart_tree = d3.select("#myTreemap").append("rect")
    .style("width", (width_tree + margin_tree.left + margin_tree.right) + "px")
    .style("height", (height_tree + margin_tree.top + margin_tree.bottom) + "px")
    .style("left", margin_tree.left + "px")
    .style("top", margin_tree.top + "px");

var div_tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

queue()
    .defer(d3.csv, "data/electric_vehicles_by_model.csv")
    .await(function (error, data2) {

        //DataWrangling
        all_data = data2;

        // Convert numeric values to 'numbers'
        all_data.forEach(function (d) {
            d.engine_size = +d.engine_size;
            d.fuel_economy_city = +d.fuel_economy_city;
            d.fuel_economy_highway = +d.fuel_economy_highway;
            d.gas_fuel_economy_city = +d.gas_fuel_economy_city;
            d.model_year = +d.model_year;
            d.price = +d.price;
        });

        nested_data_tree = d3.nest()
            .key(function (d) {
                return d.id;
            })
            .rollup(function (v) {
                // leaf
                if (v.length === 1 && v[0].id.indexOf('/') === -1) {
                    return {
                        'size': parseInt(v[0].engine_size)
                    };
                }
                // node
                v.map(function (d) {
                    d.id = d.id.substring(d.id.indexOf('/') + 1);
                    return d;
                });
                return {
                    'children': level(v)
                };
            })
            .rollup(function (v) {
                return {
                    'manufacturer': v[0].manufacturer,
                    'model': v[0].model,
                    'model_year': v[0].model_year,
                    'price': v[0].price,
                    'category': v[0].category,
                    'fuel_economy_city': v[0].fuel_economy_city,
                    'fuel_economy_city_units': v[0].fuel_economy_city_units,
                    'fuel_economy_highway': v[0].fuel_economy_highway,
                    'fuel_economy_highway_units': v[0].fuel_economy_highway_units,
                    'gas_fuel_economy_city': v[0].gas_fuel_economy_city,
                    'gas_fuel_economy_highway': v[0].gas_fuel_economy_highway,
                    'fuel': v[0].fuel,
                    'engine_type': v[0].engine_type,
                    'engine_size': v[0].engine_size,
                    'units': v[0].units
                };
            })
            .entries(all_data)
            .map(function (d) {
                d.values['name'] = d.key;
                return d.values;
            });

        createVisTree(nested_data_tree);
    });

function createVisTree(data) {
    nested_data_tree = data

    // Get selected variable
    group = d3.select("#selected-variable")
        .property("value");
    console.log(group)
        // Filter
    data_filtered = nested_data_tree.filter(function (d) {
        return d.fuel === group;
    });

    root = {
        'name': 'electric_cars',
        'children': data_filtered
    };

    // Color domain
    var min_var = d3.min(root.children, function (d) {
        return d.engine_size;
    });
    var max_var = d3.max(root.children, function (d) {
        return d.engine_size;
    });
    color_tree.domain([0, max_var])

    // Treemap implementation
    // SELECT
    var node_tree = chart_tree.datum(root).selectAll("rect")
        .data(treemap.nodes);

    // ENTER
    node_tree.enter()
        .append("rect")
        .style("color", "black");


    // UPDATE
    node_tree.on("mouseover", function (d) {
            if (d.engine_size > 0) {
                d3.select(this)
                    .transition()
                    .duration(50)
                    .style("background-color", "rgb(250, 255, 106)")
                    .style("color", "#cb240f");

                div_tooltip.transition().duration(100)
                    .style("opacity", 0.8)
                div_tooltip.html(function () {
                        return "<strong>" + d.manufacturer + "</strong>" + "</br>" +
                            "Model: " + d.model + " - " + d.model_year + "</br>" +
                            "Category: " + d.category + "</br>" +
                            "Engine Size: " + d.engine_size + " " + d.units + "</br>" +
                            "Fuel Economy City: " + d.fuel_economy_city + " " + d.fuel_economy_city_units + "</br>" +
                            "Fuel Economy Highway: " + d.fuel_economy_highway + " " + d.fuel_economy_highway_units + "</br>" +
                            "Price: " + d.price
                    })
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 30) + "px");
            }
        })
        .on("mouseout", function (d) {
            if (d.engine_size > 0) {
                d3.select(this)
                    .transition()
                    .duration(50)
                    .style("background-color", color_tree(d.engine_size))
                    .style("color", "black");

                div_tooltip.transition().duration(300)
                    .style("opacity", 0);

            }
        })
        .on("click", function (d) {
            treeDiagram.openToModel(d.model); //TODO This should moved into a handler fct.... the treemap doesn't necessarily know about the treeDiagramm
        })
        .call(position_tree)
        .style("font-size", "0.7em")
        .transition()
        .duration(400)
        .ease("linear")
        .style("background-color", function (d) {
            return color_tree(d.engine_size);
        })
        .text(function (d) {
            return d.children ? null : d.manufacturer + ": " + d.model + " (" + d.engine_size + ")";
        })
        .attr("class", "node_tree");

    // EXIT
    node_tree.exit().remove();
};


// Position function
function position_tree() {
    this.style("left", function (d) {
            return d.x + "px";
        })
        .style("top", function (d) {
            return d.y + "px";
        })
        .style("width", function (d) {
            return Math.max(0, d.dx - 1) + "px";
        })
        .style("height", function (d) {
            return Math.max(0, d.dy - 1) + "px";
        });
}