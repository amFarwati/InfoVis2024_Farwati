API_KEY = "d5tLAabW0f4dSArK6vleFRxKWOySQXkmdbv7rKL0"

const getRequestURL = (API_KEY = "d5tLAabW0f4dSArK6vleFRxKWOySQXkmdbv7rKL0", sectorFilter = [], stateFilter = [], start=1997, end=2022) => {
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

const linkChoroplethScatter = async (stateId, sector, updateFct) => {
    console.log("Fetching data for state:", stateId);
    const url = getRequestURL(API_KEY, [sector], [stateId], 1997, 2022);
    const data = await fetchData(url);
    updateFct(data.filter(d => d.fuelId == 'TO'));
};

const linkYearChoropleth = async (year,sector, updateFct) => {
    console.log("Fetching data for year:", year);
    const url = getRequestURL(API_KEY, [sector], [], year, year);
    const data = await fetchData(url);
    updateFct(data.filter(d => d.fuelId == 'TO' && d['state-name'] != "United States"));
};

const gpd_filtered = (gdp, filters) => {
    return gdp.filter(d => {
        return filters.every(_filter => {
            switch(_filter.op) {
                case '===': return d[_filter.name] === _filter.value;
                case '!=': return d[_filter.name] != _filter.value;
                case '>': return d[_filter.name] > _filter.value;
                case '<': return d[_filter.name] < _filter.value;
            }
            d[_filter.name] === _filter.value
        });
    });
};

///////////////////////////////////////////////////////////////

d3.json("https://d3-geomap.github.io/d3-geomap/topojson/countries/USA.json")
.then(topojson => {
    d3.csv("https://amfarwati.github.io/InfoVis2024_Farwati/FINAL_REPORT/SAGDP1__ALL_AREAS_1997_2023.csv")
    .then(GDP => {

        current_year = 2022;
        current_sector = 'CC';
        current_state = 'CA';

        formated_gdp = GDP.filter(d => d.Description == "Real GDP (millions of chained 2017 dollars) 1/")
            .reduce((acc, d) => {
                const dic = [];
                for(let i = 1997; i < 2024; i++) {
                    dic.push({
                        'sector-name': d.GeoName,
                        'value-units': "Billions of chained 2017 dollars",
                        'period': i,
                        'value': parseInt(d[i]/10)/100
                    });
                }
                return [...acc, ...dic];
            }, []);

///////////////////////////////////////////////////////////////

        const scatterPlot = new ScatterPlot2_list( {
            parent: '#scatterplot',
            width: 500,
            height: 300,
            margin: {top:10, right:50, bottom:50, left:50},
            xdata: 'period',
            ydata: 'value',
            xformat: d3.format("d"),
            yformat: d3.format(".2s"),
            xlabel: 'Years',
            ylabel: 'C02 (million metric tons)',
            color: 'red',
            ydata2: 'value',
            yformat2: d3.format(".2s"),
            ylabel2: 'GDP (Billions of chained 2017 dollars)',
            color2: "green",
            title:"CO2 Emissions and GDP regarding years",
            type: 'line'
        });

        const choropleth = new ChoroplethMap(
            {
            parent: "#map",
            width: 500,
            height: 500,
            onclick: (stateId, stateName) => {
                current_state = stateId;
                linkChoroplethScatter(current_state, current_sector, (e) => scatterPlot.updateDataset(e, gpd_filtered(formated_gdp, 
                    [{
                        name: 'sector-name',
                        value: stateName,
                        op:"==="
                        },
                        {
                        name: 'period',
                        value: 2023,
                        op:"<"
                        }]
                    )))
                }
            }, 
            topojson
        );
///////////////////////////////////////////////////////////////

        linkYearChoropleth(current_year, current_sector, (e) => choropleth.updateDataset(e));
        linkChoroplethScatter(current_state, current_sector,(e) => scatterPlot.updateDataset(e, gpd_filtered(formated_gdp, [{
            name: 'sector-name',
            value: 'California',
            op:"==="
            },
            {
            name: 'period',
            value: 2023,
            op:"<"
        }])));

        const slider = document.getElementById('yearSlider');
        const yearValue = document.getElementById('yearValue');
        const radioButtons = document.getElementsByName('sector');
        
        slider.oninput = function() {
            yearValue.textContent = this.value;
            current_year = this.value;
            linkYearChoropleth(current_year, current_sector, (e) => choropleth.updateDataset(e));
        }

        radioButtons.forEach(radio => {
            radio.onchange = function() {
                current_sector = this.value;
                linkYearChoropleth(current_year, current_sector, (e) => choropleth.updateDataset(e));
                linkChoroplethScatter(current_state, current_sector, (e) => scatterPlot.updateDataset(e,null));
            }
        });
    })
});

///////////////////////////////////////////////////////////////
