class ScatterPlot {
    constructor(config, data = null) {
        this.config = {
            parent: config.parent,
            width: config.width || 256,
            height: config.height || 256,
            margin: config.margin || {top:10, right:10, bottom:10, left:10},
            xdata: config.xdata || '',
            ydata: config.ydata || '',
            xlabel: config.xlabel || '',
            ylabel: config.ylabel || '',
            cscale: config.cscale,
            color: config.color || "steelblue",
            title: config.title || `Scatter Plot ${config.xdata} vs ${config.ydata}`,
            type: config.type || 'scatter' // 'scatter' or 'line'
        }
        this.data = data;
        this.init();
    }

    init() {
        let self = this;

        self.svg = d3.select( self.config.parent )
            .attr('width', self.config.width)
            .attr('height', self.config.height);

        self.chart = self.svg.append('g')
            .attr('transform', `translate(${self.config.margin.left}, ${self.config.margin.top})`);

        self.inner_width = self.config.width - self.config.margin.left - self.config.margin.right;
        self.inner_height = self.config.height - self.config.margin.top - self.config.margin.bottom;

        self.xscale = d3.scaleLinear()
            .range( [0, self.inner_width] );

        self.yscale = d3.scaleLinear()
            .range( [self.inner_height, 0] );

        self.xaxis = d3.axisBottom( self.xscale )
            .tickSize(5)
            .tickPadding(1)
            .tickFormat(d3.format("d"));

        self.yaxis = d3.axisLeft( self.yscale )
            .tickSize(5)
            .tickPadding(5);

        self.xaxis_group = self.chart.append('g')
            .attr('transform', `translate(0, ${self.inner_height})`);

        self.yaxis_group = self.chart.append('g');

        const xlabel_space = 40;
        self.svg.append('text')
            .style('font-size', '12px')
            .attr('x', self.config.margin.left + self.inner_width / 2)
            .attr('y', self.inner_height + self.config.margin.top + xlabel_space)
            .attr('text-anchor', 'middle')
            .text( self.config.xlabel );

        const ylabel_space = 45;
        self.svg.append('text')
            .style('font-size', '12px')
            .attr('transform', `rotate(-90)`)
            .attr('y', self.config.margin.left - ylabel_space)
            .attr('x', -self.config.margin.top - self.inner_height / 2)
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

        self.cvalue = d => d.state;
        self.xvalue = d => parseFloat(d[`${self.config.xdata}`]);
        self.yvalue = d => parseFloat(d[`${self.config.ydata}`]);

        const xmin = d3.min( self.data, self.xvalue );
        const xmax = d3.max( self.data, self.xvalue );      
        self.xscale.domain( [xmin, xmax] );

        const ymin = d3.min( self.data, self.yvalue );
        const ymax = d3.max( self.data, self.yvalue );
        self.yscale.domain( [ymin-1, ymax+1] );

        self.render();
    }

    render() {
        let self = this;
        const t = d3.transition().duration(750);
    
        self.xaxis_group.transition(t).call(self.xaxis);
        self.yaxis_group.transition(t).call(self.yaxis);
    
        if (self.config.type === 'line') {
            const sortedData = self.data.sort((a, b) => self.xvalue(a) - self.xvalue(b));

            const line = d3.line()
                .x(d => self.xscale(self.xvalue(d)))
                .y(d => self.yscale(self.yvalue(d)));

            self.chart.selectAll("path.line")
                .data([sortedData])
                .join("path")
                .attr("class", "line")
                .attr("fill", "none")
                .attr("stroke", self.config.color)
                .attr("stroke-width", 1.5)
                .transition(t)
                .attr("d", line);
        }
    
        const circles = self.chart.selectAll("circle")
            .data(self.data)
            .join(
                enter => enter.append("circle")
                    .attr("r", 0)
                    .attr("cx", d => self.xscale(self.xvalue(d)))
                    .attr("cy", d => self.yscale(self.yvalue(d))),
                update => update,
                exit => exit.remove()
            );
    
        circles.transition(t)
            .attr("r", 3)
            .attr("cx", d => self.xscale(self.xvalue(d)))
            .attr("cy", d => self.yscale(self.yvalue(d)))
            .attr("fill", d => self.config.type === 'line' ? self.config.color : self.config.cscale(self.cvalue(d)));
    
        circles.select("title").remove();
        circles.append("title")
            .text(d => `Year: ${self.xvalue(d)} \nCO2 emission = ${self.yvalue(d)}`);

        self.svg.append('text')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .attr('x', self.config.width / 2)
            .attr('y', self.config.margin.top)
            .attr('text-anchor', 'middle')
            .text(self.config.title);
        
    }
}
