class PieChart {
    constructor (config, data){
        this.config = {
            parent: config.parent,
            width: config.width || 256,
            height: config.height || 256,
            margin: config.margin || {top:10, right:10, bottom:10, left:10},
            inner_radius: config.inner_radius || 0,
            color: config.color || 'black',
            color_gradient: config.color_gradient || false,
        }

        this.data = data;
        this.init();
    }

    init() {
        let self = this;

        self.radius = Math.min( self.config.width, self.config.height ) / 2;

        self.svg = d3.select( self.config.parent )
                .attr('width', self.config.width)
                .attr('height', self.config.height)
                .append('g')
                .attr('transform', `translate(${self.config.width/2}, ${self.config.height/2})`);
        

        self.inner_width = self.config.width - self.config.margin.left - self.config.margin.right;
        self.inner_height = self.config.height - self.config.margin.top - self.config.margin.bottom;
    }

    update() {
        let self = this;
  
        self.pie = d3.pie()
        .value( d => d.value );

        self.arc = d3.arc()
        .innerRadius(self.config.inner_radius*self.radius)
        .outerRadius(self.radius);

        self.colorScale = d3.scaleLinear()
        .domain([0, d3.max(self.data, d => d.value)])
        .range([self.config.color, 'red']);

        self.render();
    }

    render() {
        let self = this;
            
        self.svg.selectAll('pie')
        .data( self.pie(self.data) )
        .enter()
        .append('path')
        .attr('d', self.arc)
        .attr('fill', self.config.color_gradient? d => self.colorScale(d.data.value):self.config.color)
        .attr('stroke', 'white')
        .style('stroke-width', '2px');

        self.svg.selectAll('text')
        .data(self.pie(self.data))
        .enter()
        .append('text')
        .attr('transform', function(d) {
            let c = self.arc.centroid(d);  
            return 'translate(' + c + ')'; 
        })
        .attr('dy', '.35em') 
        .attr('text-anchor', 'middle') 
        .style('fill', 'white') 
        .text(d => d.data.label);

    }
}

d3.csv("https://amfarwati.github.io/InfoVis2024_Farwati/W08/data.csv")
.then( (data) => {
        let formated_data = data.map( (d) => {return {label : d.city, value : +d.population }});

        let config = {
            parent: '#drawing_region',
            width: 500,
            height: 500,
            margin: {top:50, right:50, bottom:60, left:50},
            inner_radius : 0.5,
            color : 'green',
            color_gradient : true,
        };

        const pieChart = new PieChart( config, formated_data );
        pieChart.update();

})
.catch( (error) => {
    window.alert(`ERROR : ${error}`);
    console.error(`ERROR : ${error}`);
} );