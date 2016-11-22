d3.queue()
    .defer(d3.csv,'data/co2_mm_mlo.csv')
    .defer(d3.csv,'data/all.csv')
    .await(function(error, co2, temps) {

    var margins = {top: 50, right: 50, bottom: 25, left: 40},
        screen_width = window.innerWidth - margins.right - margins.left,
        bar_width = 72,
        height = 5000,
        parse_date = d3.timeParse("%m/%Y"),
        parse_month = d3.timeParse("%m"),
        num_format = d3.format(".2f");

        /**
         *
         * CO2 chart
         */
    co2.forEach(function(d) {
        d.month = (d.month < 10) ? '0' + d.month : d.month;
        d.date = parse_date(d.month + '/' + d.year);
        d.interpolated = +d.interpolated;
    });

    var xScale = d3.scaleTime()
        .range([0, screen_width]);
    xScale.domain(d3.extent(co2, d3.f('date')));

    var yScale =  d3.scaleLinear()
        .range([0, height]);
    yScale.domain([d3.max(co2, d3.f('trend')), 310]);

    var xTempAxis = d3.axisBottom()
        .scale(xScale);

    var yTempAxis = d3.axisLeft()
        .scale(yScale);

    function drawGraph(i) {
        var svg = d3.select("#year-temp").append("svg");

        svg.attr("height", 300 + margins.top + margins.bottom)
            .attr("width", 200 + margins.right + margins.left)
            .attr("class", "carbon-dioxide")
            .attr("id", "graph_" + i);

        svg.append("g")
            .attr("class", "x axis")
            .translate([margins.left, height + margins.top]);

        d3.select("g.x").call(xTempAxis);

        svg.append("g")
            .attr("class", "y axis")
            .translate([margins.left, margins.top]);

        d3.select("g.y").call(yTempAxis);

        var co2_line =  d3.line()
            .curve(d3.curveNatural)
            .x(function(d) { return xScale(d.date); })
            .y(function(d) { return yScale(d.trend); });

        svg.append("path#co" + i)
            .translate([margins.left, margins.top]);

        d3.select("path#co" + i).transition()
            .duration(1000)
            .ease(d3.easeSinInOut)
            .attr("d", co2_line(co2));
    }


        /**
         *
         * Barcode charts
         */
        var tip_temp = d3.tip().attr('class', 'd3-tip').html(function(d) {
            return '<h4 class="text-center">' + stringDate(d.month) + '(' + d.year + ')</h4>' +
                '<ul class="list-unstyled">' +
                '<li>Historical Avg: ' + num_format(d.historic_avg) + ' degrees (C)</li>' +
                '<li>Actual Avg: ' + num_format(d.actual_avg) + ' degrees (C)</li>' +
                '<li>Departure from Avg: ' + num_format(d.anomaly) + ' degrees (C)</li>' +
                '</ul>';
        });

        temps.forEach(function(d) {
            d.date = parse_month(d.month);
            d.anomaly = +d.anomaly;
        });

        var sorted = _.sortByOrder(temps, ['year', 'month']);
        var land_ocean = sorted.filter(function(d) {
            return d.type === 'ocean_land';
        });

        var tempScale = d3.scaleTime()
            .range([0, bar_width]);
        tempScale.domain(d3.extent(land_ocean, d3.f('date')));
        var colors = ['#a50026','#d73027','#f46d43','#fdae61','#fee090','#ffffbf','#e0f3f8','#abd9e9','#74add1','#4575b4','#313695'].reverse();
        var strip_color = d3.scaleQuantize()
            .domain([-1.25, 1.25])
            .range(colors);

        drawLegend("#year-legend", strip_color);

        var grouped_land_ocean = d3.nest()
            .key(function(d) { return d.year; })
            .entries(land_ocean);

        grouped_land_ocean.forEach(function(d, i) {
            d3.select("#year-temp").append("div")
                .attr("class", "graph")
                .attr("id", "graphed" + i);

            d3.select("#graphed" + i)
                .append("h4")
                .attr("class", "text-center text-top")
                .text(d.key);
            drawStrip('#graphed' + i, tip_temp, d.values);
         //   drawGraph(i);
        });

        /**
         * Draw strip chart
         * @param selector
         * @param tip
         * @param data
         * @returns {string|CanvasPixelArray|function({data: (String|Blob|ArrayBuffer)})|Object[]|string}
         */
    function drawStrip(selector, tip, data) {
        var strip = d3.select(selector).append("svg")
                .attr("width", bar_width + margins.left + margins.right)
                .attr("height", 110)
                .attr("class", "svg")
                .call(tip);

        var add = strip.selectAll("bar")
                .data(data);

        add.enter()
            .append("rect")
            .merge(add)
            .attr("x", function(d) { return tempScale(d.date); })
            .attr("width", _.floor((bar_width / data.length), 3))
            .attr("y", 0)
            .attr("height", 80)
            .translate([margins.left, 0])
            .style("fill", function(d) { return strip_color(d.anomaly); })
            .on('mouseover touchstart', function(d) {
                d3.select(this).attr("height", 100);
                tip.show.call(this, d);
             })
            .on('mouseout touchend', function(d) {
                d3.select(this).attr("height", 80);
                tip.hide.call(this, d);
            });

        add.exit().remove();

        return add;
    }

    function drawLegend(selector, colors) {
        var class_name = selector.substr(1);
        var svg = d3.select(selector).append("svg")
                .classed("svg", true)
                .classed("legend", true)
                .attr("width", 1000)
                .attr("height", 75);

        svg.append("g")
            .attr("class", "legend-" + class_name)
            .attr("width", 1000)
            .translate([0, 20]);

        var legend = d3.legendColor()
                .shapeWidth(70)
                .orient('horizontal')
                .labelFormat(d3.format(".02f"))
                .scale(colors);

        svg.select(".legend-" + class_name)
            .call(legend);

        return svg;
    }
        /**
         * Get month as word
         * @param month
         * @returns {*}
         */
    function stringDate(month) {
        var month_names = ["January", "February", "March",
                "April", "May", "June",
                "July", "August", "September",
                "October", "November", "December"];

        var month_num = parseInt(month, 10) - 1;

        return month_names[month_num];
    }

    var rows = d3.selectAll('.row');
    rows.classed('opaque', false);
    rows.classed('hide', false);
    d3.selectAll('#load').classed('hide', true);
});