var LazyCanvas = function () {
    this.Canvas = null;
    this.Width = 0;
    this.Height = 0;
    this.Context = null;
}

LazyCanvas.prototype.Init = function (element) {

    var canvasElement = document.createElement('canvas');
    canvasElement.setAttribute('width', element.scrollWidth.toString());
    canvasElement.setAttribute('height', element.scrollHeight.toString());

    var ctx = canvasElement.getContext('2d');

    this.Canvas = canvasElement;
    this.Context = ctx;
    this.Width= ctx.canvas.width;
    this.Height = ctx.canvas.height;

    element.innerHTML = '';
    element.appendChild(canvasElement);

};