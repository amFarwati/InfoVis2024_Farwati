class ScatterPlot {

    constructor( config, data ) {
        this.config = {
            parent: config.parent,
            width: config.width || 256,
            height: config.height || 256,
            margin: config.margin || {top:10, right:10, bottom:10, left:10},
            format: config.format || ',',
            type: config.type || 'linear'
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

        self.xscale = self.config.type === 'log'? 
            d3.scaleLog().range( [0, self.inner_width] ) : d3.scaleLinear().range( [0, self.inner_width] );

        self.yscale =  self.config.type === 'log'? 
            d3.scaleLog().range( [self.inner_height, 0] ) : d3.scaleLinear().range( [self.inner_height, 0] );

        self.xaxis = d3.axisBottom( self.xscale )
            .ticks(3)
            .tickSize(5)
            .tickFormat(d3.format(self.config.format))
            .tickPadding(5);

        self.yaxis = d3.axisLeft( self.yscale )
            .ticks(5)
            .tickSize(5)
            .tickFormat(d3.format(self.config.format))
            .tickPadding(1);

        self.xaxis_group = self.chart.append('g')
            .attr('transform', `translate(0, ${self.inner_height})`);

        self.yaxis_group = self.chart.append('g');
    }

    update() {
        let self = this;

        const xmin = d3.min( self.data, d => d.population_proper );
        const xmax = d3.max( self.data, d => d.population_proper );
        const x_margin = (xmax - xmin) * 0.025;
        self.xscale.domain( [xmin-x_margin, x_margin+xmax] );

        const ymin = d3.min( self.data, d => d.population );
        const ymax = d3.max( self.data, d => d.population );
        const y_margin = (ymax - ymin) * 0.005;
        self.yscale.domain( [ymin-y_margin, y_margin+ymax] );

        self.render();
    }

    render() {
        let self = this;

        //title
        self.chart.append("text")
            .attr("x", self.inner_width / 2)
            .attr("y", -self.config.margin.top / 2)
            .attr("class", "title")
            .text("Population fct of Proper Population for major japanese cities");

        //points
        self.chart.selectAll("circle")
            .data(self.data)
            .enter()
            .append("circle")
            .attr("cx", d => self.xscale( d.population_proper ) )
            .attr("cy", d => self.yscale( d.population ) )
            .attr("r", 5 )
            .style("fill", "lightgrey")
            .on('mouseover', (e,d) => {
                d3.select(e.target)
                .attr("r", 10 )
                .style("fill", "red");

                d3.select('#tooltip')
                    .style('opacity', 1)
                    .html(`<div class="tooltip-label">${d.city}</div> </br> population : ${d.population} </br> proper population : ${d.population_proper}`);
            })
            .style("fill", "red")
            .on('mousemove', (e) => {
                const padding = 10;
                d3.select('#tooltip')
                    .style('left', (e.pageX + padding) + 'px')
                    .style('top', (e.pageY + padding) + 'px');
            })
            .on('mouseleave', (e) => {
                d3.select(e.target)
                .attr("r", 5 )
                .style("fill", "lightgrey");
                
                d3.select('#tooltip')
                    .style('opacity', 0);
            })
            .style("fill", "lightgrey");

        //point labels
        self.chart.selectAll("text")
            .data(self.data)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x",  d => self.xscale( d.population_proper )-10 )
            .attr("y", d => self.yscale( d.population )-10 )
            .text(function(d){ return d.city; });

        //y-axis label
        self.chart.append('text')
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -self.inner_height / 2)
            .attr("y", -self.config.margin.left + 20)
            .text("Population");
        //y-axis min and max values
        self.chart.append("text")
            .attr("class", "min_value")
            .attr("transform", "rotate(-90)")
            .attr("x",  -self.inner_height)
            .attr("y", -self.config.margin.left +20)
            .text(d3.min(self.data, d => 'min '+d.population));

        self.chart.append("text")
            .attr("class", "max_value")
            .attr("transform", "rotate(-90)")
            .attr("x",  -50)
            .attr("y", -self.config.margin.left +20)
            .text(d3.max(self.data, d => 'max '+d.population));
            
        //x-axis label
        self.chart.append('text')
            .attr("class", "axis-label")
            .attr("x", self.inner_width / 2)
            .attr("y", self.inner_height + self.config.margin.bottom - 10)
            .text("Population Proper");

        //x-axis min and max values
        self.chart.append("text")
            .attr("class", "min_value")
            .attr("x", 0)
            .attr("y", 0)
            .attr('transform', `translate(0, ${self.inner_height + self.config.margin.bottom - 10})`)
            .text(d3.min(self.data, d => 'min '+d.population_proper));

        self.chart.append("text")
            .attr("class", "max_value")
            .attr("x", self.inner_width-50)
            .attr("y", 0)
            .attr('transform', `translate(0, ${self.inner_height + self.config.margin.bottom - 10})`)
            .text(d3.max(self.data, d => 'max '+d.population_proper));
        
        self.xaxis_group
            .call( self.xaxis ); 

        self.yaxis_group 
            .call( self.yaxis ); 
    }
}

d3.csv("https://amfarwati.github.io/InfoVis2024_Farwati/W06/w06_task1.csv")
    .then( data => {
        data.forEach( d => { d.population_proper = +d.population_proper; d.population = +d.population; });

        var config = {
            parent: '#drawing_region',
            width: 800,
            height: 800,
            margin: {top:50, right:50, bottom:60, left:80},
            format : '.2s',
            type : 'log'
        };

        const scatter_plot = new ScatterPlot( config, data );
        scatter_plot.update();
    })
    .catch( error => {
        console.log( error );
    });

