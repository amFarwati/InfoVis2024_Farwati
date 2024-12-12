class BarChart {
    constructor (config, data){
        this.config = {
            parent: config.parent,
            width: config.width || 256,
            height: config.height || 256,
            margin: config.margin || {top:10, right:10, bottom:10, left:10},
            format: config.format || ',',
            type : config.type || 'linear',
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

        // Initialize axis scales
        self.xscale = self.config.type === 'log'? 
            d3.scaleLog()
            .range([0, self.inner_width])
            : 
            d3.scaleLinear()
            .domain([0, d3.max(self.data, d => d.value)])
            .range([0, self.inner_width]);
 
        self.yscale = d3.scaleBand()
                        .domain(self.data.map(d => d.label))
                        .range([0, self.inner_height])
                        .paddingInner(0.1) 

        // Initialize axes
        self.xaxis = d3.axisBottom( self.xscale )
            .ticks(5)
            .tickFormat(d3.format(self.config.format))
            .tickSizeOuter(0);

        self.yaxis = d3.axisLeft( self.yscale )
            .tickSizeOuter(0); 

        // Draw the axis
        self.xaxis_group = self.chart.append('g')
            .attr('transform', `translate(0, ${self.inner_height})`)
            .call( self.xaxis );

        self.yaxis_group = self.chart.append('g')
            .call( self.yaxis );   
        
    }

    update() {
        let self = this;

        const min = d3.min( self.data, d => d.value );
        const max = d3.max( self.data, d => d.value );  
        self.xscale.domain( [min,max] );
        //self.yscale.domain( [min, max] );

        self.render();
    }

    render() {
        let self = this;

        self.chart.selectAll("rect").data(self.data).enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", d => self.yscale(d.label))
        .attr("width", d => self.xscale(d.value))
        .attr("height", self.yscale.bandwidth());
    }
}

d3.csv("https://amfarwati.github.io/InfoVis2024_Farwati/W04/w04_task2.csv")
.then( (data) => {
        let formated_data = data.map( (d) => {return {label : d.city, value :d.population }});

        let config = {
            parent: '#drawing_region',
            width: 500,
            height: 256,
            margin: {top:50, right:50, bottom:60, left:50},
            format : '.2s',
            type : 'log'
        };

        const barChart = new BarChart( config, formated_data );
        barChart.update();
})
.catch( (error) => {
    window.alert(`ERROR : ${error}`);
    console.error(`ERROR : ${error}`);
} );