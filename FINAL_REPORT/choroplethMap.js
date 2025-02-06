class ChoroplethMap {
    constructor(config, topojson, data = null) {
        this.config = {
            parent: config.parent,
            width: config.width || 800,
            height: config.height || 500,
            margin: config.margin || { top: 10, right: 10, bottom: 10, left: 10 },
            cscale: config.cscale || d3.scaleLinear()
            .range(["#4caf50","#fffff2","#d32f2f"])
            .interpolate(d3.interpolateRgb),
            onclick: config.onclick || function(){}
        };
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
    }

    async updateDataset(data) {
        this.data = await data;
        this.update();
    }

    update() {
        let self = this;

        let co2Map = new Map(self.data.map(d => [d['state-name'], d.value]));
        self.config.cscale.domain([0, d3.max(self.data, d => d.value)/2 , d3.max(self.data, d => d.value)]);
        self.render(co2Map);
    }

    render(co2Map) {
        let self = this;

        self.chart.selectAll(".state")
            .data(self.geojson.features)
            .join("path")
            .attr("class", "state")
            .attr("d", self.path)
            .attr("fill", d => {
                let co2 = co2Map.get(d.properties.name) || 0;
                return self.config.cscale(co2);
            })
            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .on("click", (event, d) => {
                const stateName = d.properties.name;
                const stateData = self.data.find(item => item['state-name'] === stateName);
                console.log(stateData.stateId);
                if (stateData) {
                    console.log(self.config.onclick);
                    self.config.onclick(stateData.stateId);
                }
            })
            .append("title")
            .text(d => `${d.properties.name}: CO2=${co2Map.get(d.properties.name) || 0}`);
    }
}