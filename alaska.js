var clicks = 0;

var width = 960,
    height = 1100;

var formatNumber = d3.format(",d");

var path = d3.geo.path()
    .projection(null);

var color = updateShades();

// A position encoding for the key only.
var x = d3.scale.linear()
    .domain([0, 5100])
    .range([0, 480]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .tickSize(13)
    .tickValues(color.domain())
    .tickFormat(function (d) {
        return d >= 100 ? formatNumber(d) : null;
    });

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

var g = svg.append("g")
    .attr("class", "key")
    .attr("transform", "translate(440,40)");

g.selectAll("rect")
    .data(color.range().map(function (d, i) {
        return {
            x0: i ? x(color.domain()[i - 1]) : x.range()[0],
            x1: i < color.domain().length ? x(color.domain()[i]) : x.range()[1],
            z: d
        };
    }))
    .enter().append("rect")
    .attr("height", 8)
    .attr("x", function (d) {
        return d.x0;
    })
    .attr("width", function (d) {
        return d.x1 - d.x0;
    })
    .style("fill", function (d) {
        return d.z;
    });

g.call(xAxis).append("text")
    .attr("class", "caption")
    .attr("y", -6)
    .text("Population per square mile");

d3.json("al.json", function (error, ca) {
    if (error) throw error;

    var tracts = topojson.feature(ca, ca.objects.tracts);

    // Clip tracts to land.
    svg.append("defs").append("clipPath")
        .attr("id", "clip-land")
        .append("path")
        .datum(topojson.feature(ca, ca.objects.counties))
        .attr("d", path);

    // Group tracts by color for faster rendering.
    svg.append("g")
        .attr("class", "tract")
        .attr("clip-path", "url(#clip-land)")
        .selectAll("path")
        .data(d3.nest()
            .key(function (d) {
                return color(d.properties.population / d.properties.area * 2.58999e6);
            })
            .entries(tracts.features.filter(function (d) {
                return d.properties.area;
            })))
        .enter().append("path")
        .style("fill", function (d) {
            return d.key;
        })
        .attr("d", function (d) {
            return path({
                type: "FeatureCollection",
                features: d.values
            });
        });

    // Draw county borders.
    svg.append("path")
        .datum(topojson.mesh(ca, ca.objects.counties, function (a, b) {
            return a !== b;
        }))
        .attr("class", "county-border")
        .attr("d", path);
});

d3.select(self.frameElement).style("height", height + "px");

function showBorders() {
    if (clicks % 2 == 0) {
        return 1;
    } else {
        return 0;
    }
}

function updateShades() {
    clicks += 1;

    if (clicks % 2 == 0) {
        return d3.scale.threshold()
            .domain([1, 10, 50, 100, 500, 1000, 2000, 5000])
            .range(["#fff7ec", "#fee8c8", "#fdd49e", "#fdbb84", "#fc8d59", "#ef6548", "#d7301f", "#b30000", "#7f0000"]);

    } else {
        return d3.scale.threshold()
            .domain([1, 10, 50, 100, 500, 1000, 2000, 5000])
            .range(["#ffb3ff", "#ff80ff", "#ff4dff", "#ff1aff", "#e600e6", "#b300b3", "#800080", "#4d004d", "#330033"]);
    }
}