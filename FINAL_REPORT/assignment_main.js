API_KEY = "d5tLAabW0f4dSArK6vleFRxKWOySQXkmdbv7rKL0"

const getRequestURL = (API_KEY = "d5tLAabW0f4dSArK6vleFRxKWOySQXkmdbv7rKL0", sectorFilter = [], stateFilter = [], start=1970, end=2022) => {
    console.log(sectorFilter, stateFilter)
    _sectorFilter = sectorFilter.reduce((acc,d) => acc+`&facets[sectorId][]=${d}`, '')
    _stateFilter = stateFilter.reduce((acc,d) => acc+`&facets[stateId][]=${d}`, '')
    return `https://api.eia.gov/v2/co2-emissions/co2-emissions-aggregates/data/?frequency=annual&data[0]=value${_sectorFilter}${_stateFilter}&start=${start}&end=${end}&sort[0][column]=period&sort[0][direction]=desc&offset=0&length=5000&api_key=${API_KEY}`
}

const fetchData = async (url) => {
    try {
        const response = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.response?.data || [];
    } catch (error) {
        console.error('Fetch error:', error);
        return [];
    }
};

CO2_EMISSION_FIELD = ["CC","IC","TC","TT","EC","RC"]

const color_scale = d3.scaleOrdinal( d3.schemeCategory10 );
color_scale.domain(['setosa','versicolor','virginica']);

const linkChoroplethScatter = async (stateId, updateFct) => {
    console.log("Fetching data for state:", stateId);
    const url = getRequestURL(API_KEY, [CO2_EMISSION_FIELD[0]], [stateId], 1970, 2022);
    const data = await fetchData(url);
    updateFct(data.filter(d => d.fuelId == 'TO'));
};

const linkYearChoropleth = async (year, updateFct) => {
    console.log("Fetching data for year:", year);
    const url = getRequestURL(API_KEY, [CO2_EMISSION_FIELD[0]], [], year, year);
    const data = await fetchData(url);
    updateFct(data.filter(d => d.fuelId == 'TO'));
};


///////////////////////////////////////////////////////////////
d3.json("https://d3-geomap.github.io/d3-geomap/topojson/countries/USA.json")
.then(topojson => {
    
    const scatterPlot = new ScatterPlot( {
        parent: '#scatterplot',
        width: 500,
        height: 300,
        margin: {top:10, right:10, bottom:50, left:50},
        title: 'CO2 over years',
        xdata: 'period',
        ydata: 'value',
        xlabel: 'Years',
        ylabel: 'C02 (million metric tons)',
        color: 'red',
        type: 'line'
    });

    const choropleth = new ChoroplethMap(
        {
        parent: "#map",
        width: 700,
        height: 700,
        onclick: (stateId) => {linkChoroplethScatter(stateId, (e) => scatterPlot.updateDataset(e))}
        }, 
        topojson
    );

    linkChoroplethScatter('CA',(e) => scatterPlot.updateDataset(e));
    linkYearChoropleth(2022, (e) => choropleth.updateDataset(e));
});




///////////////////////////////////////////////////////////////
/* fetch(getRequestURL(API_KEY, [CO2_EMISSION_FIELD[0]],["CA"],1970,2022), {
    method: 'GET',
    headers: {
        'Accept': 'application/json'
    }
})
.then(response => {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
})
.then(data => {
    if (data.response && data.response.data) {
        console.log("scatterplot", data.response.data);
        
        scatter_plot.update();
    }
})
.catch(error => {
    console.error('Erreur:', error);
}); */
///////////////////////////////////////////////////////////////
/* fetch(getRequestURL(API_KEY, [CO2_EMISSION_FIELD[0]],[],2022), {
    method: 'GET',
    headers: {
        'Accept': 'application/json'
    }
})
.then(response => {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
})
.then(data => {
    if (data.response && data.response.data) {
        console.log(data.response.data);
        const bar_chart = new BarChart( {
            parent: '#barchart',
            width: 256,
            height: 256,
            margin: {top:10, right:10, bottom:50, left:50},
            cscale: color_scale
        }, sampleData );
        bar_chart.update();
    }
})
.catch(error => {
    console.error('Erreur:', error);
}); */
