(function (window, document, undefined) {

  var factory = function ($) {
    "use strict";

    function guid() {
      function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
      }

      return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    }

    /* Number */
    var Beautifier = function (element, options) {
      this.$element = element
      this.treeId = null
      this.treeListContent = null
      this.Defaults = {
        theme: 'ztree',
        setting: {
          view: {
            dblClickExpand: false
          },
          data: {
            simpleData: {
              enable: true
            }
          }
        }
      }
      this.options = $.extend(true, {}, this.Defaults, options)
      return this.init()
    };
    Beautifier.prototype = {
      // 树配置
      setting: function () {
        var that = this
        return $.extend(true, {}, this.options.setting, {
          callback: {
            /**
             *  拦截节点被点击的事件回调函数
             * @param e
             * @param treeId
             * @param treeNode
             */
            onClick: function (e, treeId, treeNode) {
              if (that.options.setting && that.options.setting.callback && that.options.setting.callback.onClick && typeof that.options.setting.callback.onClick == 'function') {
                that.options.setting.callback.onClick(e, treeId, treeNode)
              }
            },
            /**
             *  拦截异步加载正常结束的事件回调函数 获取数据进行缓存
             * @param event
             * @param treeId
             * @param treeNode
             * @param msg
             */
            onAsyncSuccess: function (event, treeId, treeNode, msg) {
              that.options.data = $.fn.zTree.getZTreeObj(treeId).getNodes()
              if (that.options.setting && that.options.setting.callback && that.options.setting.callback.onAsyncSuccess && typeof that.options.setting.callback.onAsyncSuccess == 'function') {
                that.options.setting.callback.onAsyncSuccess(event, treeId, treeNode, msg)
              }
            }
          }
        })
      },
      // 树初始化
      init: function () {
        var that = this;
        // 添加GUID
        that.treeId = 'zTreeList-' + guid()
        // 创建树菜单DOM
        that.$element.html(that.treeListContent = $('<ul id="tree-list-' + that.treeId + '" class="' + that.options.theme + '"></ul>')
          .data('treeId', that.treeId))
        $.fn.zTree.init(that.treeListContent, that.setting(), that.options.data);

        return this
      }
    };

    // 向$.fn 添加属性
    if ($.fn.zTreeList == null) {
      $.fn.zTreeList = function (options) {

        if (typeof options === 'object') {
          this.each(function () {
            var instanceOptions = $.extend(true, {}, options);

            var instance = new Beautifier($(this), instanceOptions);
          });

          return this;
        } else {
          throw new Error('Invalid arguments for zTreeList: ' + options);
        }
      }
    }

  }; // /factory

// Define as an AMD module if possible
  if (typeof define === 'function' && define.amd) {
    define(['jquery', 'zTree', 'perfectScrollbar'], factory);
  }
  else if (typeof exports === 'object') {
    // Node/CommonJS
    factory(require('jquery'), require('zTree'), require('perfectScrollbar'));
  }
  else if (jQuery) {
    // Otherwise simply initialise as normal, stopping multiple evaluation
    factory(jQuery);
  }
})(window, document);