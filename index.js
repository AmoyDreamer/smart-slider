/**
 * @author Allen Liu
 * @desc The library of slider based on touch events
 */
(function() {
    var Slider = function(options) {
        var self = this;
        //The container of slider，DOM element.(required)
        this.container = document.getElementsByClassName(options.container)[0];
        //The item list of slider, DOM element.(required)
        this.itemDOM = document.getElementsByClassName(options.item);
        //The number of item.
        this.itemNum = this.itemDOM.length;
        //Auto sliding, default is false.(optional)
        this.auto = typeof options.auto === "boolean" ? options.auto : false;
        //Auto sliding interval, default is 3000ms.(optional)
        this.autoTime = typeof options.autoTime === "number" ? options.autoTime : 3000;
        //The rate of Displacement/Time, can be understood sensitivity, the smaller value, the slider is more sensitive, the value is open interval 0 to 1, default is 0.5.(optional)
        this.rate = typeof options.rate === "number" && options.rate > 0 && options.rate < 1 ? options.rate : 0.5;
        //The scale of items not shown, default is 1, that means no scaling. The value is open interval 0 to closed interval 1.(optional)
        this.scale = typeof options.scale === "number" && options.scale > 0 && options.scale <= 1 ? options.scale : 1;
        //A callback function, send current position of item display.(optional)
        this.sendIndex = typeof options.getIndexCallback === "function" ? options.getIndexCallback : null;
        //Current position in slider, default is 0, that means first one.
        this.index = 0;
        //The timer of auto sliding.
        this.timer = null;
        //The listener object of register event.
        this.listener = {
            resize: null,//resize page event
            touchstart: null,//touchstart event
            touchmove: null,//touchmove event
            touchend: null,//touchend event
            transitionend: null//transitionend event
        };
        //The sliding object
        this.moveInfo = {
            active: false,//Whether the slider is active
            startX: 0,//The start position of x-axis
            diffX: 0,//The displacement of x-axis
            translateX: 0,//The transition target of x-axis
            endX: 0,//The end position of x-axis
            startTime: 0,//start time
            endTime: 0,//end time
            maxX: 0,//The maximum of x-axis
            minX: 0,//The minimum of x-axis
        };
        /**
         * @method Determine whether passive is supported
         * @desc Detail see webpage: https://developer.mozilla.org/zh-CN/docs/Web/API/EventTarget/addEventListener
         */
        this.isPassiveSupported = function() {
            var passiveSupported = false;
            try {
                var options = Object.defineProperty({}, "passive", {
                    get: function() {
                        passiveSupported = true;
                    }
                });
                window.addEventListener("test", null, options);
                window.removeEventListener("test", null, options);
            } catch(err) {}
            return passiveSupported;
        };
        /**
         * @method touchstart event
         */
        this.onMoveStart = function(e) {
            e.preventDefault();
            var target = e.touches[0];//get touch object
            var x = target.pageX;
            //remove timer on auto sliding status
            if (self.auto && self.timer) clearTimeout(self.timer);
            var ctx = self.container;
            self.moveInfo.startX = x;
            self.moveInfo.active = true;
            self.moveInfo.startTime = Date.now();
            ctx.style.cursor = '-webkit-grabbing';
            ctx.style.transitionDuration = '0ms';
        };
        /**
         * @method touchmove event
         */
        this.onMove = function(e) {
            e.preventDefault();
            var target = e.touches[0];//get touch object
            var x = target.pageX;
            if (!self.moveInfo.active) return;
            var ctx = self.container;
            self.moveInfo.diffX = self.moveInfo.startX - x;
            var translateX = self.moveInfo.endX - self.moveInfo.diffX;//calculate offset of x-axis
            var minX = self.moveInfo.minX;
            var maxX = self.moveInfo.maxX;
            translateX = translateX > minX ? minX : (translateX < maxX ? maxX : translateX);
            self.moveInfo.translateX = translateX;
            ctx.style.transform = 'translate(' + translateX + 'px, 0) translateZ(0)';
            ctx.style.webkitTransform = 'translate(' + translateX + 'px, 0) translateZ(0)';
        };
        /**
         * @method touchend event
         */
        this.onMoveEnd = function(e) {
            var ctx = self.container;
            var index = self.index;
            var translateX = self.moveInfo.translateX;
            var minX = self.moveInfo.minX;
            var maxX = self.moveInfo.maxX;
            var diffX = self.moveInfo.diffX;
            var curIndex;//current end position of sliding.
            var diffTime = Date.now() - self.moveInfo.startTime;
            var itemNum = self.itemNum + 1;//get real number of slider item.
            //There's enough distance on current touch action.
            if (Math.abs(diffX / diffTime) >= self.rate && translateX <= minX && translateX >= maxX) {
                //left shift
                if (diffX > 0) {
                    curIndex = index + 2;
                //right shift
                } else {
                    curIndex = index;
                }
            //There's not enough distance, remain unchanged.
            } else {
                curIndex = index + 1;
            }
            self.moveInfo.active = false;
            ctx.style.cursor = '-webkit-grab';
            //The touch event occurs before transitionend event responds, make sure the first and last items transition smoothly.
            if (translateX === self.moveInfo.endX) {
                ctx.style.transitionDuration = '0ms';
            } else {
                ctx.style.transitionDuration = '300ms';
            }
            self.moveInfo.endX = -(curIndex * self.moveInfo.containerWidth);
            //Set current position of slider.
            self.index = curIndex == itemNum ? 0 : (curIndex == 0 ? self.itemNum - 1 : curIndex - 1);
            //Send current position of slider to caller.
            self.sendIndex && self.sendIndex(self.index);
            ctx.style.transform = 'translate(' + self.moveInfo.endX + 'px, 0) translateZ(0)';
            ctx.style.webkitTransform = 'translate(' + self.moveInfo.endX + 'px, 0) translateZ(0)';
            self.moveInfo.diffX = 0;
            self.startScale();
            //If automatic sliding is supported, turn on the timer.
            self.auto && self.autoScroll();
        };
        /**
         * @method transitionend event
         */
        this.onTransitionEnd = function(e) {
            //slides to the last item, relocation to the first item
            if (self.moveInfo.endX == self.moveInfo.maxX) {
                var ctx = self.container;
                ctx.style.transitionDuration = '0ms';
                ctx.style.transform = 'translate(' + self.moveInfo.initX + 'px, 0) translateZ(0)';
                ctx.style.webkitTransform = 'translate(' + self.moveInfo.initX + 'px, 0) translateZ(0)';
                self.moveInfo.endX = self.moveInfo.initX;
                return
            }
            //slides to the first item, relocation to the last item
            if (self.moveInfo.endX == 0) {
                var ctx = self.container;
                ctx.style.transitionDuration = '0ms';
                ctx.style.transform = 'translate(' + self.moveInfo.lastX + 'px, 0) translateZ(0)';
                ctx.style.webkitTransform = 'translate(' + self.moveInfo.lastX + 'px, 0) translateZ(0)';
                self.moveInfo.endX = self.moveInfo.lastX;
                return
            }
        };
        /**
         * @method automatic sliding
         */
        this.autoScroll = function() {
            self.timer = setTimeout(function() {
                if (self.moveInfo.active) return self.autoScroll();
                var ctx = self.container;
                var itemNum = self.itemNum + 1;//get real number of slider item
                var _index = self.index + 2;//get current position of slider by plus 2
                _index = _index > itemNum ? 1 : _index;//get real current position
                self.index = _index == itemNum ? 0 : _index - 1;//caller get real position
                //Send current position of slider to caller.
                self.sendIndex && self.sendIndex(self.index);
                self.moveInfo.endX = -1 * _index * self.moveInfo.containerWidth;
                ctx.style.transitionDuration = '300ms';
                ctx.style.transform = 'translate(' + self.moveInfo.endX + 'px, 0) translateZ(0)';
                ctx.style.webkitTransform = 'translate(' + self.moveInfo.endX + 'px, 0) translateZ(0)';
                self.startScale();
                self.autoScroll();
            }, self.autoTime);
        };
        /**
         * @method Turn on scale property，current item restore, scale both sides.
         */
        this.startScale = function() {
            var scale = self.scale;
            //no scaling
            if (scale == 1) return;
            self.itemDOM[self.index].style.transform = 'scaleY(' + scale + ')';
            self.itemDOM[self.index + 1].style.transform = 'scaleY(1)';
            self.itemDOM[self.index + 2].style.transform = 'scaleY(' + scale + ')';
            //Initialize the first item
            if (self.index == 0) {
                self.itemDOM[self.itemNum].style.transform = 'scaleY(' + scale + ')';
                self.itemDOM[self.itemNum + 1].style.transform = 'scaleY(1)';
            } else {
                //Slide the last item
                if (self.index == self.itemNum - 1) {
                    self.itemDOM[self.itemNum - 1].style.transform = 'scaleY(' + scale + ')';
                    self.itemDOM[0].style.transform = 'scaleY(1)';
                    self.itemDOM[1].style.transform = 'scaleY(' + scale + ')';
                }
            }
        };
        /**
         * @method Initialize the library
         */
        this.init = function() {
            //Initialize the target DOM structure
            this.initTargetDOM()
            //Initialize calculation attribute
            this.initData()
        };
        /**
         * @method Initialize the target DOM structure
         */
        this.initTargetDOM = function() {
            var ctx = self.container;//get container
            var firstNode = ctx.firstChild;//get the first item
            var lastNode = ctx.lastChild;//get the last item
            var cloneFirstNode = firstNode.cloneNode(true);//clone the first item
            var cloneLastNode = lastNode.cloneNode(true);//clone the last item
            ctx.insertBefore(cloneLastNode, firstNode);//insert the last item in first position, in order to make sure transition smoothly on right shift.
            ctx.appendChild(cloneFirstNode);//append the first item in last position, in order to make sure transition smoothly on left shift.
        };
        /**
         * @method Initialize calculation attribute
         */
        this.initData = function() {
            var ctx = self.container;//get container
            var firstNode = ctx.firstChild;//get the first item
            var style = window.getComputedStyle(firstNode);
            var unitWidth = style.width.replace(/px/, '');
            var marginRight = style.marginRight.replace(/px/, '');//get margin-right attribute
            self.moveInfo.containerWidth = Number(unitWidth) + Number(marginRight);//one sliding unit
            self.moveInfo.maxX = -(self.moveInfo.containerWidth * (self.itemNum + 1));//To calculate maximum of x-axis
            self.moveInfo.minX = 0;
            self.moveInfo.initX = -self.moveInfo.containerWidth;//Initialize position of x-axis
            self.moveInfo.lastX = self.moveInfo.maxX + self.moveInfo.containerWidth;//get last position of x-axis
            /*Initialize container position*/
            self.moveInfo.endX = self.moveInfo.initX;
            ctx.style.width = -self.moveInfo.maxX + 'px';//set width of container
            ctx.style.transitionTimingFunction = 'cubic-bezier(0.165, 0.84, 0.44, 1)';
            ctx.style.transitionDuration = '0ms';
            ctx.style.transform = 'translate(' + self.moveInfo.initX + 'px, 0) translateZ(0)';
            ctx.style.webkitTransform = 'translate(' + self.moveInfo.initX + 'px, 0) translateZ(0)';
            /*Initialize container position*/
            self.startScale();
        };
        /**
         * @method Register page resize event
         */
        this.resize = function() {
            self.listener.resize = self.initData;
            window.addEventListener('resize', self.listener.resize);
        };
        /**
         * @method Register touchstart event
         */
        this.touchStart = function() {
            self.listener.touchstart = self.onMoveStart;
            self.container.addEventListener('touchstart', self.listener.touchstart, self.isPassiveSupported() ? {
                passive: true
            } : false);
        };
        /**
         * @method Register touchmove event
         */
        this.touchMove = function() {
            self.listener.touchmove = self.onMove;
            self.container.addEventListener('touchmove', self.listener.touchmove, false);
        };
        /**
         * @method Register touchend event
         */
        this.touchEnd = function() {
            self.listener.touchend = this.onMoveEnd;
            self.container.addEventListener('touchend', self.listener.touchend, false);
        };
        /**
         * @method Register transitionend event
         */
        this.transitionEnd = function() {
            self.listener.transitionend = self.onTransitionEnd;
            self.container.addEventListener('transitionend', self.listener.transitionend, false);
        };
        /**
         * @method reset all listener
         */
        this.resetAllListener = function() {
            self.timer = null;
            self.listener = {
                resize: null,
                touchstart: null,
                touchmove: null,
                touchend: null,
                transitionend: null
            };
        };
        /**
         * @method remove all listener
         */
        this.removeAllListener = function() {
            self.timer && clearTimeout(self.timer);
            self.listener.resize && window.removeEventListener('resize', self.listener.resize);
            self.container.removeEventListener('touchstart', self.listener.touchstart, false);
            self.container.removeEventListener('touchmove', self.listener.touchmove, false);
            self.container.removeEventListener('touchend', self.listener.touchend, false);
            self.container.removeEventListener('transitionend', self.listener.transitionend, false);
            self.resetAllListener();
        };
        //Send current position of slider to caller.
        this.sendIndex && this.sendIndex(this.index);
        //The total is greater than one, turn on slider
        if (this.itemNum > 1) {
            this.init();
            this.resize();
            this.touchStart();
            this.touchMove();
            this.touchEnd();
            this.transitionEnd();
            this.auto && this.autoScroll();
        }
    };
    //export module
    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = Slider;
        }
        exports.Slider = Slider;
    } else {
        this.Slider = Slider;
    }
}.call(this));
