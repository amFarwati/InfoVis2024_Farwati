class StackedBarChart {
    constructor(config, data = null) {
        this.config = {
            parent: config.parent,
            width: config.width || 500,
            height: config.height || 300,
            margin: config.margin || {top:10, right:10, bottom:50, left:50},
            xlabel: config.xlabel || '',
            ylabel: config.ylabel || 'CO2 Emissions',
            keys: config.keys || ['CC', 'EC', 'IC', 'RC', 'TC'],
            colors: config.colors || d3.schemeCategory10,
            labels: config.labels || {
                'CC': 'Coal',
                'EC': 'Electric',
                'IC': 'Industrial',
                'RC': 'Residential',
                'TC': 'Transport'
            }
        };
        this.data = data;
        this.init();
    }

    init() {
        let self = this;

        self.svg = d3.select(self.config.parent)
            .attr('width', self.config.width)
            .attr('height', self.config.height);

        self.chart = self.svg.append('g')
            .attr('transform', `translate(${self.config.margin.left}, ${self.config.margin.top})`);

        self.inner_width = self.config.width - self.config.margin.left - self.config.margin.right;
        self.inner_height = self.config.height - self.config.margin.top - self.config.margin.bottom;

        self.xscale = d3.scaleBand()
            .range([0, self.inner_width])
            .paddingInner(0.5)
            .paddingOuter(0.9);

        self.yscale = d3.scaleLinear()
            .range([self.inner_height, 0]);

        self.xaxis = d3.axisBottom(self.xscale)
            .ticks(['setosa','versicolor','virginica'])
            .tickSizeOuter(0);

        self.yaxis = d3.axisLeft( self.yscale )
            .ticks(5)
            .tickSize(5)
            .tickPadding(5)
            .tickFormat(d => d + "%");

        self.xaxis_group = self.chart.append('g')
            .attr('transform', `translate(0, ${self.inner_height})`);

        self.yaxis_group = self.chart.append('g');

        const xlabel_space = 40;
        self.svg.append('text')
            .attr('x', self.config.width / 2)
            .attr('y', self.inner_height + self.config.margin.top + xlabel_space)
            .text( self.config.xlabel );

        const ylabel_space = 50;
        self.svg.append('text')
            .attr('transform', `rotate(-90)`)
            .attr('y', self.config.margin.left - ylabel_space)
            .attr('x', -(self.config.height / 2))
            .attr('text-anchor', 'middle')
            .attr('dy', '1em')
            .text( self.config.ylabel );
    }

    async updateDataset(data) {
        let self = this;

        self.data = await data;
        self.update();
    }

    update() {
        let self = this;
        
        self.svg.selectAll(".legend").remove();
        self.svg.selectAll('.plot-title').remove();

        const formattedData = Object.entries(self.data)
            .filter(([key]) => key !== 'options')
            .map(([state, values]) => {
            return {
                state: state,
                ...values
            };
            });

        console.log(formattedData);
        const stack = d3.stack()
            .keys(self.config.keys);

        const stackedData = stack(formattedData);

        self.xscale.domain(formattedData.map(d => d.state));
        self.yscale.domain([0, 1]);

        self.render(stackedData);
    }

    render(stackedData) {
        let self = this;
        const t = d3.transition().duration(750);

        // Créer les groupes pour chaque série
        const series = self.chart.selectAll("g.series")
            .data(stackedData)
            .join("g")
            .attr("class", "series")
            .style("fill", (d, i) => self.config.colors[i]);

        // Créer les rectangles pour chaque barre
        series.selectAll("rect")
            .data(d => d)
            .join("rect")
            .attr("x", d => self.xscale(d.data.state))
            .attr("width", self.xscale.bandwidth())
            .transition(t)
            .attr("y", d => self.yscale(d[1]))
            .attr("height", d => self.yscale(d[0]) - self.yscale(d[1]));

        self.xaxis_group
            .transition(t)
            .call(self.xaxis)
            .selectAll("text")
            .style("text-anchor", "center");

        self.yaxis_group.transition(t).call(self.yaxis);

        const legendGroup = self.svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${self.config.width - 120}, 20)`);

        const legendItems = legendGroup.selectAll(".legend-item")
            .data(self.config.keys)
            .join("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(30, ${i*20})`);

        legendItems.append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .style("fill", (d, i) => self.config.colors[i]);

        legendItems.append("text")
            .attr("x", 25)
            .attr("y", 12)
            .style("font-size", "12px")
            .text(d => self.config.labels[d]);

        self.svg.append('text')
            .attr('class', 'plot-title')
            .style('font-size', '10px')
            .attr('x', self.config.width / 2)
            .attr('y', self.config.height)
            .attr('text-anchor', 'middle')
            .text(`Relative C02 emissions by Sectors in ${self.data["United States"].options.year}`);
    }
}
