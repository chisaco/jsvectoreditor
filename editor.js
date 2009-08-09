function bind(fn, scope){
  return function(){return fn.apply(scope, array(arguments))}
}

function array(a){
  for(var b=a.length,c=[];b--;)c.push(a[b]);
  return c;
}

function VectorEditor(elem, width, height){
    if (typeof(Raphael) != "function") { //check for the renderer
        return alert("Error! Renderer is Missing!"); //if renderer isn't there, return false;
    }
    
    this.container = elem
    this.draw = Raphael(elem, width, height);
    
    this.draw.editor = this;
    
    this.onHitXY = [0,0]
    this.offsetXY = [0,0]
    this.tmpXY = [0,0]
    
    this.fill =   "#ff0000"; //red
    this.stroke = "#000000"; //black
    
    this.mode = "select";
    this.selectbox = null;
    this.selected = []
    
    this.action = "";
    
    this.selectadd = false;
    
    this.shapes = []
    this.trackers = []
    
    var draw = this.draw;
    
    function offset(){
      if(window.Ext)return Ext.get(elem).getXY();
      if(window.jQuery){
        var pos = jQuery(elem).offset();
        return [pos.left, pos.top];
      }
      return [0,0]
    }
    
    $(elem).mousedown(bind(function(event){
      event.preventDefault()
      this.onMouseDown(event.clientX - offset()[0], event.clientY - offset()[1], event.target)
    }, this));
    $(elem).mousemove(bind(function(event){
      event.preventDefault()
      this.onMouseMove(event.clientX - offset()[0], event.clientY - offset()[1], event.target)
    }, this));
    $(elem).mouseup(bind(function(event){
      event.preventDefault()
      this.onMouseUp(event.clientX - offset()[0], event.clientY - offset()[1], event.target)
    }, this));
    $(elem).dblclick(bind(function(event){
      event.preventDefault()
      this.onDblClick(event.clientX - offset()[0], event.clientY - offset()[1], event.target)
    }, this));
}

VectorEditor.prototype.setMode = function(mode){
  if(mode == "select+"){
    this.mode = "select";
    this.selectadd = true;
    this.unselect()
  }else if(mode == "select"){
    this.mode = mode;
    this.unselect()
    this.selectadd = false;
  }else if(mode == "delete"){
    this.deleteSelection();
    this.mode = mode;
  }else{
    this.unselect()
    this.mode = mode;
  }
}

VectorEditor.prototype.unselect = function(shape){
  if(!shape){
    this.selected = [];
    this.removeTracker();
  }else{
    this.array_remove(shape, this.selected);
    for(var i = 0; i < this.trackers.length; i++){
      if(this.trackers[i].shape == shape){
        this.removeTracker(this.trackers[i]);
      }
    }
  }
}

//from the vXJS JS Library
VectorEditor.prototype.in_array = function(v,a){
  for(var i=a.length;i--&&a[i]!=v;);
  return i
}

//from vX JS, is it at all strange that I'm using my own work?
VectorEditor.prototype.array_remove = function(e, o){
  var x=this.in_array(e,o);
  x!=-1?o.splice(x,1):0
}

VectorEditor.prototype.is_selected = function(shape){
  return this.in_array(shape, this.selected) != -1;
}

VectorEditor.prototype.removeTracker = function(tracker){
  if(!tracker){
    while(this.trackers.length > 0){
      this.removeTracker(this.trackers[0]);
    }
  }else{
    tracker.remove();
    
    for(var i = 0; i < this.trackers.length; i++){
      if(this.trackers[i] == tracker){
        this.trackers.splice(i, 1)
      }
    }
  }
}

VectorEditor.prototype.rotateTracker = function(a, x, y){
  for(var i = 0; i < this.trackers.length; i++){
    var el = this.trackers[i]
    el.rotate(a, x, y)
  }
}

VectorEditor.prototype.moveTracker = function(x, y){
  for(var i = 0; i < this.trackers.length; i++){
    var el = this.trackers[i]
    /*
    for(var k = 0; k < el.length; k++){
      var box = el[k].getBBox()
      //el[k].attr("x", box.x + x);
      //el[k].attr("y", box.y + y);
      el[k].translate(x,y)
    }
    */
    el.translate(x,y)
  }
}

VectorEditor.prototype.updateTracker = function(tracker){
  if(!tracker){
    for(var i = 0; i < this.trackers.length; i++){
      this.updateTracker(this.trackers[i])
    }
  }else{
    if(shape._ && shape._.rt && shape._.rt.deg > 0){
      this.rotateTracker(shape._.rt.deg, (box.x + box.width/2), (box.y + box.height/2))
    }
    
  }
}

VectorEditor.prototype.isCanvas = function(element){
  return element == this.draw.canvas || //yay for Firefox and Opera!
         element == this.container || //erm.. makes sense for Webkit
         (Raphael.vml && element == this.draw.canvas.parentNode); //IE.. uh...
}

VectorEditor.prototype.selectAdd = function(shape){
  if(this.is_selected(shape) == false){
    this.selected.push(shape)
    this.showGroupTracker(shape)
  }
}

VectorEditor.prototype.selectToggle = function(shape){
  if(this.is_selected(shape) == false){
    this.selected.push(shape)
    this.showGroupTracker(shape)
  }else{
    this.unselect(shape)
  }
}

VectorEditor.prototype.select = function(shape){
  this.unselect()
  this.selected = [shape]
  this.showTracker(shape)
}



VectorEditor.prototype.scale = function(shape, corner, x, y){
  var xp = 0, yp = 0
  var box = shape.getBBox()
  switch(corner){
    case "tr":
      xp = box.x
      yp = box.y + box.height
      break;
    case "bl":
      xp = box.x + box.width
      yp = box.y
      break;
    case "tl":
      xp = box.x + box.width;
      yp = box.y + box.height;
    break;
    case "br":
      xp = box.x
      yp = box.y
    break;
  }
  shape.scale(x, y, xp, yp)
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
  }else if(object.type == "text"){
    object.attr("font-size", Math.abs(width))
  }
}

VectorEditor.prototype.onMouseDown = function(x, y, target){
  this.tmpXY = this.onHitXY = [x,y]
  
  if(this.mode == "select" && !this.selectbox){
    if(this.isCanvas(target)){
      if(!this.selectadd) this.unselect();
      this.selectbox = this.draw.rect(x, y, 0, 0)
        .attr({"fill-opacity": 0.15, 
              "stroke-opacity": 0.5, 
              "fill": "#007fff", //mah fav kolur!
              "stroke": "#007fff"});
    }else{
      var shape_object = null
      if(target.shape_object){
        shape_object = target.shape_object
      }else if(target.parentNode.shape_object){
        shape_object = target.parentNode.shape_object
      }else{
        return; //likely tracker
      }
      if(this.selected.length > 1 || this.selectadd){
        this.selectAdd(shape_object);
        this.action = "move";
      }else{
        this.select(shape_object);
        this.action = "move";
      }
      this.offsetXY = [shape_object.attr("x") - x,shape_object.attr("y") - y]
    }
  }else if(this.mode == "delete" && !this.selectbox){
    if(this.isCanvas(target)){
      this.selectbox = this.draw.rect(x, y, 0, 0)
        .attr({"fill-opacity": 0.15, 
              "stroke-opacity": 0.5, 
              "fill": "#ff0000", //mah fav kolur!
              "stroke": "#ff0000"});
    }else{
      var shape_object = null
      if(target.shape_object){
        shape_object = target.shape_object
      }else if(target.parentNode.shape_object){
        shape_object = target.parentNode.shape_object
      }else{
        return; //likely tracker
      }
      this.deleteShape(shape_object)
      this.offsetXY = [shape_object.attr("x") - x,shape_object.attr("y") - y]
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
      shape = this.draw.text(x, y, "elitist").attr("font-size",20)
    }
    if(shape){
      shape.id = this.generateUUID();
      shape.attr({fill: this.fill, stroke: this.stroke})
      this.addShape(shape)
    }
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
  shape.translate(x,y)
}

VectorEditor.prototype.onMouseMove = function(x, y, target){
      
  if(this.mode == "select" || this.mode == "delete"){
    if(this.selectbox){
      this.resize(this.selectbox, x - this.onHitXY[0], y - this.onHitXY[1], this.onHitXY[0], this.onHitXY[1])
    }else if(this.mode == "select"){
      if(this.action == "move"){
        for(var i = 0; i < this.selected.length; i++){
          this.move(this.selected[i], x - this.tmpXY[0], y - this.tmpXY[1])
        }
        this.moveTracker(x - this.tmpXY[0], y - this.tmpXY[1])
        this.tmpXY = [x, y]
      }else if(this.action == "rotate"){
        //no multi-rotate
        var box = this.selected[0].getBBox()
        var rad = Math.atan2(y - (box.y + box.height/2), x - (box.x + box.width/2))
        var deg = ((rad * (180/Math.PI))+90) % 360
        this.selected[0].rotate(deg, true); //absolute!
        this.rotateTracker(deg, (box.x + box.width/2), (box.y + box.height/2))
      }
    }
  }else if(this.selected.length == 1){
    if(this.mode == "rect"){
      this.resize(this.selected[0], x - this.onHitXY[0], y - this.onHitXY[1], this.onHitXY[0], this.onHitXY[1])
    }else if(this.mode == "image"){
      this.resize(this.selected[0], x - this.onHitXY[0], y - this.onHitXY[1], this.onHitXY[0], this.onHitXY[1])
    }else if(this.mode == "ellipse"){
      this.resize(this.selected[0], x - this.onHitXY[0], y - this.onHitXY[1], this.onHitXY[0], this.onHitXY[1])
    }else if(this.mode == "text"){
      this.resize(this.selected[0], x - this.onHitXY[0], y - this.onHitXY[1], this.onHitXY[0], this.onHitXY[1])
    }else if(this.mode == "path"){
      this.selected[0].lineTo(x, y);
    }else if(this.mode == "polygon" || this.mode == "line"){
      //this.selected[0].path[this.selected[0].path.length - 1].arg[0] = x
      //this.selected[0].path[this.selected[0].path.length - 1].arg[1] = y
      //this.selected[0].redraw();
      //var pathsplit = this.selected[0].attr("path").split(" ");
      var pathsplit = Raphael.parsePathString(this.selected[0].attr("path"))
      if(pathsplit.length > 1){
        //var hack = pathsplit.reverse().slice(3).reverse().join(" ")+' ';
        
        //console.log(pathsplit)
        pathsplit.splice(pathsplit.length - 1, 1);
        //its such a pity that raphael has lost the ability to do it without hacks -_-
        this.selected[0].attr("path", pathsplit)
      }else{
        //console.debug(pathsplit)
        //normally when this executes there's somethign strange that happened
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
  }).mousedown(function(){
    //this.paper.editor.action = "rotate"
  })
}

VectorEditor.prototype.trackerCircle = function(x, y){
  var w = 5
  return this.draw.ellipse(x, y, w, w).attr({
    "stroke-width": 1,
    "stroke": "green",
    "fill": "white"
  }).mouseover(function(){
    this.attr("fill", "red")
  }).mouseout(function(){
    this.attr("fill", "white")
  }).mousedown(function(){
    this.paper.editor.action = "rotate"
  })
}


VectorEditor.prototype.generateUUID = function(){
  var uuid = ""
  for(var i = 0; i < 16; i++){
    uuid += "abcdefghijklmnopqrstuvwxyz0123456789".charAt(Math.floor(Math.random()*Math.min(36,26+i)))
  }
  return "shape:"+uuid;
}


VectorEditor.prototype.getMarkup = function(){
    return this.draw.canvas.parentNode.innerHTML;
}


VectorEditor.prototype.showTracker = function(shape){
  var box = shape.getBBox();
  var tracker = this.draw.set();
  tracker.shape = shape;
  if(shape.subtype == "line"){
    var line = Raphael.parsePathString(shape.attr('path'));
    tracker.push(this.trackerBox(line[0][1],line[0][2]))
    tracker.push(this.trackerBox(line[1][1],line[1][2]))
    this.trackers.push(tracker)
  }else if(shape.type == "rect" || shape.type == "image"){
    tracker.push(this.draw.rect(box.x - 10, box.y - 10, box.width + 20, box.height + 20).attr({"opacity":0.3}))
    tracker.push(this.trackerBox(box.x - 10, box.y - 10))
    tracker.push(this.trackerBox(box.x + box.width + 10, box.y - 10))
    tracker.push(this.trackerBox(box.x + box.width + 10, box.y + box.height + 10))
    tracker.push(this.trackerBox(box.x - 10, box.y + box.height + 10))
    tracker.push(this.trackerCircle(box.x + box.width/2, box.y - 25))
    this.trackers.push(tracker)
  }else if(shape.type == "ellipse"){
    tracker.push(this.trackerBox(box.x, box.y))
    tracker.push(this.trackerBox(box.x + box.width, box.y))
    tracker.push(this.trackerBox(box.x + box.width, box.y + box.height))
    tracker.push(this.trackerBox(box.x, box.y + box.height))
    tracker.push(this.trackerCircle(box.x + box.width/2, box.y - 25))
    this.trackers.push(tracker)
  }else{
    tracker.push(this.draw.rect(box.x - 10, box.y - 10, box.width + 20, box.height + 20).attr({"opacity":0.3}))
    tracker.push(this.trackerCircle(box.x + box.width/2, box.y - 25))
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
  tracker.shape = shape;
  this.trackers.push(tracker)
}

VectorEditor.prototype.onDblClick = function(x, y, target){
  if(this.selected.length == 1){
    if(this.selected[0].getBBox().height == 0 && this.selected[0].getBBox().width == 0){
      this.deleteShape(this.selected[0])
    }
    if(this.mode == "polygon"){
      this.selected[0].andClose()
      this.unselect()
    }
  }
}

VectorEditor.prototype.deleteSelection = function(){
  while(this.selected.length > 0){
    this.deleteShape(this.selected[0])
  }
}

VectorEditor.prototype.deleteShape = function(shape){
  if(shape && shape.node && shape.node.parentNode){
    shape.remove()
  }
  for(var i = 0; i < this.trackers.length; i++){
    if(this.trackers[i].shape == shape){
      this.removeTracker(this.trackers[i]);
    }
  }
  for(var i = 0; i < this.shapes.length; i++){
    if(this.shapes[i] == shape){
      this.shapes.splice(i, 1)
    }
  }
  for(var i = 0; i < this.selected.length; i++){
    if(this.selected[i] == shape){
      this.selected.splice(i, 1)
    }
  }
  //should remove references, but whatever
}

VectorEditor.prototype.deleteAll = function(){
  this.draw.clear()
  this.shapes = []
  this.trackers = []
}

VectorEditor.prototype.clearShapes = function(){
  while(this.shapes.length > 0){
    this.deleteShape(this.shapes[0])
  }
}

VectorEditor.prototype.onMouseUp = function(x, y, target){
  if(this.mode == "select" || this.mode == "delete"){
    if(this.selectbox){
      var sbox = this.selectbox.getBBox()
      var new_selected = [];
      for(var i = 0; i < this.shapes.length; i++){
        if(this.rectsIntersect(this.shapes[i].getBBox(), sbox)){
          new_selected.push(this.shapes[i])
        }
      }
      
      if(new_selected.length == 0){
        this.unselect()
      }if(new_selected.length == 1 && this.selectadd == false){
        this.select(new_selected[0])
      }else{
        for(var i = 0; i < new_selected.length; i++){
          this.selectAdd(new_selected[i])
        }
      }
      if(this.selectbox.node.parentNode){
        this.selectbox.remove()
      }
      this.selectbox = null;
      
      if(this.mode == "delete"){
        this.deleteSelection();
      }
      
    }else{
      this.action = "";
    }
  }else if(this.selected.length == 1){
    if(this.selected[0].getBBox().height == 0 && this.selected[0].getBBox().width == 0){
      if(this.selected[0].subtype != "polygon"){
        this.deleteShape(this.selected[0])
      }
    }
    if(this.mode == "rect"){
      this.unselect()
    }else if(this.mode == "ellipse"){
      this.unselect()
    }else if(this.mode == "path"){
      this.unselect()
    }else if(this.mode == "line"){
      this.unselect()
    }else if(this.mode == "image"){
      this.unselect()
    }else if(this.mode == "text"){
      this.unselect()
    }
  }
}

