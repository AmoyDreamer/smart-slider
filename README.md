# smart-slider
A library of slider based on touch events.

## Usage
### Using unpkg CDN
```
<script src="https://unpkg.com/smart-slider@1.0.0/index.js"></script>
<style>
    .ctx {
        position: relative;
    	overflow: hidden;
    	width: 100%;
        height: 100px;
    }
    .slider {
        font-size: 0;
        background-color: #fff;
        white-space: nowrap;
    }
    .slider__item {
        display: inline-block;
        width: 750px;
        height: 100%;
        vertical-align: top;
    }
</style>
<div classe="ctx">
    <ul class="slider">
        <li class="slider__item"><img src="/path/to/your/project/images/item1.png"/></li>
        <li class="slider__item"><img src="/path/to/your/project/images/item2.png"/></li>
        <li class="slider__item"><img src="/path/to/your/project/images/item3.png"/></li>
    </ul>
</div>
<script>
    var slider = new Slider({
        container: 'slider',
        item: 'slider__item'
    })
</script>
```
### Using npm
#### Install
```bash
npm install smart-slider --save-dev
```
#### Code in Javascript
```
const smartSlider = require('smart-slider');
const slider = new smartSlider({
    container: 'slider',
    item: 'slider__item'
});
```

## Options
- container: The container of slider, DOM element className.(required)
- item: The item of slider, DOM element className.(required)
- auto: Auto sliding, default is false.(optional)
- autoTime: Auto sliding interval, default is 3000ms.(optional)
- rate: The rate of Displacement/Time, can be understood sensitivity, the smaller value, the slider is more sensitive, the value is open interval 0 to 1, default is 0.5.(optional)
- scale: The scale of items not shown, default is 1, that means no scaling. The value is open interval 0 to closed interval 1.(optional)
- getIndexCallback: A callback function, send current position of item display.(optional)

## License
smart-slider is [MIT licensed](https://github.com/AmoyDreamer/smart-slider/blob/master/LICENSE).
