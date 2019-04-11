/**
 * Created by haesa on 2/12/2019.
 */

// Initialize variables to hold data (JSON)
var hData = null;
var raceData = null;
var picData = null;
var data = null;

// Initialize arrays to hold states in sorted orders (alphabetically, by extent of gerrymander, and party percent)
var nameArray = [];  //Contains names of states alphabetically
var gerryArray = []; //Contains names of states by most gerrymandered to least
var gerryList = []
var partyArray = [];
var partyList = [];

// Toggles for our sortings
var nameBit = 0;
var gerryBit = 1;
var partyBit = 1;

// Margins
var xMargin = 0;
var yMarginSpacing = 50;

/** Read JSON file and create the dot plot for our application
 *  Starting point of the application
 */
function gerry_graphs() {
//var margin = {top: 100, right: 275, bottom: 40, left: 275};

    var width = 960,
        height = 760;

    var svg = d3v4.select(".house")
        .attr("width", width)
        .attr("height", height)
        .append("g");

    d3v4.queue()
        .defer(d3v4.csv, "./Data/house_gerry.csv")
        .defer(d3v4.csv, './Data/house_results.csv')
        .defer(d3v4.json, './Data/file_paths.json')
        .defer(d3v4.json, '/Data/state-pics.json')
        .awaitAll(ready);

    function ready(error, results) {
        data = results[0];
        hData = results[1]
        raceData = results[2]
        picData = results[3]
        var districts = createInitialDistrictHash(hData);
        createInitialGrid(data, districts, raceData, picData);
    }
}

/**
 * Creates initial hashmap containing state objects and within those objects the various districts and their election results
 * @param hData Data depicting house election results
 * @returns districts Object containing state, party, district, and who won that district
 */
function createInitialDistrictHash(hData) {
    var districts = {};
    var state = '';
    var innerState = '';
    var innerCounter = 0;
    var currState = null;
    for (var a = 0; a < hData.length; a++) {
        if (hData[a]['State'] !== state) {
            innerCounter = a;
            innerState = hData[innerCounter]['State']
            currState = hData[a]['State'];
            districts[innerState] = {};
            districts[innerState]['Republicans'] = [];
            districts[innerState]['Democrats'] = [];
            while (innerCounter < 435 && innerState == hData[innerCounter]['State']) {
                if (hData[innerCounter]['Winner'] == 'Gop') {
                    districts[innerState]['Republicans'].push(hData[innerCounter]['District'])
                } else if (hData[innerCounter]['Winner'] == 'Dem') {
                    districts[innerState]['Democrats'].push(hData[innerCounter]['District'])
                }
                innerCounter = innerCounter + 1
            }
            state = hData[a]['State']
        }
    }
    return districts;
}

/**
 * Creates circles, x-axis, and titles for the left visualization block
 * @param data Complete election data
 * @param districts Subset of election data that is formatted around the districts
 * @param raceData Subset of election data that is
 * @param picData Contains urls of pictures to be used in vis
 */
function createInitialGrid(data, districts, raceData) {
        //Set up circles and x and y values
        createDistractMap();

        var cRadius = 3;

        //Add district data to stte data
        for (var q = 0; q < data.length; q++) {
            data[q]['Districts'] = districts[data[q]['State']]
        }

        //X Scale
        //var x_axis = d3v4.scaleBand().rangeRoundBands([0, 150]);
        var datas = ["-50", "-25", "0", "25", "50"];

        var xScale = d3v4.scaleBand()
            .domain(datas.map(function(entry){
                return entry;
            }))
            .range([0, 150]);
        var axis = d3v4.axisBottom(xScale);

        //Create state groups
        for (var x = 0; x < data.length; x++) {

            if (data[x]['State'].includes(' ')) {
                data[x]['State'] = data[x]['State'].split(' ')[0] + '_' + data[x]['State'].split(' ')[1]
            }

            //Initial SVG container for each state
            var svgContainer = d3v4.select(".gerry").append('g').attr('class', data[x]['State']).attr("transform", "translate(" + (0) + "," +  0 + ")");  //Transform xMargin pixels to the right, no y manipulation
            var currState = data[x]['State']

            //Set up state text names
            svgContainer.append("text")
                .attr("x", 130)
                .attr("y", 0)
                .attr("dy", "1em")
                .attr('font-size', 15)
                .text(function() { return data[x]['State'].replace('_', ' ') });
            for (var f = 0; f < data[x]['Districts']['Democrats'].length; f++) {
                data[x]['Districts']['Democrats'][f] = [currState, data[x]['Districts']['Democrats'][f]]
            }
            for (var f = 0; f < data[x]['Districts']['Republicans'].length; f++) {
                data[x]['Districts']['Republicans'][f] = [currState, data[x]['Districts']['Republicans'][f]]
            }
            //Blue Dots
            svgContainer.selectAll('circle').data(data[x]['Districts']['Democrats']).enter().append('circle')
                .style('fill', '#4575b4')
                .attr('r', cRadius)
                .attr('cx', function(d, i) {
                    return 30 + 10* parseInt(i%5)
                })
                .attr('cy', function (d, i) {
                    return 30 + 10 * parseInt(i/5)
                })
                .on("mouseover", function(d) {
                    $( "#image-id" ).css({'visibility': 'visible'})
                    updateMap(d[0], d[1]);  // d[0] == name, d[1] = district
                    $( "#state-info" ).html('District: ' +  d[1] + ' <br>Representative: ' + raceData[d[0]][d[1]]['Dem Candidate'] + '<br>Popular vote: ' + raceData[d[0]][d[1]]['Dem Total']);
                    var url = getPic(d[1], raceData[d[0]][d[1]]['Dem Candidate'])
                    if (url != null) {
                        $( "#image-id" ).attr('src', url)
                    } else {
                        $( "#image-id" ).attr('src', 'http://www.osiwa.org/wp-content/uploads/2019/02/Blank-Person.png')
                    }
                })
                .on("mouseout", function(d) {
                    revertDistrictColor(d[0], d[1])
                });

            //x_axis
            svgContainer.append("g").attr('class', data[x]['State']).attr("transform", "translate(" + (80) + "," + 35+ ")").call(axis)

            //vertical line over x_axis
            var calculatedPercentage = data[x]['Gop % of Votes'] * 200;
            svgContainer.append('g').append('line')
                .attr('class', 'xAxis')
                .attr("x1", 150)
                .attr("y1", 165)
                .attr("x2", 150)
                .attr("y2", 185)
                .attr('stroke', 'purple')
                .attr('stroke-width', 2)
                .attr("transform", "translate(" + (calculatedPercentage - 95) + "," + -140 + ")").call(axis);

            //Red Dots
            svgContainer.append('g').selectAll('circle').data(data[x]['Districts']['Republicans']).enter().append('circle')
                .style('fill', 'red')
                .attr('r', cRadius)
                .attr('cx', function (d, i) {
                    return 250 + 10 * (parseInt(i%5))
                })
                .attr('cy', function (d, i) {
                    return 30 + 10 * (parseInt(i/5))
                })
                .on("mouseover", function(d) {
                    $( "#image-id" ).css({'visibility': 'visible'})
                    updateMap(d[0], d[1]);  
                    $( "#state-info" ).html('District: ' +  d[1] + ' <br>Representative: ' + raceData[d[0]][d[1]]['Gop Candidate'] + '<br>Popular vote: ' + raceData[d[0]][d[1]]['Gop Total']);
                    var url = getPic(d[1], raceData[d[0]][d[1]]['Gop Candidate'])
                    if (url != null) {
                        $( "#image-id" ).attr('src', url)
                    } else {
                        $( "#image-id" ).attr('src', 'http://www.osiwa.org/wp-content/uploads/2019/02/Blank-Person.png')
                    }
                })
                .on("mouseout", function(d) {
                    revertDistrictColor(d[0], d[1])
                });

            nameArray.push(data[x]['State'])
            gerryArray.push(Math.abs(parseFloat(data[x]['Gop % of Votes']) - parseFloat(data[x]['Gop % of Seats'])))
            partyArray.push(calculatedPercentage)
        }

        gerryList = sortArray(gerryArray)
        partyList = sortArray(partyArray)
        initTransformation();
}

/**
 * Searches for picture given district and name of representative
 * @param dist
 * @param name
 * @returns {*}
 */
function getPic(dist, name) {
    for (var x in picData) {
        if (picData[x]['name'] == name && picData[x]['district'] == dist) {
            return picData[x]['url'];
        }
    }
    return null;
}

/**
 * Sorts array in descending order
 * @param arrays
 * @returns {Array}
 */
function sortArray(arrays) {
    var arr = arrays;
    var retArr = []
    var highest = -1;
    var highestIndex = -1
    for (var n = 0; n < arr.length; n++) {
        for (var m = 0; m < arr.length; m++) {
            if(arr[m] > highest) {
                highest = arr[m];
                highestIndex = m;
            }
        }
        highest = -1;
        arr[highestIndex] = -2;
        retArr.push(highestIndex)
    }
    return retArr;
}

/**
 * Modifies positon of left grid
 */
function initTransformation() {
    var totalHeight = 0;
    for (var z = 0; z < nameArray.length; z++) {
        d3v4.select('.' + nameArray[z]).attr("transform", "translate(" + 0 + "," + totalHeight+ ")");
        totalHeight = d3v4.select('.' + nameArray[z])['_groups'][0][0].getBBox().height + totalHeight
    }
    return;
}

/**
 * Sorts the left grid by name
 */
function sortByName() {
    var totalHeight = 0;
    if (nameBit) {
        for (var z = 0; z < nameArray.length; z++) {
            d3v4.select('.' + nameArray[z]).transition().duration(250).attr("transform", "translate(" + xMargin + "," + (totalHeight) + ")")
            totalHeight = d3v4.select('.' + nameArray[z])['_groups'][0][0].getBBox().height + totalHeight
        }
    } else {
        totalHeight = 50;
        for (var c = nameArray.length; c >= 0; c--) {
            d3v4.select('.' + nameArray[c]).transition().duration(250).attr("transform", "translate(" + xMargin + "," + (totalHeight - yMarginSpacing) + ")")
            if ( nameArray[c] != null) {
                totalHeight = d3v4.select('.' + nameArray[c])['_groups'][0][0].getBBox().height + totalHeight
            } else {
                totalHeight = totalHeight;
            }
        }
    }
    nameBit = !nameBit;
}

/**
 * Sorts left grid by extent of gerrymandering
 */
function sortByGerry() {
    var totalHeight = 0;
    if (gerryBit) {
        for (var z = 0; z < nameArray.length; z++) {
            d3v4.select('.' + nameArray[gerryList[z]]).transition().duration(250).attr("transform", "translate(" + xMargin + "," + totalHeight+ ")")
            totalHeight = d3v4.select('.' + nameArray[z])['_groups'][0][0].getBBox().height + totalHeight
            if (nameArray[gerryList[z]] == 'Nebraska' ) {
                totalHeight = totalHeight - 50;
            }
        }
    } else {
        totalHeight = 0;
        for (var c = nameArray.length; c >= 0; c--) {
            d3v4.select('.' + nameArray[gerryList[c]]).transition().duration(250).attr("transform", "translate(" + xMargin + "," + (totalHeight - yMarginSpacing) + ")")
            if (nameArray[gerryList[c]] != null) {
                totalHeight = d3v4.select('.' + nameArray[gerryList[c]])['_groups'][0][0].getBBox().height + totalHeight
            } else {
                totalHeight = totalHeight + 50;
            }
        }
    }
    gerryBit = !gerryBit;
}

/**
 * Sort left grid by party percent
 */
function sortByParty() {
    var totalHeight = 0;
    if (partyBit) {
        for (var z = 0; z < nameArray.length; z++) {
            //console.log(nameArray[partyList[z]])
            d3v4.select('.' + nameArray[partyList[z]]).transition().duration(250).attr("transform", "translate(" + xMargin + "," + totalHeight+ ")")
            totalHeight = d3v4.select('.' + nameArray[z])['_groups'][0][0].getBBox().height + totalHeight
            if (nameArray[partyList[z]] == 'Oklahoma') {
                totalHeight = totalHeight - 50;
            }
        }
    } else {
        for (var c = nameArray.length; c >= 0; c--) {
            //console.log(nameArray[partyList[c]])
            d3v4.select('.' + nameArray[partyList[c]]).transition().duration(250).attr("transform", "translate(" + xMargin + "," + (totalHeight - yMarginSpacing) + ")")
            if (nameArray[partyList[c]] != null) {
                totalHeight = d3v4.select('.' + nameArray[partyList[c]])['_groups'][0][0].getBBox().height + totalHeight
            } else {
                totalHeight = totalHeight + 50;
            }
        }
    }
    partyBit = !partyBit;
}
