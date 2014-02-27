function Scatter (div) {
  this.div =  $(div).get(0);
  this.svg = null;
  this.width = null;
  this.height = null;
  this.xScale = null;
  this.yScale = null;
  this.rScale = null;
  this.cScale = null; 
  this.margin = {top: 20, right: 40, bottom: 40, left: 40};
  this.format = null;
  this.data = null;
  this.selectedVar = "pst045212";
  this.params = {
    request: "GroupByToken",
    joinTable: "state_data",
    joinVar: "name",
    sort: false,
    bbox: null,
    sql: null
  };

  this.init = function() {
    this.width = $(this.div).width() - this.margin.left - this.margin.right;
    this.height = $(this.div).height() - this.margin.top - this.margin.bottom;
    this.svg = d3.select(this.div)
      .attr("class", "scatterplot")
      .append("svg")
      .attr("width", this.width + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    this.xScale = d3.scale.linear().range([0,this.width]);
    this.yScale = d3.scale.linear().range([this.height,0]); 
    this.rScale = d3.scale.linear().range([2,5]);
    this.cScale = d3.scale.category10();
    this.xAxis = d3.svg.axis().scale(this.xScale).orient("bottom").ticks(7);
    this.yAxis = d3.svg.axis().scale(this.yScale).orient("left").ticks(7);

     this.svg.append("g")
        .attr("class", "y axis")
        .call(this.yAxis);
     this.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + this.height  +")")
        .call(this.xAxis);
  },

  this.addData = function(dataset) { 
    //var minN = this.minTweets;
    this.data = dataset.results;
    var selectedVar = this.selectedVar;
    if (MapD.dataView == "dollars")
      this.format = d3.format("$,.2s"); 
    else
      this.format = d3.format(".2s"); 

    this.yAxis.tickFormat(this.format);
    this.xAxis.tickFormat(d3.format(".2s"));

    this.xScale
      .domain([d3.min(this.data, function(d) {return d[selectedVar];}), d3.max(this.data, function(d) {return d[selectedVar];})]);

    this.yScale
      .domain([d3.min(this.data, function(d) {return d.y;}), d3.max(this.data, function(d) {return d.y;})]);

    var xScale = this.xScale;
    var yScale = this.yScale;
    var rScale = this.rScale;
    var cScale = this.cScale;

    this.elems.svg.selectAll("circle")
        .data(this.data)
        .enter()
        .append("circle")
        .attr("cx", function(d) {
            return xScale(d[selectedVar]);
          })
        .attr("cy", function(d) {
            return yScale(d.y);
          })
        .attr("r", 2)
        .style("fill", function(d) {
          return cScale(d[colorVar]);
        })
        .append("svg:title")
        .text(function (d) {
          return d.label; 
        });
    }
  }

