function Info (div) { 
  this.mapd = MapD;
  this.div = div; 
  this.text = null;

  this.setText = function(text) {
    this.text = text;
    console.log(this.text);
    //$(this.div).html("<p>" + this.text + "</p>");
  };

  this.display = function(text) {
    console.log(text);
    this.setText(text);
    $(this.div).html(this.text).dialog({width:768, height:512});
  };
};

var infoText = "<p>This webapp showcases our in-memory GPU Database <a href='http://map-d.com'>Map-D</a> serving up nearly 350 million geolocated tweets from Jan. 2011 to Sept. 2013. Unlike other solutions, none of the visualizations or analytics presented here is pre-canned; everything generated is the product of an on-the-fly SQL query to the backend that scans the entire dataset in ~5-30 milliseconds, depending on the query.  This allows for true interactivity - users can use their imagination to discover interesting correlations and trends in realtime.</p><p>This version of Map-D is powered by 8 of Nvidia's K40 GPUs, each with 12GB of ultra-fast memory for a total of 96GB that can be queried at over 2 terabytes per second.  This is enough to hold over one billion tweets with full text and metadata. Although  this demo currently focuses on historical data, Map-D allows for fast streaming inserts and can ingest the Twitter firehose directly such that tweets appear on the map in real-time (to be enabled soon). To get a more technical overview of Map-D, please read our <a href='http://map-d.com/whitepaper'>white paper</a>.</p><p>Special thanks is given to Prof. Alan Mislove of Northeastern University for providing the twitter dataset.</p>"






