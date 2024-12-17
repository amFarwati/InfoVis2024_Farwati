class LineChart {
    constructor (config, data){
        this.config = {
            parent: config.parent,
            width: config.width || 256,
            height: config.height || 256,
            margin: config.margin || {top:10, right:10, bottom:10, left:10},
            invert_orientation: config.invert_orientation || false,
            draw_dots : config.draw_dots || false,
            draw_area : config.draw_area || false,
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
        self.xscale = d3.scaleLinear()
        .range([0,self.inner_width]);
    
        self.yscale = d3.scaleLinear()
        .range([self.inner_height,0]);


        // Initialize axes
        self.xaxis = d3.axisBottom( self.xscale )
            .ticks(3)
            .tickSize(5)
            .tickPadding(5);

        self.yaxis = d3.axisLeft( self.yscale )
            .ticks(3)
            .tickSize(5)
            .tickPadding(5);
    }

    update() {
        let self = this;
        console.log(self.data);
        console.log(d3.max(self.data, d => d.x),d3.max(self.data, d => d.y ))

        self.xscale.domain([0,d3.max( self.data, d => d.x )]);
        self.yscale.domain([0,d3.max( self.data, d => d.y )]);

        if (self.config.draw_area){
            self.line = d3.area()
            .x( d => {console.log(self.xscale(d.x)) ; return self.xscale(d.x)})
            .y1( d => {console.log(self.xscale(d.y)) ; return self.yscale(d.y)})
            .y0( self.config.invert_orientation ? self.inner_height : 0 );
        }else{
            self.line = d3.line()
            .x( d => self.xscale(d.x))
            .y( d => self.yscale(d.y));
        }

        // Draw the axis
        self.xaxis_group = self.chart.append('g')
        .attr('transform', `translate(0, ${self.inner_height})`)
        .call( self.xaxis );

        self.yaxis_group = self.chart.append('g')
        .call( self.yaxis );  

        self.render();
    }

    render() {
        let self = this;
            
        self.chart.append('path')
        .attr('d', self.line(self.data))
        .attr('stroke', 'black')
        .attr('fill', self.config.draw_area ? 'orange' : 'none');
        

        if (self.config.draw_area) {
            self.chart.append('path')
            .attr('fill', 'black');
        }

        if (self.config.draw_dots){
            self.chart.selectAll("circle")
            .data(self.data)
            .enter()
            .append("circle")
            .attr("cx", d => self.xscale( d.x ) )
            .attr("cy", d => self.yscale( d.y ) )
            .attr("r",  5 )
            .style("fill", "black");
        }
    }
}

d3.csv("https://amfarwati.github.io/InfoVis2024_Farwati/W08/data_task2.csv")
.then( (data) => {
        let formated_data = data.map( (d) => {return {x : +d.x, y : +d.y }});

        let config = {
            parent: '#drawing_region',
            width: 500,
            height: 500,
            margin: {top:50, right:50, bottom:60, left:50},
            draw_dots : true,
            draw_area : true,
            invert_orientation : true,
        };

        let config2 = {
            parent: '#drawing_region2',
            width: 500,
            height: 500,
            margin: {top:50, right:50, bottom:60, left:50},
            draw_dots : false,
            draw_area : false,
            invert_orientation : false,
        };


        const lineChart = new LineChart( config, formated_data );
        lineChart.update();

        const lineChart2 = new LineChart( config2, formated_data );
        lineChart2.update();
})
.catch( (error) => {
    window.alert(`ERROR : ${error}`);
    console.error(`ERROR : ${error}`);
} );