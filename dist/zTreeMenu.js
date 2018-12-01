(function (window, document, undefined) {

  var factory = function ($) {
    'use strict'

    function guid() {
      function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
      }
      return (S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4())
    }

    var Beautifier = function (element, options) {
      this.$element = element
      this.treeId = null
      this.treeMenuContent = null
      this.Defaults = {
        theme: 'ztree',
        language: {
          sEmptyTable: '对不起，查询不到相关数据'
        },
        style: {},
        selectCallback: function () {},
        console: 0,
        setting: {}
      }
      this.options = $.extend(true, {}, this.Defaults, options)
      return this.init()
    }
    Beautifier.prototype = {
      /**
       * 调试模式
       * @param msg
       * @returns {null}
       */
      log: function (msg) {
        this.options.console ? console.log(msg) : null
        return this
      },
      // 树配置
      setting: function () {
        var that = this
        return $.extend(true, {}, this.options.setting, {
          callback: {
            /**
             *  用于捕获 checkbox / radio 被勾选 或 取消勾选的事件回调函数
             * @param e
             * @param treeId
             * @param treeNode
             */
            onCheck: function (e, treeId, treeNode) {
              that.onCheck(e, treeId, treeNode)
              if (that.options.setting && that.options.setting.callback && that.options.setting.callback.onCheck && typeof that.options.setting.callback.onCheck == 'function') {
                that.options.setting.callback.onCheck(that, e, treeId, treeNode)
              }
            },
            beforeClick: function (treeId, treeNode) {
              if (that.options.setting && that.options.setting.check && that.options.setting.check.enable) {
                that.beforeClick(treeId, treeNode)
              }
              if (that.options.setting && that.options.setting.callback && that.options.setting.callback.beforeClick && typeof that.options.setting.callback.beforeClick == 'function') {
                that.options.setting.callback.beforeClick(treeId, treeNode)
              }
            },
            /**
             *  拦截节点被点击的事件回调函数
             * @param e
             * @param treeId
             * @param treeNode
             */
            onClick: function (e, treeId, treeNode) {
              if (!(that.options.setting && that.options.setting.check && that.options.setting.check.enable)) {
                that.onCheck(e, treeId, treeNode)
              }
              if (that.options.setting && that.options.setting.callback && that.options.setting.callback.onClick && typeof that.options.setting.callback.onClick == 'function') {
                that.options.setting.callback.onClick(that, e, treeId, treeNode)
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
      /**
       * 用于捕获 checkbox / radio / 节点 被勾选 或 取消 或 点击 事件回调函数
       * @param treeId
       * @param treeNode
       */
      onCheck: function (e, treeId, treeNode) {
        var zTree = $.fn.zTree.getZTreeObj(e.currentTarget.id)
        var nodes = zTree.getCheckedNodes()
        if(nodes.length === 0) {
          nodes = zTree.getSelectedNodes()
        }
        var val = ''
        nodes.sort(function compare(a, b) {
          return a.id - b.id
        })
        for (var i = 0, l = nodes.length; i < l; i++) {
          val += nodes[i].name + ','
        }
        if (val.length > 0) val = val.substring(0, val.length - 1)
        this.$element.val(val)
          .data({'data': nodes})
          .trigger('change')
        return this
      },
      /**
       * 用于捕获单击节点之前的事件回调函数，并且根据返回值确定是否允许单击操作
       * @param treeId
       * @param treeNode
       */
      beforeClick: function (treeId, treeNode) {
        $.fn.zTree.getZTreeObj(treeId).checkNode(treeNode, !treeNode.checked, null, true)
        return false
      },
      /**
       * 绑定搜索
       */
      onSearch: function () {
        this.log('onSearch')
          .treeRendering()
          .$element.removeData('data iSSearch')
        var $inputVal = this.$element.val()
        if ($inputVal.length > 0) {
          var zTree = $.fn.zTree.getZTreeObj('tree-list-' + this.treeId)
          var nodeList = zTree.getNodesByParamFuzzy('name', $inputVal)
          // 将找到的nodelist节点更新至Ztree内
          if (nodeList.length > 0) {
            this.treeRendering(nodeList)
            this.$element.data('iSSearch', true)
          } else {
            $('#tree-list-' + this.treeId).html('<li class="no-results">' + this.options.language.sEmptyTable + '</li>')
          }
        }
        return this
      },
      // 选中当前值
      selectNode: function () {
        var $inputData = this.data() || []
        var zTree = $.fn.zTree.getZTreeObj('tree-list-' + this.treeId)
        zTree.cancelSelectedNode() // 取消当前所有被选中节点的选中状态
        var val = ''
        var data = []
        $.each($inputData || [], function (i, v) {
          var node = zTree.getNodeByParam('id', v.id)
          //zTree.selectNode(node, true) // 指定选中ID的节点
          zTree.checkNode(node, true, true)
          zTree.expandNode(node, true, false) // 指定选中ID节点展开
          // that.$element.val(zTree.getSelectedNodes()[i].name).data('data', [zTree.getSelectedNodes()[i]]) // 显示配置节点name
          val += (val ? ',': '') + node.name
          data.push(node)
        })
        this.$element.val('').val(val).data('data', data)
        return this
      },
      // 表单域值改变时
      onChange: function () {
        this.log('onChange')
        if (this.$element.data('iSSearch')) {
          this.log('搜索触发 onChange')
          return this
        }
        var $inputData = this.data()
        if ($inputData === null && !this.$element.data('iSSearch')) {
          this.log('清空')
            .$element.removeData('data')
            .val(null)
            .trigger('zTreeMenu:selecting')
            .data('zTreeMenu')
            .selectNode.call(this)
        } else if ($inputData === undefined || ($inputData && $inputData.length >0 && $inputData[0].level >= 0)) {
          this.log('用户选择')
            .callback.call(this)
        } else if (!this.$element.data('iSSearch') && $inputData && $inputData.length >0 && !$inputData[0].level) {
          this.log('配置')
            .selectNode.call(this)
        }
        return this
      },
      // GET 当前值
      data: function () {
        return this.$element.data('data')
      },
      // 用户选择回调
      callback: function () {
        this.$element.trigger('zTreeMenu:select')
        this.options.selectCallback.call(this, this.$element.data('data'))
      },
      // 打开菜单
      open: function () {
        var that = this
        var cityOffset = that.$element.offset()
        var positioning = function (offset) {
          offset = offset || cityOffset
          var windowsHeight = document.documentElement.clientHeight
          var treeMenuContentHeight = that.treeMenuContent.height()
          var elementHeight = that.$element.outerHeight()
          var beginCss = {
            left: offset.left,
            minWidth: that.$element.outerWidth()
            // height: 0
          }
          var endCss = {
            'height': that.options.style.height ? that.options.style.height : treeMenuContentHeight
          }
          if ((offset.top + treeMenuContentHeight) > windowsHeight && offset.top > treeMenuContentHeight) {
            beginCss.bottom = windowsHeight - that.$element.offset().top
            beginCss.maxHeight = windowsHeight - elementHeight - 20
          } else {
            beginCss.top = offset.top + elementHeight
            beginCss.maxHeight = windowsHeight - (offset.top + elementHeight) - 20
          }
          that.treeMenuContent.css(beginCss)
          return endCss
        }
        if (that.treeMenuContent.is(':visible')) return this
        that.treeMenuContent.show().animate(positioning(cityOffset), function () {
          if (!that.options.style.height) {
            that.treeMenuContent.css({'height': 'auto'})
          }
          $(document).on('mousedown', that.closeFn = function (event) {
            if ($(event.target).parents('.treeMenuContent').length < 1 && !($(event.target).data('treeId') && $(event.target).data('treeId') === that.treeId)) {
              that.close.call(that)
            }
          })
          that.scrollbar.call(that)
          that.$element.trigger('zTreeMenu:open')
        })
        that.positioningSetInterval = window.setInterval(function () {
          var tempCityOffset = that.$element.offset()
          if (cityOffset.left !== tempCityOffset.left || cityOffset.top !== tempCityOffset.top) {
            cityOffset = tempCityOffset
            positioning(tempCityOffset)
          }
        }, 20)
        return this
      },
      // 关闭菜单
      close: function () {
        var that = this
        that.log('close')
          .treeMenuContent.fadeOut('fast', function () {
          if (that.$element.data('iSSearch')) {
            that.$element.removeData('iSSearch')
            that.treeRendering()
              .selectNode()
          }
          that.$element.trigger('zTreeMenu:close')
          $(document).off('mousedown', that.closeFn)
          window.clearInterval(that.positioningSetInterval)
        })
        return this
      },
      // 树更新
      update: function () {
        if (this.options.setting && this.options.setting.async && this.options.setting.async.enable) {
          this.options.data = null
        }
        this.treeRendering()
      },
      // 销毁菜单
      destroy: function () {
        this.$element.off('click', this.clickTempFn)
          .off('change', this.onChangeTempFn)
          .off('input propertychange', this.onSearchTempFn)
          .val(null)
          .removeData('zTreeMenu')
        this.treeMenuContent.remove()
        return this
      },
      // 渲染树DOM
      treeRendering: function (treeData) {
        if (this.options.data || treeData) {
          $.fn.zTree.init($('#tree-list-' + this.treeId), this.setting(), treeData || this.options.data)
        } else {
          $.fn.zTree.init($('#tree-list-' + this.treeId), this.setting())
        }
        return this
      },
      // 获取树对象
      getTreeObj: function () {
        return $.fn.zTree.getZTreeObj('tree-list-' + this.treeId)
      },
      // 树滚动
      scrollbar: function () {
        var that = this
        //  在动画结束后触发滚动 延时200ms
        if ($.fn.perfectScrollbar == null) {
          console.warn('未引用滚动扩展 perfectScrollbar ')
          return this
        }
        window.setTimeout(function () {
          that.treeMenuContent.perfectScrollbar().perfectScrollbar('update')
        }, 200)
        return this
      },
      // 树初始化
      init: function () {
        var that = this
        var $zTreeMenu = that.$element.data('zTreeMenu')
        // 当前菜单是否初始化
        if (!$zTreeMenu) {
          // 添加GUID
          that.treeId = 'zTreeMenu-' + guid()
          // 创建树菜单DOM
          $('body').append(that.treeMenuContent = $('<div class="treeMenuContent">\n' +
            '<ul id="tree-list-' + that.treeId + '" class="' + that.options.theme + '"></ul>\n' +
            '</div>')
            .css(that.options.style)
            .data('treeId', that.treeId)
            .attr('id', 'tree-menu-content-' + that.treeId)
            .on('click', function () {
              that.scrollbar.call(that)
            }))
          // 初始化树 & 绑定菜单事件
          that.treeRendering()
            .$element.data('treeId', that.treeId)
            .on('click', that.clickTempFn = function () {
              that.open.call(that)
            })
            .on('change', that.onChangeTempFn = function () {
              that.onChange.call(that)
            })
            .on('input propertychange', that.onSearchTempFn = function () {
              that.onSearch.call(that)
            })
            .data('zTreeMenu', that)
        } else {
          $zTreeMenu.destroy()
            .init()
            .treeRendering()
        }
        return this
      }
    }
    // 向$.fn 添加属性
    if ($.fn.zTreeMenu == null) {
      // All methods that should return the element
      var thisMethods = ['open', 'close', 'destroy']
      $.fn.zTreeMenu = function (options) {
        options = options || {}

        if (typeof options === 'object') {
          this.each(function () {
            var instanceOptions = $.extend(true, {}, options)
            var instance = new Beautifier($(this), instanceOptions)
          })
          return this
        } else if (typeof options === 'string') {
          var ret
          var args = Array.prototype.slice.call(arguments, 1)

          this.each(function () {
            var instance = $(this).data('zTreeMenu')

            if (instance == null && window.console && console.error) {
              console.error(
                'The zTreeMenu(\'' + options + '\') method was called on an ' +
                'element that is not using zTreeMenu.'
              )
            }

            ret = instance[options].apply(instance, args)
          })

          // Check if we should be returning `this`
          if ($.inArray(options, thisMethods) > -1) {
            return this
          }

          return ret
        } else {
          throw new Error('Invalid arguments for zTreeMenu: ' + options)
        }
      }
    }

    // data配置方法
    var zTreeMenuDataApi = function ($el) {

      var dataList = ['setting', 'source', 'console', 'ajaxUrl', 'theme', 'style', 'language']

      // 获取data配置对象
      var getData = function ($el, dL) {
        var list = {}, dn, dv
        for (var i = 0; i < dL.length; i++) {
          dn = dL[i]
          dv = $el.data(dn)
          if (dv) {
            list[dn === 'source' ? dn = 'data' : dn] = dv
          }
        }
        return list
      }

      // 处理data配置数据类型
      var dealData = function (oldList) {

        // 工具方法-转换成对象类型
        var toObject = function (dn, dv) {
          try {
            return JSON.parse(dv.replace(/\'/g, '"'))
          }
          catch (err) {
            throw new Error('请配置正确的data-' + dn + '数据类型！')
          }
        }

        // 更新配置对象

        if (oldList.setting) {
          oldList.setting = toObject('setting', oldList.setting)
        }
        if (oldList.data) {
          oldList.data = toObject('data', oldList.data)
        }
        if (oldList.style) {
          oldList.style = toObject('style', oldList.style)
        }
        if (oldList.language) {
          oldList.language = toObject('language', oldList.language)
        }
        if (typeof oldList.theme !== 'string') delete oldList.theme
        if (typeof oldList.console !== 'number') delete oldList.console
        return oldList
      }

      // 处理页面上的data-init树初始化对象

      var options = dealData(getData($el, dataList))
      // 调用树初始化方法
      $el.zTreeMenu($.extend(true, {}, options.ajaxUrl !== undefined ? {
        setting: {
          async: {
            enable: true,
            url: options.ajaxUrl
          }
        }
      } : {}, options))

      $el.data('init.ext.zTreeMenu.data-api', true)
    }

    //data初始化方法监听、执行
    $(document)
      .on('init.ext.zTreeMenu.data-api', '[data-init="zTreeMenu"]', function (e) {
        var $this = $(this)
        if ($this.data('init.ext.zTreeMenu.data-api')) return
        zTreeMenuDataApi($this)
      })
      //AJAX停止事件
      .ajaxStop(function () {
        $('[data-init="zTreeMenu"]').trigger('init.ext.zTreeMenu.data-api')
      })
    //页面初始化
    $(function () {
      $('[data-init="zTreeMenu"]').trigger('init.ext.zTreeMenu.data-api')
    })

  } // /factory

// Define as an AMD module if possible
  if (typeof define === 'function' && define.amd) {
    define(['jquery', 'zTree', 'perfectScrollbar'], factory)
  }
  else if (typeof exports === 'object') {
    // Node/CommonJS
    factory(require('jquery'), require('zTree'), require('perfectScrollbar'))
  }
  else if (jQuery) {
    // Otherwise simply initialise as normal, stopping multiple evaluation
    factory(jQuery)
  }
})(window, document)

