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
        self.xscale.domain( [xmin, xmax] );

        const ymin = d3.min( self.data, d => d.population );
        const ymax = d3.max( self.data, d => d.population );
        self.yscale.domain( [ymin, ymax] );

        self.render();
    }

    render() {
        let self = this;

        self.chart.selectAll("circle")
            .data(self.data)
            .enter()
            .append("circle")
            .attr("cx", d => self.xscale( d.population_proper ) )
            .attr("cy", d => self.yscale( d.population ) )
            .attr("r", d => 5 )
            .style("fill", "lightgrey");

        self.chart.selectAll("text")
            .data(self.data)
            .enter()
            .append("text")
            .attr("x",  d => self.xscale( d.population_proper ) )
            .attr("y", d => self.yscale( d.population ) )
            .attr("class", "label")
            .text(function(d){ return d.city; })

        self.yaxis_group 
            .call( self.yaxis );

        self.xaxis_group
            .call( self.xaxis );
    }
}
