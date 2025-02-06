class ScatterPlot2_list {
    constructor(config, data = null, data2 = null) {
        this.config = {
            parent: config.parent,
            width: config.width || 256,
            height: config.height || 256,
            margin: config.margin || {top:10, right:10, bottom:10, left:10},
            xdata: config.xdata || '',
            ydata: config.ydata || '',
            xformat: config.xformat || d3.format('.2f'),
            yformat: config.yformat || d3.format('.2f'),
            xlabel: config.xlabel || '',
            ylabel: config.ylabel || '',
            cscale: config.cscale,
            color: config.color || "steelblue",
            ydata2: config.ydata2 || '',
            yformat2: config.yformat2 || d3.format('.2f'),
            ylabel2: config.ylabel2 || '',
            color2: config.color2 || "red",
            title: config.title || `Scatter Plot ${config.xdata} vs ${config.ydata}  | ${config.ydata2}`,
            type: config.type || 'scatter' // 'scatter' or 'line'
        }
        this.data = data;
        this.data2 = data2;
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

        self.yscale2 = d3.scaleLinear()
            .range([self.inner_height, 0]);

        self.xaxis = d3.axisBottom( self.xscale )
            .tickSize(5)
            .tickPadding(1)
            .tickFormat(self.config.xformat);

        self.yaxis = d3.axisLeft( self.yscale )
            .ticks(5)
            .tickSize(5)
            .tickPadding(5)
            .tickFormat(self.config.yformat);
        
        self.yaxis2 = d3.axisRight(self.yscale2)
            .ticks(5)
            .tickSize(5)
            .tickPadding(5)
            .tickFormat(self.config.yformat2);

        self.xaxis_group = self.chart.append('g')
            .attr('transform', `translate(0, ${self.inner_height})`);

        self.yaxis_group = self.chart.append('g');
    
        self.yaxis_group2 = self.chart.append('g')
        .attr('transform', `translate(${self.inner_width}, 0)`);

        const xlabel_space = 40;
        self.svg.append('text')
            .style('font-size', '12px')
            .attr('x', self.config.margin.left + self.inner_width / 2)
            .attr('y', self.inner_height + self.config.margin.top + xlabel_space)
            .attr('text-anchor', 'middle')
            .text( self.config.xlabel );

        const ylabel_space = 50;
        self.svg.append('text')
            .style('font-size', '12px')
            .attr('transform', `rotate(-90)`)
            .attr('y', self.config.margin.left - ylabel_space)
            .attr('x', -self.config.margin.top - self.inner_height / 2)
            .attr('text-anchor', 'middle')
            .attr('dy', '1em')
            .attr('fill', self.config.color)
            .text( self.config.ylabel );
        
        self.svg.append('text')
            .style('font-size', '12px')
            .attr('transform', `rotate(90)`)
            .attr('y', -self.config.width + self.config.margin.right - ylabel_space)
            .attr('x', self.config.margin.top + self.inner_height / 2)
            .attr('text-anchor', 'middle')
            .attr('dy', '1em')
            .attr('fill', self.config.color2)
            .text(self.config.ylabel2);
    }

    async updateDataset(data, data2=null) {
        let self = this;

        self.data = await data;
        if (data2 != null){
            self.data2 = await data2;
        }   

        self.config.title = `${self.data[0]["sector-name"]} and GDP by years of ${self.data[0]["state-name"]}`;

        self.update();
    }

    update() {
        let self = this;
        self.svg.selectAll('.plot-title').remove();
        self.svg.selectAll('title').remove();

        self.cvalue = d => d.state;
        self.xvalue = d => parseFloat(d[`${self.config.xdata}`]);
        self.yvalue = d => parseFloat(d[`${self.config.ydata}`]);

        const xmin = d3.min( self.data, self.xvalue );
        const xmax = d3.max( self.data, self.xvalue ); 
        self.xscale.domain( [xmin, xmax] );

        const ymin = d3.min( self.data, d => parseFloat(d[`${self.config.ydata}`]) );
        const ymax = d3.max( self.data, d => parseFloat(d[`${self.config.ydata}`]) );
        self.yscale.domain([ymin-1, ymax+1]);

        if (self.data2) {
            const ymin2 = d3.min(self.data2, d => parseFloat(d[self.config.ydata2]));
            const ymax2 = d3.max(self.data2, d => parseFloat(d[self.config.ydata2]));
            self.yscale2.domain([ymin2-1, ymax2+1]);
        }

        self.render();
    }

    render() {
        let self = this;
        const t = d3.transition().duration(750);
    
        self.xaxis_group.transition(t).call(self.xaxis);
        self.yaxis_group.transition(t).call(self.yaxis);
        self.yaxis_group2.transition(t).call(self.yaxis2);

        if (self.config.type === 'line') {
            const sortedData = self.data.sort((a, b) => self.xvalue(a) - self.xvalue(b));

            const line = d3.line()
                .x(d => self.xscale(self.xvalue(d)))
                .y(d => self.yscale(self.yvalue(d)));

            self.chart.selectAll("path.line")
                .data([self.data.sort((a, b) => self.xvalue(a) - self.xvalue(b))])
                .join("path")
                .attr("class", "line")
                .attr("fill", "none")
                .attr("stroke", self.config.color)
                .attr("stroke-width", 1.5)
                .transition(t)
                .attr("d", line);
            
            if (self.data2) {
                const line2 = d3.line()
                    .x(d => self.xscale(self.xvalue(d)))
                    .y(d => self.yscale2(d[self.config.ydata2]));
    
                self.chart.selectAll("path.line2")
                    .data([self.data2.sort((a, b) => self.xvalue(a) - self.xvalue(b))])
                    .join("path")
                    .attr("class", "line2")
                    .attr("fill", "none")
                    .attr("stroke", self.config.color2)
                    .attr("stroke-width", 1.5)
                    .transition(t)
                    .attr("d", line2);
            }
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
            .attr("fill", self.config.color);
    
        circles.append("title")
            .text(d => `Year: ${self.xvalue(d)} \nCO2 emission = ${self.yvalue(d)}`);
        
        if (self.data2) {
            const circles2 = self.chart.selectAll("circle.circle2")
            .data(self.data2)
            .join(
                enter => enter.append("circle")
                    .attr("class", "circle2")
                    .attr("r", 0)
                    .attr("cx", d => self.xscale(self.xvalue(d)))
                    .attr("cy", d => self.yscale2(self.yvalue(d))),
                update => update,
                exit => exit.remove()
            );
    
            circles2.transition(t)
                .attr("class", "circle2")
                .attr("r", 3)
                .attr("cx", d => self.xscale(self.xvalue(d)))
                .attr("cy", d => self.yscale2(self.yvalue(d)))
                .attr("fill", self.config.color2);

            circles2.append("title")
                .text(d => `Year: ${self.xvalue(d)} \nGDP = ${self.yvalue(d)}`);
        }

        self.svg.append('text')
            .attr('class', 'plot-title')
            .style('font-size', '10px')
            .attr('x', self.config.width / 2)
            .attr('y', self.config.margin.top)
            .attr('text-anchor', 'middle')
            .text(self.config.title);
        
    }
} 

