var LazyCanvas = function () {
    this.Canvas = null;
    this.Width = 0;
    this.Height = 0;
    this.Context = null;
    return this;    
}

LazyCanvas.prototype.Init = function (element) {

    var canvasElement = document.createElement('canvas');
    canvasElement.setAttribute('width', element.offsetWidth.toString());
    canvasElement.setAttribute('height', element.offsetHeight.toString());

    var ctx = canvasElement.getContext('2d');

    this.Canvas = canvasElement;
    this.Context = ctx;
    this.Width= ctx.canvas.width;
    this.Height = ctx.canvas.height;

    element.innerHTML = '';
    element.appendChild(canvasElement);
};