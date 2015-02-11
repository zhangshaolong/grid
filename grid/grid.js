;var Grid = (function(doc, win){
    var contentFilterReg = /@([_a-zA-Z][_\w]*)/g;
    var nodeHookReg = /\s+hook\s*=\s*('([_a-zA-Z][_\w]*)'|"([_a-zA-Z][_\w]*)")/g;
    var isIE = win.navigator.userAgent.indexOf('MSIE') >= 0;
    var textContent = 'textContent' in doc ? 'textContent' : 'innerText';
    var defaultMapKeys = {
        pageNo : 'pageNo',
        pageSize : 'pageSize',
        query : 'query',
        body : 'body',
        order : 'order',
        orderBy : 'orderBy',
        totalCount : 'totalCount',
        totalPage : 'totalPage',
        headTemplate : 'headTemplate',
        bodyTemplate : 'bodyTemplate',
        sort : 'sort',
        sortType : 'sortType',
        merge : 'merge',
        styles : 'styles',
        edit : 'edit',
        text : 'text',
        childs : 'childs',
        headData : 'headData',
        bodyData : 'bodyData'
    };
    var hasClass = function (node, cls) {
        var className, find, constructor;
        if (!node) return !1;
        var className = ' ' + (node.className ? node.className.replace(/\s+/mg, ' ') : node) + ' ';
        var constructor = cls.constructor;
        if (constructor === String) {
            return className.indexOf(' ' + trim(cls) + ' ') > -1;
        }
        if (constructor === RegExp) {
            find = !1;
            each(className.split(' '), function (c) {
                if (cls.test(c)) {
                    return !(find = !0);
                }
            });
            return find;
        }
        return !1;
    };
    var addClass = function (node, cls) {
        var className = node.className;
        var used = [];
        cls = trim(cls);
        if (/\s/.test(cls)) {
            each(cls.split(/\s+/), function (cls) {
                if( !hasClass(className, cls)) {
                    used.push(cls);
                }
            });
        } else {
            if (!hasClass(className, cls)) {
                used.push(cls);
            }
        }
        node.className = trim(className + ' ' + used.join(' '));
    };
    var removeClass = function (node, cls) {
        if (!cls) {
            node.className = '';
        } else {
            var className = ' ' + node.className.replace(/\s+/mg, ' ') + ' ';
            var isString = cls.constructor === String;
            var classNames;
            if (isString) cls = trim(cls);
            if (/\s/.test(cls)) {
                each(cls.split(/\s+/), function (cls) {
                    if( hasClass(className, cls)) {
                        if (isString) {
                            className = className.replace(' ' + cls + ' ', ' ');
                        } else {
                            classNames = [];
                            each(className.split(/\s+/), function (c) {
                                if (!cls.test(c)) {
                                    classNames.push(c);
                                }
                            });
                            className = classNames.join(' ');
                        }
                    }
                });
            } else {
                if (hasClass(className, cls)) {
                    if (isString) {
                        className = className.replace(' ' + cls + ' ', ' ');
                    } else {
                        classNames = [];
                        each(className.split(/\s+/), function (c) {
                            if (!cls.test(c)) {
                                classNames.push(c);
                            }
                        });
                        className = classNames.join(' ');
                    }
                }
            }
            node.className = trim(className.split(/\s+/).join(' '));
        }
    };
    var setTableHTML = function(node, html) {
        var nodeName = node.nodeName,
            firstChild,
            temp,
            htmlParentNode;
        if (isIE && nodeName !== 'TD' && nodeName !== 'TH') {
            temp = node.ownerDocument.createElement('div');
            if(nodeName === 'TR'){
                temp.innerHTML = '<table><tbody><tr>' + html + '</tr></tbody></table>';
                htmlParentNode = temp.firstChild.firstChild.firstChild;
            }else if(nodeName === 'TBODY'){
                temp.innerHTML = '<table><tbody>' + html + '</tbody></table>';
                htmlParentNode = temp.firstChild.firstChild;
            }else if(nodeName === 'THEAD'){
                temp.innerHTML = '<table><thead>' + html + '</thead></table>';
                htmlParentNode = temp.firstChild.firstChild;
            }else if(nodeName === 'TABLE'){
                temp.innerHTML = '<table>' + html + '</table>';
                htmlParentNode = temp.firstChild;
            }
            temp = null;
            each(node.childNodes, function(child){
                node.removeChild(child);
                child = null;
            }, !0);
            while (firstChild = htmlParentNode.firstChild) {
                node.appendChild(firstChild);
            }
        } else {
            node.innerHTML = html;
        }
        return node;
    };
    var stringify = function (code) {
        return "'" + code.replace(/('|\\)/g, '\\$1').replace(/\r/g, '\\r').replace(/\n/g, '\\n') + "'";
    };
    var parse = function (template) {
        var out = 'var out="";';
        var segments = template.split('{');
        for (var i = 0, len = segments.length; i < len; i++) {
            var segment = segments[i];
            var jsAndHtml = segment.split('}');
            var js = jsAndHtml[0];
            var html = jsAndHtml[1];
            if (html === undefined) {
                html = js;
                js = '';
            }
            if (js) {
                out += 'out += model.' + js + ';';
            }
            if (html) {
                html = stringify(html);
                html = html.replace(contentFilterReg, function (all, key) {
                    return '\'; out += grid.' + key + '(model, index); out += \'';
                });
                out += 'out += ' + html + ';';
            }
        }
        return out;
    };
    
    var compile = function (template) {
        return new Function('model, grid, index', parse(template) + '; return out;');
    };
    var each = function (arr, fun, reverse) {
        var len,
            idx;
        if (!arr) return ;
        len = arr.length;
        if (len) {
            if (!reverse) {
                for (idx = 0; idx < len;) if (fun.call(arr[idx], arr[idx], idx++) === !1) {
                    break;
                }
            } else {
                for (idx = len; idx > 0;) if (fun.call(arr[--idx], arr[idx], idx) === !1) {
                    break;
                }
            }
        } else if (arr.constructor === Object) {
            for (idx in arr) if (fun.call(arr[idx], arr[idx], idx) === !1) {
                break;
            }
        }
    };
    var getNode = function (ele) {
        return ele && (typeof ele == 'string' ? doc.getElementById(ele) : ele.nodeName ? ele : ele[0]);
    };
    var Grid = function (options) {
        this.holder = getNode(options.holder);
        this.dataSource = options.dataSource;
        this.mapKeys = options.mapKeys;
        this.params = options.params || {};
        this.renderer = compile(options.bodyTemplate);
        this.noDataMessage = options.noDataMessage || '没有数据';
        this.plugins = options.plugins;
    };
    Grid.prototype.renderRow = function (model, index) {
        var tds = this.renderer(model, this, index);
        var tr = document.createElement('tr');
        setTableHTML(tr, tds);
        this.hookHandler(tr, model, index);
        this.holder.tBodies[0].appendChild(tr);
        
    };
    Grid.prototype.hookHandler = function (tr, model, index) {
        var grid = this;
        each(tr.getElementsByTagName('*'), function (node) {
            var hook = node.getAttribute('hook');
            if (hook) {
                var hookHandler = grid['hook' + hook.replace(/^\w/, function (ch) {return ch.toUpperCase();})];
                hookHandler && hookHandler.call(grid, node, model, index);
            }
        });
    };
    Grid.prototype.render = function (dataSource) {
        var grid = this;
        each(dataSource, function (model, index) {
            grid.renderRow(model, index);
        });
    };
    Grid.prototype.sequence = function (model, index) {
        return index + 1;
    };
    return Grid;
})(document, window);