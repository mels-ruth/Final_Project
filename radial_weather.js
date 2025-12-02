d3.csv("weather_severity_counts.csv").then(data => {

    data.forEach(d => {
        d.Severity = +d.Severity;
        d.Count = +d.Count;
        d.Proportion = +d.Proportion; 
    });

    const margin = {top: 50, right: 100, bottom: 90, left: 150};
    const width = 700 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;


    const svg = d3.select("#heatmap")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const weatherGroups = Array.from(new Set(data.map(d => d.Weather_Group)));
    const severities = [1,2,3,4];

    // sort by S4 proportion
    const severity4Proportion = {};
    data.forEach(d => {
        if(d.Severity === 4) severity4Proportion[d.Weather_Group] = d.Proportion;
    });
    const sortedWeatherGroups = weatherGroups.sort((a,b) => severity4Proportion[b] - severity4Proportion[a]);

    const x = d3.scaleBand().domain(severities).range([0,width]).padding(0.05);
    const y = d3.scaleBand().domain(sortedWeatherGroups).range([0,height]).padding(0.05);

    const color = d3.scaleSequential()
        .interpolator(d3.interpolateReds)
        .domain([Math.log1p(d3.max(data, d => d.Proportion)),0]);


    // tooltip
    const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip");

    
    // heatmap
    svg.selectAll()
        .data(data)
        .enter()
        .append("rect")
        .attr("x", d => x(d.Severity))
        .attr("y", d => y(d.Weather_Group))
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .attr("fill", d => color(Math.log1p(d.Proportion)))
        .on("mouseover", (event,d) => {
            tooltip.transition().duration(200).style("opacity",1);
            tooltip.html(`${d.Weather_Group}<br>Severity ${d.Severity}<br>Count: ${d.Count}<br>Proportion: ${(d.Proportion*100).toFixed(1)}%`)
                .style("left",(event.pageX+10)+"px")
                .style("top",(event.pageY-28)+"px");
        })
        .on("mouseout", () => tooltip.transition().duration(200).style("opacity",0));

    // labels
    svg.selectAll()
        .data(data)
        .enter()
        .append("text")
        .attr("x", d => x(d.Severity)+x.bandwidth()/2)
        .attr("y", d => y(d.Weather_Group)+y.bandwidth()/2)
        .attr("text-anchor","middle")
        .attr("dominant-baseline","middle")
        .attr("font-size","10px")

        // (white on dark, black on light)
        .attr("fill", d => {
            const rgb = d3.color(color(Math.log1p(d.Proportion)));
            const lum = 0.299*rgb.r + 0.587*rgb.g + 0.114*rgb.b;
            return lum > 140 ? "black" : "white";
        })

        .text(d => `${(d.Proportion*100).toFixed(1)}%`);

    // axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d=>`Severity ${d}`));

    svg.append("g")
        .call(d3.axisLeft(y));

    
    // legend
    const legendHeight = 200;
    const legendWidth = 20;

    const legendsvg = svg.append("g")
        .attr("transform", `translate(${width+40},0)`);

    const legendData = d3.range(0,1,0.01);
    legendsvg.selectAll("rect")
        .data(legendData)
        .enter()
        .append("rect")
        .attr("x",0)
        .attr("y",d=>d*legendHeight)
        .attr("width",legendWidth)
        .attr("height",legendHeight/legendData.length)
        .attr("fill", d=> color(d * d3.max(data,d=>Math.log1p(d.Proportion))));

    // legend axis
    const legendScale = d3.scaleLinear()
        .domain([0, d3.max(data,d=>d.Proportion)])
        .range([legendHeight,0]);

    legendsvg.append("g")
        .attr("transform", `translate(${legendWidth},0)`)
        .call(d3.axisRight(legendScale).ticks(5).tickFormat(d=>`${(d*100).toFixed(1)}%`));
    
});

