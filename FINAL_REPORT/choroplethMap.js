class ChoroplethMap {
    constructor(config, topojson, data = null) {
        this.config = {
            parent: config.parent,
            width: config.width || 800,
            height: config.height || 500,
            margin: config.margin || { top: 10, right: 10, bottom: 10, left: 10 },
            cscale: config.cscale || d3.scaleLinear()
            .range(["#ffff4f","#d32f2f"])
            .interpolate(d3.interpolateRgb),
            onclick: config.onclick || function(){}
        };
        this.selectedState = 'California';
        this.topojson = topojson;
        this.data = data;
        this.init();
    }

    init() {
        let self = this;

        self.svg = d3.select(self.config.parent)
            .attr("width", self.config.width)
            .attr("height", self.config.height);

        self.chart = self.svg.append("g");
        self.geojson = topojson.feature(self.topojson, self.topojson.objects.units);

        self.projection = d3.geoAlbersUsa()
            .fitSize([self.config.width, self.config.height], self.geojson);

        self.path = d3.geoPath().projection(self.projection);

        ////
        self.legend = self.svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(20, ${self.config.height - 60})`);

        self.legendWidth = 200;
        self.legendHeight = 10;

        self.legendScale = d3.scaleLinear()
        .range([0, self.legendWidth]);

        self.legendData = d3.range(0, self.legendWidth, 1);
    }

    async updateDataset(data) {
        this.data = await data;
        this.update();
    }

    update() {
        let self = this;

        const d_max = d3.max(self.data, d => parseFloat(d.value));

        self.legendScale.domain([0,d_max]);

        self.chart.selectAll(".state title").remove();
        self.legend.selectAll("*").remove();

        let co2Map = new Map(self.data.map(d => [d['state-name'], d.value]));
        self.config.cscale.domain([0, d_max]);
        self.render(co2Map);
    }

    render(co2Map) {
        let self = this;

        self.legend.selectAll("rect")
        .data(self.legendData)
        .join("rect")
        .attr("x", d => d)
        .attr("y", 0)
        .attr("width", 1)
        .attr("height", self.legendHeight)
        .attr("fill", d => self.config.cscale(self.legendScale.invert(d)));

        self.legendAxis = d3.axisBottom(self.legendScale)
            .ticks(5)
            .tickFormat(d3.format(".1s"));
        
        self.legend.append("g")
            .attr("transform", `translate(0, ${self.legendHeight})`)
            .call(self.legendAxis);

        self.legend.append("text")
            .attr("x", self.legendWidth / 2)
            .attr("y", -5)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text("CO2 Emissions (million metric tons)");

        self.chart.selectAll(".state")
            .data(self.geojson.features)
            .join("path")
            .attr("class", "state")
            .attr("d", self.path)
            .attr("fill", d => {
                let co2 = co2Map.get(d.properties.name) || 0;
                return self.config.cscale(co2);
            })
            .attr("stroke", d => d.properties.name === self.selectedState ? "#faf" : "#fff")
            .attr("stroke-width", d => d.properties.name === self.selectedState ? 4 : 1)
            .on("click", (event, d) => {
                if (self.selectedState === d.properties.name) {
                    return;
                }

                self.chart.selectAll(".state")
                    .attr("stroke-width", 1)
                    .attr("stroke", "#fff");

                self.selectedState = d.properties.name;
                d3.select(event.currentTarget)
                    .attr("stroke-width", 4)
                    .attr("stroke", "#faf");


                const stateName = d.properties.name;
                const stateData = self.data.find(item => item['state-name'] === stateName);
                if (stateData) {
                    self.config.onclick(stateData.stateId, stateName);
                }
            })
            .append("title")
            .text(d => `${d.properties.name}: CO2=${co2Map.get(d.properties.name) || 0}`);       
    }
}