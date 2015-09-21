(function ($, win, doc, Math, undefined) {
    "use strict";
    var PLUGIN_NAME = "tinyscroll";
    var TinyScroll = function (element, options) {
        this.element = element;
        this.$element = $(this.element);
        this.options = $.extend({}, TinyScroll.defaults, $.isPlainObject(options) ? options : {});
        this.init();
    };
    TinyScroll.defaults = {};
    TinyScroll.prototype = {
        Constructor: TinyScroll,
        init: function () {
            var $element = this.$element;
            this.sliderTop = 0;
            var pane = "<div class='tinyscroll-pane' ><div class='tinyscroll-pane-slider' /></div>";

            // 内容区域滚动事件
            // this.eventName = this.prefix === "Moz" ? "DOMMouseScroll" : "wheel";
            this.eventName = this.isDesk ? this.prefix === "Moz" ? "DOMMouseScroll" : "wheel" : "touchend";


            this.$content = $element.children().slice(0, 1);
            this.$pane = $(pane).appendTo($element);
            this.$slider = this.$pane.children();

            this.$content[0].style.right = this.scrollbarWidth + "px";
            if (!this.isDesk) {
                this.$pane[0].style.width = "3px";
                this.$pane[0].style.opacity = 0;
            }
            // 计算滚动条高度并赋值
            this.sliderHeight = this.calcSliderHeight(this.$content[0], this.$slider[0]);
            this.$slider[0].style.height = this.sliderHeight + "px";


            this.bindEvent();
        },
        calcSliderHeight: function (content, slider) {
            return  this.sliderHeight = Math.pow(content.clientHeight, 2) / content.scrollHeight;
        },
        calcSliderTop: function (scrollTop) {
            this.sliderTop = (this.$content[0].clientHeight - this.sliderHeight) / (this.$content[0].scrollHeight - this.$content[0].clientHeight) * scrollTop;
            return this.sliderTop;
        },
        calcContentTop: function (sliderTop) {
            return sliderTop * (this.$content[0].scrollHeight - this.$content[0].clientHeight) / (this.$content[0].clientHeight - this.sliderHeight);
        },
        isDesk: (function () {
            var agent = navigator.userAgent.toLowerCase();
            return ((agent.indexOf("chrome") > -1 || agent.indexOf("firefox") || agent.indexOf("ie")) && ((agent.indexOf("windows") > -1) || (agent.indexOf("macintosh") > -1) || (agent.indexOf("linux") > -1)) && agent.indexOf("mobile") < 0 && agent.indexOf("android") < 0);
        })(),
        scrollbarWidth: (function () {
            var div = doc.createElement("div");
            var scrollbarWidth;
            div.style.width = div.style.height = "100px";
            div.style.overflow = "scroll";
            doc.body.appendChild(div);
            scrollbarWidth = div.clientWidth - div.offsetWidth;
            doc.body.removeChild(div);
            return  scrollbarWidth;
        })(),
        prefix: function () {
            if (win.getComputedStyle) {
                var styles = win.getComputedStyle(doc.documentElement, "");
                // 如果是火狐：moz ,如果是谷歌：webkit
                var pre = ([].slice.call(styles).join("").match(/-(moz|webkit|ms)-/) || (styles.OLink === "" && ["", "o"]))[1];
                // 如果是火狐：Moz
                var dom = ("WebKit|Moz|MS|O").match(new RegExp("(" + pre + ")", "i"))[1];
                // 前面的，都是为prefix 做准备的
                return dom;
            }
        }(),
        preventDefault: function (event) {
            event.preventDefault();
        },
        fnWheel: function (event) {
            var that = this;
            that.getDirection(event);
            // 注释掉的原因是，wheel执行之后，scroll事件还是会执行一次，所以这里要注释掉
            // that.$slider[0].style.transform = "translate3d( 0 , " + that.calcSliderTop(this.scrollTop) + "px , 0 )";  
            that.bothTip(that.direction, event);

            // alert(that.$content[0].scrollTop >= (that.$content[0].scrollHeight - that.$content[0].clientHeight));
        },
        getDirection: function (event) {
            var that = this;
            var direction = null;
            if (that.isDesk) {
                direction = that.prefix === "Moz" ? (event.originalEvent.detail > 0 ? true : false) : (event.originalEvent.wheelDelta < 0 ? true : false);
            }
            else {
                direction = event.originalEvent.changedTouches[0].clientY - that.touchStartClientY < 0 ? true : false;
            }
            that.direction = direction;
        },
        bothTip: function (direction, event) {
            var that = this;
            if (direction) {
                if (that.$content[0].scrollTop >= (that.$content[0].scrollHeight - that.$content[0].clientHeight)) {
                    that.preventDefault(event);
                    // 滚动到顶部的回调
                    that.$element.trigger({
                        type: "scrollTop" 
                    });
                    //console.log("到底部啦");
                }
            }
            else {
                if (that.$content[0].scrollTop === 0) {
                    that.preventDefault(event);
                    // 滚动到底部的回调
                    that.$element.trigge
                    that.$element.trigger({
                        type: "scrollBottom" 
                    });
                    //console.log("到顶啦");
                }
            }
        },
        calcTranslate: function () {
            var that = this;
            that.$slider[0].style.transform = "translate3d( 0 , " + that.calcSliderTop(that.$content[0].scrollTop) + "px , 0 )";
        },
        bindEvent: function () {
            var that = this;
            if (!that.isDesk) {
                that.$content.on("touchstart", function (event) {
                    var clientY = event.originalEvent.changedTouches[0].clientY;
                    that.touchStartClientY = clientY;
                });
            }

            that.$content.on(that.eventName, $.proxy(that.fnWheel, that)).on("scroll", $.proxy(that.calcTranslate, that));

            that.$slider.on("mousedown", function (event) {
                that.getStartPoint(event);
                if (this.setCapture) {// 待优化
                    $(this).on("mousemove", $.proxy(that.fnMove, that)).on("mouseup", $.proxy(that.fnUp, that));
                    this.setCapture();
                }
                else {
                    $(doc).on("mousemove", $.proxy(that.fnMove, that)).on("mouseup", $.proxy(that.fnUp, that));
                }
                //this.setCapture ? ( that.addDrag($(this)) , this.setCapture() ) : that.addDrag( $(doc) ); 
                return false; // 防止文字选中
            });

            that.$pane.on(that.eventName, function (event) {
                var content = that.$content[0];
                var scrollTop = content.scrollTop;
                // 在滚动条wrap下滚动，必须禁用冒泡
                that.preventDefault(event);
                // 获取方向
                that.getDirection(event);

                if (that.direction) {
                    scrollTop += 100;
                }
                else {
                    scrollTop -= 100;
                }
                scrollTop = Math.max(0, scrollTop);
                scrollTop = Math.min(content.scrollHeight - content.clientHeight, scrollTop);

                content.scrollTop = scrollTop;
                that.bothTip(that.direction, event);
                that.calcTranslate();
            }).on("click", function (event) {
                // 每次点击的时候，移动40px（70），仿微信pc客户端的
                if(event.target===that.$slider[0]) {
                    return;
                }
                var deltaTop = 70;
                var sliderTop = that.sliderTop;
                var offsetY = event.pageY - $(this).offset().top;// 待优化：$(this).offset().top 是可以缓存的
                var direction = offsetY - that.sliderTop;

                if (Math.abs(direction) > that.sliderHeight) {
                    if (direction > 0) {
                        sliderTop += deltaTop;
                    }
                    else {
                        sliderTop -= deltaTop;
                    }
                    // 对pointY 进行最大最小纠正
                    sliderTop = Math.max(0, sliderTop);
                    sliderTop = Math.min(that.$content[0].clientHeight - that.sliderHeight, sliderTop);
                    that.sliderTop = sliderTop;
                }
                else {
                    that.sliderTop = offsetY - that.sliderHeight/2;
                }
                
                that.$content[0].scrollTop = that.calcContentTop(that.sliderTop);
                that.calcTranslate();
            });
            // 窗口发生变化的时候，重新初始化大小
            // $(win).on("resize",$.proxy(that.reset , that));
        },
        addDrag: function ($element) {
            $element.on("mousemove", $.proxy(this.fnMove, this)).on("mouseup", $.proxy(this.fnUp, this));
        },
        removeDrag: function ($element) {
            this.$element.off("mousemove", this.fnMove).off("mouseup", this.fnUp);
        },
        fnMove: function (event) {
            // 记录 滚动条的位置信息
            this.sliderTop = event.pageY - this.downPointY;
            var sliderTop = this.sliderTop;
            // 对pointY 进行最大最小纠正
            sliderTop = Math.max(0, sliderTop);
            sliderTop = Math.min(this.$content[0].clientHeight - this.sliderHeight, sliderTop);

            this.$slider[0].style.transition = "none";
            this.$slider[0].style.transform = "translate3d(0 , " + sliderTop + "px ,0 )";

            // 拖拽滚动条的时候，动态更新内容的高度
            this.$content[0].scrollTop = this.calcContentTop(sliderTop);
        },
        fnUp: function (event) {
            this.$slider[0].style.transition = ".2s";
            //this.$slider[0].releaseCapture ? ( this.removeDrag(this.$slider[0]) , this.$slider[0].releaseCapture() ) : this.removeDrag( $(doc) );
            if (this.$slider[0].releaseCapture) {
                this.$slider.off("mousemove", this.fnMove).off("mouseup", this.fnUp);
                this.$slider[0].releaseCapture();
            }
            else {
                $(doc).off("mousemove", this.fnMove).off("mouseup", this.fnUp);
            }
        },
        // 获取按下的点 的内部的值，这个值是固定的，用于后续，用pageY - downPointY 来算出top值
        getStartPoint: function (event) {
            //this.downPointY = event.pageY - this.$slider.offset().top;
            this.downPointY = event.pageY - this.$slider.position().top;
        } ,
        // 可以指定位置，或者跳转到指定内部元素的位置
        setTop: function(top){
            var that = this;
            var $content =that.$content;

            top = typeof top === "number" ? top : $(top).position().top;
            top = $content[0].scrollTop +top;
            $content[0].scrollTop = top;
            $content.trigger("scroll",$.proxy(that.calcTranslate, that));
        } ,
        // 如果有新内容进来的时候，就用这个接口重新渲染
        reset: function(){
            // 1. 重设滚动条高度
            // 2. 让滚动条的top值为0
            this.sliderHeight = this.calcSliderHeight(this.$content[0], this.$slider[0]);
            this.$slider[0].style.height = this.sliderHeight + "px";
            // 这个很重要
            this.$content[0].scrollTop = 0;
            this.setTop(0);
        }

    };
    $.fn[PLUGIN_NAME] = function (options) {
        var that = null;
        var method = null;
        var args = [].slice.call(arguments, 1);
        this.each(function () {
            var $this = $(this);
            var data = $this.data(PLUGIN_NAME);
            if (!data) {
                $this.data(PLUGIN_NAME, (data = new TinyScroll(this, options)));
            }
            if (typeof options === "string" && typeof (method = data[options]) === "function") {
                that = method.apply(data, args);
            }
        });
        return (that ? that : this);
    }

$("[data-name="+PLUGIN_NAME+"]")[PLUGIN_NAME]();

})(jQuery, window, document, Math);


