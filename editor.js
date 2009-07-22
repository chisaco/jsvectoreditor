function bind(fn, scope){
  return function(){return fn.apply(scope, array(arguments))}
}

function array(a){
  for(var b=a.length,c=[];b--;)c.push(a[b]);
  return c;
}

function VectorEditor(elem, width, height){
    if (typeof(Raphael) != "function") { //check for the renderer
        return alert("Error! No Vector Graphics Library Found!"); //if renderer isn't there, return false;
    }
    
    
    this.draw = Raphael(elem, width, height);
    
    this.onHitXY = [0,0]
    this.tmpXY = [0,0]
    
    this.fill = "#f00"; //red
    this.stroke = "#000"; //black
    
    this.mode = "select";
    this.selectbox = null;
    this.selected = []
    
    this.action = "";
    
    this.shapes = []
    this.trackers = []
    
    this.draw.canvas.onmousedown = bind(this.onMouseDown, this);
    this.draw.canvas.onmousemove = bind(this.onMouseMove, this);
    this.draw.canvas.onmouseup = bind(this.onMouseUp, this);
    this.draw.canvas.ondblclick = bind(this.onDblClick, this);
}

VectorEditor.prototype.setMode = function(mode){
  this.unselect()
  this.mode = mode;
}

VectorEditor.prototype.unselect = function(){
  this.selected = [];
  this.removeTracker();
}

VectorEditor.prototype.removeTracker = function(){
  for(var i = 0; i < this.trackers.length; i++){
    this.trackers[i].remove();
  }
  this.trackers = []
}

VectorEditor.prototype.moveTracker = function(x, y){
  for(var i = 0; i < this.trackers.length; i++){
    this.trackers[i].attr("x", this.trackers[i].attr("x") + x);
    this.trackers[i].attr("y", this.trackers[i].attr("y") + y);
  }
}

VectorEditor.prototype.selectAdd = function(shape){
  this.selected.push(shape)
  this.showGroupTracker(shape)
}

VectorEditor.prototype.select = function(shape){
  this.unselect()
  this.selected = [shape]
  this.showTracker(shape)
}

VectorEditor.prototype.resize = function(object, width, height, x, y){
  if(object.type == "rect" || object.type == "image"){
    if(width > 0){
      object.attr("width", width)
    }else{
      object.attr("x", (x?x:object.attr("x"))+width)
      object.attr("width", Math.abs(width)) 
    }
    if(height > 0){
      object.attr("height", height)
    }else{
      object.attr("y", (y?y:object.attr("y"))+height)
      object.attr("height", Math.abs(height)) 
    }
  }else if(object.type == "ellipse"){
    if(width > 0){
      object.attr("rx", width)
    }else{
      object.attr("x", (x?x:object.attr("x"))+width)
      object.attr("rx", Math.abs(width)) 
    }
    if(height > 0){
      object.attr("ry", height)
    }else{
      object.attr("y", (y?y:object.attr("y"))+height)
      object.attr("ry", Math.abs(height)) 
    }
  }
}

VectorEditor.prototype.onMouseDown = function(event){
  var x = event.clientX,
      y = event.clientY,
      target = event.target
      
  this.onHitXY = [x,y]
  
  if(this.mode == "select" && !this.selectbox){
    this.selected = []
    if(target == this.draw.canvas){
      this.selectbox = this.draw.rect(x, y, 0, 0)
        .attr({"fill-opacity": 0.15, 
              "stroke-opacity": 0.5, 
              "fill": "#007fff",
              "stroke": "#007fff"});
    }else if(target.shape_object){
      //select target
      this.select(target.shape_object);
      this.action = "move";
      this.tmpXY = [target.shape_object.attr("x") - x,target.shape_object.attr("y") - y]
    }
  }else if(this.selected.length == 0){
    var shape = null;
    if(this.mode == "rect"){
      shape = this.draw.rect(x, y, 0, 0);
    }else if(this.mode == "ellipse"){
      shape = this.draw.ellipse(x, y, 0, 0);
    }else if(this.mode == "path"){
      shape = this.draw.path({}).moveTo(x, y)
    }else if(this.mode == "line"){
      shape = this.draw.path({}).moveTo(x, y)
      shape.subtype = "line"
    }else if(this.mode == "polygon"){
      shape = this.draw.path({}).moveTo(x, y)
      shape.subtype = "polygon"
    }else if(this.mode == "image"){
      shape = this.draw.image("http://upload.wikimedia.org/wikipedia/commons/a/a5/ComplexSinInATimeAxe.gif", x, y, 0, 0);
    }else if(this.mode == "text"){
    }
    shape.attr({fill: this.fill, stroke: this.stroke})
    this.addShape(shape)
  }else{
    if(this.mode == "polygon"){
        this.selected[0].lineTo(x, y)
    }
  }
}

VectorEditor.prototype.addShape = function(shape){
  shape.node.shape_object = shape
  this.selected = [shape]
  this.shapes.push(shape)
}

VectorEditor.prototype.rectsIntersect = function(r1, r2) {
  return r2.x < (r1.x+r1.width) && 
          (r2.x+r2.width) > r1.x &&
          r2.y < (r1.y+r1.height) &&
          (r2.y+r2.height) > r1.y;
}

VectorEditor.prototype.drawGrid = function(){
  this.draw.drawGrid(0, 0, 480, 272, 10, 10, "blue").toBack()
}

VectorEditor.prototype.move = function(shape, x, y){
  shape.attr({x: x, y: y})
}

VectorEditor.prototype.onMouseMove = function(event){
  var x = event.clientX,
      y = event.clientY
      
  if(this.mode == "select"){
    if(this.selectbox){
      this.resize(this.selectbox, x - this.onHitXY[0], y - this.onHitXY[1], this.onHitXY[0], this.onHitXY[1])
    }else{
      if(this.action == "move"){
        for(var i = 0; i < this.selected.length; i++){
          this.move(this.selected[i],  x + this.tmpXY[0], y + this.tmpXY[1])
        }
      }
    }
  }else if(this.selected.length == 1){
    if(this.mode == "rect"){
      this.resize(this.selected[0], x - this.onHitXY[0], y - this.onHitXY[1], this.onHitXY[0], this.onHitXY[1])
    }else if(this.mode == "image"){
      this.resize(this.selected[0], x - this.onHitXY[0], y - this.onHitXY[1], this.onHitXY[0], this.onHitXY[1])
    }else if(this.mode == "ellipse"){
      this.resize(this.selected[0], x - this.onHitXY[0], y - this.onHitXY[1], this.onHitXY[0], this.onHitXY[1])
    }else if(this.mode == "path"){
      this.selected[0].lineTo(x, y);
    }else if(this.mode == "polygon" || this.mode == "line"){
      //this.selected[0].path[this.selected[0].path.length - 1].arg[0] = x
      //this.selected[0].path[this.selected[0].path.length - 1].arg[1] = y
      //this.selected[0].redraw();
      var pathsplit = this.selected[0].attr("path").split(" ");
      if(pathsplit.length > 3){
        var hack = pathsplit.reverse().slice(3).reverse().join(" ")+' '
        //its such a pity that raphael has lost the ability to do it without hacks -_-
        this.selected[0].attr("path", hack)
      }
      this.selected[0].lineTo(x, y)
    }
  }
  
}

VectorEditor.prototype.trackerBox = function(x, y){
  var w = 4
  return this.draw.rect(x - w, y - w, 2*w, 2*w).attr({
    "stroke-width": 1,
    "stroke": "green",
    "fill": "white"
  }).mouseover(function(){
    this.attr("fill", "red")
  }).mouseout(function(){
    this.attr("fill", "white")
  })
}

VectorEditor.prototype.showTracker = function(shape){
  if(shape.subtype == "line"){
    var line = Raphael.parsePathString(shape.attr('path'));
    var tracker = this.draw.set();
    
    tracker.push(this.trackerBox(line[0][1],line[0][2]))
    tracker.push(this.trackerBox(line[1][1],line[1][2]))
    
    this.trackers.push(tracker)
  }else if(shape.type == "rect"){
    var tracker = this.draw.set();
    var box = shape.getBBox();
    tracker.push(this.trackerBox(box.x, box.y))
    tracker.push(this.trackerBox(box.x + box.width, box.y))
    tracker.push(this.trackerBox(box.x + box.width, box.y + box.height))
    tracker.push(this.trackerBox(box.x, box.y + box.height))
    
    this.trackers.push(tracker)
  }
}



VectorEditor.prototype.showGroupTracker = function(shape){
  var tracker = this.draw.set();
  var box = shape.getBBox();
  tracker.push(this.draw.rect(box.x - 5, box.y - 5, box.width + 10, box.height + 10).attr({
    "stroke-dasharray": "-",
    "stroke": "blue"
  }))
  this.trackers.push(tracker)
}

VectorEditor.prototype.onDblClick = function(event){
  if(this.mode == "polygon" && this.selected.length == 1){
    this.selected[0].andClose()
    this.selected = [];
  }
}

VectorEditor.prototype.onMouseUp = function(event){
  if(this.mode == "select"){
    if(this.selectbox){
      var sbox = this.selectbox.getBBox()
      for(var i = 0; i < this.shapes.length; i++){
        if(this.rectsIntersect(this.shapes[i].getBBox(), sbox)){
          this.selected.push(this.shapes[i])
          //this.shapes[i].attr("fill","#007fff")
          //this.showGroupTracker(this.shapes[i])
        }
      }
      
      if(this.selected.length == 1){
        this.showTracker(this.selected[0])
      }else if(this.selected.length > 1){
        for(var i = 0; i < this.selected.length; i++){
          this.showGroupTracker(this.selected[i])
        }
      }
      this.selectbox.remove()
      this.selectbox = null;
      if(this.selected.length == 0){
        this.unselect()
      }
    }else{
      this.action = ""
    }
  }else if(this.mode == "rect"){
    this.unselect()
  }else if(this.mode == "ellipse"){
    this.unselect()
  }else if(this.mode == "path"){
    this.unselect()
  }else if(this.mode == "line"){
    this.unselect()
  }else if(this.mode == "image"){
    this.unselect()
  }
  
}

