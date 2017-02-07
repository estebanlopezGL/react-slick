'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import {getTrackCSS, getTrackLeft, getTrackAnimateCSS, getMultiplier, getLastSlideVisibility} from './trackHelper';
import assign from 'object-assign';

var helpers = {
  initialize: function (props) {
    const slickList = ReactDOM.findDOMNode(this.list);

    var slideCount = React.Children.count(props.children);
    var listWidth = this.getWidth(slickList);
    var trackWidth = this.getWidth(ReactDOM.findDOMNode(this.track));
    var slideWidth;

    if (!props.vertical) {
      slideWidth = this.getWidth(ReactDOM.findDOMNode(this))/props.slidesToShow;
    } else {
      slideWidth = this.getWidth(ReactDOM.findDOMNode(this));
    }

    const slideHeight = this.getHeight(slickList.querySelector('[data-index="0"]'));
    const listHeight = slideHeight * props.slidesToShow;

    var currentSlide = props.rtl ? slideCount - 1 - props.initialSlide : props.initialSlide;

    this.setState({
      slideCount,
      slideWidth,
      listWidth,
      trackWidth,
      currentSlide,
      slideHeight,
      listHeight,
    }, function () {

      var targetLeft = getTrackLeft(assign({
        slideIndex: this.state.currentSlide,
        trackRef: this.track,
        listRef: this.list,
      }, props, this.state));
      // getCSS function needs previously set state
      var trackStyle = getTrackCSS(assign({left: targetLeft}, props, this.state));

      this.setState({trackStyle: trackStyle});

      this.autoPlay(); // once we're set up, trigger the initial autoplay.
    });
  },
  update: function (props) {
    const slickList = ReactDOM.findDOMNode(this.list);
    // This method has mostly same code as initialize method.
    // Refactor it
    var slideCount = React.Children.count(props.children);
    var listWidth = this.getWidth(slickList);
    var trackWidth = this.getWidth(ReactDOM.findDOMNode(this.track));
    var slideWidth;

    if (!props.vertical) {
      slideWidth = this.getWidth(ReactDOM.findDOMNode(this))/props.slidesToShow;
    } else {
      slideWidth = this.getWidth(ReactDOM.findDOMNode(this));
    }

    const slideHeight = this.getHeight(slickList.querySelector('[data-index="0"]'));
    const listHeight = slideHeight * props.slidesToShow;

    // pause slider if autoplay is set to false
    if(!props.autoplay)
      this.pause();

    this.setState({
      slideCount,
      slideWidth,
      listWidth,
      trackWidth,
      slideHeight,
      listHeight,
    }, function () {

      var targetLeft = getTrackLeft(assign({
        slideIndex: this.state.currentSlide,
        trackRef: this.track,
        listRef: this.list,
      }, props, this.state));
      // getCSS function needs previously set state
      var trackStyle = getTrackCSS(assign({left: targetLeft}, props, this.state));

      this.setState({trackStyle: trackStyle});
    });
  },
  getWidth: function getWidth(elem) {
    return elem.getBoundingClientRect().width || elem.offsetWidth;
  },
  getHeight(elem) {
    return elem.getBoundingClientRect().height || elem.offsetHeight;
  },
  adaptHeight: function () {
    if (this.props.adaptiveHeight) {
      var selector = '[data-index="' + this.state.currentSlide +'"]';
      if (this.list) {
        var slickList = ReactDOM.findDOMNode(this.list);
        slickList.style.height = slickList.querySelector(selector).offsetHeight + 'px';
      }
    }
  },
  slideHandler: function (index) {
    // Functionality of animateSlide and postSlide is merged into this function
    // console.log('slideHandler', index);
    var targetSlide, currentSlide;
    var targetLeft, currentLeft;
    var callback;
    var previousSlide = this.state.currentSlide;

    if (this.props.waitForAnimate && this.state.animating) {
      // Fix for NBC: We needed to reset the animating state here so that
      // future calls to slideHandler() would work.
      this.setState({
        animating: false
      });
      return;
    }

    if (this.props.fade) {
      currentSlide = this.state.currentSlide;

      // Don't change slide if it's not infite and current slide is the first or last slide.
      if(this.props.infinite === false &&
        (index < 0 || index >= this.state.slideCount)) {
        return;
      } 

      //  Shifting targetSlide back into the range
      if (index < 0) {
        targetSlide = index + this.state.slideCount;
      } else if (index >= this.state.slideCount) {
        targetSlide = index - this.state.slideCount;
      } else {
        targetSlide = index;
      }

      if (this.props.lazyLoad && this.state.lazyLoadedList.indexOf(targetSlide) < 0) {
        this.setState({
          lazyLoadedList: this.state.lazyLoadedList.concat(targetSlide)
        });
      }

      var multiplier = getMultiplier(assign({}, this.props, {currentSlide: currentSlide}));

      callback = () => {
        this.setState({
          animating: false
        });
        this.afterChange(this.state.previousSlide, this.state.currentSlide);
        delete this.animationEndCallback;
      };

      this.setState({
        animating: true,
        currentSlide: targetSlide,
        previousSlide,
      }, function () {
        this.animationEndCallback = setTimeout(callback, this.props.speed * multiplier);
      });

      if (this.props.beforeChange) {
        this.props.beforeChange(this.state.currentSlide, targetSlide);
      }

      this.autoPlay();
      return;
    }

    targetSlide = index;
    if (targetSlide < 0) {
      if(this.props.infinite === false) {
        currentSlide = 0;
      } else if (this.state.slideCount % this.props.slidesToScroll !== 0) {
        currentSlide = this.state.slideCount - (this.state.slideCount % this.props.slidesToScroll);
      } else {
        currentSlide = this.state.slideCount + targetSlide;
      }
    } else if (targetSlide >= this.state.slideCount) {
      if(this.props.infinite === false) {
        currentSlide = this.state.slideCount - this.props.slidesToShow;
      } else if (this.state.slideCount % this.props.slidesToScroll !== 0) {
        currentSlide = 0;
      } else {
        currentSlide = targetSlide - this.state.slideCount;
      }
    } else {
      currentSlide = targetSlide;
    }

    targetLeft = getTrackLeft(assign({
      slideIndex: targetSlide,
      trackRef: this.track,
      listRef: this.list,
    }, this.props, this.state));

    currentLeft = getTrackLeft(assign({
      slideIndex: currentSlide,
      trackRef: this.track,
      listRef: this.list,
    }, this.props, this.state));

    if (this.props.infinite === false) {
      targetLeft = currentLeft;
    }

    if (this.props.beforeChange) {
      this.props.beforeChange(this.state.currentSlide, currentSlide);
    }

    if (this.props.lazyLoad) {
      var loaded = true;
      var slidesToLoad = [];
      for (var i = targetSlide; i < targetSlide + this.props.slidesToShow; i++ ) {
        loaded = loaded && (this.state.lazyLoadedList.indexOf(i) >= 0);
        if (!loaded) {
          slidesToLoad.push(i);
        }
      }
      if (!loaded) {
        this.setState({
          lazyLoadedList: this.state.lazyLoadedList.concat(slidesToLoad)
        });
      }
    }

    // Slide Transition happens here.
    // animated transition happens to target Slide and
    // non - animated transition happens to current Slide
    // If CSS transitions are false, directly go the current slide.

    if (this.props.useCSS === false) {

      this.setState({
        currentSlide: currentSlide,
        trackStyle: getTrackCSS(assign({left: currentLeft}, this.props, this.state))
      }, function () {
        if (this.props.afterChange) {
          this.props.afterChange(currentSlide);
        }
      });

    } else {

      var nextStateChanges = {
        animating: false,
        currentSlide: currentSlide,
        trackStyle: getTrackCSS(assign({left: currentLeft}, this.props, this.state)),
        swipeLeft: null
      };

      var multiplier = getMultiplier(assign({}, this.props, {currentSlide: currentSlide}));

      callback = () => {
        this.setState(nextStateChanges);
        this.afterChange(this.state.previousSlide, currentSlide);
        delete this.animationEndCallback;
      };

      this.setState({
        animating: true,
        previousSlide,
        currentSlide,
        trackStyle: getTrackAnimateCSS(assign({}, this.props, this.state, {currentSlide: currentSlide, left: targetLeft}))
      }, function () {
        this.animationEndCallback = setTimeout(callback, this.props.speed * multiplier);
      });

    }

    this.autoPlay();
  },
  afterChange: function (previousSlide, currentSlide) {
    var callback;

    if (this.props.endRightEdge && !this.props.infinite && this.list && this.track) {
      var {partiallyVisible, rightVisible, lastSlideLeft} = getLastSlideVisibility(assign({listRef: this.list, trackRef: this.track}, this.props));
      if (!partiallyVisible && rightVisible) {
        var nextStateChanges = {
          animating: false,
          currentSlide: currentSlide,
          trackStyle: getTrackCSS(assign({left: lastSlideLeft}, this.props, this.state)),
          swipeLeft: null
        };
        callback = () => {
          this.setState(nextStateChanges);
          if (this.props.afterChange) {
            this.props.afterChange(currentSlide);
          }
          delete this.animationEndCallback;
        }
        this.setState({
          animating: true,
          trackStyle: getTrackAnimateCSS(assign({left: lastSlideLeft}, this.props, this.state))
        }, () => {
          this.animationEndCallback = setTimeout(callback, this.props.speed);
        })
      }
      else {
        if (this.props.afterChange) {
          this.props.afterChange(currentSlide);
        }
      }
    }
    else {
      if (this.props.afterChange) {
        this.props.afterChange(currentSlide);
      }
    }
  },
  swipeDirection: function (touchObject) {
    var xDist, yDist, r, swipeAngle;

    xDist = touchObject.startX - touchObject.curX;
    yDist = touchObject.startY - touchObject.curY;
    r = Math.atan2(yDist, xDist);

    swipeAngle = Math.round(r * 180 / Math.PI);
    if (swipeAngle < 0) {
        swipeAngle = 360 - Math.abs(swipeAngle);
    }
    if ((swipeAngle <= 45) && (swipeAngle >= 0) || (swipeAngle <= 360) && (swipeAngle >= 315)) {
        return (this.props.rtl === false ? 'left' : 'right');
    }
    if ((swipeAngle >= 135) && (swipeAngle <= 225)) {
        return (this.props.rtl === false ? 'right' : 'left');
    }
    if (this.props.verticalSwiping === true) {
      if ((swipeAngle >= 35) && (swipeAngle <= 135)) {
        return 'down';
      } else {
        return 'up';
      }
    }

    return 'vertical';
  },
  autoPlay: function () {
    if (this.state.autoPlayTimer) {
      return;
    }
    var play = () => {
      if (this.state.mounted) {
        var nextIndex = this.props.rtl ?
        this.state.currentSlide - this.props.slidesToScroll:
        this.state.currentSlide + this.props.slidesToScroll;
        this.slideHandler(nextIndex);
      }
    };
    if (this.props.autoplay) {
      this.setState({
        autoPlayTimer: setInterval(play, this.props.autoplaySpeed)
      });
    }
  },
  pause: function () {
    if (this.state.autoPlayTimer) {
      clearInterval(this.state.autoPlayTimer);
      this.setState({
        autoPlayTimer: null
      });
    }
  }
};

export default helpers;
