d3.queue()
    .defer(d3.csv,'data/co2_mm_mlo.csv')
    .defer(d3.csv,'data/all.csv')
    .await(function(error, co2, temps) {

    var margins = {top: 25, right: 50, bottom: 50, left: 40},
        co2_margins = {top: 25, right: 150, bottom: 50, left: 70},
      //  co2_screen_width = window.innerWidth - co2_margins.right - co2_margins.left,
        bar_width = 72,
        height = 5000,
      //  co2_height = 500,
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
        d.co2_date = parse_month(d.month);
        d.interpolated = +d.interpolated;
    });

   /* var xScale = d3.scaleTime()
        .range([0, co2_screen_width]);
    xScale.domain(d3.extent(co2, d3.f('date')));

    var yScale =  d3.scaleLinear()
        .range([0, co2_height]);
    yScale.domain([d3.max(co2, d3.f('trend')), 0]);

    var xTempAxis = d3.axisBottom()
        .scale(xScale);

    var yTempAxis = d3.axisLeft()
        .scale(yScale);

    function drawGraph(i) {
        var svg = d3.select("#co-two").append("svg");

        svg.attr("height", co2_height + co2_margins.top + co2_margins.bottom)
            .attr("width", co2_screen_width + co2_margins.right + co2_margins.left)
            .attr("class", "carbon-dioxide")
            .attr("id", "graph_" + i);

        svg.append("g")
            .attr("class", "x axis")
            .translate([co2_margins.left, co2_height + co2_margins.top]);

        d3.select("g.x").call(xTempAxis);

        svg.append("g")
            .attr("class", "y axis")
            .translate([co2_margins.left, co2_margins.top]);

        d3.select("g.y").call(yTempAxis);

        var co2_line =  d3.line()
            .curve(d3.curveNatural)
            .x(function(d) { return xScale(d.date); })
            .y(function(d) { return yScale(d.trend); });

        svg.append("path#co" + i)
            .translate([co2_margins.left, co2_margins.top]);

        d3.select("path#co" + i).transition()
            .duration(1000)
            .ease(d3.easeSinInOut)
            .attr("d", co2_line(co2));
    }

    drawGraph(0); */

        /**
         *
         * Barcode charts
         */
        var tip_temp = d3.tip().attr('class', 'd3-tip').html(function(d) {
            return '<h4 class="text-center">' + stringDate(d.month) + ' (' + d.year + ')</h4>' +
                '<ul class="list-unstyled">' +
                '<li class="text-center"><h4>Temperatures</h4></li>' +
                '<li>Historical Avg: ' + num_format(d.historic_avg) + ' degrees (C)</li>' +
                '<li>Actual Avg: ' + num_format(d.actual_avg) + ' degrees (C)</li>' +
                '<li>Departure from Avg: ' + num_format(d.anomaly) + ' degrees (C)</li>' +
                '</ul>';
        });

        var co2_tip = d3.tip().attr('class', 'd3-tip').html(function(d) {
            return '<h4 class="text-center">' + stringDate(d.month) + ' (' + d.year + ')</h4>' +
                '<ul class="list-unstyled">' +
                '<li class="text-center"><h4>CO<sub>2</sub> Levels</h4></li>' +
                '<li>Average: ' + num_format(d.interpolated) + ' parts per million</li>' +
                '<li>Long Term Trend: ' + num_format(d.trend) + ' parts per million</li>' +
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

        var co2Scale = d3.scaleTime()
            .range([0, bar_width]);
        co2Scale.domain(d3.extent(co2, d3.f('co2_date')));

        var colors = ['#67001f','#b2182b','#d6604d','#f4a582','#fddbc7','#f7f7f7','#d1e5f0','#92c5de','#4393c3','#2166ac','#053061'].reverse();
      //  var co2_colors = ['#fff7f3','#fde0dd','#fcc5c0','#fa9fb5','#f768a1','#dd3497','#ae017e','#7a0177','#49006a'];
        var co2_colors = ['#fcfbfd','#efedf5','#dadaeb','#bcbddc','#9e9ac8','#807dba','#6a51a3','#54278f','#3f007d'];
        var strip_color = d3.scaleQuantize()
            .domain([-1.25, 1.25])
            .range(colors);

        var co2_color = d3.scaleQuantize()
            .domain(d3.extent(co2, d3.f('interpolated')))
            .range(co2_colors);

        drawLegend("#year-legend", strip_color);
        drawLegend("#co2-legend", co2_color, true);

        var grouped_land_ocean = d3.nest()
            .key(function(d) { return d.year; })
            .entries(land_ocean);

        var grouped_co2 = d3.nest()
            .key(function(d) { return d.year; })
            .entries(co2);

        grouped_land_ocean.forEach(function(d, i) {
            d3.select("#year-temp").append("div")
                .attr("class", "graph")
                .attr("id", "graphed" + i);

            d3.select("#graphed" + i)
                .append("h4")
                .attr("class", "text-center text-top")
                .text(d.key);

            if(i >= 78) {
                drawStrip("#graphed" + i, co2_tip, grouped_co2[i - 78].values, true);
            }

            drawStrip("#graphed" + i, tip_temp, d.values);
        });

        var annotations_1893 = [
            {
                "xVal": "01",
                "yVal": 0,
                "path": "M59,100L42,75",
                "text": "Greatest below avg month",
                "textOffset": [17, 108]
            }
        ];

        var annotations_1979 = [
            {
                "xVal": "12",
                "yVal": 0,
                "path": "M67,96L103,78",
                "text": "First anomaly of 0.50C",
                "textOffset": [-6,107]
            }
        ];

        var annotations_1984 = [
            {
                "xVal": "12",
                "yVal": 0,
                "path": "M67,96L103,78",
                "text": "Most recent below avg month",
                "textOffset": [-6,107]
            }
        ];

        var annotations_1986 = [
            {
                "xVal": "05",
                "yVal": 0,
                "path": "M78,38L64,20",
                "text": "First month above 350ppm",
                "textOffset": [5, 50]
            }
        ];

        var annotations_1987 = [
            {
                "xVal": "11",
                "yVal": 0,
                "path": "M78,38L96,19",
                "text": "Long term trend tops 350ppm",
                "textOffset": [-1, 50]
            }
        ];

        var annotations_1998 = [
            {
                "xVal": "02",
                "yVal": 0,
                "path": "M68,96L48,75",
                "text": "First anomaly above 0.75C",
                "textOffset": [5, 108]
            }
        ];

        var annotations_2002 = [
            {
                "xVal": "04",
                "yVal": 0,
                "path": "M78,38L59,20",
                "text": "First month at 375ppm",
                "textOffset": [5, 50]
            }
        ];

        var annotations_2003 = [
            {
                "xVal": "04",
                "yVal": 0,
                "path": "M78,38L59,20",
                "text": "Long term trend tops 375ppm",
                "textOffset": [-1, 50]
            }
        ];

        var annotations_2014 = [
            {
                "xVal": "03",
                "yVal": 0,
                "path": "M78,38L59,23",
                "text": "First month above 400ppm",
                "textOffset": [5, 50]
            }
        ];

        var annotations_co2_2015 = [
            {
                "xVal": "03",
                "yVal": 0,
                "path": "M78,38L59,23",
                "text": "Long term trend tops 400ppm",
                "textOffset": [-1, 50]
            }
        ];

        var annotations_2015 = [
            {
                "xVal": "12",
                "yVal": 0,
                "path": "M59,100L103,76",
                "text": "1st anomaly above 1C",
                "textOffset": [17, 108]
            }
        ];

        var annotations_2016 = [
            {
                "xVal": "03",
                "yVal": 0,
                "path": "M65,99L54,77",
                "text": "Greatest above avg month",
                "textOffset": [17, 108]
            }
        ];

        annotate("#graphed13", annotations_1893, false);
        annotate("#graphed99", annotations_1979, true);
        annotate("#graphed104", annotations_1984, true);
        annotate("#graphed106", annotations_1986, false);
        annotate("#graphed107", annotations_1987, false);
        annotate("#graphed107", annotations_1987, true);
        annotate("#graphed118", annotations_1998, true);
        annotate("#graphed122", annotations_2002, false);
        annotate("#graphed123", annotations_2003, false);
        annotate("#graphed134", annotations_2014, false);
        annotate("#graphed135", annotations_co2_2015, false);
        annotate("#graphed135", annotations_2015, true);
        annotate("#graphed136", annotations_2016, true);

        function annotate(selector, annotations, has_co2) {
            var swoopy = d3.swoopyDrag()
                .x(function(d){ return d.xVal; })
                .y(function(d){ return d.yVal; })
                .draggable(0);

            swoopy.annotations(annotations);

            var which_svg = (has_co2) ? " svg + svg" : " svg";
            d3.select(selector + which_svg).append("g.annotations").call(swoopy);
        }

        /**
         * Draw strip chart
         * @param selector
         * @param tip
         * @param data
         * @returns {string|CanvasPixelArray|function({data: (String|Blob|ArrayBuffer)})|Object[]|string}
         */
    function drawStrip(selector, tip, data, co2) {
        var height, extended_height, scale, base_height, colors, field, date_type;
        if(co2 === undefined) {
            height = 80;
            extended_height = 100;
            base_height = 110;
            scale = tempScale;
            colors = strip_color;
            field = 'anomaly';
            date_type = 'date';
        } else {
            height = 25;
            extended_height = 35;
            base_height = 60;
            scale = co2Scale;
            colors = co2_color;
            field = 'interpolated';
            date_type = 'co2_date';
        }

        var strip = d3.select(selector).append("svg")
                .attr("width", bar_width + margins.left + margins.right)
                .attr("height", base_height)
                .attr("class", "svg")
                .call(tip);

        var add = strip.selectAll("bar")
                .data(data);

        add.enter()
            .append("rect")
            .merge(add)
            .attr("x", function(d) { return scale(d[date_type]); })
            .attr("width", _.floor((bar_width / data.length), 3))
            .attr("y", 0)
            .attr("height", height)
            .translate([margins.left, 0])
            .style("fill", function(d) { return colors(d[field]); })
            .on('mouseover touchstart', function(d) {
                d3.select(this).attr("height", extended_height)
                    .style("fill", "lightgray");
                tip.show.call(this, d);
             })
            .on('mouseout touchend', function(d) {
                d3.select(this).attr("height", height)
                    .style("fill", function(d) { return colors(d[field]); });
                tip.hide.call(this, d);
            });

        add.exit().remove();

        return add;
    }

    function drawLegend(selector, colors, wide) {
        var width = window.innerWidth;
        var size, orientation;

        if(width < 1000) {
            size = 40;
            orientation = 'vertical';
        }else if(wide !== undefined) {
            size = 90;
            orientation = 'horizontal';
        } else {
            size = 70;
            orientation = 'horizontal';
        }

        var legend_height = (orientation === 'vertical') ? 230 : 75;
        var legend_width = (width < 1000) ? 200 : 900;
        var class_name = selector.substr(1);
        var svg = d3.select(selector).append("svg")
                .classed("svg", true)
                .classed("legend", true)
                .attr("width", legend_width)
                .attr("height", legend_height);

        svg.append("g")
            .attr("class", "legend-" + class_name)
            .attr("width", legend_width)
            .translate([0, 20]);

        var legend = d3.legendColor()
                .shapeWidth(size)
                .orient(orientation)
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