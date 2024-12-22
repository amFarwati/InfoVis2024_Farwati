class BarChart {
    constructor (config, data){
        this.config = {
            parent: config.parent,
            width: config.width || 356,
            height: config.height || 256,
            margin: config.margin || {top:10, right:10, bottom:10, left:10},
            orientation: config.orientation || 'horizontal',
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
    }

    update() {
        let self = this;

         // Initialize axis scales
         self.valueScale = self.config.type === 'log'? 
         d3.scaleLog()
         .range([self.config.orientation === 'horizontal' ? 0 : self.inner_height, self.config.orientation === 'horizontal' ? self.inner_width : 0])
         : 
         d3.scaleLinear()
         .range([self.config.orientation === 'horizontal' ? 0 : self.inner_height, self.config.orientation === 'horizontal' ? self.inner_width : 0]);
     
         self.labelScale = d3.scaleBand()
             .range([0, self.config.orientation === 'horizontal' ? self.inner_height : self.inner_width])
             .paddingInner(0.3);
 
         self.xscale = self.config.orientation === 'horizontal' ? self.valueScale : self.labelScale;
         self.yscale = self.config.orientation === 'horizontal' ? self.labelScale : self.valueScale;
 
         // Initialize axes
         if (self.config.orientation === 'horizontal') {
             self.xaxis = d3.axisBottom( self.xscale )
                 .ticks(5)
                 .tickFormat(d3.format(self.config.format))
                 .tickSizeOuter(0);
 
             self.yaxis = d3.axisLeft( self.yscale )
                 .tickSizeOuter(0); 
 
         }else{
             self.xaxis = d3.axisBottom( self.xscale )
                 .tickSizeOuter(0);
 
             self.yaxis = d3.axisLeft( self.yscale )
                 .ticks(5)
                 .tickFormat(d3.format(self.config.format))
                 .tickSizeOuter(0);  
         }

        if (self.config.orientation === 'horizontal') {
            self.xscale.domain([1, d3.max(self.data, d => d.value)]);
            self.yscale.domain(self.data.map(d => d.label));
        } else {
            self.yscale.domain([1, d3.max(self.data, d => d.value)]);
            self.xscale.domain(self.data.map(d => d.label));
        }

        self.chart.selectAll('g').remove();
        self.chart.selectAll("rect").remove();
    
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
        if (self.config.orientation === 'horizontal') {
            self.chart.selectAll("rect").data(self.data)
                .join("rect")
                .attr("x", 0)
                .attr("y", d => self.yscale(d.label))
                .attr("width", d => self.xscale(d.value))
                .attr("height", self.yscale.bandwidth());
        } else {
            self.chart.selectAll("rect").data(self.data)
                .join("rect")
                .attr("x", d => self.xscale(d.label))
                .attr("y",  d => self.yscale(d.value))
                .attr("width", self.xscale.bandwidth())
                .attr("height", d => self.inner_height - self.yscale(d.value));
        }
    }

    revert(){
        let self = this;
        self.data.reverse();
        self.update();
    }

    sort() {
        let self = this;
        self.sortAscending = !self.sortAscending;

        if (self.sortAscending) {
            self.data.sort((a, b) => a.value - b.value);
        } else {
            self.data.sort((a, b) => b.value - a.value);
        }
        self.update();
    }

    orientation(){
        let self = this;
        self.config.orientation = self.config.orientation === 'horizontal' ? 'vertical' : 'horizontal';
        self.update();
    }
}

d3.csv("https://amfarwati.github.io/InfoVis2024_Farwati/W10/data.csv")
.then( (data) => {
        let formated_data = data.map( (d) => {return {label : d.label, value : +d.value }});

        let config = {
            parent: '#drawing_region',
            margin: {top:50, right:50, bottom:60, left:70},
        };

        const barChart = new BarChart( config, formated_data );
        barChart.update();

        d3.select('#reverse')
        .on('click', d => {
            barChart.revert();
        });

        d3.select('#sort')
        .on('click', d => {
            barChart.sort();
        });

        d3.select('#orientation')
        .on('click', d => {
            barChart.orientation();
        });
})
.catch( (error) => {
    window.alert(`ERROR : ${error}`);
    console.error(`ERROR : ${error}`);
} );

