/**
 * Created by haesa on 3/21/2019.
 */

var states = ['Alabama','Alaska','American Samoa','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','District of Columbia','Federated States of Micronesia','Florida','Georgia','Guam','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Marshall Islands','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Northern Mariana Islands','Ohio','Oklahoma','Oregon','Palau','Pennsylvania','Puerto Rico','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virgin Island','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];
var svg = null;

for (var c = 0; c < states.length; c++) {
    if (states[c].includes(' '))
    states[c] = states[c].split(' ')[0] + '_' + states[c].split(' ')[1]
}


function createDistractMap() {
    $(".states").empty();

    var width = 1060,
        height = 600;

    var projection = d3.geo.albersUsa()
        .scale(2480)
        .translate([width / 2, height / 2]);

    var path = d3.geo.path()
        .projection(projection);

    svg = d3v4.select(".states")
        .attr("width", width)
        .attr("height", height)

    queue()
        .defer(d3.json, './Data/us.json')
        .defer(d3v4.json, './Data/us-congress-113.json')
        .await(ready);

    function ready(error, us, congress) {
        if (error) throw error;

        svg.append("defs").append("path")
            .attr("id", "land")
            .datum(topojson.feature(us, us.objects.land))
            .attr("d", path)


        svg.append("clipPath")
            .attr("id", "clip-land")
            .append("use")
            .attr("xlink:href", "#land")


        svg.append("g")
            .attr("class", "districts")
            .attr("clip-path", "url(#clip-land)")
            .selectAll("path")
            .data(topojson.feature(congress, congress.objects.districts).features)

            .enter().append("path")
            .attr("d", path)
            .attr("id", function(d) {
                return getId(d);
            })
            .attr("fill", function(d) {
                var nameOfState = getId(d)
                var stringNum = (d.id).toString();
                var numbers = stringNum.substring(stringNum.length-2, stringNum.length)
                //Check state and district number for party and color red or blue
                var party = getParty(nameOfState, numbers)
                if (party == 'GOP') {
                    return '#d6604d'
                } else if (party == 'DEM') {
                    return '#4393c3'
                } else {
                    return '#f7f7f7'
                }
            })
            .append("title")
            .text(function(d) {
                return d.id; })
        svg.append("path")
            .attr("class", "district-boundaries")
            .datum(topojson.mesh(congress, congress.objects.districts, function(a, b) { return a !== b && (a.id / 1000 | 0) === (b.id / 1000 | 0); }))
            .attr("d", path)
            .style('opacity', 0);

        for (var x = 0; x < 407; x++) {
            var name = states[x];
            if (name == undefined) {
                continue;
            }
            name = '#' + name.split(' ').join('_');
            //Excluding non-states
            if (name != '#American_Samoa' && name != '#District_of' && name != '#Federated_States' && name != '#Guam' && name != '#Marshall_Islands' && name != '#Northern_Mariana' && name != '#Palau' && name != '#Puerto_Rico' && name != '#Virgin_Island') {

                var xSVG = d3.select('.states').node().getBoundingClientRect().x
                var ySVG = d3.select('.states').node().getBoundingClientRect().y;

                var hSVG = d3.select('.states').node().getBoundingClientRect().height;
                var xElem = d3.select(name).node().getBoundingClientRect().x
                var yElem = d3.select(name).node().getBoundingClientRect().y
                if (name == '#California') {
                    svg.selectAll(name).attr('transform', 'translate(' + ((xSVG - xElem) + 350) + ',' + ((ySVG - yElem) + hSVG / 2 + 140) + ')')
                } else if (name == '#Texas') {
                    svg.selectAll(name).style('opacity', 0).attr('transform', 'translate(' + ((xSVG - xElem) + 300) + ',' + ((ySVG - yElem) + hSVG / 2 + 60) + ')')
                } else if (name == '#Nevada') {
                    svg.selectAll(name).style('opacity', 0).attr('transform', 'translate(' + ((xSVG - xElem) + 300) + ',' + ((ySVG - yElem) + hSVG / 2 + 50) + ')')
                } else {
                    svg.selectAll(name).style('opacity', 0).attr('transform', 'translate(' + ((xSVG - xElem) + 300) + ',' + ((ySVG - yElem) + hSVG / 2 - 70 ) + ')')
                }
            }
            svg.selectAll('#' + states[x]).style('opacity', 0)  //0 is hidden

        }
    }
}

function updateMap(name, currDistrict) {
    for (var x = 0; x < 407; x++) {
        svg.selectAll('#' + states[x]).style('opacity', 0)  //0 is hidden
    }
    var origin = name;
    name = '#' + name.split(' ').join('_');

    svg.selectAll(name).style('opacity', 1)

    //Fills all of the districts in a state and highlights the selected state
    svg.selectAll(name).attr('fill', function(d) {
        var nameOfState = getId(d)
        var stringNum = (d.id).toString();
        var numbers = stringNum.substring(stringNum.length - 2, stringNum.length)
        //Check state and district number for party and color red or blue
        var party = getParty(nameOfState, numbers)
        if (party == 'GOP') {
            if (nameOfState == origin && currDistrict == 'D' + numbers) {
                return '#b2182b'
            }
            return '#d6604d'
        } else if (party == 'DEM') {
            if (nameOfState == origin && currDistrict == 'D' + numbers) {
                return '#2166ac'
            }
            return '#4393c3'
        } else {
            return '#f7f7f7'
        }
    });
}

/**
 * Reverts the color of the hovered over distric to its original color before the highlight
 * @param name
 */
function revertDistrictColor(name) {
    name =  '#' + name.split(' ').join('_');
    svg.selectAll(name).attr('fill', function(d) {
        var nameOfState = getId(d)
        var stringNum = (d.id).toString();
        var numbers = stringNum.substring(stringNum.length - 2, stringNum.length)
        //Check state and district number for party and color red or blue
        var party = getParty(nameOfState, numbers)
        if (party == 'GOP') {
            return '#d6604d'
        } else if (party == 'DEM') {
            return '#4393c3'
        } else {
            return '#f7f7f7'
        }
    });
}

// Ugly way to match states by id. Could come back later and alphabetically sort the states and then match them everytime this function is called.
function getId(d) {
    if (d.id < 200 && d.id > 99) {
        return 'Alabama'
    } else if (d.id < 300) {
        return 'Alaska'
    } else if (d.id < 500) {
        return 'Arizona'
    } else if (d.id < 600) {
        return 'Arkansas'
    } else if (d.id < 700) {
        return 'California'
    } else if (d.id < 900) {
        return 'Colorado'
    } else if (d.id < 1000) {
        return 'Connecticut'
    } else if (d.id < 1100) {
        return 'Delaware'
    } else if (d.id < 1200) {
    } else if (d.id < 1300) {
        return 'Florida'
    } else if (d.id < 1400) {
        return 'Georgia'
    } else if (d.id < 1500) {
    } else if (d.id < 1600) {
        return 'Hawaii'
    } else if (d.id < 1700) {
        return 'Idaho'
    } else if (d.id < 1800) {
        return 'Illinois'
    } else if (d.id < 1900) {
        return 'Indiana'
    } else if (d.id < 2000) {
        return 'Iowa'
    } else if (d.id < 2100) {
        return 'Kansas'
    } else if (d.id < 2200) {
        return 'Kentucky'
    } else if (d.id < 2300) {
        return 'Louisiana'
    } else if (d.id < 2400) {
        return 'Maine'
    } else if (d.id < 2500) {
        return 'Maryland'
    } else if (d.id < 2600) {
        return 'Massachusetts'
    } else if (d.id < 2700) {
        return 'Michigan'
    } else if (d.id < 2800) {
        return 'Minnesota'
    } else if (d.id < 2900) {
        return 'Mississippi'
    } else if (d.id < 3000) {
        return 'Missouri'
    } else if (d.id < 3100) {
        return 'Montana'
    } else if (d.id < 3200) {
        return 'Nebraska'
    } else if (d.id < 3300) {
        return 'Nevada'
    } else if (d.id < 3400) {
        return 'New_Hampshire'
    } else if (d.id < 3500) {
        return 'New_Jersey'
    } else if (d.id < 3600) {
        return 'New_Mexico'
    } else if (d.id < 3700) {
        return 'New_York'
    } else if (d.id < 3800) {
        return 'North_Carolina'
    } else if (d.id < 3900) {
        return 'North_Dakota'
    } else if (d.id < 4000) {
        return 'Ohio'
    } else if (d.id < 4100) {
        return 'Oklahoma'
    } else if (d.id < 4200) {
        return 'Oregon'
    } else if (d.id < 4300) {
        return 'Pennsylvania'
    } else if (d.id < 4400) {
    } else if (d.id < 4500) {
        return 'Rhode_Island'
    } else if (d.id < 4600) {
        return 'South_Carolina'
    } else if (d.id < 4700) {
        return 'South_Dakota'
    } else if (d.id < 4800) {
        return 'Tennessee'
    } else if (d.id < 4900) {
        return 'Texas'
    } else if (d.id < 5000) {
        return 'Utah'
    } else if (d.id < 5100) {
        return 'Vermont'
    } else if (d.id < 5200) {
        return 'Virginia'
    } else if (d.id < 5400) {
        return 'Washington'
    } else if (d.id < 5500) {
        return 'West_Virginia'
    } else if (d.id < 5600) {
        return 'Wisconsin'
    } else if (d.id < 5700) {
        return 'Wyoming'
    }
}

function getParty(state, district) {
    for (var x = 0; x < data.length; x++) {
        if (data[x]['State'] == state) {
            for (var a = 0; a < data[x]['Districts']['Democrats'].length; a++) {
                if (data[x]['Districts']['Democrats'][a][1] == 'D' + district) {
                    return 'DEM'
                }
            }
            for (var b = 0; b < data[x]['Districts']['Republicans'].length; b++) {
                if (data[x]['Districts']['Republicans'][b][1] == 'D' + district) {
                    return 'GOP'
                }
            }
        }
    }
    return 'None'
}

//https://www.congress.gov/members?q=%7B%22congress%22%3A%22116%22%7D&pageSize=250&page=2
//Congress images
